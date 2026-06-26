import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

type LeaguePageShellProps = {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  showBackLink?: boolean;
  topLabel?: string;
  topIcon?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function LeaguePageShell({
  children,
  backHref = "/league-info",
  backLabel = "Back to Clubhouse Info",
  showBackLink = true,
  topLabel,
  topIcon,
  className = "",
  contentClassName = "",
}: LeaguePageShellProps) {
  return (
    <main className={`lcc-page ${className}`}>
      <div className={`lcc-container py-8 sm:py-12 lg:py-14 ${contentClassName}`}>
        {(showBackLink || topLabel) && (
          <div className="mb-10 flex items-center justify-between gap-4">
            {showBackLink ? (
              <Link href={backHref} className="lcc-button lcc-button-secondary">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {backLabel}
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}

            {topLabel && (
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--lcc-border)] bg-[var(--lcc-surface)] px-3 py-2 font-ui text-[0.68rem] font-black uppercase text-[var(--lcc-text-muted)] shadow-[var(--lcc-shadow-soft)]">
                {topIcon}
                {topLabel}
              </div>
            )}
          </div>
        )}

        {children}
      </div>
    </main>
  );
}
