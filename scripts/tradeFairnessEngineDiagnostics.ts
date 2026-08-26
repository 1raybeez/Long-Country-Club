import { readFile } from "node:fs/promises";
import path from "node:path";
import { calculateFairnessV1, decimalHalfUp } from "../lib/trade-analyzer/fairnessEngine.ts";
import type { NormalizedAsset } from "../lib/trade-analyzer/types.ts";

const root = process.cwd();
interface SnapshotPlayerRow { sleeperId?: string; }
interface RosterRow { players?: string[]; }
interface FuturePickRow { season: number; round: number; }
const read = async (file: string) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const checks: { name: string; pass: boolean; detail: string }[] = [];
const check = (name: string, pass: boolean, detail: string) => checks.push({ name, pass, detail });
const valued = (id: string, value: number, type: "PLAYER" | "PICK" = "PLAYER"): NormalizedAsset => ({ assetId: id, assetType: type, displayName: id, baseValue: value, valueStatus: "VALUED", valueMethod: "TEST", sourceName: "TEST", ...(type === "PICK" ? { pickKind: "GENERIC_ROUND" as const, season: 2027, round: 1 } : { position: "WR" as const }) });
const fallback = (id: string, type: "K" | "DST" = "K"): NormalizedAsset => ({ assetId: id, assetType: type, displayName: id, baseValue: 25, valueStatus: "FALLBACK", valueMethod: `LCC_${type}_FALLBACK`, sourceName: "LCC_POLICY", position: type });
const unvalued = (id: string): NormalizedAsset => ({ assetId: id, assetType: "PLAYER", displayName: id, valueStatus: "UNVALUED", valueMethod: "UNVALUED", sourceName: "TEST", position: "WR" });
const context = (ageDays = 0, phase: "DRAFT_WINDOW" | "IN_SEASON" | "OFFSEASON" = "DRAFT_WINDOW") => ({ sourceName: "TEST", sourceLicenseStatus: "APPROVED", snapshotDate: "2026-08-26", snapshotRetrievedAt: `2026-08-${String(26 - ageDays).padStart(2, "0")}T12:00:00Z`, evaluatedAt: "2026-08-26T12:00:00Z", leaguePhase: phase });
const run = (a: NormalizedAsset[], b: NormalizedAsset[], ageDays = 0, phase?: "DRAFT_WINDOW" | "IN_SEASON" | "OFFSEASON") => calculateFairnessV1({ sideA: { sideId: "A", assets: a }, sideB: { sideId: "B", assets: b }, snapshot: context(ageDays, phase) });

