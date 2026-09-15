import assert from "node:assert/strict";
import { loadAllMatchups } from "../lib/history/matchups.ts";

const matchups = loadAllMatchups();
for (const season of [2021, 2022, 2023, 2024, 2025]) {
  assert.ok(matchups.some((matchup) => matchup.season === season), `missing historical season ${season}`);
}
assert.ok(matchups.some((matchup) => matchup.season === 2025 && matchup.ownerAScore !== null && matchup.ownerBScore !== null));
console.log("LCC historical matchup regression diagnostics passed: 2021–2025 archive seasons remain populated and scored.");
