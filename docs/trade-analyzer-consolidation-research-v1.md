# LCC Trade Analyzer Consolidation Research v1

Status: RESEARCH / MODEL-CALIBRATION DESIGN ONLY  
Recommendation: **OPTION E — insufficient evidence; defer production adjustment**

## Research scope and sources

The approved LCC base remains the immutable FantasyCalc snapshot value. This research tests whether a separate `adjustedTradeValue` concept is needed; it never mutates `baseAssetValue`, grades a real trade, or connects to the application.

Public sources describe consolidation or “stud” premiums, package-size adjustments, low-value-piece discounts, or roster-slot effects, but there is no single public standard and many coefficients are proprietary. Dynasty Blueprint describes tier multipliers and a low-value-piece tax, including pick exemption; The Trade Calc describes a consolidation adjustment layered over a market baseline; Dynasty Dealmaker separates market fairness from roster fit and adjusts packages. These are cited as observable concepts only, not copied formulas. [Dynasty Blueprint](https://dynastyblueprint.gg/methodology), [The Trade Calc](https://thetradecalc.com/how-it-works), [Dynasty Dealmaker](https://www.dynastydealmaker.com/dynasty-trade-calculator)

FantasyCalc describes market-derived dynasty values from real trades, but does not provide a reproducible LCC-specific consolidation coefficient. [FantasyCalc](https://fantasycalc.com/)

LCC currently has one current snapshot and no defensible historical valuation archive. Consequently, no external coefficient is adopted or reverse-engineered.

## Candidate models

**Model A — no adjustment:** adjusted side value equals raw side value. This is the transparent baseline and the only production-safe option supported by current evidence.

**Model B — elite premium:** apply a bounded premium only to assets at or above a snapshot-relative elite threshold. The research grid tests 0%, 2%, 5%, 7.5%, and 10%.

**Model C — below-replacement discount:** discount only player pieces below the replacement threshold for package-equivalence analysis. The grid tests 0%, 10%, 20%, 30%, and 50%. Picks and K/DST are exempt.

**Model D — hybrid:** combine a small elite premium, low-value discount, and optional roster-slot cost. The grid tests 5% / 20% / 50-unit behavior, but this is diagnostic only.

All candidate adjustments are separate from raw market totals. No coefficient is approved.

## Threshold sensitivity

The current snapshot’s eligible player values produce a P90 threshold of 3,736. P85, P90, P95, and P99 are recorded by the diagnostic, with counts above each threshold. P90 remains the recommended elite definition because it is snapshot-relative, position-independent, and broad enough to avoid treating a hardcoded name list as methodology.

The current rostered QB/RB/WR/TE distribution produces a P25 candidate replacement threshold of 819. P15, P20, P25, and P30 are tested. P25 remains the recommended research boundary because it identifies meaningful low-value package dilution without treating every bench player as worthless.

Neither threshold changes raw asset values.

## Picks, K, DST, and roster slots

Picks are liquid dynasty assets and do not occupy an active roster slot before conversion. They are exempt from roster-slot cost and below-replacement discount. Exact, generic, and explicitly tiered pick identity remains governed by the N3.4 policy; eventual draft position is never inferred.

K and DST participate in raw totals at their approved 25-unit fallback but never trigger elite logic. They are excluded from skill-player replacement and concentration metrics.

For player packages, a future slot-cost signal may depend on both player-count difference and the number of below-replacement players. It must not penalize a side merely because it has more assets, and it must be capped so large packages cannot compound absurdly. No fixed coefficient is selected.

## Synthetic findings

The required 14 synthetic cases show that raw sums produce equal 50/50 fairness for several structurally different packages: 10,000 versus 5,000 + 5,000; 9,000 versus three 3,000 assets; and other one-for-many examples. Concentration and asset count expose the difference without pretending that every one-for-many trade should favor the single-asset side.

The diagnostic tests elite premiums, low-value discounts, slot-cost variants, and hybrid combinations across 100 grid combinations. It also checks monotonicity, symmetry, package size, pick exemption, and fairness-band movement. A smooth graduated premium is preferable to a hard threshold in any future prototype because a value of 3,735 should not behave discontinuously differently from 3,736.

## Model-selection assessment

| Model | Transparency | Stability | Monotonicity | Symmetry | Cliff risk | Pick handling | Recommendation |
|---|---|---|---|---|---|---|---|
| A: none | HIGH | HIGH | HIGH | HIGH | LOW | HIGH | Baseline |
| B: elite premium | MEDIUM | MEDIUM | HIGH if bounded | HIGH | MEDIUM with hard threshold | HIGH | Research only |
| C: low-value discount | MEDIUM | MEDIUM | MEDIUM | HIGH | LOW if graduated | HIGH with pick exemption | Research only |
| D: hybrid | LOW/MEDIUM | LOW/MEDIUM | Requires controls | HIGH if symmetric | MEDIUM/HIGH | HIGH if picks exempt | Defer |

The current evidence supports the existence of a consolidation question, not the size or direction of a LCC-specific coefficient. OPTION E is therefore selected: preserve raw market totals in v1 and defer any production adjustment until dated LCC-compatible trade evidence or a documented external calibration dataset exists.

A future research prototype may use a 10% maximum adjustment as a guardrail, but that is **PROPOSED / NOT PRODUCTION APPROVED**. Any eventual adjusted value must remain visibly separate from raw market value and preserve raw and adjusted market shares.

## Deferred decisions

No production consolidation adjustment, elite premium, below-replacement discount, roster-slot charge, fairness change, real-trade analysis, historical grading, winner label, roster-fit adjustment, or UI integration is implemented here. FantasyCalc public use remains **COMMISSIONER / TERMS REVIEW REQUIRED**. [FantasyCalc terms](https://fantasycalc.com/terms-of-usage)
