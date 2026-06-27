export interface KeeperRecord {
  readonly season: number;
  readonly ownerId?: string | null;
  readonly managerName?: string | null;
  readonly playerId?: string | null;
  readonly playerName?: string | null;
  readonly position?: string | null;
  readonly nflTeam?: string | null;
  readonly keeperCost?: string | null;
  readonly notes?: readonly string[];
}

export interface SeasonKeeperData {
  readonly season: number;
  readonly keepers: readonly KeeperRecord[];
  readonly notes: readonly string[];
}
