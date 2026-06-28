export type StandingEra = 'two-keeper' | 'dynasty';

export interface StandingRecord {
  readonly season: number;
  readonly finalPlace: number | null;
  readonly rank?: number | null;
  readonly era?: StandingEra | null;
  readonly ownerId?: string | null;
  readonly managerName?: string | null;
  readonly alias?: string | null;
  readonly wins?: number | null;
  readonly losses?: number | null;
  readonly ties?: number | null;
  readonly pointsFor?: number | null;
  readonly pointsAgainst?: number | null;
  readonly division?: string | null;
  readonly playoffSeed?: number | null;
  readonly playoffResult?: string | null;
  readonly notes?: readonly string[];
}

export interface SeasonStandingData {
  readonly season: number;
  readonly era?: StandingEra | null;
  readonly source?: string | null;
  readonly standings: readonly StandingRecord[];
  readonly notes: readonly string[];
}
