import assert from 'node:assert/strict';
import { deriveWeeklyHigh, getWeeklyHighBoard } from '../lib/finance/weeklyHigh.ts';
import { readFileSync } from 'node:fs';

async function main() {
  const authoritative = await deriveWeeklyHigh(2026, 1);
  const board = await getWeeklyHighBoard(2026);
  const weekOne = board.find((item) => item.week === 1);
  assert(weekOne);
  assert.equal(authoritative.franchiseName, 'Sycamore Bishops');
  assert.equal(authoritative.score, 196.8);
  assert.equal(authoritative.status, 'FINAL');
  assert.deepEqual([weekOne.franchiseName, weekOne.score, weekOne.status], [authoritative.franchiseName, authoritative.score, authoritative.status]);
  assert.equal(board.filter((item) => item.week >= 2 && item.week <= 14 && item.status === 'UNAVAILABLE').length, 13);
  const review = readFileSync('components/commish/AwardReview.tsx', 'utf8');
  assert.match(review, /weeklyHighBoard/);
  assert.doesNotMatch(review, /all persisted scores are zero placeholders/);
  console.log('LCC commissioner weekly-award parity diagnostics passed: Week 1 authoritative result, 13 future pending weeks, no placeholder override, and shared board consumption.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
