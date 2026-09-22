import fs from 'node:fs';

const hub = fs.readFileSync('app/commish/page.tsx', 'utf8');
const queue = fs.readFileSync('app/commish/feedback/page.tsx', 'utf8');
const finance = fs.readFileSync('app/commish/finance/page.tsx', 'utf8');
const warRoom = fs.readFileSync('app/war-room/page.tsx', 'utf8');
const feedbackQueue = fs.readFileSync('components/commish/FeedbackQueue.tsx', 'utf8');
const failures = [];

if (!hub.includes('getCurrentMemberSession') || !hub.includes("capabilities.includes('commissioner')")) failures.push('commissioner-route-guard');
if (!hub.includes('href="/commish/feedback"') || !hub.includes('href="/commish/finance"') || !hub.includes('warRoom.route')) failures.push('active-module-links');
if (!hub.includes('getCommissionerHubModel') || !hub.includes('model.attentionItems') || !hub.includes('model.weeklyOperations')) failures.push('normalized-model-consumption');
if (!hub.includes('Post-Draft Intelligence') || !hub.includes('Not active')) failures.push('future-label');
if (hub.includes('href="/commish"') || hub.includes('href="/commish/governance"') || hub.includes('href="/commish/maintenance"')) failures.push('stale-or-self-link');
if (!queue.includes("capabilities.includes('commissioner')") || !finance.includes("capabilities.includes('commissioner')")) failures.push('private-route-guards');
if (!warRoom.includes("hasCapability(member, 'war-room')")) failures.push('war-room-capability');
if (!feedbackQueue.includes('lcc2-body mt-4 font-ui')) failures.push('feedback-message-typography');
if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(hub)) failures.push('email-exposure');
if (/firebaseUid|auth claims|privateKey/i.test(hub)) failures.push('auth-metadata-exposure');

console.log('LCC Commissioner Hub 2.0 Slice D diagnostics');
console.log('Commissioner route guard: ' + (failures.includes('commissioner-route-guard') ? 'FAIL' : 'PASS'));
console.log('Active module links and normalized model: ' + (failures.some((item) => ['active-module-links', 'normalized-model-consumption'].includes(item)) ? 'FAIL' : 'PASS'));
console.log('Future/stale card treatment: ' + (failures.some((item) => ['future-label', 'stale-or-self-link'].includes(item)) ? 'FAIL' : 'PASS'));
console.log('Private route and War Room guards: ' + (failures.some((item) => ['private-route-guards', 'war-room-capability'].includes(item)) ? 'FAIL' : 'PASS'));
console.log('Privacy and feedback-message styling: ' + (failures.some((item) => ['email-exposure', 'auth-metadata-exposure', 'feedback-message-typography'].includes(item)) ? 'FAIL' : 'PASS'));
console.log('Status: ' + (failures.length ? 'FAIL' : 'PASS'));
if (failures.length) {
  console.error('Failures: ' + [...new Set(failures)].join(', '));
  process.exit(1);
}
