import { getExpectedLineupForRoster, type ExpectedLineup } from "../history/expectedLineup.ts";
import { getProjectedTeamForLineup } from "../history/matchupProjection.ts";
import { getPlayerById } from "../history/playerRegistry.ts";
import { getCurrentRosterSnapshot, type HistoricalRosterSnapshot } from "../history/rosterSnapshots.ts";
import { getRosterStrengthForRoster, type RosterStrength } from "../history/rosterStrength.ts";
import type { CurrentCatalogAsset } from "./types.ts";
import { ROSTER_IMPACT_MODEL_VERSION, type RosterImpactParticipantInput, type RosterImpactPosition, type RosterImpactResult, type RosterImpactSide } from "./rosterImpactTypes.ts";

const PLAYER_TYPES = new Set(["PLAYER", "K", "DST"]);
const positions = ["QB", "RB", "WR", "TE", "FLEX", "K", "DST"] as const;

export function calculateRosterImpact(inputs: readonly RosterImpactParticipantInput[]): RosterImpactResult {
  const participants = inputs.map((input) => {
    try {
      return analyzeParticipant(input);
    } catch {
      return incomplete(input, ["EXPECTED_LINEUP_UNAVAILABLE"]);
    }
  });
  return {
    modelVersion: ROSTER_IMPACT_MODEL_VERSION,
    participants,
    warnings: participants.flatMap((participant) => participant.warnings),
    errors: participants.flatMap((participant) => participant.status === "INCOMPLETE" ? participant.warnings : []),
  };
}

function analyzeParticipant(input: RosterImpactParticipantInput) {
  const current = getCurrentRosterSnapshot(input.franchiseId);
  const warnings: string[] = [];
  if (!current) {
    return incomplete(input, ["CURRENT_ROSTER_UNAVAILABLE"]);
  }
  const sentPlayers = input.sends.filter(isRosterAsset).map((asset) => asset.assetId);
  const receivedPlayers = input.receives.filter(isRosterAsset).map((asset) => asset.assetId);
  const before = evaluate(current);
  const afterSnapshot = transformSnapshot(current, sentPlayers, receivedPlayers);
  const after = evaluate(afterSnapshot);
  if (input.sends.some((asset) => isRosterAsset(asset) && !current.playerIds.includes(asset.assetId))) warnings.push("SENT_ASSET_NOT_ON_CURRENT_ROSTER");
  if (input.receives.some((asset) => isRosterAsset(asset) && !getPlayerById(asset.assetId))) warnings.push("RECEIVED_PLAYER_UNRESOLVED");
  const lineupSlotChanges = before.lineup.slots.map((slot) => ({ slot: slot.slot, before: slot.player?.playerId ?? null, after: after.lineup.slots.find((candidate) => candidate.slot === slot.slot)?.player?.playerId ?? null })).filter((change) => change.before !== change.after);
  const startersAdded = after.lineup.selectedPlayers.filter((player) => !before.lineup.selectedPlayers.some((candidate) => candidate.playerId === player.playerId)).map((player) => lineupPlayer(player.playerId, player.metadata?.name ?? `Player ${player.playerId}`, player.position, slotFor(after.lineup, player.playerId)));
  const startersRemoved = before.lineup.selectedPlayers.filter((player) => !after.lineup.selectedPlayers.some((candidate) => candidate.playerId === player.playerId)).map((player) => lineupPlayer(player.playerId, player.metadata?.name ?? `Player ${player.playerId}`, player.position, slotFor(before.lineup, player.playerId)));
  const positionalDepthChanges = positions.map((position) => positionImpact(before.strength, after.strength, before.lineup, after.lineup, position));
  const status: "PARTIAL" | "COMPLETE" = before.lineup.coverage.category === "none" || after.lineup.coverage.category === "none" || before.strength.unresolvedPlayerIds.length > 0 || after.strength.unresolvedPlayerIds.length > 0 ? "PARTIAL" : "COMPLETE";
  return { franchiseId: input.franchiseId, franchiseName: input.franchiseName, before: side(before), after: side(after), delta: { rosterStrength: delta(before.rosterStrength, after.rosterStrength), expectedLineupStrength: delta(before.projectedPoints, after.projectedPoints), projectedWeeklyPoints: delta(before.projectedPoints, after.projectedPoints) }, changes: { startersAdded, startersRemoved, lineupSlotChanges, positionalDepthChanges }, status, warnings };
}

