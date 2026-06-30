import awardsIndex from "../../data/history/awards/index.json";
import type { AwardRecord as FinancialAwardRecord } from "../types/financial";
import type { HistoricalAwardRecord } from "../types/award";
import { loadAllSeasonFinancialData } from "./financial";
import { loadAllSeasonSummaries } from "./seasonSummary";

const MANUAL_AWARDS = awardsIndex as readonly HistoricalAwardRecord[];

function placementAwardId(season: number, type: HistoricalAwardRecord["type"]) {
  return `${season}-${type}`;
}

function weeklyHighAwardId(season: number, award: FinancialAwardRecord) {
  return `${season}-weekly-high-${award.week ?? "unknown"}-${award.managerId ?? award.managerName}`;
}

function createPlacementAwards(): HistoricalAwardRecord[] {
  return loadAllSeasonSummaries().flatMap((season) => {
    const awards: HistoricalAwardRecord[] = [];

    if (season.championOwnerId) {
      awards.push({
        season: season.season,
        id: placementAwardId(season.season, "champion"),
        type: "champion",
        ownerId: season.championOwnerId,
        label: "Champion",
        notes: ["Generated from historical standings."],
      });
    }

    if (season.runnerUpOwnerId) {
      awards.push({
        season: season.season,
        id: placementAwardId(season.season, "runnerUp"),
        type: "runnerUp",
        ownerId: season.runnerUpOwnerId,
        label: "Runner-up",
        notes: ["Generated from historical standings."],
      });
    }

    if (season.thirdPlaceOwnerId) {
      awards.push({
        season: season.season,
        id: placementAwardId(season.season, "thirdPlace"),
        type: "thirdPlace",
        ownerId: season.thirdPlaceOwnerId,
        label: "Third Place",
        notes: ["Generated from historical standings."],
      });
    }

    if (season.toiletBowlOwnerId) {
      awards.push({
        season: season.season,
        id: placementAwardId(season.season, "toiletBowl"),
        type: "toiletBowl",
        ownerId: season.toiletBowlOwnerId,
        label: "Toilet Bowl",
        notes: ["Generated from historical standings."],
      });
    }

    return awards;
  });
}

function createWeeklyHighAwards(): HistoricalAwardRecord[] {
  return loadAllSeasonFinancialData().flatMap((season) =>
    season.awards
      .filter((award) => award.type === "weeklyHigh")
      .map((award) => ({
        season: season.season,
        id: weeklyHighAwardId(season.season, award),
        type: "weeklyHigh" as const,
        ownerId: award.managerId ?? null,
        managerName: award.managerName,
        week: award.week ?? null,
        label: award.description ?? `Week ${award.week ?? "?"} High Score`,
        value: award.amount,
        notes: award.notes ?? ["Generated from historical financial awards."],
      }))
  );
}

function generatedAwards(): HistoricalAwardRecord[] {
  return [...createPlacementAwards(), ...createWeeklyHighAwards()];
}

export function loadAllAwards(): readonly HistoricalAwardRecord[] {
  return [...MANUAL_AWARDS, ...generatedAwards()].sort((a, b) => {
    if (b.season !== a.season) {
      return b.season - a.season;
    }

    return a.id.localeCompare(b.id);
  });
}

export function loadAwardsBySeason(
  season: number
): readonly HistoricalAwardRecord[] {
  return loadAllAwards().filter((award) => award.season === season);
}

export function getAwardsByOwner(
  ownerId: string
): readonly HistoricalAwardRecord[] {
  return loadAllAwards().filter((award) => award.ownerId === ownerId);
}