import Link from "next/link";
import { OwnerCard, OwnerGrid, SectionHeader } from "./directoryComponents";
import {
  ACTIVE_LCC_OWNERS,
  type LccOwner,
  type LccOwnerActiveDivision,
} from "@/lib/lccOwners";

const ACTIVE_DIVISIONS: readonly LccOwnerActiveDivision[] = ["OGs", "Newbies"];

const ACTIVE_DIVISION_OWNER_IDS: Record<
  LccOwnerActiveDivision,
  readonly string[]
> = {
  OGs: [
    "ray-long",
    "bill-gross",
    "keith-winder",
    "rob-jenkins",
    "jeffrey-hudgins",
    "earl-perkins",
  ],
  Newbies: [
    "ben-isbell",
    "anthony-martinez",
    "mike-estes",
    "mike-mcburnie",
    "loren-michaels",
    "tyrone-poist",
  ],
};

export default function ManagersPage() {
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
                Manager Directory
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#1A472A]/70">
                LCC owner directory, continuous since 2003. Sleeper migration in
                2019. Dynasty Era since 2021.
              </p>
            </div>
            <Link
              href="/"
              className="w-fit border border-[#1A472A]/20 px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-[#1A472A] hover:text-white"
            >
              Home
            </Link>
            <Link
              href="/managers/retired"
              className="w-fit bg-[#1A472A] px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#C5A059] hover:text-black"
            >
              Retired Legends
            </Link>
          </div>
        </header>

        <div className="space-y-14">
          {ACTIVE_DIVISIONS.map((division) => {
            const owners = getDivisionOwners(division);

            return (
              <section key={division}>
                <SectionHeader
                  eyebrow="Active Division"
                  title={division}
                  count={owners.length}
                />
                <OwnerGrid>
                  {owners.map((owner) => (
                    <OwnerCard key={owner.id} owner={owner} />
                  ))}
                </OwnerGrid>
              </section>
            );
          })}

          <div className="border-t border-[#1A472A]/15 pt-8">
            <Link
              href="/managers/retired"
              className="inline-flex border border-[#1A472A]/20 px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-[#1A472A] hover:text-white"
            >
              View Retired Legends
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function getDivisionOwners(division: LccOwnerActiveDivision) {
  const divisionOwners = ACTIVE_LCC_OWNERS.filter(
    (owner) => owner.activeDivision === division
  );

  return orderOwners(divisionOwners, ACTIVE_DIVISION_OWNER_IDS[division]);
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
