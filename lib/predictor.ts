import { ACTIVE_LCC_OWNERS } from "./lccOwners";
import { LCC_CURRENT_SEASON } from "./leagueConstants";
import { getOwnerById } from "./ownerRegistry";
import {
  getCurrentMatchupProjection,
} from "./history/matchupProjection";
import { getCurrentRosterSnapshot } from "./history/rosterSnapshots";
import { getCurrentRosterStrength, type RosterStrengthPlayer } from "./history/rosterStrength";
import { getCurrentExpectedLineup } from "./history/expectedLineup";
import { loadDraftEventsBySeason } from "./history/drafts";
import rookieMarketReference from "../data/source/market/dynasty-rookie/2026/snapshots/2026-08-19/provenance.json";
import approvedPreseasonSnapshotReference from "../data/approved/predictor/2026/preseason-team-strength-v1.json";

export const PREDICTOR_MODEL = {
  modelName: "LCC Team Strength Forecast",
  modelVersion: "predictor-preseason-v1",
  season: LCC_CURRENT_SEASON,
  forecastType: "PRESEASON",
  lineupWeight: 0.7,
  depthWeight: 0.2,
  balanceWeight: 0.1,
} as const;

export const PREDICTOR_DEFAULT_DATA_CUTOFF = "2026-08-20T22:17:49.000Z";
export const PREDICTOR_APPROVED_SNAPSHOT_VERSION = "preseason-team-strength-v1";
export const PREDICTOR_APPROVED_SNAPSHOT_PATH = "data/approved/predictor/2026/preseason-team-strength-v1.json";
export const MAX_DEPTH_OPTIONS = 6;
export const ROOKIE_POSITION_MINIMUM_SAMPLE = 3;
export const PREDICTOR_ROOKIE_MARKET_SOURCE = "data/source/market/dynasty-rookie/2026/snapshots/2026-08-19/provenance.json";

export const PREDICTOR_FUTURE_IN_SEASON_CONTRACT = {
  early: { weeks: "1-3", rosterStrength: 0.55, actualScoring: 0.25, recordAndOpponent: 0.1, lineupEfficiency: 0.1 },
  mid: { weeks: "4-8", rosterStrength: 0.35, actualScoring: 0.35, recordAndOpponent: 0.15, lineupEfficiency: 0.15 },
  late: { weeks: "9+", rosterStrength: 0.2, actualScoring: 0.4, recordAndOpponent: 0.2, lineupEfficiency: 0.2 },
  status: "DOCUMENTED_ONLY_NOT_ACTIVE_IN_PRESEASON_V1",
} as const;

const POSITIONS = ["QB", "RB", "WR", "TE", "K", "DST"] as const;
type PredictorPosition = (typeof POSITIONS)[number];
export type PredictorTier = "CONTENDER" | "STRONG" | "IN THE MIX" | "QUESTION MARK";
export type PredictorConfidence = "HIGH" | "MEDIUM" | "LOW";
export type PredictorBaselineSource =
  | "HISTORICAL"
  | "CAREER_FALLBACK"
  | "ROOKIE_MARKET"
  | "UNRESOLVED";

export type PredictorRookieMarketPlayer = {
  readonly playerId: string;
  readonly name: string;
  readonly position: PredictorPosition;
  readonly marketRank: number;
  readonly adpOverall: number;
  readonly sampleSize: number;
  readonly resolutionConfidence: string;
};

export type PredictorPositionStrength = {
  readonly position: PredictorPosition;
  readonly baselineAverage: number | null;
  readonly relativeIndex: number | null;
  readonly sampledPlayerCount: number;
  readonly activePlayerCount: number;
  readonly requiredSlots: number;
  readonly coverage: "full" | "partial" | "none";
};

export type PredictorTeamForecast = {
  readonly season: number;
  readonly ownerId: string;
  readonly ownerName: string;
  readonly teamName: string;
  readonly teamStrengthScore: number;
  readonly lineupStrengthScore: number;
  readonly depthStrengthScore: number;
  readonly balanceScore: number;
  readonly forecastOrder: number;
  readonly tier: PredictorTier;
  readonly positionStrengths: readonly PredictorPositionStrength[];
  readonly expectedLineupCoverage: {
    readonly resolvedSlots: number;
    readonly projectedSlots: number;
    readonly totalSlots: number;
  };
  readonly expectedLineupResolved: number;
  readonly expectedLineupRequired: number;
  readonly playerBaselineCoverage: {
    readonly knownPlayers: number;
    readonly totalPlayers: number;
    readonly relativeIndex: number;
  };
  readonly historicalBaselineResolved: number;
  readonly historicalBaselineTotal: number;
  readonly playerBaselineResolved: number;
  readonly playerBaselineTotal: number;
  readonly usableDepthCoverage: {
    readonly activePlayers: number;
    readonly usableDepthCount: number;
    readonly relativeIndex: number;
  };
  readonly coverage: {
    readonly taxiCount: number;
    readonly reserveCount: number;
    readonly unresolvedPlayerCount: number;
    readonly rookieUncertaintyCount: number;
    readonly rookieMarketBaselineCount: number;
    readonly missingPositions: readonly PredictorPosition[];
  };
  readonly confidence: PredictorConfidence;
  readonly keyStrength: PredictorPosition;
  readonly keyConcern: string;
  readonly modelVersion: string;
};

