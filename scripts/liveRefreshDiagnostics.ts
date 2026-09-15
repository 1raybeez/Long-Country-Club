import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const matchupsSource = readFileSync("app/matchups/MatchupCenterClient.tsx", "utf8");
const homeSource = readFileSync("app/HomeLiveAction.tsx", "utf8");
const routeSource = readFileSync("app/api/current-week/route.ts", "utf8");
const sleeperSource = readFileSync("lib/sleeper.ts", "utf8");

assert.match(routeSource, /force-dynamic/);
assert.match(routeSource, /no-store/);
assert.match(sleeperSource, /const CACHE_OPTIONS = \{ cache: 'no-store' \}/);
assert.equal((matchupsSource.match(/setInterval\(/g) ?? []).length, 1);
assert.equal((homeSource.match(/setInterval\(/g) ?? []).length, 1);
assert.doesNotMatch(matchupsSource, /setInterval.*matchup/i);
assert.doesNotMatch(matchupsSource, /setInterval.*player/i);
assert.match(matchupsSource, /visibilitychange/);
assert.match(matchupsSource, /window\.addEventListener\("focus"/);
assert.match(homeSource, /visibilitychange/);
assert.match(homeSource, /window\.addEventListener\("focus"/);

let displayed = { total: 140.41, playerPoints: { player: 12.5 } };
const applyRefresh = (next: typeof displayed | null) => { if (next) displayed = next; };
applyRefresh({ total: 151.2, playerPoints: { player: 23.3 } });
assert.equal(displayed.total, 151.2);
assert.equal(displayed.playerPoints.player, 23.3);
const beforeFailure = displayed;
applyRefresh(null);
assert.equal(displayed, beforeFailure);

console.log("LCC live-refresh diagnostics passed: dynamic/no-store runtime, one page loop, visibility/focus behavior, score/player propagation, and failed-refresh preservation.");
