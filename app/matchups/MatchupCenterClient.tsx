"use client";

import Link from "next/link";
import { CalendarDays, Swords, Trophy } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type OwnerOption = {
  id: string;
  displayName: string;
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

export function MatchupCenterClient({
  currentSeason,
  seasons,
  owners,
  matchups,
}: {
  currentSeason: number;
  seasons: readonly number[];
  owners: readonly OwnerOption[];
  matchups: readonly HistoricalMatchup[];
}) {
  const [season, setSeason] = useState(String(currentSeason));
  const [gameView, setGameView] = useState<"regular" | "playoffs">("regular");
  const [week, setWeek] = useState("latest");

  const seasonNumber = Number(season);

  const availableWeeks = useMemo(() => {
    const weeks = matchups
      .filter((matchup) => matchup.season === seasonNumber)
      .filter((matchup) =>
        gameView === "regular"
          ? matchup.type === "regularSeason"
          : matchup.type === "playoff" || matchup.type === "championship"
      )
      .map((matchup) => matchup.week)
      .filter((value): value is number => typeof value === "number");

    return Array.from(new Set(weeks)).sort((a, b) => a - b);
  }, [gameView, matchups, seasonNumber]);

  const latestWeek = availableWeeks.at(-1);

  useEffect(() => {
    setWeek("latest");
  }, [season, gameView]);

  const selectedWeek = week === "latest" ? latestWeek : Number(week);

  const filteredMatchups = useMemo(() => {
    return matchups
      .filter((matchup) => matchup.season === seasonNumber)
      .filter((matchup) =>
        gameView === "regular"
          ? matchup.type === "regularSeason"
          : matchup.type === "playoff" || matchup.type === "championship"
      )
      .filter((matchup) =>
        selectedWeek === undefined ? false : matchup.week === selectedWeek
      )
      .sort((a, b) => ownerName(owners, a.ownerAId).localeCompare(ownerName(owners, b.ownerAId)));
  }, [gameView, matchups, owners, seasonNumber, selectedWeek]);

  return (
    <main className="lcc-page">
      <div className="lcc-container py-8 sm:py-12 lg:py-14">
        <header className="lcc-card p-6 sm:p-8">
          <p className="font-ui text-xs font-black uppercase tracking-[0.25em] text-[var(--lcc-gold)]">
            Long Country Club
          </p>
          <h1 className="mt-3 font-serif text-5xl font-black uppercase italic leading-none text-[var(--lcc-text)] sm:text-6xl">
            Matchup Center
          </h1>
          <p className="mt-4 max-w-3xl font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)] sm:text-base">
            Weekly scoreboard for the full Sleeper-era matchup archive.
          </p>
        </header>

        <section className="mt-5 grid gap-5 md:grid-cols-3">
          <StatCard
            icon={<Swords />}
            label="Shown Matchups"
            value={String(filteredMatchups.length)}
          />
          <StatCard
            icon={<CalendarDays />}
            label="Season / Week"
            value={`${season} / ${selectedWeek ?? "—"}`}
          />
          <StatCard
            icon={<Trophy />}
            label="View"
            value={gameView === "regular" ? "Regular" : "Playoffs"}
          />
        </section>

        <section className="mt-5 lcc-card p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <FilterSelect label="Season" value={season} onChange={setSeason}>
              {seasons.map((seasonOption) => (
                <option key={seasonOption} value={seasonOption}>
                  {seasonOption}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              label="Schedule Type"
              value={gameView}
              onChange={(value) =>
                setGameView(value === "playoffs" ? "playoffs" : "regular")
              }
            >
              <option value="regular">Regular Season</option>
              <option value="playoffs">Playoffs</option>
            </FilterSelect>

            <FilterSelect label="Week" value={week} onChange={setWeek}>
              <option value="latest">Latest Week</option>
              {availableWeeks.map((weekOption) => (
                <option key={weekOption} value={weekOption}>
                  Week {weekOption}
                </option>
              ))}
            </FilterSelect>
          </div>
        </section>

        <section className="mt-8 lcc-card p-5 sm:p-6">
          <h2 className="font-serif text-3xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
            {season} Week {selectedWeek ?? "—"} Matchups
          </h2>

          {filteredMatchups.length === 0 ? (
            <div className="mt-5 rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-6">
              <p className="font-ui text-sm font-bold text-[var(--lcc-text-muted)]">
                No completed games found for this season/week yet.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {filteredMatchups.map((matchup) => (
                <MatchupCard
                  key={`${matchup.season}-${matchup.week}-${matchup.ownerAId}-${matchup.ownerBId}`}
                  matchup={matchup}
                  owners={owners}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MatchupCard({
  matchup,
  owners,
}: {
  matchup: HistoricalMatchup;
  owners: readonly OwnerOption[];
}) {
  const ownerAName = ownerName(owners, matchup.ownerAId);
  const ownerBName = ownerName(owners, matchup.ownerBId);
  const ownerAWon = matchup.winnerOwnerId === matchup.ownerAId;
  const ownerBWon = matchup.winnerOwnerId === matchup.ownerBId;

  return (
    <article className="overflow-hidden rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)]">
      <div className="grid md:grid-cols-[1fr_6rem_1fr]">
        <TeamScore
          name={ownerAName}
          score={matchup.ownerAScore}
          won={ownerAWon}
        />

        <div className="flex items-center justify-center border-y border-[var(--lcc-border)] bg-[var(--lcc-surface)] px-4 py-3 md:border-x md:border-y-0">
          <span className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
            VS
          </span>
        </div>

        <TeamScore
          name={ownerBName}
          score={matchup.ownerBScore}
          won={ownerBWon}
          reverse
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--lcc-border)] bg-[var(--lcc-surface)] px-4 py-3">
        <span className="rounded-full border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] px-3 py-1 font-ui text-[0.65rem] font-black uppercase text-[var(--lcc-text-muted)]">
          {formatType(matchup.type)}
        </span>

        <Link
          href={`/matchups/head-to-head/${matchup.ownerAId}-vs-${matchup.ownerBId}`}
          className="font-ui text-xs font-black uppercase text-[var(--lcc-gold)] hover:text-[var(--lcc-text)]"
        >
          View H2H →
        </Link>
      </div>
    </article>
  );
}

function TeamScore({
  name,
  score,
  won,
  reverse = false,
}: {
  name: string;
  score: number | null;
  won: boolean;
  reverse?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-4 p-4",
        won ? "bg-[var(--lcc-green-deep)] text-[var(--lcc-surface)]" : "",
        reverse ? "md:flex-row-reverse md:text-right" : "",
      ].join(" ")}
    >
      <div>
        <p className="font-serif text-xl font-black uppercase italic leading-none">
          {won ? "🏆 " : ""}
          {name}
        </p>
      </div>

      <p className="font-serif text-3xl font-black uppercase italic leading-none">
        {formatScore(score)}
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
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
        {children}
      </select>
    </label>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
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

function ownerName(owners: readonly OwnerOption[], ownerId: string) {
  return owners.find((owner) => owner.id === ownerId)?.displayName ?? ownerId;
}

function formatScore(score: number | null) {
  return score === null ? "—" : score.toFixed(2);
}

function formatType(type: string) {
  if (type === "regularSeason") return "Regular";
  if (type === "playoff") return "Playoff";
  if (type === "championship") return "Championship";
  return "Game";
}