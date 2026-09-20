import { ACTIVE_LCC_OWNERS } from "@/lib/lccOwners";
import { loadCurrentSeasonMatchups } from "@/lib/homeCurrentSeason";
import { getFinancialRules } from "@/lib/financeRules";
import type { WeeklyHighResult } from "@/lib/finance/weeklyHigh";
import type { HistoricalMatchup } from "@/lib/history/matchups";
import type { HomeCurrentWeekState } from "@/lib/homeCurrentSeason";
import { getOwnerById } from "@/lib/ownerRegistry";

export type RecapAvailability = "complete" | "partial" | "unavailable";

export interface RecapMatchupSummary {
  readonly matchupKey: string;
  readonly ownerAId: string;
  readonly ownerBId: string;
  readonly ownerAName: string;
  readonly ownerBName: string;
  readonly ownerAScore: number;
  readonly ownerBScore: number;
  readonly margin: number;
  readonly combinedScore: number;
}
export interface RecapTeamScore {
  readonly ownerId: string;
  readonly teamName: string;
  readonly score: number;
}

export interface HomeWeeklyRecap {
  readonly season: number;
  readonly week: number | null;
  readonly availability: RecapAvailability;
  readonly matchupCount: number;
  readonly matchupCountExpected: number | null;
  readonly highestScoringTeam: RecapTeamScore | null;
  readonly lowestScoringTeam: RecapTeamScore | null;
  readonly closestMatchups: readonly RecapMatchupSummary[];
  readonly largestMarginMatchups: readonly RecapMatchupSummary[];
  readonly highestScoringMatchups: readonly RecapMatchupSummary[];
  readonly weeklyHighWinner: { readonly teamName: string; readonly score: number; readonly amountCents: number } | null;
  readonly note: string | null;
}

const EMPTY_RECAP = (season: number): HomeWeeklyRecap => ({
  season,
  week: null,
  availability: "unavailable",
  matchupCount: 0,
  matchupCountExpected: null,
  highestScoringTeam: null,
  lowestScoringTeam: null,
  closestMatchups: [],
  largestMarginMatchups: [],
  highestScoringMatchups: [],
  weeklyHighWinner: null,
  note: "Recaps begin after a week is safely complete.",
});

export function buildHomeWeeklyRecap(
  season: number,
  week: number | null,
  matchups: readonly HistoricalMatchup[],
  weeklyHigh: WeeklyHighResult | null,
  expectedMatchups: number | null = null,
): HomeWeeklyRecap {
  if (week === null) return EMPTY_RECAP(season);
  const normalized = matchups
    .filter((matchup) => matchup.ownerAScore !== null && matchup.ownerBScore !== null)
    .map((matchup) => summarizeMatchup(matchup));
  const complete = normalized.length > 0
    && normalized.every((matchup) => Number.isFinite(matchup.ownerAScore) && Number.isFinite(matchup.ownerBScore))
    && new Set(normalized.flatMap((matchup) => [matchup.ownerAId, matchup.ownerBId])).size === normalized.length * 2
    && (expectedMatchups === null || normalized.length === expectedMatchups);
  if (!complete) return { ...EMPTY_RECAP(season), week, matchupCount: normalized.length, matchupCountExpected: expectedMatchups, availability: normalized.length ? "partial" : "unavailable", note: "Recap data is incomplete." };

  const teams = normalized.flatMap((matchup) => [
    { ownerId: matchup.ownerAId, teamName: matchup.ownerAName, score: matchup.ownerAScore },
    { ownerId: matchup.ownerBId, teamName: matchup.ownerBName, score: matchup.ownerBScore },
  ]).sort((a, b) => b.score - a.score || a.teamName.localeCompare(b.teamName));
  const closestMatchups = tiedBy(normalized, (matchup) => matchup.margin, (a, b) => a - b);
  const largestMarginMatchups = tiedBy(normalized, (matchup) => matchup.margin, (a, b) => b - a);
  const highestScoringMatchups = tiedBy(normalized, (matchup) => matchup.combinedScore, (a, b) => b - a);
  const authoritativeHigh = weeklyHigh && (weeklyHigh.status === "FINAL" || weeklyHigh.status === "MANUAL") && weeklyHigh.franchiseName && weeklyHigh.score !== null
    ? { teamName: weeklyHigh.franchiseName, score: weeklyHigh.score, amountCents: weeklyHigh.awardAmountCents }
    : null;

  return {
    season,
    week,
    availability: "complete",
    matchupCount: normalized.length,
    matchupCountExpected: expectedMatchups,
    highestScoringTeam: teams[0] ?? null,
    lowestScoringTeam: teams.at(-1) ?? null,
    closestMatchups,
    largestMarginMatchups,
    highestScoringMatchups,
    weeklyHighWinner: authoritativeHigh,
    note: authoritativeHigh ? null : "Weekly-high award is not finalized.",
  };
}

export async function loadHomeWeeklyRecap(
  state: Pick<HomeCurrentWeekState, "season" | "safeCompletedWeek">,
  weeklyHighBoard: readonly WeeklyHighResult[],
): Promise<HomeWeeklyRecap> {
  const week = state.safeCompletedWeek;
  if (week === null) return EMPTY_RECAP(state.season);
  const matchups = await loadCurrentSeasonMatchups(week);
  const regularSeasonWeeks = getFinancialRules().regularSeasonWeeks ?? 14;
  const expectedMatchups = week <= regularSeasonWeeks ? Math.floor(ACTIVE_LCC_OWNERS.length / 2) : null;
  return buildHomeWeeklyRecap(state.season, week, matchups, weeklyHighBoard.find((item) => item.week === week) ?? null, expectedMatchups);
}

function summarizeMatchup(matchup: HistoricalMatchup): RecapMatchupSummary {
  const ownerAName = getOwnerById(matchup.ownerAId)?.teamName ?? matchup.ownerAId;
  const ownerBName = getOwnerById(matchup.ownerBId)?.teamName ?? matchup.ownerBId;
  return {
    matchupKey: [matchup.ownerAId, matchup.ownerBId].sort().join("::"),
    ownerAId: matchup.ownerAId,
    ownerBId: matchup.ownerBId,
    ownerAName,
    ownerBName,
    ownerAScore: matchup.ownerAScore!,
    ownerBScore: matchup.ownerBScore!,
    margin: Math.abs(matchup.ownerAScore! - matchup.ownerBScore!),
    combinedScore: matchup.ownerAScore! + matchup.ownerBScore!,
  };
}

function tiedBy(
  matchups: readonly RecapMatchupSummary[],
  value: (matchup: RecapMatchupSummary) => number,
  compare: (a: number, b: number) => number,
): readonly RecapMatchupSummary[] {
  if (!matchups.length) return [];
  const sorted = [...matchups].sort((a, b) => compare(value(a), value(b)) || a.matchupKey.localeCompare(b.matchupKey));
  const target = value(sorted[0]);
  return sorted.filter((matchup) => value(matchup) === target);
}
