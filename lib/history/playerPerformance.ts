import fs from "node:fs";
import path from "node:path";
import { ALL_LCC_OWNERS } from "../lccOwners.ts";
import { LCC_CURRENT_SEASON } from "../leagueConstants.ts";
import {
  getPlayerById,
  type HistoricalPlayerMetadata,
} from "./playerRegistry.ts";

export type PlayerPerformanceBoundary = {
  readonly season: number;
  readonly week: number;
};

export type PlayerPerformanceQuery = {
  readonly playerId: string;
  readonly season?: number;
  readonly week?: number;
};

export type HistoricalPlayerPerformance = {
  readonly playerId: string;
  readonly season: number;
  readonly week: number;
  readonly fantasyPoints: number | null;
  readonly rosterId: number;
  readonly ownerId: string | null;
  readonly matchupId: number | null;
  readonly wasStarter: boolean;
  readonly wasNonstarter: boolean;
  readonly metadata: HistoricalPlayerMetadata | null;
};

export type PlayerPerformanceAggregate = {
  readonly rosterAppearances: number;
  readonly scoredAppearances: number;
  readonly totalFantasyPoints: number;
  readonly averageFantasyPoints: number | null;
  readonly starterAppearances: number;
  readonly nonstarterAppearances: number;
  readonly starterFantasyPoints: number;
  readonly nonstarterFantasyPoints: number;
  readonly highestWeeklyScore: number | null;
  readonly lowestWeeklyScore: number | null;
  readonly standardDeviation: number | null;
};

export type PlayerSeasonPerformance = PlayerPerformanceAggregate & {
  readonly playerId: string;
  readonly season: number;
  readonly weeklyPerformances: readonly HistoricalPlayerPerformance[];
};

export type PlayerRollingPerformance = PlayerPerformanceAggregate & {
  readonly playerId: string;
  readonly window: number;
  readonly through: PlayerPerformanceBoundary | null;
  readonly performances: readonly HistoricalPlayerPerformance[];
};

type SleeperMatchupRow = {
  points?: number | null;
  custom_points?: number | null;
  roster_id: number;
  matchup_id?: number | null;
  players?: string[];
  starters?: string[];
  players_points?: Record<string, number>;
};

type SleeperRoster = {
  roster_id: number;
  owner_id?: string | null;
};

type WeeklyRows = {
  readonly season: number;
  readonly week: number;
  readonly rows: readonly SleeperMatchupRow[];
};

const DATA_ROOT = path.join(
  process.cwd(),
  "data/history/matchups/sleeper"
);

const OWNER_ID_BY_SLEEPER_USER_ID = new Map(
  ALL_LCC_OWNERS.flatMap((owner) =>
    owner.sleeperUserId
      ? [[owner.sleeperUserId, owner.id] as const]
      : []
  )
);

let performanceCache: readonly HistoricalPlayerPerformance[] | null = null;

export function getPlayerPerformance({
  playerId,
  season,
  week,
}: PlayerPerformanceQuery): readonly HistoricalPlayerPerformance[] {
  return getAllPlayerPerformances().filter(
    (performance) =>
      performance.playerId === playerId &&
      (season === undefined || performance.season === season) &&
      (week === undefined || performance.week === week)
  );
}

export function getPlayerPerformanceHistory(
  playerId: string
): readonly HistoricalPlayerPerformance[] {
  return getPlayerPerformance({ playerId });
}

export function getPlayerPerformanceThrough({
  playerId,
  season,
  week,
}: PlayerPerformanceBoundary & { readonly playerId: string }): readonly HistoricalPlayerPerformance[] {
  return getPlayerPerformanceHistory(playerId).filter((performance) =>
    isOnOrBefore(performance, { season, week })
  );
}

export function getPlayerPerformanceBefore({
  playerId,
  season,
  week,
}: PlayerPerformanceBoundary & { readonly playerId: string }): readonly HistoricalPlayerPerformance[] {
  return getPlayerPerformanceHistory(playerId).filter((performance) =>
    isBefore(performance, { season, week })
  );
}

