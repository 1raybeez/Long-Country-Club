import approved2026 from '../../data/approved/draft-intelligence/2026/live-forecast-v1.json';
import backtest2021 from '../../data/approved/draft-intelligence/backtests/2021/backtest-forecast-v1.json';
import backtest2022 from '../../data/approved/draft-intelligence/backtests/2022/backtest-forecast-v1.json';
import backtest2023 from '../../data/approved/draft-intelligence/backtests/2023/backtest-forecast-v1.json';
import backtest2024 from '../../data/approved/draft-intelligence/backtests/2024/backtest-forecast-v1.json';
import backtest2025 from '../../data/approved/draft-intelligence/backtests/2025/backtest-forecast-v1.json';
import outcome2021 from '../../data/approved/outcome-grade/snapshots/2021/outcome-grade-v1-2021-2025-12-31.json';
import outcome2022 from '../../data/approved/outcome-grade/snapshots/2022/outcome-grade-v1-2022-2025-12-31.json';
import outcome2023 from '../../data/approved/outcome-grade/snapshots/2023/outcome-grade-v1-2023-2025-12-31.json';
import outcome2024 from '../../data/approved/outcome-grade/snapshots/2024/outcome-grade-v1-2024-2025-12-31.json';
import outcome2025 from '../../data/approved/outcome-grade/snapshots/2025/outcome-grade-v1-2025-2025-12-31.json';
import comparison2021 from '../../data/approved/forecast-vs-reality/2021/comparison-2025-12-31-v1.json';
import comparison2022 from '../../data/approved/forecast-vs-reality/2022/comparison-2025-12-31-v1.json';
import comparison2023 from '../../data/approved/forecast-vs-reality/2023/comparison-2025-12-31-v1.json';
import comparison2024 from '../../data/approved/forecast-vs-reality/2024/comparison-2025-12-31-v1.json';
import comparison2025 from '../../data/approved/forecast-vs-reality/2025/comparison-2025-12-31-v1.json';
import { getLccOwnerById } from '@/lib/lccOwners';

export type DraftIntelligencePresentationMode = 'LIVE_FORECAST' | 'BACKTEST_FORECAST' | 'PROCESS_ONLY' | 'UNAVAILABLE';
export type DraftIntelligenceSort = 'ranking' | 'draftSlot' | 'manager';
export type DraftGradesLayer = 'draft-day' | 'outcome' | 'reality';
export type DraftIntelligencePick = { overallPick: number; round: number; player: string; position: string };
export type DraftIntelligenceMarketPick = { player: string; lccPick: number; marketExpectedPick: number | null; classification: string | null };
export type DraftIntelligenceRecap = {
  ownerId: string;
  manager: string;
  managerName: string;
  team: string | null;
  mode: DraftIntelligencePresentationMode;
  process: { score: number; grade: string; confidence: string; dimensions: { label: string; score: number | null }[] };
  market: { score: number | null; grade: string | null; confidence: string; picks: DraftIntelligenceMarketPick[]; sourceNote: string | null };
  overall: { score: number | null; grade: string | null; confidence: string; status: 'AVAILABLE' | 'UNAVAILABLE' };
  picks: DraftIntelligencePick[];
  rosterContext: { position: string; count: number; classification: string }[] | null;
  strengths: string[];
  concerns: string[];
  disagreement: string | null;
  forecast: { immediate: string; longTerm: string; trajectory: string; primaryStrength: string; primaryConcern: string } | null;
  frozen: boolean;
};
export type DraftIntelligencePresentation = {
  layer: 'draft-day';
  season: number;
  mode: DraftIntelligencePresentationMode;
  summary: { evaluatedManagers: number; averageScore: number | null; highestGrade: string | null; confidence: string; processMethodology: string; marketMethodology: string };
  explanation: string;
  rankingLabel: 'Draft-Day Grade Ranking' | 'Process Grade Ranking';
  ranking: { rank: number; manager: string; team: string | null; grade: string; score: number }[];
  recaps: DraftIntelligenceRecap[];
  unavailableReason: string | null;
};

type RawCandidate = any;
const rawBySeason: Record<number, RawCandidate> = { 2021: backtest2021, 2022: backtest2022, 2023: backtest2023, 2024: backtest2024, 2025: backtest2025 };
const outcomeBySeason: Record<number, RawCandidate> = { 2021: outcome2021, 2022: outcome2022, 2023: outcome2023, 2024: outcome2024, 2025: outcome2025 };
const comparisonBySeason: Record<number, RawCandidate> = { 2021: comparison2021, 2022: comparison2022, 2023: comparison2023, 2024: comparison2024, 2025: comparison2025 };

