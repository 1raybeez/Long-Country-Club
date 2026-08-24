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
    <main className="lcc2-page-shell">
      <div className="lcc2-page-container">
        <header className="lcc2-card lcc2-card--raised overflow-hidden">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <div>
              <p className="lcc2-label text-[var(--lcc-brand-primary)]">Managers</p>
              <h1 className="lcc2-home-identity__title mt-2">
                League Owners
              </h1>
              <p className="lcc2-home-identity__supporting max-w-3xl">
                The current Long Country Club franchise directory, organized for quick owner and profile discovery.
              </p>
            </div>

            <div className="lcc2-metric-card">
              <p className="lcc2-metric-card__label">Active owners</p>
              <p className="lcc2-metric-card__value">
                {activeOwners.length}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <nav className="flex flex-wrap gap-2" aria-label="Manager sections">
              <span className="lcc2-button lcc2-button--primary">Active Owners</span>
              <Link
                href="/managers/retired"
                className="lcc2-button lcc2-button--secondary"
              >
                Retired Owners
              </Link>
            </nav>

            <div className="flex gap-1 rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] p-1">
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
              application
            />
            <OwnerGrid directory>
              {activeOwners.map((owner) => (
                <OwnerCard key={owner.id} owner={owner} compact />
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
                    application
                  />
                  <OwnerGrid directory>
                    {owners.map((owner) => (
                      <OwnerCard
                        key={owner.id}
                        owner={owner}
                        tone={divisionCopy.tone}
                        compact
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
