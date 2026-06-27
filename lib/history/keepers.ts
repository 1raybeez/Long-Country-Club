import keepersIndex from '../../data/history/keepers/index.json';
import type { KeeperRecord, SeasonKeeperData } from '../types/keeper';

// TODO: Migrate keeper tabs from the historical workbook into season-keyed JSON.
const KEEPER_SEASONS = keepersIndex as readonly SeasonKeeperData[];

export function loadAllKeeperSeasons(): readonly SeasonKeeperData[] {
  return KEEPER_SEASONS;
}

export function loadKeepersBySeason(season: number): SeasonKeeperData | null {
  return KEEPER_SEASONS.find((keeperSeason) => keeperSeason.season === season) ?? null;
}

export function getKeeperRecordsByOwner(
  ownerId: string
): readonly KeeperRecord[] {
  return KEEPER_SEASONS.flatMap((season) =>
    season.keepers.filter((keeper) => keeper.ownerId === ownerId)
  );
}
