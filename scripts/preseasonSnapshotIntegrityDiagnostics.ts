import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getApprovedPreseasonSnapshot, PREDICTOR_APPROVED_SNAPSHOT_PATH } from "../lib/predictor.ts";

const path = join(process.cwd(), PREDICTOR_APPROVED_SNAPSHOT_PATH);
const bytes = readFileSync(path);
const snapshot = getApprovedPreseasonSnapshot();
assert.equal(createHash("sha256").update(bytes).digest("hex"), "b6b9d4e304dd300a5b32e1354e1a19a502e8d7680ed1e7e09b58e37caa8d2ae1");
assert.equal(snapshot.season, 2026);
assert.equal(snapshot.forecastType, "PRESEASON");
assert.equal(snapshot.snapshotStatus, "APPROVED");
assert.equal(snapshot.immutable, true);
assert.equal(snapshot.teams.length, 12);
assert.deepEqual(snapshot.teams.map((team) => team.forecastOrder), Array.from({ length: 12 }, (_, index) => index + 1));
assert.equal(new Set(snapshot.teams.map((team) => team.ownerId)).size, 12);
assert.equal(new Set(snapshot.teams.map((team) => team.teamName)).size, 12);
assert.equal(JSON.stringify(snapshot.teams), JSON.stringify(JSON.parse(bytes.toString("utf8")).teams));
assert.ok(snapshot.modelName && snapshot.modelVersion && snapshot.generatedAt && snapshot.dataCutoff);

console.log("LCC preseason snapshot integrity diagnostics passed: approved immutable artifact, metadata, 12-team order, IDs, names, and values are unchanged.");
