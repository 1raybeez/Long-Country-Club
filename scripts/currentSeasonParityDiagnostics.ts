import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formatCurrentSeasonMessage } from "../app/page.tsx";
import { buildCurrentSeasonMatchups, buildHomeMatchupView, resolveHomeCurrentWeek } from "../lib/homeCurrentSeason.ts";
import { getLccOwnerBySleeperUserId } from "../lib/lccOwners.ts";
import { formatMatchupStatus } from "../lib/matchupStatus.ts";

const week = resolveHomeCurrentWeek({ season: "2026", settings: { leg: 1 } });
assert.equal(week.phase, "REGULAR_SEASON");
assert.equal(week.week, 1);

const ray = getLccOwnerBySleeperUserId("342828350391230464");
const rob = getLccOwnerBySleeperUserId("467786127214899200");
assert(ray && rob);

const current = buildCurrentSeasonMatchups(
  [
    { matchup_id: 1, roster_id: 1, points: 140.41, starters: ["1"], players: ["1", "2"] },
    { matchup_id: 1, roster_id: 2, points: 162.34, starters: ["3"], players: ["3", "4"] },
  ],
  [
    { roster_id: 1, owner_id: ray.sleeperUserId! },
    { roster_id: 2, owner_id: rob.sleeperUserId! },
  ],
  1,
);
assert.equal(current.length, 1);
assert.deepEqual([current[0].ownerAId, current[0].ownerBId], [ray.id, rob.id]);
assert.deepEqual([current[0].ownerAScore, current[0].ownerBScore], [140.41, 162.34]);
assert.equal(current[0].winnerOwnerId, null);
assert.equal(current[0].currentStatus, "UNKNOWN");
const upcoming = buildCurrentSeasonMatchups(
  [{ matchup_id: 2, roster_id: 1, points: 0 }, { matchup_id: 2, roster_id: 2, points: 0 }],
  [{ roster_id: 1, owner_id: ray.sleeperUserId! }, { roster_id: 2, owner_id: rob.sleeperUserId! }],
  1,
);
assert.equal(upcoming.length, 1);
assert.equal(upcoming[0].currentStatus, "UPCOMING");
assert.equal(formatMatchupStatus("UPCOMING"), "Scheduled");
assert.equal(formatMatchupStatus("LIVE"), "Live");
assert.equal(formatMatchupStatus("FINAL"), "Final");
assert.equal(formatMatchupStatus("UNKNOWN"), "In Progress");
assert.equal(formatMatchupStatus(undefined), "Final");

const matchupCenterSource = readFileSync("app/matchups/MatchupCenterClient.tsx", "utf8");
assert.match(matchupCenterSource, /formatMatchupStatus\(matchup\.currentStatus\)/);
assert.match(matchupCenterSource, /status=\{matchup\.currentStatus\}/g);

const home = buildHomeMatchupView(
  [{ matchup_id: 1, roster_id: 1, points: 140.41 }, { matchup_id: 1, roster_id: 2, points: 162.34 }],
  [{ roster_id: 1, owner_id: ray.sleeperUserId! }, { roster_id: 2, owner_id: rob.sleeperUserId! }],
  { memberId: ray.id, ownerId: ray.id, displayName: ray.displayName, teamName: ray.managerPage.sleeperName, capabilities: [] },
  1,
);
assert.equal(home.ownerName, "Bower Rangers");
assert.equal(home.opponentName, "Roaring 20");
assert.deepEqual([home.ownerScore, home.opponentScore], [140.41, 162.34]);
assert.equal(formatCurrentSeasonMessage({ week, matchup: home }), "Week 1: Bower Rangers 140.41 · Roaring 20 162.34.");

console.log("LCC current-season parity diagnostics passed: shared week state, runtime matchup mapping, scores, and Home franchise identity.");
