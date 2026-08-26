# LCC Trade Analyzer Current Valuation Adapter v1

Status: INTERNAL INTEGRATION ONLY. This adapter is not connected to the public application, an API route, a client bundle, Firestore, or production.

## Data sources and snapshot pinning

`lib/trade-analyzer/currentValuationAdapter.ts` consumes an explicitly supplied approved snapshot, manifest, canonical 2026 LCC roster, player catalog, and future-pick inventory. The current snapshot is pinned to `2026-08-26`. It does not fetch the latest source or call a FantasyCalc endpoint. The caller verifies raw and normalized hashes, source configuration, manifest approval, row counts, provenance, and row shape before the adapter uses the snapshot.

FantasyCalc values remain commissioner-review-only. The internal calculator passes `publicOutput: false`; a public request with the current unapproved license state receives the model's `SOURCE_LICENSE_UNAPPROVED` block.

## Resolution rules

Current QB/RB/WR/TE assets resolve by exact Sleeper ID to a normalized FantasyCalc row. There is no fuzzy matching. Missing skill-position rows become `UNVALUED` with no invented value. Roman Hemby and Joe Fagnano are the current expected exceptions.

Valid current K and DST assets use the approved 25-unit local fallback. Their `valueMethod` is `LCC_FALLBACK` and `sourceName` is `LCC_POLICY`; they are never attributed to FantasyCalc. Their fallback evidence is MEDIUM.

Future picks resolve from the canonical current-pick asset identity to the matching source row. The adapter supports exact-slot, explicit-tier, and generic-round identities when those fields are present in the canonical inventory. It never infers eventual slot, future team finish, or tier. The current canonical inventory contains 144 generic future picks and no exact-slot or explicit-tier assignments, so those classifications are not fabricated.

## Current asset catalog

The catalog preserves asset ID, player/pick type, display name, owner metadata, position, season, round, slot/tier when known, base value, value status, method, source, source row, snapshot date, evidence, and warnings. Owner metadata is diagnostic only and cannot affect market value.

The N3.10 regression is 449 total catalog assets: 305 current roster assets, 268 direct FantasyCalc players, 35 K/DST fallback players, 2 unvalued players, and 144/144 classified future picks. Catalog construction rejects duplicate asset IDs, duplicate player IDs, duplicate pick IDs, conflicting owner assignments, malformed values, and unsupported current asset types.

## Internal trade request

```text
{
  sideA: string[],
  sideB: string[],
  evaluatedAt: string,
  leaguePhase: DRAFT_WINDOW | IN_SEASON | OFFSEASON,
  publicOutput?: boolean,
  ownership?: { sideAOwnerId?, sideBOwnerId? }
}
```

The calculator validates empty sides, duplicate assets within a side, cross-side duplicates, unknown IDs, and invalid catalog integrity deterministically. Optional ownership diagnostics return `CURRENTLY_OWNED`, `NOT_CURRENTLY_OWNED`, or `OWNERSHIP_UNKNOWN`; they remain outside fairness-v1 math.

## Internal adapter boundary

The internal path is:

```text
current asset IDs → catalog resolution → normalized engine assets → fairness-v1 → internal result
```

The fairness engine remains source-agnostic and receives no FantasyCalc response object. The N3.10 diagnostic compares adapter-produced results with direct normalized fairness-v1 results and confirms parity for values, status, evidence, shares, fairness, bands, and warnings.

The adapter does not grade historical trades or submitted owner offers, add consolidation, calculate roster fit, use current performance or standings, expose public values, add routes, or write production data. The next application-facing service/API contract must preserve this private license gate and source-swappable boundary.
