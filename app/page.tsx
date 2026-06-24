"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Loader2,
  Newspaper,
  Scroll,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { LCC_LEAGUE_HISTORY_IDS } from "@/lib/leagueConstants";

const TYRONE_USER_ID = "466797853767888896";

const PRIMARY_EVENT = {
  title: "Next Owner Meeting",
  detail: "TBD",
  category: "League Business",
} as const;

const CLUB_MILESTONES = [
  { title: "Rookie Draft", detail: "TBD", category: "Dynasty" },
  { title: "Owner Meeting", detail: "TBD", category: "Governance" },
  { title: "Trade Deadline", detail: "TBD", category: "Roster Moves" },
  { title: "Championship Week", detail: "TBD", category: "Finals" },
] as const;

// TODO: Future: replace static spotlight cards with Sleeper activity and rotating historical moments.
const CLUBHOUSE_SPOTLIGHTS = [
  {
    category: "Featured Rivalry",
    title: "Ray vs KW",
    description:
      "Two original members with decades of league history, draft grudges, and clubhouse arguments.",
    cta: "View Rivalry Hub",
    href: "/league-info/rivalries",
  },
  {
    category: "Championship Memory",
    title: "2025: Tyrone's Run",
    description:
      "The reigning champ enters the Dynasty Era spotlight after closing the 2025 season on top.",
    cta: "Visit Trophy Room",
    href: "/league-info/trophy-room",
  },
  {
    category: "League Legacy",
    title: "The Original Clubhouse",
    description:
      "Founded from softball fields, old rivalries, and the legendary night Ray drafted Bill's entire squad.",
    cta: "Read Rules & History",
    href: "/league-info/constitution",
  },
] as const;

interface SleeperRoster {
  owner_id?: string;
  settings?: {
    wins?: number;
    losses?: number;
  };
}

export default function HomePage() {
  const [careerRecord, setCareerRecord] = useState({
    wins: 0,
    losses: 0,
    loading: true,
  });

  useEffect(() => {
    async function calculateCareerStats() {
      let totalWins = 0;
      let totalLosses = 0;

      try {
        for (const leagueId of LCC_LEAGUE_HISTORY_IDS) {
          const res = await fetch(
            `https://api.sleeper.app/v1/league/${leagueId}/rosters`
          );
          const rosters = (await res.json()) as SleeperRoster[];
          const tyroneRoster = rosters.find(
            (roster) => roster.owner_id === TYRONE_USER_ID
          );

          if (tyroneRoster?.settings) {
            totalWins += tyroneRoster.settings.wins || 0;
            totalLosses += tyroneRoster.settings.losses || 0;
          }
        }

        setCareerRecord({
          wins: totalWins,
          losses: totalLosses,
          loading: false,
        });
      } catch {
        setCareerRecord((prev) => ({ ...prev, loading: false }));
      }
    }

    calculateCareerStats();
  }, []);

  return (
    <main className="lcc-page">
      <div className="lcc-container py-5 sm:py-8 lg:py-10">
        <CompactEventBanner />

        <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)] lg:gap-5">
          <div className="grid gap-4">
            <LegacyCard />
            <CommishCornerCard />
          </div>

          <aside className="grid gap-4">
            <ChampionCard careerRecord={careerRecord} />
            <PredictorComingSoonCard />
          </aside>
        </section>

        <div className="my-8 border-t border-[var(--lcc-border)] sm:my-10" />

        <CalendarMilestones />

        <ClubhouseSpotlight />
      </div>
    </main>
  );
}

function CompactEventBanner() {
  return (
    <section className="lcc-card px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-gold-soft)] text-[var(--lcc-text)]">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
              Next League Event
            </p>
            <h2 className="font-serif text-xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
              {PRIMARY_EVENT.title}
            </h2>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] px-4 py-2 sm:min-w-52">
          <span className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
            {PRIMARY_EVENT.category}
          </span>
          <span className="font-ui text-sm font-black uppercase text-[var(--lcc-text)]">
            {PRIMARY_EVENT.detail}
          </span>
        </div>
      </div>
    </section>
  );
}

