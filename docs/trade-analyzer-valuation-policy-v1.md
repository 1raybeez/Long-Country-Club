# LCC Trade Analyzer Valuation Policy v1

Status: DESIGN ONLY — commissioner / terms review required  
Scope: asset valuation between immutable market snapshots and a future trade-analysis engine  
This document does not define trade winners, fairness percentages, vetoes, or recommendations.

## 1. Design boundary

The model has three distinct layers:

1. **Asset market value** — the source-backed value of a player or pick at a dated snapshot.
2. **Contextual fit** — optional, separately reported usefulness to a particular roster.
3. **Future fairness engine** — a later phase that may compare sides and explain a trade.

An owner must not receive a different base market value for the same asset. Missing value is never silently converted to zero, and no historical trade is graded from the current snapshot.

## 2. Source hierarchy and value contract

FantasyCalc is the primary current source. The immutable snapshot is authoritative for direct rows when it has a valid identity, value, position, and snapshot date. Source terms and public-use permission remain commissioner-review items. The snapshot source can be replaced through the same contract without changing the future fairness engine.

Every asset value should expose:

- `sourceValue` — raw source value retained without rescaling internally
- `sourceRank` and `sourcePositionRank` where available
- `snapshotDate`
- `source`
- `coverageStatus` — `DIRECT`, `FALLBACK`, or `UNVALUED`
- `valuationMethod` — `FANTASYCALC_DIRECT`, `FANTASYCALC_PICK_GENERIC`, `FANTASYCALC_PICK_EXACT`, `FALLBACK_POLICY`, or `UNVALUED`
- `confidence` — `HIGH`, `MEDIUM`, `LOW`, or `UNVALUED`
- identity and provenance fields sufficient to reproduce the lookup

`normalizedSourceValue` may mirror the raw source value for now. It must not imply that a cross-source normalization has occurred.

## 3. Players

For a valid current FantasyCalc player row, use the raw FantasyCalc value directly. It is simple, auditable, and avoids introducing an unsupported percentile or nonlinear transformation. Do not apply an additional 1QB, positional, age, or league-size adjustment in v1.

FantasyCalc's current configuration is the closest available LCC match: dynasty, 12 teams, 1 QB, half-PPR, and non-TEP. A later policy revision may test bounded LCC adjustments, but it must be supported by LCC evidence and shown separately from the source value.

## 4. Kickers and DST

FantasyCalc does not materially cover LCC kickers or DEF/DST. These assets receive a deterministic fallback classification, not fabricated FantasyCalc values.

- Kicker fallback: flat replacement-level policy value of **25 internal units**.
- DST fallback: flat replacement-level policy value of **25 internal units**.

These values are intentionally negligible compared with premium dynasty skill assets, work before the season begins, and can be revisited as a policy constant. In-season scoring and role information should be reported as separate signals rather than silently rewriting dynasty market value.

## 5. Missing non-K/DST players

The current missing non-K/DST players are Roman Hemby and Joe Fagnano. Both are current 2026 rookies in the Sleeper player registry and have no direct FantasyCalc row; they are classified as `ROOKIE / NEW PLAYER`, not as a metadata mismatch.

Future fallback hierarchy:

1. Exact FantasyCalc Sleeper ID.
2. Another approved stable identity in the same dated source snapshot.
3. An approved dated rookie-market source for a rookie or new player.
4. An approved current production/role source for an established player.
5. A published, position-appropriate replacement-level policy floor only when explicitly approved for that asset class.
6. `UNVALUED` / manual review.

No fuzzy name match may override an available Sleeper ID. A fallback must carry its own source, date, method, and confidence.

## 6. Rookies

When FantasyCalc directly values a rookie, retain the direct FantasyCalc value. Do not replace it with Draft Intelligence or Predictor output.

When a rookie is absent, use the fallback hierarchy above. The existing Predictor rookie-market infrastructure may be considered only as a source of a dated market observation if its source rows and assumptions are preserved; Predictor scores, weights, grades, and Draft Intelligence grades are not trade values.

