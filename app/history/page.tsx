import Link from "next/link";
import {
  CalendarDays,
  Crown,
  Medal,
  Trophy,
  WalletCards,
} from "lucide-react";
import { loadAllSeasonSummaries } from "@/lib/history/seasonSummary";
import { getOwnerById } from "@/lib/ownerRegistry";

function ownerName(ownerId?: string | null) {
  if (!ownerId) return "TBD";
  return getOwnerById(ownerId)?.displayName ?? ownerId;
}

function formatMoney(value: number | null) {
  if (value === null) return "—";
  return `$${value.toLocaleString()}`;
}

function getTotalPayouts(
  season: ReturnType<typeof loadAllSeasonSummaries>[number]
) {
  if (!season.financial) return null;

  return season.financial.managers.reduce((total, manager) => {
    return (
      total +
      (typeof manager.payoutsReceived === "number"
        ? manager.payoutsReceived
        : 0)
    );
  }, 0);
}

function formatEra(era?: string | null) {
  if (era === "dynasty") return "Dynasty Era";
  if (era === "two-keeper") return "Two-Keeper Era";
  return "Unknown Era";
}

export default function HistoryPage() {
  const seasons = loadAllSeasonSummaries().sort(
    (a, b) => b.season - a.season
  );

  const totalSeasons = seasons.length;
  const dynastySeasons = seasons.filter(
    (season) => season.era === "dynasty"
  ).length;
  const keeperSeasons = seasons.filter(
    (season) => season.era === "two-keeper"
  ).length;
  const seasonsWithFinancials = seasons.filter(
    (season) => season.financial
  ).length;

  return (
    <main className="min-h-screen bg-[var(--lcc-page-bg)] px-4 py-8 text-[var(--lcc-text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="lcc-button lcc-button-secondary">
            ← Back Home
          </Link>

          <Link href="/league-info" className="lcc-button lcc-button-secondary">
            League Info
          </Link>
        </div>

        <header className="mx-auto max-w-4xl text-center">
          <img
            src="/logos/long-country-club-ffl.png"
            alt="Long Country Club FFL"
            className="mx-auto mb-8 w-full max-w-[280px]"
          />

          <p className="font-ui text-xs font-black uppercase tracking-[0.28em] text-[var(--lcc-gold)]">
            The Long Country Club Almanac
          </p>

          <h1 className="mt-4 font-serif text-5xl font-black uppercase italic leading-none text-[var(--lcc-text)] sm:text-6xl lg:text-7xl">
            League History
          </h1>

          <p className="mx-auto mt-5 max-w-2xl font-ui text-base font-medium leading-7 text-[var(--lcc-text-muted)]">
            Every completed season, champion, podium finish, era marker, and financial record currently loaded into the LCC historical engine.
          </p>
        </header>

        <section className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={<CalendarDays className="h-5 w-5" />}
            label="Seasons"
            value={String(totalSeasons)}
            helper="2003 through 2025"
          />
          <MetricCard
            icon={<Trophy className="h-5 w-5" />}
            label="Two-Keeper Era"
            value={String(keeperSeasons)}
            helper="Original league era"
          />
          <MetricCard
            icon={<Crown className="h-5 w-5" />}
            label="Dynasty Era"
            value={String(dynastySeasons)}
            helper="Modern LCC era"
          />
          <MetricCard
            icon={<WalletCards className="h-5 w-5" />}
            label="Financial Seasons"
            value={String(seasonsWithFinancials)}
            helper="Payout records loaded"
          />
        </section>

        <section className="mt-12 rounded-[2rem] border border-[var(--lcc-border)] bg-[var(--lcc-surface)] shadow-[var(--lcc-shadow-soft)]">
          <div className="border-b border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] px-6 py-5">
            <p className="font-ui text-xs font-black uppercase tracking-wide text-[var(--lcc-gold)]">
              Season Ledger
            </p>
            <h2 className="mt-2 font-serif text-3xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
              Complete Historical Timeline
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2">
            {seasons.map((season) => {
              const totalPayouts = getTotalPayouts(season);

              return (
                <article
                  key={season.season}
                  id={`season-${season.season}`}
                  className="rounded-[1.5rem] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-5 shadow-[var(--lcc-shadow-soft)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-ui text-xs font-black uppercase tracking-wide text-[var(--lcc-gold)]">
                        {formatEra(season.era)}
                      </p>
                      <h3 className="mt-2 font-serif text-5xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
                        {season.season}
                      </h3>
                    </div>

                    <div className="rounded-full border border-[var(--lcc-border-strong)] bg-[var(--lcc-surface)] px-4 py-2 font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
                      {season.financial ? "Financials Loaded" : "Standings Only"}
                    </div>
                  </div>

                  <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <SeasonFact
                      icon={<Crown className="h-4 w-4" />}
                      label="Champion"
                      value={ownerName(season.championOwnerId)}
                    />
                    <SeasonFact
                      icon={<Medal className="h-4 w-4" />}
                      label="Runner-up"
                      value={ownerName(season.runnerUpOwnerId)}
                    />
                    <SeasonFact
                      icon={<Medal className="h-4 w-4" />}
                      label="Third Place"
                      value={ownerName(season.thirdPlaceOwnerId)}
                    />
                    <SeasonFact
                      icon={<Trophy className="h-4 w-4" />}
                      label="Toilet Bowl"
                      value={ownerName(season.toiletBowlOwnerId)}
                    />
                  </dl>

                  <div className="mt-5 rounded-[1rem] border border-[var(--lcc-border)] bg-[var(--lcc-surface)] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-ui text-[0.68rem] font-black uppercase text-[var(--lcc-gold)]">
                          Total Recorded Payouts
                        </p>
                        <p className="mt-1 font-serif text-3xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
                          {formatMoney(totalPayouts)}
                        </p>
                      </div>
                      <WalletCards className="h-7 w-7 text-[var(--lcc-gold)]" />
                    </div>
                  </div>

                  <div className="mt-5">
                    <Link
                      href={`/history/${season.season}`}
                      className="lcc-button lcc-button-secondary"
                    >
                      View Season →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-[var(--lcc-border)] bg-[var(--lcc-surface)] p-6 text-center shadow-[var(--lcc-shadow-soft)]">
      <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[var(--lcc-gold-soft)] text-[var(--lcc-text)]">
        {icon}
      </div>
      <p className="font-ui text-xs font-black uppercase tracking-wide text-[var(--lcc-gold)]">
        {label}
      </p>
      <p className="mt-2 font-serif text-4xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
        {value}
      </p>
      <p className="mt-3 font-ui text-xs font-bold uppercase text-[var(--lcc-text-muted)]">
        {helper}
      </p>
    </article>
  );
}

function SeasonFact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] border border-[var(--lcc-border)] bg-[var(--lcc-surface)] p-4">
      <dt className="flex items-center gap-2 font-ui text-[0.68rem] font-black uppercase text-[var(--lcc-gold)]">
        {icon}
        {label}
      </dt>
      <dd className="mt-2 font-ui text-sm font-black text-[var(--lcc-text)]">
        {value}
      </dd>
    </div>
  );
}