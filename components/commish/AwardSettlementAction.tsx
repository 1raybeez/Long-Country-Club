'use client';

import { useState } from 'react';

export function AwardSettlementAction({ season, obligationId, amountCents, ownerDisplayName, teamName, category, week }: { season: number; obligationId: string; amountCents: number; ownerDisplayName: string; teamName: string; category: string; week: number | null }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState('venmo');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function settle() {
    setBusy(true); setMessage('');
    const response = await fetch('/api/commish/finance/awards/settle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ season, obligationId, method, effectiveDate, notes, requestId: crypto.randomUUID() }) });
    const payload = await response.json();
    if (!response.ok) { setMessage(payload.error ?? 'Award settlement was not recorded.'); setBusy(false); return; }
    window.location.reload();
  }
  return <div className="mt-3"><button type="button" onClick={() => setOpen((value) => !value)} disabled={busy} className="lcc2-button lcc2-button--primary">{open ? 'Close' : 'Record Award Payment'}</button>{open ? <div className="mt-3 rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3"><p className="lcc2-body">{category}{week ? ` · Week ${week}` : ''} · {ownerDisplayName} · {teamName}</p><p className="mt-2 font-ui text-lg font-black text-[var(--lcc-color-text)]">${(amountCents / 100).toFixed(2)}</p><div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="lcc2-label">Method<select value={method} onChange={(event) => setMethod(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-[var(--lcc-color-border-strong)] bg-[var(--lcc-color-surface-raised)] px-3 text-sm text-[var(--lcc-color-text)]"><option value="venmo">Venmo</option><option value="paypal">PayPal</option><option value="other">Other</option></select></label><label className="lcc2-label">Effective date<input type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-[var(--lcc-color-border-strong)] bg-[var(--lcc-color-surface-raised)] px-3 text-sm text-[var(--lcc-color-text)]" /></label></div><label className="lcc2-label mt-3 block">Note optional<textarea maxLength={500} rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 w-full rounded-lg border border-[var(--lcc-color-border-strong)] bg-[var(--lcc-color-surface-raised)] p-2 text-sm text-[var(--lcc-color-text)]" /></label><button type="button" onClick={settle} disabled={busy} className="lcc2-button lcc2-button--primary mt-3">{busy ? 'Recording…' : 'Confirm Award Payment'}</button>{message ? <p role="alert" className="lcc2-body mt-2 text-[var(--lcc-semantic-warning)]">{message}</p> : null}</div> : null}</div>;
}
