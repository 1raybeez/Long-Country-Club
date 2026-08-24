import fs from "node:fs";
import path from "node:path";
import { ALL_LCC_OWNERS } from "../lccOwners";
import { LCC_CURRENT_SEASON } from "../leagueConstants";

export type RosterSnapshotKind = "weeklyActual" | "seasonRoster";

export type HistoricalRosterSnapshot = {
  readonly season: number;
  readonly week: number | null;
  readonly ownerId: string | null;
  readonly sleeperUserId: string | null;
  readonly rosterId: number;
  readonly playerIds: readonly string[];
  readonly starterIds: readonly string[];
  readonly nonstarterIds: readonly string[];
  readonly reserveIds: readonly string[] | null;
  readonly taxiIds: readonly string[] | null;
  readonly snapshotKind: RosterSnapshotKind;
  readonly source: "weeklyMatchup" | "seasonRosters";
  readonly actualWeeklyLineupAvailable: boolean;
};

type SleeperMatchupRow = {
  points?: number | null;
  custom_points?: number | null;
  roster_id: number;
  matchup_id?: number | null;
  players?: string[];
  starters?: string[];
};

type SleeperRoster = {
  roster_id: number;
  owner_id?: string | null;
  players?: string[] | null;
  starters?: string[] | null;
  reserve?: string[] | null;
  taxi?: string[] | null;
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

let weeklySnapshotCache: readonly HistoricalRosterSnapshot[] | null = null;

export function getRosterSnapshot({
  ownerId,
  season,
  week,
}: {
  readonly ownerId: string;
  readonly season: number;
  readonly week: number;
}): HistoricalRosterSnapshot | null {
  return (
    getWeeklySnapshotsByOwner(ownerId).find(
      (snapshot) => snapshot.season === season && snapshot.week === week
    ) ?? null
  );
}

export function getRosterSnapshotBefore({
  ownerId,
  season,
  week,
}: {
  readonly ownerId: string;
  readonly season: number;
  readonly week: number;
}): HistoricalRosterSnapshot | null {
  return (
    getWeeklySnapshotsByOwner(ownerId)
      .filter((snapshot) => isBefore(snapshot, { season, week }))
      .at(-1) ?? null
  );
}

export function getRosterSnapshotsByOwner(
  ownerId: string
): readonly HistoricalRosterSnapshot[] {
  return getWeeklySnapshotsByOwner(ownerId);
}

export function getRosterSnapshotsBySeason(
  season: number
): readonly HistoricalRosterSnapshot[] {
  return getAllWeeklySnapshots().filter(
    (snapshot) => snapshot.season === season
  );
}

export function getSeasonRosterSnapshot({
  ownerId,
  season,
}: {
  readonly ownerId: string;
  readonly season: number;
}): HistoricalRosterSnapshot | null {
  return getSeasonRosterSnapshots(season).find(
    (snapshot) => snapshot.ownerId === ownerId
  ) ?? null;
}

export function getCurrentRosterSnapshot(
  ownerId: string
): HistoricalRosterSnapshot | null {
  return getSeasonRosterSnapshot({
    ownerId,
    season: LCC_CURRENT_SEASON,
  });
}

function getWeeklySnapshotsByOwner(
  ownerId: string
): readonly HistoricalRosterSnapshot[] {
  return getAllWeeklySnapshots().filter(
    (snapshot) => snapshot.ownerId === ownerId
  );
}

function getAllWeeklySnapshots(): readonly HistoricalRosterSnapshot[] {
  if (weeklySnapshotCache) {
    return weeklySnapshotCache;
  }

  const snapshots: HistoricalRosterSnapshot[] = [];

  for (const season of getStoredSeasons()) {
    const seasonPath = path.join(DATA_ROOT, String(season));
    const ownerByRosterId = loadOwnerByRosterId(season);

    for (const fileName of fs
      .readdirSync(seasonPath)
      .filter((file) => /^week-\d{2}\.json$/.test(file))
      .sort()) {
      const week = Number(fileName.slice(5, 7));
      const rows = JSON.parse(
        fs.readFileSync(path.join(seasonPath, fileName), "utf8")
      ) as SleeperMatchupRow[];
      const completedMatchupIds = getCompletedMatchupIds(season, rows);

      for (const row of rows) {
        if (!isCompletedRow(season, row, completedMatchupIds)) {
          continue;
        }

        const starters = uniqueIds(row.starters);
        const playerIds = uniqueIds([
          ...(row.players ?? []),
          ...starters,
        ]);

        snapshots.push({
          season,
          week,
          ownerId: ownerByRosterId.get(row.roster_id)?.ownerId ?? null,
          sleeperUserId:
            ownerByRosterId.get(row.roster_id)?.sleeperUserId ?? null,
          rosterId: row.roster_id,
          playerIds,
          starterIds: starters,
          nonstarterIds: playerIds.filter(
            (playerId) => !starters.includes(playerId)
          ),
          reserveIds: null,
          taxiIds: null,
          snapshotKind: "weeklyActual",
          source: "weeklyMatchup",
          actualWeeklyLineupAvailable: true,
        });
      }
    }
  }

  weeklySnapshotCache = snapshots.sort(compareSnapshots);
  return weeklySnapshotCache;
}

function getSeasonRosterSnapshots(
  season: number
): readonly HistoricalRosterSnapshot[] {
  const rosterPath = path.join(DATA_ROOT, String(season), "rosters.json");

  if (!fs.existsSync(rosterPath)) {
    return [];
  }

  const rosters = JSON.parse(
    fs.readFileSync(rosterPath, "utf8")
  ) as SleeperRoster[];

  return rosters.map((roster) => {
    const playerIds = uniqueIds(roster.players);
    const starterIds = uniqueIds(roster.starters);

    return {
      season,
      week: null,
      ownerId: roster.owner_id
        ? OWNER_ID_BY_SLEEPER_USER_ID.get(roster.owner_id) ?? null
        : null,
      sleeperUserId: roster.owner_id ?? null,
      rosterId: roster.roster_id,
      playerIds,
      starterIds,
      nonstarterIds: playerIds.filter(
        (playerId) => !starterIds.includes(playerId)
      ),
      reserveIds: roster.reserve ? uniqueIds(roster.reserve) : null,
      taxiIds: roster.taxi ? uniqueIds(roster.taxi) : null,
      snapshotKind: "seasonRoster",
      source: "seasonRosters",
      actualWeeklyLineupAvailable: false,
    };
  });
}

function loadOwnerByRosterId(season: number) {
  const rosterPath = path.join(DATA_ROOT, String(season), "rosters.json");
  const result = new Map<
    number,
    { ownerId: string | null; sleeperUserId: string | null }
  >();

  if (!fs.existsSync(rosterPath)) {
    return result;
  }

  const rosters = JSON.parse(
    fs.readFileSync(rosterPath, "utf8")
  ) as SleeperRoster[];

  for (const roster of rosters) {
    result.set(roster.roster_id, {
      ownerId: roster.owner_id
        ? OWNER_ID_BY_SLEEPER_USER_ID.get(roster.owner_id) ?? null
        : null,
      sleeperUserId: roster.owner_id ?? null,
    });
  }

  return result;
}

function getCompletedMatchupIds(
  season: number,
  rows: readonly SleeperMatchupRow[]
): ReadonlySet<number> | null {
  if (season !== LCC_CURRENT_SEASON) {
    return null;
  }

  const completed = new Set<number>();
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
    if (
      matchupRows.some(
        (row) =>
          typeof row.custom_points === "number" ||
          (typeof row.points === "number" && row.points > 0)
      )
    ) {
      completed.add(matchupId);
    }
  }

  return completed;
}

