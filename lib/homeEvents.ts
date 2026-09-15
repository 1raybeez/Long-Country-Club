import { HOME_SEASON_CONFIG, type HomeSeasonConfig } from "./homeSeasonConfig.ts";

export type HomeEventCategory =
  | "nfl-kickoff"
  | "league-fee"
  | "waiver"
  | "trade-deadline"
  | "rookie-draft"
  | "playoffs"
  | "other";

export interface HomeEvent {
  readonly id: string;
  readonly title: string;
  readonly detail?: string;
  readonly timestamp: string | null;
  readonly timezone?: "America/New_York";
  readonly category: HomeEventCategory;
  readonly priority: number;
  readonly actionable: boolean;
  readonly cta?: { readonly label: string; readonly href: string };
  readonly expires: "at-start" | "at-end-of-day" | "never";
}

export interface HomeEventSelection {
  readonly event: HomeEvent | null;
  readonly reason: "selected" | "no-future-event" | "no-timestamped-event";
}

export function selectNextHomeEvent(
  events: readonly HomeEvent[],
  now: Date = new Date()
): HomeEventSelection {
  const nowMs = now.getTime();
  const future = events
    .filter((event) => event.timestamp !== null)
    .filter((event) => {
      const timestampMs = Date.parse(event.timestamp!);
      return Number.isFinite(timestampMs) && timestampMs > nowMs;
    })
    .sort((a, b) => {
      const timeDelta = Date.parse(a.timestamp!) - Date.parse(b.timestamp!);
      return timeDelta || Number(b.actionable) - Number(a.actionable) || b.priority - a.priority;
    });

  if (future.length > 0) return { event: future[0], reason: "selected" };
  return {
    event: null,
    reason: events.some((event) => event.timestamp !== null)
      ? "no-future-event"
      : "no-timestamped-event",
  };
}

export function getHomeEvents(
  season: number,
  config: HomeSeasonConfig | undefined = HOME_SEASON_CONFIG[season]
): readonly HomeEvent[] {
  if (!config) return [];

  return [
    {
      id: `${season}-nfl-kickoff`,
      title: "NFL kickoff",
      detail: `${config.kickoffAwayTeam.name} at ${config.kickoffHomeTeam.name}`,
      timestamp: `${config.kickoffDate}T${toIsoTime(config.kickoffTime)}`,
      timezone: "America/New_York",
      category: "nfl-kickoff",
      priority: 100,
      actionable: false,
      cta: { label: "Open Matchups", href: "/matchups" },
      expires: "at-start",
    },
  ];
}

function toIsoTime(displayTime: string): string {
  const match = displayTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)\s*ET$/i);
  if (!match) throw new Error(`Unsupported Home event time: ${displayTime}`);
  let hour = Number(match[1]);
  if (match[3].toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (match[3].toUpperCase() === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${match[2]}:00-04:00`;
}
