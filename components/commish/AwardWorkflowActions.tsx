'use client';

import { useState } from 'react';

export function AwardWorkflowActions({ season, obligationId }: { season: number; obligationId: string }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function send(action: 'approve' | 'reject') {
    setBusy(true); setMessage('');
    const response = await fetch(`/api/commish/finance/awards/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action === 'approve' ? { season, obligationId } : { season, obligationId, reason }) });
    const payload = await response.json();
    if (!response.ok) { setMessage(payload.error ?? 'Award workflow action failed.'); setBusy(false); return; }
    window.location.reload();
  }
  return <div className="mt-3 flex flex-col gap-2"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => send('approve')} disabled={busy} className="lcc2-button lcc2-button--primary">{busy ? 'Saving…' : 'Approve Award'}</button><button type="button" onClick={() => setRejecting((value) => !value)} disabled={busy} className="lcc2-button lcc2-button--secondary">{rejecting ? 'Cancel' : 'Reject Award'}</button></div>{rejecting ? <div><label className="lcc2-label" htmlFor={`rejection-${obligationId}`}>Rejection reason</label><textarea id={`rejection-${obligationId}`} value={reason} onChange={(event) => setReason(event.target.value)} required maxLength={500} rows={2} className="mt-2 w-full rounded-lg border border-[var(--lcc-color-border-strong)] bg-[var(--lcc-color-surface-raised)] p-2 text-sm text-[var(--lcc-color-text)]" /><button type="button" onClick={() => send('reject')} disabled={busy || reason.trim().length < 3} className="lcc2-button lcc2-button--secondary mt-2">Confirm Rejection</button></div> : null}{message ? <p role="alert" className="lcc2-body text-[var(--lcc-semantic-warning)]">{message}</p> : null}</div>;
}
