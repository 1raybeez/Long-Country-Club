export type LccRouteStatus = "active" | "hidden" | "stale";

export type LccRoute = {
  id: string;
  label: string;
  href: string;
  status: LccRouteStatus;
  navLabel?: string;
  icon?: string;
  showInPrimaryNav?: boolean;
  showInLeagueInfoHub?: boolean;
  staleReason?: string;
};

export type LccLeagueInfoAvailability = "active" | "future" | "inactive";

export type LccLeagueInfoNavItem = {
  id: string;
  label: string;
  href: string | null;
  order: number;
  availability: LccLeagueInfoAvailability;
  parent?: "history";
};

export const LCC_ROUTES: Record<string, LccRoute> = {
  home: {
    id: "home",
    label: "Home",
    href: "/",
    status: "active",
    showInPrimaryNav: true,
  },
  leagueInfo: {
    id: "league-info",
    label: "League Info",
    href: "/league-info",
    status: "active",
    showInPrimaryNav: true,
  },
  managers: {
    id: "managers",
    label: "Managers",
    href: "/managers",
    status: "active",
    showInPrimaryNav: true,
  },
  matchups: {
    id: "matchups",
    label: "Matchups",
    href: "/matchups",
    status: "active",
    showInPrimaryNav: true,
  },
  history: {
    id: "history",
    label: "History",
    href: "/history",
    status: "stale",
    staleReason: "Legacy duplicate hub; keep hidden until rebuilt.",
  },
  commish: {
    id: "commish",
    label: "Commish",
    href: "/commish",
    status: "stale",
    staleReason: "Placeholder commissioner article; keep hidden until rebuilt.",
  },
  predictor: {
    id: "predictor",
    label: "Predictor",
    href: "/predictor",
    status: "stale",
    staleReason:
      "Simple playoff odds view; keep hidden until dynasty-specific logic exists.",
  },
  constitution: {
    id: "constitution",
    label: "The Rules of Play",
    href: "/league-info/constitution",
    status: "active",
    icon: "⚖️",
    showInLeagueInfoHub: true,
  },
  trophyRoom: {
    id: "trophy-room",
    label: "Champions Gallery",
    href: "/league-info/trophy-room",
    status: "active",
    icon: "🏆",
    showInLeagueInfoHub: true,
  },
  rivalries: {
    id: "rivalries",
    label: "Rivalry Hub",
    href: "/league-info/rivalries",
    status: "active",
    icon: "⚔️",
    showInLeagueInfoHub: true,
  },
  archives: {
    id: "archives",
    label: "League Archives",
    href: "/league-info/archives",
    status: "active",
    icon: "📊",
    showInLeagueInfoHub: true,
  },
  drafts: {
    id: "drafts",
    label: "Draft Room",
    href: "/league-info/drafts",
    status: "active",
    icon: "🏈",
    showInLeagueInfoHub: true,
  },
  fees: {
    id: "fees",
    label: "Caddy Fees",
    href: "/league-info/fees",
    status: "active",
    icon: "💰",
    showInLeagueInfoHub: true,
  },
  resources: {
    id: "resources",
    label: "Resources",
    href: "/league-info/resources",
    status: "hidden",
    icon: "📁",
  },
};

const LCC_PRIMARY_NAV_ROUTE_IDS = [
  "home",
  "matchups",
  "managers",
  "leagueInfo",
] as const;

export const LCC_PRIMARY_NAV_ROUTES = LCC_PRIMARY_NAV_ROUTE_IDS.map(
  (routeId) => LCC_ROUTES[routeId]
).filter((route) => route.showInPrimaryNav && route.status === "active");

export const LCC_LEAGUE_INFO_CARD_ROUTES = Object.values(LCC_ROUTES).filter(
  (route) => route.showInLeagueInfoHub && route.status === "active"
);

export const LCC_LEAGUE_INFO_NAV_ITEMS: readonly LccLeagueInfoNavItem[] = [
  { id: "overview", label: "Overview", href: "/league-info", order: 1, availability: "active" },
  { id: "constitution", label: "Constitution", href: "/league-info/constitution", order: 2, availability: "active" },
  { id: "history", label: "History", href: "/history", order: 3, availability: "active" },
  { id: "records", label: "Records", href: "/league-info/records", order: 4, availability: "active" },
  { id: "rivalries", label: "Rivalries", href: "/league-info/rivalries", order: 5, availability: "active" },
  { id: "drafts", label: "Drafts", href: "/league-info/drafts", order: 6, availability: "active" },
  { id: "payouts", label: "Payouts", href: "/league-info/fees", order: 7, availability: "active" },
  { id: "resources", label: "Resources", href: "/league-info/resources", order: 8, availability: "active" },
] as const;

export const LCC_HISTORY_CHILD_ROUTES: readonly LccLeagueInfoNavItem[] = [
  { id: "trophy-room", label: "Trophy Room", href: "/league-info/trophy-room", order: 1, availability: "active", parent: "history" },
  { id: "archives", label: "Archives", href: "/league-info/archives", order: 2, availability: "active", parent: "history" },
] as const;

export const LCC_HISTORY_NAV_ITEMS: readonly LccLeagueInfoNavItem[] = [
  { id: "history-overview", label: "Overview", href: "/history", order: 1, availability: "active" },
  { id: "history-champions", label: "Champions", href: "/league-info/trophy-room", order: 2, availability: "active", parent: "history" },
  { id: "history-seasons", label: "Seasons", href: "/history#season-explorer", order: 3, availability: "active" },
  { id: "history-archives", label: "Archives", href: "/league-info/archives", order: 4, availability: "active", parent: "history" },
] as const;

export const LCC_VISIBLE_LEAGUE_INFO_NAV_ITEMS = LCC_LEAGUE_INFO_NAV_ITEMS.filter(
  (item) => item.availability === "active" && item.href !== null
);

export function getLccLeagueInfoActiveTab(pathname: string): string {
  if (pathname === "/league-info") return "overview";

  const historyChildPath = LCC_HISTORY_CHILD_ROUTES.some(
    (item) => item.href !== null && (pathname === item.href || pathname.startsWith(`${item.href}/`))
  );
  if (pathname === "/history" || pathname.startsWith("/history/") || historyChildPath) {
    return "history";
  }

  return LCC_VISIBLE_LEAGUE_INFO_NAV_ITEMS.find(
    (item) => item.id !== "overview" && item.href !== null && (pathname === item.href || pathname.startsWith(`${item.href}/`))
  )?.id ?? "overview";
}

export const LCC_STALE_ROUTES = Object.values(LCC_ROUTES).filter(
  (route) => route.status === "stale"
);

export const LCC_HIDDEN_ROUTES = Object.values(LCC_ROUTES).filter(
  (route) => route.status === "hidden"
);
