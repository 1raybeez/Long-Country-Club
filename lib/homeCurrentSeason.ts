import { getLeagueRosters, getMatchupsForWeek } from "./sleeper.ts";
import { getLccOwnerById, getLccOwnerBySleeperUserId } from "./lccOwners.ts";
import { LCC_CURRENT_LEAGUE_ID, LCC_CURRENT_SEASON } from "./leagueConstants.ts";
import type { LccMemberIdentity } from "./auth/types.ts";
import { resolvePlayer } from "./history/playerRegistry.ts";
import type { HistoricalLineupPlayer, HistoricalMatchup } from "./history/matchups.ts";
import { resolveLccSeasonWeekState, type LccSeasonWeekState } from "./weekState.ts";
import type { MatchupStatus } from "./matchupStatus.ts";

export type HomeSeasonPhase = "PRESEASON" | "REGULAR_SEASON" | "POSTSEASON" | "SEASON_COMPLETE" | "UNKNOWN";

export interface HomeCurrentWeekState {
  readonly season: number;
  readonly phase: HomeSeasonPhase;
  readonly week: number | null;
  readonly source: "sleeper-league" | "unavailable";
  readonly state: LccSeasonWeekState["state"];
  readonly latestCompletedWeek: number | null;
  readonly nextWeek: number | null;
  readonly safeCompletedWeek: number | null;
  readonly playoffWeekStart: number | null;
}

export interface HomeMatchupView {
  readonly state: "current" | "scheduled" | "complete" | "unavailable";
  readonly currentStatus?: MatchupStatus;
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
  readonly settings?: { readonly leg?: number | null; readonly last_scored_leg?: number | null; readonly playoff_week_start?: number | null } | null;
}

export function resolveHomeCurrentWeek(
  league: TrustedSleeperLeagueState | null | undefined,
  season = LCC_CURRENT_SEASON
): HomeCurrentWeekState {
  const state = resolveLccSeasonWeekState(league, season);
  const phase: HomeSeasonPhase = state.state === "PRESEASON" ? "PRESEASON" : state.state === "SEASON_COMPLETE" ? "SEASON_COMPLETE" : state.state === "UNKNOWN" ? "UNKNOWN" : state.playoffWeekStart && (state.activeWeek ?? 0) >= state.playoffWeekStart ? "POSTSEASON" : "REGULAR_SEASON";
  return { season, phase, week: state.activeWeek, source: state.source, state: state.state, latestCompletedWeek: state.latestCompletedWeek, nextWeek: state.nextWeek, safeCompletedWeek: state.safeCompletedWeek, playoffWeekStart: state.playoffWeekStart };
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
    if (!ownerAId || !ownerBId) return [];
    return [{
      season: LCC_CURRENT_SEASON,
      week,
      type: week <= 14 ? "regularSeason" : "playoff",
      ownerAId,
      ownerBId,
      ownerAScore,
      ownerBScore,
      winnerOwnerId: null,
      loserOwnerId: null,
      ownerAStarters: lineupFor(entryA, entryA.starters ?? []),
      ownerBStarters: lineupFor(entryB, entryB.starters ?? []),
      ownerABench: lineupFor(entryA, (entryA.players ?? []).filter((player) => !(entryA.starters ?? []).includes(player))),
      ownerBBench: lineupFor(entryB, (entryB.players ?? []).filter((player) => !(entryB.starters ?? []).includes(player))),
      ownerABenchDataAvailable: Array.isArray(entryA.players),
      ownerBBenchDataAvailable: Array.isArray(entryB.players),
      notes: ["Loaded from the current Sleeper matchup runtime."],
      currentStatus: currentMatchupStatus(ownerAScore, ownerBScore),
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

export function applyAuthoritativeCurrentWeekFinality(
  matchups: readonly HistoricalMatchup[],
  state: Pick<HomeCurrentWeekState, "week" | "safeCompletedWeek">,
): readonly HistoricalMatchup[] {
  if (
    state.week === null ||
    state.safeCompletedWeek === null ||
    state.week > state.safeCompletedWeek
  ) {
    return matchups;
  }

  return matchups.map((matchup) => ({
    ...matchup,
    currentStatus: "FINAL",
  }));
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
    currentStatus: currentMatchupStatus(ownerScore, opponentScore),
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
    const { loadCurrentWeekSnapshot } = await import("./currentWeekSnapshot.ts");
    const snapshot = await loadCurrentWeekSnapshot();
    const matchup = buildHomeMatchupViewFromCurrentMatchups(snapshot.matchups, member, snapshot.week);
    return { week: snapshot.state, matchup: snapshot.state.safeCompletedWeek !== null && snapshot.week !== null && snapshot.week <= snapshot.state.safeCompletedWeek ? { ...matchup, state: matchup.state === "unavailable" ? "unavailable" : "complete" } : matchup };
  } catch {
    return {
      week: { season: LCC_CURRENT_SEASON, phase: "UNKNOWN", week: null, source: "unavailable", state: "UNKNOWN", latestCompletedWeek: null, nextWeek: null, safeCompletedWeek: null, playoffWeekStart: null },
      matchup: unavailableMatchup(null, member),
    };
  }
}

export function buildHomeMatchupViewFromCurrentMatchups(
  matchups: readonly HistoricalMatchup[] | null | undefined,
  member: LccMemberIdentity | null,
  week: number | null,
): HomeMatchupView {
  if (!member || week === null) return unavailableMatchup(week, member);
  const matchup = matchups?.find((candidate) => candidate.ownerAId === member.ownerId || candidate.ownerBId === member.ownerId);
  if (!matchup) return unavailableMatchup(week, member);
  const ownerA = getLccOwnerById(member.ownerId);
  const owner = matchup.ownerAId === member.ownerId ? getLccOwnerByIdSafe(matchup.ownerAId) : getLccOwnerByIdSafe(matchup.ownerBId);
  const opponent = matchup.ownerAId === member.ownerId ? getLccOwnerByIdSafe(matchup.ownerBId) : getLccOwnerByIdSafe(matchup.ownerAId);
  const ownerScore = matchup.ownerAId === member.ownerId ? matchup.ownerAScore : matchup.ownerBScore;
  const opponentScore = matchup.ownerAId === member.ownerId ? matchup.ownerBScore : matchup.ownerAScore;
  return { state: "current", currentStatus: matchup.currentStatus, week, ownerId: member.ownerId, ownerName: owner?.managerPage.sleeperName ?? member.teamName, ownerDisplayName: ownerA?.displayName ?? member.displayName, opponentOwnerId: opponent?.id ?? null, opponentName: opponent?.managerPage.sleeperName ?? null, opponentDisplayName: opponent?.displayName ?? null, ownerScore, opponentScore, href: "/matchups" };
}

function currentMatchupStatus(ownerScore: number | null, opponentScore: number | null): MatchupStatus {
  return (ownerScore === null && opponentScore === null) || (ownerScore === 0 && opponentScore === 0)
    ? "UPCOMING"
    : "UNKNOWN";
}

function getLccOwnerByIdSafe(ownerId: string) {
  return getLccOwnerById(ownerId);
}

function unavailableMatchup(week: number | null, member: LccMemberIdentity | null): HomeMatchupView {
  return {
    state: "unavailable", week, ownerId: member?.ownerId ?? null, ownerName: member?.displayName ?? null,
    ownerDisplayName: member?.displayName ?? null, opponentOwnerId: null, opponentName: null,
    opponentDisplayName: null, ownerScore: null, opponentScore: null, href: "/matchups",
  };
}
