'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Crown,
  History,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { LeagueInfoShell } from "@/components/league/LeagueInfoShell";
import { getLccOwnerBySleeperUserId } from "@/lib/lccOwners";
import { getOwnerImagePath } from "@/lib/ownerImages";
import type {
  ArchiveCoverage,
  ArchiveLeaderEntry,
  ArchiveOwnerAggregate,
  ArchiveSeasonRecord,
} from "@/lib/types/archive";

type LeaderCardId = "wins" | "points" | "best_season" | "worst_season" | "winpct" | "efficiency";
type CardIcon = typeof Trophy;

const ARCHIVE_CARD_LABEL = "Sleeper Era · 2019–2025";

export default function ArchivesClient({ archive }: { archive: ArchiveCoverage }) {
  const [expandedCard, setExpandedCard] = useState<LeaderCardId | null>(null);
  const cards = buildLeaderCards(archive);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const frameId = window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
    return () => {
      window.cancelAnimationFrame(frameId);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  return (
    <LeagueInfoShell>
      <main className="lcc2-page-shell">
        <div className="lcc2-page-container">
          <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link href="/league-info" className="lcc2-button lcc2-button--secondary">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to League Info
              </Link>
              <p className="lcc2-label mt-7 text-[var(--lcc-brand-primary)]">League Info</p>
              <h1 className="lcc2-home-identity__title mt-2">League Archives</h1>
              <p className="lcc2-home-identity__supporting max-w-3xl">Detailed statistical leaderboards from LCC&apos;s Sleeper-era archive.</p>
            </div>
            <div className="lcc2-badge lcc2-badge--info self-start lg:self-end">Sleeper Era · 2019–2025</div>
          </div>

          <section className="mb-6 grid gap-3 md:grid-cols-2" aria-label="Archive coverage">
            <div className="lcc2-card">
              <p className="lcc2-label text-[var(--lcc-brand-primary)]">Detailed statistical coverage</p>
              <p className="lcc2-body mt-2">Roster, scoring, win percentage, and lineup-efficiency records cover completed Sleeper seasons from 2019–2025.</p>
            </div>
            <div className="lcc2-card">
              <p className="lcc2-label text-[var(--lcc-brand-primary)]">Historical placements</p>
              <p className="lcc2-body mt-2">Champions, podiums, and last-place history from 2003–2025 are preserved in the <Link href="/league-info/trophy-room" className="font-bold text-[var(--lcc-brand-primary)] underline decoration-[var(--lcc-color-accent)] underline-offset-4">Trophy Room</Link>.</p>
            </div>
          </section>

          <ArchiveCoverageNotice archive={archive} />

          {!archive.hasUsableData ? (
            <div className="lcc2-card flex min-h-56 flex-col items-center justify-center gap-4 text-center" role="alert">
              <div>
                <p className="lcc2-label text-[var(--lcc-brand-primary)]">Archive unavailable</p>
                <p className="lcc2-body mt-2">No usable archived roster data is available for the requested seasons.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <LeaderCard key={card.id} {...card} expandedCard={expandedCard} setExpandedCard={setExpandedCard} />
              ))}
            </div>
          )}
        </div>
      </main>
    </LeagueInfoShell>
  );
}

function ArchiveCoverageNotice({ archive }: { archive: ArchiveCoverage }) {
  const partial = archive.seasons.filter((season) => season.status === "partial");
  const failed = archive.seasons.filter((season) => season.status === "failed");
  if (partial.length === 0 && failed.length === 0) {
    return <div className="lcc2-card mb-6 border-[var(--lcc-semantic-success)]" role="status"><p className="lcc2-label text-[var(--lcc-semantic-success)]">Archive coverage complete</p><p className="lcc2-body mt-2">All expected Sleeper archive seasons from 2019–2025 loaded successfully.</p></div>;
  }
  return <div className="lcc2-card mb-6 border-[var(--lcc-semantic-warning)]" role="alert"><p className="lcc2-label text-[var(--lcc-semantic-warning)]">Archive coverage incomplete</p><div className="lcc2-body mt-2 space-y-1">{partial.map((season) => <p key={`partial-${season.season}`}>{season.season}: partial — {season.warnings.join(" ")}</p>)}{failed.map((season) => <p key={`failed-${season.season}`}>{season.season}: unavailable — {season.errors.join(" ")}</p>)}</div></div>;
}

