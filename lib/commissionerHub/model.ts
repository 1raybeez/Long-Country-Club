import { getCurrentMemberSession } from '@/lib/auth/session';
import { hasCapability } from '@/lib/auth/memberResolver';
import type { LccMemberSession } from '@/lib/auth/types';
import { LCC_CURRENT_SEASON } from '@/lib/leagueConstants';
import { ACTIVE_LCC_OWNERS } from '@/lib/lccOwners';
import { loadCurrentSeasonStandings } from '@/lib/currentStandings';
import { loadCurrentWeekSnapshot, type CurrentWeekSnapshot } from '@/lib/currentWeekSnapshot';
import { getCommissionerFeedbackQueue, type FeedbackQueueResult } from '@/lib/feedbackServer';
import { loadHomeWeeklyRecap, type HomeWeeklyRecap } from '@/lib/homeWeeklyRecap';
import { getOperationalReconciliation, type OperationalReconciliationResult } from '@/lib/finance/operationalReconciliation';
import { getWeeklyHighBoard, type WeeklyHighResult } from '@/lib/finance/weeklyHigh';
import { loadLccSeasonWeekState } from '@/lib/weekState';
import {
  type AttentionItem,
  type CommissionerCapability,
  type CommissionerHubModel,
  type CommissionerHubId,
  type CapabilityHealth,
  type AttentionSeverity,
  type LeagueIntelligenceProduct,
  type OperationalBlocker,
  type SeasonalRelevance,
  type SystemHealthSummary,
  type WeeklyOperations,
} from './types';

const season = LCC_CURRENT_SEASON;

export async function getCommissionerHubModel(): Promise<CommissionerHubModel> {
  const session = await getCurrentMemberSession();
  const [weekState, snapshot, reconciliation, weeklyHigh] = await Promise.all([
    loadLccSeasonWeekState(season),
    loadCurrentWeekSnapshot(),
    getOperationalReconciliation(season).catch(() => null),
    getWeeklyHighBoard(season).catch(() => [] as readonly WeeklyHighResult[]),
  ]);
  const [standings, recap, feedback] = await Promise.all([
    loadCurrentSeasonStandings(weekState.safeCompletedWeek, season, weekState.playoffWeekStart).catch(() => []),
    loadHomeWeeklyRecap(snapshot.state, weeklyHigh, snapshot.postseason ?? null).catch(() => null),
    loadFeedback(session),
  ]);
  return buildCommissionerHubModel({ session, weekState, snapshot, reconciliation, weeklyHigh, standingsAvailable: standings.length > 0, recap, feedback });
}

interface AdapterInputs {
  readonly session: LccMemberSession | null;
  readonly weekState: Awaited<ReturnType<typeof loadLccSeasonWeekState>>;
  readonly snapshot: CurrentWeekSnapshot;
  readonly reconciliation: OperationalReconciliationResult | null;
  readonly weeklyHigh: readonly WeeklyHighResult[];
  readonly standingsAvailable: boolean;
  readonly recap: HomeWeeklyRecap | null;
  readonly feedback: FeedbackQueueResult | null;
}

export function buildCommissionerHubModel(input: AdapterInputs): CommissionerHubModel {
  const { session, snapshot, reconciliation, feedback } = input;
  const commissioner = Boolean(session?.member && hasCapability(session.member, 'commissioner'));
  const warRoom = Boolean(session?.member && hasCapability(session.member, 'war-room'));
  const attentionItems = buildAttentionItems(reconciliation, feedback);
  const weeklyOperations = buildWeeklyOperations(input);
  const products = intelligenceProducts();
  const capabilities = buildCapabilities({ commissioner, warRoom, reconciliation, feedback, phase: weeklyOperations.phase });
  const systemHealthSummary = buildSystemHealth({ snapshot, reconciliation, feedback, authenticated: Boolean(session?.identity) });
  return {
    leagueIdentity: { name: 'Long Country Club FFL', season, provider: 'Sleeper', teamCount: ACTIVE_LCC_OWNERS.length, member: session?.member ?? null },
    permissions: { authenticated: Boolean(session?.identity), commissioner, warRoom, warRoomScope: warRoom ? 'OWNER' : null },
    attentionItems,
    weeklyOperations,
    capabilities,
    leagueSpecificCapabilities: [],
    inactiveCapabilities: products.filter((product) => product.availability !== 'ACTIVE'),
    leagueIntelligenceProducts: products,
    systemHealthSummary,
  };
}

