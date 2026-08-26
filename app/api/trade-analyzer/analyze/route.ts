import { analyzeTradeInternal } from "../../../../lib/trade-analyzer/tradeAnalysisService.ts";
import { PRIVATE_API_SECURITY_POLICY, validatePrivateApiRequestShape } from "../../../../lib/trade-analyzer/privateApiSecurityTypes.ts";
import { resolveTradeAnalyzerLeaguePhase } from "../../../../lib/trade-analyzer/tradePhase.ts";
import { defaultRateLimiter, errorResponse, requestOriginAllowed, safeResponse } from "../../../../lib/trade-analyzer/tradeAnalyzerRouteSupport.ts";
import type { TradeAnalysisServiceRequest } from "../../../../lib/trade-analyzer/serviceTypes.ts";
import type { TradeAnalyzerRuntime } from "../../../../lib/trade-analyzer/tradeAnalyzerRuntime.ts";

const envEnabled = (name: string) => process.env[name] === "true";
const methodResponse = () => errorResponse(405, "METHOD_NOT_ALLOWED", "Trade Analyzer accepts POST requests only.");
const mapServiceError = (code: string) => code === "UNKNOWN_ASSET" ? "UNKNOWN_ASSET" : code === "EMPTY_SIDE" ? "EMPTY_SIDE" : code === "DUPLICATE_ASSET" ? "DUPLICATE_ASSET" : code === "CROSS_SIDE_DUPLICATE" ? "CROSS_SIDE_DUPLICATE" : "INVALID_REQUEST";

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
      if (!validatePrivateApiRequestShape(body).valid) return errorResponse(400, "INVALID_REQUEST", "The trade request is invalid.");
      let runtime: TradeAnalyzerRuntime;
      try { runtime = await loadRuntime(); } catch { return errorResponse(503, "SNAPSHOT_UNAVAILABLE", "Trade Analyzer is temporarily unavailable."); }
      const typedBody = body as Record<string, unknown>;
      const serviceRequest: TradeAnalysisServiceRequest = { sideA: typedBody.sideA as TradeAnalysisServiceRequest["sideA"], sideB: typedBody.sideB as TradeAnalysisServiceRequest["sideB"], evaluatedAt: now().toISOString(), leaguePhase: resolveTradeAnalyzerLeaguePhase(now()), outputMode: "INTERNAL", ownershipValidation: typedBody.validateOwnership === true };
      const result = analyzeTradeInternal(serviceRequest, { catalog: runtime.catalog, snapshot: runtime.snapshot, modelVersions: { valuationPolicyVersion: "valuation-v1", fairnessModelVersion: "fairness-v1" } });
      if (result.status === "INVALID_REQUEST") return errorResponse(400, mapServiceError(result.errors[0] ?? "INVALID_REQUEST"), "The trade request is invalid.");
      if (result.status === "INTERNAL_ERROR") return errorResponse(503, result.errors.includes("SNAPSHOT_NOT_FOUND") || result.errors.includes("SNAPSHOT_INTEGRITY_FAILED") ? "SNAPSHOT_UNAVAILABLE" : "INTERNAL_ERROR", result.errors.includes("SNAPSHOT_NOT_FOUND") || result.errors.includes("SNAPSHOT_INTEGRITY_FAILED") ? "Trade Analyzer is temporarily unavailable." : "Trade analysis is temporarily unavailable.");
      return safeResponse({ ok: true, data: result });
    } catch { return errorResponse(500, "INTERNAL_ERROR", "Trade analysis is temporarily unavailable."); }
  };
}

export const POST = createTradeAnalyzerPostHandler();
export async function GET() { return methodResponse(); }
