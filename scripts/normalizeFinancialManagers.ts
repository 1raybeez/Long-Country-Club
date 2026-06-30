import fs from "node:fs";
import path from "node:path";
import { resolveOwner } from "../lib/ownerRegistry";

type FinancialJson = {
  season: number;
  leagueRules: unknown;
  managers: ManagerFinancialRecord[];
  awards: AwardRecord[];
  notes: string[];
};

type ManagerFinancialRecord = {
  managerId?: string;
  managerName: string;
  [key: string]: unknown;
};

type AwardRecord = {
  id: string;
  managerId?: string;
  managerName: string;
  [key: string]: unknown;
};

const shouldWrite = process.argv.includes("--write");
const financialDir = path.join(process.cwd(), "data/history/financial");

const seasonSpecificAliases: Record<number, Record<string, string>> = {
  2017: {
    Chris: "chris-hofstede",
  },
  2018: {
    Mike: "mike-mcburnie",
  },
  2019: {
    Mike: "mike-mcburnie",
  },
  2020: {
    Mike: "mike-mcburnie",
  },
  2021: {
    Mike: "mike-mcburnie",
  },
};

const files = fs
  .readdirSync(financialDir)
  .filter((file) => file.endsWith(".json"))
  .sort();

let filesChanged = 0;
let managerIdsAdded = 0;
let awardIdsAdded = 0;
const unresolved = new Map<string, Set<string>>();

function addUnresolved(season: number, value: string) {
  const key = String(season);

  if (!unresolved.has(key)) {
    unresolved.set(key, new Set());
  }

  unresolved.get(key)?.add(value);
}

function resolveManagerId(season: number, managerName: string): string | null {
  const seasonAlias = seasonSpecificAliases[season]?.[managerName];

  if (seasonAlias) {
    return seasonAlias;
  }

  const owner = resolveOwner(managerName);

  if (!owner) {
    addUnresolved(season, managerName);
    return null;
  }

  return owner.ownerId;
}

for (const file of files) {
  const filePath = path.join(financialDir, file);
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw) as FinancialJson;

  let changed = false;
  let fileManagerIdsAdded = 0;
  let fileAwardIdsAdded = 0;

  data.managers = data.managers.map((manager) => {
    if (manager.managerId) {
      return manager;
    }

    const ownerId = resolveManagerId(data.season, manager.managerName);

    if (!ownerId) {
      return manager;
    }

    changed = true;
    fileManagerIdsAdded += 1;
    managerIdsAdded += 1;

    return {
      ...manager,
      managerId: ownerId,
    };
  });

  data.awards = data.awards.map((award) => {
    if (award.managerId) {
      return award;
    }

    const ownerId = resolveManagerId(data.season, award.managerName);

    if (!ownerId) {
      return award;
    }

    changed = true;
    fileAwardIdsAdded += 1;
    awardIdsAdded += 1;

    return {
      ...award,
      managerId: ownerId,
    };
  });

  if (changed) {
    filesChanged += 1;

    if (shouldWrite) {
      fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
    }
  }

  console.log(
    [
      data.season,
      changed ? "changed" : "unchanged",
      `managerIds +${fileManagerIdsAdded}`,
      `awardIds +${fileAwardIdsAdded}`,
    ].join(" | ")
  );
}

console.log("");
console.log("LCC Financial Manager Normalization");
console.log("===================================");
console.log(`Mode: ${shouldWrite ? "WRITE" : "DRY RUN"}`);
console.log(`Files scanned: ${files.length}`);
console.log(`Files changed: ${filesChanged}`);
console.log(`Manager IDs added: ${managerIdsAdded}`);
console.log(`Award IDs added: ${awardIdsAdded}`);

if (unresolved.size) {
  console.log("");
  console.log("Unresolved manager names:");

  for (const [season, names] of unresolved.entries()) {
    console.log(`${season}: ${Array.from(names).join(", ")}`);
  }

  process.exitCode = 1;
} else {
  console.log("");
  console.log("Unresolved manager names: none");
}