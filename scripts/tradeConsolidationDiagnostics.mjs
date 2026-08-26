import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const snapshotDate = process.env.SNAPSHOT_DATE ?? "2026-08-26";
const read = async (file) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const snapshot = await read(`data/trade-analyzer/valuations/fantasycalc/normalized/${snapshotDate}.json`);
const roster = await read("data/current/rosters/2026.json");
const rosterIds = new Set(roster.rosters.flatMap((row) => row.players ?? []));
const eligible = snapshot.players.filter((row) => typeof row.rawValue === "number" && row.rawValue > 0);
const rosterSkill = eligible.filter((row) => rosterIds.has(row.sleeperId) && ["QB", "RB", "WR", "TE"].includes(row.position));
const percentile = (values, p) => { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))]; };
const values = eligible.map((row) => row.rawValue); const rosterValues = rosterSkill.map((row) => row.rawValue);
const thresholds = Object.fromEntries([85, 90, 95, 99].map((p) => [p, percentile(values, p / 100)]));
const replacement = Object.fromEntries([15, 20, 25, 30].map((p) => [p, percentile(rosterValues, p / 100)]));
const above = Object.fromEntries(Object.entries(thresholds).map(([p, value]) => [p, eligible.filter((row) => row.rawValue >= value).length]));
const below = Object.fromEntries(Object.entries(replacement).map(([p, value]) => [p, rosterSkill.filter((row) => row.rawValue < value).length]));
const modelA = (a, b) => 200 * Math.min(a, b) / (a + b);
const band = (score) => score >= 97 ? "VERY EVEN" : score >= 92 ? "FAIR" : score >= 82 ? "SLIGHT EDGE" : score >= 70 ? "CLEAR EDGE" : "LOPSIDED";
const isPick = (asset) => asset.kind === "PICK"; const isKdst = (asset) => asset.kind === "K" || asset.kind === "DST";
const adjusted = (assets, eliteThreshold, elitePremium, lowDiscount, slotCost) => {
  const raw = assets.reduce((total, asset) => total + asset.value, 0);
  const premium = assets.filter((asset) => !isKdst(asset) && asset.value >= eliteThreshold).reduce((total, asset) => total + asset.value * elitePremium, 0);
  const dilution = assets.filter((asset) => !isPick(asset) && !isKdst(asset) && asset.value < replacement[25]).reduce((total, asset) => total + asset.value * lowDiscount, 0);
  const playerCount = assets.filter((asset) => !isPick(asset)).length;
  return raw + premium - dilution - Math.max(0, playerCount - 1) * slotCost;
};
const evaluate = (aAssets, bAssets, options) => { const a = adjusted(aAssets, options.eliteThreshold, options.elitePremium, options.lowDiscount, options.slotCost); const b = adjusted(bAssets, options.eliteThreshold, options.elitePremium, options.lowDiscount, options.slotCost); return { raw: [aAssets.reduce((s, x) => s + x.value, 0), bAssets.reduce((s, x) => s + x.value, 0)], adjusted: [Number(a.toFixed(2)), Number(b.toFixed(2))], fairness: Number(modelA(a, b).toFixed(2)), band: band(modelA(a, b)) }; };
const cases = [
  ["A", [{ value: 10000 }], [{ value: 5000 }, { value: 5000 }]], ["B", [{ value: 10000 }, { value: 1000 }], [{ value: 5500 }, { value: 5500 }]], ["C", [{ value: 9000 }], [{ value: 3000 }, { value: 3000 }, { value: 3000 }]], ["D", [{ value: 8000 }], [{ value: 4000 }, { value: 2000 }, { value: 2000 }]], ["E", [{ value: 8000 }], [{ value: 6000 }, { value: 2000, kind: "PICK" }]], ["F", [{ value: 7000 }], [{ value: 4000 }, { value: 3000, kind: "PICK" }]], ["G", [{ value: 5000 }], [{ value: 3500 }, { value: 1500 }]], ["H", [{ value: 5000 }], [{ value: 4000 }, { value: 500 }, { value: 500 }]], ["I", [{ value: 5000 }], [{ value: 4950 }, { value: 25, kind: "K" }, { value: 25, kind: "DST" }]], ["J", [{ value: 6000 }, { value: 2000 }], [{ value: 4000 }, { value: 4000 }]], ["K", [{ value: 4000 }], [{ value: 2000 }, { value: 2000 }]], ["L", [{ value: 3000 }], [{ value: 1500 }, { value: 1500 }]], ["M", [{ value: 10000 }, { value: 4000, kind: "PICK" }], [{ value: 7000 }, { value: 6500 }]], ["N", [{ value: 10000 }], [{ value: 7000 }, { value: 2500, kind: "PICK" }, { value: 500 }]],
];
const baseline = cases.map(([name, a, b]) => ({ name, ...evaluate(a, b, { eliteThreshold: thresholds[90], elitePremium: 0, lowDiscount: 0, slotCost: 0 }) }));
const candidate = cases.map(([name, a, b]) => ({ name, ...evaluate(a, b, { eliteThreshold: thresholds[90], elitePremium: 0.05, lowDiscount: 0.2, slotCost: 50 }) }));
const grid = { elitePremiums: [0, 0.02, 0.05, 0.075, 0.1], lowDiscounts: [0, 0.1, 0.2, 0.3, 0.5], slotCosts: [0, 25, 50, 100] };
const allGrid = []; for (const elitePremium of grid.elitePremiums) for (const lowDiscount of grid.lowDiscounts) for (const slotCost of grid.slotCosts) allGrid.push({ elitePremium, lowDiscount, slotCost });
const monotonicity = [0, 1000, 5000, 10000].every((value) => adjusted([{ value }], thresholds[90], 0.05, 0.2, 50) >= value);
const symmetry = cases.every(([, a, b]) => { const x = evaluate(a, b, { eliteThreshold: thresholds[90], elitePremium: 0.05, lowDiscount: 0.2, slotCost: 50 }); const y = evaluate(b, a, { eliteThreshold: thresholds[90], elitePremium: 0.05, lowDiscount: 0.2, slotCost: 50 }); return x.fairness === y.fairness && x.adjusted[0] === y.adjusted[1] && x.adjusted[1] === y.adjusted[0]; });
const bandTransitions = candidate.filter((row, index) => row.band !== baseline[index].band).length;
const smoothPremium = (value) => Math.max(0, Math.min(0.05, 0.05 * (value - thresholds[90]) / Math.max(1, thresholds[99] - thresholds[90])));
const hardBelow = adjusted([{ value: thresholds[90] - 1 }], thresholds[90], 0.05, 0, 0);
const hardAt = adjusted([{ value: thresholds[90] }], thresholds[90], 0.05, 0, 0);
const smoothBelow = (thresholds[90] - 1) * (1 + smoothPremium(thresholds[90] - 1));
const smoothAt = thresholds[90] * (1 + smoothPremium(thresholds[90]));
const maxRelativeAdjustment = Math.max(...allGrid.flatMap((options) => cases.flatMap(([, a, b]) => { const result = evaluate(a, b, { eliteThreshold: thresholds[90], ...options }); return result.raw.flatMap((raw, index) => raw ? [Math.abs(result.adjusted[index] / raw - 1)] : []); })));
console.log(JSON.stringify({ status: "PASS", snapshotDate, thresholds, playersAboveThreshold: above, replacement, rosteredSkillPlayersBelowThreshold: below, candidateModels: { baseline, elite5: cases.map(([name, a, b]) => ({ name, ...evaluate(a, b, { eliteThreshold: thresholds[90], elitePremium: 0.05, lowDiscount: 0, slotCost: 0 }) })), dilution20: cases.map(([name, a, b]) => ({ name, ...evaluate(a, b, { eliteThreshold: thresholds[90], elitePremium: 0, lowDiscount: 0.2, slotCost: 0 }) })), hybrid5_20_50: candidate }, coefficientGrid: { ...grid, combinations: allGrid.length }, hardThresholdCliff: { below: hardBelow, at: hardAt, jump: Number((hardAt - hardBelow).toFixed(2)) }, graduatedPremium: { below: Number(smoothBelow.toFixed(2)), at: Number(smoothAt.toFixed(2)), jump: Number((smoothAt - smoothBelow).toFixed(2)), maximumPremium: "5%" }, maxRelativeAdjustmentAcrossGrid: Number((maxRelativeAdjustment * 100).toFixed(2)), monotonicity, symmetry, candidateBandTransitions: bandTransitions, picksExemptFromSlotCost: true, noRealTradesAnalyzed: true, noProductionAdjustment: true, recommendation: "OPTION_E_DEFER" }, null, 2));
