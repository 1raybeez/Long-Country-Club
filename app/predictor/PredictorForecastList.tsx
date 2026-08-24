"use client";

import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";
import type { PredictorPositionStrength, PredictorTeamForecast } from "@/lib/predictor";

export type PredictorForecastView = PredictorTeamForecast & {
  readonly ownerImagePath: string;
  readonly managerProfileHref: string | null;
};

const POSITION_ORDER = ["QB", "RB", "WR", "TE", "K", "DST"] as const;

export default function PredictorForecastList({ forecasts }: { readonly forecasts: readonly PredictorForecastView[] }) {
  return <ol className="space-y-3" aria-label="Preseason forecast order">{forecasts.map((forecast) => <ForecastCard key={forecast.ownerId} forecast={forecast} />)}</ol>;
}

function ForecastCard({ forecast }: { forecast: PredictorForecastView }) {
  const [expanded, setExpanded] = useState(false);
  const detailId = `predictor-detail-${forecast.ownerId}`;
  return (
    <li>
      <article className={`overflow-hidden rounded-2xl border bg-[var(--lcc-color-surface-raised)] transition-shadow ${expanded ? "border-[var(--lcc-interactive)] shadow-[0_10px_28px_rgba(15,23,42,0.08)]" : "border-[var(--lcc-color-border)]"}`}>
        <div className="grid gap-4 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-5">
          <div className="flex items-center gap-3 sm:contents">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--lcc-color-surface-muted)] font-ui text-sm font-black text-[var(--lcc-color-text-muted)] sm:h-12 sm:w-12">#{forecast.forecastOrder}</div>
            <div className="flex min-w-0 items-center gap-3">
              <img src={forecast.ownerImagePath} alt="" className="h-10 w-10 shrink-0 rounded-xl border border-[var(--lcc-color-border)] object-cover sm:h-12 sm:w-12" />
              <div className="min-w-0"><p className="truncate font-ui text-base font-black text-[var(--lcc-color-text)] sm:text-lg">{forecast.teamName}</p><p className="truncate font-ui text-xs font-semibold text-[var(--lcc-color-text-muted)]">{forecast.ownerName}</p></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:col-start-3 sm:flex sm:items-center sm:gap-4">
            <div className="rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] px-3 py-2 sm:min-w-[6.5rem]"><p className="font-ui text-[0.58rem] font-black uppercase tracking-[0.07em] text-[var(--lcc-color-text-muted)]">Team Strength</p><p className="mt-1 font-ui text-2xl font-black leading-none tracking-[-0.04em] text-[var(--lcc-color-text)]">{forecast.teamStrengthScore.toFixed(1)}</p></div>
            <div className="flex flex-wrap items-center gap-1.5 sm:max-w-[9rem] sm:justify-end"><span className={`lcc2-badge ${getTierTone(forecast.tier)}`}>{forecast.tier}</span><span className="lcc2-badge lcc2-badge--info">{formatEvidence(forecast.confidence)}</span></div>
          </div>
        </div>
        <div className="grid gap-3 border-t border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:px-5">
          <Signal label="Key strength" value={forecast.keyStrength} />
          <Signal label="Key concern" value={forecast.keyConcern} warning={forecast.keyConcern.includes("NO EXPECTED STARTER")} />
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            {forecast.managerProfileHref ? <Link href={forecast.managerProfileHref} className="inline-flex min-h-10 items-center gap-1 font-ui text-xs font-black uppercase tracking-[0.05em] text-[var(--lcc-interactive)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)]">View Manager <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></Link> : null}
            <button type="button" aria-expanded={expanded} aria-controls={detailId} onClick={() => setExpanded((value) => !value)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[var(--lcc-color-border)] px-3 py-2 font-ui text-xs font-black uppercase tracking-[0.05em] text-[var(--lcc-interactive)] transition-colors hover:bg-[var(--lcc-color-surface-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)]">{expanded ? "Hide details" : "View details"}<ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" /></button>
          </div>
        </div>
        {expanded ? <ForecastDetail id={detailId} forecast={forecast} /> : null}
      </article>
    </li>
  );
}

