import "node:fs";
import { getLccOwnerById } from "../lccOwners.ts";
import { calculateCurrentTrade } from "./currentValuationAdapter.ts";
import type { CurrentTradeRequest } from "./types";
import type { ApprovedSnapshotReference, ServiceDependencies, ServiceOutputMode, ServiceValidationResult, TradeAnalysisServiceRequest, TradeAnalysisServiceResponse } from "./serviceTypes";
import { calculateMultiTeamFairness } from "./multiTeamFairnessEngine.ts";
import type { MultiTeamParticipantInput } from "./multiTeamTypes";
import { calculateRosterImpact } from "./rosterImpactEngine.ts";
import { calculateDynastyDirection, ensureDynastyPresentation } from "./dynastyDirectionEngine.ts";
import type { DynastyDirectionInput } from "./dynastyDirectionEngine.ts";
import type { CurrentCatalogAsset } from "./types";
import { calculateTradeVerdict } from "./tradeVerdictEngine.ts";
import type { TradeVerdictInput } from "./tradeVerdictTypes";

export const APPROVED_SNAPSHOT_DATE = "2026-08-26" as const;
export const EXPECTED_MODEL_VERSIONS = { valuationPolicyVersion: "valuation-v1", fairnessModelVersion: "fairness-v1" } as const;

const unique = (values: string[]) => [...new Set(values)];
const knownRootKeys = new Set(["sideA", "sideB", "participants", "evaluatedAt", "leaguePhase", "outputMode", "ownershipValidation"]);
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

const emptyResponse = (status: TradeAnalysisServiceResponse["status"], errors: string[], model: TradeAnalysisServiceResponse["model"] = EXPECTED_MODEL_VERSIONS, message?: string): TradeAnalysisServiceResponse => ({ success: false, status, engineStatus: null, model, snapshot: null, sideA: null, sideB: null, trade: null, ownership: null, warnings: [], errors: unique(errors), multiTeam: null, rosterImpact: null, dynastyOutlook: null, contextualVerdict: null, ...(message ? { message } : {}) });

const modelMatches = (dependencies: ServiceDependencies) => dependencies.modelVersions?.valuationPolicyVersion === EXPECTED_MODEL_VERSIONS.valuationPolicyVersion && dependencies.modelVersions?.fairnessModelVersion === EXPECTED_MODEL_VERSIONS.fairnessModelVersion;
const snapshotMatches = (snapshot: ApprovedSnapshotReference, catalog: ServiceDependencies["catalog"]) => snapshot.date === APPROVED_SNAPSHOT_DATE && catalog.snapshotDate === APPROVED_SNAPSHOT_DATE && snapshot.integrityValid && snapshot.sourceLicenseStatus !== "";
const franchiseNameFor = (franchiseId: string) => getLccOwnerById(franchiseId)?.managerPage.sleeperName ?? getLccOwnerById(franchiseId)?.displayName ?? franchiseId;

function internalError(): TradeAnalysisServiceResponse {
  return emptyResponse("INTERNAL_ERROR", ["INTERNAL_ANALYSIS_FAILED"], EXPECTED_MODEL_VERSIONS, "Internal trade analysis could not be completed.");
}