export type PredictorSnapshotMethodology = {
  readonly baseline: string;
  readonly positionNormalization: string;
  readonly composite: string;
  readonly depth: string;
  readonly balance: string;
  readonly weights: {
    readonly expectedLineup: number;
    readonly activeDepth: number;
    readonly positionalBalance: number;
  };
  readonly rookieTreatment: string;
  readonly taxiTreatment: string;
  readonly reserveTreatment: string;
  readonly backtestDisclosure: string;
  readonly futureInSeasonTransition: typeof PREDICTOR_FUTURE_IN_SEASON_CONTRACT;
  readonly futureSimulationRequirement: string;
  readonly rookieMarketAdapter: string;
  readonly rookiePositionMinimumSample: number;
};

export type PredictorSnapshotCandidate = {
  readonly season: number;
  readonly forecastType: string;
  readonly modelName: string;
  readonly modelVersion: string;
  readonly generatedAt: string;
  readonly dataCutoff: string;
  readonly rosterCoverage: {
    readonly ownerCount: number;
    readonly rosterCount: number;
    readonly uniquePlayerCount: number;
    readonly duplicateOwnershipCount: number;
    readonly unknownPlayerCount: number;
  };
  readonly methodology: PredictorSnapshotMethodology;
  readonly snapshotStatus: "CANDIDATE";
  readonly immutable: false;
  readonly teams: readonly PredictorTeamForecast[];
};

export type PredictorSnapshotProvenance = {
  readonly canonicalRosterSnapshot: string;
  readonly historicalPlayerBaselineEvidence: string;
  readonly frozenRookieMarketSource: string;
  readonly expectedLineupEngine: string;
};

export type PredictorApprovedSnapshot = Omit<PredictorSnapshotCandidate, "snapshotStatus" | "immutable"> & {
  readonly snapshotVersion: typeof PREDICTOR_APPROVED_SNAPSHOT_VERSION;
  readonly approvedAt: string;
  readonly teamCount: number;
  readonly provenance: PredictorSnapshotProvenance;
  readonly snapshotStatus: "APPROVED";
  readonly immutable: true;
};

type TeamIntermediate = {
  ownerId: string;
  ownerName: string;
  teamName: string;
  lineupRaw: number | null;
  depthRaw: number | null;
  usableDepthCount: number;
  activePlayers: number;
  knownPlayers: number;
  historicalPlayers: number;
  rookieMarketPlayers: number;
  unresolvedPlayerCount: number;
  rookieUncertaintyCount: number;
  taxiCount: number;
  reserveCount: number;
  lineupResolved: number;
  projectedSlots: number;
  totalSlots: number;
  positionGroups: PredictorPositionStrength[];
  missingPositions: PredictorPosition[];
};

type PredictorBaseline = {
  readonly value: number | null;
  readonly source: PredictorBaselineSource;
};

type RookieAdapter = {
  readonly byPlayerId: ReadonlyMap<string, number>;
  readonly supportedPositions: readonly PredictorPosition[];
  readonly rosteredPlayerIds: readonly string[];
};

export const PREDICTOR_ROOKIE_MARKET_PLAYERS: readonly PredictorRookieMarketPlayer[] =
  (rookieMarketReference.players ?? []).flatMap((player) => {
    if (
      typeof player.playerId !== "string" ||
      !["QB", "RB", "WR", "TE", "K", "DST"].includes(player.position) ||
      typeof player.marketRank !== "number" ||
      typeof player.adpOverall !== "number"
    ) {
      return [];
    }
    return [{
      playerId: player.playerId,
      name: player.name,
      position: player.position as PredictorPosition,
      marketRank: player.marketRank,
      adpOverall: player.adpOverall,
      sampleSize: player.sampleSize,
      resolutionConfidence: player.resolutionConfidence,
    }];
  });

