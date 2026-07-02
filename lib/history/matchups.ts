export type MatchupType = "regularSeason" | "playoff" | "championship" | "unknown";

export interface HistoricalMatchup {
  readonly season: number;
  readonly week: number | null;
  readonly type: MatchupType;
  readonly ownerAId: string;
  readonly ownerBId: string;
  readonly ownerAScore: number | null;
  readonly ownerBScore: number | null;
  readonly winnerOwnerId: string | null;
  readonly loserOwnerId: string | null;
  readonly notes?: readonly string[];
}

import { generateHistoricalMatchups } from "./generateMatchups";

export function loadAllMatchups(): readonly HistoricalMatchup[] {
  return generateHistoricalMatchups();
}

export function loadMatchupsBySeason(
  season: number
): readonly HistoricalMatchup[] {
  return loadAllMatchups().filter((matchup) => matchup.season === season);
}

export function getMatchupsByOwner(
  ownerId: string
): readonly HistoricalMatchup[] {
  return loadAllMatchups().filter(
    (matchup) => matchup.ownerAId === ownerId || matchup.ownerBId === ownerId
  );
}