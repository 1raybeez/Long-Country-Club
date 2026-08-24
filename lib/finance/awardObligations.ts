import { getFinancialRules } from '@/lib/financeRules';
import type { OperationalAwardCategory } from '@/lib/types/awardObligation';

function dollarsToCents(value: number | null, label: string): number {
  if (value === null || !Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative whole-dollar amount`);
  }
  return value * 100;
}

export function getAwardObligationId(
  season: number,
  category: OperationalAwardCategory,
  week?: number,
): string {
  if (!Number.isInteger(season) || season < 2000) throw new Error('season must be a valid year');
  if (category === 'weekly-high') {
    const maxWeek = getFinancialRules().regularSeasonWeeks;
    if (maxWeek === null) throw new Error('regular-season week count is not configured');
    if (typeof week !== 'number' || !Number.isInteger(week) || week < 1 || week > maxWeek) {
      throw new Error(`weekly-high week must be between 1 and ${maxWeek}`);
    }
    const validatedWeek = week as number;
    return `${season}-weekly-high-${String(validatedWeek).padStart(2, '0')}`;
  }
  if (week !== undefined) throw new Error(`${category} cannot include a week`);
  return `${season}-${category}`;
}

export interface ChampionAllocationContext {
  readonly championBaseCents: number;
  readonly ringReserveMaxCents: number;
  readonly actualRingExpenseCents: number;
}

export function calculateChampionAllocationCents(context: ChampionAllocationContext): number {
  const values = Object.values(context);
  if (values.some((value) => !Number.isInteger(value) || value < 0)) {
    throw new Error('champion allocation inputs must be non-negative integer cents');
  }
  const unusedRingReserve = Math.max(0, context.ringReserveMaxCents - context.actualRingExpenseCents);
  return context.championBaseCents + Math.min(context.ringReserveMaxCents, unusedRingReserve);
}

export function getAwardAmountCents(
  category: OperationalAwardCategory,
  championContext?: ChampionAllocationContext,
): number {
  const rules = getFinancialRules();
  switch (category) {
    case 'weekly-high': return dollarsToCents(rules.weeklyHighPayout, 'weekly high payout');
    case 'fourth-place': return dollarsToCents(rules.playoffPayouts.fourthPlace, 'fourth-place payout');
    case 'third-place': return dollarsToCents(rules.playoffPayouts.thirdPlace, 'third-place payout');
    case 'runner-up': return dollarsToCents(rules.playoffPayouts.runnerUp, 'runner-up payout');
    case 'champion':
      if (!championContext) throw new Error('champion amount requires ring context');
      return calculateChampionAllocationCents({
        ...championContext,
        championBaseCents: dollarsToCents(rules.playoffPayouts.championBase, 'champion base payout'),
      });
  }
}
