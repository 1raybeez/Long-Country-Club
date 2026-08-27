export type PrivateApiAccessRole = "ACTIVE_MEMBER";
export type PrivateApiErrorCode = "UNAUTHENTICATED" | "INVALID_SESSION" | "MEMBER_ACCESS_REQUIRED" | "INVALID_TRADE_REQUEST" | "UNKNOWN_ASSET" | "FEATURE_NOT_AVAILABLE" | "SOURCE_LICENSE_UNAPPROVED" | "RATE_LIMITED" | "REQUEST_TOO_LARGE" | "UNSUPPORTED_MEDIA_TYPE" | "METHOD_NOT_ALLOWED" | "ORIGIN_NOT_ALLOWED" | "INTERNAL_ERROR";

export const PRIVATE_API_SECURITY_POLICY = Object.freeze({
  method: "POST",
  contentType: "application/json",
  maxAssetsPerSide: 15,
  maxTotalAssets: 30,
  maxAssetsPerParticipant: 15,
  maxMultiTeamTotalAssets: 40,
  maxParticipants: 4,
  maxAssetIdLength: 128,
  maxBodyBytes: 16 * 1024,
  rateLimitPerMinute: 30,
  rateLimitBurst: 5,
  cacheControl: "no-store",
  cors: "same-origin",
  featureGateDefault: "OFF",
  licensingGate: "TRADE_ANALYZER_PRIVATE_OUTPUT_APPROVED",
  approvedSnapshotDate: "2026-08-26",
  valuationPolicyVersion: "valuation-v1",
  fairnessModelVersion: "fairness-v1",
  multiTeamFairnessModelVersion: "fairness-multi-v1",
  serverDerivesEvaluatedAt: true,
  serverDerivesLeaguePhase: true,
  ownershipRequiredForAnalysis: false,
} as const);

export interface PrivateApiRequestBody {
  sideA?: { assetIds: string[]; ownerId?: string };
  sideB?: { assetIds: string[]; ownerId?: string };
  participants?: Array<{ franchiseId: string; outgoingAssets: Array<{ assetId: string; destinationFranchiseId: string }> }>;
  validateOwnership?: boolean;
}

export interface ServerAuthContext {
  authenticated: boolean;
  sessionVerified: boolean;
  memberResolved: boolean;
  ownerId?: string;
  memberStatus?: "active" | "retired" | "unknown";
  capabilities?: string[];
}

export interface PrivateApiServerDecision {
  allowed: boolean;
  httpStatus: 200 | 400 | 401 | 403 | 413 | 415 | 429 | 500 | 503;
  code?: PrivateApiErrorCode;
  message?: string;
  ownerId?: string;
}

export interface PrivateApiLoggingPolicy {
  allowedFields: string[];
  prohibitedFields: string[];
  logAssetIdsByDefault: false;
}

export const PRIVATE_API_LOGGING_POLICY: PrivateApiLoggingPolicy = Object.freeze({
  allowedFields: ["timestamp", "requestOutcome", "ownerId", "assetCount", "serviceStatus", "errorCode", "latencyMs", "valuationPolicyVersion", "fairnessModelVersion"],
  prohibitedFields: ["rawFirebaseToken", "sessionCookie", "email", "fullRequestPayload", "assetIds", "FantasyCalcSourceRows", "privateKeys", "filesystemPaths", "stackTraces"],
  logAssetIdsByDefault: false,
});