export type OutcomePlayerPresentation = { playerId: string; name: string; position: string; overallPick: number | null; scores: Record<string, number | null> | null; overallScore: number | null; grade: string | null; confidence: string; ownershipNote: string | null };
export type OutcomeSelectionPresentation = { playerId: string; name: string; position: string; overallPick: number | null; scored: boolean };
export type OutcomeRecap = { ownerId: string; managerName: string; historicalTeamName: string | null; score: number | null; grade: string | null; confidence: string; maturity: string | null; pickCount: number | null; selections: OutcomeSelectionPresentation[]; componentScores: Record<string, number | null>; players: OutcomePlayerPresentation[]; limitations: string[] };
export type OutcomePresentation = { layer: 'outcome'; season: number; available: boolean; maturity: string | null; interpretation: string; evaluationAsOf: string | null; summary: { evaluatedManagers: number; averageScore: number | null; highestGrade: string | null; confidence: string }; recaps: OutcomeRecap[] };
export type ComparisonRecap = { comparisonId: string; ownerId: string; managerName: string; historicalTeamName: string | null; draftDayScore: number | null; draftDayGrade: string | null; draftDayRank: number | null; processScore: number | null; processGrade: string | null; marketValueScore: number | null; marketValueGrade: string | null; outcomeScore: number | null; outcomeGrade: string | null; outcomeRank: number | null; outcomeMaturity: string; comparisonInterpretation: string | null; gradeDelta: number | null; absoluteGradeDelta: number | null; rankDelta: number | null; processResidual: number | null; marketResidual: number | null; overallResidual: number | null; comparisonCategory: string | null; comparisonConfidence: string | null; limitations: string[] };
export type ComparisonPresentation = { layer: 'reality'; season: number; available: boolean; maturity: string | null; interpretation: string | null; evaluationAsOf: string | null; summary: { draftDayAverage: number | null; outcomeAverage: number | null; meanResidual: number | null; eligibleComparisons: number }; recaps: ComparisonRecap[] };
export type GradeLayerPresentation = DraftIntelligencePresentation | OutcomePresentation | ComparisonPresentation;
const dimensionLabels = [
  ['capitalDeployment', 'Capital Deployment'],
  ['rosterContext', 'Roster Context'],
  ['draftConstruction', 'Draft Construction'],
  ['concentrationBalance', 'Concentration / Balance'],
  ['optionalityDepthBuilding', 'Optionality / Depth Building'],
] as const;

export function toNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeNumericRecord(value: unknown): Record<string, number | null> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toNullableNumber(item)]));
}

function confidenceSummary(values: string[]): string {
  const order = ['HIGH', 'MEDIUM', 'LIMITED', 'UNAVAILABLE'];
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return order.filter((label) => counts.has(label)).map((label) => `${counts.get(label)} ${label.charAt(0) + label.slice(1).toLowerCase()}`).join(' · ') || 'Unavailable';
}

function formatMarketSource(source: any): string | null {
  if (!source) return null;
  const name = source.sourceName === 'Fantasy Orphans' ? 'Fantasy Orphans 1QB Non-TEP' : source.sourceName;
  const date = source.marketSnapshotDate ?? source.snapshotDate;
  if (!date) return null;
  const days = Number(source.daysFromLccDraft ?? 0);
  const timing = source.timingClassification ?? 'UNKNOWN';
  const offset = `${Math.abs(days)} days ${days < 0 ? 'before' : 'after'} the LCC draft`;
  const normalization = source.normalizationDisclosure ? ` ${source.normalizationDisclosure}` : '';
  return `Market reference: ${name}, ${new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} — ${timing}; ${offset}.${normalization}`;
}

function processDimensions(process: any) {
  return dimensionLabels.map(([key, label]) => ({ label, score: process?.[key] ?? null }));
}

function rosterContext(context: any) {
  if (!context?.positions || !context.classifications) return null;
  return ['QB', 'RB', 'WR', 'TE'].map((position) => ({ position, count: context.positions[position] ?? 0, classification: context.classifications[position] ?? 'UNAVAILABLE' }));
}

