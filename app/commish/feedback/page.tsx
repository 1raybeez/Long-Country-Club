import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCurrentMemberSession } from '@/lib/auth/session';
import { getCommissionerFeedbackQueue } from '@/lib/feedbackServer';
import FeedbackQueue from '@/components/commish/FeedbackQueue';

export const dynamic = 'force-dynamic';

export default async function CommissionerFeedbackPage() {
  const session = await getCurrentMemberSession();
  if (!session?.member?.capabilities.includes('commissioner')) redirect('/?access=commissioner-required');

  let queue = { items: [], malformedCount: 0, storageAvailable: true } as Awaited<ReturnType<typeof getCommissionerFeedbackQueue>>;
  let loadError = '';
  try {
    queue = await getCommissionerFeedbackQueue();
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Unable to load feedback queue.';
  }

  return <main className="lcc2-page-shell"><div className="lcc2-page-container"><Link href="/commish" className="lcc2-button lcc2-button--secondary"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to Commissioner Hub</Link><header className="mt-8 max-w-3xl"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--lcc-color-midnight)] text-[var(--lcc-brand-primary)]"><MessageSquare className="h-5 w-5" aria-hidden="true" /></span><p className="lcc2-label text-[var(--lcc-brand-primary)]">Commissioner Operations</p></div><h1 className="mt-3 font-ui text-4xl font-black tracking-[-0.04em] text-[var(--lcc-color-text)] sm:text-5xl">Owner Feedback Queue</h1><p className="lcc2-body mt-3">Review owner-submitted bugs and suggestions. Original submission content is immutable.</p></header>{loadError ? <div className="lcc2-card mt-8 p-5" role="alert"><p className="font-ui font-black text-[var(--lcc-color-text)]">Feedback queue temporarily unavailable.</p><p className="lcc2-body mt-2">{loadError}</p></div> : !queue.storageAvailable ? <div className="lcc2-card mt-8 p-5" role="status"><p className="font-ui font-black text-[var(--lcc-color-text)]">Feedback storage is unavailable.</p><p className="lcc2-body mt-2">No queue data was loaded or changed.</p></div> : <div className="mt-8"><FeedbackQueue initialItems={queue.items} malformedCount={queue.malformedCount} /></div>}</div></main>;
}
