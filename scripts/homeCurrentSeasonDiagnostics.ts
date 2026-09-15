import assert from "node:assert/strict";
import { getHomeEvents, selectNextHomeEvent } from "../lib/homeEvents.ts";
import { buildHomeMatchupView, resolveHomeCurrentWeek } from "../lib/homeCurrentSeason.ts";
import { getLccOwnerBySleeperUserId } from "../lib/lccOwners.ts";

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
assert.equal(matchup.opponentOwnerId, getLccOwnerBySleeperUserId("346727603970973696")?.id);
assert.equal(matchup.ownerScore, null);
assert.equal(buildHomeMatchupView([], [], member, 1).state, "unavailable");
assert.equal(buildHomeMatchupView([{ matchup_id: 1, roster_id: 1, points: 120 }, { matchup_id: 1, roster_id: 2, points: 110 }], [{ roster_id: 1, owner_id: "342828350391230464" }, { roster_id: 2, owner_id: "346727603970973696" }], member, 1).ownerScore, 120);
console.log("LCC Home current-season diagnostics passed: event expiration, kickoff boundary, typed week state, matchup mapping, neutral fallbacks, and auth reuse.");
