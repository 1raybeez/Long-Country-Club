import fs from "node:fs";
import path from "node:path";

export type HistoricalPlayerMetadata = {
  readonly id: string;
  readonly name: string;
  readonly position: string | null;
  readonly team: string | null;
  readonly teamName: string | null;
  readonly isDefense: boolean;
  readonly imageUrl: string | null;
  readonly age?: number | null;
  readonly yearsExperience?: number | null;
  readonly birthDate?: string | null;
};

type SleeperPlayerRecord = {
  player_id?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  position?: string | null;
  fantasy_positions?: readonly string[] | null;
  team?: string | null;
  age?: number | null;
  years_exp?: number | null;
  birth_date?: string | null;
};

type SleeperPlayerCatalog = Record<string, SleeperPlayerRecord>;

const PLAYER_CATALOG_PATH = path.join(
  process.cwd(),
  "data/history/matchups/sleeper/players.json"
);

const NFL_TEAM_NAMES: Readonly<Record<string, string>> = {
  ARI: "Arizona Cardinals",
  ATL: "Atlanta Falcons",
  BAL: "Baltimore Ravens",
  BUF: "Buffalo Bills",
  CAR: "Carolina Panthers",
  CHI: "Chicago Bears",
  CIN: "Cincinnati Bengals",
  CLE: "Cleveland Browns",
  DAL: "Dallas Cowboys",
  DEN: "Denver Broncos",
  DET: "Detroit Lions",
  GB: "Green Bay Packers",
  HOU: "Houston Texans",
  IND: "Indianapolis Colts",
  JAX: "Jacksonville Jaguars",
  KC: "Kansas City Chiefs",
  LAC: "Los Angeles Chargers",
  LAR: "Los Angeles Rams",
  LV: "Las Vegas Raiders",
  MIA: "Miami Dolphins",
  MIN: "Minnesota Vikings",
  NE: "New England Patriots",
  NO: "New Orleans Saints",
  NYG: "New York Giants",
  NYJ: "New York Jets",
  PHI: "Philadelphia Eagles",
  PIT: "Pittsburgh Steelers",
  SEA: "Seattle Seahawks",
  SF: "San Francisco 49ers",
  TB: "Tampa Bay Buccaneers",
  TEN: "Tennessee Titans",
  WAS: "Washington Commanders",
};

let playerCatalog: SleeperPlayerCatalog | null = null;

function loadPlayerCatalog(): SleeperPlayerCatalog {
  if (playerCatalog) {
    return playerCatalog;
  }

  if (!fs.existsSync(PLAYER_CATALOG_PATH)) {
    playerCatalog = {};
    return playerCatalog;
  }

  playerCatalog = JSON.parse(
    fs.readFileSync(PLAYER_CATALOG_PATH, "utf8")
  ) as SleeperPlayerCatalog;

  return playerCatalog;
}

function getPlayerName(id: string, player: SleeperPlayerRecord | undefined) {
  const fullName = player?.full_name?.trim();

  if (fullName) {
    return fullName;
  }

  const combinedName = [player?.first_name, player?.last_name]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ")
    .trim();

  return combinedName || `Player ${id}`;
}

function isDefenseId(id: string, player: SleeperPlayerRecord | undefined) {
  return Object.prototype.hasOwnProperty.call(NFL_TEAM_NAMES, id) ||
    player?.position === "DEF";
}

export function isDefensePlayerId(playerId: string): boolean {
  return isDefenseId(playerId, loadPlayerCatalog()[playerId]);
}

export function getPlayerById(playerId: string): HistoricalPlayerMetadata | null {
  const id = playerId.trim();

  if (!id) {
    return null;
  }

  const player = loadPlayerCatalog()[id];
  const isDefense = isDefenseId(id, player);

  if (!player && !isDefense) {
    return null;
  }

  const team = isDefense ? id : player?.team ?? null;
  const teamName = team ? NFL_TEAM_NAMES[team] ?? null : null;

  return {
    id,
    name: isDefense ? teamName ?? `${id} Defense` : getPlayerName(id, player),
    position: isDefense
      ? "DST"
      : player?.position ?? player?.fantasy_positions?.[0] ?? null,
    team,
    teamName,
    isDefense,
    imageUrl: isDefense && team
      ? `https://sleepercdn.com/images/team_logos/nfl/${team.toLowerCase()}.png`
      : `https://sleepercdn.com/content/nfl/players/${id}.jpg`,
    age: typeof player?.age === "number" ? player.age : null,
    yearsExperience: typeof player?.years_exp === "number" ? player.years_exp : null,
    birthDate: player?.birth_date ?? null,
  };
}

export function resolvePlayer(playerId: string): HistoricalPlayerMetadata {
  return (
    getPlayerById(playerId) ?? {
      id: playerId,
      name: `Player ${playerId}`,
      position: null,
      team: null,
      teamName: null,
      isDefense: false,
      imageUrl: null,
      age: null,
      yearsExperience: null,
      birthDate: null,
    }
  );
}

export function getPlayersByIds(
  playerIds: readonly string[]
): readonly HistoricalPlayerMetadata[] {
  return playerIds.map(resolvePlayer);
}
