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
}

const managersPage = readFileSync(path.join(root, "app/managers/page.tsx"), "utf8");
const directorySource = readFileSync(path.join(root, "app/managers/directoryComponents.tsx"), "utf8");
const profileSource = readFileSync(path.join(root, "app/managers/owners/[slug]/page.tsx"), "utf8");
for (const source of [managersPage, directorySource, profileSource]) {
  assert.doesNotMatch(source, /managersData|ManagerCards|ManagerGrid/);
}
assert.doesNotMatch(profileSource, /currentStandings|currentWeek|loadCurrentSeason/);
assert.equal(readFileSync(path.join(root, "app/managers/page.tsx"), "utf8").includes("ACTIVE_LCC_OWNERS"), true);

console.log("LCC Managers diagnostics: PASS");
console.log(`- ${ACTIVE_LCC_OWNERS.length} active owners and ${ALL_LCC_OWNERS.length - ACTIVE_LCC_OWNERS.length} retired owners verified`);
console.log("- 2026 roster-to-owner mapping is unique and complete");
console.log(`- ${historicalAliases.length} historical aliases resolve without guessing`);
console.log("- career placement parity and legacy isolation checked");
