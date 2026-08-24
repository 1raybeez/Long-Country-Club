import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourceFile = path.join(root, 'data/forms/LCC FFL Manager Profile Survey (Responses) - Form Responses.csv');
const outputFile = path.join(root, 'data/current/manager-profiles.json');
const OWNER_BY_EMAIL = {
  'martinez3lc@gmail.com': 'anthony-martinez',
  'bkwinder78@gmail.com': 'keith-winder',
  'raylong1977@gmail.com': 'ray-long',
  'mestes88@gmail.com': 'mike-estes',
  'cmdrcool79@gmail.com': 'tyrone-poist',
  'robertjenkins567@yahoo.com': 'rob-jenkins',
  'bill.gross@hotmail.com': 'bill-gross',
  'wbisbell@yahoo.com': 'ben-isbell',
  'mcburnie88@gmail.com': 'mike-mcburnie',
  'jeffhudge@gmail.com': 'jeffrey-hudgins',
  'loanranga@gmail.com': 'loren-michaels',
  'earlrperkins81@gmail.com': 'earl-perkins',
};
const RIVAL_BY_ALIAS = {
  Ray: 'ray-long',
  KW: 'keith-winder',
  EP: 'earl-perkins',
  Tyrone: 'tyrone-poist',
  Ben: 'ben-isbell',
  Jeffrey: 'jeffrey-hudgins',
  Bill: 'bill-gross',
  Rob: 'rob-jenkins',
  'Mike E': 'mike-estes',
  'Mike M': 'mike-mcburnie',
};
const FIELD_NAMES = {
  bio: 'Provide a quick bio about yourself (hobbies, profession, fantasy history, etc.)',
  philosophy: "What is your FFL Team's Philosophy? (short answer or quote)",
  mode: 'What mode is your team currently in?',
  favoriteCollegeTeam: 'Favorite College Team (Please use their 2 - 4 letter abbreviation, e.g., VT, UGA, UVA, TEN, MICH, JMU)',
  favoriteNFLTeam: 'What is your favorite NFL Team? (Please use their 2 or 3 letter abbreviation, e.g., DAL, SF, KC)',
  favoritePlayer: 'Who is your favorite NFL Player?',
  rivals: 'Who is your current primary league rival(s)?',
  preferredDraftPosition: 'Which position do you value most highly in the drafts?',
  tradeActivityScale: 'What is your trading activity scale?',
  preferredContactMethods: 'How do you prefer to be contacted for trades or league discussions?',
  draftingStrategy: 'How would you describe your draft and roster management style regarding these specific tactics? [Drafting Strategy (BPA vs. Need)]',
  waiverWireAggression: 'How would you describe your draft and roster management style regarding these specific tactics? [Waiver Wire Aggression]',
  injuryManagement: 'How would you describe your draft and roster management style regarding these specific tactics? [Injury Management (Holding injured players)]',
  trashTalkRating: 'Rate your own trash-talking skills in the league group chat:',
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (character === '"' && next === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') { row.push(field); field = ''; }
    else if (character === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (character !== '\r') field += character;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function value(row, header) { return row[headerIndexes[header]] ?? ''; }
function numberOrNull(raw) { const number = Number(raw); return raw.trim() && Number.isFinite(number) ? number : null; }
function rivalIds(raw) { return raw.split(',').map((value) => value.trim()).filter(Boolean).map((alias) => RIVAL_BY_ALIAS[alias] ?? null).filter(Boolean); }

const rows = parseCsv(fs.readFileSync(sourceFile, 'utf8'));
const headers = rows.shift() ?? [];
const sourceRows = rows.filter((row) => row.some((value) => value.trim()));
const headerIndexes = Object.fromEntries(headers.map((header, index) => [header, index]));
const normalizedRows = sourceRows.map((row, index) => {
  const raw = Object.fromEntries(headers.map((header, headerIndex) => [header, row[headerIndex] ?? '']));
  const email = value(row, 'Email Address').trim().toLowerCase();
  const ownerId = OWNER_BY_EMAIL[email] ?? null;
  const timestamp = value(row, 'Timestamp').trim();
  const fields = {
    bio: value(row, FIELD_NAMES.bio),
    philosophy: value(row, FIELD_NAMES.philosophy),
    mode: value(row, FIELD_NAMES.mode),
    favoriteCollegeTeam: value(row, FIELD_NAMES.favoriteCollegeTeam),
    favoriteNFLTeam: value(row, FIELD_NAMES.favoriteNFLTeam),
    favoritePlayer: value(row, FIELD_NAMES.favoritePlayer),
    rivalOwnerIds: rivalIds(value(row, FIELD_NAMES.rivals)),
    preferredDraftPosition: value(row, FIELD_NAMES.preferredDraftPosition),
    tradeActivityScale: numberOrNull(value(row, FIELD_NAMES.tradeActivityScale)),
    preferredContactMethods: value(row, FIELD_NAMES.preferredContactMethods).split(',').map((method) => method.trim()).filter(Boolean),
    draftingStrategy: value(row, FIELD_NAMES.draftingStrategy),
    waiverWireAggression: value(row, FIELD_NAMES.waiverWireAggression),
    injuryManagement: value(row, FIELD_NAMES.injuryManagement),
    trashTalkRating: numberOrNull(value(row, FIELD_NAMES.trashTalkRating)),
  };
  return {
    sourceRowNumber: index + 2,
    email,
    canonicalOwnerId: ownerId,
    resolvedBy: ownerId ? 'explicit commissioner email mapping' : null,
    responseTimestamp: timestamp,
    responseTimestampIso: Number.isNaN(Date.parse(timestamp)) ? null : new Date(timestamp).toISOString(),
    isNewResponse: true,
    replacesOlderResponse: false,
    populatedFields: Object.entries(raw).filter(([, fieldValue]) => fieldValue.trim()).map(([header]) => header),
    fields,
    rawResponse: raw,
  };
});

const byOwner = new Map();
for (const row of normalizedRows) if (row.canonicalOwnerId) byOwner.set(row.canonicalOwnerId, [...(byOwner.get(row.canonicalOwnerId) ?? []), row]);
for (const [ownerId, ownerRows] of byOwner) ownerRows.forEach((row, index) => { row.isLatestResponse = index === ownerRows.length - 1; });
const output = {
  source: 'data/forms/LCC FFL Manager Profile Survey (Responses) - Form Responses.csv',
  sourceType: 'commissioner-provided raw CSV',
  normalizationVersion: 'manager-profile-survey-v1',
  rawSourceModified: false,
  headers,
  responses: normalizedRows,
};
fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify(output, null, 2)}\n`);
const unmatched = normalizedRows.filter((row) => !row.canonicalOwnerId);
const duplicateOwners = [...byOwner.entries()].filter(([, ownerRows]) => ownerRows.length > 1).map(([ownerId, ownerRows]) => ({ ownerId, responseCount: ownerRows.length }));
console.log(JSON.stringify({ status: unmatched.length ? 'FAIL' : 'PASS', sourceRows: normalizedRows.length, headers: headers.length, matchedOwners: byOwner.size, unmatchedRows: unmatched.map((row) => ({ email: row.email, responseTimestamp: row.responseTimestamp })), duplicateOwners, earlPerkins: normalizedRows.find((row) => row.canonicalOwnerId === 'earl-perkins') ? 'RESOLVED' : 'MISSING', normalizedFile: path.relative(root, outputFile) }, null, 2));
if (unmatched.length) process.exitCode = 1;
