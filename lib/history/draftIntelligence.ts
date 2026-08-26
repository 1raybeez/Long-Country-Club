import draftSeason from "../../data/history/drafts/2026/drafts.json";
import playerRegistry from "../../data/history/matchups/sleeper/players.json";
import marketReference from "../../data/source/market/dynasty-rookie/2026/snapshots/2026-08-19/provenance.json";
import type {
  DraftIntelligenceSnapshot,
  DraftPickIntelligence,
  IntelligenceStatus,
  PositionRun,
  TeamDraftIntelligence,
} from "../types/draftIntelligence";
import type { DraftPickRecord } from "../types/draft";
import { loadAllDraftEvents } from "./drafts";

const DRAFT_ID = "1312148925104259072";
const DRAFT_START = "2026-05-29T11:54:55.518Z";
const MARKET_PATH = "data/source/market/dynasty-rookie/2026/snapshots/2026-08-19/provenance.json";
const ROSTER_PATH = "data/history/matchups/sleeper/2026/rosters.json";
const PLAYER_PATH = "data/history/matchups/sleeper/players.json";
const RUN_RULE = "Three consecutive selections at the same position; a five-pick rolling window establishes the run and overlapping windows are merged into one maximal episode.";

type RawPick = DraftPickRecord;
type RegistryPlayer = { readonly birth_date?: string | null };
const playerById = playerRegistry as Record<string, RegistryPlayer>;

function asStatus(value: IntelligenceStatus): IntelligenceStatus {
  return value;
}

function playerFor(pick: RawPick): RegistryPlayer | null {
  return pick.playerId ? playerById[pick.playerId] ?? null : null;
}

function buildRuns(picks: readonly RawPick[]): readonly PositionRun[] {
  const runs: PositionRun[] = [];
  let start = 0;
  while (start < picks.length) {
    let end = start;
    while (end + 1 < picks.length && picks[end + 1].position === picks[start].position) end += 1;
    if (end - start + 1 >= 3) {
      const group = picks.slice(start, end + 1);
      runs.push({
        position: picks[start].position ?? "UNKNOWN",
        startPick: picks[start].overallPick ?? 0,
        endPick: picks[end].overallPick ?? 0,
        playerNames: group.map((pick) => pick.playerName ?? "Unknown player"),
        ownerIds: group.map((pick) => pick.canonicalOwnerId ?? "unknown-owner"),
        initiatingSelection: group[0].playerName ?? "Unknown player",
        detectionRule: RUN_RULE,
      });
    }
    start = end + 1;
  }
  return runs;
}

function positionCounts(picks: readonly RawPick[]): Readonly<Record<string, number>> {
  return picks.reduce<Record<string, number>>((counts, pick) => {
    const position = pick.position ?? "UNKNOWN";
    counts[position] = (counts[position] ?? 0) + 1;
    return counts;
  }, {});
}

function buildTeams(picks: readonly RawPick[]): readonly TeamDraftIntelligence[] {
  const byOwner = new Map<string, RawPick[]>();
  picks.forEach((pick) => {
    const owner = pick.canonicalOwnerId ?? "unknown-owner";
    byOwner.set(owner, [...(byOwner.get(owner) ?? []), pick]);
  });
  const tradedPicks = draftSeason.drafts[0].tradedPicks;
  return [...byOwner.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([ownerId, ownerPicks]) => {
    const acquired = tradedPicks.filter((pick) => pick.currentOwnerRosterId === ownerPicks[0].rosterId && pick.currentOwnerRosterId !== pick.originalRosterId).length;
    const tradedAway = tradedPicks.filter((pick) => pick.originalRosterId === ownerPicks[0].rosterId && pick.currentOwnerRosterId !== pick.originalRosterId).length;
    return {
      ownerId,
      pickCount: ownerPicks.length,
      rounds: ownerPicks.map((pick) => pick.round ?? 0),
      positionsDrafted: positionCounts(ownerPicks),
      capitalContext: {
        originallyAllocatedPicks: 4,
        acquiredPicks: acquired,
        tradedAwayPicks: tradedAway,
        selectionsMade: ownerPicks.length,
        status: asStatus("AVAILABLE"),
      },
      preDraftRoster: null,
      postDraftRoster: null,
      rosterImpact: null,
      grading: null,
    };
  });
}

