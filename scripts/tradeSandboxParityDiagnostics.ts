import assert from "node:assert/strict";
import { createTradeAnalyzerPostHandler } from "../app/api/trade-analyzer/analyze/route.ts";
import { BestEffortRateLimiter } from "../lib/trade-analyzer/tradeAnalyzerRouteSupport.ts";
import { getTradeAnalyzerRuntime } from "../lib/trade-analyzer/tradeAnalyzerRuntime.ts";
import type { LccMemberSession } from "../lib/auth/types.ts";

process.env.NEXT_PUBLIC_APP_URL ??= "https://long-country-club-ffl.web.app";
const runtime = await getTradeAnalyzerRuntime();
assert.ok(runtime.sandboxCatalog);
const sandbox = runtime.sandboxCatalog;
type ApiBody = { ok?: boolean; data?: { model?: { fairnessModelVersion?: string }; multiTeam?: { modelVersion?: string } } };
const member = (): LccMemberSession => ({ identity: { uid: "diagnostic-uid", email: "diagnostic@example.invalid", name: "diagnostic", picture: null }, member: { memberId: "diagnostic", ownerId: "diagnostic", displayName: "diagnostic", teamName: "diagnostic", capabilities: [] } });
const handler = createTradeAnalyzerPostHandler({ loadRuntime: async () => runtime, getSession: async () => member(), featureEnabled: () => true, licenseApproved: () => true, limiter: new BestEffortRateLimiter(), now: () => new Date("2026-08-26T12:00:00.000Z") });
const request = (body: unknown) => handler(new Request("http://localhost/api/trade-analyzer/analyze", { method: "POST", headers: { "content-type": "application/json", origin: "https://long-country-club-ffl.web.app" }, body: JSON.stringify(body) }));
const result = async (body: unknown) => { const response = await request(body); return { response, body: JSON.parse(await response.text()) as ApiBody }; };
const id = (name: string) => { const asset = sandbox.assets.find((candidate) => candidate.displayName === name); assert.ok(asset, `missing Sandbox asset: ${name}`); return asset.assetId; };
const maye = id("Drake Maye");
const london = id("Drake London");
const lamar = id("Lamar Jackson");
const second = "sandbox-pick-2027-2";
const nonLcc = sandbox.assets.find((asset) => asset.assetType === "PLAYER" && !runtime.catalog.byAssetId[asset.assetId]);
assert.ok(nonLcc);
const rostered = maye;
const nonLcc2 = sandbox.assets.find((asset) => asset.assetType === "PLAYER" && !runtime.catalog.byAssetId[asset.assetId] && asset.assetId !== nonLcc.assetId);
assert.ok(nonLcc2);

const twoTeam = async (sideA: string[], sideB: string[]) => result({ sandbox: true, sideA: { assetIds: sideA }, sideB: { assetIds: sideB } });
const assertFairness = (item: { response: Response; body: ApiBody }, model: string) => { assert.equal(item.response.status, 200); assert.equal(item.body.ok, true); assert.equal(item.body.data?.model?.fairnessModelVersion, model); };
const rosteredVsRostered = await twoTeam([rostered], [lamar]);
assertFairness(rosteredVsRostered, "fairness-v1");
const nonLccVsRostered = await twoTeam([nonLcc.assetId], [rostered]);
assertFairness(nonLccVsRostered, "fairness-v1");
const nonLccVsNonLcc = await twoTeam([nonLcc.assetId], [nonLcc2.assetId]);
assertFairness(nonLccVsNonLcc, "fairness-v1");
const playerVsPick = await twoTeam([rostered], [second]);
assertFairness(playerVsPick, "fairness-v1");
const playerPickVsPlayerPick = await twoTeam([rostered, "sandbox-pick-2027-1"], [lamar, second]);
assertFairness(playerPickVsPlayerPick, "fairness-v1");
const ray = await twoTeam([maye, london], [lamar, second]);
assertFairness(ray, "fairness-v1");

for (const pickId of ["sandbox-pick-2027-1", "sandbox-pick-2027-2", "sandbox-pick-2027-3", "sandbox-pick-2028-1"]) assertFairness(await twoTeam([rostered], [pickId]), "fairness-v1");

const multi = async (assets: string[]) => {
  const participants = assets.map((assetId, index) => ({ franchiseId: `Team ${String.fromCharCode(65 + index)}`, outgoingAssets: [{ assetId, destinationFranchiseId: `Team ${String.fromCharCode(65 + ((index + 1) % assets.length))}` }] }));
  return result({ sandbox: true, participants });
};
const sandbox3 = await multi([rostered, nonLcc.assetId, second]);
assertFairness(sandbox3, "fairness-v1");
assert.equal(sandbox3.body.data?.multiTeam?.modelVersion, "fairness-multi-v1");
const sandbox4 = await multi([rostered, nonLcc.assetId, second, lamar]);
assertFairness(sandbox4, "fairness-v1");
assert.equal(sandbox4.body.data?.multiTeam?.modelVersion, "fairness-multi-v1");

const league2 = await result({ sideA: { assetIds: [maye] }, sideB: { assetIds: [lamar] }, validateOwnership: false });
assertFairness(league2, "fairness-v1");
const leagueAssets = [...new Map(runtime.catalog.assets.filter((asset) => asset.ownerId && asset.assetType === "PLAYER" && asset.valueStatus === "VALUED").map((asset) => [asset.ownerId, asset])).values()].slice(0, 4);
const leagueMulti = async (assets: typeof leagueAssets) => result({ participants: assets.map((asset, index) => ({ franchiseId: asset.ownerId, outgoingAssets: [{ assetId: asset.assetId, destinationFranchiseId: assets[(index + 1) % assets.length].ownerId }] })) });
const league3 = await leagueMulti(leagueAssets.slice(0, 3));
assertFairness(league3, "fairness-v1");
assert.equal(league3.body.data?.multiTeam?.modelVersion, "fairness-multi-v1");
const league4 = await leagueMulti(leagueAssets);
assertFairness(league4, "fairness-v1");
assert.equal(league4.body.data?.multiTeam?.modelVersion, "fairness-multi-v1");
const leagueRejectsSandboxId = await result({ sideA: { assetIds: [maye] }, sideB: { assetIds: [second] } });
assert.equal(leagueRejectsSandboxId.response.status, 400);

console.log(JSON.stringify({ status: "PASS", snapshotDate: runtime.snapshot.date, catalogs: { league: runtime.catalog.assets.length, sandbox: sandbox.assets.length }, nonLccPlayer: nonLcc.displayName, checks: { rosteredVsRostered: true, nonLccVsRostered: true, nonLccVsNonLcc: true, playerVsPick: true, playerPickVsPlayerPick: true, ray: true, genericPickMatrix: true, sandbox3: true, sandbox4: true, league2: true, league3: true, league4: true, leagueRejectsSandboxId: true } }, null, 2));
