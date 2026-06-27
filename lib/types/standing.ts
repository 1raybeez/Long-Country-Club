export interface StandingRecord {
  readonly season: number;
  readonly rank: number | null;
  readonly ownerId?: string | null;
  readonly managerName?: string | null;
  readonly alias?: string | null;
  readonly wins?: number | null;
  readonly losses?: number | null;
  readonly ties?: number | null;
  readonly pointsFor?: number | null;
  readonly pointsAgainst?: number | null;
  readonly notes?: readonly string[];
}

export interface SeasonStandingData {
  readonly season: number;
  readonly source?: string | null;
  readonly standings: readonly StandingRecord[];
  readonly notes: readonly string[];
}
