import { getFinancialRules } from '@/lib/financeRules';
import { getFirebaseAdminFirestore } from '@/lib/auth/firebaseAdmin';
import { getOperationalReconciliation, type OperationalReconciliationResult } from '@/lib/finance/operationalReconciliation';
import { getAwardAmountCents } from '@/lib/finance/awardObligations';
import { getOwnerById } from '@/lib/ownerRegistry';
import { OPERATIONAL_SEASON } from '@/lib/finance/operationalLedger';

export interface YearEndFinanceSnapshotPreview {
  readonly snapshotVersion: '2026-v1';
  readonly previewOnly: true;
  readonly authoritative: false;
  readonly season: number;
  readonly closedAt: null;
  readonly closedByMemberId: null;
  readonly assessmentSummary: { readonly assessedCents: number; readonly collectedCents: number; readonly outstandingCents: number };
  readonly ownerDues: readonly { readonly ownerId: string; readonly displayName: string; readonly assessedCents: number; readonly settledCents: number; readonly outstandingCents: number }[];
  readonly awardObligations: readonly { readonly obligationId: string; readonly category: string; readonly week: number | null; readonly placement: number | null; readonly ownerId: string | null; readonly amountCents: number; readonly status: string; readonly source: string; readonly sourceReference: string | null }[];
  readonly awardSettlements: readonly { readonly settlementId: string; readonly obligationId: string; readonly ownerId: string; readonly amountCents: number; readonly method: string; readonly effectiveDate: string; readonly correctionType: string | null; readonly originalSettlementId: string | null }[];
  readonly expenseSummary: { readonly grossCents: number; readonly correctionCents: number; readonly netCents: number; readonly ringNetCents: number };
  readonly correctionSummary: { readonly count: number; readonly byDomain: Readonly<Record<string, number>>; readonly netDuesPaymentCents: number; readonly netAwardSettlementCents: number; readonly netExpenseCents: number };
  readonly restrictedReserve: { readonly amountCents: number; readonly custodian: string; readonly label: string; readonly restricted: boolean };
  readonly championshipAllocation: { readonly baseCents: number; readonly ringReserveMaxCents: number; readonly ringExpenseCents: number; readonly projectedChampionCents: number };
  readonly totals: { readonly approvedAwardCents: number; readonly paidAwardCents: number; readonly netSettledAwardCents: number; readonly netOperatingCashMovementCents: number };
  readonly reconciliation: { readonly status: string; readonly readyToClose: boolean; readonly blockingIssues: readonly string[] };
  readonly provenance: { readonly source: 'operational-firestore'; readonly archiveTarget: string; readonly historicalFormat: 'legacy-financial-json-compatible'; readonly compatibilityNotes: readonly string[]; readonly integrityStrategy: 'stable-version-and-future-content-hash' };
}

