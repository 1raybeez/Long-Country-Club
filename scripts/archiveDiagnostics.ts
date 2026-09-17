import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { loadArchiveCoverage } from "../lib/history/archiveStats";
import { getLccOwnerBySleeperUserId } from "../lib/lccOwners";

const root = process.cwd();
const expectedSeasons = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
const coverage = loadArchiveCoverage();

assert.deepEqual(coverage.expectedSeasons, expectedSeasons);
assert.deepEqual(coverage.seasons.map((season) => season.season), expectedSeasons);
assert.equal(coverage.seasons.find((season) => season.season === 2021)?.status, "partial");
assert.match(coverage.seasons.find((season) => season.season === 2021)?.warnings.join(" ") ?? "", /does not include an owner ID/);
assert.equal(coverage.seasons.filter((season) => season.status === "complete").length, 6);
assert.equal(coverage.seasons.find((season) => season.season === 2021)?.totalRosters, 12);
assert.equal(coverage.seasons.find((season) => season.season === 2021)?.attributedRosters, 11);
assert.equal(coverage.hasUsableData, true);

const expectedAggregate = new Map<string, { wins: number; losses: number; ties: number; fpts: number; ppts: number; seasons: number }>();
for (const season of expectedSeasons) {
  const rosters = JSON.parse(readFileSync(path.join(root, "data/history/matchups/sleeper", String(season), "rosters.json"), "utf8")) as Array<{ owner_id?: string | null; settings?: Record<string, number> }>;
  for (const roster of rosters) {
    const owner = roster.owner_id ? getLccOwnerBySleeperUserId(roster.owner_id) : null;
    if (!owner) continue;
    const settings = roster.settings ?? {};
    const current = expectedAggregate.get(owner.id) ?? { wins: 0, losses: 0, ties: 0, fpts: 0, ppts: 0, seasons: 0 };
    current.wins += settings.wins ?? 0;
    current.losses += settings.losses ?? 0;
    current.ties += settings.ties ?? 0;
    current.fpts += (settings.fpts ?? 0) + (settings.fpts_decimal ?? 0) / 100;
    current.ppts += (settings.ppts ?? 0) + (settings.ppts_decimal ?? 0) / 100;
    current.seasons += 1;
    expectedAggregate.set(owner.id, current);
  }
}

for (const [ownerId, expected] of expectedAggregate) {
  const actual = coverage.aggregates.find((aggregate) => aggregate.id === ownerId);
  assert.ok(actual, `missing aggregate for ${ownerId}`);
  assert.deepEqual(
    {
      wins: actual.wins,
      losses: actual.losses,
      ties: actual.ties,
      fpts: actual.fpts,
      ppts: actual.ppts,
      seasons: actual.seasons,
    },
    expected,
    `metric parity failed for ${ownerId}`,
  );
}

const missingRoot = mkdtempSync(path.join(os.tmpdir(), "lcc-archive-diagnostics-"));
const failedCoverage = loadArchiveCoverage({
  archiveRoot: missingRoot,
  seasons: [{ year: 2019, id: "test-league" }],
});
assert.equal(failedCoverage.seasons[0]?.status, "failed");
assert.match(failedCoverage.seasons[0]?.errors.join(" ") ?? "", /Missing users snapshot/);
assert.equal(failedCoverage.hasUsableData, false);

const invalidRoot = mkdtempSync(path.join(os.tmpdir(), "lcc-archive-diagnostics-"));
mkdirSync(path.join(invalidRoot, "2019"));
writeFileSync(path.join(invalidRoot, "2019/users.json"), "not-json");
writeFileSync(path.join(invalidRoot, "2019/rosters.json"), "[]");
const invalidCoverage = loadArchiveCoverage({
  archiveRoot: invalidRoot,
  seasons: [{ year: 2019, id: "test-league" }],
});
assert.equal(invalidCoverage.seasons[0]?.status, "failed");
assert.match(invalidCoverage.seasons[0]?.errors.join(" ") ?? "", /Unable to parse/);

const clientSource = readFileSync(path.join(root, "app/league-info/archives/ArchivesClient.tsx"), "utf8");
assert.doesNotMatch(clientSource, /api\.sleeper\.app/);
assert.doesNotMatch(clientSource, /useEffect[\s\S]*fetch\(/);
assert.match(clientSource, /Season coverage/);
assert.match(clientSource, /formatSeasonStatus/);
for (const status of ["Complete", "Partial", "Failed"]) {
  assert.match(clientSource, new RegExp(status));
}
for (const season of expectedSeasons) {
  assert.match(clientSource, /archive\.seasons\.map/);
  assert.ok(coverage.seasons.some((result) => result.season === season));
}
assert.match(clientSource, /season\.warnings\.join/);
for (const metric of ["All-Time Wins", "All-Time Points", "Best Season", "Lowest Season", "Best Win %", "Lineup Efficiency"]) {
  assert.match(clientSource, new RegExp(metric.replace(/[ %]/g, "[ _%]")));
}

rmSync(missingRoot, { recursive: true, force: true });
rmSync(invalidRoot, { recursive: true, force: true });

console.log("LCC Archives diagnostics: PASS");
console.log(`- ${coverage.seasons.length} expected seasons retained`);
console.log(`- ${coverage.seasons.filter((season) => season.status === "complete").length} complete, ${coverage.seasons.filter((season) => season.status === "partial").length} partial, ${coverage.seasons.filter((season) => season.status === "failed").length} failed`);
console.log("- 2021 ownerless roster detected as partial");
console.log("- legacy metric parity, failed-source handling, and client fetch removal checked");
