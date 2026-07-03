import Link from "next/link";
import { Flame, Medal, Swords, Trophy } from "lucide-react";
import { loadAllMatchups, type HistoricalMatchup } from "@/lib/history/matchups";
import { loadAllRivalries, type RivalrySummary } from "@/lib/history/rivalries";
import { getOwnerById } from "@/lib/ownerRegistry";
import { getOwnerImagePath } from "@/lib/ownerImages";

export default function RivalriesPage() {
  const rivalries = loadAllRivalries();
  const matchups = loadAllMatchups();

  const featured = rivalries.slice(0, 12);
  const biggestBlowout = getBiggestBlowout(matchups);
  const closestGame = getClosestGame(matchups);

  return (
    <main className="lcc-page">
      <div className="lcc-container py-8 sm:py-12 lg:py-14">
        <nav className="mb-5 flex flex-wrap gap-3">
          <Link href="/league-info" className="lcc-button lcc-button-secondary">
            Back to League Info
          </Link>
          <Link href="/history" className="lcc-button lcc-button-secondary">
            History Almanac
          </Link>
        </nav>

        <header className="lcc-card p-6 sm:p-8">
          <p className="font-ui text-xs font-black uppercase tracking-[0.25em] text-[var(--lcc-gold)]">
            Long Country Club
          </p>
          <h1 className="mt-3 font-serif text-5xl font-black uppercase italic leading-none text-[var(--lcc-text)] sm:text-6xl">
            Rivalries
          </h1>
          <p className="mt-4 max-w-3xl font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)] sm:text-base">
            Head-to-head history generated from Sleeper matchup archives.
          </p>
        </header>

        <section className="mt-5 grid gap-5 md:grid-cols-3">
          <HeroStat
            icon={<Swords className="h-5 w-5" />}
            label="Tracked Rivalries"
            value={String(rivalries.length)}
          />
          <HeroStat
            icon={<Trophy className="h-5 w-5" />}
            label="Historical Matchups"
            value={String(matchups.length)}
          />
          <HeroStat
            icon={<Medal className="h-5 w-5" />}
            label="Playoff Rivalry Games"
            value={String(
              rivalries.reduce((total, rivalry) => total + rivalry.playoffMeetings, 0)
            )}
          />
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="grid gap-5">
            <SectionTitle title="Top Rivalries" subtitle="Sorted by total meetings." />

            <div className="grid gap-5">
              {featured.map((rivalry) => (
                <RivalryCard key={`${rivalry.ownerA}-${rivalry.ownerB}`} rivalry={rivalry} />
              ))}
            </div>
          </div>

          <aside className="grid gap-5 self-start lg:sticky lg:top-32">
            <SectionTitle title="Game Records" subtitle="From imported matchup history." />

            {biggestBlowout && (
              <GameRecordCard
                title="Biggest Blowout"
                icon={<Flame className="h-4 w-4" />}
                matchup={biggestBlowout}
              />
            )}

            {closestGame && (
              <GameRecordCard
                title="Closest Game"
                icon={<Swords className="h-4 w-4" />}
                matchup={closestGame}
              />
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

function RivalryCard({ rivalry }: { rivalry: RivalrySummary }) {
  const ownerA = ownerName(rivalry.ownerA);
  const ownerB = ownerName(rivalry.ownerB);
  const totalPoints = rivalry.pointsA + rivalry.pointsB;
  const averagePoints =
    rivalry.meetings > 0 ? (totalPoints / rivalry.meetings).toFixed(1) : "0.0";

  return (
    <article className="lcc-card overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[1fr_12rem_1fr]">
        <OwnerSide
          ownerId={rivalry.ownerA}
          name={ownerA}
          wins={rivalry.winsA}
          points={rivalry.pointsA}
        />

        <div className="flex flex-col items-center justify-center border-y border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-5 text-center md:border-x md:border-y-0">
          <Swords className="mb-3 h-7 w-7 text-[var(--lcc-gold)]" />
          <p className="font-serif text-4xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
            {rivalry.winsA}-{rivalry.winsB}
            {rivalry.ties > 0 ? `-${rivalry.ties}` : ""}
          </p>
          <p className="mt-2 font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
            {rivalry.meetings} meetings
          </p>
          <p className="mt-1 font-ui text-xs font-bold uppercase text-[var(--lcc-text-muted)]">
            {rivalry.firstSeason}-{rivalry.lastSeason}
          </p>
        </div>

        <OwnerSide
          ownerId={rivalry.ownerB}
          name={ownerB}
          wins={rivalry.winsB}
          points={rivalry.pointsB}
          reverse
        />
      </div>

      <div className="grid gap-3 border-t border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-4 sm:grid-cols-4">
        <MiniFact label="Playoff Games" value={String(rivalry.playoffMeetings)} />
        <MiniFact label="Championship Games" value={String(rivalry.championshipMeetings)} />
        <MiniFact label="Total Points" value={totalPoints.toFixed(1)} />
        <MiniFact label="Avg Combined" value={averagePoints} />
      </div>
    </article>
  );
}

function OwnerSide({
  ownerId,
  name,
  wins,
  points,
  reverse = false,
}: {
  ownerId: string;
  name: string;
  wins: number;
  points: number;
  reverse?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center gap-4 p-5",
        reverse ? "md:flex-row-reverse md:text-right" : "",
      ].join(" ")}
    >
      <img
        src={getOwnerImagePath(ownerId)}
        alt={name}
        className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-[var(--lcc-shadow-soft)]"
      />
      <div>
        <p className="font-serif text-2xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
          {name}
        </p>
        <p className="mt-2 font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
          {wins} wins
        </p>
        <p className="mt-1 font-ui text-xs font-bold uppercase text-[var(--lcc-text-muted)]">
          {points.toFixed(1)} points
        </p>
      </div>
    </div>
  );
}

function GameRecordCard({
  title,
  icon,
  matchup,
}: {
  title: string;
  icon: React.ReactNode;
  matchup: HistoricalMatchup;
}) {
  const margin = getMargin(matchup);

  return (
    <article className="lcc-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--lcc-green-deep)] text-[var(--lcc-gold)]">
          {icon}
        </span>
        <h2 className="font-serif text-2xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
          {title}
        </h2>
      </div>

      <p className="font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
        {matchup.season} · Week {matchup.week} · {formatType(matchup.type)}
      </p>

      <div className="mt-4 grid gap-3">
        <ScoreLine ownerId={matchup.ownerAId} score={matchup.ownerAScore} winner={matchup.winnerOwnerId === matchup.ownerAId} />
        <ScoreLine ownerId={matchup.ownerBId} score={matchup.ownerBScore} winner={matchup.winnerOwnerId === matchup.ownerBId} />
      </div>

      <div className="mt-4 rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-3">
        <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
          Margin
        </p>
        <p className="mt-1 font-serif text-3xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
          {margin.toFixed(2)}
        </p>
      </div>
    </article>
  );
}

function ScoreLine({
  ownerId,
  score,
  winner,
}: {
  ownerId: string;
  score: number | null;
  winner: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-3">
      <span className={winner ? "font-ui text-sm font-black text-[var(--lcc-text)]" : "font-ui text-sm font-bold text-[var(--lcc-text-muted)]"}>
        {ownerName(ownerId)}
      </span>
      <span className="font-serif text-xl font-black uppercase italic text-[var(--lcc-text)]">
        {score?.toFixed(2) ?? "—"}
      </span>
    </div>
  );
}

function HeroStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="lcc-card p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[var(--lcc-green-deep)] text-[var(--lcc-gold)]">
        {icon}
      </div>
      <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
        {label}
      </p>
      <p className="mt-2 font-serif text-4xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
        {value}
      </p>
    </article>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="font-ui text-xs font-black uppercase tracking-wide text-[var(--lcc-gold)]">
        LCC Almanac
      </p>
      <h2 className="mt-2 font-serif text-3xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
        {title}
      </h2>
      <p className="mt-2 font-ui text-sm font-medium text-[var(--lcc-text-muted)]">
        {subtitle}
      </p>
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface)] p-3">
      <p className="font-ui text-[0.65rem] font-black uppercase text-[var(--lcc-text-muted)]">
        {label}
      </p>
      <p className="mt-1 font-serif text-lg font-black uppercase italic text-[var(--lcc-text)]">
        {value}
      </p>
    </div>
  );
}

function ownerName(ownerId: string) {
  return getOwnerById(ownerId)?.displayName ?? ownerId;
}

function getMargin(matchup: HistoricalMatchup) {
  return Math.abs((matchup.ownerAScore ?? 0) - (matchup.ownerBScore ?? 0));
}

function getBiggestBlowout(matchups: readonly HistoricalMatchup[]) {
  return [...matchups]
    .filter((matchup) => matchup.ownerAScore !== null && matchup.ownerBScore !== null)
    .sort((a, b) => getMargin(b) - getMargin(a))[0];
}

function getClosestGame(matchups: readonly HistoricalMatchup[]) {
  return [...matchups]
    .filter((matchup) => matchup.ownerAScore !== null && matchup.ownerBScore !== null)
    .filter((matchup) => getMargin(matchup) > 0)
    .sort((a, b) => getMargin(a) - getMargin(b))[0];
}

function formatType(type: string) {
  if (type === "regularSeason") return "Regular Season";
  if (type === "championship") return "Championship";
  if (type === "playoff") return "Playoff";
  return "Unknown";
}