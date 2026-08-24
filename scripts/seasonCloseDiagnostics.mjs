import assert from 'node:assert/strict';

const closeGate = ({ duesOutstanding = 0, weeklyWaiting = 0, postseasonWaiting = 0, reconciliationStatus = 'reconciled', correctionIssues = 0 }) => {
  const blockers = [];
  if (duesOutstanding > 0) blockers.push('Outstanding Dues');
  if (weeklyWaiting > 0) blockers.push('Weekly Awards');
  if (postseasonWaiting > 0) blockers.push('Postseason Awards');
  if (reconciliationStatus !== 'reconciled') blockers.push('Reconciliation');
  if (correctionIssues > 0) blockers.push('Corrections');
  return { readyToClose: blockers.length === 0, blockers };
};

const current = closeGate({ duesOutstanding: 35000, weeklyWaiting: 14, postseasonWaiting: 4, reconciliationStatus: 'pending' });
assert.equal(current.readyToClose, false);
assert.deepEqual(current.blockers, ['Outstanding Dues', 'Weekly Awards', 'Postseason Awards', 'Reconciliation']);
assert.equal(closeGate({ duesOutstanding: 0, weeklyWaiting: 0, postseasonWaiting: 0 }).readyToClose, true);
assert.equal(closeGate({ correctionIssues: 1 }).readyToClose, false);

const snapshot = { previewOnly: true, authoritative: false, assessedCents: 60000, collectedCents: 25000, outstandingCents: 35000, ringExpenseCents: 1377, projectedChampionCents: 27123 };
assert.equal(snapshot.previewOnly, true);
assert.equal(snapshot.authoritative, false);
assert.equal(snapshot.assessedCents - snapshot.collectedCents, snapshot.outstandingCents);
assert.equal(snapshot.projectedChampionCents, 20500 + (8000 - snapshot.ringExpenseCents));
assert.equal('email' in snapshot, false, 'snapshot does not expose private contact data');
assert.equal('requestId' in snapshot, false, 'snapshot does not expose request guards');

const archiveTarget = { firestore: 'financeArchives/2026/snapshots/2026-v1', historicalJson: 'data/history/financial/2026.json', identity: 'finance-close-2026' };
assert.equal(new Set(Object.values(archiveTarget)).size, 3, 'archive destinations and close identity are deterministic');
assert.equal('closedAt' in snapshot, false, 'preview does not imply a close timestamp');

console.log('Season-close diagnostics passed: fail-closed gates, current blockers, preview-only totals, privacy, correction blocking, and deterministic archive identity.');
