export type IntelligenceStatus = "AVAILABLE" | "PARTIAL_SOURCE_COVERAGE" | "BLOCKED";

export type MarketTimingClassification =
  | "PRE_DRAFT"
  | "NEAR_DRAFT"
  | "POST_DRAFT_PRESEASON"
  | "UNAVAILABLE";

export type DraftPickMarketClassification = "REACH" | "FAIR_VALUE" | "VALUE" | null;

export type DraftPickIntelligence = {
  readonly actualOverallPick: number;
  readonly round: number;
  readonly pickInRound: number;
  readonly ownerId: string;
  readonly playerId: string;
  readonly playerName: string;
  readonly position: string;
  readonly nflTeam: string | null;
  readonly sourceReference: string;
  readonly marketRank: number | null;
  readonly marketExpectedPick: number | null;
  readonly pickDifference: number | null;
  readonly marketClassification: DraftPickMarketClassification;
  readonly marketEvidenceStatus: IntelligenceStatus;
  readonly nflDraftCapital: {
    readonly round: number | null;
    readonly overallPick: number | null;
    readonly source: string | null;
    readonly status: IntelligenceStatus;
  };
  readonly opportunityCost: {
    readonly topAvailableMarketPlayers: readonly string[];
    readonly bestAvailableMarketGap: number | null;
    readonly status: IntelligenceStatus;
  };
};

export type PositionRun = {
  readonly position: string;
  readonly startPick: number;
  readonly endPick: number;
  readonly playerNames: readonly string[];
  readonly ownerIds: readonly string[];
  readonly initiatingSelection: string;
  readonly detectionRule: string;
};

export type TeamDraftIntelligence = {
  readonly ownerId: string;
  readonly pickCount: number;
  readonly rounds: readonly number[];
  readonly positionsDrafted: Readonly<Record<string, number>>;
  readonly capitalContext: {
    readonly originallyAllocatedPicks: number;
    readonly acquiredPicks: number;
    readonly tradedAwayPicks: number;
    readonly selectionsMade: number;
    readonly status: IntelligenceStatus;
  };
  readonly preDraftRoster: null;
  readonly postDraftRoster: null;
  readonly rosterImpact: null;
  readonly grading: null;
};

export type DraftIntelligenceSnapshot = {
  readonly schemaVersion: 1;
  readonly methodologyVersion: "rookie-draft-intelligence-slice-a-v1";
  readonly status: IntelligenceStatus;
  readonly generatedAt: string;
  readonly season: 2026;
  readonly draftId: string;
  readonly draftDate: string;
  readonly evaluationCutoff: string;
  readonly dataFlow: readonly ["CANONICAL_DRAFT_DATA", "OWNER_MAPPING", "PLAYER_METADATA", "INTELLIGENCE_ENGINE"];
  readonly canonicalDraft: {
    readonly expectedPicks: number;
    readonly actualPicks: number;
    readonly uniqueOwners: number;
    readonly rounds: number;
    readonly verificationStatus: string;
    readonly sourceReference: string;
  };
  readonly format: {
    readonly teams: number;
    readonly dynasty: true;
    readonly quarterbackFormat: "1QB";
    readonly scoringContext: "NON_TEP";
    readonly lineupSlots: readonly string[];
    readonly rookieRounds: number;
    readonly sourceReferences: readonly string[];
  };
  readonly marketReference: {
    readonly source: string | null;
    readonly snapshotDate: string | null;
    readonly timingClassification: MarketTimingClassification;
    readonly daysFromDraft: number | null;
    readonly format: string | null;
    readonly playerCount: number;
    readonly resolvedPickCount: number;
    readonly tiersAvailable: false;
    readonly adpAvailable: boolean;
    readonly usableForDraftDayGrading: false;
    readonly reason: string;
  };
  readonly rosterEvidence: {
    readonly preDraft: { readonly coverage: number; readonly source: string | null; readonly confidence: "NONE" };
    readonly postDraft: { readonly coverage: number; readonly source: string | null; readonly confidence: "NONE" };
    readonly currentRosterExcluded: true;
    readonly reason: string;
  };
  readonly playerMetadata: {
    readonly resolvedPlayers: number;
    readonly totalPicks: number;
    readonly stableBirthDateCoverage: number;
    readonly sourceReference: string;
    readonly cutoffSafeForRoleOrTeamContext: false;
  };
  readonly picks: readonly DraftPickIntelligence[];
  readonly teams: readonly TeamDraftIntelligence[];
  readonly positionRuns: readonly PositionRun[];
  readonly tierRuns: { readonly status: "BLOCKED"; readonly reason: string };
  readonly historicalOwnerTendencies: Readonly<Record<string, unknown>>;
  readonly gradingArchitecture: {
    readonly status: "DESIGN_ONLY";
    readonly components: readonly string[];
    readonly recommendedWeights: Readonly<Record<string, number>>;
    readonly immediateImpactTreatment: string;
    readonly falsePrecisionTreatment: string;
    readonly humorGuardrail: "NO_FACT_NO_ROAST";
  };
  readonly sourceGaps: readonly string[];
};
