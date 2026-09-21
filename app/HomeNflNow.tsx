"use client";

import Link from "next/link";
import { ArrowRight, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import type { NflGame, NflScoreboardView } from "@/lib/nflScoreboard";
import { formatNflContext, formatNflKickoff, retainLastGoodNflScoreboard } from "@/lib/nflScoreboard";

export function HomeNflNow({ initialScoreboard }: { initialScoreboard: NflScoreboardView }) {
  const [scoreboard, setScoreboard] = useState(initialScoreboard);
  useEffect(() => {
    let lastGood = initialScoreboard;
    const refresh = async () => {
      try {
        const response = await fetch("/api/nfl-scoreboard", { cache: "no-store" });
        if (!response.ok) return;
        const next = await response.json() as unknown;
        const safeNext = retainLastGoodNflScoreboard(lastGood, next);
        if (safeNext !== lastGood) { lastGood = safeNext; setScoreboard(safeNext); }
      } catch {
        setScoreboard(lastGood);
      }
    };
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    const onFocus = () => void refresh();
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 60_000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("focus", onFocus); };
  }, [initialScoreboard]);

  const game = scoreboard.selected;
  return <article className="lcc2-card lcc2-home-top-card lcc2-home-nfl-card flex min-w-0 flex-col p-5" aria-labelledby="home-nfl-heading">
    <div className="flex items-start justify-between gap-3"><div><p className="lcc2-label">NFL Game Center</p><h2 id="home-nfl-heading" className="mt-3 lcc2-home-card-title">{game ? game.state === "LIVE" ? "Live" : game.state === "FINAL" ? "NFL complete" : "Next up" : "NFL unavailable"}</h2></div><Radio className="h-5 w-5 shrink-0 text-[var(--lcc-brand-primary)]" aria-hidden="true" /></div>
    {game ? <NflGameContent game={game} /> : <p className="mt-5 lcc2-body">The NFL schedule is temporarily unavailable. Check back shortly.</p>}
    {game ? <Link href={`/nfl/week/${game.week ?? 1}`} className="lcc2-button lcc2-button--secondary mt-auto w-full">View Week {game.week ?? "current"} NFL Scores<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link> : null}
  </article>;
}

function NflGameContent({ game }: { game: NflGame }) {
  const live = game.state === "LIVE";
  return <div className="mt-5 flex flex-1 flex-col"><p className={`lcc2-home-nfl-state ${live ? "lcc2-home-nfl-state--live" : ""}`}>{live ? `Live · ${formatNflContext(game)}` : formatNflContext(game)}</p><p className="lcc2-home-nfl-event mt-2">{formatNflEventName(game)}</p><div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2"><NflTeamView team={game.away} /><span className="font-ui text-xs font-black text-[var(--lcc-color-text-muted)]">@</span><NflTeamView team={game.home} /></div><p className="mt-4 text-center font-ui text-sm font-black text-[var(--lcc-color-text-muted)]">{live ? `${game.detail}${game.broadcast ? ` · ${game.broadcast}` : ""}` : `${formatNflKickoff(game.kickoff)}${game.broadcast ? ` · ${game.broadcast}` : ""}`}</p></div>;
}

function formatNflEventName(game: NflGame): string {
  if (game.primeTime === "TNF") return "Thursday Night Football";
  if (game.primeTime === "SNF") return "Sunday Night Football";
  if (game.primeTime === "MNF") return "Monday Night Football";
  return `Week ${game.week ?? "—"} matchup`;
}

function NflTeamView({ team }: { team: NflGame["away"] }) {
  return <div className="min-w-0 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--lcc-color-surface-muted)] p-2">{team.logo ? <img src={team.logo} alt="" className="h-full w-full object-contain" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}</div><p className="mt-2 truncate font-ui text-sm font-black text-[var(--lcc-color-text)]">{team.abbreviation}</p><p className="truncate text-xs text-[var(--lcc-color-text-muted)]">{team.score !== null ? team.score : team.name}</p></div>;
}
