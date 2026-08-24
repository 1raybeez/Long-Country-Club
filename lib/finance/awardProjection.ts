import { getFirebaseAdminFirestore } from '@/lib/auth/firebaseAdmin';
import { getOwnerById } from '@/lib/ownerRegistry';
import type { OperationalAwardCategory, OperationalAwardStatus } from '@/lib/types/awardObligation';

export type AwardSettlementStatus = 'not-approved' | 'awaiting-payment' | 'paid' | 'blocked';

export interface PrivateAwardProjectionItem {
  readonly obligationId: string;
  readonly season: number;
  readonly category: OperationalAwardCategory;
  readonly week: number | null;
  readonly ownerId: string | null;
  readonly ownerDisplayName: string;
  readonly teamName: string;
  readonly amountCents: number;
  readonly status: OperationalAwardStatus;
  readonly source: string;
  readonly sourceReference: string | null;
  readonly approvedAt: string | null;
  readonly rejectedAt: string | null;
  readonly settlementReference: string | null;
  readonly settlementId: string | null;
  readonly settlementMethod: string | null;
  readonly settlementEffectiveDate: string | null;
  readonly settlementRecordedAt: string | null;
  readonly rejectionReason?: string;
  readonly settlementStatus: AwardSettlementStatus;
}

export interface PrivateAwardProjection {
  readonly season: number;
  readonly awards: readonly PrivateAwardProjectionItem[];
  readonly approvedAwards: readonly PrivateAwardProjectionItem[];
  readonly proposedCount: number;
  readonly proposedAmountCents: number;
  readonly approvedCount: number;
  readonly approvedAmountCents: number;
  readonly paidCount: number;
  readonly paidAmountCents: number;
  readonly approvedUnpaidCount: number;
  readonly approvedUnpaidAmountCents: number;
  readonly rejectedCount: number;
  readonly issueCount: number;
}

function isoTimestamp(value: unknown): string | null {
  if (value && typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate(): Date }).toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
}

function settlementStatus(status: OperationalAwardStatus): AwardSettlementStatus {
  if (status === 'paid') return 'paid';
  if (status === 'approved') return 'awaiting-payment';
  if (status === 'issue') return 'blocked';
  return 'not-approved';
}

export function buildPrivateAwardProjectionItem(data: Record<string, unknown>, obligationId: string, settlementData?: Record<string, unknown>): PrivateAwardProjectionItem {
  const ownerId = typeof data.ownerId === 'string' ? data.ownerId : null;
  const owner = ownerId ? getOwnerById(ownerId) : undefined;
  const rawStatus = data.status;
  const status = (['proposed', 'approved', 'paid', 'rejected', 'issue'] as const).includes(rawStatus as OperationalAwardStatus) ? rawStatus as OperationalAwardStatus : 'issue';
  return {
    obligationId,
    season: Number(data.season),
    category: data.category as OperationalAwardCategory,
    week: Number.isInteger(data.week) ? Number(data.week) : null,
    ownerId,
    ownerDisplayName: owner?.displayName ?? 'Unresolved owner',
    teamName: owner?.teamName ?? 'Unresolved team',
    amountCents: Number.isInteger(data.amountCents) ? Number(data.amountCents) : 0,
    status,
    source: typeof data.source === 'string' ? data.source : 'unknown',
    sourceReference: typeof data.sourceReference === 'string' ? data.sourceReference : null,
    approvedAt: isoTimestamp(data.approvedAt),
    rejectedAt: isoTimestamp(data.rejectedAt),
    settlementReference: typeof data.settlementReference === 'string' ? data.settlementReference : null,
    settlementId: typeof settlementData?.settlementId === 'string' ? settlementData.settlementId : null,
    settlementMethod: typeof settlementData?.method === 'string' ? settlementData.method : null,
    settlementEffectiveDate: typeof settlementData?.effectiveDate === 'string' ? settlementData.effectiveDate : null,
    settlementRecordedAt: isoTimestamp(settlementData?.recordedAt),
    ...(typeof data.rejectionReason === 'string' ? { rejectionReason: data.rejectionReason } : {}),
    settlementStatus: settlementStatus(status),
  };
}

export async function getPrivateAwardProjection(season: number): Promise<PrivateAwardProjection> {
  const empty = { season, awards: [], approvedAwards: [], proposedCount: 0, proposedAmountCents: 0, approvedCount: 0, approvedAmountCents: 0, paidCount: 0, paidAmountCents: 0, approvedUnpaidCount: 0, approvedUnpaidAmountCents: 0, rejectedCount: 0, issueCount: 0 } satisfies PrivateAwardProjection;
  const db = getFirebaseAdminFirestore();
  if (!db) return empty;
  const seasonRef = db.collection('financeSeasons').doc(String(season));
  const [snapshot, settlementSnapshot] = await Promise.all([seasonRef.collection('awards').get(), seasonRef.collection('awardSettlements').get()]);
  const settlements = new Map(settlementSnapshot.docs.map((doc) => [String(doc.data().obligationId), doc.data()]));
  const awards = snapshot.docs.map((doc) => buildPrivateAwardProjectionItem(doc.data(), doc.id, settlements.get(doc.id)));
  const approvedAwards = awards.filter((award) => award.status === 'approved');
  const sum = (items: readonly PrivateAwardProjectionItem[]) => items.reduce((total, award) => total + award.amountCents, 0);
  return {
    season,
    awards,
    approvedAwards,
    proposedCount: awards.filter((award) => award.status === 'proposed').length,
    proposedAmountCents: sum(awards.filter((award) => award.status === 'proposed')),
    approvedCount: approvedAwards.length,
    approvedAmountCents: sum(approvedAwards),
    paidCount: awards.filter((award) => award.status === 'paid').length,
    paidAmountCents: sum(awards.filter((award) => award.status === 'paid')),
    approvedUnpaidCount: approvedAwards.filter((award) => award.settlementStatus === 'awaiting-payment').length,
    approvedUnpaidAmountCents: sum(approvedAwards.filter((award) => award.settlementStatus === 'awaiting-payment')),
    rejectedCount: awards.filter((award) => award.status === 'rejected').length,
    issueCount: awards.filter((award) => award.status === 'issue').length,
  };
}
