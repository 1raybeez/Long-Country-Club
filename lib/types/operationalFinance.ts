import type { PaymentStatus } from './financial';

export type PublicAwardStatus = 'approved' | 'paid';

export interface PublicAwardRecord {
  readonly season: number;
  readonly category: string;
  readonly week: number | null;
  readonly ownerId: string | null;
  readonly displayName: string;
  readonly teamName: string;
  readonly amountCents: number;
  readonly status: PublicAwardStatus;
}

export interface PublicAwardProjection {
  readonly awards: readonly PublicAwardRecord[];
  readonly approvedAwardCount: number;
  readonly paidAwardCount: number;
  readonly approvedOutstandingAmountCents: number;
  readonly paidAwardAmountCents: number;
  readonly confirmedAwardAmountCents: number;
}

export type {
  AwardReadinessStatus,
  OperationalAwardCategory,
  OperationalAwardObligation,
  OperationalAwardStatus,
  OperationalAwardTimestamp,
  PostseasonAwardCategory,
  PostseasonAwardReadiness,
} from './awardObligation';

export interface PublicOperationalOwnerStatus {
  readonly ownerId: string;
  readonly displayName: string;
  readonly paymentStatus: PaymentStatus;
}

export interface PublicOperationalFinance {
  readonly season: number;
  readonly duesAssessed: number;
  readonly duesCollected: number;
  readonly duesOutstanding: number;
  readonly paidCount: number;
  readonly partialCount: number;
  readonly unpaidCount: number;
  readonly ownerPaymentStatuses: readonly PublicOperationalOwnerStatus[];
  readonly publicAwards: PublicAwardProjection;
}
