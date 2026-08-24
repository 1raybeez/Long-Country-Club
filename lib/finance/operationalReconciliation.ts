import { getFirebaseAdminFirestore } from '@/lib/auth/firebaseAdmin';
import { getOwnerById } from '@/lib/ownerRegistry';
import { ALL_LCC_OWNERS } from '@/lib/lccOwners';
import { loadSeasonFinancialData } from '@/lib/history/financial';
import { evaluateSeasonWeeklyAwardReadiness } from '@/lib/finance/awardReadiness';
import { getPostseasonAwardReadiness } from '@/lib/finance/postseasonReadiness';
import { getFinancialRules, LCC_RESTRICTED_VACU_RESERVE_CENTS } from '@/lib/financeRules';
import { OPERATIONAL_SEASON } from '@/lib/finance/operationalLedger';
import type { LccSleeperSeason } from '@/lib/leagueConstants';
import type { OperationalAwardStatus } from '@/lib/types/awardObligation';

export type ReconciliationCheckStatus = 'pass' | 'waiting' | 'action-required' | 'issue' | 'blocking';

export interface ReconciliationCheck {
  readonly key: string;
  readonly label: string;
  readonly status: ReconciliationCheckStatus;
  readonly reason: string;
  readonly detail: string;
  readonly blocking: boolean;
}

