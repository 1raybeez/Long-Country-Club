import { FieldValue } from 'firebase-admin/firestore';
import { getCurrentMemberSession } from '@/lib/auth/session';
import { getFirebaseAdminFirestore } from '@/lib/auth/firebaseAdmin';
import { OPERATIONAL_SEASON } from '@/lib/finance/operationalLedger';
import { getFinancialRules } from '@/lib/financeRules';
import type { OperationalAwardStatus } from '@/lib/types/awardObligation';

type WorkflowAction = 'approve' | 'reject';

function validateInput(season: number, obligationId: string, action: WorkflowAction, reason?: string) {
  const weeks = getFinancialRules().regularSeasonWeeks;
  if (season !== OPERATIONAL_SEASON) throw new Error('Award workflow is limited to the active operational season.');
  const validWeekly = /^[0-9]{4}-weekly-high-(0[1-9]|1[0-4])$/.test(obligationId);
  const validPostseason = /^[0-9]{4}-(fourth-place|third-place|runner-up|champion)$/.test(obligationId);
  if (!validWeekly && !validPostseason) throw new Error('Invalid award obligation ID.');
  if (action === 'reject' && (!reason || reason.trim().length < 3 || reason.trim().length > 500)) throw new Error('A concise rejection reason is required.');
  if (weeks === null) throw new Error('Regular-season week count is not configured.');
}

export async function transitionWeeklyAward(input: { season: number; obligationId: string; action: WorkflowAction; reason?: string }) {
  const session = await getCurrentMemberSession();
  if (!session?.member?.capabilities.includes('commissioner')) throw new Error('Commissioner authorization required.');
  const actor = session.member;
  validateInput(input.season, input.obligationId, input.action, input.reason);
  const db = getFirebaseAdminFirestore();
  if (!db) throw new Error('Operational finance storage is unavailable.');
  const season = db.collection('financeSeasons').doc(String(input.season));
  const award = season.collection('awards').doc(input.obligationId);
  const event = season.collection('events').doc(`award-${input.action === 'approve' ? 'approved' : 'rejected'}-${input.obligationId}`);
  let existingStatus: OperationalAwardStatus | null = null;
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(award);
    if (!snapshot.exists) throw new Error('Award obligation not found.');
    const data = snapshot.data() ?? {};
    if (!['weekly-high', 'fourth-place', 'third-place', 'runner-up', 'champion'].includes(String(data.category)) || data.obligationId !== input.obligationId || Number(data.season) !== input.season) throw new Error('Award obligation context is invalid.');
    if (data.status !== 'proposed') { existingStatus = data.status as OperationalAwardStatus; return; }
    if (event) {
      const eventSnapshot = await transaction.get(event);
      if (eventSnapshot.exists) throw new Error('Award workflow event already exists.');
    }
    const now = FieldValue.serverTimestamp();
    const approved = input.action === 'approve';
    transaction.update(award, approved ? { status: 'approved', approvedAt: now, approvedByMemberId: actor.memberId } : { status: 'rejected', rejectedAt: now, rejectedByMemberId: actor.memberId, rejectionReason: input.reason?.trim() });
    transaction.create(event, { eventType: approved ? 'award-approved' : 'award-rejected', season: input.season, obligationId: input.obligationId, category: data.category, ...(data.week === undefined ? {} : { week: data.week }), ...(data.placement === undefined ? {} : { placement: data.placement }), ownerId: data.ownerId, amountCents: data.amountCents, actorMemberId: actor.memberId, createdAt: now, referenceId: input.obligationId, source: data.source, sourceReference: data.sourceReference, ...(approved ? {} : { reason: input.reason?.trim() }), summary: approved ? 'Award approved' : 'Award rejected' });
  });
  if (existingStatus) return { obligationId: input.obligationId, status: existingStatus, alreadyHandled: true };
  return { obligationId: input.obligationId, status: input.action === 'approve' ? 'approved' as const : 'rejected' as const, alreadyHandled: false };
}