async function loadFeedback(session: LccMemberSession | null): Promise<FeedbackQueueResult | null> {
  if (!session?.member || !hasCapability(session.member, 'commissioner')) return null;
  return getCommissionerFeedbackQueue().catch(() => null);
}

function buildAttentionItems(reconciliation: OperationalReconciliationResult | null, feedback: FeedbackQueueResult | null): readonly AttentionItem[] {
  const items: AttentionItem[] = [];
  const openFeedback = feedback?.items.filter((item) => item.status === 'OPEN') ?? [];
  if (openFeedback.length) items.push({ id: 'feedback-open', sourceCapability: 'OWNER_FEEDBACK', severity: 'WARNING', title: 'Owner feedback needs review', description: `${openFeedback.length} open submission${openFeedback.length === 1 ? '' : 's'} require commissioner review.`, actionType: 'REVIEW', ctaLabel: 'Review feedback', destination: '/commish/feedback', count: openFeedback.length });
  for (const [index, action] of (reconciliation?.actionRequired ?? []).entries()) {
    const isDues = /dues|outstanding/i.test(action);
    const isSettlement = /settlement|award/i.test(action);
    items.push({ id: `finance-action-${index}`, sourceCapability: 'FINANCE', severity: /blocking|issue/i.test(action) ? 'ERROR' : 'WARNING', title: action, description: 'Finance review is required before this operational item can be considered complete.', actionType: 'REVIEW', ctaLabel: 'Open Finance', destination: '/commish/finance', ...(isDues ? { amount: (reconciliation?.summary.duesOutstandingCents ?? 0) / 100 } : {}), ...(isSettlement ? { amount: (reconciliation?.summary.approvedUnpaidAmountCents ?? 0) / 100 } : {}) });
  }
  return items;
}

function buildWeeklyOperations(input: AdapterInputs): WeeklyOperations {
  const { weekState, snapshot, weeklyHigh, standingsAvailable, recap } = input;
  const rows = snapshot.matchups;
  const matchupState = rows.length === 0 ? 'UNAVAILABLE' : rows.length === Math.floor(ACTIVE_LCC_OWNERS.length / 2) ? 'COMPLETE' : 'PARTIAL';
  const currentHigh = weekState.safeCompletedWeek ? weeklyHigh.find((item) => item.week === weekState.safeCompletedWeek) : null;
  const finalityState = weekState.activeWeek === null ? 'UNKNOWN' : weekState.safeCompletedWeek !== null && weekState.activeWeek <= weekState.safeCompletedWeek ? 'FINAL' : rows.some((row) => row.currentStatus === 'LIVE') ? 'IN_PROGRESS' : 'UPCOMING';
  const phase = phaseFor(weekState.state, weekState.playoffWeekStart, weekState.activeWeek);
  const blockers: OperationalBlocker[] = [];
  if (matchupState !== 'COMPLETE' && weekState.activeWeek !== null) blockers.push(blocker('matchup-completeness', 'SYSTEM_HEALTH', 'WARNING', 'Current matchup data is incomplete', 'Source data is not complete enough to treat the current week as fully operational.', ['matchups']));
  if (currentHigh?.status === 'UNAVAILABLE' && weekState.safeCompletedWeek !== null) blockers.push(blocker('weekly-high-unavailable', 'FINANCE', 'WARNING', 'Weekly-high state is unavailable', 'The authoritative weekly-high result is not yet available or resolved.', ['weekly-high']));
  if (snapshot.state.source === 'unavailable') blockers.push(blocker('week-state-unavailable', 'SYSTEM_HEALTH', 'ERROR', 'League week state is unavailable', 'Sleeper season state could not be loaded.', ['week-state']));
  const finalizationState = finalityState === 'FINAL' ? 'FINAL' : finalityState === 'IN_PROGRESS' ? 'IN_PROGRESS' : finalityState === 'UPCOMING' ? 'UPCOMING' : null;
  const awardState = currentHigh?.status === 'FINAL' || currentHigh?.status === 'MANUAL' ? 'FINAL' : currentHigh?.status === 'PROVISIONAL' ? 'PROVISIONAL' : currentHigh?.decisionRequired ? 'ACTION_REQUIRED' : null;
  return { season, week: weekState.activeWeek, lifecycle: weekState.state, phase, freshness: snapshot.fetchedAt ? 'FRESH' : null, matchupState, latestSafelyCompletedWeek: weekState.safeCompletedWeek, finalizationState, awardState, standingsState: standingsAvailable ? 'AVAILABLE' : null, rankingsState: 'NOT_IMPLEMENTED', predictorState: 'ARCHIVE_ONLY', automationHealth: 'SOURCE_DRIVEN', sourceSnapshot: { fetchedAt: snapshot.fetchedAt, source: snapshot.state.source }, finalityState, weeklyHighState: awardState === null ? 'UNAVAILABLE' : awardState as WeeklyOperations['weeklyHighState'], recapState: recap?.availability === 'complete' ? 'PUBLISHED' : recap?.availability === 'partial' ? 'PARTIAL' : 'UNAVAILABLE', automationState: 'SOURCE_DRIVEN', postseasonState: phase === 'POSTSEASON' ? snapshot.postseason?.sourceStatus === 'complete' ? 'ACTIVE' : 'UNRESOLVED' : 'INACTIVE', blockers };
}

