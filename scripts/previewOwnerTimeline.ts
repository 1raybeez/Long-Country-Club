import { getOwnerTimeline } from "../lib/history/ownerTimeline";
import { getOwnerById } from "../lib/ownerRegistry";

const ownerIds = ["ray-long", "bill-gross", "tyrone-poist", "mike-mcburnie"];

console.log("LCC Owner Timeline Preview");
console.log("==========================");
console.log("");

for (const ownerId of ownerIds) {
  const owner = getOwnerById(ownerId);
  const timeline = getOwnerTimeline(ownerId);
  const ownerLabel = owner?.displayName ?? ownerId;

  console.log(ownerLabel);
  console.log("-".repeat(ownerLabel.length));
  console.log(
    [
      `${timeline.career.seasons} seasons`,
      `${timeline.career.championships} titles`,
      `${timeline.career.podiums} podiums`,
      `${timeline.career.toiletBowls} toilet bowls`,
      `avg finish ${timeline.career.averageFinish ?? "n/a"}`,
    ].join(" | ")
  );

  for (const season of timeline.seasons) {
    const badges = [
      season.isChampion ? "Champion" : null,
      season.isRunnerUp ? "Runner-up" : null,
      season.isThirdPlace ? "Third" : null,
      season.isToiletBowl ? "Toilet Bowl" : null,
    ].filter(Boolean);

    console.log(
      [
        season.season,
        season.era ?? "unknown",
        season.finalPlace ? `place ${season.finalPlace}` : "place n/a",
        season.payoutsReceived !== null
          ? `payouts $${season.payoutsReceived}`
          : "payouts n/a",
        season.balance !== null ? `net $${season.balance}` : "net n/a",
        badges.length ? badges.join(", ") : null,
      ]
        .filter(Boolean)
        .join(" | ")
    );
  }

  console.log("");
}