const ESPN_NFL_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

export type NflGameState = "UPCOMING" | "LIVE" | "FINAL";
export type NflPrimeTime = "TNF" | "SNF" | "MNF" | null;

export interface NflGame {
  readonly id: string;
  readonly week: number | null;
  readonly season: number | null;
  readonly kickoff: string;
  readonly state: NflGameState;
  readonly statusLabel: string;
  readonly detail: string;
  readonly period: number | null;
  readonly clock: string | null;
  readonly broadcast: string | null;
  readonly primeTime: NflPrimeTime;
  readonly home: NflTeam;
  readonly away: NflTeam;
}

export interface NflTeam {
  readonly abbreviation: string;
  readonly name: string;
  readonly logo: string | null;
  readonly score: number | null;
}

export interface NflScoreboardView {
  readonly sourceStatus: "ok" | "stale" | "unavailable";
  readonly reasonCode: NflScoreboardReasonCode | null;
  readonly fetchedAt: string;
  readonly ageSeconds?: number;
  readonly providerStatus?: number | null;
  readonly selected: NflGame | null;
  readonly games: readonly NflGame[];
  readonly favoriteTeam: string | null;
}

export type NflScoreboardReasonCode =
  | "PROVIDER_FETCH_FAILED"
  | "HTTP_ERROR"
  | "INVALID_PROVIDER_RESPONSE"
  | "NO_EVENTS"
  | "NO_VALID_GAMES"
  | "NO_SELECTION"
  | "PRESENTATION_MAPPING_FAILED"
  | "PROVIDER_TIMEOUT";

const REQUEST_TIMEOUT_MS = 8_000;
const RETRY_DELAY_MS = 250;
const CACHE_MAX_AGE_MS = 5 * 60_000;
const LIVE_CACHE_MAX_AGE_MS = 60_000;
const successfulScoreboards = new Map<string, { view: NflScoreboardView; storedAt: number }>();

export function isRetryableProviderStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

export function isRenderableNflScoreboard(value: unknown): value is NflScoreboardView {
  if (!value || typeof value !== "object") return false;
  const scoreboard = value as Partial<NflScoreboardView>;
  const selected = scoreboard.selected;
  if (!selected || typeof selected !== "object") return false;
  return (scoreboard.sourceStatus === "ok" || scoreboard.sourceStatus === "stale")
    && typeof selected.id === "string"
    && typeof selected.state === "string"
    && typeof selected.week === "number"
    && Array.isArray(scoreboard.games);
}

export function retainLastGoodNflScoreboard(lastGood: NflScoreboardView, next: unknown): NflScoreboardView {
  return isRenderableNflScoreboard(next) ? next : lastGood;
}

interface RawScoreboard {
  readonly week?: { readonly number?: number };
  readonly leagues?: readonly { readonly season?: { readonly year?: number } }[];
  readonly events?: readonly RawEvent[];
}

interface RawEvent {
  readonly id?: string;
  readonly date?: string;
  readonly name?: string;
  readonly week?: { readonly number?: number };
  readonly season?: { readonly year?: number };
  readonly status?: { readonly clock?: number; readonly displayClock?: string; readonly period?: number; readonly type?: { readonly state?: string; readonly completed?: boolean; readonly description?: string; readonly detail?: string } };
  readonly competitions?: readonly { readonly competitors?: readonly RawCompetitor[]; readonly broadcasts?: readonly { readonly names?: readonly string[] }[] }[];
}

interface RawCompetitor {
  readonly homeAway?: string;
  readonly score?: string;
  readonly team?: { readonly abbreviation?: string; readonly displayName?: string; readonly logo?: string };
}

