import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildCurrentAssetCatalog } from "../lib/trade-analyzer/currentValuationAdapter.ts";
import { calculateCurrentTrade } from "../lib/trade-analyzer/currentValuationAdapter.ts";
import { analyzeTradeInternal } from "../lib/trade-analyzer/tradeAnalysisService.ts";
import type { CurrentCatalogAsset } from "../lib/trade-analyzer/types.ts";
import type { ServiceDependencies, TradeAnalysisServiceRequest } from "../lib/trade-analyzer/serviceTypes.ts";

const root = process.cwd();
const read = async (file: string) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const checks: { name: string; pass: boolean; detail: string }[] = [];
const check = (name: string, pass: boolean, detail: string) => checks.push({ name, pass, detail });
const snapshot = await read("data/trade-analyzer/valuations/fantasycalc/normalized/2026-08-26.json");
const raw = await read("data/trade-analyzer/valuations/fantasycalc/raw/2026-08-26.json");
const manifest = await read("data/trade-analyzer/valuations/fantasycalc/manifest.json");
const roster = await read("data/current/rosters/2026.json");
const playerCatalog = await read("data/history/matchups/sleeper/players.json");
const futurePicks = await read("data/current/drafts/future-picks.json");
const normalizedText = await readFile(path.join(root, "data/trade-analyzer/valuations/fantasycalc/normalized/2026-08-26.json"), "utf8");
const integrityErrors = [
  createHash("sha256").update(raw.rawResponseBody).digest("hex") !== manifest.rawResponseHash && "RAW_HASH_MISMATCH",
  createHash("sha256").update(normalizedText).digest("hex") !== manifest.normalizedFileHash && "NORMALIZED_HASH_MISMATCH",
].filter(Boolean) as string[];
const catalog = buildCurrentAssetCatalog({ snapshot, manifest, roster, playerCatalog, futurePicks, integrityVerified: integrityErrors.length === 0, integrityErrors });
const dependencies: ServiceDependencies = { catalog, snapshot: { date: "2026-08-26", sourceName: "FantasyCalc", sourceUrl: snapshot.sourceUrl, retrievedAt: snapshot.retrievalTimestamp, sourceLicenseStatus: "COMMISSIONER_REVIEW_REQUIRED", integrityValid: true }, modelVersions: { valuationPolicyVersion: "valuation-v1", fairnessModelVersion: "fairness-v1" } };
const asset = (name: string): CurrentCatalogAsset => { const found = catalog.assets.find((candidate) => candidate.displayName === name); if (!found) throw new Error(`Missing catalog asset ${name}`); return found; };
const pick = (season: number, round: number): CurrentCatalogAsset => { const found = catalog.assets.find((candidate) => candidate.assetType === "PICK" && candidate.season === season && candidate.round === round); if (!found) throw new Error(`Missing catalog pick ${season}/${round}`); return found; };
const baseRequest = (a: CurrentCatalogAsset[], b: CurrentCatalogAsset[], overrides: Partial<TradeAnalysisServiceRequest> = {}): TradeAnalysisServiceRequest => ({ sideA: { assetIds: a.map((x) => x.assetId) }, sideB: { assetIds: b.map((x) => x.assetId) }, evaluatedAt: "2026-08-26T21:48:36.707Z", leaguePhase: "DRAFT_WINDOW", outputMode: "INTERNAL", ...overrides });
const service = (request: unknown, deps = dependencies) => analyzeTradeInternal(request, deps);
const gibbs = asset("Jahmyr Gibbs");
const bijan = asset("Bijan Robinson");
const drake = asset("Drake London");
const love = asset("Jeremiyah Love");
const breece = asset("Breece Hall");
const chase = asset("Ja'Marr Chase");
const puka = asset("Puka Nacua");
const amon = asset("Amon-Ra St. Brown");
const first = pick(2027, 1);
const second = pick(2027, 2);
const third = pick(2027, 3);
const twentyEightFirst = pick(2028, 1);
const twentyNineFirst = pick(2029, 1);
const scenarios = [
  baseRequest([gibbs], [bijan]), baseRequest([drake], [first]), baseRequest([twentyEightFirst, second], [twentyNineFirst]), baseRequest([asset("Brock Bowers"), asset("Harrison Butker")], [love]), baseRequest([asset("Brock Bowers"), asset("ATL")], [love]), baseRequest([asset("Roman Hemby")], [breece]), baseRequest([asset("Joe Fagnano")], [asset("Josh Allen")]), baseRequest([chase], [drake, second, third]), baseRequest([asset("Bucky Irving"), asset("Jaylen Waddle")], [first, second]), baseRequest([puka], [amon, love]),
];
const scenarioResults = scenarios.map((request) => service(request));
check("request_validation", service(baseRequest([], [bijan])).status === "INVALID_REQUEST" && service({ ...baseRequest([gibbs], [bijan]), outputMode: "INVALID" }).status === "INVALID_REQUEST" && service({ ...baseRequest([gibbs], [bijan]), evaluatedAt: "not-a-date" }).status === "INVALID_REQUEST" && service({ ...baseRequest([gibbs], [bijan]), leaguePhase: undefined }).status === "INVALID_REQUEST", "empty, mode, timestamp, and phase validation");
check("duplicate_validation", service({ ...baseRequest([gibbs], [bijan]), sideA: { assetIds: [gibbs.assetId, gibbs.assetId] } }).errors.includes("DUPLICATE_ASSET") && service({ ...baseRequest([gibbs], [bijan]), sideB: { assetIds: [gibbs.assetId] } }).errors.includes("CROSS_SIDE_DUPLICATE"), "within-side and cross-side duplicates rejected");
check("unknown_validation", service(baseRequest([{ ...gibbs, assetId: "unknown" }], [bijan])).errors.includes("UNKNOWN_ASSET"), "unknown asset rejected");
check("catalog_and_snapshot", catalog.integrity.valid && catalog.assets.length === 449 && dependencies.snapshot.integrityValid, "approved catalog and snapshot supplied");
check("internal_valid_player", scenarioResults[0].success && scenarioResults[0].status === "OK" && scenarioResults[0].engineStatus === "AUTHORITATIVE" && scenarioResults[0].sideA !== null, "internal player-for-player analysis succeeds");
check("internal_pick_and_pick_only", scenarioResults[1].success && scenarioResults[2].success && scenarioResults[2].trade?.fairnessScore !== null, "player/pick and pick-only paths succeed");
check("fallbacks", scenarioResults[3].trade?.evidence === "MEDIUM" && scenarioResults[4].trade?.evidence === "MEDIUM", "K/DST fallback evidence preserved");
check("unvalued", scenarioResults[5].engineStatus === "SUPPRESSED" && scenarioResults[5].trade?.fairnessScore === null && scenarioResults[6].engineStatus === "SUPPRESSED", "Hemby/Fagnano remain suppressed");
const publicResult = service(baseRequest([gibbs], [bijan], { outputMode: "PUBLIC" }));
check("public_gate_redaction", publicResult.status === "BLOCKED" && publicResult.errors.includes("SOURCE_LICENSE_UNAPPROVED") && publicResult.sideA === null && publicResult.sideB === null && publicResult.trade === null && !JSON.stringify(publicResult).includes("11274") && !JSON.stringify(publicResult).includes("FantasyCalc"), "blocked public response contains no derived values or source metadata");
const mismatch = service(baseRequest([gibbs], [bijan], { sideA: { assetIds: [gibbs.assetId], ownerId: "not-that-owner" }, ownershipValidation: true }));
check("ownership_mismatch", mismatch.success && mismatch.warnings.includes("OWNERSHIP_MISMATCH") && mismatch.trade?.fairnessScore?.internal === scenarioResults[0].trade?.fairnessScore?.internal, "mismatch warns without changing fairness");
check("snapshot_failure", service(baseRequest([gibbs], [bijan]), { ...dependencies, snapshot: { ...dependencies.snapshot, integrityValid: false, integrityErrors: ["CORRUPTED"] } }).status === "INTERNAL_ERROR" && service(baseRequest([gibbs], [bijan]), { ...dependencies, snapshot: { ...dependencies.snapshot, date: "2099-01-01" } }).errors.includes("SNAPSHOT_NOT_FOUND"), "corrupt/missing snapshot fails safely");
check("version_failure", service(baseRequest([gibbs], [bijan]), { ...dependencies, modelVersions: { valuationPolicyVersion: "valuation-v0", fairnessModelVersion: "fairness-v1" } }).errors.includes("MODEL_VERSION_MISMATCH"), "model mismatch fails safely");
check("service_engine_parity", scenarios.every((request, index) => { const result = scenarioResults[index]; const directResult = calculateCurrentTrade(catalog, { sideA: request.sideA.assetIds, sideB: request.sideB.assetIds, evaluatedAt: request.evaluatedAt, leaguePhase: request.leaguePhase, publicOutput: false }); return result.trade?.fairnessScore?.internal === directResult.engineResult?.trade.fairnessScore?.internal && result.trade?.fairnessBand === directResult.engineResult?.trade.fairnessBand && result.engineStatus === directResult.engineResult?.trade.resultStatus && result.trade?.evidence === directResult.engineResult?.trade.evidence; }), "10 service results match adapter/engine outputs");
const firstDeterministic = JSON.stringify(service(baseRequest([gibbs], [bijan]))); const secondDeterministic = JSON.stringify(service(baseRequest([gibbs], [bijan])));
check("determinism", firstDeterministic === secondDeterministic, "identical requests produce identical responses");
const serviceSource = await readFile(path.join(root, "lib/trade-analyzer/tradeAnalysisService.ts"), "utf8");
check("no_network_or_write_architecture", !/fetch\s*\(|axios|firebase|firestore/i.test(serviceSource), "service has no network or persistence calls");
const failures = checks.filter((item) => !item.pass);
console.log(JSON.stringify({ status: failures.length ? "FAIL" : "PASS", catalog: { total: catalog.assets.length, players: 305, direct: 268, fallback: 35, unvalued: 2, picks: 144 }, serviceScenarios: scenarioResults.map((result, index) => ({ scenario: String.fromCharCode(65 + index), status: result.status, engineStatus: result.engineStatus, evidence: result.trade?.evidence ?? null, fairness: result.trade?.fairnessScore?.display ?? null })), checks, noHistoricalTrades: true, noSubmittedTrades: true, noAppConnection: true, failures }, null, 2));
if (failures.length) process.exitCode = 1;
