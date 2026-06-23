import Link from "next/link";
import type { ReactNode } from "react";
import {
  ACTIVE_LCC_OWNERS,
  RETIRED_LCC_OWNERS,
  getLccOwnerProfileHref,
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

export default function ManagersPage() {
  const retiredOwners = orderOwners(RETIRED_LCC_OWNERS, RETIRED_OWNER_IDS);

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

          <section>
            <SectionHeader
              eyebrow="Legacy"
              title="Retired Legends"
              count={retiredOwners.length}
            />
            <OwnerGrid>
              {retiredOwners.map((owner) => (
                <OwnerCard key={owner.id} owner={owner} />
              ))}
            </OwnerGrid>
          </section>
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

function SectionHeader({
  eyebrow,
  title,
  count,
}: {
  eyebrow: string;
  title: string;
  count: number;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-[#1A472A]/15 pb-3">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#1A472A]/50">
          {eyebrow}
        </p>
        <h2 className="text-2xl font-black uppercase italic tracking-tight">
          {title}
        </h2>
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-[#1A472A]/50">
        {count} Owners
      </p>
    </div>
  );
}

function OwnerGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

function OwnerCard({ owner }: { owner: LccOwner }) {
  const isActive = owner.status === "active";

  return (
    <Link
      href={getLccOwnerProfileHref(owner)}
      className="group block h-full border border-[#1A472A]/15 bg-white/75 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#C5A059] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
    >
      <article className="flex h-full flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border-4 border-white bg-white shadow-md">
            <img
              src={`/managers/${owner.avatarFilename}`}
              alt={owner.nickname}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <OwnerBadges owner={owner} />
            </div>
            <h3 className="text-xl font-black uppercase italic leading-tight tracking-tight text-[#1A472A]">
              {owner.displayName}
            </h3>
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[#1A472A]/50">
              {owner.nickname}
            </p>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3 border-t border-[#1A472A]/10 pt-4">
          <DirectoryFact
            label={isActive ? "Current LCC Team" : "Status"}
            value={isActive ? owner.managerPage.sleeperName : "Retired Legend"}
          />
          <DirectoryFact
            label="First Season"
            value={owner.joinedYear ? String(owner.joinedYear) : "Unknown"}
          />
        </div>
      </article>
    </Link>
  );
}

function OwnerBadges({ owner }: { owner: LccOwner }) {
  return (
    <>
      <Badge tone={owner.status === "active" ? "green" : "gray"}>
        {owner.status === "active" ? "Active Owner" : "Retired Legend"}
      </Badge>
      {owner.founder && <Badge tone="gold">Founder</Badge>}
      {owner.commissioner && <Badge tone="gold">Commissioner</Badge>}
      {owner.original2003Owner && (
        <Badge tone="cream">Original 2003 Owner</Badge>
      )}
      {owner.inMemoriam && <Badge tone="black">In Memoriam</Badge>}
    </>
  );
}

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "green" | "gold" | "cream" | "gray" | "black";
}) {
  const toneClass = {
    green: "bg-[#1A472A] text-white",
    gold: "bg-[#C5A059] text-black",
    cream: "bg-[#F9F7F2] text-[#1A472A] border border-[#1A472A]/15",
    gray: "bg-gray-200 text-gray-700",
    black: "bg-black text-white",
  }[tone];

  return (
    <span
      className={`inline-flex px-2 py-1 text-[8px] font-black uppercase leading-none tracking-widest ${toneClass}`}
    >
      {children}
    </span>
  );
}

function DirectoryFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[8px] font-black uppercase tracking-widest text-[#1A472A]/45">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black uppercase italic tracking-tight text-[#1A472A]">
        {value}
      </p>
    </div>
  );
}
