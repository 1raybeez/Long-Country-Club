import type { CurrentAssetCatalog, CurrentTradeResult, FairnessEngineResult, LeaguePhase, OwnershipDiagnostic } from "./types";

export type ServiceOutputMode = "INTERNAL" | "PUBLIC";
export type ServiceStatus = "OK" | "BLOCKED" | "INVALID_REQUEST" | "INTERNAL_ERROR";

export interface TradeAnalysisServiceRequest {
  sideA: { assetIds: string[]; ownerId?: string };
  sideB: { assetIds: string[]; ownerId?: string };
  evaluatedAt: string;
  leaguePhase: LeaguePhase;
  outputMode: ServiceOutputMode;
  ownershipValidation?: boolean;
}

export interface ApprovedSnapshotReference {
  date: string;
  sourceName: string;
  sourceUrl: string;
  retrievedAt: string;
  sourceLicenseStatus: string;
  integrityValid: boolean;
  integrityErrors?: string[];
}

export interface ServiceDependencies {
  catalog: CurrentAssetCatalog;
  snapshot: ApprovedSnapshotReference;
  modelVersions?: { valuationPolicyVersion: string; fairnessModelVersion: string };
}

export interface ServiceOwnershipResult {
  sideA: OwnershipDiagnostic;
  sideB: OwnershipDiagnostic;
}

export interface TradeAnalysisServiceResponse {
  success: boolean;
  status: ServiceStatus;
  engineStatus: FairnessEngineResult["trade"]["resultStatus"] | null;
  model: { valuationPolicyVersion: string; fairnessModelVersion: string; availability?: "BLOCKED" };
  snapshot: { sourceName: string; snapshotDate: string; retrievedAt: string; sourceLicenseStatus: string } | null;
  sideA: FairnessEngineResult["sideA"] | null;
  sideB: FairnessEngineResult["sideB"] | null;
  trade: FairnessEngineResult["trade"] | null;
  ownership: ServiceOwnershipResult | null;
  warnings: string[];
  errors: string[];
  message?: string;
}

export interface ServiceValidationResult {
  errors: string[];
  warnings: string[];
}

export type AdapterResultForService = CurrentTradeResult;
