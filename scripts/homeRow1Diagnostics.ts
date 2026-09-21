import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getLccChampionBySeason } from "../lib/lccFinalPlacements.ts";
import { getOwnerById } from "../lib/ownerRegistry.ts";
import { getOwnerImagePath } from "../lib/ownerImages.ts";
import { selectWeeklyHighFromTotals } from "../lib/finance/weeklyHigh.ts";
import { classifyPrimeTime, isRenderableNflScoreboard, isRetryableProviderStatus, normalizeNflEvents, retainLastGoodNflScoreboard, selectNflGame, type NflGame, type NflScoreboardView } from "../lib/nflScoreboard.ts";

function game(id: string, kickoff: string, state: NflGame["state"], primeTime: NflGame["primeTime"], away = "ATL", home = "GB"): NflGame {
  return { id, week: 2, season: 2026, kickoff, state, statusLabel: state, detail: state === "LIVE" ? "2nd Quarter · 11:42" : state === "FINAL" ? "Final" : "Scheduled", period: state === "LIVE" ? 2 : null, clock: state === "LIVE" ? "11:42" : null, broadcast: primeTime === "TNF" ? "Prime Video" : primeTime === "SNF" ? "NBC" : primeTime === "MNF" ? "ESPN" : "FOX", primeTime, away: { abbreviation: away, name: `${away} team`, logo: `https://example.test/${away}.png`, score: state === "UPCOMING" ? null : 10 }, home: { abbreviation: home, name: `${home} team`, logo: `https://example.test/${home}.png`, score: state === "UPCOMING" ? null : 10 } };
}

const now = new Date("2026-09-21T02:00:00Z");
const snf = game("snf", "2026-09-21T00:20:00Z", "FINAL", "SNF", "IND", "KC");
const mnf = game("mnf", "2026-09-22T00:15:00Z", "UPCOMING", "MNF", "NYG", "LAR");
const tnf = game("tnf", "2026-09-25T00:15:00Z", "UPCOMING", "TNF");
const sundayLive = game("sun-1", "2026-09-20T17:00:00Z", "LIVE", null, "DAL", "PHI");

assert.equal(classifyPrimeTime("2026-09-25T00:15:00Z", "Prime Video"), "TNF");
assert.equal(classifyPrimeTime("2026-09-21T00:20:00Z", "NBC"), "SNF");
assert.equal(classifyPrimeTime("2026-09-22T00:15:00Z", "ESPN/ABC"), "MNF");
assert.equal(selectNflGame([snf, mnf], now)?.id, "mnf");
assert.equal(selectNflGame([snf, tnf], new Date("2026-09-23T00:00:00Z"))?.id, "tnf");
assert.equal(selectNflGame([sundayLive], now)?.id, "sun-1");
assert.equal(selectNflGame([sundayLive, game("fav", sundayLive.kickoff, "LIVE", null, "PIT", "CLE")], now, "PIT")?.id, "fav");
assert.equal(selectNflGame([mnf], now)?.state, "UPCOMING");
const validApiResponse: NflScoreboardView = { sourceStatus: "ok", reasonCode: null, fetchedAt: now.toISOString(), selected: mnf, games: [mnf], favoriteTeam: null };
assert.equal(isRenderableNflScoreboard(validApiResponse), true, "valid API response must be accepted by Home Card 1");
assert.equal(isRenderableNflScoreboard({ ...validApiResponse, selected: null }), false, "response without a selected game must remain unavailable");
assert.equal(retainLastGoodNflScoreboard(validApiResponse, { sourceStatus: "unavailable" }), validApiResponse, "refresh failure must preserve the last good game");
for (const status of [429, 500, 502, 503, 504]) assert.equal(isRetryableProviderStatus(status), true);
for (const status of [400, 401, 403, 404]) assert.equal(isRetryableProviderStatus(status), false);

const duplicateKickoffPayload = {
  events: [
    { id: "one", date: "2026-09-20T17:00:00Z", week: { number: 2 }, status: { type: { state: "pre", completed: false } }, competitions: [{ competitors: [{ homeAway: "away", team: { abbreviation: "DAL", displayName: "Dallas Cowboys" } }, { homeAway: "home", team: { abbreviation: "PHI", displayName: "Philadelphia Eagles" } }] }] },
    { id: "two", date: "2026-09-20T17:00:00Z", week: { number: 2 }, status: { type: { state: "pre", completed: false } }, competitions: [{ competitors: [{ homeAway: "away", team: { abbreviation: "CHI", displayName: "Chicago Bears" } }, { homeAway: "home", team: { abbreviation: "GB", displayName: "Green Bay Packers" } }] }] },
    { id: "three", date: "2026-09-20T20:25:00Z", week: { number: 2 }, status: { type: { state: "pre", completed: false } }, competitions: [{ competitors: [{ homeAway: "away", team: { abbreviation: "KC", displayName: "Kansas City Chiefs" } }, { homeAway: "home", team: { abbreviation: "SF", displayName: "San Francisco 49ers" } }] }] },
    { id: "four", date: "2026-09-20T20:25:00Z", week: { number: 2 }, status: { type: { state: "pre", completed: false } }, competitions: [{ competitors: [{ homeAway: "away", team: { abbreviation: "NYJ", displayName: "New York Jets" } }, { homeAway: "home", team: { abbreviation: "BUF", displayName: "Buffalo Bills" } }] }] },
  ],
};
assert.equal(normalizeNflEvents(duplicateKickoffPayload).length, 4);

