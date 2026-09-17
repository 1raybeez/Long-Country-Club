import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const overview = read('app/league-info/page.tsx');
const resources = read('app/league-info/resources/page.tsx');
const shell = read('components/league/LeagueInfoShell.tsx');
const routes = read('lib/routeConfig.ts');
const appRoutes = new Set([
  '/league-info', '/league-info/constitution', '/history', '/league-info/records',
  '/league-info/rivalries', '/league-info/drafts', '/league-info/fees', '/league-info/trophy-room', '/league-info/archives',
  '/league-info/resources', '/league-info/trade-analyzer', '/matchups', '/predictor',
]);

const expectedNav = ['Overview', 'Constitution', 'History', 'Records', 'Rivalries', 'Drafts', 'Fees & Payouts', 'Resources', 'Trade Analyzer'];
for (const label of expectedNav) assert.ok(routes.includes(`label: "${label}"`) || routes.includes(`navLabel: "${label}"`), `missing nav label: ${label}`);
const navRoutes = [...routes.matchAll(/\{ id: "[^"]+", label: "([^"]+)", href: "([^"]+)"/g)].map((match) => [match[1], match[2]]);
for (const [, href] of navRoutes) assert.ok(appRoutes.has(href.split('#')[0]), `unverified route: ${href}`);
assert.match(routes, /resources:[\s\S]*status: "active"/);
assert.match(routes, /tradeAnalyzer:[\s\S]*href: "\/league-info\/trade-analyzer"/);
assert.match(routes, /tradeAnalyzer:[\s\S]*access: "protected"/);
assert.match(routes, /tradeAnalyzer:[\s\S]*deferred: true/);
assert.ok(overview.includes('LCC_LEAGUE_INFO_OVERVIEW_ROUTES'));
assert.doesNotMatch(overview, /href: "\/league-info\//);
assert.ok(resources.includes('LCC_LEAGUE_INFO_RESOURCE_ROUTES'));
assert.doesNotMatch(resources, /url: '\/league-info\//);
assert.equal((`${overview}\n${resources}\n${shell}`.match(/Caddy Fees/g) ?? []).length, 0);
assert.equal((`${overview}\n${resources}\n${shell}`.match(/Club Rule/g) ?? []).length, 0);
assert.ok(overview.includes('2026 Preseason Forecast'));
assert.ok(resources.includes('2026 Preseason Team Strength Forecast'));
assert.ok(resources.includes('not live rankings'));
assert.ok(resources.includes('Internal'));
assert.ok(!resources.includes('/commish'));
assert.ok(routes.includes('/league-info/trade-analyzer'));
assert.ok(routes.includes('Authenticated league-trade analysis'));
console.log('LCC League Info + Resources diagnostics: PASS');
console.log(`- ${expectedNav.length} navigation labels and ${navRoutes.length} routes checked`);
console.log('- Fees & Payouts terminology, preseason archive language, internal grouping, and commissioner privacy checked');
