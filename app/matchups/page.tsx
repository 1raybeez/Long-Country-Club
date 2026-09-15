import { LCC_CURRENT_SEASON, LCC_SLEEPER_LEAGUE_IDS_BY_SEASON } from "@/lib/leagueConstants";
import { loadAllMatchups } from "@/lib/history/matchups";
import { getOwnerById } from "@/lib/ownerRegistry";
import { getLeagueInfo } from "@/lib/sleeper";
import { loadCurrentSeasonMatchups, resolveHomeCurrentWeek, type HomeCurrentWeekState } from "@/lib/homeCurrentSeason";
import { MatchupCenterClient } from "./MatchupCenterClient";

export default async function MatchupsPage() {
  const archivedMatchups = loadAllMatchups();
  const currentSeasonState = await loadCurrentSeasonState();
  const currentMatchups = currentSeasonState.week
    ? await loadCurrentSeasonMatchups(currentSeasonState.week)
    : [];
  const matchups = [
    ...archivedMatchups.filter((matchup) => !(matchup.season === LCC_CURRENT_SEASON && matchup.week === currentSeasonState.week)),
    ...currentMatchups,
  ];

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
      currentSeasonState={currentSeasonState}
    />
  );
}

async function loadCurrentSeasonState(): Promise<HomeCurrentWeekState> {
  try {
    return resolveHomeCurrentWeek(await getLeagueInfo(), LCC_CURRENT_SEASON);
  } catch {
    return resolveHomeCurrentWeek(null, LCC_CURRENT_SEASON);
  }
}

function ownerName(ownerId: string) {
  return getOwnerById(ownerId)?.teamName ?? ownerId;
}
