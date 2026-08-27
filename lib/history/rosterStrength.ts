import { LCC_CURRENT_SEASON } from "../leagueConstants.ts";
import {
  getPlayerPerformanceBefore,
  getPlayerRollingPerformanceBefore,
  getPlayerSeasonPerformance,
} from "./playerPerformance.ts";
import {
  getCurrentRosterSnapshot,
  getRosterSnapshot,
  getRosterSnapshotBefore,
  type HistoricalRosterSnapshot,
} from "./rosterSnapshots.ts";
import { getPlayerById, type HistoricalPlayerMetadata } from "./playerRegistry.ts";

export type RosterStrengthBoundary = {
  readonly season: number;
  readonly week: number;
};

export type RosterStrengthEvaluation =
  | "atWeekRosterBeforePerformance"
  | "beforeWeek"
  | "currentPreseason";

export type RosterStrengthPlayer = {
  readonly playerId: string;
  readonly metadata: HistoricalPlayerMetadata | null;
  readonly position: string | null;
  readonly baselineSeason: number | null;
  readonly baselineAverage: number | null;
  readonly baselineTotal: number | null;
  readonly baselineAppearances: number;
  readonly recentAverage: number | null;
  readonly recentAppearances: number;
};

export type RosterPositionGroup = {
  readonly position: RosterStrengthPosition;
  readonly requiredSlots: number;
  readonly flexEligible: boolean;
  readonly playerCount: number;
  readonly sampledPlayerCount: number;
  readonly noHistoricalSampleCount: number;
  readonly depthCount: number;
  readonly players: readonly RosterStrengthPlayer[];
  readonly topNPlayers: readonly RosterStrengthPlayer[];
  readonly topNBaselineAverageTotal: number;
  readonly sampledBaselineAverage: number | null;
  readonly coverage: "full" | "partial" | "none";
};

export type RosterStrengthPosition =
  | "QB"
  | "RB"
  | "WR"
  | "TE"
  | "DST"
  | "K";

export type RosterStrength = {
  readonly ownerId: string;
  readonly season: number;
  readonly week: number | null;
  readonly evaluation: RosterStrengthEvaluation;
  readonly rosterSnapshot: HistoricalRosterSnapshot;
  readonly performanceCutoff: RosterStrengthBoundary | null;
  readonly flexSlots: number;
  readonly positions: readonly RosterPositionGroup[];
  readonly unresolvedPlayerIds: readonly string[];
  readonly playerCount: number;
};

export type RosterStrengthComparison = {
  readonly ownerA: RosterStrength;
  readonly ownerB: RosterStrength;
  readonly positions: readonly RosterPositionComparison[];
};

export type RosterPositionComparison = {
  readonly position: RosterStrengthPosition;
  readonly ownerAValue: number | null;
  readonly ownerBValue: number | null;
  readonly ownerADelta: number | null;
  readonly ownerBDelta: number | null;
  readonly edge: "ownerA" | "ownerB" | "tie" | "insufficientData";
};

const POSITION_RULES: readonly {
  position: RosterStrengthPosition;
  requiredSlots: number;
  flexEligible: boolean;
}[] = [
  { position: "QB", requiredSlots: 1, flexEligible: false },
  { position: "RB", requiredSlots: 2, flexEligible: true },
  { position: "WR", requiredSlots: 3, flexEligible: true },
  { position: "TE", requiredSlots: 1, flexEligible: true },
  { position: "DST", requiredSlots: 1, flexEligible: false },
  { position: "K", requiredSlots: 1, flexEligible: false },
];

const FLEX_SLOTS = 2;
const RECENT_APPEARANCE_WINDOW = 3;

export function getRosterStrength({
  ownerId,
  season,
  week,
}: RosterStrengthBoundary & { readonly ownerId: string }): RosterStrength | null {
  const snapshot = getRosterSnapshot({ ownerId, season, week });

  if (!snapshot) {
    return null;
  }

  return buildRosterStrength({
    ownerId,
    season,
    week,
    snapshot,
    evaluation: "atWeekRosterBeforePerformance",
    performanceCutoff: { season, week },
  });
}

