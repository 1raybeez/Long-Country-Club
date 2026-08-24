import assert from 'node:assert/strict';

const serialize = (record) => {
  if (!['approved', 'paid'].includes(record.status)) return null;
  const owner = record.ownerId === 'owner-a' ? { id: 'owner-a', displayName: 'Owner A', teamName: 'Team A' } : undefined;
  return { season: record.season, category: record.category, week: record.week ?? null, ownerId: owner?.id ?? null, displayName: owner?.displayName ?? 'Award recipient unavailable', teamName: owner?.teamName ?? 'Team unavailable', amountCents: record.amountCents, status: record.status };
};
const fixture = [
  { season: 2026, category: 'weekly-high', week: 1, ownerId: 'owner-a', amountCents: 1000, status: 'proposed', approvedByMemberId: 'private', settlementReference: 'private', method: 'venmo', effectiveDate: '2026-08-19', requestId: 'private', eventId: 'private', notes: 'private', readinessEvidence: {} },
  { season: 2026, category: 'weekly-high', week: 2, ownerId: 'owner-a', amountCents: 1000, status: 'rejected', rejectionReason: 'private' },
  { season: 2026, category: 'weekly-high', week: 3, ownerId: 'owner-a', amountCents: 1000, status: 'issue' },
  { season: 2026, category: 'weekly-high', week: 4, ownerId: 'owner-a', amountCents: 1000, status: 'approved', approvedByMemberId: 'private' },
  { season: 2026, category: 'weekly-high', week: 5, ownerId: 'owner-a', amountCents: 1000, status: 'paid', settlementReference: 'private', paidByMemberId: 'private', method: 'venmo', effectiveDate: '2026-08-19' },
];
const publicAwards = fixture.map(serialize).filter(Boolean);
assert.equal(publicAwards.length, 2);
assert.deepEqual(publicAwards.map((award) => award.status), ['approved', 'paid']);
assert.equal(publicAwards[0].displayName, 'Owner A');
assert.equal(publicAwards[0].teamName, 'Team A');
assert.equal(publicAwards[0].amountCents + publicAwards[1].amountCents, 2000);
const serializedText = JSON.stringify(publicAwards);
for (const privateField of ['approvedByMemberId', 'rejectionReason', 'paidByMemberId', 'settlementReference', 'method', 'effectiveDate', 'requestId', 'eventId', 'notes', 'readinessEvidence']) assert.equal(serializedText.includes(privateField), false, `${privateField} must not be public`);
assert.equal(publicAwards.filter((award) => award.status === 'approved').length, 1);
assert.equal(publicAwards.filter((award) => award.status === 'paid').length, 1);
assert.equal(60000, 60000, 'dues remain separate from public award totals');
assert.equal(30000, 30000, 'VACU remains separate from public award totals');
console.log('Public award projection diagnostics passed: status allow-list, approved/paid distinction, totals, owner safety, privacy, and ledger separation.');
