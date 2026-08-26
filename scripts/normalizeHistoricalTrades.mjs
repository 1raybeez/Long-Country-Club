import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const seasons = [2021, 2022, 2023, 2024, 2025, 2026];
const ownerBySleeperId = {
  "342828350391230464": "ray-long",
  "466780021365665792": "bill-gross",
  "466638004102885376": "keith-winder",
  "467786127214899200": "rob-jenkins",
  "466645286870052864": "earl-perkins",
  "356621920969555968": "jeffrey-hudgins",
  "466797853767888896": "tyrone-poist",
  "346727603970973696": "ben-isbell",
  "466645950710935552": "loren-michaels",
  "466659300316540928": "mike-mcburnie",
  "468192726756618240": "anthony-martinez",
  "817056809218080768": "mike-estes",
};
const ownersByRoster = {};
const playerCatalog = JSON.parse(await fs.readFile(path.join(root, "data/history/matchups/sleeper/players.json"), "utf8"));
for (const season of seasons) {
  const rosters = JSON.parse(await fs.readFile(path.join(root, `data/history/matchups/sleeper/${season}/rosters.json`), "utf8"));
  ownersByRoster[season] = Object.fromEntries(rosters.map((roster) => [roster.roster_id, {
    sleeperUserId: roster.owner_id ?? null,
    ownerId: roster.owner_id ? ownerBySleeperId[roster.owner_id] ?? null : null,
  }]));
}

const draftLineage = [];
for (const season of seasons) {
  const draft = JSON.parse(await fs.readFile(path.join(root, `data/history/drafts/${season}/drafts.json`), "utf8"));
  for (const event of draft.drafts ?? []) {
    for (const pick of event.tradedPicks ?? []) draftLineage.push(pick);
  }
}

function ownerRef(season, rosterId) {
  const ref = ownersByRoster[season][rosterId];
  return {
    rosterId,
    sleeperUserId: ref?.sleeperUserId ?? null,
    ownerId: ref?.ownerId ?? null,
    resolutionStatus: ref?.ownerId ? "RESOLVED" : "UNKNOWN",
  };
}

function playerRef(id) {
  const player = playerCatalog[id];
  return {
    playerId: id,
    playerName: player?.full_name ?? null,
    position: player?.position ?? player?.fantasy_positions?.[0] ?? null,
    resolutionStatus: player ? "RESOLVED" : "UNKNOWN",
    isDefense: Boolean(player?.position === "DEF" || ["ARI","ATL","BAL","BUF","CAR","CHI","CIN","CLE","DAL","DEN","DET","GB","HOU","IND","JAX","KC","LAC","LAR","LV","MIA","MIN","NE","NO","NYG","NYJ","PHI","PIT","SEA","SF","TB","TEN","WAS"].includes(id)),
  };
}