export function getRosterStrengthBefore({
  ownerId,
  season,
  week,
}: RosterStrengthBoundary & { readonly ownerId: string }): RosterStrength | null {
  const snapshot = getRosterSnapshotBefore({ ownerId, season, week });

  if (!snapshot) {
    return null;
  }

  return buildRosterStrength({
    ownerId,
    season,
    week,
    snapshot,
    evaluation: "beforeWeek",
    performanceCutoff: { season, week },
  });
}

export function getCurrentRosterStrength(
  ownerId: string
): RosterStrength | null {
  const snapshot = getCurrentRosterSnapshot(ownerId);

  if (!snapshot) {
    return null;
  }

  return buildRosterStrength({
    ownerId,
    season: LCC_CURRENT_SEASON,
    week: null,
    snapshot,
    evaluation: "currentPreseason",
    performanceCutoff: { season: LCC_CURRENT_SEASON, week: 1 },
  });
}

/** Evaluate an in-memory hypothetical roster with the canonical roster-strength rules. */
export function getRosterStrengthForRoster({
  ownerId,
  rosterSnapshot,
}: {
  readonly ownerId: string;
  readonly rosterSnapshot: HistoricalRosterSnapshot;
}): RosterStrength {
  return buildRosterStrength({
    ownerId,
    season: LCC_CURRENT_SEASON,
    week: null,
    snapshot: rosterSnapshot,
    evaluation: "currentPreseason",
    performanceCutoff: { season: LCC_CURRENT_SEASON, week: 1 },
  });
}

export function compareRosterStrength({
  ownerAId,
  ownerBId,
  season,
  week,
  mode = "beforeWeek",
}: RosterStrengthBoundary & {
  readonly ownerAId: string;
  readonly ownerBId: string;
  readonly mode?: "atWeek" | "beforeWeek";
}): RosterStrengthComparison | null {
  const ownerA = mode === "beforeWeek"
    ? getRosterStrengthBefore({ ownerId: ownerAId, season, week })
    : getRosterStrength({ ownerId: ownerAId, season, week });
  const ownerB = mode === "beforeWeek"
    ? getRosterStrengthBefore({ ownerId: ownerBId, season, week })
    : getRosterStrength({ ownerId: ownerBId, season, week });

  if (!ownerA || !ownerB) {
    return null;
  }

  return {
    ownerA,
    ownerB,
    positions: POSITION_RULES.map(({ position }) => {
      const ownerAValue = getPositionValue(ownerA, position);
      const ownerBValue = getPositionValue(ownerB, position);

      return {
        position,
        ownerAValue,
        ownerBValue,
        ownerADelta:
          ownerAValue !== null && ownerBValue !== null
            ? round(ownerAValue - ownerBValue)
            : null,
        ownerBDelta:
          ownerAValue !== null && ownerBValue !== null
            ? round(ownerBValue - ownerAValue)
            : null,
        edge:
          ownerAValue === null || ownerBValue === null
            ? "insufficientData"
            : ownerAValue === ownerBValue
              ? "tie"
              : ownerAValue > ownerBValue
                ? "ownerA"
                : "ownerB",
      };
    }),
  };
}

function buildRosterStrength({
  ownerId,
  season,
  week,
  snapshot,
  evaluation,
  performanceCutoff,
}: {
  ownerId: string;
  season: number;
  week: number | null;
  snapshot: HistoricalRosterSnapshot;
  evaluation: RosterStrengthEvaluation;
  performanceCutoff: RosterStrengthBoundary | null;
}): RosterStrength {
  const players = snapshot.playerIds.map((playerId) =>
    buildPlayerStrength(playerId, performanceCutoff)
  );
  const unresolvedPlayerIds = players
    .filter((player) => player.metadata === null)
    .map((player) => player.playerId);

  return {
    ownerId,
    season,
    week,
    evaluation,
    rosterSnapshot: snapshot,
    performanceCutoff,
    flexSlots: FLEX_SLOTS,
    positions: POSITION_RULES.map((rule) =>
      buildPositionGroup(rule, players)
    ),
    unresolvedPlayerIds,
    playerCount: players.length,
  };
}

