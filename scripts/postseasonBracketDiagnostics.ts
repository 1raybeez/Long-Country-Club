import assert from "node:assert/strict";
import { buildPostseasonSnapshot, getCurrentPostseasonContext, unavailablePostseasonSnapshot, type SleeperBracketSource } from "../lib/postseason/bracketAdapter";
import { ACTIVE_LCC_OWNERS } from "../lib/lccOwners";

const fixtureOwners = ACTIVE_LCC_OWNERS.slice(0, 6);
const rosters = fixtureOwners.map((owner, index) => ({ roster_id: index + 1, owner_id: owner.sleeperUserId }));
const winners: SleeperBracketSource[] = [
  { m: 1, r: 1, t1: 5, t2: 6 },
  { m: 2, r: 1, t1: 4, t2: 2 },
  { m: 3, r: 2, t1: 3, t2: null },
  { m: 4, r: 2, t1: 1, t2: null },
  { m: 5, r: 2, p: 5, t1: null, t2: null, t1_from: { l: 1 }, t2_from: { l: 2 } },
  { m: 6, r: 3, p: 1, t1: null, t2: null, t1_from: { w: 3 }, t2_from: { w: 4 } },
];
const losers: SleeperBracketSource[] = [
  { m: 1, r: 1, t1: 5, t2: 6 },
  { m: 2, r: 2, p: 3, t1: null, t2: null, t1_from: { w: 1 }, t2_from: { w: 2 } },
];

const firstRound = buildPostseasonSnapshot({ season: 2026, activeWeek: 15, playoffWeekStart: 15, winners, losers, rosters });
assert.equal(firstRound.sourceStatus, "unresolved");
assert.equal(getCurrentPostseasonContext(firstRound, fixtureOwners[4].id)?.roundLabel, "First Round");
assert.equal(getCurrentPostseasonContext(firstRound, fixtureOwners[4].id)?.opponentOwnerId, fixtureOwners[5].id);

const bye = buildPostseasonSnapshot({ season: 2026, activeWeek: 16, playoffWeekStart: 15, winners, losers, rosters });
assert.equal(getCurrentPostseasonContext(bye, fixtureOwners[2].id)?.isBye, true);
assert.equal(getCurrentPostseasonContext(bye, fixtureOwners[2].id)?.roundLabel, "Semifinals");

const championship = buildPostseasonSnapshot({ season: 2026, activeWeek: 17, playoffWeekStart: 15, winners: [{ m: 6, r: 3, p: 1, t1: 1, t2: 2 }], losers, rosters });
assert.equal(getCurrentPostseasonContext(championship, fixtureOwners[0].id)?.isChampionship, true);
assert.equal(getCurrentPostseasonContext(championship, fixtureOwners[0].id)?.roundLabel, "Championship");

const placement = buildPostseasonSnapshot({ season: 2026, activeWeek: 16, playoffWeekStart: 15, winners: [], losers: [{ m: 2, r: 2, p: 3, t1: 1, t2: 2 }], rosters });
assert.equal(getCurrentPostseasonContext(placement, fixtureOwners[0].id)?.bracketType, "placement");
assert.equal(getCurrentPostseasonContext(placement, fixtureOwners[0].id)?.roundLabel, "Placement Game");

assert.ok(firstRound.contexts.some((context) => context.sourceStatus === "unresolved" && context.ownerId === null));
assert.equal(getCurrentPostseasonContext(firstRound, "missing-owner"), null);
assert.equal(unavailablePostseasonSnapshot(2026, 15, 15).sourceStatus, "unavailable");
console.log("LCC postseason bracket diagnostics passed: authoritative round, bye, championship, placement, unresolved, and neutral seed behavior.");
