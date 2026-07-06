import { loadAllMatchups, type HistoricalMatchup } from "./matchups";

export interface HeadToHeadSummary {
  ownerAId: string;
  ownerBId: string;
  games: number;
  ownerAWins: number;
  ownerBWins: number;
  ties: number;
  regularSeasonGames: number;
  playoffGames: number;
  championshipGames: number;
  ownerAPoints: number;
  ownerBPoints: number;
  averageMargin: number;
  firstMeetingSeason: number | null;
  lastMeetingSeason: number | null;
  matchups: readonly HistoricalMatchup[];
}

export function getHeadToHead(
  ownerAId: string,
  ownerBId: string
): HeadToHeadSummary {
  const matchups = loadAllMatchups()
    .filter(
      (matchup) =>
        (matchup.ownerAId === ownerAId && matchup.ownerBId === ownerBId) ||
        (matchup.ownerAId === ownerBId && matchup.ownerBId === ownerAId)
    )
    .sort((a, b) => {
      if (a.season !== b.season) return a.season - b.season;
      return (a.week ?? 0) - (b.week ?? 0);
    });

  let ownerAWins = 0;
  let ownerBWins = 0;
  let ties = 0;
  let ownerAPoints = 0;
  let ownerBPoints = 0;
  let totalMargin = 0;

  for (const matchup of matchups) {
    const ownerAIsMatchupA = matchup.ownerAId === ownerAId;

    const ownerAScore = ownerAIsMatchupA
      ? matchup.ownerAScore
      : matchup.ownerBScore;

    const ownerBScore = ownerAIsMatchupA
      ? matchup.ownerBScore
      : matchup.ownerAScore;

    if (ownerAScore !== null) ownerAPoints += ownerAScore;
    if (ownerBScore !== null) ownerBPoints += ownerBScore;

    if (ownerAScore !== null && ownerBScore !== null) {
      totalMargin += Math.abs(ownerAScore - ownerBScore);
    }

    if (!matchup.winnerOwnerId) {
      ties += 1;
    } else if (matchup.winnerOwnerId === ownerAId) {
      ownerAWins += 1;
    } else if (matchup.winnerOwnerId === ownerBId) {
      ownerBWins += 1;
    }
  }

  const regularSeasonGames = matchups.filter(
    (matchup) => matchup.type === "regularSeason"
  ).length;

  const playoffGames = matchups.filter(
    (matchup) => matchup.type === "playoff" || matchup.type === "championship"
  ).length;

  const championshipGames = matchups.filter(
    (matchup) => matchup.type === "championship"
  ).length;

  return {
    ownerAId,
    ownerBId,
    games: matchups.length,
    ownerAWins,
    ownerBWins,
    ties,
    regularSeasonGames,
    playoffGames,
    championshipGames,
    ownerAPoints: Number(ownerAPoints.toFixed(2)),
    ownerBPoints: Number(ownerBPoints.toFixed(2)),
    averageMargin:
      matchups.length > 0 ? Number((totalMargin / matchups.length).toFixed(2)) : 0,
    firstMeetingSeason: matchups[0]?.season ?? null,
    lastMeetingSeason: matchups.at(-1)?.season ?? null,
    matchups,
  };
}