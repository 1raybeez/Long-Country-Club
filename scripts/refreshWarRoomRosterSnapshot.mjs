import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const leagueId = "1312148925091692544";
const season = 2026;
const endpoint = `https://api.sleeper.app/v1/league/${leagueId}/rosters`;
const outputPath = join(process.cwd(), "data/current/rosters/2026.json");

const response = await fetch(endpoint, { cache: "no-store" });
if (!response.ok) {
  throw new Error(`Sleeper roster refresh failed: ${response.status}`);
}

const rosters = await response.json();
if (!Array.isArray(rosters) || rosters.length !== 12) {
  throw new Error(`Expected 12 Sleeper rosters, received ${rosters?.length ?? 0}`);
}

const normalizedRosters = rosters
  .sort((a, b) => a.roster_id - b.roster_id)
  .map((roster) => {
    const players = [...new Set(roster.players ?? [])];
    const starters = [...new Set(roster.starters ?? [])];
    const reserve = [...new Set(roster.reserve ?? [])];
    const taxi = [...new Set(roster.taxi ?? [])];

    if (reserve.some((playerId) => !players.includes(playerId))) {
      throw new Error(`Reserve player is missing from players for roster ${roster.roster_id}`);
    }
    if (taxi.some((playerId) => !players.includes(playerId))) {
      throw new Error(`Taxi player is missing from players for roster ${roster.roster_id}`);
    }
    if (reserve.some((playerId) => taxi.includes(playerId))) {
      throw new Error(`Reserve/taxi overlap for roster ${roster.roster_id}`);
    }

    return {
      rosterId: roster.roster_id,
      ownerId: null,
      sleeperUserId: roster.owner_id ?? null,
      players,
      starters,
      reserve,
      taxi,
    };
  });

// Owner IDs are populated from the repository's canonical Sleeper directory at
// refresh time so the artifact remains small and War Room filtering stays local.
const ownerDirectory = {
  "342828350391230464": "ray-long",
  "466780021365665792": "bill-gross",
  "466638004102885376": "keith-winder",
  "467786127214899200": "rob-jenkins",
  "466645286870052864": "earl-perkins",
  "356621920969555968": "jeffrey-hudgins",
  "466797853767888896": "tyrone-poist",
  "346727603970973696": "ben-isbell",
  "466645950710935552": "loren-michaels",
  "466659300316540928": "mike-mcburnie",
  "468192726756618240": "anthony-martinez",
  "817056809218080768": "mike-estes",
};

for (const roster of normalizedRosters) {
  roster.ownerId = ownerDirectory[roster.sleeperUserId];
  if (!roster.ownerId) {
    throw new Error(`Missing canonical owner mapping for roster ${roster.rosterId}`);
  }
}

const artifact = {
  season,
  leagueId,
  capturedAt: new Date().toISOString(),
  source: {
    provider: "Sleeper",
    endpoint,
    retrieval: "explicit-refresh",
  },
  rosters: normalizedRosters,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`Refreshed ${artifact.rosters.length} War Room rosters at ${artifact.capturedAt}`);
