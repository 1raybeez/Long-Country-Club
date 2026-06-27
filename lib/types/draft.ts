export type DraftType = 'rookie' | 'veteran' | 'startup' | 'supplemental';

export interface DraftPickRecord {
  readonly season: number;
  readonly draftType: DraftType;
  readonly round: number | null;
  readonly pick: number | null;
  readonly overallPick: number | null;
  readonly ownerId?: string | null;
  readonly originalOwnerId?: string | null;
  readonly playerId?: string | null;
  readonly playerName?: string | null;
  readonly position?: string | null;
  readonly nflTeam?: string | null;
  readonly notes?: readonly string[];
}

export interface SeasonDraftData {
  readonly season: number;
  readonly draftType: DraftType;
  readonly sleeperDraftId?: string | null;
  readonly picks: readonly DraftPickRecord[];
  readonly notes: readonly string[];
}