function buildLeaderCards(archive: ArchiveCoverage) {
  const aggregates = archive.aggregates;
  const seasonRecords = archive.seasonRecords;
  return [
    { id: "wins" as const, title: "All-Time Wins", icon: Trophy, data: aggregates.map((manager) => leaderEntry(manager, manager.wins, "Wins")).sort((a, b) => b.value - a.value) },
    { id: "points" as const, title: "All-Time Points", icon: TrendingUp, data: aggregates.map((manager) => leaderEntry(manager, manager.fpts, "Points")).sort((a, b) => b.value - a.value) },
    { id: "best_season" as const, title: "Best Season", icon: History, data: seasonRecords.map((record) => leaderEntry(record, record.fpts, "Points")).sort((a, b) => b.value - a.value) },
    { id: "worst_season" as const, title: "Lowest Season", icon: ArrowDown, data: seasonRecords.filter((record) => record.fpts > 500).map((record) => leaderEntry(record, record.fpts, "Points")).sort((a, b) => a.value - b.value) },
    { id: "winpct" as const, title: "Best Win %", icon: Crown, data: aggregates.filter((manager) => manager.seasons >= 2).map((manager) => { const games = manager.wins + manager.losses; return leaderEntry(manager, games ? (manager.wins / games) * 100 : 0, "Win Pct", formatPercent(manager.wins, games)); }).sort((a, b) => b.value - a.value) },
    { id: "efficiency" as const, title: "Lineup Efficiency", icon: Zap, data: aggregates.filter((manager) => manager.ppts > 0).map((manager) => leaderEntry(manager, (manager.fpts / manager.ppts) * 100, "Start %", formatPercent(manager.fpts, manager.ppts))).sort((a, b) => b.value - a.value) },
  ];
}

function leaderEntry(manager: ArchiveOwnerAggregate | ArchiveSeasonRecord, value: number, label: string, displayValue = value.toLocaleString(undefined, { maximumFractionDigits: 0 })): ArchiveLeaderEntry {
  return { id: manager.id, realName: manager.realName, teamName: manager.teamName, avatar: manager.avatar, year: "year" in manager ? manager.year : undefined, value, displayValue, label };
}

function formatPercent(numerator: number, denominator: number) {
  return denominator ? `${((numerator / denominator) * 100).toFixed(1)}%` : "0.0%";
}

function LeaderCard({ id, title, icon: Icon, data, expandedCard, setExpandedCard }: { id: LeaderCardId; title: string; icon: CardIcon; data: readonly ArchiveLeaderEntry[]; expandedCard: LeaderCardId | null; setExpandedCard: (id: LeaderCardId | null) => void }) {
  const isExpanded = expandedCard === id;
  const list = isExpanded ? data : data.slice(0, 5);
  return <section className="lcc2-card flex h-full flex-col overflow-hidden p-0" aria-labelledby={`${id}-heading`}>
    <div className="border-b border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] px-4 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--lcc-color-surface-raised)] text-[var(--lcc-brand-primary)]"><Icon className="h-5 w-5" aria-hidden="true" /></div><h2 id={`${id}-heading`} className="font-ui text-sm font-black uppercase tracking-[0.06em] text-[var(--lcc-color-text)]">{title}</h2></div><p className="lcc2-label mt-3">{ARCHIVE_CARD_LABEL}</p></div>
    <div className="flex-grow divide-y divide-[var(--lcc-color-border)]">{list.map((manager, index) => <div key={`${manager.id}-${manager.year ?? "all"}`} className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-[var(--lcc-color-surface-muted)]"><div className="flex min-w-0 items-center gap-3"><span className={`w-4 shrink-0 text-center font-ui text-sm font-black ${index === 0 ? "text-[var(--lcc-color-accent)]" : "text-[var(--lcc-color-text-subtle)]"}`}>{index + 1}</span><div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)]">{getArchiveAvatarSrc(manager) ? <img src={getArchiveAvatarSrc(manager) ?? undefined} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center font-ui text-xs font-black text-[var(--lcc-color-text-muted)]">{manager.realName.charAt(0)}</div>}</div><div className="min-w-0"><span className="block break-words whitespace-normal font-ui text-xs font-black leading-tight text-[var(--lcc-color-text)]">{manager.realName}</span><span className="mt-1 block break-words whitespace-normal font-ui text-[0.65rem] font-semibold leading-tight text-[var(--lcc-color-text-muted)]">{manager.teamName} {manager.year && `• ${manager.year}`}</span></div></div><div className="shrink-0 text-right"><span className="block font-ui text-sm font-black leading-none text-[var(--lcc-color-text)]">{manager.displayValue}</span><span className="font-ui text-[0.6rem] font-black uppercase leading-none text-[var(--lcc-color-text-muted)]">{manager.label}</span></div></div>)}</div>
    <button type="button" onClick={() => setExpandedCard(isExpanded ? null : id)} aria-expanded={isExpanded} className="lcc2-button lcc2-button--secondary w-full rounded-none border-x-0 border-b-0">{isExpanded ? "Show Less" : "View Full Ranks"} {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</button>
  </section>;
}

function getArchiveAvatarSrc(manager: ArchiveLeaderEntry) {
  const owner = getLccOwnerBySleeperUserId(manager.id);
  return owner ? getOwnerImagePath(owner.id) : manager.avatar ? `https://sleepercdn.com/avatars/thumbs/${manager.avatar}` : null;
}
