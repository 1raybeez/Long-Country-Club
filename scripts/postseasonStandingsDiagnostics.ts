import assert from "node:assert/strict";
import { getRegularSeasonStandingsThroughWeek } from "../lib/weekState.ts";
import { buildCurrentManagerSeasonContext } from "../lib/currentManagerContext.ts";
import { buildHomeMatchupViewFromCurrentMatchups, resolveHomeCurrentWeek } from "../lib/homeCurrentSeason.ts";
import { ACTIVE_LCC_OWNERS } from "../lib/lccOwners.ts";
import { readFileSync } from "node:fs";

const playoffWeekStart = 15;
for (const [safeCompletedWeek, expected] of [[1, 1], [8, 8], [14, 14], [15, 14], [16, 14], [17, 14]] as const) {
  assert.equal(getRegularSeasonStandingsThroughWeek(safeCompletedWeek, playoffWeekStart), expected);
}
assert.equal(getRegularSeasonStandingsThroughWeek(null, playoffWeekStart), null);
assert.equal(getRegularSeasonStandingsThroughWeek(16, null), 16, "missing Sleeper cutoff preserves existing fallback behavior");

const regular = resolveHomeCurrentWeek({ season: "2026", status: "in_season", settings: { leg: 14, last_scored_leg: 14, playoff_week_start: 15 } });
const postseason = resolveHomeCurrentWeek({ season: "2026", status: "in_season", settings: { leg: 16, last_scored_leg: 15, playoff_week_start: 15 } });
const complete = resolveHomeCurrentWeek({ season: "2026", status: "complete", settings: { leg: 17, last_scored_leg: 17, playoff_week_start: 15 } });
assert.equal(regular.phase, "REGULAR_SEASON");
assert.equal(regular.playoffWeekStart, 15);
assert.equal(postseason.phase, "POSTSEASON");
assert.equal(postseason.playoffWeekStart, 15);
assert.equal(complete.phase, "SEASON_COMPLETE");

const ray = ACTIVE_LCC_OWNERS[0];
const managerStanding = { franchiseId: ray.id, franchiseName: ray.managerPage.sleeperName, wins: 10, losses: 4, ties: 0, pointsFor: 1800 };
const playoffSnapshot = {
  season: 2026,
  week: 16,
  state: postseason,
  fetchedAt: "diagnostic",
  matchups: [],
};
const context = buildCurrentManagerSeasonContext(ray.id, [managerStanding], playoffSnapshot);
assert.equal(context.phase, "POSTSEASON");
assert.equal(context.standing?.wins, 10);
assert.equal(context.standing?.rank, 1);
assert.equal(buildHomeMatchupViewFromCurrentMatchups([], { memberId: ray.id, ownerId: ray.id, displayName: ray.displayName, teamName: ray.managerPage.sleeperName, capabilities: [] }, 16).state, "unavailable");

const homeSource = readFileSync("app/page.tsx", "utf8");
const managerSource = readFileSync("app/managers/owners/[slug]/page.tsx", "utf8");
assert.match(homeSource, /Final regular-season standings/);
assert.match(managerSource, /Regular-Season Record/);
assert.match(managerSource, /Regular-Season Finish/);

console.log("LCC postseason standings diagnostics passed: Week 1–14 progression, Week 15–17 freeze, season-complete freeze, postseason phase propagation, manager rank isolation, and state-aware labels.");
