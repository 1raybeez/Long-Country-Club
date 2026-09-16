import { getFirebaseAdminFirestore } from '@/lib/auth/firebaseAdmin';
import { getFinancialRules } from '@/lib/financeRules';
import type { PaymentStatus } from '@/lib/types/financial';

export type WeeklyHighEligibility = 'ELIGIBLE' | 'INELIGIBLE_UNPAID' | 'UNKNOWN';
export interface WeeklyHighEligibilityInput {
  readonly season: number;
  readonly week: number;
  readonly paymentStatus: PaymentStatus | null | undefined;
  readonly paymentEffectiveDate?: string | null;
  readonly firstRegularSeasonKickoff?: string | null;
}

export function evaluateWeeklyHighEligibility(input: WeeklyHighEligibilityInput): WeeklyHighEligibility {
  const policy = getFinancialRules().weeklyHighEligibility;
  if (!policy || input.season < policy.enabledFromSeason) return 'ELIGIBLE';
  if (input.firstRegularSeasonKickoff && input.paymentStatus === 'paid' && input.paymentEffectiveDate) return input.paymentEffectiveDate <= input.firstRegularSeasonKickoff || input.week > 1 ? 'ELIGIBLE' : 'INELIGIBLE_UNPAID';
  if (input.paymentStatus === 'unpaid' && input.firstRegularSeasonKickoff) return 'INELIGIBLE_UNPAID';
  if (input.paymentStatus === 'unpaid') return input.week === 1 ? 'INELIGIBLE_UNPAID' : 'UNKNOWN';
  return 'UNKNOWN';
}

export async function getWeeklyHighEligibility(season: number, franchiseId: string, week: number): Promise<WeeklyHighEligibility> {
  const policy = getFinancialRules().weeklyHighEligibility;
  if (!policy || season < policy.enabledFromSeason) return 'ELIGIBLE';
  const db = getFirebaseAdminFirestore();
  if (!db) return 'UNKNOWN';
  const seasonRef = db.collection('financeSeasons').doc(String(season));
  const [assessmentSnapshot, paymentSnapshot] = await Promise.all([
    seasonRef.collection('assessments').where('ownerId', '==', franchiseId).limit(1).get(),
    seasonRef.collection('payments').where('ownerId', '==', franchiseId).get(),
  ]);
  if (assessmentSnapshot.empty) return 'UNKNOWN';
  const assessed = Number(assessmentSnapshot.docs[0].data().amountCents);
  const payments = paymentSnapshot.docs.map((doc) => doc.data());
  const paid = payments.reduce((sum, payment) => sum + (Number(payment.amountCents) || 0), 0) >= assessed;
  const latestEffectiveDate = payments.map((payment) => typeof payment.effectiveDate === 'string' ? payment.effectiveDate : null).filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
  return evaluateWeeklyHighEligibility({ season, week, paymentStatus: paid ? 'paid' : 'unpaid', paymentEffectiveDate: latestEffectiveDate, firstRegularSeasonKickoff: null });
}
