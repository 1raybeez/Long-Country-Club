'use client';

import { FormEvent, useState } from 'react';
import { FEEDBACK_AREAS, FEEDBACK_TYPES, type FeedbackArea, type FeedbackType } from '@/lib/feedback';

const AREA_LABELS: Record<FeedbackArea, string> = {
  HOME: 'Home',
  MATCHUPS: 'Matchups',
  MANAGERS: 'Managers',
  LEAGUE_INFO: 'League Info',
  PREDICTOR: 'Predictor',
  WAR_ROOM: 'War Room',
  PAYOUTS_FINANCE: 'Payouts / Finance',
  AUTH_ACCOUNT: 'Sign-in / Account',
  MOBILE_RESPONSIVE: 'Mobile / Responsive',
  OTHER: 'Other',
};

export default function FeedbackForm({ initialPagePath }: { initialPagePath?: string }) {
  const [type, setType] = useState<FeedbackType>('BUG');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState<FeedbackArea>('HOME');
  const [pagePath, setPagePath] = useState(initialPagePath ?? '');
  const [state, setState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === 'submitting') return;
    setState('submitting');
    setMessage('');
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, description, area, ...(pagePath ? { pagePath } : {}) }),
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error ?? 'Unable to submit feedback right now.');
      setState('success');
      setMessage('Thanks — your feedback has been submitted.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Unable to submit feedback right now.');
    }
  }

  function resetForm() {
    setType('BUG');
    setTitle('');
    setDescription('');
    setArea('HOME');
    setPagePath('');
    setState('idle');
    setMessage('');
  }

  if (state === 'success') {
    return <section className="lcc2-card lcc2-card--raised p-5 sm:p-6" aria-live="polite"><p className="lcc2-label text-[var(--lcc-brand-secondary)]">Received</p><h2 className="mt-2 font-ui text-2xl font-black text-[var(--lcc-color-text)]">Thanks for helping improve LCC.</h2><p className="lcc2-body mt-3">{message}</p><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={resetForm} className="lcc2-button lcc2-button--primary">Submit another</button><a href="/" className="lcc2-button lcc2-button--secondary">Return Home</a></div></section>;
  }

  return (
    <form onSubmit={handleSubmit} className="lcc2-card lcc2-card--raised p-5 sm:p-6">
      <div className="grid gap-5">
        <fieldset>
          <legend className="lcc2-label">Type <span aria-hidden="true">*</span></legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {FEEDBACK_TYPES.map((option) => (
              <label key={option} className={`cursor-pointer rounded-xl border p-4 transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--lcc-interactive-focus)] ${type === option ? 'border-[var(--lcc-interactive)] bg-[var(--lcc-color-surface-muted)]' : 'border-[var(--lcc-color-border)]'}`}>
                <input type="radio" name="feedback-type" value={option} checked={type === option} onChange={() => setType(option)} className="sr-only" />
                <span className="font-ui text-sm font-black text-[var(--lcc-color-text)]">{option === 'BUG' ? 'Report a Bug' : 'Suggest an Improvement'}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="grid gap-2"><span className="lcc2-label">Title <span aria-hidden="true">*</span></span><input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} className="lcc2-input" placeholder="Short summary" /></label>
        <label className="grid gap-2"><span className="lcc2-label">Description <span aria-hidden="true">*</span></span><textarea required maxLength={5000} value={description} onChange={(event) => setDescription(event.target.value)} className="lcc2-input min-h-40 resize-y" placeholder="What happened, or what would you like to see?" /></label>
        <label className="grid gap-2"><span className="lcc2-label">Area <span aria-hidden="true">*</span></span><select required value={area} onChange={(event) => setArea(event.target.value as FeedbackArea)} className="lcc2-input">{FEEDBACK_AREAS.map((option) => <option key={option} value={option}>{AREA_LABELS[option]}</option>)}</select></label>
        <label className="grid gap-2"><span className="lcc2-label">Page or path <span className="font-normal normal-case tracking-normal text-[var(--lcc-color-text-muted)]">(optional)</span></span><input maxLength={300} value={pagePath} onChange={(event) => setPagePath(event.target.value)} className="lcc2-input" placeholder="/predictor" /></label>
      </div>
      {state === 'error' ? <p className="mt-4 text-sm font-semibold text-[var(--lcc-semantic-negative)]" role="alert">{message}</p> : null}
      <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--lcc-color-border)] pt-5"><p className="lcc2-body text-sm">Required fields are marked with <span aria-hidden="true">*</span>.</p><button type="submit" disabled={state === 'submitting'} className="lcc2-button lcc2-button--primary disabled:cursor-not-allowed disabled:opacity-60">{state === 'submitting' ? 'Submitting…' : 'Submit feedback'}</button></div>
    </form>
  );
}
