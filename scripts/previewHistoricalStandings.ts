import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import {
  LCC_OWNER_REGISTRY,
  resolveOwner,
  resolveOwnerId,
} from "../lib/ownerRegistry";
import type {
  SeasonStandingData,
  StandingEra,
  StandingRecord,
} from "../lib/types/standing";

const SOURCE_CSV_PATH = "data/source/archive/historical-data/final-standings.csv";
const TARGET_JSON_PATH = "data/history/standings/index.json";

const NULL_STANDING_FIELDS = {
  wins: null,
  losses: null,
  ties: null,
  pointsFor: null,
  pointsAgainst: null,
  division: null,
  playoffSeed: null,
  playoffResult: null,
} as const;

const shouldWrite = process.argv.includes("--write");

const sourceStandings = buildStandingsFromSourceCsv();

if (shouldWrite) {
  writeFileSync(
    join(process.cwd(), TARGET_JSON_PATH),
    `${JSON.stringify(sourceStandings, null, 2)}\n`
  );
}

const migratedStandings = loadMigratedStandings();
const sourceAudit = auditSourceAliases();

printPreview(migratedStandings, sourceAudit);

if (sourceAudit.unresolvedAliases.length > 0) {
  process.exitCode = 1;
}

if (JSON.stringify(migratedStandings) !== JSON.stringify(sourceStandings)) {
  console.log("");
  console.log("Source comparison");
  console.log("- Migrated standings do not match the source CSV parse.");
  process.exitCode = 1;
}

export function buildStandingsFromSourceCsv(): SeasonStandingData[] {
  const sourceCsv = readFileSync(join(process.cwd(), SOURCE_CSV_PATH), "utf8");
  const rows = parseCsvRows(sourceCsv);
  const seasonHeaders = rows[1] ?? [];
  const standingsBySeason = new Map<number, StandingRecord[]>();

  rows.slice(2).forEach((row) => {
    const finalPlaceValue = row[0]?.trim() ?? "";

    if (!/^\d+$/.test(finalPlaceValue)) {
      return;
    }

    const finalPlace = Number(finalPlaceValue);

    if (finalPlace <= 0) {
      return;
    }

    seasonHeaders.slice(1).forEach((seasonValue, index) => {
      const season = Number(seasonValue);
      const alias = row[index + 1]?.trim();

      if (!Number.isInteger(season) || !alias) {
        return;
      }

      const era = getStandingEra(season);
      const record: StandingRecord = {
        season,
        finalPlace,
        rank: finalPlace,
        era,
        ownerId: resolveOwnerId(alias),
        alias,
        ...NULL_STANDING_FIELDS,
      };

      standingsBySeason.set(season, [
        ...(standingsBySeason.get(season) ?? []),
        record,
      ]);
    });
  });

  return Array.from(standingsBySeason.entries())
    .map(([season, standings]) => ({
      season,
      era: getStandingEra(season),
      source: SOURCE_CSV_PATH,
      standings: standings.sort((left, right) => {
        return (left.finalPlace ?? 0) - (right.finalPlace ?? 0);
      }),
      notes: [],
    }))
    .filter((season) => season.standings.length > 0)
    .sort((left, right) => left.season - right.season);
}

function loadMigratedStandings(): SeasonStandingData[] {
  const targetPath = join(process.cwd(), TARGET_JSON_PATH);

  if (!existsSync(targetPath)) {
    return [];
  }

  return JSON.parse(readFileSync(targetPath, "utf8")) as SeasonStandingData[];
}

function auditSourceAliases() {
  const aliases = new Set(
    sourceStandings.flatMap((season) =>
      season.standings.flatMap((standing) =>
        standing.alias ? [standing.alias] : []
      )
    )
  );
  const unresolvedAliases = Array.from(aliases)
    .filter((alias) => !resolveOwnerId(alias))
    .sort((left, right) => left.localeCompare(right));
  const resolvedOwners = new Map<string, string>();

  Array.from(aliases).forEach((alias) => {
    const owner = resolveOwner(alias);

    if (owner) {
      resolvedOwners.set(owner.ownerId, owner.displayName);
    }
  });

  return {
    aliases: Array.from(aliases).sort((left, right) => left.localeCompare(right)),
    resolvedOwners,
    unresolvedAliases,
  };
}

