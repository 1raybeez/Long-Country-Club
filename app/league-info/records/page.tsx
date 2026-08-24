import Link from "next/link";
import { BarChart3, BookOpen, Crown, GitCompareArrows, Trophy } from "lucide-react";
import { LeagueInfoShell } from "@/components/league/LeagueInfoShell";
import {
  SLEEPER_RECORD_END_SEASON,
  SLEEPER_RECORD_START_SEASON,
  getGameRecords,
  getLeagueRecords,
  getOwnerDisplayName,
  getSingleSeasonRecords,
} from "@/lib/history/leagueRecords";

const records = getLeagueRecords();
const seasonRecords = getSingleSeasonRecords();
const gameRecords = getGameRecords();

export default function LeagueRecordsPage() {
  return (
    <LeagueInfoShell>
      <main className="lcc2-page-shell">
        <div className="lcc2-page-container">
          <header className="border-b border-[var(--lcc-color-border)] pb-7 pt-1">
            <p className="lcc2-label text-[var(--lcc-brand-primary)]">Records</p>
            <h1 className="mt-2 font-ui text-4xl font-black tracking-[-0.04em] text-[var(--lcc-color-text)] sm:text-5xl">Long Country Club Record Book</h1>
            <p className="lcc2-body mt-3 max-w-3xl">The league-wide record book across LCC history, using canonical placements and complete Sleeper-era game data.</p>
          </header>

          <section className="mt-6" aria-labelledby="all-time-leaders-heading">
            <SectionHeading id="all-time-leaders-heading" icon={<Crown className="h-5 w-5" aria-hidden="true" />} eyebrow="Career and era leaders" title="All-Time Leaders" supporting={`Placement records cover 2003–${SLEEPER_RECORD_END_SEASON}; wins and scoring cover the complete Sleeper archive, ${SLEEPER_RECORD_START_SEASON}–${SLEEPER_RECORD_END_SEASON}.`} />
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Leaderboard title="Most wins" rows={records.mostWins} valueLabel="wins" />
              <Leaderboard title="Best winning percentage" rows={records.bestWinningPercentage} valueLabel="win %" formatValue={(value) => `${(value * 100).toFixed(1)}%`} />
              <Leaderboard title="Most championships" rows={records.championships} valueLabel="titles" />
              <Leaderboard title="Most playoff appearances" rows={records.playoffAppearances} valueLabel="appearances" />
              <Leaderboard title="Most championship appearances" rows={records.championshipAppearances} valueLabel="appearances" />
              <Leaderboard title="Most total points scored" rows={records.totalPoints} valueLabel="points" formatValue={(value) => value.toFixed(2)} />
            </div>
          </section>

          <section className="mt-8" aria-labelledby="single-season-heading">
            <SectionHeading id="single-season-heading" icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />} eyebrow="Complete Sleeper-era seasons" title="Single-Season Records" supporting="These scoring and record metrics use complete game coverage from 2019–2025 and are not projected for the current season." />
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <SeasonRecordCard title="Highest single-season points" record={maxBy(seasonRecords, (row) => row.points)} value={`${maxBy(seasonRecords, (row) => row.points).points.toFixed(2)} pts`} />
              <SeasonRecordCard title="Lowest single-season points" record={minBy(seasonRecords, (row) => row.points)} value={`${minBy(seasonRecords, (row) => row.points).points.toFixed(2)} pts`} />
              <SeasonRecordCard title="Best single-season win %" record={maxBy(seasonRecords, (row) => row.winningPercentage)} value={`${(maxBy(seasonRecords, (row) => row.winningPercentage).winningPercentage * 100).toFixed(1)}%`} />
            </div>
          </section>

          <section className="mt-8" aria-labelledby="game-records-heading">
            <SectionHeading id="game-records-heading" icon={<Trophy className="h-5 w-5" aria-hidden="true" />} eyebrow="Complete Sleeper-era game history" title="Game Records" supporting="Single-game records from scored regular-season and playoff matchups in the complete 2019–2025 archive." />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <GameRecordCard title="Biggest blowout" game={gameRecords.biggestBlowout} />
              <GameRecordCard title="Closest game" game={gameRecords.closestGame} />
            </div>
          </section>

          <section className="mt-8" aria-labelledby="specialized-records-heading">
            <SectionHeading id="specialized-records-heading" icon={<BookOpen className="h-5 w-5" aria-hidden="true" />} eyebrow="Go deeper" title="Specialized Records" supporting="The Record Book summarizes league-wide leaders; these destinations retain the deeper specialized experiences." />
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <SpecializedLink href="/league-info/drafts" title="Draft Records" copy="Draft-specific records and canonical pick history." />
              <SpecializedLink href="/league-info/rivalries" title="Head-to-Head / Rivalries" copy="Owner-versus-owner history and rivalry detail." />
              <SpecializedLink href="/league-info/archives" title="Statistical Archives" copy="Detailed Sleeper-era leaderboards and archive views." />
            </div>
          </section>
        </div>
      </main>
    </LeagueInfoShell>
  );
}

