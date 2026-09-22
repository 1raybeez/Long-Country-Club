import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCommissionerHubModel } from '@/lib/commissionerHub/model';
import { COMMISSIONER_CAPABILITY_IDS, type CommissionerHubModel, type LeagueIntelligenceProduct } from '@/lib/commissionerHub/types';

assert.deepEqual(COMMISSIONER_CAPABILITY_IDS, ['FINANCE', 'LEGISLATIVE_HUB', 'SEASON_OPERATIONS', 'WAR_ROOM', 'LEAGUE_INTELLIGENCE', 'OWNER_FEEDBACK']);
const requiredKeys: readonly (keyof CommissionerHubModel)[] = ['leagueIdentity', 'permissions', 'attentionItems', 'weeklyOperations', 'capabilities', 'leagueSpecificCapabilities', 'inactiveCapabilities', 'leagueIntelligenceProducts', 'systemHealthSummary'];
assert.equal(requiredKeys.length, 9);
assert.equal(requiredKeys.includes('leagueIntelligenceProducts'), true);
const intelligenceStates: LeagueIntelligenceProduct['availability'][] = ['ACTIVE', 'INACTIVE', 'COMING_SOON', 'UNAVAILABLE'];
assert.deepEqual([...new Set(intelligenceStates)].sort(), ['ACTIVE', 'COMING_SOON', 'INACTIVE', 'UNAVAILABLE']);
const fixture = buildCommissionerHubModel({
  session: { identity: { uid: 'fixture', email: 'fixture@example.com', name: null, picture: null }, member: { memberId: 'fixture', displayName: 'Fixture', teamName: 'Fixture Team', ownerId: 'ray-long', capabilities: ['commissioner'] } },
  weekState: { season: 2026, state: 'LIVE', activeWeek: 2, latestCompletedWeek: 1, nextWeek: 3, safeCompletedWeek: 1, playoffWeekStart: 15, source: 'sleeper-league' },
  snapshot: { season: 2026, week: 2, state: { season: 2026, phase: 'REGULAR_SEASON', week: 2, source: 'sleeper-league', state: 'LIVE', latestCompletedWeek: 1, nextWeek: 3, safeCompletedWeek: 1, playoffWeekStart: 15 }, fetchedAt: '2026-09-21T00:00:00.000Z', matchups: [], postseason: null },
  reconciliation: null,
  weeklyHigh: [],
  standingsAvailable: false,
  recap: null,
  feedback: null,
});
assert.deepEqual(Object.keys(fixture).sort(), [...requiredKeys].sort());
assert.equal(fixture.leagueIdentity.provider, 'Sleeper');
assert.equal(fixture.leagueIdentity.teamCount, 12);
assert.equal(fixture.permissions.warRoomScope, null);
assert.equal(fixture.leagueSpecificCapabilities.length, 0);
assert.equal(fixture.permissions.warRoom, false);
assert.equal(fixture.capabilities.find((capability) => capability.id === 'WAR_ROOM')?.availability, 'UNAVAILABLE');
assert.equal(fixture.capabilities.find((capability) => capability.id === 'WAR_ROOM')?.visibility, 'HIDDEN');
assert.equal(fixture.capabilities.find((capability) => capability.id === 'FINANCE')?.route, '/commish/finance');
assert.ok(fixture.leagueIntelligenceProducts.every((product) => 'publicationState' in product && 'route' in product));
assert.ok('overallHealth' in fixture.systemHealthSummary && 'issueCount' in fixture.systemHealthSummary);
assert.equal(fixture.attentionItems.length, 0);
assert.ok(Array.isArray(fixture.weeklyOperations.blockers));
assert.ok(fixture.weeklyOperations.blockers.every((item) => 'code' in item && 'state' in item && 'affects' in item && 'requiresHumanAction' in item));
const adapterSource = fs.readFileSync(new URL('../lib/commissionerHub/model.ts', import.meta.url), 'utf8');
assert.doesNotMatch(adapterSource, /\.(?:set|create|update|delete)\(/);
assert.doesNotMatch(adapterSource, /CRITICAL/);
console.log('LCC Commissioner Hub Package 1 model diagnostics passed: nine-field contract, six capabilities, independent intelligence states, and required normalized dimensions.');
