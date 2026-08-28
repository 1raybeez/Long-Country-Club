import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const read = async (file) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const manifestPath = "data/trade-analyzer/valuations/fantasycalc/manifest.json";
const manifest = await read(manifestPath);
const snapshotDirectory = "data/trade-analyzer/valuations/fantasycalc/";
const referencedFiles = [manifest.rawFile, manifest.normalizedFile];
if (
  manifest.validationResult !== "PASS" ||
  !manifest.snapshotDate ||
  referencedFiles.some((file) => typeof file !== "string" || !file.startsWith(snapshotDirectory))
) {
  throw new Error("APPROVED_SNAPSHOT_MANIFEST_INVALID");
}

const date = manifest.snapshotDate;
const snapshot = await read(manifest.normalizedFile);
const raw = await read(manifest.rawFile);
const normalizedText = await readFile(path.join(root, manifest.normalizedFile), "utf8");
const rawResponseText = raw.rawResponseBody;
const rawResponse = JSON.parse(rawResponseText);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
if (
  snapshot.snapshotDate !== date ||
  raw.snapshotDate !== date ||
  sha256(rawResponseText) !== manifest.rawResponseHash ||
  sha256(normalizedText) !== manifest.normalizedFileHash ||
  JSON.stringify(rawResponse) !== JSON.stringify(raw.response) ||
  manifest.rowCount !== rawResponse.length ||
  manifest.playerCount !== snapshot.players.length ||
  manifest.pickCount !== snapshot.picks.length
) {
  throw new Error("APPROVED_SNAPSHOT_MANIFEST_INVALID");
}
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
