import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const leagueIds = {
  2021: "682304920455544832",
  2022: "817078396659036160",
  2023: "918202561050685440",
  2024: "1048290254903463936",
  2025: "1199899847029698560",
  2026: "1312148925091692544",
};
const seasons = Object.keys(leagueIds).map(Number);
const weeks = Array.from({ length: 19 }, (_, index) => index);

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

const retrievedAt = new Date().toISOString();
const rawRoot = path.join(root, "data/source/sleeper/transactions");
await fs.mkdir(rawRoot, { recursive: true });

const manifest = {
  schemaVersion: 1,
  source: "Sleeper public API",
  endpointTemplate: "https://api.sleeper.app/v1/league/{leagueId}/transactions/{week}",
  seasons,
  weeks,
  retrievedAt,
  records: {},
};

for (const season of seasons) {
  const leagueId = leagueIds[season];
  const rows = [];
  for (const week of weeks) {
    const endpoint = `https://api.sleeper.app/v1/league/${leagueId}/transactions/${week}`;
    const transactions = await fetchJson(endpoint);
    rows.push({ leagueId, season, week, endpoint, retrievedAt, transactions });
  }
  const output = { schemaVersion: 1, leagueId, season, retrievedAt, weeks: rows };
  await fs.writeFile(path.join(rawRoot, `${season}.json`), `${JSON.stringify(output, null, 2)}\n`);
  manifest.records[season] = {
    leagueId,
    weeksQueried: weeks,
    transactionRecords: rows.reduce((total, row) => total + row.transactions.length, 0),
    endpoint: `https://api.sleeper.app/v1/league/${leagueId}/transactions/{week}`,
  };
}

await fs.writeFile(path.join(rawRoot, "source-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest.records, null, 2));
