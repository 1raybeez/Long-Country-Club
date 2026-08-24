import { getOwnerById } from '../ownerRegistry';
import { LCC_CAPABILITIES } from './types';
import type {
  AuthenticatedIdentity,
  LccCapability,
  LccMemberIdentity,
  LccMemberSession,
} from './types';

export interface ConfiguredMember {
  readonly memberId?: string;
  readonly ownerId: string;
  readonly capabilities?: readonly LccCapability[];
}

export type LccMemberDirectory = Readonly<Record<string, ConfiguredMember>>;

export interface MemberDirectoryValidation {
  readonly directory: LccMemberDirectory;
  readonly errors: readonly string[];
  readonly normalizedEmailCount: number;
  readonly uniqueOwnerMappingCount: number;
  readonly retiredOwnerCount: number;
  readonly unknownOwnerCount: number;
}

function normalizedEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateMemberDirectory(raw: string | undefined): MemberDirectoryValidation {
  if (!raw) {
    return {
      directory: {},
      errors: ['DIRECTORY_MISSING'],
      normalizedEmailCount: 0,
      uniqueOwnerMappingCount: 0,
      retiredOwnerCount: 0,
      unknownOwnerCount: 0,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      directory: {},
      errors: ['DIRECTORY_JSON_INVALID'],
      normalizedEmailCount: 0,
      uniqueOwnerMappingCount: 0,
      retiredOwnerCount: 0,
      unknownOwnerCount: 0,
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      directory: {},
      errors: ['DIRECTORY_SHAPE_INVALID'],
      normalizedEmailCount: 0,
      uniqueOwnerMappingCount: 0,
      retiredOwnerCount: 0,
      unknownOwnerCount: 0,
    };
  }

  const errors: string[] = [];
  const directory: Record<string, ConfiguredMember> = {};
  const ownerIds = new Set<string>();
  const memberIds = new Set<string>();
  let retiredOwnerCount = 0;
  let unknownOwnerCount = 0;

  for (const [email, rawConfig] of Object.entries(parsed)) {
    const key = normalizedEmail(email);
    if (!key) {
      errors.push('EMPTY_EMAIL');
      continue;
    }
    if (directory[key]) {
      errors.push(`DUPLICATE_EMAIL:${key}`);
      continue;
    }
    if (!rawConfig || typeof rawConfig !== 'object' || Array.isArray(rawConfig)) {
      errors.push(`CONFIG_SHAPE:${key}`);
      continue;
    }

    const config = rawConfig as Record<string, unknown>;
    const ownerId = typeof config.ownerId === 'string' ? config.ownerId.trim() : '';
    const memberId = config.memberId === undefined
      ? undefined
      : typeof config.memberId === 'string' && config.memberId.trim()
        ? config.memberId.trim()
        : '';
    const capabilities = config.capabilities === undefined ? [] : config.capabilities;

    if (!ownerId) errors.push(`OWNER_ID_MISSING:${key}`);
    if (memberId === '') errors.push(`MEMBER_ID_INVALID:${key}`);
    if (!Array.isArray(capabilities) || capabilities.some((capability) =>
      typeof capability !== 'string' || !(LCC_CAPABILITIES as readonly string[]).includes(capability)
    )) {
      errors.push(`CAPABILITIES_INVALID:${key}`);
    }

    const owner = ownerId ? getOwnerById(ownerId) : null;
    if (!owner) {
      unknownOwnerCount += 1;
      errors.push(`OWNER_UNKNOWN:${ownerId || key}`);
    } else if (owner.status !== 'active') {
      retiredOwnerCount += 1;
      errors.push(`OWNER_NOT_ACTIVE:${ownerId}`);
    }
    if (ownerIds.has(ownerId)) errors.push(`DUPLICATE_OWNER:${ownerId}`);
    if (memberId && memberIds.has(memberId)) errors.push(`DUPLICATE_MEMBER:${memberId}`);

    ownerIds.add(ownerId);
    if (memberId) memberIds.add(memberId);
    directory[key] = {
      ownerId,
      ...(memberId ? { memberId } : {}),
      capabilities: Array.isArray(capabilities) ? capabilities as readonly LccCapability[] : [],
    };
  }

  return {
    directory: errors.length ? {} : directory,
    errors,
    normalizedEmailCount: Object.keys(directory).length,
    uniqueOwnerMappingCount: ownerIds.size,
    retiredOwnerCount,
    unknownOwnerCount,
  };
}

function getConfiguredMembers(): LccMemberDirectory {
  return validateMemberDirectory(process.env.LCC_MEMBER_DIRECTORY_JSON).directory;
}

export function resolveLccMember(
  identity: AuthenticatedIdentity,
  directory: LccMemberDirectory = getConfiguredMembers()
): LccMemberIdentity | null {
  if (!identity.email) return null;

  const config = directory[normalizedEmail(identity.email)];
  if (!config) return null;

  const owner = getOwnerById(config.ownerId);
  if (!owner || owner.status !== 'active') return null;

  return {
    memberId: config.memberId ?? owner.ownerId,
    displayName: owner.displayName,
    teamName: owner.teamName,
    ownerId: owner.ownerId,
    capabilities: config.capabilities ?? [],
  };
}

export function getMemberCapabilities(member: LccMemberIdentity | null): readonly LccCapability[] {
  return member?.capabilities ?? [];
}

export function hasCapability(
  member: LccMemberIdentity | null,
  capability: LccCapability
) {
  return getMemberCapabilities(member).includes(capability);
}

export function resolveMemberSession(identity: AuthenticatedIdentity): LccMemberSession {
  return { identity, member: resolveLccMember(identity) };
}
