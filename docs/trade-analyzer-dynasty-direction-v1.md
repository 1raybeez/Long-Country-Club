# Dynasty Direction and Trade Fit v1

N3.18 adds two isolated, server-side explanatory models to the private Trade Analyzer:

- `dynasty-direction-v1` classifies a League franchise as CONTENDER, PLAYOFF PUSH, BALANCED, RETOOLING, REBUILDING, or UNCLEAR.
- `trade-fit-v1` describes a proposed trade for that franchise as STRONG FIT, FIT, MIXED, POOR FIT, or INSUFFICIENT EVIDENCE.

## Data audit and boundaries

The current roster baseline is `data/current/rosters/2026.json`, using the existing current-roster adapter. Expected lineups, roster-strength calculations, and weekly projections reuse the existing canonical history modules. Player age and career-window evidence comes from the existing Sleeper player catalog when present. Future-pick ownership and value come from `data/current/drafts/future-picks.json` and the existing FantasyCalc/current-value catalog. Current standings and actual record are not used because an approved current standings source is not available in this snapshot.

The model does not fetch external data, write roster or trade records, or alter the valuation, fairness, multi-team fairness, or roster-impact models. Picks change future-capital measures only; they never enter an immediate lineup. Sandbox output is explicitly excluded by the service's public-mode path.

## Direction dimensions

The profile records immediate expected-lineup strength, overall roster strength, starter age/career window, future-pick count and value, valued roster value, and younger/veteran core-asset distribution. A profile is classified UNCLEAR when lineup or roster-strength evidence is unavailable. Otherwise, deterministic thresholds classify strong current teams as CONTENDER or PLAYOFF PUSH, younger low-strength teams with substantial future capital as REBUILDING, older teams with usable current strength as RETOOLING, and remaining complete profiles as BALANCED.

The engine returns before and hypothetical-after profiles, direction-change detection, measured roster/lineup/age/future-capital/value changes, warnings, and a status of COMPLETE, PARTIAL, or INCOMPLETE. Missing age, pick, player, or projection data is surfaced rather than invented. Confidence is HIGH with no warnings, MEDIUM with limited warnings, and LOW when evidence is materially incomplete.

## Trade fit

Trade fit is owner-facing interpretation of the same measured before/after signals. Contenders and playoff-push teams receive stronger fit when expected lineup strength and long-term indicators improve; rebuilding teams receive stronger fit when youth or future capital improves; balanced and retooling teams receive FIT when long-term indicators improve without an immediate decline. Conflicting or materially negative changes are MIXED or POOR FIT. An unclear or incomplete baseline produces INSUFFICIENT EVIDENCE.

These labels are not a winner, recommendation, accept/reject decision, or combined trade score. The API remains additive and the UI renders only human-readable direction, confidence, fit, evidence, and changes.
