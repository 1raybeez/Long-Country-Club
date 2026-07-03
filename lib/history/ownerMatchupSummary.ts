import { loadAllMatchups } from "./matchups";
import { getRivalriesByOwner } from "./rivalries";

export interface OwnerMatchupSummary {
  readonly ownerId: string;
  readonly games: number;
  readonly wins: number;
  readonly losses: number;
  readonly ties: number;
  readonly winPercentage: number | null;
  readonly pointsFor: number;
  readonly pointsAgainst: number;
  readonly averagePointsFor: number | null;
  readonly averagePointsAgainst: number | null;
  readonly playoffGames: number;
  readonly playoffWins: number;
  readonly playoffLosses: number;
  readonly championshipGames: number;
  readonly championshipWins: number;
  readonly biggestWinMargin: number | null;
  readonly biggestLossMargin: number | null;
  readonly closestGameMargin: number | null;
  readonly topRivalryOwnerId: string | null;
  readonly nemesisOwnerId: string | null;
  readonly favoriteVictimOwnerId: string | null;
}

export function getOwnerMatchupSummary(ownerId: string): OwnerMatchupSummary {
  const matchups = loadAllMatchups().filter(
    (matchup) => matchup.ownerAId === ownerId || matchup.ownerBId === ownerId
  );

  let wins = 0;
  let losses = 0;
  let ties = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;
  let playoffGames = 0;
  let playoffWins = 0;
  let playoffLosses = 0;
  let championshipGames = 0;
  let championshipWins = 0;

  const winMargins: number[] = [];
  const lossMargins: number[] = [];
  const gameMargins: number[] = [];

  matchups.forEach((matchup) => {
    const isOwnerA = matchup.ownerAId === ownerId;
    const ownerScore = isOwnerA ? matchup.ownerAScore : matchup.ownerBScore;
    const opponentScore = isOwnerA ? matchup.ownerBScore : matchup.ownerAScore;

    if (ownerScore === null || opponentScore === null) {
      return;
    }

    pointsFor += ownerScore;
    pointsAgainst += opponentScore;

    const margin = Math.abs(ownerScore - opponentScore);

    if (margin > 0) {
      gameMargins.push(margin);
    }

    const isPlayoff =
      matchup.type === "playoff" || matchup.type === "championship";

    if (isPlayoff) {
      playoffGames += 1;
    }

    if (matchup.type === "championship") {
      championshipGames += 1;
    }

    if (!matchup.winnerOwnerId) {
      ties += 1;
      return;
    }

    if (matchup.winnerOwnerId === ownerId) {
      wins += 1;
      winMargins.push(margin);

      if (isPlayoff) {
        playoffWins += 1;
      }

      if (matchup.type === "championship") {
        championshipWins += 1;
      }
    } else {
      losses += 1;
      lossMargins.push(margin);

      if (isPlayoff) {
        playoffLosses += 1;
      }
    }
  });

  const rivalries = getRivalriesByOwner(ownerId);
  const topRivalry = rivalries[0] ?? null;

  const favoriteVictim =
    rivalries
      .map((rivalry) => {
        const isOwnerA = rivalry.ownerA === ownerId;
        const opponentId = isOwnerA ? rivalry.ownerB : rivalry.ownerA;
        const ownerWins = isOwnerA ? rivalry.winsA : rivalry.winsB;
        const opponentWins = isOwnerA ? rivalry.winsB : rivalry.winsA;

        return {
          opponentId,
          margin: ownerWins - opponentWins,
          meetings: rivalry.meetings,
        };
      })
      .filter((record) => record.margin > 0)
      .sort((a, b) => {
        if (b.margin !== a.margin) return b.margin - a.margin;
        return b.meetings - a.meetings;
      })[0] ?? null;

  const nemesis =
    rivalries
      .map((rivalry) => {
        const isOwnerA = rivalry.ownerA === ownerId;
        const opponentId = isOwnerA ? rivalry.ownerB : rivalry.ownerA;
        const ownerWins = isOwnerA ? rivalry.winsA : rivalry.winsB;
        const opponentWins = isOwnerA ? rivalry.winsB : rivalry.winsA;

        return {
          opponentId,
          margin: opponentWins - ownerWins,
          meetings: rivalry.meetings,
        };
      })
      .filter((record) => record.margin > 0)
      .sort((a, b) => {
        if (b.margin !== a.margin) return b.margin - a.margin;
        return b.meetings - a.meetings;
      })[0] ?? null;

  return {
    ownerId,
    games: wins + losses + ties,
    wins,
    losses,
    ties,
    winPercentage:
      wins + losses + ties > 0
        ? Number((wins / (wins + losses + ties)).toFixed(3))
        : null,
    pointsFor: Number(pointsFor.toFixed(2)),
    pointsAgainst: Number(pointsAgainst.toFixed(2)),
    averagePointsFor:
      matchups.length > 0 ? Number((pointsFor / matchups.length).toFixed(2)) : null,
    averagePointsAgainst:
      matchups.length > 0
        ? Number((pointsAgainst / matchups.length).toFixed(2))
        : null,
    playoffGames,
    playoffWins,
    playoffLosses,
    championshipGames,
    championshipWins,
    biggestWinMargin: winMargins.length
      ? Number(Math.max(...winMargins).toFixed(2))
      : null,
    biggestLossMargin: lossMargins.length
      ? Number(Math.max(...lossMargins).toFixed(2))
      : null,
    closestGameMargin: gameMargins.length
      ? Number(Math.min(...gameMargins).toFixed(2))
      : null,
    topRivalryOwnerId: topRivalry
      ? topRivalry.ownerA === ownerId
        ? topRivalry.ownerB
        : topRivalry.ownerA
      : null,
    nemesisOwnerId: nemesis?.opponentId ?? null,
    favoriteVictimOwnerId: favoriteVictim?.opponentId ?? null,
  };
}