"use client";

import Link from "next/link";
import { Flame, Swords } from "lucide-react";
import { useState } from "react";
import { LeagueInfoShell } from "@/components/league/LeagueInfoShell";

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
    <LeagueInfoShell>
      <main className="lcc2-page-shell">
      <div className="lcc2-page-container">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="lcc2-label text-[var(--lcc-brand-primary)]">Rivalries</p>
            <h1 className="mt-2 font-ui text-4xl font-black tracking-[-0.04em] text-[var(--lcc-color-text)] sm:text-5xl">
              Rivalry Hub
            </h1>
            <p className="lcc2-body mt-3 max-w-2xl">
              Explore LCC&apos;s most-played series, historic matchups, and owner-vs-owner records from the detailed Sleeper-era archive.
            </p>
          </div>
        </header>

        <section className="lcc2-card" aria-label="Owner pairing selector">
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
              className="lcc2-button lcc2-button--secondary"
            >
              Reset
            </button>
          </div>

          {selectedRivalry && (
            <div className="mt-5">
              <Link
                href={`/matchups/head-to-head/${selectedRivalry.ownerA}-vs-${selectedRivalry.ownerB}`}
                className="lcc2-button lcc2-button--primary"
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
            {selectedRivalry ? (
              <>
                <SectionTitle title="Game Records" subtitle="For selected rivalry." />
                {biggestBlowout && (
                  <GameRecordCard
                    title="Biggest Blowout"
                    icon={<Flame className="h-4 w-4" aria-hidden="true" />}
                    matchup={biggestBlowout}
                    owners={owners}
                  />
                )}
                {closestGame && (
                  <GameRecordCard
                    title="Closest Game"
                    icon={<Swords className="h-4 w-4" aria-hidden="true" />}
                    matchup={closestGame}
                    owners={owners}
                  />
                )}
              </>
            ) : (
              <section className="lcc2-card" aria-label="Rivalry context">
                <SectionTitle title="Rivalry context" subtitle="Select an owner pairing to see pair-specific game records." />
                <Link
                  href="/league-info/records"
                  className="lcc2-button lcc2-button--secondary mt-4 w-full"
                >
                  Open League Record Book →
                </Link>
              </section>
            )}
          </aside>
        </section>
      </div>
      </main>
    </LeagueInfoShell>
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
        className="min-h-11 rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] px-4 py-3 font-ui text-sm font-black uppercase text-[var(--lcc-color-text)] outline-none transition focus:border-[var(--lcc-interactive)] focus:ring-2 focus:ring-[var(--lcc-interactive)]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)]"
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
    <article className="lcc2-card lcc2-card--raised overflow-hidden p-0">
      <div className="grid md:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1fr)]">
        <OwnerSide owner={ownerA} wins={rivalry.winsA} points={rivalry.pointsA} />

        <div className="flex flex-col items-center justify-center border-y border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] p-5 text-center md:border-x md:border-y-0">
          <p className="lcc2-section-heading__eyebrow">Series record</p>
          <Swords className="my-3 h-6 w-6 text-[var(--lcc-brand-primary)]" aria-hidden="true" />
          <p className="font-ui text-4xl font-black leading-none text-[var(--lcc-color-text)]">
            {rivalry.winsA}-{rivalry.winsB}
            {rivalry.ties > 0 ? `-${rivalry.ties}` : ""}
          </p>
          <p className="mt-2 lcc2-label">
            {rivalry.meetings} meetings
          </p>
          <p className="mt-1 lcc2-label">
            {rivalry.firstSeason}-{rivalry.lastSeason}
          </p>
        </div>

        <OwnerSide owner={ownerB} wins={rivalry.winsB} points={rivalry.pointsB} reverse />
      </div>

      <div className="grid gap-3 border-t border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] p-4 sm:grid-cols-4">
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
    <div className={`min-w-0 flex items-center gap-4 p-5 sm:p-6 ${reverse ? "md:flex-row-reverse md:text-right" : ""}`}>
      <img src={owner.imagePath} alt={owner.displayName} className="h-16 w-16 shrink-0 rounded-full border-2 border-[var(--lcc-color-border)] object-cover shadow-sm sm:h-20 sm:w-20" />
      <div className="min-w-0">
        <p className="lcc2-label">Owner</p>
        <p className="mt-2 whitespace-normal break-words font-ui text-xl font-black uppercase leading-tight text-[var(--lcc-color-text)] sm:text-2xl">
          {owner.displayName}
        </p>
        <p className="mt-2 lcc2-badge lcc2-badge--positive">
          {wins} wins
        </p>
        <p className="mt-2 lcc2-label">
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
    <article className="lcc2-card">
      <div className="mb-4 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--lcc-color-surface-muted)] text-[var(--lcc-interactive)]">
          {icon}
        </span>
        <h2 className="font-ui text-xl font-black uppercase leading-none text-[var(--lcc-color-text)]">
          {title}
        </h2>
      </div>

      <p className={`lcc2-badge ${getTypeBadgeClass(matchup.type)}`}>
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
      <div className={`flex justify-between rounded-lg border p-3 ${winner ? "border-[var(--lcc-semantic-positive)]/30 bg-[var(--lcc-semantic-positive)]/10" : "border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)]"}`}>
      <span className={winner ? "font-black text-[var(--lcc-semantic-positive)]" : "font-bold text-[var(--lcc-color-text-muted)]"}>
        {owner(owners, ownerId).displayName}
      </span>
      <span className="font-ui font-black text-[var(--lcc-color-text)]">
        {score?.toFixed(2) ?? "—"}
      </span>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="lcc2-section-heading__eyebrow">Rivalry discovery</p>
      <h2 className="mt-2 lcc2-section-heading__title">
        {title}
      </h2>
      <p className="mt-2 lcc2-section-heading__supporting">
        {subtitle}
      </p>
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3">
      <p className="lcc2-label">
        {label}
      </p>
      <p className="mt-1 font-ui text-lg font-black text-[var(--lcc-color-text)]">
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

function getTypeBadgeClass(type: string) {
  if (type === "championship") return "lcc2-badge--achievement";
  if (type === "playoff") return "lcc2-badge--info";
  return "lcc2-badge--neutral";
}