export function analyzeTradeInternal(request: unknown, dependencies: ServiceDependencies): TradeAnalysisServiceResponse {
  try {
    if (safeObject(request) && Array.isArray(request.participants)) return analyzeMultiTeam(request.participants, request, dependencies);
    const validation = validateTradeAnalysisRequest(request, dependencies.catalog);
    if (validation.errors.length) return emptyResponse("INVALID_REQUEST", validation.errors);
    if (!modelMatches(dependencies)) return emptyResponse("INTERNAL_ERROR", ["MODEL_VERSION_MISMATCH"], EXPECTED_MODEL_VERSIONS, "Internal trade analysis is unavailable.");
    if (!snapshotMatches(dependencies.snapshot, dependencies.catalog)) return emptyResponse("INTERNAL_ERROR", [dependencies.snapshot.integrityValid ? "SNAPSHOT_NOT_FOUND" : "SNAPSHOT_INTEGRITY_FAILED"], EXPECTED_MODEL_VERSIONS, "Approved market snapshot is unavailable.");
    const typed = request as TradeAnalysisServiceRequest;
    const adapterRequest: CurrentTradeRequest = { sideA: typed.sideA!.assetIds, sideB: typed.sideB!.assetIds, evaluatedAt: typed.evaluatedAt, leaguePhase: typed.leaguePhase, publicOutput: typed.outputMode === "PUBLIC", ownership: typed.ownershipValidation ? { sideAOwnerId: typed.sideA!.ownerId, sideBOwnerId: typed.sideB!.ownerId } : undefined };
    const result = calculateCurrentTrade(dependencies.catalog, adapterRequest);
    if (result.adapterStatus === "INVALID") return emptyResponse("INVALID_REQUEST", result.validationErrors);
    const engine = result.engineResult;
    if (!engine) return internalError();
    const ownership = result.ownership;
    const ownershipWarnings = typed.ownershipValidation && (ownership.sideA === "NOT_CURRENTLY_OWNED" || ownership.sideB === "NOT_CURRENTLY_OWNED") ? ["OWNERSHIP_MISMATCH"] : [];
    if (typed.outputMode === "PUBLIC" && engine.trade.errors.includes("SOURCE_LICENSE_UNAPPROVED")) return { success: false, status: "BLOCKED", engineStatus: null, model: { ...EXPECTED_MODEL_VERSIONS, availability: "BLOCKED" }, snapshot: null, sideA: null, sideB: null, trade: null, ownership: null, warnings: [], errors: ["SOURCE_LICENSE_UNAPPROVED"], message: "Trade analysis is unavailable for public output while source licensing is under review." };
    const rosterImpact = typed.outputMode === "PUBLIC" || !typed.sideA?.ownerId || !typed.sideB?.ownerId ? null : calculateRosterImpact([{ franchiseId: typed.sideA!.ownerId, franchiseName: franchiseNameFor(typed.sideA!.ownerId), sends: typed.sideA!.assetIds.map((id) => dependencies.catalog.byAssetId[id]).filter(Boolean) as CurrentCatalogAsset[], receives: typed.sideB!.assetIds.map((id) => dependencies.catalog.byAssetId[id]).filter(Boolean) as CurrentCatalogAsset[] }, { franchiseId: typed.sideB!.ownerId, franchiseName: franchiseNameFor(typed.sideB!.ownerId), sends: typed.sideB!.assetIds.map((id) => dependencies.catalog.byAssetId[id]).filter(Boolean) as CurrentCatalogAsset[], receives: typed.sideA!.assetIds.map((id) => dependencies.catalog.byAssetId[id]).filter(Boolean) as CurrentCatalogAsset[] }]);
    const currentAssets = dependencies.catalog.assets.filter((asset) => asset.ownerId === typed.sideA?.ownerId || asset.ownerId === typed.sideB?.ownerId);
    const dynastyOutlook = typed.outputMode === "PUBLIC" || !typed.sideA?.ownerId || !typed.sideB?.ownerId ? null : ensureDynastyPresentation(calculateDynastyDirection([dynastyInput(typed.sideA.ownerId, typed.sideA.assetIds, typed.sideB.assetIds, currentAssets, dependencies.catalog.assets), dynastyInput(typed.sideB.ownerId, typed.sideB.assetIds, typed.sideA.assetIds, currentAssets, dependencies.catalog.assets)]));
    const contextualVerdict = typed.outputMode === "PUBLIC" || !typed.sideA?.ownerId || !typed.sideB?.ownerId ? null : calculateTradeVerdict(verdictInputs([typed.sideA.ownerId, typed.sideB.ownerId], engine.sideA.rawValue, engine.sideB.rawValue, engine.trade.fairnessBand, rosterImpact, dynastyOutlook));
    return { success: true, status: "OK", engineStatus: engine.trade.resultStatus, model: engine.model, snapshot: { sourceName: engine.snapshot.sourceName, snapshotDate: engine.snapshot.snapshotDate, retrievedAt: engine.snapshot.snapshotRetrievedAt, sourceLicenseStatus: engine.snapshot.sourceLicenseStatus ?? "" }, sideA: engine.sideA, sideB: engine.sideB, trade: engine.trade, ownership: typed.ownershipValidation ? ownership : null, warnings: [...new Set([...engine.trade.warnings, ...ownershipWarnings])], errors: [], multiTeam: null, rosterImpact, dynastyOutlook, contextualVerdict };
  } catch {
    return internalError();
  }
}

