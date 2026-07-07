import Link from "next/link";
import { notFound } from "next/navigation";
import { Swords, Trophy, Medal, Flame } from "lucide-react";
import { ALL_LCC_OWNERS } from "@/lib/lccOwners";
import { getHeadToHead } from "@/lib/history/headToHead";
import { getOwnerById } from "@/lib/ownerRegistry";
import { getOwnerImagePath } from "@/lib/ownerImages";

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

  return (
    <main className="lcc-page">
      <div className="lcc-container py-8 sm:py-12 lg:py-14">
        <nav className="mb-5 flex flex-wrap gap-3">
          <Link href="/league-info/rivalries" className="lcc-button lcc-button-secondary">
            Back to Rivalries
          </Link>
          <Link href="/matchups" className="lcc-button lcc-button-secondary">
            Matchups
          </Link>
        </nav>

        <header className="lcc-card overflow-hidden">
          <div className="grid gap-0 md:grid-cols-[1fr_14rem_1fr]">
            <OwnerHero ownerId={ownerAId} name={ownerA.displayName} wins={summary.ownerAWins} />
            <div className="flex flex-col items-center justify-center border-y border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-6 text-center md:border-x md:border-y-0">
              <Swords className="mb-3 h-8 w-8 text-[var(--lcc-gold)]" />
              <p className="font-serif text-5xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
                {summary.ownerAWins}-{summary.ownerBWins}
                {summary.ties > 0 ? `-${summary.ties}` : ""}
              </p>
              <p className="mt-2 font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
                {summary.games} Meetings
              </p>
            </div>
            <OwnerHero ownerId={ownerBId} name={ownerB.displayName} wins={summary.ownerBWins} reverse />
          </div>
        </header>

        <section className="mt-5 grid gap-5 md:grid-cols-4">
          <StatCard icon={<Trophy />} label="Regular Season" value={String(summary.regularSeasonGames)} />
          <StatCard icon={<Medal />} label="Playoff Games" value={String(summary.playoffGames)} />
          <StatCard icon={<Flame />} label="Championships" value={String(summary.championshipGames)} />
          <StatCard icon={<Swords />} label="Avg Margin" value={summary.averageMargin.toFixed(2)} />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="lcc-card p-5 sm:p-6">
            <h2 className="font-serif text-3xl font-black uppercase italic text-[var(--lcc-text)]">
              Recent Meetings
            </h2>

            <div className="mt-5 overflow-hidden rounded-[var(--lcc-radius)] border border-[var(--lcc-border)]">
              {latestGames.map((matchup) => (
                <div
                  key={`${matchup.season}-${matchup.week}-${matchup.ownerAId}-${matchup.ownerBId}`}
                  className="grid grid-cols-[5rem_1fr_5rem] items-center border-b border-[var(--lcc-border)] px-4 py-3 last:border-b-0"
                >
                  <div className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
                    {matchup.season}
                    <br />
                    Wk {matchup.week}
                  </div>
                  <div className="font-ui text-sm font-bold text-[var(--lcc-text)]">
                    {ownerName(matchup.ownerAId)} {formatScore(matchup.ownerAScore)} vs{" "}
                    {ownerName(matchup.ownerBId)} {formatScore(matchup.ownerBScore)}
                  </div>
                  <div className="text-right font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
                    {formatType(matchup.type)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="lcc-card p-5">
            <h2 className="font-serif text-2xl font-black uppercase italic text-[var(--lcc-text)]">
              Points
            </h2>
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
    <div className={`flex items-center gap-5 p-6 ${reverse ? "md:flex-row-reverse md:text-right" : ""}`}>
      <img
        src={getOwnerImagePath(ownerId)}
        alt={name}
        className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-[var(--lcc-shadow-soft)]"
      />
      <div>
        <p className="font-serif text-3xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
          {name}
        </p>
        <p className="mt-2 font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
          {wins} wins
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <article className="lcc-card p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[var(--lcc-green-deep)] text-[var(--lcc-gold)]">
        {icon}
      </div>
      <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">{label}</p>
      <p className="mt-2 font-serif text-3xl font-black uppercase italic text-[var(--lcc-text)]">{value}</p>
    </article>
  );
}

function SideFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-3">
      <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">{label}</p>
      <p className="mt-1 font-serif text-lg font-black uppercase italic text-[var(--lcc-text)]">{value}</p>
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