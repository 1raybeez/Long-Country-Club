import { LCC_CURRENT_SEASON } from "../leagueConstants";
import {
  getPlayerPerformanceBefore,
  type HistoricalPlayerPerformance,
} from "./playerPerformance";
import {
  getCurrentRosterSnapshot,
  getRosterSnapshotBefore,
  getSeasonRosterSnapshot,
  type HistoricalRosterSnapshot,
} from "./rosterSnapshots";
import { getPlayerById, type HistoricalPlayerMetadata } from "./playerRegistry";

export type ExpectedLineupBoundary = {
  readonly season: number;
  readonly week: number;
};

export type ExpectedLineupSlotType = "QB" | "RB" | "WR" | "TE" | "FLEX" | "K" | "DST";

export type ExpectedLineupSelectionReason =
  | "onlyEligiblePlayer"
  | "previousRosterAppearanceStarter"
  | "recentFrequentStarter"
  | "recentStarterUsage"
  | "strongestRecentProduction"
  | "strongestPriorSeasonBaseline"
  | "fallbackMissingHistory";

export type ExpectedLineupCandidate = {
  readonly playerId: string;
  readonly metadata: HistoricalPlayerMetadata | null;
  readonly position: string | null;
  readonly historicalSampleAvailable: boolean;
  readonly baselineSeason: number | null;
  readonly baselineAverage: number | null;
  readonly baselineAppearances: number;
  readonly recentAverage: number | null;
  readonly recentRosterAppearances: number;
  readonly recentStarterAppearances: number;
  readonly recentStarterRate: number | null;
  readonly previousRosterAppearanceStarter: boolean;
};

export type ExpectedLineupSlot = {
  readonly slot: string;
  readonly slotType: ExpectedLineupSlotType;
  readonly eligiblePositions: readonly string[];
  readonly player: ExpectedLineupCandidate | null;
  readonly selectionReason: ExpectedLineupSelectionReason | "unresolvedSlot";
};

export type ExpectedLineupCoverage = {
  readonly totalSlots: number;
  readonly filledSlots: number;
  readonly unresolvedSlots: number;
  readonly selectedWithHistoricalSample: number;
  readonly selectedWithStrongStarterUsage: number;
  readonly selectedViaFallback: number;
  readonly category: "full" | "partial" | "none";
};

export type ExpectedLineup = {
  readonly ownerId: string;
  readonly season: number;
  readonly week: number;
  readonly rosterSnapshot: HistoricalRosterSnapshot;
  readonly performanceCutoff: ExpectedLineupBoundary;
  readonly slots: readonly ExpectedLineupSlot[];
  readonly selectedPlayers: readonly ExpectedLineupCandidate[];
  readonly coverage: ExpectedLineupCoverage;
  readonly rosterPlayerCount: number;
  readonly eligiblePlayerCount: number;
  readonly unavailablePlayerIds: readonly string[];
  readonly unresolvedPlayerIds: readonly string[];
};

const FIXED_SLOTS: readonly {
  slot: string;
  slotType: ExpectedLineupSlotType;
  eligiblePositions: readonly string[];
}[] = [
  { slot: "QB1", slotType: "QB", eligiblePositions: ["QB"] },
  { slot: "RB1", slotType: "RB", eligiblePositions: ["RB"] },
  { slot: "RB2", slotType: "RB", eligiblePositions: ["RB"] },
  { slot: "WR1", slotType: "WR", eligiblePositions: ["WR"] },
  { slot: "WR2", slotType: "WR", eligiblePositions: ["WR"] },
  { slot: "WR3", slotType: "WR", eligiblePositions: ["WR"] },
  { slot: "TE1", slotType: "TE", eligiblePositions: ["TE"] },
  { slot: "K1", slotType: "K", eligiblePositions: ["K"] },
  { slot: "DST1", slotType: "DST", eligiblePositions: ["DST"] },
];

const FLEX_SLOTS: readonly {
  slot: string;
  slotType: "FLEX";
  eligiblePositions: readonly string[];
}[] = [
  { slot: "FLEX1", slotType: "FLEX", eligiblePositions: ["RB", "WR", "TE"] },
  { slot: "FLEX2", slotType: "FLEX", eligiblePositions: ["RB", "WR", "TE"] },
];

const RECENT_ROSTER_APPEARANCE_WINDOW = 5;
const expectedLineupCache = new Map<string, ExpectedLineup | null>();

