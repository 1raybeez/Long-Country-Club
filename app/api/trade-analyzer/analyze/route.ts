import { analyzeTradeInternal } from "../../../../lib/trade-analyzer/tradeAnalysisService.ts";
import { PRIVATE_API_SECURITY_POLICY, validatePrivateApiRequestShape } from "../../../../lib/trade-analyzer/privateApiSecurityTypes.ts";
import { resolveTradeAnalyzerLeaguePhase } from "../../../../lib/trade-analyzer/tradePhase.ts";
import { defaultRateLimiter, errorResponse, requestOriginAllowed, safeResponse } from "../../../../lib/trade-analyzer/tradeAnalyzerRouteSupport.ts";
import type { TradeAnalysisServiceRequest } from "../../../../lib/trade-analyzer/serviceTypes.ts";
import type { TradeAnalyzerRuntime } from "../../../../lib/trade-analyzer/tradeAnalyzerRuntime.ts";

const envEnabled = (name: string) => process.env[name] === "true";
const methodResponse = () => errorResponse(405, "METHOD_NOT_ALLOWED", "Trade Analyzer accepts POST requests only.");
const serviceErrorMessage = (code: string) => ({ UNKNOWN_ASSET: "One or more selected assets are no longer available.", EMPTY_SIDE: "Select at least one asset for each side of the trade.", DUPLICATE_ASSET: "An asset can only appear once in a trade package.", CROSS_SIDE_DUPLICATE: "The same asset cannot appear in both trade packages." }[code] ?? "The trade request is invalid.");
const mapServiceError = (code: string) => code === "UNKNOWN_ASSET" ? "UNKNOWN_ASSET" : code === "EMPTY_SIDE" ? "EMPTY_SIDE" : code === "DUPLICATE_ASSET" ? "DUPLICATE_ASSET" : code === "CROSS_SIDE_DUPLICATE" ? "CROSS_SIDE_DUPLICATE" : "INVALID_REQUEST";

const multiValidationCode = (body: Record<string, unknown>) => {
  const participants = Array.isArray(body.participants) ? body.participants : [];
  if (participants.length < 3 || participants.length > 4) return "INVALID_PARTICIPANT_COUNT";
  const ids = participants.map((participant) => typeof participant === "object" && participant !== null && !Array.isArray(participant) ? (participant as { franchiseId?: unknown }).franchiseId : undefined);
  if (ids.some((id) => typeof id !== "string" || id.length === 0)) return "MALFORMED_PARTICIPANT";
  if (new Set(ids).size !== ids.length) return "DUPLICATE_FRANCHISE";
  for (const participant of participants) {
    if (!participant || typeof participant !== "object" || Array.isArray(participant)) return "MALFORMED_PARTICIPANT";
    const outgoing = (participant as { outgoingAssets?: unknown }).outgoingAssets;
    if (!Array.isArray(outgoing)) return "MALFORMED_PARTICIPANT";
    if (outgoing.length === 0) return "EMPTY_OUTGOING_PACKAGE";
    for (const item of outgoing) {
      if (!item || typeof item !== "object" || Array.isArray(item)) return "MALFORMED_OUTGOING_ASSET";
      const outgoingAsset = item as { assetId?: unknown; destinationFranchiseId?: unknown };
      if (typeof outgoingAsset.assetId !== "string" || typeof outgoingAsset.destinationFranchiseId !== "string") return "MALFORMED_OUTGOING_ASSET";
    }
  }
  const assets = participants.flatMap((participant) => (participant as { outgoingAssets: Array<{ assetId: string; destinationFranchiseId: string }> }).outgoingAssets);
  if (new Set(assets.map((item) => item.assetId)).size !== assets.length) return "DUPLICATE_ASSET";
  const participantIds = new Set(ids.filter((id): id is string => typeof id === "string"));
  for (const [index, participant] of participants.entries()) {
    const sender = ids[index];
    for (const outgoing of (participant as { outgoingAssets: Array<{ assetId: string; destinationFranchiseId: string }> }).outgoingAssets) {
      if (outgoing.destinationFranchiseId === sender) return "SELF_DESTINATION";
      if (!participantIds.has(outgoing.destinationFranchiseId)) return "INVALID_DESTINATION";
    }
  }
  return "OTHER_SCHEMA_FAILURE";
};

