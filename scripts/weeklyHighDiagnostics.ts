import assert from 'node:assert/strict';
import { getAwardAmountCents } from '../lib/finance/awardObligations.ts';
import { deriveWeeklyHigh, selectWeeklyHighFromTotals } from '../lib/finance/weeklyHigh.ts';

async function main() {
const weekOne = await deriveWeeklyHigh(2026, 1);
assert.equal(weekOne.rosterTotals.length, 12);
assert.equal(weekOne.franchiseId, 'anthony-martinez');
assert.equal(weekOne.franchiseName, 'Sycamore Bishops');
assert.equal(weekOne.score, 196.8);
assert.equal(weekOne.tie, false);
assert.equal(weekOne.status, 'PROVISIONAL');
assert.equal(weekOne.awardAmountCents, getAwardAmountCents('weekly-high'));
assert.equal(weekOne.awardAmountCents, 1000);
assert.equal((await import('node:fs')).readFileSync('lib/finance/weeklyHigh.ts', 'utf8').includes(".collection('awards')"), false);

const tie = selectWeeklyHighFromTotals([
  { rosterId: 1, franchiseId: 'ray-long', franchiseName: 'Bower Rangers', score: 150 },
  { rosterId: 2, franchiseId: 'rob-jenkins', franchiseName: 'Roaring 20', score: 150 },
], true);
assert.equal(tie.tie, true);
assert.equal(tie.status, 'UNAVAILABLE');
assert.equal(tie.decisionRequired, true);
assert.equal(selectWeeklyHighFromTotals([{ rosterId: 1, franchiseId: 'ray-long', franchiseName: 'Bower Rangers', score: 150 }], true).status, 'FINAL');

const overrideRoute = await import('../app/api/commish/finance/awards/weekly-high-override/route.ts');
assert.ok(overrideRoute.POST);
assert.match((await import('node:fs')).readFileSync('lib/finance/weeklyHigh.ts', 'utf8'), /capabilities\.includes\('commissioner'\)/);
assert.match((await import('node:fs')).readFileSync('lib/finance/weeklyHigh.ts', 'utf8'), /weeklyHighOverrides/);
assert.match((await import('node:fs')).readFileSync('lib/finance/publicAwardProjection.ts', 'utf8'), /approved/);

console.log(`LCC weekly-high diagnostics passed: ${weekOne.rosterTotals.map((row) => `${row.franchiseName ?? 'Unresolved'}=${row.score ?? '—'}`).join(', ')} | max=${weekOne.score} ${weekOne.franchiseName}, Sleeper-derived $10, provisional completion safety, tie escalation, and commissioner-only override surface.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
