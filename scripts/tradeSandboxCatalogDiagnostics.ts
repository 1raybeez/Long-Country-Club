import assert from "node:assert/strict";
import { getTradeAnalyzerRuntime } from "../lib/trade-analyzer/tradeAnalyzerRuntime.ts";

const runtime = await getTradeAnalyzerRuntime();
const sandboxCatalog = runtime.sandboxCatalog;
assert.ok(sandboxCatalog, "production runtime supplies a Sandbox catalog");
const sandboxPlayers = sandboxCatalog.assets.filter((asset) => asset.assetType !== "PICK");
const sandboxPicks = sandboxCatalog.assets.filter((asset) => asset.assetType === "PICK");
const currentPlayerIds = new Set(runtime.catalog.assets.filter((asset) => asset.assetType !== "PICK").map((asset) => asset.assetId));

assert.equal(runtime.snapshot.date, "2026-08-26");
assert.equal(sandboxPlayers.length, 398);
assert.ok(sandboxPlayers.every((asset) => asset.valueStatus === "VALUED"));
assert.ok(sandboxPlayers.some((asset) => !currentPlayerIds.has(asset.assetId)), "non-rostered approved player is selectable");
assert.equal(sandboxPicks.length, 12);
assert.ok(sandboxPicks.every((asset) => asset.pickKind === "GENERIC_ROUND" && asset.ownerId === undefined && asset.slot === undefined));
assert.deepEqual(sandboxPicks.map((asset) => asset.assetId), [
  "sandbox-pick-2027-1", "sandbox-pick-2027-2", "sandbox-pick-2027-3", "sandbox-pick-2027-4",
  "sandbox-pick-2028-1", "sandbox-pick-2028-2", "sandbox-pick-2028-3", "sandbox-pick-2028-4",
  "sandbox-pick-2029-1", "sandbox-pick-2029-2", "sandbox-pick-2029-3", "sandbox-pick-2029-4",
]);
assert.equal(sandboxCatalog.assets.length, 410);
assert.ok(sandboxCatalog.assets.every((asset) => asset.ownerId === undefined));

console.log(JSON.stringify({ status: "PASS", snapshotDate: runtime.snapshot.date, players: sandboxPlayers.length, genericPicks: sandboxPicks.length, total: sandboxCatalog.assets.length, currentRosterPlayers: currentPlayerIds.size, ownershipNeutral: true }, null, 2));
