import { getOwnerCareerSummary } from "./career";
import { loadAllSeasonSummaries } from "./seasonSummary";
import type {
  ManagerFinancialRecord,
  SeasonFinancialData,
} from "../types/financial";
import type { StandingRecord } from "../types/standing";

export type OwnerSeasonTimelineEntry = {
  season: number;
  era: string | null;
  standing: StandingRecord | null;
  financial: ManagerFinancialRecord | null;
  finalPlace: number | null;
  isChampion: boolean;
  isRunnerUp: boolean;
  isThirdPlace: boolean;
  isToiletBowl: boolean;
  payoutsReceived: number | null;
  balance: number | null;
  notes: string[];
};

export type OwnerTimeline = {
  ownerId: string;
  career: ReturnType<typeof getOwnerCareerSummary>;
  seasons: OwnerSeasonTimelineEntry[];
};

function findManagerFinancialRecord(
  financial: SeasonFinancialData | null,
  ownerId: string
): ManagerFinancialRecord | null {
  if (!financial) {
    return null;
  }

  return (
    financial.managers.find((record) => record.managerId === ownerId) ?? null
  );
}

export function getOwnerTimeline(ownerId: string): OwnerTimeline {
  const seasons = loadAllSeasonSummaries()
    .map((summary): OwnerSeasonTimelineEntry | null => {
      const standing =
        summary.standings?.standings.find(
          (record) => record.ownerId === ownerId
        ) ?? null;

      const financial = findManagerFinancialRecord(summary.financial, ownerId);

      if (!standing && !financial) {
        return null;
      }

      return {
        season: summary.season,
        era: summary.era,
        standing,
        financial,
        finalPlace: standing?.finalPlace ?? null,
        isChampion: summary.championOwnerId === ownerId,
        isRunnerUp: summary.runnerUpOwnerId === ownerId,
        isThirdPlace: summary.thirdPlaceOwnerId === ownerId,
        isToiletBowl: summary.toiletBowlOwnerId === ownerId,
        payoutsReceived: financial?.payoutsReceived ?? null,
        balance: financial?.balance ?? null,
        notes: [...summary.notes, ...(financial?.notes ?? [])],
      };
    })
    .filter((entry): entry is OwnerSeasonTimelineEntry => entry !== null);

  return {
    ownerId,
    career: getOwnerCareerSummary(ownerId),
    seasons,
  };
}