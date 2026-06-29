import { loadAllSeasonFinancialData } from "./financial";
import { loadAllStandings, loadStandingsBySeason } from "./standings";
import type { SeasonFinancialData } from "../types/financial";
import type { SeasonStandingData, StandingEra } from "../types/standing";

export type SeasonSummary = {
  season: number;
  era: StandingEra | null;
  standings: SeasonStandingData | null;
  financial: SeasonFinancialData | null;
  championOwnerId: string | null;
  runnerUpOwnerId: string | null;
  thirdPlaceOwnerId: string | null;
  toiletBowlOwnerId: string | null;
  notes: string[];
};

type StandingRecordWithFinalPlace = SeasonStandingData["standings"][number] & {
  finalPlace: number;
  ownerId: string;
};

const financialBySeason = new Map<number, SeasonFinancialData>(
  loadAllSeasonFinancialData().map((financial) => [
    financial.season,
    financial,
  ])
);

function getStandingByPlace(
  standings: SeasonStandingData | null,
  place: number
): string | null {
  const ownerId = standings?.standings.find(
    (record) => record.finalPlace === place
  )?.ownerId;

  return typeof ownerId === "string" ? ownerId : null;
}

function getToiletBowlOwnerId(
  standings: SeasonStandingData | null
): string | null {
  if (!standings?.standings.length) {
    return null;
  }

  const recordsWithFinalPlace = standings.standings.filter(
    (record): record is StandingRecordWithFinalPlace =>
      typeof record.finalPlace === "number" &&
      typeof record.ownerId === "string"
  );

  if (!recordsWithFinalPlace.length) {
    return null;
  }

  const worstRecord = recordsWithFinalPlace.reduce((worst, record) =>
    record.finalPlace > worst.finalPlace ? record : worst
  );

  return worstRecord.ownerId;
}

export function loadSeasonSummary(season: number): SeasonSummary {
  const standings = loadStandingsBySeason(season) ?? null;
  const financial = financialBySeason.get(season) ?? null;

  const notes: string[] = [];

  if (!standings) {
    notes.push("No historical standings data available.");
  }

  if (!financial) {
    notes.push("No historical financial data available.");
  }

  return {
    season,
    era: standings?.era ?? null,
    standings,
    financial,
    championOwnerId: getStandingByPlace(standings, 1),
    runnerUpOwnerId: getStandingByPlace(standings, 2),
    thirdPlaceOwnerId: getStandingByPlace(standings, 3),
    toiletBowlOwnerId: getToiletBowlOwnerId(standings),
    notes,
  };
}

export function loadAllSeasonSummaries(): SeasonSummary[] {
  const seasons = Array.from(
    new Set(loadAllStandings().map((seasonData) => seasonData.season))
  ).sort((a, b) => a - b);

  return seasons.map(loadSeasonSummary);
}