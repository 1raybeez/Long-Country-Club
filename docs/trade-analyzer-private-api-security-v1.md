# LCC Trade Analyzer Private API / Security Design v1

Status: DESIGN ONLY. N3.12 adds no route, middleware, server action, UI, Firestore operation, production write, or deployed feature.

## Access and identity

The future route must require a valid verified Firebase session cookie, a resolved canonical member, and an active LCC owner. Unauthenticated users, invalid sessions, unknown accounts, and retired owners receive denial responses. Access is `ACTIVE_MEMBER`; commissioner capability is not required. The commissioner receives the same fairness calculation as any active owner.

Firebase UID is security identity only. The canonical league identity is server-resolved `ownerId`. Client-supplied owner IDs, emails, Firebase UIDs, capability claims, team IDs, values, source metadata, and model overrides are never authoritative. Identity is used only for authorization, optional ownership diagnostics, and a future-approved safe audit record.

## Request contract and limits

The future endpoint accepts only POST with `Content-Type: application/json` and this minimal body:

```text
{
  sideA: { assetIds: string[] },
  sideB: { assetIds: string[] },
  validateOwnership?: boolean
}
```

The server derives `evaluatedAt` from current UTC time and derives `leaguePhase` from one centralized LCC season-calendar/configuration source. Clients do not submit output mode, timestamps, phases, source data, values, snapshot dates, or model versions.

The selected limits are 15 assets per side, 30 total assets, 128 characters per asset ID, and a 16 KB JSON body. Asset IDs must be nonempty strings without control characters. Unexpected fields, duplicates, cross-side duplicates, unknown assets, empty sides, malformed content, GET, non-JSON bodies, and oversized requests are rejected deterministically.

## Authorization and ownership

Any current LCC asset may be analyzed hypothetically. Ownership validation is optional metadata, not a prerequisite. When requested, the future service reports `CURRENTLY_OWNED`, `NOT_CURRENTLY_OWNED`, or `OWNERSHIP_UNKNOWN`; mismatch returns analysis plus warning and cannot change values, market shares, fairness, bands, or market edge.

## Rate, origin, and cache policy

Recommend 30 requests per minute per verified session with a burst allowance of 5, plus a per-IP fallback for unauthenticated abuse traffic before authentication. V1 should use a best-effort in-memory limiter only if the route is implemented, documenting that it is per-instance and not reliable across Firebase/Cloud Run instances. A platform-native or managed limiter should replace it before broad exposure; no Firestore rate-limit writes are permitted.

The route is same-origin only, with no wildcard CORS. Validate the `Origin` header against the configured LCC origin and reject cross-origin requests. Because the endpoint is read-only and does not mutate state, a CSRF token is not required for this v1 computation contract; SameSite=Lax session cookies and same-origin Origin validation remain required. Responses use `Cache-Control: no-store`; no shared CDN caching is allowed.

## Feature and licensing gates

The server owns two gates. `TRADE_ANALYZER_FEATURE_ENABLED` defaults OFF until private QA and implementation approval. `TRADE_ANALYZER_PRIVATE_OUTPUT_APPROVED` must also be explicitly approved before any FantasyCalc-derived private output is enabled. Authentication does not resolve licensing. A disabled feature returns `403 FEATURE_NOT_AVAILABLE`; unresolved licensing returns `403 SOURCE_LICENSE_UNAPPROVED`. Neither response includes values, totals, source rows, fairness, snapshot hashes, or private diagnostics.

## HTTP and error contract

Future mappings are: 400 invalid request/unknown or duplicate asset; 401 `UNAUTHENTICATED` or `INVALID_SESSION`; 403 `MEMBER_ACCESS_REQUIRED`, `FEATURE_NOT_AVAILABLE`, or `SOURCE_LICENSE_UNAPPROVED`; 413 `REQUEST_TOO_LARGE`; 415 `UNSUPPORTED_MEDIA_TYPE`; 429 `RATE_LIMITED`; 500 `INTERNAL_ERROR`; and 503 `SNAPSHOT_UNAVAILABLE` when the approved snapshot cannot be safely loaded.

The safe body is `{ ok: false, error: { code, message } }`. Messages are generic, such as “This feature requires sign-in,” “Trade Analyzer access is available to active LCC members,” “The trade request is invalid,” “One or more selected assets are unavailable,” and “Trade Analyzer is not available yet.” No stack, filesystem path, token, cookie, email, Firebase UID, endpoint detail, credential, snapshot hash, or source row appears in a public/error response.

## Internal response and model boundary

After both gates pass, the future private response may wrap the N3.11 internal service result: status, engine status, normalized labels, values, totals, shares, fairness, band, market edge, evidence, warnings, snapshot date, model versions, and ownership diagnostics. It remains authenticated private output, not public output. The approved versions are `valuation-v1` and `fairness-v1`; clients cannot select alternatives.

The service returns no winner, loser, recommendation, accept, reject, veto, trade-advice, or should-trade fields. It performs no trade submission, Sleeper mutation, message, proposal save, feedback write, Firestore write, persistence, historical grading, roster fit, current-performance adjustment, or market movement adjustment.

## Logging, correlation, and compute

Logs may contain timestamp, outcome, canonical ownerId when needed, asset count, service status, error code, latency, and model versions. Do not log tokens, cookies, emails, full payloads, asset IDs by default, source rows, private keys, filesystem paths, or stack traces. A future route may generate a non-sensitive server request ID for logs and response correlation; it must not affect engine determinism.

Target typical server compute is below 500 ms, with a route timeout materially above that for safety. The approved catalog should be lazily initialized and memoized per server instance; correctness cannot depend on the cache. Immutable dated snapshots and approved manifests must be switched atomically through one server-side reference—never by scanning for “latest” or reading a half-written file.

## Future implementation checklist

Before implementation, verify Firebase session handling and canonical active-member resolution server-side, add the feature and licensing gates, enforce method/content/origin/body limits, use `no-store`, retain N3.11 snapshot/version checks, and test all denial, spoofing, rate, redaction, and failure paths. N3.12 itself implements none of those runtime integrations.
