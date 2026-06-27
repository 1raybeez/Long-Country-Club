import {
  LCC_OWNER_REGISTRY,
  normalizeOwnerAlias,
  resolveOwner,
} from "../lib/ownerRegistry";

const SAMPLE_ALIASES = [
  "Mike M",
  "Mike E",
  "Mike L",
  "Jeff",
  "Jeffrey",
  "EP",
  "Earl",
  "KW",
  "Keith W",
  "KD",
  "Keith D",
];

printSection("Owner registry");
console.log(`Total registered owners: ${LCC_OWNER_REGISTRY.length}`);

printSection("Aliases by owner");
LCC_OWNER_REGISTRY.forEach((entry) => {
  console.log(
    `${entry.displayName} (${entry.ownerId}, ${entry.status}): ${entry.aliases.join(
      ", "
    )}`
  );
});

printSection("Duplicate aliases");
const duplicateAliases = getDuplicateAliases();

if (duplicateAliases.length === 0) {
  console.log("None");
} else {
  duplicateAliases.forEach(({ alias, owners }) => {
    console.log(`${alias}: ${owners.join(", ")}`);
  });
}

printSection("Sample resolutions");
SAMPLE_ALIASES.forEach((alias) => {
  const owner = resolveOwner(alias);

  console.log(
    `${alias} -> ${
      owner ? `${owner.ownerId} (${owner.displayName})` : "UNRESOLVED"
    }`
  );
});

function getDuplicateAliases() {
  const aliasesByNormalizedValue = new Map<string, Map<string, string>>();

  LCC_OWNER_REGISTRY.forEach((entry) => {
    entry.aliases.forEach((alias) => {
      const normalizedAlias = normalizeOwnerAlias(alias);
      const owners =
        aliasesByNormalizedValue.get(normalizedAlias) ?? new Map<string, string>();

      owners.set(entry.ownerId, entry.displayName);
      aliasesByNormalizedValue.set(normalizedAlias, owners);
    });
  });

  return Array.from(aliasesByNormalizedValue.entries())
    .flatMap(([alias, owners]) =>
      owners.size > 1
        ? [
            {
              alias,
              owners: Array.from(owners.entries()).map(
                ([ownerId, displayName]) => `${displayName} (${ownerId})`
              ),
            },
          ]
        : []
    )
    .sort((left, right) => left.alias.localeCompare(right.alias));
}

function printSection(title: string) {
  console.log("");
  console.log(`## ${title}`);
}
