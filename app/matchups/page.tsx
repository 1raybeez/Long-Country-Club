import { LCC_CURRENT_SEASON, LCC_SLEEPER_LEAGUE_IDS_BY_SEASON } from "@/lib/leagueConstants";
import { loadAllMatchups } from "@/lib/history/matchups";
import { getOwnerById } from "@/lib/ownerRegistry";
import { MatchupCenterClient } from "./MatchupCenterClient";

export default function MatchupsPage() {
  const matchups = loadAllMatchups();

  const ownerIds = Array.from(
    new Set(matchups.flatMap((matchup) => [matchup.ownerAId, matchup.ownerBId]))
  ).sort((a, b) => ownerName(a).localeCompare(ownerName(b)));

  const owners = ownerIds.map((ownerId) => ({
    id: ownerId,
    displayName: ownerName(ownerId),
  }));

  const seasons = Object.keys(LCC_SLEEPER_LEAGUE_IDS_BY_SEASON)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <MatchupCenterClient
      currentSeason={LCC_CURRENT_SEASON}
      seasons={seasons}
      owners={owners}
      matchups={matchups}
    />
  );
}

function ownerName(ownerId: string) {
  return getOwnerById(ownerId)?.displayName ?? ownerId;
}