function buildCapabilities(input: { commissioner: boolean; warRoom: boolean; reconciliation: OperationalReconciliationResult | null; feedback: FeedbackQueueResult | null; phase: SeasonalRelevance }): readonly CommissionerCapability[] {
  const financeHealth: CapabilityHealth = input.reconciliation === null ? 'UNKNOWN' : input.reconciliation.status === 'pass' ? 'HEALTHY' : input.reconciliation.status === 'issue' || input.reconciliation.status === 'blocking' ? 'ERROR' : 'NEEDS_ATTENTION';
  const feedbackHealth: CapabilityHealth = input.feedback === null ? 'UNKNOWN' : input.feedback.malformedCount ? 'WARNING' : 'HEALTHY';
  return [
    { id: 'FINANCE', label: 'Finance', availability: input.commissioner ? 'ACTIVE' : 'UNAVAILABLE', health: financeHealth, seasonalRelevance: input.phase, humanAction: financeHealth === 'NEEDS_ATTENTION' || financeHealth === 'ERROR' ? 'REVIEW' : 'NONE', route: input.commissioner ? '/commish/finance' : null, visibility: input.commissioner ? 'VISIBLE' : 'HIDDEN', permissionKey: 'commissioner', description: 'Dues, payments, awards, settlements, and reconciliation.' },
    { id: 'LEGISLATIVE_HUB', label: 'Legislative Hub', availability: 'ACTIVE', health: 'HEALTHY', seasonalRelevance: 'IN_SEASON', humanAction: 'NONE', route: '/league-info/constitution', visibility: 'VISIBLE', description: 'Constitution, rules, and historical governance.' },
    { id: 'SEASON_OPERATIONS', label: 'Season Operations', availability: 'UNAVAILABLE', health: 'UNKNOWN', seasonalRelevance: input.phase, humanAction: 'NONE', route: null, visibility: 'VISIBLE', description: 'Dedicated season-level controls are not currently available.' },
    { id: 'WAR_ROOM', label: 'War Room', availability: input.warRoom ? 'ACTIVE' : 'UNAVAILABLE', health: input.warRoom ? 'HEALTHY' : 'UNKNOWN', seasonalRelevance: input.phase, humanAction: 'NONE', route: input.warRoom ? '/war-room' : null, visibility: input.warRoom ? 'VISIBLE' : 'HIDDEN', permissionKey: 'warRoom', description: 'Authenticated roster planning and draft-capital workspace.' },
    { id: 'LEAGUE_INTELLIGENCE', label: 'League Intelligence', availability: 'ACTIVE', health: 'HEALTHY', seasonalRelevance: input.phase, humanAction: 'NONE', route: '/league-info/drafts', visibility: 'VISIBLE', description: 'Independent analytical, reporting, and archive products.' },
    { id: 'OWNER_FEEDBACK', label: 'Owner Feedback', availability: input.commissioner ? 'ACTIVE' : 'UNAVAILABLE', health: feedbackHealth, seasonalRelevance: input.phase, humanAction: input.feedback?.items.some((item) => item.status === 'OPEN') ? 'REVIEW' : 'NONE', route: input.commissioner ? '/commish/feedback' : null, visibility: input.commissioner ? 'VISIBLE' : 'HIDDEN', permissionKey: 'commissioner', description: 'Owner-submitted bugs, ideas, and issues.' },
  ];
}

