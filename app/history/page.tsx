import Link from "next/link";
import { CalendarDays, Crown, History, Trophy } from "lucide-react";
import { HistoryChildNav } from "@/components/league/HistoryChildNav";
import { LeagueInfoShell } from "@/components/league/LeagueInfoShell";
import { LCC_CURRENT_SEASON } from "@/lib/leagueConstants";
import {
  getLccChampionBySeason,
  getLccChampionshipGalleryBySeason,
  getLccPodiumTotalsByOwner,
  LCC_FINAL_PLACEMENT_SEASONS,
} from "@/lib/lccFinalPlacements";
import { LCC_ERA_MODEL, getLccOwnerById } from "@/lib/lccOwners";
import { loadAllSeasonSummaries } from "@/lib/history/seasonSummary";

const completedSeasonCount = LCC_FINAL_PLACEMENT_SEASONS.length;
const latestCompletedSeason = LCC_FINAL_PLACEMENT_SEASONS.at(-1) ?? LCC_CURRENT_SEASON - 1;
const latestChampion = getLccChampionBySeason(latestCompletedSeason);
const latestChampionName = latestChampion?.ownerId
  ? getLccOwnerById(latestChampion.ownerId)?.displayName ?? latestChampion.alias
  : latestChampion?.alias ?? "Unavailable";
const recentChampions = [...getLccChampionshipGalleryBySeason()].reverse().slice(0, 5);
const titleLeaders = getLccPodiumTotalsByOwner().filter((owner) => owner.gold > 0).slice(0, 5);
const seasonSummaries = loadAllSeasonSummaries().sort((a, b) => b.season - a.season);

