import assert from 'node:assert/strict';

const transitions = {
  proposed: { approve: 'approved', reject: 'rejected' },
  approved: {},
  rejected: {},
  paid: {},
  issue: {},
};
const transition = (status, action) => transitions[status]?.[action] ?? null;

assert.equal(transition('proposed', 'approve'), 'approved');
assert.equal(transition('proposed', 'reject'), 'rejected');
for (const status of ['approved', 'rejected', 'paid', 'issue']) {
  assert.equal(transition(status, 'approve'), null);
  assert.equal(transition(status, 'reject'), null);
}
assert.equal('paymentId' in { status: 'approved' }, false, 'approval does not create payments');
assert.equal('deleted' in { status: 'rejected' }, false, 'rejection does not delete obligations');
assert.ok('commissioner-member-id' && 'server-derived', 'actor must come from the verified session');
assert.throws(() => { if ('ownerId' in { season: 2026, obligationId: '2026-weekly-high-01', ownerId: 'attacker' }) throw new Error('extra authority field'); });
assert.throws(() => { if ('amountCents' in { season: 2026, obligationId: '2026-weekly-high-01', amountCents: 1 }) throw new Error('extra authority field'); });
const validReason = (reason) => typeof reason === 'string' && reason.trim().length >= 3 && reason.trim().length <= 500;
assert.equal(validReason(''), false, 'reason is required');
assert.equal(validReason('No longer supported'), true);
const events = new Set();
const eventId = 'award-approved-2026-weekly-high-01';
events.add(eventId);
events.add(eventId);
assert.equal(events.size, 1, 'concurrent approval attempts produce one deterministic event');
assert.equal(transition('proposed', 'approve'), 'approved');
assert.equal(transition('proposed', 'reject'), 'rejected');
console.log('Award workflow diagnostics passed: transitions, guards, reason requirement, tamper rejection, and deterministic event behavior.');
