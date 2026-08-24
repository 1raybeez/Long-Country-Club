export type DraftType = 'keeper-veteran' | 'dynasty-startup' | 'rookie' | 'supplemental';
export type DraftEra = 'sleeper-keeper' | 'dynasty-transition-startup' | 'dynasty-rookie' | 'current-operational';
export type DraftVerificationStatus = 'full' | 'partial' | 'needs-verification';
export type DraftOrderType = 'snake' | 'linear' | 'custom';

export interface DraftTradedPickRecord {
  readonly season: number;
  readonly draftId: string;
  readonly round: number;
  readonly originalRosterId: number | null;
  readonly previousOwnerRosterId: number | null;
  readonly currentOwnerRosterId: number | null;
  readonly sourceReference: string;
}

export interface DraftPickRecord {
  readonly season: number;
  readonly draftId: string;
  readonly round: number | null;
  readonly pickInRound: number | null;
  readonly overallPick: number | null;
  readonly draftSlot: number | null;
  readonly rosterId: number | null;
  readonly sleeperUserId: string | null;
  readonly canonicalOwnerId: string | null;
  readonly ownerId?: string | null;
  readonly originalOwnerId?: string | null;
  readonly playerId: string | null;
  readonly playerName: string | null;
  readonly position: string | null;
  readonly nflTeam: string | null;
  readonly originalRosterId: number | null;
  readonly previousOwnerRosterId: number | null;
  readonly tradedPick: boolean | null;
  readonly historicalOwnershipReference?: string | null;
  readonly notes?: readonly string[];
  readonly sourceReference: string;
}

export interface DraftSourceProvenance {
  readonly rawSeasonDirectory: string;
  readonly rawDraftDirectory: string;
  readonly draftId: string;
  readonly retrievalTimestamp: string;
  readonly manifestReference: string;
  readonly knownAmbiguity: string | null;
}

export interface DraftEventData {
  readonly season: number;
  readonly draftId: string;
  readonly leagueId: string;
  readonly draftType: DraftType;
  readonly era: DraftEra;
  readonly status: string;
  readonly rounds: number;
  readonly pickCount: number;
  readonly draftOrderType: DraftOrderType;
  readonly startTime: number | null;
  readonly completionTime: number | null;
  readonly verificationStatus: DraftVerificationStatus;
  readonly sourceProvenance: DraftSourceProvenance;
  readonly draftOrder: Readonly<Record<string, number>>;
  readonly slotToRosterId: Readonly<Record<string, number>>;
  readonly tradedPicks: readonly DraftTradedPickRecord[];
  readonly picks: readonly DraftPickRecord[];
}

export interface SeasonDraftData {
  readonly season: number;
  readonly leagueId: string;
  readonly era: DraftEra;
  readonly drafts: readonly DraftEventData[];
  readonly historicalRosterOwnership?: readonly {
    readonly season: number;
    readonly rosterId: number;
    readonly canonicalOwnerId: string;
    readonly historicalTeamName: string;
    readonly provenance: string;
    readonly reason: string;
  }[];
}
