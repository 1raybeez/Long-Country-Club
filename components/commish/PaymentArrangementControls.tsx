'use client';
import { useState } from 'react';
import type { CommissionerFinanceRow } from '@/lib/finance/operationalLedger';
import type { PaymentArrangement } from '@/lib/finance/paymentArrangements';

export function PaymentArrangementControls({ rows, arrangements }: { rows: readonly CommissionerFinanceRow[]; arrangements: readonly PaymentArrangement[] }) {
  const approved = new Map(arrangements.map((item) => [item.ownerId, item]));
  const [busy, setBusy] = useState<string | null>(null);
  async function update(ownerId: string, action: 'approve' | 'clear') { setBusy(ownerId); await fetch('/api/commish/finance/payment-arrangement', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action === 'clear' ? { action, season: 2026, ownerId } : { season: 2026, ownerId, settlementTiming: 'Commissioner-approved arrangement' }) }); setBusy(null); window.location.reload(); }
  return <section className="mt-8"><p className="lcc2-label">Commissioner control</p><h2 className="mt-1 font-ui text-xl font-black text-[var(--lcc-color-text)]">Payment arrangements</h2><p className="lcc2-body mt-2">An approved arrangement preserves award eligibility and does not mark dues as paid.</p><div className="mt-3 grid gap-3 md:grid-cols-2">{rows.map((row) => { const item = approved.get(row.ownerId); return <article key={row.ownerId} className="lcc2-card flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-ui font-black text-[var(--lcc-color-text)]">{row.teamName}</p><p className="lcc2-body mt-1">{item ? 'Payment arrangement approved' : `Outstanding: $${(row.remainingCents / 100).toFixed(2)}`}</p></div>{item ? <button type="button" disabled={busy === row.ownerId} onClick={() => update(row.ownerId, 'clear')} className="lcc2-button lcc2-button--secondary">Clear arrangement</button> : <button type="button" disabled={busy === row.ownerId} onClick={() => update(row.ownerId, 'approve')} className="lcc2-button lcc2-button--secondary">Approve arrangement</button>}</article>; })}</div></section>;
}