function evaluate(snapshot: HistoricalRosterSnapshot) {
  const lineup = getExpectedLineupForRoster({ ownerId: snapshot.ownerId ?? "hypothetical", rosterSnapshot: snapshot });
  const strength = getRosterStrengthForRoster({ ownerId: snapshot.ownerId ?? "hypothetical", rosterSnapshot: snapshot });
  const projection = getProjectedTeamForLineup(lineup);
  const rosterStrength = round(strength.positions.reduce((sum, group) => sum + group.topNBaselineAverageTotal, 0));
  return { lineup, strength, projectedPoints: projection.complete ? projection.projectedScore : null, rosterStrength };
}

function side(value: ReturnType<typeof evaluate>): RosterImpactSide {
  return { rosterStrength: value.rosterStrength, expectedLineupStrength: value.projectedPoints, expectedLineup: value.lineup.selectedPlayers.map((player) => lineupPlayer(player.playerId, player.metadata?.name ?? `Player ${player.playerId}`, player.position, slotFor(value.lineup, player.playerId))), depth: Object.fromEntries(value.strength.positions.map((group) => [group.position, group.playerCount])), projectedWeeklyPoints: value.projectedPoints };
}

function transformSnapshot(snapshot: HistoricalRosterSnapshot, sends: string[], receives: string[]): HistoricalRosterSnapshot {
  const playerIds = [...new Set(snapshot.playerIds.filter((id) => !sends.includes(id)).concat(receives))];
  const starterIds = snapshot.starterIds.filter((id) => playerIds.includes(id));
  return { ...snapshot, playerIds, starterIds, nonstarterIds: playerIds.filter((id) => !starterIds.includes(id)), reserveIds: snapshot.reserveIds?.filter((id) => playerIds.includes(id)) ?? null, taxiIds: snapshot.taxiIds?.filter((id) => playerIds.includes(id)) ?? null, actualWeeklyLineupAvailable: false };
}

function positionImpact(before: RosterStrength, after: RosterStrength, beforeLineup: ExpectedLineup, afterLineup: ExpectedLineup, position: string): RosterImpactPosition {
  if (position === "FLEX") {
    const beforePlayers = beforeLineup.slots.filter((slot) => slot.slotType === "FLEX" && slot.player);
    const afterPlayers = afterLineup.slots.filter((slot) => slot.slotType === "FLEX" && slot.player);
    const beforeStrength = round(beforePlayers.reduce((sum, slot) => sum + (slot.player?.baselineAverage ?? 0), 0));
    const afterStrength = round(afterPlayers.reduce((sum, slot) => sum + (slot.player?.baselineAverage ?? 0), 0));
    return { position, beforeCount: beforePlayers.length, afterCount: afterPlayers.length, beforeStrength, afterStrength, change: compare(afterStrength, beforeStrength) };
  }
  const beforeGroup = before.positions.find((group) => group.position === position);
  const afterGroup = after.positions.find((group) => group.position === position);
  const beforeStrength = beforeGroup?.topNBaselineAverageTotal ?? null;
  const afterStrength = afterGroup?.topNBaselineAverageTotal ?? null;
  return { position, beforeCount: beforeGroup?.playerCount ?? 0, afterCount: afterGroup?.playerCount ?? 0, beforeStrength, afterStrength, change: compare(afterStrength, beforeStrength) };
}

function compare(after: number | null, before: number | null) { return after === null || before === null || after === before ? "UNCHANGED" : after > before ? "IMPROVED" : "REDUCED"; }
function delta(before: number | null, after: number | null) { return before === null || after === null ? null : round(after - before); }
function round(value: number) { return Number(value.toFixed(2)); }
function isRosterAsset(asset: CurrentCatalogAsset) { return PLAYER_TYPES.has(asset.assetType); }
function slotFor(lineup: ExpectedLineup, playerId: string) { return lineup.slots.find((slot) => slot.player?.playerId === playerId)?.slot ?? ""; }
function lineupPlayer(playerId: string, name: string, position: string | null, slot: string) { return { playerId, name, position, slot }; }
function incomplete(input: RosterImpactParticipantInput, warnings: string[]) { return { franchiseId: input.franchiseId, franchiseName: input.franchiseName, before: emptySide(), after: emptySide(), delta: { rosterStrength: null, expectedLineupStrength: null, projectedWeeklyPoints: null }, changes: { startersAdded: [], startersRemoved: [], lineupSlotChanges: [], positionalDepthChanges: [] }, status: "INCOMPLETE" as const, warnings }; }
function emptySide(): RosterImpactSide { return { rosterStrength: null, expectedLineupStrength: null, expectedLineup: [], depth: {}, projectedWeeklyPoints: null }; }
