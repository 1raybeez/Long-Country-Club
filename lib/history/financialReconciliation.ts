import type {
  ReconciliationStatus,
  SeasonFinancialData,
} from '../types/financial';
import { LCC_CURRENT_SEASON } from '../leagueConstants';

export interface SeasonReconciliation {
  readonly season: number;
  readonly status: ReconciliationStatus;
  readonly notes: readonly string[];
}

const RECONCILIATION_NOTES: Record<number, SeasonReconciliation> = {
  2014: { season: 2014, status: 'reconciled', notes: [] },
  2015: { season: 2015, status: 'reconciled', notes: [] },
  2016: {
    season: 2016,
    status: 'reconciled',
    notes: ["Jeffrey's documented advance-to-playoffs value is $20 instead of the otherwise visible $25."],
  },
  2017: { season: 2017, status: 'reconciled', notes: [] },
  2018: {
    season: 2018,
    status: 'reconciled',
    notes: ['Advancement-based payout columns are preserved as historical records.'],
  },
  2019: {
    season: 2019,
    status: 'reconciled',
    notes: ['Visible advancement values are preserved in notes and are not included in Amount Won.'],
  },
  2020: {
    season: 2020,
    status: 'reconciled',
    notes: ['The source footer and visible entry-fee rows differ; the source record remains unchanged.'],
  },
  2021: {
    season: 2021,
    status: 'reconciled',
    notes: ['Rollover values are preserved in source notes rather than a dedicated field.'],
  },
  2022: {
    season: 2022,
    status: 'documented-discrepancy',
    notes: ['Manager payout total is $460 while award total is $600.'],
  },
  2023: {
    season: 2023,
    status: 'documented-discrepancy',
    notes: ['Manager payout total is $380 while award total is $600.'],
  },
  2024: {
    season: 2024,
    status: 'documented-discrepancy',
    notes: ['Manager payout total is $615 while award total is $755.'],
  },
  2025: {
    season: 2025,
    status: 'reconciled',
    notes: ['Recorded payout totals reconcile, but cash settlement and actual ring cost remain unresolved.'],
  },
  [LCC_CURRENT_SEASON]: {
    season: LCC_CURRENT_SEASON,
    status: 'pending',
    notes: ['Current-season commissioner ledger has not been initialized.'],
  },
};

export function getSeasonReconciliation(season: number): SeasonReconciliation {
  return (
    RECONCILIATION_NOTES[season] ?? {
      season,
      status: 'pending',
      notes: ['No reconciliation classification has been recorded.'],
    }
  );
}

export function withReconciliationMetadata(
  seasonData: SeasonFinancialData
): SeasonFinancialData {
  const reconciliation = getSeasonReconciliation(seasonData.season);

  return {
    ...seasonData,
    reconciliationStatus:
      seasonData.reconciliationStatus ?? reconciliation.status,
    reconciliationNotes: seasonData.reconciliationNotes ?? reconciliation.notes,
  };
}
