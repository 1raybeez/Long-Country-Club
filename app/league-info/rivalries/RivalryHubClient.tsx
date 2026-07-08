"use client";

import Link from "next/link";
import { Flame, Swords } from "lucide-react";
import { useState } from "react";

type OwnerOption = {
  id: string;
  displayName: string;
  imagePath: string;
};

type RivalrySummary = {
  ownerA: string;
  ownerB: string;
  meetings: number;
  winsA: number;
  winsB: number;
  ties: number;
  pointsA: number;
  pointsB: number;
  playoffMeetings: number;
  championshipMeetings: number;
  firstSeason?: number;
  lastSeason?: number;
};

type HistoricalMatchup = {
  season: number;
  week: number | null;
  type: string;
  ownerAId: string;
  ownerBId: string;
  ownerAScore: number | null;
  ownerBScore: number | null;
  winnerOwnerId: string | null;
};

export function RivalryHubClient({
  owners,
  rivalries,
  matchups,
}: {
  owners: readonly OwnerOption[];
  rivalries: readonly RivalrySummary[];
  matchups: readonly HistoricalMatchup[];
}) {
  const [ownerAId, setOwnerAId] = useState("");
  const [ownerBId, setOwnerBId] = useState("");

  const selectedRivalry =
    ownerAId && ownerBId
      ? rivalries.find(
          (rivalry) =>
            [rivalry.ownerA, rivalry.ownerB].sort().join("-") ===
            [ownerAId, ownerBId].sort().join("-")
        )
      : null;

  const scopedMatchups = selectedRivalry
    ? matchups.filter(
        (matchup) =>
          [matchup.ownerAId, matchup.ownerBId].sort().join("-") ===
          [ownerAId, ownerBId].sort().join("-")
      )
    : matchups;

  const biggestBlowout = getBiggestBlowout(scopedMatchups);
  const closestGame = getClosestGame(scopedMatchups);
  const featured = selectedRivalry ? [selectedRivalry] : rivalries.slice(0, 12);

  return (
    <main className="lcc-page">
      <div className="lcc-container py-8 sm:py-12 lg:py-14">
        <header className="lcc-card p-6 sm:p-8">
          <p className="font-ui text-xs font-black uppercase tracking-[0.25em] text-[var(--lcc-gold)]">
            Long Country Club
          </p>
          <h1 className="mt-3 font-serif text-5xl font-black uppercase italic leading-none text-[var(--lcc-text)] sm:text-6xl">
            Rivalry Hub
          </h1>
          <p className="mt-4 max-w-3xl font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)] sm:text-base">
            Pick any two owners or browse the most-played rivalries in LCC&apos;s Sleeper-era archive.
          </p>
        </header>

        <section className="mt-5 lcc-card p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <OwnerSelect
              label="Owner A"
              value={ownerAId}
              owners={owners}
              onChange={setOwnerAId}
            />
            <OwnerSelect
              label="Owner B"
              value={ownerBId}
              owners={owners.filter((owner) => owner.id !== ownerAId)}
              onChange={setOwnerBId}
            />
            <button
              type="button"
              onClick={() => {
                setOwnerAId("");
                setOwnerBId("");
              }}
              className="lcc-button lcc-button-secondary"
            >
              Reset
            </button>
          </div>

          {selectedRivalry && (
            <div className="mt-5">
              <Link
                href={`/matchups/head-to-head/${selectedRivalry.ownerA}-vs-${selectedRivalry.ownerB}`}
                className="lcc-button"
              >
                View Full Head-to-Head →
              </Link>
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="grid gap-5">
            <SectionTitle
              title={selectedRivalry ? "Selected Rivalry" : "Top Rivalries"}
              subtitle={
                selectedRivalry
                  ? "Head-to-head snapshot."
                  : "Sorted by total meetings."
              }
            />

            {featured.map((rivalry) => (
              <RivalryCard
                key={`${rivalry.ownerA}-${rivalry.ownerB}`}
                rivalry={rivalry}
                owners={owners}
              />
            ))}
          </div>

          <aside className="grid gap-5 self-start lg:sticky lg:top-32">
            <SectionTitle
              title="Game Records"
              subtitle={selectedRivalry ? "For selected rivalry." : "Across all matchups."}
            />

            {biggestBlowout && (
              <GameRecordCard
                title="Biggest Blowout"
                icon={<Flame className="h-4 w-4" />}
                matchup={biggestBlowout}
                owners={owners}
              />
            )}

            {closestGame && (
              <GameRecordCard
                title="Closest Game"
                icon={<Swords className="h-4 w-4" />}
                matchup={closestGame}
                owners={owners}
              />
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

function OwnerSelect({
  label,
  value,
  owners,
  onChange,
}: {
  label: string;
  value: string;
  owners: readonly OwnerOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface)] px-4 py-3 font-ui text-sm font-black uppercase text-[var(--lcc-text)]"
      >
        <option value="">Select owner</option>
        {owners.map((owner) => (
          <option key={owner.id} value={owner.id}>
            {owner.displayName}
          </option>
        ))}
      </select>
    </label>
  );
}

function RivalryCard({
  rivalry,
  owners,
}: {
  rivalry: RivalrySummary;
  owners: readonly OwnerOption[];
}) {
  const ownerA = owner(owners, rivalry.ownerA);
  const ownerB = owner(owners, rivalry.ownerB);

  return (
    <article className="lcc-card overflow-hidden">
      <div className="grid md:grid-cols-[1fr_12rem_1fr]">
        <OwnerSide owner={ownerA} wins={rivalry.winsA} points={rivalry.pointsA} />

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

        <OwnerSide owner={ownerB} wins={rivalry.winsB} points={rivalry.pointsB} reverse />
      </div>

      <div className="grid gap-3 border-t border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-4 sm:grid-cols-4">
        <MiniFact label="Playoff Games" value={String(rivalry.playoffMeetings)} />
        <MiniFact label="Championship Games" value={String(rivalry.championshipMeetings)} />
        <MiniFact label="Total Points" value={(rivalry.pointsA + rivalry.pointsB).toFixed(1)} />
        <MiniFact label="Avg Combined" value={((rivalry.pointsA + rivalry.pointsB) / rivalry.meetings).toFixed(1)} />
      </div>
    </article>
  );
}

function OwnerSide({
  owner,
  wins,
  points,
  reverse = false,
}: {
  owner: OwnerOption;
  wins: number;
  points: number;
  reverse?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 p-5 ${reverse ? "md:flex-row-reverse md:text-right" : ""}`}>
      <img src={owner.imagePath} alt={owner.displayName} className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-[var(--lcc-shadow-soft)]" />
      <div>
        <p className="font-serif text-2xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
          {owner.displayName}
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
  owners,
}: {
  title: string;
  icon: React.ReactNode;
  matchup: HistoricalMatchup;
  owners: readonly OwnerOption[];
}) {
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
        <ScoreLine owners={owners} ownerId={matchup.ownerAId} score={matchup.ownerAScore} winner={matchup.winnerOwnerId === matchup.ownerAId} />
        <ScoreLine owners={owners} ownerId={matchup.ownerBId} score={matchup.ownerBScore} winner={matchup.winnerOwnerId === matchup.ownerBId} />
      </div>

      <MiniFact label="Margin" value={getMargin(matchup).toFixed(2)} />
    </article>
  );
}

function ScoreLine({
  owners,
  ownerId,
  score,
  winner,
}: {
  owners: readonly OwnerOption[];
  ownerId: string;
  score: number | null;
  winner: boolean;
}) {
  return (
    <div className="flex justify-between rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-3">
      <span className={winner ? "font-black" : "font-bold text-[var(--lcc-text-muted)]"}>
        {owner(owners, ownerId).displayName}
      </span>
      <span className="font-serif font-black italic">
        {score?.toFixed(2) ?? "—"}
      </span>
    </div>
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
    <div className="mt-3 rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface)] p-3">
      <p className="font-ui text-[0.65rem] font-black uppercase text-[var(--lcc-text-muted)]">
        {label}
      </p>
      <p className="mt-1 font-serif text-lg font-black uppercase italic text-[var(--lcc-text)]">
        {value}
      </p>
    </div>
  );
}

function owner(owners: readonly OwnerOption[], ownerId: string) {
  return owners.find((item) => item.id === ownerId) ?? {
    id: ownerId,
    displayName: ownerId,
    imagePath: "",
  };
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
  if (type === "regularSeason") return "Regular";
  if (type === "championship") return "Championship";
  if (type === "playoff") return "Playoff";
  return "Game";
}