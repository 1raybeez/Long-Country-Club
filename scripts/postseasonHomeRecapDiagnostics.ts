import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ACTIVE_LCC_OWNERS } from "../lib/lccOwners";
import { buildHomeWeeklyRecap } from "../lib/homeWeeklyRecap";
import type { HistoricalMatchup } from "../lib/history/matchups";
import { buildPostseasonSnapshot, type SleeperBracketSource } from "../lib/postseason/bracketAdapter";

const owners = ACTIVE_LCC_OWNERS.slice(0, 6);
const rosters = owners.map((owner, index) => ({ roster_id: index + 1, owner_id: owner.sleeperUserId }));
const winners: SleeperBracketSource[] = [
  { m: 1, r: 1, t1: 1, t2: 2 },
  { m: 3, r: 2, t1: 5, t2: null },
  { m: 6, r: 3, p: 1, t1: null, t2: null, t1_from: { w: 1 }, t2_from: { w: 3 } },
];
const losers: SleeperBracketSource[] = [{ m: 2, r: 1, t1: 3, t2: 4 }];
const firstRound = buildPostseasonSnapshot({ season: 2026, activeWeek: 15, playoffWeekStart: 15, winners, losers, rosters });

function matchup(indexA: number, indexB: number, a: number | null, b: number | null, postseason?: HistoricalMatchup["postseason"], winnerOwnerId: string | null = null): HistoricalMatchup {
  return { season: 2026, week: 15, type: "playoff", ownerAId: owners[indexA].id, ownerBId: owners[indexB].id, ownerAScore: a, ownerBScore: b, winnerOwnerId, loserOwnerId: null, postseason };
}

const firstRoundRecap = buildHomeWeeklyRecap(2026, 15, [
  matchup(0, 1, 120, 100),
  matchup(2, 3, 110, 90),
  matchup(4, 5, null, null, firstRound.contexts.find((context) => context.ownerId === owners[4].id)),
], null, null, firstRound, "POSTSEASON");
assert.equal(firstRoundRecap.availability, "complete");
assert.equal(firstRoundRecap.matchupCount, 2, "bye rows are excluded from played-game metrics");
assert.equal(firstRoundRecap.weeklyHighWinner, null);
assert.equal(firstRoundRecap.roundLabel, "First Round");
assert.match(firstRoundRecap.note ?? "", /ended after Week 14/);
assert.equal(firstRoundRecap.bracketTypes.includes("winners"), true);
assert.equal(firstRoundRecap.bracketTypes.includes("losers"), true);

const semifinal = buildPostseasonSnapshot({ season: 2026, activeWeek: 16, playoffWeekStart: 15, winners: [{ m: 4, r: 2, t1: 1, t2: 2 }, { m: 6, r: 3, p: 1, t1: null, t2: null, t1_from: { w: 4 }, t2_from: { w: 3 } }], losers: [], rosters });
const semifinalRecap = buildHomeWeeklyRecap(2026, 16, [matchup(0, 1, 140, 130)], null, null, semifinal, "POSTSEASON");
assert.equal(semifinalRecap.roundLabel, "Semifinals");
assert.equal(semifinalRecap.matchupCount, 1);

const championship = buildPostseasonSnapshot({ season: 2026, activeWeek: 17, playoffWeekStart: 15, winners: [{ m: 6, r: 3, p: 1, t1: 1, t2: 2 }], losers: [], rosters });
const championshipRecap = buildHomeWeeklyRecap(2026, 17, [matchup(0, 1, 155, 140, championship.contexts.find((context) => context.ownerId === owners[0].id), owners[0].id)], null, null, championship, "POSTSEASON");
assert.equal(championshipRecap.championshipMatchup?.winnerOwnerId, owners[0].id);
assert.equal(championshipRecap.championshipMatchup?.isChampionship, true);

const unavailable = buildHomeWeeklyRecap(2026, 15, [], null, null, null, "POSTSEASON");
assert.equal(unavailable.availability, "partial");
assert.match(unavailable.note ?? "", /bracket details could not be verified/);

const pageSource = readFileSync("app/page.tsx", "utf8");
const recapSource = readFileSync("lib/homeWeeklyRecap.ts", "utf8");
const cardSource = readFileSync("app/HomeWeeklyRecap.tsx", "utf8");
assert.match(pageSource, /Playoffs/);
assert.match(pageSource, /Final regular-season standings/);
assert.match(recapSource, /attachPostseasonContext/);
assert.match(recapSource, /safeCompletedWeek/);
assert.match(cardSource, /Playoff recap/);
assert.match(recapSource, /Regular-season weekly high awards ended after Week 14/);
assert.doesNotMatch(cardSource, /setInterval|fetch\(/);

console.log("LCC postseason Home/recap diagnostics passed: playoff identity, safe-week recap scope, bye exclusion, semifinal/championship classification, consolation separation, weekly-high suppression, and bracket fallback.");
