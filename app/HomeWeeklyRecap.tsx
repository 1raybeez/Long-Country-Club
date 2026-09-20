import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";
import type { HomeWeeklyRecap, RecapMatchupSummary } from "@/lib/homeWeeklyRecap";

export function HomeWeeklyRecap({ recap }: { recap: HomeWeeklyRecap }) {
  if (recap.availability === "unavailable") return null;
  return <article className="lcc2-card lcc2-card--raised flex min-w-0 flex-col p-4 sm:p-5" aria-labelledby="home-recap-heading">
    <div className="flex items-start justify-between gap-3"><div><p className="lcc2-label">Recent recap</p><h3 id="home-recap-heading" className="mt-2 font-ui text-xl font-black text-[var(--lcc-color-text)]">Week {recap.week} recap</h3></div><BarChart3 className="h-5 w-5 shrink-0 text-[var(--lcc-interactive)]" aria-hidden="true" /></div>
    {recap.availability === "partial" ? <p className="lcc2-body mt-4">Recap data is incomplete.</p> : <div className="mt-4 grid gap-2"><RecapFact label="Weekly high" value={recap.weeklyHighWinner ? `${recap.weeklyHighWinner.teamName} · ${recap.weeklyHighWinner.score.toFixed(2)}` : "Not finalized"} /><RecapFact label="Closest matchup" value={formatMatchups(recap.closestMatchups, (matchup) => `Margin ${matchup.margin.toFixed(2)}`)} /><RecapFact label="Largest margin" value={formatMatchups(recap.largestMarginMatchups, (matchup) => `Margin ${matchup.margin.toFixed(2)}`)} /><RecapFact label="Highest scoring" value={formatMatchups(recap.highestScoringMatchups, (matchup) => `${matchup.combinedScore.toFixed(2)} combined`)} />{recap.lowestScoringTeam ? <RecapFact label="Lowest team score" value={`${recap.lowestScoringTeam.teamName} · ${recap.lowestScoringTeam.score.toFixed(2)}`} /> : null}</div>}
    <Link href="/matchups" className="lcc2-button lcc2-button--secondary mt-auto w-full">View Matchups<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
  </article>;
}
function RecapFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-[var(--lcc-color-surface-muted)] p-3"><p className="lcc2-label">{label}</p><p className="mt-1 break-words font-ui text-sm font-black text-[var(--lcc-color-text)]">{value}</p></div>;
}

function formatMatchups(matchups: readonly RecapMatchupSummary[], suffix: (matchup: RecapMatchupSummary) => string) {
  const matchup = matchups[0];
  if (!matchup) return "Unavailable";
  const tied = matchups.length > 1 ? ` · ${matchups.length} tied` : "";
  return `${matchup.ownerAName} ${matchup.ownerAScore.toFixed(2)}–${matchup.ownerBScore.toFixed(2)} ${matchup.ownerBName} · ${suffix(matchup)}${tied}`;
}
