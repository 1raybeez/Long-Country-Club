# LCC Trade Analyzer Private API v1

Status: IMPLEMENTED BUT DISABLED BY DEFAULT. The route is available for controlled local/test validation only. Production feature and licensing gates remain off.

## Route and server authority

`POST /api/trade-analyzer/analyze` is the only route. It requires `application/json` (including an optional charset) and uses `Cache-Control: no-store`. GET analysis is rejected. The route validates body size before parsing, requires a same-origin request when an Origin header is present, and adds no wildcard CORS headers.

The route requires the existing verified Firebase session cookie and canonical active LCC member resolution through `getCurrentMemberSession`. Unauthenticated or invalid sessions return 401; unknown or retired members return 403. Access is `ACTIVE_MEMBER`; commissioner capability is not required. Client identity is never trusted.

The server determines the current UTC evaluation time, league phase, pinned approved snapshot, model versions, valuation values, and `INTERNAL` output mode. Clients submit only:

```json
{
  "sideA": { "assetIds": ["..."] },
  "sideB": { "assetIds": ["..."] },
  "validateOwnership": false
}
```

Client timestamps, phases, output modes, owner IDs, values, source fields, snapshot fields, and model overrides are rejected.

## Gates and limits

`TRADE_ANALYZER_FEATURE_ENABLED` must equal `true`; missing or false means `403 FEATURE_NOT_AVAILABLE`. `TRADE_ANALYZER_PRIVATE_OUTPUT_APPROVED` must also equal `true`; missing or false means `403 SOURCE_LICENSE_UNAPPROVED`. Neither blocked response contains values, totals, shares, fairness, snapshot metadata, source rows, or private diagnostics. No production environment is enabled by this phase.

The request allows 1–15 assets per side, 30 total, 128 characters per asset ID, and a 16 KB body. Asset IDs must be nonempty strings without control characters. Duplicate, cross-side duplicate, unknown, oversized, malformed, and unexpected fields are rejected.

The route uses a best-effort in-memory limiter of 30 requests per minute with a burst allowance of 5, keyed by canonical owner ID. This is per server instance and is not globally strict across Cloud Run instances; no Firestore, Redis, or external limiter is used.

## Responses and errors

Successful private responses are `{ "ok": true, "data": ... }` and contain the approved N3.11 internal service result. Ownership validation is optional and mismatch remains a warning only. The route returns no winner, loser, recommendation, accept, reject, veto, or trade-advice fields.

Errors use `{ "ok": false, "error": { "code": "...", "message": "..." } }` with these mappings:

- 400: `INVALID_REQUEST`, `EMPTY_SIDE`, `DUPLICATE_ASSET`, `CROSS_SIDE_DUPLICATE`, `UNKNOWN_ASSET`
- 401: `UNAUTHENTICATED`, `INVALID_SESSION`
- 403: `MEMBER_ACCESS_REQUIRED`, `FEATURE_NOT_AVAILABLE`, `SOURCE_LICENSE_UNAPPROVED`, `ORIGIN_NOT_ALLOWED`
- 405: `METHOD_NOT_ALLOWED`
- 413: `REQUEST_TOO_LARGE`
- 415: `UNSUPPORTED_MEDIA_TYPE`
- 429: `RATE_LIMITED`
- 500: `INTERNAL_ERROR`
- 503: `SNAPSHOT_UNAVAILABLE`

Unexpected errors return a generic safe message. Tokens, cookies, email, Firebase UID, filesystem paths, stack traces, source hashes, and source-response details are never returned.

## Snapshot and execution boundary

The route loads the immutable approved `2026-08-26` local snapshot through the N3.10 runtime, verifies manifest/hash/configuration integrity, and preserves `valuation-v1` and `fairness-v1`. It performs no live network fetch, FantasyCalc runtime request, Firestore write, persistence, Sleeper mutation, trade submission, roster change, pick change, historical grading, or UI operation.

The route’s dependency-injected handler seam supports synthetic local tests without production accounts or enabled production gates. The API diagnostic covers authentication roles, gates, body/method/content/origin/rate controls, spoof rejection, redaction, runtime failure safety, and ten service-parity cases.