export function getPlayerSeasonPerformance({
  playerId,
  season,
}: {
  readonly playerId: string;
  readonly season: number;
}): PlayerSeasonPerformance | null {
  const weeklyPerformances = getPlayerPerformance({ playerId, season });

  if (weeklyPerformances.length === 0) {
    return null;
  }

  return {
    playerId,
    season,
    weeklyPerformances,
    ...aggregatePerformances(weeklyPerformances),
  };
}

export function getPlayerRollingPerformanceBefore({
  playerId,
  season,
  week,
  window,
}: PlayerPerformanceBoundary & {
  readonly playerId: string;
  readonly window: number;
}): PlayerRollingPerformance | null {
  if (!Number.isInteger(window) || window <= 0) {
    return null;
  }

  const performances = getPlayerPerformanceBefore({
    playerId,
    season,
    week,
  }).slice(-window);

  if (performances.length === 0) {
    return null;
  }

  return {
    playerId,
    window,
    through: performances.at(-1)
      ? {
          season: performances.at(-1)!.season,
          week: performances.at(-1)!.week,
        }
      : null,
    performances,
    ...aggregatePerformances(performances),
  };
}

function getAllPlayerPerformances(): readonly HistoricalPlayerPerformance[] {
  if (performanceCache) {
    return performanceCache;
  }

  const rostersBySeason = loadRostersBySeason();
  const performances: HistoricalPlayerPerformance[] = [];

  for (const weeklyRows of loadWeeklyRows()) {
    const completedMatchupKeys = getCompletedMatchupKeys(
      weeklyRows.season,
      weeklyRows.rows
    );
    const ownerIdByRosterId = rostersBySeason.get(weeklyRows.season) ?? new Map();

    for (const row of weeklyRows.rows) {
      if (!isEligibleRow(weeklyRows.season, row, completedMatchupKeys)) {
        continue;
      }

      const starterIds = new Set(
        (row.starters ?? []).filter((playerId) => playerId !== "0")
      );
      const players = Array.from(
        new Set([...(row.players ?? []), ...starterIds])
      );

      for (const playerId of players) {
        const fantasyPoints = row.players_points?.[playerId];
        const metadata = getPlayerById(playerId);
        const wasStarter = starterIds.has(playerId);

        performances.push({
          playerId,
          season: weeklyRows.season,
          week: weeklyRows.week,
          fantasyPoints:
            typeof fantasyPoints === "number" && Number.isFinite(fantasyPoints)
              ? fantasyPoints
              : null,
          rosterId: row.roster_id,
          ownerId: ownerIdByRosterId.get(row.roster_id) ?? null,
          matchupId: row.matchup_id ?? null,
          wasStarter,
          wasNonstarter: !wasStarter,
          metadata,
        });
      }
    }
  }

  performanceCache = performances.sort(comparePerformances);
  return performanceCache;
}

function loadRostersBySeason() {
  const rostersBySeason = new Map<number, Map<number, string | null>>();

  for (const season of getStoredSeasons()) {
    const rosterPath = path.join(DATA_ROOT, String(season), "rosters.json");

    if (!fs.existsSync(rosterPath)) {
      continue;
    }

    const rosters = JSON.parse(
      fs.readFileSync(rosterPath, "utf8")
    ) as SleeperRoster[];

    rostersBySeason.set(
      season,
      new Map(
        rosters.map((roster) => [
          roster.roster_id,
          roster.owner_id
            ? OWNER_ID_BY_SLEEPER_USER_ID.get(roster.owner_id) ?? null
            : null,
        ])
      )
    );
  }

  return rostersBySeason;
}

function loadWeeklyRows(): readonly WeeklyRows[] {
  const weeklyRows: WeeklyRows[] = [];

  for (const season of getStoredSeasons()) {
    const seasonPath = path.join(DATA_ROOT, String(season));

    for (const fileName of fs
      .readdirSync(seasonPath)
      .filter((file) => /^week-\d{2}\.json$/.test(file))
      .sort()) {
      const week = Number(fileName.slice(5, 7));
      const rows = JSON.parse(
        fs.readFileSync(path.join(seasonPath, fileName), "utf8")
      ) as SleeperMatchupRow[];

      weeklyRows.push({ season, week, rows });
    }
  }

  return weeklyRows.sort(
    (a, b) => a.season - b.season || a.week - b.week
  );
}

