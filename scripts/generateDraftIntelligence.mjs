import fs from "node:fs";
import path from "node:path";

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const root = process.cwd();
const draftFile = path.join(root, "data/history/drafts/2026/drafts.json");
const playersFile = path.join(root, "data/history/matchups/sleeper/players.json");
const marketFile = path.join(root, "data/source/market/dynasty-rookie/2026/snapshots/2026-08-19/provenance.json");
const draft = readJson(draftFile).drafts[0];
const players = readJson(playersFile);
const market = readJson(marketFile);
const draftDate = "2026-05-29T11:54:55.518Z";
const marketDaysFromDraft = Math.round((new Date(market.snapshotDate) - new Date(draftDate)) / 86_400_000);
const marketByPlayer = new Map(market.players.map((player) => [player.playerId, player]));

const positionCounts = (picks) => picks.reduce((counts, pick) => {
  const position = pick.position ?? "UNKNOWN";
  counts[position] = (counts[position] ?? 0) + 1;
  return counts;
}, {});

const positionRuns = [];
for (let start = 0; start < draft.picks.length;) {
  let end = start;
  while (end + 1 < draft.picks.length && draft.picks[end + 1].position === draft.picks[start].position) end += 1;
  if (end - start + 1 >= 3) {
    const picks = draft.picks.slice(start, end + 1);
    positionRuns.push({
      position: picks[0].position,
      startPick: picks[0].overallPick,
      endPick: picks.at(-1).overallPick,
      playerNames: picks.map((pick) => pick.playerName),
      ownerIds: picks.map((pick) => pick.canonicalOwnerId),
      initiatingSelection: picks[0].playerName,
      detectionRule: "Three consecutive selections at the same position; a five-pick rolling window establishes the run and overlapping windows are merged into one maximal episode.",
    });
  }
  start = end + 1;
}

const byOwner = new Map();
draft.picks.forEach((pick) => {
  const owner = pick.canonicalOwnerId;
  byOwner.set(owner, [...(byOwner.get(owner) ?? []), pick]);
});
const teams = [...byOwner.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([ownerId, picks]) => {
  const rosterId = picks[0].rosterId;
  const acquired = draft.tradedPicks.filter((pick) => pick.currentOwnerRosterId === rosterId && pick.currentOwnerRosterId !== pick.originalRosterId).length;
  const tradedAway = draft.tradedPicks.filter((pick) => pick.originalRosterId === rosterId && pick.currentOwnerRosterId !== pick.originalRosterId).length;
  return {
    ownerId,
    pickCount: picks.length,
    rounds: picks.map((pick) => pick.round),
    positionsDrafted: positionCounts(picks),
    capitalContext: { originallyAllocatedPicks: 4, acquiredPicks: acquired, tradedAwayPicks: tradedAway, selectionsMade: picks.length, status: "AVAILABLE" },
    preDraftRoster: null,
    postDraftRoster: null,
    rosterImpact: null,
    grading: null,
  };
});

const historicalDrafts = [2021, 2022, 2023, 2024, 2025].flatMap((season) => readJson(path.join(root, `data/history/drafts/${season}/drafts.json`)).drafts).filter((event) => event.draftType === "rookie");
const tendencyMap = new Map();
historicalDrafts.flatMap((event) => event.picks).forEach((pick) => {
  const owner = pick.canonicalOwnerId;
  tendencyMap.set(owner, [...(tendencyMap.get(owner) ?? []), pick]);
});
const historicalOwnerTendencies = Object.fromEntries([...tendencyMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([ownerId, picks]) => [ownerId, {
  totalPicks: picks.length,
  positionCounts: positionCounts(picks),
  averageRoundByPosition: Object.fromEntries(["QB", "RB", "WR", "TE"].map((position) => {
    const selected = picks.filter((pick) => pick.position === position);
    return [position, selected.length ? Number((selected.reduce((sum, pick) => sum + pick.round, 0) / selected.length).toFixed(2)) : null];
  })),
}]));

const picks = draft.picks.map((pick) => {
  const marketPlayer = marketByPlayer.get(pick.playerId);
  return {
    actualOverallPick: pick.overallPick,
    round: pick.round,
    pickInRound: pick.pickInRound,
    ownerId: pick.canonicalOwnerId,
    playerId: pick.playerId,
    playerName: pick.playerName,
    position: pick.position,
    nflTeam: pick.nflTeam,
    sourceReference: pick.sourceReference,
    marketRank: marketPlayer?.marketRank ?? null,
    marketExpectedPick: null,
    pickDifference: null,
    marketClassification: null,
    marketEvidenceStatus: "BLOCKED",
    nflDraftCapital: { round: null, overallPick: null, source: null, status: "BLOCKED" },
    opportunityCost: { topAvailableMarketPlayers: [], bestAvailableMarketGap: null, status: "BLOCKED" },
  };
});

