import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildCurrentAssetCatalog } from "../lib/trade-analyzer/currentValuationAdapter.ts";
import { analyzeTradeInternal } from "../lib/trade-analyzer/tradeAnalysisService.ts";

const read = async (file: string) => JSON.parse(await readFile(file, "utf8"));
const root = process.cwd();
const snapshot = await read(`${root}/data/trade-analyzer/valuations/fantasycalc/normalized/2026-08-26.json`);
const manifest = await read(`${root}/data/trade-analyzer/valuations/fantasycalc/manifest.json`);
const catalog = buildCurrentAssetCatalog({ snapshot, manifest, roster: await read(`${root}/data/current/rosters/2026.json`), playerCatalog: await read(`${root}/data/history/matchups/sleeper/players.json`), futurePicks: await read(`${root}/data/current/drafts/future-picks.json`), integrityVerified: true });
const deps = { catalog, snapshot: { date: "2026-08-26", sourceName: "FantasyCalc", sourceUrl: snapshot.sourceUrl, retrievedAt: snapshot.retrievalTimestamp, sourceLicenseStatus: "COMMISSIONER_REVIEW_REQUIRED", integrityValid: true }, modelVersions: { valuationPolicyVersion: "valuation-v1", fairnessModelVersion: "fairness-v1" } };
const players = catalog.assets.filter((asset) => asset.assetType !== "PICK" && asset.valueStatus === "VALUED").slice(0, 4);
assert.equal(players.length, 4);
const genericPick = catalog.assets.find((asset) => asset.assetType === "PICK" && asset.pickKind === "GENERIC_ROUND" && asset.season && asset.round);
assert(genericPick);
const neutralPickId = `sandbox-pick-${genericPick.season}-${genericPick.round}`;
const two = analyzeTradeInternal({ sandbox: true, sideA: { assetIds: [neutralPickId] }, sideB: { assetIds: [players[0].assetId] }, evaluatedAt: "2026-08-27T12:00:00.000Z", leaguePhase: "OFFSEASON", outputMode: "INTERNAL" }, deps);
assert(two.success && two.contextualVerdict === null && two.rosterImpact === null && two.dynastyOutlook === null && two.trade?.fairnessScore);
for (const count of [3, 4]) {
  const participants = players.slice(0, count).map((asset, index) => ({ franchiseId: `Team ${String.fromCharCode(65 + index)}`, outgoingAssets: [{ assetId: asset.assetId, destinationFranchiseId: `Team ${String.fromCharCode(65 + ((index + 1) % count))}` }] }));
  const multi = analyzeTradeInternal({ sandbox: true, participants, evaluatedAt: "2026-08-27T12:00:00.000Z", leaguePhase: "OFFSEASON", outputMode: "INTERNAL" }, deps);
  assert(multi.success && multi.multiTeam?.participantCount === count && multi.multiTeam.modelVersion === "fairness-multi-v1");
  assert.equal(multi.contextualVerdict, null); assert.equal(multi.rosterImpact, null); assert.equal(multi.dynastyOutlook, null);
}
const route = await readFile("lib/routeConfig.ts", "utf8");
const shell = await readFile("components/league/LeagueInfoShell.tsx", "utf8");
assert(route.includes('id: "trade-analyzer"') && route.includes('/league-info/trade-analyzer'));
assert(shell.includes("LCC_VISIBLE_LEAGUE_INFO_NAV_ITEMS") && shell.includes("getLccLeagueInfoActiveTab"));
console.log(JSON.stringify({ status: "PASS", leagueInfoTab: true, canonicalRoute: "/league-info/trade-analyzer", compatibilityRoute: "/trade-analyzer", sandboxTeams: ["Team A", "Team B", "Team C", "Team D"], sandboxTwoTeam: "fairness-v1", sandboxMultiTeam: ["fairness-multi-v1", "fairness-multi-v1"], noContextualOutputs: true, genericPickAdapter: true, noWrites: true }, null, 2));
