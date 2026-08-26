import fs from "node:fs";

const artifactPath = "data/current/draft-intelligence/2026.json";
const board = JSON.parse(fs.readFileSync("data/source/market/dynasty-rookie/2026/a3-market-board.json", "utf8"));
const values = JSON.parse(fs.readFileSync("data/source/market/dynasty-rookie/2026/fantasypros-may-2026-1qb-pick-values.json", "utf8"));
const players = JSON.parse(fs.readFileSync("data/history/matchups/sleeper/players.json", "utf8"));
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const normalize = (name) => name.toLowerCase().replace(/['’.-]/g, "").replace(/\b(jr|ii|iii)\b/g, "").replace(/[^a-z0-9]/g, "");
const playerByName = new Map(Object.values(players).filter((player) => player.full_name).map((player) => [normalize(player.full_name), player]));
const sourceRanks = new Map();
for (const source of board.sources) {
  source.rows.forEach((name, index) => {
    const key = normalize(name);
    if (!sourceRanks.has(key)) sourceRanks.set(key, []);
    sourceRanks.get(key).push({ sourceId: source.sourceId, rank: index + 1 });
  });
}
const marketFor = (name) => {
  const ranks = sourceRanks.get(normalize(name)) ?? [];
  const sorted = ranks.map((entry) => entry.rank).sort((a, b) => a - b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
  return {
    sources: ranks.map((entry) => entry.sourceId),
    rankBySource: Object.fromEntries(ranks.map((entry) => [entry.sourceId, entry.rank])),
    marketMedianRank: median,
    marketRange: sorted.length ? { min: sorted[0], max: sorted[sorted.length - 1] } : null,
    sourceCount: sorted.length,
    confidence: sorted.length >= 3 ? "HIGH" : sorted.length === 2 ? "MEDIUM" : sorted.length === 1 ? "LOW" : "UNRANKED"
  };
};
const bucketFor = (round, pickInRound) => {
  if (round === 1) return `1.${String(pickInRound).padStart(2, "0")}`;
  if (round === 2 || round === 3) return `${round}.${pickInRound <= 4 ? "early" : pickInRound <= 8 ? "mid" : "late"}`;
  if (round === 4) return `4.${pickInRound <= 6 ? "early" : "late"}`;
  return "5.plus";
};
const ownerCapital = new Map();
const ageRows = [];
for (const pick of artifact.picks) {
  const market = marketFor(pick.playerName);
  pick.marketRank = market.marketMedianRank;
  pick.marketRange = market.marketRange;
  pick.marketSourceCount = market.sourceCount;
  pick.marketConfidence = market.confidence;
  pick.marketSources = market.sources;
  pick.marketRankBySource = market.rankBySource;
  pick.marketEvidenceStatus = market.confidence;
  const bucket = bucketFor(pick.round, pick.pickInRound);
  const value = values.values[bucket]?.oneQB ?? null;
  const account = ownerCapital.get(pick.ownerId) ?? { selections: 0, capitalSpent: 0, picks: [] };
  account.selections += 1;
  account.capitalSpent += value ?? 0;
  account.picks.push({ overallPick: pick.actualOverallPick, bucket, oneQBValue: value });
  ownerCapital.set(pick.ownerId, account);
  const player = playerByName.get(normalize(pick.playerName));
  const birthDate = player?.birth_date ?? null;
  const age = birthDate ? Math.floor((Date.parse("2026-05-29T00:00:00.000Z") - Date.parse(`${birthDate}T00:00:00.000Z`)) / (365.2425 * 24 * 60 * 60 * 1000)) : null;
  ageRows.push({ playerId: pick.playerId, playerName: pick.playerName, position: pick.position, birthDate, ageAtDraft: age, status: age === null ? "UNRESOLVED_DOB" : "RESOLVED" });
}
const covered = artifact.picks.filter((pick) => pick.marketRank !== null);
const byRound = (round) => artifact.picks.filter((pick) => pick.round === round && ["HIGH", "MEDIUM"].includes(pick.marketConfidence)).length;
artifact.methodologyVersion = "rookie-draft-intelligence-slice-a3-v1";
artifact.generatedAt = "2026-08-26T00:00:00.000Z";
artifact.marketAtDraft = {
  sourceManifest: "data/source/market/dynasty-rookie/2026/source-manifest.json",
  boardArtifact: "data/source/market/dynasty-rookie/2026/a3-market-board.json",
  cutoffSafePrimarySource: false,
  consensusReady: false,
  gradingReady: false,
  supportingSourceCount: board.sources.length,
  status: "PARTIAL",
  coverage: { round1MediumHigh: byRound(1), round2MediumHigh: byRound(2), round3MediumHigh: byRound(3), round4MediumHigh: byRound(4), totalRankedPlayers: covered.length, high: artifact.picks.filter((pick) => pick.marketConfidence === "HIGH").length, medium: artifact.picks.filter((pick) => pick.marketConfidence === "MEDIUM").length, low: artifact.picks.filter((pick) => pick.marketConfidence === "LOW").length, unranked: artifact.picks.filter((pick) => pick.marketConfidence === "UNRANKED").length },
  reason: "A3 recovers a reproducible partial board from dated sources, but it does not meet the Round 1/Round 2 evidence gates for grading."
};
artifact.pickValueCurve = { source: "data/source/market/dynasty-rookie/2026/fantasypros-may-2026-1qb-pick-values.json", sourceType: "PICK_VALUE_CURVE", format: "1QB_DYNASTY", bucketCount: Object.keys(values.values).length, imported: true, usedForPlayerRanking: false };
artifact.ageAtDraft = { date: "2026-05-29", sourceReference: "data/history/matchups/sleeper/players.json", coverage: ageRows.filter((row) => row.ageAtDraft !== null).length, totalDraftedPlayers: ageRows.length, unresolved: ageRows.filter((row) => row.ageAtDraft === null).map((row) => row.playerName), skillPositionCoverage: ageRows.filter((row) => ["QB", "RB", "WR", "TE"].includes(row.position) && row.ageAtDraft !== null).length, skillPositionAverages: Object.fromEntries(["QB", "RB", "WR", "TE"].map((position) => { const ages = ageRows.filter((row) => row.position === position && row.ageAtDraft !== null).map((row) => row.ageAtDraft); return [position, ages.length ? Number((ages.reduce((sum, age) => sum + age, 0) / ages.length).toFixed(2)) : null]; })), status: ageRows.every((row) => row.ageAtDraft !== null) ? "READY" : "PARTIAL" };
artifact.draftCapitalContext = { sourceReference: artifact.pickValueCurve.source, bucketValues: values.values, ownerAccounts: Object.fromEntries([...ownerCapital.entries()].map(([ownerId, account]) => [ownerId, account])), status: "CONTEXT_ONLY_NO_PLAYER_RETURN_SCORE" };
artifact.reconstructionAudit = { baseline: { source: "data/history/matchups/sleeper/2025/rosters.json", captureTimestamp: null, timestampConfidence: "UNKNOWN", rosterCount: 12, playerCount: 294 }, transactionCoverage: { source: "data/source/sleeper-2026-roster-reconstruction-evidence.json", earliestChecked: "2026-05-15T18:47:22.598Z", cutoff: "2026-05-29T11:54:55.518Z", preDraftRows: 25, coverageStatus: "INCOMPLETE_OR_UNPROVABLE", reason: "The retrieved feed begins after the season baseline boundary cannot be established; no complete offseason feed can be proven." }, invariants: { owners: 12, uniqueOwnership: "NOT_PROVEN", impossibleAddSequence: "NOT_PROVEN", plausibleRosterCounts: "NOT_PROVEN", forwardReconciliation: "NOT_AVAILABLE" }, forwardTarget: "No trustworthy timestamped immediate post-draft roster snapshot is available", mismatchCount: null, preDraftConfidence: "NONE", postDraftConfidence: "NONE", rosterFitEnabled: false };
artifact.diagnosticGates = { draftBoard: "READY", nflCapital: "READY", marketRound1: byRound(1) === 12 ? "READY" : "PARTIAL", marketRound2: byRound(2) >= 10 ? "READY" : "BLOCKED", marketRound3to4: "PARTIAL", pickValueCurve: "READY", preDraftRoster: "BLOCKED", postDraftRoster: "BLOCKED", age: artifact.ageAtDraft.status, opportunityCost: "BLOCKED", positionRuns: "READY", provenance: "PARTIAL", overall: "NOT GRADING READY" };
artifact.status = "BLOCKED";
artifact.sourceGaps = ["A3 recovers dated partial player-ranking and talent-board evidence, but Round 1 and Round 2 market gates remain unmet.", "FantasyPros pick values are imported as a separate 1QB pick-value curve, not player market rank.", "The 2025 baseline has no authoritative capture timestamp.", "The available transaction evidence begins 2026-05-15 and cannot prove complete offseason coverage through the draft cutoff.", "No trustworthy timestamped immediate post-draft 2026 roster snapshot is available.", "Roster-fit metrics remain disabled because reconstruction confidence is NONE.", "Current August market remains a separate since-draft lens and is not used for draft-day grading."];
fs.writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({ status: artifact.status, market: artifact.marketAtDraft.coverage, age: artifact.ageAtDraft, owners: Object.keys(artifact.draftCapitalContext.ownerAccounts).length }, null, 2));
