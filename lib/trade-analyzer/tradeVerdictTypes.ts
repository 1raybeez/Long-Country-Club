import type { DynastyParticipant } from "./dynastyDirectionTypes";
import type { RosterImpactParticipant } from "./rosterImpactTypes";

export const TRADE_VERDICT_MODEL_VERSION = "trade-verdict-v1" as const;
export type TradeVerdict = "STRONG STRATEGIC FIT" | "GOOD STRATEGIC FIT" | "MIXED FIT" | "QUESTIONABLE FIT" | "POOR STRATEGIC FIT" | "INSUFFICIENT EVIDENCE";
export type TradeType = "WIN-NOW MOVE" | "YOUTH MOVE" | "FUTURE-CAPITAL MOVE" | "CONSOLIDATION MOVE" | "DEPTH MOVE" | "BALANCED MOVE" | "RETOOLING MOVE" | "MIXED-DIRECTION MOVE";
export type TradeOffStatus = "IMPROVES" | "DECLINES" | "UNCHANGED" | "MIXED" | "UNAVAILABLE";

export type TradeVerdictInput = {
  franchiseId: string;
  franchiseName: string;
  market: { netValueChange: number; fairnessBand: string | null };
  rosterImpact?: RosterImpactParticipant | null;
  dynasty?: DynastyParticipant | null;
};

export type TradeVerdictParticipant = {
  franchiseId: string;
  franchiseName: string;
  verdict: TradeVerdict;
  tradeType: TradeType;
  explanation: string;
  tradeOffs: { marketValue: TradeOffStatus; currentLineup: TradeOffStatus; rosterDepth: TradeOffStatus; careerWindow: TradeOffStatus; futureCapital: TradeOffStatus; dynastyDirection: TradeOffStatus };
  evidenceStatus: "COMPLETE" | "PARTIAL" | "INCOMPLETE";
};

export type TradeVerdictResult = {
  modelVersion: typeof TRADE_VERDICT_MODEL_VERSION;
  summary: string;
  participants: TradeVerdictParticipant[];
  warnings: string[];
};
