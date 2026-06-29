import { loadAllSeasonSummaries } from "../lib/history/seasonSummary";
import { resolveOwner } from "../lib/ownerRegistry";

function ownerName(ownerId: string | null): string {
  if (!ownerId) {
    return "n/a";
  }

  return resolveOwner(ownerId)?.displayName ?? ownerId;
}

const summaries = loadAllSeasonSummaries();

console.log("LCC Season Summary Preview");
console.log("==========================");
console.log(`Seasons: ${summaries.length}`);
console.log("");

for (const summary of summaries) {
  console.log(
    [
      summary.season,
      summary.era ?? "unknown-era",
      `Champion: ${ownerName(summary.championOwnerId)}`,
      `Runner-up: ${ownerName(summary.runnerUpOwnerId)}`,
      `Third: ${ownerName(summary.thirdPlaceOwnerId)}`,
      `Toilet Bowl: ${ownerName(summary.toiletBowlOwnerId)}`,
      `Financial: ${summary.financial ? "yes" : "no"}`,
    ].join(" | ")
  );
}