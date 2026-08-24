import { LCC_CURRENT_SEASON } from "../leagueConstants";
import {
  getPlayerPerformanceBefore,
  type HistoricalPlayerPerformance,
} from "./playerPerformance";
import {
  getCurrentExpectedLineup,
  getExpectedLineupBefore,
  type ExpectedLineup,
  type ExpectedLineupCandidate,
  type ExpectedLineupSlot,
} from "./expectedLineup";
import { getPlayerById } from "./playerRegistry";

export type MatchupProjectionBaselineSource =
  | "recentRolling"
  | "seasonToDate"
  | "priorSeason"
  | "recentPriorBlend"
  | "careerHistorical"
  | "unavailable";

export type PlayerProjection = {
  readonly playerId: string;
  readonly slot: string;
  readonly position: string | null;
  readonly metadata: ExpectedLineupCandidate["metadata"];
  readonly projectedPoints: number | null;
  readonly baselineSource: MatchupProjectionBaselineSource;
  readonly sampleSize: number;
  readonly recentAverage: number | null;
  readonly seasonAverage: number | null;
  readonly priorSeasonAverage: number | null;
  readonly careerAverage: number | null;
  readonly explanation: string;
};

export type ProjectedTeamScore = {
  readonly ownerId: string;
  readonly lineup: ExpectedLineup;
  readonly playerProjections: readonly PlayerProjection[];
  readonly projectedScore: number | null;
  readonly projectedPointsKnown: number;
  readonly unresolvedSlots: readonly string[];
  readonly coverageRatio: number;
  readonly complete: boolean;
};

export type MatchupProjection = {
  readonly ownerAId: string;
  readonly ownerBId: string;
  readonly season: number;
  readonly week: number;
  readonly evaluation: "beforeWeek" | "currentPreseason";
  readonly ownerA: ProjectedTeamScore;
  readonly ownerB: ProjectedTeamScore;
  readonly projectedPointDifference: number | null;
  readonly projectedLeader: "ownerA" | "ownerB" | "tie" | "incomplete";
  readonly methodology: string;
};

const RECENT_SCORING_SAMPLE_SIZE = 3;
const MINIMUM_SCORING_SAMPLE_SIZE = 3;
const playerProjectionCache = new Map<string, PlayerProjection>();

export function getMatchupProjectionBefore({
  ownerAId,
  ownerBId,
  season,
  week,
}: {
  readonly ownerAId: string;
  readonly ownerBId: string;
  readonly season: number;
  readonly week: number;
}): MatchupProjection | null {
  const lineupA = getExpectedLineupBefore({ ownerId: ownerAId, season, week });
  const lineupB = getExpectedLineupBefore({ ownerId: ownerBId, season, week });

  if (!lineupA || !lineupB) {
    return null;
  }

  return buildMatchupProjection({
    ownerAId,
    ownerBId,
    season,
    week,
    evaluation: "beforeWeek",
    lineupA,
    lineupB,
  });
}

export function getCurrentMatchupProjection({
  ownerAId,
  ownerBId,
}: {
  readonly ownerAId: string;
  readonly ownerBId: string;
}): MatchupProjection | null {
  const lineupA = getCurrentExpectedLineup(ownerAId);
  const lineupB = getCurrentExpectedLineup(ownerBId);

  if (!lineupA || !lineupB) {
    return null;
  }

  return buildMatchupProjection({
    ownerAId,
    ownerBId,
    season: LCC_CURRENT_SEASON,
    week: 1,
    evaluation: "currentPreseason",
    lineupA,
    lineupB,
  });
}

export function getPlayerProjectionBefore({
  playerId,
  slot,
  season,
  week,
}: {
  readonly playerId: string;
  readonly slot: string;
  readonly season: number;
  readonly week: number;
}): PlayerProjection {
  const metadata = getPlayerById(playerId);
  const candidate: ExpectedLineupCandidate = {
    playerId,
    metadata,
    position: metadata?.position ?? null,
    historicalSampleAvailable: false,
    baselineSeason: null,
    baselineAverage: null,
    baselineAppearances: 0,
    recentAverage: null,
    recentRosterAppearances: 0,
    recentStarterAppearances: 0,
    recentStarterRate: null,
    previousRosterAppearanceStarter: false,
  };

  return projectPlayer(
    { slot, player: candidate },
    { performanceCutoff: { season, week } }
  );
}

