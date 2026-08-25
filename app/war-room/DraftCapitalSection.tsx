import { ArrowDownToLine, CalendarDays } from "lucide-react";
import type { WarRoomDraftCapital } from "@/lib/warRoom/draftCapital";

export function DraftCapitalSection({
  capital,
}: {
  readonly capital: WarRoomDraftCapital | null;
}) {
  if (!capital) {
    return (
      <section className="mt-8 lcc2-card p-5" aria-labelledby="draft-capital-heading">
        <p className="lcc2-label">Draft capital</p>
        <h2 id="draft-capital-heading" className="mt-2 font-ui text-2xl font-black text-[var(--lcc-color-text)]">
          Draft capital unavailable
        </h2>
        <p className="lcc2-body mt-2">The verified future-pick inventory is not available right now.</p>
      </section>
    );
  }

  return (
    <section className="mt-8" aria-labelledby="draft-capital-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="lcc2-section-heading__eyebrow">Verified future rookie picks</p>
          <h2 id="draft-capital-heading" className="lcc2-section-heading__title">Draft Capital</h2>
          <p className="lcc2-section-heading__supporting">Current ownership from the canonical LCC future-pick inventory.</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Draft capital summary">
          <SummaryBadge label="Total picks" value={capital.picks.length} />
          <SummaryBadge label="Acquired" value={capital.acquiredPicks.length} />
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {capital.supportedSeasons.map((season) => (
          <div key={season} className="lcc2-card p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-ui text-xl font-black text-[var(--lcc-color-text)]">{season}</h3>
              <span className="lcc2-badge lcc2-badge--neutral">{capital.picksBySeason[String(season)] ?? 0} picks</span>
            </div>
            <p className="lcc2-body mt-2 text-sm">{capital.picksBySeason[String(season)] ?? 0} of {capital.standardAnnualAllocation} standard owner picks</p>
          </div>
        ))}
      </div>

      {capital.picks.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {capital.supportedSeasons.map((season) => (
            <YearCard key={season} season={season} capital={capital} />
          ))}
        </div>
      ) : (
        <div className="lcc2-card p-5"><p className="lcc2-body">No future picks are currently assigned to this canonical owner in the verified horizon.</p></div>
      )}

      {capital.originalPicksTradedAway.length ? (
        <div className="mt-4 lcc2-card p-4" aria-labelledby="traded-away-heading">
          <div className="flex items-center gap-2"><ArrowDownToLine className="h-4 w-4 text-[var(--lcc-brand-secondary)]" aria-hidden="true" /><h3 id="traded-away-heading" className="font-ui text-base font-black text-[var(--lcc-color-text)]">Missing original picks</h3></div>
          <ul className="mt-3 space-y-2">{capital.originalPicksTradedAway.map((pick) => <li key={pick.id} className="flex flex-wrap justify-between gap-2 text-sm"><span>{pick.season} Round {pick.round}</span><span className="text-[var(--lcc-color-text-muted)]">Currently owned by {pick.currentTeamName}</span></li>)}</ul>
        </div>
      ) : null}
    </section>
  );
}

function YearCard({ season, capital }: { season: number; capital: WarRoomDraftCapital }) {
  const picks = capital.picks.filter((pick) => pick.season === season);

  return (
    <article className="lcc2-card p-4">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[var(--lcc-brand-secondary)]" aria-hidden="true" /><h3 className="font-ui text-lg font-black text-[var(--lcc-color-text)]">{season}</h3></div><span className="lcc2-badge lcc2-badge--neutral">{picks.length}</span></div>
      {picks.length ? <ul className="mt-3 space-y-2">{picks.map((pick) => <li key={pick.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] p-3"><span className="font-ui text-sm font-bold text-[var(--lcc-color-text)]">Round {pick.round}</span>{pick.originalOwnerId === pick.currentOwnerId ? <span className="lcc2-badge lcc2-badge--neutral">Own</span> : <span className="max-w-full text-right text-xs font-bold text-[var(--lcc-color-text-muted)]">From {pick.originalTeamName}</span>}</li>)}</ul> : <p className="lcc2-body mt-3 text-sm">No picks currently owned.</p>}
    </article>
  );
}

function SummaryBadge({ label, value }: { label: string; value: number }) {
  return <span className="lcc2-badge lcc2-badge--neutral"><span>{label}</span> <strong>{value}</strong></span>;
}
