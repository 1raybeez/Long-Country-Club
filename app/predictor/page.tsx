import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { getApprovedPreseasonSnapshot } from "@/lib/predictor";
import { ACTIVE_LCC_OWNERS, getLccOwnerProfileHref } from "@/lib/lccOwners";
import { getOwnerImagePath } from "@/lib/ownerImages";
import PredictorForecastList, { type PredictorForecastView } from "./PredictorForecastList";

export default function PredictorPage() {
  const snapshot = getApprovedPreseasonSnapshot();
  const forecasts = snapshot.teams;
  const dataCutoff = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(snapshot.dataCutoff));
  const views: readonly PredictorForecastView[] = forecasts.map((forecast) => {
    const owner = ACTIVE_LCC_OWNERS.find((candidate) => candidate.id === forecast.ownerId);
    return {
      ...forecast,
      ownerImagePath: getOwnerImagePath(forecast.ownerId),
      managerProfileHref: owner ? getLccOwnerProfileHref(owner) : null,
    };
  });

  return (
    <main className="lcc2-page-shell">
      <div className="lcc2-page-container">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-ui text-sm font-black uppercase text-[var(--lcc-color-text-muted)] transition-colors hover:text-[var(--lcc-interactive)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Home
        </Link>

        <header className="mt-4 lcc2-card lcc2-card--raised overflow-hidden">
          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-end">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--lcc-color-midnight)] text-[var(--lcc-brand-primary)]"><TrendingUp className="h-5 w-5" aria-hidden="true" /></span>
                <p className="lcc2-label text-[var(--lcc-brand-primary)]">Predictor</p>
              </div>
              <h1 className="lcc2-home-identity__title mt-3">2026 Team Strength Forecast</h1>
              <p className="lcc2-home-identity__supporting mt-2 max-w-3xl">A league-relative preseason read of the current drafted LCC rosters using expected lineup strength, active depth, and positional balance.</p>
            </div>
            <div className="lcc2-metric-card"><p className="lcc2-metric-card__label">Teams ranked</p><p className="lcc2-metric-card__value">{views.length}</p><p className="mt-1 font-ui text-[0.65rem] font-black uppercase tracking-[0.08em] text-[var(--lcc-color-text-muted)]">Preseason forecast</p></div>
          </div>
          <div className="grid gap-3 border-t border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-4">
            <div><p className="lcc2-label text-[var(--lcc-brand-secondary)]">Preseason forecast</p><p className="lcc2-body mt-1 max-w-3xl">No 2026 LCC games have been played. This forecast uses roster construction and available historical/player baseline evidence; it will evolve when 2026 scoring and matchup data exist.</p></div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 font-ui text-[0.65rem] font-black uppercase tracking-[0.06em] text-[var(--lcc-color-text-muted)]"><span>Model · {snapshot.modelVersion}</span><span>Data cutoff · {dataCutoff}</span></div>
          </div>
        </header>

        <section className="mt-8" aria-labelledby="forecast-order-heading">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="lcc2-label text-[var(--lcc-brand-primary)]">Comparative team strength</p><h2 id="forecast-order-heading" className="mt-2 font-ui text-2xl font-black tracking-[-0.03em] text-[var(--lcc-color-text)] sm:text-3xl">Preseason Forecast Order</h2></div><div className="space-y-1 sm:text-right"><p className="lcc2-body">Team Strength is not a playoff or championship probability.</p><p className="font-ui text-xs font-semibold text-[var(--lcc-color-text-muted)]">Close scores are clusters, not decisive rank gaps.</p></div></div>
          <PredictorForecastList forecasts={views} />
        </section>

        <details className="mt-6 lcc2-card overflow-hidden">
          <summary className="cursor-pointer list-none px-4 py-4 font-ui text-sm font-black uppercase tracking-[0.06em] text-[var(--lcc-interactive)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--lcc-interactive-focus)]">Methodology and interpretation</summary>
          <div className="grid gap-5 border-t border-[var(--lcc-color-border)] p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div><p className="lcc2-label">Team Strength Index</p><div className="mt-3 grid gap-2 sm:grid-cols-3"><MethodologyWeight label="Expected starting lineup" value="70%" /><MethodologyWeight label="Active depth" value="20%" /><MethodologyWeight label="Positional balance" value="10%" /></div></div>
            <div className="space-y-2"><p className="lcc2-label">Reading the forecast</p><p className="lcc2-body">All component scores are relative to the 12 current LCC rosters. Rookies without NFL history use a conservative position-relative rookie-market adapter and remain separate from historical evidence.</p><p className="lcc2-body">Evidence reflects how complete the model&apos;s roster, lineup, historical, and rookie inputs are. It is not the probability that a team will finish at its forecast position. Exact records, playoff odds, and championship odds are not part of preseason-v1.</p></div>
          </div>
        </details>
      </div>
    </main>
  );
}

function MethodologyWeight({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3"><p className="font-ui text-xl font-black text-[var(--lcc-color-text)]">{value}</p><p className="mt-1 font-ui text-[0.65rem] font-black uppercase leading-tight tracking-[0.05em] text-[var(--lcc-color-text-muted)]">{label}</p></div>;
}
