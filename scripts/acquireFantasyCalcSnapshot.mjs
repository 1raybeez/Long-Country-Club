import { createHash } from "node:crypto";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const snapshotDate = process.env.SNAPSHOT_DATE ?? new Date().toISOString().slice(0, 10);
const retrievalTimestamp = new Date().toISOString();
const endpoint = "https://api.fantasycalc.com/values/current";
const params = {
  isDynasty: "true",
  numQbs: "1",
  numTeams: "12",
  ppr: "0.5",
  includeAdp: "false",
};
const query = new URLSearchParams(params).toString();
const sourceUrl = `${endpoint}?${query}`;
const rawPath = path.join(root, "data/trade-analyzer/valuations/fantasycalc/raw", `${snapshotDate}.json`);
const normalizedPath = path.join(root, "data/trade-analyzer/valuations/fantasycalc/normalized", `${snapshotDate}.json`);
const manifestPath = path.join(root, "data/trade-analyzer/valuations/fantasycalc/manifest.json");

async function exists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

if (await exists(rawPath) || await exists(normalizedPath)) {
  throw new Error(`Refusing to overwrite existing ${snapshotDate} FantasyCalc snapshot.`);
}

const response = await fetch(sourceUrl);
const body = await response.text();
if (!response.ok) throw new Error(`FantasyCalc request failed: HTTP ${response.status}`);
let rows;
try { rows = JSON.parse(body); } catch { throw new Error("FantasyCalc response was not valid JSON."); }
if (!Array.isArray(rows) || rows.length === 0) throw new Error("FantasyCalc response did not contain a non-empty row array.");

const rawResponseHash = createHash("sha256").update(body).digest("hex");
const raw = {
  schemaVersion: 1,
  source: "FantasyCalc",
  sourceUrl,
  endpoint,
  parameters: params,
  snapshotDate,
  retrievalTimestamp,
  httpStatus: response.status,
  attribution: "Player and pick market values sourced from FantasyCalc.",
  licenseNotes: "FantasyCalc terms require attribution and restrict use; commissioner review is required before public redistribution or commercial use.",
  responseSha256: rawResponseHash,
  rawResponseBody: body,
  response: rows,
};

const playerRows = rows.filter((row) => row?.player?.position !== "PICK");
const pickRows = rows.filter((row) => row?.player?.position === "PICK");
const normalized = {
  schemaVersion: 1,
  source: "FantasyCalc",
  sourceUrl,
  snapshotDate,
  retrievalTimestamp,
  configuration: { dynasty: true, teams: 12, qb: 1, scoring: "half-PPR", tePremium: false },
  attribution: raw.attribution,
  licenseNotes: raw.licenseNotes,
  players: playerRows.map((row) => ({
    fantasyCalcId: row.player?.id ?? null,
    sleeperId: row.player?.sleeperId ?? null,
    playerName: row.player?.name ?? null,
    position: row.player?.position ?? null,
    nflTeam: row.player?.maybeTeam ?? null,
    age: row.player?.maybeAge ?? null,
    overallRank: row.overallRank ?? null,
    positionRank: row.positionRank ?? null,
    rawValue: row.value ?? null,
    normalizedSourceValue: row.value ?? null,
    sourceSnapshotDate: snapshotDate,
  })),
  picks: pickRows.map((row) => {
    const label = row.player?.name ?? null;
    const match = label?.match(/^(\d{4}) Pick (\d+)\.(\d+)$/);
    const roundOnly = label?.match(/^(\d{4}) (\d)(?:st|nd|rd|th)(?: \((Early|Mid|Late)\))?$/);
    return {
      pickLabel: label,
      season: match ? Number(match[1]) : roundOnly ? Number(roundOnly[1]) : null,
      round: match ? Number(match[2]) : roundOnly ? Number(roundOnly[3]) : null,
      slot: match ? Number(match[3]) : null,
      tier: roundOnly?.[2]?.trim() || null,
      slotSpecific: Boolean(match),
      roundLevel: Boolean(roundOnly),
      rawValue: row.value ?? null,
      normalizedSourceValue: row.value ?? null,
      sourceSnapshotDate: snapshotDate,
    };
  }),
};

const normalizedText = JSON.stringify(normalized, null, 2) + "\n";
const normalizedFileHash = createHash("sha256").update(normalizedText).digest("hex");
const manifest = {
  schemaVersion: 1,
  source: "FantasyCalc",
  sourceUrl,
  snapshotDate,
  retrievalTimestamp,
  requestConfiguration: normalized.configuration,
  rawFile: path.relative(root, rawPath),
  normalizedFile: path.relative(root, normalizedPath),
  rawResponseHash,
  normalizedFileHash,
  rowCount: rows.length,
  playerCount: normalized.players.length,
  pickCount: normalized.picks.length,
  attribution: raw.attribution,
  licensingRestrictionNotes: raw.licenseNotes,
  validationResult: "PASS",
  reviewStatus: "COMMISSIONER_REVIEW",
};

await mkdir(path.dirname(rawPath), { recursive: true });
await mkdir(path.dirname(normalizedPath), { recursive: true });
await writeFile(rawPath, JSON.stringify(raw, null, 2) + "\n", "utf8");
await writeFile(normalizedPath, normalizedText, "utf8");
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(JSON.stringify({ snapshotDate, sourceUrl, rawPath: path.relative(root, rawPath), normalizedPath: path.relative(root, normalizedPath), manifestPath: path.relative(root, manifestPath), rowCount: rows.length, playerCount: normalized.players.length, pickCount: normalized.picks.length, rawResponseHash, normalizedFileHash }, null, 2));
