import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { LCC_CURRENT_SEASON } from "../leagueConstants";
import { ALL_LCC_OWNERS } from "../lccOwners";
import type { HistoricalMatchup, MatchupType } from "./matchups";

type SleeperMatchupEntry = {
  roster_id: number;
  matchup_id?: number | null;
  points?: number;
  custom_points?: number | null;
};

type SleeperRoster = {
  roster_id: number;
  owner_id?: string | null;
};

type SleeperBracketMatch = {
  r: number;
  t1?: number;
  t2?: number;
  w?: number;
};

const DATA_ROOT = path.join(
  process.cwd(),
  "data",
  "history",
  "matchups",
  "sleeper"
);

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function getOwnerIdBySleeperUserId(sleeperUserId?: string | null) {
  if (!sleeperUserId) return null;

  return (
    ALL_LCC_OWNERS.find((owner) => owner.sleeperUserId === sleeperUserId)?.id ??
    null
  );
}

function getScore(entry: SleeperMatchupEntry) {
  if (typeof entry.custom_points === "number") return entry.custom_points;
  if (typeof entry.points === "number") return entry.points;
  return null;
}

function getRosterPairKey(rosterA: number, rosterB: number) {
  return [rosterA, rosterB].sort((a, b) => a - b).join("-");
}

function getMatchupType(
  week: number,
  entryA: SleeperMatchupEntry,
  entryB: SleeperMatchupEntry,
  championshipRosterPairs: Set<string>
): MatchupType {
  if (week <= 14) return "regularSeason";

  const pairKey = getRosterPairKey(entryA.roster_id, entryB.roster_id);

  if (week === 17 && championshipRosterPairs.has(pairKey)) {
    return "championship";
  }

  return "playoff";
}

function getWinnerLoser(
  ownerAId: string,
  ownerBId: string,
  ownerAScore: number | null,
  ownerBScore: number | null
) {
  if (ownerAScore === null || ownerBScore === null || ownerAScore === ownerBScore) {
    return {
      winnerOwnerId: null,
      loserOwnerId: null,
    };
  }

  return ownerAScore > ownerBScore
    ? { winnerOwnerId: ownerAId, loserOwnerId: ownerBId }
    : { winnerOwnerId: ownerBId, loserOwnerId: ownerAId };
}

function getChampionshipRosterPairs(seasonDir: string) {
  const winnersBracketPath = path.join(seasonDir, "winners-bracket.json");

  if (!existsSync(winnersBracketPath)) {
    return new Set<string>();
  }

  const bracket = readJson<SleeperBracketMatch[]>(winnersBracketPath);

  return new Set(
    bracket
      .filter((match) => match.r === 3 && match.t1 && match.t2)
      .map((match) => getRosterPairKey(match.t1 as number, match.t2 as number))
  );
}

function generateSeasonMatchups(season: number): HistoricalMatchup[] {
  const seasonDir = path.join(DATA_ROOT, String(season));
  const rostersPath = path.join(seasonDir, "rosters.json");

  if (!existsSync(rostersPath)) {
    return [];
  }

  const rosters = readJson<SleeperRoster[]>(rostersPath);
  const rosterToOwnerId = new Map<number, string>();

  rosters.forEach((roster) => {
    const ownerId = getOwnerIdBySleeperUserId(roster.owner_id);

    if (ownerId) {
      rosterToOwnerId.set(roster.roster_id, ownerId);
    }
  });

  const championshipRosterPairs = getChampionshipRosterPairs(seasonDir);
  const matchups: HistoricalMatchup[] = [];

  for (let week = 1; week <= 17; week += 1) {
    const weekPath = path.join(
      seasonDir,
      `week-${String(week).padStart(2, "0")}.json`
    );

    if (!existsSync(weekPath)) {
      continue;
    }

    const weekEntries = readJson<SleeperMatchupEntry[]>(weekPath);
    const grouped = new Map<number, SleeperMatchupEntry[]>();

    weekEntries.forEach((entry) => {
      if (typeof entry.matchup_id !== "number") return;

      const existing = grouped.get(entry.matchup_id) ?? [];
      existing.push(entry);
      grouped.set(entry.matchup_id, existing);
    });

    grouped.forEach((entries) => {
      if (entries.length !== 2) return;

      const [entryA, entryB] = entries;
      const ownerAId = rosterToOwnerId.get(entryA.roster_id);
      const ownerBId = rosterToOwnerId.get(entryB.roster_id);

      if (!ownerAId || !ownerBId) return;

      const ownerAScore = getScore(entryA);
      const ownerBScore = getScore(entryB);

      if (
        ownerAScore === null ||
        ownerBScore === null ||
        (ownerAScore === 0 && ownerBScore === 0)
      ) {
        return;
      }

      const { winnerOwnerId, loserOwnerId } = getWinnerLoser(
        ownerAId,
        ownerBId,
        ownerAScore,
        ownerBScore
      );

      matchups.push({
        season,
        week,
        type: getMatchupType(week, entryA, entryB, championshipRosterPairs),
        ownerAId,
        ownerBId,
        ownerAScore,
        ownerBScore,
        winnerOwnerId,
        loserOwnerId,
        notes: ["Generated from Sleeper matchup data."],
      });
    });
  }

  return matchups;
}

export function generateHistoricalMatchups(): HistoricalMatchup[] {
  if (!existsSync(DATA_ROOT)) {
    return [];
  }

  return readdirSync(DATA_ROOT)
    .filter((entry) => /^\d{4}$/.test(entry))
    .map((entry) => Number(entry))
    .filter((season) => season < LCC_CURRENT_SEASON)
    .sort((a, b) => a - b)
    .flatMap((season) => generateSeasonMatchups(season));
}