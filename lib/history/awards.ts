import awardsIndex from '../../data/history/awards/index.json';
import type { HistoricalAwardRecord } from '../types/award';

// TODO: Migrate awards from final standings, financial awards, and Sleeper records.
const AWARDS = awardsIndex as readonly HistoricalAwardRecord[];

export function loadAllAwards(): readonly HistoricalAwardRecord[] {
  return AWARDS;
}

export function loadAwardsBySeason(
  season: number
): readonly HistoricalAwardRecord[] {
  return AWARDS.filter((award) => award.season === season);
}

export function getAwardsByOwner(
  ownerId: string
): readonly HistoricalAwardRecord[] {
  return AWARDS.filter((award) => award.ownerId === ownerId);
}
