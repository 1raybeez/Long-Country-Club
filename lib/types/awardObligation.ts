export type OperationalAwardCategory =
  | 'weekly-high'
  | 'fourth-place'
  | 'third-place'
  | 'runner-up'
  | 'champion';

export type OperationalAwardStatus =
  | 'proposed'
  | 'approved'
  | 'paid'
  | 'rejected'
  | 'issue';

export type AwardSettlementMethod = 'venmo' | 'paypal' | 'other';

export interface OperationalAwardSettlement {
  readonly settlementId: string;
  readonly season: number;
  readonly obligationId: string;
  readonly ownerId: string;
  readonly amountCents: number;
  readonly method: AwardSettlementMethod;
  readonly effectiveDate: string;
  readonly recordedAt: OperationalAwardTimestamp;
  readonly recordedByMemberId: string;
  readonly source: string;
  readonly requestId: string;
  readonly notes?: string;
  readonly correctionType?: 'reversal';
  readonly originalSettlementId?: string;
  readonly correctionId?: string;
}

export type OperationalAwardTimestamp =
  | Date
  | string
  | number
  | { toDate(): Date };

export interface OperationalAwardObligation {
  readonly obligationId: string;
  readonly season: number;
  readonly category: OperationalAwardCategory;
  readonly amountCents: number;
  readonly ownerId: string | null;
  readonly teamName?: string | null;
  readonly week?: number;
  readonly source: string;
  readonly sourceReference?: string;
  readonly status: OperationalAwardStatus;
  readonly proposedAt?: OperationalAwardTimestamp;
  readonly proposedByMemberId?: string;
  readonly approvedAt?: OperationalAwardTimestamp;
  readonly approvedByMemberId?: string;
  readonly rejectedAt?: OperationalAwardTimestamp;
  readonly rejectedByMemberId?: string;
  readonly rejectionReason?: string;
  readonly settlementReference?: string;
  readonly paidAt?: OperationalAwardTimestamp;
  readonly paidByMemberId?: string;
  readonly notes?: string;
  readonly replacesObligationId?: string;
  readonly reversedByObligationId?: string;
  readonly reversedBySettlementId?: string;
  readonly readinessEvidence?: {
    readonly status: 'ready';
    readonly highestScore: number;
    readonly nextHighestScore: number | null;
    readonly sourceReference: string;
    readonly currentActiveWeek?: number;
    readonly conservativeDelaySatisfied: boolean;
  };
}

export type PostseasonAwardCategory = Exclude<OperationalAwardCategory, 'weekly-high'>;

export type AwardReadinessStatus = 'waiting' | 'ready' | 'issue';

export interface PostseasonAwardReadiness {
  readonly season: number;
  readonly category: PostseasonAwardCategory;
  readonly status: AwardReadinessStatus;
  readonly reason: string;
}
