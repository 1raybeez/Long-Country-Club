import { getLeagueRosters, getPlayoffBrackets } from "../sleeper";
import { getLccOwnerBySleeperUserId } from "../lccOwners";
import type { PostseasonBracketType, PostseasonContext, PostseasonSnapshot } from "./types";

export interface SleeperBracketSource {
  readonly r: number;
  readonly m?: number | null;
  readonly p?: number | null;
  readonly t1?: number | null;
  readonly t2?: number | null;
  readonly w?: number | null;
  readonly l?: number | null;
  readonly t1_from?: { readonly w?: number | null; readonly l?: number | null } | null;
  readonly t2_from?: { readonly w?: number | null; readonly l?: number | null } | null;
}

export interface PostseasonAdapterInput {
  readonly season: number;
  readonly activeWeek: number | null;
  readonly playoffWeekStart: number;
  readonly winners: readonly SleeperBracketSource[] | null;
  readonly losers: readonly SleeperBracketSource[] | null;
  readonly rosters: readonly { readonly roster_id: number; readonly owner_id?: string | null }[];
}

export function buildPostseasonSnapshot(input: PostseasonAdapterInput): PostseasonSnapshot {
  const allRows = [
    ...(input.winners ?? []).map((row) => ({ row, bracketType: "winners" as const })),
    ...(input.losers ?? []).map((row) => ({ row, bracketType: "losers" as const })),
  ];
  const maxWinnerRound = Math.max(0, ...(input.winners ?? []).map((row) => row.r));
  const ownerByRoster = new Map(
    input.rosters.flatMap((roster) => {
      const owner = roster.owner_id ? getLccOwnerBySleeperUserId(roster.owner_id) : null;
      return owner ? [[roster.roster_id, owner.id] as const] : [];
    }),
  );
  const contexts: PostseasonContext[] = allRows.flatMap(({ row, bracketType }): PostseasonContext[] => {
    const placementTarget = placementFor(row.p);
    const resolvedType: PostseasonBracketType = placementTarget ? "placement" : bracketType;
    const roundLabel = labelFor({ bracketType, round: row.r, maxWinnerRound, placementTarget });
    const rosterIds = [row.t1 ?? null, row.t2 ?? null];
    if (rosterIds.every((rosterId) => rosterId === null) && hasUnresolvedSource(row)) {
      return [{
        season: input.season,
        activeWeek: input.activeWeek,
        playoffWeekStart: input.playoffWeekStart,
        roundNumber: row.r,
        roundLabel,
        bracketType: resolvedType,
        seed: null,
        rosterId: null,
        ownerId: null,
        opponentRosterId: null,
        opponentOwnerId: null,
        matchupId: typeof row.m === "number" ? row.m : null,
        isBye: false,
        isChampionship: bracketType === "winners" && row.p === 1,
        isSemifinal: bracketType === "winners" && row.r === maxWinnerRound - 1,
        isPlacementGame: Boolean(placementTarget) || bracketType === "losers",
        placementTarget,
        nextMatchupId: null,
        sourceStatus: "unresolved",
      } satisfies PostseasonContext];
    }
    return rosterIds.flatMap((rosterId, index) => {
      if (rosterId === null) return [];
      const opponentRosterId = rosterIds[index === 0 ? 1 : 0];
      const ownerId = ownerByRoster.get(rosterId) ?? null;
      const opponentOwnerId = opponentRosterId === null ? null : ownerByRoster.get(opponentRosterId) ?? null;
      const isChampionship = bracketType === "winners" && row.p === 1;
      const isPlacementGame = Boolean(placementTarget) || bracketType === "losers";
      return [{
        season: input.season,
        activeWeek: input.activeWeek,
        playoffWeekStart: input.playoffWeekStart,
        roundNumber: row.r,
        roundLabel,
        bracketType: resolvedType,
        seed: null,
        rosterId,
        ownerId,
        opponentRosterId,
        opponentOwnerId,
        matchupId: typeof row.m === "number" ? row.m : null,
        isBye: opponentRosterId === null,
        isChampionship,
        isSemifinal: bracketType === "winners" && row.r === maxWinnerRound - 1 && !isChampionship,
        isPlacementGame,
        placementTarget,
        nextMatchupId: nextMatchupId(row, input.winners, input.losers),
        sourceStatus: opponentRosterId === null && hasUnresolvedSource(row) ? "unresolved" : "complete",
      } satisfies PostseasonContext];
    });
  });
  return {
    season: input.season,
    activeWeek: input.activeWeek,
    playoffWeekStart: input.playoffWeekStart,
    sourceStatus: contexts.some((context) => context.sourceStatus === "unresolved") ? "unresolved" : allRows.length ? "complete" : "unresolved",
    contexts,
  };
}

export async function loadPostseasonSnapshot(
  season: number,
  activeWeek: number | null,
  playoffWeekStart: number,
  leagueId: string,
): Promise<PostseasonSnapshot> {
  try {
    const [brackets, rosters] = await Promise.all([getPlayoffBrackets(leagueId), getLeagueRosters(leagueId)]);
    return buildPostseasonSnapshot({ season, activeWeek, playoffWeekStart, winners: brackets.winners, losers: brackets.losers, rosters });
  } catch {
    return unavailablePostseasonSnapshot(season, activeWeek, playoffWeekStart);
  }
}

export function unavailablePostseasonSnapshot(season: number, activeWeek: number | null, playoffWeekStart: number): PostseasonSnapshot {
  return { season, activeWeek, playoffWeekStart, sourceStatus: "unavailable", contexts: [] };
}

function placementFor(value: number | null | undefined): PostseasonContext["placementTarget"] {
  if (value === 1) return "championship";
  if (value === 3) return "third-place";
  if (value === 5) return "fifth-place";
  return null;
}

function labelFor(input: { bracketType: "winners" | "losers"; round: number; maxWinnerRound: number; placementTarget: PostseasonContext["placementTarget"] }): string {
  if (input.placementTarget === "championship") return "Championship";
  if (input.placementTarget) return "Placement Game";
  if (input.bracketType === "losers") return input.round === input.maxWinnerRound ? "Placement Game" : "Consolation Round";
  if (input.round === 1 && input.maxWinnerRound >= 3) return "First Round";
  if (input.round === input.maxWinnerRound - 1 && input.maxWinnerRound >= 3) return "Semifinals";
  return `Playoff Round ${input.round}`;
}

function hasUnresolvedSource(row: SleeperBracketSource): boolean {
  return Boolean(row.t1_from || row.t2_from);
}

function nextMatchupId(row: SleeperBracketSource, winners: readonly SleeperBracketSource[] | null, losers: readonly SleeperBracketSource[] | null): number | null {
  const candidates = [...(winners ?? []), ...(losers ?? [])];
  const winnerTarget = candidates.find((candidate) => candidate.t1_from?.w === row.m || candidate.t2_from?.w === row.m);
  const loserTarget = candidates.find((candidate) => candidate.t1_from?.l === row.m || candidate.t2_from?.l === row.m);
  const target = winnerTarget ?? loserTarget;
  return typeof target?.m === "number" ? target.m : null;
}

export function getCurrentPostseasonContext(snapshot: PostseasonSnapshot | null | undefined, ownerId: string): PostseasonContext | null {
  if (!snapshot) return null;
  const round = snapshot.activeWeek === null ? null : snapshot.activeWeek - snapshot.playoffWeekStart + 1;
  return snapshot.contexts.find((context) => context.ownerId === ownerId && (round === null || context.roundNumber === round)) ?? null;
}
