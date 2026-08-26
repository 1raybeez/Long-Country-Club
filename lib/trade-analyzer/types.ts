export type AssetType = "PLAYER" | "PICK" | "K" | "DST" | "UNSUPPORTED";
export type PlayerPosition = "QB" | "RB" | "WR" | "TE" | "K" | "DST";
export type ValueStatus = "VALUED" | "FALLBACK" | "UNVALUED" | "UNSUPPORTED";
export type Evidence = "HIGH" | "MEDIUM" | "LOW" | "INCOMPLETE";
export type LeaguePhase = "DRAFT_WINDOW" | "IN_SEASON" | "OFFSEASON";
export type Freshness = "FRESH" | "AGING" | "STALE";
export type ResultStatus = "AUTHORITATIVE" | "PROVISIONAL" | "SUPPRESSED" | "INVALID";
export type FairnessBand = "VERY EVEN" | "FAIR" | "SLIGHT EDGE" | "CLEAR EDGE" | "LOPSIDED";
export type MarketEdgeSide = "SIDE_A" | "SIDE_B" | "NONE";

export interface NormalizedAsset {
  assetId: string;
  assetType: AssetType;
  displayName: string;
  position?: PlayerPosition;
  season?: number;
  round?: number;
  slot?: number;
  pickTier?: "EARLY" | "MID" | "LATE";
  pickKind?: "EXACT_SLOT" | "TIERED" | "GENERIC_ROUND";
  baseValue?: number;
  valueStatus: ValueStatus;
  valueMethod: string;
  sourceName: string;
  sourceRowId?: string;
  snapshotDate?: string;
  evidence?: Evidence;
  warnings?: string[];
}

export interface TradeSideInput {
  sideId: string;
  assets: NormalizedAsset[];
}

export interface SnapshotContext {
  sourceName: string;
  sourceUrl?: string;
  sourceLicenseStatus?: string;
  sourceAttribution?: string;
  snapshotDate: string;
  snapshotRetrievedAt: string;
  evaluatedAt: string;
  leaguePhase: LeaguePhase;
  leagueConfiguration?: Record<string, unknown>;
  responseHash?: string;
}

export interface FairnessEngineInput {
  sideA: TradeSideInput;
  sideB: TradeSideInput;
  snapshot: SnapshotContext;
  outputContext?: "PRIVATE" | "PUBLIC";
  researchThresholds?: {
    eliteValueThreshold?: number;
    replacementValueThreshold?: number;
  };
}

export interface AssetCounts {
  total: number;
  valued: number;
  fallback: number;
  unvalued: number;
  unsupported: number;
}

export interface DisplayNumber {
  internal: number;
  display: number;
}

export interface FairnessSideResult {
  sideId: string;
  assets: NormalizedAsset[];
  rawValue: number;
  knownValueSubtotal: number;
  marketShare: DisplayNumber | null;
  valuedAssetCount: number;
  fallbackAssetCount: number;
  unvaluedAssetCount: number;
  unsupportedAssetCount: number;
  evidence: Evidence;
}

export interface FairnessTradeResult {
  resultStatus: ResultStatus;
  fairnessScore: DisplayNumber | null;
  fairnessBand: FairnessBand | null;
  marketEdgeSide: MarketEdgeSide | null;
  rawValueGap: number | null;
  marketShareGap: number | null;
  evidence: Evidence;
  warnings: string[];
  errors: string[];
}

export interface FairnessResearchResult {
  topAssetShare: number | null;
  topTwoShare: number | null;
  eliteAssetCount: number | null;
  belowReplacementCount: number | null;
}

export interface FairnessEngineResult {
  model: { valuationPolicyVersion: "valuation-v1"; fairnessModelVersion: "fairness-v1" };
  snapshot: SnapshotContext & { freshness: Freshness; ageDays: number };
  sideA: FairnessSideResult;
  sideB: FairnessSideResult;
  trade: FairnessTradeResult;
  research: FairnessResearchResult;
}

export interface CurrentCatalogAsset extends NormalizedAsset {
  ownerId?: string;
}

export interface CurrentAssetCatalog {
  snapshotDate: string;
  assets: CurrentCatalogAsset[];
  byAssetId: Record<string, CurrentCatalogAsset>;
  integrity: { valid: boolean; errors: string[] };
}

export interface CurrentTradeRequest {
  sideA: string[];
  sideB: string[];
  evaluatedAt: string;
  leaguePhase: LeaguePhase;
  publicOutput?: boolean;
  ownership?: { sideAOwnerId?: string; sideBOwnerId?: string };
}

export type OwnershipDiagnostic = "CURRENTLY_OWNED" | "NOT_CURRENTLY_OWNED" | "OWNERSHIP_UNKNOWN";

export interface CurrentTradeResult {
  adapterStatus: "VALID" | "INVALID";
  validationErrors: string[];
  ownership: { sideA: OwnershipDiagnostic; sideB: OwnershipDiagnostic };
  engineResult: FairnessEngineResult | null;
}
