import { getLeagueInfo } from "./sleeper.ts";
import { LCC_CURRENT_LEAGUE_ID, LCC_CURRENT_SEASON } from "./leagueConstants.ts";

export type LccWeekStateName = "PRESEASON" | "UPCOMING" | "LIVE" | "COMPLETED" | "SEASON_COMPLETE" | "UNKNOWN";
export interface LccSeasonWeekState { readonly season: number; readonly state: LccWeekStateName; readonly activeWeek: number | null; readonly latestCompletedWeek: number | null; readonly nextWeek: number | null; readonly safeCompletedWeek: number | null; readonly playoffWeekStart: number | null; readonly source: "sleeper-league" | "unavailable"; }
export interface SleeperWeekStateLeague { readonly season?: string | number | null; readonly status?: string | null; readonly settings?: { readonly leg?: number | null; readonly last_scored_leg?: number | null; readonly playoff_week_start?: number | null } | null; }
export function resolveLccSeasonWeekState(league: SleeperWeekStateLeague | null | undefined, season = LCC_CURRENT_SEASON): LccSeasonWeekState {
  if (!league || Number(league.season) !== season) return unavailable(season);
  const playoffWeekStart = integerOrNull(league.settings?.playoff_week_start);
  if (["pre_draft", "preseason", "offseason"].includes(league.status ?? "")) return { season, state: "PRESEASON", activeWeek: null, latestCompletedWeek: null, nextWeek: 1, safeCompletedWeek: null, playoffWeekStart, source: "sleeper-league" };
  const activeWeek = integerOrNull(league.settings?.leg);
  if (!activeWeek) return unavailable(season);
  const reportedCompleted = integerOrNull(league.settings?.last_scored_leg);
  const safeCompletedWeek = reportedCompleted ? Math.min(reportedCompleted, 17) : Math.max(0, activeWeek - 1);
  const latestCompletedWeek = safeCompletedWeek > 0 ? safeCompletedWeek : null;
  return { season, state: league.status === "complete" || activeWeek > 17 ? "SEASON_COMPLETE" : safeCompletedWeek >= activeWeek ? "COMPLETED" : "LIVE", activeWeek, latestCompletedWeek, nextWeek: latestCompletedWeek === null ? 1 : latestCompletedWeek + 1, safeCompletedWeek: latestCompletedWeek, playoffWeekStart, source: "sleeper-league" };
}
export function isWeekSafelyCompleted(state: LccSeasonWeekState, week: number): boolean { return Number.isInteger(week) && week > 0 && state.safeCompletedWeek !== null && week <= state.safeCompletedWeek; }
export async function loadLccSeasonWeekState(season = LCC_CURRENT_SEASON): Promise<LccSeasonWeekState> { try { return resolveLccSeasonWeekState(await getLeagueInfo(LCC_CURRENT_LEAGUE_ID), season); } catch { return unavailable(season); } }
function integerOrNull(value: unknown): number | null { return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null; }
function unavailable(season: number): LccSeasonWeekState { return { season, state: "UNKNOWN", activeWeek: null, latestCompletedWeek: null, nextWeek: null, safeCompletedWeek: null, playoffWeekStart: null, source: "unavailable" }; }
