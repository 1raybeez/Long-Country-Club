import Link from "next/link";
import { RETIRED_LCC_OWNERS, type LccOwner } from "@/lib/lccOwners";
import { OwnerCard, OwnerGrid, SectionHeader } from "../directoryComponents";

const RETIRED_OWNER_IDS: readonly string[] = [
  "david-beasley",
  "david-gross",
  "chris-hofstede",
  "matt-hinkle",
  "chris-morgan",
  "dj-king",
  "mike-lastfogel",
  "tommy-eckert",
  "dan-lowery",
  "keith-douglas",
  "junior",
  "jd-wylie",
  "jay",
  "chris-boschen",
  "bj",
  "bernie-stewart",
];

export default function RetiredManagersPage() {
  const groups = getRetiredGroups();
  const retiredOwnerCount = groups.reduce(
    (count, group) => count + group.owners.length,
    0
  );

  return (
    <main className="lcc-page">
      <div className="lcc-container py-8 sm:py-12 lg:py-14">
        <header className="lcc-card overflow-hidden">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <div>
              <div className="lcc-badge">Long Country Club</div>
              <h1 className="mt-4 font-serif text-5xl font-black uppercase italic leading-none text-[var(--lcc-text)] sm:text-6xl">
                Retired Legends
              </h1>
              <p className="mt-4 max-w-3xl font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)] sm:text-base">
                Former owners, founding members, and memorial entries from the
                league&apos;s continuous history since 2003.
              </p>
            </div>

            <div className="rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-4">
              <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
                Retired Owner Count
              </p>
              <p className="mt-2 font-serif text-5xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
                {retiredOwnerCount}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-4">
            <Link href="/managers" className="lcc-button lcc-button-secondary">
              Active Owners
            </Link>
            <span className="lcc-button">Retired Owners</span>
          </div>
        </header>

        <div className="mt-10 space-y-12">
          {groups.map((group) => (
            <section key={group.title}>
              <SectionHeader
                eyebrow={group.eyebrow}
                title={group.title}
                count={group.owners.length}
                description={group.description}
                tone={group.tone}
              />
              <OwnerGrid compact>
                {group.owners.map((owner) => (
                  <OwnerCard key={owner.id} owner={owner} tone={group.tone} />
                ))}
              </OwnerGrid>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function getRetiredGroups() {
  const retiredOwners = orderOwners(RETIRED_LCC_OWNERS, RETIRED_OWNER_IDS);
  const claimedOwnerIds = new Set<string>();

  const inMemoriam = claimOwners(
    retiredOwners.filter((owner) => owner.inMemoriam),
    claimedOwnerIds
  );
  const originalOwners = claimOwners(
    retiredOwners.filter((owner) => owner.original2003Owner),
    claimedOwnerIds
  );
  const retiredLegends = claimOwners(retiredOwners, claimedOwnerIds);

  return [
    {
      eyebrow: "Memorial Table",
      title: "In Memoriam",
      description:
        "Original members whose place in the clubhouse remains part of LCC history.",
      owners: inMemoriam,
      tone: "memorial" as const,
    },
    {
      eyebrow: "Founding Class",
      title: "Original Club Members",
      description:
        "The early ownership class that helped build the league from its 2003 roots.",
      owners: originalOwners,
      tone: "founding" as const,
    },
    {
      eyebrow: "Legacy Owners",
      title: "Retired Legends",
      description:
        "Former managers, champions, and personalities from the long LCC timeline.",
      owners: retiredLegends,
      tone: "retired" as const,
    },
  ];
}

function claimOwners(
  owners: readonly LccOwner[],
  claimedOwnerIds: Set<string>
): LccOwner[] {
  const availableOwners = owners.filter((owner) => !claimedOwnerIds.has(owner.id));

  for (const owner of availableOwners) {
    claimedOwnerIds.add(owner.id);
  }

  return availableOwners;
}

function orderOwners(
  owners: readonly LccOwner[],
  orderedIds: readonly string[]
): LccOwner[] {
  const ownersById = new Map(owners.map((owner) => [owner.id, owner]));

  return orderedIds
    .map((id) => ownersById.get(id))
    .filter((owner): owner is LccOwner => Boolean(owner));
}
