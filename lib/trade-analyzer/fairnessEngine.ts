import type {
  AssetCounts, Evidence, FairnessBand, FairnessEngineInput, FairnessEngineResult,
  FairnessResearchResult, FairnessSideResult, Freshness, LeaguePhase, MarketEdgeSide,
  NormalizedAsset, ResultStatus, SnapshotContext, TradeSideInput,
} from "./types";

const POLICY_VERSION = "valuation-v1" as const;
const MODEL_VERSION = "fairness-v1" as const;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const phases: LeaguePhase[] = ["DRAFT_WINDOW", "IN_SEASON", "OFFSEASON"];
const errors = {
  INVALID_SIDE: "INVALID_SIDE",
  EMPTY_SIDE: "EMPTY_SIDE",
  NEGATIVE_VALUE: "NEGATIVE_VALUE",
  NON_FINITE_VALUE: "NON_FINITE_VALUE",
  ZERO_COMBINED_VALUE: "ZERO_COMBINED_VALUE",
  UNSUPPORTED_ASSET: "UNSUPPORTED_ASSET",
  UNVALUED_ASSET: "UNVALUED_ASSET",
  AMBIGUOUS_PICK_CLASS: "AMBIGUOUS_PICK_CLASS",
  MISSING_PICK_VALUE: "MISSING_PICK_VALUE",
  MISSING_LEAGUE_PHASE: "MISSING_LEAGUE_PHASE",
  INVALID_TIMESTAMP: "INVALID_TIMESTAMP",
  FUTURE_SNAPSHOT_TIMESTAMP: "FUTURE_SNAPSHOT_TIMESTAMP",
  SOURCE_LICENSE_UNAPPROVED: "SOURCE_LICENSE_UNAPPROVED",
} as const;
const warnings = {
  AGING_SNAPSHOT: "AGING_SNAPSHOT",
  STALE_SNAPSHOT: "STALE_SNAPSHOT",
  FALLBACK_VALUE_USED: "FALLBACK_VALUE_USED",
  K_DST_FALLBACK_USED: "K_DST_FALLBACK_USED",
  SOURCE_COVERAGE_GAP: "SOURCE_COVERAGE_GAP",
  RESEARCH_FIELDS_NON_AUTHORITATIVE: "RESEARCH_FIELDS_NON_AUTHORITATIVE",
} as const;

const halfUp = (value: number, digits: number): number => {
  const factor = 10 ** digits;
  const epsilon = Number.EPSILON * Math.max(1, Math.abs(value * factor)) * 4;
  return Math.floor((value * factor) + 0.5 + epsilon) / factor;
};
const parseDate = (value: string): number | null => {
  if (typeof value !== "string" || !value || Number.isNaN(Date.parse(value))) return null;
  return Date.parse(value);
};
const freshnessFor = (phase: LeaguePhase, ageDays: number): Freshness => {
  const limits = phase === "DRAFT_WINDOW" ? [3, 7] : phase === "IN_SEASON" ? [7, 14] : [30, 60];
  return ageDays <= limits[0] ? "FRESH" : ageDays <= limits[1] ? "AGING" : "STALE";
};
const bandFor = (score: number): FairnessBand => score >= 97 ? "VERY EVEN" : score >= 92 ? "FAIR" : score >= 82 ? "SLIGHT EDGE" : score >= 70 ? "CLEAR EDGE" : "LOPSIDED";
const rankEvidence = (values: Evidence[]): Evidence => values.includes("INCOMPLETE") ? "INCOMPLETE" : values.includes("LOW") ? "LOW" : values.includes("MEDIUM") ? "MEDIUM" : "HIGH";
const evidenceForAsset = (asset: NormalizedAsset): Evidence => {
  if (asset.valueStatus === "UNVALUED" || asset.valueStatus === "UNSUPPORTED") return "INCOMPLETE";
  if (asset.valueStatus === "FALLBACK") return asset.assetType === "K" || asset.assetType === "DST" ? "MEDIUM" : "LOW";
  return asset.evidence ?? "HIGH";
};
const countsFor = (assets: NormalizedAsset[]): AssetCounts => ({
  total: assets.length,
  valued: assets.filter((asset) => asset.valueStatus === "VALUED").length,
  fallback: assets.filter((asset) => asset.valueStatus === "FALLBACK").length,
  unvalued: assets.filter((asset) => asset.valueStatus === "UNVALUED").length,
  unsupported: assets.filter((asset) => asset.valueStatus === "UNSUPPORTED" || asset.assetType === "UNSUPPORTED").length,
});
const isPick = (asset: NormalizedAsset): boolean => asset.assetType === "PICK";

