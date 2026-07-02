import { generateHistoricalMatchups } from "../lib/history/generateMatchups";

const matchups = generateHistoricalMatchups();

console.log("LCC Matchup Generator");
console.log("=====================");
console.log(`Generated matchups: ${matchups.length}`);