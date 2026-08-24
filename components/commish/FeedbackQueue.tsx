'use client';

import { useMemo, useState } from 'react';
import { FEEDBACK_AREAS, FEEDBACK_QUEUE_STATUSES, type FeedbackArea, type FeedbackQueueStatus } from '@/lib/feedback';
import type { FeedbackQueueItem } from '@/lib/feedbackQueue';

const AREA_LABELS: Record<string, string> = {
  HOME: 'Home', MATCHUPS: 'Matchups', MANAGERS: 'Managers', LEAGUE_INFO: 'League Info', PREDICTOR: 'Predictor', WAR_ROOM: 'War Room', PAYOUTS_FINANCE: 'Payouts / Finance', AUTH_ACCOUNT: 'Sign-in / Account', MOBILE_RESPONSIVE: 'Mobile / Responsive', OTHER: 'Other',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function FeedbackQueue({ initialItems, malformedCount }: { initialItems: readonly FeedbackQueueItem[]; malformedCount: number }) {
  const [items, setItems] = useState([...initialItems]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | FeedbackQueueStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BUG' | 'SUGGESTION'>('ALL');
  const [areaFilter, setAreaFilter] = useState<'ALL' | FeedbackArea>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>(() => Object.fromEntries(initialItems.map((item) => [item.id, item.commissionerNote ?? ''])));
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const counts = useMemo(() => FEEDBACK_QUEUE_STATUSES.reduce<Record<string, number>>((result, status) => ({ ...result, [status]: items.filter((item) => item.status === status).length }), { TOTAL: items.length }), [items]);
  const visibleItems = items.filter((item) => (statusFilter === 'ALL' || item.status === statusFilter) && (typeFilter === 'ALL' || item.type === typeFilter) && (areaFilter === 'ALL' || item.area === areaFilter));

  async function save(item: FeedbackQueueItem) {
    if (savingId) return;
    setSavingId(item.id);
    setMessage('');
    try {
      const response = await fetch('/api/commish/feedback', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ feedbackId: item.id, status: item.status, commissionerNote: notes[item.id] ?? '' }) });
      const result = await response.json().catch(() => null) as { error?: string; status?: FeedbackQueueStatus } | null;
      if (!response.ok) throw new Error(result?.error ?? 'Unable to update feedback.');
      setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, status: result?.status ?? item.status, commissionerNote: notes[item.id] ?? '' } : candidate));
      setMessage('Feedback update saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update feedback.');
    } finally {
      setSavingId(null);
    }
  }

  return <>
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label="Feedback summary">
      {(['TOTAL', ...FEEDBACK_QUEUE_STATUSES] as const).map((label) => <div key={label} className="lcc2-card p-4"><p className="lcc2-label">{label}</p><p className="mt-2 font-ui text-2xl font-black text-[var(--lcc-color-text)]">{counts[label] ?? 0}</p></div>)}
    </section>
    <section className="lcc2-card mt-5 p-4 sm:p-5" aria-label="Feedback filters">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1"><span className="lcc2-label">Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="lcc2-input"><option value="ALL">All statuses</option>{FEEDBACK_QUEUE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
        <label className="grid gap-1"><span className="lcc2-label">Type</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)} className="lcc2-input"><option value="ALL">All types</option><option value="BUG">BUG</option><option value="SUGGESTION">SUGGESTION</option></select></label>
        <label className="grid gap-1"><span className="lcc2-label">Area</span><select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value as typeof areaFilter)} className="lcc2-input"><option value="ALL">All areas</option>{FEEDBACK_AREAS.map((area) => <option key={area} value={area}>{AREA_LABELS[area]}</option>)}</select></label>
      </div>
    </section>
    {malformedCount ? <p className="mt-4 rounded-xl border border-[var(--lcc-semantic-warning)] bg-[var(--lcc-color-surface-raised)] p-4 text-sm font-semibold text-[var(--lcc-color-text)]" role="status">{malformedCount} feedback record{malformedCount === 1 ? '' : 's'} could not be displayed safely.</p> : null}
    {message ? <p className="lcc2-body mt-4 font-ui text-sm font-semibold text-[var(--lcc-brand-secondary)]" role="status">{message}</p> : null}
    <section className="mt-5 space-y-3" aria-label="Feedback submissions">
      {visibleItems.length ? visibleItems.map((item) => {
        const expanded = expandedId === item.id;
        return <article key={item.id} className="lcc2-card overflow-hidden">
          <button type="button" className="flex w-full items-start justify-between gap-4 p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--lcc-interactive-focus)] sm:p-5" aria-expanded={expanded} aria-controls={`feedback-detail-${item.id}`} onClick={() => setExpandedId(expanded ? null : item.id)}>
            <span className="min-w-0"><span className="flex flex-wrap items-center gap-2"><span className="lcc2-badge lcc2-badge--neutral">{item.type}</span><span className="lcc2-badge lcc2-badge--info">{item.status}</span></span><span className="mt-3 block break-words font-ui text-lg font-black text-[var(--lcc-color-text)]">{item.title}</span><span className="mt-1 block font-ui text-sm font-semibold text-[var(--lcc-color-text-muted)]">{item.submitterDisplayName} · {item.submitterTeamName} · {AREA_LABELS[item.area] ?? item.area}</span></span><span aria-hidden="true" className="shrink-0 font-ui text-xl text-[var(--lcc-color-text-muted)]">{expanded ? '−' : '+'}</span>
          </button>
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--lcc-color-border)] px-4 pb-4 font-ui text-xs font-semibold text-[var(--lcc-color-text-muted)] sm:px-5"><span>Submitted {formatDate(item.createdAt)}</span>{item.pagePath ? <span>Path {item.pagePath}</span> : null}</div>
          {expanded ? <div id={`feedback-detail-${item.id}`} className="border-t border-[var(--lcc-color-border)] p-4 sm:p-5"><dl className="grid gap-4 sm:grid-cols-2"><div><dt className="lcc2-label">Description</dt><dd className="lcc2-body mt-1 whitespace-pre-wrap">{item.description}</dd></div><div><dt className="lcc2-label">Submitter</dt><dd className="lcc2-body mt-1">{item.submitterDisplayName}<br />{item.submitterTeamName}</dd><dt className="lcc2-label mt-4">Submitted</dt><dd className="lcc2-body mt-1">{formatDate(item.createdAt)}</dd></div></dl><div className="mt-5 grid gap-4 border-t border-[var(--lcc-color-border)] pt-5 sm:grid-cols-2"><label className="grid gap-1"><span className="lcc2-label">Status</span><select value={item.status} onChange={(event) => setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, status: event.target.value as FeedbackQueueStatus } : candidate))} className="lcc2-input">{FEEDBACK_QUEUE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label><label className="grid gap-1 sm:col-span-2"><span className="lcc2-label">Private commissioner note</span><textarea maxLength={2000} value={notes[item.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} className="lcc2-input min-h-28 resize-y" placeholder="Internal note only" /></label></div><div className="mt-4 flex justify-end"><button type="button" onClick={() => save(item)} disabled={savingId === item.id} className="lcc2-button lcc2-button--primary disabled:cursor-not-allowed disabled:opacity-60">{savingId === item.id ? 'Saving…' : 'Save update'}</button></div></div> : null}
        </article>;
      }) : <div className="lcc2-card p-6"><p className="font-ui text-lg font-black text-[var(--lcc-color-text)]">{items.length ? 'No feedback matches these filters.' : 'No owner feedback has been submitted yet.'}</p><p className="lcc2-body mt-2">Try another filter or check back after the next owner submission.</p></div>}
    </section>
  </>;
}