function LegacyCard() {
  return (
    <article className="lcc-card overflow-hidden">
      <div className="border-b border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="lcc-section-header">
            <div className="lcc-badge">
              <Scroll className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Club Legacy
            </div>
            <h1 className="lcc-page-title">The Back Nine: Our Legacy</h1>
          </div>
          <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-gold-soft)] text-[var(--lcc-text)] sm:flex">
            <Trophy className="h-8 w-8" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-7">
        <div className="space-y-5 font-ui text-base leading-7 text-[var(--lcc-text-muted)] sm:text-lg">
          <p>
            The LCC FFL was forged on the diamonds of local softball fields,
            born from the rivalry and respect between the Outlaws and Jani King.
            Co-created by Ray, Bill, and KW, the league&apos;s legendary start
            began the night Ray drafted Bill&apos;s entire squad.
          </p>

          <blockquote className="border-l-4 border-[var(--lcc-gold)] bg-[var(--lcc-surface-muted)] p-5">
            <p className="font-serif text-2xl font-black italic leading-tight text-[var(--lcc-text)]">
              &quot;The Culpepper &amp; Moss Connection&quot;
            </p>
            <p className="mt-3 text-sm font-semibold leading-6 text-[var(--lcc-text-muted)] sm:text-base">
              That fateful draft night led to a dominant back-to-back
              championship run that set the standard for the decades to follow.
            </p>
          </blockquote>

          <p>
            After Year 1, Ray, Bill, and KW expanded the clubhouse, building a
            community around friends from{" "}
            <strong className="font-black text-[var(--lcc-text)]">
              Paramount Kings Dominion
            </strong>{" "}
            and a tight-knit circle of outsiders. While faces have changed over
            22 years, the core of this league has remained unshakable.
          </p>

          <p>
            In 2021, we made our most significant strategic shift, transitioning
            from a traditional{" "}
            <strong className="font-black text-[var(--lcc-text)]">
              2-Keeper format
            </strong>{" "}
            into a{" "}
            <strong className="font-black text-[var(--lcc-text)]">
              Full Dynasty era
            </strong>
            . It has been a massive hit, raising the stakes and the competition
            to an all-time high.
          </p>
        </div>

        <div className="border-t border-[var(--lcc-border)] pt-6">
          <p className="font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
            In Memoriam
          </p>
          <p className="mt-3 font-serif text-lg font-black italic leading-7 text-[var(--lcc-text-muted)]">
            We have lost two of our original members to cancer over these 22
            years. Though they are no longer in the draft room, they will
            forever be part of the Long Country Club FFL.
          </p>
        </div>
      </div>
    </article>
  );
}