export function normalizeNflEvents(payload: RawScoreboard): readonly NflGame[] {
  return (payload.events ?? []).flatMap((event) => {
    const competition = event.competitions?.[0];
    const competitors = competition?.competitors ?? [];
    const away = competitors.find((team) => team.homeAway === "away");
    const home = competitors.find((team) => team.homeAway === "home");
    if (!event.id || !event.date || !away?.team?.abbreviation || !home?.team?.abbreviation) return [];
    const status = event.status?.type;
    const state: NflGameState = status?.completed || status?.state === "post" ? "FINAL" : status?.state === "in" ? "LIVE" : "UPCOMING";
    const broadcast = competition?.broadcasts?.flatMap((item) => item.names ?? [])[0] ?? null;
    return [{
      id: event.id,
      week: event.week?.number ?? payload.week?.number ?? null,
      season: event.season?.year ?? payload.leagues?.[0]?.season?.year ?? null,
      kickoff: event.date,
      state,
      statusLabel: status?.description ?? (state === "LIVE" ? "In Progress" : state === "FINAL" ? "Final" : "Scheduled"),
      detail: status?.detail ?? status?.description ?? "Scheduled",
      period: typeof event.status?.period === "number" ? event.status.period : null,
      clock: event.status?.displayClock ?? null,
      broadcast,
      primeTime: classifyPrimeTime(event.date, broadcast),
      away: normalizeTeam(away),
      home: normalizeTeam(home),
    }];
  });
}

export function getNflGamesForWeek(scoreboard: NflScoreboardView, week: number): readonly NflGame[] {
  return scoreboard.games.filter((game) => game.week === week);
}

function normalizeTeam(team: RawCompetitor): NflTeam {
  return {
    abbreviation: team.team?.abbreviation ?? "—",
    name: team.team?.displayName ?? "Team unavailable",
    logo: team.team?.logo ?? null,
    score: team.score !== undefined && Number.isFinite(Number(team.score)) ? Number(team.score) : null,
  };
}

export function classifyPrimeTime(kickoff: string, broadcast: string | null): NflPrimeTime {
  const date = new Date(kickoff);
  if (!Number.isFinite(date.getTime())) return null;
  const eastern = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", hour12: false }).formatToParts(date);
  const weekday = eastern.find((part) => part.type === "weekday")?.value;
  const hour = Number(eastern.find((part) => part.type === "hour")?.value ?? "0");
  const network = (broadcast ?? "").toLowerCase();
  if (weekday === "Thu") return "TNF";
  if (weekday === "Sun" && (hour >= 19 || network.includes("nbc"))) return "SNF";
  if (weekday === "Mon" && (hour >= 19 || network.includes("espn") || network.includes("abc"))) return "MNF";
  return null;
}

export function selectNflGame(games: readonly NflGame[], now = new Date(), favoriteTeam: string | null = null): NflGame | null {
  const live = games.filter((game) => game.state === "LIVE").sort(compareGames);
  const primetimeLive = live.filter((game) => game.primeTime !== null);
  if (primetimeLive[0]) return primetimeLive[0];
  const favoriteLive = favoriteTeam ? live.find((game) => game.home.abbreviation === favoriteTeam || game.away.abbreviation === favoriteTeam) : null;
  if (favoriteLive) return favoriteLive;
  if (live[0]) return live[0];

  const upcoming = games.filter((game) => game.state === "UPCOMING" && new Date(game.kickoff).getTime() >= now.getTime()).sort(compareGames);
  const primetimeUpcoming = upcoming.find((game) => game.primeTime !== null);
  return primetimeUpcoming ?? upcoming[0] ?? null;
}

function compareGames(a: NflGame, b: NflGame): number {
  return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime() || a.id.localeCompare(b.id);
}

export function formatNflKickoff(kickoff: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(kickoff));
}

export function formatNflContext(game: NflGame): string {
  return game.primeTime ? `${game.primeTime} · Week ${game.week ?? "—"}` : `Week ${game.week ?? "—"}`;
}

