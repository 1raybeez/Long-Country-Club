import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const archiveRoot = path.join(projectRoot, 'data', 'history', 'matchups', 'sleeper');
const backendRoot = path.join(projectRoot, '.firebase', 'long-country-club-ffl', 'functions');
const traceFile = path.join(projectRoot, '.next', 'server', 'app', 'league-info', 'records', 'page.js.nft.json');

function filesUnder(root, relative = '') {
  const current = path.join(root, relative);
  if (!fs.existsSync(current)) return [];
  const entries = fs.readdirSync(current, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const child = path.join(relative, entry.name);
    return entry.isDirectory() ? filesUnder(root, child) : [child];
  });
}

const archiveFiles = filesUnder(archiveRoot).sort();
const traceFiles = fs.existsSync(traceFile) ? JSON.parse(fs.readFileSync(traceFile, 'utf8')).files ?? [] : [];
const tracedArchiveFiles = archiveFiles.filter((relative) =>
  traceFiles.some((traced) => traced.endsWith(`/data/history/matchups/sleeper/${relative}`)),
);
const packagedArchiveRoot = path.join(backendRoot, 'data', 'history', 'matchups', 'sleeper');
const packagedFiles = filesUnder(packagedArchiveRoot).sort();
const missingBackendFiles = archiveFiles.filter((relative) => !packagedFiles.includes(relative));
const unexpectedBackendFiles = packagedFiles.filter((relative) => !archiveFiles.includes(relative));

console.log(`canonical matchup files: ${archiveFiles.length}`);
console.log(`Next trace matchup files: ${tracedArchiveFiles.length}`);
console.log(`generated backend matchup files: ${packagedFiles.length}`);
console.log(`missing generated backend matchup files: ${missingBackendFiles.length}`);
console.log(`unexpected generated backend matchup files: ${unexpectedBackendFiles.length}`);

if (archiveFiles.length === 0) {
  console.error('FAIL: canonical matchup archive is empty or unavailable');
  process.exit(1);
}

if (!fs.existsSync(backendRoot)) {
  console.error('FAIL: generated Firebase backend package is unavailable');
  process.exit(1);
}

if (tracedArchiveFiles.length !== archiveFiles.length) {
  console.error('FAIL: Next trace does not contain the complete canonical matchup archive');
  process.exit(1);
}

if (missingBackendFiles.length > 0) {
  console.error('FAIL: canonical matchup files are missing from the generated backend package');
  process.exit(1);
}

if (unexpectedBackendFiles.length > 0) {
  console.error('FAIL: generated backend contains unexpected matchup files');
  process.exit(1);
}

const representativeFiles = [
  'players.json',
  '2019/rosters.json',
  '2019/week-01.json',
  '2019/winners-bracket.json',
];
for (const relative of representativeFiles) {
  if (!fs.existsSync(path.join(backendRoot, 'data', 'history', 'matchups', 'sleeper', relative))) {
    console.error(`FAIL: representative packaged matchup file missing: ${relative}`);
    process.exit(1);
  }
}

console.log('PASS: generated backend contains the complete canonical matchup archive');
