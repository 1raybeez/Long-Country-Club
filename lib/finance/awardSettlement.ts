import { FieldValue } from 'firebase-admin/firestore';
import { getCurrentMemberSession } from '@/lib/auth/session';
import { getFirebaseAdminFirestore } from '@/lib/auth/firebaseAdmin';
import { OPERATIONAL_SEASON } from '@/lib/finance/operationalLedger';
import { getFinancialRules } from '@/lib/financeRules';
import type { AwardSettlementMethod, OperationalAwardStatus } from '@/lib/types/awardObligation';

const METHODS: readonly AwardSettlementMethod[] = ['venmo', 'paypal', 'other'];

export async function applyAwardToLeagueFees(input: { season: number; obligationId: string; requestId: string; notes?: string }) {
  const session = await getCurrentMemberSession();
  if (!session?.member?.capabilities.includes('commissioner')) throw new Error('Commissioner authorization required.');
  const actor = session.member;
  if (input.season !== OPERATIONAL_SEASON || !/^[0-9]{4}-(?:weekly-high-(?:0[1-9]|1[0-4])|[a-z0-9-]+)$/.test(input.obligationId) || !/^[A-Za-z0-9_-]{8,100}$/.test(input.requestId)) throw new Error('Invalid award credit request.');
  const db = getFirebaseAdminFirestore();
  if (!db) throw new Error('Operational finance storage is unavailable.');
  const season = db.collection('financeSeasons').doc(String(input.season));
  const award = season.collection('awards').doc(input.obligationId);
  const settlement = season.collection('awardSettlements').doc(`award-credit-${input.obligationId}`);
  const event = season.collection('events').doc(`award-credit-${input.obligationId}`);
  await db.runTransaction(async (transaction) => {
    const awardSnapshot = await transaction.get(award);
    if (!awardSnapshot.exists) throw new Error('Award obligation not found.');
    const data = awardSnapshot.data() ?? {};
    if (data.status !== 'approved' || typeof data.ownerId !== 'string' || !Number.isInteger(data.amountCents) || data.amountCents <= 0) throw new Error('Only an earned approved award may be credited.');
    if ((await transaction.get(settlement)).exists) throw new Error('Award credit already exists.');
    const assessments = await transaction.get(season.collection('assessments').where('ownerId', '==', data.ownerId).limit(1));
    if (assessments.empty) throw new Error('Owner league-fee assessment not found.');
    const assessed = Number(assessments.docs[0].data().amountCents);
    const payments = await transaction.get(season.collection('payments').where('ownerId', '==', data.ownerId));
    const credits = await transaction.get(season.collection('awardSettlements').where('ownerId', '==', data.ownerId).where('method', '==', 'league-fee-credit'));
    const cashPaid = payments.docs.reduce((sum, doc) => sum + (Number(doc.data().amountCents) || 0), 0);
    const priorCredits = credits.docs.reduce((sum, doc) => sum + (Number(doc.data().amountCents) || 0), 0);
    const remaining = Math.max(0, assessed - cashPaid - priorCredits);
    const amountCents = Math.min(Number(data.amountCents), remaining);
    if (amountCents <= 0) throw new Error('Owner has no outstanding league-fee balance.');
    const now = FieldValue.serverTimestamp();
    transaction.create(settlement, { settlementId: settlement.id, season: input.season, obligationId: input.obligationId, ownerId: data.ownerId, amountCents, method: 'league-fee-credit', settlementType: 'APPLIED_TO_LEAGUE_FEES', effectiveDate: new Date().toISOString().slice(0, 10), recordedAt: now, recordedByMemberId: actor.memberId, source: 'commissioner-award-to-dues-credit', requestId: input.requestId, ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}) });
    if ((await transaction.get(event)).exists) throw new Error('Award-credit event already exists.');
    transaction.create(event, { eventType: 'award-credit-applied', season: input.season, obligationId: input.obligationId, ownerId: data.ownerId, amountCents, actorMemberId: actor.memberId, createdAt: now, referenceId: settlement.id, summary: 'Award credit applied to league fees' });
  });
  return { obligationId: input.obligationId, status: 'applied-to-league-fees' as const };
}

