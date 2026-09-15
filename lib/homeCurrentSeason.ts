import { getLeagueInfo, getLeagueRosters, getMatchupsForWeek } from "./sleeper.ts";
import { getLccOwnerBySleeperUserId } from "./lccOwners.ts";
import { LCC_CURRENT_LEAGUE_ID, LCC_CURRENT_SEASON } from "./leagueConstants.ts";
import type { LccMemberIdentity } from "./auth/types.ts";

export type HomeSeasonPhase = "PRESEASON" | "REGULAR_SEASON" | "POSTSEASON" | "SEASON_COMPLETE" | "UNKNOWN";

export interface HomeCurrentWeekState {
  readonly season: number;
  readonly phase: HomeSeasonPhase;
  readonly week: number | null;
  readonly source: "sleeper-league" | "unavailable";
}

export interface HomeMatchupView {
  readonly state: "current" | "scheduled" | "complete" | "unavailable";
  readonly week: number | null;
  readonly ownerId: string | null;
  readonly ownerName: string | null;
  readonly opponentOwnerId: string | null;
  readonly opponentName: string | null;
  readonly ownerScore: number | null;
  readonly opponentScore: number | null;
  readonly href: "/matchups";
}

export interface HomeCurrentSeasonView {
  readonly week: HomeCurrentWeekState;
  readonly matchup: HomeMatchupView;
}

export interface TrustedSleeperLeagueState {
  readonly season?: string | number | null;
  readonly status?: string | null;
  readonly settings?: { readonly leg?: number | null; readonly playoff_week_start?: number | null } | null;
}

export function resolveHomeCurrentWeek(
  league: TrustedSleeperLeagueState | null | undefined,
  season = LCC_CURRENT_SEASON
): HomeCurrentWeekState {
  const sourceSeason = Number(league?.season);
  const week = Number(league?.settings?.leg);
  if (!league || sourceSeason !== season || !Number.isInteger(week) || week < 1) {
    return { season, phase: "UNKNOWN", week: null, source: "unavailable" };
  }

  if (league.status === "complete" || week > 17) {
    return { season, phase: "SEASON_COMPLETE", week, source: "sleeper-league" };
  }
  if (league.settings?.playoff_week_start && week >= league.settings.playoff_week_start) {
    return { season, phase: "POSTSEASON", week, source: "sleeper-league" };
  }
  return { season, phase: "REGULAR_SEASON", week, source: "sleeper-league" };
}

type SleeperRoster = { readonly roster_id: number; readonly owner_id: string };
type SleeperMatchup = { readonly matchup_id: number | null; readonly roster_id: number; readonly points?: number | null };

export function buildHomeMatchupView(
  matchups: readonly SleeperMatchup[] | null | undefined,
  rosters: readonly SleeperRoster[] | null | undefined,
  member: LccMemberIdentity | null,
  week: number | null
): HomeMatchupView {
  if (!member || !matchups?.length || !rosters?.length || week === null) return unavailableMatchup(week, member);

  const roster = rosters.find((candidate) => getLccOwnerBySleeperUserId(candidate.owner_id)?.id === member.ownerId);
  if (!roster) return unavailableMatchup(week, member);

  const row = matchups.find((candidate) => candidate.roster_id === roster.roster_id);
  if (!row || row.matchup_id === null || row.matchup_id === undefined) return unavailableMatchup(week, member);

  const opponentRow = matchups.find(
    (candidate) => candidate.matchup_id === row.matchup_id && candidate.roster_id !== row.roster_id
  );
  const opponentRoster = opponentRow
    ? rosters.find((candidate) => candidate.roster_id === opponentRow.roster_id)
    : undefined;
  const opponent = opponentRoster ? getLccOwnerBySleeperUserId(opponentRoster.owner_id) : undefined;
  const ownerScore = typeof row.points === "number" ? row.points : null;
  const opponentScore = typeof opponentRow?.points === "number" ? opponentRow.points : null;
  const complete = ownerScore !== null && opponentScore !== null && (ownerScore > 0 || opponentScore > 0);

  return {
    state: complete ? "complete" : "scheduled",
    week,
    ownerId: member.ownerId,
    ownerName: member.displayName,
    opponentOwnerId: opponent?.id ?? null,
    opponentName: opponent?.displayName ?? null,
    ownerScore: complete ? ownerScore : null,
    opponentScore: complete ? opponentScore : null,
    href: "/matchups",
  };
}

export async function loadHomeCurrentSeasonView(
  member: LccMemberIdentity | null
): Promise<HomeCurrentSeasonView> {
  try {
    const league = await getLeagueInfo(LCC_CURRENT_LEAGUE_ID) as TrustedSleeperLeagueState;
    const week = resolveHomeCurrentWeek(league);
    if (week.week === null) return { week, matchup: unavailableMatchup(null, member) };
    const [matchups, rosters] = await Promise.all([
      getMatchupsForWeek(week.week, LCC_CURRENT_LEAGUE_ID),
      getLeagueRosters(LCC_CURRENT_LEAGUE_ID),
    ]);
    return { week, matchup: buildHomeMatchupView(matchups, rosters, member, week.week) };
  } catch {
    return {
      week: { season: LCC_CURRENT_SEASON, phase: "UNKNOWN", week: null, source: "unavailable" },
      matchup: unavailableMatchup(null, member),
    };
  }
}

function unavailableMatchup(week: number | null, member: LccMemberIdentity | null): HomeMatchupView {
  return {
    state: "unavailable", week, ownerId: member?.ownerId ?? null, ownerName: member?.displayName ?? null,
    opponentOwnerId: null, opponentName: null, ownerScore: null, opponentScore: null, href: "/matchups",
  };
}
