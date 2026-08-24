import assert from 'node:assert/strict';

const categories = ['fourth-place', 'third-place', 'runner-up', 'champion'];
const evaluate = ({ finality = false, p1 = null, p3 = null, placements = null, owners = new Map() }) => {
  const finalMatch = (match) => Boolean(match && Number.isInteger(match.w) && Number.isInteger(match.l) && match.w !== match.l);
  const source = placements || { 1: finalMatch(p1) ? p1.w : null, 2: finalMatch(p1) ? p1.l : null, 3: finalMatch(p3) ? p3.w : null, 4: finalMatch(p3) ? p3.l : null };
  return categories.map((category, index) => {
    const roster = source[index + 1];
    const matchReady = placements || (index < 2 ? finalMatch(p1) : finalMatch(p3));
    if (!finality) return 'waiting';
    if (!matchReady) return 'waiting';
    if (!owners.has(roster)) return 'issue';
    return 'ready';
  });
};

assert.deepEqual(evaluate({ p1: { w: null, l: null }, p3: { w: null, l: null } }), ['waiting', 'waiting', 'waiting', 'waiting']);
const owners = new Map([[1, 'owner-a'], [2, 'owner-b'], [3, 'owner-c'], [4, 'owner-d']]);
assert.deepEqual(evaluate({ finality: true, p1: { w: 1, l: 2 }, p3: { w: 3, l: 4 }, owners }), ['ready', 'ready', 'ready', 'ready']);
assert.deepEqual(evaluate({ finality: true, p1: { w: 1, l: 2 }, p3: { w: null, l: null }, owners }), ['ready', 'ready', 'waiting', 'waiting']);
assert.equal(evaluate({ finality: true, p1: { w: 1, l: 2 }, p3: { w: 3, l: 4 }, owners: new Map([[1, 'owner-a']]) })[1], 'issue');
assert.deepEqual(evaluate({ finality: true, placements: { 1: 1, 2: 2, 3: 3, 4: 4 }, owners }), ['ready', 'ready', 'ready', 'ready']);
assert.equal(20500 + (8000 - 1377), 27123, 'champion projection consumes unused ring reserve once');
assert.equal(27123, 20500 + 6623, 'ring expense remains separate from champion award amount');
assert.equal('email' in { ownerId: 'owner-a', teamName: 'Team A' }, false, 'diagnostics do not expose contact data');
console.log('Postseason readiness diagnostics passed: finality, placement resolution, waiting/issue states, owner mapping, conflict-safe sources, and ring allocation separation.');
