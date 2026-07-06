import { getHeadToHead } from "../lib/history/headToHead";
import { getOwnerById } from "../lib/ownerRegistry";

const PAIRS: Array<[string, string]> = [
  ["ray-long", "bill-gross"],
  ["ray-long", "jeffrey-hudgins"],
  ["bill-gross", "keith-winder"],
  ["ben-isbell", "loren-michaels"],
  ["mike-mcburnie", "tyrone-poist"],
];

function name(ownerId: string) {
  return getOwnerById(ownerId)?.displayName ?? ownerId;
}

console.log("LCC Head-to-Head Preview");
console.log("========================");

for (const [ownerAId, ownerBId] of PAIRS) {
  const summary = getHeadToHead(ownerAId, ownerBId);

  console.log("");
  console.log(`${name(ownerAId)} vs ${name(ownerBId)}`);
  console.log("-".repeat(40));
  console.log(
    `Overall: ${summary.ownerAWins}-${summary.ownerBWins}-${summary.ties}`
  );
  console.log(`Meetings: ${summary.games}`);
  console.log(`Regular Season Games: ${summary.regularSeasonGames}`);
  console.log(`Playoff Games: ${summary.playoffGames}`);
  console.log(`Championship Games: ${summary.championshipGames}`);
  console.log(
    `Points: ${summary.ownerAPoints.toLocaleString()} - ${summary.ownerBPoints.toLocaleString()}`
  );
  console.log(`Average Margin: ${summary.averageMargin}`);
  console.log(
    `First/Last: ${summary.firstMeetingSeason ?? "n/a"}-${summary.lastMeetingSeason ?? "n/a"}`
  );
}