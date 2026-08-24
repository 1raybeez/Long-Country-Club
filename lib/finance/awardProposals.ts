import { FieldValue } from 'firebase-admin/firestore';
import { getCurrentMemberSession } from '@/lib/auth/session';
import { getFirebaseAdminFirestore } from '@/lib/auth/firebaseAdmin';
import { getLeagueInfo } from '@/lib/sleeper';
import { OPERATIONAL_SEASON } from '@/lib/finance/operationalLedger';
import { getAwardAmountCents, getAwardObligationId } from '@/lib/finance/awardObligations';
import { evaluateWeeklyAwardReadiness, getPostseasonAwardReadiness } from '@/lib/finance/awardReadiness';
import { getFinancialRules } from '@/lib/financeRules';
import type { OperationalAwardObligation } from '@/lib/types/awardObligation';

const WEEKLY_CATEGORY = 'weekly-high' as const;

export interface WeeklyAwardProposalSummary {
  readonly obligationId: string;
  readonly season: number;
  readonly category: 'weekly-high';
  readonly amountCents: number;
  readonly ownerId: string | null;
  readonly week: number;
  readonly status: OperationalAwardObligation['status'];
  readonly rejectionReason?: string;
}

export interface PostseasonAwardProposalSummary {
  readonly obligationId: string;
  readonly season: number;
  readonly category: 'fourth-place' | 'third-place' | 'runner-up' | 'champion';
  readonly amountCents: number;
  readonly ownerId: string | null;
  readonly teamName?: string | null;
  readonly placement: number;
  readonly status: OperationalAwardObligation['status'];
  readonly rejectionReason?: string;
}

export type AwardProposalSummary = WeeklyAwardProposalSummary | PostseasonAwardProposalSummary;

function weekSourceReference(season: number, week: number) {
  return `sleeper:${season}:regular-season-week-${String(week).padStart(2, '0')}`;
}

function validateContext(season: number, week: number) {
  const regularSeasonWeeks = getFinancialRules().regularSeasonWeeks;
  if (season !== OPERATIONAL_SEASON) throw new Error('Award proposals are limited to the active operational season.');
  if (regularSeasonWeeks === null || !Number.isInteger(week) || week < 1 || week > regularSeasonWeeks) throw new Error('Weekly award proposal week is outside the regular season.');
}

async function getServerFinalityOptions(week: number) {
  try {
    const league = await getLeagueInfo();
    const settings = (league as { settings?: { leg?: unknown } }).settings;
    const currentWeek = typeof settings?.leg === 'number' ? settings.leg : typeof (league as { current_week?: unknown }).current_week === 'number' ? (league as { current_week: number }).current_week : undefined;
    return { currentActiveWeek: currentWeek, conservativeDelaySatisfied: currentWeek !== undefined && currentWeek > week };
  } catch {
    return { conservativeDelaySatisfied: false };
  }
}

export async function getWeeklyAwardProposals(season: number): Promise<readonly WeeklyAwardProposalSummary[]> {
  const db = getFirebaseAdminFirestore();
  if (!db) return [];
  const snapshot = await db.collection('financeSeasons').doc(String(season)).collection('awards').where('category', '==', WEEKLY_CATEGORY).get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return { obligationId: doc.id, season: Number(data.season), category: WEEKLY_CATEGORY, amountCents: Number(data.amountCents), ownerId: typeof data.ownerId === 'string' ? data.ownerId : null, week: Number(data.week), status: data.status, ...(typeof data.rejectionReason === 'string' ? { rejectionReason: data.rejectionReason } : {}) };
  });
}

