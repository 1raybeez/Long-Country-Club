import "node:fs";
import { calculateCurrentTrade } from "./currentValuationAdapter.ts";
import type { CurrentTradeRequest } from "./types";
import type { ApprovedSnapshotReference, ServiceDependencies, ServiceOutputMode, ServiceValidationResult, TradeAnalysisServiceRequest, TradeAnalysisServiceResponse } from "./serviceTypes";

export const APPROVED_SNAPSHOT_DATE = "2026-08-26" as const;
export const EXPECTED_MODEL_VERSIONS = { valuationPolicyVersion: "valuation-v1", fairnessModelVersion: "fairness-v1" } as const;

const unique = (values: string[]) => [...new Set(values)];
const knownRootKeys = new Set(["sideA", "sideB", "evaluatedAt", "leaguePhase", "outputMode", "ownershipValidation"]);
const knownSideKeys = new Set(["assetIds", "ownerId"]);
const validModes: ServiceOutputMode[] = ["INTERNAL", "PUBLIC"];
const phaseValues = ["DRAFT_WINDOW", "IN_SEASON", "OFFSEASON"] as const;
const safeObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const hasOnly = (value: Record<string, unknown>, keys: Set<string>) => Object.keys(value).every((key) => keys.has(key));

export function validateTradeAnalysisRequest(request: unknown, catalog: ServiceDependencies["catalog"]): ServiceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!safeObject(request) || !hasOnly(request, knownRootKeys)) errors.push("INVALID_REQUEST");
  const candidate = request as Partial<TradeAnalysisServiceRequest>;
  if (!safeObject(candidate?.sideA) || !hasOnly(candidate.sideA, knownSideKeys) || !Array.isArray(candidate.sideA.assetIds)) errors.push("INVALID_REQUEST");
  if (!safeObject(candidate?.sideB) || !hasOnly(candidate.sideB, knownSideKeys) || !Array.isArray(candidate.sideB.assetIds)) errors.push("INVALID_REQUEST");
  const a = candidate?.sideA?.assetIds;
  const b = candidate?.sideB?.assetIds;
  if (Array.isArray(a) && a.length === 0) errors.push("EMPTY_SIDE");
  if (Array.isArray(b) && b.length === 0) errors.push("EMPTY_SIDE");
  if (Array.isArray(a) && unique(a).length !== a.length || Array.isArray(b) && unique(b).length !== b.length) errors.push("DUPLICATE_ASSET");
  if (Array.isArray(a) && Array.isArray(b) && a.some((id) => b.includes(id))) errors.push("CROSS_SIDE_DUPLICATE");
  if (Array.isArray(a) && a.some((id) => typeof id !== "string" || !catalog.byAssetId[id]) || Array.isArray(b) && b.some((id) => typeof id !== "string" || !catalog.byAssetId[id])) errors.push("UNKNOWN_ASSET");
  if (typeof candidate?.evaluatedAt !== "string" || Number.isNaN(Date.parse(candidate.evaluatedAt))) errors.push("INVALID_TIMESTAMP");
  if (!phaseValues.includes(candidate?.leaguePhase as typeof phaseValues[number])) errors.push("MISSING_PHASE");
  if (!validModes.includes(candidate?.outputMode as ServiceOutputMode)) errors.push("INVALID_OUTPUT_MODE");
  if (candidate?.ownershipValidation !== undefined && typeof candidate.ownershipValidation !== "boolean") errors.push("INVALID_REQUEST");
  return { errors: unique(errors), warnings };
}

const emptyResponse = (status: TradeAnalysisServiceResponse["status"], errors: string[], model = EXPECTED_MODEL_VERSIONS, message?: string): TradeAnalysisServiceResponse => ({ success: false, status, engineStatus: null, model, snapshot: null, sideA: null, sideB: null, trade: null, ownership: null, warnings: [], errors: unique(errors), ...(message ? { message } : {}) });

