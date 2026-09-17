import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { LCC_CURRENT_SEASON, LCC_LEAGUE_HISTORY } from "../leagueConstants";
import { getLccOwnerBySleeperUserId } from "../lccOwners";
import type {
  ArchiveCoverage,
  ArchiveSeasonRecord,
  ArchiveSeasonResult,
  SleeperArchiveRoster,
  SleeperArchiveUser,
} from "../types/archive";

export const ARCHIVE_START_SEASON = 2019;

const ARCHIVE_ROOT = path.join(process.cwd(), "data", "history", "matchups", "sleeper");
const REQUIRED_ROSTER_SETTINGS = ["wins", "losses", "ties", "fpts", "ppts"] as const;

export interface ArchiveStatsOptions {
  readonly archiveRoot?: string;
  readonly seasons?: readonly { readonly year: number; readonly id: string }[];
}

type MutableAggregate = {
  id: string;
  realName: string;
  teamName: string;
  avatar: string | null;
  wins: number;
  losses: number;
  ties: number;
  fpts: number;
  ppts: number;
  seasons: number;
};

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function getExpectedSeasons(options?: ArchiveStatsOptions) {
  return [...(options?.seasons ?? LCC_LEAGUE_HISTORY)]
    .filter(({ year }) => year >= ARCHIVE_START_SEASON && year < LCC_CURRENT_SEASON)
    .sort((a, b) => a.year - b.year);
}

function getArchiveIdentity(sleeperUserId: string, userMap: ReadonlyMap<string, SleeperArchiveUser>) {
  const sleeperUser = userMap.get(sleeperUserId);
  const canonicalOwner = getLccOwnerBySleeperUserId(sleeperUserId);
  const sleeperTeamName = sleeperUser?.metadata?.team_name || sleeperUser?.display_name || "Unknown";

  return {
    canonicalOwner,
    realName: canonicalOwner?.displayName || sleeperTeamName,
    teamName: canonicalOwner?.managerPage.sleeperName || sleeperTeamName,
    avatar: sleeperUser?.avatar ?? null,
  };
}

function getNumericSetting(settings: SleeperArchiveRoster["settings"], key: keyof NonNullable<SleeperArchiveRoster["settings"]>) {
  const value = settings?.[key];
  return typeof value === "number" ? value : 0;
}

function getMissingSettings(roster: SleeperArchiveRoster) {
  return REQUIRED_ROSTER_SETTINGS.filter((key) => typeof roster.settings?.[key] !== "number");
}

function failedSeason(season: { readonly year: number; readonly id: string }, errors: readonly string[]): ArchiveSeasonResult {
  return { season: season.year, leagueId: season.id, status: "failed", aggregates: [], seasonRecords: [], totalRosters: 0, attributedRosters: 0, warnings: [], errors };
}

function loadSeason(season: { readonly year: number; readonly id: string }, archiveRoot: string): ArchiveSeasonResult {
  const seasonRoot = path.join(archiveRoot, String(season.year));
  const usersPath = path.join(seasonRoot, "users.json");
  const rostersPath = path.join(seasonRoot, "rosters.json");
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(usersPath)) errors.push("Missing users snapshot.");
  if (!existsSync(rostersPath)) errors.push("Missing rosters snapshot.");
  if (errors.length > 0) return failedSeason(season, errors);

  let users: SleeperArchiveUser[];
  let rosters: SleeperArchiveRoster[];
  try {
    users = readJson<SleeperArchiveUser[]>(usersPath);
    rosters = readJson<SleeperArchiveRoster[]>(rostersPath);
  } catch (error) {
    return failedSeason(season, [`Unable to parse archive snapshots: ${String(error)}`]);
  }

  const userMap = new Map(users.map((user) => [user.user_id, user]));
  const aggregates = new Map<string, MutableAggregate>();
  const seasonRecords: ArchiveSeasonRecord[] = [];
  let attributedRosters = 0;

  for (const roster of rosters) {
    if (!roster.owner_id) {
      warnings.push(`Roster ${roster.roster_id} cannot be attributed because the archived Sleeper source does not include an owner ID.`);
      continue;
    }

    const identity = getArchiveIdentity(roster.owner_id, userMap);
    if (!identity.canonicalOwner) {
      warnings.push(`Roster ${roster.roster_id} has an owner ID that does not map to a canonical LCC owner.`);
      continue;
    }

    const missingSettings = getMissingSettings(roster);
    if (missingSettings.length > 0) {
      warnings.push(`Roster ${roster.roster_id} is missing ${missingSettings.join(", ")} settings; missing values use the existing zero-value behavior.`);
    }

    const fpts = getNumericSetting(roster.settings, "fpts") + getNumericSetting(roster.settings, "fpts_decimal") / 100;
    const ppts = getNumericSetting(roster.settings, "ppts") + getNumericSetting(roster.settings, "ppts_decimal") / 100;
    const aggregate = aggregates.get(identity.canonicalOwner.id) ?? {
      id: identity.canonicalOwner.id,
      realName: identity.realName,
      teamName: identity.teamName,
      avatar: identity.avatar,
      wins: 0,
      losses: 0,
      ties: 0,
      fpts: 0,
      ppts: 0,
      seasons: 0,
    };

    aggregate.wins += getNumericSetting(roster.settings, "wins");
    aggregate.losses += getNumericSetting(roster.settings, "losses");
    aggregate.ties += getNumericSetting(roster.settings, "ties");
    aggregate.fpts += fpts;
    aggregate.ppts += ppts;
    aggregate.seasons += 1;
    aggregate.avatar = aggregate.avatar ?? identity.avatar;
    aggregates.set(aggregate.id, aggregate);
    attributedRosters += 1;

    if (getNumericSetting(roster.settings, "fpts") > 0) {
      seasonRecords.push({ id: aggregate.id, realName: identity.realName, teamName: identity.teamName, avatar: identity.avatar, year: season.year, fpts });
    }
  }

  const status = attributedRosters === 0 ? "failed" : warnings.length > 0 ? "partial" : "complete";
  return {
    season: season.year,
    leagueId: season.id,
    status,
    aggregates: [...aggregates.values()],
    seasonRecords,
    totalRosters: rosters.length,
    attributedRosters,
    warnings: [...new Set(warnings)],
    errors,
  };
}

export function loadArchiveCoverage(options?: ArchiveStatsOptions): ArchiveCoverage {
  const expectedSeasons = getExpectedSeasons(options);
  const archiveRoot = options?.archiveRoot ?? ARCHIVE_ROOT;
  const seasons = expectedSeasons.map((season) => loadSeason(season, archiveRoot));
  const aggregates = new Map<string, MutableAggregate>();

  for (const season of seasons) {
    for (const aggregate of season.aggregates) {
      const current = aggregates.get(aggregate.id);
      if (!current) {
        aggregates.set(aggregate.id, { ...aggregate });
        continue;
      }
      current.wins += aggregate.wins;
      current.losses += aggregate.losses;
      current.ties += aggregate.ties;
      current.fpts += aggregate.fpts;
      current.ppts += aggregate.ppts;
      current.seasons += aggregate.seasons;
      current.avatar = current.avatar ?? aggregate.avatar;
    }
  }

  return {
    expectedSeasons: expectedSeasons.map(({ year }) => year),
    seasons,
    aggregates: [...aggregates.values()],
    seasonRecords: seasons.flatMap((season) => season.seasonRecords),
    hasUsableData: seasons.some((season) => season.attributedRosters > 0),
  };
}
