import { existsSync, readFileSync } from 'node:fs';
import { resolveLccMember, validateMemberDirectory } from '../lib/auth/memberResolver';
import { canReviewFeedback, FEEDBACK_QUEUE_STATUSES, validateFeedbackQueueUpdate } from '../lib/feedback';
import { parseFeedbackQueueRecord } from '../lib/feedbackQueue';
import type { AuthenticatedIdentity } from '../lib/auth/types';

function readDirectoryRaw() {
  if (process.env.LCC_MEMBER_DIRECTORY_JSON) return process.env.LCC_MEMBER_DIRECTORY_JSON;
  if (!existsSync('.env.local')) return undefined;
  const line = readFileSync('.env.local', 'utf8').split('\n').find((entry) => entry.startsWith('LCC_MEMBER_DIRECTORY_JSON='));
  const value = line?.slice('LCC_MEMBER_DIRECTORY_JSON='.length).trim();
  return value?.startsWith("'") && value.endsWith("'") ? value.slice(1, -1) : value;
}

const failures: string[] = [];
const valid = { status: 'PLANNED', commissionerNote: 'Queue follow-up.' };
const expectAccepted = (name: string, value: unknown) => { if (!validateFeedbackQueueUpdate(value).ok) failures.push(`${name}_REJECTED`); };
const expectRejected = (name: string, value: unknown) => { if (validateFeedbackQueueUpdate(value).ok) failures.push(`${name}_ACCEPTED`); };

expectAccepted('VALID_STATUS', valid);
FEEDBACK_QUEUE_STATUSES.forEach((status) => expectAccepted(`STATUS_${status}`, { status }));
expectRejected('INVALID_STATUS', { status: 'NOT_A_STATUS' });
expectRejected('NOTE_TOO_LONG', { status: 'DONE', commissionerNote: 'x'.repeat(2001) });
expectRejected('IMMUTABLE_FIELD', { status: 'DONE', title: 'changed' });
expectRejected('DELETE_FIELD', { status: 'DONE', delete: true });

const validation = validateMemberDirectory(readDirectoryRaw());
const directory = validation.directory;
const identity = (email: string, uid: string): AuthenticatedIdentity => ({ uid, email, name: null, picture: null });
const commissioner = resolveLccMember(identity('raylong1977@gmail.com', 'queue-commissioner'), directory);
const normal = resolveLccMember(identity('robertjenkins567@yahoo.com', 'queue-normal'), directory);
const unknown = resolveLccMember(identity('unknown@example.invalid', 'queue-unknown'), { ...directory, 'unknown@example.invalid': { ownerId: 'unknown-owner', capabilities: [] as const } });
const retired = resolveLccMember(identity('retired@example.invalid', 'queue-retired'), { ...directory, 'retired@example.invalid': { ownerId: 'dan-lowery', capabilities: [] as const } });
if (!commissioner || !canReviewFeedback(commissioner)) failures.push('COMMISSIONER_READ_REJECTED');
if (normal && canReviewFeedback(normal)) failures.push('NORMAL_OWNER_ALLOWED');
if (unknown || canReviewFeedback(unknown)) failures.push('UNKNOWN_ALLOWED');
if (retired || canReviewFeedback(retired)) failures.push('RETIRED_ALLOWED');

const sample = parseFeedbackQueueRecord('sample-id', { id: 'sample-id', type: 'BUG', title: 'Title', description: 'Description', area: 'HOME', pagePath: '/', submitterOwnerId: 'ray-long', submitterDisplayName: 'Ray Long', submitterTeamName: 'Bower Rangers', status: 'OPEN', createdAt: new Date('2026-08-24T00:00:00.000Z'), commissionerNote: 'Private' });
const malformed = parseFeedbackQueueRecord('malformed-id', { type: 'BUG', title: 'Missing required identity' });
if (!sample || sample.submitterOwnerId !== 'ray-long') failures.push('VALID_RECORD_PARSE');
if (malformed) failures.push('MALFORMED_RECORD_ACCEPTED');
if (sample && ('email' in sample || 'uid' in sample || 'firebaseUid' in sample)) failures.push('PRIVATE_AUTH_FIELD_EXPOSED');

console.log('LCC Commissioner Feedback Queue Slice C diagnostics');
console.log(`Authorization: commissioner=${commissioner ? 'allowed' : 'rejected'} | normal=${normal && canReviewFeedback(normal) ? 'allowed' : 'rejected'} | unknown=${unknown ? 'allowed' : 'rejected'} | retired=${retired ? 'allowed' : 'rejected'}`);
console.log(`Update policy: statuses valid | invalid status/note/immutable/delete fields rejected`);
console.log(`Record policy: valid record parsed | malformed record rejected | email/Firebase UID absent`);
console.log(`Status: ${failures.length ? 'FAIL' : 'PASS'}`);
if (failures.length) {
  console.error(`Failures: ${[...new Set(failures)].join(', ')}`);
  process.exitCode = 1;
}