function CalendarMilestones() {
  return (
    <section>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="lcc-badge">
            <CalendarDays className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Club Calendar
          </div>
          <h2 className="mt-3 font-serif text-3xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
            Upcoming Milestones
          </h2>
        </div>
        <p className="max-w-xl font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)]">
          Official dates will appear here once the league locks them in.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CLUB_MILESTONES.map((event) => (
          <article key={event.title} className="lcc-card p-5">
            <p className="font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
              {event.category}
            </p>
            <h3 className="mt-2 font-serif text-2xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
              {event.title}
            </h3>
            <p className="mt-5 inline-flex rounded-full border border-[var(--lcc-border-strong)] bg-[var(--lcc-surface-muted)] px-3 py-1 font-ui text-xs font-black uppercase text-[var(--lcc-text)]">
              {event.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ClubhouseSpotlight() {
  return (
    <section className="mt-8 sm:mt-10">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="lcc-badge">
            <Trophy className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Clubhouse Spotlight
          </div>
          <h2 className="mt-3 font-serif text-3xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
            Clubhouse Spotlight
          </h2>
        </div>
        <p className="max-w-xl font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)]">
          Rotating stories, rivalries, and moments from Long Country Club
          history.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CLUBHOUSE_SPOTLIGHTS.map((spotlight) => (
          <Link
            key={spotlight.title}
            href={spotlight.href}
            className="lcc-card group flex min-h-60 flex-col justify-between p-5 transition-all hover:-translate-y-1 hover:border-[var(--lcc-border-strong)] hover:shadow-[var(--lcc-shadow)] sm:p-6"
          >
            <div>
              <p className="font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
                {spotlight.category}
              </p>
              <h3 className="mt-3 font-serif text-2xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
                {spotlight.title}
              </h3>
              <p className="mt-4 font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)]">
                {spotlight.description}
              </p>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 font-ui text-xs font-black uppercase text-[var(--lcc-text)]">
              {spotlight.cta}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CommishCornerCard() {
  return (
    <section className="lcc-card p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-gold-soft)] text-[var(--lcc-text)]">
          <Newspaper className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
            Commissioner&apos;s Corner
          </p>
          <h2 className="mt-1 font-serif text-2xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
            2025: A New Era
          </h2>
        </div>
      </div>

      <p className="mt-5 font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)]">
        The dust has settled on the 2025 campaign... Tyrone Poist&apos;s
        dominance wasn&apos;t just about the roster.
      </p>

      <Link href="/commish" className="lcc-button lcc-button-secondary mt-6 w-full">
        Read Commish Corner
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

function PredictorComingSoonCard() {
  return (
    <section className="lcc-card p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Target
            className="h-5 w-5 text-[var(--lcc-gold)]"
            aria-hidden="true"
          />
          <h2 className="font-serif text-xl font-black uppercase italic text-[var(--lcc-text)]">
            AI Predictor
          </h2>
        </div>
        <Zap
          className="h-5 w-5 text-[var(--lcc-gold)]"
          aria-hidden="true"
        />
      </div>

      <div className="rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-4">
        <p className="font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
          2026 Projection Model
        </p>
        <p className="mt-2 font-serif text-xl font-black uppercase italic leading-tight text-[var(--lcc-text)]">
          Coming Soon
        </p>
        <p className="mt-3 font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)]">
          The next projection model will return once the league has real inputs
          ready for the season.
        </p>
      </div>

      <button
        type="button"
        className="lcc-button lcc-button-secondary mt-5 w-full cursor-not-allowed opacity-70"
        disabled
      >
        Projection Model Coming Soon
      </button>
    </section>
  );
}

function ChampionCard({
  careerRecord,
}: {
  careerRecord: {
    wins: number;
    losses: number;
    loading: boolean;
  };
}) {
  return (
    <section className="relative overflow-hidden rounded-[var(--lcc-radius)] border border-[#d1ae66]/30 bg-[#0f2a19] p-5 text-[#f8f4ea] shadow-[var(--lcc-shadow)] sm:p-6">
      <div className="absolute right-4 top-4 rounded-full border border-[#d1ae66] bg-[#d1ae66] px-3 py-1 font-ui text-xs font-black uppercase text-[#0f2a19]">
        Champion
      </div>

      <p className="font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
        Reigning Champion
      </p>

      <div className="mt-6 flex flex-col items-center text-center">
        <div className="h-36 w-36 overflow-hidden rounded-full border-4 border-[var(--lcc-border-strong)] bg-[var(--lcc-surface-muted)] shadow-[var(--lcc-shadow-soft)]">
          <img
            src="/managers/Tyrone.png"
            className="h-full w-full object-cover"
            style={{ objectPosition: "center 32%" }}
            alt="Tyrone Poist"
          />
        </div>

        <h2 className="mt-5 font-serif text-4xl font-black uppercase italic leading-none text-[#f8f4ea]">
          Tyrone Poist
        </h2>

        <div className="mt-3 min-h-5">
          {careerRecord.loading ? (
            <Loader2
              className="mx-auto h-4 w-4 animate-spin text-[var(--lcc-gold)]"
              aria-label="Loading career record"
            />
          ) : (
            <p className="font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
              Career Record: {careerRecord.wins}-{careerRecord.losses}
            </p>
          )}
        </div>

        <Link
          href="/league-info/trophy-room"
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-3 font-ui text-xs font-black uppercase text-white transition-colors hover:bg-white/20"
        >
          <Trophy className="h-4 w-4" aria-hidden="true" />
          View Gallery History
        </Link>
      </div>
    </section>
  );
}
