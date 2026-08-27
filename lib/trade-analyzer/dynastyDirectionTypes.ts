import type { RosterImpactChange } from "./rosterImpactTypes";

export const DYNASTY_DIRECTION_MODEL_VERSION = "dynasty-direction-v1" as const;
export const TRADE_FIT_MODEL_VERSION = "trade-fit-v1" as const;
export type DynastyDirection = "CONTENDER" | "PLAYOFF PUSH" | "BALANCED" | "RETOOLING" | "REBUILDING" | "UNCLEAR";
export type DynastyConfidence = "HIGH" | "MEDIUM" | "LOW";
export type TradeFit = "STRONG FIT" | "FIT" | "MIXED" | "POOR FIT" | "INSUFFICIENT EVIDENCE";

export type DynastyDimension = { value: number | null; available: boolean; detail: string };
export type DynastyProfile = {
  direction: DynastyDirection;
  confidence: DynastyConfidence;
  immediateStrength: DynastyDimension;
  rosterStrengthDimension: DynastyDimension;
  ageCareerWindow: DynastyDimension;
  futureCapital: DynastyDimension;
  assetDistribution: DynastyDimension;
  rosterValue: number | null;
  starterAge: number | null;
  youngerCoreShare: number | null;
  veteranCoreShare: number | null;
  futurePickCount: number | null;
  futurePickValue: number | null;
  warnings: string[];
};
export type DynastyParticipant = {
  franchiseId: string;
  franchiseName: string;
  before: DynastyProfile;
  after: DynastyProfile;
  directionChanged: boolean;
  tradeFit: TradeFit;
  fitReasons: string[];
  changes: { rosterStrength: RosterImpactChange | "UNAVAILABLE"; lineupStrength: RosterImpactChange | "UNAVAILABLE"; age: "YOUNGER" | "OLDER" | "UNCHANGED" | "UNAVAILABLE"; futureCapital: "INCREASED" | "DECREASED" | "UNCHANGED" | "UNAVAILABLE"; rosterValue: "INCREASED" | "DECREASED" | "UNCHANGED" | "UNAVAILABLE" };
  status: "COMPLETE" | "PARTIAL" | "INCOMPLETE";
  warnings: string[];
  presentation: DynastyPresentation;
};
export type DynastyPresentation = {
  winNow: string;
  careerWindow: { label: string; detail: string };
  futureCapital: { label: string; detail: string; addedPicks: string[]; removedPicks: string[] };
  assetProfile: { label: string; detail: string };
  direction: string;
  fitExplanation: string;
};
export type DynastyDirectionResult = { directionModelVersion: typeof DYNASTY_DIRECTION_MODEL_VERSION; tradeFitModelVersion: typeof TRADE_FIT_MODEL_VERSION; participants: DynastyParticipant[]; warnings: string[]; errors: string[] };
