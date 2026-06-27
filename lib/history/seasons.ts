import seasonIndex from '../../data/history/seasons/index.json';
import { loadAllAwards, loadAwardsBySeason } from './awards';
import { loadAllDrafts, loadDraftBySeason } from './drafts';
import { loadAllSeasonFinancialData } from './financial';
import { loadAllKeeperSeasons, loadKeepersBySeason } from './keepers';
import { loadAllRecords, loadRecordsBySeason } from './records';
import { loadAllRules, loadRulesBySeason } from './rules';
import { loadAllStandings, loadStandingsBySeason } from './standings';
import { loadAllVotes, loadVotesBySeason } from './votes';
import type { AlmanacSeason, SeasonMetadataRecord } from '../types/season';

// TODO: Migrate financial screenshots 2014-2025 into data/history/financial.
// TODO: Migrate final standings CSV into data/history/standings.
// TODO: Migrate keeper tabs into data/history/keepers.
// TODO: Migrate rule vote sheets/forms into data/history/votes and data/history/rules.
// TODO: Migrate draft history into data/history/drafts.
// TODO: Migrate awards/records into data/history/awards and data/history/records.
const SEASON_METADATA = seasonIndex as readonly SeasonMetadataRecord[];

export function loadAlmanacSeason(season: number): AlmanacSeason | null {
  if (!getKnownAlmanacSeasons().includes(season)) {
    return null;
  }

  const metadata = SEASON_METADATA.find((record) => record.season === season);
  const keepers = loadKeepersBySeason(season);

  return {
    season,
    era: metadata?.era ?? null,
    sleeperLeagueId: metadata?.sleeperLeagueId ?? null,
    championOwnerId: metadata?.championOwnerId ?? null,
    runnerUpOwnerId: metadata?.runnerUpOwnerId ?? null,
    thirdPlaceOwnerId: metadata?.thirdPlaceOwnerId ?? null,
    toiletBowlOwnerId: metadata?.toiletBowlOwnerId ?? null,
    standings: loadStandingsBySeason(season),
    financial:
      loadAllSeasonFinancialData().find((financial) => financial.season === season) ??
      null,
    draft: loadDraftBySeason(season),
    keepers: keepers?.keepers ?? [],
    votes: loadVotesBySeason(season),
    rules: loadRulesBySeason(season),
    awards: loadAwardsBySeason(season),
    records: loadRecordsBySeason(season),
    notes: metadata?.notes ?? [],
  };
}

export function loadAllAlmanacSeasons(): readonly AlmanacSeason[] {
  return getKnownAlmanacSeasons().flatMap((season) => {
    const almanacSeason = loadAlmanacSeason(season);
    return almanacSeason ? [almanacSeason] : [];
  });
}

export function getKnownAlmanacSeasons(): readonly number[] {
  return Array.from(
    new Set([
      ...SEASON_METADATA.map((record) => record.season),
      ...loadAllStandings().map((record) => record.season),
      ...loadAllSeasonFinancialData().map((record) => record.season),
      ...loadAllDrafts().map((record) => record.season),
      ...loadAllKeeperSeasons().map((record) => record.season),
      ...loadAllVotes().map((record) => record.season),
      ...loadAllRules().map((record) => record.season),
      ...loadAllAwards().map((record) => record.season),
      ...loadAllRecords().map((record) => record.season),
    ])
  ).sort((a, b) => a - b);
}