function validateInput(input: { season: number; obligationId: string; method: string; effectiveDate: string; requestId: string; notes?: string }) {
  const weeks = getFinancialRules().regularSeasonWeeks;
  if (input.season !== OPERATIONAL_SEASON) throw new Error('Award settlement is limited to the active operational season.');
  if (!/^[0-9]{4}-(?:weekly-high-(?:0[1-9]|1[0-4])|[a-z0-9-]+)$/.test(input.obligationId)) throw new Error('Invalid award obligation ID.');
  if (!METHODS.includes(input.method as AwardSettlementMethod)) throw new Error('Unsupported award settlement method.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveDate) || Number.isNaN(Date.parse(`${input.effectiveDate}T00:00:00Z`))) throw new Error('Settlement date must be a valid YYYY-MM-DD date.');
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(input.requestId)) throw new Error('Invalid settlement request ID.');
  if (input.notes !== undefined && input.notes.trim().length > 500) throw new Error('Settlement notes are limited to 500 characters.');
  if (weeks === null) throw new Error('Regular-season week count is not configured.');
}

export async function settleApprovedAward(input: { season: number; obligationId: string; method: string; effectiveDate: string; requestId: string; notes?: string }) {
  const session = await getCurrentMemberSession();
  if (!session?.member?.capabilities.includes('commissioner')) throw new Error('Commissioner authorization required.');
  const actor = session.member;
  validateInput(input);
  const db = getFirebaseAdminFirestore();
  if (!db) throw new Error('Operational finance storage is unavailable.');
  const season = db.collection('financeSeasons').doc(String(input.season));
  const award = season.collection('awards').doc(input.obligationId);
  const settlementId = `award-settlement-${input.obligationId}`;
  const settlement = season.collection('awardSettlements').doc(settlementId);
  const event = season.collection('events').doc(`award-paid-${input.obligationId}`);
  let alreadySettled = false;
  let existingSettlementId: string | null = null;

  await db.runTransaction(async (transaction) => {
    const [awardSnapshot, settlementSnapshot, eventSnapshot] = await transaction.getAll(award, settlement, event);
    if (!awardSnapshot.exists) throw new Error('Award obligation not found.');
    const data = awardSnapshot.data() ?? {};
    const status = data.status as OperationalAwardStatus;
    if (status === 'paid') {
      if (!settlementSnapshot.exists) throw new Error('Paid award has no settlement record.');
      alreadySettled = true;
      existingSettlementId = settlementSnapshot.id;
      return;
    }
    if (status !== 'approved') throw new Error('Only approved award obligations may be settled.');
    if (typeof data.ownerId !== 'string' || !Number.isInteger(data.amountCents) || data.amountCents <= 0) throw new Error('Approved award obligation is not settlement-ready.');
    if (settlementSnapshot.exists) throw new Error('Award settlement already exists.');
    const creditSnapshot = await transaction.get(season.collection('awardSettlements').where('obligationId', '==', input.obligationId).where('method', '==', 'league-fee-credit'));
    const creditedCents = creditSnapshot.docs.reduce((sum, doc) => sum + Math.max(0, Number(doc.data().amountCents) || 0), 0);
    const cashAmountCents = Number(data.amountCents) - creditedCents;
    if (cashAmountCents <= 0) throw new Error('Award is already fully settled through league-fee credit.');
    const now = FieldValue.serverTimestamp();
    transaction.create(settlement, { settlementId, season: input.season, obligationId: input.obligationId, ownerId: data.ownerId, amountCents: cashAmountCents, method: input.method, settlementType: 'CASH_PAID', effectiveDate: input.effectiveDate, recordedAt: now, recordedByMemberId: actor.memberId, source: 'commissioner-award-settlement', requestId: input.requestId, ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}) });
    transaction.update(award, { status: 'paid', settlementReference: settlementId, paidAt: now, paidByMemberId: actor.memberId });
    if (eventSnapshot.exists) throw new Error('Award-paid event already exists.');
    transaction.create(event, { eventType: 'award-paid', season: input.season, obligationId: input.obligationId, settlementId, category: data.category, week: data.week, ownerId: data.ownerId, amountCents: cashAmountCents, actorMemberId: actor.memberId, effectiveDate: input.effectiveDate, createdAt: now, referenceId: settlementId, summary: 'Award settlement recorded' });
  });
  if (alreadySettled) return { obligationId: input.obligationId, settlementId: existingSettlementId, status: 'paid' as const, alreadySettled: true };
  return { obligationId: input.obligationId, settlementId, status: 'paid' as const, alreadySettled: false };
}
