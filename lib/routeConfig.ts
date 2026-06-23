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
    navLabel: "Info",
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

export const LCC_PRIMARY_NAV_ROUTES = Object.values(LCC_ROUTES).filter(
  (route) => route.showInPrimaryNav && route.status === "active"
);

export const LCC_LEAGUE_INFO_CARD_ROUTES = Object.values(LCC_ROUTES).filter(
  (route) => route.showInLeagueInfoHub && route.status === "active"
);

export const LCC_STALE_ROUTES = Object.values(LCC_ROUTES).filter(
  (route) => route.status === "stale"
);

export const LCC_HIDDEN_ROUTES = Object.values(LCC_ROUTES).filter(
  (route) => route.status === "hidden"
);
