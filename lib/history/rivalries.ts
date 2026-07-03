import { loadAllMatchups } from "./matchups";

export interface RivalrySummary {
  ownerA: string;
  ownerB: string;
  meetings: number;
  winsA: number;
  winsB: number;
  ties: number;
  pointsA: number;
  pointsB: number;
  playoffMeetings: number;
  championshipMeetings: number;
  firstSeason?: number;
  lastSeason?: number;
}

function rivalryKey(ownerA: string, ownerB: string) {
  return [ownerA, ownerB].sort().join("__");
}

export function loadAllRivalries(): RivalrySummary[] {
  const rivalries = new Map<string, RivalrySummary>();

  for (const matchup of loadAllMatchups()) {
    const [ownerA, ownerB] = [matchup.ownerAId, matchup.ownerBId].sort();
    const key = rivalryKey(ownerA, ownerB);

    const isFlipped = matchup.ownerAId !== ownerA;

    const pointsA = isFlipped
      ? matchup.ownerBScore ?? 0
      : matchup.ownerAScore ?? 0;
    const pointsB = isFlipped
      ? matchup.ownerAScore ?? 0
      : matchup.ownerBScore ?? 0;

    const existing =
      rivalries.get(key) ??
      {
        ownerA,
        ownerB,
        meetings: 0,
        winsA: 0,
        winsB: 0,
        ties: 0,
        pointsA: 0,
        pointsB: 0,
        playoffMeetings: 0,
        championshipMeetings: 0,
        firstSeason: matchup.season,
        lastSeason: matchup.season,
      };

    existing.meetings += 1;
    existing.pointsA += pointsA;
    existing.pointsB += pointsB;
    existing.firstSeason = Math.min(existing.firstSeason ?? matchup.season, matchup.season);
    existing.lastSeason = Math.max(existing.lastSeason ?? matchup.season, matchup.season);

    if (matchup.type === "playoff" || matchup.type === "championship") {
      existing.playoffMeetings += 1;
    }

    if (matchup.type === "championship") {
      existing.championshipMeetings += 1;
    }

    if (!matchup.winnerOwnerId) {
      existing.ties += 1;
    } else if (matchup.winnerOwnerId === ownerA) {
      existing.winsA += 1;
    } else if (matchup.winnerOwnerId === ownerB) {
      existing.winsB += 1;
    }

    rivalries.set(key, existing);
  }

  return [...rivalries.values()].sort((a, b) => {
    if (b.meetings !== a.meetings) return b.meetings - a.meetings;
    return `${a.ownerA}-${a.ownerB}`.localeCompare(`${b.ownerA}-${b.ownerB}`);
  });
}

export function getRivalriesByOwner(ownerId: string): RivalrySummary[] {
  return loadAllRivalries().filter(
    (rivalry) => rivalry.ownerA === ownerId || rivalry.ownerB === ownerId
  );
}