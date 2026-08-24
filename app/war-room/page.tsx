import Link from 'next/link';
import { ArrowLeft, Crosshair, ShieldCheck, Sparkles } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getOwnerById } from '@/lib/ownerRegistry';
import { hasCapability } from '@/lib/auth/memberResolver';
import { getCurrentMemberSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function WarRoomPage() {
  const session = await getCurrentMemberSession();
  const member = session?.member;

  if (!member || !hasCapability(member, 'war-room')) {
    redirect('/?access=war-room-required');
  }

  const owner = getOwnerById(member.ownerId);

  if (!owner) {
    redirect('/?access=war-room-owner-required');
  }

  return (
    <main className="lcc2-page-shell">
      <div className="lcc2-page-container">
        <Link href="/" className="lcc2-button lcc2-button--secondary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Home
        </Link>

        <header className="mt-8 max-w-3xl">
          <p className="lcc2-label text-[var(--lcc-brand-primary)]">Private Dynasty Operations</p>
          <h1 className="mt-2 font-ui text-4xl font-black tracking-[-0.04em] text-[var(--lcc-color-text)] sm:text-5xl">My War Room</h1>
          <p className="lcc2-body mt-3 max-w-2xl">Your private roster, draft-capital, and strategy workspace for Long Country Club.</p>
        </header>

        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]" aria-label="War Room identity">
          <div className="lcc2-card lcc2-card--raised p-5 sm:p-6">
            <p className="lcc2-label text-[var(--lcc-brand-secondary)]">Authenticated owner</p>
            <h2 className="mt-2 font-ui text-2xl font-black text-[var(--lcc-color-text)]">{owner.displayName}</h2>
            <p className="mt-1 font-ui text-base font-semibold text-[var(--lcc-color-text-muted)]">{owner.teamName}</p>
            <p className="lcc2-body mt-5 max-w-xl">This workspace is resolved from your authenticated LCC member account. Planning tools will be added here in later War Room slices.</p>
          </div>
          <aside className="lcc2-card p-5" aria-label="War Room access status">
            <ShieldCheck className="h-5 w-5 text-[var(--lcc-interactive)]" aria-hidden="true" />
            <p className="lcc2-label mt-3">Workspace status</p>
            <p className="mt-1 font-ui text-base font-black text-[var(--lcc-color-text)]">Private member access</p>
            <p className="lcc2-body mt-2 text-sm">Only your canonical owner workspace is available in this foundation slice.</p>
          </aside>
        </section>

        <section className="mt-8" aria-labelledby="war-room-foundation-heading">
          <div className="mb-4">
            <p className="lcc2-section-heading__eyebrow">Foundation roadmap</p>
            <h2 id="war-room-foundation-heading" className="lcc2-section-heading__title">Your War Room</h2>
            <p className="lcc2-section-heading__supporting">The private workspace is ready for its data-driven modules.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FoundationCard icon={<Crosshair className="h-5 w-5" aria-hidden="true" />} title="Roster" status="Next Build" description="Current roster context will be added in the next slice." />
            <FoundationCard icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />} title="Draft Capital" status="Next Build" description="Canonical future-pick holdings will be connected later." />
            <FoundationCard icon={<Sparkles className="h-5 w-5" aria-hidden="true" />} title="Draft Strategy" status="Planned" description="Descriptive draft tendencies will be added after the shell is established." />
          </div>
        </section>
      </div>
    </main>
  );
}

function FoundationCard({ icon, title, status, description }: { icon: React.ReactNode; title: string; status: string; description: string }) {
  return (
    <article className="lcc2-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--lcc-color-surface-muted)] text-[var(--lcc-interactive)]">{icon}</div>
        <span className="lcc2-badge lcc2-badge--neutral">{status}</span>
      </div>
      <h3 className="mt-5 font-ui text-xl font-black text-[var(--lcc-color-text)]">{title}</h3>
      <p className="lcc2-body mt-2 text-sm">{description}</p>
    </article>
  );
}
