import fs from 'node:fs';
import path from 'node:path';
import { ALL_LCC_OWNERS } from '@/lib/lccOwners';
import { getOwnerById } from '@/lib/ownerRegistry';
import { getFinancialRules } from '@/lib/financeRules';
import type { AwardReadinessStatus } from '@/lib/types/awardObligation';
export { evaluatePostseasonAwardReadiness, getPostseasonAwardReadiness, type PostseasonReadinessOptions, type PostseasonReadinessResult } from '@/lib/finance/postseasonReadiness';

interface RawMatchupRow { roster_id: number; matchup_id?: number | null; points?: number | null; custom_points?: number | null; }
interface RawRoster { roster_id: number; owner_id?: string | null; }

export interface WeeklyAwardReadiness {
  readonly season: number;
  readonly week: number;
  readonly status: AwardReadinessStatus;
  readonly reasons: readonly string[];
  readonly expectedMatchups: number;
  readonly observedMatchups: number;
  readonly resolvedOwners: number;
  readonly unresolvedOwners: readonly string[];
  readonly highestScore: number | null;
  readonly candidateOwnerId: string | null;
  readonly candidateTeamName: string | null;
  readonly nextHighestScore: number | null;
  readonly tie: boolean;
}

export interface AwardReadinessOptions {
  readonly dataRoot?: string;
  readonly currentActiveWeek?: number;
  readonly conservativeDelaySatisfied?: boolean;
}

export interface ReadinessClassificationInput {
  readonly hasIntegrityIssue: boolean;
  readonly hasWaitingCondition: boolean;
}

/** The single status precedence used by both the evaluator and its consumers. */
export function classifyAwardReadiness(input: ReadinessClassificationInput): AwardReadinessStatus {
  if (input.hasIntegrityIssue) return 'issue';
  if (input.hasWaitingCondition) return 'waiting';
  return 'ready';
}

function readJson<T>(filePath: string): T | null {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T; } catch { return null; }
}

function scoreOf(row: RawMatchupRow): number | null {
  const score = typeof row.custom_points === 'number' ? row.custom_points : typeof row.points === 'number' ? row.points : null;
  return score !== null && Number.isFinite(score) ? score : null;
}

export function evaluateWeeklyAwardReadiness(
  season: number,
  week: number,
  options: AwardReadinessOptions = {},
): WeeklyAwardReadiness {
  const dataRoot = options.dataRoot ?? path.join(process.cwd(), 'data/history/matchups/sleeper');
  const rosters = readJson<RawRoster[]>(path.join(dataRoot, String(season), 'rosters.json'));
  const rows = readJson<RawMatchupRow[]>(path.join(dataRoot, String(season), `week-${String(week).padStart(2, '0')}.json`));
  const reasons: string[] = [];
  const rosterOwnerIds = new Map<number, string>();
  const unresolvedOwners: string[] = [];
  for (const roster of rosters ?? []) {
    const owner = ALL_LCC_OWNERS.find((candidate) => candidate.sleeperUserId === roster.owner_id);
    if (owner) rosterOwnerIds.set(roster.roster_id, owner.id);
    else unresolvedOwners.push(roster.owner_id ?? `roster-${roster.roster_id}`);
  }
  const expectedMatchups = rosters ? Math.floor(rosters.length / 2) : 0;
  const groups = new Map<number, RawMatchupRow[]>();
  for (const row of rows ?? []) {
    if (Number.isInteger(row.matchup_id)) groups.set(row.matchup_id as number, [...(groups.get(row.matchup_id as number) ?? []), row]);
  }
  if (!rosters || !rows) reasons.push('matchup or roster snapshot is missing');
  const ownerIntegrityIssue = unresolvedOwners.length > 0;
  if (ownerIntegrityIssue) reasons.push('one or more roster owners cannot be resolved to the canonical directory');
  const matchupIntegrityIssue = groups.size !== expectedMatchups || [...groups.values()].some((group) => group.length !== 2);
  if (matchupIntegrityIssue) reasons.push('matchup coverage is incomplete or malformed');
  const allRows = [...groups.values()].flat();
  const rosterIds = allRows.map((row) => row.roster_id);
  const duplicateRosterIssue = new Set(rosterIds).size !== rosterIds.length;
  if (duplicateRosterIssue) reasons.push('duplicate roster participation exists');
  const scores = allRows.map(scoreOf);
  if (scores.some((score) => score === null)) reasons.push('one or more matchup scores are missing');
  const placeholderScores = scores.length > 0 && scores.every((score) => score === 0);
  if (placeholderScores) reasons.push('all persisted scores are zero placeholders; no winner can be proposed');
  if (options.currentActiveWeek === undefined) reasons.push('current active week or another authoritative finality signal is unavailable');
  else if (week >= options.currentActiveWeek) reasons.push('week is not behind the current active week');
  if (!options.conservativeDelaySatisfied) reasons.push('conservative finality delay has not been established');
  const candidateScores = allRows.map((row, index) => ({ score: scores[index], ownerId: rosterOwnerIds.get(row.roster_id) ?? null })).filter((entry): entry is { score: number; ownerId: string | null } => entry.score !== null);
  const ordered = [...candidateScores].sort((a, b) => b.score - a.score);
  const highestScore = ordered[0]?.score ?? null;
  const nextHighestScore = ordered[1]?.score ?? null;
  const tied = !placeholderScores && highestScore !== null && ordered.filter((entry) => entry.score === highestScore).length > 1;
  if (tied) reasons.push('highest score is tied and requires explicit review');
  const status = classifyAwardReadiness({ hasIntegrityIssue: ownerIntegrityIssue || matchupIntegrityIssue || duplicateRosterIssue || tied, hasWaitingCondition: reasons.length > 0 });
  const candidateOwnerId = status === 'ready' ? ordered[0]?.ownerId ?? null : null;
  const displayHighestScore = placeholderScores ? null : highestScore;
  const displayNextHighestScore = placeholderScores ? null : nextHighestScore;
  return { season, week, status, reasons, expectedMatchups, observedMatchups: groups.size, resolvedOwners: rosterOwnerIds.size, unresolvedOwners, highestScore: displayHighestScore, candidateOwnerId, candidateTeamName: candidateOwnerId ? getOwnerById(candidateOwnerId)?.teamName ?? null : null, nextHighestScore: displayNextHighestScore, tie: tied };
}

export function evaluateSeasonWeeklyAwardReadiness(season: number, options: AwardReadinessOptions = {}): readonly WeeklyAwardReadiness[] {
  const weeks = getFinancialRules().regularSeasonWeeks;
  if (weeks === null) throw new Error('regular-season week count is not configured');
  return Array.from({ length: weeks }, (_, index) => evaluateWeeklyAwardReadiness(season, index + 1, options));
}
