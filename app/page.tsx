import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Users,
} from "lucide-react";
import { ACTIVE_LCC_OWNERS } from "@/lib/lccOwners";
import { getLccChampionBySeason } from "@/lib/lccFinalPlacements";
import { loadStandingsBySeason } from "@/lib/history/standings";
import { loadDraftEventsBySeason } from "@/lib/history/drafts";
import { LCC_CURRENT_SEASON } from "@/lib/leagueConstants";
import { getOwnerById } from "@/lib/ownerRegistry";
import { getOwnerImagePath } from "@/lib/ownerImages";
import { getCurrentMemberSession } from "@/lib/auth/session";
import { getHomeEvents, selectNextHomeEvent } from "@/lib/homeEvents";
import { loadHomeCurrentSeasonView } from "@/lib/homeCurrentSeason";
import {
  getApprovedPreseasonTeamStrengthForecasts,
  type PredictorTeamForecast,
} from "@/lib/predictor";
import {
  HOME_SEASON_CONFIG,
} from "@/lib/homeSeasonConfig";
import { HomeLiveAction } from "./HomeLiveAction";
import { getWeeklyHighBoard } from "@/lib/finance/weeklyHigh";
import { loadCurrentSeasonStandings } from "@/lib/currentStandings";

const CURRENT_HOME_CONFIG = HOME_SEASON_CONFIG[LCC_CURRENT_SEASON];
const REIGNING_CHAMPION = getLccChampionBySeason(LCC_CURRENT_SEASON - 1);
const CURRENT_ROOKIE_DRAFT = loadDraftEventsBySeason(LCC_CURRENT_SEASON).find(
  (draft) => draft.draftType === "rookie"
);
const CURRENT_STANDINGS = loadStandingsBySeason(LCC_CURRENT_SEASON);

export default async function HomePage() {
  const session = await getCurrentMemberSession();
  const currentView = await loadHomeCurrentSeasonView(session?.member ?? null);
  const nextEvent = selectNextHomeEvent(getHomeEvents(LCC_CURRENT_SEASON));
  const weeklyHighBoard = await getWeeklyHighBoard(LCC_CURRENT_SEASON);
  const standings = await loadCurrentSeasonStandings(currentView.week.safeCompletedWeek);
  return (
    <main className="lcc2-home-shell">
      <div className="lcc2-home-container">
        <HomeDashboardIdentityForState currentView={currentView} />
        <HomeDashboardTopRow nextEvent={nextEvent.event} currentView={currentView} />
        <HomeLeagueHub currentView={currentView} weeklyHighBoard={weeklyHighBoard} standings={standings} />
        <HomePredictorPreview currentView={currentView} />
        <SeasonReadiness currentView={currentView} />
      </div>
    </main>
  );
}

function HomeLeagueHub({ currentView, weeklyHighBoard, standings }: { currentView: Awaited<ReturnType<typeof loadHomeCurrentSeasonView>>; weeklyHighBoard: Awaited<ReturnType<typeof getWeeklyHighBoard>>; standings: Awaited<ReturnType<typeof loadCurrentSeasonStandings>> }) {
  const latestWeek = currentView.week.latestCompletedWeek;
  const latestHigh = latestWeek ? weeklyHighBoard.find((item) => item.week === latestWeek) : null;
  const latestMatchups = currentView.matchup.state === "complete" ? "Complete" : currentView.week.week ? `Week ${currentView.week.week}` : "Unavailable";
  return <section className="mt-8" aria-labelledby="home-league-hub-heading">
    <div className="lcc2-section-heading mb-5"><div><p className="lcc2-section-heading__eyebrow">In-season league hub</p><h2 id="home-league-hub-heading" className="lcc2-section-heading__title">The league at a glance</h2></div></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Link href="/matchups" className="lcc2-card lcc2-card--interactive block p-4"><p className="lcc2-label">Latest completed week</p><p className="mt-3 font-ui text-lg font-black text-[var(--lcc-color-text)]">{latestWeek ? `Week ${latestWeek}` : "Not available"}</p><p className="mt-2 lcc2-body">{latestMatchups} · Open the matchup board</p></Link>
      <Link href="/league-info/fees" className="lcc2-card lcc2-card--interactive block p-4"><p className="lcc2-label">Weekly high</p><p className="mt-3 font-ui text-lg font-black text-[var(--lcc-color-text)]">{latestHigh?.franchiseName ?? "Awaiting finality"}</p><p className="mt-2 lcc2-body">{latestHigh?.score !== null && latestHigh?.score !== undefined ? `${latestHigh.score.toFixed(2)} · ${latestHigh.status}` : "No authoritative winner yet"}</p></Link>
      <Link href="/matchups" className="lcc2-card lcc2-card--interactive block p-4"><p className="lcc2-label">Current standings</p><p className="mt-3 font-ui text-sm font-black text-[var(--lcc-color-text)]">{standings.length ? standings.slice(0, 3).map((team, index) => `${index + 1}. ${team.franchiseName} ${team.wins}-${team.losses}${team.ties ? `-${team.ties}` : ""}`).join(" · ") : "Awaiting completed week"}</p><p className="mt-2 lcc2-body">{currentView.week.nextWeek ? `Next: Week ${currentView.week.nextWeek}` : "Current-season standings"}</p></Link>
    </div>
  </section>;
}