export async function getPostseasonAwardProposals(season: number): Promise<readonly PostseasonAwardProposalSummary[]> {
  const db = getFirebaseAdminFirestore();
  if (!db) return [];
  const categories = new Set(['fourth-place', 'third-place', 'runner-up', 'champion']);
  const snapshot = await db.collection('financeSeasons').doc(String(season)).collection('awards').get();
  return snapshot.docs.flatMap((doc) => {
    const data = doc.data();
    if (!categories.has(String(data.category))) return [];
    return [{ obligationId: doc.id, season: Number(data.season), category: data.category, amountCents: Number(data.amountCents), ownerId: typeof data.ownerId === 'string' ? data.ownerId : null, teamName: typeof data.teamName === 'string' ? data.teamName : null, placement: Number(data.placement), status: data.status, ...(typeof data.rejectionReason === 'string' ? { rejectionReason: data.rejectionReason } : {}) } as PostseasonAwardProposalSummary];
  });
}

export async function proposeWeeklyHighAward(input: { season: number; week: number }) {
  const session = await getCurrentMemberSession();
  if (!session?.member?.capabilities.includes('commissioner')) throw new Error('Commissioner authorization required.');
  const actor = session.member;
  validateContext(input.season, input.week);
  const finality = await getServerFinalityOptions(input.week);
  const readiness = evaluateWeeklyAwardReadiness(input.season, input.week, finality);
  if (readiness.status !== 'ready' || !readiness.candidateOwnerId || readiness.highestScore === null) throw new Error(`Weekly award is not ready for proposal: ${readiness.reasons.join('; ') || readiness.status}.`);
  const db = getFirebaseAdminFirestore();
  if (!db) throw new Error('Operational finance storage is unavailable.');

  const obligationId = getAwardObligationId(input.season, WEEKLY_CATEGORY, input.week);
  const amountCents = getAwardAmountCents(WEEKLY_CATEGORY);
  const sourceReference = weekSourceReference(input.season, input.week);
  const readinessEvidence = { status: 'ready' as const, highestScore: readiness.highestScore, nextHighestScore: readiness.nextHighestScore, sourceReference, conservativeDelaySatisfied: finality.conservativeDelaySatisfied, ...(finality.currentActiveWeek === undefined ? {} : { currentActiveWeek: finality.currentActiveWeek }) };
  const award = db.collection('financeSeasons').doc(String(input.season)).collection('awards').doc(obligationId);
  const event = db.collection('financeSeasons').doc(String(input.season)).collection('events').doc(`award-proposed-${obligationId}`);
  const proposal = {
    obligationId,
    season: input.season,
    category: WEEKLY_CATEGORY,
    amountCents,
    ownerId: readiness.candidateOwnerId,
    week: input.week,
    source: 'sleeper',
    sourceReference,
    status: 'proposed',
    proposedByMemberId: actor.memberId,
    readinessEvidence,
  } satisfies Omit<OperationalAwardObligation, 'proposedAt'>;

  let existingStatus: OperationalAwardObligation['status'] | null = null;
  await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(award);
    if (existing.exists) { existingStatus = existing.data()?.status as OperationalAwardObligation['status'] ?? 'issue'; return; }
    const now = FieldValue.serverTimestamp();
    transaction.create(award, { ...proposal, proposedAt: now });
    transaction.create(event, { eventType: 'award-proposed', season: input.season, obligationId, category: WEEKLY_CATEGORY, week: input.week, ownerId: readiness.candidateOwnerId, amountCents, actorMemberId: actor.memberId, createdAt: now, referenceId: obligationId, source: 'sleeper', sourceReference, summary: 'Weekly-high award proposed' });
  });
  if (existingStatus) return { obligationId, status: existingStatus, alreadyExists: true };
  return { obligationId, status: 'proposed' as const, alreadyExists: false, ownerId: readiness.candidateOwnerId, amountCents };
}

const POSTSEASON_CATEGORIES = ['fourth-place', 'third-place', 'runner-up', 'champion'] as const;
type PostseasonCategory = typeof POSTSEASON_CATEGORIES[number];

async function getServerPostseasonFinality() {
  try {
    const league = await getLeagueInfo();
    return (league as { status?: unknown }).status === 'complete';
  } catch {
    return false;
  }
}