export interface OperationalReconciliationResult {
  readonly season: number;
  readonly status: ReconciliationCheckStatus;
  readonly readyToClose: boolean;
  readonly blockingIssues: readonly string[];
  readonly warnings: readonly string[];
  readonly actionRequired: readonly string[];
  readonly checks: readonly ReconciliationCheck[];
  readonly summary: {
    readonly duesAssessedCents: number;
    readonly duesCollectedCents: number;
    readonly duesOutstandingCents: number;
    readonly paidOwnerCount: number;
    readonly partialOwnerCount: number;
    readonly unpaidOwnerCount: number;
    readonly expectedAwardSlots: number;
    readonly weeklyWaitingCount: number;
    readonly weeklyReadyCount: number;
    readonly weeklyProposedCount: number;
    readonly weeklyApprovedCount: number;
    readonly weeklyPaidCount: number;
    readonly weeklyRejectedCount: number;
    readonly weeklyIssueCount: number;
    readonly postseasonWaitingCount: number;
    readonly approvedUnpaidCount: number;
    readonly approvedUnpaidAmountCents: number;
    readonly settlementCount: number;
    readonly verifiedExpenseCents: number;
    readonly ringReserveMaxCents: number;
    readonly unusedRingReserveCents: number;
    readonly projectedChampionCents: number;
    readonly restrictedReserveCents: number;
  };
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const validMethods = new Set(['venmo', 'paypal', 'other']);
const statusSet = new Set<OperationalAwardStatus>(['proposed', 'approved', 'paid', 'rejected', 'issue']);

function check(key: string, label: string, status: ReconciliationCheckStatus, reason: string, detail: string, blocking = false): ReconciliationCheck { return { key, label, status, reason, detail, blocking }; }

export async function getOperationalReconciliation(season: number): Promise<OperationalReconciliationResult> {
  const db = getFirebaseAdminFirestore();
  if (!db) return unavailableResult(season);
  const seasonRef = db.collection('financeSeasons').doc(String(season));
  const [seasonSnapshot, assessments, payments, requests, expenses, awards, settlements, events] = await Promise.all([
    seasonRef.get(), seasonRef.collection('assessments').get(), seasonRef.collection('payments').get(), seasonRef.collection('requests').get(), seasonRef.collection('expenses').get(), seasonRef.collection('awards').get(), seasonRef.collection('awardSettlements').get(), seasonRef.collection('events').get(),
  ]);
  const seasonData = seasonSnapshot.data() ?? {};
  const expectedOwners = loadSeasonFinancialData(season as LccSleeperSeason).managers.map((manager) => manager.managerId).filter((id): id is string => Boolean(id));
  const expectedOwnerSet = new Set(expectedOwners);
  const assessmentOwners = assessments.docs.map((doc) => String(doc.data().ownerId));
  const duplicateAssessments = assessmentOwners.length !== new Set(assessmentOwners).size;
  const unknownAssessments = assessmentOwners.filter((ownerId) => !expectedOwnerSet.has(ownerId));
  const assessmentAmountsValid = assessments.docs.every((doc) => Number.isInteger(doc.data().amountCents) && doc.data().amountCents === 5000);
  const assessedCents = assessments.docs.reduce((sum, doc) => sum + (Number(doc.data().amountCents) || 0), 0);
  const paymentsByOwner = new Map<string, number>();
  payments.docs.forEach((doc) => { const data = doc.data(); const ownerId = String(data.ownerId); const amount = (paymentsByOwner.get(ownerId) ?? 0) + (Number(data.amountCents) || 0); paymentsByOwner.set(ownerId, amount); });
  const collectedCents = [...paymentsByOwner.values()].reduce((sum, amount) => sum + amount, 0);
  const paymentOwnerUnknown = [...paymentsByOwner.keys()].filter((ownerId) => !expectedOwnerSet.has(ownerId));
  const overpaidOwners = assessments.docs.filter((doc) => (paymentsByOwner.get(String(doc.data().ownerId)) ?? 0) > (Number(doc.data().amountCents) || 0));
  const missingAssessmentOwners = expectedOwners.filter((ownerId) => !assessmentOwners.includes(ownerId));
  const paymentEventByReference = new Set(events.docs.flatMap((doc) => doc.data().eventType === 'dues-payment-recorded' ? [String(doc.data().referenceId ?? doc.id)] : doc.data().eventType === 'dues-payment-reversed' ? [String(doc.data().reversalPaymentId ?? '')] : []));
  const paymentEventReferences = events.docs.filter((doc) => doc.data().eventType === 'dues-payment-recorded').map((doc) => String(doc.data().referenceId ?? doc.id));
  const duplicatePaymentEvents = paymentEventReferences.length !== new Set(paymentEventReferences).size;
  const orphanPaymentEvents = events.docs.filter((doc) => doc.data().eventType === 'dues-payment-recorded' && !payments.docs.some((payment) => payment.id === String(doc.data().referenceId ?? '')));
  const missingPaymentEvents = payments.docs.filter((payment) => !paymentEventByReference.has(payment.id));
  const requestIds = requests.docs.map((doc) => String(doc.data().requestId ?? doc.id));
  const duplicateRequests = requestIds.length !== new Set(requestIds).size;
  const orphanRequests = requests.docs.filter((doc) => !payments.docs.some((payment) => payment.id === String(doc.data().paymentId ?? '')));
  const paidOwnerCount = expectedOwners.filter((ownerId) => (paymentsByOwner.get(ownerId) ?? 0) >= 5000).length;
  const partialOwnerCount = expectedOwners.filter((ownerId) => { const amount = paymentsByOwner.get(ownerId) ?? 0; return amount > 0 && amount < 5000; }).length;
  const unpaidOwnerCount = expectedOwners.filter((ownerId) => (paymentsByOwner.get(ownerId) ?? 0) === 0).length;
  const duesIntegrityIssue = duplicateAssessments || unknownAssessments.length > 0 || !assessmentAmountsValid || missingAssessmentOwners.length > 0 || paymentOwnerUnknown.length > 0 || overpaidOwners.length > 0 || orphanPaymentEvents.length > 0 || missingPaymentEvents.length > 0 || duplicateRequests || orphanRequests.length > 0 || assessments.size !== expectedOwners.length;
  const duesOutstandingCents = Math.max(0, assessedCents - collectedCents);
  const duesStatus = duesIntegrityIssue ? 'issue' : duesOutstandingCents > 0 ? 'action-required' : 'pass';

  const readiness = evaluateSeasonWeeklyAwardReadiness(season);
  const awardData = awards.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  const invalidAwardStatuses = awardData.filter((award) => !statusSet.has(award.data.status as OperationalAwardStatus));
  const weeklyAwards = awardData.filter((award) => award.data.category === 'weekly-high');
  const weeklyByWeek = new Map(weeklyAwards.map((award) => [Number(award.data.week), award.data]));
  const weeklyWaitingCount = readiness.filter((item) => item.status === 'waiting' && !weeklyByWeek.has(item.week)).length;
  const weeklyReadyCount = readiness.filter((item) => item.status === 'ready' && !weeklyByWeek.has(item.week)).length;
  const weeklyIssueCount = readiness.filter((item) => item.status === 'issue').length;
  const weeklyProposedCount = readiness.filter((item) => weeklyByWeek.get(item.week)?.status === 'proposed').length;
  const weeklyApprovedCount = readiness.filter((item) => weeklyByWeek.get(item.week)?.status === 'approved').length;
  const weeklyPaidCount = readiness.filter((item) => weeklyByWeek.get(item.week)?.status === 'paid').length;
  const weeklyRejectedCount = readiness.filter((item) => weeklyByWeek.get(item.week)?.status === 'rejected').length;
  const postseasonReadiness = getPostseasonAwardReadiness(season);
  const postseasonWaitingCount = postseasonReadiness.filter((item) => item.status === 'waiting').length;
  const postseasonReadyCount = postseasonReadiness.filter((item) => item.status === 'ready').length;
  const postseasonIssueCount = postseasonReadiness.filter((item) => item.status === 'issue').length;
  const awardStatusIssue = invalidAwardStatuses.length > 0 || awardData.some((award) => award.data.category === 'weekly-high' && (!Number.isInteger(award.data.week) || Number(award.data.week) < 1 || Number(award.data.week) > 14));
  const awardBlocking = weeklyReadyCount + weeklyProposedCount + weeklyApprovedCount + weeklyRejectedCount + weeklyIssueCount > 0 || weeklyWaitingCount > 0 || postseasonWaitingCount > 0 || postseasonReadyCount > 0 || postseasonIssueCount > 0;
  const awardsCheck = awardStatusIssue ? check('awards', 'Awards', 'issue', 'Award obligation data contains an invalid status or slot.', `${invalidAwardStatuses.length} invalid award records.`, true) : check('awards', 'Awards', weeklyIssueCount > 0 || postseasonIssueCount > 0 ? 'issue' : awardBlocking ? (weeklyWaitingCount > 0 || postseasonWaitingCount > 0 ? 'waiting' : 'action-required') : 'pass', weeklyWaitingCount > 0 ? 'Weekly Sleeper results are not final.' : postseasonIssueCount > 0 ? 'Postseason result integrity requires review.' : postseasonReadyCount > 0 ? 'Postseason placements are ready for the next proposal phase.' : postseasonWaitingCount > 0 ? 'Postseason obligations remain future/unresolved.' : 'Award obligations are complete.', `${weeklyWaitingCount} weekly waiting · ${postseasonWaitingCount} postseason waiting · ${postseasonReadyCount} postseason ready.`, awardBlocking);

  const settlementByObligation = new Map<string, { id: string; data: Record<string, unknown> }[]>();
  const orphanSettlements: string[] = [];
  const settlementIssues: string[] = [];
  settlements.docs.forEach((doc) => { const data = doc.data() as Record<string, unknown>; const obligationId = String(data.obligationId ?? ''); const entries = settlementByObligation.get(obligationId) ?? []; entries.push({ id: doc.id, data }); settlementByObligation.set(obligationId, entries); const award = awardData.find((item) => item.id === obligationId); const isReversal = data.correctionType === 'reversal'; if (!award) orphanSettlements.push(doc.id); else { if (!isReversal && award.data.status !== 'paid' && award.data.status !== 'approved') settlementIssues.push(`${doc.id} links to invalid obligation status`); if (!isReversal && award.data.status === 'paid' && award.data.settlementReference !== doc.id) settlementIssues.push(`${doc.id} linkage mismatch`); if (award.data.ownerId !== data.ownerId || Math.abs(Number(award.data.amountCents)) !== Math.abs(Number(data.amountCents))) settlementIssues.push(`${doc.id} owner/amount mismatch`); if (!validMethods.has(String(data.method)) || typeof data.effectiveDate !== 'string') settlementIssues.push(`${doc.id} method/date invalid`); if (isReversal && typeof data.originalSettlementId !== 'string') settlementIssues.push(`${doc.id} reversal lineage missing`); } });
  const paidEvents = events.docs.filter((doc) => doc.data().eventType === 'award-paid');
  const duplicatePaidEvents = new Set(paidEvents.map((doc) => String(doc.data().obligationId ?? doc.id))).size !== paidEvents.length;
  const missingPaidEvents = [...settlementByObligation.entries()].filter(([, entries]) => entries.reduce((sum, entry) => sum + Number(entry.data.amountCents || 0), 0) > 0).map(([id]) => id).filter((id) => !paidEvents.some((event) => event.data().obligationId === id));
  const expectedAwardEventTypes: Record<string, string> = { proposed: 'award-proposed', approved: 'award-approved', rejected: 'award-rejected', paid: 'award-paid' };
  const missingAwardEvents = awardData.filter((award) => expectedAwardEventTypes[award.data.status as string] && !events.docs.some((event) => event.data().eventType === expectedAwardEventTypes[award.data.status as string] && event.data().obligationId === award.id));
  const settlementIntegrityIssue = orphanSettlements.length > 0 || settlementIssues.length > 0 || duplicatePaidEvents || missingPaidEvents.length > 0;
  const approvedUnpaid = awardData.filter((award) => award.data.status === 'approved');
  const settlementsCheck = settlementIntegrityIssue ? check('settlements', 'Award settlements', 'issue', 'Settlement records do not match award obligations/events.', `${settlementIssues.length + orphanSettlements.length} settlement issues.`, true) : approvedUnpaid.length > 0 ? check('settlements', 'Award settlements', 'action-required', 'Approved awards are awaiting settlement.', `${approvedUnpaid.length} approved but unpaid.`, true) : check('settlements', 'Award settlements', 'pass', 'No approved awards are awaiting settlement.', 'No settlement records require review.');

  const allRingExpenses = expenses.docs.filter((doc) => doc.data().type === 'ring');
  const ringExpenses = allRingExpenses.filter((doc) => doc.id === 'championship-ring-2026' || doc.data().originalExpenseId === 'championship-ring-2026');
  const baseRingExpenses = ringExpenses.filter((doc) => doc.id === 'championship-ring-2026');
  const ringExpenseCents = ringExpenses.reduce((sum, doc) => sum + (Number(doc.data().amountCents) || 0), 0);
  const ringReserveMaxCents = Number(seasonData.ringReserveMaxCents) || 8000;
  const malformedExpenseCorrection = ringExpenses.some((doc) => doc.id !== 'championship-ring-2026' && (doc.data().correctionType !== 'reversal' || doc.data().originalExpenseId !== 'championship-ring-2026'));
  const expenseIssue = baseRingExpenses.length !== 1 || malformedExpenseCorrection || ringExpenseCents <= 0 || ringExpenseCents > ringReserveMaxCents;
  const expensesCheck = expenseIssue ? check('expenses', 'Expenses', 'issue', 'Ring expense record is missing, duplicated, invalid, or exceeds reserve.', `${ringExpenseCents} cents ring expense.`, true) : check('expenses', 'Expenses', 'pass', 'Verified ring expense remains separate from awards.', `${money(ringExpenseCents)} ring expense.`);
  const unusedRingReserveCents = Math.max(0, ringReserveMaxCents - ringExpenseCents);
  const championBaseCents = (getFinancialRules().playoffPayouts.championBase ?? 0) * 100;
  const projectedChampionCents = championBaseCents + unusedRingReserveCents;
  const reserveValid = Number(seasonData.restrictedReserveCents) === LCC_RESTRICTED_VACU_RESERVE_CENTS && seasonData.restricted === true && seasonData.restrictedReserveCustodian === 'VACU' && seasonData.restrictedReserveLabel === 'Future-Season Deposits';
  const reserveCheck = reserveValid ? check('reserve', 'Restricted reserve', 'pass', 'VACU reserve is restricted and separated from operating flows.', money(LCC_RESTRICTED_VACU_RESERVE_CENTS) + ' restricted.') : check('reserve', 'Restricted reserve', 'issue', 'VACU reserve metadata is missing or inconsistent.', 'Reserve custody/separation requires investigation.', true);
  const identityIssue = awardData.some((award) => award.data.ownerId && !getOwnerById(String(award.data.ownerId))) || settlements.docs.some((doc) => doc.data().ownerId && !getOwnerById(String(doc.data().ownerId)));
  const identityCheck = identityIssue ? check('identity', 'Data / identity integrity', 'issue', 'An operational owner ID does not resolve canonically.', 'Owner identity requires investigation.', true) : check('identity', 'Data / identity integrity', 'pass', 'Operational owner IDs resolve canonically.', `${ALL_LCC_OWNERS.length} canonical owners available.`);
  const auditIssue = missingPaymentEvents.length > 0 || orphanPaymentEvents.length > 0 || duplicatePaymentEvents || settlementIntegrityIssue || missingAwardEvents.length > 0;
  const auditCheck = auditIssue ? check('audit', 'Audit trail', 'issue', 'An operational record is missing or has an inconsistent audit relationship.', 'No repairs are performed by this read-only check.', true) : check('audit', 'Audit trail', 'pass', 'Expected payment and award audit relationships are intact.', `${events.size} operational events checked.`);
  const postseasonStatus = postseasonIssueCount > 0 ? 'issue' : postseasonWaitingCount > 0 ? 'waiting' : postseasonReadyCount > 0 ? 'action-required' : 'pass';
  const checks = [check('dues', 'Dues', duesStatus, duesIntegrityIssue ? 'Dues assessment/payment integrity requires investigation.' : duesOutstandingCents > 0 ? 'Outstanding dues remain; this blocks close but is not an integrity defect.' : 'Dues are fully collected.', `${assessments.size} assessments · ${money(assessedCents)} assessed · ${money(collectedCents)} collected · ${money(duesOutstandingCents)} outstanding.`, duesIntegrityIssue || duesOutstandingCents > 0), awardsCheck, settlementsCheck, expensesCheck, reserveCheck, identityCheck, check('postseason', 'Postseason completion', postseasonStatus, postseasonIssueCount > 0 ? 'Postseason result integrity requires review.' : postseasonWaitingCount > 0 ? 'Authoritative postseason placements are not available.' : postseasonReadyCount > 0 ? 'Placements are ready for proposal creation.' : 'Postseason placements are complete.', `${postseasonWaitingCount} waiting · ${postseasonReadyCount} ready · ${postseasonIssueCount} issue.`, postseasonStatus !== 'pass'), auditCheck];
  const blockingIssues = checks.filter((item) => item.blocking).map((item) => `${item.label}: ${item.reason}`);
  const actionRequired = checks.filter((item) => item.status === 'action-required').map((item) => `${item.label}: ${item.reason}`);
  const warnings = checks.filter((item) => item.status === 'waiting').map((item) => `${item.label}: ${item.reason}`);
  const readyToClose = blockingIssues.length === 0;
  const status: ReconciliationCheckStatus = checks.some((item) => item.status === 'issue') ? 'issue' : actionRequired.length ? 'action-required' : warnings.length ? 'waiting' : 'pass';
  return { season, status, readyToClose, blockingIssues, warnings, actionRequired, checks, summary: { duesAssessedCents: assessedCents, duesCollectedCents: collectedCents, duesOutstandingCents, paidOwnerCount, partialOwnerCount, unpaidOwnerCount, expectedAwardSlots: 18, weeklyWaitingCount, weeklyReadyCount, weeklyProposedCount, weeklyApprovedCount, weeklyPaidCount, weeklyRejectedCount, weeklyIssueCount, postseasonWaitingCount, approvedUnpaidCount: approvedUnpaid.length, approvedUnpaidAmountCents: approvedUnpaid.reduce((sum, award) => sum + (Number(award.data.amountCents) || 0), 0), settlementCount: settlements.size, verifiedExpenseCents: ringExpenseCents, ringReserveMaxCents, unusedRingReserveCents, projectedChampionCents, restrictedReserveCents: Number(seasonData.restrictedReserveCents) || 0 } };
}

function unavailableResult(season: number): OperationalReconciliationResult { return { season, status: 'blocking', readyToClose: false, blockingIssues: ['Operational finance storage is unavailable.'], warnings: [], actionRequired: [], checks: [check('storage', 'Operational storage', 'blocking', 'Read-only reconciliation could not access operational storage.', 'No close decision is possible.', true)], summary: { duesAssessedCents: 0, duesCollectedCents: 0, duesOutstandingCents: 0, paidOwnerCount: 0, partialOwnerCount: 0, unpaidOwnerCount: 0, expectedAwardSlots: 18, weeklyWaitingCount: 0, weeklyReadyCount: 0, weeklyProposedCount: 0, weeklyApprovedCount: 0, weeklyPaidCount: 0, weeklyRejectedCount: 0, weeklyIssueCount: 0, postseasonWaitingCount: 0, approvedUnpaidCount: 0, approvedUnpaidAmountCents: 0, settlementCount: 0, verifiedExpenseCents: 0, ringReserveMaxCents: 8000, unusedRingReserveCents: 0, projectedChampionCents: 20500, restrictedReserveCents: 0 } }; }
