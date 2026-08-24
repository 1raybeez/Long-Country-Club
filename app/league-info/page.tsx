import Link from "next/link";
import { CalendarDays, History, Shield, Trophy } from "lucide-react";
import { LeagueInfoShell } from "@/components/league/LeagueInfoShell";
import { LCC_CURRENT_SEASON } from "@/lib/leagueConstants";
import { ACTIVE_LCC_OWNERS, LCC_ERA_MODEL, getLccOwnerById } from "@/lib/lccOwners";
import { getLccChampionBySeason, LCC_SLEEPER_MIGRATION_SEASON } from "@/lib/lccFinalPlacements";

const latestCompletedSeason = LCC_CURRENT_SEASON - 1;
const reigningChampion = getLccChampionBySeason(latestCompletedSeason);
const reigningChampionName = reigningChampion?.ownerId
  ? getLccOwnerById(reigningChampion.ownerId)?.displayName ?? reigningChampion.alias
  : reigningChampion?.alias ?? "Unavailable";

const snapshotFacts = [
  ["League", "Long Country Club"],
  ["Founded", String(LCC_ERA_MODEL.twoKeeper.startSeason)],
  ["Format", "Dynasty"],
  ["Owners", String(ACTIVE_LCC_OWNERS.length)],
  ["Scoring", "Half-Point PPR"],
  ["Season", String(LCC_CURRENT_SEASON)],
] as const;

export default function ClubhouseInfoPage() {
  return (
    <LeagueInfoShell>
      <main className="lcc2-page-shell">
        <div className="lcc2-page-container">
          <header className="border-b border-[var(--lcc-color-border)] pb-8 pt-8 sm:pb-10 sm:pt-10">
            <p className="lcc2-label text-[var(--lcc-brand-primary)]">Overview</p>
            <h2 className="lcc2-home-identity__title mt-2">Long Country Club at a Glance</h2>
            <p className="lcc2-home-identity__supporting mt-3 max-w-3xl">
              The permanent reference point for what LCC is, how it is structured, and the history that connects its dynasty eras.
            </p>
          </header>

          <section className="pt-8" aria-labelledby="league-snapshot-heading">
            <p className="lcc2-label text-[var(--lcc-brand-primary)]">The essentials</p>
            <h3 id="league-snapshot-heading" className="mt-2 font-ui text-2xl font-black tracking-[-0.03em] text-[var(--lcc-color-text)]">
              League Snapshot
            </h3>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {snapshotFacts.map(([label, value]) => (
                <div key={label} className="lcc2-card p-4">
                  <p className="lcc2-label text-[var(--lcc-brand-primary)]">{label}</p>
                  <p className="mt-2 font-ui text-base font-black leading-tight text-[var(--lcc-color-text)]">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2" aria-label="League reference context">
            <OverviewContextCard eyebrow="Right now" title="Current Season" icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}>
              <p>{LCC_CURRENT_SEASON} is the active LCC season and the league is operating in its {LCC_ERA_MODEL.dynasty.label}.</p>
              <p className="mt-3 text-sm text-[var(--lcc-color-text-muted)]">
                Reigning champion entering the season: <strong className="text-[var(--lcc-color-text)]">{reigningChampionName}</strong> ({latestCompletedSeason}).
              </p>
            </OverviewContextCard>

            <OverviewContextCard eyebrow="The game" title="Dynasty Format" icon={<Shield className="h-5 w-5" aria-hidden="true" />}>
              <p>Twelve franchises build through a 23-player roster, a 9-player starting lineup, and an annual four-round rookie draft.</p>
              <p className="mt-3 text-sm text-[var(--lcc-color-text-muted)]">The format includes a five-player Taxi Squad, three IR slots, and Half-Point PPR scoring.</p>
              <ReferenceLink href="/league-info/constitution" label="Read the Constitution" />
            </OverviewContextCard>

            <OverviewContextCard eyebrow="The legacy" title="League History" icon={<History className="h-5 w-5" aria-hidden="true" />}>
              <p>LCC has continuous league history since {LCC_ERA_MODEL.twoKeeper.startSeason}, migrated to Sleeper in {LCC_SLEEPER_MIGRATION_SEASON}, and entered the Dynasty Era in {LCC_ERA_MODEL.dynasty.startSeason}.</p>
              <p className="mt-3 text-sm text-[var(--lcc-color-text-muted)]">Championship and franchise continuity are preserved through the latest completed season.</p>
              <ReferenceLink href="/league-info/trophy-room" label="Explore League History" />
            </OverviewContextCard>

            <OverviewContextCard eyebrow="The record book" title="All-Time Records" icon={<Trophy className="h-5 w-5" aria-hidden="true" />}>
              <p>Historical placement, championship, matchup, draft, wins, points, and lineup-efficiency records are preserved across the LCC archive.</p>
              <p className="mt-3 text-sm text-[var(--lcc-color-text-muted)]">A dedicated Records destination is planned; the existing Archives page is the current statistical reference.</p>
              <ReferenceLink href="/league-info/archives" label="Explore the Archives" />
            </OverviewContextCard>
          </section>
        </div>
      </main>
    </LeagueInfoShell>
  );
}

function OverviewContextCard({ eyebrow, title, icon, children }: { eyebrow: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <article className="lcc2-card lcc2-card--raised p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="lcc2-label text-[var(--lcc-brand-primary)]">{eyebrow}</p>
          <h3 className="mt-2 font-ui text-xl font-black tracking-[-0.02em] text-[var(--lcc-color-text)]">{title}</h3>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] text-[var(--lcc-interactive)]">{icon}</span>
      </div>
      <div className="lcc2-body mt-4 max-w-2xl">{children}</div>
    </article>
  );
}

function ReferenceLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="mt-4 inline-flex items-center gap-2 font-ui text-xs font-black uppercase tracking-[0.06em] text-[var(--lcc-interactive)] underline decoration-[var(--lcc-interactive)] underline-offset-4">{label}</Link>;
}
