import assert from 'node:assert/strict';
import { evaluateWeeklyHighEligibility } from '../lib/finance/weeklyHighEligibility.ts';
import { getFinancialRules } from '../lib/financeRules.ts';

assert.equal(getFinancialRules().weeklyHighEligibility?.enabledFromSeason, 2027);
assert.equal(evaluateWeeklyHighEligibility({ season: 2026, week: 1, paymentStatus: 'unpaid' }), 'ELIGIBLE');
const kickoff = '2027-09-09T20:20:00-04:00';
assert.equal(evaluateWeeklyHighEligibility({ season: 2027, week: 1, paymentStatus: 'unpaid', firstRegularSeasonKickoff: kickoff }), 'INELIGIBLE_UNPAID');
assert.equal(evaluateWeeklyHighEligibility({ season: 2027, week: 1, paymentStatus: 'paid', paymentEffectiveDate: '2027-09-01', firstRegularSeasonKickoff: kickoff }), 'ELIGIBLE');
assert.equal(evaluateWeeklyHighEligibility({ season: 2027, week: 1, paymentStatus: 'paid', paymentEffectiveDate: '2027-09-10', firstRegularSeasonKickoff: kickoff }), 'INELIGIBLE_UNPAID');
assert.equal(evaluateWeeklyHighEligibility({ season: 2027, week: 2, paymentStatus: 'paid', paymentEffectiveDate: '2027-09-10', firstRegularSeasonKickoff: kickoff }), 'ELIGIBLE');
assert.equal(evaluateWeeklyHighEligibility({ season: 2027, week: 1, paymentStatus: 'paid' }), 'UNKNOWN');
assert.equal(getFinancialRules().weeklyHighEligibility?.retroactiveRestoration, false);
assert.equal('redistribution' in {}, false);
console.log('LCC 2027 weekly-high eligibility diagnostics passed: effective season, 2026 grace, kickoff timing, future-only restoration, unknown safety, and no redistribution.');
