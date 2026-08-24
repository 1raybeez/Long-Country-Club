import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCurrentMemberSession } from '@/lib/auth/session';
import { sanitizeFeedbackPagePath } from '@/lib/feedback';
import FeedbackForm from './FeedbackForm';

export const dynamic = 'force-dynamic';

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const session = await getCurrentMemberSession();
  if (!session?.identity) redirect('/?access=feedback-sign-in-required');
  if (!session.member) redirect('/?access=feedback-member-required');

  const params = await searchParams;
  const initialPagePath = sanitizeFeedbackPagePath(params.from) ?? undefined;

  return (
    <main className="lcc2-page-shell">
      <div className="lcc2-page-container">
        <Link href="/" className="lcc2-button lcc2-button--secondary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Home
        </Link>
        <header className="mt-8 max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--lcc-color-midnight)] text-[var(--lcc-brand-primary)]"><MessageSquare className="h-5 w-5" aria-hidden="true" /></span>
            <p className="lcc2-label text-[var(--lcc-brand-primary)]">Owner Feedback</p>
          </div>
          <h1 className="mt-3 font-ui text-4xl font-black tracking-[-0.04em] text-[var(--lcc-color-text)] sm:text-5xl">Tell us what needs attention</h1>
          <p className="lcc2-body mt-3 max-w-2xl">Report a problem or suggest an improvement for the Long Country Club site.</p>
        </header>
        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <FeedbackForm initialPagePath={initialPagePath} />
          <aside className="lcc2-card h-fit p-5" aria-label="Submission identity">
            <p className="lcc2-label">Submitting as</p>
            <p className="mt-2 font-ui text-lg font-black text-[var(--lcc-color-text)]">{session.member.displayName}</p>
            <p className="mt-1 font-ui text-sm font-semibold text-[var(--lcc-color-text-muted)]">{session.member.teamName}</p>
            <p className="lcc2-body mt-4 text-sm">Your LCC owner identity is attached securely from your account.</p>
          </aside>
        </section>
      </div>
    </main>
  );
}
