import fs from "fs";
import path from "path";
import { ALL_LCC_OWNERS } from "@/lib/lccOwners";

export type HistoricalLineupPlayer = {
  readonly playerId: string;
  readonly slot: number;
  readonly points: number | null;
  readonly imageUrl: string | null;
};

export type HistoricalLineup = {
  readonly season: number;
  readonly week: number;
  readonly rosterId: number;
  readonly sleeperUserId: string | null;
  readonly ownerId: string | null;
  readonly matchupId: number | null;
  readonly points: number | null;
  readonly starters: readonly HistoricalLineupPlayer[];
};

type SleeperWeekRow = {
  points?: number | null;
  roster_id: number;
  matchup_id?: number | null;
  starters?: string[];
  starters_points?: number[];
  players_points?: Record<string, number>;
};

type SleeperRoster = {
  roster_id: number;
  owner_id?: string | null;
};

const SLEEPER_MATCHUP_DIR = path.join(
  process.cwd(),
  "data/history/matchups/sleeper"
);

const LCC_OWNER_ID_BY_SLEEPER_USER_ID = new Map(
  ALL_LCC_OWNERS.flatMap((owner) =>
    owner.sleeperUserId ? [[owner.sleeperUserId, owner.id] as const] : []
  )
);

export function loadLineupsBySeasonWeek(
  season: number,
  week: number
): readonly HistoricalLineup[] {
  const weekFile = path.join(
    SLEEPER_MATCHUP_DIR,
    String(season),
    `week-${String(week).padStart(2, "0")}.json`
  );

  const rosterFile = path.join(
    SLEEPER_MATCHUP_DIR,
    String(season),
    "rosters.json"
  );

  if (!fs.existsSync(weekFile) || !fs.existsSync(rosterFile)) {
    return [];
  }

  const rows = JSON.parse(fs.readFileSync(weekFile, "utf8")) as SleeperWeekRow[];
  const rosters = JSON.parse(
    fs.readFileSync(rosterFile, "utf8")
  ) as SleeperRoster[];

  const sleeperUserIdByRosterId = new Map(
    rosters.map((roster) => [roster.roster_id, roster.owner_id ?? null])
  );

  return rows.map((row) => {
    const sleeperUserId = sleeperUserIdByRosterId.get(row.roster_id) ?? null;
    const ownerId = sleeperUserId
      ? LCC_OWNER_ID_BY_SLEEPER_USER_ID.get(sleeperUserId) ?? null
      : null;

    return {
      season,
      week,
      rosterId: row.roster_id,
      sleeperUserId,
      ownerId,
      matchupId: row.matchup_id ?? null,
      points: typeof row.points === "number" ? row.points : null,
      starters: (row.starters ?? []).map((playerId, index) => ({
        playerId,
        slot: index + 1,
        points:
          typeof row.starters_points?.[index] === "number"
            ? row.starters_points[index]
            : row.players_points?.[playerId] ?? null,
        imageUrl: getSleeperPlayerImageUrl(playerId),
      })),
    };
  });
}

export function getLineupsForMatchup({
  season,
  week,
  ownerAId,
  ownerBId,
}: {
  season: number;
  week: number;
  ownerAId: string;
  ownerBId: string;
}) {
  const lineups = loadLineupsBySeasonWeek(season, week);

  return {
    ownerA: lineups.find((lineup) => lineup.ownerId === ownerAId) ?? null,
    ownerB: lineups.find((lineup) => lineup.ownerId === ownerBId) ?? null,
  };
}

export function getLineupsByMatchupId({
  season,
  week,
  matchupId,
}: {
  season: number;
  week: number;
  matchupId: number;
}) {
  return loadLineupsBySeasonWeek(season, week).filter(
    (lineup) => lineup.matchupId === matchupId
  );
}

function getSleeperPlayerImageUrl(playerId: string) {
  if (!playerId || /^[A-Z]{2,4}$/.test(playerId)) {
    return null;
  }

  return `https://sleepercdn.com/content/nfl/players/${playerId}.jpg`;
}