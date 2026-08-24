import type { HeadToHeadSummary } from "./headToHead";

export type MatchupTimelineEntry = {
  readonly season: number;
  readonly week: number | null;
  readonly type: string;
  readonly ownerAId: string;
  readonly ownerBId: string;
  readonly ownerAScore: number | null;
  readonly ownerBScore: number | null;
  readonly winnerOwnerId: string | null;
  readonly margin: number | null;
  readonly result: "ownerA" | "ownerB" | "tie";
  readonly isPlayoff: boolean;
  readonly isChampionship: boolean;
};

export function buildMatchupTimeline(
  summary: HeadToHeadSummary
): readonly MatchupTimelineEntry[] {
  return summary.matchups.map((matchup) => {
    const ownerAScore = matchup.ownerAId === summary.ownerAId
      ? matchup.ownerAScore
      : matchup.ownerBScore;
    const ownerBScore = matchup.ownerAId === summary.ownerAId
      ? matchup.ownerBScore
      : matchup.ownerAScore;

    return {
      season: matchup.season,
      week: matchup.week,
      type: matchup.type,
      ownerAId: summary.ownerAId,
      ownerBId: summary.ownerBId,
      ownerAScore,
      ownerBScore,
      winnerOwnerId: matchup.winnerOwnerId,
      margin:
        ownerAScore !== null && ownerBScore !== null
          ? Number(Math.abs(ownerAScore - ownerBScore).toFixed(2))
          : null,
      result:
        !matchup.winnerOwnerId
          ? "tie"
          : matchup.winnerOwnerId === summary.ownerAId
            ? "ownerA"
            : "ownerB",
      isPlayoff:
        matchup.type === "playoff" || matchup.type === "championship",
      isChampionship: matchup.type === "championship",
    };
  });
}
