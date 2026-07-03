import { getOwnerMatchupSummary } from "../lib/history/ownerMatchupSummary";
import { getOwnerById } from "../lib/ownerRegistry";

const ownerIds = ["ray-long", "bill-gross", "ben-isbell", "jeffrey-hudgins"];

function name(ownerId: string | null) {
  if (!ownerId) return "none";
  return getOwnerById(ownerId)?.displayName ?? ownerId;
}

console.log("LCC Owner Matchup Summary Preview");
console.log("=================================");

for (const ownerId of ownerIds) {
  const summary = getOwnerMatchupSummary(ownerId);

  console.log("");
  console.log(name(ownerId));
  console.log(
    `${summary.wins}-${summary.losses}-${summary.ties} | ` +
      `${summary.games} games | ` +
      `win pct ${summary.winPercentage ?? "n/a"} | ` +
      `PF ${summary.pointsFor} | PA ${summary.pointsAgainst}`
  );
  console.log(
    `Playoffs: ${summary.playoffWins}-${summary.playoffLosses} | ` +
      `Favorite victim: ${name(summary.favoriteVictimOwnerId)} | ` +
      `Nemesis: ${name(summary.nemesisOwnerId)} | ` +
      `Top rivalry: ${name(summary.topRivalryOwnerId)}`
  );
}