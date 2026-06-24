import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Crown, Shield, Trophy } from "lucide-react";
import { LCC_CURRENT_SEASON } from "@/lib/leagueConstants";
import { getLccOwnerProfileHref, type LccOwner } from "@/lib/lccOwners";

type DirectoryTone =
  | "default"
  | "legacy"
  | "challenger"
  | "memorial"
  | "founding"
  | "retired";

const toneClasses: Record<
  DirectoryTone,
  {
    panel: string;
    badge: string;
    accent: string;
  }
> = {
  default: {
    panel: "lcc-card",
    badge: "lcc-badge",
    accent: "bg-[var(--lcc-gold)]",
  },
  legacy: {
    panel:
      "border border-[var(--lcc-border-strong)] bg-[linear-gradient(135deg,var(--lcc-surface),var(--lcc-gold-soft))]",
    badge:
      "inline-flex w-fit items-center rounded-full border border-[var(--lcc-border-strong)] bg-[var(--lcc-gold-soft)] px-3 py-1 font-ui text-xs font-black uppercase text-[var(--lcc-text)]",
    accent: "bg-[var(--lcc-gold)]",
  },
  challenger: {
    panel:
      "border border-[var(--lcc-border)] bg-[linear-gradient(135deg,var(--lcc-surface),var(--lcc-surface-muted))]",
    badge:
      "inline-flex w-fit items-center rounded-full border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] px-3 py-1 font-ui text-xs font-black uppercase text-[var(--lcc-text)]",
    accent: "bg-[var(--lcc-green-deep)]",
  },
  memorial: {
    panel:
      "border border-[var(--lcc-border-strong)] bg-[linear-gradient(135deg,var(--lcc-surface),var(--lcc-surface-muted))]",
    badge:
      "inline-flex w-fit items-center rounded-full border border-[var(--lcc-border-strong)] bg-[var(--lcc-text)] px-3 py-1 font-ui text-xs font-black uppercase text-[var(--lcc-surface)]",
    accent: "bg-[var(--lcc-text)]",
  },
  founding: {
    panel:
      "border border-[var(--lcc-border-strong)] bg-[linear-gradient(135deg,var(--lcc-surface),var(--lcc-gold-soft))]",
    badge:
      "inline-flex w-fit items-center rounded-full border border-[var(--lcc-border-strong)] bg-[var(--lcc-gold-soft)] px-3 py-1 font-ui text-xs font-black uppercase text-[var(--lcc-text)]",
    accent: "bg-[var(--lcc-gold)]",
  },
  retired: {
    panel: "lcc-card-subtle",
    badge:
      "inline-flex w-fit items-center rounded-full border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] px-3 py-1 font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]",
    accent: "bg-[var(--lcc-text-muted)]",
  },
};

export function SectionHeader({
  eyebrow,
  title,
  count,
  description,
  tone = "default",
}: {
  eyebrow: string;
  title: string;
  count: number;
  description?: string;
  tone?: DirectoryTone;
}) {
  const toneClass = toneClasses[tone];

  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className={toneClass.badge}>
          <span className={`mr-2 h-2 w-2 rounded-full ${toneClass.accent}`} />
          {eyebrow}
        </div>
        <h2 className="mt-3 font-serif text-3xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-2xl font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)]">
            {description}
          </p>
        )}
      </div>
      <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
        {count} {count === 1 ? "Owner" : "Owners"}
      </p>
    </div>
  );
}

export function OwnerGrid({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          : "grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
      }
    >
      {children}
    </div>
  );
}

