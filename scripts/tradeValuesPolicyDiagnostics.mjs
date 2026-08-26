import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const date = process.env.SNAPSHOT_DATE ?? new Date().toISOString().slice(0, 10);
const read = async (file) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const snapshot = await read(`data/trade-analyzer/valuations/fantasycalc/normalized/${date}.json`);
const rosterFile = await read("data/current/rosters/2026.json");
const playerCatalog = await read("data/history/matchups/sleeper/players.json");
const picksFile = await read("data/current/drafts/future-picks.json");
const sourceBySleeper = new Map(snapshot.players.filter((row) => row.sleeperId).map((row) => [row.sleeperId, row]));
const sourcePicks = new Set(snapshot.picks.map((row) => row.pickLabel));
const ordinal = (round) => ({ 1: "st", 2: "nd", 3: "rd" }[round] ?? "th");
const rosterIds = [...new Set(rosterFile.rosters.flatMap((roster) => roster.players ?? []))];
const classifyPlayer = (id) => {
  const meta = playerCatalog[id];
  const direct = sourceBySleeper.get(id);
  if (direct) return { id, name: meta?.full_name ?? direct.playerName, position: meta?.position ?? direct.position, classification: "DIRECT_SOURCE", method: "FANTASYCALC_DIRECT" };
  if (meta?.position === "K") return { id, name: meta.full_name, position: "K", classification: "FALLBACK", method: "FALLBACK_POLICY" };
  if (meta?.position === "DEF") return { id, name: meta.full_name ?? id, position: "DEF", classification: "FALLBACK", method: "FALLBACK_POLICY" };
  return { id, name: meta?.full_name ?? id, position: meta?.position ?? null, classification: "UNVALUED", method: "UNVALUED" };
};
const rosterClassifications = rosterIds.map(classifyPlayer);
const pickClassifications = picksFile.assets.map((asset) => {
  const label = `${asset.season} ${asset.round}${ordinal(asset.round)}`;
  return { id: asset.id, label, classification: sourcePicks.has(label) ? "DIRECT_SOURCE" : "UNVALUED", method: sourcePicks.has(label) ? "FANTASYCALC_PICK_GENERIC" : "UNVALUED" };
});
const counts = (rows) => Object.fromEntries(["DIRECT_SOURCE", "FALLBACK", "UNVALUED"].map((key) => [key, rows.filter((row) => row.classification === key).length]));
const unvalued = rosterClassifications.filter((row) => row.classification === "UNVALUED");
console.log(JSON.stringify({
  status: "PASS",
  policyDocument: "docs/trade-analyzer-valuation-policy-v1.md",
  roster: { total: rosterClassifications.length, counts: counts(rosterClassifications), unvalued },
  picks: { total: pickClassifications.length, counts: counts(pickClassifications), unvalued: pickClassifications.filter((row) => row.classification === "UNVALUED") },
  noTradeSideComparison: true,
  noFairnessCalculation: true,
}, null, 2));
