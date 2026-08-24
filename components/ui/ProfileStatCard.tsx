import type { ReactNode } from "react";

type ProfileStatCardProps = {
  readonly label: string;
  readonly value: ReactNode;
  readonly icon: ReactNode;
  readonly wide?: boolean;
  readonly smallValue?: boolean;
};

export function ProfileStatCard({
  label,
  value,
  icon,
  wide = false,
  smallValue = false,
}: ProfileStatCardProps) {
  return (
    <div
      className={[
        "rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3",
        wide ? "col-span-2 min-h-[4.75rem]" : "min-h-[4.5rem]",
      ].join(" ")}
    >
      <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-md bg-[var(--lcc-color-surface-muted)] text-[var(--lcc-color-achievement)]">
        {icon}
      </div>
      <p
        className={[
          "font-black leading-tight text-[var(--lcc-color-text)]",
          smallValue
            ? "font-ui text-xs tracking-wide"
            : "font-ui text-xl",
        ].join(" ")}
      >
        {value}
      </p>
      <p className="mt-1 font-ui text-[0.65rem] font-black uppercase tracking-[0.06em] text-[var(--lcc-color-text-muted)]">
        {label}
      </p>
    </div>
  );
}
