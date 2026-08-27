# LCC Trade Analyzer multi-team model v1

## Scope

Two-team trades continue to use `fairness-v1` and the existing `sideA` / `sideB` request. Three- and four-team trades use the explicit `participants` contract and `fairness-multi-v1`; the binary two-team formula is never reused for multi-team trades.

Each participant identifies a franchise and sends one or more catalog asset IDs. Every outgoing asset in a three- or four-team request must name a destination franchise among the other participating franchises. The server validates ownership, uniqueness, destinations, the approved snapshot, and bounded request size.

## Fairness

For participant `i`:

`netDelta_i = receivesValue_i - sendsValue_i`

The engine calculates:

`normalizedImbalance = sum(abs(netDelta_i)) / (sendsValueTotal + receivesValueTotal)`

`fairness = clamp(100 * (1 - normalizedImbalance), 0, 100)`

The denominator is twice the total traded value when routing balances, so a perfectly balanced trade returns 100. The absolute-delta basis is symmetric across participant ordering, bounded, smooth, and directly exposes each participant’s market-value change without naming a winner or loser. The model uses raw approved market values only; it has no consolidation, roster-fit, team-direction, or performance adjustment.

Multi-team bands are versioned with this model: `VERY EVEN` at 95+, `FAIR` at 85–94.9, `SLIGHT EDGE` at 70–84.9, `CLEAR EDGE` at 50–69.9, and `LOPSIDED` below 50. Two-team thresholds are unchanged.

## Evidence and suppression

Trade evidence uses the worst participant-asset evidence with precedence `INCOMPLETE > LOW > MEDIUM > HIGH`. An unvalued or unsupported asset suppresses multi-team fairness instead of treating the missing value as zero. The report still shows safe routing and package information, with `VALUE UNAVAILABLE` where appropriate. Non-high evidence produces a provisional result; high evidence produces an authoritative result.

## Output and limitations

Results show sends, receives, sends value, receives value, net market-value change, received share, asset counts, evidence, warnings, model version, and snapshot date. Market-value change is neutral presentation; it is not a recommendation. There is no winner/loser language, trade execution, persistence, roster fit, consolidation adjustment, or current-performance adjustment.

Multi-team requests are limited to 3 or 4 participants, 15 outgoing assets per participant, and 40 total assets. The existing authenticated-member, feature, licensing, origin, rate-limit, no-store, and no-persistence controls remain in force.
