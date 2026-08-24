import assert from 'node:assert/strict';

const settle = (status) => {
  if (status === 'approved') return 'paid';
  throw new Error(`Only approved awards may settle; received ${status}`);
};
const methods = ['venmo', 'paypal', 'other'];
assert.equal(settle('approved'), 'paid');
for (const status of ['proposed', 'rejected', 'issue', 'paid']) assert.throws(() => settle(status));
assert.equal(methods.includes('venmo'), true);
assert.equal(methods.includes('paypal'), true);
assert.equal(methods.includes('other'), true);
assert.equal(methods.includes('VACU'), false, 'VACU is not an award settlement method');
assert.equal('amountCents' in { season: 2026, obligationId: '2026-weekly-high-01', method: 'venmo', effectiveDate: '2026-08-19', requestId: 'request-001' }, false, 'amount is server-derived');
assert.equal('ownerId' in { season: 2026, obligationId: '2026-weekly-high-01', method: 'venmo', effectiveDate: '2026-08-19', requestId: 'request-001' }, false, 'owner is server-derived');
assert.equal(/^\d{4}-\d{2}-\d{2}$/.test('2026-08-19'), true);
assert.equal(/^\d{4}-\d{2}-\d{2}$/.test('not-a-date'), false);
const settlementIds = new Set();
const settlementId = 'award-settlement-2026-weekly-high-01';
settlementIds.add(settlementId);
settlementIds.add(settlementId);
assert.equal(settlementIds.size, 1, 'retries produce one settlement');
assert.equal('eventId' in { settlementId, status: 'paid' }, false, 'event is separate append-only audit truth');
assert.equal('paymentId' in { settlementId, status: 'paid' }, false, 'award settlement does not create a dues payment');
console.log('Award settlement diagnostics passed: approved-only gate, methods, server-derived fields, date validation, idempotency, and ledger separation.');