function printPreview(
  standings: readonly SeasonStandingData[],
  sourceAudit: ReturnType<typeof auditSourceAliases>
) {
  const recordCount = standings.reduce(
    (total, season) => total + season.standings.length,
    0
  );

  printSection("Seasons migrated");
  console.log(
    standings.length
      ? `${formatSeasonRange(standings)} (${standings.length} seasons, ${recordCount} records)`
      : "None"
  );

  printSection("Owners resolved");
  console.log(
    `${sourceAudit.resolvedOwners.size} owners from ${sourceAudit.aliases.length} source aliases`
  );
  Array.from(sourceAudit.resolvedOwners.entries())
    .sort((left, right) => left[1].localeCompare(right[1]))
    .forEach(([ownerId, displayName]) => {
      console.log(`- ${displayName}: ${ownerId}`);
    });

  printSection("Unresolved aliases");
  if (sourceAudit.unresolvedAliases.length === 0) {
    console.log("- None");
  } else {
    sourceAudit.unresolvedAliases.forEach((alias) => {
      console.log(`- ${alias}`);
    });
  }

  printSection("Champions by season");
  standings.forEach((season) => {
    const champion = getStandingByFinalPlace(season, 1);
    console.log(`- ${season.season}: ${formatStandingOwner(champion)}`);
  });

  printSection("Toilet bowl by season");
  standings.forEach((season) => {
    const toiletBowl = [...season.standings].sort((left, right) => {
      return (right.finalPlace ?? 0) - (left.finalPlace ?? 0);
    })[0];

    console.log(`- ${season.season}: ${formatStandingOwner(toiletBowl)}`);
  });

  printSection("Podium counts summary");
  getPodiumSummaries(standings).forEach((summary) => {
    console.log(
      `- ${summary.displayName}: ${summary.total} podiums (${summary.gold} gold, ${summary.silver} silver, ${summary.bronze} bronze)`
    );
  });
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let isQuoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === '"') {
      if (isQuoted && nextChar === '"') {
        value += '"';
        index += 1;
      } else {
        isQuoted = !isQuoted;
      }
      continue;
    }

    if (char === "," && !isQuoted) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !isQuoted) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function getStandingEra(season: number): StandingEra {
  return season >= 2021 ? "dynasty" : "two-keeper";
}

function getStandingByFinalPlace(
  season: SeasonStandingData,
  finalPlace: number
) {
  return season.standings.find(
    (standing) => standing.finalPlace === finalPlace
  );
}

function formatStandingOwner(standing: StandingRecord | undefined) {
  if (!standing) {
    return "Unknown";
  }

  const owner = LCC_OWNER_REGISTRY.find(
    (entry) => entry.ownerId === standing.ownerId
  );

  return owner
    ? `${owner.displayName} (${owner.ownerId})`
    : `${standing.alias ?? "Unknown"} (${standing.ownerId ?? "unresolved"})`;
}

function getPodiumSummaries(standings: readonly SeasonStandingData[]) {
  const summaries = new Map<
    string,
    {
      displayName: string;
      gold: number;
      silver: number;
      bronze: number;
      total: number;
    }
  >();

  standings.forEach((season) => {
    season.standings.forEach((standing) => {
      if (!standing.ownerId || !standing.finalPlace || standing.finalPlace > 3) {
        return;
      }

      const owner = LCC_OWNER_REGISTRY.find(
        (entry) => entry.ownerId === standing.ownerId
      );
      const displayName = owner?.displayName ?? standing.ownerId;
      const summary =
        summaries.get(standing.ownerId) ??
        {
          displayName,
          gold: 0,
          silver: 0,
          bronze: 0,
          total: 0,
        };

      if (standing.finalPlace === 1) {
        summary.gold += 1;
      } else if (standing.finalPlace === 2) {
        summary.silver += 1;
      } else if (standing.finalPlace === 3) {
        summary.bronze += 1;
      }

      summary.total += 1;
      summaries.set(standing.ownerId, summary);
    });
  });

  return Array.from(summaries.values()).sort((left, right) => {
    return (
      right.total - left.total ||
      right.gold - left.gold ||
      left.displayName.localeCompare(right.displayName)
    );
  });
}

function formatSeasonRange(standings: readonly SeasonStandingData[]) {
  const seasons = standings.map((standing) => standing.season);

  return `${Math.min(...seasons)}-${Math.max(...seasons)}`;
}

function printSection(title: string) {
  console.log("");
  console.log(`## ${title}`);
}
