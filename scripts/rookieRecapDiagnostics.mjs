import fs from 'node:fs';

const recapPath = 'data/current/draft-intelligence/2026-recap-draft.json';
const intelligencePath = 'data/current/draft-intelligence/2026.json';
const recap = JSON.parse(fs.readFileSync(recapPath, 'utf8'));
const intelligence = JSON.parse(fs.readFileSync(intelligencePath, 'utf8'));
const checks = {};
const check = (name, value) => { checks[name] = Boolean(value); };
const owners = recap.teamReportCards;
const lockedOwners = intelligence.ownerGrades;
const lockedByName = new Map(lockedOwners.map((owner) => [owner.ownerName, owner]));
const gradeOrder = [...owners].sort((a, b) => a.draftGradeRank - b.draftGradeRank).map((owner) => owner.owner);
check('correct2026Artifact', recapPath.endsWith('/2026-recap-draft.json') && recap.season === 2026);
check('publicationStatus', recap.publicationStatus === 'PUBLIC');
check('exactly12OwnerCards', owners.length === 12 && new Set(owners.map((owner) => owner.owner)).size === 12);
check('gradeOrderingMatchesLockedArtifact', owners.every((owner) => lockedByName.get(owner.owner)?.draftGradeRank === owner.draftGradeRank) && gradeOrder.join('|') === [...lockedOwners].sort((a, b) => a.draftGradeRank - b.draftGradeRank).map((owner) => owner.ownerName).join('|'));
check('gradesPreserved', owners.every((owner) => lockedByName.get(owner.owner)?.provisionalLetterGrade === owner.grade));
check('earlDraftGrade1', owners.find((owner) => owner.owner === 'Earl Perkins')?.draftGradeRank === 1);
const lockedEfficiency = Object.values(intelligence.ownerMarketEfficiency);
check('tyroneMarketEfficiency1', owners.find((owner) => owner.owner === 'Tyrone Poist')?.marketEfficiencyRank === 1 && lockedEfficiency.sort((a, b) => b.efficiencyPerCapital - a.efficiencyPerCapital)[0]?.ownerName === 'Tyrone Poist');
const efficiencyOrder = lockedEfficiency.sort((a, b) => b.efficiencyPerCapital - a.efficiencyPerCapital).map((owner) => owner.ownerName);
check('all12MarketEfficiencyRanksAvailable', efficiencyOrder.length === 12 && owners.every((owner) => efficiencyOrder.includes(owner.owner)));
check('marketEfficiencyOrderingLocked', efficiencyOrder.join('|') === 'Tyrone Poist|Earl Perkins|Ben Isbell|Jeffrey Hudgins|Keith Winder|Mike McBurnie|Bill Gross|Ray Long|Loren Michaels|Mike Estes|Anthony Martinez|Rob Jenkins');
check('earlMarketEfficiency2', efficiencyOrder[1] === 'Earl Perkins');
check('robMarketEfficiency12', efficiencyOrder[11] === 'Rob Jenkins');
check('tyroneClassImpact1', owners.find((owner) => owner.owner === 'Tyrone Poist')?.classImpactRank === 1);
check('rayRanksPreserved', owners.find((owner) => owner.owner === 'Ray Long')?.draftGradeRank === 8 && owners.find((owner) => owner.owner === 'Ray Long')?.classImpactRank === 3);
check('valuesPreserved', JSON.stringify(recap.valueLeaderboard.entries.map((entry) => [entry.player, entry.delta])) === JSON.stringify([['Adam Randall', 7], ['Max Klare', 5], ['Emmett Johnson', 4], ['Elijah Sarratt', 3], ['Brenen Thompson', 3], ['Denzel Boston', 3], ['Demond Claiborne', 2], ['Antonio Williams', 2]]));
check('reachesPreserved', JSON.stringify(recap.reachLeaderboard.entries.map((entry) => [entry.player, entry.delta])) === JSON.stringify([['Jack Endries', -11], ['Roman Hemby', -11], ['Zavion Thomas', -10], ['Cade Klubnik', -10], ['Garrett Nussmeier', -10], ['Jam Miller', -8]]));
const keithCard = owners.find((owner) => owner.owner === 'Keith Winder');
check('noStaleNussmeierOpportunityCost', keithCard?.copy.includes('no numeric same-position Opportunity Cost claim attached to that pick') && !keithCard.copy.includes('Mike Washington Jr.'));
check('exactly8PublicAwards', recap.awards.length === 8);
check('noWithheldAwardsRendered', !('withheldAwards' in recap) && !recap.awards.some((award) => /NONE|WITHHELD/i.test(JSON.stringify(award))));
check('wrRunPicks12to17', JSON.stringify(recap.wrRun.picks.map((pick) => pick.pick)) === JSON.stringify([12, 13, 14, 15, 16, 17]));
check('receiptsSavedFutureRegradePresent', recap.futureRegrade.includes('permanent historical checkpoint') && recap.futureRegrade.includes('three years later'));
check('noLiveMarketRuntimeFetch', !fs.readFileSync('components/drafts/RookieDraftRecap.tsx', 'utf8').includes('fetch('));
check('frozenCheckpointArtifact', fs.readFileSync('components/drafts/RookieDraftRecap.tsx', 'utf8').includes("@/data/current/draft-intelligence/2026-recap-draft.json"));
check('routePresent', fs.existsSync('app/league-info/drafts/2026-recap/page.tsx'));
const recapComponent = fs.readFileSync('components/drafts/RookieDraftRecap.tsx', 'utf8');
check('all48SelectionsRepresented', intelligence.picks.length === 48 && (recapComponent.match(/<PickList owner=\{card\.owner\} \/>/g) ?? []).length === 1 && recapComponent.includes('intelligence.picks.filter'));
check('noDuplicatePickRendering', new Set(intelligence.picks.map((pick) => pick.actualOverallPick)).size === intelligence.picks.length);
check('noDevelopmentTermsInReaderFacingComponent', !/N2\.\d|approved artifact|source artifact|publication status|diagnostic/i.test(recapComponent));
check('awardWinnersUnchanged', JSON.stringify(recap.awards.map((award) => [award.award, award.winner, award.runnerUp])) === JSON.stringify([
  ['🏆 Draft Champion', 'Earl Perkins', 'Ben Isbell'],
  ['🚀 Best Pick', 'Adam Randall / Ben Isbell', 'Max Klare / Tyrone Poist'],
  ['📈 Best Draft Capital Usage', 'Tyrone Poist', 'Earl Perkins'],
  ['💥 Best Class Impact', 'Tyrone Poist', 'Earl Perkins'],
  ['😬 Biggest Reach', 'Jack Endries / Loren Michaels and Roman Hemby / Ray Long', null],
  ['🏃 WR Run Winner', 'Denzel Boston / Ray Long', null],
  ['🧾 The Receipt', 'Zavion Thomas / Rob Jenkins', null],
  ['😴 Most Boringly Competent Draft', 'Bill Gross', null],
]));
check('publicAwardCopyHasNoEngineJargon', !recapComponent.includes('capital-weighted result') && !recapComponent.includes('approved roast hook'));
check('responsiveHeroAndQuickReadBreakpoints', recapComponent.includes('grid-cols-2 gap-3 lg:grid-cols-4') && recapComponent.includes('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5'));
check('earlCopyFinalWording', owners.find((owner) => owner.owner === 'Earl Perkins')?.copy.includes('Three picks do not earn a top grade just by avoiding mistakes'));
const passed = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ status: passed ? 'PASS' : 'FAIL', checks, recapPath, publicAwardCount: recap.awards.length }, null, 2));
if (!passed) process.exit(1);
