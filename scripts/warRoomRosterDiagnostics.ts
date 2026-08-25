import { ACTIVE_LCC_OWNERS } from "../lib/lccOwners";
import { getOwnerById } from "../lib/ownerRegistry";
import { getWarRoomCurrentRoster, getWarRoomRosterCoverage } from "../lib/warRoom/currentRoster";
import { getCurrentWarRoomRosterArtifact } from "../lib/warRoom/currentRosterSnapshot";
import { WAR_ROOM_ROSTER_RULES } from "../lib/warRoom/rosterRules";

const coverage = getWarRoomRosterCoverage();
const artifact = getCurrentWarRoomRosterArtifact();
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

if (artifact.season !== 2026 || artifact.leagueId !== "1312148925091692544") {
  errors.push("CURRENT_SNAPSHOT_IDENTITY");
}

if (!artifact.capturedAt || Number.isNaN(Date.parse(artifact.capturedAt))) {
  errors.push("CURRENT_SNAPSHOT_TIMESTAMP");
}

if (artifact.rosters.length !== 12) {
  errors.push(`CURRENT_SNAPSHOT_ROSTER_COUNT:${artifact.rosters.length}`);
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

  const reserveIds = new Set(roster.snapshot.reserveIds ?? []);
  const taxiIds = new Set(roster.snapshot.taxiIds ?? []);
  if ([...reserveIds].some((playerId) => taxiIds.has(playerId))) {
    errors.push(`RESERVE_TAXI_OVERLAP:${ownerId}`);
  }
  if (roster.statusCounts.ACTIVE + roster.statusCounts.IR + roster.statusCounts.TAXI !== roster.players.length) {
    errors.push(`ROSTER_ARITHMETIC:${ownerId}`);
  }
});

const rayRoster = getWarRoomCurrentRoster("ray-long");
if (!rayRoster) {
  errors.push("RAY_ROSTER_MISSING");
} else if (getOwnerById("ray-long")?.teamName !== "Bower Rangers") {
  errors.push("RAY_TEAM_MAPPING");
}

if (WAR_ROOM_ROSTER_RULES.normal !== 20 || WAR_ROOM_ROSTER_RULES.reserve !== 3 || WAR_ROOM_ROSTER_RULES.taxi !== 5) {
  errors.push("ROSTER_LIMITS");
}

if (errors.length) {
  throw new Error(`War Room roster diagnostics failed: ${errors.join(" | ")}`);
}

console.log("War Room current roster diagnostics passed");
console.log(`Active owners: ${coverage.activeOwnerIds.length}`);
console.log(`Current rosters: ${coverage.ownersWithRosters.length}`);
console.log(`Ray roster players: ${rayRoster?.players.length ?? 0}`);
console.log(`Current snapshot: ${artifact.capturedAt}`);
console.log(`Roster limits: ${WAR_ROOM_ROSTER_RULES.normal} normal / ${WAR_ROOM_ROSTER_RULES.reserve} IR / ${WAR_ROOM_ROSTER_RULES.taxi} taxi`);
console.log(`Ray capacity: ${rayRoster?.statusCounts.ACTIVE ?? 0}/${WAR_ROOM_ROSTER_RULES.normal} normal, ${rayRoster?.statusCounts.IR ?? 0}/${WAR_ROOM_ROSTER_RULES.reserve} IR, ${rayRoster?.statusCounts.TAXI ?? 0}/${WAR_ROOM_ROSTER_RULES.taxi} taxi`);
