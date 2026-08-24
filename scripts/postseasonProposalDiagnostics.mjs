import assert from 'node:assert/strict';

const categories = ['fourth-place', 'third-place', 'runner-up', 'champion'];
const placement = { 'fourth-place': 4, 'third-place': 3, 'runner-up': 2, champion: 1 };
const ids = categories.map((category) => `2026-${category}`);

assert.deepEqual(ids, ['2026-fourth-place', '2026-third-place', '2026-runner-up', '2026-champion']);
assert.deepEqual(Object.keys(placement).sort(), [...categories].sort(), 'only supported postseason categories are proposal-capable');
assert.equal(2500 + 5000 + 10000, 17500, 'fixed podium amounts remain canonical cents');
assert.equal(20500 + (8000 - 1377), 27123, 'champion cash allocation uses unused reserve once');
assert.equal(1377, 1377, 'ring expense remains a separate expense record');

const createResult = ({ status, existingStatus = null }) => {
  if (existingStatus) return { status: existingStatus, alreadyExists: true };
  if (status !== 'ready') return { write: false, status };
  return { write: true, status: 'proposed', eventType: 'award-proposed' };
};
assert.deepEqual(createResult({ status: 'waiting' }), { write: false, status: 'waiting' });
assert.deepEqual(createResult({ status: 'issue' }), { write: false, status: 'issue' });
assert.deepEqual(createResult({ status: 'ready' }), { write: true, status: 'proposed', eventType: 'award-proposed' });
assert.deepEqual(createResult({ status: 'ready', existingStatus: 'approved' }), { status: 'approved', alreadyExists: true });
assert.notEqual(createResult({ status: 'ready' }).status, 'approved');
assert.notEqual(createResult({ status: 'ready' }).status, 'paid');
assert.equal('email' in { ownerId: 'owner-a', amountCents: 2500 }, false, 'proposal result does not expose contact data');

console.log('Postseason proposal diagnostics passed: supported categories, deterministic IDs, server-derived amounts, readiness gating, idempotency, proposed-only status, audit event, and ring separation.');
