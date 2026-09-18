import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getHomeEvents, selectNextHomeEvent } from "../lib/homeEvents.ts";
import { buildCurrentSeasonMatchups, buildHomeMatchupView, buildHomeMatchupViewFromCurrentMatchups, resolveHomeCurrentWeek } from "../lib/homeCurrentSeason.ts";
import { getLccOwnerBySleeperUserId } from "../lib/lccOwners.ts";
import { formatMatchupStatus } from "../lib/matchupStatus.ts";

const beforeKickoff = new Date("2026-09-09T19:00:00-04:00");
const afterKickoff = new Date("2026-09-15T12:00:00-04:00");
const events = getHomeEvents(2026);
assert.equal(selectNextHomeEvent(events, beforeKickoff).event?.id, "2026-nfl-kickoff");
assert.equal(selectNextHomeEvent(events, afterKickoff).event, null);
assert.equal(selectNextHomeEvent([], afterKickoff).reason, "no-timestamped-event");
assert.equal(selectNextHomeEvent([{ ...events[0], timestamp: null }], afterKickoff).reason, "no-timestamped-event");

assert.equal(resolveHomeCurrentWeek({ season: "2026", settings: { leg: 1 } }).phase, "REGULAR_SEASON");
assert.equal(resolveHomeCurrentWeek({ season: "2026", status: "pre_draft", settings: { leg: 1 } }).phase, "PRESEASON");
assert.equal(resolveHomeCurrentWeek({ season: "2026", settings: { leg: 15, playoff_week_start: 15 } }).phase, "POSTSEASON");
assert.equal(resolveHomeCurrentWeek({ season: "2025", settings: { leg: 1 } }).phase, "UNKNOWN");

const ray = getLccOwnerBySleeperUserId("342828350391230464");
assert(ray);
const member = { memberId: "ray-long", ownerId: ray.id, displayName: ray.displayName, teamName: ray.managerPage.sleeperName, capabilities: [] as const };
const matchup = buildHomeMatchupView(
  [{ matchup_id: 1, roster_id: 1, points: 0 }, { matchup_id: 1, roster_id: 2, points: 0 }],
  [{ roster_id: 1, owner_id: "342828350391230464" }, { roster_id: 2, owner_id: "346727603970973696" }],
  member,
  1,
);
assert.equal(matchup.state, "scheduled");
assert.equal(matchup.currentStatus, "UPCOMING");
assert.equal(matchup.opponentOwnerId, getLccOwnerBySleeperUserId("346727603970973696")?.id);
assert.equal(matchup.ownerScore, null);
assert.equal(buildHomeMatchupView([], [], member, 1).state, "unavailable");
const scored = buildHomeMatchupView([{ matchup_id: 1, roster_id: 1, points: 120 }, { matchup_id: 1, roster_id: 2, points: 110 }], [{ roster_id: 1, owner_id: "342828350391230464" }, { roster_id: 2, owner_id: "346727603970973696" }], member, 1);
assert.equal(scored.ownerScore, 120);
assert.equal(scored.currentStatus, "UNKNOWN");

const currentMatchups = buildCurrentSeasonMatchups(
  [{ matchup_id: 2, roster_id: 1, points: null }, { matchup_id: 2, roster_id: 2, points: null }],
  [{ roster_id: 1, owner_id: ray.sleeperUserId! }, { roster_id: 2, owner_id: "346727603970973696" }],
  2,
);
assert.equal(currentMatchups.length, 1);
assert.equal(currentMatchups[0].currentStatus, "UPCOMING");
assert.deepEqual([currentMatchups[0].ownerAScore, currentMatchups[0].ownerBScore], [null, null]);
assert.equal(buildHomeMatchupViewFromCurrentMatchups(currentMatchups, member, 2).currentStatus, "UPCOMING");

const zeroMatchups = buildCurrentSeasonMatchups(
  [{ matchup_id: 3, roster_id: 1, points: 0 }, { matchup_id: 3, roster_id: 2, points: 0 }],
  [{ roster_id: 1, owner_id: ray.sleeperUserId! }, { roster_id: 2, owner_id: "346727603970973696" }],
  2,
);
assert.equal(zeroMatchups[0].currentStatus, "UPCOMING");

for (const [status, label] of [["UPCOMING", "Scheduled"], ["LIVE", "Live"], ["UNKNOWN", "In Progress"], ["FINAL", "Final"]] as const) {
  assert.equal(formatMatchupStatus(status), label);
  const view = buildHomeMatchupViewFromCurrentMatchups([{ ...currentMatchups[0], currentStatus: status }], member, 2);
  assert.equal(view.currentStatus, status);
}
assert.equal(buildHomeMatchupViewFromCurrentMatchups([], member, 2).state, "unavailable");

const homeSource = readFileSync("app/HomeLiveAction.tsx", "utf8");
const routeSource = readFileSync("app/api/current-week/route.ts", "utf8");
assert.equal((homeSource.match(/setInterval\(/g) ?? []).length, 1);
assert.match(homeSource, /visibilitychange/);
assert.match(homeSource, /window\.addEventListener\("focus"/);
assert.match(homeSource, /formatMatchupStatus/);
assert.match(routeSource, /no-store/);
console.log("LCC Home current-season diagnostics passed: event expiration, shared matchup statuses, null-score pregame preservation, neutral fallbacks, and polling safeguards.");