function buildMatchupProjection({
  ownerAId,
  ownerBId,
  season,
  week,
  evaluation,
  lineupA,
  lineupB,
}: {
  ownerAId: string;
  ownerBId: string;
  season: number;
  week: number;
  evaluation: "beforeWeek" | "currentPreseason";
  lineupA: ExpectedLineup;
  lineupB: ExpectedLineup;
}): MatchupProjection {
  const ownerA = projectTeam(lineupA);
  const ownerB = projectTeam(lineupB);
  const projectedPointDifference = ownerA.complete && ownerB.complete
    ? round(ownerA.projectedPointsKnown - ownerB.projectedPointsKnown)
    : null;

  return {
    ownerAId,
    ownerBId,
    season,
    week,
    evaluation,
    ownerA,
    ownerB,
    projectedPointDifference,
    projectedLeader:
      projectedPointDifference === null
        ? "incomplete"
        : projectedPointDifference === 0
          ? "tie"
          : projectedPointDifference > 0
            ? "ownerA"
            : "ownerB",
    methodology:
      "Each expected-lineup slot uses the first available factual scoring baseline: " +
      "three recent scored appearances, three season-to-date scored appearances, " +
      "the latest prior-season scored sample, or career historical scoring. " +
      "Missing baselines remain unresolved.",
  };
}

function projectTeam(lineup: ExpectedLineup): ProjectedTeamScore {
  const playerProjections: PlayerProjection[] = [];
  const unresolvedSlots: string[] = [];

  for (const slot of lineup.slots) {
    if (!slot.player) {
      unresolvedSlots.push(slot.slot);
      continue;
    }

    const projection = projectPlayer(slot, lineup);
    playerProjections.push(projection);
    if (projection.projectedPoints === null) {
      unresolvedSlots.push(slot.slot);
    }
  }

  const projectedPointsKnown = round(
    playerProjections.reduce(
      (total, projection) => total + (projection.projectedPoints ?? 0),
      0
    )
  );
  const totalSlots = lineup.slots.length;
  const knownSlots = playerProjections.filter(
    (projection) => projection.projectedPoints !== null
  ).length;

  return {
    ownerId: lineup.ownerId,
    lineup,
    playerProjections,
    projectedScore: unresolvedSlots.length === 0 ? projectedPointsKnown : null,
    projectedPointsKnown,
    unresolvedSlots,
    coverageRatio: totalSlots ? round(knownSlots / totalSlots) : 0,
    complete: unresolvedSlots.length === 0 && knownSlots === totalSlots,
  };
}

function projectPlayer(
  slot: Pick<ExpectedLineupSlot, "slot" | "player">,
  lineup: Pick<ExpectedLineup, "performanceCutoff">
): PlayerProjection {
  const player = slot.player!;
  const cacheKey = `${player.playerId}|${lineup.performanceCutoff.season}|${lineup.performanceCutoff.week}`;
  const cached = playerProjectionCache.get(cacheKey);
  if (cached) {
    return { ...cached, slot: slot.slot };
  }

  const projection = calculatePlayerProjection(slot, lineup);
  playerProjectionCache.set(cacheKey, projection);
  return { ...projection, slot: slot.slot };
}

