'use client';

import { useState, type ReactNode, type SyntheticEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Crown,
  Medal,
  Shield,
  Skull,
  Trophy,
} from "lucide-react";
import {
  ALL_LCC_OWNERS,
  LCC_ERA_MODEL,
  getLccOwnerById,
  getLccOwnerProfileHref,
  type LccOwner,
} from "@/lib/lccOwners";
import {
  LCC_SLEEPER_MIGRATION_SEASON,
  getLccChampionsBySeason,
  getLccChampionshipGalleryBySeason,
  getLccPodiumTotalsByOwner,
  getLccLastPlaceTotalsByOwner,
  type LccChampionshipGalleryEntry,
  type LccFinalPlacementEra,
  type LccOwnerPodiumTotals,
} from "@/lib/lccFinalPlacements";
import { DEFAULT_OWNER_IMAGE, getOwnerImagePath } from "@/lib/ownerImages";
import { LeagueInfoShell } from "@/components/league/LeagueInfoShell";

type TrophyRoomTab = (typeof TROPHY_ROOM_TABS)[number]["id"];

const FALLBACK_AVATAR_SRC = DEFAULT_OWNER_IMAGE;

const TROPHY_ROOM_TABS = [
  { id: "champions", label: "Champions", icon: Crown },
  { id: "podiums", label: "Podiums", icon: Medal },
  { id: "last-place", label: "Last Place", icon: Skull },
] as const;

// TODO: Future: use Sleeper API to validate/import 2019-forward standings.
const championsBySeason = getLccChampionsBySeason();
const championshipGallery = [...getLccChampionshipGalleryBySeason()].reverse();
const podiumTotals = getLccPodiumTotalsByOwner();
const lastPlaceTotals = getLccLastPlaceTotalsByOwner();
const podiumFinishCount = podiumTotals.reduce(
  (total, owner) => total + owner.total,
  0
);
const uniqueChampionCount = new Set(
  championsBySeason.map((champion) => champion.ownerId ?? champion.alias)
).size;

export default function TrophyRoom() {
  const [activeTab, setActiveTab] = useState<TrophyRoomTab>("champions");

  return (
    <LeagueInfoShell>
      <main className="lcc2-page-shell">
      <div className="lcc2-page-container">
        <nav className="mb-5">
          <Link href="/league-info" className="lcc2-button lcc2-button--secondary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to League Info
          </Link>
        </nav>

        <TrophyRoomHero />

        <TitleLeaders />

        <TrophyRoomTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div
          id={`trophy-panel-${activeTab}`}
          role="tabpanel"
          className="mt-8"
        >
          {activeTab === "champions" && <ChampionsPanel />}
          {activeTab === "podiums" && <PodiumsPanel />}
          {activeTab === "last-place" && <LastPlacePanel />}
        </div>
      </div>
      </main>
    </LeagueInfoShell>
  );
}

function TrophyRoomHero() {
  const latestChampion = championshipGallery[0];
  const latestChampionOwner = latestChampion
    ? getPlacementOwner(
        latestChampion.championOwnerId,
        latestChampion.championAlias
      )
    : undefined;

  return (
    <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
      <div>
        <p className="lcc2-label text-[var(--lcc-brand-primary)]">League Info</p>
        <h1 className="lcc2-home-identity__title mt-2">
          Trophy Room
        </h1>
        <p className="lcc2-home-identity__supporting max-w-3xl">
          Champions, podium finishes, and infamous last-place history across every completed LCC season.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <HeroMetric
            label="Champion Seasons"
            value={String(championsBySeason.length)}
            icon={<Trophy className="h-4 w-4" aria-hidden="true" />}
          />
          <HeroMetric
            label="Unique Champions"
            value={String(uniqueChampionCount)}
            icon={<Crown className="h-4 w-4" aria-hidden="true" />}
          />
          <HeroMetric
            label="Podium Finishes"
            value={String(podiumFinishCount)}
            icon={<Award className="h-4 w-4" aria-hidden="true" />}
          />
          <HeroMetric
            label="Era Model"
            value="Two-Keeper → Dynasty"
            icon={<Shield className="h-4 w-4" aria-hidden="true" />}
            smallValue
          />
        </div>
      </div>

      {latestChampion && (
        <article className="lcc2-card lcc2-card--raised overflow-hidden p-0">
          <div className="relative h-56 overflow-hidden bg-[var(--lcc-color-midnight)]">
            <OwnerBackdropImage
              owner={latestChampionOwner}
              alias={latestChampion.championAlias}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <TrophyBadge>{latestChampion.season} Champion</TrophyBadge>
              <TrophyBadge>{formatEraLabel(latestChampion.era)}</TrophyBadge>
            </div>
          </div>
          <div className="p-5">
            <p className="lcc2-label text-[var(--lcc-semantic-achievement)]">
              Reigning Champion
            </p>
            <h2 className="mt-2 font-ui text-2xl font-black leading-tight text-[var(--lcc-color-text)]">
              {formatOwnerName(latestChampionOwner, latestChampion.championAlias)}
            </h2>
            <p className="mt-2 font-ui text-sm font-semibold text-[var(--lcc-color-text-muted)]">
              {formatOwnerTeam(latestChampionOwner)}
            </p>
          </div>
        </article>
      )}
    </header>
  );
}

function TrophyRoomTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: TrophyRoomTab;
  onTabChange: (tab: TrophyRoomTab) => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-1 rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] p-1 shadow-[var(--lcc-shadow-soft)]" role="tablist">
      {TROPHY_ROOM_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`trophy-panel-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={[
              "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 font-ui text-xs font-black uppercase transition-colors sm:flex-none",
              isActive
                ? "bg-[var(--lcc-brand-primary)] text-white"
                : "text-[var(--lcc-color-text-muted)] hover:bg-[var(--lcc-color-surface-muted)] hover:text-[var(--lcc-color-text)]",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function TitleLeaders() {
  const leaders = podiumTotals.filter((entry) => entry.gold > 0).slice(0, 5);

  return (
    <section className="lcc2-card mt-5" aria-labelledby="title-leaders-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="lcc2-label text-[var(--lcc-semantic-achievement)]">All-time titles</p>
          <h2 id="title-leaders-heading" className="mt-1 font-ui text-xl font-black text-[var(--lcc-color-text)]">Championship Leaders</h2>
        </div>
        <p className="lcc2-body">Gold totals from the final placement ledger.</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {leaders.map((entry, index) => {
          const owner = getPlacementOwner(entry.ownerId, entry.primaryAlias);
          return (
            <div key={entry.ownerId ?? entry.primaryAlias} className="flex min-w-0 items-center gap-3 rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3">
              <RankBadge rank={index + 1} />
              <OwnerAvatar owner={owner} alias={entry.primaryAlias} />
              <div className="min-w-0">
                <p className="min-w-0 break-words whitespace-normal font-ui text-sm font-black leading-tight text-[var(--lcc-color-text)]">{formatOwnerName(owner, entry.primaryAlias)}</p>
                <p className="mt-0.5 font-ui text-xs font-bold text-[var(--lcc-semantic-achievement)]">{entry.gold} {entry.gold === 1 ? "title" : "titles"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ChampionsPanel() {
  return (
    <section className="grid gap-4">
      <SectionHeading
        eyebrow="Champions"
        title="Championship Gallery By Season"
        description={`${LCC_ERA_MODEL.twoKeeper.startSeason}-${LCC_ERA_MODEL.twoKeeper.endSeason}: ${LCC_ERA_MODEL.twoKeeper.label}. ${LCC_ERA_MODEL.dynasty.startSeason}-present: ${LCC_ERA_MODEL.dynasty.label}.`}
        icon={<Crown className="h-4 w-4" aria-hidden="true" />}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {championshipGallery.map((entry) => (
          <ChampionSeasonCard key={entry.season} entry={entry} />
        ))}
      </div>
    </section>
  );
}

function ChampionSeasonCard({
  entry,
}: {
  entry: LccChampionshipGalleryEntry;
}) {
  const champion = getPlacementOwner(
    entry.championOwnerId,
    entry.championAlias
  );
  const runnerUp = entry.runnerUpAlias
    ? getPlacementOwner(entry.runnerUpOwnerId, entry.runnerUpAlias)
    : undefined;
  const thirdPlace = entry.thirdPlaceAlias
    ? getPlacementOwner(entry.thirdPlaceOwnerId, entry.thirdPlaceAlias)
    : undefined;

  return (
    <article className="lcc2-card lcc2-card--interactive group overflow-hidden p-0">
      <div className="relative h-48 overflow-hidden bg-[var(--lcc-color-midnight)]">
        <OwnerBackdropImage owner={champion} alias={entry.championAlias} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <TrophyBadge>{entry.season}</TrophyBadge>
          <TrophyBadge>{formatEraLabel(entry.era)}</TrophyBadge>
          {entry.season === LCC_SLEEPER_MIGRATION_SEASON && (
            <TrophyBadge>{LCC_ERA_MODEL.sleeperMigration.label}</TrophyBadge>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="lcc2-label text-[var(--lcc-semantic-achievement)]">
            Champion
          </p>
          <h2 className="mt-1 font-ui text-2xl font-black leading-tight text-white">
            {formatOwnerName(champion, entry.championAlias)}
          </h2>
          <p className="mt-2 break-words whitespace-normal font-ui text-xs font-semibold leading-tight text-white/75">
            {formatOwnerTeam(champion)}
          </p>
        </div>
      </div>

      <div className="grid gap-2 p-4">
        <div className="grid grid-cols-2 gap-3">
          <PodiumMiniFact
            label="Runner-Up"
            value={formatOwnerName(runnerUp, entry.runnerUpAlias)}
            tone="silver"
          />
          <PodiumMiniFact
            label="Third Place"
            value={formatOwnerName(thirdPlace, entry.thirdPlaceAlias)}
            tone="bronze"
          />
        </div>
        <div className="border-t border-[var(--lcc-color-border)] pt-3">
          <p className="lcc2-label">
            Final Field
          </p>
          <p className="mt-1 font-ui text-lg font-black leading-none text-[var(--lcc-color-text)]">
            {entry.placementCount} owners
          </p>
        </div>
      </div>
    </article>
  );
}

function PodiumsPanel() {
  return (
    <section className="grid gap-4">
      <SectionHeading
        eyebrow="Podiums"
        title="Owner Medal Table"
        description="Gold, silver, bronze, and total podium finishes are calculated from final placements."
        icon={<Medal className="h-4 w-4" aria-hidden="true" />}
      />

      <div className="lcc2-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="bg-[var(--lcc-color-midnight)] text-[var(--lcc-color-text-inverse)]">
              <tr className="font-ui text-[0.68rem] font-black uppercase">
                <th className="w-16 px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Owner</th>
                <th className="px-4 py-3 text-center">Gold</th>
                <th className="px-4 py-3 text-center">Silver</th>
                <th className="px-4 py-3 text-center">Bronze</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-left">Podium Seasons</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)]">
              {podiumTotals.map((entry, index) => {
                const owner = getPlacementOwner(
                  entry.ownerId,
                  entry.primaryAlias
                );

                return (
                  <tr
                    key={entry.ownerId ?? entry.primaryAlias}
                    className="align-middle transition-colors hover:bg-[var(--lcc-color-surface-muted)]"
                  >
                    <td className="px-4 py-4">
                      <RankBadge rank={index + 1} />
                    </td>
                    <td className="px-4 py-4">
                      <OwnerIdentity
                        owner={owner}
                        alias={entry.primaryAlias}
                        href={owner ? getLccOwnerProfileHref(owner) : undefined}
                      />
                    </td>
                    <MedalTableCell value={entry.gold} tone="gold" />
                    <MedalTableCell value={entry.silver} tone="silver" />
                    <MedalTableCell value={entry.bronze} tone="bronze" />
                    <td className="px-4 py-4 text-center">
                      <span className="font-ui text-2xl font-black leading-none text-[var(--lcc-color-text)]">
                        {entry.total}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <PodiumSeasonBreakdown entry={entry} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function LastPlacePanel() {
  const latestSeason = championshipGallery[0];
  const latestLastPlaceOwner =
    latestSeason?.lastPlaceAlias !== undefined
      ? getPlacementOwner(
          latestSeason.lastPlaceOwnerId,
          latestSeason.lastPlaceAlias
        )
      : undefined;

  return (
    <section className="grid gap-4">
      <SectionHeading
        eyebrow="Last-Place Archive"
        title="Last Place"
        description="Last-place totals are calculated from the final owner in each season placement list."
        icon={<Skull className="h-4 w-4" aria-hidden="true" />}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="lcc2-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
            <thead className="bg-[var(--lcc-color-midnight)] text-[var(--lcc-color-text-inverse)]">
                <tr className="font-ui text-[0.68rem] font-black uppercase">
                  <th className="w-16 px-4 py-3 text-left">Rank</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                <th className="px-4 py-3 text-center">Last-Place Finishes</th>
                  <th className="px-4 py-3 text-left">Last Place Seasons</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)]">
                {lastPlaceTotals.map((entry, index) => {
                  const owner = getPlacementOwner(
                    entry.ownerId,
                    entry.primaryAlias
                  );

                  return (
                    <tr
                      key={entry.ownerId ?? entry.primaryAlias}
                      className="align-middle transition-colors hover:bg-[var(--lcc-color-surface-muted)]"
                    >
                      <td className="px-4 py-4">
                        <RankBadge rank={index + 1} subdued />
                      </td>
                      <td className="px-4 py-4">
                        <OwnerIdentity
                          owner={owner}
                          alias={entry.primaryAlias}
                          href={
                            owner ? getLccOwnerProfileHref(owner) : undefined
                          }
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] px-3 font-ui text-2xl font-black leading-none text-[var(--lcc-color-text)]">
                          {entry.total}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-ui text-sm font-bold leading-6 text-[var(--lcc-color-text)]">
                          {formatSeasonList(entry.seasons)}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {latestSeason?.lastPlaceAlias && (
          <article className="lcc2-card overflow-hidden p-0">
            <div className="relative h-52 overflow-hidden bg-[var(--lcc-color-midnight)]">
              <OwnerBackdropImage
                owner={latestLastPlaceOwner}
                alias={latestSeason.lastPlaceAlias}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute left-4 top-4">
                <TrophyBadge>{latestSeason.season} Last Place</TrophyBadge>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="lcc2-label text-[var(--lcc-color-text-inverse)]">
                  Latest Shame Wall Entry
                </p>
                <h3 className="mt-1 font-ui text-2xl font-black leading-tight text-white">
                  {formatOwnerName(
                    latestLastPlaceOwner,
                    latestSeason.lastPlaceAlias
                  )}
                </h3>
              </div>
            </div>
            <div className="p-4">
              <p className="lcc2-body">
                The final placement ledger puts{" "}
                {formatOwnerName(
                  latestLastPlaceOwner,
                  latestSeason.lastPlaceAlias
                )}{" "}
                last in {latestSeason.season}.
              </p>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <div className="lcc2-label flex items-center gap-2 text-[var(--lcc-brand-primary)]">
          {icon}
          {eyebrow}
        </div>
        <h2 className="mt-2 font-ui text-2xl font-black leading-tight tracking-[-0.02em] text-[var(--lcc-color-text)] sm:text-3xl">
          {title}
        </h2>
        <p className="lcc2-body mt-2">
          {description}
        </p>
      </div>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  icon,
  smallValue = false,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  smallValue?: boolean;
}) {
  return (
    <div className="lcc2-metric-card">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-[var(--lcc-color-surface-muted)] text-[var(--lcc-interactive)]">
        {icon}
      </div>
      <p
        className={[
          "font-ui font-black leading-none text-[var(--lcc-color-text)]",
          smallValue ? "text-lg" : "text-3xl",
        ].join(" ")}
      >
        {value}
      </p>
      <p className="lcc2-label mt-2">
        {label}
      </p>
    </div>
  );
}

function OwnerIdentity({
  owner,
  alias,
  href,
}: {
  owner?: LccOwner;
  alias: string;
  href?: string;
}) {
  const content = (
    <div className="flex min-w-0 items-center gap-3">
      <OwnerAvatar owner={owner} alias={alias} />
      <div className="min-w-0">
        <p className="min-w-0 break-words whitespace-normal font-ui text-base font-black leading-tight text-[var(--lcc-color-text)]">
          {formatOwnerName(owner, alias)}
        </p>
        <p className="mt-1 min-w-0 break-words whitespace-normal font-ui text-xs font-semibold leading-tight text-[var(--lcc-color-text-muted)]">
          {formatOwnerTeam(owner)}
        </p>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--lcc-interactive-focus)]"
    >
      {content}
    </Link>
  );
}

function OwnerAvatar({ owner, alias }: { owner?: LccOwner; alias: string }) {
  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)]">
      <img
        src={getOwnerImageSrc(owner)}
        alt={formatOwnerName(owner, alias)}
        className="h-full w-full object-cover"
        style={{ objectPosition: "center 32%" }}
        onError={handleImageError}
      />
    </div>
  );
}

function OwnerBackdropImage({
  owner,
  alias,
}: {
  owner?: LccOwner;
  alias: string;
}) {
  return (
    <img
      src={getOwnerImageSrc(owner)}
      alt={formatOwnerName(owner, alias)}
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      style={{ objectPosition: "center 32%" }}
      onError={handleImageError}
    />
  );
}

function PodiumMiniFact({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "silver" | "bronze";
}) {
  const toneClass =
    tone === "silver"
      ? "bg-slate-200 text-slate-800"
      : "bg-[#8b5e34]/15 text-[#6f4525]";

  return (
    <div className="min-w-0 rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] p-3">
      <span
        className={[
          "mb-2 inline-flex rounded-[var(--lcc-radius)] px-2 py-1 font-ui text-[0.62rem] font-black uppercase",
          toneClass,
        ].join(" ")}
      >
        {label}
      </span>
      <p className="min-w-0 break-words whitespace-normal font-ui text-base font-black leading-tight text-[var(--lcc-color-text)]">
        {value}
      </p>
    </div>
  );
}

function MedalTableCell({
  value,
  tone,
}: {
  value: number;
  tone: "gold" | "silver" | "bronze";
}) {
  const toneClass = {
    gold: "border-[#c5a059]/40 bg-[#c5a059]/20 text-[var(--lcc-text)]",
    silver: "border-slate-300 bg-slate-100 text-slate-800",
    bronze: "border-[#8b5e34]/25 bg-[#8b5e34]/15 text-[#6f4525]",
  }[tone];

  return (
    <td className="px-4 py-4 text-center">
      <span
        className={[
          "inline-flex h-10 min-w-10 items-center justify-center rounded-[var(--lcc-radius)] border px-3 font-ui text-2xl font-black leading-none",
          toneClass,
        ].join(" ")}
      >
        {value}
      </span>
    </td>
  );
}

function PodiumSeasonBreakdown({
  entry,
}: {
  entry: LccOwnerPodiumTotals;
}) {
  return (
    <div className="grid gap-1 font-ui text-xs font-bold leading-5 text-[var(--lcc-color-text-muted)]">
      <p>
        <span className="font-black uppercase text-[var(--lcc-color-text)]">Gold:</span>{" "}
        {formatSeasonList(entry.seasons.gold)}
      </p>
      <p>
        <span className="font-black uppercase text-[var(--lcc-color-text)]">Silver:</span>{" "}
        {formatSeasonList(entry.seasons.silver)}
      </p>
      <p>
        <span className="font-black uppercase text-[var(--lcc-color-text)]">Bronze:</span>{" "}
        {formatSeasonList(entry.seasons.bronze)}
      </p>
    </div>
  );
}

function RankBadge({
  rank,
  subdued = false,
}: {
  rank: number;
  subdued?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex h-8 min-w-8 items-center justify-center rounded-[var(--lcc-radius)] border px-2 font-ui text-xs font-black uppercase",
        subdued
          ? "border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] text-[var(--lcc-color-text)]"
          : "border-[color-mix(in_srgb,var(--lcc-semantic-achievement)_45%,transparent)] bg-[color-mix(in_srgb,var(--lcc-semantic-achievement)_12%,var(--lcc-color-surface))] text-[var(--lcc-color-text)]",
      ].join(" ")}
    >
      {rank}
    </span>
  );
}

function TrophyBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[var(--lcc-radius)] border border-white/20 bg-black/45 px-2.5 py-1 font-ui text-[0.65rem] font-black uppercase text-white backdrop-blur">
      {children}
    </span>
  );
}

function getPlacementOwner(
  ownerId: string | undefined,
  alias: string
): LccOwner | undefined {
  return (
    (ownerId ? getLccOwnerById(ownerId) : undefined) ??
    ALL_LCC_OWNERS.find(
      (owner) =>
        owner.aliases.includes(alias) ||
        owner.nickname === alias ||
        owner.displayName === alias
    )
  );
}

function formatOwnerName(owner: LccOwner | undefined, alias?: string) {
  return owner?.displayName ?? alias ?? "Unknown Owner";
}

function formatOwnerTeam(owner: LccOwner | undefined) {
  return owner?.managerPage.sleeperName ?? "Historical LCC owner";
}

function formatEraLabel(era: LccFinalPlacementEra) {
  return era === "dynasty"
    ? LCC_ERA_MODEL.dynasty.label
    : LCC_ERA_MODEL.twoKeeper.label;
}

function formatSeasonList(seasons: readonly number[]) {
  return seasons.length ? seasons.join(", ") : "None";
}

function getOwnerImageSrc(owner: LccOwner | undefined) {
  return owner ? getOwnerImagePath(owner.id) : FALLBACK_AVATAR_SRC;
}

function handleImageError(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = FALLBACK_AVATAR_SRC;
}
