# Trade Analyzer N3.20 boundaries

Trade Analyzer is available from the centralized League Info navigation at
`/league-info/trade-analyzer`; the existing `/trade-analyzer` deep link remains
available for compatibility. Both routes use the same authentication, active
member, feature, licensing, and approved-snapshot gates.

League Trade is the LCC-specific contextual analyzer. It uses actual franchise
names, ownership, rosters, picks, roster impact, dynasty direction, and the
contextual Trade Verdict.

Trade Sandbox is a franchise-agnostic asset-fairness calculator. It uses only
neutral Team A, Team B, Team C, and Team D labels, supports two through four
teams, and routes outgoing assets to neutral destinations. It does not use LCC
ownership, rosters, standings, competitive windows, roster impact, dynasty
direction, trade fit, or contextual verdicts.

Sandbox generic future picks use neutral year/round identities such as
`sandbox-pick-2027-1` and approved generic year/round valuation rows. Exact LCC
pick slots and ownership metadata are not exposed. Specific players remain
unique assets within a hypothetical trade; generic pick identities represent
the neutral year/round asset rather than an LCC franchise-owned pick.
