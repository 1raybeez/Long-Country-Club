# Trade Verdict v1

`trade-verdict-v1` is a deterministic League Trade synthesis layer. It combines the existing market result, `roster-impact-v1`, `dynasty-direction-v1`, and `trade-fit-v1` into an owner-facing explanation for each actual LCC franchise.

It does not replace or recalculate any underlying model. Market fairness remains the source for current market-value language; roster impact remains the source for lineup and depth language; Dynasty Outlook remains the source for competitive direction, career window, future capital, and trade fit. Correlated signals such as expected-lineup strength and projected weekly scoring are not counted as independent votes. The verdict uses categorical and directional relationships, not a hidden weighted score.

## Vocabulary

Trade types are controlled labels: WIN-NOW MOVE, YOUTH MOVE, FUTURE-CAPITAL MOVE, CONSOLIDATION MOVE, DEPTH MOVE, BALANCED MOVE, RETOOLING MOVE, and MIXED-DIRECTION MOVE. Strategic verdicts are STRONG STRATEGIC FIT, GOOD STRATEGIC FIT, MIXED FIT, QUESTIONABLE FIT, POOR STRATEGIC FIT, and INSUFFICIENT EVIDENCE.

Each franchise receives trade-offs for market value, current lineup, roster depth, career window, future capital, and dynasty direction. Explanations explicitly describe agreement or conflict—for example, improving long-term flexibility while sacrificing current scoring.

## Evidence and incomplete states

A complete verdict has market, roster-impact, and Dynasty Outlook evidence. Missing roster or dynasty evidence produces PARTIAL or INSUFFICIENT EVIDENCE rather than invented “no change” language. The market result and other available sections continue to render independently.

## Scope boundary

Contextual Verdict is League Trade only and uses actual LCC franchise names and server-side franchise context. It supports two-, three-, and four-team League Trades, with a neutral trade-wide summary and one verdict card per participant. It never declares a winner and never says accept, reject, or otherwise recommends an action. There is no master combined score.

Trade Sandbox remains franchise-, roster-, and ownership-agnostic. It receives only asset-market analysis and does not render Roster Impact, Dynasty Outlook, Contender/Rebuilder context, or Contextual Verdict. The existing Package A/Package B Sandbox can later be generalized to neutral Team A/Team B/Team C/Team D labels using the existing multi-team fairness path; that terminology migration is intentionally outside N3.19.
