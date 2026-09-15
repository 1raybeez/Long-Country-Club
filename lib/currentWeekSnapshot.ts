import { getLeagueInfo } from "./sleeper.ts";
import { LCC_CURRENT_SEASON } from "./leagueConstants.ts";
import { loadCurrentSeasonMatchups, resolveHomeCurrentWeek, type HomeCurrentWeekState } from "./homeCurrentSeason.ts";
import type { HistoricalMatchup } from "./history/matchups.ts";

export interface CurrentWeekSnapshot {
  readonly season: number;
  readonly week: number | null;
  readonly state: HomeCurrentWeekState;
  readonly fetchedAt: string;
  readonly matchups: readonly HistoricalMatchup[];
}

export async function loadCurrentWeekSnapshot(): Promise<CurrentWeekSnapshot> {
  try {
    const state = resolveHomeCurrentWeek(await getLeagueInfo(), LCC_CURRENT_SEASON);
    return {
      season: LCC_CURRENT_SEASON,
      week: state.week,
      state,
      fetchedAt: new Date().toISOString(),
      matchups: state.week === null ? [] : await loadCurrentSeasonMatchups(state.week),
    };
  } catch {
    const state = resolveHomeCurrentWeek(null, LCC_CURRENT_SEASON);
    return { season: LCC_CURRENT_SEASON, week: null, state, fetchedAt: new Date().toISOString(), matchups: [] };
  }
}