function buildPick(pick: RawPick, marketByPlayer: Map<string, { marketRank: number; expectedOverallPick: number }>): DraftPickIntelligence {
  const market = pick.playerId ? marketByPlayer.get(pick.playerId) : undefined;
  return {
    actualOverallPick: pick.overallPick ?? 0,
    round: pick.round ?? 0,
    pickInRound: pick.pickInRound ?? 0,
    ownerId: pick.canonicalOwnerId ?? "unknown-owner",
    playerId: pick.playerId ?? "unknown-player",
    playerName: pick.playerName ?? "Unknown player",
    position: pick.position ?? "UNKNOWN",
    nflTeam: pick.nflTeam,
    sourceReference: pick.sourceReference,
    marketRank: market?.marketRank ?? null,
    marketExpectedPick: null,
    pickDifference: null,
    marketClassification: null,
    marketEvidenceStatus: asStatus("BLOCKED"),
    nflDraftCapital: {
      round: null,
      overallPick: null,
      source: null,
      status: asStatus("BLOCKED"),
    },
    opportunityCost: {
      topAvailableMarketPlayers: [],
      bestAvailableMarketGap: null,
      status: asStatus("BLOCKED"),
    },
  };
}

function historicalTendencies(): Readonly<Record<string, unknown>> {
  const events = loadAllDraftEvents().filter((event) => event.season >= 2021 && event.season <= 2025 && event.draftType === "rookie");
  const ownerMap = new Map<string, RawPick[]>();
  events.flatMap((event) => event.picks).forEach((pick) => {
    const owner = pick.canonicalOwnerId ?? "unknown-owner";
    ownerMap.set(owner, [...(ownerMap.get(owner) ?? []), pick]);
  });
  return Object.fromEntries([...ownerMap.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([ownerId, picks]) => [ownerId, {
    totalPicks: picks.length,
    positionCounts: positionCounts(picks),
    averageRoundByPosition: Object.fromEntries(["QB", "RB", "WR", "TE"].map((position) => {
      const positionPicks = picks.filter((pick) => pick.position === position);
      const average = positionPicks.length ? positionPicks.reduce((sum, pick) => sum + (pick.round ?? 0), 0) / positionPicks.length : null;
      return [position, average === null ? null : Number(average.toFixed(2))];
    })),
  }]));
}