function analyzeMultiTeam(rawParticipants: unknown[], rawRequest: Record<string, unknown>, dependencies: ServiceDependencies): TradeAnalysisServiceResponse {
  const errors: string[] = [];
  if (rawParticipants.length < 3 || rawParticipants.length > 4) errors.push("INVALID_PARTICIPANT_COUNT");
  if (!hasOnly(rawRequest, new Set(["participants", "evaluatedAt", "leaguePhase", "outputMode"]))) errors.push("INVALID_REQUEST");
  if (typeof rawRequest.evaluatedAt !== "string" || Number.isNaN(Date.parse(rawRequest.evaluatedAt))) errors.push("INVALID_TIMESTAMP");
  if (!phaseValues.includes(rawRequest.leaguePhase as typeof phaseValues[number])) errors.push("MISSING_PHASE");
  if (rawRequest.outputMode !== "INTERNAL" && rawRequest.outputMode !== "PUBLIC") errors.push("INVALID_OUTPUT_MODE");
  const participants = rawParticipants as MultiTeamParticipantInput[];
  const franchiseIds = participants.map((participant) => participant?.franchiseId);
  if (franchiseIds.some((id) => typeof id !== "string" || id.length === 0) || new Set(franchiseIds).size !== franchiseIds.length) errors.push("INVALID_PARTICIPANTS");
  const participating = new Set(franchiseIds.filter((id): id is string => typeof id === "string"));
  const seenAssets = new Set<string>();
  const resolved = participants.map((participant) => {
    if (!safeObject(participant) || !hasOnly(participant, new Set(["franchiseId", "outgoingAssets"])) || !Array.isArray(participant.outgoingAssets) || participant.outgoingAssets.length === 0 || participant.outgoingAssets.length > 15) { errors.push("INVALID_PARTICIPANTS"); return { franchiseId: String(participant?.franchiseId ?? ""), sends: [], receives: [] }; }
    const sends = participant.outgoingAssets.flatMap((outgoing) => {
      if (!safeObject(outgoing) || !hasOnly(outgoing, new Set(["assetId", "destinationFranchiseId"])) || typeof outgoing.assetId !== "string" || typeof outgoing.destinationFranchiseId !== "string") { errors.push("INVALID_ROUTING"); return []; }
      const asset = dependencies.catalog.byAssetId[outgoing.assetId];
      if (!asset) errors.push("UNKNOWN_ASSET");
      if (seenAssets.has(outgoing.assetId)) errors.push("DUPLICATE_ASSET");
      seenAssets.add(outgoing.assetId);
      if (outgoing.destinationFranchiseId === participant.franchiseId || !participating.has(outgoing.destinationFranchiseId)) errors.push("INVALID_DESTINATION");
      if (asset?.ownerId !== participant.franchiseId) errors.push("OWNERSHIP_MISMATCH");
      return asset ? [{ asset, destinationFranchiseId: outgoing.destinationFranchiseId }] : [];
    });
    const receives = participants.flatMap((other) => other?.outgoingAssets?.flatMap((outgoing) => outgoing?.destinationFranchiseId === participant.franchiseId ? [dependencies.catalog.byAssetId[outgoing.assetId]].filter(Boolean) : []) ?? []);
    return { franchiseId: participant.franchiseId, sends: sends.map((item) => item.asset), receives };
  });
  const totalAssets = participants.reduce((sum, participant) => sum + (Array.isArray(participant?.outgoingAssets) ? participant.outgoingAssets.length : 0), 0);
  if (totalAssets > 40) errors.push("TOO_MANY_ASSETS");
  if (errors.length) return emptyResponse("INVALID_REQUEST", errors, { ...EXPECTED_MODEL_VERSIONS, multiTeamModelVersion: "fairness-multi-v1" });
  if (!modelMatches(dependencies)) return emptyResponse("INTERNAL_ERROR", ["MODEL_VERSION_MISMATCH"], { ...EXPECTED_MODEL_VERSIONS, multiTeamModelVersion: "fairness-multi-v1" });
  if (!snapshotMatches(dependencies.snapshot, dependencies.catalog)) return emptyResponse("INTERNAL_ERROR", [dependencies.snapshot.integrityValid ? "SNAPSHOT_NOT_FOUND" : "SNAPSHOT_INTEGRITY_FAILED"], { ...EXPECTED_MODEL_VERSIONS, multiTeamModelVersion: "fairness-multi-v1" });
  const calculated = calculateMultiTeamFairness(resolved);
  const multiTeam = { ...calculated, warnings: [...new Set([...calculated.warnings, ...(dependencies.snapshot.sourceLicenseStatus === "APPROVED" ? [] : ["SOURCE_LICENSE_UNAPPROVED"])])] };
  const rosterImpact = calculateRosterImpact(participants.map((participant, index) => ({ franchiseId: participant.franchiseId, franchiseName: franchiseNameFor(participant.franchiseId), sends: (resolved[index]?.sends ?? []) as CurrentCatalogAsset[], receives: (resolved[index]?.receives ?? []) as CurrentCatalogAsset[] })));
  if (rawRequest.outputMode === "PUBLIC" && multiTeam.warnings.includes("SOURCE_LICENSE_UNAPPROVED")) return emptyResponse("BLOCKED", ["SOURCE_LICENSE_UNAPPROVED"], { ...EXPECTED_MODEL_VERSIONS, multiTeamModelVersion: "fairness-multi-v1", availability: "BLOCKED" });
  const dynastyOutlook = rawRequest.outputMode === "PUBLIC" ? null : ensureDynastyPresentation(calculateDynastyDirection(participants.map((participant, index) => dynastyInput(participant.franchiseId, (resolved[index]?.sends ?? []).map((asset) => asset.assetId), (resolved[index]?.receives ?? []).map((asset) => asset.assetId), dependencies.catalog.assets.filter((asset) => asset.ownerId === participant.franchiseId), dependencies.catalog.assets))));
  const contextualVerdict = rawRequest.outputMode === "PUBLIC" ? null : calculateTradeVerdict(participants.map((participant, index) => ({ franchiseId: participant.franchiseId, franchiseName: franchiseNameFor(participant.franchiseId), market: { netValueChange: multiTeam.participants[index]?.netValueChange ?? 0, fairnessBand: multiTeam.fairnessBand }, rosterImpact: rosterImpact.participants[index] ?? null, dynasty: dynastyOutlook?.participants[index] ?? null })));
  return { success: true, status: "OK", engineStatus: multiTeam.status, model: { ...EXPECTED_MODEL_VERSIONS, multiTeamModelVersion: "fairness-multi-v1" }, snapshot: { sourceName: dependencies.snapshot.sourceName, snapshotDate: dependencies.snapshot.date, retrievedAt: dependencies.snapshot.retrievedAt, sourceLicenseStatus: dependencies.snapshot.sourceLicenseStatus }, sideA: null, sideB: null, trade: null, ownership: null, warnings: multiTeam.warnings, errors: multiTeam.errors, multiTeam, rosterImpact: rawRequest.outputMode === "PUBLIC" ? null : rosterImpact, dynastyOutlook, contextualVerdict };
}