export function getExpectedLineupBefore({
  ownerId,
  season,
  week,
}: ExpectedLineupBoundary & { readonly ownerId: string }): ExpectedLineup | null {
  const cacheKey = `${ownerId}|${season}|${week}`;
  if (expectedLineupCache.has(cacheKey)) {
    return expectedLineupCache.get(cacheKey) ?? null;
  }

  const rosterSnapshot = week === 1
    ? getSeasonRosterSnapshot({ ownerId, season })
    : getRosterSnapshotBefore({ ownerId, season, week });

  if (!rosterSnapshot) {
    expectedLineupCache.set(cacheKey, null);
    return null;
  }

  const lineup = buildExpectedLineup({
    ownerId,
    season,
    week,
    rosterSnapshot,
    performanceCutoff: { season, week },
  });
  expectedLineupCache.set(cacheKey, lineup);
  return lineup;
}

export function getCurrentExpectedLineup(ownerId: string): ExpectedLineup | null {
  const cacheKey = `current|${ownerId}|${LCC_CURRENT_SEASON}`;
  if (expectedLineupCache.has(cacheKey)) {
    return expectedLineupCache.get(cacheKey) ?? null;
  }

  const rosterSnapshot = getCurrentRosterSnapshot(ownerId);

  if (!rosterSnapshot) {
    expectedLineupCache.set(cacheKey, null);
    return null;
  }

  const lineup = buildExpectedLineup({
    ownerId,
    season: LCC_CURRENT_SEASON,
    week: 1,
    rosterSnapshot,
    performanceCutoff: { season: LCC_CURRENT_SEASON, week: 1 },
  });
  expectedLineupCache.set(cacheKey, lineup);
  return lineup;
}

function buildExpectedLineup({
  ownerId,
  season,
  week,
  rosterSnapshot,
  performanceCutoff,
}: {
  ownerId: string;
  season: number;
  week: number;
  rosterSnapshot: HistoricalRosterSnapshot;
  performanceCutoff: ExpectedLineupBoundary;
}): ExpectedLineup {
  const unavailablePlayerIds = Array.from(
    new Set([
      ...(rosterSnapshot.reserveIds ?? []),
      ...(rosterSnapshot.taxiIds ?? []),
    ])
  );
  const unavailable = new Set(unavailablePlayerIds);
  const eligibleIds = rosterSnapshot.playerIds.filter(
    (playerId) => !unavailable.has(playerId)
  );
  const candidates = eligibleIds.map((playerId) =>
    buildCandidate(playerId, ownerId, performanceCutoff)
  );
  const unresolvedPlayerIds = candidates
    .filter((candidate) => candidate.metadata === null)
    .map((candidate) => candidate.playerId);
  const selectedIds = new Set<string>();
  const slots: ExpectedLineupSlot[] = [];

  for (const slotDefinition of [...FIXED_SLOTS, ...FLEX_SLOTS]) {
    const eligibleCandidates = candidates.filter(
      (candidate) =>
        !selectedIds.has(candidate.playerId) &&
        slotDefinition.eligiblePositions.includes(candidate.position ?? "")
    );
    const selected = eligibleCandidates.sort(compareCandidates)[0] ?? null;

    if (selected) {
      selectedIds.add(selected.playerId);
    }

    slots.push({
      ...slotDefinition,
      player: selected,
      selectionReason: selected
        ? getSelectionReason(selected, eligibleCandidates.length)
        : "unresolvedSlot",
    });
  }

  const selectedPlayers = slots.flatMap((slot) =>
    slot.player ? [slot.player] : []
  );
  const unresolvedSlots = slots.filter((slot) => !slot.player).length;
  const selectedWithHistoricalSample = selectedPlayers.filter(
    (player) => player.historicalSampleAvailable
  ).length;
  const selectedWithStrongStarterUsage = selectedPlayers.filter(
    (player) => player.recentStarterAppearances >= 2
  ).length;
  const selectedViaFallback = slots.filter(
    (slot) => slot.selectionReason === "fallbackMissingHistory"
  ).length;

  return {
    ownerId,
    season,
    week,
    rosterSnapshot,
    performanceCutoff,
    slots,
    selectedPlayers,
    coverage: {
      totalSlots: slots.length,
      filledSlots: selectedPlayers.length,
      unresolvedSlots,
      selectedWithHistoricalSample,
      selectedWithStrongStarterUsage,
      selectedViaFallback,
      category:
        selectedPlayers.length === 0
          ? "none"
          : unresolvedSlots === 0
            ? "full"
            : "partial",
    },
    rosterPlayerCount: rosterSnapshot.playerIds.length,
    eligiblePlayerCount: eligibleIds.length,
    unavailablePlayerIds,
    unresolvedPlayerIds,
  };
}

