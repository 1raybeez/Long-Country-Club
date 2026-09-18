import { getOwnerCareerSummary } from "./career";
import { loadAllSeasonSummaries } from "./seasonSummary";
import {
  getLccOwnerCareerSummary,
  type LccFinalPlacementTenureSpan,
} from "../lccFinalPlacements";
import { LCC_CURRENT_SEASON } from "../leagueConstants";
import type { LccOwnerStatus } from "../lccOwners";
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

export type VerifiedOwnerTenure = {
  seasons: readonly number[];
  spans: readonly LccFinalPlacementTenureSpan[];
  isCurrent: boolean;
  isInterrupted: boolean;
};

/**
 * Returns the verified ownership seasons represented by final placements,
 * plus the current season for an active canonical owner.
 */
export function getVerifiedOwnerTenure(
  ownerId: string,
  status: LccOwnerStatus
): VerifiedOwnerTenure {
  const placementTenure = getLccOwnerCareerSummary(ownerId).tenureSpans;
  const seasons = new Set(
    placementTenure.flatMap(({ startSeason, endSeason }) =>
      Array.from(
        { length: endSeason - startSeason + 1 },
        (_, index) => startSeason + index
      )
    )
  );

  if (status === "active") {
    seasons.add(LCC_CURRENT_SEASON);
  }

  const sortedSeasons = [...seasons].sort((a, b) => a - b);
  const spans = sortedSeasons.reduce<LccFinalPlacementTenureSpan[]>(
    (result, season) => {
      const previous = result.at(-1);

      if (!previous || previous.endSeason + 1 !== season) {
        result.push({ startSeason: season, endSeason: season });
      } else {
        result[result.length - 1] = { ...previous, endSeason: season };
      }

      return result;
    },
    []
  );

  return {
    seasons: sortedSeasons,
    spans,
    isCurrent: status === "active",
    isInterrupted: spans.length > 1,
  };
}

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