function normalizeMaturity(source: any): string | null {
  const value = source?.maturity ?? source?.maturityStatus ?? source?.outcomeMaturity ?? null;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function fromCandidate(candidate: RawCandidate, season: number, approved = false): DraftIntelligencePresentation {
  const source = candidate.source ?? null;
  const recaps: DraftIntelligenceRecap[] = (candidate.evaluations ?? []).map((evaluation: RawCandidate) => ({
    ownerId: evaluation.ownerId,
    manager: evaluation.manager ?? evaluation.managerName,
    managerName: evaluation.manager ?? evaluation.managerName,
    team: evaluation.team ?? evaluation.teamName ?? getCanonicalTeamName(evaluation.ownerId),
    mode: approved ? 'LIVE_FORECAST' : 'BACKTEST_FORECAST',
    process: { score: evaluation.process.score, grade: evaluation.process.grade, confidence: evaluation.process.confidence, dimensions: processDimensions(evaluation.process) },
    market: { score: evaluation.marketValue.score, grade: evaluation.marketValue.grade, confidence: evaluation.marketValue.confidence, picks: (evaluation.marketValue.selections ?? []).map((pick: any) => ({ player: pick.lccSelection.player, lccPick: pick.lccSelection.overallPick, marketExpectedPick: pick.marketExpectedSelection, classification: pick.classification })), sourceNote: formatMarketSource(evaluation.marketValue.source ?? source) },
    overall: { score: evaluation.overall.score, grade: evaluation.overall.grade, confidence: evaluation.overall.confidence, status: evaluation.overall.status },
    picks: (evaluation.draftPicks ?? []).map((pick: any) => ({ overallPick: pick.overallPick ?? pick.pick, round: pick.round, player: pick.player ?? pick.playerName, position: pick.position })),
    rosterContext: rosterContext(evaluation.draftTimeRosterContext),
    strengths: evaluation.strengths ?? [],
    concerns: evaluation.concerns ?? [],
    disagreement: evaluation.componentDisagreement ?? null,
    forecast: evaluation.draftDayForecast ? { immediate: evaluation.draftDayForecast.immediateImpactOutlook, longTerm: evaluation.draftDayForecast.longTermUpsideOutlook, trajectory: evaluation.draftDayForecast.expectedClassTrajectory, primaryStrength: evaluation.draftDayForecast.primaryStrength, primaryConcern: evaluation.draftDayForecast.primaryConcern } : null,
    frozen: approved,
  }));
  const available = recaps.filter((recap) => recap.overall.score !== null);
  const averageScore = available.length ? available.reduce((sum, recap) => sum + (recap.overall.score ?? 0), 0) / available.length : null;
  const ranking = [...recaps].sort((a, b) => (b.overall.score ?? b.process.score ?? -Infinity) - (a.overall.score ?? a.process.score ?? -Infinity) || a.managerName.localeCompare(b.managerName) || a.ownerId.localeCompare(b.ownerId)).map((recap, index) => ({ rank: index + 1, manager: recap.manager, team: recap.team, grade: recap.overall.grade ?? recap.process.grade, score: recap.overall.score ?? recap.process.score }));
  return {
    layer: 'draft-day',
    season,
    mode: approved ? 'LIVE_FORECAST' : 'BACKTEST_FORECAST',
    summary: { evaluatedManagers: recaps.length, averageScore, highestGrade: ranking[0]?.grade ?? null, confidence: recaps.length ? recaps.every((recap) => recap.overall.confidence === 'HIGH') ? 'High' : recaps.some((recap) => recap.overall.confidence === 'LIMITED') ? 'Limited' : 'Medium' : 'Unavailable', processMethodology: 'Process V1.1', marketMethodology: 'Market Value V1.1' },
    explanation: approved ? 'Frozen before the 2026 season using the approved Draft Intelligence model.' : 'Retrospective simulation using only the historical evidence permitted by the model. This was not an actual forecast created that year.',
    rankingLabel: 'Draft-Day Grade Ranking',
    ranking,
    recaps,
    unavailableReason: null,
  };
}

function getCanonicalTeamName(ownerId: string): string | null {
  const owner = ownerId ? getLccOwnerById(ownerId) : undefined;
  return owner?.managerPage.sleeperName ?? null;
}

function outcomePresentation(season: number): OutcomePresentation | null {
  const snapshot = outcomeBySeason[season];
  if (!snapshot) return null;
  const recaps: OutcomeRecap[] = snapshot.ownerClassRecords.map((row: any) => ({
    ownerId: row.ownerId,
    managerName: row.managerName,
    historicalTeamName: row.historicalTeamName ?? row.teamName ?? null,
    score: toNullableNumber(row.overallScore),
    grade: row.grade,
    confidence: row.confidence,
    maturity: normalizeMaturity(row),
    pickCount: toNullableNumber(row.selectionCount),
    selections: (row.draftSelections ?? []).map((selection: any) => ({ playerId: selection.playerId, name: selection.name, position: selection.position, overallPick: toNullableNumber(selection.overallPick), scored: selection.scored === true })),
    componentScores: normalizeNumericRecord(row.componentScores),
    players: snapshot.playerRecords.filter((player: any) => player.draftingOwnerId === row.ownerId).map((player: any) => ({ playerId: player.playerId, name: player.name, position: player.position, overallPick: toNullableNumber(player.overallPick), scores: player.scores ? normalizeNumericRecord(player.scores) : null, overallScore: toNullableNumber(player.overallScore), grade: player.grade, confidence: player.confidence, ownershipNote: player.name === 'Amon-Ra St. Brown' ? 'Franchise ownership transferred after 2021; later Mike Estes production is not presented as Dan Lowery drafting credit.' : null })),
    limitations: row.limitations ?? [],
  }));
  const scored = recaps.filter((row) => row.score !== null);
  const maturity = normalizeMaturity(snapshot);
  return { layer: 'outcome', season, available: true, maturity, interpretation: maturity === 'MATURE' ? 'ESTABLISHED' : maturity === 'DEVELOPING' ? 'PROVISIONAL' : maturity === 'EARLY_OUTCOME_SNAPSHOT' ? 'PRELIMINARY' : 'UNAVAILABLE', evaluationAsOf: typeof snapshot.evaluationAsOf === 'string' ? snapshot.evaluationAsOf : null, summary: { evaluatedManagers: recaps.length, averageScore: scored.length ? scored.reduce((sum, row) => sum + (row.score ?? 0), 0) / scored.length : null, highestGrade: [...scored].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]?.grade ?? null, confidence: confidenceSummary(recaps.map((row) => row.confidence)) }, recaps: recaps.sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.managerName.localeCompare(b.managerName)) };
}

