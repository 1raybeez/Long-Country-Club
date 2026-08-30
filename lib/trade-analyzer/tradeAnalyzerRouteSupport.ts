import { PRIVATE_API_SECURITY_POLICY } from "./privateApiSecurityTypes.ts";

export const routeHeaders = { "Cache-Control": PRIVATE_API_SECURITY_POLICY.cacheControl, Vary: "Origin" } as const;
export const safeResponse = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) => Response.json(body, { status, headers: { ...routeHeaders, ...extraHeaders } });
export const errorResponse = (status: number, code: string, message: string) => safeResponse({ ok: false, error: { code, message } }, status);

export function requestOriginAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const configured = process.env.NEXT_PUBLIC_APP_URL;
    if (!configured) return false;
    return origin === new URL(configured).origin;
  } catch { return false; }
}

export class BestEffortRateLimiter {
  private readonly requests = new Map<string, number[]>();
  allow(key: string, now = Date.now()): boolean {
    const windowStart = now - 60_000;
    const retained = (this.requests.get(key) ?? []).filter((timestamp) => timestamp > windowStart);
    const allowed = retained.length < PRIVATE_API_SECURITY_POLICY.rateLimitPerMinute + PRIVATE_API_SECURITY_POLICY.rateLimitBurst;
    if (allowed) retained.push(now);
    this.requests.set(key, retained);
    return allowed;
  }
  reset(): void { this.requests.clear(); }
}

export const defaultRateLimiter = new BestEffortRateLimiter();
