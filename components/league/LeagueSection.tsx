import type { ReactNode } from "react";

type LeagueSectionProps = {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function LeagueSection({
  eyebrow,
  title,
  action,
  children,
  className = "",
  contentClassName = "p-5 sm:p-6",
}: LeagueSectionProps) {
  return (
    <section
      className={[
        "overflow-hidden rounded-[1.5rem] border border-[var(--lcc-border)] bg-[var(--lcc-surface)] shadow-[var(--lcc-shadow-soft)]",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 border-b border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          {eyebrow && (
            <p className="font-ui text-[0.68rem] font-black uppercase text-[var(--lcc-gold)]">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-1 font-serif text-2xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
            {title}
          </h2>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
