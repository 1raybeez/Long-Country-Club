import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  Award,
  Crown,
  History,
  Medal,
  MessageCircle,
  Quote,
  Shield,
  Skull,
  Swords,
  Trophy,
  UserRound,
} from "lucide-react";
import {
  ALL_LCC_OWNERS,
  LCC_ERA_MODEL,
  getLccOwnerById,
  getLccOwnerByProfileSlug,
  getLccOwnerProfileHref,
  getLccOwnerProfileSlug,
  type LccOwner,
} from "@/lib/lccOwners";
import {
  LCC_LATEST_COMPLETED_FINAL_PLACEMENT_SEASON,
  getLccOwnerCareerSummary,
  type LccOwnerCareerSummary,
} from "@/lib/lccFinalPlacements";
import { getOwnerImagePath } from "@/lib/ownerImages";
import { ContactChip } from "@/components/ui/ContactChip";
import { ProfileStatCard } from "@/components/ui/ProfileStatCard";
import {
  ProfileTimeline,
  type ProfileTimelineItem,
} from "@/components/ui/ProfileTimeline";
import { RivalCard } from "@/components/ui/RivalCard";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { TradeMeter } from "@/components/ui/TradeMeter";

export function generateStaticParams() {
  return ALL_LCC_OWNERS.map((owner) => ({
    slug: getLccOwnerProfileSlug(owner),
  }));
}

type OwnerProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function OwnerProfilePage({
  params,
}: OwnerProfilePageProps) {
  const { slug } = await params;
  const owner = getLccOwnerByProfileSlug(slug);

  if (!owner) {
    notFound();
  }

  const teamLabel = owner.status === "active" ? "Current Team" : "Last Team";
  const careerSummary = getLccOwnerCareerSummary(owner.id);
  const tenure = formatTenure(owner, careerSummary);
  const almanacProfile = owner.almanacProfile;
  const rivalOwners = getRivalOwnerIds(almanacProfile)
    .map((ownerId) => getLccOwnerById(ownerId))
    .filter((rivalOwner): rivalOwner is LccOwner => Boolean(rivalOwner));
  const rivalSectionTitle =
    rivalOwners.length === 1 ? "Primary Rival" : "Rivals";
  const timelineItems = buildTimelineItems(owner, tenure, careerSummary);
  const hasFanProfile = Boolean(
    almanacProfile?.favoriteCollegeTeam ||
      almanacProfile?.favoriteNFLTeam ||
      almanacProfile?.favoritePlayer ||
      almanacProfile?.philosophy
  );
  const hasTradeContact = Boolean(
    almanacProfile?.mode ||
      almanacProfile?.preferredContactMethods?.length ||
      almanacProfile?.preferredDraftPosition ||
      almanacProfile?.tradeActivityScale !== undefined ||
      almanacProfile?.draftingStrategy ||
      almanacProfile?.waiverWireAggression ||
      almanacProfile?.injuryManagement ||
      almanacProfile?.trashTalkRating !== undefined
  );

  return (
    <main className="lcc-page">
      <div className="lcc-container py-8 sm:py-12 lg:py-14">
        <nav className="mb-5">
          <Link href="/managers" className="lcc-button lcc-button-secondary">
            Back to Managers
          </Link>
        </nav>

        <ProfileHero
          owner={owner}
          teamLabel={teamLabel}
          tenure={tenure}
          titleCount={careerSummary.titleCount}
          bio={almanacProfile?.bio}
        />

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid gap-5">
            <ProfileSection
              title="Timeline / Legacy"
              icon={<History className="h-4 w-4" aria-hidden="true" />}
            >
              <ProfileTimeline items={timelineItems} />
            </ProfileSection>

            {rivalOwners.length > 0 && (
              <ProfileSection
                title={rivalSectionTitle}
                icon={<Swords className="h-4 w-4" aria-hidden="true" />}
              >
                <div className="grid gap-3 md:grid-cols-2">
                  {rivalOwners.map((rivalOwner) => (
                    <RivalCard
                      key={rivalOwner.id}
                      href={getLccOwnerProfileHref(rivalOwner)}
                      imageSrc={getOwnerImagePath(rivalOwner.id)}
                      imageAlt={rivalOwner.nickname}
                      ownerName={rivalOwner.displayName}
                      teamName={rivalOwner.managerPage.sleeperName}
                      teamLabel={
                        rivalOwner.status === "active"
                          ? "Current LCC Team"
                          : "Last LCC Team"
                      }
                    />
                  ))}
                </div>
              </ProfileSection>
            )}
          </div>

          <aside className="grid gap-4 self-start lg:sticky lg:top-32">
            <ProfileSection
              title="Current Division"
              icon={<Shield className="h-4 w-4" aria-hidden="true" />}
              compact
            >
              <CurrentDivisionCard owner={owner} teamLabel={teamLabel} />
            </ProfileSection>

            <ProfileSection
              title="Career Snapshot"
              icon={<Trophy className="h-4 w-4" aria-hidden="true" />}
              compact
            >
              <div className="grid grid-cols-2 gap-2.5">
                <ProfileStatCard
                  label="Titles"
                  value={String(careerSummary.titleCount)}
                  icon={<Crown className="h-4 w-4" aria-hidden="true" />}
                />
                <ProfileStatCard
                  label="Podiums"
                  value={String(careerSummary.podiumCount)}
                  icon={<Award className="h-4 w-4" aria-hidden="true" />}
                />
                <ProfileStatCard
                  label="Toilets"
                  value={String(careerSummary.toiletBowlCount)}
                  icon={<Skull className="h-4 w-4" aria-hidden="true" />}
                />
                {careerSummary.bestFinish && (
                  <ProfileStatCard
                    label="Best Finish"
                    value={formatBestFinish(careerSummary.bestFinish)}
                    icon={<Medal className="h-4 w-4" aria-hidden="true" />}
                  />
                )}
                <ProfileStatCard
                  label="LCC Tenure"
                  value={tenure}
                  icon={<History className="h-4 w-4" aria-hidden="true" />}
                  wide
                  smallValue
                />
              </div>
            </ProfileSection>

            {hasFanProfile && (
              <ProfileSection
                title="Fan Profile"
                icon={<UserRound className="h-4 w-4" aria-hidden="true" />}
                compact
              >
                <div className="grid gap-2.5">
                  <TeamBadge
                    label="College Team"
                    value={almanacProfile?.favoriteCollegeTeam}
                  />
                  <TeamBadge
                    label="NFL Team"
                    value={almanacProfile?.favoriteNFLTeam}
                  />
                  <SidebarFact
                    label="Favorite Player"
                    value={almanacProfile?.favoritePlayer}
                  />
                  {almanacProfile?.philosophy && (
                    <OwnerQuote value={almanacProfile.philosophy} />
                  )}
                </div>
              </ProfileSection>
            )}

            {hasTradeContact && (
              <TradeContactCard almanacProfile={almanacProfile} />
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

function ProfileHero({
  owner,
  teamLabel,
  tenure,
  titleCount,
  bio,
}: {
  owner: LccOwner;
  teamLabel: string;
  tenure: string;
  titleCount: number;
  bio?: string;
}) {
  return (
    <section className="lcc-card overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="relative min-h-[24rem] overflow-hidden bg-[var(--lcc-green-deep)]">
          <img
            src={getOwnerImagePath(owner.id)}
            alt={owner.nickname}
            className="h-full min-h-[24rem] w-full object-cover"
            style={{ objectPosition: "center 32%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        </div>

        <div className="flex flex-col justify-between gap-8 p-5 sm:p-7">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              <ProfileBadges owner={owner} />
            </div>

            <p className="font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
              {teamLabel}
            </p>
            <p className="mt-1 font-serif text-2xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
              {owner.managerPage.sleeperName}
            </p>

            <h1 className="mt-6 font-serif text-5xl font-black uppercase italic leading-none text-[var(--lcc-text)] sm:text-6xl">
              {owner.displayName}
            </h1>
            <p className="mt-3 font-ui text-sm font-black uppercase text-[var(--lcc-text-muted)]">
              {owner.nickname}
            </p>

            {bio && (
              <p className="mt-6 max-w-3xl font-ui text-base font-medium leading-7 text-[var(--lcc-text-muted)] line-clamp-5">
                {bio}
              </p>
            )}
          </div>

          <div className="grid gap-3 border-t border-[var(--lcc-border)] pt-5 sm:grid-cols-3">
            <HeroFact
              label={owner.status === "active" ? "Division" : "Status"}
              value={owner.activeDivision ?? formatStatus(owner.status)}
            />
            <HeroFact label="LCC Tenure" value={tenure} />
            <HeroFact
              label="Titles"
              value={formatChampionships(titleCount)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileBadges({ owner }: { owner: LccOwner }) {
  return (
    <>
      <ProfileBadge>{formatStatus(owner.status)}</ProfileBadge>
      {owner.activeDivision && <ProfileBadge>{owner.activeDivision}</ProfileBadge>}
      {owner.founder && (
        <ProfileBadge icon={<Crown className="h-3 w-3" />}>Founder</ProfileBadge>
      )}
      {owner.commissioner && (
        <ProfileBadge icon={<Shield className="h-3 w-3" />}>
          Commissioner
        </ProfileBadge>
      )}
      {owner.original2003Owner && (
        <ProfileBadge>Original 2003 Owner</ProfileBadge>
      )}
      {owner.inMemoriam && <ProfileBadge>In Memoriam</ProfileBadge>}
    </>
  );
}

function ProfileBadge({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--lcc-border)] bg-[var(--lcc-surface)] px-3 py-1 font-ui text-xs font-black uppercase text-[var(--lcc-text)]">
      {icon}
      {children}
    </span>
  );
}

function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-4">
      <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
        {label}
      </p>
      <p className="mt-1 font-serif text-lg font-black uppercase italic text-[var(--lcc-text)]">
        {value}
      </p>
    </div>
  );
}

function ProfileSection({
  title,
  children,
  icon,
  compact = false,
}: {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={`lcc-card ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <div className={`${compact ? "mb-3" : "mb-4"} flex items-center gap-3`}>
        {icon && (
          <span
            className={[
              "flex shrink-0 items-center justify-center rounded-md bg-[var(--lcc-green-deep)] text-[var(--lcc-gold)]",
              compact ? "h-8 w-8" : "h-9 w-9",
            ].join(" ")}
          >
            {icon}
          </span>
        )}
        <h2
          className={[
            "font-serif font-black uppercase italic leading-none text-[var(--lcc-text)]",
            compact ? "text-xl" : "text-2xl",
          ].join(" ")}
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function CurrentDivisionCard({
  owner,
  teamLabel,
}: {
  owner: LccOwner;
  teamLabel: string;
}) {
  const divisionLabel =
    owner.status === "active" ? owner.activeDivision ?? "Active" : "Retired Legend";

  return (
    <div className="rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-3">
      <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
        {owner.status === "active" ? "Active Division" : "Legacy Wing"}
      </p>
      <p className="mt-1 font-serif text-xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
        {divisionLabel}
      </p>
      <div className="mt-3 border-t border-[var(--lcc-border)] pt-3">
        <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
          {teamLabel}
        </p>
        <p className="mt-1 font-serif text-base font-black uppercase italic leading-tight text-[var(--lcc-text)]">
          {owner.managerPage.sleeperName}
        </p>
      </div>
    </div>
  );
}

type TimelineItem = ProfileTimelineItem;

function OwnerQuote({ value }: { value: string }) {
  return (
    <div className="rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-3">
      <div className="mb-2 flex items-center gap-2 text-[var(--lcc-gold)]">
        <Quote className="h-4 w-4" aria-hidden="true" />
        <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
          Franchise Quote
        </p>
      </div>
      <p className="font-serif text-base font-black italic leading-tight text-[var(--lcc-text)]">
        "{value}"
      </p>
    </div>
  );
}

function SidebarFact({
  label,
  value,
}: {
  label: string;
  value?: ReactNode;
}) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return (
    <div className="rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-3">
      <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
        {label}
      </p>
      <p className="mt-1 font-serif text-base font-black uppercase italic leading-tight text-[var(--lcc-text)]">
        {value}
      </p>
    </div>
  );
}

function TradeContactCard({
  almanacProfile,
}: {
  almanacProfile: LccOwner["almanacProfile"];
}) {
  if (!almanacProfile) {
    return null;
  }

  const contactMethods = almanacProfile.preferredContactMethods ?? [];

  return (
    <ProfileSection
      title="Trade & Contact"
      icon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}
      compact
    >
      <div className="grid gap-2.5">
        {almanacProfile.mode && (
          <div className="rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-gold-soft)] p-3">
            <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
              Team Mode
            </p>
            <p className="mt-1 font-serif text-lg font-black uppercase italic text-[var(--lcc-text)]">
              {almanacProfile.mode}
            </p>
          </div>
        )}

        {contactMethods.length > 0 && (
          <div className="rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-3">
            <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
              Preferred Contact
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {contactMethods.map((method) => (
                <ContactChip key={method} method={method} />
              ))}
            </div>
          </div>
        )}

        {almanacProfile.tradeActivityScale !== undefined && (
          <TradeMeter value={almanacProfile.tradeActivityScale} />
        )}

        <CompactFactGrid
          items={[
            {
              label: "Draft Position",
              value: almanacProfile.preferredDraftPosition,
            },
            { label: "Drafting", value: almanacProfile.draftingStrategy },
            { label: "Waiver Wire", value: almanacProfile.waiverWireAggression },
            { label: "Injuries", value: almanacProfile.injuryManagement },
            {
              label: "Trash Talk",
              value: formatRating(almanacProfile.trashTalkRating, 5),
            },
          ]}
        />
      </div>
    </ProfileSection>
  );
}

function CompactFactGrid({
  items,
}: {
  items: Array<{ label: string; value?: ReactNode }>;
}) {
  const visibleItems = items.filter(
    (item) => item.value !== undefined && item.value !== null && item.value !== ""
  );

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-2 rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-3 sm:grid-cols-2">
      {visibleItems.map((item) => (
        <div key={item.label} className="min-w-0">
          <p className="font-ui text-[0.65rem] font-black uppercase text-[var(--lcc-text-muted)]">
            {item.label}
          </p>
          <p className="mt-1 break-words font-serif text-sm font-black uppercase italic leading-tight text-[var(--lcc-text)]">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function getRivalOwnerIds(profile: LccOwner["almanacProfile"]) {
  if (!profile) {
    return [];
  }

  if (profile.rivalOwnerIds && profile.rivalOwnerIds.length > 0) {
    return [...new Set(profile.rivalOwnerIds)];
  }

  return profile.rivalOwnerId ? [profile.rivalOwnerId] : [];
}

function formatBestFinish(place: number | undefined) {
  if (place === undefined) {
    return "";
  }

  if (place === 1) {
    return "Champion";
  }

  if (place === 2) {
    return "Runner-Up";
  }

  if (place === 3) {
    return "Third";
  }

  return `${place}${getOrdinalSuffix(place)}`;
}

function buildTimelineItems(
  owner: LccOwner,
  tenure: string,
  careerSummary: LccOwnerCareerSummary
): TimelineItem[] {
  const items: TimelineItem[] = [];
  const firstTenureSpan = careerSummary.tenureSpans[0];
  const joinedYear = firstTenureSpan?.startSeason ?? owner.joinedYear;
  const firstSeasonLabel = joinedYear ? String(joinedYear) : "LCC";
  const openingTitle = owner.founder
    ? "Founded Long Country Club"
    : "Joined Long Country Club";

  items.push({
    year: firstSeasonLabel,
    title: openingTitle,
    detail: `${owner.displayName} began this LCC tenure with ${owner.managerPage.sleeperName}. Recorded tenure: ${tenure}.`,
  });

  careerSummary.tenureSpans.slice(1).forEach((span) => {
    items.push({
      year: String(span.startSeason),
      title: "Returned to Active Ownership",
      detail: `${owner.displayName} rejoined the active owner pool for the ${span.startSeason} season.`,
    });
  });

  if (owner.original2003Owner) {
    items.push({
      year: "2003",
      title: "Original 2003 Owner",
      detail: "Part of the original Long Country Club ownership group.",
    });
  }

  if (owner.commissioner) {
    items.push({
      year: firstSeasonLabel,
      title: "League Commissioner",
      detail: "Serves as commissioner for Long Country Club FFL.",
    });
  }

  if (owner.eraTags.includes("sleeperMigration")) {
    items.push({
      year: String(LCC_ERA_MODEL.sleeperMigration.season),
      title: "Sleeper Migration",
      detail: "Part of the league record after LCC migrated to Sleeper in 2019.",
    });
  }

  if (owner.eraTags.includes("dynasty")) {
    items.push({
      year: String(LCC_ERA_MODEL.dynasty.startSeason),
      title: "Dynasty Era",
      detail: "Continued into the Dynasty Era that began with the 2021 season.",
    });
  }

  const finalTenureSpan = careerSummary.tenureSpans.at(-1);

  if (owner.status === "retired" && finalTenureSpan) {
    items.push({
      year: String(finalTenureSpan.endSeason),
      title: "Retired From Active Ownership",
      detail: "Retired-owner legacy preserved in the LCC Almanac.",
    });
  }

  return items;
}

function formatStatus(status: LccOwner["status"]) {
  return status === "active" ? "Active" : "Retired";
}

function formatTenure(owner: LccOwner, summary: LccOwnerCareerSummary) {
  if (summary.tenureSpans.length === 0) {
    return "Unknown";
  }

  const spanLabel = summary.tenureSpans
    .map((span, index) => {
      const isCurrentActiveSpan =
        owner.status === "active" &&
        index === summary.tenureSpans.length - 1 &&
        span.endSeason === LCC_LATEST_COMPLETED_FINAL_PLACEMENT_SEASON;
      const endSeason = isCurrentActiveSpan ? "present" : span.endSeason;

      return `${span.startSeason}-${endSeason}`;
    })
    .join(", ");

  return `${spanLabel} (${summary.activeSeasonCount} yrs)`;
}

function formatRating(value: number | undefined, max: number) {
  if (value === undefined) {
    return undefined;
  }

  return `${value}/${max}`;
}

function formatChampionships(titles: number) {
  if (titles === 0) {
    return "None";
  }

  return `${titles} ${titles === 1 ? "Title" : "Titles"}`;
}

function getOrdinalSuffix(value: number) {
  const mod100 = value % 100;

  if (mod100 >= 11 && mod100 <= 13) {
    return "th";
  }

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
