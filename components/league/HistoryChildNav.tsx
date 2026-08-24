"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LCC_HISTORY_NAV_ITEMS } from "@/lib/routeConfig";

export function HistoryChildNav() {
  const [active, setActive] = useState("history-overview");

  useEffect(() => {
    const update = () => setActive(window.location.hash === "#season-explorer" ? "history-seasons" : "history-overview");
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  return (
    <nav aria-label="History sections" className="mb-6 border-b border-[var(--lcc-color-border)] pb-2">
      <div className="flex min-w-max gap-1 overflow-x-auto">
        {LCC_HISTORY_NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <Link
              key={item.id}
              href={item.href as string}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex min-h-10 shrink-0 items-center rounded-lg px-3 py-2 font-ui text-xs font-black uppercase tracking-[0.04em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)] ${isActive ? "bg-[var(--lcc-brand-primary)] text-white" : "text-[var(--lcc-color-text-muted)] hover:bg-[var(--lcc-color-surface-muted)] hover:text-[var(--lcc-interactive)]"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
