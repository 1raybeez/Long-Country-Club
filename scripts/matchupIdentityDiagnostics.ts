import assert from "node:assert/strict";
import { getOwnerById } from "../lib/ownerRegistry.ts";
import { getLccOwnerById } from "../lib/lccOwners.ts";

assert.equal(getOwnerById("ray-long")?.teamName, "Bower Rangers");
assert.equal(getOwnerById("rob-jenkins")?.teamName, "Roaring 20");
assert.equal(getLccOwnerById("ray-long")?.managerPage.sleeperName, "Bower Rangers");
assert.equal(getLccOwnerById("rob-jenkins")?.managerPage.sleeperName, "Roaring 20");

console.log("LCC matchup identity diagnostics passed: canonical franchise names resolve for Ray Long and Rob Jenkins.");