## 7. Picks

Pick identity and ownership lineage remain separate from valuation.

- Known exact slot, such as `2027 1.04`: use `FANTASYCALC_PICK_EXACT` only when the snapshot contains that exact slot.
- Unknown future round, such as `2028 Round 1`: use the matching generic round row with `FANTASYCALC_PICK_GENERIC`.
- Explicit early/mid/late tier: use the tier row only when the LCC asset itself is explicitly classified that way.
- Never infer a future slot from eventual draft results.
- Never substitute an early/mid/late tier for a round-only asset.

If no valid matching row exists, the pick is `UNVALUED`; it is not zero. The six known lineage disagreements and the 2027 no-lineage pick remain commissioner-review items.

## 8. Future-year values

Trust FantasyCalc's dated future-year values directly. Do not apply a second LCC time discount, because that risks double-discounting a source that already distinguishes future years. Any later adjustment must be separately evidenced and bounded.

## 9. Scarcity, depth, and fit

Raw FantasyCalc value is the base market value. No additional QB, RB, WR, or TE scarcity adjustment is recommended in v1; importing Superflex scarcity into this 1QB league would be a material error.

Elite-starter status, usable depth, bench value, roster clog, starting-lineup need, positional strength, vacancies, contender/rebuilder posture, and season phase belong in a future contextual-fit layer. They must not change the base market value by owner.

Contender/rebuilder/middle may be offered as an explicit owner-selected context, with any inferred classification shown as a suggestion and overrideable. Predictor or team-strength data must not silently determine trade value.

Age is already represented in market perception and receives no extra adjustment. Current scoring, role, starts, opportunity, and roster status should be separate signals until evidence supports a bounded adjustment.

## 10. Confidence and freshness

Confidence is evidence quality, not trade-win probability.

- **HIGH:** direct source row, exact identity, valid positive value, and fresh snapshot.
- **MEDIUM:** direct source row with an aging snapshot, or a fully documented stable-ID fallback.
- **LOW:** approved rookie/production fallback, stale but still bounded source row, or material metadata limitation.
- **UNVALUED:** no defensible source-backed value, unresolved identity, or unsupported asset classification.

Suggested freshness thresholds:

- Draft window: fresh 0–3 days, aging 4–7 days, stale after 7 days.
- In season: fresh 0–7 days, aging 8–14 days, stale after 14 days.
- Offseason: fresh 0–30 days, aging 31–60 days, stale after 60 days.

Suggested manual cadence is weekly in season, every 2–3 days around the rookie draft or major free agency, and monthly in the quiet offseason. No automation is scheduled by this policy.

## 11. Scale and movement

Retain FantasyCalc's raw numerical scale for internal calculations. The scale is relative and must not be rescaled in v1. Public presentation may use a compact display such as `11.3K`, with the exact value available in supporting detail.

Each snapshot should preserve source date, retrieval timestamp, source URL, configuration, hashes, identity, and method so future code can calculate value change from the prior snapshot. Movement is a future display/analysis feature, not a v1 trade verdict.

## 12. Multi-asset and elite-asset concepts deferred

The future fairness engine may initially sum valued assets for transparent base-side totals. A package/consolidation adjustment may later recognize roster-slot cost and the difference between one elite asset and several lesser assets, but N3.4 chooses no coefficient.

Evidence required before adding such an adjustment includes repeated observed LCC trade behavior, sensitivity testing, and a clear explanation that avoids double-counting source values. The engine may eventually distinguish `10,000 + 1,000` from `5,500 + 5,500`, but that is not implemented or decided here.

## 13. Explicitly deferred

N3.4 does not implement fairness percentages, trade winners, veto thresholds, commissioner rulings, recommendations, projected record effects, championship odds, historical grading, or UI. The immutable source snapshot remains data foundation only.

## 14. Licensing gate

Display status remains **COMMISSIONER / TERMS REVIEW REQUIRED**. Future source adapters must retain attribution, license notes, snapshot provenance, and coverage diagnostics. Public use is not declared approved by this policy.