export interface SeasonCloseReadiness {
  readonly season: number;
  readonly readyToClose: false | boolean;
  readonly reconciliationStatus: string;
  readonly blockingChecks: readonly string[];
  readonly warnings: readonly string[];
  readonly completedChecks: readonly string[];
  readonly snapshotPreview: YearEndFinanceSnapshotPreview;
  readonly archiveTarget: { readonly firestore: string; readonly historicalJson: string; readonly deterministicIdentity: string };
  readonly evaluatedAt: string;
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const asCents = (value: unknown) => Number.isInteger(value) ? Number(value) : 0;
const asDate = (value: unknown) => typeof value === 'string' ? value : value && typeof (value as { toDate?: unknown }).toDate === 'function' ? (value as { toDate(): Date }).toDate().toISOString() : null;

function emptyPreview(season: number, reconciliation: OperationalReconciliationResult): YearEndFinanceSnapshotPreview {
  return { snapshotVersion: '2026-v1', previewOnly: true, authoritative: false, season, closedAt: null, closedByMemberId: null, assessmentSummary: { assessedCents: 0, collectedCents: 0, outstandingCents: 0 }, ownerDues: [], awardObligations: [], awardSettlements: [], expenseSummary: { grossCents: 0, correctionCents: 0, netCents: 0, ringNetCents: 0 }, correctionSummary: { count: 0, byDomain: {}, netDuesPaymentCents: 0, netAwardSettlementCents: 0, netExpenseCents: 0 }, restrictedReserve: { amountCents: 0, custodian: 'VACU', label: 'Future-Season Deposits', restricted: true }, championshipAllocation: { baseCents: 0, ringReserveMaxCents: 0, ringExpenseCents: 0, projectedChampionCents: 0 }, totals: { approvedAwardCents: 0, paidAwardCents: 0, netSettledAwardCents: 0, netOperatingCashMovementCents: 0 }, reconciliation: { status: reconciliation.status, readyToClose: reconciliation.readyToClose, blockingIssues: reconciliation.blockingIssues }, provenance: { source: 'operational-firestore', archiveTarget: `financeArchives/${season}/snapshots/${season}-v1`, historicalFormat: 'legacy-financial-json-compatible', compatibilityNotes: ['Legacy financial JSON retains manager, award, expense, and reconciliation summaries.', 'Operational payment methods, correction lineage, and settlement events require this normalized snapshot extension.'], integrityStrategy: 'stable-version-and-future-content-hash' } };
}

export async function buildYearEndFinanceSnapshotPreview(season: number, reconciliation: OperationalReconciliationResult): Promise<YearEndFinanceSnapshotPreview> {
  const db = getFirebaseAdminFirestore();
  if (!db) return emptyPreview(season, reconciliation);
  const seasonRef = db.collection('financeSeasons').doc(String(season));
  const [seasonSnapshot, assessments, payments, awards, settlements, expenses, corrections] = await Promise.all([seasonRef.get(), seasonRef.collection('assessments').get(), seasonRef.collection('payments').get(), seasonRef.collection('awards').get(), seasonRef.collection('awardSettlements').get(), seasonRef.collection('expenses').get(), seasonRef.collection('corrections').get()]);
  const seasonData = seasonSnapshot.data() ?? {};
  const paymentByOwner = new Map<string, number>();
  payments.docs.forEach((doc) => { const data = doc.data(); paymentByOwner.set(String(data.ownerId), (paymentByOwner.get(String(data.ownerId)) ?? 0) + asCents(data.amountCents)); });
  const ownerDues = assessments.docs.map((doc) => { const data = doc.data(); const ownerId = String(data.ownerId); const assessedCents = asCents(data.amountCents); const settledCents = paymentByOwner.get(ownerId) ?? 0; return { ownerId, displayName: getOwnerById(ownerId)?.displayName ?? ownerId, assessedCents, settledCents, outstandingCents: Math.max(0, assessedCents - settledCents) }; });
  const awardObligations = awards.docs.map((doc) => { const data = doc.data(); return { obligationId: doc.id, category: String(data.category), week: Number.isInteger(data.week) ? Number(data.week) : null, placement: Number.isInteger(data.placement) ? Number(data.placement) : null, ownerId: typeof data.ownerId === 'string' ? data.ownerId : null, amountCents: asCents(data.amountCents), status: String(data.status), source: String(data.source ?? 'unknown'), sourceReference: typeof data.sourceReference === 'string' ? data.sourceReference : null }; });
  const awardSettlements = settlements.docs.map((doc) => { const data = doc.data(); return { settlementId: doc.id, obligationId: String(data.obligationId), ownerId: String(data.ownerId), amountCents: asCents(data.amountCents), method: String(data.method), effectiveDate: String(data.effectiveDate), correctionType: typeof data.correctionType === 'string' ? data.correctionType : null, originalSettlementId: typeof data.originalSettlementId === 'string' ? data.originalSettlementId : null }; });
  const correctionByDomain: Record<string, number> = {};
  let netDuesPaymentCents = 0; let netAwardSettlementCents = 0; let netExpenseCents = 0;
  corrections.docs.forEach((doc) => { const data = doc.data(); const domain = String(data.domain ?? 'unknown'); correctionByDomain[domain] = (correctionByDomain[domain] ?? 0) + 1; const amount = asCents(data.amountCents); if (domain === 'dues-payment') netDuesPaymentCents += amount; if (domain === 'award-settlement') netAwardSettlementCents += amount; if (domain === 'expense') netExpenseCents += amount; });
  const grossExpenseCents = expenses.docs.reduce((sum, doc) => sum + Math.max(0, asCents(doc.data().amountCents)), 0);
  const netExpenseTotal = expenses.docs.reduce((sum, doc) => sum + asCents(doc.data().amountCents), 0);
  const ringNetCents = expenses.docs.filter((doc) => doc.data().type === 'ring').reduce((sum, doc) => sum + asCents(doc.data().amountCents), 0);
  const assessedCents = ownerDues.reduce((sum, owner) => sum + owner.assessedCents, 0);
  const collectedCents = ownerDues.reduce((sum, owner) => sum + owner.settledCents, 0);
  const ringReserveMaxCents = asCents(seasonData.ringReserveMaxCents) || (getFinancialRules().ringReserve ?? 0) * 100;
  const championBaseCents = (getFinancialRules().playoffPayouts.championBase ?? 0) * 100;
  const projectedChampionCents = getAwardAmountCents('champion', { championBaseCents, ringReserveMaxCents, actualRingExpenseCents: ringNetCents });
  const approvedAwardCents = awardObligations.filter((award) => award.status === 'approved').reduce((sum, award) => sum + award.amountCents, 0);
  const paidAwardCents = awardObligations.filter((award) => award.status === 'paid').reduce((sum, award) => sum + award.amountCents, 0);
  return { snapshotVersion: '2026-v1', previewOnly: true, authoritative: false, season, closedAt: null, closedByMemberId: null, assessmentSummary: { assessedCents, collectedCents, outstandingCents: Math.max(0, assessedCents - collectedCents) }, ownerDues, awardObligations, awardSettlements, expenseSummary: { grossCents: grossExpenseCents, correctionCents: netExpenseCents, netCents: netExpenseTotal, ringNetCents }, correctionSummary: { count: corrections.size, byDomain: correctionByDomain, netDuesPaymentCents, netAwardSettlementCents, netExpenseCents }, restrictedReserve: { amountCents: asCents(seasonData.restrictedReserveCents), custodian: String(seasonData.restrictedReserveCustodian ?? 'VACU'), label: String(seasonData.restrictedReserveLabel ?? 'Future-Season Deposits'), restricted: seasonData.restricted === true }, championshipAllocation: { baseCents: championBaseCents, ringReserveMaxCents, ringExpenseCents: ringNetCents, projectedChampionCents }, totals: { approvedAwardCents, paidAwardCents, netSettledAwardCents: awardSettlements.reduce((sum, settlement) => sum + settlement.amountCents, 0), netOperatingCashMovementCents: collectedCents - netExpenseTotal - awardSettlements.reduce((sum, settlement) => sum + settlement.amountCents, 0) }, reconciliation: { status: reconciliation.status, readyToClose: reconciliation.readyToClose, blockingIssues: reconciliation.blockingIssues }, provenance: { source: 'operational-firestore', archiveTarget: `financeArchives/${season}/snapshots/${season}-v1`, historicalFormat: 'legacy-financial-json-compatible', compatibilityNotes: ['Legacy financial JSON retains manager, award, expense, and reconciliation summaries.', 'Operational payment methods, correction lineage, and settlement events require this normalized snapshot extension.'], integrityStrategy: 'stable-version-and-future-content-hash' } };
}

export async function getSeasonCloseReadiness(season: number): Promise<SeasonCloseReadiness> {
  const reconciliation = await getOperationalReconciliation(season);
  const snapshotPreview = await buildYearEndFinanceSnapshotPreview(season, reconciliation);
  const db = getFirebaseAdminFirestore();
  const seasonData = db ? (await db.collection('financeSeasons').doc(String(season)).get()).data() ?? {} : {};
  const blockingChecks = [...reconciliation.blockingIssues];
  const weeklyWaiting = reconciliation.summary.weeklyWaitingCount;
  const postseasonWaiting = reconciliation.summary.postseasonWaitingCount;
  if (weeklyWaiting > 0) blockingChecks.push(`Weekly Awards: ${weeklyWaiting} waiting.`);
  if (postseasonWaiting > 0) blockingChecks.push(`Postseason Awards: ${postseasonWaiting} unresolved.`);
  if (reconciliation.summary.duesOutstandingCents > 0) blockingChecks.push(`Outstanding Dues: ${money(reconciliation.summary.duesOutstandingCents)} outstanding.`);
  if (seasonData.reconciliationStatus !== 'reconciled') blockingChecks.push('Reconciliation: pending; season is not reconciled.');
  if (db) {
    const corrections = await db.collection('financeSeasons').doc(String(season)).collection('corrections').get();
    const malformedCorrections = corrections.docs.filter((doc) => { const data = doc.data(); return typeof data.domain !== 'string' || typeof data.originalRecordId !== 'string' || typeof data.reason !== 'string' || typeof data.recordedByMemberId !== 'string' || typeof data.correctionType !== 'string'; });
    if (malformedCorrections.length > 0) blockingChecks.push(`Corrections: ${malformedCorrections.length} unresolved correction lineage record(s).`);
  }
  const uniqueBlockingChecks = [...new Set(blockingChecks)];
  const completedChecks = reconciliation.checks.filter((check) => check.status === 'pass').map((check) => check.label);
  return { season, readyToClose: uniqueBlockingChecks.length === 0, reconciliationStatus: String(seasonData.reconciliationStatus ?? reconciliation.status), blockingChecks: uniqueBlockingChecks, warnings: reconciliation.warnings, completedChecks, snapshotPreview, archiveTarget: { firestore: `financeArchives/${season}/snapshots/${season}-v1`, historicalJson: `data/history/financial/${season}.json`, deterministicIdentity: `finance-close-${season}` }, evaluatedAt: new Date().toISOString() };
}