function ForecastDetail({ id, forecast }: { id: string; forecast: PredictorForecastView }) {
  return <div id={id} className="space-y-6 border-t border-[var(--lcc-color-border)] p-4 sm:p-5">
    <section aria-labelledby={`${id}-components`}><DetailHeading id={`${id}-components`}>Team Strength Components</DetailHeading><div className="mt-3 grid gap-3 sm:grid-cols-3"><ScoreBar label="Expected lineup" value={forecast.lineupStrengthScore} /><ScoreBar label="Active depth" value={forecast.depthStrengthScore} /><ScoreBar label="Positional balance" value={forecast.balanceScore} /></div></section>
    <section aria-labelledby={`${id}-positions`}><DetailHeading id={`${id}-positions`}>Position Group Strength</DetailHeading><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{POSITION_ORDER.map((position) => <PositionScore key={position} position={position} group={forecast.positionStrengths.find((candidate) => candidate.position === position)} />)}</div></section>
    <section aria-labelledby={`${id}-coverage`}><DetailHeading id={`${id}-coverage`}>Coverage</DetailHeading><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><CoverageMetric label="Expected lineup" value={`${forecast.expectedLineupResolved} / ${forecast.expectedLineupRequired}`} /><CoverageMetric label="Historical baseline" value={`${forecast.historicalBaselineResolved} / ${forecast.historicalBaselineTotal}`} /><CoverageMetric label="Rookie estimates" value={String(forecast.coverage.rookieMarketBaselineCount)} /><CoverageMetric label="Evidence coverage" value={formatEvidence(forecast.confidence)} /></div>{forecast.keyConcern.includes("NO EXPECTED STARTER") ? <p className="mt-3 font-ui text-xs font-semibold text-[var(--lcc-semantic-warning)]">{forecast.keyConcern}</p> : null}</section>
  </div>;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return <div className="rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3"><div className="flex items-center justify-between gap-2"><p className="font-ui text-xs font-black uppercase tracking-[0.05em] text-[var(--lcc-color-text-muted)]">{label}</p><p className="font-ui text-sm font-black text-[var(--lcc-color-text)]">{safeValue.toFixed(0)}</p></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--lcc-color-surface-muted)]" aria-hidden="true"><div className="h-full rounded-full bg-[var(--lcc-interactive)]" style={{ width: `${safeValue}%` }} /></div><p className="mt-2 font-ui text-[0.62rem] font-semibold text-[var(--lcc-color-text-muted)]">League-relative index</p></div>;
}

function PositionScore({ position, group }: { position: string; group?: PredictorPositionStrength }) {
  const value = group?.relativeIndex;
  return <div className="rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] px-3 py-2.5"><div className="flex items-center justify-between gap-2"><p className="font-ui text-xs font-black text-[var(--lcc-color-text)]">{position}</p><p className="font-ui text-sm font-black text-[var(--lcc-color-text)]">{value === null || value === undefined ? "—" : value.toFixed(0)}</p></div><p className="mt-1 font-ui text-[0.6rem] font-semibold uppercase tracking-[0.05em] text-[var(--lcc-color-text-muted)]">{group?.coverage ?? "unavailable"}</p></div>;
}

function CoverageMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3"><p className="font-ui text-lg font-black text-[var(--lcc-color-text)]">{value}</p><p className="mt-1 font-ui text-[0.6rem] font-black uppercase tracking-[0.05em] text-[var(--lcc-color-text-muted)]">{label}</p></div>;
}

function Signal({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return <div className="min-w-0"><p className="font-ui text-[0.6rem] font-black uppercase tracking-[0.07em] text-[var(--lcc-color-text-muted)]">{label}</p><p className={`mt-1 truncate font-ui text-sm font-black ${warning ? "text-[var(--lcc-semantic-warning)]" : "text-[var(--lcc-color-text)]"}`}>{value}</p></div>;
}

function DetailHeading({ id, children }: { id: string; children: string }) {
  return <h3 id={id} className="font-ui text-sm font-black uppercase tracking-[0.06em] text-[var(--lcc-color-text)]">{children}</h3>;
}

function getTierTone(tier: PredictorTeamForecast["tier"]) {
  if (tier === "CONTENDER") return "lcc2-badge--achievement";
  if (tier === "STRONG") return "lcc2-badge--positive";
  if (tier === "IN THE MIX") return "lcc2-badge--info";
  return "lcc2-badge--neutral";
}

function formatEvidence(value: PredictorTeamForecast["confidence"]) {
  return `${value} EVIDENCE`;
}