export default function HistoryPage() {
  return (
    <LeagueInfoShell>
      <main className="lcc2-page-shell">
        <div className="lcc2-page-container">
          <HistoryChildNav />

          <header className="border-b border-[var(--lcc-color-border)] pb-8 pt-2 sm:pb-10">
            <p className="lcc2-label text-[var(--lcc-brand-primary)]">History</p>
            <h2 className="lcc2-home-identity__title mt-2">Long Country Club History</h2>
            <p className="lcc2-home-identity__supporting mt-3 max-w-3xl">
              The archive of LCC seasons, champions, franchises, and statistical record across the league&apos;s continuous history.
            </p>
          </header>

          <section className="pt-8" aria-labelledby="history-snapshot-heading">
            <p className="lcc2-label text-[var(--lcc-brand-primary)]">History at a glance</p>
            <h3 id="history-snapshot-heading" className="mt-2 font-ui text-2xl font-black tracking-[-0.03em] text-[var(--lcc-color-text)]">The LCC archive</h3>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <HistoryMetric label="Founded" value={String(LCC_ERA_MODEL.twoKeeper.startSeason)} />
              <HistoryMetric label="Completed Seasons" value={String(completedSeasonCount)} />
              <HistoryMetric label="Championships" value={String(completedSeasonCount)} />
              <HistoryMetric label="Reigning Champion" value={latestChampionName} />
              <HistoryMetric label="Sleeper Era Since" value={String(LCC_ERA_MODEL.sleeperMigration.season)} />
              <HistoryMetric label="Dynasty Era Since" value={String(LCC_ERA_MODEL.dynasty.startSeason)} />
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-3" aria-label="League eras">
            <EraCard label={LCC_ERA_MODEL.twoKeeper.label} period={`${LCC_ERA_MODEL.twoKeeper.startSeason}–${LCC_ERA_MODEL.twoKeeper.endSeason}`} detail="The league&apos;s original keeper format before the Dynasty Era." />
            <EraCard label="Sleeper Migration" period={String(LCC_ERA_MODEL.sleeperMigration.season)} detail="A league milestone within the Two-Keeper Era and the beginning of the Sleeper-era archive." />
            <EraCard label="Dynasty Era" period={`${LCC_ERA_MODEL.dynasty.startSeason}–present`} detail="The current long-term roster-building era." />
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]" aria-labelledby="championship-context-heading">
            <div className="lcc2-card lcc2-card--raised p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="lcc2-label text-[var(--lcc-brand-primary)]">Championship context</p>
                  <h3 id="championship-context-heading" className="mt-2 font-ui text-2xl font-black tracking-[-0.03em] text-[var(--lcc-color-text)]">Recent champions</h3>
                </div>
                <Trophy className="h-6 w-6 text-[var(--lcc-semantic-achievement)]" aria-hidden="true" />
              </div>
              <div className="mt-5 divide-y divide-[var(--lcc-color-border)]">
                {recentChampions.map((champion) => (
                  <div key={champion.season} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-ui text-sm font-black text-[var(--lcc-color-text)]">{ownerName(champion.championOwnerId, champion.championAlias)}</p>
                      <p className="mt-1 font-ui text-xs font-semibold text-[var(--lcc-color-text-muted)]">{champion.season} · {formatEra(champion.era)}</p>
                    </div>
                    <Crown className="h-4 w-4 shrink-0 text-[var(--lcc-semantic-achievement)]" aria-hidden="true" />
                  </div>
                ))}
              </div>
              <Link href="/league-info/trophy-room" className="mt-5 inline-flex font-ui text-xs font-black uppercase tracking-[0.06em] text-[var(--lcc-interactive)] underline underline-offset-4">Explore the Trophy Room</Link>
            </div>

            <aside className="lcc2-card p-5 sm:p-6" aria-labelledby="title-leaders-heading">
              <p className="lcc2-label text-[var(--lcc-brand-primary)]">All-time titles</p>
              <h3 id="title-leaders-heading" className="mt-2 font-ui text-xl font-black text-[var(--lcc-color-text)]">Title leaders</h3>
              <div className="mt-4 space-y-3">
                {titleLeaders.map((leader) => (
                  <div key={leader.ownerId ?? leader.primaryAlias} className="flex items-center justify-between gap-3">
                    <span className="font-ui text-sm font-black text-[var(--lcc-color-text)]">{ownerName(leader.ownerId, leader.primaryAlias)}</span>
                    <span className="font-ui text-sm font-black text-[var(--lcc-semantic-achievement)]">{leader.gold}</span>
                  </div>
                ))}
              </div>
            </aside>
          </section>

          <section id="season-explorer" className="mt-8" aria-labelledby="season-explorer-heading">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="lcc2-label text-[var(--lcc-brand-primary)]">Season history</p>
                <h3 id="season-explorer-heading" className="mt-2 font-ui text-2xl font-black tracking-[-0.03em] text-[var(--lcc-color-text)]">Explore the seasons</h3>
              </div>
              <History className="hidden h-6 w-6 text-[var(--lcc-interactive)] sm:block" aria-hidden="true" />
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {seasonSummaries.map((season) => (
                <Link key={season.season} href={`/history/${season.season}`} className="lcc2-card lcc2-card--interactive flex items-center justify-between gap-4 p-4 transition-colors hover:border-[var(--lcc-interactive)]">
                  <div>
                    <p className="lcc2-label text-[var(--lcc-brand-primary)]">{formatEra(season.era)}</p>
                    <p className="mt-1 font-ui text-xl font-black text-[var(--lcc-color-text)]">{season.season}</p>
                  </div>
                  <span className="text-right">
                    <span className="block font-ui text-xs font-black uppercase text-[var(--lcc-color-text-muted)]">Champion</span>
                    <span className="mt-1 block font-ui text-sm font-black text-[var(--lcc-color-text)]">{ownerName(season.championOwnerId, "Unavailable")}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-2" aria-label="Deeper historical archives">
            <Link href="/league-info/archives" className="lcc2-card lcc2-card--interactive p-5 transition-colors hover:border-[var(--lcc-interactive)]">
              <div className="flex items-start justify-between gap-4"><div><p className="lcc2-label text-[var(--lcc-brand-primary)]">Statistical archive</p><h3 className="mt-2 font-ui text-xl font-black text-[var(--lcc-color-text)]">League Archives</h3></div><CalendarDays className="h-5 w-5 text-[var(--lcc-interactive)]" aria-hidden="true" /></div>
              <p className="lcc2-body mt-3">Explore Sleeper-era leaderboards for wins, points, winning percentage, best seasons, and lineup efficiency.</p>
            </Link>
            <Link href="/league-info/trophy-room" className="lcc2-card lcc2-card--interactive p-5 transition-colors hover:border-[var(--lcc-interactive)]">
              <div className="flex items-start justify-between gap-4"><div><p className="lcc2-label text-[var(--lcc-brand-primary)]">Champions archive</p><h3 className="mt-2 font-ui text-xl font-black text-[var(--lcc-color-text)]">Trophy Room</h3></div><Trophy className="h-5 w-5 text-[var(--lcc-semantic-achievement)]" aria-hidden="true" /></div>
              <p className="lcc2-body mt-3">Open the full champions, podiums, last-place, title-leader, and championship-gallery experience.</p>
            </Link>
          </section>
        </div>
      </main>
    </LeagueInfoShell>
  );
}

function HistoryMetric({ label, value }: { label: string; value: string }) {
  return <div className="lcc2-card p-4"><p className="lcc2-label text-[var(--lcc-brand-primary)]">{label}</p><p className="mt-2 break-words font-ui text-base font-black leading-tight text-[var(--lcc-color-text)]">{value}</p></div>;
}

function EraCard({ label, period, detail }: { label: string; period: string; detail: string }) {
  return <article className="lcc2-card p-5"><p className="lcc2-label text-[var(--lcc-brand-primary)]">{label}</p><p className="mt-2 font-ui text-xl font-black text-[var(--lcc-color-text)]">{period}</p><p className="lcc2-body mt-2">{detail}</p></article>;
}

function ownerName(ownerId: string | undefined | null, fallback: string) {
  return ownerId ? getLccOwnerById(ownerId)?.displayName ?? fallback : fallback;
}

function formatEra(era: string | null | undefined) {
  return era === "dynasty" ? "Dynasty Era" : era === "two-keeper" ? "Two-Keeper Era" : "Era unavailable";
}
