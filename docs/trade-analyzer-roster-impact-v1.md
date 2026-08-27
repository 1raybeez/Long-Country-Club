# Trade Analyzer roster impact v1

`roster-impact-v1` is a separate, private signal describing the immediate
current-roster effect of a League Trade. It does not alter `fairness-v1`,
`fairness-multi-v1`, market values, market splits, or Market Value Change.

## Source and transformation

League analysis uses the same current LCC owner IDs and current roster source
used by the analyzer catalog. The engine creates an in-memory hypothetical
roster by removing each outgoing player asset from its sender and adding it to
the explicit destination. Draft picks remain market assets but are excluded
from the football roster transformation. No roster, Sleeper, or Firestore data
is written.

The canonical LCC expected-lineup and roster-strength engines are reused for
both the before and after snapshots. Their current preseason cutoff is used;
no future game results or hindsight are introduced.

## Metrics

Roster Strength is the existing roster-strength engine's sum of position-group
baseline totals. Starting Lineup Strength and projected weekly points use the
existing expected-lineup projection path when every required slot is resolved;
otherwise the result is unavailable or partial. Depth is reported by the
existing position-group player counts, with deterministic improved,
unchanged, or reduced labels. Lineup changes identify players entering or
leaving expected slots and slot replacements.

The canonical lineup is 1 QB, 2 RB, 3 WR, 1 TE, 2 FLEX (RB/WR/TE), 1 K, and 1
DST. K/DST assets participate through the existing metadata and roster rules.
Picks have **NO IMMEDIATE LINEUP IMPACT** and never receive invented player
production.

## Multi-team and incomplete states

Two-, three-, and four-team League Trades each receive an independent before,
after, and delta result. Explicit routing determines the only destination of an
incoming player. Participant order does not change the calculation. Sandbox
trades remain market-only because they are not attached to an LCC franchise.

Missing current rosters, unresolved player identity, insufficient lineup
coverage, and unavailable projections produce deterministic partial or
incomplete signals rather than fabricated values. Market fairness remains
available independently when its own evidence rules permit it.

This version does not infer roster fit, positional need, consolidation value,
contender/rebuilder direction, performance adjustments, championship impact, or
an accept/reject recommendation. It is a factual before/after roster signal
only.
