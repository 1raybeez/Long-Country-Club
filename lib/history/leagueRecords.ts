import { LCC_CURRENT_SEASON } from "../leagueConstants";
import { getLccOwnerById } from "../lccOwners";
import { getAllOwnerCareerSummaries } from "./career";
import { loadAllMatchups } from "./matchups";

export const SLEEPER_RECORD_START_SEASON = 2019;
export const SLEEPER_RECORD_END_SEASON = LCC_CURRENT_SEASON - 1;

export type OwnerRecord = {
  readonly ownerId: string;
  readonly ownerName: string;
  readonly value: number;
};

export type GameRecord = {
  readonly season: number;
  readonly week: number | null;
  readonly ownerAId: string;
  readonly ownerBId: string;
  readonly ownerAScore: number;
  readonly ownerBScore: number;
  readonly margin: number;
};

export type SeasonRecord = {
  season: number;
  ownerId: string;
  ownerName: string;
  points: number;
  wins: number;
  losses: number;
  ties: number;
  winningPercentage: number;
};

type OwnerAggregate = {
  wins: number;
  losses: number;
  ties: number;
  points: number;
};

function ownerName(ownerId: string) {
  return getLccOwnerById(ownerId)?.displayName ?? ownerId;
}

function winningPercentage(wins: number, losses: number, ties: number) {
  const games = wins + losses + ties;
  return games ? (wins + ties * 0.5) / games : 0;
}

function supportedMatchups() {
  return loadAllMatchups().filter(
    (matchup) =>
      matchup.season >= SLEEPER_RECORD_START_SEASON &&
      matchup.season <= SLEEPER_RECORD_END_SEASON &&
      matchup.ownerAScore !== null &&
      matchup.ownerBScore !== null,
  );
}

export function getSleeperEraOwnerRecords() {
  const aggregates = new Map<string, OwnerAggregate>();

  supportedMatchups().forEach((matchup) => {
    const ownerA = aggregates.get(matchup.ownerAId) ?? { wins: 0, losses: 0, ties: 0, points: 0 };
    const ownerB = aggregates.get(matchup.ownerBId) ?? { wins: 0, losses: 0, ties: 0, points: 0 };
    ownerA.points += matchup.ownerAScore ?? 0;
    ownerB.points += matchup.ownerBScore ?? 0;

    if (matchup.winnerOwnerId === null) {
      ownerA.ties += 1;
      ownerB.ties += 1;
    } else if (matchup.winnerOwnerId === matchup.ownerAId) {
      ownerA.wins += 1;
      ownerB.losses += 1;
    } else {
      ownerB.wins += 1;
      ownerA.losses += 1;
    }

    aggregates.set(matchup.ownerAId, ownerA);
    aggregates.set(matchup.ownerBId, ownerB);
  });

  return [...aggregates.entries()].map(([ownerId, aggregate]) => ({
    ownerId,
    ownerName: ownerName(ownerId),
    wins: aggregate.wins,
    losses: aggregate.losses,
    ties: aggregate.ties,
    points: aggregate.points,
    winningPercentage: winningPercentage(aggregate.wins, aggregate.losses, aggregate.ties),
  }));
}

export function getLeagueRecords() {
  const career = getAllOwnerCareerSummaries();
  const sleeperOwners = getSleeperEraOwnerRecords();
  const placementLeaders: OwnerRecord[] = career.map((owner) => ({
    ownerId: owner.ownerId,
    ownerName: ownerName(owner.ownerId),
    value: owner.titleCount,
  }));
  const playoffLeaders: OwnerRecord[] = career.map((owner) => ({
    ownerId: owner.ownerId,
    ownerName: ownerName(owner.ownerId),
    value: owner.playoffAppearances,
  }));
  const championshipAppearanceLeaders: OwnerRecord[] = career.map((owner) => ({
    ownerId: owner.ownerId,
    ownerName: ownerName(owner.ownerId),
    value: owner.championships + owner.runnerUpFinishes,
  }));

  return {
    mostWins: sleeperOwners.map(({ ownerId, ownerName, wins }) => ({ ownerId, ownerName, value: wins })),
    bestWinningPercentage: sleeperOwners.map(({ ownerId, ownerName, winningPercentage }) => ({ ownerId, ownerName, value: winningPercentage })),
    championships: placementLeaders,
    playoffAppearances: playoffLeaders,
    championshipAppearances: championshipAppearanceLeaders,
    totalPoints: sleeperOwners.map(({ ownerId, ownerName, points }) => ({ ownerId, ownerName, value: points })),
  };
}

export function getSingleSeasonRecords() {
  const seasons = new Map<string, SeasonRecord>();

  supportedMatchups().forEach((matchup) => {
    const values = [
      [matchup.ownerAId, matchup.ownerAScore, matchup.winnerOwnerId === matchup.ownerAId, matchup.winnerOwnerId === null],
      [matchup.ownerBId, matchup.ownerBScore, matchup.winnerOwnerId === matchup.ownerBId, matchup.winnerOwnerId === null],
    ] as const;

    values.forEach(([ownerId, score, won, tied]) => {
      const key = `${matchup.season}:${ownerId}`;
      const current = seasons.get(key) ?? { season: matchup.season, ownerId, ownerName: ownerName(ownerId), points: 0, wins: 0, losses: 0, ties: 0, winningPercentage: 0 };
      current.points += score ?? 0;
      if (tied) current.ties += 1;
      else if (won) current.wins += 1;
      else current.losses += 1;
      current.winningPercentage = winningPercentage(current.wins, current.losses, current.ties);
      seasons.set(key, current);
    });
  });

  return [...seasons.values()];
}

export function getGameRecords() {
  const games: GameRecord[] = supportedMatchups().map((matchup) => ({
    season: matchup.season,
    week: matchup.week,
    ownerAId: matchup.ownerAId,
    ownerBId: matchup.ownerBId,
    ownerAScore: matchup.ownerAScore as number,
    ownerBScore: matchup.ownerBScore as number,
    margin: Math.abs((matchup.ownerAScore as number) - (matchup.ownerBScore as number)),
  }));

  return {
    biggestBlowout: games.reduce((best, game) => (game.margin > best.margin ? game : best), games[0]),
    closestGame: games.reduce((best, game) => (game.margin < best.margin ? game : best), games[0]),
  };
}

export function getOwnerDisplayName(ownerId: string) {
  return ownerName(ownerId);
}
