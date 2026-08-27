import { getExpectedLineupForRoster } from "../history/expectedLineup.ts";
import { getPlayerById } from "../history/playerRegistry.ts";
import { getCurrentRosterSnapshot, type HistoricalRosterSnapshot } from "../history/rosterSnapshots.ts";
import { getProjectedTeamForLineup } from "../history/matchupProjection.ts";
import { getRosterStrengthForRoster } from "../history/rosterStrength.ts";
import type { CurrentCatalogAsset } from "./types.ts";
import { DYNASTY_DIRECTION_MODEL_VERSION, TRADE_FIT_MODEL_VERSION, type DynastyConfidence, type DynastyDirection, type DynastyDimension, type DynastyParticipant, type DynastyProfile, type DynastyDirectionResult, type TradeFit } from "./dynastyDirectionTypes.ts";

const playerTypes = new Set(["PLAYER", "K", "DST"]);
const round = (value: number) => Number(value.toFixed(2));

export type DynastyDirectionInput = { franchiseId: string; franchiseName: string; currentAssets: CurrentCatalogAsset[]; sends: CurrentCatalogAsset[]; receives: CurrentCatalogAsset[] };

export function calculateDynastyDirection(inputs: readonly DynastyDirectionInput[]): DynastyDirectionResult {
  const participants = inputs.map((input) => {
    try { return analyzeParticipant(input); } catch { return incomplete(input, ["DYNASTY_PROFILE_UNAVAILABLE"]); }
  });
  return { directionModelVersion: DYNASTY_DIRECTION_MODEL_VERSION, tradeFitModelVersion: TRADE_FIT_MODEL_VERSION, participants, warnings: participants.flatMap((participant) => participant.warnings), errors: participants.filter((participant) => participant.status === "INCOMPLETE").flatMap((participant) => participant.warnings) };
}

export function classifyDynastyDirection(input: { lineupStrength: number | null; rosterStrength: number | null; starterAge: number | null; youngerCoreShare: number | null; futurePickValue: number | null }): DynastyDirection {
  if (input.lineupStrength === null || input.rosterStrength === null) return "UNCLEAR";
  if (input.lineupStrength >= 110 && input.rosterStrength >= 100) return "CONTENDER";
  if (input.lineupStrength >= 95 && input.rosterStrength >= 85) return "PLAYOFF PUSH";
  if (input.lineupStrength < 95 && (input.futurePickValue ?? 0) >= 2500 && (input.youngerCoreShare ?? 0) >= 0.35) return "REBUILDING";
  if (input.starterAge !== null && input.starterAge >= 29 && input.lineupStrength >= 90) return "RETOOLING";
  return "BALANCED";
}

function analyzeParticipant(input: DynastyDirectionInput): DynastyParticipant {
  const current = getCurrentRosterSnapshot(input.franchiseId);
  if (!current) return incomplete(input, ["CURRENT_ROSTER_UNAVAILABLE"]);
  const before = profile(current, input.currentAssets);
  const after = profile(transform(current, input.sends, input.receives), input.currentAssets.filter((asset) => !isPlayerOrPick(input.sends, asset)).concat(input.receives));
  const changes = compareProfiles(before, after);
  const status: DynastyParticipant["status"] = [...before.warnings, ...after.warnings].length ? "PARTIAL" : "COMPLETE";
  const fit = tradeFit(before, after, changes);
  return { franchiseId: input.franchiseId, franchiseName: input.franchiseName, before, after, directionChanged: before.direction !== after.direction, tradeFit: fit.fit, fitReasons: fit.reasons, changes, status, warnings: [...new Set([...before.warnings, ...after.warnings])] };
}