function buildCandidate(
  playerId: string,
  ownerId: string,
  cutoff: ExpectedLineupBoundary
): ExpectedLineupCandidate {
  const metadata = getPlayerById(playerId);
  const performances = getPlayerPerformanceBefore({
    playerId,
    season: cutoff.season,
    week: cutoff.week,
  }).filter((performance) => performance.ownerId === ownerId);
  const recentPerformances = performances.slice(-RECENT_ROSTER_APPEARANCE_WINDOW);
  const baselineSeason = getLatestBaselineSeason(playerId, cutoff.season);
  const baseline = baselineSeason === null
    ? null
    : getPlayerPerformanceBefore({
        playerId,
        season: baselineSeason + 1,
        week: 1,
      }).filter((performance) => performance.season === baselineSeason);
  const baselinePoints = scoredPoints(baseline ?? []);
  const recentPoints = scoredPoints(recentPerformances);
  const recentStarterAppearances = recentPerformances.filter(
    (performance) => performance.wasStarter
  ).length;

  return {
    playerId,
    metadata,
    position: toExpectedPosition(metadata?.position),
    historicalSampleAvailable: baselinePoints.length > 0,
    baselineSeason,
    baselineAverage: baselinePoints.length
      ? round(sum(baselinePoints) / baselinePoints.length)
      : null,
    baselineAppearances: baseline?.length ?? 0,
    recentAverage: recentPoints.length
      ? round(sum(recentPoints) / recentPoints.length)
      : null,
    recentRosterAppearances: recentPerformances.length,
    recentStarterAppearances,
    recentStarterRate: recentPerformances.length
      ? round(recentStarterAppearances / recentPerformances.length)
      : null,
    previousRosterAppearanceStarter: recentPerformances.at(-1)?.wasStarter ?? false,
  };
}

function getLatestBaselineSeason(playerId: string, beforeSeason: number): number | null {
  const seasons = new Set(
    getPlayerPerformanceBefore({ playerId, season: beforeSeason, week: 1 })
      .map((performance) => performance.season)
  );

  return Array.from(seasons).sort((a, b) => b - a)[0] ?? null;
}

function compareCandidates(a: ExpectedLineupCandidate, b: ExpectedLineupCandidate) {
  return (
    Number(b.previousRosterAppearanceStarter) - Number(a.previousRosterAppearanceStarter) ||
    b.recentStarterAppearances - a.recentStarterAppearances ||
    (b.recentStarterRate ?? -1) - (a.recentStarterRate ?? -1) ||
    (b.recentAverage ?? -1) - (a.recentAverage ?? -1) ||
    (b.baselineAverage ?? -1) - (a.baselineAverage ?? -1) ||
    b.baselineAppearances - a.baselineAppearances ||
    a.playerId.localeCompare(b.playerId)
  );
}

function getSelectionReason(
  candidate: ExpectedLineupCandidate,
  eligibleCount: number
): ExpectedLineupSelectionReason {
  if (eligibleCount === 1) return "onlyEligiblePlayer";
  if (candidate.previousRosterAppearanceStarter) return "previousRosterAppearanceStarter";
  if (candidate.recentStarterAppearances >= 2) return "recentFrequentStarter";
  if (candidate.recentStarterAppearances > 0) return "recentStarterUsage";
  if (candidate.recentAverage !== null) return "strongestRecentProduction";
  if (candidate.baselineAverage !== null) return "strongestPriorSeasonBaseline";
  return "fallbackMissingHistory";
}

function scoredPoints(performances: readonly HistoricalPlayerPerformance[]) {
  return performances.flatMap((performance) =>
    performance.fantasyPoints === null ? [] : [performance.fantasyPoints]
  );
}

function toExpectedPosition(position: string | null | undefined) {
  return position === "QB" ||
    position === "RB" ||
    position === "WR" ||
    position === "TE" ||
    position === "K" ||
    position === "DST"
    ? position
    : null;
}

function sum(values: readonly number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function round(value: number) {
  return Number(value.toFixed(2));
}
