import type { HistoricalMatchup } from "../history/matchups";
import type { PostseasonSnapshot } from "./types";
import { getCurrentPostseasonContext } from "./bracketAdapter";

export function attachPostseasonContext(
  matchups: readonly HistoricalMatchup[],
  snapshot: PostseasonSnapshot | null,
): readonly HistoricalMatchup[] {
  if (!snapshot) return matchups;
  return matchups.map((matchup) => {
    const context = snapshot.contexts.find((candidate) =>
      candidate.ownerId === matchup.ownerAId && candidate.opponentOwnerId === matchup.ownerBId
      || candidate.ownerId === matchup.ownerBId && candidate.opponentOwnerId === matchup.ownerAId,
    );
    return context ? { ...matchup, postseason: context } : matchup;
  });
}

export { getCurrentPostseasonContext };
