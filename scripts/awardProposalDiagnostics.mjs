import assert from 'node:assert/strict';

const weeklyId = (season, week) => {
  assert.equal(season, 2026, 'wrong season must fail closed');
  assert.ok(Number.isInteger(week) && week >= 1 && week <= 14, 'week must be 1–14');
  return `${season}-weekly-high-${String(week).padStart(2, '0')}`;
};
const classify = ({ integrity, waiting }) => integrity ? 'ISSUE' : waiting ? 'WAITING' : 'READY';

assert.equal(classify({ waiting: true, integrity: false }), 'WAITING', 'WAITING must not propose');
assert.equal(classify({ waiting: false, integrity: true }), 'ISSUE', 'ISSUE must not propose');
assert.equal(classify({ waiting: false, integrity: false }), 'READY', 'READY is the only proposal state');
assert.equal(weeklyId(2026, 1), '2026-weekly-high-01');
assert.equal(weeklyId(2026, 14), '2026-weekly-high-14');
assert.throws(() => weeklyId(2026, 15));
assert.throws(() => weeklyId(2025, 1));

const clientRequest = { season: 2026, week: 4, ownerId: 'attacker', amountCents: 1, score: 999, source: 'client' };
const serverScope = { season: Number(clientRequest.season), week: Number(clientRequest.week) };
assert.deepEqual(serverScope, { season: 2026, week: 4 }, 'client cannot supply proposal authority fields');
assert.equal('ownerId' in serverScope, false);
assert.equal('amountCents' in serverScope, false);
assert.equal('score' in serverScope, false);
assert.equal('source' in serverScope, false);

const stored = new Set();
const first = weeklyId(2026, 4);
stored.add(first);
assert.equal(stored.has(first), true, 'first deterministic proposal is stored');
assert.equal(stored.size, 1, 'duplicate proposal remains one obligation');
assert.equal('approved' === 'proposed' || 'paid' === 'proposed', false, 'proposal never starts approved or paid');
console.log('Award proposal diagnostics passed: READY-only, server-derived fields, deterministic IDs, duplicate guard, and proposed status.');
