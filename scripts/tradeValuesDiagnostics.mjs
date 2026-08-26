import { createHash } from "node:crypto";
import { readFile, access } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const snapshotDate = process.env.SNAPSHOT_DATE ?? new Date().toISOString().slice(0, 10);
const rawPath = path.join(root, "data/trade-analyzer/valuations/fantasycalc/raw", `${snapshotDate}.json`);
const normalizedPath = path.join(root, "data/trade-analyzer/valuations/fantasycalc/normalized", `${snapshotDate}.json`);
const manifestPath = path.join(root, "data/trade-analyzer/valuations/fantasycalc/manifest.json");
const checks = [];
const fail = (name, detail) => checks.push({ name, status: "FAIL", detail });
const pass = (name, detail) => checks.push({ name, status: "PASS", detail });
const read = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));
try { await access(rawPath); pass("raw_snapshot_exists", path.relative(root, rawPath)); } catch { fail("raw_snapshot_exists", "missing"); }
try { await access(normalizedPath); pass("normalized_snapshot_exists", path.relative(root, normalizedPath)); } catch { fail("normalized_snapshot_exists", "missing"); }
try { await access(manifestPath); pass("manifest_exists", path.relative(root, manifestPath)); } catch { fail("manifest_exists", "missing"); }

if (checks.some((x) => x.status === "FAIL")) throw new Error(JSON.stringify(checks, null, 2));
const raw = await read(rawPath);
const normalized = await read(normalizedPath);
const manifest = await read(manifestPath);
const roster = await read(path.join(root, "data/current/rosters/2026.json"));
const players = await read(path.join(root, "data/history/matchups/sleeper/players.json"));
const futurePicks = await read(path.join(root, "data/current/drafts/future-picks.json"));
const rawHash = createHash("sha256").update(raw.rawResponseBody).digest("hex");
const normalizedText = await readFile(normalizedPath, "utf8");
const normalizedHash = createHash("sha256").update(normalizedText).digest("hex");
const expectedConfiguration = { dynasty: true, teams: 12, qb: 1, scoring: "half-PPR", tePremium: false };
const playerRows = normalized.players;
const pickRows = normalized.picks;
const sleeperIds = playerRows.map((x) => x.sleeperId).filter(Boolean);
const duplicate = (values) => [...new Set(values.filter((v, i) => values.indexOf(v) !== i))];
const rosterIds = [...new Set(roster.rosters.flatMap((x) => x.players ?? []))];
const traded = await read(path.join(root, "data/current/trades/historical-trades-2021-2026.json"));
const tradedIds = [...new Set(traded.trades.flatMap((x) => x.players.map((p) => p.playerId)))];
const currentMatches = rosterIds.filter((id) => sleeperIds.includes(id));
const currentMissing = rosterIds.filter((id) => !sleeperIds.includes(id)).map((id) => ({ id, name: players[id]?.full_name ?? null, position: players[id]?.position ?? null }));
const tradedMatches = tradedIds.filter((id) => sleeperIds.includes(id));
const malformed = playerRows.filter((x) => x.fantasyCalcId === null || !x.playerName || !x.position);
const missingValues = playerRows.filter((x) => x.rawValue === null || x.rawValue === undefined);
const negativeValues = playerRows.filter((x) => typeof x.rawValue === "number" && x.rawValue < 0);
const pickLabels = new Set(pickRows.map((x) => x.pickLabel));
const valuedFuturePicks = futurePicks.assets.filter((asset) => pickLabels.has(`${asset.season} ${asset.round}${asset.round === 1 ? "st" : asset.round === 2 ? "nd" : asset.round === 3 ? "rd" : "th"}`));
const result = {
  checks,
  snapshotDate,
  configuration: normalized.configuration,
  rowCount: raw.response.length,
  playerCount: playerRows.length,
  pickCount: pickRows.length,
  rawHashMatches: rawHash === manifest.rawResponseHash,
  normalizedHashMatches: normalizedHash === manifest.normalizedFileHash,
  rawBodyParses: JSON.stringify(JSON.parse(raw.rawResponseBody)) === JSON.stringify(raw.response),
  provenancePresent: Boolean(raw.sourceUrl && raw.retrievalTimestamp && raw.responseSha256 && raw.rawResponseBody && raw.attribution && raw.licenseNotes),
  expectedConfigurationMatches: JSON.stringify(normalized.configuration) === JSON.stringify(expectedConfiguration),
  manifestConsistent: manifest.rowCount === raw.response.length && manifest.playerCount === playerRows.length && manifest.pickCount === pickRows.length && manifest.rawFile.endsWith(`${snapshotDate}.json`) && manifest.normalizedFile.endsWith(`${snapshotDate}.json`),
  currentRoster: { total: rosterIds.length, matched: currentMatches.length, missing: currentMissing, coverage: rosterIds.length ? currentMatches.length / rosterIds.length : 0 },
  historicalTradedPlayers: { expected: tradedIds.length, matched: tradedMatches.length, missing: tradedIds.filter((id) => !sleeperIds.includes(id)), coverage: tradedMatches.length / tradedIds.length },
  currentPicks: { expected: futurePicks.assets.length, directlyValued: valuedFuturePicks.length, notDirectlyValued: futurePicks.assets.length - valuedFuturePicks.length, coverage: valuedFuturePicks.length / futurePicks.assets.length },
  pickSupport: { 2026: pickRows.filter((x) => x.season === 2026).length, 2027: pickRows.filter((x) => x.season === 2027).length, 2028: pickRows.filter((x) => x.season === 2028).length, 2029: pickRows.filter((x) => x.season === 2029).length, exactSlots: pickRows.filter((x) => x.slotSpecific).length, roundOnly: pickRows.filter((x) => x.roundLevel && !x.slotSpecific).length, tiers: pickRows.filter((x) => x.tier).length },
  integrity: { duplicateFantasyCalcIds: duplicate(playerRows.map((x) => x.fantasyCalcId)), duplicateSleeperIds: duplicate(sleeperIds), malformedRows: malformed.length, missingPositions: playerRows.filter((x) => !x.position).length, missingValues: missingValues.length, negativeValues: negativeValues.length, unexpectedPickRows: pickRows.filter((x) => !x.pickLabel).length },
};
const failures = [
  !result.rawHashMatches && "raw_hash_mismatch", !result.rawBodyParses && "raw_body_mismatch", !result.normalizedHashMatches && "normalized_hash_mismatch", !result.provenancePresent && "missing_provenance", !result.expectedConfigurationMatches && "unexpected_configuration", !result.manifestConsistent && "manifest_inconsistent", result.integrity.duplicateSleeperIds.length && "duplicate_sleeper_ids", result.integrity.malformedRows && "malformed_rows", result.integrity.negativeValues && "negative_values",
].filter(Boolean);
if (failures.length) { console.log(JSON.stringify({ ...result, failures }, null, 2)); process.exitCode = 1; } else { console.log(JSON.stringify({ ...result, status: "PASS" }, null, 2)); }
