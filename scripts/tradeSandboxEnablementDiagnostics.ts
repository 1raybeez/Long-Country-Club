import assert from "node:assert/strict";
import { isSandboxTradeValid, type SandboxParticipantState } from "../lib/trade-analyzer/sandboxValidation.ts";

const catalog = new Set(["player-a", "player-b", "player-c", "player-d", "sandbox-pick-2027-2", "a", "b", "c"]);
const state = (a: string[], b: string[], destinations: Record<string, string> = {}): SandboxParticipantState[] => [{ assets: a, destinations: {} }, { assets: b, destinations }];
const three = (destinations: Record<string, string> = { a: "Team B", b: "Team A", c: "Team A" }): SandboxParticipantState[] => [{ assets: ["a"], destinations: { a: destinations.a } }, { assets: ["b"], destinations: { b: destinations.b } }, { assets: ["c"], destinations: { c: destinations.c } }];

for (const participants of [state(["player-a"], ["player-b"]), state(["player-a", "player-c"], ["player-b", "player-d"]), state(["player-a"], ["sandbox-pick-2027-2"]), state(["player-a", "sandbox-pick-2027-2"], ["player-b", "player-c"])]) assert.equal(isSandboxTradeValid(participants, catalog), true);
assert.equal(isSandboxTradeValid(state([], ["player-b"]), catalog), false);
assert.equal(isSandboxTradeValid(state(["player-a"], []), catalog), false);
assert.equal(isSandboxTradeValid(state(["player-a"], ["player-a"]), catalog), false);
assert.equal(isSandboxTradeValid(state(["unknown"], ["player-b"]), catalog), false);
assert.equal(isSandboxTradeValid(three(), catalog), true);
assert.equal(isSandboxTradeValid(three({ a: "", b: "Team A", c: "Team A" }), catalog), false);
assert.equal(isSandboxTradeValid(three({ a: "Team A", b: "Team A", c: "Team A" }), catalog), false);
assert.equal(isSandboxTradeValid([{ assets: ["a"], destinations: { a: "Team E" } }, { assets: ["b"], destinations: { b: "Team A" } }, { assets: ["c"], destinations: { c: "Team A" } }], catalog), false);
assert.equal(isSandboxTradeValid([{ assets: ["a"], destinations: { a: "Team B" } }, { assets: ["b"], destinations: { b: "Team A" } }, { assets: [], destinations: {} }], catalog), false);
assert.equal(isSandboxTradeValid([{ assets: ["a"], destinations: { a: "Team B" } }, { assets: ["b"], destinations: { b: "Team A" } }, { assets: ["c"], destinations: { c: "Team A" } }, { assets: ["c"], destinations: { c: "Team A" } }], catalog), false);

console.log(JSON.stringify({ status: "PASS", twoTeamPasses: 4, twoTeamDenials: 4, threeTeamRoutingPass: true, multiTeamDenials: 5, teamLabels: ["Team A", "Team B", "Team C", "Team D"] }, null, 2));
