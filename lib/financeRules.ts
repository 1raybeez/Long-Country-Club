import type { SeasonFinancialRules } from './types/financial';

/**
 * Application-readable representation of the current Constitution financial
 * rules. The Constitution remains the human-readable authority.
 */
export const LCC_CURRENT_FINANCIAL_RULES: SeasonFinancialRules = {
  entryFee: 50,
  newOwnerFee: 75,
  futureDeposit: 25,
  weeklyHighPayout: 10,
  regularSeasonWeeks: 14,
  playoffPayouts: {
    championBase: 205,
    runnerUp: 100,
    thirdPlace: 50,
    fourthPlace: 25,
  },
  ringReserve: 80,
  actualRingCost: null,
};

/** Restricted custody reserve in cents; not ordinary operating cash or owner dues. */
export const LCC_RESTRICTED_VACU_RESERVE_CENTS = 30000;

export function getFinancialRules(): SeasonFinancialRules {
  return LCC_CURRENT_FINANCIAL_RULES;
}
