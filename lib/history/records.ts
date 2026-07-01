import type { HistoricalRecordEntry } from "../types/record";
import { getAllOwnerCareerSummaries } from "./career";

export function loadAllRecords(): readonly HistoricalRecordEntry[] {
  const careers = getAllOwnerCareerSummaries();

  const records: HistoricalRecordEntry[] = [];

  careers.forEach((owner) => {
    records.push({
      season: 0,
      id: `career-titles-${owner.ownerId}`,
      scope: "career",
      category: "Championships",
      label: "Career Championships",
      ownerId: owner.ownerId,
      value: owner.titleCount,
      source: "career",
    });

    records.push({
      season: 0,
      id: `career-podiums-${owner.ownerId}`,
      scope: "career",
      category: "Podiums",
      label: "Career Podiums",
      ownerId: owner.ownerId,
      value: owner.podiumCount,
      source: "career",
    });

    records.push({
      season: 0,
      id: `career-average-${owner.ownerId}`,
      scope: "career",
      category: "Average Finish",
      label: "Career Average Finish",
      ownerId: owner.ownerId,
      value: owner.averageFinish,
      source: "career",
    });

    records.push({
      season: 0,
      id: `career-playoffs-${owner.ownerId}`,
      scope: "career",
      category: "Playoff Appearances",
      label: "Career Playoff Appearances",
      ownerId: owner.ownerId,
      value: owner.playoffAppearances,
      source: "career",
    });
  });

  return records;
}

export function loadRecordsBySeason(
  season: number
): readonly HistoricalRecordEntry[] {
  return loadAllRecords().filter((record) => record.season === season);
}

export function getRecordsByOwner(
  ownerId: string
): readonly HistoricalRecordEntry[] {
  return loadAllRecords().filter((record) => record.ownerId === ownerId);
}