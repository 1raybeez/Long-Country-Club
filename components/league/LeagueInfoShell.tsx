"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getLccLeagueInfoActiveTab,
  LCC_VISIBLE_LEAGUE_INFO_NAV_ITEMS,
} from "@/lib/routeConfig";

export function LeagueInfoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTab = getLccLeagueInfoActiveTab(pathname);

  return (
    <div className="lcc2-page-shell lcc2-league-info-shell">
      <header className="lcc2-page-container lcc2-league-info-shell__identity">
        <p className="lcc2-label text-[var(--lcc-brand-primary)]">League Info</p>
        <h1 className="mt-2 lcc2-home-identity__title">Long Country Club League Hub</h1>
        <p className="lcc2-home-identity__supporting max-w-3xl">
          Rules, history, records, drafts, rivalries, and permanent league reference material.
        </p>
      </header>

      <nav
        aria-label="League Info navigation"
        className="lcc2-page-container lcc2-league-info-shell__navigation"
      >
        <div className="flex min-w-max gap-1 overflow-x-auto">
          {LCC_VISIBLE_LEAGUE_INFO_NAV_ITEMS.map((item) => {
            const active = item.id === activeTab;
            return (
              <Link
                key={item.id}
                href={item.href as string}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-lg px-4 py-2 font-ui text-xs font-black uppercase tracking-[0.04em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)] ${active ? "bg-[var(--lcc-brand-primary)] text-white" : "text-[var(--lcc-color-text-muted)] hover:bg-[var(--lcc-color-surface-muted)] hover:text-[var(--lcc-interactive)]"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="lcc2-league-info-shell__content">{children}</div>
    </div>
  );
}
