import { ACTIVE_LCC_OWNERS } from "../lib/lccOwners";
import { getOwnerById } from "../lib/ownerRegistry";
import { getWarRoomCurrentRoster, getWarRoomRosterCoverage } from "../lib/warRoom/currentRoster";

const coverage = getWarRoomRosterCoverage();
const errors: string[] = [];

if (ACTIVE_LCC_OWNERS.length !== 12) {
  errors.push(`ACTIVE_OWNER_COUNT:${ACTIVE_LCC_OWNERS.length}`);
}

if (coverage.activeOwnerIds.length !== new Set(coverage.activeOwnerIds).size) {
  errors.push("DUPLICATE_ACTIVE_OWNER_IDS");
}

if (coverage.ownersMissingRosters.length) {
  errors.push(`MISSING_ROSTERS:${coverage.ownersMissingRosters.join(",")}`);
}

if (coverage.duplicateOwnerIds.length) {
  errors.push(`DUPLICATE_OWNER_MAPPINGS:${coverage.duplicateOwnerIds.join(",")}`);
}

coverage.rosters.forEach(({ ownerId, roster }) => {
  if (!getOwnerById(ownerId)) {
    errors.push(`UNKNOWN_CANONICAL_OWNER:${ownerId}`);
  }

  if (!roster || roster.players.length === 0) {
    errors.push(`EMPTY_ROSTER:${ownerId}`);
    return;
  }

  if (roster.unresolvedPlayerIds.length) {
    errors.push(`UNKNOWN_PLAYERS:${ownerId}:${roster.unresolvedPlayerIds.join(",")}`);
  }
});

const rayRoster = getWarRoomCurrentRoster("ray-long");
if (!rayRoster) {
  errors.push("RAY_ROSTER_MISSING");
} else if (getOwnerById("ray-long")?.teamName !== "Bower Rangers") {
  errors.push("RAY_TEAM_MAPPING");
}

if (errors.length) {
  throw new Error(`War Room roster diagnostics failed: ${errors.join(" | ")}`);
}

console.log("War Room current roster diagnostics passed");
console.log(`Active owners: ${coverage.activeOwnerIds.length}`);
console.log(`Current rosters: ${coverage.ownersWithRosters.length}`);
console.log(`Ray roster players: ${rayRoster?.players.length ?? 0}`);