function HomePredictorPreview({ currentView }: { currentView: Awaited<ReturnType<typeof loadHomeCurrentSeasonView>> }) {
  const forecasts = getHomePredictorForecasts();
  const archived = isLiveHomeState(currentView) || currentView.week.phase === "SEASON_COMPLETE";

  return (
    <section className="mt-8" aria-labelledby="home-predictor-heading">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="lcc2-section-heading__eyebrow">Preseason forecast</p>
          <h2 id="home-predictor-heading" className="lcc2-section-heading__title">{archived ? "2026 Preseason Forecast Archive" : "2026 Preseason Top 5"}</h2>
          <p className="lcc2-body mt-2">{archived ? "The preseason forecast is locked for comparison against the live season." : "Locked 2026 preseason Team Strength baseline based on drafted rosters."}</p>
        </div>
        <p className="lcc2-label">Preseason only · Team Strength index</p>
      </div>

      <div className="lcc2-card lcc2-card--raised overflow-hidden p-4 sm:p-5">
        {archived ? <div className="py-2"><p className="font-ui text-sm font-black text-[var(--lcc-color-text)]">Preseason model archived</p><p className="lcc2-body mt-1">Open Predictor to review the full forecast and compare it with the current season.</p></div> : forecasts.length > 0 ? (
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

function HomeDashboardIdentityForState({ currentView }: { currentView?: Awaited<ReturnType<typeof loadHomeCurrentSeasonView>> }) {
  const phase = currentView?.week.phase ?? "UNKNOWN";
  const live = phase === "REGULAR_SEASON" || phase === "POSTSEASON";
  const complete = phase === "SEASON_COMPLETE";
  const completedWeek = currentView?.week.safeCompletedWeek;
  const eyebrow = live && currentView?.week.week
    ? `${LCC_CURRENT_SEASON} Season · Week ${currentView.week.week}${completedWeek === currentView.week.week ? " Complete" : ""}`
    : complete
      ? `${LCC_CURRENT_SEASON} Season · Complete`
      : phase === "PRESEASON"
        ? `Long Country Club · Est. 2003`
        : `${LCC_CURRENT_SEASON} Season · Status unavailable`;
  const title = live ? "Long Country Club" : `${LCC_CURRENT_SEASON} League Dashboard`;
  const supporting = live
    ? completedWeek === currentView?.week.week ? `Week ${completedWeek} is complete. The next league week is now the runway.` : "The chase for the jacket is underway."
    : complete
      ? "The season is complete. Revisit the year and the history behind it."
      : "The current-season front door for LCC dynasty football.";

  return (
    <header className="lcc2-home-identity">
      <div>
        <p className="lcc2-section-heading__eyebrow">{eyebrow}</p>
        <h1 className="lcc2-home-identity__title">{title}</h1>
        <p className="lcc2-home-identity__supporting">{supporting}</p>
      </div>
      <span className="lcc2-badge lcc2-badge--active">{live ? "Live season" : "Dynasty football"}</span>
    </header>
  );
}

function HomeDashboardTopRow({ nextEvent, currentView }: { nextEvent: ReturnType<typeof selectNextHomeEvent>["event"]; currentView: Awaited<ReturnType<typeof loadHomeCurrentSeasonView>> }) {
  const championOwner = REIGNING_CHAMPION?.ownerId
    ? getOwnerById(REIGNING_CHAMPION.ownerId)
    : null;
  const championName =
    championOwner?.displayName ?? REIGNING_CHAMPION?.alias ?? "Reigning champion";
  const championImage = getOwnerImagePath(REIGNING_CHAMPION?.ownerId ?? "");

  return (
    <section className={`lcc2-home-top-row${isLiveHomeState(currentView) ? " lcc2-home-top-row--live" : ""}`} aria-label="Current season overview">
      <HomeLiveAction initialView={currentView} />

      {nextEvent ? <article className="lcc2-card lcc2-home-top-card lcc2-home-deadline-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="lcc2-label">Next league deadline</p>
            <h2 className="mt-3 lcc2-home-card-title">{nextEvent.title}</h2>
          </div>
          <CalendarDays className="h-5 w-5 shrink-0 text-[var(--lcc-interactive)]" aria-hidden="true" />
        </div>
        <time className="mt-4 block font-ui text-sm font-black uppercase leading-tight text-[var(--lcc-color-text)]" dateTime={nextEvent.timestamp ?? undefined}>
          {CURRENT_HOME_CONFIG.kickoffDisplay}
          <span className="mt-1 block text-xs text-[var(--lcc-color-text-muted)]">{CURRENT_HOME_CONFIG.kickoffTime}</span>
        </time>
        <Link href={nextEvent.cta?.href ?? "/matchups"} className="lcc2-button lcc2-button--secondary mt-5 w-full">
          {nextEvent.cta?.label ?? "View details"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </article> : null}

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

    </section>
  );
}

function isLiveHomeState(view: Awaited<ReturnType<typeof loadHomeCurrentSeasonView>>) {
  return view.week.phase === "REGULAR_SEASON" || view.week.phase === "POSTSEASON";
}

export function formatCurrentSeasonMessage(view: Awaited<ReturnType<typeof loadHomeCurrentSeasonView>>) {
  if ((view.matchup.state === "complete" || view.matchup.state === "current") && view.matchup.opponentName && view.matchup.ownerScore !== null && view.matchup.opponentScore !== null) return `Week ${view.week.week}: ${view.matchup.ownerName} ${view.matchup.ownerScore} · ${view.matchup.opponentName} ${view.matchup.opponentScore}.`;
  if (view.matchup.state === "scheduled" && view.matchup.opponentName) return `Week ${view.week.week}: scheduled against ${view.matchup.opponentName}. Scores will appear when available.`;
  if (view.week.phase === "REGULAR_SEASON" && view.week.week) return `Week ${view.week.week} is underway. Open Matchups for the league board.`;
  if (view.week.phase === "POSTSEASON" && view.week.week) return `Postseason week ${view.week.week} is underway. Open Matchups for the current bracket.`;
  if (view.week.phase === "SEASON_COMPLETE") return "The 2026 season is complete. Visit History for the final record.";
  return "Current-season matchup data is not available yet.";
}

function SeasonReadiness({ currentView }: { currentView: Awaited<ReturnType<typeof loadHomeCurrentSeasonView>> }) {
  if (isLiveHomeState(currentView) || currentView.week.phase === "SEASON_COMPLETE") return null;

  const draftComplete = CURRENT_ROOKIE_DRAFT?.status === "complete";
  const matchupStatus = currentView.week.week
    ? { value: `Week ${currentView.week.week}`, detail: "Current league week" }
    : { value: "Not yet available", detail: "Current week unavailable" };

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
          value={matchupStatus.value}
          detail={matchupStatus.detail}
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
