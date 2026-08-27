import type { Evidence, NormalizedAsset } from "./types";

export const MULTI_TEAM_MODEL_VERSION = "fairness-multi-v1" as const;

export interface MultiTeamOutgoingAsset {
  assetId: string;
  destinationFranchiseId: string;
}

export interface MultiTeamParticipantInput {
  franchiseId: string;
  outgoingAssets: MultiTeamOutgoingAsset[];
}

export interface MultiTeamTradeRequest {
  participants: MultiTeamParticipantInput[];
}

export interface MultiTeamParticipantResult {
  franchiseId: string;
  sends: NormalizedAsset[];
  receives: NormalizedAsset[];
  sendsValue: number;
  receivesValue: number;
  netValueChange: number;
  receivedMarketShare: number | null;
  sentAssetCount: number;
  receivedAssetCount: number;
  evidence: Evidence;
  warnings: string[];
}

export interface MultiTeamFairnessResult {
  modelVersion: typeof MULTI_TEAM_MODEL_VERSION;
  fairnessScore: number | null;
  fairnessBand: "VERY EVEN" | "FAIR" | "SLIGHT EDGE" | "CLEAR EDGE" | "LOPSIDED" | null;
  evidence: Evidence;
  status: "AUTHORITATIVE" | "PROVISIONAL" | "SUPPRESSED";
  participantCount: number;
  totalTradedValue: number;
  participants: MultiTeamParticipantResult[];
  warnings: string[];
  errors: string[];
}
