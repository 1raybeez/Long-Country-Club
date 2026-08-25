import currentRosterArtifact from "../../data/current/rosters/2026.json";
import { ACTIVE_LCC_OWNERS } from "../lccOwners";
import { LCC_CURRENT_SEASON, LCC_CURRENT_LEAGUE_ID } from "../leagueConstants";
import type { HistoricalRosterSnapshot } from "../history/rosterSnapshots";

type CurrentRosterArtifact = {
  readonly season: number;
  readonly leagueId: string;
  readonly capturedAt: string;
  readonly source: {
    readonly provider: "Sleeper";
    readonly endpoint: string;
    readonly retrieval: "explicit-refresh";
  };
  readonly rosters: readonly {
    readonly rosterId: number;
    readonly ownerId: string | null;
    readonly sleeperUserId: string | null;
    readonly players: readonly string[];
    readonly starters: readonly string[];
    readonly reserve: readonly string[];
    readonly taxi: readonly string[];
  }[];
};

const artifact = currentRosterArtifact as CurrentRosterArtifact;

export type CurrentWarRoomRosterSnapshot = HistoricalRosterSnapshot & {
  readonly capturedAt: string;
  readonly leagueId: string;
  readonly sourcePath: "data/current/rosters/2026.json";
};

export function getCurrentWarRoomRosterSnapshot(
  ownerId: string,
): CurrentWarRoomRosterSnapshot | null {
  const roster = artifact.rosters.find((candidate) => candidate.ownerId === ownerId);

  if (!roster) {
    return null;
  }

  return {
    season: artifact.season,
    week: null,
    ownerId: roster.ownerId,
    sleeperUserId: roster.sleeperUserId,
    rosterId: roster.rosterId,
    playerIds: roster.players,
    starterIds: roster.starters,
    nonstarterIds: roster.players.filter((playerId) => !roster.starters.includes(playerId)),
    reserveIds: roster.reserve,
    taxiIds: roster.taxi,
    snapshotKind: "seasonRoster",
    source: "seasonRosters",
    actualWeeklyLineupAvailable: false,
    capturedAt: artifact.capturedAt,
    leagueId: artifact.leagueId,
    sourcePath: "data/current/rosters/2026.json",
  };
}

export function getCurrentWarRoomRosterArtifact() {
  return {
    ...artifact,
    expectedSeason: LCC_CURRENT_SEASON,
    expectedLeagueId: LCC_CURRENT_LEAGUE_ID,
    activeOwnerIds: ACTIVE_LCC_OWNERS.map((owner) => owner.id),
  };
}
