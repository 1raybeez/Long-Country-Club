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
  getLccToiletBowlTotalsByOwner,
  type LccChampionshipGalleryEntry,
  type LccFinalPlacementEra,
  type LccOwnerPodiumTotals,
} from "@/lib/lccFinalPlacements";
import { DEFAULT_OWNER_IMAGE, getOwnerImagePath } from "@/lib/ownerImages";

type TrophyRoomTab = (typeof TROPHY_ROOM_TABS)[number]["id"];

const FALLBACK_AVATAR_SRC = DEFAULT_OWNER_IMAGE;

const TROPHY_ROOM_TABS = [
  { id: "champions", label: "Champions", icon: Crown },
  { id: "podiums", label: "Podiums", icon: Medal },
  { id: "toilets", label: "Toilet Bowls", icon: Skull },
] as const;

// TODO: Future: use Sleeper API to validate/import 2019-forward standings.
const championsBySeason = getLccChampionsBySeason();
const championshipGallery = [...getLccChampionshipGalleryBySeason()].reverse();
const podiumTotals = getLccPodiumTotalsByOwner();
const toiletBowlTotals = getLccToiletBowlTotalsByOwner();
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
    <main className="lcc-page">
      <div className="lcc-container py-8 sm:py-12 lg:py-14">
        <nav className="mb-5">
          <Link href="/league-info" className="lcc-button lcc-button-secondary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Clubhouse
          </Link>
        </nav>

        <TrophyRoomHero />

        <TrophyRoomTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div
          id={`trophy-panel-${activeTab}`}
          role="tabpanel"
          className="mt-8"
        >
          {activeTab === "champions" && <ChampionsPanel />}
          {activeTab === "podiums" && <PodiumsPanel />}
          {activeTab === "toilets" && <ToiletBowlsPanel />}
        </div>
      </div>
    </main>
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
    <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
      <div>
        <p className="lcc-page-kicker">Trophy Room</p>
        <h1 className="lcc-page-title mt-3">
          Champions <span className="text-[var(--lcc-gold)]">Gallery</span>
        </h1>
        <p className="mt-5 max-w-3xl font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)] sm:text-base">
          Champions, podium finishes, and last-place history are sourced from
          the Long Country Club final placement ledger.
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
            value={`${LCC_ERA_MODEL.twoKeeper.startSeason}-${LCC_ERA_MODEL.twoKeeper.endSeason} / ${LCC_ERA_MODEL.dynasty.startSeason}-present`}
            icon={<Shield className="h-4 w-4" aria-hidden="true" />}
            smallValue
          />
        </div>
      </div>

      {latestChampion && (
        <article className="overflow-hidden rounded-[var(--lcc-radius)] border border-[#d1ae66]/35 bg-[#0f2a19] text-[#f8f4ea] shadow-[var(--lcc-shadow)]">
          <div className="relative h-64 overflow-hidden bg-[#0f2a19]">
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
            <p className="font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
              Latest Completed Season
            </p>
            <h2 className="mt-2 font-serif text-3xl font-black uppercase italic leading-none">
              {formatOwnerName(latestChampionOwner, latestChampion.championAlias)}
            </h2>
            <p className="mt-3 font-ui text-xs font-black uppercase text-[#f8f4ea]/70">
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
    <div className="mt-8 flex flex-wrap gap-2 rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface)] p-1 shadow-[var(--lcc-shadow-soft)]">
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
              "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--lcc-radius)] px-4 py-2 font-ui text-xs font-black uppercase transition-colors sm:flex-none",
              isActive
                ? "bg-[var(--lcc-green-deep)] text-[var(--lcc-surface)]"
                : "text-[var(--lcc-text-muted)] hover:bg-[var(--lcc-surface-muted)] hover:text-[var(--lcc-text)]",
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

function ChampionsPanel() {
  return (
    <section className="grid gap-5">
      <SectionHeading
        eyebrow="Champions"
        title="Championship Gallery By Season"
        description={`${LCC_ERA_MODEL.twoKeeper.startSeason}-${LCC_ERA_MODEL.twoKeeper.endSeason}: ${LCC_ERA_MODEL.twoKeeper.label}. ${LCC_ERA_MODEL.dynasty.startSeason}-present: ${LCC_ERA_MODEL.dynasty.label}.`}
        icon={<Crown className="h-4 w-4" aria-hidden="true" />}
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
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
    <article className="lcc-card group overflow-hidden transition-all hover:-translate-y-1 hover:border-[var(--lcc-border-strong)] hover:shadow-[var(--lcc-shadow)]">
      <div className="relative h-56 overflow-hidden bg-[var(--lcc-green-deep)]">
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
          <p className="font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
            Champion
          </p>
          <h2 className="mt-1 font-serif text-3xl font-black uppercase italic leading-none text-white">
            {formatOwnerName(champion, entry.championAlias)}
          </h2>
          <p className="mt-2 truncate font-ui text-xs font-black uppercase text-white/70">
            {formatOwnerTeam(champion)}
          </p>
        </div>
      </div>

      <div className="grid gap-3 p-5">
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
        <div className="border-t border-[var(--lcc-border)] pt-3">
          <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
            Final Field
          </p>
          <p className="mt-1 font-serif text-lg font-black uppercase italic leading-none text-[var(--lcc-text)]">
            {entry.placementCount} owners
          </p>
        </div>
      </div>
    </article>
  );
}

function PodiumsPanel() {
  return (
    <section className="grid gap-5">
      <SectionHeading
        eyebrow="Podiums"
        title="Owner Medal Table"
        description="Gold, silver, bronze, and total podium finishes are calculated from final placements."
        icon={<Medal className="h-4 w-4" aria-hidden="true" />}
      />

      <div className="lcc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="bg-[var(--lcc-green-deep)] text-[var(--lcc-surface)]">
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
            <tbody className="divide-y divide-[var(--lcc-border)] bg-[var(--lcc-surface)]">
              {podiumTotals.map((entry, index) => {
                const owner = getPlacementOwner(
                  entry.ownerId,
                  entry.primaryAlias
                );

                return (
                  <tr
                    key={entry.ownerId ?? entry.primaryAlias}
                    className="align-middle transition-colors hover:bg-[var(--lcc-surface-muted)]"
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
                      <span className="font-serif text-2xl font-black italic leading-none text-[var(--lcc-text)]">
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

function ToiletBowlsPanel() {
  const latestSeason = championshipGallery[0];
  const latestToiletOwner =
    latestSeason?.toiletBowlAlias !== undefined
      ? getPlacementOwner(
          latestSeason.toiletBowlOwnerId,
          latestSeason.toiletBowlAlias
        )
      : undefined;

  return (
    <section className="grid gap-5">
      <SectionHeading
        eyebrow="Shame Wall"
        title="Toilet Bowls / Last Place"
        description="Last-place totals are calculated from the final owner in each season placement list."
        icon={<Skull className="h-4 w-4" aria-hidden="true" />}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="lcc-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead className="bg-[var(--lcc-green-deep)] text-[var(--lcc-surface)]">
                <tr className="font-ui text-[0.68rem] font-black uppercase">
                  <th className="w-16 px-4 py-3 text-left">Rank</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-center">Toilets</th>
                  <th className="px-4 py-3 text-left">Last Place Seasons</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--lcc-border)] bg-[var(--lcc-surface)]">
                {toiletBowlTotals.map((entry, index) => {
                  const owner = getPlacementOwner(
                    entry.ownerId,
                    entry.primaryAlias
                  );

                  return (
                    <tr
                      key={entry.ownerId ?? entry.primaryAlias}
                      className="align-middle transition-colors hover:bg-[var(--lcc-surface-muted)]"
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
                        <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] px-3 font-serif text-2xl font-black italic leading-none text-[var(--lcc-text)]">
                          {entry.total}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-ui text-sm font-bold leading-6 text-[var(--lcc-text)]">
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

        {latestSeason?.toiletBowlAlias && (
          <article className="overflow-hidden rounded-[var(--lcc-radius)] border border-[var(--lcc-border-strong)] bg-[var(--lcc-surface)] shadow-[var(--lcc-shadow-soft)]">
            <div className="relative h-60 overflow-hidden bg-[var(--lcc-green-deep)]">
              <OwnerBackdropImage
                owner={latestToiletOwner}
                alias={latestSeason.toiletBowlAlias}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute left-4 top-4">
                <TrophyBadge>{latestSeason.season} Toilet Bowl</TrophyBadge>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
                  Latest Shame Wall Entry
                </p>
                <h3 className="mt-1 font-serif text-3xl font-black uppercase italic leading-none text-white">
                  {formatOwnerName(
                    latestToiletOwner,
                    latestSeason.toiletBowlAlias
                  )}
                </h3>
              </div>
            </div>
            <div className="p-5">
              <p className="font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)]">
                The final placement ledger puts{" "}
                {formatOwnerName(
                  latestToiletOwner,
                  latestSeason.toiletBowlAlias
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
        <div className="lcc-badge gap-2">
          {icon}
          {eyebrow}
        </div>
        <h2 className="mt-3 font-serif text-3xl font-black uppercase italic leading-none text-[var(--lcc-text)] sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)]">
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
    <div className="rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface)] p-4 shadow-[var(--lcc-shadow-soft)]">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-[var(--lcc-radius)] bg-[var(--lcc-gold-soft)] text-[var(--lcc-text)]">
        {icon}
      </div>
      <p
        className={[
          "font-serif font-black uppercase italic leading-none text-[var(--lcc-text)]",
          smallValue ? "text-lg" : "text-3xl",
        ].join(" ")}
      >
        {value}
      </p>
      <p className="mt-2 font-ui text-[0.68rem] font-black uppercase text-[var(--lcc-text-muted)]">
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
        <p className="truncate font-serif text-xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
          {formatOwnerName(owner, alias)}
        </p>
        <p className="mt-1 truncate font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
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
      className="block rounded-[var(--lcc-radius)] focus:outline-none focus:ring-2 focus:ring-[var(--lcc-gold)]"
    >
      {content}
    </Link>
  );
}

function OwnerAvatar({ owner, alias }: { owner?: LccOwner; alias: string }) {
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)]">
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
    <div className="min-w-0 rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-3">
      <span
        className={[
          "mb-2 inline-flex rounded-[var(--lcc-radius)] px-2 py-1 font-ui text-[0.62rem] font-black uppercase",
          toneClass,
        ].join(" ")}
      >
        {label}
      </span>
      <p className="truncate font-serif text-base font-black uppercase italic leading-none text-[var(--lcc-text)]">
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
          "inline-flex h-10 min-w-10 items-center justify-center rounded-[var(--lcc-radius)] border px-3 font-serif text-2xl font-black italic leading-none",
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
    <div className="grid gap-1 font-ui text-xs font-bold leading-5 text-[var(--lcc-text-muted)]">
      <p>
        <span className="font-black uppercase text-[var(--lcc-text)]">Gold:</span>{" "}
        {formatSeasonList(entry.seasons.gold)}
      </p>
      <p>
        <span className="font-black uppercase text-[var(--lcc-text)]">Silver:</span>{" "}
        {formatSeasonList(entry.seasons.silver)}
      </p>
      <p>
        <span className="font-black uppercase text-[var(--lcc-text)]">Bronze:</span>{" "}
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
          ? "border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] text-[var(--lcc-text)]"
          : "border-[var(--lcc-border-strong)] bg-[var(--lcc-gold-soft)] text-[var(--lcc-text)]",
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
