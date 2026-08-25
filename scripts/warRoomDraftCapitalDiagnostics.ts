import { ACTIVE_LCC_OWNERS } from "../lib/lccOwners";
import { getOwnerById } from "../lib/ownerRegistry";
import { getWarRoomDraftCapital, getWarRoomDraftCapitalCoverage } from "../lib/warRoom/draftCapital";

const coverage = getWarRoomDraftCapitalCoverage();
const errors: string[] = [];
const duplicateIds = new Set<string>();
const seenIds = new Set<string>();

if (ACTIVE_LCC_OWNERS.length !== 12) errors.push(`ACTIVE_OWNER_COUNT:${ACTIVE_LCC_OWNERS.length}`);
if (coverage.ownersWithResults.length !== 12) errors.push(`OWNER_RESULTS:${coverage.ownersWithResults.length}`);
if (coverage.missingOwnerResults.length) errors.push(`MISSING_OWNER_RESULTS:${coverage.missingOwnerResults.join(",")}`);

coverage.inventory.assets.forEach((asset) => {
  if (seenIds.has(asset.id)) duplicateIds.add(asset.id);
  seenIds.add(asset.id);
  if (!asset.currentOwnerId || !asset.originalOwnerId) errors.push(`OWNER_MAPPING:${asset.id}`);
  if (!getOwnerById(asset.currentOwnerId) || !getOwnerById(asset.originalOwnerId)) errors.push(`UNKNOWN_OWNER:${asset.id}`);
});

if (duplicateIds.size) errors.push(`DUPLICATE_PICK_IDS:${[...duplicateIds].join(",")}`);

const ray = getWarRoomDraftCapital("ray-long");
if (!ray || ray.picks.length !== 8 || ray.picksBySeason["2027"] !== 4 || ray.picksBySeason["2028"] !== 4) {
  errors.push("RAY_DRAFT_CAPITAL");
}
if (ray && (ray.acquiredPicks.length !== 0 || ray.originalPicksTradedAway.length !== 0)) {
  errors.push("RAY_TRADE_CONTEXT");
}

const filteredOwnerIds = coverage.results.flatMap(({ capital }) => capital?.picks.map((pick) => pick.currentOwnerId) ?? []);
if (filteredOwnerIds.some((ownerId) => !coverage.activeOwnerIds.includes(ownerId))) errors.push("FILTERED_OWNER_OUTSIDE_ACTIVE_DIRECTORY");

if (errors.length) throw new Error(`War Room Draft Capital diagnostics failed: ${errors.join(" | ")}`);

console.log("War Room Draft Capital diagnostics passed");
console.log(`Active owners: ${ACTIVE_LCC_OWNERS.length}`);
console.log(`Canonical future picks: ${coverage.inventory.assets.length}`);
console.log(`Future seasons: ${coverage.inventory.supportedFutureSeasons.join(", ")}`);
console.log(`Ray picks: ${ray?.picks.length ?? 0}`);