function profile(snapshot: HistoricalRosterSnapshot, assets: CurrentCatalogAsset[]): DynastyProfile {
  const lineup = getExpectedLineupForRoster({ ownerId: snapshot.ownerId ?? "hypothetical", rosterSnapshot: snapshot });
  const strength = getRosterStrengthForRoster({ ownerId: snapshot.ownerId ?? "hypothetical", rosterSnapshot: snapshot });
  const projection = getProjectedTeamForLineup(lineup);
  const rosterStrength = round(strength.positions.reduce((sum, group) => sum + group.topNBaselineAverageTotal, 0));
  const lineupStrength = projection.complete && projection.projectedScore !== null ? round(projection.projectedScore) : null;
  const rosterAssets = assets.filter((asset) => snapshot.playerIds.includes(asset.assetId) || asset.assetType === "PICK");
  const ages = snapshot.playerIds.map((id) => getPlayerById(id)?.age ?? null).filter((age): age is number => age !== null);
  const starterAges = lineup.selectedPlayers.map((player) => getPlayerById(player.playerId)?.age ?? null).filter((age): age is number => age !== null);
  const valued = rosterAssets.filter((asset) => typeof asset.baseValue === "number");
  const core = valued.filter((asset) => (asset.baseValue ?? 0) >= 500);
  const younger = core.filter((asset) => { const age = getPlayerById(asset.assetId)?.age; return age !== undefined && age !== null && age < 25; }).length;
  const veterans = core.filter((asset) => { const age = getPlayerById(asset.assetId)?.age; return age !== undefined && age !== null && age >= 29; }).length;
  const picks = rosterAssets.filter((asset) => asset.assetType === "PICK");
  const warnings = [...new Set([...strength.unresolvedPlayerIds.map(() => "PLAYER_DATA_UNAVAILABLE"), ...(ages.length ? [] : ["AGE_DATA_UNAVAILABLE"]), ...(picks.length ? [] : ["FUTURE_PICK_DATA_UNAVAILABLE"]), ...(projection.complete ? [] : ["WEEKLY_PROJECTION_UNAVAILABLE"])])];
  const ageValue = starterAges.length ? round(starterAges.reduce((sum, age) => sum + age, 0) / starterAges.length) : null;
  const futurePickValue = picks.every((pick) => typeof pick.baseValue === "number") ? round(picks.reduce((sum, pick) => sum + (pick.baseValue ?? 0), 0)) : null;
  const profileInput = { lineupStrength, rosterStrength, starterAge: ageValue, youngerCoreShare: core.length ? younger / core.length : null, futurePickValue };
  const direction = classifyDynastyDirection(profileInput);
  const confidence: DynastyConfidence = warnings.length === 0 ? "HIGH" : warnings.length <= 2 ? "MEDIUM" : "LOW";
  return { direction, confidence, immediateStrength: dimension(lineupStrength, lineupStrength !== null, lineupStrength === null ? "Expected lineup strength unavailable." : `Expected lineup strength ${lineupStrength.toFixed(2)}.`), rosterStrengthDimension: dimension(rosterStrength, rosterStrength !== null, rosterStrength === null ? "Overall roster strength unavailable." : `Overall roster strength ${rosterStrength.toFixed(2)}.`), ageCareerWindow: dimension(ageValue, ageValue !== null, ageValue === null ? "Starter age unavailable." : `Expected starters average ${ageValue.toFixed(1)} years.`), futureCapital: dimension(futurePickValue, futurePickValue !== null, futurePickValue === null ? "Future-pick value unavailable." : `${picks.length} future picks worth ${futurePickValue.toFixed(0)} market-value points.`), assetDistribution: dimension(core.length ? younger / core.length : null, core.length > 0, core.length ? `${younger} younger and ${veterans} veteran core assets among ${core.length} valued assets.` : "Core asset-age distribution unavailable."), rosterValue: valued.length ? round(valued.reduce((sum, asset) => sum + (asset.baseValue ?? 0), 0)) : null, starterAge: ageValue, youngerCoreShare: core.length ? round(younger / core.length) : null, veteranCoreShare: core.length ? round(veterans / core.length) : null, futurePickCount: picks.length, futurePickValue, warnings };
}

