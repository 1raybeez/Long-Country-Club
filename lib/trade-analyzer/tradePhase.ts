import type { LeaguePhase } from "./types";

// Trade Analyzer v1 uses this narrow calendar only. Broader league-calendar work is out of scope.
export const TRADE_PHASE_CALENDAR = Object.freeze({ draftWindowStartMonth: 7, draftWindowEndMonth: 9, seasonStartMonth: 9, seasonEndMonth: 3 });

export function resolveTradeAnalyzerLeaguePhase(now = new Date()): LeaguePhase {
  const month = now.getUTCMonth() + 1;
  if (month >= TRADE_PHASE_CALENDAR.draftWindowStartMonth && month < TRADE_PHASE_CALENDAR.draftWindowEndMonth) return "DRAFT_WINDOW";
  if (month >= TRADE_PHASE_CALENDAR.seasonStartMonth || month < TRADE_PHASE_CALENDAR.seasonEndMonth) return "IN_SEASON";
  return "OFFSEASON";
}
