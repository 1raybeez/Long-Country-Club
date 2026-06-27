import standingsIndex from '../../data/history/standings/index.json';
import type { SeasonStandingData, StandingRecord } from '../types/standing';

// TODO: Migrate canonical final standings from data/history/lcc-final-standings.csv.
const STANDINGS = standingsIndex as readonly SeasonStandingData[];

export function loadAllStandings(): readonly SeasonStandingData[] {
  return STANDINGS;
}

export function loadStandingsBySeason(
  season: number
): SeasonStandingData | null {
  return STANDINGS.find((standing) => standing.season === season) ?? null;
}

export function getStandingRecordsByOwner(
  ownerId: string
): readonly StandingRecord[] {
  return STANDINGS.flatMap((season) =>
    season.standings.filter((standing) => standing.ownerId === ownerId)
  );
}