function comparisonPresentation(season: number): ComparisonPresentation | null {
  const snapshot = comparisonBySeason[season];
  if (!snapshot) return null;
  const recaps: ComparisonRecap[] = snapshot.ownerComparisons.map((row: any) => ({ comparisonId: row.comparisonId, ownerId: row.ownerId, managerName: row.managerName, historicalTeamName: row.historicalTeamName ?? row.teamName ?? null, draftDayScore: toNullableNumber(row.draftDayScore), draftDayGrade: row.draftDayGrade ?? null, draftDayRank: toNullableNumber(row.draftDayRank), processScore: toNullableNumber(row.processScore), processGrade: row.processGrade ?? null, marketValueScore: toNullableNumber(row.marketValueScore), marketValueGrade: row.marketValueGrade ?? null, outcomeScore: toNullableNumber(row.outcomeScore), outcomeGrade: row.outcomeGrade ?? null, outcomeRank: toNullableNumber(row.outcomeRank), outcomeMaturity: normalizeMaturity(row) ?? 'UNAVAILABLE', comparisonInterpretation: row.comparisonInterpretation ?? null, gradeDelta: toNullableNumber(row.gradeDelta), absoluteGradeDelta: toNullableNumber(row.absoluteGradeDelta), rankDelta: toNullableNumber(row.rankDelta), processResidual: toNullableNumber(row.processResidual), marketResidual: toNullableNumber(row.marketResidual), overallResidual: toNullableNumber(row.overallResidual), comparisonCategory: row.comparisonCategory ?? null, comparisonConfidence: row.comparisonConfidence ?? null, limitations: row.limitations ?? [] }));
  const eligible = recaps.filter((row) => row.gradeDelta !== null);
  const maturity = normalizeMaturity(snapshot);
  return { layer: 'reality', season, available: true, maturity, interpretation: snapshot.interpretation ?? (maturity === 'MATURE' ? 'ESTABLISHED' : maturity === 'DEVELOPING' ? 'PROVISIONAL' : maturity === 'EARLY_OUTCOME_SNAPSHOT' ? 'PRELIMINARY' : null), evaluationAsOf: typeof snapshot.outcomeEvaluationAsOf === 'string' ? snapshot.outcomeEvaluationAsOf : null, summary: { draftDayAverage: eligible.length ? eligible.reduce((sum, row) => sum + (row.draftDayScore ?? 0), 0) / eligible.length : null, outcomeAverage: eligible.length ? eligible.reduce((sum, row) => sum + (row.outcomeScore ?? 0), 0) / eligible.length : null, meanResidual: eligible.length ? eligible.reduce((sum, row) => sum + (row.gradeDelta ?? 0), 0) / eligible.length : null, eligibleComparisons: eligible.length }, recaps: recaps.sort((a, b) => (b.gradeDelta ?? -Infinity) - (a.gradeDelta ?? -Infinity) || a.managerName.localeCompare(b.managerName)) };
}

