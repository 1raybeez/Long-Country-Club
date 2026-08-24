import {
  getFinancialRules,
  getSeasonReconciliation,
  loadSeasonFinancialData,
} from './financial';
import { LCC_CURRENT_SEASON } from '../leagueConstants';
import type {
  FinancialAmount,
  AwardRecord,
  ManagerFinancialRecord,
  PaymentStatus,
  SeasonFinancialData,
  SeasonFinancialRules,
} from '../types/financial';
import type { SeasonReconciliation } from './financialReconciliation';

export interface PublicWeeklyWinner {
  readonly week?: number;
  readonly managerName: string;
  readonly amount: FinancialAmount;
}

/** Public current-season identity/status only; settlement details stay private. */
export interface PublicOwnerPaymentStatus {
  readonly managerId: string | null;
  readonly managerName: string;
  readonly paymentStatus: PaymentStatus | null;
}

export interface PublicSeasonFinanceProjection {
  readonly season: number;
  readonly duesAssessed: FinancialAmount;
  readonly duesCollected: FinancialAmount;
  readonly duesOutstanding: FinancialAmount;
  readonly ownerPaymentStatuses: readonly PublicOwnerPaymentStatus[];
  readonly actualRingCost: FinancialAmount;
  readonly ringReserveMaximum: FinancialAmount;
  readonly unusedRingReserve: FinancialAmount;
  readonly projectedChampionCashAllocation: FinancialAmount;
  readonly payoutStructure: SeasonFinancialRules;
  readonly weeklyWinners: readonly PublicWeeklyWinner[];
  readonly aggregateAwards: number;
  readonly leagueExpenses: number;
  readonly reconciliation: SeasonReconciliation;
}

export interface CommissionerLedgerRow {
  readonly managerId: string | null;
  readonly managerName: string;
  readonly duesAssessed: FinancialAmount;
  readonly duesPaid: FinancialAmount;
  readonly duesBalance: FinancialAmount;
  readonly paymentStatus: ManagerFinancialRecord['paymentStatus'];
  readonly paymentDate: string | null | undefined;
  readonly awardsEarned: FinancialAmount;
  readonly finishPayout: FinancialAmount;
  readonly awards: readonly AwardRecord[];
  readonly payoutsReceived: FinancialAmount;
  readonly cashPaid: FinancialAmount;
  readonly credits: FinancialAmount;
  readonly adjustments: FinancialAmount;
  readonly notes: readonly string[];
}

function sumKnown(values: readonly (FinancialAmount | undefined)[]): number {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

export function getPublicSeasonFinance(
  seasonData: SeasonFinancialData
): PublicSeasonFinanceProjection {
  const duesAssessedValues = seasonData.managers.map((manager) => manager.duesAssessed);
  const hasDuesAssessment = duesAssessedValues.some((value) => value !== null && value !== undefined);
  const duesAssessed = hasDuesAssessment ? sumKnown(duesAssessedValues) : null;
  const duesCollectedValues = seasonData.managers.map((manager) => manager.duesPaid);
  const hasDuesCollected = duesCollectedValues.some((value) => value !== null && value !== undefined);
  const duesCollected = hasDuesCollected ? sumKnown(duesCollectedValues) : null;
  const duesOutstanding =
    duesAssessed !== null && duesCollected !== null
      ? duesAssessed - duesCollected
      : null;
  const ownerPaymentStatuses = seasonData.managers.map((manager) => ({
    managerId: manager.managerId ?? null,
    managerName: manager.managerName,
    paymentStatus: manager.paymentStatus ?? null,
  }));
  const ringExpenseValues = (seasonData.expenses ?? [])
    .filter((expense) => expense.type === 'ring')
    .map((expense) => expense.amount);
  const hasRingExpense = ringExpenseValues.some(
    (value) => value !== null && value !== undefined
  );
  const actualRingCost = hasRingExpense
    ? sumKnown(ringExpenseValues)
    : seasonData.leagueRules.actualRingCost;
  const ringReserveMaximum = seasonData.leagueRules.ringReserve;
  const unusedRingReserve =
    ringReserveMaximum !== null && actualRingCost !== null
      ? ringReserveMaximum - actualRingCost
      : null;
  const projectedChampionCashAllocation =
    unusedRingReserve !== null && seasonData.leagueRules.playoffPayouts.championBase !== null
      ? seasonData.leagueRules.playoffPayouts.championBase + unusedRingReserve
      : null;

  return {
    season: seasonData.season,
    duesAssessed,
    duesCollected,
    duesOutstanding,
    ownerPaymentStatuses,
    actualRingCost,
    ringReserveMaximum,
    unusedRingReserve,
    projectedChampionCashAllocation,
    payoutStructure: seasonData.leagueRules,
    weeklyWinners: seasonData.awards
      .filter((award) => award.type === 'weeklyHigh')
      .map((award) => ({
        week: award.week,
        managerName: award.managerName,
        amount: award.amount,
      })),
    aggregateAwards: sumKnown(seasonData.awards.map((award) => award.amount)),
    leagueExpenses: sumKnown((seasonData.expenses ?? []).map((expense) => expense.amount)),
    reconciliation: getSeasonReconciliation(seasonData.season),
  };
}

export function getPublicCurrentSeasonFinance(): PublicSeasonFinanceProjection | null {
  const seasonData = loadSeasonFinancialData(LCC_CURRENT_SEASON);
  return seasonData ? getPublicSeasonFinance(seasonData) : null;
}

export function getCommissionerSeasonLedger(
  seasonData: SeasonFinancialData
): readonly CommissionerLedgerRow[] {
  return seasonData.managers.map((manager) => ({
    managerId: manager.managerId ?? null,
    managerName: manager.managerName,
    duesAssessed: manager.duesAssessed ?? null,
    duesPaid: manager.duesPaid ?? null,
    duesBalance: manager.duesBalance ?? null,
    paymentStatus: manager.paymentStatus,
    paymentDate: manager.paymentDate,
    awardsEarned: manager.awardsEarned ?? null,
    finishPayout: manager.finishPayout ?? null,
    awards: seasonData.awards.filter(
      (award) => award.managerId === manager.managerId
    ),
    payoutsReceived: manager.payoutsReceived,
    cashPaid: manager.cashPaid ?? null,
    credits: manager.credits ?? null,
    adjustments: manager.adjustments ?? null,
    notes: manager.notes ?? [],
  }));
}

export function getCommissionerCurrentSeasonLedger(): readonly CommissionerLedgerRow[] {
  const seasonData = loadSeasonFinancialData(LCC_CURRENT_SEASON);
  return seasonData ? getCommissionerSeasonLedger(seasonData) : [];
}

export { getFinancialRules };