function SectionHeading({ id, icon, eyebrow, title, supporting }: { id: string; icon: React.ReactNode; eyebrow: string; title: string; supporting: string }) {
  return <div className="flex items-start gap-3"><div className="mt-1 text-[var(--lcc-brand-primary)]">{icon}</div><div><p className="lcc2-label text-[var(--lcc-brand-primary)]">{eyebrow}</p><h2 id={id} className="mt-1 font-ui text-2xl font-black tracking-[-0.03em] text-[var(--lcc-color-text)]">{title}</h2><p className="lcc2-body mt-2 max-w-3xl">{supporting}</p></div></div>;
}

function Leaderboard({ title, rows, valueLabel, formatValue = (value) => String(value) }: { title: string; rows: readonly { ownerId: string; ownerName: string; value: number }[]; valueLabel: string; formatValue?: (value: number) => string }) {
  const sorted = [...rows].sort((a, b) => b.value - a.value || a.ownerName.localeCompare(b.ownerName)).slice(0, 5);
  return <section className="lcc2-card overflow-hidden p-0" aria-label={title}><div className="border-b border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] px-4 py-3"><h3 className="font-ui text-sm font-black uppercase tracking-[0.05em] text-[var(--lcc-color-text)]">{title}</h3></div><div className="divide-y divide-[var(--lcc-color-border)]">{sorted.map((row, index) => <div key={row.ownerId} className="flex items-center justify-between gap-3 px-4 py-3"><div className="flex min-w-0 items-center gap-3"><span className="w-4 shrink-0 text-center font-ui text-xs font-black text-[var(--lcc-color-text-subtle)]">{index + 1}</span><span className="min-w-0 break-words font-ui text-sm font-black text-[var(--lcc-color-text)]">{row.ownerName}</span></div><span className="shrink-0 text-right font-ui text-sm font-black text-[var(--lcc-color-text)]">{formatValue(row.value)} <span className="block text-[0.6rem] uppercase tracking-wide text-[var(--lcc-color-text-muted)]">{valueLabel}</span></span></div>)}</div></section>;
}

function SeasonRecordCard({ title, record, value }: { title: string; record: ReturnType<typeof getSingleSeasonRecords>[number]; value: string }) {
  return <article className="lcc2-card"><p className="lcc2-label text-[var(--lcc-brand-primary)]">{title}</p><p className="mt-3 font-ui text-2xl font-black text-[var(--lcc-color-text)]">{value}</p><p className="mt-2 font-ui text-sm font-black text-[var(--lcc-color-text)]">{record.ownerName}</p><p className="mt-1 font-ui text-xs font-semibold text-[var(--lcc-color-text-muted)]">{record.season} season · {record.wins}-{record.losses}{record.ties ? `-${record.ties}` : ""}</p></article>;
}

function GameRecordCard({ title, game }: { title: string; game: ReturnType<typeof getGameRecords>["biggestBlowout"] }) {
  return <article className="lcc2-card"><p className="lcc2-label text-[var(--lcc-brand-primary)]">{title}</p><p className="mt-3 font-ui text-2xl font-black text-[var(--lcc-color-text)]">{game.margin.toFixed(2)} pts</p><p className="mt-3 font-ui text-sm font-black text-[var(--lcc-color-text)]">{getOwnerDisplayName(game.ownerAId)} {game.ownerAScore.toFixed(2)} — {game.ownerBScore.toFixed(2)} {getOwnerDisplayName(game.ownerBId)}</p><p className="mt-2 font-ui text-xs font-semibold text-[var(--lcc-color-text-muted)]">{game.season} season · Week {game.week ?? "—"}</p></article>;
}

function SpecializedLink({ href, title, copy }: { href: string; title: string; copy: string }) {
  return <Link href={href} className="lcc2-card lcc2-card--interactive block transition-colors hover:border-[var(--lcc-interactive)]"><div className="flex items-start justify-between gap-3"><h3 className="font-ui text-base font-black text-[var(--lcc-color-text)]">{title}</h3><GitCompareArrows className="h-4 w-4 shrink-0 text-[var(--lcc-interactive)]" aria-hidden="true" /></div><p className="lcc2-body mt-2">{copy}</p></Link>;
}

function maxBy<T>(rows: readonly T[], value: (row: T) => number) {
  return rows.reduce((best, row) => value(row) > value(best) ? row : best, rows[0]);
}

function minBy<T>(rows: readonly T[], value: (row: T) => number) {
  return rows.reduce((best, row) => value(row) < value(best) ? row : best, rows[0]);
}
