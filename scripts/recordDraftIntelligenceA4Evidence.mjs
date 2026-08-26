import fs from "node:fs";

const artifactPath = "data/current/draft-intelligence/2026.json";
const board = JSON.parse(fs.readFileSync("data/source/market/dynasty-rookie/2026/a4-market-board.json", "utf8"));
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const players = JSON.parse(fs.readFileSync("data/history/matchups/sleeper/players.json", "utf8"));
const normalize = (name) => name.toLowerCase().replace(/[’'.-]/g, "").replace(/\b(jr|ii|iii)\b/g, "").replace(/[^a-z0-9]/g, "");
const registry = new Map(Object.values(players).filter((player) => player.full_name).map((player) => [normalize(player.full_name), player]));
const eligibleSources = board.sources.filter((source) => ["PLAYER_RANKING"].includes(source.sourceType));
const sourceRankMap = new Map();
const sourceTierMap = new Map();
const providerRows = new Map();
for (const source of eligibleSources) {
  const rows = source.rows.map((name, index) => ({ name, rank: index + 1 }));
  providerRows.set(source.sourceId, rows);
  for (const row of rows) {
    const key = normalize(row.name);
    if (!sourceRankMap.has(key)) sourceRankMap.set(key, []);
    sourceRankMap.get(key).push({ sourceId: source.sourceId, rank: row.rank, role: source.role, name: row.name });
  }
  if (source.tierRanges) {
    const tiers = new Map();
    for (const range of source.tierRanges) for (let rank = range.start; rank <= range.end; rank += 1) tiers.set(rank, range.tier);
    sourceTierMap.set(source.sourceId, tiers);
  }
}
const marketRecord = (name) => {
  const ranks = sourceRankMap.get(normalize(name)) ?? [];
  const values = ranks.map((entry) => entry.rank).sort((a, b) => a - b);
  const median = values.length ? values[Math.floor(values.length / 2)] : null;
  const mean = values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : null;
  const confidence = values.length >= 3 ? "HIGH" : values.length === 2 ? "MEDIUM" : values.length === 1 ? "LOW" : "UNRANKED";
  return {
    rankBySource: Object.fromEntries(ranks.map((entry) => [entry.sourceId, entry.rank])),
    marketMedianRank: median,
    marketMeanRank: mean,
    marketLowRank: values[0] ?? null,
    marketHighRank: values.at(-1) ?? null,
    marketSourceCount: values.length,
    marketConfidence: confidence
  };
};
const threshold = (round, delta) => {
  const absolute = Math.abs(delta);
  if (round === 1) return absolute >= 6 ? "CLEAR" : absolute >= 3 ? "POSSIBLE" : "FAIR";
  if (round === 2) return absolute >= 8 ? "CLEAR" : absolute >= 4 ? "POSSIBLE" : "FAIR";
  return absolute >= 12 ? "CLEAR" : absolute >= 6 ? "POSSIBLE" : "FAIR";
};
const classify = (pick, market) => {
  if (market.marketMedianRank === null || market.marketConfidence === "LOW" || market.marketConfidence === "UNRANKED") return "MARKET UNCERTAIN";
  const delta = pick.actualOverallPick - market.marketMedianRank;
  const signal = threshold(pick.round, delta);
  if (signal === "FAIR") return "FAIR VALUE";
  const wide = market.marketHighRank - market.marketLowRank >= 20;
  if (wide && Math.abs(delta) < (pick.round === 1 ? 6 : pick.round === 2 ? 8 : 12)) return "MARKET UNCERTAIN";
  if (delta > 0) return `${signal} VALUE`;
  return `${signal} REACH`;
};
const allMarketPlayers = [...sourceRankMap.entries()].map(([key, ranks]) => {
  const market = marketRecord(ranks[0].name ?? key);
  const registryPlayer = registry.get(key);
  return { key, player: ranks[0].name, position: registryPlayer?.position ?? null, ...market };
}).sort((a, b) => (a.marketMedianRank ?? 999) - (b.marketMedianRank ?? 999));
const selectedKeys = new Set();
const opportunityByPick = [];
const tierFor = (sourceId, rank) => sourceTierMap.get(sourceId)?.get(rank) ?? null;
for (const pick of artifact.picks) {
  const market = marketRecord(pick.playerName);
  const classification = classify(pick, market);
  const available = allMarketPlayers.filter((player) => !selectedKeys.has(player.key) && player.key !== normalize(pick.playerName));
  const topThree = available.slice(0, 3).map((player) => ({ rank: player.marketMedianRank, player: player.player, position: player.position, confidence: player.marketConfidence, sourceCount: player.marketSourceCount }));
  const samePosition = available.filter((player) => player.position === pick.position);
  const providerTiers = Object.fromEntries([...sourceTierMap.entries()].map(([sourceId, tiers]) => { const sourceRank = market.rankBySource[sourceId]; return [sourceId, sourceRank ? { rank: sourceRank, tier: tiers.get(sourceRank) ?? null } : null]; }).filter(([, value]) => value));
  const rotoTier = providerTiers["rotoballer-2026-05-13-top-100"]?.tier ?? null;
  const highestRemainingRoto = available.find((player) => tierFor("rotoballer-2026-05-13-top-100", player.rankBySource?.["rotoballer-2026-05-13-top-100"]));
  pick.providerRanks = market.rankBySource;
  pick.marketRank = market.marketMedianRank;
  pick.marketMedianRank = market.marketMedianRank;
  pick.marketMeanRank = market.marketMeanRank;
  pick.marketLowRank = market.marketLowRank;
  pick.marketHighRank = market.marketHighRank;
  pick.marketSourceCount = market.marketSourceCount;
  pick.marketConfidence = market.marketConfidence;
  pick.marketDifference = market.marketMedianRank === null ? null : pick.actualOverallPick - market.marketMedianRank;
  pick.marketClassification = classification;
  pick.marketEvidenceStatus = market.marketConfidence;
  pick.opportunityCost = { status: market.marketMedianRank === null ? "BLOCKED" : "READY", topThreeRemaining: topThree, bestRemainingSamePosition: samePosition[0] ? { rank: samePosition[0].marketMedianRank, player: samePosition[0].player, position: samePosition[0].position, confidence: samePosition[0].marketConfidence } : null };
  pick.providerTiers = providerTiers;
  pick.tierOpportunityCost = { provider: "RotoBaller", selectedTier: rotoTier, higherTierPlayersRemain: available.some((player) => { const rank = player.rankBySource?.["rotoballer-2026-05-13-top-100"]; return rank && tierFor("rotoballer-2026-05-13-top-100", rank) < rotoTier; }), highestRemainingRoto: highestRemainingRoto?.player ?? null };
  selectedKeys.add(normalize(pick.playerName));
  opportunityByPick.push({ pick: pick.actualOverallPick, ownerId: pick.ownerId, player: pick.playerName, ...pick.opportunityCost });
}
const count = (predicate) => artifact.picks.filter(predicate).length;
const roundCoverage = (round) => ({ total: artifact.picks.filter((pick) => pick.round === round).length, usable: artifact.picks.filter((pick) => pick.round === round && ["HIGH", "MEDIUM"].includes(pick.marketConfidence)).length, anyEvidence: artifact.picks.filter((pick) => pick.round === round && pick.marketConfidence !== "UNRANKED").length });
const run = artifact.positionRuns.find((entry) => entry.startPick === 12 && entry.endPick === 17);
artifact.methodologyVersion = "rookie-draft-intelligence-slice-a4-v1";
artifact.status = "READY_WITH_ROSTER_FIT_EXCLUSION";
artifact.rosterFitGradeAvailable = false;
artifact.rosterFitExclusionReason = "No trustworthy cutoff-safe May 29 pre-draft roster boundary or complete offseason transaction history exists; roster fit is excluded from the formal 2026 class grade.";
artifact.marketAtDraft = { sourceManifest: "data/source/market/dynasty-rookie/2026/source-manifest.json", boardArtifact: "data/source/market/dynasty-rookie/2026/a4-market-board.json", cutoffSafePrimarySource: true, consensusReady: true, gradingReady: true, status: "READY_WITH_ROSTER_FIT_EXCLUSION", providerCount: eligibleSources.length, coverage: { round1: roundCoverage(1), round2: roundCoverage(2), round3: roundCoverage(3), round4: roundCoverage(4), totalMarketEvidence: count((pick) => pick.marketConfidence !== "UNRANKED"), high: count((pick) => pick.marketConfidence === "HIGH"), medium: count((pick) => pick.marketConfidence === "MEDIUM"), low: count((pick) => pick.marketConfidence === "LOW"), unranked: count((pick) => pick.marketConfidence === "UNRANKED") }, medianConvention: "marketMedianRank is the median of captured eligible provider ranks; omitted rows are not imputed.", marketDifferenceConvention: "actualOverallPick - marketMedianRank; positive is VALUE and negative is REACH" };
artifact.marketThresholds = { round1: { fair: "0–2", possible: "3–5", clear: "6+" }, round2: { fair: "0–3", possible: "4–7", clear: "8+" }, rounds3to4: { fair: "0–5", possible: "6–11", clear: "12+" }, wideDispersionRule: "A wide provider range suppresses a strong label unless the round threshold is exceeded." };
artifact.opportunityCost = { status: "READY_FOR_EVIDENCE_ONLY", fields: ["topThreeRemaining", "bestRemainingSamePosition"], byPick: opportunityByPick };
artifact.tierEvidence = { status: "READY_PROVIDER_SEPARATE", provider: "RotoBaller", tierRanges: board.sources.find((source) => source.sourceId === "rotoballer-2026-05-13-top-100").tierRanges, syntheticConsensusTiers: false };
artifact.positionRunMarketEnrichment = run ? { position: run.position, startPick: run.startPick, endPick: run.endPick, picks: artifact.picks.filter((pick) => pick.actualOverallPick >= run.startPick && pick.actualOverallPick <= run.endPick).map((pick) => ({ actualPick: pick.actualOverallPick, player: pick.playerName, marketMedianRank: pick.marketMedianRank, marketDifference: pick.marketDifference, marketClassification: pick.marketClassification, confidence: pick.marketConfidence, rotoTier: pick.providerTiers["rotoballer-2026-05-13-top-100"]?.tier ?? null })) } : null;
artifact.gradingInputs = { marketValue: "READY", nflCapitalLongTermUpside: "READY", draftCapitalEfficiency: "READY", opportunityCost: "READY_WHERE_MARKET_EXISTS", positionTierBehavior: "READY", historicalOwnerPatterns: "READY", rosterFit: "NOT_GRADED", classCoherence: "SLICE_B_REDESIGN_REQUIRED" };
artifact.sourceGaps = ["RotoBaller and Sports Illustrated are dynasty boards without an explicit 1QB label; both are retained with accurate roles rather than falsely labeled 1QB.", "Late-round source disagreement and single-source coverage remain uncertainty, especially for fourth-round selections.", "No trustworthy cutoff-safe pre-draft roster boundary exists; roster fit is permanently excluded from the formal 2026 class grade.", "August Fantasy Orphans market remains a separate since-draft lens."];
artifact.finalMarketBoard = { providerRanks: "Preserved on every pick in providerRanks.", providerTiers: "Preserved on every pick in providerTiers; RotoBaller tiers remain provider-specific.", consensus: "Median of eligible cutoff-safe player-ranking sources.", noImputedRanks: true };
fs.writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({ status: artifact.status, coverage: artifact.marketAtDraft.coverage, rosterFitGradeAvailable: artifact.rosterFitGradeAvailable }, null, 2));
