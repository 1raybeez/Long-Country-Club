import { getAllOwnerCareerSummaries } from "../lib/history/career";
import { resolveOwner } from "../lib/ownerRegistry";

const summaries = getAllOwnerCareerSummaries();

console.log("LCC Career Engine Preview");
console.log("=========================");
console.log(`Owners: ${summaries.length}`);
console.log("");

for (const summary of summaries) {
  const owner = resolveOwner(summary.ownerId);
  const name = owner?.displayName ?? summary.ownerId;

  console.log(
    [
      name,
      `${summary.seasons} seasons`,
      `${summary.championships} titles`,
      `${summary.podiums} podiums`,
      `${summary.toiletBowls} toilet bowls`,
      `avg finish ${summary.averageFinish ?? "n/a"}`,
    ].join(" | ")
  );
}