function dimension(value: number | null, available: boolean, detail: string): DynastyDimension { return { value, available, detail }; }
function transform(snapshot: HistoricalRosterSnapshot, sends: CurrentCatalogAsset[], receives: CurrentCatalogAsset[]): HistoricalRosterSnapshot { const sent = sends.filter((asset) => playerTypes.has(asset.assetType)).map((asset) => asset.assetId); const received = receives.filter((asset) => playerTypes.has(asset.assetType)).map((asset) => asset.assetId); const playerIds = [...new Set(snapshot.playerIds.filter((id) => !sent.includes(id)).concat(received))]; return { ...snapshot, playerIds, starterIds: snapshot.starterIds.filter((id) => playerIds.includes(id)), nonstarterIds: playerIds.filter((id) => !snapshot.starterIds.includes(id)), reserveIds: snapshot.reserveIds?.filter((id) => playerIds.includes(id)) ?? null, taxiIds: snapshot.taxiIds?.filter((id) => playerIds.includes(id)) ?? null, actualWeeklyLineupAvailable: false }; }
function isPlayerOrPick(sends: CurrentCatalogAsset[], asset: CurrentCatalogAsset) { return sends.some((sent) => sent.assetId === asset.assetId); }
function compareProfiles(before: DynastyProfile, after: DynastyProfile): DynastyParticipant["changes"] { return { rosterStrength: direction(before.rosterStrengthDimension.value, after.rosterStrengthDimension.value), lineupStrength: direction(before.immediateStrength.value, after.immediateStrength.value), age: before.starterAge === null || after.starterAge === null ? "UNAVAILABLE" : after.starterAge < before.starterAge ? "YOUNGER" : after.starterAge > before.starterAge ? "OLDER" : "UNCHANGED", futureCapital: before.futurePickValue === null || after.futurePickValue === null ? "UNAVAILABLE" : after.futurePickValue > before.futurePickValue ? "INCREASED" : after.futurePickValue < before.futurePickValue ? "DECREASED" : "UNCHANGED", rosterValue: before.rosterValue === null || after.rosterValue === null ? "UNAVAILABLE" : after.rosterValue > before.rosterValue ? "INCREASED" : after.rosterValue < before.rosterValue ? "DECREASED" : "UNCHANGED" }; }
function direction(before: number | null, after: number | null) { return before === null || after === null ? "UNAVAILABLE" as const : after > before ? "IMPROVED" as const : after < before ? "REDUCED" as const : "UNCHANGED" as const; }
function tradeFit(before: DynastyProfile, after: DynastyProfile, changes: DynastyParticipant["changes"]): { fit: TradeFit; reasons: string[] } { if (before.direction === "UNCLEAR") return { fit: "INSUFFICIENT EVIDENCE", reasons: ["Before-trade direction is unclear."] }; const lineup = after.immediateStrength.value === null || before.immediateStrength.value === null ? null : after.immediateStrength.value - before.immediateStrength.value; const longTerm = changes.age === "YOUNGER" || changes.futureCapital === "INCREASED" || changes.rosterValue === "INCREASED"; if (before.direction === "CONTENDER" || before.direction === "PLAYOFF PUSH") { if (lineup !== null && lineup > 0 && longTerm) return { fit: "STRONG FIT", reasons: ["Expected lineup strength improves.", "Long-term asset indicators also improve."] }; if (lineup !== null && lineup > 0) return { fit: "FIT", reasons: ["Expected lineup strength improves."] }; if (lineup !== null && lineup < -8) return { fit: "POOR FIT", reasons: ["Expected lineup strength declines substantially."] }; return { fit: "MIXED", reasons: ["Immediate lineup and long-term indicators are mixed."] }; } if (before.direction === "REBUILDING") { if (longTerm && (changes.age === "YOUNGER" || changes.futureCapital === "INCREASED")) return { fit: "STRONG FIT", reasons: ["The roster becomes younger or gains future capital."] }; if (longTerm) return { fit: "FIT", reasons: ["Long-term asset indicators improve."] }; if (lineup !== null && lineup < 0) return { fit: "POOR FIT", reasons: ["Immediate lineup strength declines without a measured long-term gain."] }; return { fit: "MIXED", reasons: ["The measured direction signals are mixed."] }; } return { fit: longTerm && (lineup === null || lineup >= 0) ? "FIT" : lineup !== null && lineup < 0 ? "MIXED" : "INSUFFICIENT EVIDENCE", reasons: [longTerm ? "Long-term asset indicators improve." : "No clear long-term improvement is measured."] }; }
function incomplete(input: DynastyDirectionInput, warnings: string[]): DynastyParticipant { const empty = (): DynastyProfile => ({ direction: "UNCLEAR", confidence: "LOW", immediateStrength: dimension(null, false, "Unavailable."), rosterStrengthDimension: dimension(null, false, "Unavailable."), ageCareerWindow: dimension(null, false, "Unavailable."), futureCapital: dimension(null, false, "Unavailable."), assetDistribution: dimension(null, false, "Unavailable."), rosterValue: null, starterAge: null, youngerCoreShare: null, veteranCoreShare: null, futurePickCount: null, futurePickValue: null, warnings }); return { franchiseId: input.franchiseId, franchiseName: input.franchiseName, before: empty(), after: empty(), directionChanged: false, tradeFit: "INSUFFICIENT EVIDENCE", fitReasons: ["Insufficient evidence to determine dynasty direction."], changes: { rosterStrength: "UNAVAILABLE", lineupStrength: "UNAVAILABLE", age: "UNAVAILABLE", futureCapital: "UNAVAILABLE", rosterValue: "UNAVAILABLE" }, status: "INCOMPLETE", warnings }; }
