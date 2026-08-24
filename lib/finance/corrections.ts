import { FieldValue } from 'firebase-admin/firestore';
import { getCurrentMemberSession } from '@/lib/auth/session';
import { getFirebaseAdminFirestore } from '@/lib/auth/firebaseAdmin';
import { OPERATIONAL_SEASON } from '@/lib/finance/operationalLedger';
import type { OperationalAwardStatus } from '@/lib/types/awardObligation';
import type { AwardSettlementMethod } from '@/lib/types/awardObligation';

const correctionReason = (reason: string) => {
  if (typeof reason !== 'string' || reason.trim().length < 3 || reason.trim().length > 500) throw new Error('A correction reason between 3 and 500 characters is required.');
  return reason.trim();
};

function validateSeason(season: number) {
  if (season !== OPERATIONAL_SEASON) throw new Error('Operational finance corrections are limited to the active season.');
}

async function commissioner() {
  const session = await getCurrentMemberSession();
  if (!session?.member?.capabilities.includes('commissioner')) throw new Error('Commissioner authorization required.');
  return session.member;
}

function dbOrThrow() {
  const db = getFirebaseAdminFirestore();
  if (!db) throw new Error('Operational finance storage is unavailable.');
  return db;
}

export async function reverseDuesPayment(input: { season: number; paymentId: string; reason: string; requestId: string }) {
  const actor = await commissioner();
  validateSeason(input.season);
  const reason = correctionReason(input.reason);
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(input.requestId)) throw new Error('Invalid correction request ID.');
  const db = dbOrThrow();
  const season = db.collection('financeSeasons').doc(String(input.season));
  const original = season.collection('payments').doc(input.paymentId);
  const correctionId = `dues-payment-reversal-${input.paymentId}`;
  const reversal = season.collection('payments').doc(correctionId);
  const correction = season.collection('corrections').doc(correctionId);
  const request = season.collection('correctionRequests').doc(input.requestId);
  const event = season.collection('events').doc(`dues-payment-reversed-${input.paymentId}`);
  let alreadyExists = false;
  await db.runTransaction(async (transaction) => {
    const [requestSnapshot, originalSnapshot, correctionSnapshot] = await transaction.getAll(request, original, correction);
    if (requestSnapshot.exists) { alreadyExists = true; return; }
    if (!originalSnapshot.exists) throw new Error('Dues payment not found.');
    if (correctionSnapshot.exists) { alreadyExists = true; transaction.create(request, { requestId: input.requestId, correctionId, result: 'already-exists', createdAt: FieldValue.serverTimestamp() }); return; }
    const data = originalSnapshot.data() ?? {};
    const amountCents = Number(data.amountCents);
    if (!Number.isInteger(amountCents) || amountCents <= 0 || typeof data.ownerId !== 'string') throw new Error('Original dues payment is not reversible.');
    const now = FieldValue.serverTimestamp();
    transaction.create(reversal, { paymentId: correctionId, season: input.season, assessmentId: data.assessmentId, ownerId: data.ownerId, amountCents: -amountCents, paymentMethod: data.paymentMethod, effectiveDate: data.effectiveDate, recordedAt: now, recordedByMemberId: actor.memberId, source: 'commissioner-dues-correction', correctionType: 'reversal', originalPaymentId: input.paymentId, correctionId });
    transaction.create(correction, { correctionId, season: input.season, domain: 'dues-payment', originalRecordId: input.paymentId, correctionType: 'reversal', amountCents: -amountCents, reason, recordedAt: now, recordedByMemberId: actor.memberId, source: 'commissioner-dues-correction', requestId: input.requestId, replacementRecordId: correctionId });
    transaction.create(event, { eventType: 'dues-payment-reversed', season: input.season, originalPaymentId: input.paymentId, reversalPaymentId: correctionId, ownerId: data.ownerId, amountCents: -amountCents, actorMemberId: actor.memberId, reason, createdAt: now, referenceId: correctionId });
    transaction.create(request, { requestId: input.requestId, correctionId, result: 'created', createdAt: now });
  });
  return { correctionId, reversalPaymentId: correctionId, alreadyExists };
}

