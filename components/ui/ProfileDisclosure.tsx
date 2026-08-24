"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

export function ProfileDisclosure({
  id,
  title,
  summary,
  icon,
  children,
}: {
  id: string;
  title: string;
  summary: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = `${id}-panel`;

  return (
    <section className="lcc2-card p-4 sm:p-5">
      <h2>
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between gap-4 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)]"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className="flex min-w-0 items-center gap-3">
            {icon && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--lcc-color-midnight)] text-[var(--lcc-color-achievement)]">
                {icon}
              </span>
            )}
            <span className="min-w-0">
              <span className="block font-ui text-xl font-black leading-tight tracking-[-0.02em] text-[var(--lcc-color-text)]">
                {title}
              </span>
              <span className="mt-1 block break-words font-ui text-xs font-bold text-[var(--lcc-color-text-muted)]">
                {summary}
              </span>
            </span>
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-[var(--lcc-interactive)] transition-transform ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </h2>

      {isOpen && (
        <div id={panelId} className="mt-4 border-t border-[var(--lcc-color-border)] pt-4">
          {children}
        </div>
      )}
    </section>
  );
}
