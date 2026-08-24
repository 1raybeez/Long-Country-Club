export type HomeSeasonPhase = "PRESEASON" | "IN-SEASON" | "POSTSEASON";

export interface HomeSeasonTeam {
  readonly abbreviation: string;
  readonly name: string;
  readonly logoKey: string;
}

export interface HomeSeasonConfig {
  readonly phase: HomeSeasonPhase;
  readonly kickoffDate: string;
  readonly kickoffDisplay: string;
  readonly kickoffTime: string;
  readonly kickoffAwayTeam: HomeSeasonTeam;
  readonly kickoffHomeTeam: HomeSeasonTeam;
  readonly feeDeadlineLabel: string;
}

export function getHomeTeamLogoUrl(team: HomeSeasonTeam): string {
  return `https://sleepercdn.com/images/team_logos/nfl/${team.logoKey.toLowerCase()}.png`;
}

export const HOME_SEASON_CONFIG: Readonly<Record<number, HomeSeasonConfig>> = {
  2026: {
    phase: "PRESEASON",
    kickoffDate: "2026-09-09",
    kickoffDisplay: "Wednesday, September 9, 2026",
    kickoffTime: "8:20 PM ET",
    kickoffAwayTeam: {
      abbreviation: "NE",
      name: "Patriots",
      logoKey: "NE",
    },
    kickoffHomeTeam: {
      abbreviation: "SEA",
      name: "Seahawks",
      logoKey: "SEA",
    },
    feeDeadlineLabel: "Before kickoff",
  },
};