const logMultiValidation = (body: Record<string, unknown>, details: { stage: string; code: string; fieldPath: string; ownershipReached?: boolean; ownershipResult?: string }) => {
  if (!Array.isArray(body.participants)) return;
  const participants = body.participants;
  const ids = participants.map((participant) => typeof participant === "object" && participant !== null && !Array.isArray(participant) ? (participant as { franchiseId?: unknown }).franchiseId : undefined);
  const labels = ids.map((_, index) => `Participant ${index + 1}`);
  const labelFor = (value: unknown) => { const index = ids.findIndex((id) => id === value); return index >= 0 ? labels[index] : "Unknown participant"; };
  const outgoing = participants.map((participant) => participant && typeof participant === "object" && !Array.isArray(participant) && Array.isArray((participant as { outgoingAssets?: unknown }).outgoingAssets) ? (participant as { outgoingAssets: Array<{ destinationFranchiseId?: unknown }> }).outgoingAssets : []);
  const allAssets = participants.flatMap((participant) => participant && typeof participant === "object" && !Array.isArray(participant) && Array.isArray((participant as { outgoingAssets?: unknown }).outgoingAssets) ? (participant as { outgoingAssets: Array<{ assetId?: unknown }> }).outgoingAssets : []);
  console.info("[trade-analyzer-multi-request]", JSON.stringify({ timestamp: new Date().toISOString(), mode: body.sandbox === true ? "sandbox" : "league", participantCount: participants.length, participantSlots: labels, participantLabels: labels, outgoingAssetCounts: outgoing.map((items) => items.length), destinationRouting: outgoing.map((items) => ({ destinationLabels: items.map((item) => labelFor(item.destinationFranchiseId)), uniqueDestinationCount: new Set(items.map((item) => labelFor(item.destinationFranchiseId))).size })), duplicateAsset: new Set(allAssets.map((item) => item.assetId)).size !== allAssets.length ? "YES" : "NO", duplicateFranchise: new Set(ids).size !== ids.length ? "YES" : "NO", emptyOutgoingPackage: outgoing.some((items) => items.length === 0) ? "YES" : "NO", destinationReferencesValid: outgoing.every((items, index) => items.every((item) => item.destinationFranchiseId !== ids[index] && ids.includes(item.destinationFranchiseId))) ? "YES" : "NO", ownershipValidationReached: details.ownershipReached ? "YES" : "NO", ownershipValidationResult: details.ownershipResult ?? "NOT_REACHED", validationStage: details.stage, validationErrorCode: details.code, validationFieldPath: details.fieldPath }));
};

export interface TradeAnalyzerRouteDependencies {
  getSession?: typeof import("../../../../lib/auth/session.ts").getCurrentMemberSession;
  loadRuntime?: typeof import("../../../../lib/trade-analyzer/tradeAnalyzerRuntime.ts").getTradeAnalyzerRuntime;
  now?: () => Date;
  featureEnabled?: () => boolean;
  licenseApproved?: () => boolean;
  limiter?: typeof defaultRateLimiter;
}

