import fs from 'node:fs';

const artifactPath = 'data/current/draft-intelligence/2026.json';
const capitalPath = 'data/source/nfl-draft-2026-skill-position-capital.json';
const marketManifestPath = 'data/source/market/dynasty-rookie/2026/source-manifest.json';
const rosterEvidencePath = 'data/source/sleeper-2026-roster-reconstruction-evidence.json';

const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const capital = JSON.parse(fs.readFileSync(capitalPath, 'utf8'));
const marketManifest = JSON.parse(fs.readFileSync(marketManifestPath, 'utf8'));
const rosterEvidence = JSON.parse(fs.readFileSync(rosterEvidencePath, 'utf8'));
const capitalByName = new Map(capital.records.map((record) => [record.playerName, record]));

if (artifact.picks.length !== capital.coverage.lccPicks) {
  throw new Error(`Expected ${capital.coverage.lccPicks} artifact picks; found ${artifact.picks.length}`);
}

for (const pick of artifact.picks) {
  const record = capitalByName.get(pick.playerName);
  if (!record) throw new Error(`Missing capital record for ${pick.playerName}`);

  // A1's sequential marketRank values were placeholders, not source evidence.
  pick.marketRank = null;
  pick.marketEvidenceStatus = 'BLOCKED';
  pick.nflDraftCapital = {
    round: record.round,
    overallPick: record.overallPick,
    source: record.round === null ? capital.sourceUrl : capital.sourceUrl,
    status: record.round === null ? 'RESOLVED_UNDRAFTED' : 'RESOLVED'
  };
}

artifact.schemaVersion = 2;
artifact.methodologyVersion = 'rookie-draft-intelligence-slice-a2-v1';
artifact.generatedAt = '2026-08-26T00:00:00.000Z';
artifact.marketAtDraft = {
  sourceManifest: marketManifestPath,
  cutoffSafePrimarySource: marketManifest.marketDecision.cutoffSafePrimarySource,
  consensusReady: marketManifest.marketDecision.consensusReady,
  gradingReady: marketManifest.marketDecision.gradingReady,
  supportingSourceCount: marketManifest.sources.filter((source) => source.status === 'SECONDARY_PARTIAL').length,
  status: 'BLOCKED',
  reason: marketManifest.marketDecision.reason
};
artifact.currentMarketReference = artifact.marketReference;
artifact.nflDraftCapital = {
  sourceReference: capitalPath,
  source: capital.source,
  coverage: capital.coverage,
  status: capital.coverage.status
};
artifact.rosterEvidence = {
  preDraft: {
    coverage: rosterEvidence.reconstructionResult.ownersCovered,
    source: rosterEvidencePath,
    confidence: rosterEvidence.reconstructionResult.confidence,
    status: rosterEvidence.reconstructionResult.status
  },
  postDraft: {
    coverage: 0,
    source: null,
    confidence: 'NONE',
    status: 'BLOCKED_NO_TIMESTAMPED_BOUNDARY_SNAPSHOT'
  },
  currentRosterExcluded: true,
  reason: 'The reconstruction is diagnostic-only because the baseline boundary is unknown and transaction replay has material ownership mismatches.'
};
artifact.sourceGaps = [
  'No cutoff-safe full-coverage 1QB market snapshot or consensus exists.',
  'The registered Fantasy Orphans market snapshot is 82 days after draft start and explicitly POST_DRAFT_PRESEASON.',
  'Only partial dated supporting market sources were found; no market tiers are approved.',
  'Pre-draft roster reconstruction is diagnostic-only because the 2025 baseline timestamp is unknown and replay has 25 ownership-mismatch anomalies.',
  'No timestamped immediate post-draft 2026 roster snapshot is available.',
  'Four LCC selections were undrafted in the NFL; their capital is explicitly represented as null/RESOLVED_UNDRAFTED.',
  'The player registry is current and not cutoff-safe for role/team context.'
];

fs.writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
