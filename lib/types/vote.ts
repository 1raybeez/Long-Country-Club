export type VoteOutcome = 'passed' | 'failed' | 'tabled' | 'unknown';

export interface VoteChoiceRecord {
  readonly label: string;
  readonly count: number | null;
}

export interface VoteRecord {
  readonly season: number;
  readonly id: string;
  readonly title: string;
  readonly question?: string | null;
  readonly outcome: VoteOutcome;
  readonly choices: readonly VoteChoiceRecord[];
  readonly source?: string | null;
  readonly notes?: readonly string[];
}