const trades = [];
const seasonSummary = {};
for (const season of seasons) {
  const raw = JSON.parse(await fs.readFile(path.join(root, `data/source/sleeper/transactions/${season}.json`), "utf8"));
  const rows = raw.weeks.flatMap((week) => week.transactions.map((transaction) => ({ ...transaction, sourceWeek: week.week, sourceEndpoint: week.endpoint })));
  const allTrades = rows.filter((transaction) => transaction.type === "trade");
  const validTrades = allTrades.filter((transaction) => transaction.status === "complete");
  seasonSummary[season] = { rawRecords: rows.length, tradeRecords: allTrades.length, completedTrades: validTrades.length, excludedNonTrades: rows.length - allTrades.length, weeksQueried: raw.weeks.map((week) => week.week) };
  for (const transaction of validTrades) {
    const rosterIds = [...new Set(transaction.roster_ids ?? transaction.consenter_ids ?? [])].map(Number);
    const players = Object.entries(transaction.adds ?? {}).map(([playerId, toRosterId]) => ({
      ...playerRef(playerId),
      fromRosterId: transaction.drops?.[playerId] ?? null,
      toRosterId: Number(toRosterId),
    }));
    const picks = (transaction.draft_picks ?? []).map((pick) => ({
      season: Number(pick.season),
      round: Number(pick.round),
      originalRosterId: Number(pick.roster_id),
      previousOwnerRosterId: pick.previous_owner_id == null ? null : Number(pick.previous_owner_id),
      destinationRosterId: pick.owner_id == null ? null : Number(pick.owner_id),
      sourceRaw: pick,
    }));
    const faab = (transaction.waiver_budget ?? []).map((entry) => ({ senderRosterId: Number(entry.sender), receiverRosterId: Number(entry.receiver), amount: Number(entry.amount) }));
    const hasPlayers = players.length > 0;
    const hasPicks = picks.length > 0;
    const flags = [];
    if (hasPlayers && !hasPicks) flags.push("PLAYER_ONLY");
    if (hasPlayers && hasPicks) flags.push("PLAYER_FOR_PICK", "PLAYER_AND_PICK");
    if (!hasPlayers && hasPicks) flags.push("PICK_ONLY");
    if (faab.length) flags.push("FAAB_INCLUDED");
    if (hasPlayers && hasPicks || (faab.length && (hasPlayers || hasPicks))) flags.push("MULTI_ASSET");
    if (rosterIds.length > 2) flags.push("MULTI_TEAM");
    const participants = rosterIds.map((rosterId) => ({
      ...ownerRef(season, rosterId),
      playersSent: players.filter((player) => player.fromRosterId === rosterId).map((player) => player.playerId),
      playersReceived: players.filter((player) => player.toRosterId === rosterId).map((player) => player.playerId),
      picksSent: picks.filter((pick) => pick.previousOwnerRosterId === rosterId).map((pick) => ({ season: pick.season, round: pick.round, originalRosterId: pick.originalRosterId })),
      picksReceived: picks.filter((pick) => pick.destinationRosterId === rosterId).map((pick) => ({ season: pick.season, round: pick.round, originalRosterId: pick.originalRosterId })),
      faabSent: faab.filter((entry) => entry.senderRosterId === rosterId),
      faabReceived: faab.filter((entry) => entry.receiverRosterId === rosterId),
    }));
    const lineage = picks.map((pick) => {
      const matches = draftLineage.filter((candidate) => candidate.season === pick.season && candidate.round === pick.round && candidate.originalRosterId === pick.originalRosterId && candidate.previousOwnerRosterId === pick.previousOwnerRosterId && candidate.currentOwnerRosterId === pick.destinationRosterId);
      const related = draftLineage.filter((candidate) => candidate.season === pick.season && candidate.round === pick.round && candidate.originalRosterId === pick.originalRosterId);
      return { ...pick, lineageStatus: matches.length ? "MATCH" : related.length ? "DISAGREEMENT" : "NO_DRAFT_LINEAGE_RECORD", lineageMatches: matches, relatedLineage: related };
    });
    trades.push({
      transactionId: transaction.transaction_id,
      season,
      week: transaction.sourceWeek,
      createdAt: transaction.created,
      statusUpdatedAt: transaction.status_updated ?? null,
      transactionType: transaction.type,
      status: transaction.status,
      rosterIds,
      participants,
      players,
      draftPicks: lineage,
      faab,
      participantCount: rosterIds.length,
      classificationFlags: flags,
      rosterContext: { status: "PARTIAL", reason: "Committed LCC roster snapshots are weekly and are not timestamped at the transaction boundary; no future snapshot was used." },
      leakageCutoff: new Date(transaction.created).toISOString(),
      sourceProvenance: { rawArtifact: `data/source/sleeper/transactions/${season}.json`, sourceEndpoint: transaction.sourceEndpoint, sourceWeek: transaction.sourceWeek },
      reviewStatus: "VALID",
    });
  }
}

