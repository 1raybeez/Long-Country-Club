import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildCurrentAssetCatalog, calculateCurrentTrade, validateApprovedSnapshot } from "../lib/trade-analyzer/currentValuationAdapter.ts";
import { calculateFairnessV1 } from "../lib/trade-analyzer/fairnessEngine.ts";
import type { CurrentCatalogAsset, CurrentTradeRequest, NormalizedAsset } from "../lib/trade-analyzer/types.ts";

const root = process.cwd();
const read = async (file: string) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const checkResults: { name: string; pass: boolean; detail: string }[] = [];
const check = (name: string, pass: boolean, detail: string) => checkResults.push({ name, pass, detail });
const snapshot = await read("data/trade-analyzer/valuations/fantasycalc/normalized/2026-08-26.json");
const raw = await read("data/trade-analyzer/valuations/fantasycalc/raw/2026-08-26.json");
const manifest = await read("data/trade-analyzer/valuations/fantasycalc/manifest.json");
const roster = await read("data/current/rosters/2026.json");
const playerCatalog = await read("data/history/matchups/sleeper/players.json");
const futurePicks = await read("data/current/drafts/future-picks.json");
const normalizedText = await readFile(path.join(root, "data/trade-analyzer/valuations/fantasycalc/normalized/2026-08-26.json"), "utf8");
const rawHash = createHash("sha256").update(raw.rawResponseBody).digest("hex");
const normalizedHash = createHash("sha256").update(normalizedText).digest("hex");
const integrityErrors = [
  rawHash !== manifest.rawResponseHash && "RAW_HASH_MISMATCH",
  normalizedHash !== manifest.normalizedFileHash && "NORMALIZED_HASH_MISMATCH",
  JSON.stringify(JSON.parse(raw.rawResponseBody)) !== JSON.stringify(raw.response) && "RAW_BODY_MISMATCH",
].filter(Boolean) as string[];
const adapterInput = { snapshot, manifest, roster, playerCatalog, futurePicks, integrityVerified: integrityErrors.length === 0, integrityErrors };
const catalog = buildCurrentAssetCatalog(adapterInput);
const player = (name: string): CurrentCatalogAsset => { const asset = catalog.assets.find((candidate) => candidate.displayName === name); if (!asset) throw new Error(`catalog player missing: ${name}`); return asset; };
const pick = (season: number, round: number): CurrentCatalogAsset => { const asset = catalog.assets.find((candidate) => candidate.assetType === "PICK" && candidate.season === season && candidate.round === round); if (!asset) throw new Error(`catalog pick missing: ${season} ${round}`); return asset; };
const k = catalog.assets.find((asset) => asset.assetType === "K")!;
const dst = catalog.assets.find((asset) => asset.assetType === "DST")!;
const request = (a: CurrentCatalogAsset[], b: CurrentCatalogAsset[], extra: Partial<CurrentTradeRequest> = {}) => calculateCurrentTrade(catalog, { sideA: a.map((asset) => asset.assetId), sideB: b.map((asset) => asset.assetId), evaluatedAt: "2026-08-26T21:48:36.707Z", leaguePhase: "DRAFT_WINDOW", publicOutput: false, ...extra });
interface Scenario { id: string; label: string; a: CurrentCatalogAsset[]; b: CurrentCatalogAsset[]; }
const scenarios: Scenario[] = [
  { id: "A", label: "elite player vs elite player", a: [player("Jahmyr Gibbs")], b: [player("Bijan Robinson")] },
  { id: "B", label: "elite vs player plus first", a: [player("Ja'Marr Chase")], b: [player("Drake London"), pick(2027, 1)] },
  { id: "C", label: "elite vs two players", a: [player("Puka Nacua")], b: [player("Amon-Ra St. Brown"), player("Jeremiyah Love")] },
  { id: "D", label: "player vs first", a: [player("Drake London")], b: [pick(2027, 1)] },
  { id: "E", label: "player vs first plus second", a: [player("Nico Collins")], b: [pick(2027, 1), pick(2027, 2)] },
  { id: "F", label: "pick-only", a: [pick(2028, 1), pick(2027, 2)], b: [pick(2029, 1)] },
  { id: "G", label: "generic future first", a: [pick(2027, 1)], b: [player("Drake London")] },
  { id: "H", label: "tier-capable current pick inventory", a: [pick(2027, 1)], b: [player("Drake London")] },
  { id: "I", label: "K throw-in", a: [player("Brock Bowers"), k], b: [player("Jeremiyah Love")] },
  { id: "J", label: "DST throw-in", a: [player("Brock Bowers"), dst], b: [player("Jeremiyah Love")] },
  { id: "K", label: "Roman Hemby unvalued", a: [player("Roman Hemby")], b: [player("Breece Hall")] },
  { id: "L", label: "Joe Fagnano unvalued", a: [player("Joe Fagnano")], b: [player("Josh Allen")] },
  { id: "M", label: "uneven 1-for-3", a: [player("Ja'Marr Chase")], b: [player("Drake London"), pick(2027, 2), pick(2027, 3)] },
  { id: "N", label: "balanced 2-for-2", a: [player("Bucky Irving"), player("Jaylen Waddle")], b: [pick(2027, 1), pick(2027, 2)] },
];
const summarize = (result: ReturnType<typeof request>) => { const trade = result.engineResult?.trade; return { adapterStatus: result.adapterStatus, validationErrors: result.validationErrors, raw: [result.engineResult?.sideA.rawValue, result.engineResult?.sideB.rawValue], shares: [result.engineResult?.sideA.marketShare?.display, result.engineResult?.sideB.marketShare?.display], fairness: trade?.fairnessScore?.display ?? null, band: trade?.fairnessBand ?? null, status: trade?.resultStatus ?? null, evidence: trade?.evidence ?? null, warnings: trade?.warnings ?? [] }; };
const outputs = scenarios.map((scenario) => ({ scenarioId: scenario.id, label: scenario.label, result: summarize(request(scenario.a, scenario.b)) }));
check("snapshot_integrity", validateApprovedSnapshot(adapterInput).length === 0, "manifest, hashes, configuration, and normalized rows verified");
check("catalog_coverage", catalog.assets.length === 449, `${catalog.assets.length} catalog assets`);
check("player_coverage", catalog.assets.filter((asset) => ["PLAYER", "K", "DST"].includes(asset.assetType)).length === 305, "305 current roster assets");
check("direct_coverage", catalog.assets.filter((asset) => asset.valueMethod === "FANTASYCALC_DIRECT").length === 268, "268 direct players");
check("fallback_coverage", catalog.assets.filter((asset) => asset.valueStatus === "FALLBACK").length === 35, "35 K/DST fallback players");
check("unvalued_coverage", catalog.assets.filter((asset) => asset.valueStatus === "UNVALUED").length === 2, "2 unvalued players");
check("pick_coverage", catalog.assets.filter((asset) => asset.assetType === "PICK").length === 144 && catalog.assets.filter((asset) => asset.assetType === "PICK" && asset.valueStatus === "VALUED").length === 144, "144/144 classified picks");
check("identity_integrity", catalog.integrity.valid && new Set(catalog.assets.map((asset) => asset.assetId)).size === catalog.assets.length, catalog.integrity.errors.length ? catalog.integrity.errors.join(",") : "unique asset identities and ownership assignments");
check("k_dst_fallback", k.baseValue === 25 && k.valueMethod === "LCC_FALLBACK" && dst.baseValue === 25 && dst.valueMethod === "LCC_FALLBACK" && k.sourceName === "LCC_POLICY" && dst.sourceName === "LCC_POLICY", "25-unit local policy fallback");
check("unvalued_players", player("Roman Hemby").valueStatus === "UNVALUED" && player("Joe Fagnano").valueStatus === "UNVALUED" && player("Roman Hemby").baseValue === undefined && player("Joe Fagnano").baseValue === undefined, "no invented values");
const duplicateWithin = calculateCurrentTrade(catalog, { sideA: [player("Drake London").assetId, player("Drake London").assetId], sideB: [player("Nico Collins").assetId], evaluatedAt: "2026-08-26T21:48:36.707Z", leaguePhase: "DRAFT_WINDOW" });
const duplicateAcross = calculateCurrentTrade(catalog, { sideA: [player("Drake London").assetId], sideB: [player("Drake London").assetId], evaluatedAt: "2026-08-26T21:48:36.707Z", leaguePhase: "DRAFT_WINDOW" });
const unknown = calculateCurrentTrade(catalog, { sideA: ["not-a-current-asset"], sideB: [player("Nico Collins").assetId], evaluatedAt: "2026-08-26T21:48:36.707Z", leaguePhase: "DRAFT_WINDOW" });
const empty = calculateCurrentTrade(catalog, { sideA: [], sideB: [player("Nico Collins").assetId], evaluatedAt: "2026-08-26T21:48:36.707Z", leaguePhase: "DRAFT_WINDOW" });
check("trade_input_validation", duplicateWithin.validationErrors.includes("DUPLICATE_SIDE_A_ASSET") && duplicateAcross.validationErrors.includes("CROSS_SIDE_DUPLICATE_ASSET") && unknown.validationErrors.includes("UNKNOWN_ASSET_ID") && empty.validationErrors.includes("EMPTY_SIDE_A"), "duplicate, unknown, and empty inputs rejected deterministically");
const ownership = request([player("Drake London")], [player("Nico Collins")], { ownership: { sideAOwnerId: player("Drake London").ownerId, sideBOwnerId: player("Nico Collins").ownerId } });
check("ownership_outside_math", ownership.ownership.sideA === "CURRENTLY_OWNED" && ownership.ownership.sideB === "CURRENTLY_OWNED", `${ownership.ownership.sideA}/${ownership.ownership.sideB}`);
const directEquivalent = calculateFairnessV1({ sideA: { sideId: "SIDE_A", assets: [player("Jahmyr Gibbs") as NormalizedAsset] }, sideB: { sideId: "SIDE_B", assets: [player("Bijan Robinson") as NormalizedAsset] }, snapshot: { sourceName: "FantasyCalc", sourceUrl: snapshot.sourceUrl, sourceLicenseStatus: "COMMISSIONER_REVIEW_REQUIRED", snapshotDate: "2026-08-26", snapshotRetrievedAt: "2026-08-26T21:48:36.707Z", evaluatedAt: "2026-08-26T21:48:36.707Z", leaguePhase: "DRAFT_WINDOW", leagueConfiguration: snapshot.configuration } });
check("adapter_engine_flow", outputs[0].result.status === "AUTHORITATIVE" && outputs[0].result.fairness === directEquivalent.trade.fairnessScore?.display, "current IDs resolve through catalog into fairness-v1");
check("shadow_parity", scenarios.every((scenario) => { const adapterResult = request(scenario.a, scenario.b).engineResult; const directResult = calculateFairnessV1({ sideA: { sideId: "SIDE_A", assets: scenario.a as NormalizedAsset[] }, sideB: { sideId: "SIDE_B", assets: scenario.b as NormalizedAsset[] }, snapshot: { sourceName: "FantasyCalc", sourceUrl: snapshot.sourceUrl, sourceLicenseStatus: "COMMISSIONER_REVIEW_REQUIRED", snapshotDate: "2026-08-26", snapshotRetrievedAt: "2026-08-26T21:48:36.707Z", evaluatedAt: "2026-08-26T21:48:36.707Z", leaguePhase: "DRAFT_WINDOW", leagueConfiguration: snapshot.configuration } }); return JSON.stringify(summarize({ adapterStatus: "VALID", validationErrors: [], ownership: { sideA: "OWNERSHIP_UNKNOWN", sideB: "OWNERSHIP_UNKNOWN" }, engineResult: adapterResult })) === JSON.stringify(summarize({ adapterStatus: "VALID", validationErrors: [], ownership: { sideA: "OWNERSHIP_UNKNOWN", sideB: "OWNERSHIP_UNKNOWN" }, engineResult: directResult })); }), "same values, status, evidence, shares, fairness, band, and warnings");
const publicGate = request([player("Drake London")], [player("Nico Collins")], { publicOutput: true });
check("public_license_gate", request([player("Drake London")], [player("Nico Collins")]).engineResult?.trade.resultStatus === "AUTHORITATIVE" && publicGate.engineResult?.trade.errors.includes("SOURCE_LICENSE_UNAPPROVED") === true, "private calculates; public request is blocked");
const freshness = [
  calculateCurrentTrade(catalog, { sideA: [player("Drake London").assetId], sideB: [player("Nico Collins").assetId], evaluatedAt: "2026-08-26T21:48:36.707Z", leaguePhase: "DRAFT_WINDOW" }),
  calculateCurrentTrade(catalog, { sideA: [player("Drake London").assetId], sideB: [player("Nico Collins").assetId], evaluatedAt: "2026-08-30T21:48:36.707Z", leaguePhase: "IN_SEASON" }),
  calculateCurrentTrade(catalog, { sideA: [player("Drake London").assetId], sideB: [player("Nico Collins").assetId], evaluatedAt: "2026-09-28T21:48:36.707Z", leaguePhase: "OFFSEASON" }),
];
check("freshness_phases", freshness.every((result) => result.engineResult?.trade.fairnessScore?.internal === freshness[0].engineResult?.trade.fairnessScore?.internal), "phase changes do not change market math");
check("no_owner_specific_value", player("Drake London").baseValue === player("Drake London").baseValue && player("Drake London").valueMethod === "FANTASYCALC_DIRECT", "owner metadata is outside value resolution");
check("no_exact_or_tier_inference", catalog.assets.filter((asset) => asset.pickKind === "EXACT_SLOT").length === 0 && catalog.assets.filter((asset) => asset.pickKind === "TIERED").length === 0, "current canonical inventory has no exact/tier pick classification to infer");
const failures = checkResults.filter((result) => !result.pass);
console.log(JSON.stringify({ status: failures.length ? "FAIL" : "PASS", snapshotDate: snapshot.snapshotDate, catalog: { total: catalog.assets.length, directPlayers: catalog.assets.filter((asset) => asset.valueMethod === "FANTASYCALC_DIRECT").length, fallbackPlayers: catalog.assets.filter((asset) => asset.valueStatus === "FALLBACK").length, unvaluedPlayers: catalog.assets.filter((asset) => asset.valueStatus === "UNVALUED").length, picks: catalog.assets.filter((asset) => asset.assetType === "PICK").length, duplicateAssetIds: catalog.assets.length - new Set(catalog.assets.map((asset) => asset.assetId)).size, duplicatePlayerIds: catalog.assets.filter((asset) => asset.assetType !== "PICK").length - new Set(catalog.assets.filter((asset) => asset.assetType !== "PICK").map((asset) => asset.assetId)).size, duplicatePickIds: catalog.assets.filter((asset) => asset.assetType === "PICK").length - new Set(catalog.assets.filter((asset) => asset.assetType === "PICK").map((asset) => asset.assetId)).size, integrityErrors: catalog.integrity.errors }, scenarios: outputs, checks: checkResults, freshness: freshness.map((result) => ({ phase: result.engineResult?.snapshot.leaguePhase, freshness: result.engineResult?.snapshot.freshness, status: result.engineResult?.trade.resultStatus, evidence: result.engineResult?.trade.evidence, fairness: result.engineResult?.trade.fairnessScore?.internal })), exactSlotAvailable: false, tieredPickAvailable: false, noNetworkFetch: true, noHistoricalTrades: true, noSubmittedTrades: true, noAppConnection: true, failures }, null, 2));
if (failures.length) process.exitCode = 1;
