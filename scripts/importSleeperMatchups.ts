import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  LCC_SLEEPER_LEAGUE_IDS_BY_SEASON,
  type LccSleeperSeason,
} from "../lib/leagueConstants";

type SleeperMatchupEntry = {
  roster_id: number;
  matchup_id: number;
  points?: number;
  custom_points?: number | null;
  players?: string[];
  starters?: string[];
  players_points?: Record<string, number>;
};

type SleeperRoster = {
  roster_id: number;
  owner_id?: string | null;
};

type SleeperUser = {
  user_id: string;
  display_name?: string;
  metadata?: {
    team_name?: string;
  };
};

type SleeperBracketMatch = {
  r: number;
  m?: number;
  t1?: number;
  t2?: number;
  w?: number;
  l?: number;
};

const OUTPUT_ROOT = path.join(
  process.cwd(),
  "data",
  "history",
  "matchups",
  "sleeper"
);

const WRITE_MODE = process.argv.includes("--write");
const SEASON_ARG = process.argv.find((arg) => arg.startsWith("--season="));
const SELECTED_SEASON = SEASON_ARG
  ? Number(SEASON_ARG.replace("--season=", ""))
  : null;

const MAX_WEEK = 17;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }

  return (await response.json()) as T;
}

async function importSeason(season: LccSleeperSeason, leagueId: string) {
  const seasonDir = path.join(OUTPUT_ROOT, String(season));

  const usersUrl = `https://api.sleeper.app/v1/league/${leagueId}/users`;
  const rostersUrl = `https://api.sleeper.app/v1/league/${leagueId}/rosters`;
  const winnersBracketUrl = `https://api.sleeper.app/v1/league/${leagueId}/winners_bracket`;
  const losersBracketUrl = `https://api.sleeper.app/v1/league/${leagueId}/losers_bracket`;

  const [users, rosters, winnersBracket, losersBracket] = await Promise.all([
    fetchJson<SleeperUser[]>(usersUrl),
    fetchJson<SleeperRoster[]>(rostersUrl),
    fetchJson<SleeperBracketMatch[]>(winnersBracketUrl).catch(() => []),
    fetchJson<SleeperBracketMatch[]>(losersBracketUrl).catch(() => []),
  ]);

  const weeks: Array<{
    week: number;
    matchups: SleeperMatchupEntry[];
  }> = [];

  for (let week = 1; week <= MAX_WEEK; week += 1) {
    const matchupsUrl = `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`;
    const matchups = await fetchJson<SleeperMatchupEntry[]>(matchupsUrl);

    weeks.push({
      week,
      matchups,
    });
  }

  if (WRITE_MODE) {
    await mkdir(seasonDir, { recursive: true });

    await writeJson(path.join(seasonDir, "users.json"), users);
    await writeJson(path.join(seasonDir, "rosters.json"), rosters);
    await writeJson(path.join(seasonDir, "winners-bracket.json"), winnersBracket);
    await writeJson(path.join(seasonDir, "losers-bracket.json"), losersBracket);

    for (const weekData of weeks) {
      await writeJson(
        path.join(seasonDir, `week-${String(weekData.week).padStart(2, "0")}.json`),
        weekData.matchups
      );
    }
  }

  const matchupRows = weeks.reduce(
    (total, weekData) => total + weekData.matchups.length,
    0
  );

  return {
    season,
    leagueId,
    users: users.length,
    rosters: rosters.length,
    weeks: weeks.length,
    matchupRows,
    winnersBracket: winnersBracket.length,
    losersBracket: losersBracket.length,
  };
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const entries = Object.entries(LCC_SLEEPER_LEAGUE_IDS_BY_SEASON)
    .map(([season, leagueId]) => ({
      season: Number(season) as LccSleeperSeason,
      leagueId,
    }))
    .filter((entry) => {
      if (SELECTED_SEASON === null) {
        return true;
      }

      return entry.season === SELECTED_SEASON;
    })
    .sort((a, b) => a.season - b.season);

  if (entries.length === 0) {
    throw new Error(`No Sleeper league configured for season ${SELECTED_SEASON}`);
  }

  console.log("LCC Sleeper Matchup Import");
  console.log("==========================");
  console.log(`Mode: ${WRITE_MODE ? "WRITE" : "DRY RUN"}`);
  console.log(`Output: ${OUTPUT_ROOT}`);
  console.log("");

  for (const entry of entries) {
    const summary = await importSeason(entry.season, entry.leagueId);

    console.log(
      [
        summary.season,
        `league ${summary.leagueId}`,
        `${summary.users} users`,
        `${summary.rosters} rosters`,
        `${summary.weeks} weeks`,
        `${summary.matchupRows} matchup rows`,
        `${summary.winnersBracket} winners bracket rows`,
        `${summary.losersBracket} losers bracket rows`,
      ].join(" | ")
    );
  }

  console.log("");
  console.log(
    WRITE_MODE
      ? "Import complete."
      : "Dry run complete. Rerun with --write to save files."
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});