function validateSide(side: TradeSideInput, blocking: string[], sideWarnings: string[]): void {
  if (!side || typeof side.sideId !== "string" || !Array.isArray(side.assets)) { blocking.push(errors.INVALID_SIDE); return; }
  if (side.assets.length === 0) blocking.push(errors.EMPTY_SIDE);
  for (const asset of side.assets) {
    if (!asset || typeof asset.assetId !== "string" || !asset.assetId || typeof asset.displayName !== "string" || !asset.displayName || typeof asset.valueMethod !== "string" || !asset.valueMethod || typeof asset.sourceName !== "string" || !asset.sourceName) blocking.push(errors.INVALID_SIDE);
    if (asset?.assetType === "UNSUPPORTED" || asset?.valueStatus === "UNSUPPORTED") blocking.push(errors.UNSUPPORTED_ASSET);
    if (asset?.valueStatus === "UNVALUED") blocking.push(errors.UNVALUED_ASSET);
    if (asset?.valueStatus === "VALUED" || asset?.valueStatus === "FALLBACK") {
      if (asset.baseValue === undefined) blocking.push(isPick(asset) ? errors.MISSING_PICK_VALUE : errors.INVALID_SIDE);
      else if (!Number.isFinite(asset.baseValue)) blocking.push(errors.NON_FINITE_VALUE);
      else if (asset.baseValue < 0) blocking.push(errors.NEGATIVE_VALUE);
    }
    if (isPick(asset) && asset.valueStatus !== "UNVALUED" && asset.valueStatus !== "UNSUPPORTED" && !asset.pickKind) blocking.push(errors.AMBIGUOUS_PICK_CLASS);
    if (asset?.valueStatus === "FALLBACK") {
      sideWarnings.push(warnings.FALLBACK_VALUE_USED);
      if (asset.assetType === "K" || asset.assetType === "DST") sideWarnings.push(warnings.K_DST_FALLBACK_USED);
    }
    if (asset?.valueStatus === "UNVALUED" || asset?.valueStatus === "UNSUPPORTED") sideWarnings.push(warnings.SOURCE_COVERAGE_GAP);
  }
}

const sideResult = (side: TradeSideInput, total: number, freshnessEvidence: Evidence): FairnessSideResult => {
  const counts = countsFor(side.assets);
  const rawValue = side.assets.reduce((sum, asset) => asset.valueStatus === "VALUED" || asset.valueStatus === "FALLBACK" ? sum + (asset.baseValue ?? 0) : sum, 0);
  return { sideId: side.sideId, assets: side.assets, rawValue, knownValueSubtotal: rawValue, marketShare: total > 0 ? { internal: rawValue / total, display: 0 } : null, valuedAssetCount: counts.valued, fallbackAssetCount: counts.fallback, unvaluedAssetCount: counts.unvalued, unsupportedAssetCount: counts.unsupported, evidence: rankEvidence([freshnessEvidence, ...side.assets.map(evidenceForAsset)]) };
};

const researchFor = (sides: [TradeSideInput, TradeSideInput], total: number, thresholds: FairnessEngineInput["researchThresholds"]): FairnessResearchResult => {
  const valued = sides.flatMap((side) => side.assets).filter((asset) => (asset.valueStatus === "VALUED" || asset.valueStatus === "FALLBACK") && asset.assetType !== "K" && asset.assetType !== "DST").map((asset) => asset.baseValue ?? 0).sort((a, b) => b - a);
  const shares = total > 0 ? valued.map((value) => value / total) : [];
  return { topAssetShare: shares[0] ?? null, topTwoShare: shares.length ? (shares[0] ?? 0) + (shares[1] ?? 0) : null, eliteAssetCount: thresholds?.eliteValueThreshold === undefined ? null : valued.filter((value) => value >= thresholds.eliteValueThreshold!).length, belowReplacementCount: thresholds?.replacementValueThreshold === undefined ? null : valued.filter((value) => value < thresholds.replacementValueThreshold!).length };
};

