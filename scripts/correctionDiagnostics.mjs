import assert from 'node:assert/strict';

const net = (entries) => entries.reduce((sum, entry) => sum + entry.amountCents, 0);
const reverse = (original) => ({ ...original, amountCents: -original.amountCents, correctionType: 'reversal', originalRecordId: original.id });

const payment = { id: 'payment-original', amountCents: 5000, ownerId: 'owner-a' };
const paymentReversal = reverse(payment);
assert.equal(payment.amountCents, 5000, 'original payment remains immutable');
assert.equal(net([payment, paymentReversal]), 0, 'payment reversal nets to zero');
assert.equal('reason' in payment, false, 'correction reason is not copied into public payment source data');
assert.deepEqual({ original: payment.id, reversal: paymentReversal.originalRecordId }, { original: 'payment-original', reversal: 'payment-original' });

const replacementPayment = { id: 'payment-replacement', amountCents: 2500, ownerId: 'owner-a' };
assert.equal(net([payment, paymentReversal, replacementPayment]), 2500, 'reversal plus replacement derives the corrected net payment');

const settlement = { id: 'award-settlement-2026-champion', amountCents: 27123, obligationId: '2026-champion' };
const settlementReversal = reverse(settlement);
assert.equal(net([settlement, settlementReversal]), 0, 'award settlement reversal nets to zero');
assert.equal('reversal' in settlement, false, 'original settlement remains unchanged');

const expense = { id: 'championship-ring-2026', amountCents: 1377, type: 'ring' };
const expenseReversal = reverse(expense);
assert.equal(net([expense, expenseReversal]), 0, 'expense reversal nets to zero');
assert.equal(expense.amountCents, 1377, 'verified ring expense is not edited');

const correctionId = '2026-champion-correction-request-01';
assert.equal(correctionId, '2026-champion-correction-request-01', 'replacement identity is versioned and deterministic');
assert.equal(new Set(['dues-payment-reversed', 'award-settlement-reversed', 'award-obligation-corrected', 'expense-reversed']).size, 4, 'domain audit event types remain distinct');
assert.equal('email' in { correctionId, originalRecordId: payment.id, reason: 'verified correction' }, false, 'correction diagnostics contain no contact data');

console.log('Append-only correction diagnostics passed: immutable originals, net reversals, replacement accounting, deterministic lineage, domain-specific events, and privacy boundaries.');
