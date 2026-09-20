import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ACTIVE_LCC_OWNERS } from "../lib/lccOwners.ts";
import { buildHomeWeeklyRecap } from "../lib/homeWeeklyRecap.ts";
import type { HistoricalMatchup } from "../lib/history/matchups.ts";
import type { WeeklyHighResult } from "../lib/finance/weeklyHigh.ts";

const owners = ACTIVE_LCC_OWNERS.slice(0, 12);
const matchup = (index: number, ownerAScore: number, ownerBScore: number): HistoricalMatchup => ({
  season: 2026, week: 1, type: "regularSeason", ownerAId: owners[index * 2].id, ownerBId: owners[index * 2 + 1].id,
  ownerAScore, ownerBScore, winnerOwnerId: null, loserOwnerId: null, currentStatus: "FINAL",
});
const fixture: readonly HistoricalMatchup[] = [
  matchup(0, 100, 99), matchup(1, 150, 100), matchup(2, 200, 80),
  matchup(3, 90, 90), matchup(4, 196.8, 100), matchup(5, 75, 110),
];
const weeklyHigh: WeeklyHighResult = {
  season: 2026, week: 1, franchiseId: owners[4].id, franchiseName: owners[4].managerPage.sleeperName,
  ownerDisplayName: owners[4].displayName, score: 196.8, awardAmountCents: 1000, status: "FINAL", source: "sleeper",
  observedAt: new Date().toISOString(), tie: false, decisionRequired: false, rosterTotals: [],
};

const recap = buildHomeWeeklyRecap(2026, 1, fixture, weeklyHigh, 6);
assert.equal(recap.availability, "complete");
assert.equal(recap.week, 1);
assert.equal(recap.matchupCount, 6);
assert.equal(recap.weeklyHighWinner?.score, 196.8);
assert.equal(recap.weeklyHighWinner?.teamName, owners[4].managerPage.sleeperName);
assert.equal(recap.closestMatchups[0].margin, 0);
assert.equal(recap.largestMarginMatchups[0].margin, 120);
assert.equal(recap.highestScoringMatchups[0].combinedScore, 296.8);
assert.equal(recap.highestScoringTeam?.score, 200);
assert.equal(recap.lowestScoringTeam?.score, 75);

const tied = buildHomeWeeklyRecap(2026, 2, [matchup(0, 100, 90), matchup(1, 110, 100), matchup(2, 120, 80), matchup(3, 95, 85), matchup(4, 85, 115), matchup(5, 85, 125)], weeklyHigh, 6);
assert.equal(tied.closestMatchups.length, 3, "closest-matchup ties remain represented");
assert.equal(tied.largestMarginMatchups.length, 2, "largest-margin ties remain represented");
assert.equal(tied.highestScoringMatchups.length, 2, "highest-combined-score ties remain represented");
assert.deepEqual(tied.closestMatchups.map((item) => item.matchupKey), [...tied.closestMatchups].sort((a, b) => a.matchupKey.localeCompare(b.matchupKey)).map((item) => item.matchupKey));

const incomplete = buildHomeWeeklyRecap(2026, 1, fixture.slice(0, 5), weeklyHigh, 6);
assert.equal(incomplete.availability, "partial");
assert.equal(incomplete.closestMatchups.length, 0);
assert.equal(incomplete.highestScoringTeam, null);
assert.equal(buildHomeWeeklyRecap(2026, null, [], null, 6).availability, "unavailable");
assert.equal(buildHomeWeeklyRecap(2026, 2, fixture.map((item) => ({ ...item, week: 2 })), weeklyHigh, 6).week, 2, "recap target advances with the completed-week input");

const recapSource = readFileSync("lib/homeWeeklyRecap.ts", "utf8");
const cardSource = readFileSync("app/HomeWeeklyRecap.tsx", "utf8");
const pageSource = readFileSync("app/page.tsx", "utf8");
const contextSource = readFileSync("app/HomeLeagueContext.tsx", "utf8");
assert.match(recapSource, /safeCompletedWeek/);
assert.match(recapSource, /loadCurrentSeasonMatchups/);
assert.doesNotMatch(recapSource, /getFirebaseAdminFirestore|transaction|set\(/);
assert.doesNotMatch(cardSource, /setInterval|fetch\(/);
assert.match(pageSource, /loadHomeWeeklyRecap/);
assert.match(contextSource, /<HomeWeeklyRecap/);
assert.match(contextSource, /<HomePayoutsCard/);
assert.match(contextSource, /<HomeGovernanceCard/);
assert.match(contextSource, /context\.nextEvent \?/);
assert.equal((contextSource.match(/<HomeWeeklyRecap /g) ?? []).length, 1, "Recent Recap is rendered once");
assert.match(pageSource, /HomeDashboardTopRow|HomeDashboardCompetition/);
assert.doesNotMatch(cardSource, /Game of the Week|Best Win|Worst Loss|Upset|Choke/);
console.log("LCC Home weekly recap diagnostics passed: safe-week selection, automated advancement, weekly-high parity, deterministic metrics/ties, incomplete-data safety, preseason fallback, no Firebase content dependency, and polling isolation.");
