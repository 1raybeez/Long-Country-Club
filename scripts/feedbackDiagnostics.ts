import { existsSync, readFileSync } from 'node:fs';
import { resolveLccMember, validateMemberDirectory } from '../lib/auth/memberResolver';
import { canSubmitFeedback, validateFeedbackInput } from '../lib/feedback';
import type { AuthenticatedIdentity } from '../lib/auth/types';

function readDirectoryRaw() {
  if (process.env.LCC_MEMBER_DIRECTORY_JSON) return process.env.LCC_MEMBER_DIRECTORY_JSON;
  if (!existsSync('.env.local')) return undefined;
  const line = readFileSync('.env.local', 'utf8').split('\n').find((entry) => entry.startsWith('LCC_MEMBER_DIRECTORY_JSON='));
  const value = line?.slice('LCC_MEMBER_DIRECTORY_JSON='.length).trim();
  return value?.startsWith("'") && value.endsWith("'") ? value.slice(1, -1) : value;
}

const valid = {
  type: 'BUG',
  title: 'Example title',
  description: 'Example description',
  area: 'PREDICTOR',
  pagePath: '/predictor',
};
const failures: string[] = [];
const expectAccepted = (name: string, value: unknown) => {
  if (!validateFeedbackInput(value).ok) failures.push(`${name}_REJECTED`);
};
const expectRejected = (name: string, value: unknown) => {
  if (validateFeedbackInput(value).ok) failures.push(`${name}_ACCEPTED`);
};

expectAccepted('BUG', valid);
expectAccepted('SUGGESTION', { ...valid, type: 'SUGGESTION' });
expectRejected('INVALID_TYPE', { ...valid, type: 'QUESTION' });
expectRejected('INVALID_AREA', { ...valid, area: 'TRADE_ANALYZER' });
expectRejected('EMPTY_TITLE', { ...valid, title: '   ' });
expectRejected('EMPTY_DESCRIPTION', { ...valid, description: '' });
expectRejected('OVERSIZED_TITLE', { ...valid, title: 'x'.repeat(161) });
expectRejected('OVERSIZED_DESCRIPTION', { ...valid, description: 'x'.repeat(5001) });
expectRejected('SPOOFED_OWNER', { ...valid, submitterOwnerId: 'ray-long' });
expectRejected('SPOOFED_STATUS', { ...valid, status: 'RESOLVED' });
if (validateFeedbackInput({ ...valid, area: 'TRADE_ANALYZER' }).ok) failures.push('TRADE_ANALYZER_SUPPORTED');

const directoryValidation = validateMemberDirectory(readDirectoryRaw());
const directory = directoryValidation.directory;
const identity = (email: string, uid: string): AuthenticatedIdentity => ({ uid, email, name: null, picture: null });
const normalOwner = resolveLccMember(identity('robertjenkins567@yahoo.com', 'feedback-normal'), directory);
const commissioner = resolveLccMember(identity('raylong1977@gmail.com', 'feedback-commissioner'), directory);
const unknownDirectory = { ...directory, 'unknown@example.invalid': { ownerId: 'unknown-owner', capabilities: [] as const } };
const retiredDirectory = { ...directory, 'retired@example.invalid': { ownerId: 'dan-lowery', capabilities: [] as const } };
const unknownOwner = resolveLccMember(identity('unknown@example.invalid', 'feedback-unknown'), unknownDirectory);
const retiredOwner = resolveLccMember(identity('retired@example.invalid', 'feedback-retired'), retiredDirectory);

if (!normalOwner || !canSubmitFeedback(normalOwner)) failures.push('NORMAL_OWNER_REJECTED');
if (!commissioner || !canSubmitFeedback(commissioner) || !commissioner.capabilities.includes('commissioner')) failures.push('COMMISSIONER_REJECTED');
if (unknownOwner || canSubmitFeedback(unknownOwner)) failures.push('UNKNOWN_OWNER_ACCEPTED');
if (retiredOwner || canSubmitFeedback(retiredOwner)) failures.push('RETIRED_OWNER_ACCEPTED');
if (directoryValidation.errors.length || Object.keys(directory).length !== 12) failures.push('MEMBER_DIRECTORY_INVALID');

console.log('LCC Owner Feedback Slice B diagnostics');
console.log(`Input validation: BUG/SUGGESTION accepted | invalid type/area/empty/oversized/spoofed fields rejected`);
console.log(`Member authorization: normal owner=${normalOwner ? 'yes' : 'no'} | commissioner=${commissioner ? 'yes' : 'no'} | unknown=${unknownOwner ? 'accepted' : 'rejected'} | retired=${retiredOwner ? 'accepted' : 'rejected'}`);
console.log(`Privacy contract: client identity/status fields rejected | Trade Analyzer area rejected | no Firestore writes performed`);
console.log(`Status: ${failures.length ? 'FAIL' : 'PASS'}`);
if (failures.length) {
  console.error(`Failures: ${[...new Set(failures)].join(', ')}`);
  process.exitCode = 1;
}