export function loadPredictorTeamInputs(season = PREDICTOR_MODEL.season) {
  if (season !== PREDICTOR_MODEL.season) {
    throw new Error(`Predictor preseason inputs are only registered for ${PREDICTOR_MODEL.season}.`);
  }

  return ACTIVE_LCC_OWNERS.map((owner) => {
    const snapshot = getCurrentRosterSnapshot(owner.id);
    const rosterStrength = getCurrentRosterStrength(owner.id);
    const expectedLineup = getCurrentExpectedLineup(owner.id);

    if (!snapshot || !rosterStrength || !expectedLineup) {
      throw new Error(`Incomplete current Predictor input for ${owner.id}.`);
    }

    return { owner, snapshot, rosterStrength, expectedLineup };
  });
}

export function getRookieMarketAdapter(
  inputs = loadPredictorTeamInputs(),
  draftedRookieIds = getDraftedRookieIds(PREDICTOR_MODEL.season)
): RookieAdapter {
  const allRosteredIds = new Set(
    inputs.flatMap(({ snapshot }) => snapshot.playerIds)
  );
  const marketPlayers = PREDICTOR_ROOKIE_MARKET_PLAYERS.filter((player) =>
    draftedRookieIds.has(player.playerId)
  );
  const historicalByPosition = new Map<PredictorPosition, number[]>();

  for (const { snapshot, rosterStrength } of inputs) {
    const unavailable = new Set([
      ...(snapshot.taxiIds ?? []),
      ...(snapshot.reserveIds ?? []),
    ]);
    for (const group of rosterStrength.positions) {
      const values = historicalByPosition.get(group.position) ?? [];
      values.push(
        ...group.players
          .filter((player) => !unavailable.has(player.playerId) && player.baselineAverage !== null)
          .map((player) => player.baselineAverage!)
      );
      historicalByPosition.set(group.position, values);
    }
  }

  const byPlayerId = new Map<string, number>();
  const supportedPositions = new Set<PredictorPosition>();
  for (const position of POSITIONS) {
    const positionMarket = marketPlayers
      .filter((player) => player.position === position)
      .sort((a, b) => a.marketRank - b.marketRank || a.playerId.localeCompare(b.playerId));
    const historical = historicalByPosition.get(position) ?? [];
    if (
      positionMarket.length < ROOKIE_POSITION_MINIMUM_SAMPLE ||
      historical.length < ROOKIE_POSITION_MINIMUM_SAMPLE
    ) {
      continue;
    }

    supportedPositions.add(position);
    const lowerAnchor = quantile(historical, 0.25);
    const upperAnchor = quantile(historical, 0.75);
    positionMarket.forEach((player, index) => {
      const quality = positionMarket.length === 1
        ? 50
        : 100 - (index / (positionMarket.length - 1)) * 100;
      // The market percentile is mapped into the established position space
      // between the veteran 25th and 75th percentiles, never to raw points.
      byPlayerId.set(
        player.playerId,
        round(lowerAnchor + (quality / 100) * (upperAnchor - lowerAnchor))
      );
    });
  }

  return {
    byPlayerId,
    supportedPositions: POSITIONS.filter((position) => supportedPositions.has(position)),
    rosteredPlayerIds: marketPlayers
      .filter((player) => allRosteredIds.has(player.playerId))
      .map((player) => player.playerId),
  };
}

function getDraftedRookieIds(season: number): ReadonlySet<string> {
  return new Set(
    loadDraftEventsBySeason(season)
      .filter((draft) => draft.draftType === "rookie")
      .flatMap((draft) => draft.picks.map((pick) => pick.playerId))
      .filter((playerId): playerId is string => Boolean(playerId))
  );
}

function quantile(values: readonly number[], probability: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower] ?? 0;
  return (sorted[lower] ?? 0) + ((sorted[upper] ?? 0) - (sorted[lower] ?? 0)) * (position - lower);
}

