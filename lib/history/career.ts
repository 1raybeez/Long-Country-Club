import { loadAllStandings } from "./standings";

export type OwnerCareerSummary = {
  ownerId: string;
  seasons: number;
  championships: number;
  runnerUpFinishes: number;
  thirdPlaceFinishes: number;
  podiums: number;
  toiletBowls: number;
  bestFinish: number | null;
  worstFinish: number | null;
  averageFinish: number | null;
};

function getAllStandingRecords() {
  return loadAllStandings().flatMap((season) => season.standings);
}

export function getOwnerCareerSummary(ownerId: string): OwnerCareerSummary {
  const records = getAllStandingRecords().filter(
    (record) => record.ownerId === ownerId
  );

  const finishes = records
    .map((record) => record.finalPlace)
    .filter((place): place is number => typeof place === "number");

  const championships = finishes.filter((place) => place === 1).length;
  const runnerUpFinishes = finishes.filter((place) => place === 2).length;
  const thirdPlaceFinishes = finishes.filter((place) => place === 3).length;
  const podiums = finishes.filter((place) => place >= 1 && place <= 3).length;
  const toiletBowls = finishes.filter((place) => place === 12).length;

  return {
    ownerId,
    seasons: records.length,
    championships,
    runnerUpFinishes,
    thirdPlaceFinishes,
    podiums,
    toiletBowls,
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