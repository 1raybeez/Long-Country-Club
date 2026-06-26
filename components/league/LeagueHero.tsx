import type { ReactNode } from "react";

type LeagueHeroProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  label: string;
  accentClassName?: string;
  className?: string;
};

export function LeagueHero({
  icon,
  title,
  subtitle,
  label,
  accentClassName = "bg-[var(--lcc-gold-soft)] text-[var(--lcc-text)]",
  className = "",
}: LeagueHeroProps) {
  return (
    <header className={`mx-auto max-w-4xl text-center ${className}`}>
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-[1.25rem] border border-[var(--lcc-border-strong)] shadow-[var(--lcc-shadow-soft)] ${accentClassName}`}
      >
        {icon}
      </div>
      <p className="mt-5 font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
        {label}
      </p>
      <h1 className="mt-3 font-serif text-5xl font-black uppercase italic leading-none text-[var(--lcc-text)] sm:text-6xl lg:text-7xl">
        {title}
      </h1>
      <p className="mx-auto mt-5 max-w-2xl font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)] sm:text-base">
        {subtitle}
      </p>
    </header>
  );
}
