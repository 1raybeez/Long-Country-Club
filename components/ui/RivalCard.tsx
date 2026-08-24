import Link from "next/link";
import { ArrowRight } from "lucide-react";

type RivalCardProps = {
  readonly href: string;
  readonly imageSrc: string;
  readonly imageAlt: string;
  readonly ownerName: string;
  readonly teamName: string;
  readonly teamLabel: string;
};

export function RivalCard({
  href,
  imageSrc,
  imageAlt,
  ownerName,
  teamName,
  teamLabel,
}: RivalCardProps) {
  return (
    <Link
      href={href}
      className="group lcc2-card lcc2-card--interactive flex items-center gap-4 p-4 transition-colors hover:border-[var(--lcc-interactive)]"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] shadow-sm">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          style={{ objectPosition: "center 32%" }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="lcc2-label text-[var(--lcc-brand-primary)]">
          {teamLabel}
        </p>
        <h3 className="mt-1 break-words font-ui text-xl font-black leading-tight text-[var(--lcc-color-text)]">
          {ownerName}
        </h3>
        <p className="mt-2 truncate font-ui text-xs font-black uppercase text-[var(--lcc-color-text-muted)]">
          {teamName}
        </p>
      </div>
      <span className="ml-auto flex shrink-0 items-center gap-1.5 font-ui text-[0.65rem] font-black uppercase tracking-[0.06em] text-[var(--lcc-interactive)]">
        View H2H
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}
