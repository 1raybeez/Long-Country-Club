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
