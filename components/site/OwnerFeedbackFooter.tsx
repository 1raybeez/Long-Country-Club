'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LccMemberIdentity } from '@/lib/auth/types';

export function OwnerFeedbackFooter({ member }: { member: LccMemberIdentity | null }) {
  const pathname = usePathname();
  if (!member) return null;
  const href = `/feedback?from=${encodeURIComponent(pathname || '/')}`;

  return <footer className="mx-auto w-full max-w-7xl px-4 pb-6 pt-2 sm:px-6 lg:px-8"><div className="border-t border-[var(--lcc-color-border)] pt-4 text-center"><Link href={href} className="font-ui text-xs font-black uppercase tracking-[0.08em] text-[var(--lcc-color-text-muted)] transition-colors hover:text-[var(--lcc-interactive)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)]">Long Country Club · Found a problem or have an idea? <span className="text-[var(--lcc-interactive)]">Send feedback</span></Link></div></footer>;
}
