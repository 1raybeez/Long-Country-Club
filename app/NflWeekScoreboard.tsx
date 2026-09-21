"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatNflContext, formatNflKickoff, getNflGamesForWeek, type NflGame, type NflScoreboardView } from "@/lib/nflScoreboard";

export function NflWeekScoreboard({ week, initialScoreboard }: { week: number; initialScoreboard: NflScoreboardView }) {
  const [scoreboard, setScoreboard] = useState(initialScoreboard);
  const games = useMemo(() => getNflGamesForWeek(scoreboard, week), [scoreboard, week]);
  useEffect(() => {
    let lastGood = initialScoreboard;
    const refresh = async () => {
      try {
        const response = await fetch("/api/nfl-scoreboard", { cache: "no-store" });
        if (!response.ok) return;
        const next = await response.json() as NflScoreboardView;
        if (next.sourceStatus === "ok") { lastGood = next; setScoreboard(next); }
      } catch {
        setScoreboard(lastGood);
      }
    };
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    const onFocus = () => void refresh();
    const shouldPoll = games.some((game) => game.state === "LIVE" || (game.state === "UPCOMING" && new Date(game.kickoff).getTime() - Date.now() <= 15 * 60_000));
    const interval = shouldPoll ? window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 60_000) : null;
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => { if (interval !== null) window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("focus", onFocus); };
  }, [games, initialScoreboard]);

  return <main className="lcc-page"><div className="lcc-container py-8 sm:py-12"><Link href="/" className="lcc-button lcc-button-secondary"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to Home</Link><header className="mt-5 lcc-card p-6 sm:p-8"><p className="lcc-label">NFL Game Center</p><h1 className="mt-2 font-ui text-4xl font-black text-[var(--lcc-color-text)]">Week {week} NFL scores</h1><p className="mt-3 lcc2-body">Live NFL schedule and score state from ESPN.</p></header>{scoreboard.sourceStatus !== "ok" && games.length === 0 ? <p className="mt-5 lcc2-body">The NFL schedule is temporarily unavailable. Check back shortly.</p> : <section className="mt-5 grid gap-4 md:grid-cols-2" aria-label={`Week ${week} NFL games`}>{games.map((game) => <NflWeekGame key={game.id} game={game} />)}</section>}</div></main>;
}

function NflWeekGame({ game }: { game: NflGame }) {
  return <article className="lcc-card p-5"><div className="flex items-center justify-between gap-3"><p className="lcc-label">{game.state === "LIVE" ? "LIVE" : game.state === "FINAL" ? "FINAL" : "UPCOMING"}</p><span className="font-ui text-xs font-black uppercase text-[var(--lcc-color-text-muted)]">{formatNflContext(game)}</span></div><div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3"><Team team={game.away} /><span className="font-ui text-sm font-black text-[var(--lcc-color-text-muted)]">@</span><Team team={game.home} /></div><p className="mt-4 text-center font-ui text-sm font-bold text-[var(--lcc-color-text-muted)]">{game.state === "LIVE" ? `${game.detail}${game.broadcast ? ` · ${game.broadcast}` : ""}` : game.state === "FINAL" ? `${game.away.score ?? "—"} - ${game.home.score ?? "—"}${game.broadcast ? ` · ${game.broadcast}` : ""}` : `${formatNflKickoff(game.kickoff)}${game.broadcast ? ` · ${game.broadcast}` : ""}`}</p></article>;
}

function Team({ team }: { team: NflGame["away"] }) {
  return <div className="min-w-0 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--lcc-color-surface-muted)] p-2">{team.logo ? <img src={team.logo} alt="" className="h-full w-full object-contain" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}</div><p className="mt-2 font-ui text-sm font-black text-[var(--lcc-color-text)]">{team.abbreviation}</p><p className="mt-1 font-ui text-lg font-black text-[var(--lcc-color-text)]">{team.score ?? "—"}</p></div>;
}
