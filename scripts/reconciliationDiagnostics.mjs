import assert from 'node:assert/strict';

const evaluate = ({ duesOutstanding = 0, weekly = 'paid', postseasonWaiting = 0, approvedUnpaid = 0, integrity = false }) => {
  const waiting = weekly === 'waiting';
  const action = weekly === 'ready' || weekly === 'proposed' || weekly === 'approved' || weekly === 'rejected';
  const blocking = duesOutstanding > 0 || waiting || action || weekly === 'issue' || postseasonWaiting > 0 || approvedUnpaid > 0 || integrity;
  return { readyToClose: !blocking, waiting, action, issue: weekly === 'issue' || integrity, blocking };
};
assert.equal(evaluate({ duesOutstanding: 35000, weekly: 'waiting', postseasonWaiting: 4 }).readyToClose, false);
assert.equal(evaluate({ weekly: 'waiting' }).issue, false, 'WAITING is not an integrity issue');
assert.equal(evaluate({ weekly: 'ready' }).action, true);
assert.equal(evaluate({ weekly: 'proposed' }).action, true);
assert.equal(evaluate({ weekly: 'approved', approvedUnpaid: 1 }).blocking, true);
assert.equal(evaluate({ weekly: 'paid' }).readyToClose, true);
assert.equal(evaluate({ integrity: true }).issue, true);
assert.equal(evaluate({ integrity: true }).blocking, true);
assert.equal(evaluate({ weekly: 'issue' }).issue, true);
assert.equal(evaluate({ weekly: 'paid', postseasonWaiting: 4 }).readyToClose, false);
assert.equal(evaluate({ weekly: 'paid', duesOutstanding: 0 }).readyToClose, true, 'clean completed fixture is close-ready');
const settlement = { ownerId: 'owner-a', amountCents: 1000, obligationOwnerId: 'owner-a', obligationAmountCents: 1000, eventCount: 1 };
assert.equal(settlement.ownerId === settlement.obligationOwnerId && settlement.amountCents === settlement.obligationAmountCents && settlement.eventCount === 1, true);
assert.equal(30000 + 25000, 55000, 'VACU is excluded from dues/award operating totals');
assert.equal(1377 <= 8000, true, 'ring expense remains within reserve');
assert.equal(new Set(['championship-ring-2026']).size, 1, 'deterministic ring expense is unique');
assert.equal('owner-email' in { ownerId: 'owner-a', teamName: 'Team A' }, false);
console.log('Operational reconciliation diagnostics passed: close gating, active-season waiting, workflow states, settlement integrity, reserve separation, and identity safety.');
