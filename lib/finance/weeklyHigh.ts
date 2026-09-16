import { FieldValue } from 'firebase-admin/firestore';
import { getCurrentMemberSession } from '@/lib/auth/session';
import { getFirebaseAdminFirestore } from '@/lib/auth/firebaseAdmin';
import { getLeagueInfo, getLeagueRosters, getMatchupsForWeek } from '@/lib/sleeper';
import { getLccOwnerById, getLccOwnerBySleeperUserId } from '@/lib/lccOwners';
import { getFinancialRules } from '@/lib/financeRules';
import { LCC_CURRENT_LEAGUE_ID, LCC_CURRENT_SEASON } from '@/lib/leagueConstants';
import { isWeekSafelyCompleted, loadLccSeasonWeekState } from '@/lib/weekState';

export type WeeklyHighStatus = 'PROVISIONAL' | 'FINAL' | 'MANUAL' | 'UNAVAILABLE';

// NOT PROVEN: the repository's Sleeper adapter exposes matchup totals but no
// official weekly-report winner endpoint or designation. Ties stay unresolved.
export const SLEEPER_WEEKLY_REPORT_API_STATUS = 'NOT PROVEN' as const;

export interface WeeklyHighResult {
  readonly season: number;
  readonly week: number;
  readonly franchiseId: string | null;
  readonly franchiseName: string | null;
  readonly ownerDisplayName: string | null;
  readonly score: number | null;
  readonly awardAmountCents: number;
  readonly status: WeeklyHighStatus;
  readonly source: 'sleeper' | 'commissioner-override' | 'unavailable';
  readonly observedAt: string;
  readonly tie: boolean;
  readonly decisionRequired: boolean;
  readonly note?: string;
  readonly tiedFranchises?: readonly { readonly franchiseId: string; readonly franchiseName: string; readonly score: number }[];
  readonly rosterTotals: readonly { readonly rosterId: number; readonly franchiseId: string | null; readonly franchiseName: string | null; readonly score: number | null }[];
}

export interface WeeklyHighRosterTotal {
  readonly rosterId: number;
  readonly franchiseId: string | null;
  readonly franchiseName: string | null;
  readonly score: number | null;
}

export function selectWeeklyHighFromTotals(totals: readonly WeeklyHighRosterTotal[], completed: boolean) {
  const scored = totals.filter((row): row is WeeklyHighRosterTotal & { score: number; franchiseId: string; franchiseName: string } => row.score !== null && row.franchiseId !== null && row.franchiseName !== null).sort((a, b) => b.score - a.score);
  const highest = scored[0];
  const tie = Boolean(highest && scored.filter((row) => row.score === highest.score).length > 1);
  const tiedFranchises = tie ? scored.filter((row) => row.score === highest.score).map((row) => ({ franchiseId: row.franchiseId, franchiseName: row.franchiseName, score: row.score })) : [];
  return { winner: tie || !highest ? null : highest, tie, tiedFranchises, status: tie || !highest ? 'UNAVAILABLE' as const : completed ? 'FINAL' as const : 'PROVISIONAL' as const, decisionRequired: tie || !completed || !highest };
}

export async function deriveWeeklyHigh(season: number, week: number): Promise<WeeklyHighResult> {
  const observedAt = new Date().toISOString();
  const awardAmountCents = (getFinancialRules().weeklyHighPayout ?? 0) * 100;
  try {
    const [league, rosters, rows] = await Promise.all([
      getLeagueInfo(LCC_CURRENT_LEAGUE_ID) as Promise<{ season?: string | number; status?: string; settings?: { leg?: number; last_scored_leg?: number } }>,
      getLeagueRosters(LCC_CURRENT_LEAGUE_ID) as Promise<readonly { roster_id: number; owner_id?: string | null }[]>,
      getMatchupsForWeek(week, LCC_CURRENT_LEAGUE_ID) as Promise<readonly { roster_id: number; points?: number | null; custom_points?: number | null }[]>,
    ]);
    if (Number(league.season) !== season || !rosters.length || !rows.length) throw new Error('missing current Sleeper weekly-high data');
    const rowsByRoster = new Map(rows.map((row) => [row.roster_id, row]));
    const rosterTotals: WeeklyHighRosterTotal[] = rosters.map((roster) => {
      const owner = getLccOwnerBySleeperUserId(roster.owner_id ?? '');
      const row = rowsByRoster.get(roster.roster_id);
      const score = typeof row?.custom_points === 'number' ? row.custom_points : typeof row?.points === 'number' ? row.points : null;
      return { rosterId: roster.roster_id, franchiseId: owner?.id ?? null, franchiseName: owner?.managerPage.sleeperName ?? null, score };
    });
    const weekState = await loadLccSeasonWeekState(season);
    const completed = isWeekSafelyCompleted(weekState, week);
    const selected = selectWeeklyHighFromTotals(rosterTotals, completed);
    return { season, week, franchiseId: selected.winner?.franchiseId ?? null, franchiseName: selected.winner?.franchiseName ?? null, ownerDisplayName: selected.winner ? getLccOwnerById(selected.winner.franchiseId)?.displayName ?? null : null, score: selected.winner?.score ?? null, awardAmountCents, status: selected.status, source: 'sleeper', observedAt, tie: selected.tie, decisionRequired: selected.decisionRequired, tiedFranchises: selected.tiedFranchises, rosterTotals };
  } catch {
    return { season, week, franchiseId: null, franchiseName: null, ownerDisplayName: null, score: null, awardAmountCents, status: 'UNAVAILABLE', source: 'unavailable', observedAt, tie: false, decisionRequired: true, rosterTotals: [] };
  }
}

