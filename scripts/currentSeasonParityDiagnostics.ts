import assert from "node:assert/strict";
import { buildCurrentSeasonMatchups, buildHomeMatchupView, resolveHomeCurrentWeek } from "../lib/homeCurrentSeason.ts";
import { getLccOwnerBySleeperUserId } from "../lib/lccOwners.ts";

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

const home = buildHomeMatchupView(
  [{ matchup_id: 1, roster_id: 1, points: 140.41 }, { matchup_id: 1, roster_id: 2, points: 162.34 }],
  [{ roster_id: 1, owner_id: ray.sleeperUserId! }, { roster_id: 2, owner_id: rob.sleeperUserId! }],
  { memberId: ray.id, ownerId: ray.id, displayName: ray.displayName, teamName: ray.managerPage.sleeperName, capabilities: [] },
  1,
);
assert.equal(home.ownerName, "Bower Rangers");
assert.equal(home.opponentName, "Roaring 20");
assert.deepEqual([home.ownerScore, home.opponentScore], [140.41, 162.34]);

console.log("LCC current-season parity diagnostics passed: shared week state, runtime matchup mapping, scores, and Home franchise identity.");