export async function reverseAwardSettlement(input: { season: number; settlementId: string; reason: string; requestId: string }) {
  const actor = await commissioner();
  validateSeason(input.season);
  const reason = correctionReason(input.reason);
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(input.requestId)) throw new Error('Invalid correction request ID.');
  const db = dbOrThrow();
  const season = db.collection('financeSeasons').doc(String(input.season));
  const original = season.collection('awardSettlements').doc(input.settlementId);
  const award = season.collection('awards').doc(input.settlementId.replace(/^award-settlement-/, ''));
  const correctionId = `award-settlement-reversal-${input.settlementId}`;
  const reversal = season.collection('awardSettlements').doc(correctionId);
  const correction = season.collection('corrections').doc(correctionId);
  const request = season.collection('correctionRequests').doc(input.requestId);
  const event = season.collection('events').doc(`award-settlement-reversed-${input.settlementId}`);
  let alreadyExists = false;
  await db.runTransaction(async (transaction) => {
    const [requestSnapshot, originalSnapshot, reversalSnapshot, awardSnapshot] = await transaction.getAll(request, original, reversal, award);
    if (requestSnapshot.exists) { alreadyExists = true; return; }
    if (!originalSnapshot.exists) throw new Error('Award settlement not found.');
    if (reversalSnapshot.exists) { alreadyExists = true; transaction.create(request, { requestId: input.requestId, correctionId, result: 'already-exists', createdAt: FieldValue.serverTimestamp() }); return; }
    if (!awardSnapshot.exists || awardSnapshot.data()?.status !== 'paid') throw new Error('Only a paid award settlement may be reversed.');
    const data = originalSnapshot.data() ?? {};
    const amountCents = Number(data.amountCents);
    if (!Number.isInteger(amountCents) || amountCents <= 0 || typeof data.ownerId !== 'string') throw new Error('Original award settlement is not reversible.');
    const now = FieldValue.serverTimestamp();
    transaction.create(reversal, { settlementId: correctionId, season: input.season, obligationId: data.obligationId, ownerId: data.ownerId, amountCents: -amountCents, method: data.method as AwardSettlementMethod, effectiveDate: data.effectiveDate, recordedAt: now, recordedByMemberId: actor.memberId, source: 'commissioner-award-correction', requestId: input.requestId, correctionType: 'reversal', originalSettlementId: input.settlementId, correctionId, notes: reason });
    transaction.create(correction, { correctionId, season: input.season, domain: 'award-settlement', originalRecordId: input.settlementId, correctionType: 'reversal', amountCents: -amountCents, reason, recordedAt: now, recordedByMemberId: actor.memberId, source: 'commissioner-award-correction', requestId: input.requestId, replacementRecordId: correctionId });
    transaction.update(award, { status: 'approved', settlementReference: null, paidAt: null, paidByMemberId: null, reversedBySettlementId: correctionId });
    transaction.create(event, { eventType: 'award-settlement-reversed', season: input.season, originalSettlementId: input.settlementId, reversalSettlementId: correctionId, obligationId: data.obligationId, ownerId: data.ownerId, amountCents: -amountCents, actorMemberId: actor.memberId, reason, createdAt: now, referenceId: correctionId });
    transaction.create(request, { requestId: input.requestId, correctionId, result: 'created', createdAt: now });
  });
  return { correctionId, reversalSettlementId: correctionId, alreadyExists };
}

