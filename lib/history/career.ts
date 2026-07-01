import { loadAllStandings } from "./standings";

export type OwnerSeasonPlacement = {
  season: number;
  era: string | null;
  place: number;
};

export type OwnerCareerSummary = {
  ownerId: string;
  seasons: number;
  seasonPlacements: OwnerSeasonPlacement[];
  championships: number;
  runnerUpFinishes: number;
  thirdPlaceFinishes: number;
  podiums: number;
  toiletBowls: number;
  playoffAppearances: number;
  bestFinish: number | null;
  worstFinish: number | null;
  averageFinish: number | null;
  titleCount: number;
  podiumCount: number;
  toiletBowlCount: number;
  activeSeasonCount: number;
};

function getAllStandingRecords() {
  return loadAllStandings().flatMap((season) =>
    season.standings.map((record) => ({
      ...record,
      season: season.season,
      era: season.era,
    }))
  );
}

export function getOwnerCareerSummary(ownerId: string): OwnerCareerSummary {
  const records = getAllStandingRecords().filter(
    (record) => record.ownerId === ownerId
  );

  const seasonPlacements = records
    .filter((record) => typeof record.finalPlace === "number")
    .map((record) => ({
      season: record.season,
      era: record.era ?? null,
      place: record.finalPlace as number,
    }))
    .sort((a, b) => a.season - b.season);

  const finishes = seasonPlacements.map((record) => record.place);

  const championships = finishes.filter((place) => place === 1).length;
  const runnerUpFinishes = finishes.filter((place) => place === 2).length;
  const thirdPlaceFinishes = finishes.filter((place) => place === 3).length;
  const podiums = finishes.filter((place) => place >= 1 && place <= 3).length;
  const toiletBowls = finishes.filter((place) => place === 12).length;
  const playoffAppearances = finishes.filter((place) => place >= 1 && place <= 6).length;

  return {
    ownerId,
    seasons: records.length,
    seasonPlacements,
    championships,
    runnerUpFinishes,
    thirdPlaceFinishes,
    podiums,
    toiletBowls,
    playoffAppearances,
    bestFinish: finishes.length ? Math.min(...finishes) : null,
    worstFinish: finishes.length ? Math.max(...finishes) : null,
    averageFinish: finishes.length
      ? Number(
          (
            finishes.reduce((total, place) => total + place, 0) /
            finishes.length
          ).toFixed(2)
        )
      : null,
    titleCount: championships,
    podiumCount: podiums,
    toiletBowlCount: toiletBowls,
    activeSeasonCount: records.length,
  };
}

export function getAllOwnerCareerSummaries(): OwnerCareerSummary[] {
  const ownerIds = Array.from(
    new Set(
      getAllStandingRecords()
        .map((record) => record.ownerId)
        .filter((ownerId): ownerId is string => typeof ownerId === "string")
    )
  );

  return ownerIds
    .map((ownerId) => getOwnerCareerSummary(ownerId))
    .sort((a, b) => {
      if (b.championships !== a.championships) {
        return b.championships - a.championships;
      }

      if (b.podiums !== a.podiums) {
        return b.podiums - a.podiums;
      }

      return (a.averageFinish ?? 99) - (b.averageFinish ?? 99);
    });
}