import { loadAllAwards } from "../lib/history/awards";
import { getOwnerById } from "../lib/ownerRegistry";

const awards = loadAllAwards();

function ownerName(ownerId?: string | null, managerName?: string | null) {
  if (ownerId) {
    return getOwnerById(ownerId)?.displayName ?? ownerId;
  }

  return managerName ?? "Unknown";
}

const byType = new Map<string, number>();
const byOwner = new Map<string, number>();

for (const award of awards) {
  byType.set(award.type, (byType.get(award.type) ?? 0) + 1);

  const ownerLabel = ownerName(award.ownerId, award.managerName);
  byOwner.set(ownerLabel, (byOwner.get(ownerLabel) ?? 0) + 1);
}

console.log("LCC Awards Preview");
console.log("==================");
console.log(`Total awards: ${awards.length}`);
console.log("");

console.log("Awards by type:");
for (const [type, count] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`${type}: ${count}`);
}

console.log("");
console.log("Top award counts:");
for (const [owner, count] of [...byOwner.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`${owner}: ${count}`);
}

console.log("");
console.log("Recent awards:");
for (const award of awards.slice(0, 20)) {
  console.log(
    [
      award.season,
      award.type,
      ownerName(award.ownerId, award.managerName),
      award.label,
      award.value !== undefined && award.value !== null ? award.value : null,
    ]
      .filter((value) => value !== null)
      .join(" | ")
  );
}