export type HistoricalAwardType =
  | 'champion'
  | 'runnerUp'
  | 'thirdPlace'
  | 'toiletBowl'
  | 'weeklyHigh'
  | 'regularSeason'
  | 'custom';

export interface HistoricalAwardRecord {
  readonly season: number;
  readonly id: string;
  readonly type: HistoricalAwardType;
  readonly ownerId?: string | null;
  readonly managerName?: string | null;
  readonly week?: number | null;
  readonly label: string;
  readonly value?: string | number | null;
  readonly notes?: readonly string[];
}