function requireString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`Draft Grades presentation contract missing ${field}`);
}
function requireNumber(value: unknown, field: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Draft Grades presentation contract missing ${field}`);
}
function assertFiniteNumericTree(value: unknown, path = 'presentation'): void {
  if (value === undefined) throw new Error(`Draft Grades presentation contract contains undefined at ${path}`);
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error(`Draft Grades presentation contract contains non-finite number at ${path}`);
  if (Array.isArray(value)) { value.forEach((item, index) => assertFiniteNumericTree(item, `${path}[${index}]`)); return; }
  if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => assertFiniteNumericTree(item, `${path}.${key}`));
}

export function validateGradeLayerPresentation(presentation: GradeLayerPresentation): GradeLayerPresentation {
  assertFiniteNumericTree(presentation);
  requireNumber(presentation.season, 'season');
  if (presentation.layer === 'draft-day') {
    if (!Array.isArray(presentation.ranking) || presentation.ranking.length !== 12 || !Array.isArray(presentation.recaps) || presentation.recaps.length !== 12) throw new Error('Draft Grades presentation contract invalid Draft-Day ranking or recaps');
    presentation.recaps.forEach((recap) => {
      requireString(recap.ownerId, 'draft-day.recap.ownerId');
      requireString(recap.manager, 'draft-day.recap.manager');
      requireString(recap.managerName, 'draft-day.recap.managerName');
      if (!Array.isArray(recap.picks) || !Array.isArray(recap.strengths) || !Array.isArray(recap.concerns) || !Array.isArray(recap.process.dimensions) || !Array.isArray(recap.market.picks)) throw new Error('Draft Grades presentation contract invalid Draft-Day recap collections');
    });
    return presentation;
  }
  if (presentation.layer === 'outcome') {
    requireString(presentation.maturity, 'outcome.maturity');
    requireString(presentation.evaluationAsOf, 'outcome.evaluationAsOf');
    if (!presentation.summary || presentation.summary.evaluatedManagers !== 12 || !('averageScore' in presentation.summary) || !('highestGrade' in presentation.summary) || !('confidence' in presentation.summary) || presentation.recaps.length !== 12) throw new Error('Draft Grades presentation contract invalid Outcome summary or manager count');
    presentation.recaps.forEach((recap) => {
      requireString(recap.ownerId, 'outcome.recap.ownerId');
      requireString(recap.managerName, 'outcome.recap.managerName');
      requireString(recap.confidence, 'outcome.recap.confidence');
      if (!Array.isArray(recap.selections) || !recap.componentScores || !Array.isArray(recap.players) || !Array.isArray(recap.limitations)) throw new Error('Draft Grades presentation contract invalid Outcome recap');
    });
  }
  if (presentation.layer === 'reality') {
    requireString(presentation.maturity, 'reality.maturity');
    requireString(presentation.interpretation, 'reality.interpretation');
    requireString(presentation.evaluationAsOf, 'reality.evaluationAsOf');
    if (!presentation.summary || !('draftDayAverage' in presentation.summary) || !('outcomeAverage' in presentation.summary) || !('meanResidual' in presentation.summary) || !('eligibleComparisons' in presentation.summary) || presentation.summary.eligibleComparisons <= 0 || presentation.recaps.length === 0) throw new Error('Draft Grades presentation contract invalid Reality summary or recaps');
    presentation.recaps.forEach((recap) => {
      requireString(recap.comparisonId, 'reality.recap.comparisonId');
      requireString(recap.ownerId, 'reality.recap.ownerId');
      requireString(recap.managerName, 'reality.recap.managerName');
      requireString(recap.outcomeMaturity, 'reality.recap.outcomeMaturity');
      if (!Array.isArray(recap.limitations)) throw new Error('Draft Grades presentation contract invalid Reality recap');
    });
  }
  return presentation;
}

export function loadDraftIntelligencePresentation(season: number, draftType: string, layer: DraftGradesLayer = 'draft-day'): GradeLayerPresentation | null {
  if (draftType !== 'rookie') return null;
  if (layer === 'outcome') { const presentation = season === 2026 ? null : outcomePresentation(season); return presentation ? validateGradeLayerPresentation(presentation) : null; }
  if (layer === 'reality') { const presentation = season === 2026 ? null : comparisonPresentation(season); return presentation ? validateGradeLayerPresentation(presentation) : null; }
  if (season === 2026) return validateGradeLayerPresentation(fromCandidate(approved2026, 2026, true));
  const candidate = rawBySeason[season];
  return candidate ? validateGradeLayerPresentation(fromCandidate(candidate, season)) : null;
}
