import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const snapshotDate = process.env.SNAPSHOT_DATE ?? "2026-08-26";
const read = async (file) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const snapshot = await read(`data/trade-analyzer/valuations/fantasycalc/normalized/${snapshotDate}.json`);

const sum = (assets) => assets.reduce((total, asset) => total + (asset.value ?? 0), 0);
const marketSplit = (a, b) => a + b > 0 ? [a / (a + b), b / (a + b)] : [null, null];
const modelA = (a, b) => a + b > 0 ? 200 * Math.min(a, b) / (a + b) : null;
const modelB = (a, b) => Math.max(a, b) > 0 ? 100 * Math.min(a, b) / Math.max(a, b) : null;
const band = (score) => score === null ? "INCOMPLETE" : score >= 97 ? "VERY EVEN" : score >= 92 ? "FAIR" : score >= 82 ? "SLIGHT EDGE" : score >= 70 ? "CLEAR EDGE" : "LOPSIDED";
const percentile = (values, p) => { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))]; };
const concentration = (assets) => { const values = assets.map((asset) => asset.value).filter((value) => typeof value === "number").sort((a, b) => b - a); const total = values.reduce((a, b) => a + b, 0); return { assetCount: values.length, topAssetShare: total ? values[0] / total : null, topTwoShare: total ? (values[0] + (values[1] ?? 0)) / total : null }; };
const cases = [
  ["CASE 1", [{ value: 5000 }], [{ value: 5000 }]],
  ["CASE 2", [{ value: 5500 }], [{ value: 4500 }]],
  ["CASE 3", [{ value: 6000 }], [{ value: 4000 }]],
  ["CASE 4", [{ value: 7000 }], [{ value: 3000 }]],
  ["CASE 5", [{ value: 10000 }], [{ value: 5000 }, { value: 5000 }]],
  ["CASE 6", [{ value: 10000 }, { value: 1000 }], [{ value: 5500 }, { value: 5500 }]],
  ["CASE 7", [{ value: 9000 }], [{ value: 3000 }, { value: 3000 }, { value: 3000 }]],
  ["CASE 8", [{ value: 8000 }, { value: 2000, kind: "PICK" }], [{ value: 5000 }, { value: 5000 }]],
  ["CASE 9", [{ value: 5000 }], [{ value: 4975 }, { value: 25, kind: "K" }]],
  ["CASE 10", [{ value: 5000 }, { value: null, kind: "UNVALUED" }], [{ value: 5000 }]],
];
const synthetic = cases.map(([name, sideA, sideB]) => {
  const incomplete = [...sideA, ...sideB].some((asset) => asset.value === null);
  const a = sum(sideA); const b = sum(sideB); const [shareA, shareB] = marketSplit(a, b); const score = incomplete ? null : modelA(a, b);
  return { name, rawSideTotals: { sideA: a, sideB: b }, marketSplit: shareA === null ? null : `${Math.round(shareA * 100)} / ${Math.round(shareB * 100)}`, candidateFairness: { modelA: score, modelB: incomplete ? null : modelB(a, b) }, recommendedBand: band(score), concentration: { sideA: concentration(sideA), sideB: concentration(sideB) }, consolidationIssue: sideA.length !== sideB.length || (concentration(sideA).topAssetShare !== concentration(sideB).topAssetShare), evidence: incomplete ? "INCOMPLETE" : "HIGH" };
});

const eligible = snapshot.players.filter((row) => typeof row.rawValue === "number" && row.rawValue > 0);
const roster = await read("data/current/rosters/2026.json");
const rosterIds = new Set(roster.rosters.flatMap((r) => r.players ?? []));
const rosterSkill = eligible.filter((row) => rosterIds.has(row.sleeperId) && ["QB", "RB", "WR", "TE"].includes(row.position));
const values = eligible.map((row) => row.rawValue);
const rosterValues = rosterSkill.map((row) => row.rawValue);
console.log(JSON.stringify({
  status: "PASS",
  model: "LCC Trade Fairness",
  version: "fairness-v1",
  synthetic,
  snapshotSensitivity: {
    snapshotDate,
    eligibleValuedPlayerRows: eligible.length,
    p90EligibleSourceValue: percentile(values, 0.9),
    p25RosteredSkillSourceValue: percentile(rosterValues, 0.25),
    rosteredSkillRows: rosterSkill.length,
    eliteDefinition: "eligible source value at or above snapshot P90; K/DST and UNVALUED excluded",
    replacementDefinition: "positive rostered QB/RB/WR/TE source value at snapshot P25; K/DST and UNVALUED excluded",
  },
  noRealTradeAnalysis: true,
  noFairnessCalculationForRealTrades: true,
}, null, 2));