export function getPreseasonTeamStrengthForecasts(
  season = PREDICTOR_MODEL.season
): readonly PredictorTeamForecast[] {
  const inputs = loadPredictorTeamInputs(season);
  const draftedRookieIds = getDraftedRookieIds(season);
  const rookieAdapter = getRookieMarketAdapter(inputs, draftedRookieIds);
  const projectionPartnerId = inputs[1]?.owner.id;

  if (!projectionPartnerId) {
    throw new Error("Predictor requires at least two active owners.");
  }

  const intermediate = inputs.map(({ owner, snapshot, rosterStrength, expectedLineup }) => {
    const projection = getCurrentMatchupProjection({
      ownerAId: owner.id,
      ownerBId: owner.id === projectionPartnerId ? inputs[0].owner.id : projectionPartnerId,
    });
    const projectedTeam = projection?.ownerA ?? null;
    const unavailableIds = new Set([
      ...(snapshot.taxiIds ?? []),
      ...(snapshot.reserveIds ?? []),
    ]);
    const activeIds = new Set(snapshot.playerIds.filter((playerId) => !unavailableIds.has(playerId)));
    const activePlayers = rosterStrength.positions.flatMap((group) =>
      group.players.filter((player) => activeIds.has(player.playerId))
    );
    const baselines = new Map(
      activePlayers.map((player) => [player.playerId, getBaseline(player, rookieAdapter)] as const)
    );
    const resolvedPlayers = activePlayers.filter(
      (player) => baselines.get(player.playerId)?.value !== null
    );
    const historicalPlayers = activePlayers.filter(
      (player) => baselines.get(player.playerId)?.source === "HISTORICAL"
    );
    const rookieMarketPlayers = activePlayers.filter(
      (player) => baselines.get(player.playerId)?.source === "ROOKIE_MARKET"
    );
    const projectedPlayers = projectedTeam?.playerProjections ?? [];
    const projectedValues = projectedPlayers
      .map((player) => player.projectedPoints ?? baselines.get(player.playerId)?.value ?? null)
      .filter((value): value is number => value !== null);
    const lineupRaw = projectedValues.length
      ? round(
          projectedValues.reduce((total, value) => total + value, 0) / projectedValues.length
        )
      : null;
    const selectedIds = new Set(expectedLineup.selectedPlayers.map((player) => player.playerId));
    const usableBench = activePlayers
      .filter((player) => !selectedIds.has(player.playerId) && baselines.get(player.playerId)?.value !== null)
      .sort((a, b) => (baselines.get(b.playerId)?.value ?? -Infinity) - (baselines.get(a.playerId)?.value ?? -Infinity))
      .slice(0, MAX_DEPTH_OPTIONS);
    const depthRaw = usableBench.length
      ? round(average(usableBench.map((player) => baselines.get(player.playerId)!.value!)))
      : null;
    const positionGroups = POSITIONS.map((position) =>
      buildPositionStrength(position, rosterStrength.positions, activeIds, baselines)
    );
    const missingPositions = positionGroups
      .filter((group) => group.coverage === "none")
      .map((group) => group.position);
    return {
      ownerId: owner.id,
      ownerName: getOwnerById(owner.id)?.displayName ?? owner.displayName,
      teamName: getOwnerById(owner.id)?.teamName ?? owner.managerPage.sleeperName,
      lineupRaw,
      depthRaw,
      usableDepthCount: usableBench.length,
      activePlayers: activeIds.size,
      knownPlayers: resolvedPlayers.length,
      historicalPlayers: historicalPlayers.length,
      rookieMarketPlayers: rookieMarketPlayers.length,
      unresolvedPlayerCount: rosterStrength.unresolvedPlayerIds.length,
      rookieUncertaintyCount: [...activeIds].filter(
        (playerId) => draftedRookieIds.has(playerId) && baselines.get(playerId)?.source !== "HISTORICAL"
      ).length,
      taxiCount: snapshot.taxiIds?.length ?? 0,
      reserveCount: snapshot.reserveIds?.length ?? 0,
      lineupResolved: expectedLineup.coverage.filledSlots,
      projectedSlots: projectedTeam?.playerProjections.filter(
        (player) => player.projectedPoints !== null
      ).length ?? 0,
      totalSlots: expectedLineup.coverage.totalSlots,
      positionGroups,
      missingPositions,
    } satisfies TeamIntermediate;
  });

  const lineupIndexes = leagueRelativeIndexes(intermediate.map((team) => team.lineupRaw));
  const depthIndexes = leagueRelativeIndexes(intermediate.map((team) => team.depthRaw));
  const positionIndexes = POSITIONS.map((position) =>
    leagueRelativeIndexes(
      intermediate.map(
        (team) => team.positionGroups.find((group) => group.position === position)?.baselineAverage ?? null
      )
    )
  );
  const positionIndexByPosition = new Map(POSITIONS.map((position, index) => [position, positionIndexes[index]]));

  const scored = intermediate.map((team, index) => {
    const positionStrengths = team.positionGroups.map((group) => ({
      ...group,
      relativeIndex: group.baselineAverage === null
        ? null
        : positionIndexByPosition.get(group.position)?.[index] ?? null,
    }));
    const knownPositionIndexes = positionStrengths
      .map((group) => group.relativeIndex)
      .filter((value): value is number => value !== null);
    const positionMean = knownPositionIndexes.length
      ? average(knownPositionIndexes)
      : 0;
    const balanceScore = round(positionMean * (knownPositionIndexes.length / POSITIONS.length));
    const lineupStrengthScore = lineupIndexes[index] ?? 0;
    const depthStrengthScore = depthIndexes[index] ?? 0;
    const teamStrengthScore = round(
      lineupStrengthScore * PREDICTOR_MODEL.lineupWeight +
        depthStrengthScore * PREDICTOR_MODEL.depthWeight +
        balanceScore * PREDICTOR_MODEL.balanceWeight
    );

    return { team, positionStrengths, lineupStrengthScore, depthStrengthScore, balanceScore, teamStrengthScore };
  });

  const ordered = [...scored].sort(
    (a, b) => b.teamStrengthScore - a.teamStrengthScore || a.team.ownerId.localeCompare(b.team.ownerId)
  );
  const tiers = distributionAwareTiers(ordered.map((team) => team.teamStrengthScore));

  return ordered.map(({ team, positionStrengths, lineupStrengthScore, depthStrengthScore, balanceScore, teamStrengthScore }, index) => ({
    season,
    ownerId: team.ownerId,
    ownerName: team.ownerName,
    teamName: team.teamName,
    teamStrengthScore,
    lineupStrengthScore,
    depthStrengthScore,
    balanceScore,
    forecastOrder: index + 1,
    tier: tiers[index],
    positionStrengths,
    expectedLineupCoverage: {
      resolvedSlots: team.lineupResolved,
      projectedSlots: team.projectedSlots,
      totalSlots: team.totalSlots,
    },
    expectedLineupResolved: team.lineupResolved,
    expectedLineupRequired: team.totalSlots,
    playerBaselineCoverage: {
      knownPlayers: team.knownPlayers,
      totalPlayers: team.activePlayers,
      relativeIndex: percent(team.knownPlayers, team.activePlayers),
    },
    historicalBaselineResolved: team.historicalPlayers,
    historicalBaselineTotal: team.activePlayers,
    playerBaselineResolved: team.knownPlayers,
    playerBaselineTotal: team.activePlayers,
    usableDepthCoverage: {
      activePlayers: team.activePlayers,
      usableDepthCount: team.usableDepthCount,
      relativeIndex: depthIndexes[intermediate.indexOf(team)] ?? 50,
    },
    coverage: {
      taxiCount: team.taxiCount,
      reserveCount: team.reserveCount,
      unresolvedPlayerCount: team.unresolvedPlayerCount,
      rookieUncertaintyCount: team.rookieUncertaintyCount,
      rookieMarketBaselineCount: team.rookieMarketPlayers,
      missingPositions: team.missingPositions,
    },
    confidence: getConfidence(team),
    keyStrength: strongestPosition(positionStrengths),
    keyConcern: getKeyConcern(team, positionStrengths),
    modelVersion: PREDICTOR_MODEL.modelVersion,
  }));
}

