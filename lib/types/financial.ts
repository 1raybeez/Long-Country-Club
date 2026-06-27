export type FinancialAmount = number | null;

export type AwardRecordType =
  | 'weeklyHigh'
  | 'champion'
  | 'runnerUp'
  | 'thirdPlace'
  | 'fourthPlace'
  | 'ringReserve'
  | 'futureDeposit'
  | 'adjustment'
  | 'other';

export interface SeasonPlayoffPayouts {
  readonly championBase: FinancialAmount;
  readonly runnerUp: FinancialAmount;
  readonly thirdPlace: FinancialAmount;
  readonly fourthPlace: FinancialAmount;
}

export interface SeasonFinancialRules {
  readonly entryFee: FinancialAmount;
  readonly newOwnerFee: FinancialAmount;
  readonly futureDeposit: FinancialAmount;
  readonly weeklyHighPayout: FinancialAmount;
  readonly regularSeasonWeeks: number | null;
  readonly playoffPayouts: SeasonPlayoffPayouts;
  readonly ringReserve: FinancialAmount;
  readonly actualRingCost: FinancialAmount;
}

export interface ManagerFinancialRecord {
  readonly managerId?: string;
  readonly managerName: string;
  readonly entryFeePaid: FinancialAmount;
  readonly newOwnerFeePaid: FinancialAmount;
  readonly futureDepositPaid: FinancialAmount;
  readonly payoutsReceived: FinancialAmount;
  readonly balance: FinancialAmount;
  readonly notes?: readonly string[];
}

export interface AwardRecord {
  readonly id: string;
  readonly type: AwardRecordType;
  readonly managerId?: string;
  readonly managerName: string;
  readonly amount: FinancialAmount;
  readonly week?: number;
  readonly description?: string;
  readonly notes?: readonly string[];
}

export interface SeasonFinancialData {
  readonly season: number;
  readonly leagueRules: SeasonFinancialRules;
  readonly managers: readonly ManagerFinancialRecord[];
  readonly awards: readonly AwardRecord[];
  readonly notes: readonly string[];
}

export interface ManagerFinancialHistoryEntry {
  readonly season: number;
  readonly manager?: ManagerFinancialRecord;
  readonly awards: readonly AwardRecord[];
}

export interface LeagueFinancialTotals {
  readonly seasons: number;
  readonly managerRecords: number;
  readonly awardRecords: number;
  readonly knownEntryFeesPaid: number;
  readonly knownNewOwnerFeesPaid: number;
  readonly knownFutureDepositsPaid: number;
  readonly knownPayoutsReceived: number;
  readonly knownAwardPayouts: number;
  readonly knownRingReserve: number;
  readonly knownActualRingCost: number;
}
