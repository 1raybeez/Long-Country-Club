import fs from 'node:fs';
import path from 'node:path';
import { ALL_LCC_OWNERS } from '@/lib/lccOwners';
import { getOwnerById } from '@/lib/ownerRegistry';
import { calculateChampionAllocationCents, getAwardAmountCents, type ChampionAllocationContext } from '@/lib/finance/awardObligations';
import type { AwardReadinessStatus, PostseasonAwardCategory } from '@/lib/types/awardObligation';

type BracketRow = { r?: number; p?: number; t1?: number | null; t2?: number | null; w?: number | null; l?: number | null };
type RosterRow = { roster_id: number; owner_id?: string | null };

export interface PostseasonReadinessResult {
  readonly season: number;
  readonly category: PostseasonAwardCategory;
  readonly status: AwardReadinessStatus;
  readonly reason: string;
  readonly source: string;
  readonly sourceReference: string;
  readonly placement: number | null;
  readonly ownerId: string | null;
  readonly teamName: string | null;
  readonly amountCents: number | null;
  readonly finalityEvidence: { readonly finalitySignal: boolean; readonly authoritativeSource: string | null };
}

export interface PostseasonReadinessOptions {
  readonly dataRoot?: string;
  readonly finalitySignal?: boolean;
  readonly winnersBracket?: readonly BracketRow[];
  readonly rosters?: readonly RosterRow[];
  readonly finalPlacements?: Readonly<Record<number, number>>;
  readonly championContext?: ChampionAllocationContext;
}

const categories = ['fourth-place', 'third-place', 'runner-up', 'champion'] as const;
const placementFor: Record<PostseasonAwardCategory, number> = { 'fourth-place': 4, 'third-place': 3, 'runner-up': 2, champion: 1 };

function readJson<T>(filePath: string): T | null {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T; } catch { return null; }
}

function ownerIdForRoster(rosterId: number | null | undefined, rosterMap: Map<number, string>): string | null {
  return typeof rosterId === 'number' ? rosterMap.get(rosterId) ?? null : null;
}

function result(season: number, category: PostseasonAwardCategory, status: AwardReadinessStatus, reason: string, options: PostseasonReadinessOptions, ownerId: string | null = null): PostseasonReadinessResult {
  const amountCents = status === 'ready' ? category === 'champion'
    ? options.championContext ? calculateChampionAllocationCents(options.championContext) : null
    : getAwardAmountCents(category) : null;
  return { season, category, status, reason, source: 'Sleeper', sourceReference: `sleeper:${season}:postseason:${category}`, placement: status === 'ready' ? placementFor[category] : null, ownerId, teamName: ownerId ? getOwnerById(ownerId)?.teamName ?? null : null, amountCents, finalityEvidence: { finalitySignal: options.finalitySignal === true, authoritativeSource: options.finalPlacements ? 'explicit-final-placements' : options.winnersBracket ? 'sleeper-winners-bracket' : null } };
}

export function evaluatePostseasonAwardReadiness(season: number, options: PostseasonReadinessOptions = {}): readonly PostseasonReadinessResult[] {
  const dataRoot = options.dataRoot ?? path.join(process.cwd(), 'data/history/matchups/sleeper');
  const bracket = options.winnersBracket ?? readJson<BracketRow[]>(path.join(dataRoot, String(season), 'winners-bracket.json'));
  const rosters = options.rosters ?? readJson<RosterRow[]>(path.join(dataRoot, String(season), 'rosters.json'));
  const rosterMap = new Map<number, string>();
  const unresolvedRosters: number[] = [];
  for (const roster of rosters ?? []) {
    const owner = ALL_LCC_OWNERS.find((candidate) => candidate.sleeperUserId === roster.owner_id);
    if (owner) rosterMap.set(roster.roster_id, owner.id); else unresolvedRosters.push(roster.roster_id);
  }
  const finality = options.finalitySignal === true;
  const p1 = (bracket ?? []).filter((match) => match.p === 1);
  const p3 = (bracket ?? []).filter((match) => match.p === 3);
  const conflictReasons: string[] = [];
  if (p1.length > 1) conflictReasons.push('multiple championship matches are present');
  if (p3.length > 1) conflictReasons.push('multiple third-place matches are present');
  if (unresolvedRosters.length) conflictReasons.push('one or more postseason roster owners cannot be resolved canonically');
  const placementRosters = new Map<number, number>();
  if (options.finalPlacements) for (const [placement, rosterId] of Object.entries(options.finalPlacements)) placementRosters.set(Number(placement), rosterId);
  const p1Match = p1[0];
  const p3Match = p3[0];
  const validFinalMatch = (match: BracketRow | undefined) => Boolean(match && Number.isInteger(match.w) && Number.isInteger(match.l) && match.w !== match.l);
  const championRoster = placementRosters.get(1) ?? (validFinalMatch(p1Match) ? p1Match?.w ?? null : null);
  const runnerRoster = placementRosters.get(2) ?? (validFinalMatch(p1Match) ? p1Match?.l ?? null : null);
  const thirdRoster = placementRosters.get(3) ?? (validFinalMatch(p3Match) ? p3Match?.w ?? null : null);
  const fourthRoster = placementRosters.get(4) ?? (validFinalMatch(p3Match) ? p3Match?.l ?? null : null);
  const resolved = [championRoster, runnerRoster, thirdRoster, fourthRoster].filter((id): id is number => typeof id === 'number');
  if (new Set(resolved).size !== resolved.length) conflictReasons.push('the same roster is assigned to multiple final placements');
  if (options.finalPlacements && !finality) conflictReasons.push('explicit final placements lack an authoritative finality signal');
  const sourceAvailable = Boolean(options.finalPlacements || bracket);
  const waitingReason = !sourceAvailable ? 'Authoritative postseason result source is unavailable.' : !finality ? 'Postseason result finality signal is not available.' : 'The required postseason result is not complete.';
  const ready = (category: PostseasonAwardCategory, rosterId: number | null, requiresMatch: boolean) => {
    if (conflictReasons.length) return result(season, category, 'issue', conflictReasons[0], options);
    if (!finality || (requiresMatch && !options.finalPlacements && !validFinalMatch(category === 'champion' || category === 'runner-up' ? p1Match : p3Match))) return result(season, category, 'waiting', waitingReason, options);
    const ownerId = ownerIdForRoster(rosterId, rosterMap);
    if (!ownerId) return result(season, category, 'issue', 'Resolved placement does not map to a canonical owner.', options);
    return result(season, category, 'ready', 'Authoritative final result resolved; no award obligation has been created.', options, ownerId);
  };
  return [ready('fourth-place', fourthRoster, true), ready('third-place', thirdRoster, true), ready('runner-up', runnerRoster, true), ready('champion', championRoster, true)];
}

export const getPostseasonAwardReadiness = evaluatePostseasonAwardReadiness;
