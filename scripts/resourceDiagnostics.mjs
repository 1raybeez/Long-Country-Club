import { readFileSync } from 'node:fs';

const resourceData = JSON.parse(readFileSync(new URL('../data/resources/league-resources.json', import.meta.url), 'utf8'));
const groups = resourceData.groups;
const resources = groups.flatMap((group) => group.resources);
const ids = resources.map((resource) => resource.id);
const draftResearchIds = ['fantasy-footballers', 'fantasy-pros', 'sleeper-blog', 'draft-sharks', 'fantasy-life'];
const draftToolIds = ['fantasy-pros-trade', 'keeptradecut', 'walterpicks', 'fantasycalc'];

const failures = [];
if (resources.length !== 17) failures.push(`expected 17 resources, found ${resources.length}`);
if (new Set(ids).size !== ids.length) failures.push('resource IDs are not unique');
if (resources.some((resource) => !resource.url)) failures.push('one or more resources have an empty URL');
for (const id of [...draftResearchIds, ...draftToolIds]) {
  if (!ids.includes(id)) failures.push(`draft subset references missing resource ${id}`);
}
if (ids.includes('draft-order') || ids.includes('sleeper-draft-room')) failures.push('draft placeholder destination was added');

if (failures.length > 0) {
  console.error('Resource diagnostics: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Resource diagnostics: PASS');
console.log(`- ${groups.length} categories`);
console.log(`- ${resources.length} unique resources with non-empty URLs`);
console.log(`- ${draftResearchIds.length} draft research resources`);
console.log(`- ${draftToolIds.length} draft tools/analyzers`);
