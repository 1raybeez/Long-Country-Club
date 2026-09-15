import { getLeagueInfo, getLeagueRosters, getMatchupsForWeek } from "./sleeper.ts";
import { getLccOwnerBySleeperUserId } from "./lccOwners.ts";
import { LCC_CURRENT_LEAGUE_ID, LCC_CURRENT_SEASON } from "./leagueConstants.ts";
import type { LccMemberIdentity } from "./auth/types.ts";
import { resolvePlayer } from "./history/playerRegistry.ts";
import type { HistoricalLineupPlayer, HistoricalMatchup } from "./history/matchups.ts";

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
  readonly ownerDisplayName: string | null;
  readonly opponentOwnerId: string | null;
  readonly opponentName: string | null;
  readonly opponentDisplayName: string | null;
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
  if (!league || sourceSeason !== season) {
    return { season, phase: "UNKNOWN", week: null, source: "unavailable" };
  }

  if (["pre_draft", "preseason", "offseason"].includes(league.status ?? "")) {
    return { season, phase: "PRESEASON", week: null, source: "sleeper-league" };
  }

  const week = Number(league.settings?.leg);
  if (!Number.isInteger(week) || week < 1) {
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

export interface CurrentSleeperMatchup extends SleeperMatchup {
  readonly custom_points?: number | null;
  readonly players?: readonly string[];
  readonly starters?: readonly string[];
  readonly players_points?: Readonly<Record<string, number>>;
}

export interface CurrentSleeperRoster {
  readonly roster_id: number;
  readonly owner_id: string;
}

export function buildCurrentSeasonMatchups(
  matchups: readonly CurrentSleeperMatchup[] | null | undefined,
  rosters: readonly CurrentSleeperRoster[] | null | undefined,
  week: number,
): readonly HistoricalMatchup[] {
  if (!matchups?.length || !rosters?.length) return [];
  const ownerByRoster = new Map(
    rosters.flatMap((roster) => {
      const owner = getLccOwnerBySleeperUserId(roster.owner_id);
      return owner ? [[roster.roster_id, owner.id] as const] : [];
    }),
  );
  const grouped = new Map<number, CurrentSleeperMatchup[]>();
  for (const entry of matchups) {
    if (typeof entry.matchup_id !== "number") continue;
    grouped.set(entry.matchup_id, [...(grouped.get(entry.matchup_id) ?? []), entry]);
  }

  return [...grouped.values()].flatMap((entries) => {
    if (entries.length !== 2) return [];
    const [entryA, entryB] = entries;
    const ownerAId = ownerByRoster.get(entryA.roster_id);
    const ownerBId = ownerByRoster.get(entryB.roster_id);
    const ownerAScore = scoreFor(entryA);
    const ownerBScore = scoreFor(entryB);
    if (!ownerAId || !ownerBId || ownerAScore === null || ownerBScore === null || (ownerAScore === 0 && ownerBScore === 0)) return [];
    const winnerOwnerId = ownerAScore === ownerBScore ? null : ownerAScore > ownerBScore ? ownerAId : ownerBId;
    return [{
      season: LCC_CURRENT_SEASON,
      week,
      type: week <= 14 ? "regularSeason" : "playoff",
      ownerAId,
      ownerBId,
      ownerAScore,
      ownerBScore,
      winnerOwnerId,
      loserOwnerId: winnerOwnerId === null ? null : winnerOwnerId === ownerAId ? ownerBId : ownerAId,
      ownerAStarters: lineupFor(entryA, entryA.starters ?? []),
      ownerBStarters: lineupFor(entryB, entryB.starters ?? []),
      ownerABench: lineupFor(entryA, (entryA.players ?? []).filter((player) => !(entryA.starters ?? []).includes(player))),
      ownerBBench: lineupFor(entryB, (entryB.players ?? []).filter((player) => !(entryB.starters ?? []).includes(player))),
      ownerABenchDataAvailable: Array.isArray(entryA.players),
      ownerBBenchDataAvailable: Array.isArray(entryB.players),
      notes: ["Loaded from the current Sleeper matchup runtime."],
    } satisfies HistoricalMatchup];
  });
}

export async function loadCurrentSeasonMatchups(week: number): Promise<readonly HistoricalMatchup[]> {
  try {
    const [matchups, rosters] = await Promise.all([
      getMatchupsForWeek(week, LCC_CURRENT_LEAGUE_ID),
      getLeagueRosters(LCC_CURRENT_LEAGUE_ID),
    ]);
    return buildCurrentSeasonMatchups(matchups, rosters, week);
  } catch {
    return [];
  }
}

function scoreFor(entry: CurrentSleeperMatchup): number | null {
  if (typeof entry.custom_points === "number") return entry.custom_points;
  return typeof entry.points === "number" ? entry.points : null;
}

function lineupFor(entry: CurrentSleeperMatchup, playerIds: readonly string[]): HistoricalLineupPlayer[] {
  const points = entry.players_points ?? {};
  return playerIds.filter((id) => id && id !== "0").map((id) => {
    const player = resolvePlayer(id);
    return { playerId: id, name: player.name, position: player.position, nflTeam: player.team, points: typeof points[id] === "number" ? points[id] : null, imageUrl: player.imageUrl ?? "", isDefense: player.isDefense };
  });
}

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
    ownerName: getLccOwnerBySleeperUserId(roster.owner_id)?.managerPage.sleeperName ?? member.displayName,
    ownerDisplayName: member.displayName,
    opponentOwnerId: opponent?.id ?? null,
    opponentName: opponent?.managerPage.sleeperName ?? null,
    opponentDisplayName: opponent?.displayName ?? null,
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
    ownerDisplayName: member?.displayName ?? null, opponentOwnerId: null, opponentName: null,
    opponentDisplayName: null, ownerScore: null, opponentScore: null, href: "/matchups",
  };
}
