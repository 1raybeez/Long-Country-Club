import recordsIndex from '../../data/history/records/index.json';
import type { HistoricalRecordEntry } from '../types/record';

// TODO: Migrate awards/records once canonical standings, drafts, and finances are populated.
const RECORDS = recordsIndex as readonly HistoricalRecordEntry[];

export function loadAllRecords(): readonly HistoricalRecordEntry[] {
  return RECORDS;
}

export function loadRecordsBySeason(
  season: number
): readonly HistoricalRecordEntry[] {
  return RECORDS.filter((record) => record.season === season);
}

export function getRecordsByOwner(
  ownerId: string
): readonly HistoricalRecordEntry[] {
  return RECORDS.filter((record) => record.ownerId === ownerId);
}