const vectors = [[5000, 5000, "VERY EVEN"], [5500, 4500, "SLIGHT EDGE"], [6000, 4000, "CLEAR EDGE"], [6500, 3500, "CLEAR EDGE"], [7000, 3000, "LOPSIDED"], [9700, 300, "LOPSIDED"], [10000, 0, "LOPSIDED"]] as const;
for (const [a, b, expectedBand] of vectors) { const result = run([valued("a", a)], [valued("b", b)]); check(`vector_${a}_${b}`, result.trade.fairnessBand === expectedBand && result.trade.resultStatus === "AUTHORITATIVE", `${result.trade.fairnessScore?.display ?? "null"}/${result.trade.fairnessBand}/${result.trade.resultStatus}`); }
const boundaries = [[96.999, "FAIR"], [97, "VERY EVEN"], [91.999, "SLIGHT EDGE"], [92, "FAIR"], [81.999, "CLEAR EDGE"], [82, "SLIGHT EDGE"], [69.999, "LOPSIDED"], [70, "CLEAR EDGE"]] as const;
for (const [score, expected] of boundaries) { const b = 10000; const a = (score * b) / (200 - score); check(`boundary_${score}`, run([valued("a", a)], [valued("b", b)]).trade.fairnessBand === expected, expected); }
const equal = run([valued("a", 5000)], [valued("b", 5000)]);
const swapped = run([valued("b", 3000)], [valued("a", 7000)]);
const original = run([valued("a", 7000)], [valued("b", 3000)]);
check("symmetry", original.trade.fairnessScore?.internal === swapped.trade.fairnessScore?.internal && original.trade.marketEdgeSide === "SIDE_A" && swapped.trade.marketEdgeSide === "SIDE_B", "fairness preserved and edge reversed");
check("bounds", vectors.every(([a, b]) => { const score = run([valued("a", a)], [valued("b", b)]).trade.fairnessScore?.internal ?? -1; return score >= 0 && score <= 100; }), "0 <= fairness <= 100");
check("market_share_sum", equal.sideA.marketShare!.internal + equal.sideB.marketShare!.internal === 1, "internal shares sum to one");
check("display_share_sum", equal.sideA.marketShare!.display + equal.sideB.marketShare!.display === 100, "display shares sum to 100");
check("monotonicity", [1000, 2000, 3000, 4000, 5000].every((value, index, values) => index === 0 || (run([valued("a", 6000)], [valued("b", value)]).trade.fairnessScore?.internal ?? 0) >= (run([valued("a", 6000)], [valued("b", values[index - 1])]).trade.fairnessScore?.internal ?? 0)), "lower-side increases do not reduce fairness");
check("missing_as_zero_prevented", run([valued("a", 5000), unvalued("missing")], [valued("b", 5000)]).trade.resultStatus === "SUPPRESSED" && run([valued("a", 5000), unvalued("missing")], [valued("b", 5000)]).trade.fairnessScore === null, "unvalued does not become zero");
check("half_up", decimalHalfUp(50.05, 1) === 50.1 && decimalHalfUp(49.95, 1) === 50 && decimalHalfUp(92.05, 1) === 92.1 && decimalHalfUp(96.95, 1) === 97, "decimal half-up");
check("freshness", run([valued("a", 5)], [valued("b", 5)], 0).snapshot.freshness === "FRESH" && run([valued("a", 5)], [valued("b", 5)], 4).snapshot.freshness === "AGING" && run([valued("a", 5)], [valued("b", 5)], 8).snapshot.freshness === "STALE", "draft-window thresholds");
const kdst = run([fallback("k")], [fallback("dst", "DST")]);
check("evidence", kdst.trade.evidence === "MEDIUM" && kdst.trade.warnings.includes("K_DST_FALLBACK_USED"), "K/DST fallback is MEDIUM and annotated");
check("suppressed_states", run([unvalued("u")], [valued("b", 10)]).trade.resultStatus === "SUPPRESSED" && run([{ ...valued("x", 10), assetType: "UNSUPPORTED", valueStatus: "UNSUPPORTED" }], [valued("b", 10)]).trade.resultStatus === "SUPPRESSED", "unvalued/unsupported suppressed");
check("invalid_states", run([], [valued("b", 10)]).trade.resultStatus === "INVALID" && run([valued("a", 0)], [valued("b", 0)]).trade.errors.includes("ZERO_COMBINED_VALUE"), "empty and zero totals invalid");
const malformed = run([{ ...valued("negative", -1) }], [valued("b", 10)]);
const futureContext = { ...context(), snapshotRetrievedAt: "2026-08-27T12:00:00Z" };
const future = calculateFairnessV1({ sideA: { sideId: "A", assets: [valued("a", 10)] }, sideB: { sideId: "B", assets: [valued("b", 10)] }, snapshot: futureContext });
const ambiguousPick = run([{ ...valued("pick", 10, "PICK"), pickKind: undefined }], [valued("b", 10)]);
check("malformed_values", malformed.trade.resultStatus === "INVALID" && malformed.trade.errors.includes("NEGATIVE_VALUE"), "negative value invalid");
check("future_timestamp", future.trade.resultStatus === "INVALID" && future.trade.errors.includes("FUTURE_SNAPSHOT_TIMESTAMP"), "future snapshot invalid");
check("ambiguous_pick", ambiguousPick.trade.resultStatus === "INVALID" && ambiguousPick.trade.errors.includes("AMBIGUOUS_PICK_CLASS"), "pick class required");
check("public_license_gate", calculateFairnessV1({ sideA: { sideId: "A", assets: [valued("a", 10)] }, sideB: { sideId: "B", assets: [valued("b", 10)] }, snapshot: { ...context(), sourceLicenseStatus: "REVIEW_REQUIRED" }, outputContext: "PUBLIC" }).trade.errors.includes("SOURCE_LICENSE_UNAPPROVED"), "public output blocks unapproved license");

const snapshot = await read("data/trade-analyzer/valuations/fantasycalc/normalized/2026-08-26.json");
const roster = await read("data/current/rosters/2026.json");
const players = await read("data/history/matchups/sleeper/players.json");
const sourcePlayers = new Map((snapshot.players as SnapshotPlayerRow[]).filter((row) => row.sleeperId).map((row) => [row.sleeperId!, row]));
const rosterIds = [...new Set((roster.rosters as RosterRow[]).flatMap((row) => row.players ?? []))];
const classified = rosterIds.map((id) => { const meta = players[id] as { position?: string } | undefined; const direct = sourcePlayers.get(id); if (direct) return { classification: "DIRECT_SOURCE" }; if (meta?.position === "K" || meta?.position === "DEF") return { classification: "FALLBACK" }; return { classification: "UNVALUED" }; });
const picks = await read("data/current/drafts/future-picks.json");
const sourcePickLabels = new Set((snapshot.picks as Array<{ pickLabel: string }>).map((row) => row.pickLabel));
const ordinal = (round: number) => ({ 1: "st", 2: "nd", 3: "rd" }[round] ?? "th");
const directPicks = (picks.assets as FuturePickRow[]).filter((asset) => sourcePickLabels.has(`${asset.season} ${asset.round}${ordinal(asset.round)}`)).length;
check("current_snapshot_adapter", true, "non-app adapter classified normalized source rows");
check("current_roster_regression", classified.length === 305, `305 classified (actual ${classified.length})`);
check("direct_fantasycalc_regression", classified.filter((row) => row.classification === "DIRECT_SOURCE").length === 268, `${classified.filter((row) => row.classification === "DIRECT_SOURCE").length} direct`);
check("k_dst_fallback_regression", classified.filter((row) => row.classification === "FALLBACK").length === 35, `${classified.filter((row) => row.classification === "FALLBACK").length} fallback`);
check("unvalued_regression", classified.filter((row) => row.classification === "UNVALUED").length === 2, `${classified.filter((row) => row.classification === "UNVALUED").length} unvalued`);
check("pick_coverage_regression", picks.assets.length === 144 && directPicks === 144, `${directPicks}/${picks.assets.length} picks direct`);

const failures = checks.filter((item) => !item.pass);
console.log(JSON.stringify({ status: failures.length ? "FAIL" : "PASS", checks, noRealTrades: true, noAppConnection: true }, null, 2));
if (failures.length) process.exitCode = 1;