function intelligenceProducts(): readonly LeagueIntelligenceProduct[] {
  return [
    { id: 'predictor', label: 'Predictor', availability: 'ACTIVE', health: 'HEALTHY', seasonalRelevance: 'OFFSEASON', humanAction: 'NONE', route: '/predictor', workflowState: 'ARCHIVE_ONLY', publicationState: 'PUBLISHED', description: 'Approved preseason forecast archive.' },
    { id: 'weekly-recap', label: 'Weekly Recap', availability: 'ACTIVE', health: 'HEALTHY', seasonalRelevance: 'IN_SEASON', humanAction: 'NONE', route: '/', workflowState: 'AUTOMATED', publicationState: 'PUBLISHED', description: 'Automated recap driven by safely completed weeks.' },
    { id: 'draft-history', label: 'Draft History', availability: 'ACTIVE', health: 'HEALTHY', seasonalRelevance: 'OFFSEASON', humanAction: 'NONE', route: '/league-info/drafts', workflowState: 'PUBLISHED', publicationState: 'PUBLISHED', description: 'Canonical draft history and records.' },
    { id: 'draft-intelligence', label: 'Draft Intelligence', availability: 'ACTIVE', health: 'HEALTHY', seasonalRelevance: 'DRAFT', humanAction: 'NONE', route: '/league-info/drafts/2026-recap', workflowState: 'SUPPORTED', publicationState: 'PUBLISHED', description: 'Draft analysis where evidence and grading are supported.' },
    { id: 'team-outlook', label: 'Team Outlook', availability: 'INACTIVE', health: 'UNKNOWN', seasonalRelevance: 'IN_SEASON', humanAction: 'NONE', route: null, workflowState: 'NOT_IMPLEMENTED', publicationState: null, description: 'No active Team Outlook product is implemented.' },
    { id: 'power-rankings', label: 'Power Rankings', availability: 'INACTIVE', health: 'UNKNOWN', seasonalRelevance: 'IN_SEASON', humanAction: 'NONE', route: null, workflowState: 'NOT_IMPLEMENTED', publicationState: null, description: 'No active Power Rankings model is implemented.' },
    { id: 'post-draft-intelligence', label: 'Post-Draft Intelligence', availability: 'COMING_SOON', health: 'UNKNOWN', seasonalRelevance: 'OFFSEASON', humanAction: 'NONE', route: null, workflowState: 'NOT_IMPLEMENTED', publicationState: null, description: 'Future commissioner intelligence capability.' },
  ];
}

function buildSystemHealth(input: { snapshot: CurrentWeekSnapshot; reconciliation: OperationalReconciliationResult | null; feedback: FeedbackQueueResult | null; authenticated: boolean }): SystemHealthSummary {
  const blockers: OperationalBlocker[] = [];
  if (input.snapshot.state.source === 'unavailable') blockers.push(blocker('source-unavailable', 'SYSTEM_HEALTH', 'ERROR', 'Primary league source unavailable', 'Current Sleeper league state could not be verified.', ['provider']));
  if (input.feedback?.malformedCount) blockers.push({ ...blocker('feedback-malformed', 'OWNER_FEEDBACK', 'WARNING', 'Malformed feedback records', `${input.feedback.malformedCount} feedback record(s) could not be displayed safely.`, ['feedback']), destination: '/commish/feedback' });
  const overallHealth = blockers.some((item) => item.severity === 'ERROR') ? 'ERROR' : blockers.length ? 'WARNING' : 'HEALTHY';
  const providerRuntime = input.snapshot.state.source === 'sleeper-league' ? 'AVAILABLE' : null;
  return { overallHealth, sourceFreshness: input.snapshot.fetchedAt ? 'AVAILABLE' : null, automationScheduler: 'SOURCE_DRIVEN', providerRuntime, authIdentityDiagnostics: input.authenticated ? 'AVAILABLE' : null, finalizationDiagnostics: null, issueCount: blockers.length, destination: blockers.length ? '/commish' : null, availability: 'ACTIVE', health: overallHealth, authentication: input.authenticated ? 'AVAILABLE' : 'UNKNOWN', providerState: providerRuntime ?? 'UNKNOWN', reconciliationState: input.reconciliation === null ? 'UNKNOWN' : input.reconciliation.readyToClose ? 'AVAILABLE' : 'BLOCKED', automationState: 'SOURCE_DRIVEN', blockers };
}

function blocker(code: string, sourceCapability: CommissionerHubId, severity: AttentionSeverity, title: string, description: string, affects: readonly string[]): OperationalBlocker {
  return { code, id: code, sourceCapability, severity, title, description, state: 'ACTIVE', affects, requiresHumanAction: false, destination: null };
}

function phaseFor(state: string, playoffWeekStart: number | null, activeWeek: number | null): SeasonalRelevance {
  if (state === 'PRESEASON') return 'OFFSEASON';
  if (state === 'SEASON_COMPLETE') return 'SEASON_CLOSE';
  if (playoffWeekStart !== null && activeWeek !== null && activeWeek >= playoffWeekStart) return 'POSTSEASON';
  return 'IN_SEASON';
}
