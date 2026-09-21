import { ACTIVE_LCC_OWNERS } from "@/lib/lccOwners";
import { loadCurrentSeasonMatchups } from "@/lib/homeCurrentSeason";
import { getFinancialRules } from "@/lib/financeRules";
import type { WeeklyHighResult } from "@/lib/finance/weeklyHigh";
import type { HistoricalMatchup } from "@/lib/history/matchups";
import type { HomeCurrentWeekState } from "@/lib/homeCurrentSeason";
import { getOwnerById } from "@/lib/ownerRegistry";
import type { PostseasonSnapshot } from "@/lib/postseason/types";
import { attachPostseasonContext } from "@/lib/postseason/matchupContext";

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
  readonly winnerOwnerId: string | null;
  readonly roundLabel: string | null;
  readonly bracketType: string | null;
  readonly isChampionship: boolean;
  readonly isPlacementGame: boolean;
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
  readonly phase: "REGULAR_SEASON" | "POSTSEASON";
  readonly roundLabel: string | null;
  readonly bracketTypes: readonly string[];
  readonly byeCount: number;
  readonly championshipMatchup: RecapMatchupSummary | null;
  readonly placementMatchups: readonly RecapMatchupSummary[];
  readonly bracketStatus: "complete" | "unresolved" | "unavailable" | null;
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
  phase: "REGULAR_SEASON",
  roundLabel: null,
  bracketTypes: [],
  byeCount: 0,
  championshipMatchup: null,
  placementMatchups: [],
  bracketStatus: null,
});

export function buildHomeWeeklyRecap(
  season: number,
  week: number | null,
  matchups: readonly HistoricalMatchup[],
  weeklyHigh: WeeklyHighResult | null,
  expectedMatchups: number | null = null,
  postseason: PostseasonSnapshot | null = null,
  phase: "REGULAR_SEASON" | "POSTSEASON" = "REGULAR_SEASON",
): HomeWeeklyRecap {
  if (week === null) return EMPTY_RECAP(season);
  const bracketStatus = phase === "POSTSEASON" ? postseason?.sourceStatus ?? "unavailable" : null;
  if (phase === "POSTSEASON" && bracketStatus === "unavailable") {
    return { ...EMPTY_RECAP(season), week, phase, bracketStatus, availability: "partial", note: "This playoff recap is temporarily unavailable because playoff bracket details could not be verified." };
  }
  const enriched = phase === "POSTSEASON" ? attachPostseasonContext(matchups, postseason) : matchups;
  const playable = phase === "POSTSEASON"
    ? enriched.filter((matchup) => matchup.postseason && !matchup.postseason.isBye && matchup.postseason.sourceStatus === "complete")
    : enriched;
  const normalized = playable
    .filter((matchup) => matchup.ownerAScore !== null && matchup.ownerBScore !== null)
    .map((matchup) => summarizeMatchup(matchup));
  const complete = normalized.length > 0
    && normalized.every((matchup) => Number.isFinite(matchup.ownerAScore) && Number.isFinite(matchup.ownerBScore))
    && new Set(normalized.flatMap((matchup) => [matchup.ownerAId, matchup.ownerBId])).size === normalized.length * 2
    && (expectedMatchups === null || normalized.length === expectedMatchups);
  const currentContexts = postseason?.contexts.filter((context) => context.activeWeek === week || phase !== "POSTSEASON") ?? [];
  const roundLabel = normalized.find((matchup) => matchup.roundLabel)?.roundLabel ?? currentContexts.find((context) => context.roundLabel)?.roundLabel ?? null;
  const bracketTypes = [...new Set(normalized.map((matchup) => matchup.bracketType).filter((value): value is string => Boolean(value)))];
  const byeCount = phase === "POSTSEASON" ? postseason?.contexts.filter((context) => context.isBye).length ?? 0 : 0;
  if (!complete) return { ...EMPTY_RECAP(season), week, phase, bracketStatus, roundLabel, bracketTypes, byeCount, matchupCount: normalized.length, matchupCountExpected: expectedMatchups, availability: normalized.length ? "partial" : "unavailable", note: phase === "POSTSEASON" ? "Playoff recap data is incomplete." : "Recap data is incomplete." };

  const teams = normalized.flatMap((matchup) => [
    { ownerId: matchup.ownerAId, teamName: matchup.ownerAName, score: matchup.ownerAScore },
    { ownerId: matchup.ownerBId, teamName: matchup.ownerBName, score: matchup.ownerBScore },
  ]).sort((a, b) => b.score - a.score || a.teamName.localeCompare(b.teamName));
  const closestMatchups = tiedBy(normalized, (matchup) => matchup.margin, (a, b) => a - b);
  const largestMarginMatchups = tiedBy(normalized, (matchup) => matchup.margin, (a, b) => b - a);
  const highestScoringMatchups = tiedBy(normalized, (matchup) => matchup.combinedScore, (a, b) => b - a);
  const authoritativeHigh = phase === "REGULAR_SEASON" && weeklyHigh && (weeklyHigh.status === "FINAL" || weeklyHigh.status === "MANUAL") && weeklyHigh.franchiseName && weeklyHigh.score !== null
    ? { teamName: weeklyHigh.franchiseName, score: weeklyHigh.score, amountCents: weeklyHigh.awardAmountCents }
    : null;
  const championshipMatchup = normalized.find((matchup) => matchup.isChampionship) ?? null;
  const placementMatchups = normalized.filter((matchup) => matchup.isPlacementGame && !matchup.isChampionship);

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
    note: phase === "POSTSEASON" ? "Regular-season weekly high awards ended after Week 14." : authoritativeHigh ? null : "Weekly-high award is not finalized.",
    phase,
    roundLabel,
    bracketTypes,
    byeCount,
    championshipMatchup,
    placementMatchups,
    bracketStatus,
  };
}

export async function loadHomeWeeklyRecap(
  state: Pick<HomeCurrentWeekState, "season" | "safeCompletedWeek" | "phase">,
  weeklyHighBoard: readonly WeeklyHighResult[],
  postseason: PostseasonSnapshot | null = null,
): Promise<HomeWeeklyRecap> {
  const week = state.safeCompletedWeek;
  if (week === null) return EMPTY_RECAP(state.season);
  const matchups = await loadCurrentSeasonMatchups(week);
  const regularSeasonWeeks = getFinancialRules().regularSeasonWeeks ?? 14;
  const phase = state.phase === "POSTSEASON" || state.phase === "SEASON_COMPLETE" || week > regularSeasonWeeks ? "POSTSEASON" : "REGULAR_SEASON";
  const expectedMatchups = phase === "REGULAR_SEASON" ? Math.floor(ACTIVE_LCC_OWNERS.length / 2) : null;
  return buildHomeWeeklyRecap(state.season, week, matchups, weeklyHighBoard.find((item) => item.week === week) ?? null, expectedMatchups, postseason, phase);
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
    winnerOwnerId: matchup.winnerOwnerId,
    roundLabel: matchup.postseason?.roundLabel ?? null,
    bracketType: matchup.postseason?.bracketType ?? null,
    isChampionship: matchup.postseason?.isChampionship === true,
    isPlacementGame: matchup.postseason?.isPlacementGame === true,
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
