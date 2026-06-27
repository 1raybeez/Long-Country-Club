export type HistoricalRecordScope = 'season' | 'career' | 'league';

export interface HistoricalRecordEntry {
  readonly season: number;
  readonly id: string;
  readonly scope: HistoricalRecordScope;
  readonly category: string;
  readonly label: string;
  readonly ownerId?: string | null;
  readonly managerName?: string | null;
  readonly value?: string | number | null;
  readonly source?: string | null;
  readonly notes?: readonly string[];
}
