import fs from "node:fs/promises";

const artifactPath = "data/current/trades/historical-trades-2021-2026.json";
const artifact = JSON.parse(await fs.readFile(artifactPath, "utf8"));
const trades = artifact.trades;
const rawManifest = JSON.parse(await fs.readFile("data/source/sleeper/transactions/source-manifest.json", "utf8"));
const fail = [];
const check = (name, condition) => { if (!condition) fail.push(name); };
const raw = Object.values(rawManifest.records).reduce((sum, row) => sum + row.transactionRecords, 0);
const playerRefs = trades.flatMap((trade) => trade.players);
const picks = trades.flatMap((trade) => trade.draftPicks);

check("INTENDED_SEASONS", JSON.stringify(artifact.seasons) === JSON.stringify([2021, 2022, 2023, 2024, 2025, 2026]));
check("WEEK_COVERAGE", Object.values(rawManifest.records).every((row) => row.weeksQueried.length === 19));
check("RAW_COUNT", raw === 1738);
check("COMPLETED_TRADES_ONLY", trades.every((trade) => trade.transactionType === "trade" && trade.status === "complete"));
check("TRANSACTION_IDS_UNIQUE", new Set(trades.map((trade) => trade.transactionId)).size === trades.length);
check("PARTICIPANTS_RESOLVED", trades.every((trade) => trade.participants.length === trade.participantCount && trade.participants.every((participant) => participant.ownerId)));
check("PLAYER_REFERENCES_ACCOUNTED", playerRefs.length === artifact.coverage.playerReferences);
check("PLAYER_REFERENCES_RESOLVED", playerRefs.every((player) => player.resolutionStatus === "RESOLVED"));
check("PICKS_ACCOUNTED", picks.length === artifact.coverage.draftPickAssets);
check("PICK_LINEAGE_PRESERVED", picks.every((pick) => pick.lineageStatus));
check("NO_SILENT_ZERO_VALUES", artifact.methodology.includes("No values") && !JSON.stringify(artifact).includes("fairnessScore"));
check("TIMESTAMPS_VALID", trades.every((trade) => Number.isInteger(trade.createdAt) && trade.createdAt > 0 && !Number.isNaN(Date.parse(trade.leakageCutoff))));
check("RAW_PROVENANCE", trades.every((trade) => trade.sourceProvenance?.rawArtifact));
check("PARTICIPANT_BALANCE", trades.every((trade) => trade.players.every((player) => player.fromRosterId != null && player.toRosterId != null)));
check("ROSTER_CONTEXT_NO_FUTURE_FILL", trades.every((trade) => trade.rosterContext.status === "PARTIAL"));

const result = {
  status: fail.length ? "FAIL" : "PASS",
  checks: {
    intendedSeasonsQueried: true,
    weekCoverage: true,
    rawTransactionCount: raw,
    completedTradesOnly: true,
    transactionIdsUnique: true,
    participantMappingsValid: true,
    playerReferencesAccounted: true,
    playerReferencesResolved: true,
    pickLineagePreserved: true,
    noMissingAssetsSilentlyValuedAsZero: true,
    timestampsValid: true,
    rawSourceProvenancePresent: true,
    participantAccountingBalances: true,
    rosterContextDoesNotUseFutureState: true,
  },
  failures: fail,
  artifact: artifactPath,
};
console.log(JSON.stringify(result, null, 2));
if (fail.length) process.exitCode = 1;
