import { getLeagueInfo } from "./sleeper.ts";
import { LCC_CURRENT_SEASON } from "./leagueConstants.ts";
import { applyAuthoritativeCurrentWeekFinality, loadCurrentSeasonMatchups, resolveHomeCurrentWeek, type HomeCurrentWeekState } from "./homeCurrentSeason.ts";
import type { HistoricalMatchup } from "./history/matchups.ts";
import { attachPostseasonContext } from "./postseason/matchupContext.ts";
import { loadPostseasonSnapshot } from "./postseason/bracketAdapter.ts";
import type { PostseasonSnapshot } from "./postseason/types.ts";
import { LCC_CURRENT_LEAGUE_ID } from "./leagueConstants.ts";

export interface CurrentWeekSnapshot {
  readonly season: number;
  readonly week: number | null;
  readonly state: HomeCurrentWeekState;
  readonly fetchedAt: string;
  readonly matchups: readonly HistoricalMatchup[];
  readonly postseason?: PostseasonSnapshot | null;
}

export async function loadCurrentWeekSnapshot(): Promise<CurrentWeekSnapshot> {
  try {
    const state = resolveHomeCurrentWeek(await getLeagueInfo(), LCC_CURRENT_SEASON);
    const matchups = state.week === null ? [] : await loadCurrentSeasonMatchups(state.week);
    const postseason = state.phase === "POSTSEASON" || state.phase === "SEASON_COMPLETE"
      ? await loadPostseasonSnapshot(LCC_CURRENT_SEASON, state.week, state.playoffWeekStart ?? 0, LCC_CURRENT_LEAGUE_ID)
      : null;
    return {
      season: LCC_CURRENT_SEASON,
      week: state.week,
      state,
      fetchedAt: new Date().toISOString(),
      matchups: attachPostseasonContext(applyAuthoritativeCurrentWeekFinality(matchups, state), postseason),
      postseason,
    };
  } catch {
    const state = resolveHomeCurrentWeek(null, LCC_CURRENT_SEASON);
    return { season: LCC_CURRENT_SEASON, week: null, state, fetchedAt: new Date().toISOString(), matchups: [], postseason: null };
  }
}
