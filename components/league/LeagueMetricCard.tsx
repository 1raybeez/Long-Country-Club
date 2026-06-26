import type { ReactNode } from "react";

type LeagueMetricTone = "neutral" | "positive" | "warning" | "danger";

type LeagueMetricCardProps = {
  label: string;
  value: string;
  helperText?: string;
  tone?: LeagueMetricTone;
  icon?: ReactNode;
  className?: string;
};

const metricToneClasses: Record<LeagueMetricTone, string> = {
  neutral:
    "border-[var(--lcc-border)] bg-[var(--lcc-surface)] text-[var(--lcc-text)]",
  positive:
    "border-[#1a472a]/40 bg-[#1a472a] text-[#f8f4ea] dark:border-[var(--lcc-border-strong)] dark:bg-[var(--lcc-surface)] dark:text-[var(--lcc-text)]",
  warning:
    "border-[#c5a059]/45 bg-[#c5a059] text-[#143520] dark:border-[var(--lcc-border-strong)] dark:bg-[var(--lcc-gold-soft)] dark:text-[var(--lcc-text)]",
  danger:
    "border-red-200 bg-red-50 text-red-950 dark:border-red-300/30 dark:bg-red-950/30 dark:text-red-100",
};

export function LeagueMetricCard({
  label,
  value,
  helperText,
  tone = "neutral",
  icon,
  className = "",
}: LeagueMetricCardProps) {
  return (
    <article
      className={[
        "rounded-[1.5rem] border p-6 text-center shadow-[var(--lcc-shadow-soft)]",
        metricToneClasses[tone],
        className,
      ].join(" ")}
    >
      {icon && (
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--lcc-radius)] bg-white/20 text-current">
          {icon}
        </div>
      )}
      <h3 className="font-ui text-xs font-black uppercase tracking-wide opacity-75">
        {label}
      </h3>
      <p className="mt-2 font-serif text-4xl font-black uppercase italic leading-none">
        {value}
      </p>
      {helperText && (
        <p className="mt-3 font-ui text-xs font-bold leading-5 opacity-70">
          {helperText}
        </p>
      )}
    </article>
  );
}
