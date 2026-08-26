# LCC Trade Analyzer Fairness Engine v1 — N3.9 Shadow Testing

Status: INTERNAL ONLY. This is a validation artifact, not public trade advice. No historical LCC trade, submitted owner offer, UI route, client bundle, Firestore write, or production system is involved.

## Method

The shadow matrix uses only the 2026-08-26 normalized FantasyCalc snapshot, the canonical current LCC roster inventory, the canonical future-pick inventory, the approved 25-unit K/DST fallback, and the isolated fairness-v1 engine. Owner identity is not an input to fairness math. Ownership is used only to ensure player identities are current LCC assets; no scenario represents a historical transaction.

The 19 scenarios cover elite-for-elite, elite-for-package, strong and mid-tier packages, replacement/low-value assets, exact and generic picks, a tiered pick, pick-only packages, K/DST throw-ins, unvalued Roman Hemby and Joe Fagnano, and 1-for-3 and 2-for-2 package shapes. The diagnostic prints the complete per-scenario output: asset names and methods, raw totals, market split, fairness, band, edge, gap, evidence, status, warnings, research metrics, and qualitative review.

## Scenario matrix

| ID | Shape | Human review | Expected v1 observation |
|---|---|---|---|
| A | Gibbs for Bijan | SENSIBLE | elite-for-elite near parity |
| B | Chase for London + 2027 early 1st | QUESTIONABLE | raw package edge; consolidation deferred |
| C | Puka for Amon-Ra + Love | QUESTIONABLE | raw package edge; concentration deferred |
| D | JSN for Puka | SENSIBLE | comparable strong-player values |
| E | London + 2027 2nd for McBride | SENSIBLE | modest package edge |
| F | McMillan + Loveland for CeeDee | SENSIBLE | two mid-tier assets exceed one stronger asset |
| G | London for generic 2027 1st | SENSIBLE | current player exceeds supplied future-first value |
| H | Nico for 2027 early 1st + 2nd | SENSIBLE | close multi-pick package |
| I | Exact 2026 1.01 for Love | SENSIBLE | exact slot uses exact source row |
| J | Generic 2027 1st for London | SENSIBLE | no future slot inference |
| K | 2027 early 1st + 2nd for McBride | SENSIBLE | multiple picks near parity |
| L | Olave + 2027 2nd for James Cook | SENSIBLE | pick addition restores parity |
| M | Bowers + K for Love | SENSIBLE | 25-unit fallback is a minor throw-in |
| S | Bowers + DST for Love | SENSIBLE | 25-unit fallback is a minor throw-in |
| N | Roman Hemby for Breece | SENSIBLE | SUPPRESSED / INCOMPLETE |
| O | Joe Fagnano for Josh Allen | SENSIBLE | SUPPRESSED / INCOMPLETE |
| P | 2028 1st + 2027 2nd for 2029 1st | SENSIBLE | supplied pick values only |
| Q | Chase for London + 2nd + 3rd | QUESTIONABLE | raw 1-for-3 limitation; no consolidation |
| R | McMillan + Loveland for 2027 1st + 2nd | SENSIBLE | balanced package size |

The exact per-scenario engine output and aggregate distribution are emitted by `npm run trade-shadow:diagnostics` and are deliberately kept internal.

## Human review and limitations

The results are broadly sensible for a raw market-value fairness engine. The three QUESTIONABLE cases are not implementation defects: they expose the intentional v1 limitation that raw sums do not model elite-asset consolidation, roster fit, or positional preferences. Each is retained with `RAW MODEL LIMITATION OBSERVED`; no fairness-v1 change was made.

K/DST fallback participates at 25 units and produces MEDIUM evidence, as specified. Roman Hemby and Joe Fagnano remain unvalued, produce INCOMPLETE evidence, and suppress fairness. Exact, generic, and tiered picks use the supplied source rows without inferring future slots or outcomes.

Freshness changes status/evidence only: the representative trade remains numerically identical across FRESH, AGING, and STALE evaluation dates. Repeated runs are deterministic, and swapping sides preserves fairness, band, and absolute gap while reversing shares and edge.

## Defects and go/no-go

No specification violations, arithmetic defects, evidence/status defects, rounding defects, symmetry failures, or invalid-state defects were found. No engine implementation file required a bug fix in N3.9. Intentional limitations remain: no consolidation adjustment, roster fit, current production, market movement, owner context, historical grading, real-trade grading, or public FantasyCalc display. The licensing gate remains unresolved, so all output is INTERNAL ONLY.

Engine behavior is acceptable for fairness-v1 shadow testing: GREEN. The next phase may perform isolated real-current-trade shadow testing only after maintaining the same no-public-output and no-production-write gates.