export const validatePrivateApiRequestShape = (value: unknown): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const isObject = Boolean(value) && typeof value === "object" && !Array.isArray(value);
  if (!isObject) return { valid: false, errors: ["INVALID_TRADE_REQUEST"] };
  const request = value as Record<string, unknown>;
  if (Object.keys(request).some((key) => !["sideA", "sideB", "participants", "validateOwnership"].includes(key))) errors.push("INVALID_TRADE_REQUEST");
  if (Array.isArray(request.participants)) {
    if (request.participants.length < 3 || request.participants.length > PRIVATE_API_SECURITY_POLICY.maxParticipants) errors.push("INVALID_TRADE_REQUEST");
    const franchiseIds = request.participants.map((participant) => typeof participant === "object" && participant !== null && !Array.isArray(participant) ? (participant as { franchiseId?: unknown }).franchiseId : undefined);
    if (franchiseIds.some((id) => typeof id !== "string" || id.length === 0 || id.length > PRIVATE_API_SECURITY_POLICY.maxAssetIdLength) || new Set(franchiseIds).size !== franchiseIds.length) errors.push("INVALID_TRADE_REQUEST");
    const assets = request.participants.flatMap((participant) => { if (!participant || typeof participant !== "object" || Array.isArray(participant) || Object.keys(participant).some((key) => !["franchiseId", "outgoingAssets"].includes(key)) || !Array.isArray((participant as { outgoingAssets?: unknown }).outgoingAssets)) { errors.push("INVALID_TRADE_REQUEST"); return []; } const outgoing = (participant as { outgoingAssets: unknown[] }).outgoingAssets; if (outgoing.length === 0 || outgoing.length > PRIVATE_API_SECURITY_POLICY.maxAssetsPerParticipant) errors.push("INVALID_TRADE_REQUEST"); return outgoing; });
    request.participants.forEach((participant) => { if (!participant || typeof participant !== "object" || Array.isArray(participant)) return; const sender = (participant as { franchiseId?: unknown }).franchiseId; const outgoing = (participant as { outgoingAssets?: unknown }).outgoingAssets; if (!Array.isArray(outgoing)) return; outgoing.forEach((item) => { if (!item || typeof item !== "object" || Array.isArray(item)) return; const destination = (item as { destinationFranchiseId?: unknown }).destinationFranchiseId; if (destination === sender || !franchiseIds.includes(destination)) errors.push("INVALID_TRADE_REQUEST"); }); });
    if (assets.length > PRIVATE_API_SECURITY_POLICY.maxMultiTeamTotalAssets) errors.push("INVALID_TRADE_REQUEST");
    assets.forEach((outgoing) => { if (!outgoing || typeof outgoing !== "object" || Array.isArray(outgoing) || Object.keys(outgoing).some((key) => !["assetId", "destinationFranchiseId"].includes(key))) { errors.push("INVALID_TRADE_REQUEST"); return; } const item = outgoing as { assetId?: unknown; destinationFranchiseId?: unknown }; if ([item.assetId, item.destinationFranchiseId].some((id) => typeof id !== "string" || id.length === 0 || id.length > PRIVATE_API_SECURITY_POLICY.maxAssetIdLength || /[\u0000-\u001f\u007f]/.test(id))) errors.push("INVALID_TRADE_REQUEST"); });
    if (new Set(assets.map((outgoing) => typeof outgoing === "object" && outgoing !== null ? (outgoing as { assetId?: unknown }).assetId : undefined)).size !== assets.length) errors.push("INVALID_TRADE_REQUEST");
    if (request.validateOwnership !== undefined) errors.push("INVALID_TRADE_REQUEST");
    return { valid: errors.length === 0, errors: [...new Set(errors)] };
  }
  for (const sideName of ["sideA", "sideB"]) {
    const side = request[sideName];
    if (!side || typeof side !== "object" || Array.isArray(side) || Object.keys(side as object).some((key) => key !== "assetIds" && key !== "ownerId") || !Array.isArray((side as { assetIds?: unknown }).assetIds)) { errors.push("INVALID_TRADE_REQUEST"); continue; }
    const ids = (side as { assetIds: unknown[] }).assetIds;
    if (ids.length === 0 || ids.length > PRIVATE_API_SECURITY_POLICY.maxAssetsPerSide) errors.push("INVALID_TRADE_REQUEST");
    if (ids.some((id) => typeof id !== "string" || id.length === 0 || id.length > PRIVATE_API_SECURITY_POLICY.maxAssetIdLength || /[\u0000-\u001f\u007f]/.test(id))) errors.push("INVALID_TRADE_REQUEST");
    const ownerId = (side as { ownerId?: unknown }).ownerId;
    if (ownerId !== undefined && (typeof ownerId !== "string" || ownerId.length === 0 || ownerId.length > PRIVATE_API_SECURITY_POLICY.maxAssetIdLength || /[\u0000-\u001f\u007f]/.test(ownerId))) errors.push("INVALID_TRADE_REQUEST");
  }
  const a = (request.sideA as { assetIds?: unknown[] })?.assetIds ?? [];
  const b = (request.sideB as { assetIds?: unknown[] })?.assetIds ?? [];
  if (a.length + b.length > PRIVATE_API_SECURITY_POLICY.maxTotalAssets) errors.push("INVALID_TRADE_REQUEST");
  if (new Set(a).size !== a.length || new Set(b).size !== b.length) errors.push("INVALID_TRADE_REQUEST");
  if (a.some((id) => b.includes(id))) errors.push("INVALID_TRADE_REQUEST");
  if (request.validateOwnership !== undefined && typeof request.validateOwnership !== "boolean") errors.push("INVALID_TRADE_REQUEST");
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
};
