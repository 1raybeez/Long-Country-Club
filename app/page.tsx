import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Swords,
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
import {
  buildHomeMatchupViewFromCurrentMatchups,
  type HomeCurrentSeasonView,
} from "@/lib/homeCurrentSeason";
import { loadCurrentWeekSnapshot, type CurrentWeekSnapshot } from "@/lib/currentWeekSnapshot";
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
import type { CurrentStanding } from "@/lib/currentStandings";
import type { HistoricalMatchup } from "@/lib/history/matchups";

const CURRENT_HOME_CONFIG = HOME_SEASON_CONFIG[LCC_CURRENT_SEASON];
const REIGNING_CHAMPION = getLccChampionBySeason(LCC_CURRENT_SEASON - 1);
const CURRENT_ROOKIE_DRAFT = loadDraftEventsBySeason(LCC_CURRENT_SEASON).find(
  (draft) => draft.draftType === "rookie"
);
const CURRENT_STANDINGS = loadStandingsBySeason(LCC_CURRENT_SEASON);

export default async function HomePage() {
  const session = await getCurrentMemberSession();
  const snapshot = await loadCurrentWeekSnapshot();
  const currentView = buildHomeView(snapshot, session?.member ?? null);
  const weeklyHighBoard = await getWeeklyHighBoard(LCC_CURRENT_SEASON);
  const standings = await loadCurrentSeasonStandings(currentView.week.safeCompletedWeek);
  const personalStanding = standings.reduce<CurrentStanding & { rank: number } | null>((found, standing, index) => found ?? (standing.franchiseId === session?.member?.ownerId ? { ...standing, rank: index + 1 } : null), null);
  return (
    <main className="lcc2-home-shell">
      <div className="lcc2-home-container">
        <HomeDashboardIdentityForState currentView={currentView} />
        <HomeDashboardTopRow currentView={currentView} snapshot={snapshot} weeklyHighBoard={weeklyHighBoard} personalStanding={personalStanding} />
        <HomeDashboardCompetition currentView={currentView} snapshot={snapshot} standings={standings} />
        <SeasonReadiness currentView={currentView} />
      </div>
    </main>
  );
}

function buildHomeView(snapshot: CurrentWeekSnapshot, member: Parameters<typeof buildHomeMatchupViewFromCurrentMatchups>[1]): HomeCurrentSeasonView {
  const matchup = buildHomeMatchupViewFromCurrentMatchups(snapshot.matchups, member, snapshot.week);
  return {
    week: snapshot.state,
    matchup: snapshot.week !== null && snapshot.state.safeCompletedWeek !== null && snapshot.week <= snapshot.state.safeCompletedWeek
      ? { ...matchup, state: matchup.state === "unavailable" ? "unavailable" : "complete" }
      : matchup,
  };
}

function HomeDashboardCompetition({ currentView, snapshot, standings }: { currentView: HomeCurrentSeasonView; snapshot: CurrentWeekSnapshot; standings: readonly CurrentStanding[] }) {
  return <section className="mt-8" aria-labelledby="home-competition-heading">
    <div className="lcc2-section-heading mb-5"><div><p className="lcc2-section-heading__eyebrow">Competition</p><h2 id="home-competition-heading" className="lcc2-section-heading__title">The league at a glance</h2></div></div>
    <div className="grid gap-4 lg:grid-cols-3">
      <CurrentStandingsCard standings={standings} />
      <LeagueMatchupsCard currentView={currentView} snapshot={snapshot} />
      <HomePredictorPreview />
    </div>
  </section>;
}

