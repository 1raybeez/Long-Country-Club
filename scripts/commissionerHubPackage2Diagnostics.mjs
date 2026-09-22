import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync('app/commish/page.tsx', 'utf8');
const model = fs.readFileSync('lib/commissionerHub/model.ts', 'utf8');

for (const marker of ['getCommissionerHubModel', 'model.attentionItems', 'model.weeklyOperations', 'All caught up', 'Operational blockers', 'More operational detail']) {
  assert.match(page, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `missing Package 2 marker: ${marker}`);
}
assert.doesNotMatch(page, /getCommissionerFeedbackQueue/);
assert.doesNotMatch(page, /fetch\(/);
assert.doesNotMatch(page, /POST|PATCH|PUT|DELETE/);
assert.match(model, /requiresHumanAction/);
assert.match(model, /attentionItems/);
assert.match(model, /blockers/);
assert.match(page, /visibility === 'VISIBLE'/);
console.log('LCC Commissioner Hub Package 2 diagnostics passed: normalized identity, attention, empty state, weekly operations, blocker separation, progressive disclosure, capability-aware visibility, and read-only presentation.');
