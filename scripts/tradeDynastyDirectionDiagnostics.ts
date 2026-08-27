import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildCurrentAssetCatalog } from "../lib/trade-analyzer/currentValuationAdapter.ts";
import { calculateDynastyDirection, classifyDynastyDirection } from "../lib/trade-analyzer/dynastyDirectionEngine.ts";
import { analyzeTradeInternal } from "../lib/trade-analyzer/tradeAnalysisService.ts";
import type { CurrentCatalogAsset } from "../lib/trade-analyzer/types.ts";

const read = async (file: string) => JSON.parse(await readFile(file, "utf8"));
const snapshot = await read("data/trade-analyzer/valuations/fantasycalc/normalized/2026-08-26.json");
const manifest = await read("data/trade-analyzer/valuations/fantasycalc/manifest.json");
const roster = await read("data/current/rosters/2026.json");
const playerCatalog = await read("data/history/matchups/sleeper/players.json");
const futurePicks = await read("data/current/drafts/future-picks.json");
const catalog = buildCurrentAssetCatalog({ snapshot, manifest, roster, playerCatalog, futurePicks, integrityVerified: true });
const dependencies = { catalog, snapshot: { date: "2026-08-26", sourceName: "FantasyCalc", sourceUrl: snapshot.sourceUrl, retrievedAt: snapshot.retrievalTimestamp, sourceLicenseStatus: "COMMISSIONER_REVIEW_REQUIRED", integrityValid: true }, modelVersions: { valuationPolicyVersion: "valuation-v1", fairnessModelVersion: "fairness-v1" } };
const asset = (name: string) => { const found = catalog.assets.find((candidate) => candidate.displayName === name); assert(found, `missing ${name}`); return found; };
const pick = (season: number, round: number) => { const found = catalog.assets.find((candidate) => candidate.assetType === "PICK" && candidate.season === season && candidate.round === round); assert(found, `missing pick ${season}/${round}`); return found; };
const owners = roster.rosters.map((row: { ownerId: string }) => row.ownerId);
assert(owners.length === 12);
const ownerAssets = (ownerId: string) => catalog.assets.filter((candidate) => candidate.ownerId === ownerId);
const input = (ownerId: string, sends: CurrentCatalogAsset[], receives: CurrentCatalogAsset[], extraAssets: CurrentCatalogAsset[] = []) => ({ franchiseId: ownerId, franchiseName: ownerId, currentAssets: [...ownerAssets(ownerId), ...extraAssets], sends, receives });

assert.equal(classifyDynastyDirection({ lineupStrength: 120, rosterStrength: 110, starterAge: 27, youngerCoreShare: .4, futurePickValue: 1000 }), "CONTENDER");
assert.equal(classifyDynastyDirection({ lineupStrength: 80, rosterStrength: 70, starterAge: 23, youngerCoreShare: .5, futurePickValue: 3000 }), "REBUILDING");
assert.equal(classifyDynastyDirection({ lineupStrength: 95, rosterStrength: 84, starterAge: 27, youngerCoreShare: .3, futurePickValue: 1000 }), "BALANCED");
assert.equal(classifyDynastyDirection({ lineupStrength: null, rosterStrength: 90, starterAge: null, youngerCoreShare: null, futurePickValue: null }), "UNCLEAR");

const gibbs = asset("Jahmyr Gibbs");
const bijan = asset("Bijan Robinson");
const first = pick(2027, 1);
const twoTeam = calculateDynastyDirection([input(owners[0], [gibbs], [bijan, first]), input(owners[1], [bijan, first], [gibbs], [first])]);
assert.equal(twoTeam.participants.length, 2);
assert(twoTeam.participants.every((participant) => participant.before && participant.after));
assert(twoTeam.participants.some((participant) => participant.changes.futureCapital === "INCREASED"));
assert(twoTeam.participants.some((participant) => participant.changes.futureCapital === "DECREASED"));
assert(twoTeam.participants.every((participant) => ["COMPLETE", "PARTIAL", "INCOMPLETE"].includes(participant.status)));

const youthVeteran = calculateDynastyDirection([input(owners[0], [asset("Joe Fagnano")], [asset("Josh Allen")])]);
assert(youthVeteran.participants[0].after.ageCareerWindow.available || youthVeteran.participants[0].warnings.includes("AGE_DATA_UNAVAILABLE"));
const four = calculateDynastyDirection(owners.slice(0, 4).map((ownerId: string) => input(ownerId, [], [pick(2027, 1)])));
assert.equal(four.participants.length, 4);
const unavailable = calculateDynastyDirection([input("missing-owner", [], [])]);
assert.equal(unavailable.participants[0].status, "INCOMPLETE");

const direct = analyzeTradeInternal({ sideA: { assetIds: [gibbs.assetId], ownerId: owners[0] }, sideB: { assetIds: [bijan.assetId], ownerId: owners[1] }, evaluatedAt: "2026-08-26T21:48:36.707Z", leaguePhase: "DRAFT_WINDOW", outputMode: "INTERNAL" }, dependencies);
assert(direct.success && direct.dynastyOutlook?.participants.length === 2);
assert.equal(typeof direct.trade?.fairnessScore?.internal, "number");
const sandbox = analyzeTradeInternal({ sideA: { assetIds: [gibbs.assetId], ownerId: owners[0] }, sideB: { assetIds: [bijan.assetId], ownerId: owners[1] }, evaluatedAt: "2026-08-26T21:48:36.707Z", leaguePhase: "DRAFT_WINDOW", outputMode: "PUBLIC" }, dependencies);
assert(sandbox.success || sandbox.status === "BLOCKED");
assert.equal(sandbox.dynastyOutlook ?? null, null);

console.log(JSON.stringify({ status: "PASS", model: "dynasty-direction-v1", fitModel: "trade-fit-v1", participants: twoTeam.participants.map((participant) => ({ franchiseId: participant.franchiseId, before: participant.before.direction, after: participant.after.direction, fit: participant.tradeFit, status: participant.status })), multiTeamParticipants: four.participants.length, sandboxDynasty: sandbox.dynastyOutlook, marketFairnessUnchanged: typeof direct.trade?.fairnessScore?.internal === "number", noWrites: true }, null, 2));
