import type { Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdminFirestore } from '@/lib/auth/firebaseAdmin';
import { getCurrentMemberSession } from '@/lib/auth/session';
import { loadSeasonFinancialData } from '@/lib/history/financial';
import { getOwnerById } from '@/lib/ownerRegistry';
import { LCC_RESTRICTED_VACU_RESERVE_CENTS } from '@/lib/financeRules';
import type { LccMemberIdentity } from '@/lib/auth/types';
import type { PaymentStatus } from '@/lib/types/financial';
import type { PublicOperationalFinance, PublicOperationalOwnerStatus } from '@/lib/types/operationalFinance';
import { getPublicAwardProjection } from '@/lib/finance/publicAwardProjection';

export const OPERATIONAL_SEASON = 2026;
const DUES_PER_OWNER_CENTS = 5000;
const RING_RESERVE_MAX_CENTS = 8000;
const ACTUAL_RING_COST_CENTS = 1377;
const RING_EXPENSE_ID = 'championship-ring-2026';

type PaymentMethod = 'venmo' | 'paypal' | 'other';

export interface OperationalPayment {
  readonly paymentId: string;
  readonly ownerId: string;
  readonly amountCents: number;
  readonly paymentMethod: PaymentMethod;
  readonly effectiveDate: string;
  readonly recordedAt: string;
  readonly recordedByMemberId: string;
}

export interface CommissionerFinanceRow {
  readonly ownerId: string;
  readonly displayName: string;
  readonly teamName: string;
  readonly assessedCents: number;
  readonly settledCents: number;
  readonly remainingCents: number;
  readonly status: PaymentStatus;
  readonly payments: readonly OperationalPayment[];
}

export interface CommissionerFinanceSnapshot {
  readonly initialized: boolean;
  readonly season: number;
  readonly reconciliationStatus: 'pending';
  readonly assessedCents: number;
  readonly collectedCents: number;
  readonly outstandingCents: number;
  readonly rows: readonly CommissionerFinanceRow[];
  readonly restrictedReserveCents: number;
  readonly ringExpenseCents: number;
}

function seasonRef(db: Firestore) {
  return db.collection('financeSeasons').doc(String(OPERATIONAL_SEASON));
}

function ownerRecords() {
  return loadSeasonFinancialData(OPERATIONAL_SEASON).managers
    .filter((manager) => manager.managerId)
    .map((manager) => ({
      ownerId: manager.managerId as string,
      displayName: getOwnerById(manager.managerId as string)?.displayName ?? manager.managerName,
      teamName: getOwnerById(manager.managerId as string)?.teamName ?? manager.managerName,
    }));
}

function cents(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) ? value : 0;
}

function paymentFromSnapshot(snapshot: QueryDocumentSnapshot): OperationalPayment {
  const data = snapshot.data();
  const recordedAt = data.recordedAt?.toDate?.()?.toISOString?.() ?? '';
  return {
    paymentId: snapshot.id,
    ownerId: String(data.ownerId),
    amountCents: cents(data.amountCents),
    paymentMethod: data.paymentMethod,
    effectiveDate: String(data.effectiveDate),
    recordedAt,
    recordedByMemberId: String(data.recordedByMemberId),
  };
}

function statusFor(settledCents: number, assessedCents: number): PaymentStatus {
  if (settledCents >= assessedCents) return 'paid';
  if (settledCents > 0) return 'partial';
  return 'unpaid';
}

export async function getPublicOperationalFinance(): Promise<PublicOperationalFinance | null> {
  const db = getFirebaseAdminFirestore();
  if (!db) return null;
  const season = await seasonRef(db).get();
  if (!season.exists) return null;

  const [assessments, payments, publicAwards] = await Promise.all([seasonRef(db).collection('assessments').get(), seasonRef(db).collection('payments').get(), getPublicAwardProjection(OPERATIONAL_SEASON)]);
  const paymentTotals = new Map<string, number>();
  payments.docs.forEach((payment) => {
    const data = payment.data();
    paymentTotals.set(String(data.ownerId), (paymentTotals.get(String(data.ownerId)) ?? 0) + cents(data.amountCents));
  });

  const ownerPaymentStatuses = assessments.docs.map((assessment) => {
    const data = assessment.data();
    const ownerId = String(data.ownerId);
    const assessedCents = cents(data.amountCents);
    return { ownerId, displayName: getOwnerById(ownerId)?.displayName ?? ownerId, paymentStatus: statusFor(paymentTotals.get(ownerId) ?? 0, assessedCents) };
  });
  const duesAssessed = assessments.docs.reduce((sum, assessment) => sum + cents(assessment.data().amountCents), 0);
  const duesCollected = Array.from(paymentTotals.values()).reduce((sum, value) => sum + value, 0);

  return {
    season: OPERATIONAL_SEASON,
    duesAssessed: duesAssessed / 100,
    duesCollected: duesCollected / 100,
    duesOutstanding: Math.max(0, duesAssessed - duesCollected) / 100,
    paidCount: ownerPaymentStatuses.filter((owner) => owner.paymentStatus === 'paid').length,
    partialCount: ownerPaymentStatuses.filter((owner) => owner.paymentStatus === 'partial').length,
    unpaidCount: ownerPaymentStatuses.filter((owner) => owner.paymentStatus === 'unpaid').length,
    ownerPaymentStatuses,
    publicAwards,
  };
}