export function buildPreseasonSnapshotCandidate({
  generatedAt,
  dataCutoff = PREDICTOR_DEFAULT_DATA_CUTOFF,
}: {
  readonly generatedAt: string;
  readonly dataCutoff?: string;
}): PredictorSnapshotCandidate {
  const teams = getPreseasonTeamStrengthForecasts();
  const snapshots = loadPredictorTeamInputs();
  const playerIds = snapshots.flatMap(({ snapshot }) => snapshot.playerIds);

  return {
    season: PREDICTOR_MODEL.season,
    forecastType: PREDICTOR_MODEL.forecastType,
    modelName: PREDICTOR_MODEL.modelName,
    modelVersion: PREDICTOR_MODEL.modelVersion,
    generatedAt,
    dataCutoff,
    rosterCoverage: {
      ownerCount: snapshots.length,
      rosterCount: snapshots.filter(({ snapshot }) => snapshot.rosterId > 0).length,
      uniquePlayerCount: new Set(playerIds).size,
      duplicateOwnershipCount: playerIds.length - new Set(playerIds).size,
      unknownPlayerCount: snapshots.reduce(
        (total, { rosterStrength }) => total + rosterStrength.unresolvedPlayerIds.length,
        0
      ),
    },
    methodology: {
      baseline:
        "Resolved expected-lineup slots use the existing preseason historical fallback: latest prior-season scored sample, then career historical scoring; unresolved players remain uncertainty.",
      positionNormalization:
        "Each position is normalized against the 12 current LCC rosters using a tied midrank percentile from 0 to 100; no cross-position fantasy-point thresholds are used.",
      composite:
        "Team Strength Index = 70% expected starting lineup strength + 20% active depth strength + 10% positional balance. Confidence never multiplies or penalizes this score.",
      depth:
        `Active depth is the average league-relative baseline of the best ${MAX_DEPTH_OPTIONS} usable bench options after expected starters, taxi, and reserve/IR players are excluded.`,
      balance:
        "Positional balance is the mean available position index multiplied by the fraction of the six modeled position groups with usable baseline coverage, preventing one elite group from masking holes.",
      weights: {
        expectedLineup: PREDICTOR_MODEL.lineupWeight,
        activeDepth: PREDICTOR_MODEL.depthWeight,
        positionalBalance: PREDICTOR_MODEL.balanceWeight,
      },
      rookieTreatment:
        "No-history rookies with frozen position-aware market coverage receive a conservative ROOKIE_MARKET baseline anchored between the established position 25th and 75th historical percentiles. Unsupported or insufficiently sampled positions remain unresolved; rookie baselines never count as historical evidence for confidence.",
      taxiTreatment:
        "Taxi players are excluded from expected lineups and usable depth; taxi counts remain visible in coverage metadata.",
      reserveTreatment:
        "Reserve/IR players are excluded from expected lineups and usable depth without injury-return assumptions.",
      backtestDisclosure:
        "Historical validation supports broad relative tiers, not exact weekly scores, records, playoff odds, or championship odds.",
      futureInSeasonTransition: PREDICTOR_FUTURE_IN_SEASON_CONTRACT,
      futureSimulationRequirement:
        "Before publishing future records or probabilities, use the future schedule, scoring distributions and variance, remaining opponents, and at least 10,000 simulations.",
      rookieMarketAdapter:
        `Position-relative market rank from ${PREDICTOR_ROOKIE_MARKET_SOURCE}; market standing is not converted directly to fantasy points.`,
      rookiePositionMinimumSample: ROOKIE_POSITION_MINIMUM_SAMPLE,
    },
    snapshotStatus: "CANDIDATE",
    immutable: false,
    teams,
  };
}