function getStoredSeasons(): readonly number[] {
  if (!fs.existsSync(DATA_ROOT)) {
    return [];
  }

  return fs
    .readdirSync(DATA_ROOT)
    .filter((entry) => /^\d{4}$/.test(entry))
    .map(Number)
    .sort((a, b) => a - b);
}

function getCompletedMatchupKeys(
  season: number,
  rows: readonly SleeperMatchupRow[]
) {
  if (season !== LCC_CURRENT_SEASON) {
    return null;
  }

  const completedKeys = new Set<string>();
  const rowsByMatchup = new Map<number, SleeperMatchupRow[]>();

  for (const row of rows) {
    if (typeof row.matchup_id !== "number") {
      continue;
    }

    const matchupRows = rowsByMatchup.get(row.matchup_id) ?? [];
    matchupRows.push(row);
    rowsByMatchup.set(row.matchup_id, matchupRows);
  }

  for (const [matchupId, matchupRows] of rowsByMatchup) {
    const hasCompletedScore = matchupRows.some(
      (row) =>
        typeof row.custom_points === "number" ||
        (typeof row.points === "number" && row.points > 0)
    );

    if (hasCompletedScore) {
      completedKeys.add(String(matchupId));
    }
  }

  return completedKeys;
}

function isEligibleRow(
  season: number,
  row: SleeperMatchupRow,
  completedMatchupKeys: ReadonlySet<string> | null
) {
  if (season !== LCC_CURRENT_SEASON) {
    return true;
  }

  return (
    typeof row.matchup_id === "number" &&
    completedMatchupKeys?.has(String(row.matchup_id)) === true
  );
}

function aggregatePerformances(
  performances: readonly HistoricalPlayerPerformance[]
): PlayerPerformanceAggregate {
  const scored = performances.flatMap((performance) =>
    performance.fantasyPoints === null ? [] : [performance.fantasyPoints]
  );
  const starter = performances.filter((performance) => performance.wasStarter);
  const nonstarter = performances.filter(
    (performance) => performance.wasNonstarter
  );

  return {
    rosterAppearances: performances.length,
    scoredAppearances: scored.length,
    totalFantasyPoints: round(sum(scored)),
    averageFantasyPoints: scored.length
      ? round(sum(scored) / scored.length)
      : null,
    starterAppearances: starter.length,
    nonstarterAppearances: nonstarter.length,
    starterFantasyPoints: round(sumPoints(starter)),
    nonstarterFantasyPoints: round(sumPoints(nonstarter)),
    highestWeeklyScore: scored.length ? Math.max(...scored) : null,
    lowestWeeklyScore: scored.length ? Math.min(...scored) : null,
    standardDeviation: scored.length ? round(populationStandardDeviation(scored)) : null,
  };
}

function sumPoints(performances: readonly HistoricalPlayerPerformance[]) {
  return sum(
    performances.flatMap((performance) =>
      performance.fantasyPoints === null ? [] : [performance.fantasyPoints]
    )
  );
}

function sum(values: readonly number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function populationStandardDeviation(values: readonly number[]) {
  const average = sum(values) / values.length;
  const variance =
    values.reduce((total, value) => total + (value - average) ** 2, 0) /
    values.length;

  return Math.sqrt(variance);
}

function comparePerformances(
  a: HistoricalPlayerPerformance,
  b: HistoricalPlayerPerformance
) {
  return (
    a.season - b.season ||
    a.week - b.week ||
    a.rosterId - b.rosterId ||
    a.playerId.localeCompare(b.playerId)
  );
}

function isOnOrBefore(
  performance: HistoricalPlayerPerformance,
  boundary: PlayerPerformanceBoundary
) {
  return (
    performance.season < boundary.season ||
    (performance.season === boundary.season &&
      performance.week <= boundary.week)
  );
}

function isBefore(
  performance: HistoricalPlayerPerformance,
  boundary: PlayerPerformanceBoundary
) {
  return (
    performance.season < boundary.season ||
    (performance.season === boundary.season &&
      performance.week < boundary.week)
  );
}

function round(value: number) {
  return Number(value.toFixed(2));
}