export async function loadNflScoreboard(favoriteTeam: string | null = null, requestedWeek: number | null = null): Promise<NflScoreboardView> {
  const fetchedAt = new Date().toISOString();
  const cacheKey = requestedWeek === null ? "home" : `week:${requestedWeek}`;
  const urls = requestedWeek === null
    ? [buildScoreboardUrl(`limit=100&dates=${getNflDateKey()}`), buildScoreboardUrl(`limit=1000&dates=${getNflSeasonYear()}`)]
    : [buildScoreboardUrl(`limit=100&dates=${getNflSeasonYear()}&week=${requestedWeek}`)];
  let lastFailure: ProviderFailure | null = null;

  for (const url of urls) {
    try {
      const result = await fetchProviderPayload(url);
      const view = normalizeScoreboardPayload(result.payload, fetchedAt, favoriteTeam, result.status);
      if (view.sourceStatus === "ok") {
        successfulScoreboards.set(cacheKey, { view, storedAt: Date.now() });
        return view;
      }
      lastFailure = { reasonCode: view.reasonCode ?? "NO_SELECTION", providerStatus: result.status };
    } catch (error) {
      lastFailure = toProviderFailure(error);
    }
  }

  const cached = successfulScoreboards.get(cacheKey);
  if (cached) {
    const ageMs = Date.now() - cached.storedAt;
    const live = cached.view.selected?.state === "LIVE";
    const maxAge = live ? LIVE_CACHE_MAX_AGE_MS : CACHE_MAX_AGE_MS;
    if (ageMs <= maxAge) {
      return { ...cached.view, sourceStatus: "stale", reasonCode: lastFailure?.reasonCode ?? null, ageSeconds: Math.floor(ageMs / 1000), providerStatus: lastFailure?.providerStatus ?? null };
    }
  }

  return { sourceStatus: "unavailable", reasonCode: lastFailure?.reasonCode ?? "PROVIDER_FETCH_FAILED", fetchedAt, selected: null, games: [], favoriteTeam, providerStatus: lastFailure?.providerStatus ?? null };
}

function getNflSeasonYear(date = new Date()): number {
  return date.getUTCMonth() <= 1 ? date.getUTCFullYear() - 1 : date.getUTCFullYear();
}

type ProviderFailure = { reasonCode: NflScoreboardReasonCode; providerStatus: number | null };

function buildScoreboardUrl(query: string): string {
  return `${ESPN_NFL_SCOREBOARD}?${query}`;
}

function getNflDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

async function fetchProviderPayload(url: string): Promise<{ payload: RawScoreboard; status: number }> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json", "User-Agent": "LCC-NFL-Scoreboard/1.0" },
        signal: controller.signal,
      });
      if (response.ok) return { payload: await response.json() as RawScoreboard, status: response.status };
      if (!isRetryableProviderStatus(response.status) || attempt === 1) throw providerError("HTTP_ERROR", response.status);
    } catch (error) {
      if (error instanceof ProviderError && error.retryable && attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        continue;
      }
      if (error instanceof ProviderError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          continue;
        }
        throw providerError("PROVIDER_TIMEOUT", null);
      }
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        continue;
      }
      throw providerError("PROVIDER_FETCH_FAILED", null);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw providerError("PROVIDER_FETCH_FAILED", null);
}

function normalizeScoreboardPayload(payload: RawScoreboard, fetchedAt: string, favoriteTeam: string | null, providerStatus: number): NflScoreboardView {
  if (!payload || !Array.isArray(payload.events)) return { sourceStatus: "unavailable", reasonCode: "INVALID_PROVIDER_RESPONSE", fetchedAt, selected: null, games: [], favoriteTeam, providerStatus };
  const games = normalizeNflEvents(payload);
  if (!payload.events.length) return { sourceStatus: "unavailable", reasonCode: "NO_EVENTS", fetchedAt, selected: null, games: [], favoriteTeam, providerStatus };
  if (!games.length) return { sourceStatus: "unavailable", reasonCode: "NO_VALID_GAMES", fetchedAt, selected: null, games: [], favoriteTeam, providerStatus };
  const selected = selectNflGame(games, new Date(), favoriteTeam);
  return { sourceStatus: selected ? "ok" : "unavailable", reasonCode: selected ? null : "NO_SELECTION", fetchedAt, selected, games, favoriteTeam, providerStatus };
}

class ProviderError extends Error {
  constructor(readonly reasonCode: NflScoreboardReasonCode, readonly providerStatus: number | null, readonly retryable: boolean) {
    super(reasonCode);
  }
}

function providerError(reasonCode: NflScoreboardReasonCode, providerStatus: number | null): ProviderError {
  return new ProviderError(reasonCode, providerStatus, providerStatus !== null && isRetryableProviderStatus(providerStatus));
}

function toProviderFailure(error: unknown): ProviderFailure {
  if (error instanceof ProviderError) return { reasonCode: error.reasonCode, providerStatus: error.providerStatus };
  return { reasonCode: "PROVIDER_FETCH_FAILED", providerStatus: null };
}