function calculatePlayerProjection(
  slot: Pick<ExpectedLineupSlot, "slot" | "player">,
  lineup: Pick<ExpectedLineup, "performanceCutoff">
): PlayerProjection {
  const player = slot.player!;
  const performances = getPlayerPerformanceBefore({
    playerId: player.playerId,
    season: lineup.performanceCutoff.season,
    week: lineup.performanceCutoff.week,
  });
  const scoredBefore = performances.filter(hasScore);
  const recent = scoredBefore.slice(-RECENT_SCORING_SAMPLE_SIZE);
  const seasonToDate = scoredBefore.filter(
    (performance) => performance.season === lineup.performanceCutoff.season
  );
  const priorSeason = getLatestPriorSeasonSample(
    scoredBefore,
    lineup.performanceCutoff.season
  );
  const recentAverage = average(recent);
  const seasonAverage = average(seasonToDate);
  const priorSeasonAverage = average(priorSeason.performances);
  const careerAverage = average(scoredBefore);

  if (recent.length >= RECENT_SCORING_SAMPLE_SIZE) {
    return makeProjection({
      slot,
      player,
      projectedPoints: recentAverage,
      baselineSource: "recentRolling",
      sampleSize: recent.length,
      recentAverage,
      seasonAverage,
      priorSeasonAverage,
      careerAverage,
      explanation: `Average of the latest ${recent.length} scored appearances before ${lineup.performanceCutoff.season} Week ${lineup.performanceCutoff.week}.`,
    });
  }

  if (seasonToDate.length >= MINIMUM_SCORING_SAMPLE_SIZE) {
    return makeProjection({
      slot,
      player,
      projectedPoints: seasonAverage,
      baselineSource: "seasonToDate",
      sampleSize: seasonToDate.length,
      recentAverage,
      seasonAverage,
      priorSeasonAverage,
      careerAverage,
      explanation: `Average of ${seasonToDate.length} scored appearances in ${lineup.performanceCutoff.season} before Week ${lineup.performanceCutoff.week}.`,
    });
  }

  if (priorSeason.performances.length > 0) {
    return makeProjection({
      slot,
      player,
      projectedPoints: priorSeasonAverage,
      baselineSource: "priorSeason",
      sampleSize: priorSeason.performances.length,
      recentAverage,
      seasonAverage,
      priorSeasonAverage,
      careerAverage,
      explanation: `Average of ${priorSeason.performances.length} scored appearances from the latest prior season (${priorSeason.season}).`,
    });
  }

  if (scoredBefore.length > 0) {
    return makeProjection({
      slot,
      player,
      projectedPoints: careerAverage,
      baselineSource: "careerHistorical",
      sampleSize: scoredBefore.length,
      recentAverage,
      seasonAverage,
      priorSeasonAverage,
      careerAverage,
      explanation: `Average of ${scoredBefore.length} scored historical appearances before ${lineup.performanceCutoff.season} Week ${lineup.performanceCutoff.week}.`,
    });
  }

  return makeProjection({
    slot,
    player,
    projectedPoints: null,
    baselineSource: "unavailable",
    sampleSize: 0,
    recentAverage,
    seasonAverage,
    priorSeasonAverage,
    careerAverage,
    explanation: "No factual fantasy-scoring sample exists before the evaluation cutoff.",
  });
}

function makeProjection({
  slot,
  player,
  projectedPoints,
  baselineSource,
  sampleSize,
  recentAverage,
  seasonAverage,
  priorSeasonAverage,
  careerAverage,
  explanation,
}: {
    slot: Pick<ExpectedLineupSlot, "slot" | "player">;
  player: ExpectedLineupCandidate;
  projectedPoints: number | null;
  baselineSource: MatchupProjectionBaselineSource;
  sampleSize: number;
  recentAverage: number | null;
  seasonAverage: number | null;
  priorSeasonAverage: number | null;
  careerAverage: number | null;
  explanation: string;
}): PlayerProjection {
  return {
    playerId: player.playerId,
    slot: slot.slot,
    position: player.position,
    metadata: player.metadata,
    projectedPoints,
    baselineSource,
    sampleSize,
    recentAverage,
    seasonAverage,
    priorSeasonAverage,
    careerAverage,
    explanation,
  };
}

function getLatestPriorSeasonSample(
  performances: readonly HistoricalPlayerPerformance[],
  beforeSeason: number
) {
  const eligible = performances.filter(
    (performance) => performance.season < beforeSeason
  );
  const season = eligible.at(-1)?.season ?? null;

  return {
    season,
    performances: season === null
      ? []
      : eligible.filter((performance) => performance.season === season),
  };
}

function hasScore(performance: HistoricalPlayerPerformance) {
  return performance.fantasyPoints !== null;
}

function average(performances: readonly HistoricalPlayerPerformance[]) {
  if (performances.length === 0) {
    return null;
  }

  return round(
    performances.reduce(
      (total, performance) => total + (performance.fantasyPoints ?? 0),
      0
    ) / performances.length
  );
}

function round(value: number) {
  return Number(value.toFixed(2));
}
