export type PrivateApiAccessRole = "ACTIVE_MEMBER";
export type PrivateApiErrorCode = "UNAUTHENTICATED" | "INVALID_SESSION" | "MEMBER_ACCESS_REQUIRED" | "INVALID_TRADE_REQUEST" | "UNKNOWN_ASSET" | "FEATURE_NOT_AVAILABLE" | "SOURCE_LICENSE_UNAPPROVED" | "RATE_LIMITED" | "REQUEST_TOO_LARGE" | "UNSUPPORTED_MEDIA_TYPE" | "METHOD_NOT_ALLOWED" | "ORIGIN_NOT_ALLOWED" | "INTERNAL_ERROR";

export const PRIVATE_API_SECURITY_POLICY = Object.freeze({
  method: "POST",
  contentType: "application/json",
  maxAssetsPerSide: 15,
  maxTotalAssets: 30,
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
  serverDerivesEvaluatedAt: true,
  serverDerivesLeaguePhase: true,
  ownershipRequiredForAnalysis: false,
} as const);

export interface PrivateApiRequestBody {
  sideA: { assetIds: string[] };
  sideB: { assetIds: string[] };
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
  if (Object.keys(request).some((key) => !["sideA", "sideB", "validateOwnership"].includes(key))) errors.push("INVALID_TRADE_REQUEST");
  for (const sideName of ["sideA", "sideB"]) {
    const side = request[sideName];
    if (!side || typeof side !== "object" || Array.isArray(side) || Object.keys(side as object).some((key) => key !== "assetIds") || !Array.isArray((side as { assetIds?: unknown }).assetIds)) { errors.push("INVALID_TRADE_REQUEST"); continue; }
    const ids = (side as { assetIds: unknown[] }).assetIds;
    if (ids.length === 0 || ids.length > PRIVATE_API_SECURITY_POLICY.maxAssetsPerSide) errors.push("INVALID_TRADE_REQUEST");
    if (ids.some((id) => typeof id !== "string" || id.length === 0 || id.length > PRIVATE_API_SECURITY_POLICY.maxAssetIdLength || /[\u0000-\u001f\u007f]/.test(id))) errors.push("INVALID_TRADE_REQUEST");
  }
  const a = (request.sideA as { assetIds?: unknown[] })?.assetIds ?? [];
  const b = (request.sideB as { assetIds?: unknown[] })?.assetIds ?? [];
  if (a.length + b.length > PRIVATE_API_SECURITY_POLICY.maxTotalAssets) errors.push("INVALID_TRADE_REQUEST");
  if (new Set(a).size !== a.length || new Set(b).size !== b.length) errors.push("INVALID_TRADE_REQUEST");
  if (a.some((id) => b.includes(id))) errors.push("INVALID_TRADE_REQUEST");
  if (request.validateOwnership !== undefined && typeof request.validateOwnership !== "boolean") errors.push("INVALID_TRADE_REQUEST");
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
};
