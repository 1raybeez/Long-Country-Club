export type FinancialAmount = number | null;

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'waived';

export type ReconciliationStatus =
  | 'reconciled'
  | 'documented-discrepancy'
  | 'unreconciled'
  | 'pending';

export type FinancialAdjustmentType =
  | 'credit'
  | 'rollover'
  | 'commissionerAdjustment'
  | 'other';

export interface FinancialAdjustment {
  readonly type: FinancialAdjustmentType;
  readonly amount: FinancialAmount;
  readonly managerId?: string;
  readonly description?: string;
  readonly notes?: readonly string[];
}

export type FinancialExpenseType = 'ring' | 'league' | 'commissioner' | 'other';

export interface FinancialExpense {
  readonly type: FinancialExpenseType;
  readonly amount: FinancialAmount;
  readonly description?: string;
  readonly managerId?: string;
  readonly notes?: readonly string[];
}

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
  readonly duesAssessed?: FinancialAmount;
  readonly duesPaid?: FinancialAmount;
  readonly duesBalance?: FinancialAmount;
  readonly paymentStatus?: PaymentStatus;
  readonly paymentDate?: string | null;
  readonly paymentMethod?: string | null;
  readonly awardsEarned?: FinancialAmount;
  readonly finishPayout?: FinancialAmount;
  readonly cashPaid?: FinancialAmount;
  readonly credits?: FinancialAmount;
  readonly adjustments?: FinancialAmount;
  readonly expenses?: FinancialAmount;
  readonly recordedNet?: FinancialAmount;
}

export interface HistoricalPaymentRecord {
  readonly id: string;
  readonly season: number;
  readonly ownerId: string;
  readonly amount: FinancialAmount;
  readonly paymentMethod?: string | null;
  readonly receivedAt: string;
  readonly datePrecision?: 'day' | 'month' | 'unknown';
  readonly source: string;
  readonly private?: boolean;
  readonly notes?: readonly string[];
}

export interface AwardRecord {
  readonly id: string;
  readonly type: AwardRecordType;
  readonly managerId?: string;
  readonly managerName: string;
  readonly amount: FinancialAmount;
  readonly week?: number;
  readonly cashPaid?: FinancialAmount;
  readonly description?: string;
  readonly notes?: readonly string[];
}

export interface SeasonFinancialData {
  readonly season: number;
  readonly leagueRules: SeasonFinancialRules;
  readonly managers: readonly ManagerFinancialRecord[];
  readonly awards: readonly AwardRecord[];
  readonly payments?: readonly HistoricalPaymentRecord[];
  readonly notes: readonly string[];
  readonly expenses?: readonly FinancialExpense[];
  readonly adjustments?: readonly FinancialAdjustment[];
  readonly reconciliationStatus?: ReconciliationStatus;
  readonly reconciliationNotes?: readonly string[];
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
