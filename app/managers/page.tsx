"use client";

import Link from "next/link";
import { useState } from "react";
import { OwnerCard, OwnerGrid, SectionHeader } from "./directoryComponents";
import {
  ACTIVE_LCC_OWNERS,
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

const DIVISION_COPY: Record<
  LccOwnerActiveDivision,
  {
    eyebrow: string;
    description: string;
    tone: "legacy" | "challenger";
  }
> = {
  OGs: {
    eyebrow: "Legacy Division",
    description:
      "The original clubhouse spine: long-tenured owners, old draft scars, and decades of LCC history.",
    tone: "legacy",
  },
  Newbies: {
    eyebrow: "Challenger Division",
    description:
      "The modern wave of active contenders pushing the Dynasty Era forward.",
    tone: "challenger",
  },
};

export default function ManagersPage() {
  const [activeView, setActiveView] = useState<ActiveView>("all");
  const activeOwners = ACTIVE_DIVISIONS.flatMap((division) =>
    getDivisionOwners(division)
  );

  return (
    <main className="lcc-page">
      <div className="lcc-container py-8 sm:py-12 lg:py-14">
        <header className="lcc-card overflow-hidden">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <div>
              <div className="lcc-badge">Long Country Club</div>
              <h1 className="mt-4 font-serif text-5xl font-black uppercase italic leading-none text-[var(--lcc-text)] sm:text-6xl">
                Member Directory
              </h1>
              <p className="mt-4 max-w-3xl font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)] sm:text-base">
                A premium clubhouse roster for LCC&apos;s active owners,
                franchises, divisions, and member profile pages.
              </p>
            </div>

            <div className="rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-4">
              <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
                Active Owner Count
              </p>
              <p className="mt-2 font-serif text-5xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
                {activeOwners.length}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <nav className="flex flex-wrap gap-2" aria-label="Manager sections">
              <span className="lcc-button">Active Owners</span>
              <Link
                href="/managers/retired"
                className="lcc-button lcc-button-secondary"
              >
                Retired Owners
              </Link>
            </nav>

            <div className="flex gap-2 rounded-full border border-[var(--lcc-border)] bg-[var(--lcc-surface)] p-1">
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
          </div>
        </header>

        {activeView === "all" ? (
          <section className="mt-10">
            <SectionHeader
              eyebrow="Active Roster"
              title="All Active Owners"
              count={activeOwners.length}
              description="Every current Long Country Club franchise in one polished member directory."
            />
            <OwnerGrid>
              {activeOwners.map((owner) => (
                <OwnerCard key={owner.id} owner={owner} />
              ))}
            </OwnerGrid>
          </section>
        ) : (
          <div className="mt-10 space-y-12">
            {ACTIVE_DIVISIONS.map((division) => {
              const owners = getDivisionOwners(division);
              const divisionCopy = DIVISION_COPY[division];

              return (
                <section key={division}>
                  <SectionHeader
                    eyebrow={divisionCopy.eyebrow}
                    title={division}
                    count={owners.length}
                    description={divisionCopy.description}
                    tone={divisionCopy.tone}
                  />
                  <OwnerGrid>
                    {owners.map((owner) => (
                      <OwnerCard
                        key={owner.id}
                        owner={owner}
                        tone={divisionCopy.tone}
                      />
                    ))}
                  </OwnerGrid>
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
      className={[
        "min-h-10 rounded-full px-4 font-ui text-xs font-black uppercase transition-colors",
        isActive
          ? "bg-[var(--lcc-green-deep)] text-[var(--lcc-surface)]"
          : "text-[var(--lcc-text-muted)] hover:text-[var(--lcc-text)]",
      ].join(" ")}
      aria-pressed={isActive}
    >
      {children}
    </button>
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
