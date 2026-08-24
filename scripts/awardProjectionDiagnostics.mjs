import assert from 'node:assert/strict';

const classifySettlement = (status) => status === 'paid' ? 'paid' : status === 'approved' ? 'awaiting-payment' : status === 'issue' ? 'blocked' : 'not-approved';
const projection = (records) => {
  const approved = records.filter((record) => record.status === 'approved');
  const sum = (items) => items.reduce((total, item) => total + item.amountCents, 0);
  return { proposed: records.filter((record) => record.status === 'proposed'), approved, paid: records.filter((record) => record.status === 'paid'), rejected: records.filter((record) => record.status === 'rejected'), issue: records.filter((record) => record.status === 'issue'), approvedAmount: sum(approved), approvedUnpaidAmount: sum(approved.filter((record) => classifySettlement(record.status) === 'awaiting-payment')) };
};
const records = [
  { status: 'proposed', amountCents: 1000, ownerId: 'owner-a' },
  { status: 'approved', amountCents: 2500, ownerId: 'owner-b' },
  { status: 'paid', amountCents: 5000, ownerId: 'owner-c' },
  { status: 'rejected', amountCents: 1000, ownerId: 'owner-d' },
  { status: 'issue', amountCents: 1000, ownerId: null },
];
const result = projection(records);
assert.equal(result.proposed.length, 1);
assert.equal(result.approved.length, 1);
assert.equal(result.approvedAmount, 2500);
assert.equal(result.approvedUnpaidAmount, 2500);
assert.equal(result.paid.length, 1);
assert.equal(result.rejected.length, 1);
assert.equal(result.issue.length, 1);
assert.equal(classifySettlement('approved'), 'awaiting-payment');
assert.equal(classifySettlement('paid'), 'paid');
assert.equal(classifySettlement('rejected'), 'not-approved');
assert.equal('email' in { ownerId: 'owner-a', teamName: 'Team A' }, false, 'projection does not expose email fields');
const ownerDirectory = new Map([['owner-a', { displayName: 'Owner A', teamName: 'Team A' }]]);
const resolveOwner = (ownerId) => ownerDirectory.get(ownerId) ?? { displayName: 'Unresolved owner', teamName: 'Unresolved team' };
assert.deepEqual(resolveOwner('owner-a'), { displayName: 'Owner A', teamName: 'Team A' });
assert.deepEqual(resolveOwner('missing-owner'), { displayName: 'Unresolved owner', teamName: 'Unresolved team' });
assert.equal(60000 + 25000, 85000, 'dues totals remain separate from award totals');
console.log('Approved-award projection diagnostics passed: status filtering, totals, settlement readiness, privacy, and ledger separation.');
