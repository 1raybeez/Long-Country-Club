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
  Swords,
  Trophy,
  UserRound,
} from "lucide-react";
import {
  ALL_LCC_OWNERS,
  LCC_ERA_MODEL,
  getLccOwnerById,
  getLccOwnerByProfileSlug,
  getLccOwnerProfileSlug,
  isLccCoFounder,
  type LccOwner,
} from "@/lib/lccOwners";
import { getOwnerTimeline } from "@/lib/history/ownerHistory";
import { getAwardsByOwner } from "@/lib/history/awards";
import { getOwnerMatchupSummary } from "@/lib/history/ownerMatchupSummary";
import { getHeadToHeadHref } from "@/lib/history/headToHead";
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
import { OwnerMatchupResumeCard } from "@/components/ui/OwnerMatchupResumeCard";
import { ProfileDisclosure } from "@/components/ui/ProfileDisclosure";
import { splitTeamSelections } from "@/lib/teamBranding";

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

  const teamLabel = owner.status === "active" ? "Current Franchise" : "Last Franchise";
  const ownerHistory = getOwnerTimeline(owner.id);
  const careerSummary = ownerHistory.career;
  const matchupSummary = getOwnerMatchupSummary(owner.id);
  const tenure = formatTenure(owner, careerSummary.activeSeasonCount);
  const almanacProfile = owner.almanacProfile;
  const awards = getAwardsByOwner(owner.id).filter(
    (award) =>
      award.type === "weeklyHigh" ||
      award.type === "regularSeason" ||
      award.type === "custom"
  );
  const rivalOwners = getRivalOwnerIds(almanacProfile, owner.id)
    .map((ownerId) => getLccOwnerById(ownerId))
    .filter((rivalOwner): rivalOwner is LccOwner => Boolean(rivalOwner));
  const rivalSectionTitle =
    rivalOwners.length === 1 ? "Primary Rival" : "Curated Rivals";
  const timelineItems = buildTimelineItems(owner, tenure, ownerHistory.seasons);
  const franchiseHistory = getMeaningfulFranchiseHistory(owner);

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
  const collegeTeamSelections = splitTeamSelections(
    almanacProfile?.favoriteCollegeTeam
  );

  return (
    <main className="lcc2-page-shell">
      <div className="lcc2-page-container">
        <nav className="mb-5">
          <Link href="/managers" className="lcc2-button lcc2-button--secondary">
            Back to Managers
          </Link>
        </nav>

        <ProfileHero
          owner={owner}
          teamLabel={teamLabel}
          tenure={tenure}
          bio={almanacProfile?.bio}
        />

        {franchiseHistory.length > 1 && (
          <div className="mt-5">
            <ProfileDisclosure
              id={`${owner.id}-franchise-history`}
              title="Franchise History"
              summary={`${franchiseHistory.length} recorded franchise names`}
              icon={<History className="h-4 w-4" aria-hidden="true" />}
            >
              <ol className="grid gap-2 sm:grid-cols-2">
                {franchiseHistory.map((teamName, index) => (
                  <li
                    key={`${teamName}-${index}`}
                    className="rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3"
                  >
                    <p className="lcc2-label">{index === franchiseHistory.length - 1 ? "Current Franchise" : "Historical Franchise"}</p>
                    <p className="mt-1 break-words font-ui text-base font-black text-[var(--lcc-color-text)]">{teamName}</p>
                  </li>
                ))}
              </ol>
            </ProfileDisclosure>
          </div>
        )}

        <ProfileSection
          title="Career Snapshot"
          icon={<Trophy className="h-4 w-4" aria-hidden="true" />}
        >
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            <ProfileStatCard label={careerSummary.championships === 1 ? "Championship" : "Championships"} value={String(careerSummary.championships)} icon={<Crown className="h-4 w-4" aria-hidden="true" />} />
            <ProfileStatCard label={careerSummary.podiums === 1 ? "Podium" : "Podiums"} value={String(careerSummary.podiums)} icon={<Award className="h-4 w-4" aria-hidden="true" />} />
            <ProfileStatCard label="Playoff Appearances" value={String(careerSummary.playoffAppearances)} icon={<Trophy className="h-4 w-4" aria-hidden="true" />} />
            <ProfileStatCard label="Career Average Finish" value={careerSummary.averageFinish?.toString() ?? "—"} icon={<History className="h-4 w-4" aria-hidden="true" />} />
            <ProfileStatCard label={careerSummary.seasons === 1 ? "Season" : "Seasons"} value={String(careerSummary.seasons)} icon={<History className="h-4 w-4" aria-hidden="true" />} />
          </div>
        </ProfileSection>

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid gap-5">
            <ProfileDisclosure
              id={`${owner.id}-almanac-timeline`}
              title="Almanac Timeline"
              summary={`${timelineItems.length} recorded milestones`}
              icon={<History className="h-4 w-4" aria-hidden="true" />}
            >
              <ProfileTimeline items={timelineItems} />
            </ProfileDisclosure>

            <ProfileDisclosure
              id={`${owner.id}-season-history`}
              title="Season-by-Season History"
              summary={`${ownerHistory.seasons.length} seasons`}
              icon={<Trophy className="h-4 w-4" aria-hidden="true" />}
            >
              <SeasonHistoryTable seasons={ownerHistory.seasons} />
            </ProfileDisclosure>

            {awards.length > 0 && (
              <ProfileDisclosure
                id={`${owner.id}-awards`}
                title="Awards"
                summary={formatAwardSummary(awards)}
                icon={<Award className="h-4 w-4" aria-hidden="true" />}
              >
                <AwardGrid awards={awards} />
              </ProfileDisclosure>
            )}

            <ProfileDisclosure
              id={`${owner.id}-career-records`}
              title="Career Records"
              summary="Placement detail & career milestones"
              icon={<Medal className="h-4 w-4" aria-hidden="true" />}
            >
              <CareerRecordsGrid careerSummary={careerSummary} />
            </ProfileDisclosure>

            {rivalOwners.length > 0 && (
              <ProfileSection
                title={rivalSectionTitle}
                icon={<Swords className="h-4 w-4" aria-hidden="true" />}
              >
                <div className="grid gap-3 md:grid-cols-2">
                  {rivalOwners.map((rivalOwner) => (
                    <RivalCard
                      key={rivalOwner.id}
                      href={getHeadToHeadHref(owner.id, rivalOwner.id)}
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
              title="Matchup Resume"
              icon={<Swords className="h-4 w-4" aria-hidden="true" />}
              compact
            >
              <OwnerMatchupResumeCard summary={matchupSummary} />
            </ProfileSection>

            {hasFanProfile && (
              <ProfileDisclosure
                id={`${owner.id}-fan-profile`}
                title="Fan Profile"
                summary="Teams, favorite player & franchise quote"
                icon={<UserRound className="h-4 w-4" aria-hidden="true" />}
              >
                <div className="grid gap-2.5">
                  {collegeTeamSelections.map((team) => (
                    <TeamBadge
                      key={team}
                      label={collegeTeamSelections.length > 1 ? "College Teams" : "College Team"}
                      value={team}
                    />
                  ))}
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
              </ProfileDisclosure>
            )}

            {hasTradeContact && (
              <ProfileDisclosure
                id={`${owner.id}-trade-contact`}
                title="Trade & Contact"
                summary="Trading style & preferred contact"
                icon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}
              >
                <TradeContactContent almanacProfile={almanacProfile} />
              </ProfileDisclosure>
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
  bio,
}: {
  owner: LccOwner;
  teamLabel: string;
  tenure: string;
  bio?: string;
}) {
  return (
    <section className="lcc2-card lcc2-card--raised overflow-hidden p-0">
      <div className="grid gap-0 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <div className="relative min-h-[18rem] overflow-hidden bg-[var(--lcc-color-midnight)] lg:min-h-[22rem]">
          <img
            src={getOwnerImagePath(owner.id)}
            alt={owner.nickname}
            className="h-full min-h-[18rem] w-full object-cover lg:min-h-[22rem]"
            style={{ objectPosition: "center 32%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        </div>

        <div className="flex flex-col justify-between gap-6 p-5 sm:p-7">
          <div>
            <h1 className="break-words font-ui text-4xl font-black leading-none tracking-[-0.04em] text-[var(--lcc-color-text)] sm:text-5xl">
              {owner.displayName}
            </h1>
            <p className="mt-3 font-ui text-sm font-semibold text-[var(--lcc-color-text-muted)]">
              {owner.nickname}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <ProfileBadges owner={owner} />
            </div>

            <p className="mt-5 lcc2-label text-[var(--lcc-interactive)]">
              {teamLabel}
            </p>
            <p className="mt-1 font-ui text-xl font-black leading-tight text-[var(--lcc-color-text)]">
              {owner.managerPage.sleeperName}
            </p>

            {bio && (
              <p className="lcc2-body mt-5 max-w-3xl line-clamp-5">
                {bio}
              </p>
            )}
          </div>

          <div className="grid gap-2 border-t border-[var(--lcc-color-border)] pt-4 sm:grid-cols-3">
            <HeroFact
              label={owner.status === "active" ? "Division" : "Status"}
              value={owner.activeDivision ?? formatStatus(owner.status)}
            />
            <HeroFact label="LCC Tenure" value={tenure} />
          </div>
        </div>
      </div>
    </section>
  );
}

function SeasonHistoryTable({
  seasons,
}: {
  seasons: ReturnType<typeof getOwnerTimeline>["seasons"];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--lcc-color-border)]">
      <div className="grid min-w-[28rem] grid-cols-[4rem_minmax(8rem,1fr)_minmax(8rem,1fr)_5rem] gap-x-4 bg-[var(--lcc-color-surface-muted)] px-4 py-3 font-ui text-[0.68rem] font-black uppercase tracking-[0.06em] text-[var(--lcc-color-text-muted)]">
        <div>Year</div>
        <div>Era</div>
        <div>Finish</div>
        <div className="text-right">Place</div>
      </div>

      <div className="divide-y divide-[var(--lcc-color-border)]">
        {seasons
          .slice()
          .sort((a, b) => b.season - a.season)
          .map((season) => {
            const finish = formatSeasonFinish(season.finalPlace);

            return (
              <div
                key={season.season}
                className="grid min-w-[28rem] grid-cols-[4rem_minmax(8rem,1fr)_minmax(8rem,1fr)_5rem] items-center gap-x-4 px-4 py-3 font-ui text-sm"
              >
                <div className="font-black text-[var(--lcc-color-text)]">
                  {season.season}
                </div>
                <div className="font-bold text-[var(--lcc-color-text-muted)]">
                  {formatEra(season.era)}
                </div>
                <div className="font-bold text-[var(--lcc-color-text-muted)]">
                  {finish}
                </div>
                <div className="text-right font-black text-[var(--lcc-color-text)]">
                  {formatOrdinalPlace(season.finalPlace)}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function AwardGrid({
  awards,
}: {
  awards: ReturnType<typeof getAwardsByOwner>;
}) {
  const weeklyHighsBySeason = new Map<number, number>();
  const otherAwards = awards.filter((award) => award.type !== "weeklyHigh");

  awards
    .filter((award) => award.type === "weeklyHigh")
    .forEach((award) => {
      weeklyHighsBySeason.set(
        award.season,
        (weeklyHighsBySeason.get(award.season) ?? 0) + 1
      );
    });

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {Array.from(weeklyHighsBySeason.entries()).map(([season, count]) => (
        <div
          key={`weekly-high-${season}`}
          className="rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3"
        >
          <p className="lcc2-label text-[var(--lcc-interactive)]">{season}</p>
          <p className="mt-1.5 font-ui text-lg font-black leading-tight text-[var(--lcc-color-text)]">
            {count} Weekly High{count === 1 ? "" : "s"}
          </p>
        </div>
      ))}
      {otherAwards.map((award) => (
        <div
          key={award.id}
          className="rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3"
        >
          <p className={`lcc2-label ${isTitleAward(award) ? "text-[var(--lcc-semantic-achievement)]" : "text-[var(--lcc-interactive)]"}`}>
            {award.season} · {award.type}
          </p>
          <p className="mt-1.5 font-ui text-lg font-black leading-tight text-[var(--lcc-color-text)]">
            {award.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function formatAwardSummary(
  awards: ReturnType<typeof getAwardsByOwner>
) {
  const weeklyHighCount = awards.filter((award) => award.type === "weeklyHigh").length;
  const otherCount = awards.length - weeklyHighCount;

  if (otherCount === 0) {
    return `${weeklyHighCount} Weekly High${weeklyHighCount === 1 ? "" : "s"}`;
  }

  return `${awards.length} recorded awards`;
}

function CareerRecordsGrid({
  careerSummary,
}: {
  careerSummary: ReturnType<typeof getOwnerTimeline>["career"];
}) {
  type CareerRecord = { label: string; value: string | number };
  const records = ([
    careerSummary.runnerUpFinishes > 0
      ? { label: "Runner-Up Finishes", value: careerSummary.runnerUpFinishes }
      : null,
    careerSummary.thirdPlaceFinishes > 0
      ? { label: "Third-Place Finishes", value: careerSummary.thirdPlaceFinishes }
      : null,
    careerSummary.bestFinish !== null
      ? { label: "Best Finish", value: formatBestFinish(careerSummary.bestFinish) }
      : null,
    careerSummary.worstFinish !== null
      ? { label: "Worst Finish", value: formatOrdinalPlace(careerSummary.worstFinish) }
      : null,
    careerSummary.toiletBowlCount > 0
      ? { label: "Last-Place Finishes", value: careerSummary.toiletBowlCount }
      : null,
  ] as Array<CareerRecord | null>).filter(
    (record): record is CareerRecord => record !== null
  );

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {records.map((record) => (
        <div
          key={record.label}
          className="rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3"
        >
          <p className="lcc2-label text-[var(--lcc-interactive)]">{record.label}</p>
          <p className="mt-1.5 font-ui text-lg font-black leading-tight text-[var(--lcc-color-text)]">
            {record.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function ProfileBadges({ owner }: { owner: LccOwner }) {
  return (
    <>
      <ProfileBadge>{formatStatus(owner.status)}</ProfileBadge>
      {owner.activeDivision && <ProfileBadge>{owner.activeDivision}</ProfileBadge>}
      {isLccCoFounder(owner.id) && (
        <ProfileBadge icon={<Crown className="h-3 w-3" />}>Co-Founder</ProfileBadge>
      )}
      {owner.commissioner && (
        <ProfileBadge icon={<Shield className="h-3 w-3" />}>
          Commissioner
        </ProfileBadge>
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
    <span className="lcc2-badge lcc2-badge--neutral gap-1">
      {icon}
      {children}
    </span>
  );
}

function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3">
      <p className="lcc2-label">
        {label}
      </p>
      <p className="mt-1 font-ui text-base font-black text-[var(--lcc-color-text)]">
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
    <section className={`lcc2-card ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <div className={`${compact ? "mb-3" : "mb-4"} flex items-center gap-3`}>
        {icon && (
          <span
            className={[
              "flex shrink-0 items-center justify-center rounded-md bg-[var(--lcc-color-midnight)] text-[var(--lcc-color-achievement)]",
              compact ? "h-8 w-8" : "h-9 w-9",
            ].join(" ")}
          >
            {icon}
          </span>
        )}
        <h2
          className={[
            "font-ui font-black leading-tight tracking-[-0.02em] text-[var(--lcc-color-text)]",
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

type TimelineItem = ProfileTimelineItem;

function OwnerQuote({ value }: { value: string }) {
  return (
    <div className="rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3">
      <div className="mb-2 flex items-center gap-2 text-[var(--lcc-color-achievement)]">
        <Quote className="h-4 w-4" aria-hidden="true" />
        <p className="lcc2-label">
          Franchise Quote
        </p>
      </div>
      <p className="font-serif text-base font-black italic leading-tight text-[var(--lcc-color-text)]">
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
    <div className="rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3">
      <p className="lcc2-label">
        {label}
      </p>
      <p className="mt-1 break-words font-ui text-base font-black leading-tight text-[var(--lcc-color-text)]">
        {value}
      </p>
    </div>
  );
}

function TradeContactContent({
  almanacProfile,
}: {
  almanacProfile: LccOwner["almanacProfile"];
}) {
  if (!almanacProfile) {
    return null;
  }

  const contactMethods = almanacProfile.preferredContactMethods ?? [];

  return (
      <div className="grid gap-2.5">
        {almanacProfile.mode && (
          <div className="rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3">
            <p className="lcc2-label">
              Team Mode
            </p>
            <p className="mt-1 font-ui text-lg font-black text-[var(--lcc-color-text)]">
              {almanacProfile.mode}
            </p>
          </div>
        )}

        {contactMethods.length > 0 && (
          <div className="rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3">
            <p className="lcc2-label">
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
  );
}

function getMeaningfulFranchiseHistory(owner: LccOwner) {
  return [...new Set([...owner.displayNameHistory, owner.managerPage.sleeperName])].filter(Boolean);
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
    <div className="grid grid-cols-1 gap-2 rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3 sm:grid-cols-2">
      {visibleItems.map((item) => (
        <div key={item.label} className="min-w-0">
          <p className="lcc2-label">
            {item.label}
          </p>
          <p className="mt-1 break-words font-ui text-sm font-black leading-tight text-[var(--lcc-color-text)]">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function getRivalOwnerIds(
  profile: LccOwner["almanacProfile"],
  ownerId: string
) {
  if (!profile) {
    return [];
  }

  const configuredIds =
    profile.rivalOwnerIds && profile.rivalOwnerIds.length > 0
      ? profile.rivalOwnerIds
      : profile.rivalOwnerId
        ? [profile.rivalOwnerId]
        : [];

  return [...new Set(configuredIds)].filter(
    (configuredId) =>
      configuredId !== ownerId && Boolean(getLccOwnerById(configuredId))
  );
}

function buildTimelineItems(
  owner: LccOwner,
  tenure: string,
  seasons: ReturnType<typeof getOwnerTimeline>["seasons"]
): TimelineItem[] {
  const items: TimelineItem[] = [];

  const firstSeason = seasons[0]?.season ?? owner.joinedYear ?? "LCC";
  const openingTitle = isLccCoFounder(owner.id)
    ? "Co-Founded Long Country Club"
    : "Joined Long Country Club";

  items.push({
    year: isLccCoFounder(owner.id) ? "2003" : String(firstSeason),
    title: openingTitle,
    detail: isLccCoFounder(owner.id)
      ? `${owner.displayName} helped co-found Long Country Club in 2003. Recorded tenure: ${tenure}.`
      : `${owner.displayName} began this LCC tenure with ${owner.managerPage.sleeperName}. Recorded tenure: ${tenure}.`,
  });

  if (owner.commissioner) {
    items.push({
      year: String(firstSeason),
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

  if (owner.status === "retired") {
    const lastSeason = seasons.at(-1)?.season ?? owner.lastSeason;

    items.push({
      year: String(lastSeason ?? "LCC"),
      title: "Retired From Active Ownership",
      detail: "Retired-owner legacy preserved in the LCC Almanac.",
    });
  }

  return items.sort((a, b) => {
    const yearA = Number(a.year);
    const yearB = Number(b.year);

    if (Number.isNaN(yearA) || Number.isNaN(yearB)) {
      return a.year.localeCompare(b.year);
    }

    return yearA - yearB;
  });
}

function formatEra(era: string | null) {
  if (era === "dynasty") {
    return "Dynasty";
  }

  if (era === "two-keeper") {
    return "Two-Keeper";
  }

  return "Unknown";
}

function formatBestFinish(place: number | null | undefined) {
  if (place === undefined || place === null) {
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

function formatSeasonFinish(place: number | null) {
  if (place === null) {
    return "—";
  }

  switch (place) {
    case 1:
      return "Champion";
    case 2:
      return "Runner-Up";
    case 3:
      return "Third Place";
    case 12:
      return "Last Place";
    default:
      return formatOrdinalPlace(place);
  }
}

function formatOrdinalPlace(place: number | null) {
  return place === null ? "—" : `${place}${getOrdinalSuffix(place)}`;
}

function isTitleAward(award: ReturnType<typeof getAwardsByOwner>[number]) {
  return /champion|title/i.test(`${award.type} ${award.label}`);
}

function formatStatus(status: LccOwner["status"]) {
  return status === "active" ? "Active" : "Retired";
}

function formatTenure(owner: LccOwner, activeSeasonCount: number) {
  const startSeason = owner.joinedYear ?? "Unknown";
  const endSeason = owner.status === "active" ? "present" : owner.lastSeason ?? "Unknown";

  return `${startSeason}-${endSeason} (${activeSeasonCount} yrs)`;
}

function formatRating(value: number | undefined, max: number) {
  if (value === undefined) {
    return undefined;
  }

  return `${value}/${max}`;
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