export function build2026RookieDraftIntelligence(generatedAt = new Date().toISOString()): DraftIntelligenceSnapshot {
  const draft = draftSeason.drafts[0];
  const marketByPlayer = new Map(marketReference.players.map((player) => [player.playerId, {
    marketRank: player.marketRank,
    expectedOverallPick: player.expectedOverallPick,
  }]));
  const picks = draft.picks.map((pick) => buildPick(pick, marketByPlayer));
  const resolvedPlayers = draft.picks.filter((pick) => pick.playerId && playerById[pick.playerId]).length;
  const stableBirthDates = draft.picks.filter((pick) => {
    const player = playerFor(pick);
    return Boolean(player?.birth_date);
  }).length;
  const draftStart = new Date(DRAFT_START);
  const marketDate = new Date(marketReference.snapshotDate);
  const daysFromDraft = Math.round((marketDate.getTime() - draftStart.getTime()) / 86_400_000);
  return {
    schemaVersion: 1,
    methodologyVersion: "rookie-draft-intelligence-slice-a-v1",
    status: "BLOCKED",
    generatedAt,
    season: 2026,
    draftId: DRAFT_ID,
    draftDate: DRAFT_START,
    evaluationCutoff: DRAFT_START,
    dataFlow: ["CANONICAL_DRAFT_DATA", "OWNER_MAPPING", "PLAYER_METADATA", "INTELLIGENCE_ENGINE"],
    canonicalDraft: {
      expectedPicks: 48,
      actualPicks: draft.picks.length,
      uniqueOwners: new Set(draft.picks.map((pick) => pick.canonicalOwnerId)).size,
      rounds: draft.rounds,
      verificationStatus: draft.verificationStatus,
      sourceReference: "data/history/drafts/2026/drafts.json",
    },
    format: {
      teams: 12,
      dynasty: true,
      quarterbackFormat: "1QB",
      scoringContext: "NON_TEP",
      lineupSlots: ["QB1", "RB1", "RB2", "WR1", "WR2", "WR3", "TE1", "FLEX1", "FLEX2", "K1", "DST1"],
      rookieRounds: draft.rounds,
      sourceReferences: ["data/source/market/dynasty-rookie/2026/snapshots/2026-08-19/provenance.json", "lib/history/expectedLineup.ts"],
    },
    marketReference: {
      source: marketReference.source,
      snapshotDate: marketReference.snapshotDate,
      timingClassification: marketReference.timingClassification as "POST_DRAFT_PRESEASON",
      daysFromDraft,
      format: marketReference.format,
      playerCount: marketReference.players.length,
      resolvedPickCount: draft.picks.filter((pick) => pick.playerId && marketByPlayer.has(pick.playerId)).length,
      tiersAvailable: false,
      adpAvailable: marketReference.players.some((player) => typeof player.adpOverall === "number"),
      usableForDraftDayGrading: false,
      reason: "The only registered market snapshot is post-draft/preseason and cannot judge what was knowable at the draft cutoff.",
    },
    rosterEvidence: {
      preDraft: { coverage: 0, source: null, confidence: "NONE" },
      postDraft: { coverage: 0, source: null, confidence: "NONE" },
      currentRosterExcluded: true,
      reason: `The available 2026 roster files are not timestamped to the draft boundary; ${ROSTER_PATH} is not used as pre- or post-draft evidence.`,
    },
    playerMetadata: {
      resolvedPlayers,
      totalPicks: draft.picks.length,
      stableBirthDateCoverage: stableBirthDates,
      sourceReference: PLAYER_PATH,
      cutoffSafeForRoleOrTeamContext: false,
    },
    picks,
    teams: buildTeams(draft.picks),
    positionRuns: buildRuns(draft.picks),
    tierRuns: { status: "BLOCKED", reason: "The registered market source provides no supported tiers and is not draft-cutoff valid." },
    historicalOwnerTendencies: historicalTendencies(),
    gradingArchitecture: {
      status: "DESIGN_ONLY",
      components: ["MARKET_VALUE", "ROSTER_FIT", "LONG_TERM_UPSIDE", "DRAFT_CAPITAL_EFFICIENCY", "OPPORTUNITY_COST", "CLASS_COHERENCE"],
      recommendedWeights: { marketValue: 0.25, rosterFit: 0.2, longTermUpside: 0.2, capitalEfficiency: 0.15, opportunityCost: 0.1, classCoherence: 0.1 },
      immediateImpactTreatment: "Display separately from long-term dynasty outlook; do not combine until cutoff-safe role evidence exists.",
      falsePrecisionTreatment: "Use integer component grades or letter bands only after evidence coverage is approved; never publish unsupported decimal precision.",
      humorGuardrail: "NO_FACT_NO_ROAST",
    },
    sourceGaps: [
      `No pre-draft market snapshot exists on or before ${DRAFT_START}.`,
      "The registered market snapshot is 82 days after draft start and explicitly POST_DRAFT_PRESEASON.",
      "No supported market tiers are available.",
      "No timestamped pre-draft or immediate post-draft 2026 roster snapshot is available.",
      "No canonical NFL Draft round/overall-pick dataset is available for these players.",
      "The player registry is current and not cutoff-safe for role/team context.",
    ],
  };
}

export { MARKET_PATH, ROSTER_PATH, RUN_RULE };
