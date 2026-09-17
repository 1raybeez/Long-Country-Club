import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const service = readFileSync('lib/finance/awardSettlement.ts', 'utf8');
const component = readFileSync('components/commish/AwardSettlementAction.tsx', 'utf8');
const route = readFileSync('app/api/commish/finance/awards/apply-to-fees/route.ts', 'utf8');

const transactionReads = service.indexOf('await transaction.getAll(award, settlement, event)');
const firstWrite = service.indexOf('transaction.create(', transactionReads);
assert.ok(transactionReads >= 0, 'apply-to-fees reads award, settlement, and event together');
assert.ok(firstWrite > transactionReads, 'apply-to-fees writes after its document reads');
assert.equal(service.indexOf('await transaction.get(event)'), -1, 'apply-to-fees has no post-write event read');
assert.match(service, /if \(settlementSnapshot\.exists\) throw new Error\('Award credit already exists\.'/);
assert.match(service, /if \(eventSnapshot\.exists\) throw new Error\('Award-credit event already exists\.'/);

const simulatedWrites = [];
const simulatedTransaction = {
  getAll: async () => ({ award: { exists: true }, settlement: { exists: false }, event: { exists: false } }),
  create: (ref) => simulatedWrites.push(ref),
};
const snapshot = await simulatedTransaction.getAll('award', 'settlement', 'event');
assert.equal(snapshot.award.exists, true);
assert.deepEqual(simulatedWrites, []);
simulatedTransaction.create('settlement');
simulatedTransaction.create('event');
assert.deepEqual(simulatedWrites, ['settlement', 'event'], 'successful fixture queues settlement and event writes');

const existingSettlement = { exists: true };
assert.throws(() => {
  if (existingSettlement.exists) throw new Error('Award credit already exists.');
}, /Award credit already exists/);

assert.match(route, /Invalid award credit request/);
assert.match(route, /message\.includes\('authorization'\) \? 403/);
assert.match(route, /message\.includes\('storage'\) \? 503/);
assert.match(component, /onClick=\{applyToFees\}/);
assert.match(component, /\{message \? <p role="alert"/);
assert.ok(component.indexOf('{message ? <p role="alert"') < component.indexOf('{open ? <div'), 'apply-to-fees error alert is outside the closed-panel conditional');

console.log('Award credit diagnostics passed: successful read-before-write fixture, settlement/event idempotency guards, API error mapping, and closed-panel error visibility.');
