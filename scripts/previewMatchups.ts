import { loadAllMatchups } from "../lib/history/matchups";

const matchups = loadAllMatchups();

console.log("LCC Matchup History Preview");
console.log("===========================");
console.log(`Total matchups: ${matchups.length}`);