import assert from "node:assert/strict";
import { isWeekSafelyCompleted, resolveLccSeasonWeekState } from "../lib/weekState.ts";

const completed = resolveLccSeasonWeekState({ season: "2026", status: "in_season", settings: { leg: 1, last_scored_leg: 1, playoff_week_start: 15 } });
assert.equal(completed.state, "COMPLETED");
assert.equal(completed.safeCompletedWeek, 1);
assert.equal(isWeekSafelyCompleted(completed, 1), true);
const live = resolveLccSeasonWeekState({ season: "2026", status: "in_season", settings: { leg: 2, last_scored_leg: 1 } });
assert.equal(live.state, "LIVE");
assert.equal(live.nextWeek, 2);
assert.equal(isWeekSafelyCompleted(live, 2), false);
assert.equal(resolveLccSeasonWeekState({ season: "2026", status: "preseason", settings: { leg: 1 } }).state, "PRESEASON");
assert.equal(resolveLccSeasonWeekState({ season: "2025", settings: { leg: 1 } }).state, "UNKNOWN");
console.log("LCC shared week-state diagnostics passed: preseason, live, completed, safe boundary, and season mismatch semantics.");