async function getChampionContext(db: NonNullable<ReturnType<typeof getFirebaseAdminFirestore>>, season: number) {
  const rules = getFinancialRules();
  const seasonRef = db.collection('financeSeasons').doc(String(season));
  const [seasonSnapshot, expenseSnapshot] = await Promise.all([seasonRef.get(), seasonRef.collection('expenses').doc(`championship-ring-${season}`).get()]);
  const seasonData = seasonSnapshot.data() ?? {};
  const actualRingExpenseCents = Number(expenseSnapshot.data()?.amountCents);
  const ringReserveMaxCents = Number(seasonData.ringReserveMaxCents) || (rules.ringReserve ?? 0) * 100;
  if (!Number.isInteger(actualRingExpenseCents) || actualRingExpenseCents < 0 || !Number.isInteger(ringReserveMaxCents) || ringReserveMaxCents < actualRingExpenseCents) throw new Error('Verified ring allocation context is unavailable.');
  return { championBaseCents: (rules.playoffPayouts.championBase ?? 0) * 100, ringReserveMaxCents, actualRingExpenseCents };
}

export async function proposePostseasonAward(input: { season: number; category: PostseasonCategory }) {
  const session = await getCurrentMemberSession();
  if (!session?.member?.capabilities.includes('commissioner')) throw new Error('Commissioner authorization required.');
  const actor = session.member;
  if (input.season !== OPERATIONAL_SEASON) throw new Error('Award proposals are limited to the active operational season.');
  if (!POSTSEASON_CATEGORIES.includes(input.category)) throw new Error('Unsupported postseason award category.');
  const db = getFirebaseAdminFirestore();
  if (!db) throw new Error('Operational finance storage is unavailable.');
  const finalitySignal = await getServerPostseasonFinality();
  const championContext = input.category === 'champion' ? await getChampionContext(db, input.season) : undefined;
  const readiness = getPostseasonAwardReadiness(input.season, { finalitySignal, ...(championContext ? { championContext } : {}) });
  const item = readiness.find((candidate) => candidate.category === input.category);
  if (!item || item.status !== 'ready' || !item.ownerId || item.placement === null || item.amountCents === null) throw new Error(`Postseason award is not ready for proposal: ${item?.reason ?? 'unsupported category'}`);
  const obligationId = getAwardObligationId(input.season, input.category);
  const award = db.collection('financeSeasons').doc(String(input.season)).collection('awards').doc(obligationId);
  const event = db.collection('financeSeasons').doc(String(input.season)).collection('events').doc(`award-proposed-${obligationId}`);
  let existingStatus: OperationalAwardObligation['status'] | null = null;
  await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(award);
    if (existing.exists) { existingStatus = existing.data()?.status as OperationalAwardObligation['status'] ?? 'issue'; return; }
    const now = FieldValue.serverTimestamp();
    transaction.create(award, { obligationId, season: input.season, category: input.category, amountCents: item.amountCents, ownerId: item.ownerId, teamName: item.teamName, placement: item.placement, source: 'sleeper', sourceReference: item.sourceReference, status: 'proposed', proposedByMemberId: actor.memberId, readinessEvidence: item.finalityEvidence, proposedAt: now });
    transaction.create(event, { eventType: 'award-proposed', season: input.season, obligationId, category: input.category, placement: item.placement, ownerId: item.ownerId, teamName: item.teamName, amountCents: item.amountCents, actorMemberId: actor.memberId, createdAt: now, referenceId: obligationId, source: 'sleeper', sourceReference: item.sourceReference, summary: 'Postseason award proposed' });
  });
  if (existingStatus) return { obligationId, status: existingStatus, alreadyExists: true };
  return { obligationId, status: 'proposed' as const, alreadyExists: false, ownerId: item.ownerId, placement: item.placement, amountCents: item.amountCents };
}
