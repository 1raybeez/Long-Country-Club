import { readFileSync, existsSync } from 'node:fs';
import { resolveLccMember, validateMemberDirectory } from '../lib/auth/memberResolver';
import { getOwnerById } from '../lib/ownerRegistry';
import { LCC_SESSION_COOKIE } from '../lib/auth/cookie';
import type { AuthenticatedIdentity } from '../lib/auth/types';

function readDirectoryRaw() {
  if (process.env.LCC_MEMBER_DIRECTORY_JSON) return process.env.LCC_MEMBER_DIRECTORY_JSON;
  if (!existsSync('.env.local')) return undefined;
  const line = readFileSync('.env.local', 'utf8').split('\n').find((entry) => entry.startsWith('LCC_MEMBER_DIRECTORY_JSON='));
  if (!line) return undefined;
  const value = line.slice('LCC_MEMBER_DIRECTORY_JSON='.length).trim();
  return value.startsWith("'") && value.endsWith("'") ? value.slice(1, -1) : value;
}

const raw = readDirectoryRaw();
const validation = validateMemberDirectory(raw);
const failures: string[] = [];
const directory = validation.directory;
const entries = Object.values(directory);

if (LCC_SESSION_COOKIE !== '__session') failures.push('HOSTING_SESSION_COOKIE_NAME');
if (validation.errors.length) failures.push(...validation.errors);
if (entries.length !== 12) failures.push('ACTIVE_AUTHORIZED_COUNT');
if (validation.normalizedEmailCount !== 12) failures.push('NORMALIZED_EMAIL_COUNT');
if (validation.uniqueOwnerMappingCount !== 12) failures.push('UNIQUE_OWNER_COUNT');
if (validation.retiredOwnerCount !== 0) failures.push('RETIRED_OWNER_MAPPING');
if (validation.unknownOwnerCount !== 0) failures.push('UNKNOWN_OWNER_MAPPING');
if (entries.some((entry) => entry.capabilities?.some((capability) => !['commissioner', 'war-room', 'finance-admin', 'governance-admin', 'maintenance-admin', 'post-draft-admin'].includes(capability)))) failures.push('UNRECOGNIZED_CAPABILITY');

const rayIdentity: AuthenticatedIdentity = { uid: 'diagnostic-ray', email: 'raylong1977@gmail.com', name: null, picture: null };
const normalIdentity: AuthenticatedIdentity = { uid: 'diagnostic-normal', email: 'robertjenkins567@yahoo.com', name: null, picture: null };
const ray = resolveLccMember(rayIdentity, directory);
const normal = resolveLccMember(normalIdentity, directory);
if (!ray || ray.ownerId !== 'ray-long') failures.push('RAY_ACTIVE_MEMBER');
if (!ray?.capabilities.includes('commissioner')) failures.push('RAY_COMMISSIONER');
if (!normal || normal.ownerId !== 'rob-jenkins') failures.push('NORMAL_OWNER');
if (normal?.capabilities.includes('commissioner')) failures.push('NORMAL_COMMISSIONER');

const unknownDirectory = { ...directory, 'unknown@example.invalid': { ownerId: 'not-a-real-owner', capabilities: [] as const } };
if (resolveLccMember({ uid: 'diagnostic-unknown', email: 'unknown@example.invalid', name: null, picture: null }, unknownDirectory)) failures.push('UNKNOWN_MEMBER_ACCEPTED');

const retiredDirectory = { ...directory, 'retired@example.invalid': { ownerId: 'dan-lowery', capabilities: [] as const } };
if (resolveLccMember({ uid: 'diagnostic-retired', email: 'retired@example.invalid', name: null, picture: null }, retiredDirectory)) failures.push('RETIRED_MEMBER_ACCEPTED');
if (getOwnerById('dan-lowery')?.status !== 'retired') failures.push('RETIRED_FIXTURE');

console.log('LCC Auth/Member Foundation Slice A diagnostics');
console.log(`Hosting session cookie: ${LCC_SESSION_COOKIE === '__session' ? 'PASS (__session)' : 'FAIL'}`);
console.log(`Directory parse: ${validation.errors.length ? 'FAIL' : 'PASS'} | active mappings=${entries.length} | normalized emails=${validation.normalizedEmailCount} | unique owners=${validation.uniqueOwnerMappingCount}`);
console.log(`Retired mappings: ${validation.retiredOwnerCount} | unknown owners: ${validation.unknownOwnerCount} | capabilities: ${failures.includes('UNRECOGNIZED_CAPABILITY') ? 'FAIL' : 'recognized'}`);
console.log(`Ray: ${ray ? 'active member' : 'rejected'} | commissioner=${ray?.capabilities.includes('commissioner') ? 'yes' : 'no'}`);
console.log(`Normal owner: ${normal ? 'active member' : 'rejected'} | commissioner=${normal?.capabilities.includes('commissioner') ? 'yes' : 'no'}`);
console.log(`Unknown mapping rejection: ${failures.includes('UNKNOWN_MEMBER_ACCEPTED') ? 'FAIL' : 'PASS'} | retired mapping rejection: ${failures.includes('RETIRED_MEMBER_ACCEPTED') ? 'FAIL' : 'PASS'}`);
console.log(`Status: ${failures.length ? 'FAIL' : 'PASS'}`);

if (failures.length) {
  console.error(`Failures: ${[...new Set(failures)].join(', ')}`);
  process.exitCode = 1;
}