export function buildApprovedPreseasonSnapshot({
  generatedAt,
  approvedAt,
  dataCutoff = PREDICTOR_DEFAULT_DATA_CUTOFF,
}: {
  readonly generatedAt: string;
  readonly approvedAt: string;
  readonly dataCutoff?: string;
}): PredictorApprovedSnapshot {
  const candidate = buildPreseasonSnapshotCandidate({ generatedAt, dataCutoff });
  const snapshot: PredictorApprovedSnapshot = {
    ...candidate,
    snapshotVersion: PREDICTOR_APPROVED_SNAPSHOT_VERSION,
    approvedAt,
    teamCount: candidate.teams.length,
    provenance: {
      canonicalRosterSnapshot: "data/history/matchups/sleeper/2026/rosters.json",
      historicalPlayerBaselineEvidence: "lib/history/playerPerformance.ts + data/history/matchups/sleeper/",
      frozenRookieMarketSource: PREDICTOR_ROOKIE_MARKET_SOURCE,
      expectedLineupEngine: "lib/history/expectedLineup.ts",
    },
    snapshotStatus: "APPROVED",
    immutable: true,
  };

  return snapshot;
}

export function validatePredictorSnapshotCandidate(
  snapshot: Pick<PredictorSnapshotCandidate, "teams"> | PredictorApprovedSnapshot
): readonly string[] {
  const errors: string[] = [];
  const ownerIds = snapshot.teams.map((team) => team.ownerId);
  const teamNames = snapshot.teams.map((team) => team.teamName);

  if (snapshot.teams.length !== ACTIVE_LCC_OWNERS.length) errors.push("TEAM_COUNT");
  if (new Set(ownerIds).size !== ownerIds.length) errors.push("OWNER_UNIQUENESS");
  if (new Set(teamNames).size !== teamNames.length) errors.push("FRANCHISE_UNIQUENESS");
  snapshot.teams.forEach((team) => {
    if (!Number.isFinite(team.teamStrengthScore) || team.teamStrengthScore < 0 || team.teamStrengthScore > 100) {
      errors.push(`SCORE_RANGE:${team.ownerId}`);
    }
    for (const [label, value] of [["LINEUP", team.lineupStrengthScore], ["DEPTH", team.depthStrengthScore], ["BALANCE", team.balanceScore]] as const) {
      if (!Number.isFinite(value) || value < 0 || value > 100) errors.push(`${label}_RANGE:${team.ownerId}`);
    }
    team.positionStrengths.forEach((position) => {
      if (position.relativeIndex !== null && (!Number.isFinite(position.relativeIndex) || position.relativeIndex < 0 || position.relativeIndex > 100)) {
        errors.push(`POSITION_RANGE:${team.ownerId}:${position.position}`);
      }
    });
    if (team.expectedLineupCoverage.resolvedSlots > team.expectedLineupCoverage.totalSlots) {
      errors.push(`LINEUP_COVERAGE:${team.ownerId}`);
    }
  });

  const forbiddenKeys = new Set(["futurePick", "futurePicks", "future_picks", "draftGrade", "draftGrades", "draft_grade", "draft_grades", "projectedWin", "projectedWins", "projected_wins", "projectedLoss", "projectedLosses", "projected_losses", "projectedRecord", "projectedRecords", "projected_record", "projected_records", "playoffOdds", "playoff_odds", "championshipOdds", "championship_odds"]);
  const visit = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (forbiddenKeys.has(key)) errors.push(`FORBIDDEN_FIELD:${key}`);
      visit(child);
    }
  };
  visit(snapshot);
  return errors;
}

