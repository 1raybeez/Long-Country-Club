import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { FinanceClient } from '@/components/commish/FinanceClient';
import { getCurrentMemberSession } from '@/lib/auth/session';
import { getCommissionerFinanceSnapshot } from '@/lib/finance/operationalLedger';
import { LCC_RESTRICTED_VACU_RESERVE_CENTS } from '@/lib/financeRules';
import { AwardReview } from '@/components/commish/AwardReview';
import { getPostseasonAwardProposals, getWeeklyAwardProposals } from '@/lib/finance/awardProposals';
import { getPrivateAwardProjection } from '@/lib/finance/awardProjection';
import { ApprovedAwardProjection } from '@/components/commish/ApprovedAwardProjection';
import { getOperationalReconciliation } from '@/lib/finance/operationalReconciliation';
import { ReconciliationChecks } from '@/components/commish/ReconciliationChecks';
import { getSeasonCloseReadiness } from '@/lib/finance/seasonClose';
import { SeasonCloseReadiness } from '@/components/commish/SeasonCloseReadiness';

export const dynamic = 'force-dynamic';

export default async function CommissionerFinancePage() {
  const session = await getCurrentMemberSession();
  if (!session?.member?.capabilities.includes('commissioner')) redirect('/?access=commissioner-required');
  const [snapshot, weeklyProposals, postseasonProposals, awardProjection, reconciliation, seasonClose] = await Promise.all([getCommissionerFinanceSnapshot(), getWeeklyAwardProposals(2026), getPostseasonAwardProposals(2026), getPrivateAwardProjection(2026), getOperationalReconciliation(2026), getSeasonCloseReadiness(2026)]);
  const awardProposals = [...weeklyProposals, ...postseasonProposals];

  return <main className="lcc2-page-shell"><div className="lcc2-page-container">
    <Link href="/commish" className="lcc2-button lcc2-button--secondary"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to Commissioner Hub</Link>
    <header className="mt-8 max-w-3xl"><p className="lcc2-label text-[var(--lcc-brand-primary)]">Commissioner Hub</p><h1 className="mt-2 font-ui text-4xl font-black tracking-[-0.04em] text-[var(--lcc-color-text)] sm:text-5xl">2026 Finance</h1><p className="lcc2-body mt-3">Operational Firestore ledger. All payment totals and statuses are server-derived.</p></header>
    <section className="lcc2-card mt-6 p-5 sm:p-6"><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><p className="lcc2-label">Reconciliation</p><p className="mt-2 font-ui text-xl font-black text-[var(--lcc-color-text)]">{snapshot?.reconciliationStatus ?? 'pending'}</p></div><div><p className="lcc2-label">Restricted VACU Reserve</p><p className="mt-2 font-ui text-xl font-black text-[var(--lcc-color-text)]">${(LCC_RESTRICTED_VACU_RESERVE_CENTS / 100).toFixed(2)}</p><p className="lcc2-body mt-1">Future-season deposits · restricted custody</p></div></div></section>
    <FinanceClient initialSnapshot={snapshot} />
    <AwardReview season={2026} ringExpenseCents={snapshot?.ringExpenseCents ?? 1377} proposals={awardProposals} />
    <ApprovedAwardProjection snapshot={snapshot} projection={awardProjection} />
    <ReconciliationChecks result={reconciliation} />
    <SeasonCloseReadiness readiness={seasonClose} />
  </div></main>;
}
