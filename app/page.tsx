import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Trophy,
  Users,
} from "lucide-react";
import { ACTIVE_LCC_OWNERS } from "@/lib/lccOwners";
import { getLccChampionBySeason } from "@/lib/lccFinalPlacements";
import { loadStandingsBySeason } from "@/lib/history/standings";
import { loadDraftEventsBySeason } from "@/lib/history/drafts";
import { LCC_CURRENT_SEASON } from "@/lib/leagueConstants";
import { getOwnerById } from "@/lib/ownerRegistry";
import { getOwnerImagePath } from "@/lib/ownerImages";
import {
  getApprovedPreseasonTeamStrengthForecasts,
  type PredictorTeamForecast,
} from "@/lib/predictor";
import {
  getHomeTeamLogoUrl,
  HOME_SEASON_CONFIG,
} from "@/lib/homeSeasonConfig";

const CURRENT_HOME_CONFIG = HOME_SEASON_CONFIG[LCC_CURRENT_SEASON];
const REIGNING_CHAMPION = getLccChampionBySeason(LCC_CURRENT_SEASON - 1);
const CURRENT_ROOKIE_DRAFT = loadDraftEventsBySeason(LCC_CURRENT_SEASON).find(
  (draft) => draft.draftType === "rookie"
);
const CURRENT_STANDINGS = loadStandingsBySeason(LCC_CURRENT_SEASON);

export default function HomePage() {
  return (
    <main className="lcc2-home-shell">
      <div className="lcc2-home-container">
        <HomeDashboardIdentity />
        <HomeDashboardTopRow />
        <HomePredictorPreview />
        <SeasonReadiness />
      </div>
    </main>
  );
}

