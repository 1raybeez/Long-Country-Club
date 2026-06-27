import season2014 from '../../data/history/financial/2014.json';
import season2015 from '../../data/history/financial/2015.json';
import season2016 from '../../data/history/financial/2016.json';
import season2017 from '../../data/history/financial/2017.json';
import season2018 from '../../data/history/financial/2018.json';
import season2019 from '../../data/history/financial/2019.json';
import season2020 from '../../data/history/financial/2020.json';
import season2021 from '../../data/history/financial/2021.json';
import season2022 from '../../data/history/financial/2022.json';
import season2023 from '../../data/history/financial/2023.json';
import season2024 from '../../data/history/financial/2024.json';
import season2025 from '../../data/history/financial/2025.json';
import season2026 from '../../data/history/financial/2026.json';
import type {
  AwardRecord,
  FinancialAmount,
  LeagueFinancialTotals,
  ManagerFinancialHistoryEntry,
  SeasonFinancialData,
} from '../types/financial';

export const LCC_FINANCIAL_HISTORY_SEASONS = [
  2014,
  2015,
  2016,
  2017,
  2018,
  2019,
  2020,
  2021,
  2022,
  2023,
  2024,
  2025,
  2026,
] as const;

export type LccFinancialHistorySeason =
  (typeof LCC_FINANCIAL_HISTORY_SEASONS)[number];

const FINANCIAL_DATA_BY_SEASON = {
  2014: season2014,
  2015: season2015,
  2016: season2016,
  2017: season2017,
  2018: season2018,
  2019: season2019,
  2020: season2020,
  2021: season2021,
  2022: season2022,
  2023: season2023,
  2024: season2024,
  2025: season2025,
  2026: season2026,
} satisfies Record<LccFinancialHistorySeason, SeasonFinancialData>;

export function loadSeasonFinancialData(
  season: LccFinancialHistorySeason
): SeasonFinancialData {
  return FINANCIAL_DATA_BY_SEASON[season];
}

export function loadAllSeasonFinancialData(): readonly SeasonFinancialData[] {
  return LCC_FINANCIAL_HISTORY_SEASONS.map(loadSeasonFinancialData);
}

export function getManagerFinancialHistory(
  managerKey: string
): readonly ManagerFinancialHistoryEntry[] {
  const normalizedManagerKey = normalizeManagerKey(managerKey);

  if (!normalizedManagerKey) {
    return [];
  }

  return loadAllSeasonFinancialData().flatMap((seasonData) => {
    const manager = seasonData.managers.find((record) =>
      matchesManager(record.managerName, record.managerId, normalizedManagerKey)
    );
    const awards = seasonData.awards.filter((award) =>
      matchesManager(award.managerName, award.managerId, normalizedManagerKey)
    );

    if (!manager && awards.length === 0) {
      return [];
    }

    return [
      {
        season: seasonData.season,
        manager,
        awards,
      },
    ];
  });
}

export function getLeagueFinancialTotals(
  seasons: readonly SeasonFinancialData[] = loadAllSeasonFinancialData()
): LeagueFinancialTotals {
  const managerRecords = seasons.flatMap((season) => season.managers);
  const awardRecords = seasons.flatMap((season) => season.awards);

  return {
    seasons: seasons.length,
    managerRecords: managerRecords.length,
    awardRecords: awardRecords.length,
    knownEntryFeesPaid: sumKnownAmounts(
      managerRecords.map((manager) => manager.entryFeePaid)
    ),
    knownNewOwnerFeesPaid: sumKnownAmounts(
      managerRecords.map((manager) => manager.newOwnerFeePaid)
    ),
    knownFutureDepositsPaid: sumKnownAmounts(
      managerRecords.map((manager) => manager.futureDepositPaid)
    ),
    knownPayoutsReceived: sumKnownAmounts(
      managerRecords.map((manager) => manager.payoutsReceived)
    ),
    knownAwardPayouts: sumKnownAwards(awardRecords),
    knownRingReserve: sumKnownAmounts(
      seasons.map((season) => season.leagueRules.ringReserve)
    ),
    knownActualRingCost: sumKnownAmounts(
      seasons.map((season) => season.leagueRules.actualRingCost)
    ),
  };
}

function sumKnownAwards(awards: readonly AwardRecord[]): number {
  return sumKnownAmounts(awards.map((award) => award.amount));
}

function sumKnownAmounts(amounts: readonly FinancialAmount[]): number {
  return amounts.reduce<number>((total, amount) => total + (amount ?? 0), 0);
}

function matchesManager(
  managerName: string,
  managerId: string | undefined,
  normalizedManagerKey: string
) {
  return (
    normalizeManagerKey(managerName) === normalizedManagerKey ||
    normalizeManagerKey(managerId) === normalizedManagerKey
  );
}

function normalizeManagerKey(value: string | undefined) {
  return value?.trim().toLowerCase() ?? '';
}