export async function reverseOperationalExpense(input: { season: number; expenseId: string; reason: string; requestId: string }) {
  const actor = await commissioner();
  validateSeason(input.season);
  const reason = correctionReason(input.reason);
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(input.requestId)) throw new Error('Invalid correction request ID.');
  const db = dbOrThrow();
  const season = db.collection('financeSeasons').doc(String(input.season));
  const original = season.collection('expenses').doc(input.expenseId);
  const correctionId = `expense-reversal-${input.expenseId}`;
  const reversal = season.collection('expenses').doc(correctionId);
  const correction = season.collection('corrections').doc(correctionId);
  const request = season.collection('correctionRequests').doc(input.requestId);
  const event = season.collection('events').doc(`expense-reversed-${input.expenseId}`);
  let alreadyExists = false;
  await db.runTransaction(async (transaction) => {
    const [requestSnapshot, originalSnapshot, correctionSnapshot] = await transaction.getAll(request, original, correction);
    if (requestSnapshot.exists) { alreadyExists = true; return; }
    if (!originalSnapshot.exists) throw new Error('Expense not found.');
    if (correctionSnapshot.exists) { alreadyExists = true; transaction.create(request, { requestId: input.requestId, correctionId, result: 'already-exists', createdAt: FieldValue.serverTimestamp() }); return; }
    const data = originalSnapshot.data() ?? {};
    const amountCents = Number(data.amountCents);
    if (!Number.isInteger(amountCents) || amountCents <= 0) throw new Error('Original expense is not reversible.');
    const now = FieldValue.serverTimestamp();
    transaction.create(reversal, { expenseId: correctionId, season: input.season, type: data.type, amountCents: -amountCents, description: `Reversal of ${input.expenseId}`, recordedAt: now, recordedByMemberId: actor.memberId, source: 'commissioner-expense-correction', correctionType: 'reversal', originalExpenseId: input.expenseId, correctionId, reason });
    transaction.create(correction, { correctionId, season: input.season, domain: 'expense', originalRecordId: input.expenseId, correctionType: 'reversal', amountCents: -amountCents, reason, recordedAt: now, recordedByMemberId: actor.memberId, source: 'commissioner-expense-correction', requestId: input.requestId, replacementRecordId: correctionId });
    transaction.create(event, { eventType: 'expense-reversed', season: input.season, originalExpenseId: input.expenseId, reversalExpenseId: correctionId, amountCents: -amountCents, actorMemberId: actor.memberId, reason, createdAt: now, referenceId: correctionId });
    transaction.create(request, { requestId: input.requestId, correctionId, result: 'created', createdAt: now });
  });
  return { correctionId, reversalExpenseId: correctionId, alreadyExists };
}

export async function replaceAwardObligation(input: { season: number; obligationId: string; reason: string; requestId: string }) {
  const actor = await commissioner();
  validateSeason(input.season);
  const reason = correctionReason(input.reason);
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(input.requestId)) throw new Error('Invalid correction request ID.');
  const db = dbOrThrow();
  const season = db.collection('financeSeasons').doc(String(input.season));
  const original = season.collection('awards').doc(input.obligationId);
  const replacementId = `${input.obligationId}-correction-${input.requestId}`;
  const replacement = season.collection('awards').doc(replacementId);
  const correction = season.collection('corrections').doc(replacementId);
  const request = season.collection('correctionRequests').doc(input.requestId);
  const event = season.collection('events').doc(`award-obligation-corrected-${replacementId}`);
  let alreadyExists = false;
  await db.runTransaction(async (transaction) => {
    const [requestSnapshot, originalSnapshot, replacementSnapshot] = await transaction.getAll(request, original, replacement);
    if (requestSnapshot.exists) { alreadyExists = true; return; }
    if (!originalSnapshot.exists) throw new Error('Award obligation not found.');
    if (replacementSnapshot.exists) { alreadyExists = true; transaction.create(request, { requestId: input.requestId, correctionId: replacementId, result: 'already-exists', createdAt: FieldValue.serverTimestamp() }); return; }
    const data = originalSnapshot.data() ?? {};
    if (!['rejected', 'issue'].includes(String(data.status))) throw new Error('Only rejected or issue award obligations may be replaced.');
    const now = FieldValue.serverTimestamp();
    transaction.create(replacement, { ...data, obligationId: replacementId, status: 'proposed', replacesObligationId: input.obligationId, proposedByMemberId: actor.memberId, proposedAt: now, correctionReason: reason });
    transaction.create(correction, { correctionId: replacementId, season: input.season, domain: 'award-obligation', originalRecordId: input.obligationId, correctionType: 'replacement', reason, recordedAt: now, recordedByMemberId: actor.memberId, replacementRecordId: replacementId, source: 'commissioner-award-correction', requestId: input.requestId });
    transaction.create(event, { eventType: 'award-obligation-corrected', season: input.season, originalObligationId: input.obligationId, replacementObligationId: replacementId, category: data.category, ownerId: data.ownerId, amountCents: data.amountCents, actorMemberId: actor.memberId, reason, createdAt: now, referenceId: replacementId });
    transaction.create(request, { requestId: input.requestId, correctionId: replacementId, result: 'created', createdAt: now });
  });
  return { correctionId: replacementId, replacementObligationId: replacementId, alreadyExists };
}
