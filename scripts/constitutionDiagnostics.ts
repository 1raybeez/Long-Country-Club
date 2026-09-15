import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const baseline = execFileSync("git", ["show", "dd4c5ccad729ecef1aee1b7cdab3a30fc6970975:app/league-info/constitution/page.tsx"], { encoding: "utf8" });
const constitution = readFileSync("app/league-info/constitution/page.tsx", "utf8");
const routeConfig = readFileSync("lib/routeConfig.ts", "utf8");
const dollars = (source: string) => source.match(/\$\d+/g) ?? [];
const sectionIds = (source: string) => [...source.matchAll(/id="([^"]+)"/g)].map((match) => match[1]).filter((id) => ["financial", "h1", "h2", "h3", "h4", "h5", "h6", "h7"].includes(id));

assert.equal((baseline.match(/Caddy Fees/g) ?? []).length, 6);
assert.equal((baseline.match(/Club Rule/g) ?? []).length, 21);
assert.equal((constitution.match(/Caddy Fees/g) ?? []).length, 0);
assert.equal((constitution.match(/Club Rule/g) ?? []).length, 0);
assert.ok(constitution.includes("League Fees"));
assert.equal((constitution.match(/League Rule/g) ?? []).length, 21);
assert.ok(routeConfig.includes('label: "Fees & Payouts"'));
assert.ok(routeConfig.includes('href: "/league-info/fees"'));
assert.deepEqual(dollars(baseline), dollars(constitution));
assert.deepEqual(sectionIds(baseline), sectionIds(constitution));
assert.ok(constitution.includes("Official league constitution"));

console.log("LCC Constitution diagnostics passed: terminology cleanup, unchanged dollar values/sections, route compatibility, and retained league identity.");
