"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { SectionHeader } from "./directoryComponents";
import {
  ACTIVE_LCC_OWNERS,
  getLccOwnerProfileHref,
  type LccOwner,
  type LccOwnerActiveDivision,
} from "@/lib/lccOwners";

type ActiveView = "all" | "division";

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
  const [activeView, setActiveView] = useState<ActiveView>("all");
  const activeOwners = ACTIVE_DIVISIONS.flatMap((division) =>
    getDivisionOwners(division)
  );

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

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              className="bg-[#1A472A] px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white"
              aria-current="page"
            >
              Active Owners
            </button>
            <Link
              href="/managers/retired"
              className="border border-[#1A472A]/20 px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-[#1A472A] hover:text-white"
            >
              Retired Owners
            </Link>
          </div>
        </header>

        <section className="mb-10 flex flex-col gap-4 border border-[#1A472A]/15 bg-white/60 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#1A472A]/50">
              Active Owner View
            </p>
            <p className="mt-1 text-sm font-semibold text-[#1A472A]/70">
              Show the full current lineup, or split it by LCC&apos;s cultural
              divisions.
            </p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <ToggleButton
              isActive={activeView === "all"}
              onClick={() => setActiveView("all")}
            >
              All Owners
            </ToggleButton>
            <ToggleButton
              isActive={activeView === "division"}
              onClick={() => setActiveView("division")}
            >
              By Division
            </ToggleButton>
          </div>
        </section>

        {activeView === "all" ? (
          <section>
            <SectionHeader
              eyebrow="Active Owners"
              title="All Owners"
              count={activeOwners.length}
            />
            <ActiveOwnerGrid>
              {activeOwners.map((owner) => (
                <ActiveOwnerCard key={owner.id} owner={owner} />
              ))}
            </ActiveOwnerGrid>
          </section>
        ) : (
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
                  <ActiveOwnerGrid>
                    {owners.map((owner) => (
                      <ActiveOwnerCard key={owner.id} owner={owner} />
                    ))}
                  </ActiveOwnerGrid>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function ToggleButton({
  children,
  isActive,
  onClick,
}: {
  children: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all sm:flex-none ${
        isActive
          ? "bg-[#1A472A] text-white"
          : "border border-[#1A472A]/20 bg-transparent text-[#1A472A] hover:bg-[#1A472A] hover:text-white"
      }`}
      aria-pressed={isActive}
    >
      {children}
    </button>
  );
}

function ActiveOwnerGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {children}
    </div>
  );
}

function ActiveOwnerCard({ owner }: { owner: LccOwner }) {
  return (
    <Link
      href={getLccOwnerProfileHref(owner)}
      className="group block h-full border border-[#1A472A]/15 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#C5A059] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
    >
      <article className="flex h-full flex-col">
        <div className="relative h-52 overflow-hidden bg-[#1A472A]">
          <img
            src={`/managers/${owner.avatarFilename}`}
            alt={owner.nickname}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ objectPosition: "center 32%" }}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70">
              Current LCC Team
            </p>
            <h2 className="mt-1 text-2xl font-black uppercase italic leading-none tracking-tight text-white">
              {owner.managerPage.sleeperName}
            </h2>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5 p-5">
          <div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <OwnerBadges owner={owner} />
            </div>
            <h3 className="text-2xl font-black uppercase italic leading-tight tracking-tight text-[#1A472A]">
              {owner.displayName}
            </h3>
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[#1A472A]/50">
              {owner.nickname}
            </p>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-3 border-t border-[#1A472A]/10 pt-4">
            <DirectoryFact
              label="First Season"
              value={owner.joinedYear ? String(owner.joinedYear) : "Unknown"}
            />
            <DirectoryFact
              label="Division"
              value={owner.activeDivision ?? "Active"}
            />
          </div>
        </div>
      </article>
    </Link>
  );
}

function OwnerBadges({ owner }: { owner: LccOwner }) {
  return (
    <>
      <Badge tone="green">Active Owner</Badge>
      {owner.founder && <Badge tone="gold">Founder</Badge>}
      {owner.commissioner && <Badge tone="gold">Commissioner</Badge>}
      {owner.original2003Owner && (
        <Badge tone="cream">Original 2003 Owner</Badge>
      )}
    </>
  );
}

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "green" | "gold" | "cream";
}) {
  const toneClass = {
    green: "bg-[#1A472A] text-white",
    gold: "bg-[#C5A059] text-black",
    cream: "bg-[#F9F7F2] text-[#1A472A] border border-[#1A472A]/15",
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
