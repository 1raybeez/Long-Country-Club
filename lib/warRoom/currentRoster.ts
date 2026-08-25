import { ACTIVE_LCC_OWNERS } from "../lccOwners";
import { LCC_CURRENT_SEASON } from "../leagueConstants";
import {
  getCurrentRosterSnapshot,
  type HistoricalRosterSnapshot,
} from "../history/rosterSnapshots";
import {
  getPlayersByIds,
  type HistoricalPlayerMetadata,
} from "../history/playerRegistry";

export const WAR_ROOM_ROSTER_POSITIONS = [
  "QB",
  "RB",
  "WR",
  "TE",
  "K",
  "DST",
] as const;

export type WarRoomRosterPosition = (typeof WAR_ROOM_ROSTER_POSITIONS)[number];
export type WarRoomRosterStatus = "ACTIVE" | "IR" | "TAXI";

export type WarRoomRosterPlayer = HistoricalPlayerMetadata & {
  readonly status: WarRoomRosterStatus;
};

export type WarRoomCurrentRoster = {
  readonly season: number;
  readonly ownerId: string;
  readonly rosterId: number;
  readonly snapshot: HistoricalRosterSnapshot;
  readonly players: readonly WarRoomRosterPlayer[];
  readonly positionCounts: Readonly<Record<WarRoomRosterPosition, number>>;
  readonly statusCounts: Readonly<Record<WarRoomRosterStatus, number>>;
  readonly unresolvedPlayerIds: readonly string[];
};

export function getWarRoomCurrentRoster(
  ownerId: string,
): WarRoomCurrentRoster | null {
  const snapshot = getCurrentRosterSnapshot(ownerId);

  if (!snapshot) {
    return null;
  }

  const taxiIds = new Set(snapshot.taxiIds ?? []);
  const reserveIds = new Set(snapshot.reserveIds ?? []);
  const players = getPlayersByIds(snapshot.playerIds).map((player) => ({
    ...player,
    status: getRosterStatus(player.id, taxiIds, reserveIds),
  }));

  return {
    season: LCC_CURRENT_SEASON,
    ownerId,
    rosterId: snapshot.rosterId,
    snapshot,
    players,
    positionCounts: countPositions(players),
    statusCounts: countStatuses(players),
    unresolvedPlayerIds: players
      .filter((player) => player.name.startsWith("Player "))
      .map((player) => player.id),
  };
}

export function getWarRoomRosterCoverage() {
  const activeOwners = ACTIVE_LCC_OWNERS.map((owner) => owner.id);
  const rosters = activeOwners.map((ownerId) => ({
    ownerId,
    roster: getWarRoomCurrentRoster(ownerId),
  }));

  return {
    activeOwnerIds: activeOwners,
    rosters,
    ownersWithRosters: rosters.filter(({ roster }) => roster !== null).map(({ ownerId }) => ownerId),
    ownersMissingRosters: rosters.filter(({ roster }) => roster === null).map(({ ownerId }) => ownerId),
    duplicateOwnerIds: findDuplicates(rosters.filter(({ roster }) => roster !== null).map(({ ownerId }) => ownerId)),
  };
}

function getRosterStatus(
  playerId: string,
  taxiIds: ReadonlySet<string>,
  reserveIds: ReadonlySet<string>,
): WarRoomRosterStatus {
  if (taxiIds.has(playerId)) {
    return "TAXI";
  }

  if (reserveIds.has(playerId)) {
    return "IR";
  }

  return "ACTIVE";
}

function countPositions(
  players: readonly WarRoomRosterPlayer[],
): Record<WarRoomRosterPosition, number> {
  const counts = createPositionCounts();

  players.forEach((player) => {
    const position = normalizePosition(player.position);

    if (position) {
      counts[position] += 1;
    }
  });

  return counts;
}

function countStatuses(
  players: readonly WarRoomRosterPlayer[],
): Record<WarRoomRosterStatus, number> {
  const counts: Record<WarRoomRosterStatus, number> = {
    ACTIVE: 0,
    IR: 0,
    TAXI: 0,
  };

  players.forEach((player) => {
    counts[player.status] += 1;
  });

  return counts;
}

function createPositionCounts(): Record<WarRoomRosterPosition, number> {
  return {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    K: 0,
    DST: 0,
  };
}

function normalizePosition(position: string | null): WarRoomRosterPosition | null {
  if (position === "DEF") {
    return "DST";
  }

  return WAR_ROOM_ROSTER_POSITIONS.includes(position as WarRoomRosterPosition)
    ? (position as WarRoomRosterPosition)
    : null;
}

function findDuplicates(values: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  });

  return [...duplicates];
}