function HomePredictorPreview() {
  const forecasts = getHomePredictorForecasts();

  return (
    <article className="lcc2-card lcc2-card--raised flex min-w-0 flex-col p-4 sm:p-5" aria-labelledby="home-predictor-heading">
      <div><p className="lcc2-label">Predictor archive</p><h3 id="home-predictor-heading" className="mt-2 font-ui text-xl font-black text-[var(--lcc-color-text)]">How the model saw the league</h3><p className="lcc2-body mt-2">The preseason Team Strength snapshot is preserved for comparison against the live season.</p></div>
      {forecasts.length > 0 ? <ol aria-label="Top three preseason forecast teams" className="mt-4 grid gap-2">{forecasts.slice(0, 3).map((forecast) => <li key={forecast.ownerId} className="flex min-w-0 items-center gap-3 rounded-lg bg-[var(--lcc-color-surface-muted)] px-3 py-2"><span className="font-ui text-xs font-black text-[var(--lcc-color-text-muted)]">#{forecast.forecastOrder}</span><span className="min-w-0 flex-1 truncate font-ui text-sm font-black text-[var(--lcc-color-text)]">{forecast.teamName}</span><span className="shrink-0 font-ui text-sm font-black text-[var(--lcc-color-text)]">{forecast.teamStrengthScore.toFixed(1)}</span></li>)}</ol> : <p className="lcc2-body mt-4">The approved forecast is temporarily unavailable.</p>}
      <Link href="/predictor" className="lcc2-button lcc2-button--secondary mt-auto w-full sm:w-auto">View Predictor<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
    </article>
  );
}

function getHomePredictorForecasts(): readonly PredictorTeamForecast[] {
  try {
    return getApprovedPreseasonTeamStrengthForecasts().slice(0, 5);
  } catch {
    return [];
  }
}

function HomeDashboardIdentityForState({ currentView }: { currentView?: HomeCurrentSeasonView }) {
  const phase = currentView?.week.phase ?? "UNKNOWN";
  const live = phase === "REGULAR_SEASON" || phase === "POSTSEASON";
  const complete = phase === "SEASON_COMPLETE";
  const completedWeek = currentView?.week.safeCompletedWeek;
  const eyebrow = live && currentView?.week.week
      ? `${LCC_CURRENT_SEASON} League Dashboard · Week ${currentView.week.week}${completedWeek === currentView.week.week ? " · Complete" : " · Live"}`
    : complete
      ? `${LCC_CURRENT_SEASON} Season · Complete`
      : phase === "PRESEASON"
        ? `Long Country Club · Est. 2003`
        : `${LCC_CURRENT_SEASON} Season · Status unavailable`;
  const title = live ? "Long Country Club FFL" : `${LCC_CURRENT_SEASON} League Dashboard`;
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

function HomeDashboardTopRow({ currentView, snapshot, weeklyHighBoard, personalStanding }: { currentView: HomeCurrentSeasonView; snapshot: CurrentWeekSnapshot; weeklyHighBoard: Awaited<ReturnType<typeof getWeeklyHighBoard>>; personalStanding: (CurrentStanding & { rank: number }) | null }) {
  const championOwner = REIGNING_CHAMPION?.ownerId
    ? getOwnerById(REIGNING_CHAMPION.ownerId)
    : null;
  const championName =
    championOwner?.displayName ?? REIGNING_CHAMPION?.alias ?? "Reigning champion";
  const championImage = getOwnerImagePath(REIGNING_CHAMPION?.ownerId ?? "");

  return (
    <section className={`lcc2-home-top-row${isLiveHomeState(currentView) ? " lcc2-home-top-row--live" : ""}`} aria-label="Current season overview">
      <HomeLiveAction initialView={currentView} personalStanding={personalStanding} />
      <WeeklySpotlight currentView={currentView} snapshot={snapshot} weeklyHighBoard={weeklyHighBoard} />

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
              {championOwner?.teamName ?? "LCC franchise"} · {REIGNING_CHAMPION?.season ?? "Latest"} champion
            </p>
          </div>
        </div>
        <Link href="/league-info/trophy-room" className="lcc2-button lcc2-button--secondary mt-5 w-full">View Trophy Room<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </article>

    </section>
  );
}

function WeeklySpotlight({ currentView, snapshot, weeklyHighBoard }: { currentView: HomeCurrentSeasonView; snapshot: CurrentWeekSnapshot; weeklyHighBoard: Awaited<ReturnType<typeof getWeeklyHighBoard>> }) {
  const matchupSummary = summarizeHomeMatchups(snapshot.matchups);
  const latestWeek = currentView.week.latestCompletedWeek;
  const latestHigh = latestWeek ? weeklyHighBoard.find((item) => item.week === latestWeek && item.status === "FINAL") : null;
  const weekLabel = currentView.week.week ? `Week ${currentView.week.week}` : "Current week";
  const statusLabel = formatWeekState(currentView.week.state);
  return <article className="lcc2-card lcc2-card--raised lcc2-home-top-card flex min-w-0 flex-col p-5" aria-labelledby="weekly-spotlight-heading">
    <div className="flex items-start justify-between gap-3"><div><p className="lcc2-label">Weekly spotlight</p><h2 id="weekly-spotlight-heading" className="mt-3 lcc2-home-card-title">{weekLabel} · {statusLabel}</h2></div><Swords className="h-5 w-5 shrink-0 text-[var(--lcc-interactive)]" aria-hidden="true" /></div>
    <div className="mt-5 grid gap-3"><SpotlightFact label="League matchups" value={matchupSummary.matchupCount ? `${matchupSummary.matchupCount} matchups · ${matchupSummary.ownerCount} teams` : "Unavailable"} /><SpotlightFact label="Latest completed week" value={latestWeek ? `Week ${latestWeek}` : "Not available"} /><SpotlightFact label="Latest weekly high" value={latestHigh?.franchiseName && latestHigh.score !== null ? `${latestHigh.franchiseName} · ${latestHigh.score.toFixed(2)}` : "Awaiting finality"} /></div>
    <Link href="/matchups" className="lcc2-button lcc2-button--secondary mt-auto w-full">View {weekLabel} Matchups<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
  </article>;
}

function CurrentStandingsCard({ standings }: { standings: readonly CurrentStanding[] }) {
  return <article className="lcc2-card lcc2-card--raised flex min-w-0 flex-col p-4 sm:p-5" aria-labelledby="current-standings-heading"><div><p className="lcc2-label">Competition</p><h3 id="current-standings-heading" className="mt-2 font-ui text-xl font-black text-[var(--lcc-color-text)]">Current standings</h3><p className="lcc2-body mt-1">Through the latest safely completed week.</p></div>{standings.length ? <ol className="mt-4 grid gap-2" aria-label="Top five current standings">{standings.slice(0, 5).map((standing, index) => <li key={standing.franchiseId} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-2 border-b border-[var(--lcc-color-border)] pb-2 last:border-0"><span className="font-ui text-xs font-black text-[var(--lcc-color-text-muted)]">{index + 1}</span><span className="min-w-0 truncate font-ui text-sm font-black text-[var(--lcc-color-text)]">{standing.franchiseName}</span><span className="font-ui text-xs font-black text-[var(--lcc-color-text)]">{formatRecord(standing)}</span></li>)}</ol> : <p className="lcc2-body mt-4">Standings appear after a week is safely complete.</p>}<Link href="/matchups" className="lcc2-button lcc2-button--secondary mt-auto w-full">View Matchups<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></article>;
}

function LeagueMatchupsCard({ currentView, snapshot }: { currentView: HomeCurrentSeasonView; snapshot: CurrentWeekSnapshot }) {
  const matchupSummary = summarizeHomeMatchups(snapshot.matchups);
  return <article className="lcc2-card lcc2-card--raised flex min-w-0 flex-col p-4 sm:p-5" aria-labelledby="league-matchups-heading"><div><p className="lcc2-label">League board</p><h3 id="league-matchups-heading" className="mt-2 font-ui text-xl font-black text-[var(--lcc-color-text)]">{LCC_CURRENT_SEASON} matchups</h3><p className="lcc2-body mt-1">{currentView.week.week ? `Week ${currentView.week.week} · ${formatWeekState(currentView.week.state)}` : "Current week unavailable"}</p></div><div className="mt-5 grid gap-3"><SpotlightFact label="Matchup count" value={matchupSummary.matchupCount ? `${matchupSummary.matchupCount} matchups` : "Unavailable"} /><SpotlightFact label="Teams represented" value={matchupSummary.ownerCount ? `${matchupSummary.ownerCount} teams` : "Unavailable"} />{matchupSummary.highestScore !== null ? <SpotlightFact label="Highest current score" value={matchupSummary.highestScore.toFixed(2)} /> : null}</div><Link href="/matchups" className="lcc2-button lcc2-button--secondary mt-auto w-full">Open Matchups<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></article>;
}

export function summarizeHomeMatchups(matchups: readonly Pick<HistoricalMatchup, "ownerAId" | "ownerBId" | "ownerAScore" | "ownerBScore">[]) {
  const scores = matchups.flatMap((matchup) => [matchup.ownerAScore, matchup.ownerBScore]).filter((score): score is number => typeof score === "number");
  return { matchupCount: matchups.length, ownerCount: new Set(matchups.flatMap((matchup) => [matchup.ownerAId, matchup.ownerBId])).size, highestScore: scores.length ? Math.max(...scores) : null };
}

function SpotlightFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-[var(--lcc-color-surface-muted)] p-3"><p className="lcc2-label">{label}</p><p className="mt-1 font-ui text-sm font-black text-[var(--lcc-color-text)]">{value}</p></div>;
}

function formatRecord(standing: CurrentStanding) {
  return `${standing.wins}-${standing.losses}${standing.ties ? `-${standing.ties}` : ""}`;
}

function formatWeekState(state: HomeCurrentSeasonView["week"]["state"]) {
  if (state === "LIVE") return "Live";
  if (state === "UPCOMING") return "Scheduled";
  if (state === "COMPLETED" || state === "SEASON_COMPLETE") return "Final";
  if (state === "PRESEASON") return "Preseason";
  return "Unavailable";
}

function isLiveHomeState(view: HomeCurrentSeasonView) {
  return view.week.phase === "REGULAR_SEASON" || view.week.phase === "POSTSEASON";
}

export function formatCurrentSeasonMessage(view: HomeCurrentSeasonView) {
  if ((view.matchup.state === "complete" || view.matchup.state === "current") && view.matchup.opponentName && view.matchup.ownerScore !== null && view.matchup.opponentScore !== null) return `Week ${view.week.week}: ${view.matchup.ownerName} ${view.matchup.ownerScore} · ${view.matchup.opponentName} ${view.matchup.opponentScore}.`;
  if (view.matchup.state === "scheduled" && view.matchup.opponentName) return `Week ${view.week.week}: scheduled against ${view.matchup.opponentName}. Scores will appear when available.`;
  if (view.week.phase === "REGULAR_SEASON" && view.week.week) return `Week ${view.week.week} is underway. Open Matchups for the league board.`;
  if (view.week.phase === "POSTSEASON" && view.week.week) return `Postseason week ${view.week.week} is underway. Open Matchups for the current bracket.`;
  if (view.week.phase === "SEASON_COMPLETE") return "The 2026 season is complete. Visit History for the final record.";
  return "Current-season matchup data is not available yet.";
}

function SeasonReadiness({ currentView }: { currentView: HomeCurrentSeasonView }) {
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