const modelMatches = (dependencies: ServiceDependencies) => dependencies.modelVersions?.valuationPolicyVersion === EXPECTED_MODEL_VERSIONS.valuationPolicyVersion && dependencies.modelVersions?.fairnessModelVersion === EXPECTED_MODEL_VERSIONS.fairnessModelVersion;
const snapshotMatches = (snapshot: ApprovedSnapshotReference, catalog: ServiceDependencies["catalog"]) => snapshot.date === APPROVED_SNAPSHOT_DATE && catalog.snapshotDate === APPROVED_SNAPSHOT_DATE && snapshot.integrityValid && snapshot.sourceLicenseStatus !== "";

function internalError(): TradeAnalysisServiceResponse {
  return emptyResponse("INTERNAL_ERROR", ["INTERNAL_ANALYSIS_FAILED"], EXPECTED_MODEL_VERSIONS, "Internal trade analysis could not be completed.");
}

export function analyzeTradeInternal(request: unknown, dependencies: ServiceDependencies): TradeAnalysisServiceResponse {
  try {
    const validation = validateTradeAnalysisRequest(request, dependencies.catalog);
    if (validation.errors.length) return emptyResponse("INVALID_REQUEST", validation.errors);
    if (!modelMatches(dependencies)) return emptyResponse("INTERNAL_ERROR", ["MODEL_VERSION_MISMATCH"], EXPECTED_MODEL_VERSIONS, "Internal trade analysis is unavailable.");
    if (!snapshotMatches(dependencies.snapshot, dependencies.catalog)) return emptyResponse("INTERNAL_ERROR", [dependencies.snapshot.integrityValid ? "SNAPSHOT_NOT_FOUND" : "SNAPSHOT_INTEGRITY_FAILED"], EXPECTED_MODEL_VERSIONS, "Approved market snapshot is unavailable.");
    const typed = request as TradeAnalysisServiceRequest;
    const adapterRequest: CurrentTradeRequest = { sideA: typed.sideA.assetIds, sideB: typed.sideB.assetIds, evaluatedAt: typed.evaluatedAt, leaguePhase: typed.leaguePhase, publicOutput: typed.outputMode === "PUBLIC", ownership: typed.ownershipValidation ? { sideAOwnerId: typed.sideA.ownerId, sideBOwnerId: typed.sideB.ownerId } : undefined };
    const result = calculateCurrentTrade(dependencies.catalog, adapterRequest);
    if (result.adapterStatus === "INVALID") return emptyResponse("INVALID_REQUEST", result.validationErrors);
    const engine = result.engineResult;
    if (!engine) return internalError();
    const ownership = result.ownership;
    const ownershipWarnings = typed.ownershipValidation && (ownership.sideA === "NOT_CURRENTLY_OWNED" || ownership.sideB === "NOT_CURRENTLY_OWNED") ? ["OWNERSHIP_MISMATCH"] : [];
    if (typed.outputMode === "PUBLIC" && engine.trade.errors.includes("SOURCE_LICENSE_UNAPPROVED")) return { success: false, status: "BLOCKED", engineStatus: null, model: { ...EXPECTED_MODEL_VERSIONS, availability: "BLOCKED" }, snapshot: null, sideA: null, sideB: null, trade: null, ownership: null, warnings: [], errors: ["SOURCE_LICENSE_UNAPPROVED"], message: "Trade analysis is unavailable for public output while source licensing is under review." };
    return { success: true, status: "OK", engineStatus: engine.trade.resultStatus, model: engine.model, snapshot: { sourceName: engine.snapshot.sourceName, snapshotDate: engine.snapshot.snapshotDate, retrievedAt: engine.snapshot.snapshotRetrievedAt, sourceLicenseStatus: engine.snapshot.sourceLicenseStatus ?? "" }, sideA: engine.sideA, sideB: engine.sideB, trade: engine.trade, ownership: typed.ownershipValidation ? ownership : null, warnings: [...new Set([...engine.trade.warnings, ...ownershipWarnings])], errors: [] };
  } catch {
    return internalError();
  }
}

export const createTradeAnalysisService = (dependencies: ServiceDependencies) => (request: unknown) => analyzeTradeInternal(request, dependencies);