function verdictInputs(ownerIds: string[], sideAValue: number, sideBValue: number, fairnessBand: string | null, rosterImpact: TradeAnalysisServiceResponse["rosterImpact"], dynastyOutlook: TradeAnalysisServiceResponse["dynastyOutlook"]): TradeVerdictInput[] { return ownerIds.map((ownerId, index) => ({ franchiseId: ownerId, franchiseName: franchiseNameFor(ownerId), market: { netValueChange: index === 0 ? sideBValue - sideAValue : sideAValue - sideBValue, fairnessBand }, rosterImpact: rosterImpact?.participants.find((participant) => participant.franchiseId === ownerId) ?? null, dynasty: dynastyOutlook?.participants.find((participant) => participant.franchiseId === ownerId) ?? null })); }

function dynastyInput(ownerId: string, sends: string[], receives: string[], currentAssets: CurrentCatalogAsset[], allAssets: CurrentCatalogAsset[]): DynastyDirectionInput { return { franchiseId: ownerId, franchiseName: franchiseNameFor(ownerId), currentAssets: currentAssets.filter((asset) => asset.ownerId === ownerId), sends: sends.map((id) => allAssets.find((asset) => asset.assetId === id)).filter(Boolean) as CurrentCatalogAsset[], receives: receives.map((id) => allAssets.find((asset) => asset.assetId === id)).filter(Boolean) as CurrentCatalogAsset[] }; }

export const createTradeAnalysisService = (dependencies: ServiceDependencies) => (request: unknown) => analyzeTradeInternal(request, dependencies);