function HomePredictorPreview() {
  const forecasts = getHomePredictorForecasts();

  return (
    <section className="mt-8" aria-labelledby="home-predictor-heading">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="lcc2-section-heading__eyebrow">Predictor</p>
          <h2 id="home-predictor-heading" className="lcc2-section-heading__title">
            2026 Preseason Top 5
          </h2>
          <p className="lcc2-body mt-2">Current Team Strength forecast based on drafted 2026 rosters.</p>
        </div>
        <p className="lcc2-label">Preseason · Team Strength index</p>
      </div>

      <div className="lcc2-card lcc2-card--raised overflow-hidden p-4 sm:p-5">
        {forecasts.length > 0 ? (
          <ol aria-label="Top five preseason forecast teams" className="divide-y divide-[var(--lcc-color-border)]">
            {forecasts.map((forecast) => (
              <li key={forecast.ownerId} className="flex min-w-0 items-center gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--lcc-color-surface-muted)] font-ui text-xs font-black text-[var(--lcc-color-text-muted)]">
                  #{forecast.forecastOrder}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words font-ui text-sm font-black leading-tight text-[var(--lcc-color-text)] sm:text-base">
                    {forecast.teamName}
                  </p>
                  <p className="mt-1 truncate font-ui text-xs font-semibold text-[var(--lcc-color-text-muted)]">
                    {forecast.ownerName}
                  </p>
                </div>
                <span className="lcc2-badge lcc2-badge--neutral shrink-0">{forecast.tier}</span>
                <div className="w-[4.7rem] shrink-0 text-right">
                  <p className="font-ui text-lg font-black leading-none text-[var(--lcc-color-text)]">{forecast.teamStrengthScore.toFixed(1)}</p>
                  <p className="mt-1 font-ui text-[0.58rem] font-black uppercase tracking-[0.05em] text-[var(--lcc-color-text-muted)]">Team Strength</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="py-2">
            <p className="font-ui text-sm font-black text-[var(--lcc-color-text)]">2026 forecast temporarily unavailable</p>
            <p className="lcc2-body mt-1">Open Predictor for the current forecast state.</p>
          </div>
        )}

        <div className="mt-4 border-t border-[var(--lcc-color-border)] pt-4">
          <Link href="/predictor" className="lcc2-button lcc2-button--secondary w-full sm:w-auto">
            View full Predictor
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function getHomePredictorForecasts(): readonly PredictorTeamForecast[] {
  try {
    return getApprovedPreseasonTeamStrengthForecasts().slice(0, 5);
  } catch {
    return [];
  }
}

function HomeDashboardIdentity() {
  return (
    <header className="lcc2-home-identity">
      <div>
        <p className="lcc2-section-heading__eyebrow">Long Country Club · Est. 2003</p>
        <h1 className="lcc2-home-identity__title">
          {LCC_CURRENT_SEASON} League Dashboard
        </h1>
        <p className="lcc2-home-identity__supporting">
          The current-season front door for LCC dynasty football.
        </p>
      </div>
      <span className="lcc2-badge lcc2-badge--active">Dynasty football</span>
    </header>
  );
}

function HomeDashboardTopRow() {
  const championOwner = REIGNING_CHAMPION?.ownerId
    ? getOwnerById(REIGNING_CHAMPION.ownerId)
    : null;
  const championName =
    championOwner?.displayName ?? REIGNING_CHAMPION?.alias ?? "Reigning champion";
  const championImage = getOwnerImagePath(REIGNING_CHAMPION?.ownerId ?? "");

  return (
    <section className="lcc2-home-top-row" aria-label="Current season overview">
      <article className="lcc2-card lcc2-home-top-card lcc2-card--raised">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="lcc2-label">Next league deadline</p>
            <h2 className="mt-3 lcc2-home-card-title">NFL kickoff</h2>
          </div>
          <CalendarDays
            className="h-5 w-5 shrink-0 text-[var(--lcc-interactive)]"
            aria-hidden="true"
          />
        </div>
        <time
          className="mt-5 block font-ui text-base font-black uppercase leading-tight text-[var(--lcc-color-text)]"
          dateTime={`${CURRENT_HOME_CONFIG.kickoffDate}T20:20:00-04:00`}
        >
          {CURRENT_HOME_CONFIG.kickoffDisplay}
          <span className="mt-1 block text-sm text-[var(--lcc-color-text-muted)]">
            {CURRENT_HOME_CONFIG.kickoffTime}
          </span>
        </time>
        <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-between sm:gap-2">
          <div className="flex w-full max-w-[11rem] items-center gap-2 sm:min-w-0 sm:max-w-none sm:flex-1">
            <img
              src={getHomeTeamLogoUrl(CURRENT_HOME_CONFIG.kickoffAwayTeam)}
              alt=""
              aria-hidden="true"
              className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12"
            />
            <span className="whitespace-nowrap font-ui text-xs font-black uppercase leading-tight text-[var(--lcc-brand-primary)] sm:text-sm">
              {CURRENT_HOME_CONFIG.kickoffAwayTeam.name}
            </span>
          </div>
          <span
            className="shrink-0 font-ui text-base font-black text-[var(--lcc-color-text-muted)] sm:order-none"
            aria-label="at"
          >
            @
          </span>
          <div className="flex w-full max-w-[11rem] items-center justify-end gap-2 text-right sm:min-w-0 sm:max-w-none sm:flex-1">
            <span className="whitespace-nowrap font-ui text-xs font-black uppercase leading-tight text-[var(--lcc-brand-primary)] sm:text-sm">
              {CURRENT_HOME_CONFIG.kickoffHomeTeam.name}
            </span>
            <img
              src={getHomeTeamLogoUrl(CURRENT_HOME_CONFIG.kickoffHomeTeam)}
              alt=""
              aria-hidden="true"
              className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12"
            />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <span className="lcc2-label">League fees due</span>
          <span className="lcc2-badge lcc2-badge--neutral">
            {CURRENT_HOME_CONFIG.feeDeadlineLabel}
          </span>
        </div>
        <Link href="/league-info/fees" className="lcc2-button lcc2-button--secondary mt-5 w-full">
          View fees &amp; payouts
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </article>

      <article className="lcc2-card lcc2-home-top-card">
        <div className="flex items-center justify-between gap-3">
          <p className="lcc2-label">Reigning champion</p>
          <span className="lcc2-badge lcc2-badge--achievement">
            {REIGNING_CHAMPION?.season ?? "Champion"}
          </span>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[var(--lcc-color-border)] bg-slate-100">
            <img
              src={championImage}
              alt={championName}
              className="h-full w-full object-cover"
              style={{ objectPosition: "center 32%" }}
            />
          </div>
          <div className="min-w-0">
            <h2 className="lcc2-home-card-title break-words">{championName}</h2>
            <p className="mt-2 lcc2-body">
              {REIGNING_CHAMPION?.season ?? "Latest"} Champion
            </p>
          </div>
        </div>
      </article>

      <article className="lcc2-card lcc2-card--dark lcc2-home-top-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="lcc2-label">Current season</p>
            <h2 className="mt-3 lcc2-home-card-title">{LCC_CURRENT_SEASON} Matchups</h2>
          </div>
          <Trophy
            className="h-5 w-5 shrink-0 text-[var(--lcc-color-blue-hover)]"
            aria-hidden="true"
          />
        </div>
        <p className="mt-5 lcc2-body">
          Season schedule is not yet available. Week 1 LCC pairings will appear here
          when they are ready.
        </p>
        <Link href="/matchups" className="lcc2-button lcc2-button--primary mt-6 w-full">
          Open Matchups
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </article>
    </section>
  );
}

function SeasonReadiness() {
  const draftComplete = CURRENT_ROOKIE_DRAFT?.status === "complete";

  return (
    <section className="mt-8 sm:mt-10" aria-labelledby="season-readiness-heading">
      <div className="lcc2-section-heading mb-5">
        <div>
          <p className="lcc2-section-heading__eyebrow">{CURRENT_HOME_CONFIG.phase}</p>
          <h2 id="season-readiness-heading" className="lcc2-section-heading__title">
            {LCC_CURRENT_SEASON} season readiness
          </h2>
        </div>
        <ClipboardCheck
          className="h-5 w-5 shrink-0 text-[var(--lcc-interactive)]"
          aria-hidden="true"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ReadinessCard
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
          label="Owners"
          value={String(ACTIVE_LCC_OWNERS.length)}
          detail="Active league owners"
        />
        <ReadinessCard
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          label="Rookie draft"
          value={draftComplete ? "Complete" : "Not available"}
          detail={
            draftComplete && CURRENT_ROOKIE_DRAFT
              ? `${CURRENT_ROOKIE_DRAFT.pickCount} picks · ${CURRENT_ROOKIE_DRAFT.rounds} rounds`
              : "Canonical draft status pending"
          }
          href="/league-info/drafts"
        />
        <ReadinessCard
          label="Matchups"
          value="Not yet available"
          detail="No scored 2026 week"
          href="/matchups"
        />
        <ReadinessCard
          label="Standings"
          value={CURRENT_STANDINGS ? "Available" : "Not yet available"}
          detail={CURRENT_STANDINGS ? "2026 standings loaded" : "No 2026 standings yet"}
        />
      </div>
    </section>
  );
}

function ReadinessCard({
  icon,
  label,
  value,
  detail,
  href,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="lcc2-label">{label}</p>
        {icon ? <span className="text-[var(--lcc-interactive)]">{icon}</span> : null}
      </div>
      <p className="mt-4 font-ui text-lg font-black uppercase leading-tight text-[var(--lcc-color-text)]">
        {value}
      </p>
      <p className="mt-2 lcc2-label normal-case tracking-normal">{detail}</p>
    </>
  );

  return href ? (
    <Link
      href={href}
      className="lcc2-card lcc2-card--interactive block min-w-0 p-4"
    >
      {content}
    </Link>
  ) : (
    <article className="lcc2-card min-w-0 p-4">{content}</article>
  );
}