function buildPlayerStrength(
  playerId: string,
  cutoff: RosterStrengthBoundary | null
): RosterStrengthPlayer {
  const metadata = getPlayerById(playerId);
  const position = toStrengthPosition(metadata?.position);
  const baselineSeason = cutoff
    ? getLatestCompletedSeason(playerId, cutoff.season)
    : null;
  const baseline = baselineSeason === null
    ? null
    : getPlayerSeasonPerformance({ playerId, season: baselineSeason });
  const recent = cutoff
    ? getPlayerRollingPerformanceBefore({
        playerId,
        season: cutoff.season,
        week: cutoff.week,
        window: RECENT_APPEARANCE_WINDOW,
      })
    : null;

  return {
    playerId,
    metadata,
    position,
    baselineSeason,
    baselineAverage: baseline?.averageFantasyPoints ?? null,
    baselineTotal: baseline?.totalFantasyPoints ?? null,
    baselineAppearances: baseline?.rosterAppearances ?? 0,
    recentAverage: recent?.averageFantasyPoints ?? null,
    recentAppearances: recent?.rosterAppearances ?? 0,
  };
}

function buildPositionGroup(
  rule: (typeof POSITION_RULES)[number],
  players: readonly RosterStrengthPlayer[]
): RosterPositionGroup {
  const groupPlayers = players
    .filter((player) => player.position === rule.position)
    .sort(comparePlayers);
  const sampledPlayers = groupPlayers.filter(
    (player) => player.baselineAverage !== null
  );
  const topNPlayers = groupPlayers.slice(0, rule.requiredSlots);
  const topNBaselineAverageTotal = round(
    topNPlayers.reduce(
      (total, player) => total + (player.baselineAverage ?? 0),
      0
    )
  );

  return {
    position: rule.position,
    requiredSlots: rule.requiredSlots,
    flexEligible: rule.flexEligible,
    playerCount: groupPlayers.length,
    sampledPlayerCount: sampledPlayers.length,
    noHistoricalSampleCount: groupPlayers.length - sampledPlayers.length,
    depthCount: Math.max(0, groupPlayers.length - rule.requiredSlots),
    players: groupPlayers,
    topNPlayers,
    topNBaselineAverageTotal,
    sampledBaselineAverage: sampledPlayers.length
      ? round(
          sampledPlayers.reduce(
            (total, player) => total + (player.baselineAverage ?? 0),
            0
          ) / sampledPlayers.length
        )
      : null,
    coverage:
      sampledPlayers.length === 0
        ? "none"
        : sampledPlayers.length === groupPlayers.length
          ? "full"
          : "partial",
  };
}

function getPositionValue(
  strength: RosterStrength,
  position: RosterStrengthPosition
) {
  return strength.positions.find((group) => group.position === position)
    ?.topNBaselineAverageTotal ?? null;
}

function getLatestCompletedSeason(playerId: string, beforeSeason: number) {
  const seasons = Array.from(
    new Set(
      getPlayerPerformanceBefore({
        playerId,
        season: beforeSeason,
        week: 1,
      }).map((performance) => performance.season)
    )
  ).sort((a, b) => b - a);

  return seasons[0] ?? null;
}

function toStrengthPosition(
  position: string | null | undefined
): RosterStrengthPosition | null {
  if (
    position === "QB" ||
    position === "RB" ||
    position === "WR" ||
    position === "TE" ||
    position === "DST" ||
    position === "K"
  ) {
    return position;
  }

  return null;
}

function comparePlayers(
  a: RosterStrengthPlayer,
  b: RosterStrengthPlayer
) {
  if (a.baselineAverage === null && b.baselineAverage !== null) return 1;
  if (a.baselineAverage !== null && b.baselineAverage === null) return -1;
  if (a.baselineAverage !== null && b.baselineAverage !== null) {
    if (b.baselineAverage !== a.baselineAverage) {
      return b.baselineAverage - a.baselineAverage;
    }
  }

  return a.playerId.localeCompare(b.playerId);
}

function round(value: number) {
  return Number(value.toFixed(2));
}
