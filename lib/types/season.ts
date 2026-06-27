import type { HistoricalAwardRecord } from './award';
import type { SeasonDraftData } from './draft';
import type { SeasonFinancialData } from './financial';
import type { KeeperRecord } from './keeper';
import type { HistoricalRecordEntry } from './record';
import type { RuleRecord } from './rule';
import type { SeasonStandingData } from './standing';
import type { VoteRecord } from './vote';

export type LccSeasonEra = 'two-keeper' | 'dynasty';

export interface SeasonMetadataRecord {
  readonly season: number;
  readonly era?: LccSeasonEra | null;
  readonly sleeperLeagueId?: string | null;
  readonly championOwnerId?: string | null;
  readonly runnerUpOwnerId?: string | null;
  readonly thirdPlaceOwnerId?: string | null;
  readonly toiletBowlOwnerId?: string | null;
  readonly notes?: readonly string[];
}

export interface AlmanacSeason {
  readonly season: number;
  readonly era: LccSeasonEra | null;
  readonly sleeperLeagueId: string | null;
  readonly championOwnerId: string | null;
  readonly runnerUpOwnerId: string | null;
  readonly thirdPlaceOwnerId: string | null;
  readonly toiletBowlOwnerId: string | null;
  readonly standings: SeasonStandingData | null;
  readonly financial: SeasonFinancialData | null;
  readonly draft: SeasonDraftData | null;
  readonly keepers: readonly KeeperRecord[];
  readonly votes: readonly VoteRecord[];
  readonly rules: readonly RuleRecord[];
  readonly awards: readonly HistoricalAwardRecord[];
  readonly records: readonly HistoricalRecordEntry[];
  readonly notes: readonly string[];
}
