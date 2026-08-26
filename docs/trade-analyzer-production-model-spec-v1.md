# LCC Trade Analyzer Production Model Specification v1

Status: SPECIFICATION ONLY — not implemented or connected to the application  
`valuationPolicyVersion`: `valuation-v1`  
`fairnessModelVersion`: `fairness-v1`

## 1. Model identity and source boundary

Every future result must carry `valuationPolicyVersion`, `fairnessModelVersion`, `snapshotDate`, `snapshotRetrievedAt`, `sourceName`, and the exact source configuration. A source snapshot version is never conflated with either model version.

The fairness engine consumes normalized asset-value objects. It must not consume a FantasyCalc API response shape. The source adapter owns identity resolution, source rows, snapshot provenance, and fallback mapping; the fairness engine owns only the normalized contract and mathematics. FantasyCalc public display remains **COMMISSIONER / TERMS REVIEW REQUIRED**. [FantasyCalc terms](https://fantasycalc.com/terms-of-usage)

## 2. Supported assets and resolution

Supported v1 asset classes are QB, RB, WR, TE, K, DST, rookie players, exact-slot picks, generic-round picks, and explicitly classified early/mid/late picks. A recognized asset without a defensible value is UNVALUED. An unknown or unsupported Sleeper asset type is UNSUPPORTED and blocks an authoritative result.

For QB/RB/WR/TE, the operational hierarchy is only the exact FantasyCalc Sleeper-ID row in the approved snapshot. Stable-ID alternatives, dated rookie-market values, production/role values, and replacement floors are reserved future levels and are not operational in v1. No future fallback is silently treated as available.

K and DST use the approved LCC deterministic fallback: 25 internal units each, `valueStatus=FALLBACK`, `valueMethod=LCC_K_FALLBACK` or `LCC_DST_FALLBACK`, and `sourceName=LCC_POLICY`, never FantasyCalc. They participate in raw totals, cannot be elite, and are excluded from consolidation research metrics.

Picks resolve in this order: exact explicit slot plus matching exact source row; explicit early/mid/late classification plus matching tier row; otherwise known future year plus round plus matching generic row. Never infer eventual slot, tier, team finish, or future ownership. A missing pick row is UNVALUED, not zero.

## 3. Asset value contract

```text
assetId: string                 // required
assetType: PLAYER | PICK | K | DST | UNSUPPORTED  // required
displayName: string             // required
position?: QB | RB | WR | TE | K | DST
season?: integer                // pick only
round?: integer                 // pick only
slot?: integer                 // exact pick only
pickTier?: EARLY | MID | LATE   // explicitly classified pick only
baseValue?: finite number       // required for VALUED/FALLBACK
valueStatus: VALUED | FALLBACK | UNVALUED | UNSUPPORTED
valueMethod: string             // required
sourceName: string              // required
sourceRowId?: string
snapshotDate?: YYYY-MM-DD
evidence: HIGH | MEDIUM | LOW | INCOMPLETE
warnings: string[]
```

`UNVALUED` means the asset is recognized but has no defensible number. `UNSUPPORTED` means v1 does not support its asset classification. Neither becomes zero.

## 4. Raw totals and result states

`rawValue = sum(baseValue)` across valued and fallback assets only. Preserve asset counts by status, `knownValueSubtotal`, and warnings. Do not silently omit missing assets.

An otherwise complete trade containing the approved K/DST fallback is complete but labeled MEDIUM evidence with an explicit fallback annotation; it is not automatically downgraded to LOW.

Result states:

- `AUTHORITATIVE`: both sides contain at least one valid asset, every asset is VALUED or approved FALLBACK, and no blocking error exists. Fresh data is HIGH evidence.
- `PROVISIONAL`: complete numerical valuation with aging or stale data, or a permitted low-confidence fallback. Fairness may be calculated but evidence is degraded.
- `SUPPRESSED`: any recognized material UNVALUED or UNSUPPORTED asset, unresolved required identity, ambiguous pick class, or unapproved source prevents an authoritative fairness score. Known subtotals may be shown; fairness fields are absent.
- `INVALID`: malformed input, empty side, negative/non-finite value, or zero combined value. No fairness result is produced.

For v1, any UNVALUED QB/RB/WR/TE or pick suppresses fairness. K/DST are not UNVALUED when their identity is valid because the approved fallback applies.

## 5. Market share, fairness, and edge

For valid side totals `A` and `B`, with `A+B > 0`:

`A_share = A / (A+B)`  
`B_share = B / (A+B)`  
`fairness = 200 × min(A,B) / (A+B)`

Internal values retain full finite precision. Clamp only the final fairness value to `[0,100]` after validation. Fairness 100 means equal known side values; it is not called a perfect trade.

Fairness bands use exact lower bounds: VERY EVEN `[97,100]`; FAIR `[92,97)`; SLIGHT EDGE `[82,92)`; CLEAR EDGE `[70,82)`; LOPSIDED `[0,70)`. Values outside `[0,100]` are invalid.

`marketEdgeSide` is `SIDE_A`, `SIDE_B`, or `NONE` when totals are equal. `rawValueGap=abs(A-B)`. `marketShareGap=abs(A_share-B_share)`. No winner/loser terminology is allowed.

## 6. Evidence and freshness

Trade evidence precedence is `INCOMPLETE` > `LOW` > `MEDIUM` > `HIGH`.

- HIGH: complete direct exact-ID values, fresh snapshot, and unambiguous pick classes without fallback values.
- MEDIUM: complete values with aging freshness, an approved fallback including K/DST, or another documented degradation that remains numerically complete.
- LOW: complete values with stale freshness or an approved low-confidence fallback.
- INCOMPLETE: any material UNVALUED/UNSUPPORTED asset, unresolved identity, ambiguous pick, missing side value, or unapproved source.

The caller must provide a league phase: `DRAFT_WINDOW`, `IN_SEASON`, or `OFFSEASON`. Freshness age is calculated in UTC as the non-negative elapsed whole-day count between `snapshotRetrievedAt` and evaluation time; a future snapshot timestamp is invalid. Thresholds are:

- Draft window: fresh 0–3 days, aging 4–7, stale >7.
- In season: fresh 0–7, aging 8–14, stale >14.
- Offseason: fresh 0–30, aging 31–60, stale >60.

Complete aging data is PROVISIONAL/MEDIUM. Complete stale data is PROVISIONAL/LOW. Staleness does not modify values.

## 7. Rounding and display

Use full precision internally. Display asset values as whole source units using decimal half-up rounding. Display fairness to one decimal using decimal half-up rounding; display market shares as whole percentages using decimal half-up rounding, with the second displayed share set to `100 - first` so the pair always totals 100. Compact formats such as `11.3K` are optional UI formatting only.

## 8. Result contract

```text
model: {
  valuationPolicyVersion,
  fairnessModelVersion
}
snapshot: {
  source,
  sourceUrl,
  date,
  retrievedAt,
  freshness,
  leaguePhase,
  leagueConfiguration,
  responseHash
}
sideA / sideB: {
  assets,
  rawValue,
  knownValueSubtotal,
  marketShare,
  valuedAssetCount,
  fallbackAssetCount,
  unvaluedAssetCount,
  unsupportedAssetCount,
  evidence
}
trade: {
  resultStatus,
  fairnessScore?,
  fairnessBand?,
  marketEdgeSide?,
  rawValueGap?,
  marketShareGap?,
  evidence,
  warnings[]
}
research: {
  topAssetShare?, topTwoShare?, eliteAssetCount?, belowReplacementCount?
}
```

Research fields are informational and cannot alter fairness-v1. Consolidation coefficient is NONE; `adjustedTradeValue` is not used. Roster fit, current performance, market movement, Predictor, Draft Intelligence, owner context, and standings are outside v1.

## 9. Errors, warnings, and public language

Blocking errors: `INVALID_SIDE`, `EMPTY_SIDE`, `NEGATIVE_VALUE`, `NON_FINITE_VALUE`, `ZERO_COMBINED_VALUE`, `UNSUPPORTED_ASSET`, `UNVALUED_ASSET`, `AMBIGUOUS_PICK_CLASS`, `MISSING_PICK_VALUE`, `MISSING_LEAGUE_PHASE`, `FUTURE_SNAPSHOT_TIMESTAMP`, and `SOURCE_LICENSE_UNAPPROVED` when public output is requested.

Warnings: `AGING_SNAPSHOT`, `STALE_SNAPSHOT`, `FALLBACK_VALUE_USED`, `K_DST_FALLBACK_USED`, `SOURCE_COVERAGE_GAP`, and `RESEARCH_FIELDS_NON_AUTHORITATIVE`.

Allowed terms are Market Value, Market Split, Fairness, Market Edge, Evidence, Value unavailable, and Snapshot date. Avoid Winner, Loser, Veto, Accept, Reject, Must trade, Bad owner, or commissioner ruling language.

## 10. Deterministic invariants and deferred work

Swapping sides preserves fairness and absolute gap while reversing shares and the market leader. Fairness remains within 0–100; shares sum to one internally; increasing the lower side does not reduce fairness before equality; equal positive totals produce 100; and missing/unsupported assets never become zero.

N3.7 does not implement the production engine, fairness percentages in the app, consolidation adjustments, roster fit, trade advice, historical grading, real-trade grading, UI, API routes, or Firestore. Future implementation must consume this normalized contract and preserve the source-swappable boundary.
