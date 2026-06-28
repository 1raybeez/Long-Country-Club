# Long Country Club Almanac Architecture

Long Country Club is becoming an Almanac and historical record, not just a live fantasy football app. The codebase should preserve source material, convert verified facts into canonical structured data, and expose that history through shared helpers and pages.

## Data Ownership

- `data/source` contains original source artifacts: exports, screenshots, spreadsheets, documents, forms, and other evidence.
- `data/history` contains structured canonical JSON derived from verified source material.
- Historical data lives in Git. Commit reviewed historical facts alongside the code that consumes them.
- Do not overwrite or reinterpret historical data casually. Prefer a traceable migration from `data/source` to `data/history`.

## Runtime Data

- Firestore should be reserved for live/current-season app state.
- Sleeper API should power 2019-present live, draft, and current-season data where available.
- Historical records that need to remain stable should be materialized in Git instead of depending on live services at render time.

## Owner Identity

- `lib/ownerRegistry.ts` is the only alias resolver.
- Pages and import scripts should resolve owner names, nicknames, Sleeper display names, and historical aliases through the owner registry.
- Do not create new one-off alias maps when `ownerRegistry` can resolve the value.
- Owner images should use `/owners/{ownerId}.png`.
- Use shared owner image helpers instead of hardcoding legacy manager image filenames.

## Public Assets

- `public` contains assets served by the app.
- Refer to assets by their deployed public paths, not by filesystem paths.
- Keep public logo references standardized to lowercase filenames under `/logos`.
- Keep owner photos standardized by canonical owner ID under `/owners`.

## Page and Helper Boundaries

- Pages should consume shared helpers instead of hardcoded arrays.
- Put reusable data transforms in `lib/` and page-specific presentation logic in the page or component layer.
- Shared League Info layouts and UI components should be reused for new League Info pages.
- Avoid duplicating financial, standings, owner, or placement facts inside components when canonical helpers exist.

## Codex Workflow Guardrails

- One Codex task should equal one focused commit whenever possible.
- Keep changes scoped to the request. Do not combine unrelated UI, data, asset, or logic changes.
- Do not modify historical JSON, financial data, final placement data, or owner registry logic unless the task explicitly asks for that migration.
- Preserve source artifacts. New migrations should add or update structured canonical data, not erase source evidence.
- Run validation for meaningful changes: TypeScript, build, and whitespace checks unless the task says otherwise.
