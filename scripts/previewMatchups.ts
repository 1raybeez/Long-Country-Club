import { loadAllMatchups } from "../lib/history/matchups";

const matchups = loadAllMatchups();

const bySeason = new Map<number, number>();
const byType = new Map<string, number>();

matchups.forEach((matchup) => {
  bySeason.set(matchup.season, (bySeason.get(matchup.season) ?? 0) + 1);
  byType.set(matchup.type, (byType.get(matchup.type) ?? 0) + 1);
});

console.log("LCC Matchup History Preview");
console.log("===========================");
console.log(`Total matchups: ${matchups.length}`);
console.log("");

console.log("By season:");
for (const [season, count] of [...bySeason.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(`${season}: ${count}`);
}

console.log("");
console.log("By type:");
for (const [type, count] of [...byType.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`${type}: ${count}`);
}

console.log("");
console.log("Recent sample:");
for (const matchup of matchups.slice(-10)) {
  console.log(
    `${matchup.season} Week ${matchup.week} | ${matchup.type} | ${matchup.ownerAId} ${matchup.ownerAScore} vs ${matchup.ownerBId} ${matchup.ownerBScore}`
  );
}