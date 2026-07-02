import Link from "next/link";
import { notFound } from "next/navigation";
import { Crown, Medal, Skull, Trophy, WalletCards } from "lucide-react";
import {
  loadAllSeasonSummaries,
  loadSeasonSummary,
} from "@/lib/history/seasonSummary";
import { loadAwardsBySeason } from "@/lib/history/awards";
import { getOwnerById } from "@/lib/ownerRegistry";

export function generateStaticParams() {
  return loadAllSeasonSummaries().map((season) => ({
    season: String(season.season),
  }));
}

type SeasonPageProps = {
  params: Promise<{
    season: string;
  }>;
};

export default async function SeasonPage({ params }: SeasonPageProps) {
  const { season } = await params;
  const seasonNumber = Number(season);

  if (!Number.isInteger(seasonNumber)) {
    notFound();
  }

  const summary = loadSeasonSummary(seasonNumber);

  if (!summary.standings) {
    notFound();
  }

  const awards = loadAwardsBySeason(seasonNumber);
  const totalPayouts =
    summary.financial?.managers.reduce(
      (total, manager) => total + (manager.payoutsReceived ?? 0),
      0
    ) ?? null;

  return (
    <main className="lcc-page">
      <div className="lcc-container py-8 sm:py-12 lg:py-14">
        <nav className="mb-5">
          <Link href="/history" className="lcc-button lcc-button-secondary">
            Back to History
          </Link>
        </nav>

        <header className="lcc-card p-6 sm:p-8">
          <p className="font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
            {formatEra(summary.era ?? null)}
          </p>
          <h1 className="mt-3 font-serif text-6xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
            {summary.season}
          </h1>
          <p className="mt-4 font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)]">
            Complete season snapshot generated from the LCC history engine.
          </p>
        </header>

        <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <HeroCard icon={<Crown />} label="Champion" value={ownerName(summary.championOwnerId ?? null)} />
          <HeroCard icon={<Medal />} label="Runner-up" value={ownerName(summary.runnerUpOwnerId ?? null)} />
          <HeroCard icon={<Medal />} label="Third Place" value={ownerName(summary.thirdPlaceOwnerId ?? null)} />
          <HeroCard icon={<Skull />} label="Toilet Bowl" value={ownerName(summary.toiletBowlOwnerId ?? null)} />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid gap-5">
            <Panel title="Final Standings" icon={<Trophy className="h-4 w-4" />}>
              <div className="overflow-hidden rounded-[var(--lcc-radius)] border border-[var(--lcc-border)]">
                {summary.standings.standings.map((record) => (
                  <div
                    key={`${record.ownerId ?? "unknown"}-${record.finalPlace ?? "unknown"}`}
                    className="grid grid-cols-[4rem_1fr] border-b border-[var(--lcc-border)] px-4 py-3 last:border-b-0"
                  >
                    <div className="font-serif text-xl font-black uppercase italic text-[var(--lcc-text)]">
                      {record.finalPlace ? formatPlace(record.finalPlace) : "—"}
                    </div>
                    <div>
                      <p className="font-ui text-sm font-black text-[var(--lcc-text)]">
                        {ownerName(record.ownerId ?? null)}
                      </p>
                      <p className="font-ui text-xs font-bold uppercase text-[var(--lcc-text-muted)]">
                        {formatEra(record.era ?? null)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {awards.length > 0 && (
              <Panel title="Awards" icon={<Medal className="h-4 w-4" />}>
                <div className="grid gap-3 md:grid-cols-2">
                  {awards.map((award) => (
                    <div
                      key={award.id}
                      className="rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-4"
                    >
                      <p className="font-ui text-[0.68rem] font-black uppercase text-[var(--lcc-gold)]">
                        {award.type}
                      </p>
                      <p className="mt-2 font-serif text-xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
                        {award.label}
                      </p>
                      <p className="mt-2 font-ui text-sm font-bold text-[var(--lcc-text-muted)]">
                        {ownerName(award.ownerId ?? null)}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>

          <aside className="grid gap-5 self-start lg:sticky lg:top-32">
            <Panel title="Financial Snapshot" icon={<WalletCards className="h-4 w-4" />} compact>
              <SideFact label="Financial Data" value={summary.financial ? "Loaded" : "Not Available"} />
              <SideFact label="Total Payouts" value={formatMoney(totalPayouts)} />
              <SideFact label="Managers" value={String(summary.standings.standings.length)} />
            </Panel>

            {summary.financial && (
              <Panel title="Payouts" icon={<WalletCards className="h-4 w-4" />} compact>
                <div className="grid gap-2">
                  {summary.financial.managers.map((manager) => (
                    <div
                      key={manager.managerId ?? manager.managerName}
                      className="rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-3"
                    >
                      <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text)]">
                        {manager.managerId ? ownerName(manager.managerId) : manager.managerName}
                      </p>
                      <p className="mt-1 font-ui text-xs font-bold text-[var(--lcc-text-muted)]">
                        Payouts {formatMoney(manager.payoutsReceived)} · Net {formatMoney(manager.balance)}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

function ownerName(ownerId: string | null) {
  if (!ownerId) return "TBD";
  return getOwnerById(ownerId)?.displayName ?? ownerId;
}

function formatEra(era: string | null) {
  if (era === "dynasty") return "Dynasty Era";
  if (era === "two-keeper") return "Two-Keeper Era";
  return "Unknown Era";
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `$${value.toLocaleString()}`;
}

function formatPlace(place: number) {
  if (place === 1) return "1st";
  if (place === 2) return "2nd";
  if (place === 3) return "3rd";
  return `${place}th`;
}

function HeroCard({
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
      <p className="mt-2 font-serif text-2xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
        {value}
      </p>
    </article>
  );
}

function Panel({
  title,
  icon,
  children,
  compact = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={`lcc-card ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--lcc-green-deep)] text-[var(--lcc-gold)]">
          {icon}
        </span>
        <h2 className="font-serif text-2xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function SideFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-3">
      <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
        {label}
      </p>
      <p className="mt-1 font-serif text-lg font-black uppercase italic text-[var(--lcc-text)]">
        {value}
      </p>
    </div>
  );
}