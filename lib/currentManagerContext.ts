import { getLccOwnerById } from "./lccOwners";
import {
  loadCurrentSeasonStandings,
  type CurrentStanding,
} from "./currentStandings";
import {
  loadCurrentWeekSnapshot,
  type CurrentWeekSnapshot,
} from "./currentWeekSnapshot";
import { formatMatchupStatus, type MatchupStatus } from "./matchupStatus";
import { LCC_CURRENT_SEASON } from "./leagueConstants";
import type { HomeSeasonPhase } from "./homeCurrentSeason";
import type { PostseasonContext } from "./postseason/types";
import { getCurrentPostseasonContext } from "./postseason/bracketAdapter";

export type CurrentManagerStanding = CurrentStanding & {
  readonly rank: number;
};

export type CurrentManagerMatchup = {
  readonly week: number;
  readonly opponentOwnerId: string;
  readonly opponentName: string;
  readonly opponentDisplayName: string;
  readonly ownerScore: number | null;
  readonly opponentScore: number | null;
  readonly status: MatchupStatus;
  readonly statusLabel: string;
  readonly postseason: PostseasonContext | null;
};

export type CurrentManagerSeasonContext = {
  readonly season: number;
  readonly phase: HomeSeasonPhase;
  readonly franchiseName: string;
  readonly standing: CurrentManagerStanding | null;
  readonly matchup: CurrentManagerMatchup | null;
  readonly postseasonStatus: "complete" | "unresolved" | "unavailable" | null;
  readonly source: "snapshot" | "unavailable";
};

export function buildCurrentManagerSeasonContext(
  ownerId: string,
  standings: readonly CurrentStanding[] | null | undefined,
  snapshot: CurrentWeekSnapshot | null | undefined
): CurrentManagerSeasonContext {
  const owner = getLccOwnerById(ownerId);
  const standingIndex = standings?.findIndex(
    (candidate) => candidate.franchiseId === ownerId
  ) ?? -1;
  const standing =
    standingIndex >= 0 && standings
      ? { ...standings[standingIndex], rank: standingIndex + 1 }
      : null;
  const currentMatchup = snapshot?.matchups.find(
    (matchup) => matchup.ownerAId === ownerId || matchup.ownerBId === ownerId
  );
  const ownerIsA = currentMatchup?.ownerAId === ownerId;
  const opponentId = currentMatchup
    ? ownerIsA
      ? currentMatchup.ownerBId
      : currentMatchup.ownerAId
    : null;
  const opponent = opponentId ? getLccOwnerById(opponentId) : null;
  const status = currentMatchup?.currentStatus ?? null;
  const postseason = getCurrentPostseasonContext(snapshot?.postseason, ownerId);

  return {
    season: snapshot?.season ?? LCC_CURRENT_SEASON,
    phase: snapshot?.state.phase ?? "UNKNOWN",
    franchiseName: owner?.managerPage.sleeperName ?? "Current franchise",
    standing,
    matchup:
      (currentMatchup && opponent && typeof currentMatchup.week === "number" && status)
        || postseason?.isBye
        ? {
            week: currentMatchup?.week ?? snapshot?.week ?? 0,
            opponentOwnerId: opponent?.id ?? "",
            opponentName: opponent?.managerPage.sleeperName ?? "",
            opponentDisplayName: opponent?.displayName ?? "",
            ownerScore: currentMatchup ? (ownerIsA ? currentMatchup.ownerAScore : currentMatchup.ownerBScore) : null,
            opponentScore: currentMatchup ? (ownerIsA ? currentMatchup.ownerBScore : currentMatchup.ownerAScore) : null,
            status: status ?? "UNKNOWN",
            statusLabel: postseason?.isBye ? "Bye" : formatMatchupStatus(status ?? undefined),
            postseason,
          }
      : null,
    postseasonStatus: snapshot?.postseason?.sourceStatus ?? null,
    source: snapshot ? "snapshot" : "unavailable",
  };
}

export async function loadCurrentManagerSeasonContext(
  ownerId: string
): Promise<CurrentManagerSeasonContext> {
  try {
    const snapshot = await loadCurrentWeekSnapshot();
    const standings = await loadCurrentSeasonStandings(
      snapshot.state.safeCompletedWeek,
      snapshot.season,
      snapshot.state.playoffWeekStart,
    );

    return buildCurrentManagerSeasonContext(ownerId, standings, snapshot);
  } catch {
    return buildCurrentManagerSeasonContext(ownerId, [], null);
  }
}
