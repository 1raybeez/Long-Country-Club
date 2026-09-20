import { getPublicOperationalFinance } from "@/lib/finance/operationalLedger";
import { getHomeEvents, selectNextHomeEvent, type HomeEvent } from "@/lib/homeEvents";
import type { PublicOperationalFinance } from "@/lib/types/operationalFinance";

export interface HomePayoutSummary {
  readonly duesAssessed: number | null;
  readonly duesCollected: number | null;
  readonly duesOutstanding: number | null;
  readonly awardCreditsApplied: number | null;
  readonly latestWeeklyHigh: {
    readonly week: number;
    readonly displayName: string;
    readonly teamName: string;
    readonly amountCents: number;
    readonly status: "approved" | "paid";
  } | null;
}

export interface HomeGovernanceSummary {
  readonly title: "League Governance";
  readonly description: "League rules, constitution, and historical governance.";
  readonly cta: { readonly label: "Read Constitution"; readonly href: "/league-info/constitution" };
}

export interface HomeLeagueContext {
  readonly payouts: HomePayoutSummary | null;
  readonly governance: HomeGovernanceSummary;
  readonly nextEvent: HomeEvent | null;
}

const GOVERNANCE: HomeGovernanceSummary = {
  title: "League Governance",
  description: "League rules, constitution, and historical governance.",
  cta: { label: "Read Constitution", href: "/league-info/constitution" },
};

export function projectHomePayouts(finance: PublicOperationalFinance | null): HomePayoutSummary | null {
  if (!finance) return null;
  const latestWeeklyHigh = finance.publicAwards.awards
    .filter((award) => award.category === "weekly-high" && (award.status === "approved" || award.status === "paid") && award.week !== null)
    .sort((a, b) => (b.week ?? 0) - (a.week ?? 0))[0];

  return {
    duesAssessed: finance.duesAssessed,
    duesCollected: finance.duesCollected,
    duesOutstanding: finance.duesOutstanding,
    awardCreditsApplied: finance.awardCreditsApplied,
    latestWeeklyHigh: latestWeeklyHigh
      ? { week: latestWeeklyHigh.week!, displayName: latestWeeklyHigh.displayName, teamName: latestWeeklyHigh.teamName, amountCents: latestWeeklyHigh.amountCents, status: latestWeeklyHigh.status === "paid" ? "paid" : "approved" }
      : null,
  };
}

export async function loadHomeLeagueContext(season: number, now = new Date()): Promise<HomeLeagueContext> {
  const finance = await getPublicOperationalFinance();
  return {
    payouts: projectHomePayouts(finance),
    governance: GOVERNANCE,
    nextEvent: selectNextHomeEvent(getHomeEvents(season), now).event,
  };
}
