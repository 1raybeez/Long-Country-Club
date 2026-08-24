import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Award, Crown, Medal, Shield, Skull, Trophy } from "lucide-react";
import { getLccOwnerProfileHref, isLccCoFounder, type LccOwner } from "@/lib/lccOwners";
import { getOwnerCareerSummary } from "@/lib/history/career";
import { getOwnerImagePath } from "@/lib/ownerImages";

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
  application = false,
}: {
  eyebrow: string;
  title: string;
  count: number;
  description?: string;
  tone?: DirectoryTone;
  application?: boolean;
}) {
  const toneClass = toneClasses[tone];

  if (application) {
    return (
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="lcc2-label text-[var(--lcc-brand-primary)]">{eyebrow}</p>
          <h2 className="mt-2 font-ui text-2xl font-black tracking-[-0.03em] text-[var(--lcc-color-text)] sm:text-3xl">
            {title}
          </h2>
          {description && <p className="lcc2-body mt-2 max-w-2xl">{description}</p>}
        </div>
        <p className="lcc2-label">{count} {count === 1 ? "Owner" : "Owners"}</p>
      </div>
    );
  }

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
  directory = false,
}: {
  children: ReactNode;
  compact?: boolean;
  directory?: boolean;
}) {
  return (
    <div
      className={
        directory
          ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          : compact
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
  compact = false,
}: {
  owner: LccOwner;
  tone?: DirectoryTone;
  compact?: boolean;
}) {
  if (compact) return <CompactOwnerCard owner={owner} />;

  const isActive = owner.status === "active";
  const cardTone = tone ?? getOwnerTone(owner);
  const toneClass = toneClasses[cardTone];
  const careerSummary = getOwnerCareerSummary(owner.id);
  const tenure = formatTenure(owner, careerSummary.activeSeasonCount);

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
            src={getOwnerImagePath(owner.id)}
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

          <div className="mt-auto grid grid-cols-2 gap-2 border-t border-[var(--lcc-border)] pt-4">
            <DirectoryStat
              label="Titles"
              value={String(careerSummary.titleCount)}
              icon={<Trophy className="h-3.5 w-3.5" aria-hidden="true" />}
            />
            <DirectoryStat
              label="Podiums"
              value={String(careerSummary.podiumCount)}
              icon={<Award className="h-3.5 w-3.5" aria-hidden="true" />}
            />
            <DirectoryStat
              label="Seasons"
              value={String(careerSummary.activeSeasonCount)}
              icon={<Crown className="h-3.5 w-3.5" aria-hidden="true" />}
            />
            <DirectoryStat
              label="Avg Finish"
              value={careerSummary.averageFinish?.toString() ?? "—"}
              icon={<Medal className="h-3.5 w-3.5" aria-hidden="true" />}
            />
            <DirectoryStat
              label="Last-Place Finishes"
              value={String(careerSummary.toiletBowlCount)}
              icon={<Skull className="h-3.5 w-3.5" aria-hidden="true" />}
            />
            <DirectoryStat
              label="Best Finish"
              value={formatBestFinish(careerSummary.bestFinish)}
              icon={<Medal className="h-3.5 w-3.5" aria-hidden="true" />}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-[var(--lcc-border)] pt-4">
            <DirectoryFact label="Tenure" value={tenure} />
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

function CompactOwnerCard({ owner }: { owner: LccOwner }) {
  if (owner.status === "active") return <ActiveOwnerCard owner={owner} />;

  return (
    <Link
      href={getLccOwnerProfileHref(owner)}
      className="lcc2-card lcc2-card--interactive group flex flex-col overflow-hidden rounded-2xl p-0"
    >
      <article className="flex flex-col">
        <div className="relative h-56 overflow-hidden bg-[var(--lcc-color-midnight)] sm:h-52 xl:h-56">
          <img
            src={getOwnerImagePath(owner.id)}
            alt={owner.nickname}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ objectPosition: "center 30%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-4">
            <p className="font-ui text-[0.65rem] font-black uppercase tracking-[0.08em] text-white/70">
              Former LCC Team
            </p>
            <p className="mt-1 break-words font-ui text-lg font-black leading-tight text-white">
              {owner.managerPage.sleeperName}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4">
          <div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <CompactBadge tone="neutral">Retired</CompactBadge>
              {owner.inMemoriam && <CompactBadge tone="neutral">In Memoriam</CompactBadge>}
              {isLccCoFounder(owner.id) && <CompactBadge tone="achievement" icon={<Crown className="h-3 w-3" />}>Co-Founder</CompactBadge>}
              {owner.commissioner && <CompactBadge tone="info" icon={<Shield className="h-3 w-3" />}>Commissioner</CompactBadge>}
              {owner.original2003Owner && <CompactBadge tone="achievement">Original 2003 Owner</CompactBadge>}
            </div>
            <h3 className="break-words font-ui text-xl font-black leading-tight tracking-[-0.02em] text-[var(--lcc-color-text)]">
              {owner.displayName}
            </h3>
          </div>
          <span className="inline-flex min-h-10 items-center gap-1 self-start font-ui text-xs font-black uppercase tracking-[0.06em] text-[var(--lcc-interactive)]">
            View Profile <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
      </article>
    </Link>
  );
}

function ActiveOwnerCard({ owner }: { owner: LccOwner }) {
  const isCoFounder = isLccCoFounder(owner.id);

  return (
    <Link
      href={getLccOwnerProfileHref(owner)}
      className="lcc2-card lcc2-card--interactive group flex h-full flex-col overflow-hidden rounded-2xl p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)]"
    >
      <article className="flex h-full flex-col">
        <div className="relative h-56 overflow-hidden bg-[var(--lcc-color-midnight)] sm:h-52 xl:h-56">
          <img
            src={getOwnerImagePath(owner.id)}
            alt={`${owner.displayName} — ${owner.managerPage.sleeperName}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ objectPosition: "center 30%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="break-words font-ui text-lg font-black leading-tight text-white">
              {owner.managerPage.sleeperName}
            </p>
            <p className="mt-1 font-ui text-xs font-black uppercase tracking-[0.08em] text-white/75">
              {owner.activeDivision ?? "Active"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4">
          <h3 className="break-words font-ui text-xl font-black leading-tight tracking-[-0.02em] text-[var(--lcc-color-text)]">
            {owner.displayName}
          </h3>
          {(isCoFounder || owner.commissioner) && (
            <div className="flex flex-wrap gap-1.5">
              {isCoFounder && <CompactBadge tone="achievement" icon={<Crown className="h-3 w-3" />}>Co-Founder</CompactBadge>}
              {owner.commissioner && <CompactBadge tone="info" icon={<Shield className="h-3 w-3" />}>Commissioner</CompactBadge>}
            </div>
          )}
          <span className="inline-flex items-center gap-1 self-start font-ui text-xs font-black uppercase tracking-[0.06em] text-[var(--lcc-interactive)]">
            View Profile <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
      </article>
    </Link>
  );
}

function CompactBadge({ children, icon, tone }: { children: ReactNode; icon?: ReactNode; tone: "achievement" | "info" | "neutral" }) {
  return <span className={`lcc2-badge lcc2-badge--${tone} gap-1`}>{icon}{children}</span>;
}

function CompactStat({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone: "achievement" | "info" | "neutral" }) {
  return (
    <div className="rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] px-2 py-2.5 text-center">
      <div className={`mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-md ${tone === "achievement" ? "bg-[var(--lcc-color-surface)] text-[var(--lcc-semantic-achievement)]" : tone === "info" ? "bg-[var(--lcc-color-surface)] text-[var(--lcc-interactive)]" : "bg-[var(--lcc-color-surface-muted)] text-[var(--lcc-color-text-muted)]"}`}>{icon}</div>
      <p className="font-ui text-lg font-black leading-none text-[var(--lcc-color-text)]">{value}</p>
      <p className="mt-1 font-ui text-[0.58rem] font-black uppercase tracking-[0.06em] text-[var(--lcc-color-text-muted)]">{label}</p>
    </div>
  );
}

function DirectoryStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="min-h-[4.75rem] rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-3 text-center">
      <div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-md bg-[var(--lcc-surface)] text-[var(--lcc-gold)]">
        {icon}
      </div>
      <p className="truncate font-serif text-lg font-black uppercase italic leading-none text-[var(--lcc-text)]">
        {value}
      </p>
      <p className="mt-1 font-ui text-[0.6rem] font-black uppercase text-[var(--lcc-text-muted)]">
        {label}
      </p>
    </div>
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

function Badge({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 font-ui text-[0.65rem] font-black uppercase text-white backdrop-blur-sm">
      {icon}
      {children}
    </span>
  );
}

function DirectoryFact({
  label,
  value,
  isAction = false,
}: {
  label: string;
  value: string;
  isAction?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="font-ui text-[0.6rem] font-black uppercase text-[var(--lcc-text-muted)]">
        {label}
      </p>
      <p
        className={[
          "mt-1 flex items-center gap-1 truncate font-serif text-sm font-black uppercase italic leading-tight",
          isAction ? "text-[var(--lcc-green-deep)]" : "text-[var(--lcc-text)]",
        ].join(" ")}
      >
        {value}
        {isAction && <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
      </p>
    </div>
  );
}

function getOwnerTone(owner: LccOwner): DirectoryTone {
  if (owner.inMemoriam) return "memorial";
  if (owner.status === "retired") return "retired";
  if (owner.founder || owner.original2003Owner) return "founding";
  return "default";
}

function formatTenure(owner: LccOwner, activeSeasonCount: number) {
  const startSeason = owner.joinedYear ?? "Unknown";
  const endSeason =
    owner.status === "active" ? "Present" : owner.lastSeason ?? "Unknown";

  return `${startSeason}-${endSeason} (${activeSeasonCount})`;
}

function formatBestFinish(place: number | null | undefined) {
  if (place === undefined || place === null) return "—";
  if (place === 1) return "Champ";
  if (place === 2) return "2nd";
  if (place === 3) return "3rd";
  return `${place}${getOrdinalSuffix(place)}`;
}

function getOrdinalSuffix(value: number) {
  const mod100 = value % 100;

  if (mod100 >= 11 && mod100 <= 13) return "th";

  switch (value % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
