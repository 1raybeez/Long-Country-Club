import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";
import type { HomeWeeklyRecap, RecapMatchupSummary } from "@/lib/homeWeeklyRecap";

export function HomeWeeklyRecap({ recap }: { recap: HomeWeeklyRecap }) {
  if (recap.availability === "unavailable" && !recap.note) return null;
  const playoff = recap.phase === "POSTSEASON";
  const championshipWinner = recap.championshipMatchup?.winnerOwnerId
    ? recap.championshipMatchup.winnerOwnerId === recap.championshipMatchup.ownerAId
      ? `${recap.championshipMatchup.ownerAName} over ${recap.championshipMatchup.ownerBName}`
      : `${recap.championshipMatchup.ownerBName} over ${recap.championshipMatchup.ownerAName}`
    : null;
  return <article className="lcc2-card lcc2-card--raised flex min-w-0 flex-col p-4 sm:p-5" aria-labelledby="home-recap-heading">
    <div className="flex items-start justify-between gap-3"><div><p className="lcc2-label">{playoff ? "Playoff recap" : "Recent recap"}</p><h3 id="home-recap-heading" className="mt-2 font-ui text-xl font-black text-[var(--lcc-color-text)]">{playoff ? `${recap.roundLabel ?? `Week ${recap.week}`} recap` : `Week ${recap.week} recap`}</h3></div><BarChart3 className="h-5 w-5 shrink-0 text-[var(--lcc-interactive)]" aria-hidden="true" /></div>
    {recap.availability === "partial" ? <p className="lcc2-body mt-4">{recap.note ?? "Recap data is incomplete."}</p> : <div className="mt-4 grid gap-2">{playoff ? <RecapFact label="Playoff scope" value={`${recap.matchupCount} completed games${recap.bracketTypes.length ? ` · ${recap.bracketTypes.map((bracket) => bracket === "winners" ? "Winners" : "Consolation").join(" + ")}` : ""}`} /> : <RecapFact label="Weekly high" value={recap.weeklyHighWinner ? `${recap.weeklyHighWinner.teamName} · ${recap.weeklyHighWinner.score.toFixed(2)}` : "Not finalized"} />}{playoff && recap.byeCount > 0 ? <RecapFact label="Byes" value={`${recap.byeCount} team${recap.byeCount === 1 ? "" : "s"} advanced automatically`} /> : null}{championshipWinner ? <RecapFact label="Championship result" value={championshipWinner} /> : null}{recap.placementMatchups.length > 0 ? <RecapFact label="Placement results" value={`${recap.placementMatchups.length} placement game${recap.placementMatchups.length === 1 ? "" : "s"}`} /> : null}<RecapFact label="Closest matchup" value={formatMatchups(recap.closestMatchups, (matchup) => `Margin ${matchup.margin.toFixed(2)}`)} /><RecapFact label="Largest margin" value={formatMatchups(recap.largestMarginMatchups, (matchup) => `Margin ${matchup.margin.toFixed(2)}`)} /><RecapFact label="Highest scoring" value={formatMatchups(recap.highestScoringMatchups, (matchup) => `${matchup.combinedScore.toFixed(2)} combined`)} />{recap.lowestScoringTeam ? <RecapFact label="Lowest team score" value={`${recap.lowestScoringTeam.teamName} · ${recap.lowestScoringTeam.score.toFixed(2)}`} /> : null}{playoff ? <p className="lcc2-body mt-2">{recap.note}</p> : null}</div>}
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