export function calculateFairnessV1(input: FairnessEngineInput): FairnessEngineResult {
  const blocking: string[] = [];
  const allWarnings: string[] = [];
  validateSide(input?.sideA, blocking, allWarnings);
  validateSide(input?.sideB, blocking, allWarnings);
  const snapshot = input?.snapshot as SnapshotContext;
  if (!snapshot || !phases.includes(snapshot.leaguePhase)) blocking.push(errors.MISSING_LEAGUE_PHASE);
  const retrieved = snapshot ? parseDate(snapshot.snapshotRetrievedAt) : null;
  const evaluated = snapshot ? parseDate(snapshot.evaluatedAt) : null;
  const date = snapshot ? parseDate(`${snapshot.snapshotDate}T00:00:00Z`) : null;
  if (!retrieved || !evaluated || !date || !DATE_ONLY.test(snapshot.snapshotDate)) blocking.push(errors.INVALID_TIMESTAMP);
  if (retrieved && evaluated && retrieved > evaluated) blocking.push(errors.FUTURE_SNAPSHOT_TIMESTAMP);
  if (snapshot?.sourceLicenseStatus !== "APPROVED") {
    if (input?.outputContext === "PUBLIC") blocking.push(errors.SOURCE_LICENSE_UNAPPROVED);
    else allWarnings.push(errors.SOURCE_LICENSE_UNAPPROVED);
  }
  const ageDays = retrieved && evaluated ? Math.max(0, Math.floor((evaluated - retrieved) / 86400000)) : 0;
  const freshness = snapshot && phases.includes(snapshot.leaguePhase) && retrieved && evaluated ? freshnessFor(snapshot.leaguePhase, ageDays) : "STALE";
  if (freshness === "AGING") allWarnings.push(warnings.AGING_SNAPSHOT);
  if (freshness === "STALE") allWarnings.push(warnings.STALE_SNAPSHOT);
  const a = input?.sideA ?? { sideId: "SIDE_A", assets: [] };
  const b = input?.sideB ?? { sideId: "SIDE_B", assets: [] };
  const rawA = a.assets.reduce((sum, asset) => asset?.valueStatus === "VALUED" || asset?.valueStatus === "FALLBACK" ? sum + (asset.baseValue ?? 0) : sum, 0);
  const rawB = b.assets.reduce((sum, asset) => asset?.valueStatus === "VALUED" || asset?.valueStatus === "FALLBACK" ? sum + (asset.baseValue ?? 0) : sum, 0);
  const total = rawA + rawB;
  if (total <= 0 && !blocking.includes(errors.UNVALUED_ASSET) && !blocking.includes(errors.UNSUPPORTED_ASSET)) blocking.push(errors.ZERO_COMBINED_VALUE);
  const incomplete = blocking.includes(errors.UNVALUED_ASSET) || blocking.includes(errors.UNSUPPORTED_ASSET);
  const freshEvidence: Evidence = freshness === "STALE" ? "LOW" : freshness === "AGING" ? "MEDIUM" : "HIGH";
  const sideA = sideResult(a, total, freshEvidence);
  const sideB = sideResult(b, total, freshEvidence);
  const evidence = incomplete ? "INCOMPLETE" : rankEvidence([sideA.evidence, sideB.evidence]);
  const lowConfidenceFallback = [...a.assets, ...b.assets].some((asset) => asset.valueStatus === "FALLBACK" && asset.assetType !== "K" && asset.assetType !== "DST");
  const status: ResultStatus = blocking.length ? (incomplete ? "SUPPRESSED" : "INVALID") : freshness === "FRESH" && !lowConfidenceFallback ? "AUTHORITATIVE" : "PROVISIONAL";
  const validScore = !blocking.length && total > 0;
  const shareA = validScore ? rawA / total : null;
  const shareB = validScore ? rawB / total : null;
  if (shareA !== null) { sideA.marketShare = { internal: shareA, display: halfUp(shareA * 100, 0) }; sideB.marketShare = { internal: shareB!, display: 100 - sideA.marketShare.display }; }
  const score = validScore ? Math.max(0, Math.min(100, 200 * Math.min(rawA, rawB) / total)) : null;
  const edge: MarketEdgeSide | null = validScore ? rawA === rawB ? "NONE" : rawA > rawB ? "SIDE_A" : "SIDE_B" : null;
  const finalWarnings = [...new Set([...allWarnings, ...(sideA.evidence !== "HIGH" || sideB.evidence !== "HIGH" ? [warnings.RESEARCH_FIELDS_NON_AUTHORITATIVE] : []), ...allWarnings])];
  return { model: { valuationPolicyVersion: POLICY_VERSION, fairnessModelVersion: MODEL_VERSION }, snapshot: { ...snapshot, freshness, ageDays }, sideA, sideB, trade: { resultStatus: status, fairnessScore: score === null ? null : { internal: score, display: halfUp(score, 1) }, fairnessBand: score === null ? null : bandFor(score), marketEdgeSide: edge, rawValueGap: validScore ? Math.abs(rawA - rawB) : null, marketShareGap: validScore ? Math.abs(shareA! - shareB!) : null, evidence, warnings: [...new Set(finalWarnings)], errors: [...new Set(blocking)] }, research: researchFor([a, b], total, input?.researchThresholds) };
}

export { errors as FAIRNESS_ERRORS, warnings as FAIRNESS_WARNINGS, halfUp as decimalHalfUp };