function isCompletedRow(
  season: number,
  row: SleeperMatchupRow,
  completedMatchupIds: ReadonlySet<number> | null
) {
  if (season !== LCC_CURRENT_SEASON) {
    return true;
  }

  return (
    typeof row.matchup_id === "number" &&
    completedMatchupIds?.has(row.matchup_id) === true
  );
}

function uniqueIds(ids: readonly string[] | null | undefined) {
  return Array.from(
    new Set((ids ?? []).filter((playerId) => playerId && playerId !== "0"))
  );
}

function getStoredSeasons() {
  if (!fs.existsSync(DATA_ROOT)) {
    return [];
  }

  return fs
    .readdirSync(DATA_ROOT)
    .filter((entry) => /^\d{4}$/.test(entry))
    .map(Number)
    .sort((a, b) => a - b);
}

function compareSnapshots(
  a: HistoricalRosterSnapshot,
  b: HistoricalRosterSnapshot
) {
  return (
    a.season - b.season ||
    (a.week ?? 0) - (b.week ?? 0) ||
    a.rosterId - b.rosterId
  );
}

function isBefore(
  snapshot: HistoricalRosterSnapshot,
  boundary: { readonly season: number; readonly week: number }
) {
  return (
    snapshot.season < boundary.season ||
    (snapshot.season === boundary.season &&
      (snapshot.week ?? 0) < boundary.week)
  );
}