export function validatePredictorApprovedSnapshot(
  snapshot: PredictorApprovedSnapshot
): readonly string[] {
  const errors = [...validatePredictorSnapshotCandidate(snapshot)];
  if (snapshot.snapshotVersion !== PREDICTOR_APPROVED_SNAPSHOT_VERSION) errors.push("SNAPSHOT_VERSION");
  if (snapshot.snapshotStatus !== "APPROVED") errors.push("SNAPSHOT_STATUS");
  if (snapshot.immutable !== true) errors.push("IMMUTABILITY");
  if (snapshot.season !== PREDICTOR_MODEL.season) errors.push("SEASON");
  if (snapshot.forecastType !== PREDICTOR_MODEL.forecastType) errors.push("FORECAST_TYPE");
  if (snapshot.modelName !== PREDICTOR_MODEL.modelName) errors.push("MODEL_NAME");
  if (snapshot.modelVersion !== PREDICTOR_MODEL.modelVersion) errors.push("MODEL_VERSION");
  if (snapshot.dataCutoff !== PREDICTOR_DEFAULT_DATA_CUTOFF) errors.push("DATA_CUTOFF");
  if (snapshot.teamCount !== snapshot.teams.length) errors.push("TEAM_COUNT_METADATA");
  if (snapshot.methodology.weights.expectedLineup !== PREDICTOR_MODEL.lineupWeight) errors.push("LINEUP_WEIGHT");
  if (snapshot.methodology.weights.activeDepth !== PREDICTOR_MODEL.depthWeight) errors.push("DEPTH_WEIGHT");
  if (snapshot.methodology.weights.positionalBalance !== PREDICTOR_MODEL.balanceWeight) errors.push("BALANCE_WEIGHT");
  if (!snapshot.approvedAt) errors.push("APPROVED_AT");
  if (!snapshot.provenance.canonicalRosterSnapshot) errors.push("ROSTER_PROVENANCE");
  if (!snapshot.provenance.historicalPlayerBaselineEvidence) errors.push("BASELINE_PROVENANCE");
  if (!snapshot.provenance.frozenRookieMarketSource) errors.push("ROOKIE_PROVENANCE");
  if (!snapshot.provenance.expectedLineupEngine) errors.push("LINEUP_PROVENANCE");
  return errors;
}

export function getApprovedPreseasonSnapshot(): PredictorApprovedSnapshot {
  const snapshot = approvedPreseasonSnapshotReference as PredictorApprovedSnapshot;
  const errors = validatePredictorApprovedSnapshot(snapshot);
  if (errors.length) {
    throw new Error(`Approved Predictor snapshot validation failed: ${[...new Set(errors)].join(", ")}`);
  }
  return snapshot;
}

export function getApprovedPreseasonTeamStrengthForecasts(): readonly PredictorTeamForecast[] {
  return getApprovedPreseasonSnapshot().teams;
}

function buildPositionStrength(
  position: PredictorPosition,
  groups: readonly { position: string; requiredSlots: number; players: readonly RosterStrengthPlayer[] }[],
  activeIds: ReadonlySet<string>,
  baselines: ReadonlyMap<string, PredictorBaseline>
): PredictorPositionStrength {
  const group = groups.find((candidate) => candidate.position === position);
  const activePlayers = (group?.players ?? []).filter((player) => activeIds.has(player.playerId));
  const sampled = activePlayers
    .filter((player) => baselines.get(player.playerId)?.value !== null)
    .sort((a, b) => (baselines.get(b.playerId)?.value ?? -Infinity) - (baselines.get(a.playerId)?.value ?? -Infinity));
  const requiredSlots = group?.requiredSlots ?? 0;
  const selected = sampled.slice(0, requiredSlots);
  const baselineAverage = selected.length
    ? round(average(selected.map((player) => baselines.get(player.playerId)!.value!)))
    : null;

  return {
    position,
    baselineAverage,
    relativeIndex: null,
    sampledPlayerCount: sampled.length,
    activePlayerCount: activePlayers.length,
    requiredSlots,
    coverage: sampled.length === 0
      ? "none"
      : sampled.length >= requiredSlots
        ? "full"
        : "partial",
  };
}

function getBaseline(
  player: RosterStrengthPlayer,
  rookieAdapter: RookieAdapter
): PredictorBaseline {
  if (player.baselineAverage !== null) {
    return { value: player.baselineAverage, source: "HISTORICAL" };
  }
  const rookieValue = rookieAdapter.byPlayerId.get(player.playerId);
  if (rookieValue !== undefined) {
    return { value: rookieValue, source: "ROOKIE_MARKET" };
  }
  return { value: null, source: "UNRESOLVED" };
}

