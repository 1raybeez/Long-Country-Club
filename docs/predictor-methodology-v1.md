# LCC Predictor 2.0 — Preseason V1 Methodology Contract

Status: Slice 3 approved preseason snapshot freeze; the approved artifact is an
immutable baseline for future forecast-vs-reality comparisons.

## Active preseason model

The Team Strength Index is calculated for the current LCC season with:

- 70% expected starting lineup strength
- 20% active depth strength
- 10% positional balance

Each component is normalized independently against the 12 current LCC
franchises using a tied midrank percentile from 0–100. Confidence is reported
separately and never multiplies or discounts the Team Strength Index.

Expected starting lineup strength uses the existing canonical 11-slot lineup
engine and the existing historical scoring fallback. Active depth is the
average baseline of the best six usable bench options after expected starters,
taxi players, and reserve/IR players are excluded. Positional balance is the
mean available QB/RB/WR/TE/K/DST position index multiplied by the fraction of
those six position groups with usable baseline coverage.

## Inputs and uncertainty

- Roster source: canonical current LCC roster snapshots from the existing
  history engine.
- Player baseline: latest prior-season scored sample, then career historical
  scoring when needed.
- Rookies without historical production are excluded from baseline math and
  receive a separate conservative `ROOKIE_MARKET` baseline only when the
  frozen, position-aware market reference has sufficient sample coverage.
  They are not assigned zero production or treated as historical veterans.
- Taxi players and reserve/IR players are excluded from expected lineups and
  active depth, while their counts remain visible in coverage metadata.
- No future picks, Draft Intelligence grades, manager career data, finance
  data, projected records, playoff odds, or championship odds are inputs.

Tiers are deterministic natural-break buckets ordered by Team Strength Index:
CONTENDER, STRONG, IN THE MIX, and QUESTION MARK. Adjacent score gaps are
compared with the league median gap; material gaps at least three points are
selected with a minimum two-team segment guardrail, up to three boundaries.
This does not force equal tier populations. Key strength and key concern are
deterministic derived labels; missing lineup positions take priority over
baseline-coverage concerns.

The rookie adapter ranks rookies only against rookies at the same position.
With at least three market records and three historical position baselines,
the market percentile is mapped into the established veteran 25th–75th
percentile baseline interval. This is a relative baseline anchor, not a
market-value-to-fantasy-points conversion. K/DST rookies remain unresolved
because the frozen reference does not support those positions.

Historical and `ROOKIE_MARKET` baselines are tracked separately. Rookie-market
baselines can contribute to strength, but they remain uncertainty for
confidence and never directly penalize the Team Strength Index.

The model version remains `predictor-preseason-v1`. The approved snapshot is
`data/approved/predictor/2026/preseason-team-strength-v1.json`; it records its
generation and approval timestamps separately, retains the exact data cutoff,
and is intended to remain unchanged as the forecast-vs-reality baseline.
Generate and validate a non-writing preview with `npm run predictor:snapshot`.
Create it only with the explicit `npm run predictor:snapshot -- --write` command;
the tooling refuses to overwrite an existing approved artifact by default.
The public Predictor page and Home preview currently consume the canonical
adapter directly; switching them to this immutable artifact is a separate,
narrow follow-up after the freeze.

## Historical context and limitations

The historical matchup projection backtest is disclosed as context for broad
relative ranking only. It does not authorize exact weekly scores, records, or
probabilities. Current 2026 roster captures do not establish a full weekly
schedule or in-season scoring record.

## Future in-season transition concept (not active in Preseason V1)

The future contract is documented separately and is not used by the active
preseason calculation:

| Phase | Roster strength | Actual scoring | Record/opponent | Lineup efficiency/availability |
| --- | ---: | ---: | ---: | ---: |
| Weeks 1–3 | 55% | 25% | 10% | 10% |
| Weeks 4–8 | 35% | 35% | 15% | 15% |
| Week 9 onward | 20% | 40% | 20% | 20% |

Before publishing future records or playoff/championship probabilities, the
system must have a future schedule, scoring distributions and variance,
remaining opponents, and at least 10,000 simulations. Forecast-vs-reality
outputs must preserve the frozen forecast snapshot and its cutoff metadata.