export async function getCommissionerFinanceSnapshot(): Promise<CommissionerFinanceSnapshot | null> {
  const db = getFirebaseAdminFirestore();
  if (!db) return null;
  const season = await seasonRef(db).get();
  if (!season.exists) return { initialized: false, season: OPERATIONAL_SEASON, reconciliationStatus: 'pending', assessedCents: 0, collectedCents: 0, outstandingCents: 0, rows: [], restrictedReserveCents: LCC_RESTRICTED_VACU_RESERVE_CENTS, ringExpenseCents: ACTUAL_RING_COST_CENTS };

  const [assessments, payments] = await Promise.all([seasonRef(db).collection('assessments').get(), seasonRef(db).collection('payments').get()]);
  const paymentsByOwner = new Map<string, OperationalPayment[]>();
  payments.docs.forEach((payment) => {
    const entry = paymentFromSnapshot(payment);
    paymentsByOwner.set(entry.ownerId, [...(paymentsByOwner.get(entry.ownerId) ?? []), entry]);
  });
  const rows = assessments.docs.map((assessment) => {
    const data = assessment.data();
    const ownerId = String(data.ownerId);
    const paymentsForOwner = paymentsByOwner.get(ownerId) ?? [];
    const assessedCents = cents(data.amountCents);
    const settledCents = paymentsForOwner.reduce((sum, payment) => sum + payment.amountCents, 0);
    const owner = getOwnerById(ownerId);
    return { ownerId, displayName: owner?.displayName ?? ownerId, teamName: owner?.teamName ?? ownerId, assessedCents, settledCents, remainingCents: Math.max(0, assessedCents - settledCents), status: statusFor(settledCents, assessedCents), payments: paymentsForOwner };
  });
  const assessedCents = rows.reduce((sum, row) => sum + row.assessedCents, 0);
  const collectedCents = rows.reduce((sum, row) => sum + row.settledCents, 0);
  return { initialized: true, season: OPERATIONAL_SEASON, reconciliationStatus: 'pending', assessedCents, collectedCents, outstandingCents: Math.max(0, assessedCents - collectedCents), rows, restrictedReserveCents: LCC_RESTRICTED_VACU_RESERVE_CENTS, ringExpenseCents: ACTUAL_RING_COST_CENTS };
}