const artifact = {
  schemaVersion: 1,
  methodologyVersion: "rookie-draft-intelligence-slice-a-v1",
  status: "BLOCKED",
  generatedAt: new Date().toISOString(),
  season: 2026,
  draftId: draft.draftId,
  draftDate,
  evaluationCutoff: draftDate,
  dataFlow: ["CANONICAL_DRAFT_DATA", "OWNER_MAPPING", "PLAYER_METADATA", "INTELLIGENCE_ENGINE"],
  canonicalDraft: { expectedPicks: 48, actualPicks: draft.picks.length, uniqueOwners: new Set(draft.picks.map((pick) => pick.canonicalOwnerId)).size, rounds: draft.rounds, verificationStatus: draft.verificationStatus, sourceReference: "data/history/drafts/2026/drafts.json" },
  format: { teams: 12, dynasty: true, quarterbackFormat: "1QB", scoringContext: "NON_TEP", lineupSlots: ["QB1", "RB1", "RB2", "WR1", "WR2", "WR3", "TE1", "FLEX1", "FLEX2", "K1", "DST1"], rookieRounds: draft.rounds, sourceReferences: ["data/source/market/dynasty-rookie/2026/snapshots/2026-08-19/provenance.json", "lib/history/expectedLineup.ts"] },
  marketReference: { source: market.source, snapshotDate: market.snapshotDate, timingClassification: market.timingClassification, daysFromDraft: marketDaysFromDraft, format: market.format, playerCount: market.players.length, resolvedPickCount: draft.picks.filter((pick) => marketByPlayer.has(pick.playerId)).length, tiersAvailable: false, adpAvailable: market.players.some((player) => typeof player.adpOverall === "number"), usableForDraftDayGrading: false, reason: "The only registered market snapshot is post-draft/preseason and cannot judge what was knowable at the draft cutoff." },
  rosterEvidence: { preDraft: { coverage: 0, source: null, confidence: "NONE" }, postDraft: { coverage: 0, source: null, confidence: "NONE" }, currentRosterExcluded: true, reason: "Available 2026 roster files are not timestamped to the draft boundary and are not used as pre- or post-draft evidence." },
  playerMetadata: { resolvedPlayers: draft.picks.filter((pick) => players[pick.playerId]).length, totalPicks: draft.picks.length, stableBirthDateCoverage: draft.picks.filter((pick) => players[pick.playerId]?.birth_date).length, sourceReference: "data/history/matchups/sleeper/players.json", cutoffSafeForRoleOrTeamContext: false },
  picks,
  teams,
  positionRuns,
  tierRuns: { status: "BLOCKED", reason: "The registered market source provides no supported tiers and is not draft-cutoff valid." },
  historicalOwnerTendencies,
  gradingArchitecture: { status: "DESIGN_ONLY", components: ["MARKET_VALUE", "ROSTER_FIT", "LONG_TERM_UPSIDE", "DRAFT_CAPITAL_EFFICIENCY", "OPPORTUNITY_COST", "CLASS_COHERENCE"], recommendedWeights: { marketValue: 0.25, rosterFit: 0.2, longTermUpside: 0.2, capitalEfficiency: 0.15, opportunityCost: 0.1, classCoherence: 0.1 }, immediateImpactTreatment: "Display separately from long-term dynasty outlook; do not combine until cutoff-safe role evidence exists.", falsePrecisionTreatment: "Use integer component grades or letter bands only after evidence coverage is approved; never publish unsupported decimal precision.", humorGuardrail: "NO_FACT_NO_ROAST" },
  sourceGaps: [`No pre-draft market snapshot exists on or before ${draftDate}.`, `The registered market snapshot is ${marketDaysFromDraft} days after draft start and explicitly POST_DRAFT_PRESEASON.`, "No supported market tiers are available.", "No timestamped pre-draft or immediate post-draft 2026 roster snapshot is available.", "No canonical NFL Draft round/overall-pick dataset is available for these players.", "The player registry is current and not cutoff-safe for role/team context."],
};

const outputPath = path.join(root, "data/current/draft-intelligence/2026.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
