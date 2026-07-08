import { getLineupsForMatchup } from "../lib/history/lineups";
import { getOwnerById } from "../lib/ownerRegistry";

const season = 2025;
const week = 17;
const ownerAId = "ray-long";
const ownerBId = "ben-isbell";

const lineups = getLineupsForMatchup({
  season,
  week,
  ownerAId,
  ownerBId,
});

function ownerName(ownerId: string) {
  return getOwnerById(ownerId)?.displayName ?? ownerId;
}

console.log("LCC Lineup Preview");
console.log("==================");
console.log(`${season} Week ${week}`);
console.log("");

for (const [label, lineup] of [
  [ownerName(ownerAId), lineups.ownerA],
  [ownerName(ownerBId), lineups.ownerB],
] as const) {
  console.log(label);
  console.log("-".repeat(label.length));

  if (!lineup) {
    console.log("No lineup found.");
    console.log("");
    continue;
  }

  console.log(`LCC Owner ID: ${lineup.ownerId}`);
  console.log(`Sleeper User ID: ${lineup.sleeperUserId}`);
  console.log(`Roster: ${lineup.rosterId}`);
  console.log(`Matchup ID: ${lineup.matchupId}`);
  console.log(`Points: ${lineup.points}`);
  console.log("Starters:");

  lineup.starters.forEach((player) => {
    console.log(
      `${player.slot}. ${player.playerId} | ${player.points ?? "—"} | ${
        player.imageUrl ?? "no image"
      }`
    );
  });

  console.log("");
}