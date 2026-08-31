import assert from "node:assert/strict";
import { sortCompactAssets } from "../app/trade-analyzer/CompactMultiParticipantColumn.tsx";
import type { TradeAnalyzerCatalogAsset } from "../app/trade-analyzer/TradeAnalyzerParticipantClient.tsx";

const player = (assetId: string, displayName: string, position: string, marketValue: number): TradeAnalyzerCatalogAsset => ({ assetId, displayName, assetType: "PLAYER", position, marketValue });
const pick = (assetId: string, displayName: string, season: number, round: number, slot: number): TradeAnalyzerCatalogAsset => ({ assetId, displayName, assetType: "PICK", season, round, slot });
const assets: TradeAnalyzerCatalogAsset[] = [
  pick("pick-2027-2-1", "2027 Round 2", 2027, 2, 1),
  player("wr-low", "Rome Odunze", "WR", 1200),
  player("qb", "Michael Penix", "QB", 2100),
  pick("pick-2026-1-4", "2026 Round 1", 2026, 1, 4),
  player("wr-high", "Marvin Harrison Jr", "WR", 2400),
  player("te", "Brock Bowers", "TE", 1800),
  player("rb", "Bijan Robinson", "RB", 2000),
  player("k", "Justin Tucker", "K", 300),
  { assetId: "dst", displayName: "Ravens D/ST", assetType: "DST", marketValue: 200 },
];

const ordered = sortCompactAssets(assets);
assert.deepEqual(ordered.map((asset) => asset.assetId), ["qb", "rb", "wr-high", "wr-low", "te", "k", "dst", "pick-2026-1-4", "pick-2027-2-1"]);
assert.deepEqual(sortCompactAssets(assets.filter((asset) => asset.position === "WR")).map((asset) => asset.assetId), ["wr-high", "wr-low"]);
assert.deepEqual(sortCompactAssets(assets.filter((asset) => asset.displayName.includes("Rome") || asset.displayName.includes("Marvin"))).map((asset) => asset.assetId), ["wr-high", "wr-low"]);
assert.equal(ordered.includes(assets[0]), true);
console.log("TRADE_COMPACT_PICKER_DIAGNOSTICS_PASS");
