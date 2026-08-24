import resourceData from '@/data/resources/league-resources.json';

export type ResourceType = 'Free' | 'Freemium' | 'Premium';
export type ResourceGroupId = 'podcasts' | 'websites' | 'analyzers';

export type LeagueResource = {
  id: string;
  name: string;
  description: string;
  url: string;
  type: ResourceType;
};

export type LeagueResourceGroup = {
  id: ResourceGroupId;
  label: string;
  resources: readonly LeagueResource[];
};

export const LEAGUE_RESOURCE_GROUPS = resourceData.groups as readonly LeagueResourceGroup[];
export const LEAGUE_RESOURCES = LEAGUE_RESOURCE_GROUPS.flatMap((group) => group.resources);

const DRAFT_RESEARCH_IDS = ['fantasy-footballers', 'fantasy-pros', 'sleeper-blog', 'draft-sharks', 'fantasy-life'];
const DRAFT_TOOL_IDS = ['fantasy-pros-trade', 'keeptradecut', 'walterpicks', 'fantasycalc'];

function resourcesByIds(ids: readonly string[]) {
  return ids.map((id) => LEAGUE_RESOURCES.find((resource) => resource.id === id)).filter((resource): resource is LeagueResource => Boolean(resource));
}

export function getDraftResearchResources() {
  return resourcesByIds(DRAFT_RESEARCH_IDS);
}

export function getDraftToolResources() {
  return resourcesByIds(DRAFT_TOOL_IDS);
}
