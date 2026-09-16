import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('app/globals.css', 'utf8');
const routes = [
  'app/page.tsx', 'app/matchups/page.tsx', 'app/managers/page.tsx', 'app/league-info/page.tsx',
  'app/league-info/constitution/page.tsx', 'app/history/page.tsx', 'app/league-info/records/page.tsx',
  'app/league-info/rivalries/page.tsx', 'app/league-info/drafts/page.tsx', 'app/league-info/fees/page.tsx',
  'app/league-info/resources/page.tsx', 'app/league-info/trade-analyzer/page.tsx', 'app/predictor/page.tsx',
  'app/commish/page.tsx', 'app/commish/finance/page.tsx',
];
for (const route of routes) assert.ok(fs.existsSync(route), `missing active route: ${route}`);
assert.ok(css.includes('overflow-x: clip'));
assert.ok(css.includes('.lcc-button:focus-visible'));
assert.ok(css.includes('.lcc-button:disabled'));
assert.ok(css.includes('lcc2-page-container'));
assert.ok(css.includes('@media (max-width: 639px)'));
assert.ok(css.includes('@media (min-width: 1024px)'));
console.log(`LCC site-wide visual diagnostics: PASS (${routes.length} active routes, shared shell, overflow containment, responsive breakpoints, and accessibility states)`);
