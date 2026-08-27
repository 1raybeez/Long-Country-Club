import type { CurrentCatalogAsset } from "./types";

export const ROSTER_IMPACT_MODEL_VERSION = "roster-impact-v1" as const;

export type RosterImpactStatus = "COMPLETE" | "PARTIAL" | "INCOMPLETE";
export type RosterImpactChange = "IMPROVED" | "UNCHANGED" | "REDUCED";

export type RosterImpactParticipantInput = {
  franchiseId: string;
  franchiseName: string;
  sends: CurrentCatalogAsset[];
  receives: CurrentCatalogAsset[];
};

export type RosterImpactLineupPlayer = {
  playerId: string;
  name: string;
  position: string | null;
  slot: string;
};

export type RosterImpactPosition = {
  position: string;
  beforeCount: number;
  afterCount: number;
  beforeStrength: number | null;
  afterStrength: number | null;
  change: RosterImpactChange;
};

export type RosterImpactSide = {
  rosterPlayerIds: string[];
  rosterStrength: number | null;
  expectedLineupStrength: number | null;
  expectedLineup: RosterImpactLineupPlayer[];
  depth: Record<string, number>;
  projectedWeeklyPoints: number | null;
};

export type RosterImpactParticipant = {
  franchiseId: string;
  franchiseName: string;
  before: RosterImpactSide;
  after: RosterImpactSide;
  delta: {
    rosterStrength: number | null;
    expectedLineupStrength: number | null;
    projectedWeeklyPoints: number | null;
  };
  changes: {
    startersAdded: RosterImpactLineupPlayer[];
    startersRemoved: RosterImpactLineupPlayer[];
    lineupSlotChanges: Array<{ slot: string; before: string | null; after: string | null }>;
    positionalDepthChanges: RosterImpactPosition[];
  };
  status: RosterImpactStatus;
  warnings: string[];
};

export type RosterImpactResult = {
  modelVersion: typeof ROSTER_IMPACT_MODEL_VERSION;
  participants: RosterImpactParticipant[];
  warnings: string[];
  errors: string[];
};
