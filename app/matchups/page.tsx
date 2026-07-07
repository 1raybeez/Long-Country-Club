import Link from "next/link";
import { CalendarDays, Swords, Trophy } from "lucide-react";
import { loadAllMatchups } from "@/lib/history/matchups";
import { getOwnerById } from "@/lib/ownerRegistry";

export default function MatchupsPage() {
  const matchups = loadAllMatchups().slice().reverse();

  return (
    <main className="lcc-page">
      <div className="lcc-container py-8 sm:py-12 lg:py-14">
        <header className="lcc-card p-6 sm:p-8">
          <p className="font-ui text-xs font-black uppercase tracking-[0.25em] text-[var(--lcc-gold)]">
            Long Country Club
          </p>
          <h1 className="mt-3 font-serif text-5xl font-black uppercase italic leading-none text-[var(--lcc-text)] sm:text-6xl">
            Matchup Center
          </h1>
          <p className="mt-4 max-w-3xl font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)] sm:text-base">
            Full Sleeper-era matchup archive generated from historical matchup data.
          </p>
        </header>

        <section className="mt-5 grid gap-5 md:grid-cols-3">
          <StatCard
            icon={<Swords className="h-5 w-5" />}
            label="Historical Games"
            value={String(matchups.length)}
          />
          <StatCard
            icon={<CalendarDays className="h-5 w-5" />}
            label="Seasons"
            value="2019-2025"
          />
          <StatCard
            icon={<Trophy className="h-5 w-5" />}
            label="Playoff Games"
            value={String(
              matchups.filter(
                (matchup) =>
                  matchup.type === "playoff" || matchup.type === "championship"
              ).length
            )}
          />
        </section>

        <section className="mt-8 lcc-card p-5 sm:p-6">
          <h2 className="font-serif text-3xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
            Full Matchup Archive
          </h2>

          <div className="mt-5 overflow-hidden rounded-[var(--lcc-radius)] border border-[var(--lcc-border)]">
            {matchups.map((matchup) => (
              <div
                key={`${matchup.season}-${matchup.week}-${matchup.ownerAId}-${matchup.ownerBId}`}
                className="grid gap-3 border-b border-[var(--lcc-border)] px-4 py-4 last:border-b-0 md:grid-cols-[6rem_1fr_8rem]"
              >
                <div className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
                  {matchup.season}
                  <br />
                  Week {matchup.week}
                </div>

                <div className="font-ui text-sm font-bold text-[var(--lcc-text)]">
                  <ScoreLine
                    ownerId={matchup.ownerAId}
                    score={matchup.ownerAScore}
                    winner={matchup.winnerOwnerId === matchup.ownerAId}
                  />
                  <ScoreLine
                    ownerId={matchup.ownerBId}
                    score={matchup.ownerBScore}
                    winner={matchup.winnerOwnerId === matchup.ownerBId}
                  />
                </div>

                <div className="flex flex-col items-start gap-2 md:items-end">
                  <span className="rounded-full border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] px-3 py-1 font-ui text-[0.65rem] font-black uppercase text-[var(--lcc-text-muted)]">
                    {formatType(matchup.type)}
                  </span>

                  <Link
                    href={`/matchups/head-to-head/${matchup.ownerAId}-vs-${matchup.ownerBId}`}
                    className="font-ui text-xs font-black uppercase text-[var(--lcc-gold)] hover:text-[var(--lcc-text)]"
                  >
                    View H2H →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function ScoreLine({
  ownerId,
  score,
  winner,
}: {
  ownerId: string;
  score: number | null;
  winner: boolean;
}) {
  return (
    <div
      className={
        winner
          ? "font-black text-[var(--lcc-text)]"
          : "font-bold text-[var(--lcc-text-muted)]"
      }
    >
      {winner ? "🏆 " : ""}
      {ownerName(ownerId)} {formatScore(score)}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="lcc-card p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[var(--lcc-green-deep)] text-[var(--lcc-gold)]">
        {icon}
      </div>
      <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
        {label}
      </p>
      <p className="mt-2 font-serif text-4xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
        {value}
      </p>
    </article>
  );
}

function ownerName(ownerId: string) {
  return getOwnerById(ownerId)?.displayName ?? ownerId;
}

function formatScore(score: number | null) {
  return score === null ? "—" : score.toFixed(2);
}

function formatType(type: string) {
  if (type === "regularSeason") return "Regular";
  if (type === "playoff") return "Playoff";
  if (type === "championship") return "Championship";
  return "Game";
}