export function createTradeAnalyzerPostHandler(dependencies: TradeAnalyzerRouteDependencies = {}) {
  const getSession = dependencies.getSession ?? (async () => (await import("../../../../lib/auth/session.ts")).getCurrentMemberSession());
  const loadRuntime = dependencies.loadRuntime ?? (async () => (await import("../../../../lib/trade-analyzer/tradeAnalyzerRuntime.ts")).getTradeAnalyzerRuntime());
  const now = dependencies.now ?? (() => new Date());
  const featureEnabled = dependencies.featureEnabled ?? (() => envEnabled("TRADE_ANALYZER_FEATURE_ENABLED"));
  const licenseApproved = dependencies.licenseApproved ?? (() => envEnabled("TRADE_ANALYZER_PRIVATE_OUTPUT_APPROVED"));
  const limiter = dependencies.limiter ?? defaultRateLimiter;
  return async function handle(request: Request) {
    try {
      if (request.method !== "POST") return methodResponse();
      const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
      if (contentType !== PRIVATE_API_SECURITY_POLICY.contentType) return errorResponse(415, "UNSUPPORTED_MEDIA_TYPE", "Trade Analyzer requires JSON input.");
      const declaredLength = Number(request.headers.get("content-length") ?? 0);
      if (declaredLength > PRIVATE_API_SECURITY_POLICY.maxBodyBytes) return errorResponse(413, "REQUEST_TOO_LARGE", "The trade request is too large.");
      const bodyBytes = await request.arrayBuffer();
      if (bodyBytes.byteLength > PRIVATE_API_SECURITY_POLICY.maxBodyBytes) return errorResponse(413, "REQUEST_TOO_LARGE", "The trade request is too large.");
      if (!requestOriginAllowed(request)) return errorResponse(403, "ORIGIN_NOT_ALLOWED", "This request must come from the LCC application.");
      const session = await getSession();
      if (!session?.identity) return errorResponse(401, "UNAUTHENTICATED", "This feature requires sign-in.");
      if (!session.member) return errorResponse(403, "MEMBER_ACCESS_REQUIRED", "Trade Analyzer access is available to active LCC members.");
      if (!featureEnabled()) return errorResponse(403, "FEATURE_NOT_AVAILABLE", "Trade Analyzer is not available yet.");
      if (!licenseApproved()) return errorResponse(403, "SOURCE_LICENSE_UNAPPROVED", "Trade Analyzer is unavailable while source licensing is under review.");
      if (!limiter.allow(session.member.ownerId)) return errorResponse(429, "RATE_LIMITED", "Too many Trade Analyzer requests. Please try again shortly.");
      let body: unknown;
      try { body = JSON.parse(new TextDecoder().decode(bodyBytes)); } catch { return errorResponse(400, "INVALID_REQUEST", "The trade request is invalid."); }
      const requestShape = validatePrivateApiRequestShape(body);
      if (!requestShape.valid) {
        if (body && typeof body === "object" && !Array.isArray(body) && Array.isArray((body as Record<string, unknown>).participants)) logMultiValidation(body as Record<string, unknown>, { stage: "REQUEST_SCHEMA", code: multiValidationCode(body as Record<string, unknown>), fieldPath: "participants" });
        return errorResponse(400, "INVALID_REQUEST", "The trade request is invalid.");
      }
      let runtime: TradeAnalyzerRuntime;
      try { runtime = await loadRuntime(); } catch { return errorResponse(503, "SNAPSHOT_UNAVAILABLE", "Trade Analyzer is temporarily unavailable."); }
      const typedBody = body as Record<string, unknown>;
      const serviceRequest: TradeAnalysisServiceRequest = Array.isArray(typedBody.participants) ? { participants: typedBody.participants as TradeAnalysisServiceRequest["participants"], sandbox: typedBody.sandbox === true, evaluatedAt: now().toISOString(), leaguePhase: resolveTradeAnalyzerLeaguePhase(now()), outputMode: "INTERNAL" } : { sideA: typedBody.sideA as TradeAnalysisServiceRequest["sideA"], sideB: typedBody.sideB as TradeAnalysisServiceRequest["sideB"], evaluatedAt: now().toISOString(), leaguePhase: resolveTradeAnalyzerLeaguePhase(now()), outputMode: "INTERNAL", ownershipValidation: typedBody.validateOwnership === true };
      const result = analyzeTradeInternal(serviceRequest, { catalog: runtime.catalog, snapshot: runtime.snapshot, modelVersions: { valuationPolicyVersion: "valuation-v1", fairnessModelVersion: "fairness-v1" } });
      if (result.status === "INVALID_REQUEST") { const code = result.errors[0] ?? "INVALID_REQUEST"; const ownershipFailed = result.errors.includes("OWNERSHIP_MISMATCH"); if (body && typeof body === "object" && !Array.isArray(body) && Array.isArray((body as Record<string, unknown>).participants)) logMultiValidation(body as Record<string, unknown>, { stage: "DOMAIN_VALIDATION", code: ownershipFailed ? "ASSET_NOT_OWNED" : code, fieldPath: ownershipFailed ? "participants[].outgoingAssets[].assetId" : "participants", ownershipReached: ownershipFailed, ownershipResult: ownershipFailed ? "FAIL" : undefined }); return errorResponse(400, mapServiceError(code), serviceErrorMessage(code)); }
      if (result.status === "INTERNAL_ERROR") return errorResponse(503, result.errors.includes("SNAPSHOT_NOT_FOUND") || result.errors.includes("SNAPSHOT_INTEGRITY_FAILED") ? "SNAPSHOT_UNAVAILABLE" : "INTERNAL_ERROR", result.errors.includes("SNAPSHOT_NOT_FOUND") || result.errors.includes("SNAPSHOT_INTEGRITY_FAILED") ? "Trade Analyzer is temporarily unavailable." : "Trade analysis is temporarily unavailable.");
      return safeResponse({ ok: true, data: result });
    } catch { return errorResponse(500, "INTERNAL_ERROR", "Trade analysis is temporarily unavailable."); }
  };
}

export const POST = createTradeAnalyzerPostHandler();
export async function GET() { return methodResponse(); }
