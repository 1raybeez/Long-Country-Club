import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const routePath = 'app/war-room/page.tsx';
const headerPath = 'components/site/SiteHeader.tsx';
const route = fs.readFileSync(routePath, 'utf8');
const header = fs.readFileSync(headerPath, 'utf8');
const failures = [];

if (!route.includes('getCurrentMemberSession')) failures.push('War Room route does not resolve the server session');
if (!route.includes("hasCapability(member, 'war-room')")) failures.push('War Room route does not enforce war-room capability');
if (!route.includes("redirect('/?access=war-room-required')")) failures.push('War Room route does not fail closed');
if (/searchParams|params\b|ownerId.*search|search.*ownerId/.test(route)) failures.push('War Room route contains a browser-controlled owner selector');
if (!route.includes('getOwnerById(member.ownerId)')) failures.push('War Room route does not resolve canonical owner data');
if (!header.includes('capabilities.includes("war-room")') || !header.includes('href="/war-room"')) failures.push('SiteHeader lacks capability-gated My War Room navigation');
if (!header.includes('capabilities.includes("commissioner")')) failures.push('Commissioner menu capability gate was removed');

const envText = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';
const directoryMatch = envText.match(/^LCC_MEMBER_DIRECTORY_JSON='(.*)'$/m);
let members = {};
try {
  members = directoryMatch ? JSON.parse(directoryMatch[1]) : {};
} catch {
  failures.push('local member directory JSON is invalid');
}
const memberEntries = Object.values(members);
if (memberEntries.length !== 12) failures.push(`expected 12 configured members, found ${memberEntries.length}`);
if (memberEntries.some((member) => !member.capabilities?.includes('war-room'))) failures.push('one or more configured members lack war-room capability');
const commissioner = memberEntries.find((member) => member.capabilities?.includes('commissioner'));
if (!commissioner?.capabilities?.includes('war-room')) failures.push('commissioner does not retain commissioner plus war-room capabilities');

const ignored = spawnSync('git', ['check-ignore', '-q', '.env.local']).status === 0;
if (!ignored) failures.push('.env.local is not ignored');
if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(route) || /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(header)) failures.push('route/header source contains email-like data');

if (failures.length) {
  console.error('War Room auth diagnostics: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('War Room auth diagnostics: PASS');
console.log('- protected server route with canonical owner resolution');
console.log('- 12 configured members have war-room capability');
console.log('- commissioner retains commissioner plus war-room capabilities');
console.log('- no owner selector or email data in route/header source');
console.log('- local member directory remains ignored');
