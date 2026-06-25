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
      className="group lcc-card flex items-center gap-4 p-4 transition-all hover:-translate-y-1 hover:border-[var(--lcc-border-strong)] hover:shadow-[var(--lcc-shadow)]"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] shadow-[var(--lcc-shadow-soft)]">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          style={{ objectPosition: "center 32%" }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
          {teamLabel}
        </p>
        <h3 className="mt-1 font-serif text-2xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
          {ownerName}
        </h3>
        <p className="mt-2 truncate font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
          {teamName}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--lcc-gold)]" />
    </Link>
  );
}
