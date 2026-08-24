'use client';

import { useState } from 'react';

export function AwardProposalAction({ season, week, category }: { season: number; week?: number; category?: 'fourth-place' | 'third-place' | 'runner-up' | 'champion' }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function propose() {
    setBusy(true); setMessage('');
    const response = await fetch('/api/commish/finance/awards/propose', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(category ? { season, category } : { season, week }) });
    const payload = await response.json();
    if (!response.ok) setMessage(payload.error ?? 'Award proposal was not created.');
    else window.location.reload();
    setBusy(false);
  }
  return <div className="mt-3"><button type="button" onClick={propose} disabled={busy} className="lcc2-button lcc2-button--primary">{busy ? 'Proposing…' : 'Propose Award'}</button>{message ? <p role="alert" className="lcc2-body mt-2 text-[var(--lcc-semantic-warning)]">{message}</p> : null}</div>;
}
