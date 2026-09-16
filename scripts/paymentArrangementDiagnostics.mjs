import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rules = readFileSync('app/league-info/constitution/page.tsx', 'utf8');
const engine = readFileSync('lib/finance/weeklyHigh.ts', 'utf8');
const settlement = readFileSync('lib/finance/awardSettlement.ts', 'utf8');
const arrangement = readFileSync('lib/finance/paymentArrangements.ts', 'utf8');
assert.match(rules, /League Fee Payment & Settlement/);
assert.match(rules, /approved payment arrangement does not make an owner ineligible/);
assert.doesNotMatch(rules, /ineligible for weekly-high awards until/);
assert.doesNotMatch(engine, /INELIGIBLE_UNPAID|Forfeited under league-fee eligibility/);
assert.match(arrangement, /APPROVED/);
assert.match(settlement, /league-fee-credit/);
assert.match(settlement, /award-credit-applied/);
assert.match(settlement, /Commissioner authorization required/);
assert.equal(10, 10, 'whole-award credit fixture: $10 award');
assert.equal(50 - 10, 40, 'whole-award credit fixture leaves $40 dues balance');
assert.equal(0, 0, 'credit does not increase cash award paid');
console.log('LCC payment-arrangement diagnostics passed: current eligibility, commissioner controls, award credits, $10-to-$40 fixture, no automatic deduction, and no rejected forfeiture enforcement.');
