export type RuleStatus = 'active' | 'retired' | 'superseded' | 'unknown';

export interface RuleRecord {
  readonly season: number;
  readonly id: string;
  readonly title: string;
  readonly category?: string | null;
  readonly status: RuleStatus;
  readonly text?: string | null;
  readonly source?: string | null;
  readonly notes?: readonly string[];
}
