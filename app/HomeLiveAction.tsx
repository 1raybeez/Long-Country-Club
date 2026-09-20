"use client";

import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getOwnerById } from "@/lib/ownerRegistry";
import type { HomeCurrentSeasonView } from "@/lib/homeCurrentSeason";
import type { HistoricalMatchup } from "@/lib/history/matchups";
import { formatMatchupStatus } from "@/lib/matchupStatus";
import type { CurrentStanding } from "@/lib/currentStandings";

export function HomeLiveAction({ initialView, personalStanding }: { initialView: HomeCurrentSeasonView; personalStanding: (CurrentStanding & { rank: number }) | null }) {
  const [view, setView] = useState(initialView);
  const lastRefreshAt = useRef(0);
  useEffect(() => {
    const ownerId = initialView.matchup.ownerId;
    const refresh = async () => {
      try {
        const response = await fetch("/api/current-week", { cache: "no-store" });
        if (!response.ok) return;
        const snapshot = await response.json() as { state?: HomeCurrentSeasonView["week"]; week?: number | null; matchups?: readonly HistoricalMatchup[]; fetchedAt?: string };
        const matchup = snapshot.matchups?.find((item) => item.ownerAId === ownerId || item.ownerBId === ownerId);
        if (!matchup || snapshot.state?.source !== "sleeper-league" || snapshot.week === null || snapshot.week === undefined) return;
        const owner = matchup.ownerAId === ownerId ? getOwnerById(matchup.ownerAId) : getOwnerById(matchup.ownerBId);
        const opponent = matchup.ownerAId === ownerId ? getOwnerById(matchup.ownerBId) : getOwnerById(matchup.ownerAId);
        const ownerScore = matchup.ownerAId === ownerId ? matchup.ownerAScore : matchup.ownerBScore;
        const opponentScore = matchup.ownerAId === ownerId ? matchup.ownerBScore : matchup.ownerAScore;
        lastRefreshAt.current = Date.parse(snapshot.fetchedAt ?? "") || Date.now();
        const complete = snapshot.state?.safeCompletedWeek !== null && snapshot.state?.safeCompletedWeek !== undefined && snapshot.week! <= snapshot.state.safeCompletedWeek;
        const currentStatus = complete ? "FINAL" : matchup.currentStatus;
        setView((previous) => ({ week: snapshot.state!, matchup: { ...previous.matchup, state: complete ? "complete" : "current", currentStatus, week: snapshot.week!, ownerName: owner?.teamName ?? previous.matchup.ownerName, opponentName: opponent?.teamName ?? previous.matchup.opponentName, ownerScore, opponentScore } }));
      } catch {
        // Preserve the last good Home snapshot.
      }
    };
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    const onFocus = () => { if (Date.now() - lastRefreshAt.current >= 30_000) void refresh(); };
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 60_000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("focus", onFocus); };
  }, [initialView.matchup.ownerId]);
  const statusLabel = view.matchup.currentStatus ? formatMatchupStatus(view.matchup.currentStatus) : null;
  const message = view.matchup.opponentName && view.matchup.ownerScore !== null && view.matchup.opponentScore !== null
    ? `Week ${view.week.week}: ${view.matchup.ownerName} ${view.matchup.ownerScore} · ${view.matchup.opponentName} ${view.matchup.opponentScore}.`
    : view.matchup.currentStatus === "UPCOMING" && view.matchup.opponentName
      ? `Week ${view.week.week}: scheduled against ${view.matchup.opponentName}. Scores will appear when available.`
      : `Week ${view.week.week ?? "current"} is underway. Open Matchups for the league board.`;
  return <article className="lcc2-card lcc2-card--dark lcc2-home-top-card lcc2-home-live-action"><div className="flex items-start justify-between gap-4"><div><p className="lcc2-label">{view.week.week ? `Week ${view.week.week}` : "Current league action"}</p><h2 className="mt-3 lcc2-home-card-title">{view.matchup.state === "complete" ? "Your matchup result" : "Your matchup"}</h2></div><Trophy className="h-5 w-5 shrink-0 text-[var(--lcc-color-blue-hover)]" aria-hidden="true" /></div>{statusLabel ? <p className="mt-3 font-ui text-sm font-black text-[var(--lcc-color-blue-hover)]" data-testid="home-matchup-status">{statusLabel}</p> : null}<p className="mt-3 lcc2-body">{message}</p>{personalStanding ? <p className="mt-3 font-ui text-xs font-black uppercase tracking-[0.08em] text-[var(--lcc-color-blue-hover)]">Record: {personalStanding.wins}-{personalStanding.losses}{personalStanding.ties ? `-${personalStanding.ties}` : ""} · Rank {personalStanding.rank ?? "—"}</p> : null}<Link href="/matchups" className="lcc2-button lcc2-button--primary mt-6 w-full">View Matchups<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></article>;
}