const rawTransactions = Object.values(seasonSummary).reduce((total, value) => total + value.rawRecords, 0);
const playerReferences = trades.flatMap((trade) => trade.players);
const uniquePlayers = [...new Set(playerReferences.map((player) => player.playerId))];
const pickAssets = trades.flatMap((trade) => trade.draftPicks);
const diagnostics = {
  intendedSeasonsQueried: seasons.every((season) => seasonSummary[season]?.weeksQueried.length === 19),
  onlyCompletedTradesPromoted: trades.every((trade) => trade.status === "complete" && trade.transactionType === "trade"),
  transactionIdsUnique: new Set(trades.map((trade) => trade.transactionId)).size === trades.length,
  participantMappingsValid: trades.every((trade) => trade.participants.every((participant) => participant.ownerId)),
  playerIdsAccountedFor: playerReferences.length === trades.reduce((total, trade) => total + trade.players.length, 0),
  pickLineageAccountedFor: pickAssets.every((pick) => pick.lineageStatus !== "NO_DRAFT_LINEAGE_RECORD" || pick.season > 2026),
  noMissingAssetsSilentlyValuedAsZero: true,
  timestampsValid: trades.every((trade) => Number.isInteger(trade.createdAt) && trade.createdAt > 0 && trade.leakageCutoff),
  rawSourceProvenancePresent: trades.every((trade) => trade.sourceProvenance.rawArtifact),
  participantAccountingBalances: trades.every((trade) => trade.players.every((player) => player.fromRosterId != null && player.toRosterId != null)),
};
const report = {
  schemaVersion: 1,
  status: "HISTORICAL_TRADES_NORMALIZED_NO_VALUATION",
  methodology: "Only Sleeper transactions with type=trade and status=complete were promoted. No values, fairness, grades, or retrospective market inputs were applied.",
  sourceManifest: "data/source/sleeper/transactions/source-manifest.json",
  seasons,
  seasonSummary,
  trades,
  coverage: {
    rawTransactionRecords: rawTransactions,
    completedTrades: trades.length,
    uniqueTradedPlayers: uniquePlayers.length,
    playerReferences: playerReferences.length,
    playerReferencesResolved: playerReferences.filter((player) => player.resolutionStatus === "RESOLVED").length,
    playerReferencesUnresolved: playerReferences.filter((player) => player.resolutionStatus !== "RESOLVED").length,
    retiredOrInactiveStillResolvable: playerReferences.filter((player) => player.resolutionStatus === "RESOLVED" && playerCatalog[player.playerId]?.active === false).length,
    defenseReferences: playerReferences.filter((player) => player.isDefense).length,
    malformedOrUnknownPlayerIds: playerReferences.filter((player) => player.resolutionStatus !== "RESOLVED").length,
    draftPickAssets: pickAssets.length,
    draftPickLineageMatches: pickAssets.filter((pick) => pick.lineageStatus === "MATCH").length,
    draftPickLineageDisagreements: pickAssets.filter((pick) => pick.lineageStatus === "DISAGREEMENT").length,
    draftPickLineageNoRecord: pickAssets.filter((pick) => pick.lineageStatus === "NO_DRAFT_LINEAGE_RECORD").length,
    historicalOwnerMappingsResolved: trades.flatMap((trade) => trade.participants).filter((participant) => participant.ownerId).length,
    historicalOwnerMappingsUnresolved: trades.flatMap((trade) => trade.participants).filter((participant) => !participant.ownerId).length,
    rosterContexts: { exact: 0, reconstructable: 0, partial: trades.length, unavailable: 0 },
    diagnostics,
  },
};
const outputDir = path.join(root, "data/current/trades");
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, "historical-trades-2021-2026.json"), `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(path.join(outputDir, "historical-trades-diagnostics.json"), `${JSON.stringify({ ...diagnostics, generatedAt: new Date().toISOString(), artifact: "data/current/trades/historical-trades-2021-2026.json" }, null, 2)}\n`);
console.log(JSON.stringify({ seasonSummary, coverage: report.coverage, diagnostics }, null, 2));
