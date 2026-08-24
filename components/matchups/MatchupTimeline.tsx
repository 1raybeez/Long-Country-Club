import type { MatchupTimelineEntry } from "@/lib/history/matchupTimeline";

export function MatchupTimeline({
  ownerAName,
  ownerBName,
  meetings,
}: {
  ownerAName: string;
  ownerBName: string;
  meetings: readonly MatchupTimelineEntry[];
}) {
  return (
    <section className="lcc2-card">
      <div className="lcc2-section-heading">
        <div>
          <p className="lcc2-section-heading__eyebrow">Series history</p>
          <h2 className="lcc2-section-heading__title">Matchup Timeline</h2>
        </div>
        <p className="lcc2-label">
          {meetings.length} {meetings.length === 1 ? "meeting" : "meetings"}
        </p>
      </div>

      <div className="relative mt-6">
        <div className="absolute bottom-3 left-[0.45rem] top-3 w-px bg-slate-200" />

        <div className="grid gap-4">
          {meetings.map((meeting, index) => (
            <TimelineMeeting
              key={`${meeting.season}-${meeting.week ?? "unknown"}-${index}`}
              meeting={meeting}
              ownerAName={ownerAName}
              ownerBName={ownerBName}
              isFirst={index === 0}
              isLatest={index === meetings.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function TimelineMeeting({
  meeting,
  ownerAName,
  ownerBName,
  isFirst,
  isLatest,
}: {
  meeting: MatchupTimelineEntry;
  ownerAName: string;
  ownerBName: string;
  isFirst: boolean;
  isLatest: boolean;
}) {
  const winnerName =
    meeting.result === "ownerA"
      ? ownerAName
      : meeting.result === "ownerB"
        ? ownerBName
        : null;

  return (
    <article className="relative pl-7">
      <span className="absolute left-0 top-5 z-10 h-[0.9rem] w-[0.9rem] rounded-full border-4 border-[var(--lcc-color-surface-raised)] bg-[var(--lcc-interactive)]" />

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="lcc2-label">
              {meeting.season} · Week {meeting.week ?? "—"}
            </span>
            <span className={`lcc2-badge ${getTypeBadgeClass(meeting.type)}`}>
              {formatType(meeting.type)}
            </span>
            {isFirst ? (
              <span className="lcc2-badge lcc2-badge--info">
                First Meeting
              </span>
            ) : null}
            {isLatest ? (
              <span className="lcc2-badge lcc2-badge--active">
                Most Recent
              </span>
            ) : null}
          </div>

          <p className="lcc2-label">
            {meeting.margin === null
              ? "Margin —"
              : `Margin ${meeting.margin.toFixed(2)}`}
          </p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <TimelineSide
            name={ownerAName}
            score={meeting.ownerAScore}
            won={meeting.result === "ownerA"}
          />
          <span className="hidden font-ui text-sm font-black uppercase text-[var(--lcc-color-text-muted)] sm:block">
            vs
          </span>
          <TimelineSide
            name={ownerBName}
            score={meeting.ownerBScore}
            won={meeting.result === "ownerB"}
            reverse
          />
        </div>

        <p className={`mt-3 lcc2-label ${winnerName ? "text-[var(--lcc-semantic-positive)]" : ""}`}>
          {winnerName ? `${winnerName} won` : "Tie game"}
        </p>
      </div>
    </article>
  );
}

function TimelineSide({
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
    <div className={reverse ? "text-left sm:text-right" : "text-left"}>
      <p className="truncate font-ui text-lg font-black uppercase text-[var(--lcc-color-text)]">
        {name}
      </p>
      <p className={[
        "mt-1 font-ui text-2xl font-black leading-none",
        won ? "text-[var(--lcc-semantic-positive)]" : "text-[var(--lcc-color-text)]",
      ].join(" ")}>
        {formatScore(score)}
      </p>
    </div>
  );
}

function formatScore(score: number | null) {
  return score === null ? "—" : score.toFixed(2);
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
