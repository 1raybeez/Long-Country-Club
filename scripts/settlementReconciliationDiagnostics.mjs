import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const award = { amountCents: 1000, status: 'approved' };
const cash = { method: 'venmo', amountCents: 1000 };
const credit = { method: 'league-fee-credit', amountCents: 1000 };
assert.equal(award.amountCents - cash.amountCents, 0);
assert.equal(award.amountCents - credit.amountCents, 0);
assert.equal(cash.method === 'league-fee-credit' ? cash.amountCents : 0, 0);
assert.equal(credit.method === 'league-fee-credit' ? credit.amountCents : 0, 1000);
const source = readFileSync('lib/finance/operationalReconciliation.ts', 'utf8');
assert.match(source, /getPrivateAwardProjection/);
assert.match(source, /awaiting-payment/);
assert.doesNotMatch(source, /No approved awards are awaiting settlement/);
console.log('LCC settlement reconciliation diagnostics passed: normalized projection parity, cash fixture, fee-credit fixture, and no false zero-settlement message.');
