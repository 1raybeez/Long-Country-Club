import { readFileSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {
  ACTIVE_LCC_OWNERS,
  ALL_LCC_OWNERS,
  getLccOwnerByProfileSlug,
  getLccOwnerProfileHref,
  getLccOwnerProfileSlug,
  getLccOwnerBySleeperUserId,
} from "../lib/lccOwners";
import { getOwnerCareerSummary } from "../lib/history/career";
import { getLccOwnerCareerSummary as getPlacementCareerSummary, LCC_FINAL_PLACEMENTS } from "../lib/lccFinalPlacements";
import { resolveOwnerId } from "../lib/ownerRegistry";
import { getOwnerImagePath } from "../lib/ownerImages";
import { getVerifiedOwnerTenure } from "../lib/history/ownerHistory";
import { LCC_CURRENT_SEASON } from "../lib/leagueConstants";
import { buildCurrentManagerSeasonContext } from "../lib/currentManagerContext";

const root = process.cwd();
const activeIds = ACTIVE_LCC_OWNERS.map((owner) => owner.id);
const activeSlugs = ACTIVE_LCC_OWNERS.map(getLccOwnerProfileSlug);
const allSlugs = ALL_LCC_OWNERS.map(getLccOwnerProfileSlug);

assert.equal(ACTIVE_LCC_OWNERS.length, 12);
assert.equal(new Set(activeIds).size, activeIds.length);
assert.equal(new Set(activeSlugs).size, activeSlugs.length);
assert.equal(new Set(allSlugs).size, allSlugs.length);

for (const owner of ACTIVE_LCC_OWNERS) {
  assert.ok(owner.displayName.trim());
  assert.ok(owner.managerPage.sleeperName.trim());
  assert.ok(owner.sleeperUserId);
  assert.equal(getLccOwnerByProfileSlug(getLccOwnerProfileSlug(owner))?.id, owner.id);
  assert.equal(getLccOwnerProfileHref(owner), `/managers/owners/${getLccOwnerProfileSlug(owner)}`);
  assert.ok(getOwnerImagePath(owner.id).startsWith("/owners/"));
}

const sleeperIds = ACTIVE_LCC_OWNERS.map((owner) => owner.sleeperUserId);
assert.equal(new Set(sleeperIds).size, sleeperIds.length);
const rosters = JSON.parse(readFileSync(path.join(root, "data/history/matchups/sleeper/2026/rosters.json"), "utf8")) as Array<{ owner_id?: string | null }>;
assert.equal(rosters.length, 12);
const mappedRosterOwners = rosters.map((roster) => getLccOwnerBySleeperUserId(roster.owner_id ?? ""));
assert.equal(mappedRosterOwners.filter(Boolean).length, 12);
assert.equal(new Set(mappedRosterOwners.map((owner) => owner?.id)).size, 12);

const historicalAliases = [...new Set(LCC_FINAL_PLACEMENTS.flatMap((season) => season.placements))];
const unresolvedAliases = historicalAliases.filter((alias) => !resolveOwnerId(alias));
assert.deepEqual(unresolvedAliases, []);
assert.equal(new Set(historicalAliases.map((alias) => resolveOwnerId(alias))).size > 0, true);

for (const owner of ALL_LCC_OWNERS) {
  const profileCareer = getOwnerCareerSummary(owner.id);
  const placementCareer = getPlacementCareerSummary(owner.id);
  assert.equal(profileCareer.championships, placementCareer.titleCount, `${owner.id} championship parity`);
  assert.equal(profileCareer.podiums, placementCareer.podiumCount, `${owner.id} podium parity`);
  assert.equal(profileCareer.playoffAppearances, placementCareer.playoffAppearances.length, `${owner.id} playoff parity`);
  assert.deepEqual(profileCareer.seasonPlacements.map((entry) => entry.season), placementCareer.seasons.map((entry) => entry.season), `${owner.id} season parity`);

  const verifiedTenure = getVerifiedOwnerTenure(owner.id, owner.status);
  const placementSeasons = placementCareer.seasons.map((entry) => entry.season);
  const expectedSeasons = owner.status === "active"
    ? [...new Set([...placementSeasons, LCC_CURRENT_SEASON])].sort((a, b) => a - b)
    : placementSeasons;
  assert.deepEqual(verifiedTenure.seasons, expectedSeasons, `${owner.id} verified tenure parity`);
  assert.equal(verifiedTenure.isCurrent, owner.status === "active", `${owner.id} current status parity`);
  assert.equal(verifiedTenure.isInterrupted, verifiedTenure.spans.length > 1, `${owner.id} interruption parity`);
}

const currentStandings = ACTIVE_LCC_OWNERS.map((owner, index) => ({
  franchiseId: owner.id,
  franchiseName: owner.managerPage.sleeperName,
  wins: index % 3,
  losses: 1,
  ties: 0,
  pointsFor: 100 + index,
}));
const currentMatchups = ACTIVE_LCC_OWNERS.flatMap((owner, index) => {
  if (index % 2 === 1) return [];
  const opponent = ACTIVE_LCC_OWNERS[index + 1];
  return opponent
    ? [{ season: LCC_CURRENT_SEASON, week: 2, type: "regularSeason" as const, ownerAId: owner.id, ownerBId: opponent.id, ownerAScore: 0, ownerBScore: 0, winnerOwnerId: null, loserOwnerId: null, currentStatus: "UPCOMING" as const }]
    : [];
});
const currentSnapshot = {
  season: LCC_CURRENT_SEASON,
  week: 2,
  state: {
    season: LCC_CURRENT_SEASON,
    phase: "REGULAR_SEASON",
    week: 2,
    source: "sleeper-league",
    state: "LIVE",
    latestCompletedWeek: 1,
    nextWeek: 2,
    safeCompletedWeek: 1,
    playoffWeekStart: 15,
  },
  fetchedAt: "diagnostic",
  matchups: currentMatchups,
} as const;

for (const owner of ACTIVE_LCC_OWNERS) {
  const context = buildCurrentManagerSeasonContext(owner.id, currentStandings, currentSnapshot);
  assert.equal(context.season, LCC_CURRENT_SEASON);
  assert.equal(context.franchiseName, owner.managerPage.sleeperName);
  assert.ok(context.standing);
  assert.equal(context.matchup?.week, 2);
  assert.equal(context.matchup?.statusLabel, "Scheduled");
}

for (const owner of ALL_LCC_OWNERS.filter((candidate) => candidate.status === "retired")) {
  const context = buildCurrentManagerSeasonContext(owner.id, currentStandings, currentSnapshot);
  assert.equal(context.standing, null);
  assert.equal(context.matchup, null);
}

const statusExpectations = {
  UPCOMING: "Scheduled",
  LIVE: "Live",
  FINAL: "Final",
  UNKNOWN: "In Progress",
} as const;
for (const [status, label] of Object.entries(statusExpectations)) {
  const context = buildCurrentManagerSeasonContext(
    ACTIVE_LCC_OWNERS[0].id,
    currentStandings,
    { ...currentSnapshot, matchups: [{ ...currentMatchups[0], currentStatus: status as keyof typeof statusExpectations }] }
  );
  assert.equal(context.matchup?.statusLabel, label);
}

const unavailableContext = buildCurrentManagerSeasonContext(
  ACTIVE_LCC_OWNERS[0].id,
  [],
  null
);
assert.equal(unavailableContext.standing, null);
assert.equal(unavailableContext.matchup, null);
assert.equal(unavailableContext.source, "unavailable");

const managersPage = readFileSync(path.join(root, "app/managers/page.tsx"), "utf8");
const directorySource = readFileSync(path.join(root, "app/managers/directoryComponents.tsx"), "utf8");
const profileSource = readFileSync(path.join(root, "app/managers/owners/[slug]/page.tsx"), "utf8");
for (const source of [managersPage, directorySource, profileSource]) {
  assert.doesNotMatch(source, /managersData|ManagerCards|ManagerGrid/);
}
assert.doesNotMatch(profileSource, /currentStandings|currentWeek|loadCurrentSeason/);
assert.doesNotMatch(profileSource, /coOwner|co-owner|co_owner/);
assert.match(profileSource, /history\/\$\{season\.season\}/);
assert.match(profileSource, /Current Season/);
assert.match(profileSource, /owner\.status === "active"/);
assert.doesNotMatch(profileSource, /currentStandings|currentWeek|loadCurrentSeason/);
assert.equal(readFileSync(path.join(root, "app/managers/page.tsx"), "utf8").includes("ACTIVE_LCC_OWNERS"), true);

console.log("LCC Managers diagnostics: PASS");
console.log(`- ${ACTIVE_LCC_OWNERS.length} active owners and ${ALL_LCC_OWNERS.length - ACTIVE_LCC_OWNERS.length} retired owners verified`);
console.log("- 2026 roster-to-owner mapping is unique and complete");
console.log(`- ${historicalAliases.length} historical aliases resolve without guessing`);
console.log("- career placement parity and legacy isolation checked");
console.log("- verified tenure spans, active status, season links, and co-owner isolation checked");
console.log("- active current-season context, retired-owner exclusion, and Scheduled status parity checked");

for (const owner of ALL_LCC_OWNERS) {
  const tenure = getVerifiedOwnerTenure(owner.id, owner.status);
  console.log(`- ${owner.id}: ${tenure.spans.map(({ startSeason, endSeason }) => startSeason === endSeason ? startSeason : `${startSeason}-${endSeason}`).join(", ") || "none"}`);
}
