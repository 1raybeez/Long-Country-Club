"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Swords,
  Trophy,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type OwnerOption = {
  id: string;
  displayName: string;
};

type HistoricalLineupPlayer = {
  playerId: string;
  name: string;
  position: string | null;
  nflTeam: string | null;
  points: number | null;
  imageUrl: string;
  isDefense: boolean;
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
  ownerAStarters?: readonly HistoricalLineupPlayer[];
  ownerBStarters?: readonly HistoricalLineupPlayer[];
  ownerABench?: readonly HistoricalLineupPlayer[];
  ownerBBench?: readonly HistoricalLineupPlayer[];
  ownerABenchDataAvailable?: boolean;
  ownerBBenchDataAvailable?: boolean;
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
  const [gameView, setGameView] =
    useState<"regular" | "playoffs">("regular");
  const [week, setWeek] = useState("latest");
  const [expandedMatchups, setExpandedMatchups] =
    useState<Set<string>>(new Set());
  const [expandedBenches, setExpandedBenches] =
    useState<Set<string>>(new Set());

  const seasonNumber = Number(season);

  const availableWeeks = useMemo(() => {
    const weeks = matchups
      .filter((matchup) => matchup.season === seasonNumber)
      .filter((matchup) =>
        gameView === "regular"
          ? matchup.type === "regularSeason"
          : matchup.type === "playoff" ||
            matchup.type === "championship"
      )
      .map((matchup) => matchup.week)
      .filter(
        (value): value is number =>
          typeof value === "number"
      );

    return Array.from(new Set(weeks)).sort(
      (a, b) => a - b
    );
  }, [gameView, matchups, seasonNumber]);

  const latestWeek = availableWeeks.at(-1);

  useEffect(() => {
    setWeek("latest");
    setExpandedMatchups(new Set());
    setExpandedBenches(new Set());
  }, [season, gameView]);

  const selectedWeek =
    week === "latest" ? latestWeek : Number(week);

  const filteredMatchups = useMemo(() => {
    return matchups
      .filter(
        (matchup) => matchup.season === seasonNumber
      )
      .filter((matchup) =>
        gameView === "regular"
          ? matchup.type === "regularSeason"
          : matchup.type === "playoff" ||
            matchup.type === "championship"
      )
      .filter((matchup) =>
        selectedWeek === undefined
          ? false
          : matchup.week === selectedWeek
      )
      .sort((a, b) =>
        ownerName(owners, a.ownerAId).localeCompare(
          ownerName(owners, b.ownerAId)
        )
      );
  }, [
    gameView,
    matchups,
    owners,
    seasonNumber,
    selectedWeek,
  ]);

  function toggleMatchup(matchupKey: string) {
    setExpandedMatchups((current) => {
      const next = new Set(current);

      if (next.has(matchupKey)) {
        next.delete(matchupKey);
      } else {
        next.add(matchupKey);
      }

      return next;
    });
  }

  function toggleBench(matchupKey: string) {
    setExpandedBenches((current) => {
      const next = new Set(current);

      if (next.has(matchupKey)) {
        next.delete(matchupKey);
      } else {
        next.add(matchupKey);
      }

      return next;
    });
  }

  return (
    <main className="lcc2-page-shell">
      <div className="lcc2-page-container">
        <header className="lcc2-card lcc2-card--raised">
          <p className="lcc2-section-heading__eyebrow">
            Long Country Club · {season}
          </p>

          <h1 className="mt-2 lcc2-home-identity__title">
            Matchup Center
          </h1>

          <p className="mt-3 lcc2-home-identity__supporting">
            Weekly scores, starting lineups, bench depth, and H2H history from
            the Sleeper-era matchup archive.
          </p>
        </header>

        <section className="mt-5 grid gap-5 md:grid-cols-3">
          <StatCard
            icon={<Swords className="h-5 w-5" />}
            label="Shown Matchups"
            value={String(filteredMatchups.length)}
          />

          <StatCard
            icon={
              <CalendarDays className="h-5 w-5" />
            }
            label="Season / Week"
            value={`${season} / ${selectedWeek ?? "—"}`}
          />

          <StatCard
            icon={<Trophy className="h-5 w-5" />}
            label="View"
            value={
              gameView === "regular"
                ? "Regular"
                : "Playoffs"
            }
          />
        </section>

        <section className="lcc2-card mt-5">
          <div className="grid gap-4 md:grid-cols-3">
            <FilterSelect
              label="Season"
              value={season}
              onChange={setSeason}
            >
              {seasons.map((seasonOption) => (
                <option
                  key={seasonOption}
                  value={seasonOption}
                >
                  {seasonOption}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              label="Schedule Type"
              value={gameView}
              onChange={(value) =>
                setGameView(
                  value === "playoffs"
                    ? "playoffs"
                    : "regular"
                )
              }
            >
              <option value="regular">
                Regular Season
              </option>
              <option value="playoffs">
                Playoffs
              </option>
            </FilterSelect>

            <FilterSelect
              label="Week"
              value={week}
              onChange={setWeek}
            >
              <option value="latest">
                Latest Week
              </option>

              {availableWeeks.map((weekOption) => (
                <option
                  key={weekOption}
                  value={weekOption}
                >
                  Week {weekOption}
                </option>
              ))}
            </FilterSelect>
          </div>
        </section>

        <section className="lcc2-card mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="lcc2-section-heading__eyebrow">
                Weekly scoreboard
              </p>

              <h2 className="mt-2 lcc2-section-heading__title">
                {season} Week {selectedWeek ?? "—"}{" "}
                Matchups
              </h2>
            </div>

            {filteredMatchups.length > 0 ? (
              <p className="lcc2-label">
                Select a matchup to view lineups
              </p>
            ) : null}
          </div>

          {filteredMatchups.length === 0 ? (
            <div className="lcc2-card mt-5 bg-slate-50">
              <p className="lcc2-label">
                {seasonNumber === currentSeason
                  ? `${season} season has not started yet.`
                  : "No completed games found for this season and week."}
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-5">
              {filteredMatchups.map((matchup) => {
                const matchupKey =
                  getMatchupKey(matchup);

                return (
                  <MatchupCard
                    key={matchupKey}
                    matchup={matchup}
                    owners={owners}
                    isExpanded={expandedMatchups.has(
                      matchupKey
                    )}
                    isBenchExpanded={expandedBenches.has(
                      matchupKey
                    )}
                    onToggle={() =>
                      toggleMatchup(matchupKey)
                    }
                    onBenchToggle={() =>
                      toggleBench(matchupKey)
                    }
                  />
                );
              })}
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
  isExpanded,
  isBenchExpanded,
  onToggle,
  onBenchToggle,
}: {
  matchup: HistoricalMatchup;
  owners: readonly OwnerOption[];
  isExpanded: boolean;
  isBenchExpanded: boolean;
  onToggle: () => void;
  onBenchToggle: () => void;
}) {
  const ownerAName = ownerName(
    owners,
    matchup.ownerAId
  );

  const ownerBName = ownerName(
    owners,
    matchup.ownerBId
  );

  const ownerAWon =
    matchup.winnerOwnerId === matchup.ownerAId;

  const ownerBWon =
    matchup.winnerOwnerId === matchup.ownerBId;

  const ownerAStarters =
    matchup.ownerAStarters ?? [];

  const ownerBStarters =
    matchup.ownerBStarters ?? [];

  const ownerABench = matchup.ownerABench ?? [];
  const ownerBBench = matchup.ownerBBench ?? [];

  const hasLineups =
    ownerAStarters.length > 0 ||
    ownerBStarters.length > 0;

  const hasBenchData =
    matchup.ownerABenchDataAvailable === true ||
    matchup.ownerBBenchDataAvailable === true;

  const matchupPanelId = `matchup-panel-${getMatchupKey(matchup)}`;

  return (
    <article
      className={[
        "lcc2-matchup-card",
        isExpanded ? "lcc2-matchup-card--expanded" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onToggle}
        className="block w-full text-left"
        aria-expanded={isExpanded}
        aria-controls={matchupPanelId}
      >
        <div className="grid md:grid-cols-[1fr_7rem_1fr]">
          <TeamScore
            name={ownerAName}
            score={matchup.ownerAScore}
            won={ownerAWon}
          />

          <div className="lcc2-matchup-center flex items-center justify-center border-y px-4 py-4 md:border-x md:border-y-0">
            <div className="lcc2-matchup-toggle text-center">
              <span className="lcc2-label">
                Final
              </span>

              <div className="flex items-center justify-center text-[var(--lcc-interactive)]" aria-hidden="true">
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </div>
          </div>

          <TeamScore
            name={ownerBName}
            score={matchup.ownerBScore}
            won={ownerBWon}
            reverse
          />
        </div>
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`lcc2-badge ${getTypeBadgeClass(matchup.type)}`}>
            {formatType(matchup.type)}
          </span>
        </div>

        <Link
          href={`/matchups/head-to-head/${matchup.ownerAId}-vs-${matchup.ownerBId}`}
          onClick={(event) =>
            event.stopPropagation()
          }
          className="lcc2-label text-[var(--lcc-interactive)] transition hover:text-[var(--lcc-brand-primary)]"
        >
          View H2H →
        </Link>
      </div>

      {isExpanded ? (
        <div
          id={matchupPanelId}
          className="lcc2-matchup-panel p-4 sm:p-5"
        >
          {hasLineups ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <StartingLineup
                ownerName={ownerAName}
                players={ownerAStarters}
                won={ownerAWon}
              />

              <StartingLineup
                ownerName={ownerBName}
                players={ownerBStarters}
                won={ownerBWon}
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
              <p className="lcc2-label text-[var(--lcc-color-text)]">
                Starting lineup data is not available
                for this matchup.
              </p>
            </div>
          )}

          {hasBenchData ? (
            <div className="mt-5 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={onBenchToggle}
                className="lcc2-button lcc2-button--secondary"
                aria-expanded={isBenchExpanded}
              >
                {isBenchExpanded ? "Hide Bench" : "Show Bench"}
              </button>

              {isBenchExpanded ? (
                <div className="mt-4 grid gap-5 lg:grid-cols-2">
                  <StartingLineup
                    ownerName={ownerAName}
                    players={ownerABench}
                    won={false}
                    variant="bench"
                  />

                  <StartingLineup
                    ownerName={ownerBName}
                    players={ownerBBench}
                    won={false}
                    variant="bench"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
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
        "lcc2-matchup-team flex min-h-28 items-center justify-between gap-4 p-5 transition",
        won ? "lcc2-matchup-team--winner" : "",
        reverse
          ? "md:flex-row-reverse md:text-right"
          : "",
      ].join(" ")}
    >
      <div className="min-w-0">
        <p
          className={[
            "lcc2-matchup-status lcc2-label",
          ].join(" ")}
        >
          {won ? "Winner" : "Final"}
        </p>

        <p className="mt-2 truncate font-ui text-xl font-black uppercase leading-none sm:text-2xl">
          {name}
        </p>
      </div>

      <p className="shrink-0 font-ui text-3xl font-black uppercase leading-none sm:text-4xl">
        {formatScore(score)}
      </p>
    </div>
  );
}

function StartingLineup({
  ownerName,
  players,
  won,
  variant = "starters",
}: {
  ownerName: string;
  players: readonly HistoricalLineupPlayer[];
  won: boolean;
  variant?: "starters" | "bench";
}) {
  const isBench = variant === "bench";

  return (
    <section
      className={[
        "lcc2-lineup-card",
        won ? "lcc2-lineup-card--winner" : "",
      ].join(" ")}
    >
      <header
        className={[
          "lcc2-lineup-header flex items-center justify-between gap-3 px-4 py-3",
          won ? "lcc2-lineup-header--winner" : "",
        ].join(" ")}
      >
        <div>
          <p
            className={[
              "lcc2-lineup-label lcc2-label",
            ].join(" ")}
          >
            {isBench ? "Bench" : "Starting Lineup"}
          </p>

          <h3 className="mt-1 font-ui text-xl font-black uppercase leading-none">
            {ownerName}
          </h3>
        </div>

        {won ? (
          <Trophy className="h-5 w-5 shrink-0 text-[var(--lcc-semantic-positive)]" />
        ) : null}
      </header>

      {players.length === 0 ? (
        <div className="bg-white p-5">
          <p className="lcc2-body">
            {isBench ? "No bench players found." : "No starters found."}
          </p>
        </div>
      ) : (
        <div
          className={[
            "divide-y divide-slate-200 bg-white",
          ].join(" ")}
        >
          {players.map((player, index) => (
            <LineupPlayerRow
              key={`${player.playerId}-${index}`}
              player={player}
              subdued={isBench}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function LineupPlayerRow({
  player,
  subdued = false,
}: {
  player: HistoricalLineupPlayer;
  subdued?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div
      className={[
        "lcc2-player-row",
        subdued ? "lcc2-player-row--bench opacity-80" : "",
      ].join(" ")}
    >
      <span className="rounded-md bg-slate-100 px-2 py-1 text-center font-ui text-[0.65rem] font-black uppercase text-[var(--lcc-color-text-muted)]">
        {player.position ?? "—"}
      </span>

      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1">
        {player.imageUrl && !imageFailed ? (
          <img
            src={player.imageUrl}
            alt={player.name}
            className={
              player.isDefense
                ? "h-full w-full object-contain"
                : "h-full w-full object-cover object-top"
            }
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span
            aria-label={`${player.name} image unavailable`}
            className="font-ui text-center text-[0.6rem] font-black uppercase leading-tight text-[var(--lcc-color-text-muted)]"
          >
            {player.isDefense ? "DST" : "No image"}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate font-ui text-base font-black uppercase leading-tight text-[var(--lcc-color-text)] sm:text-lg">
          {player.name}
        </p>

        <p className="mt-1 font-ui text-[0.7rem] font-black uppercase tracking-[0.12em] text-[var(--lcc-color-text-muted)]">
          {player.nflTeam ?? "Free Agent"}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-ui text-[0.65rem] font-black uppercase text-[var(--lcc-color-text-muted)]">
          Points
        </p>

        <p className="mt-1 font-ui text-2xl font-black leading-none text-[var(--lcc-color-text)]">
          {formatPlayerPoints(player.points)}
        </p>
      </div>
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
      <span className="lcc2-label">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-3 font-ui text-sm font-black uppercase text-[var(--lcc-color-text)] outline-none transition focus:border-[var(--lcc-interactive)] focus:ring-2 focus:ring-[var(--lcc-interactive)]/20"
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
    <article className="lcc2-metric-card">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-[var(--lcc-interactive)]">
        {icon}
      </div>

      <p className="lcc2-metric-card__label">
        {label}
      </p>

      <p className="lcc2-metric-card__value">
        {value}
      </p>
    </article>
  );
}

function getMatchupKey(
  matchup: HistoricalMatchup
) {
  return [
    matchup.season,
    matchup.week ?? "unknown",
    matchup.ownerAId,
    matchup.ownerBId,
  ].join("-");
}

function ownerName(
  owners: readonly OwnerOption[],
  ownerId: string
) {
  return (
    owners.find((owner) => owner.id === ownerId)
      ?.displayName ?? ownerId
  );
}

function formatScore(score: number | null) {
  return score === null ? "—" : score.toFixed(2);
}

function formatPlayerPoints(
  points: number | null
) {
  return points === null ? "—" : points.toFixed(2);
}

function formatType(type: string) {
  if (type === "regularSeason") return "Regular";
  if (type === "playoff") return "Playoff";
  if (type === "championship") {
    return "Championship";
  }

  return "Game";
}

function getTypeBadgeClass(type: string) {
  if (type === "playoff") return "lcc2-badge--info";
  if (type === "championship") return "lcc2-badge--achievement";
  return "lcc2-badge--neutral";
}
