import { readFile } from "node:fs/promises";
import path from "node:path";
import { calculateFairnessV1 } from "../lib/trade-analyzer/fairnessEngine.ts";
import type { FairnessEngineResult, NormalizedAsset, SnapshotContext } from "../lib/trade-analyzer/types.ts";

const root = process.cwd();
const read = async (file: string) => JSON.parse(await readFile(path.join(root, file), "utf8"));
interface SourcePlayer { sleeperId: string; fantasyCalcId: number; playerName: string; position: "QB" | "RB" | "WR" | "TE"; rawValue: number; sourceSnapshotDate: string; }
interface SourcePick { pickLabel: string; season: number; round: number | null; slot: number | null; rawValue: number; sourceSnapshotDate: string; }
interface CanonicalFuturePick { season: number; }
const snapshot = await read("data/trade-analyzer/valuations/fantasycalc/normalized/2026-08-26.json");
const rosters = await read("data/current/rosters/2026.json");
const players = await read("data/history/matchups/sleeper/players.json");
const futurePicks = await read("data/current/drafts/future-picks.json");
const sourcePlayers = new Map((snapshot.players as SourcePlayer[]).filter((row) => row.sleeperId).map((row) => [row.sleeperId, row]));
const sourcePicks = new Map((snapshot.picks as SourcePick[]).map((row) => [row.pickLabel, row]));
const canonicalFutureSeasons = new Set((futurePicks.assets as CanonicalFuturePick[]).map((asset) => asset.season));
const rosterIds = [...new Set(rosters.rosters.flatMap((row: { players?: string[] }) => row.players ?? []))];
const currentIds = new Set(rosterIds);
const directAsset = (id: string): NormalizedAsset => {
  const row = sourcePlayers.get(id);
  if (!row) throw new Error(`No direct source value for ${id}`);
  return { assetId: id, assetType: "PLAYER", displayName: row.playerName, position: row.position, baseValue: row.rawValue, valueStatus: "VALUED", valueMethod: "FANTASYCALC_DIRECT", sourceName: "FantasyCalc", sourceRowId: String(row.fantasyCalcId), snapshotDate: row.sourceSnapshotDate };
};
const rosterPlayer = (name: string) => {
  const row = (snapshot.players as SourcePlayer[]).find((candidate) => candidate.playerName === name && currentIds.has(candidate.sleeperId));
  if (!row) throw new Error(`Current roster player not found: ${name}`);
  return directAsset(row.sleeperId);
};
const fallback = (id: string, type: "K" | "DST") => ({ assetId: id, assetType: type, displayName: players[id]?.full_name ?? id, position: type, baseValue: 25, valueStatus: "FALLBACK", valueMethod: type === "K" ? "LCC_K_FALLBACK" : "LCC_DST_FALLBACK", sourceName: "LCC_POLICY" }) as NormalizedAsset;
const unvalued = (id: string) => ({ assetId: id, assetType: "PLAYER", displayName: players[id]?.full_name ?? id, position: players[id]?.position, valueStatus: "UNVALUED", valueMethod: "UNVALUED", sourceName: "FantasyCalc", snapshotDate: "2026-08-26" }) as NormalizedAsset;
const pick = (label: string, pickKind: "EXACT_SLOT" | "GENERIC_ROUND" | "TIERED") => {
  const row = sourcePicks.get(label);
  if (!row) throw new Error(`Pick not found: ${label}`);
  if (row.season >= 2027 && !canonicalFutureSeasons.has(row.season)) throw new Error(`Pick season not in canonical future inventory: ${label}`);
  return { assetId: label, assetType: "PICK", displayName: label, season: row.season, round: row.round ?? undefined, slot: row.slot ?? undefined, pickTier: pickKind === "TIERED" ? (label.includes("Early") ? "EARLY" : label.includes("Late") ? "LATE" : "MID") : undefined, pickKind, baseValue: row.rawValue, valueStatus: "VALUED", valueMethod: "FANTASYCALC_PICK_SOURCE", sourceName: "FantasyCalc", sourceRowId: label, snapshotDate: row.sourceSnapshotDate } as NormalizedAsset;
};
const exact = (label: string) => pick(label, "EXACT_SLOT");
const generic = (label: string) => pick(label, "GENERIC_ROUND");
const tiered = (label: string) => pick(label, "TIERED");
const context = (ageDays = 0): SnapshotContext => ({ sourceName: "FantasyCalc", sourceUrl: snapshot.sourceUrl, sourceLicenseStatus: "COMMISSIONER_REVIEW_REQUIRED", sourceAttribution: snapshot.attribution, snapshotDate: "2026-08-26", snapshotRetrievedAt: "2026-08-26T21:48:36.707Z", evaluatedAt: new Date(Date.parse("2026-08-26T21:48:36.707Z") + ageDays * 86400000).toISOString(), leaguePhase: "DRAFT_WINDOW", leagueConfiguration: snapshot.configuration });
const player = (name: string) => rosterPlayer(name);
interface Scenario { id: string; label: string; a: NormalizedAsset[]; b: NormalizedAsset[]; review: "SENSIBLE" | "QUESTIONABLE" | "CLEARLY WRONG"; reason: string; limitation?: string; }
const scenarios: Scenario[] = [
  { id: "A", label: "elite player for elite player", a: [player("Jahmyr Gibbs")], b: [player("Bijan Robinson")], review: "SENSIBLE", reason: "Near-equal elite market values produce a very even result." },
  { id: "B", label: "elite player for strong player plus future first", a: [player("Ja'Marr Chase")], b: [player("Drake London"), tiered("2027 1st (Early)")], review: "QUESTIONABLE", reason: "The raw package is materially larger; v1 does not model elite-asset consolidation or positional preference.", limitation: "RAW MODEL LIMITATION OBSERVED" },
  { id: "C", label: "elite player for two strong players", a: [player("Puka Nacua")], b: [player("Amon-Ra St. Brown"), player("Jeremiyah Love")], review: "QUESTIONABLE", reason: "Raw sum correctly sees the two-player side as much larger, but concentration and elite consolidation are intentionally outside v1.", limitation: "RAW MODEL LIMITATION OBSERVED" },
  { id: "D", label: "strong player for strong player", a: [player("Jaxon Smith-Njigba")], b: [player("Puka Nacua")], review: "SENSIBLE", reason: "Comparable current source values land in the very-even band." },
  { id: "E", label: "strong player plus second for stronger player", a: [player("Drake London"), generic("2027 2nd")], b: [player("Trey McBride")], review: "SENSIBLE", reason: "The second-round addition is reflected as a modest raw-value edge." },
  { id: "F", label: "two mid-tier players for one stronger player", a: [player("Tetairoa McMillan"), player("Colston Loveland")], b: [player("CeeDee Lamb")], review: "SENSIBLE", reason: "Two real assets add materially more raw value than one stronger asset." },
  { id: "G", label: "player for future first", a: [player("Drake London")], b: [generic("2027 1st")], review: "SENSIBLE", reason: "The current player value exceeds a neutral future-first source row without hindsight adjustment." },
  { id: "H", label: "player for first plus second", a: [player("Nico Collins")], b: [tiered("2027 1st (Early)"), generic("2027 2nd")], review: "SENSIBLE", reason: "The two-pick package is close enough to produce a moderate edge." },
  { id: "I", label: "exact-slot pick versus player", a: [exact("2026 Pick 1.01")], b: [player("Jeremiyah Love")], review: "SENSIBLE", reason: "The exact current slot is valued directly against the current player row." },
  { id: "J", label: "generic future first versus player", a: [generic("2027 1st")], b: [player("Drake London")], review: "SENSIBLE", reason: "Generic 2027 first value is used as supplied; no eventual slot is inferred." },
  { id: "K", label: "multiple picks for player", a: [tiered("2027 1st (Early)"), generic("2027 2nd")], b: [player("Trey McBride")], review: "SENSIBLE", reason: "Both pick rows contribute their source values and the package is nearly even." },
  { id: "L", label: "player plus pick for player", a: [player("Chris Olave"), generic("2027 2nd")], b: [player("James Cook")], review: "SENSIBLE", reason: "The small package addition brings the two sides to near parity." },
  { id: "M", label: "K minor throw-in", a: [player("Brock Bowers"), fallback("4227", "K")], b: [player("Jeremiyah Love")], review: "SENSIBLE", reason: "The 25-unit K fallback changes the total only marginally and lowers evidence to MEDIUM." },
  { id: "S", label: "DST minor throw-in", a: [player("Brock Bowers"), fallback("ATL", "DST")], b: [player("Jeremiyah Love")], review: "SENSIBLE", reason: "The 25-unit DST fallback changes the total only marginally and lowers evidence to MEDIUM." },
  { id: "N", label: "unvalued Roman Hemby", a: [unvalued("13416")], b: [player("Breece Hall")], review: "SENSIBLE", reason: "The recognized but unvalued rookie correctly suppresses fairness rather than becoming zero." },
  { id: "O", label: "unvalued Joe Fagnano", a: [unvalued("13350")], b: [player("Josh Allen")], review: "SENSIBLE", reason: "The recognized but unvalued rookie correctly suppresses fairness rather than becoming zero." },
  { id: "P", label: "picks only", a: [generic("2028 1st"), generic("2027 2nd")], b: [generic("2029 1st")], review: "SENSIBLE", reason: "Only supplied pick-market values are used; no draft-slot hindsight is added." },
  { id: "Q", label: "uneven 1-for-3", a: [player("Ja'Marr Chase")], b: [player("Drake London"), generic("2027 2nd"), generic("2027 3rd")], review: "QUESTIONABLE", reason: "The raw sum captures the three-asset package, while v1 intentionally omits consolidation and roster fit.", limitation: "RAW MODEL LIMITATION OBSERVED" },
  { id: "R", label: "balanced 2-for-2", a: [player("Bucky Irving"), player("Jaylen Waddle")], b: [tiered("2027 1st (Early)"), generic("2027 2nd")], review: "SENSIBLE", reason: "Two-for-two package sizes are balanced and their supplied market totals are reasonably close." },
];
const run = (scenario: Scenario, ageDays = 0): FairnessEngineResult => calculateFairnessV1({ sideA: { sideId: "SIDE_A", assets: scenario.a }, sideB: { sideId: "SIDE_B", assets: scenario.b }, snapshot: context(ageDays) });
const output = (scenario: Scenario, result: FairnessEngineResult) => ({ scenarioId: scenario.id, label: scenario.label, sideA: result.sideA.assets.map((asset) => ({ name: asset.displayName, valueMethod: asset.valueMethod })), sideB: result.sideB.assets.map((asset) => ({ name: asset.displayName, valueMethod: asset.valueMethod })), rawSideTotals: [result.sideA.rawValue, result.sideB.rawValue], marketSplit: [result.sideA.marketShare?.display ?? null, result.sideB.marketShare?.display ?? null], fairnessScore: result.trade.fairnessScore?.display ?? null, fairnessBand: result.trade.fairnessBand, marketEdgeSide: result.trade.marketEdgeSide, rawValueGap: result.trade.rawValueGap, evidence: result.trade.evidence, resultStatus: result.trade.resultStatus, warnings: result.trade.warnings, research: result.research, humanReview: scenario.review, reviewReason: scenario.reason, limitation: scenario.limitation ?? null });
const firstRun = scenarios.map((scenario) => output(scenario, run(scenario)));
const secondRun = scenarios.map((scenario) => output(scenario, run(scenario)));
const deterministic = JSON.stringify(firstRun) === JSON.stringify(secondRun);
const symmetry = scenarios.slice(0, 5).map((scenario) => { const original = run(scenario); const reversed = calculateFairnessV1({ sideA: { sideId: "SIDE_B", assets: scenario.b }, sideB: { sideId: "SIDE_A", assets: scenario.a }, snapshot: context() }); return original.trade.fairnessScore?.internal === reversed.trade.fairnessScore?.internal && original.trade.fairnessBand === reversed.trade.fairnessBand && original.trade.rawValueGap === reversed.trade.rawValueGap && original.sideA.marketShare?.display === reversed.sideB.marketShare?.display && original.sideB.marketShare?.display === reversed.sideA.marketShare?.display && original.trade.marketEdgeSide !== reversed.trade.marketEdgeSide; });
const freshness = [0, 4, 8].map((ageDays) => { const result = run(scenarios[0], ageDays); return { ageDays, freshness: result.snapshot.freshness, status: result.trade.resultStatus, evidence: result.trade.evidence, fairness: result.trade.fairnessScore?.internal, totals: [result.sideA.rawValue, result.sideB.rawValue] }; });
const countBy = (key: "resultStatus" | "evidence" | "fairnessBand" | "humanReview") => Object.fromEntries([...new Set(firstRun.map((row) => row[key]))].map((value) => [value ?? "NONE", firstRun.filter((row) => row[key] === value).length]));
const failures = [!deterministic && "determinism", !symmetry.every(Boolean) && "symmetry", firstRun.filter((row) => ["N", "O"].includes(row.scenarioId) && row.resultStatus !== "SUPPRESSED").length && "unvalued_suppression", firstRun.filter((row) => row.scenarioId === "M" && row.evidence !== "MEDIUM").length && "k_evidence", !freshness.every((row) => row.fairness === freshness[0].fairness && row.totals.join(",") === freshness[0].totals.join(",")) && "freshness_values"].filter(Boolean);
console.log(JSON.stringify({ status: failures.length ? "FAIL" : "PASS", internalOnly: true, scenarioCount: scenarios.length, scenarios: firstRun, distribution: { resultStatus: countBy("resultStatus"), evidence: countBy("evidence"), fairnessBand: countBy("fairnessBand"), humanReview: countBy("humanReview") }, freshness, deterministicRerun: deterministic, realisticSymmetry: symmetry.every(Boolean), uniqueCurrentPlayers: [...new Set(scenarios.flatMap((scenario) => [...scenario.a, ...scenario.b].filter((asset) => asset.assetType === "PLAYER").map((asset) => asset.displayName)))].length, uniqueCurrentPicks: [...new Set(scenarios.flatMap((scenario) => [...scenario.a, ...scenario.b].filter((asset) => asset.assetType === "PICK").map((asset) => asset.displayName)))].length, noHistoricalTrades: true, noSubmittedTrades: true, noProductionWrites: true, failures }, null, 2));
if (failures.length) process.exitCode = 1;