export async function getWeeklyHighBoard(season = LCC_CURRENT_SEASON): Promise<readonly WeeklyHighResult[]> {
  const regularSeasonWeeks = getFinancialRules().regularSeasonWeeks ?? 14;
  const weekState = await loadLccSeasonWeekState(season);
  const activeWeek = weekState.activeWeek ?? 0;
  const derivedThrough = weekState.safeCompletedWeek ?? Math.max(0, activeWeek - 1);
  const derived = await Promise.all(Array.from({ length: Math.min(regularSeasonWeeks, Math.max(0, activeWeek)) }, (_, index) => deriveWeeklyHigh(season, index + 1)));
  const db = getFirebaseAdminFirestore();
  const overrides = db ? await db.collection('financeSeasons').doc(String(season)).collection('weeklyHighOverrides').get() : null;
  const byWeek = new Map((overrides?.docs ?? []).map((doc) => [Number(doc.data().week), doc.data()]));
  return Array.from({ length: regularSeasonWeeks }, (_, index) => {
    const week = index + 1;
    const automatic = week <= derivedThrough ? derived.find((item) => item.week === week) ?? unavailableWeeklyHigh(season, week) : unavailableWeeklyHigh(season, week);
    const override = byWeek.get(week);
    if (!override) return automatic;
    const owner = typeof override.franchiseId === 'string' ? getLccOwnerById(override.franchiseId) : undefined;
    return { ...automatic, franchiseId: owner?.id ?? null, franchiseName: owner?.managerPage.sleeperName ?? null, ownerDisplayName: owner?.displayName ?? null, score: typeof override.score === 'number' ? override.score : null, status: 'MANUAL', source: 'commissioner-override', decisionRequired: false, note: typeof override.note === 'string' ? override.note : undefined };
  });
}

export async function saveWeeklyHighOverride(input: { season: number; week: number; franchiseId: string; score: number; note?: string }) {
  const session = await getCurrentMemberSession();
  if (!session?.member?.capabilities.includes('commissioner')) throw new Error('Commissioner authorization required.');
  const owner = getLccOwnerById(input.franchiseId);
  const rules = getFinancialRules();
  if (!owner || input.season !== LCC_CURRENT_SEASON || !Number.isInteger(input.week) || input.week < 1 || input.week > (rules.regularSeasonWeeks ?? 14) || !Number.isFinite(input.score) || input.score < 0 || input.score > 1000 || !input.note?.trim() || input.note.trim().length > 500) throw new Error('Invalid weekly-high override.');
  const db = getFirebaseAdminFirestore();
  if (!db) throw new Error('Operational finance storage is unavailable.');
  const ref = db.collection('financeSeasons').doc(String(input.season)).collection('weeklyHighOverrides').doc(String(input.week));
  await ref.set({ season: input.season, week: input.week, franchiseId: owner.id, score: input.score, note: input.note?.trim() || null, updatedAt: FieldValue.serverTimestamp(), updatedByMemberId: session.member.memberId, source: 'commissioner-override' });
  return { ok: true };
}

export async function revertWeeklyHighOverride(season: number, week: number) {
  const session = await getCurrentMemberSession();
  if (!session?.member?.capabilities.includes('commissioner')) throw new Error('Commissioner authorization required.');
  const maxWeek = getFinancialRules().regularSeasonWeeks ?? 14;
  if (season !== LCC_CURRENT_SEASON || !Number.isInteger(week) || week < 1 || week > maxWeek) throw new Error('Invalid weekly-high override.');
  const db = getFirebaseAdminFirestore();
  if (!db) throw new Error('Operational finance storage is unavailable.');
  await db.collection('financeSeasons').doc(String(season)).collection('weeklyHighOverrides').doc(String(week)).delete();
  return { ok: true };
}

function unavailableWeeklyHigh(season: number, week: number): WeeklyHighResult { return { season, week, franchiseId: null, franchiseName: null, ownerDisplayName: null, score: null, awardAmountCents: (getFinancialRules().weeklyHighPayout ?? 0) * 100, status: 'UNAVAILABLE', source: 'unavailable', observedAt: new Date().toISOString(), tie: false, decisionRequired: false, rosterTotals: [] }; }
