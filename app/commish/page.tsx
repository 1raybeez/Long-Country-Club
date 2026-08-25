import Link from 'next/link';
import { ArrowLeft, Banknote, BrainCircuit, Home, MessageSquare, ShieldCheck } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCurrentMemberSession } from '@/lib/auth/session';
import { getCommissionerFeedbackQueue } from '@/lib/feedbackServer';

export const dynamic = 'force-dynamic';

export default async function CommissionerHubPage() {
  const session = await getCurrentMemberSession();
  if (!session?.member?.capabilities.includes('commissioner')) redirect('/?access=commissioner-required');

  let feedbackSummary: { open: number; planned: number; total: number } | null = null;
  try {
    const queue = await getCommissionerFeedbackQueue();
    if (queue.storageAvailable) {
      feedbackSummary = {
        open: queue.items.filter((item) => item.status === 'OPEN').length,
        planned: queue.items.filter((item) => item.status === 'PLANNED').length,
        total: queue.items.length,
      };
    }
  } catch {
    feedbackSummary = null;
  }

  return (
    <main className="lcc2-page-shell">
      <div className="lcc2-page-container">
        <Link href="/" className="lcc2-button lcc2-button--secondary"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Return to LCC Home</Link>
        <header className="mt-8 max-w-3xl">
          <p className="lcc2-label text-[var(--lcc-brand-primary)]">Commissioner Operations</p>
          <h1 className="mt-2 font-ui text-4xl font-black tracking-[-0.04em] text-[var(--lcc-color-text)] sm:text-5xl">Commissioner Hub</h1>
          <p className="lcc2-body mt-3">Private tools for league operations, finance, feedback, and administration.</p>
        </header>

        <section className="mt-8" aria-labelledby="needs-attention-heading">
          <div className="mb-4"><p className="lcc2-label text-[var(--lcc-brand-secondary)]">Needs attention</p><h2 id="needs-attention-heading" className="mt-1 font-ui text-2xl font-black text-[var(--lcc-color-text)]">Operational snapshot</h2></div>
          <div className="grid gap-4">
            <HubCard href="/commish/feedback" eyebrow="Owner Feedback" title={feedbackSummary ? `${feedbackSummary.open} open` : 'Status unavailable'} description={feedbackSummary ? `${feedbackSummary.planned} planned · ${feedbackSummary.total} total` : 'Open the queue to check current owner submissions.'} icon={<MessageSquare aria-hidden="true" />} cta="Review feedback" />
          </div>
        </section>

        <section className="mt-10" aria-labelledby="active-tools-heading">
          <div className="mb-4"><p className="lcc2-label text-[var(--lcc-brand-primary)]">Active tools</p><h2 id="active-tools-heading" className="mt-1 font-ui text-2xl font-black text-[var(--lcc-color-text)]">Private operations</h2></div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <HubCard href="/commish/feedback" eyebrow="Owner Feedback" title="Feedback Queue" description="Review owner-submitted bugs and suggestions with private commissioner controls." icon={<MessageSquare aria-hidden="true" />} cta="Open queue" />
            <HubCard href="/commish/finance" eyebrow="2026 Finance" title="Finance" description="Manage league assessments, payments, awards, settlements, corrections, and reconciliation." icon={<Banknote aria-hidden="true" />} cta="Open finance" />
            <HubCard href="/war-room" eyebrow="War Room" title="Partial foundation" description="Open the authenticated owner workspace. Planning modules remain scheduled for later War Room work." icon={<ShieldCheck aria-hidden="true" />} cta="Open War Room" />
          </div>
        </section>

        <section className="mt-10" aria-labelledby="future-tools-heading">
          <div className="mb-4"><p className="lcc2-label text-[var(--lcc-color-text-muted)]">Future roadmap</p><h2 id="future-tools-heading" className="mt-1 font-ui text-2xl font-black text-[var(--lcc-color-text)]">Not active yet</h2></div>
          <div className="max-w-xl"><FutureCard eyebrow="Post-Draft Intelligence" title="Coming later" description="Post-draft analysis is not enabled as a commissioner tool yet." icon={<BrainCircuit aria-hidden="true" />} /></div>
        </section>

        <Link href="/" className="mt-8 inline-flex font-ui text-xs font-black uppercase tracking-[0.1em] text-[var(--lcc-interactive)] hover:underline"><Home className="mr-2 h-4 w-4" aria-hidden="true" />Return to public site</Link>
      </div>
    </main>
  );
}

function HubCard({ href, eyebrow, title, description, icon, cta }: { href: string; eyebrow: string; title: string; description: string; icon: React.ReactNode; cta: string }) {
  return <Link href={href} className="lcc2-card lcc2-card--interactive block p-5"><div className="flex items-start justify-between gap-4"><div><p className="lcc2-label text-[var(--lcc-brand-secondary)]">{eyebrow}</p><h3 className="mt-2 font-ui text-2xl font-black text-[var(--lcc-color-text)]">{title}</h3></div><span className="text-[var(--lcc-brand-secondary)]">{icon}</span></div><p className="lcc2-body mt-4">{description}</p><span className="mt-5 inline-flex font-ui text-xs font-black uppercase tracking-[0.12em] text-[var(--lcc-interactive)]">{cta} →</span></Link>;
}

function FutureCard({ eyebrow, title, description, icon }: { eyebrow: string; title: string; description: string; icon: React.ReactNode }) {
  return <article className="lcc2-card p-5 opacity-75"><div className="flex items-start justify-between gap-4"><div><p className="lcc2-label text-[var(--lcc-color-text-muted)]">{eyebrow}</p><h3 className="mt-2 font-ui text-2xl font-black text-[var(--lcc-color-text)]">{title}</h3></div><span className="text-[var(--lcc-color-text-muted)]">{icon}</span></div><p className="lcc2-body mt-4">{description}</p><span className="mt-5 inline-flex font-ui text-xs font-black uppercase tracking-[0.12em] text-[var(--lcc-color-text-muted)]">Not active</span></article>;
}