export function OwnerCard({
  owner,
  tone,
}: {
  owner: LccOwner;
  tone?: DirectoryTone;
}) {
  const isActive = owner.status === "active";
  const cardTone = tone ?? getOwnerTone(owner);
  const toneClass = toneClasses[cardTone];

  return (
    <Link
      href={getLccOwnerProfileHref(owner)}
      className={[
        "group block h-full overflow-hidden rounded-[var(--lcc-radius)] shadow-[var(--lcc-shadow-soft)] transition-all hover:-translate-y-1 hover:shadow-[var(--lcc-shadow)] focus:outline-none focus:ring-2 focus:ring-[var(--lcc-gold)]",
        toneClass.panel,
      ].join(" ")}
    >
      <article className="flex h-full flex-col">
        <div className="relative h-56 overflow-hidden bg-[var(--lcc-green-deep)]">
          <img
            src={`/managers/${owner.avatarFilename}`}
            alt={owner.nickname}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ objectPosition: "center 32%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <Badge>{isActive ? owner.activeDivision ?? "Active" : "Retired"}</Badge>
            {owner.inMemoriam && <Badge>In Memoriam</Badge>}
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="font-ui text-xs font-black uppercase text-white/70">
              {isActive ? "Current LCC Team" : "Last LCC Team"}
            </p>
            <h3 className="mt-1 font-serif text-2xl font-black uppercase italic leading-none text-white">
              {owner.managerPage.sleeperName}
            </h3>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5 p-5">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <OwnerBadges owner={owner} />
            </div>
            <h4 className="font-serif text-3xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
              {owner.displayName}
            </h4>
            <p className="mt-2 font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
              {owner.nickname}
            </p>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-3 border-t border-[var(--lcc-border)] pt-4">
            <DirectoryFact label="Tenure" value={formatTenure(owner)} />
            <DirectoryFact
              label="Championships"
              value={formatChampionships(owner.managerPage.titles)}
              icon={<Trophy className="h-3.5 w-3.5" aria-hidden="true" />}
            />
            <DirectoryFact
              label={isActive ? "Division" : "Status"}
              value={isActive ? owner.activeDivision ?? "Active" : "Retired"}
            />
            <DirectoryFact label="Profile" value="View Member" isAction />
          </div>
        </div>
      </article>
    </Link>
  );
}

function OwnerBadges({ owner }: { owner: LccOwner }) {
  return (
    <>
      <Badge>{owner.status === "active" ? "Active Owner" : "Retired Legend"}</Badge>
      {owner.founder && <Badge icon={<Crown className="h-3 w-3" />}>Founder</Badge>}
      {owner.commissioner && (
        <Badge icon={<Shield className="h-3 w-3" />}>Commissioner</Badge>
      )}
      {owner.original2003Owner && <Badge>Original 2003 Owner</Badge>}
      {owner.inMemoriam && <Badge>In Memoriam</Badge>}
    </>
  );
}

function Badge({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--lcc-border)] bg-[var(--lcc-surface)] px-2.5 py-1 font-ui text-[0.68rem] font-black uppercase leading-none text-[var(--lcc-text)]">
      {icon}
      {children}
    </span>
  );
}

function DirectoryFact({
  label,
  value,
  icon,
  isAction = false,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  isAction?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="font-ui text-[0.68rem] font-black uppercase text-[var(--lcc-text-muted)]">
        {label}
      </p>
      <p
        className={[
          "mt-1 flex items-center gap-1 truncate font-serif text-base font-black uppercase italic leading-tight text-[var(--lcc-text)]",
          isAction ? "text-[var(--lcc-gold)]" : "",
        ].join(" ")}
      >
        {icon}
        {value}
        {isAction && <ArrowRight className="h-3.5 w-3.5 shrink-0" />}
      </p>
    </div>
  );
}

function getOwnerTone(owner: LccOwner): DirectoryTone {
  if (owner.inMemoriam) {
    return "memorial";
  }

  if (owner.status === "retired") {
    return owner.original2003Owner ? "founding" : "retired";
  }

  return owner.activeDivision === "OGs" ? "legacy" : "challenger";
}

function formatTenure(owner: LccOwner) {
  if (!owner.joinedYear) {
    return "Unknown";
  }

  if (owner.lastSeason === "present") {
    return `${owner.joinedYear}-${LCC_CURRENT_SEASON}`;
  }

  if (typeof owner.lastSeason === "number") {
    return `${owner.joinedYear}-${owner.lastSeason}`;
  }

  return `${owner.joinedYear}-present`;
}

function formatChampionships(titles: number) {
  if (titles === 0) {
    return "None";
  }

  return `${titles} ${titles === 1 ? "Title" : "Titles"}`;
}
