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
        "rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-3",
        wide ? "col-span-2 min-h-[4.75rem]" : "min-h-[4.5rem]",
      ].join(" ")}
    >
      <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-md bg-[var(--lcc-surface)] text-[var(--lcc-gold)]">
        {icon}
      </div>
      <p
        className={[
          "font-black uppercase leading-tight text-[var(--lcc-text)]",
          smallValue
            ? "font-ui text-xs tracking-wide"
            : "font-serif text-xl italic",
        ].join(" ")}
      >
        {value}
      </p>
      <p className="mt-1 font-ui text-[0.65rem] font-black uppercase text-[var(--lcc-text-muted)]">
        {label}
      </p>
    </div>
  );
}
