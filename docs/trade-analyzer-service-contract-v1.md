# LCC Trade Analyzer Internal Service Contract v1

Status: INTERNAL SERVER-SIDE CONTRACT ONLY. No API route, server action, public UI, client import, Firestore write, or production write exists in N3.11.

## Purpose and boundary

`lib/trade-analyzer/tradeAnalysisService.ts` is the future server-side orchestration boundary. It is explicitly server-only through a Node built-in import and is not placed under `app/` or `components/`. It accepts current catalog asset IDs, validates the request, checks the approved snapshot and model versions, delegates valuation to `currentValuationAdapter.ts`, delegates mathematics to `fairnessEngine.ts`, and sanitizes the result by output mode.

The service does not fetch a live source. Snapshot selection is pinned in one place to `APPROVED_SNAPSHOT_DATE = 2026-08-26`; the caller supplies the already verified local catalog and manifest reference.

## Request contract

```text
{
  sideA: { assetIds: string[], ownerId?: string },
  sideB: { assetIds: string[], ownerId?: string },
  evaluatedAt: string,
  leaguePhase: DRAFT_WINDOW | IN_SEASON | OFFSEASON,
  outputMode: INTERNAL | PUBLIC,
  ownershipValidation?: boolean
}
```

Owner IDs are optional and are used only for ownership diagnostics. They are never used in market-value resolution or fairness mathematics.

Before delegation the service deterministically rejects missing or empty sides, duplicate assets, cross-side duplicates, unknown IDs, malformed timestamps, missing/invalid phases, invalid output modes, unsupported extra fields, and invalid ownership flags. Expected business-rule failures return structured responses rather than uncontrolled exceptions.

## Snapshot, adapter, and engine orchestration

The service requires the approved `2026-08-26` snapshot, commissioner-review manifest status, valid integrity, and the LCC source configuration. Integrity failure, missing snapshot selection, and model-version mismatch fail safely without running analysis. No alternate or latest snapshot is selected.

The adapter remains the only current-asset valuation resolver. The fairness engine remains source-agnostic and owns all side aggregation, evidence, freshness, shares, fairness, bands, and market edge. The service introduces no valuation logic, consolidation coefficient, adjusted trade value, roster fit, current-performance adjustment, or historical grading.

Expected model versions are `valuation-v1` and `fairness-v1`. The service returns them in internal metadata and rejects incompatible dependencies.

## Result contract and statuses

Internal responses contain `success`, service `status`, preserved engine status, model metadata, snapshot metadata, side results, trade results, ownership diagnostics, warnings, and errors. Service statuses are `OK`, `BLOCKED`, `INVALID_REQUEST`, and `INTERNAL_ERROR`; engine statuses remain `AUTHORITATIVE`, `PROVISIONAL`, `SUPPRESSED`, or `INVALID`.

Ownership mismatch returns analysis plus `OWNERSHIP_MISMATCH`; it does not change values, shares, fairness, or bands. Missing owner IDs return `OWNERSHIP_UNKNOWN` when validation is requested.

For `PUBLIC` output while source licensing is unapproved, the service returns `BLOCKED` with `SOURCE_LICENSE_UNAPPROVED` and a generic safe message. Side values, side totals, market shares, fairness, source row IDs, snapshot metadata, and private diagnostics are absent. Internal output may contain the complete normalized result, but remains server-only.

Unexpected exceptions are converted to deterministic `INTERNAL_ERROR` with a generic message. Stack traces, filesystem paths, credentials, and environment details are not part of the response contract.

## Error catalog

The service uses `INVALID_REQUEST`, `EMPTY_SIDE`, `DUPLICATE_ASSET`, `CROSS_SIDE_DUPLICATE`, `UNKNOWN_ASSET`, `INVALID_TIMESTAMP`, `MISSING_PHASE`, `INVALID_OUTPUT_MODE`, `SNAPSHOT_NOT_FOUND`, `SNAPSHOT_INTEGRITY_FAILED`, `MODEL_VERSION_MISMATCH`, `SOURCE_LICENSE_UNAPPROVED`, and `INTERNAL_ANALYSIS_FAILED` as deterministic service-level identifiers. Adapter/engine errors remain nested only in permitted internal results.

The contract uses `marketEdgeSide` only. It does not return winner, loser, recommendation, accept, reject, veto, trade advice, or should-trade fields.

## No-write and future API boundary

N3.11 reads only local canonical data through the already built catalog. It performs no network calls, Firebase/Firestore operations, production mutations, historical trade grading, submitted-offer analysis, or app connection. A future API or server component may call this service only after preserving the internal/public mode gate, redaction contract, snapshot pinning, version checks, and server-only boundary.
