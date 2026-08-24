import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const season2025 = JSON.parse(fs.readFileSync(path.join(root, 'data/history/financial/2025.json'), 'utf8'));
const season2026 = JSON.parse(fs.readFileSync(path.join(root, 'data/history/financial/2026.json'), 'utf8'));
const earl = season2025.managers.find((manager) => manager.managerId === 'earl-perkins');
const payments = season2025.payments ?? [];
const eventId = '2025-earl-perkins-remaining-dues-2026-08';
const eventMatches = payments.filter((payment) => payment.id === eventId);
const payment = eventMatches[0];
const errors = [];

if (!earl) errors.push('Earl Perkins historical manager record is missing');
if (eventMatches.length !== 1) errors.push(`expected one Earl payment event, found ${eventMatches.length}`);
if (payment?.season !== 2025 || payment?.ownerId !== 'earl-perkins') errors.push('payment event season/owner mismatch');
if (payment?.amount !== 40 || payment?.paymentMethod !== 'PayPal') errors.push('payment amount/method mismatch');
if (payment?.receivedAt !== '2026-08' || payment?.datePrecision !== 'month') errors.push('payment receipt precision must remain August 2026 month-only');
if (payment?.private !== true) errors.push('payment event must remain private');
if (earl?.entryFeePaid !== 10) errors.push('original Earl entryFeePaid value was changed');
if (!earl?.notes?.some((note) => note.includes('Rollover to 2023: -$40'))) errors.push('original Earl source note was not preserved');
if (earl?.duesAssessed !== 50 || earl?.duesPaid !== 50 || earl?.duesBalance !== 0) errors.push('Earl dues closeout totals are incorrect');
if (earl?.paymentStatus !== 'paid' || earl?.paymentDate !== '2026-08' || earl?.paymentMethod !== 'PayPal') errors.push('Earl payment status metadata is incorrect');
if ((earl?.duesAssessed ?? 0) - (earl?.entryFeePaid ?? 0) !== 40) errors.push('Earl pre-closeout balance does not derive to $40');
if (season2026.payments?.some((entry) => entry.ownerId === 'earl-perkins' || entry.season === 2025)) errors.push('2026 operational finance contains an Earl or 2025 payment write');
const forbidden = /late|overdue|delinquent|prior-season debt/i;
if (forbidden.test(JSON.stringify(season2025))) errors.push('forbidden public payment wording was added to historical finance');
const duplicateIds = payments.map((entry) => entry.id).filter((id, index, ids) => ids.indexOf(id) !== index);
if (duplicateIds.length) errors.push(`duplicate historical payment IDs: ${duplicateIds.join(', ')}`);

console.log(JSON.stringify({
  status: errors.length ? 'FAIL' : 'PASS',
  season: 2025,
  ownerId: 'earl-perkins',
  balanceBefore: 40,
  payment: payment ?? null,
  balanceAfter: earl?.duesBalance ?? null,
  paymentStatus: earl?.paymentStatus ?? null,
  '2026OperationalPaymentWrite': false,
  errors,
}, null, 2));
if (errors.length) process.exitCode = 1;