export async function initializeOperationalFinance(actor: LccMemberIdentity) {
  if (!actor.capabilities.includes('commissioner')) {
    throw new Error('Commissioner authorization required.');
  }
  const db = getFirebaseAdminFirestore();
  if (!db) throw new Error('Operational finance storage is unavailable.');
  const season = seasonRef(db);
  const owners = ownerRecords();
  if (owners.length !== 12) throw new Error('Canonical 2026 owner roster is not exactly 12 owners.');
  const assessmentRefs = owners.map((owner) => season.collection('assessments').doc(owner.ownerId));
  const ringExpense = season.collection('expenses').doc(RING_EXPENSE_ID);
  await db.runTransaction(async (transaction) => {
    const [seasonSnapshot, ...assessmentSnapshots] = await transaction.getAll(season, ...assessmentRefs, ringExpense);
    const expenseSnapshot = assessmentSnapshots.pop();
    const now = FieldValue.serverTimestamp();
    if (!seasonSnapshot.exists) transaction.create(season, { season: OPERATIONAL_SEASON, status: 'active', createdAt: now, updatedAt: now, duesPerOwnerCents: DUES_PER_OWNER_CENTS, totalAssessmentCents: DUES_PER_OWNER_CENTS * owners.length, restrictedReserveCents: LCC_RESTRICTED_VACU_RESERVE_CENTS, restrictedReserveLabel: 'Future-Season Deposits', restrictedReserveCustodian: 'VACU', restricted: true, ringReserveMaxCents: RING_RESERVE_MAX_CENTS, actualRingCostCents: ACTUAL_RING_COST_CENTS, reconciliationStatus: 'pending', createdByMemberId: actor.memberId });
    else transaction.update(season, { updatedAt: now });
    assessmentSnapshots.forEach((snapshot, index) => { if (!snapshot.exists) transaction.create(assessmentRefs[index], { assessmentId: owners[index].ownerId, season: OPERATIONAL_SEASON, ownerId: owners[index].ownerId, amountCents: DUES_PER_OWNER_CENTS, status: 'approved', source: 'canonical-2026-finance', reason: 'Current-season league dues', createdAt: now, createdByMemberId: actor.memberId }); });
    if (!expenseSnapshot?.exists) transaction.create(ringExpense, { expenseId: RING_EXPENSE_ID, season: OPERATIONAL_SEASON, type: 'ring', amountCents: ACTUAL_RING_COST_CENTS, description: '2026 Championship Ring', notes: 'Verified commissioner purchase', createdAt: now, createdByMemberId: actor.memberId });
  });
  return { initialized: true, assessmentCount: owners.length, expenseCreated: true };
}

export async function recordOperationalPayment(input: { ownerId: string; amountCents: number; paymentMethod: PaymentMethod; effectiveDate: string; requestId: string }) {
  const session = await getCurrentMemberSession();
  if (!session?.member?.capabilities.includes('commissioner')) throw new Error('Commissioner authorization required.');
  const db = getFirebaseAdminFirestore();
  if (!db) throw new Error('Operational finance storage is unavailable.');
  const owner = ownerRecords().find((record) => record.ownerId === input.ownerId);
  if (!owner) throw new Error('Unknown 2026 owner.');
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) throw new Error('Payment amount must be a positive integer number of cents.');
  if (!['venmo', 'paypal', 'other'].includes(input.paymentMethod)) throw new Error('Unsupported payment method.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveDate) || Number.isNaN(Date.parse(`${input.effectiveDate}T00:00:00Z`))) throw new Error('Payment date must be a valid YYYY-MM-DD date.');
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(input.requestId)) throw new Error('Invalid request ID.');

  const season = seasonRef(db);
  const assessment = season.collection('assessments').doc(input.ownerId);
  const request = season.collection('requests').doc(input.requestId);
  const payment = season.collection('payments').doc();
  const event = season.collection('events').doc(payment.id);
  await db.runTransaction(async (transaction) => {
    const [seasonSnapshot, assessmentSnapshot, requestSnapshot] = await transaction.getAll(season, assessment, request);
    if (!seasonSnapshot.exists || seasonSnapshot.data()?.reconciliationStatus === 'reconciled') throw new Error('2026 operational season is not open for payments.');
    if (!assessmentSnapshot.exists) throw new Error('Owner assessment not found. Initialize the 2026 ledger first.');
    if (requestSnapshot.exists) throw new Error('Duplicate payment request.');
    const existingPayments = await transaction.get(season.collection('payments').where('ownerId', '==', input.ownerId));
    const settledCents = existingPayments.docs.reduce((sum, doc) => sum + cents(doc.data().amountCents), 0);
    const remainingCents = cents(assessmentSnapshot.data()?.amountCents) - settledCents;
    if (input.amountCents > remainingCents) throw new Error('Payment exceeds the owner’s remaining dues.');
    const now = FieldValue.serverTimestamp();
    transaction.create(request, { requestId: input.requestId, paymentId: payment.id, createdAt: now });
    transaction.create(payment, { paymentId: payment.id, season: OPERATIONAL_SEASON, assessmentId: input.ownerId, ownerId: input.ownerId, amountCents: input.amountCents, paymentMethod: input.paymentMethod, effectiveDate: input.effectiveDate, recordedAt: now, recordedByMemberId: session.member?.memberId, source: 'commissioner-finance-ui' });
    transaction.create(event, { eventType: 'dues-payment-recorded', season: OPERATIONAL_SEASON, ownerId: input.ownerId, actorMemberId: session.member?.memberId, createdAt: now, referenceId: payment.id, summary: 'Dues payment recorded' });
  });
  return { paymentId: payment.id };
}
