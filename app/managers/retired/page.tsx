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

  return (
    <main className="min-h-screen bg-[#F9F7F2] px-6 py-10 text-[#1A472A] md:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 border-b-8 border-[#C5A059] pb-8">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#1A472A]/60">
            Long Country Club
          </p>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter md:text-6xl">
                Retired Legends
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#1A472A]/70">
                Former LCC owners, original members, and memorial entries from
                the league&apos;s continuous history since 2003.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/managers"
                className="w-fit bg-[#1A472A] px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#C5A059] hover:text-black"
              >
                Active Managers
              </Link>
              <Link
                href="/"
                className="w-fit border border-[#1A472A]/20 px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-[#1A472A] hover:text-white"
              >
                Home
              </Link>
            </div>
          </div>
        </header>

        <div className="space-y-14">
          {groups.map((group) => (
            <section key={group.title}>
              <SectionHeader
                eyebrow={group.eyebrow}
                title={group.title}
                count={group.owners.length}
              />
              <OwnerGrid>
                {group.owners.map((owner) => (
                  <OwnerCard key={owner.id} owner={owner} />
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
      eyebrow: "Legacy",
      title: "In Memoriam",
      owners: inMemoriam,
    },
    {
      eyebrow: "Founding Class",
      title: "Original 2003 Owners",
      owners: originalOwners,
    },
    {
      eyebrow: "Retired",
      title: "Retired Legends",
      owners: retiredLegends,
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
