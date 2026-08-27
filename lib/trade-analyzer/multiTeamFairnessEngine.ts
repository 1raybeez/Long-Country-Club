import type { Evidence, NormalizedAsset } from "./types";
import { MULTI_TEAM_MODEL_VERSION, type MultiTeamFairnessResult, type MultiTeamParticipantResult } from "./multiTeamTypes.ts";

const evidenceRank: Record<Evidence, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, INCOMPLETE: 3 };
const worstEvidence = (values: Evidence[]): Evidence => values.sort((a, b) => evidenceRank[b] - evidenceRank[a])[0] ?? "INCOMPLETE";
const band = (score: number): MultiTeamFairnessResult["fairnessBand"] => score >= 95 ? "VERY EVEN" : score >= 85 ? "FAIR" : score >= 70 ? "SLIGHT EDGE" : score >= 50 ? "CLEAR EDGE" : "LOPSIDED";
const valueOf = (asset: NormalizedAsset) => asset.baseValue ?? 0;

export function calculateMultiTeamFairness(participants: Array<{ franchiseId: string; sends: NormalizedAsset[]; receives: NormalizedAsset[] }>): MultiTeamFairnessResult {
  const errors: string[] = [];
  if (participants.length < 3 || participants.length > 4) errors.push("INVALID_PARTICIPANT_COUNT");
  const ids = participants.flatMap((participant) => participant.sends.map((asset) => asset.assetId));
  if (new Set(ids).size !== ids.length) errors.push("DUPLICATE_ASSET");
  const sendsTotal = participants.reduce((sum, participant) => sum + participant.sends.reduce((value, asset) => value + valueOf(asset), 0), 0);
  const receivesTotal = participants.reduce((sum, participant) => sum + participant.receives.reduce((value, asset) => value + valueOf(asset), 0), 0);
  if (sendsTotal <= 0 || receivesTotal <= 0) errors.push("ZERO_TOTAL_VALUE");
  const results: MultiTeamParticipantResult[] = participants.map((participant) => {
    const sendsValue = participant.sends.reduce((sum, asset) => sum + valueOf(asset), 0);
    const receivesValue = participant.receives.reduce((sum, asset) => sum + valueOf(asset), 0);
    const assets = [...participant.sends, ...participant.receives];
    const evidence = worstEvidence(assets.map((asset) => asset.evidence ?? "INCOMPLETE"));
    return { franchiseId: participant.franchiseId, sends: participant.sends, receives: participant.receives, sendsValue, receivesValue, netValueChange: receivesValue - sendsValue, receivedMarketShare: receivesTotal > 0 ? (receivesValue / receivesTotal) * 100 : null, sentAssetCount: participant.sends.length, receivedAssetCount: participant.receives.length, evidence, warnings: [...new Set(assets.flatMap((asset) => asset.warnings ?? []))] };
  });
  const evidence = worstEvidence(results.map((participant) => participant.evidence));
  const warnings = [...new Set(results.flatMap((participant) => participant.warnings))];
  const missingValue = results.some((participant) => [...participant.sends, ...participant.receives].some((asset) => asset.valueStatus === "UNVALUED" || asset.valueStatus === "UNSUPPORTED"));
  if (missingValue) errors.push("VALUE_UNAVAILABLE");
  const balancedTotal = sendsTotal + receivesTotal;
  const netAbs = results.reduce((sum, participant) => sum + Math.abs(participant.netValueChange), 0);
  const normalizedImbalance = balancedTotal > 0 ? netAbs / balancedTotal : 1;
  const fairnessScore = errors.length || missingValue ? null : Math.max(0, Math.min(100, 100 * (1 - normalizedImbalance)));
  const status = fairnessScore === null ? "SUPPRESSED" : evidence === "HIGH" ? "AUTHORITATIVE" : "PROVISIONAL";
  return { modelVersion: MULTI_TEAM_MODEL_VERSION, fairnessScore, fairnessBand: fairnessScore === null ? null : band(fairnessScore), evidence, status, participantCount: participants.length, totalTradedValue: sendsTotal, participants: results, warnings, errors: [...new Set(errors)] };
}
