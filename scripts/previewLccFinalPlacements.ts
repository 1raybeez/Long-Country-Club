import {
  ALL_LCC_OWNERS,
  type LccOwner,
} from "../lib/lccOwners";
import {
  LCC_FINAL_PLACEMENTS,
  LCC_FINAL_PLACEMENT_ALIAS_TO_OWNER_ID,
  LCC_UNRESOLVED_FINAL_PLACEMENT_ALIASES,
  getLccChampionBySeason,
  getLccOwnerPlacementSummary,
} from "../lib/lccFinalPlacements";

const ownerIdCompatibility: Record<string, string> = {
  junior: "junior-duke",
  jay: "jay-g",
};

const ownerByCanonicalId = new Map(
  ALL_LCC_OWNERS.map((owner) => [canonicalizeOwnerId(owner.id), owner])
);

const allHistoryOwnerIds = Array.from(
  new Set(Object.values(LCC_FINAL_PLACEMENT_ALIAS_TO_OWNER_ID))
).sort();

const seasons = LCC_FINAL_PLACEMENTS.map(({ season }) => season);
const champions = LCC_FINAL_PLACEMENTS.map(({ season }) =>
  getLccChampionBySeason(season)
);
const summaries = allHistoryOwnerIds
  .map((ownerId) => getLccOwnerPlacementSummary(ownerId))
  .sort((a, b) => ownerDisplayName(a.ownerId).localeCompare(ownerDisplayName(b.ownerId)));

const toiletBowlCounts = new Map<string, number>();

LCC_FINAL_PLACEMENTS.forEach((season) => {
  const lastAlias = season.placements.at(-1);
  if (!lastAlias) return;

  const ownerId =
    LCC_FINAL_PLACEMENT_ALIAS_TO_OWNER_ID[
      lastAlias as keyof typeof LCC_FINAL_PLACEMENT_ALIAS_TO_OWNER_ID
    ];

  if (!ownerId) return;

  toiletBowlCounts.set(ownerId, (toiletBowlCounts.get(ownerId) ?? 0) + 1);
});

const conflicts = getOwnerDataConflicts();
const unknownHistoryOwnerIds = allHistoryOwnerIds.filter(
  (ownerId) => !ownerByCanonicalId.has(ownerId)
);

printSection("Seasons included");
console.log(
  `${Math.min(...seasons)}-${Math.max(...seasons)} (${seasons.length} completed seasons)`
);
console.log(seasons.join(", "));

printSection("Champion by season");
champions.forEach((champion) => {
  if (!champion) return;
  console.log(
    `${champion.season}: ${champion.alias} -> ${champion.ownerId ?? "UNRESOLVED"}`
  );
});

printSection("Owner title counts");
summaries.forEach((summary) => {
  console.log(
    `${ownerDisplayName(summary.ownerId)}: ${summary.championships.length} (${formatYears(
      summary.championships
    )})`
  );
});

printSection("Podium counts");
summaries.forEach((summary) => {
  console.log(
    `${ownerDisplayName(summary.ownerId)}: ${summary.podiumFinishes.length} (${formatYears(
      summary.podiumFinishes
    )})`
  );
});

printSection("Toilet bowl counts");
allHistoryOwnerIds
  .map((ownerId) => ({
    ownerId,
    count: toiletBowlCounts.get(ownerId) ?? 0,
  }))
  .sort((a, b) => b.count - a.count || ownerDisplayName(a.ownerId).localeCompare(ownerDisplayName(b.ownerId)))
  .forEach(({ ownerId, count }) => {
    console.log(`${ownerDisplayName(ownerId)}: ${count}`);
  });

printSection("Active seasons by owner");
summaries.forEach((summary) => {
  console.log(`${ownerDisplayName(summary.ownerId)}: ${summary.activeSeasonCount}`);
});

printSection("Tenure spans by owner");
summaries.forEach((summary) => {
  console.log(
    `${ownerDisplayName(summary.ownerId)}: ${formatTenureSpans(summary.tenureSpans)}`
  );
});

printSection("Unresolved / unknown owner aliases");
if (LCC_UNRESOLVED_FINAL_PLACEMENT_ALIASES.length === 0) {
  console.log("None");
} else {
  LCC_UNRESOLVED_FINAL_PLACEMENT_ALIASES.forEach((alias) => {
    console.log(alias);
  });
}

printSection("History owner IDs missing from lib/lccOwners.ts");
if (unknownHistoryOwnerIds.length === 0) {
  console.log("None");
} else {
  unknownHistoryOwnerIds.forEach((ownerId) => {
    console.log(ownerId);
  });
}

printSection("Conflicts vs lib/lccOwners.ts managerPage");
if (conflicts.length === 0) {
  console.log("None");
} else {
  conflicts.forEach((conflict) => {
    console.log(`${conflict.ownerName} (${conflict.ownerId})`);
    conflict.messages.forEach((message) => {
      console.log(`  - ${message}`);
    });
  });
}

function getOwnerDataConflicts() {
  return ALL_LCC_OWNERS.flatMap((owner) => {
    const ownerId = canonicalizeOwnerId(owner.id);
    const summary = getLccOwnerPlacementSummary(ownerId);
    const messages: string[] = [];
    const ownerTitles = owner.managerPage.titles;
    const calculatedTitles = summary.championships.length;

    if (ownerTitles !== calculatedTitles) {
      messages.push(
        `titles count: owner data ${ownerTitles}; placements ${calculatedTitles}`
      );
    }

    compareYearLists(
      "championship years",
      owner.managerPage.podiums.first,
      summary.championships,
      messages
    );
    compareYearLists(
      "runner-up years",
      owner.managerPage.podiums.second,
      summary.runnerUpFinishes,
      messages
    );
    compareYearLists(
      "third-place years",
      owner.managerPage.podiums.third,
      summary.thirdPlaceFinishes,
      messages
    );

    if (messages.length === 0) {
      return [];
    }

    return [
      {
        ownerId,
        ownerName: owner.displayName,
        messages,
      },
    ];
  });
}

function compareYearLists(
  label: string,
  ownerYears: readonly string[],
  placementYears: readonly number[],
  messages: string[]
) {
  const normalizedOwnerYears = ownerYears.map(Number).sort((a, b) => a - b);
  const normalizedPlacementYears = [...placementYears].sort((a, b) => a - b);

  if (normalizedOwnerYears.join(",") === normalizedPlacementYears.join(",")) {
    return;
  }

  messages.push(
    `${label}: owner data ${formatYears(normalizedOwnerYears)}; placements ${formatYears(
      normalizedPlacementYears
    )}`
  );
}

function ownerDisplayName(ownerId: string) {
  const owner = ownerByCanonicalId.get(canonicalizeOwnerId(ownerId));
  return owner?.displayName ?? ownerId;
}

function canonicalizeOwnerId(ownerId: string) {
  return ownerIdCompatibility[ownerId] ?? ownerId;
}

function formatYears(years: readonly number[]) {
  return years.length ? years.join(", ") : "none";
}

function formatTenureSpans(
  spans: readonly { startSeason: number; endSeason: number }[]
) {
  return spans.length
    ? spans
        .map(({ startSeason, endSeason }) =>
          startSeason === endSeason ? `${startSeason}` : `${startSeason}-${endSeason}`
        )
        .join(", ")
    : "none";
}

function printSection(title: string) {
  console.log("");
  console.log(`## ${title}`);
}
