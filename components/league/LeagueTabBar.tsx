"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type LeagueTabItem = {
  label: string;
  value: string;
  href?: string;
  icon?: ReactNode;
  disabled?: boolean;
};

type LeagueTabBarProps = {
  items: readonly LeagueTabItem[];
  value: string;
  onChange?: (value: string) => void;
  ariaLabel?: string;
  className?: string;
};

export function LeagueTabBar({
  items,
  value,
  onChange,
  ariaLabel = "League Info sections",
  className = "",
}: LeagueTabBarProps) {
  return (
    <div
      role={onChange ? "tablist" : "navigation"}
      aria-label={ariaLabel}
      className={[
        "flex flex-wrap gap-2 rounded-full border border-[var(--lcc-border)] bg-[var(--lcc-surface)] p-1 shadow-[var(--lcc-shadow-soft)]",
        className,
      ].join(" ")}
    >
      {items.map((item) => {
        const isActive = item.value === value;
        const tabClassName = [
          "inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 font-ui text-xs font-black uppercase transition-colors sm:flex-none",
          isActive
            ? "bg-[var(--lcc-green-deep)] text-[var(--lcc-surface)]"
            : "text-[var(--lcc-text-muted)] hover:bg-[var(--lcc-surface-muted)] hover:text-[var(--lcc-text)]",
          item.disabled ? "cursor-not-allowed opacity-45" : "",
        ].join(" ");

        if (item.href && !onChange) {
          return (
            <Link
              key={item.value}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={tabClassName}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        }

        return (
          <button
            key={item.value}
            type="button"
            role={onChange ? "tab" : undefined}
            aria-selected={onChange ? isActive : undefined}
            disabled={item.disabled}
            onClick={() => onChange?.(item.value)}
            className={tabClassName}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
