export type FuturePickVerificationStatus = 'verified' | 'format-derived';

export interface FuturePickAsset {
  readonly id: string;
  readonly season: number;
  readonly round: number;
  readonly originalRosterId: number;
  readonly currentRosterId: number;
  readonly previousRosterId: number | null;
  readonly originalOwnerId: string;
  readonly currentOwnerId: string;
  readonly originalManagerName: string;
  readonly currentManagerName: string;
  readonly originalTeamName: string;
  readonly currentTeamName: string;
  readonly isTraded: boolean;
  readonly source: string;
  readonly sourceReference: string;
  readonly retrievedAt: string;
  readonly verificationStatus: FuturePickVerificationStatus;
}

export interface FuturePickInventory {
  readonly leagueId: string;
  readonly sourceLeagueSeason: number;
  readonly rosterCount: number;
  readonly rookieDraftRounds: number;
  readonly supportedFutureSeasons: readonly number[];
  readonly sourceProvenance: {
    readonly endpoint: string;
    readonly archiveDirectory: string;
    readonly retrievedAt: string;
    readonly notes: string;
  };
  readonly assets: readonly FuturePickAsset[];
}
