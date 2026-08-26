# LCC Trade Analyzer Fairness Model v1

Status: DESIGN ONLY — not connected to the application  
Model name: LCC Trade Fairness  
Proposed version: `fairness-v1`

This design answers how balanced a proposed exchange is on the approved market-value scale. It does not determine who won, whether a commissioner should veto a trade, or whether a trade is good for a particular roster.

## 1. Layers and boundaries

The future analyzer must preserve these layers:

1. **Asset market value** — one dated source-backed value per asset.
2. **Trade-side market value** — the combined value of assets on each side.
3. **Market edge/split** — which side has the larger raw market share and by how much.
4. **Fairness** — a symmetric measure of balance between the two side totals.
5. **Consolidation context** — whether concentration, elite assets, package size, or roster slots make equal sums economically different.
6. **Roster fit/strategy** — separate contextual usefulness.
7. **Evidence** — completeness and freshness of the inputs, not a probability of winning.

No layer silently replaces another.

## 2. Raw side value

For fully valued assets:

`rawSideValue = sum(baseAssetValue)`

Preserve per side: asset count, raw total, highest asset, second-highest asset, mean, median, unvalued count, confidence distribution, and asset identities. K/DST fallback values participate in the transparent raw sum. Roster fit does not.

If an asset is UNVALUED, preserve the known-value subtotal but do not treat the missing asset as zero or claim a complete total.

## 3. Market split

For known side totals `A` and `B`, where `A + B > 0`:

`sideAShare = A / (A + B)`  
`sideBShare = B / (A + B)`

Display as rounded whole percentages such as `54 / 46`. Calculate from unrounded totals, then round only for display. If both totals are zero, the split is undefined. If either side has an UNVALUED asset, a known-value split may be shown only with an incomplete-valuation flag.

Market split is not fairness and must not be labeled winner.

## 4. Fairness candidates and recommendation

**Model A — total-share balance:**

`fairness = 200 × min(A, B) / (A + B)`

This returns 100 at 50/50, 90 at 55/45, 80 at 60/40, 70 at 65/35, and 50 at 75/25. It is symmetric, bounded from 0 to 100, monotonic with imbalance, and directly explains the relationship to market share.

**Model B — high-side ratio:**

`fairness = 100 × min(A, B) / max(A, B)`

This is also symmetric and bounded, but it penalizes imbalance more sharply and becomes harder to explain near large gaps. A 55/45 split produces 81.8 rather than 90.

Model A is recommended for `fairness-v1` because it is the clearest share-balance interpretation. Fairness is a market-balance score, not a veto rule or trade outcome.

## 5. Fairness bands

Recommended display bands, applied after the unrounded Model A score:

- **VERY EVEN:** 97–100
- **FAIR:** 92–96.99
- **SLIGHT EDGE:** 82–91.99
- **CLEAR EDGE:** 70–81.99
- **LOPSIDED:** below 70

These are communication labels only. They do not authorize or recommend a commissioner decision. The boundaries make 52/48 FAIR, 55/45 SLIGHT EDGE, 60/40 CLEAR EDGE, and 70/30 LOPSIDED without pretending that a narrow market difference is a governance threshold.

## 6. Market edge

Preserve:

- `marketEdgeSide`: `SIDE_A`, `SIDE_B`, or `EVEN`
- `rawValueGap = abs(A - B)`
- `marketShareGap = abs(sideAShare - sideBShare)`

An output may say “Side A leads market value 54% to 46%; value gap 850.” It must not say winner, better manager, or commissioner ruling.

## 7. Elite assets and consolidation

Candidate elite definitions are top overall rank, top value percentile, value relative to median, or a combination. The recommended definition is snapshot-relative: an eligible valued asset is elite when its source value is at or above the 90th percentile of eligible current player/pick values, with the threshold stored in model metadata. K/DST fallback rows and UNVALUED assets cannot be elite.

Useful non-mutating concentration diagnostics are:

- top asset / side total
- top two assets / side total
- asset count
- value-weighted concentration
- number of elite assets
- number of assets below a later replacement threshold

The future engine may show a consolidation context because one 10,000 asset can be more desirable than two 5,000 assets, and 10,000 + 1,000 can differ from 5,500 + 5,500. N3.5 selects no coefficient and does not alter raw totals.

## 8. Replacement level and roster slots

The candidate replacement threshold is the 25th percentile of positive, currently rostered QB/RB/WR/TE source values, excluding K/DST and UNVALUED assets. The threshold must be recomputed and stored with the snapshot; it is a diagnostic boundary, not an automatic trade penalty.

Many-for-one trades may eventually receive a modest roster-slot/consolidation adjustment, but that adjustment belongs in a later market-level layer. Incoming bench players can consume slots; picks have zero active-roster-slot cost before the draft and must not be treated identically to players.

## 9. Picks and K/DST

Exact, generic, and tiered pick values follow the N3.4 pick policy. Picks participate in raw totals and may be elite when their snapshot-relative value qualifies. Generic future picks remain liquid market assets, but no eventual slot is inferred.

K and DST participate normally in raw side totals at the approved 25-unit fallback. They are excluded from elite and skill-player concentration/replacement calculations and cannot become elite under this model.

## 10. Unvalued assets and evidence

An UNVALUED asset produces a known subtotal and an `INCOMPLETE` valuation state. The future analyzer should suppress an authoritative fairness score when any material asset is UNVALUED; it may show the known subtotal and explain the missing asset. Missing is never zero.

Trade-level evidence labels are separate from fairness:

- **HIGH:** every material asset directly valued with exact identity, fresh snapshot, valid source value, and unambiguous pick class.
- **MEDIUM:** complete valuation with aging data or a fully documented approved fallback.
- **LOW:** stale but bounded values, approved low-confidence fallback, or non-material ambiguity.
- **INCOMPLETE:** any material UNVALUED asset, unresolved identity, unsupported pick classification, or missing required side value.

Stale snapshots may still calculate a provisional score while lowering evidence, provided all material assets remain valued. Staleness must not silently change asset values. Materially incomplete inputs suppress the authoritative score.

## 11. Fit, production, and movement

Market fairness is owner-independent. Roster need, positional depth, vacancies, contender/rebuilder posture, age context, and season phase belong in a future `ROSTER_FIT` layer. The same exchange must retain the same market fairness regardless of viewer.

Current scoring, role, starts, opportunity, and roster status are separate context signals. Snapshot-to-snapshot movement is also informational context in v1; it is not added to fairness and must not be double-counted against the current market value.

## 12. Future output contract

```text
sideA: {
  rawValue,
  adjustedValue: null,       // deferred until a coefficient is approved
  marketShare,
  assetCount,
  topAsset,
  evidence,
  unvaluedAssetCount
}
sideB: { ...same contract... }
trade: {
  fairnessScore,
  fairnessBand,
  marketEdgeSide,
  rawValueGap,
  marketShareGap,
  evidence,
  snapshotDate,
  valuationPolicyVersion,
  fairnessModelVersion
}
```

`valuationPolicyVersion`, `snapshotDate`, and `fairnessModelVersion` are separate metadata. No source version may be conflated with the fairness-model version.

## 13. Explicitly deferred

N3.5 does not implement production fairness, coefficients, package premiums, roster-slot penalties, trade winners, vetoes, commissioner rulings, owner advice, projected record effects, championship odds, historical grading, or UI integration.
