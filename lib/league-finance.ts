// Legacy compatibility module. New finance code should import the structured
// rules from financeRules.ts instead of maintaining a second source of truth.
import { LCC_CURRENT_FINANCIAL_RULES } from './financeRules';

/** @deprecated Use LCC_CURRENT_FINANCIAL_RULES.entryFee. */
export const LEAGUE_DUES = LCC_CURRENT_FINANCIAL_RULES.entryFee ?? 0;

// Retained for legacy consumers until the old Treasury surface is retired.
export const PAID_MANAGERS = [
  "JD Dowling",
  "Aaron Hawkins",
  "Rashad Gresham",
  "Travis Miller",
  "Stan Schoppe",
  "David Besedich",
  "Jordan Maslyn",
  "Tommy Moore",
  "Doug Fordham",
  "Wade Cameron",
  "Brian Stevens",
  "Ray Long"
];

export const PAYOUTS = {
  highScorer: LCC_CURRENT_FINANCIAL_RULES.weeklyHighPayout ?? 0,
  divisionWinner: LCC_CURRENT_FINANCIAL_RULES.playoffPayouts.fourthPlace ?? 0,
  firstPlace: LCC_CURRENT_FINANCIAL_RULES.playoffPayouts.championBase ?? 0,
  secondPlace: LCC_CURRENT_FINANCIAL_RULES.playoffPayouts.runnerUp ?? 0,
  thirdPlace: LCC_CURRENT_FINANCIAL_RULES.playoffPayouts.thirdPlace ?? 0,
};
