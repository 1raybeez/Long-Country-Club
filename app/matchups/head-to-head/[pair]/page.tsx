import Link from "next/link";
import { notFound } from "next/navigation";
import { Swords, Trophy, Medal, Flame } from "lucide-react";
import { ALL_LCC_OWNERS } from "@/lib/lccOwners";
import { getHeadToHead } from "@/lib/history/headToHead";
import { buildMatchupTimeline } from "@/lib/history/matchupTimeline";
import { getOwnerById } from "@/lib/ownerRegistry";
import { getOwnerImagePath } from "@/lib/ownerImages";
import { MatchupTimeline } from "@/components/matchups/MatchupTimeline";

export function generateStaticParams() {
  const params: Array<{ pair: string }> = [];

  for (let i = 0; i < ALL_LCC_OWNERS.length; i += 1) {
    for (let j = i + 1; j < ALL_LCC_OWNERS.length; j += 1) {
      params.push({
        pair: `${ALL_LCC_OWNERS[i].id}-vs-${ALL_LCC_OWNERS[j].id}`,
      });
    }
  }

  return params;
}

type PageProps = {
  params: Promise<{
    pair: string;
  }>;
};

export default async function HeadToHeadPage({ params }: PageProps) {
  const { pair } = await params;
  const [ownerAId, ownerBId] = pair.split("-vs-");

  if (!ownerAId || !ownerBId) {
    notFound();
  }

  const ownerA = getOwnerById(ownerAId);
  const ownerB = getOwnerById(ownerBId);

  if (!ownerA || !ownerB) {
    notFound();
  }

  const summary = getHeadToHead(ownerAId, ownerBId);

  if (summary.games === 0) {
    notFound();
  }

  const latestGames = summary.matchups.slice().reverse().slice(0, 10);
  const timeline = buildMatchupTimeline(summary);

  return (
    <main className="lcc2-page-shell">
      <div className="lcc2-page-container">
        <nav className="mb-5 flex flex-wrap gap-3" aria-label="H2H navigation">
          <Link href="/league-info/rivalries" className="lcc2-button lcc2-button--secondary">
            Back to Rivalries
          </Link>
          <Link href="/matchups" className="lcc2-button lcc2-button--secondary">
            Matchups
          </Link>
        </nav>

        <header className="lcc2-card lcc2-card--raised overflow-hidden p-0">
          <div className="grid gap-0 md:grid-cols-[1fr_14rem_1fr]">
            <OwnerHero ownerId={ownerAId} name={ownerA.displayName} wins={summary.ownerAWins} />
            <div className="flex flex-col items-center justify-center border-y border-slate-200 bg-slate-50 p-6 text-center md:border-x md:border-y-0">
              <h1 className="sr-only">{ownerA.displayName} versus {ownerB.displayName}</h1>
              <p className="lcc2-section-heading__eyebrow">Series record</p>
              <Swords className="my-3 h-6 w-6 text-[var(--lcc-brand-primary)]" aria-hidden="true" />
              <p className="font-ui text-4xl font-black leading-none text-[var(--lcc-color-text)]">
                {summary.ownerAWins}-{summary.ownerBWins}
                {summary.ties > 0 ? `-${summary.ties}` : ""}
              </p>
              <p className="mt-2 lcc2-label">
                {summary.games} Meetings
              </p>
            </div>
            <OwnerHero ownerId={ownerBId} name={ownerB.displayName} wins={summary.ownerBWins} reverse />
          </div>
        </header>

        <section className="mt-5 grid gap-4 md:grid-cols-4" aria-label="Series metrics">
          <StatCard icon={<Trophy />} label="Regular Season" value={String(summary.regularSeasonGames)} />
          <StatCard icon={<Medal />} label="Playoff Games" value={String(summary.playoffGames)} />
          <StatCard icon={<Flame />} label="Championships" value={String(summary.championshipGames)} />
          <StatCard icon={<Swords />} label="Avg Margin" value={summary.averageMargin.toFixed(2)} />
        </section>

        <div className="mt-5">
          <MatchupTimeline
            ownerAName={ownerA.displayName}
            ownerBName={ownerB.displayName}
            meetings={timeline}
          />
        </div>

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="lcc2-card">
            <div className="lcc2-section-heading">
              <div>
                <p className="lcc2-section-heading__eyebrow">Series log</p>
                <h2 className="lcc2-section-heading__title">Recent Meetings</h2>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
              {latestGames.map((matchup) => (
                <div
                  key={`${matchup.season}-${matchup.week}-${matchup.ownerAId}-${matchup.ownerBId}`}
                  className="grid gap-2 border-b border-slate-200 px-4 py-3 last:border-b-0 sm:grid-cols-[5rem_1fr_auto] sm:items-center"
                >
                  <div className="lcc2-label">
                    {matchup.season}
                    <br />
                    Wk {matchup.week}
                  </div>
                  <div className="font-ui text-sm font-bold text-[var(--lcc-color-text)]">
                    {ownerName(matchup.ownerAId)} {formatScore(matchup.ownerAScore)} vs{" "}
                    {ownerName(matchup.ownerBId)} {formatScore(matchup.ownerBScore)}
                  </div>
                  <div className={`lcc2-badge ${getTypeBadgeClass(matchup.type)}`}>
                    {formatType(matchup.type)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="lcc2-card">
            <div className="lcc2-section-heading">
              <div>
                <p className="lcc2-section-heading__eyebrow">Series totals</p>
                <h2 className="lcc2-section-heading__title">Points</h2>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <SideFact label={ownerA.displayName} value={summary.ownerAPoints.toLocaleString()} />
              <SideFact label={ownerB.displayName} value={summary.ownerBPoints.toLocaleString()} />
              <SideFact
                label="First / Last"
                value={`${summary.firstMeetingSeason}-${summary.lastMeetingSeason}`}
              />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function OwnerHero({
  ownerId,
  name,
  wins,
  reverse = false,
}: {
  ownerId: string;
  name: string;
  wins: number;
  reverse?: boolean;
}) {
  return (
    <div className={`flex items-center gap-5 p-6 sm:p-8 ${reverse ? "md:flex-row-reverse md:text-right" : ""}`}>
      <img
        src={getOwnerImagePath(ownerId)}
        alt={name}
        className="h-20 w-20 shrink-0 rounded-full border-2 border-slate-200 object-cover shadow-sm sm:h-24 sm:w-24"
      />
      <div className="min-w-0">
        <p className="lcc2-label">Owner</p>
        <p className="mt-2 truncate font-ui text-2xl font-black uppercase leading-none text-[var(--lcc-color-text)] sm:text-3xl">
          {name}
        </p>
        <p className="mt-3 lcc2-badge lcc2-badge--positive">{wins} wins</p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <article className="lcc2-metric-card">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-[var(--lcc-interactive)]">
        {icon}
      </div>
      <p className="lcc2-metric-card__label">{label}</p>
      <p className="lcc2-metric-card__value">{value}</p>
    </article>
  );
}

function SideFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="lcc2-label truncate">{label}</p>
      <p className="mt-1 font-ui text-lg font-black text-[var(--lcc-color-text)]">{value}</p>
    </div>
  );
}

function ownerName(ownerId: string) {
  return getOwnerById(ownerId)?.displayName ?? ownerId;
}

function formatScore(score: number | null) {
  return score === null ? "—" : score.toFixed(2);
}

function formatType(type: string) {
  if (type === "regularSeason") return "Regular";
  if (type === "championship") return "Title";
  if (type === "playoff") return "Playoff";
  return "Game";
}

function getTypeBadgeClass(type: string) {
  if (type === "championship") return "lcc2-badge--achievement";
  if (type === "playoff") return "lcc2-badge--info";
  return "lcc2-badge--neutral";
}
