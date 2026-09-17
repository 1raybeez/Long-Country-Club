export type ArchiveSeasonStatus = "complete" | "partial" | "failed";

export interface SleeperArchiveUser {
  readonly user_id: string;
  readonly display_name?: string;
  readonly avatar?: string | null;
  readonly metadata?: { readonly team_name?: string } | null;
}

export interface SleeperArchiveRosterSettings {
  readonly wins?: number;
  readonly losses?: number;
  readonly ties?: number;
  readonly fpts?: number;
  readonly fpts_decimal?: number;
  readonly ppts?: number;
  readonly ppts_decimal?: number;
}

export interface SleeperArchiveRoster {
  readonly roster_id: number;
  readonly owner_id?: string | null;
  readonly settings?: SleeperArchiveRosterSettings | null;
}

export interface ArchiveOwnerAggregate {
  readonly id: string;
  readonly realName: string;
  readonly teamName: string;
  readonly avatar: string | null;
  readonly wins: number;
  readonly losses: number;
  readonly ties: number;
  readonly fpts: number;
  readonly ppts: number;
  readonly seasons: number;
}

export interface ArchiveSeasonRecord {
  readonly id: string;
  readonly realName: string;
  readonly teamName: string;
  readonly avatar: string | null;
  readonly year: number;
  readonly fpts: number;
}

export interface ArchiveLeaderEntry {
  readonly id: string;
  readonly realName: string;
  readonly teamName: string;
  readonly avatar: string | null;
  readonly year?: number;
  readonly value: number;
  readonly displayValue: string;
  readonly label: string;
}

export interface ArchiveSeasonResult {
  readonly season: number;
  readonly leagueId: string;
  readonly status: ArchiveSeasonStatus;
  readonly aggregates: readonly ArchiveOwnerAggregate[];
  readonly seasonRecords: readonly ArchiveSeasonRecord[];
  readonly totalRosters: number;
  readonly attributedRosters: number;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

export interface ArchiveCoverage {
  readonly expectedSeasons: readonly number[];
  readonly seasons: readonly ArchiveSeasonResult[];
  readonly aggregates: readonly ArchiveOwnerAggregate[];
  readonly seasonRecords: readonly ArchiveSeasonRecord[];
  readonly hasUsableData: boolean;
}
