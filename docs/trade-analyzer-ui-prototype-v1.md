# Private Trade Analyzer UI Prototype v1

## Route and access

The prototype lives at `/trade-analyzer`. The server page requires an authenticated Firebase session, an active LCC member, and `TRADE_ANALYZER_FEATURE_ENABLED=true`. It renders a safe unavailable state when the feature gate is off. `TRADE_ANALYZER_PRIVATE_OUTPUT_APPROVED` must also be true before the catalog or source-derived market values are sent to the browser. Production gates remain off by default and are not changed by this prototype.

## Selection and API interaction

The server loads the pinned approved local snapshot and sends the client an allowlisted catalog: asset ID, display name, asset type, position or pick identity, current owner/team, value status, evidence, and private-test market value only when the private-output gate is approved. Raw snapshot rows, hashes, and source response data are not exposed. The picker supports search, player/pick groups, position filters, selected-state feedback, duplicate prevention, and the N3.13 limit of 15 assets per side.

The browser sends only `sideA.assetIds` and `sideB.assetIds`; server-controlled identity, snapshot, phase, model, output mode, and valuation fields are never client controls. The API remains the calculation authority. Ownership is informational and does not affect value.

## Result hierarchy

Results show authoritative or provisional status, fairness score and approved fairness band, market split, market edge, evidence, symmetric side cards, asset values where permitted, and the pinned snapshot date. No winner/loser, accept/reject, recommendation, or veto language is used. Suppressed or unvalued assets produce a clear “Fairness unavailable” state without converting missing value to zero. API errors map to concise LCC messages.

## Interaction and accessibility

Analyze is disabled until both sides contain an asset and shows a loading state that prevents double submission. Swap Sides clears the result and Reset Trade clears selections, result, and errors. Labels, native controls, keyboard-accessible buttons, focusable controls, remove labels, and an `aria-live` result/error region are provided. The layout stacks side cards and result cards on mobile without horizontal scrolling.

## Known limitations and deferred features

This is a private UX prototype. It does not save, share, persist, execute, or submit trades; show trade history; grade historical LCC trades; or include consolidation, roster fit, performance signals, owner-specific recommendations, public FantasyCalc branding, or public navigation. Licensing approval, production gate enablement, broader snapshot freshness, and N3.15 owner-experience polish remain deferred.

## N3.15 owner experience

The owner-experience rebuild adds two private modes: League Trade and Trade Sandbox. League Trade defaults Participant 1 to the authenticated owner when that canonical mapping exists, requires exactly two participants, prevents the same franchise from occupying both participants, and limits each participant to assets owned by its selected franchise. Players are grouped by QB, RB, WR, TE, K, and DST with compact image-backed rows; current draft capital is grouped by year and preserves generic-round identity. Values remain hidden on unselected roster rows and appear only in the selected outgoing package and authoritative result.

Trade Sandbox retains search-driven global catalog selection, position filtering, hypothetical combinations, and informational ownership without ownership enforcement. Switching modes resets the active trade. Both modes use the unchanged asset-ID-only private API and the existing fairness-v1 result contract. Multi-team trades, random trades, roster fit, consolidation, performance signals, persistence, sharing, execution, and public navigation remain deferred.

The corrected League Trade layout starts both participants unselected. Each participant is an independent vertical column containing its franchise selector, identity, outgoing package, compact roster rows, and year-grouped draft picks. Selecting a franchise clears that participant’s package; the other participant is unaffected. Draft picks are selectable and no shared roster-selection section is rendered.
