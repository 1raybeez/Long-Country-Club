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
    <main className="lcc2-page-shell">
      <div className="lcc2-page-container">
        <header className="lcc2-card lcc2-card--raised overflow-hidden">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <div>
              <p className="lcc2-label text-[var(--lcc-brand-primary)]">Managers</p>
              <h1 className="lcc2-home-identity__title mt-2">
                Retired Owners
              </h1>
              <p className="lcc2-home-identity__supporting max-w-3xl">
                Former LCC owners and franchises preserved in league history.
              </p>
            </div>

            <div className="lcc2-metric-card">
              <p className="lcc2-metric-card__label">Retired owners</p>
              <p className="lcc2-metric-card__value">
                {retiredOwnerCount}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-4">
            <Link href="/managers" className="lcc2-button lcc2-button--secondary">
              Active Owners
            </Link>
            <span className="lcc2-button lcc2-button--primary">Retired Owners</span>
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
                application
              />
              <OwnerGrid directory>
                {group.owners.map((owner) => (
                  <OwnerCard key={owner.id} owner={owner} tone={group.tone} compact />
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
