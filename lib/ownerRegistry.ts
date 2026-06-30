import { ALL_LCC_OWNERS, type LccOwner } from "./lccOwners";

export type OwnerRegistryStatus = LccOwner["status"];

export interface OwnerRegistryEntry {
  readonly ownerId: string;
  readonly displayName: string;
  readonly shortName: string;
  readonly status: OwnerRegistryStatus;
  readonly aliases: readonly string[];
}

const EXTRA_OWNER_ALIASES: Record<string, readonly string[]> = {
  "jeffrey-hudgins": ["Jeff"],
  "keith-winder": ["Keith W"],
  "keith-douglas": ["Keith D"],
  "david-beasley": ["Dave B"],
  "david-gross": ["Dave G"],
};

const OWNER_ID_COMPATIBILITY_ALIASES: Record<string, string> = {
  "junior-duke": "junior",
  "jay-g": "jay",
};

export const LCC_OWNER_REGISTRY: readonly OwnerRegistryEntry[] =
  ALL_LCC_OWNERS.map(createOwnerRegistryEntry);

const OWNER_REGISTRY_BY_ID = new Map(
  LCC_OWNER_REGISTRY.map((entry) => [entry.ownerId, entry])
);

const OWNER_ALIAS_INDEX = buildOwnerAliasIndex(LCC_OWNER_REGISTRY);

export function normalizeOwnerAlias(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function resolveOwnerId(value: string): string | null {
  const normalizedAlias = normalizeOwnerAlias(value);

  if (!normalizedAlias || OWNER_ALIAS_INDEX.duplicates.has(normalizedAlias)) {
    return null;
  }

  return OWNER_ALIAS_INDEX.aliasToOwnerId.get(normalizedAlias) ?? null;
}

export function resolveOwner(value: string): OwnerRegistryEntry | null {
  const ownerId = resolveOwnerId(value);

  return ownerId ? OWNER_REGISTRY_BY_ID.get(ownerId) ?? null : null;
}

export function getOwnerAliases(ownerId: string): string[] {
  const entry = OWNER_REGISTRY_BY_ID.get(normalizeOwnerId(ownerId));

  return entry ? [...entry.aliases] : [];
}

export function getUnresolvedOwnerAliases(values: string[]): string[] {
  const unresolvedAliases: string[] = [];
  const seenAliases = new Set<string>();

  values.forEach((value) => {
    const normalizedAlias = normalizeOwnerAlias(value);

    if (seenAliases.has(normalizedAlias)) {
      return;
    }

    seenAliases.add(normalizedAlias);

    if (!resolveOwnerId(value)) {
      unresolvedAliases.push(value);
    }
  });

  return unresolvedAliases;
}

function createOwnerRegistryEntry(owner: LccOwner): OwnerRegistryEntry {
  return {
    ownerId: owner.id,
    displayName: owner.displayName,
    shortName: owner.nickname,
    status: owner.status,
    aliases: uniqueAliases([
      owner.nickname,
      owner.displayName,
      ...owner.aliases,
      ...(EXTRA_OWNER_ALIASES[owner.id] ?? []),
    ]),
  };
}

function buildOwnerAliasIndex(entries: readonly OwnerRegistryEntry[]) {
  const aliasToOwnerId = new Map<string, string>();
  const duplicates = new Set<string>();

  entries.forEach((entry) => {
    entry.aliases.forEach((alias) => {
      const normalizedAlias = normalizeOwnerAlias(alias);
      const existingOwnerId = aliasToOwnerId.get(normalizedAlias);

      if (existingOwnerId && existingOwnerId !== entry.ownerId) {
        duplicates.add(normalizedAlias);
        return;
      }

      aliasToOwnerId.set(normalizedAlias, entry.ownerId);
    });
  });

  return {
    aliasToOwnerId,
    duplicates,
  };
}

function uniqueAliases(values: readonly string[]): readonly string[] {
  const aliases: string[] = [];
  const seenAliases = new Set<string>();

  values.forEach((value) => {
    const alias = value.trim();
    const normalizedAlias = normalizeOwnerAlias(alias);

    if (!normalizedAlias || seenAliases.has(normalizedAlias)) {
      return;
    }

    seenAliases.add(normalizedAlias);
    aliases.push(alias);
  });

  return aliases;
}

function normalizeOwnerId(ownerId: string): string {
  return OWNER_ID_COMPATIBILITY_ALIASES[ownerId] ?? ownerId;
}
export function getOwnerById(
  ownerId: string
): OwnerRegistryEntry | null {
  return OWNER_REGISTRY_BY_ID.get(normalizeOwnerId(ownerId)) ?? null;
}