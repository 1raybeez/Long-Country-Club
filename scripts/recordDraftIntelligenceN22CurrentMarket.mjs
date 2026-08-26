import fs from "node:fs";

const artifactPath = "data/current/draft-intelligence/2026.json";
const preservedPath = "data/current/draft-intelligence/2026-draft-day-evidence-a4.json";
const currentMarketPath = "data/source/market/dynasty-rookie/2026/current-market-2026-08-25.json";
const fantasyOrphansPath = "data/source/market/dynasty-rookie/2026/snapshots/2026-08-19/provenance.json";
const rosterPath = "data/current/rosters/2026.json";
const playerPath = "data/history/matchups/sleeper/players.json";
const current = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
if (!fs.existsSync(preservedPath)) fs.writeFileSync(preservedPath, `${JSON.stringify(current, null, 2)}\n`);
const market = JSON.parse(fs.readFileSync(currentMarketPath, "utf8"));
const fantasyOrphans = JSON.parse(fs.readFileSync(fantasyOrphansPath, "utf8"));
const rosters = JSON.parse(fs.readFileSync(rosterPath, "utf8"));
const players = JSON.parse(fs.readFileSync(playerPath, "utf8"));
const ownerNames = { "anthony-martinez": "Anthony Martinez", "ben-isbell": "Ben Isbell", "bill-gross": "Bill Gross", "dan-lowery": "Dan Lowery", "earl-perkins": "Earl Perkins", "jeffrey-hudgins": "Jeffrey Hudgins", "keith-winder": "Keith Winder", "loren-michaels": "Loren Michaels", "mike-estes": "Mike Estes", "mike-mcburnie": "Mike McBurnie", "ray-long": "Ray Long", "rob-jenkins": "Rob Jenkins", "tyrone-poist": "Tyrone Poist" };
const normalize = (name) => name.toLowerCase().replace(/[’'.-]/g, "").replace(/\b(jr|ii|iii)\b/g, "").replace(/[^a-z0-9]/g, "");
const registry = new Map(Object.values(players).filter((player) => player.full_name).map((player) => [normalize(player.full_name), player]));
const pickByName = new Map(current.picks.map((pick) => [normalize(pick.playerName), pick]));
const sourceRanks = new Map();
const addSource = (sourceId, rows, type) => rows.forEach((name, index) => {
  const key = normalize(name);
  if (!sourceRanks.has(key)) sourceRanks.set(key, []);
  sourceRanks.get(key).push({ sourceId, rank: index + 1, type, name });
});
addSource("fptrack-rookie-adp-2026-08-25", market.fptrackRows, "ADP");
addSource("fantasy-orphans-2026-08-19", fantasyOrphans.players.map((player) => player.name), "ADP");
const rankFor = (name) => {
  const ranks = sourceRanks.get(normalize(name)) ?? [];
  const values = ranks.map((entry) => entry.rank).sort((a, b) => a - b);
  return {
    providerRanks: Object.fromEntries(ranks.map((entry) => [entry.sourceId, entry.rank])),
    currentMarketRank: values.length ? values[Math.floor(values.length / 2)] : null,
    marketRange: values.length ? { min: values[0], max: values.at(-1) } : null,
    marketSourceCount: values.length,
    marketConfidence: values.length >= 2 ? "HIGH" : values.length === 1 ? "LOW" : "UNRANKED"
  };
};
const positionFor = (name) => pickByName.get(normalize(name))?.position ?? registry.get(normalize(name))?.position ?? null;
const ageOnDate = (name, date) => {
  const birthDate = registry.get(normalize(name))?.birth_date;
  if (!birthDate) return null;
  return Math.floor((Date.parse(`${date}T00:00:00.000Z`) - Date.parse(`${birthDate}T00:00:00.000Z`)) / (365.2425 * 24 * 60 * 60 * 1000));
};
const classificationFor = (pick, marketRank, confidence) => {
  if (marketRank === null || confidence === "UNRANKED") return "MARKET UNCERTAIN";
  const difference = marketRank - pick.actualOverallPick;
  const absolute = Math.abs(difference);
  const majorBand = pick.round <= 2 ? 10 : 12;
  const signalBand = pick.round <= 2 ? 5 : 6;
  if (absolute < signalBand) return "FAIR VALUE";
  if (difference > 0) return absolute >= majorBand ? "HUGE VALUE" : "VALUE";
  return absolute >= majorBand ? "MAJOR REACH" : "REACH";
};
const allMarketPlayers = [...sourceRanks.entries()].map(([key, ranks]) => {
  const board = rankFor(ranks[0].name);
  return { key, player: ranks[0].name, position: positionFor(ranks[0].name), ...board };
}).sort((a, b) => (a.currentMarketRank ?? 999) - (b.currentMarketRank ?? 999));
const selectedKeys = new Set();
const actualByKey = new Map(current.picks.map((pick) => [normalize(pick.playerName), pick]));
const currentPicks = current.picks.map((pick) => {
  const board = rankFor(pick.playerName);
  const currentMarketRank = board.currentMarketRank;
  const pickDifference = currentMarketRank === null ? null : currentMarketRank - pick.actualOverallPick;
  const available = allMarketPlayers.filter((player) => !selectedKeys.has(player.key) && player.key !== normalize(pick.playerName));
  const topAvailable = available.slice(0, 3).map((player) => ({ player: player.player, position: player.position, rank: player.currentMarketRank, confidence: player.marketConfidence, sources: player.marketSourceCount, laterLccPick: actualByKey.get(player.key)?.actualOverallPick ?? null, laterOwnerId: actualByKey.get(player.key)?.ownerId ?? null }));
  const samePosition = available.find((player) => player.position === pick.position);
  const classification = classificationFor(pick, currentMarketRank, board.marketConfidence);
  const record = {
    ...pick,
    ageAtLccDraft: ageOnDate(pick.playerName, "2026-05-29"),
    currentAge: registry.get(normalize(pick.playerName))?.age ?? null,
    marketRank: currentMarketRank,
    marketSources: Object.keys(board.providerRanks),
    marketRankBySource: board.providerRanks,
    marketEvidenceStatus: board.marketConfidence,
    providerRanks: board.providerRanks,
    currentMarketRank,
    marketRange: board.marketRange,
    marketSourceCount: board.marketSourceCount,
    marketConfidence: board.marketConfidence,
    pickDifference,
    pickDifferenceConvention: "currentMarketRank - actualOverallPick; positive is VALUE and negative is REACH",
    marketClassification: classification,
    opportunityCost: { status: currentMarketRank === null ? "BLOCKED_UNRANKED" : "READY", topThreeAvailable: topAvailable, bestSamePositionAvailable: samePosition ? { player: samePosition.player, rank: samePosition.currentMarketRank, confidence: samePosition.marketConfidence } : null }
  };
  selectedKeys.add(normalize(pick.playerName));
  return record;
});
const count = (predicate) => currentPicks.filter(predicate).length;
const roundCoverage = (round) => ({ total: currentPicks.filter((pick) => pick.round === round).length, withEvidence: currentPicks.filter((pick) => pick.round === round && pick.currentMarketRank !== null).length, highConfidence: currentPicks.filter((pick) => pick.round === round && pick.marketConfidence === "HIGH").length, unranked: currentPicks.filter((pick) => pick.round === round && pick.currentMarketRank === null).length });
const rosterByOwner = Object.fromEntries(rosters.rosters.map((roster) => {
  const taxi = new Set(roster.taxi ?? []);
  const reserve = new Set(roster.reserve ?? []);
  const positionCounts = { QB: 0, RB: 0, WR: 0, TE: 0 };
  const rookieIds = new Set(currentPicks.map((pick) => pick.playerId));
  let rookieSelectionsRostered = 0;
  for (const id of roster.players ?? []) {
    const player = players[id];
    const position = player?.position;
    if (position in positionCounts) positionCounts[position] += 1;
    if (rookieIds.has(id)) rookieSelectionsRostered += 1;
  }
  return [roster.ownerId, { ownerId: roster.ownerId, capturedAt: rosters.capturedAt, playerCount: roster.players?.length ?? 0, taxiCount: taxi.size, reserveCount: reserve.size, positionCounts, rookieSelectionsRostered }];
}));
const ownerProfiles = Object.fromEntries(Object.keys(ownerNames).map((ownerId) => {
  const picks = currentPicks.filter((pick) => pick.ownerId === ownerId);
  const ranked = picks.filter((pick) => pick.pickDifference !== null);
  const values = ranked.filter((pick) => pick.pickDifference > 0).sort((a, b) => b.pickDifference - a.pickDifference);
  const reaches = ranked.filter((pick) => pick.pickDifference < 0).sort((a, b) => a.pickDifference - b.pickDifference);
  const positionCounts = Object.fromEntries(["QB", "RB", "WR", "TE"].map((position) => [position, picks.filter((pick) => pick.position === position).length]));
  return [ownerId, { ownerId, ownerName: ownerNames[ownerId], selectionCount: picks.length, actualSlots: picks.map((pick) => pick.actualOverallPick), positionCounts, currentMarketValueCaptured: ranked.reduce((sum, pick) => sum + (pick.currentMarketRank === null ? 0 : Math.max(0, 101 - pick.currentMarketRank)), 0), averagePickDifference: ranked.length ? Number((ranked.reduce((sum, pick) => sum + pick.pickDifference, 0) / ranked.length).toFixed(2)) : null, bestSelection: values[0]?.playerName ?? null, weakestSelection: reaches[0]?.playerName ?? null, biggestOpportunityCost: picks.sort((a, b) => (a.opportunityCost.topThreeAvailable[0]?.rank ?? 999) - (b.opportunityCost.topThreeAvailable[0]?.rank ?? 999))[0]?.playerName ?? null, currentRosterContext: rosterByOwner[ownerId] ?? null, nflDraftCapital: picks.map((pick) => pick.nflDraftCapital) }];
}));
const runBase = current.positionRuns.find((run) => run.startPick === 12 && run.endPick === 17);
const positionRuns = runBase ? [{ ...runBase, currentMarketEvaluation: currentPicks.filter((pick) => pick.actualOverallPick >= runBase.startPick && pick.actualOverallPick <= runBase.endPick).map((pick) => ({ pick: pick.actualOverallPick, player: pick.playerName, ownerId: pick.ownerId, currentMarketRank: pick.currentMarketRank, pickDifference: pick.pickDifference, classification: pick.marketClassification, confidence: pick.marketConfidence })), interpretation: "Evidence-only: compare current ranks and differences; do not infer historical need or causation." }] : [];
const ranked = currentPicks.filter((pick) => pick.pickDifference !== null);
const values = ranked.filter((pick) => pick.pickDifference > 0).sort((a, b) => b.pickDifference - a.pickDifference);
const reaches = ranked.filter((pick) => pick.pickDifference < 0).sort((a, b) => a.pickDifference - b.pickDifference);
const opportunityCosts = currentPicks.flatMap((pick) => pick.opportunityCost.topThreeAvailable.slice(0, 1).map((alternative) => ({ pick: pick.actualOverallPick, ownerId: pick.ownerId, selectedPlayer: pick.playerName, selectedMarketRank: pick.currentMarketRank, alternativePlayer: alternative.player, alternativeRank: alternative.rank, draftSlotGap: alternative.rank === null ? null : pick.actualOverallPick - alternative.rank, rankGapVsSelected: pick.currentMarketRank === null || alternative.rank === null ? null : pick.currentMarketRank - alternative.rank, alternativeConfidence: alternative.confidence, laterLccPick: alternative.laterLccPick, laterOwnerId: alternative.laterOwnerId }))).filter((entry) => entry.rankGapVsSelected !== null).sort((a, b) => b.rankGapVsSelected - a.rankGapVsSelected);
const previous = JSON.parse(fs.readFileSync(preservedPath, "utf8"));
const movement = currentPicks.map((pick) => { const old = previous.picks.find((candidate) => normalize(candidate.playerName) === normalize(pick.playerName)); return old?.marketMedianRank && pick.currentMarketRank ? { player: pick.playerName, oldRank: old.marketMedianRank, currentRank: pick.currentMarketRank, movement: old.marketMedianRank - pick.currentMarketRank } : null; }).filter(Boolean);
const awardCandidates = { draftChampion: ownerProfiles, bestOverallPick: values.slice(0, 5), bestValue: values.slice(0, 10), biggestSteal: values.filter((pick) => pick.pickDifference >= 10).slice(0, 10), biggestReach: reaches.slice(0, 10), bestLateRoundPick: values.filter((pick) => pick.round >= 3).slice(0, 10), bestDraftCapitalUsage: Object.values(ownerProfiles).sort((a, b) => b.averagePickDifference - a.averagePickDifference).slice(0, 5), worstDraftCapitalUsage: Object.values(ownerProfiles).sort((a, b) => a.averagePickDifference - b.averagePickDifference).slice(0, 5), biggestOpportunityCost: opportunityCosts.slice(0, 10), positionRunInstigator: positionRuns.map((run) => ({ player: run.initiatingSelection, pick: run.startPick, evidence: run.currentMarketEvaluation[0] })), positionRunEscape: values.filter((pick) => pick.actualOverallPick >= 12 && pick.actualOverallPick <= 17).slice(0, 5), mostOnBrand: Object.values(ownerProfiles).sort((a, b) => b.selectionCount - a.selectionCount).slice(0, 5), wtfPick: reaches.filter((pick) => pick.marketConfidence === "HIGH").slice(0, 10) };
const roastHooks = reaches.concat(values).slice(0, 20).map((pick) => ({ ownerId: pick.ownerId, owner: ownerNames[pick.ownerId], fact: `${pick.playerName} was selected at ${pick.actualOverallPick} versus current market rank ${pick.currentMarketRank} (${pick.pickDifference > 0 ? `+${pick.pickDifference}` : pick.pickDifference}).`, whyItIsFunny: pick.pickDifference > 0 ? "The market now sees the pick as a bargain." : "The owner paid ahead of the current market.", confidence: pick.marketConfidence }));
const output = { ...current, schemaVersion: 3, methodologyVersion: "rookie-draft-intelligence-n2.2-current-market-v1", status: "CURRENT_MARKET_INTELLIGENCE_READY_NO_FINAL_GRADES", actualDraftDate: current.draftDate, evaluationDate: "2026-08-25", evaluationMode: "CURRENT_MARKET_RETROSPECTIVE", methodology: "This is a one-time retrospective asking how the 48 selections look using the dynasty market as of the evaluation date. It is not a May 29 draft-day grading exercise. Beginning in 2027, repeat this analysis approximately one week after the LCC draft.", marketReference: { sourceManifest: currentMarketPath, acceptedSources: market.sources, rejectedSources: [{ provider: "FantasyPros", reason: "Current page exposed Half-PPR rankings without an explicit 1QB filter in the captured view; retained as supporting context only." }, { provider: "Dynasty Nerds", reason: "Captured page was position-specific and exposed SF/TEP controls; not used in the primary all-position 1QB consensus." }, { provider: "Fantasy Prophecy", reason: "Current 1QB PPR top-50 was discoverable, but the browser-accessible table was not reproducibly extractable for preservation in this pass." }], primaryFormat: "1QB_DYNASTY_NON_TEP", superflexContamination: false, consensusMethod: "Median of accepted current 1QB sources; missing source rows remain missing." }, rosterEvidence: { current: { source: "data/current/rosters/2026.json", capturedAt: rosters.capturedAt, ownerCount: rosters.rosters.length, status: "CURRENT_CONTEXT_ONLY" }, preDraft: null, postDraft: null, rosterFitGradeAvailable: false, reason: "Current roster context is allowed for retrospective context but does not rewrite historical May need and does not create a formal roster-fit grade." }, picks: currentPicks, teams: current.teams, owners: ownerProfiles, positionRuns, opportunityCosts, awardCandidates, roastHooks, marketMovement: { comparisonSource: preservedPath, comparisonMode: "CURRENT_VS_MAY_EVIDENCE", majorRisers: movement.sort((a, b) => b.movement - a.movement).slice(0, 10), majorFallers: movement.sort((a, b) => a.movement - b.movement).slice(0, 10), stable: movement.filter((entry) => Math.abs(entry.movement) <= 2).slice(0, 10) }, coverage: { allSelections: { total: 48, withEvidence: ranked.length, highConfidence: count((pick) => pick.marketConfidence === "HIGH"), lowConfidence: count((pick) => pick.marketConfidence === "LOW"), unranked: count((pick) => pick.currentMarketRank === null) }, round1: roundCoverage(1), round2: roundCoverage(2), round3: roundCoverage(3), round4: roundCoverage(4) }, blockedFields: ["FINAL_GRADES", "PUBLIC_RECAP", "ROSTER_FIT_FORMAL_GRADE", "TRADE_ANALYZER"], currentMarketDecision: { marketConsensusReady: true, gradingRubricReady: false, currentMarketSufficientForRubric: true, reason: "Current 1QB evidence covers the meaningful early and middle rounds; late-round uncertainty and roster-fit exclusion remain explicit." } };
fs.writeFileSync(artifactPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ status: output.status, coverage: output.coverage, rosterOwners: Object.keys(rosterByOwner).length, awardCandidateGroups: Object.keys(awardCandidates).length, roastHooks: roastHooks.length }, null, 2));