function leagueRelativeIndexes(values: readonly (number | null)[]): readonly (number | null)[] {
  const available = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (available.length === 0) return values.map(() => null);
  const sorted = [...available].sort((a, b) => a - b);

  return values.map((value) => {
    if (value === null || !Number.isFinite(value)) return null;
    const matchingIndexes = sorted
      .map((candidate, index) => (candidate === value ? index : -1))
      .filter((index) => index >= 0);
    const midrank = matchingIndexes.reduce((sum, index) => sum + index, 0) / matchingIndexes.length;
    return sorted.length === 1 ? 50 : round((midrank / (sorted.length - 1)) * 100);
  });
}

function strongestPosition(groups: readonly PredictorPositionStrength[]): PredictorPosition {
  return groups
    .filter((group) => group.relativeIndex !== null)
    .sort((a, b) => (b.relativeIndex ?? -1) - (a.relativeIndex ?? -1) || a.position.localeCompare(b.position))[0]?.position ?? "QB";
}

function weakestPosition(groups: readonly PredictorPositionStrength[]): PredictorPosition {
  return groups
    .filter((group) => group.relativeIndex !== null)
    .sort((a, b) => (a.relativeIndex ?? 101) - (b.relativeIndex ?? 101) || a.position.localeCompare(b.position))[0]?.position ?? "QB";
}

function getKeyConcern(
  team: TeamIntermediate,
  groups: readonly PredictorPositionStrength[]
): string {
  const missingStarter = team.missingPositions[0];
  if (team.lineupResolved < team.totalSlots || team.projectedSlots < team.totalSlots) {
    return `${missingStarter ?? "LINEUP"} · NO EXPECTED STARTER`;
  }
  if (team.activePlayers === 0 || team.knownPlayers / team.activePlayers < 0.6) {
    return "BASELINE COVERAGE";
  }
  return weakestPosition(groups);
}

function distributionAwareTiers(scores: readonly number[]): readonly PredictorTier[] {
  if (scores.length < 2) return scores.map(() => "CONTENDER");
  const gaps = scores.slice(1).map((score, index) => scores[index] - score);
  const sortedGaps = [...gaps].sort((a, b) => a - b);
  const medianGap = quantile(sortedGaps, 0.5);
  const threshold = Math.max(3, medianGap);
  const candidates = gaps
    .map((gap, index) => ({ gap, cut: index + 1 }))
    .filter(({ gap, cut }) => gap >= threshold && cut >= 2 && scores.length - cut >= 2)
    .sort((a, b) => b.gap - a.gap || a.cut - b.cut);
  const cuts: number[] = [];
  for (const candidate of candidates) {
    if (cuts.every((cut) => Math.abs(cut - candidate.cut) >= 2)) {
      cuts.push(candidate.cut);
      if (cuts.length === 3) break;
    }
  }
  if (cuts.length === 0) {
    const largest = gaps
      .map((gap, index) => ({ gap, cut: index + 1 }))
      .filter(({ cut }) => cut >= 2 && scores.length - cut >= 2)
      .sort((a, b) => b.gap - a.gap || a.cut - b.cut)[0];
    if (largest && largest.gap >= 3) cuts.push(largest.cut);
  }
  const boundaries = [0, ...cuts.sort((a, b) => a - b), scores.length];
  const labelSets: readonly (readonly PredictorTier[])[] = [
    ["CONTENDER", "QUESTION MARK"],
    ["CONTENDER", "STRONG", "QUESTION MARK"],
    ["CONTENDER", "STRONG", "IN THE MIX", "QUESTION MARK"],
  ];
  const labels = labelSets[Math.min(cuts.length, 3) - 1] ?? ["CONTENDER"];
  return boundaries.slice(0, -1).flatMap((start, index) =>
    Array.from({ length: boundaries[index + 1] - start }, () => labels[index] ?? labels.at(-1)!)
  );
}

function getConfidence(team: TeamIntermediate): PredictorConfidence {
  const lineupComplete = team.lineupResolved === team.totalSlots && team.projectedSlots === team.totalSlots;
  const baselineCoverage = team.activePlayers ? team.historicalPlayers / team.activePlayers : 0;
  if (lineupComplete && baselineCoverage >= 0.85 && team.rookieUncertaintyCount <= 2 && team.missingPositions.length === 0) return "HIGH";
  if (team.lineupResolved >= team.totalSlots - 2 && baselineCoverage >= 0.6 && team.missingPositions.length <= 1) return "MEDIUM";
  return "LOW";
}

function percent(numerator: number, denominator: number) {
  return denominator ? round((numerator / denominator) * 100) : 0;
}

function average(values: readonly number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number) {
  return Number(value.toFixed(2));
}
