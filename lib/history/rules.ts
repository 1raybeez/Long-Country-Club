import rulesIndex from '../../data/history/rules/index.json';
import type { RuleRecord } from '../types/rule';

// TODO: Migrate rule changes from constitution revision history and vote sheets.
const RULES = rulesIndex as readonly RuleRecord[];

export function loadAllRules(): readonly RuleRecord[] {
  return RULES;
}

export function loadRulesBySeason(season: number): readonly RuleRecord[] {
  return RULES.filter((rule) => rule.season === season);
}

export function loadRuleById(id: string): RuleRecord | null {
  return RULES.find((rule) => rule.id === id) ?? null;
}