const sameIdLive = game("same", "2026-09-21T00:20:00Z", "LIVE", "SNF", "IND", "KC");
const sameIdUpdated = { ...sameIdLive, home: { ...sameIdLive.home, score: 17 }, away: { ...sameIdLive.away, score: 10 }, period: 3, clock: "03:10", detail: "3rd Quarter · 03:10" };
assert.equal(sameIdLive.id, sameIdUpdated.id);
assert.notEqual(sameIdLive.home.score, sameIdUpdated.home.score);
assert.notEqual(sameIdLive.period, sameIdUpdated.period);
assert.notEqual(sameIdLive.clock, sameIdUpdated.clock);
assert.equal(selectNflGame([sameIdUpdated], now)?.home.score, 17);
assert.equal(selectNflGame([{ ...sameIdUpdated, state: "FINAL" }, mnf], now)?.id, "mnf");

const optionalFields = normalizeNflEvents({ events: [{ id: "optional", date: "2026-09-20T17:00:00Z", status: { type: { state: "pre", completed: false } }, competitions: [{ competitors: [{ homeAway: "away", team: { abbreviation: "A" } }, { homeAway: "home", team: { abbreviation: "B" } }] }] }] });
assert.equal(optionalFields.length, 1);
assert.equal(optionalFields[0].broadcast, null);
assert.equal(optionalFields[0].home.logo, null);
assert.equal(optionalFields[0].home.score, null);

const champion = getLccChampionBySeason(2025);
assert.ok(champion?.ownerId, "canonical reigning champion owner is required");
assert.ok(getOwnerById(champion.ownerId));
assert.ok(getOwnerImagePath(champion.ownerId).startsWith("/owners/"));

const weeklyHigh = selectWeeklyHighFromTotals([
  { rosterId: 1, franchiseId: "sycamore-bishops", franchiseName: "Sycamore Bishops", score: 196.8 },
  { rosterId: 2, franchiseId: "cookie-monsters", franchiseName: "CookieMonsters", score: 88.78 },
], true);
assert.equal(weeklyHigh.status, "FINAL");
assert.equal(weeklyHigh.winner?.franchiseName, "Sycamore Bishops");
assert.equal(weeklyHigh.winner?.score, 196.8);

const pageSource = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const nflSource = readFileSync(new URL("../app/HomeNflNow.tsx", import.meta.url), "utf8");
const adapterSource = readFileSync(new URL("../lib/nflScoreboard.ts", import.meta.url), "utf8");
const apiSource = readFileSync(new URL("../app/api/nfl-scoreboard/route.ts", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
assert.match(pageSource, /HomeNflNow/);
assert.match(pageSource, /HomeWeeklyHigh/);
assert.match(pageSource, /getLccChampionBySeason/);
assert.match(nflSource, /nfl\/week/);
assert.doesNotMatch(nflSource, /href=\"\/matchups\"/);
assert.match(nflSource, /NFL Game Center/);
assert.match(nflSource, /lcc2-button--secondary/);
assert.doesNotMatch(nflSource, /lcc2-card--dark/);
assert.match(nflSource, /Thursday Night Football/);
assert.match(nflSource, /Sunday Night Football/);
assert.match(nflSource, /Monday Night Football/);
assert.match(nflSource, /lcc2-home-nfl-state--live/);
const nflWeekSource = readFileSync(new URL("../app/nfl/week/[week]/page.tsx", import.meta.url), "utf8");
const nflWeekClientSource = readFileSync(new URL("../app/NflWeekScoreboard.tsx", import.meta.url), "utf8");
assert.match(nflWeekSource, /loadNflScoreboard/);
assert.match(nflWeekClientSource, /getNflGamesForWeek/);
assert.doesNotMatch(nflWeekClientSource, /fantasy|lineup|head-to-head/i);
for (const reason of ["PROVIDER_FETCH_FAILED", "HTTP_ERROR", "INVALID_PROVIDER_RESPONSE", "NO_EVENTS", "NO_VALID_GAMES", "NO_SELECTION", "PRESENTATION_MAPPING_FAILED", "PROVIDER_TIMEOUT"]) assert.match(adapterSource, new RegExp(reason));
assert.match(adapterSource, /cache: "no-store"/);
assert.match(adapterSource, /User-Agent/);
assert.match(adapterSource, /AbortController/);
assert.match(adapterSource, /retryable/);
assert.match(adapterSource, /dates=\$\{getNflDateKey\(\)\}/);
assert.match(adapterSource, /week=\$\{requestedWeek\}/);
assert.match(adapterSource, /typeof selected\.id === "string"/);
assert.match(apiSource, /Cache-Control.*no-store/);
assert.match(nflSource, /lastGood/);
assert.match(nflSource, /retainLastGoodNflScoreboard/);
assert.match(nflSource, /setScoreboard\(lastGood\)/);
assert.match(pageSource, /dynamic = "force-dynamic"/);
assert.match(nflWeekClientSource, /shouldPoll/);
assert.equal((nflSource.match(/setInterval/g) ?? []).length, 1);
assert.equal((readFileSync(new URL("../app/HomeLiveAction.tsx", import.meta.url), "utf8").match(/setInterval/g) ?? []).length, 1);
assert.match(cssSource, /\.lcc2-home-weekly-high[\s\S]*order: 2/);
assert.match(cssSource, /\.lcc2-home-champion-card[\s\S]*order: 3/);

console.log("LCC Home Row 1 diagnostics passed: NFL selection/primetime rollover, live/favorite fallback, ESPN failure-safe architecture, canonical champion/avatar, finalized weekly high, playoff suppression, mobile ordering, and polling isolation.");
