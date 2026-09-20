export type PostseasonBracketType = "winners" | "losers" | "placement" | "unknown";
export type PostseasonSourceStatus = "complete" | "unresolved" | "unavailable";

export interface PostseasonContext {
  readonly season: number;
  readonly activeWeek: number | null;
  readonly playoffWeekStart: number;
  readonly roundNumber: number;
  readonly roundLabel: string;
  readonly bracketType: PostseasonBracketType;
  readonly seed: number | null;
  readonly rosterId: number | null;
  readonly ownerId: string | null;
  readonly opponentRosterId: number | null;
  readonly opponentOwnerId: string | null;
  readonly matchupId: number | null;
  readonly isBye: boolean;
  readonly isChampionship: boolean;
  readonly isSemifinal: boolean;
  readonly isPlacementGame: boolean;
  readonly placementTarget: "championship" | "third-place" | "fifth-place" | null;
  readonly nextMatchupId: number | null;
  readonly sourceStatus: PostseasonSourceStatus;
}

export interface PostseasonSnapshot {
  readonly season: number;
  readonly activeWeek: number | null;
  readonly playoffWeekStart: number;
  readonly sourceStatus: PostseasonSourceStatus;
  readonly contexts: readonly PostseasonContext[];
}
