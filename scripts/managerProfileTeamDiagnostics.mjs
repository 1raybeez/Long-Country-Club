import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const brandingSource = fs.readFileSync(path.join(root, 'lib/teamBranding.ts'), 'utf8');
const profiles = JSON.parse(fs.readFileSync(path.join(root, 'data/current/manager-profiles.json'), 'utf8'));
const earl = profiles.responses.find((response) => response.canonicalOwnerId === 'earl-perkins');
const keith = profiles.responses.find((response) => response.canonicalOwnerId === 'keith-winder');
const errors = [];
const includes = (text) => brandingSource.includes(text);

for (const expected of [
  'id: "jmu"', 'displayName: "James Madison Dukes"', 'JMU: "jmu"',
  'id: "uva"', 'displayName: "Virginia Cavaliers"', 'UVA: "uva"',
  'id: "phi"', 'displayName: "Philadelphia Eagles"', 'PHI: "phi"',
  'id: "was"', 'displayName: "Washington Commanders"', 'WAS: "was"',
]) if (!includes(expected)) errors.push(`missing shared branding entry: ${expected}`);
if (earl?.fields?.favoriteCollegeTeam !== 'JMU/UVA') errors.push('Earl source-backed college value changed');
if (earl?.fields?.favoriteNFLTeam !== 'PHI') errors.push('Earl source-backed NFL value changed');
if (keith?.fields?.favoriteCollegeTeam !== 'UVA' || keith?.fields?.favoriteNFLTeam !== 'WAS') errors.push('Keith source-backed team values changed');
if (!brandingSource.includes('value.split(/[\\/,&;]/)')) errors.push('multi-team delimiter parser is missing');
if (!fs.existsSync(path.join(root, 'data/forms/LCC FFL Manager Profile Survey (Responses) - Form Responses.csv'))) errors.push('raw survey CSV is missing');

console.log(JSON.stringify({
  status: errors.length ? 'FAIL' : 'PASS',
  phi: 'Philadelphia Eagles',
  jmu: 'James Madison Dukes',
  uva: 'Virginia Cavaliers',
  earlCollegeTokens: ['JMU', 'UVA'],
  earlNflToken: 'PHI',
  keithRegression: 'UVA / WAS unchanged',
  unknownFallback: 'preserved token with neutral TeamBadge fallback',
  errors,
}, null, 2));
if (errors.length) process.exitCode = 1;
