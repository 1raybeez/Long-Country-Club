import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Archive,
  ArrowRight,
  ClipboardList,
  Coins,
  FolderOpen,
  Landmark,
  Scale,
  ShieldCheck,
  Swords,
  Trophy,
} from "lucide-react";

type HubCard = {
  title: string;
  description: string;
  cta: string;
  category: string;
  status: "Active" | "Coming Soon" | "Secondary";
  href?: string;
  icon: LucideIcon;
  secondary?: boolean;
};

const HUB_CARDS: readonly HubCard[] = [
  {
    title: "Rules of Play",
    description:
      "The official LCC constitution, owner expectations, scoring rules, roster rules, and league procedures.",
    cta: "Review Rules",
    category: "Governance",
    status: "Active",
    href: "/league-info/constitution",
    icon: Scale,
  },
  {
    title: "Competition Committee / Legislative Hub",
    description:
      "Future home for offseason proposals, owner votes, rule amendments, and committee records.",
    cta: "Coming Soon",
    category: "Governance",
    status: "Coming Soon",
    icon: Landmark,
    secondary: true,
  },
  {
    title: "Trophy Room",
    description:
      "A champion gallery for Long Country Club winners, legacy seasons, and title history.",
    cta: "View Champions",
    category: "History",
    status: "Active",
    href: "/league-info/trophy-room",
    icon: Trophy,
  },
  {
    title: "Rivalry Hub",
    description:
      "Head-to-head lore, active rivalries, and matchup history from around the clubhouse.",
    cta: "Compare Rivals",
    category: "Matchups",
    status: "Active",
    href: "/league-info/rivalries",
    icon: Swords,
  },
  {
    title: "League Archives",
    description:
      "Historical league records, final standings, past finishes, and the long view back to 2003.",
    cta: "Open Archives",
    category: "Records",
    status: "Active",
    href: "/league-info/archives",
    icon: Archive,
  },
  {
    title: "Draft Room",
    description:
      "Draft order, pick history, dynasty assets, and the boardroom view of roster building.",
    cta: "Enter Draft Room",
    category: "Dynasty",
    status: "Active",
    href: "/league-info/drafts",
    icon: ClipboardList,
  },
  {
    title: "Caddy Fees",
    description:
      "Weekly fees, payouts, money-game tracking, and the financial ledger for the season.",
    cta: "View Fees",
    category: "Ledger",
    status: "Active",
    href: "/league-info/fees",
    icon: Coins,
  },
  {
    title: "Resources",
    description:
      "A secondary locker-room shelf for useful fantasy tools, analysis, and reference links.",
    cta: "Open Resources",
    category: "Strategy",
    status: "Secondary",
    href: "/league-info/resources",
    icon: FolderOpen,
    secondary: true,
  },
] as const;

const HUB_STATS = [
  "Continuous since 2003",
  "Sleeper migration in 2019",
  "Dynasty Era since 2021",
] as const;

export default function ClubhouseInfoPage() {
  return (
    <main className="lcc-page">
      <div className="lcc-container py-10 sm:py-14 lg:py-18">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <div className="lcc-section-header">
            <div className="lcc-badge">
              <ShieldCheck className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Official Clubhouse
            </div>
            <p className="lcc-page-kicker">League Info Hub</p>
            <h1 className="lcc-page-title">
              Long Country Club Almanac
            </h1>
            <p className="lcc-page-copy max-w-3xl">
              The central clubhouse for rules, trophies, archives, rivalries,
              draft history, caddy fees, and the records that keep LCC history
              sharp from the Two-Keeper Era into the Dynasty Era.
            </p>
          </div>

          <aside className="lcc-card p-5 sm:p-6">
            <p className="mb-4 font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
              Club Markers
            </p>
            <div className="grid gap-3">
              {HUB_STATS.map((stat) => (
                <div
                  key={stat}
                  className="flex items-center gap-3 border-t border-[var(--lcc-border)] pt-3 first:border-t-0 first:pt-0"
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--lcc-gold)]" />
                  <span className="font-ui text-sm font-bold text-[var(--lcc-text)]">
                    {stat}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {HUB_CARDS.map((card) => (
            <LeagueInfoHubCard key={card.title} card={card} />
          ))}
        </section>
      </div>
    </main>
  );
}

function LeagueInfoHubCard({ card }: { card: HubCard }) {
  const Icon = card.icon;
  const cardClassName = [
    "group flex min-h-[18rem] flex-col justify-between p-5 transition-all sm:p-6",
    card.secondary ? "lcc-card-subtle" : "lcc-card",
    card.href
      ? "hover:-translate-y-1 hover:border-[var(--lcc-border-strong)] hover:shadow-[var(--lcc-shadow)]"
      : "opacity-75",
  ].join(" ");

  const content = (
    <>
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-gold-soft)] text-[var(--lcc-text)]">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <span className="lcc-badge">{card.status}</span>
        </div>

        <p className="mt-7 font-ui text-[0.68rem] font-black uppercase text-[var(--lcc-gold)]">
          {card.category}
        </p>
        <h2 className="mt-2 font-serif text-2xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
          {card.title}
        </h2>
        <p className="mt-4 font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)]">
          {card.description}
        </p>
      </div>

      <div
        className={[
          "mt-8 inline-flex items-center gap-2 font-ui text-xs font-black uppercase",
          card.href
            ? "text-[var(--lcc-text)]"
            : "text-[var(--lcc-text-muted)]",
        ].join(" ")}
      >
        {card.cta}
        {card.href && (
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        )}
      </div>
    </>
  );

  if (!card.href) {
    return (
      <article className={cardClassName} aria-disabled="true">
        {content}
      </article>
    );
  }

  return (
    <Link href={card.href} className={cardClassName}>
      {content}
    </Link>
  );
}
