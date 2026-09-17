export type LccRouteStatus = "active" | "hidden" | "stale";

export type LccRoute = {
  id: string;
  label: string;
  href: string;
  status: LccRouteStatus;
  access?: "public" | "protected";
  deferred?: boolean;
  navLabel?: string;
  icon?: string;
  showInPrimaryNav?: boolean;
  showInLeagueInfoHub?: boolean;
  showInOverview?: boolean;
  overviewOrder?: number;
  overviewDescription?: string;
  resourceGroup?: "league" | "tools";
  resourceOrder?: number;
  resourceLabel?: string;
  resourceDescription?: string;
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
    navLabel: "Overview",
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
    navLabel: "Constitution",
    icon: "⚖️",
    showInLeagueInfoHub: true,
    showInOverview: true,
    overviewOrder: 1,
    overviewDescription: "Rules, scoring, roster standards, fees, and governance.",
    resourceGroup: "league",
    resourceOrder: 1,
    resourceDescription: "Rules, scoring, roster standards, fees, and governance.",
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
    navLabel: "Rivalries",
    icon: "⚔️",
    showInLeagueInfoHub: true,
    showInOverview: true,
    overviewOrder: 3,
    overviewDescription: "Head-to-head history and rivalry detail.",
    resourceGroup: "tools",
    resourceOrder: 5,
    resourceDescription: "Head-to-head history and rivalry detail.",
  },
  archives: {
    id: "archives",
    label: "League Archives",
    href: "/league-info/archives",
    status: "active",
    icon: "📊",
    showInLeagueInfoHub: true,
  },
  records: {
    id: "records",
    label: "Records",
    href: "/league-info/records",
    status: "active",
    showInLeagueInfoHub: true,
    showInOverview: true,
    overviewOrder: 2,
    overviewDescription: "League-wide records and complete Sleeper-era statistics.",
    resourceGroup: "league",
    resourceOrder: 3,
    resourceDescription: "League-wide records and complete Sleeper-era statistics.",
  },
  drafts: {
    id: "drafts",
    label: "Draft Room",
    href: "/league-info/drafts",
    status: "active",
    navLabel: "Drafts",
    icon: "🏈",
    showInLeagueInfoHub: true,
    showInOverview: true,
    overviewOrder: 4,
    overviewDescription: "Draft history, future picks, and draft records.",
    resourceGroup: "league",
    resourceOrder: 4,
    resourceLabel: "Draft History",
    resourceDescription: "Draft events, picks, future capital, and draft records.",
  },
  fees: {
    id: "fees",
    label: "Fees & Payouts",
    href: "/league-info/fees",
    status: "active",
    navLabel: "Fees & Payouts",
    icon: "💰",
    showInLeagueInfoHub: true,
    showInOverview: true,
    overviewOrder: 5,
    overviewDescription: "Current dues, weekly highs, and payout rules.",
    resourceGroup: "league",
    resourceOrder: 2,
    resourceDescription: "Current dues, weekly highs, payout rules, and recorded financial history.",
  },
  resources: {
    id: "resources",
    label: "Resources",
    href: "/league-info/resources",
    status: "active",
    icon: "📁",
    showInLeagueInfoHub: true,
    showInOverview: true,
    overviewOrder: 6,
    overviewDescription: "League links, LCC tools, and fantasy research.",
  },
  tradeAnalyzer: {
    id: "trade-analyzer",
    label: "Trade Analyzer",
    href: "/league-info/trade-analyzer",
    status: "active",
    access: "protected",
    deferred: true,
    showInLeagueInfoHub: true,
    showInOverview: true,
    overviewOrder: 7,
    overviewDescription: "Analyze a league trade with authenticated roster context.",
    resourceGroup: "tools",
    resourceOrder: 7,
    resourceDescription: "Authenticated league-trade analysis with current roster context.",
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

export const LCC_LEAGUE_INFO_OVERVIEW_ROUTES = LCC_LEAGUE_INFO_CARD_ROUTES.filter(
  (route) => route.showInOverview
).sort((a, b) => (a.overviewOrder ?? 999) - (b.overviewOrder ?? 999));

export const LCC_LEAGUE_INFO_RESOURCE_ROUTES = [...LCC_LEAGUE_INFO_CARD_ROUTES.filter(
  (route) => route.resourceGroup
)].sort((a, b) => (a.resourceOrder ?? 999) - (b.resourceOrder ?? 999));

const LCC_LEAGUE_INFO_NAV_ROUTE_IDS = [
  { id: "overview", routeId: "leagueInfo", order: 1 },
  { id: "constitution", routeId: "constitution", order: 2 },
  { id: "history", routeId: "history", order: 3 },
  { id: "records", routeId: "records", order: 4 },
  { id: "rivalries", routeId: "rivalries", order: 5 },
  { id: "drafts", routeId: "drafts", order: 6 },
  { id: "payouts", routeId: "fees", order: 7 },
  { id: "resources", routeId: "resources", order: 8 },
  { id: "trade-analyzer", routeId: "tradeAnalyzer", order: 9 },
] as const;

export const LCC_LEAGUE_INFO_NAV_ITEMS: readonly LccLeagueInfoNavItem[] = LCC_LEAGUE_INFO_NAV_ROUTE_IDS.map(({ id, routeId, order }) => {
  const route = LCC_ROUTES[routeId];
  return { id, label: route.navLabel ?? route.label, href: route.href, order, availability: "active" };
});

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
