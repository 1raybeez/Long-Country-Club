export const LCC_CURRENT_SEASON = 2026;

export const LCC_SLEEPER_LEAGUE_IDS_BY_SEASON = {
  2026: "1312148925091692544",
  2025: "1199899847029698560",
  2024: "1048290254903463936",
  2023: "918202561050685440",
  2022: "817078396659036160",
  2021: "682304920455544832",
  2020: "530113322802368512",
  2019: "466635730102251520",
} as const;

export type LccSleeperSeason = keyof typeof LCC_SLEEPER_LEAGUE_IDS_BY_SEASON;

export const LCC_CURRENT_LEAGUE_ID =
  LCC_SLEEPER_LEAGUE_IDS_BY_SEASON[LCC_CURRENT_SEASON];

export const LCC_COMMISH_SLEEPER_USER_ID = "342828350391230464";

export const LCC_LEAGUE_HISTORY = Object.entries(
  LCC_SLEEPER_LEAGUE_IDS_BY_SEASON
)
  .map(([year, id]) => ({ year: Number(year) as LccSleeperSeason, id }))
  .sort((a, b) => b.year - a.year);

export const LCC_LEAGUE_HISTORY_IDS = LCC_LEAGUE_HISTORY.map(
  (season) => season.id
);

export const LCC_MATCHUP_CENTER_SEASONS = [2026, 2025, 2024] as const;

export const LCC_MATCHUP_LEAGUE_IDS = Object.fromEntries(
  LCC_MATCHUP_CENTER_SEASONS.map((season) => [
    season,
    LCC_SLEEPER_LEAGUE_IDS_BY_SEASON[season],
  ])
) as Record<(typeof LCC_MATCHUP_CENTER_SEASONS)[number], string>;
