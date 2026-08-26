# LCC Trade Analyzer Fairness Engine v1

Status: isolated implementation only — not connected to the application, an API route, a client bundle, Firestore, or production.

## Boundary and versions

`lib/trade-analyzer/fairnessEngine.ts` consumes only the source-agnostic normalized contract in `lib/trade-analyzer/types.ts`. Source adapters resolve identity, source rows, provenance, license state, and fallback policy before calling the engine. The engine never fetches a network resource and is not coupled to FantasyCalc's response shape.

Every result carries `valuation-v1` and `fairness-v1`, plus source, snapshot date, UTC retrieval/evaluation timestamps, phase, and league configuration.

## Input and failure behavior

Each side has a non-empty `sideId` and normalized assets. Assets identify their class, display name, value status, value method, source, and (when valued or fallback) a finite non-negative `baseValue`. Picks must declare `EXACT_SLOT`, `TIERED`, or `GENERIC_ROUND`; the engine never infers a missing class.

`VALUED` and `FALLBACK` values contribute to raw side totals. `UNVALUED` and `UNSUPPORTED` assets never become zero: they produce a suppressed result with known subtotals preserved. Empty sides, malformed values, negative/non-finite values, future timestamps, missing phases, ambiguous picks, and zero combined totals are invalid. Public output with an unapproved source license is blocked; private commissioner calculations carry `SOURCE_LICENSE_UNAPPROVED` as an error only when public output is requested.

## Result and mathematics

The result includes both side assets, raw and known subtotals, status counts, evidence, market shares, warnings/errors, research-only concentration metrics, and the trade result. Internal values retain precision.

`fairness = 200 × min(A, B) / (A + B)` and `market share = side value / (A + B)`. Market edge is `SIDE_A`, `SIDE_B`, or `NONE`; the engine does not name a winner or loser. Bands are VERY EVEN `[97,100]`, FAIR `[92,97)`, SLIGHT EDGE `[82,92)`, CLEAR EDGE `[70,82)`, and LOPSIDED `[0,70)`.

Display shares use decimal half-up rounding to whole percentages, with side B set to `100 - side A`. Display fairness uses decimal half-up rounding to one decimal. These display values never feed back into the internal calculation.

## Freshness and evidence

The caller supplies `DRAFT_WINDOW`, `IN_SEASON`, or `OFFSEASON`. Age is the non-negative elapsed whole-day UTC difference between retrieval and evaluation. Fresh/aging/stale thresholds are respectively 0–3/4–7/>7 days in draft window, 0–7/8–14/>14 in season, and 0–30/31–60/>60 offseason. Aging is PROVISIONAL/MEDIUM; stale is PROVISIONAL/LOW. Approved K/DST fallback is 25 internal units, participates in totals, is never elite, and is explicitly MEDIUM evidence with a fallback warning.

Evidence precedence is `INCOMPLETE > LOW > MEDIUM > HIGH`. Warnings include freshness, fallback, source coverage, and the non-authoritative nature of research fields. Blocking identifiers are deterministic and exposed on the result.

## Source-swappable and deferred scope

The diagnostic includes a non-app adapter for the current normalized FantasyCalc snapshot and verifies 305 roster classifications (268 direct, 35 K/DST fallback, 2 unvalued) and 144/144 picks, without inventing values for the unvalued rookies.

The engine performs no consolidation adjustment, does not expose `adjustedTradeValue`, and has no roster fit, current performance, market movement, standings, Draft Intelligence, Predictor, trade advice, historical grading, real-trade grading, UI, API, or Firestore behavior. Research metrics are informational only and cannot alter fairness-v1.
