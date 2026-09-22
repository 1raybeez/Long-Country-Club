import type { LccMemberIdentity } from '@/lib/auth/types';

export const COMMISSIONER_CAPABILITY_IDS = [
  'FINANCE',
  'LEGISLATIVE_HUB',
  'SEASON_OPERATIONS',
  'WAR_ROOM',
  'LEAGUE_INTELLIGENCE',
  'OWNER_FEEDBACK',
] as const;

export type CommissionerCapabilityId = (typeof COMMISSIONER_CAPABILITY_IDS)[number];
export type CommissionerHubId = CommissionerCapabilityId | 'SYSTEM_HEALTH';
export type CapabilityAvailability = 'ACTIVE' | 'INACTIVE' | 'COMING_SOON' | 'UNAVAILABLE';
export type CapabilityHealth = 'HEALTHY' | 'NEEDS_ATTENTION' | 'WARNING' | 'ERROR' | 'UNKNOWN';
export type CapabilitySeason = 'IN_SEASON' | 'OFFSEASON' | 'DRAFT' | 'POSTSEASON' | 'SEASON_CLOSE';
export type SeasonalRelevance = CapabilitySeason;
export type CapabilityAction = 'NONE' | 'REVIEW' | 'APPROVE' | 'RESOLVE' | 'OPEN';
export type HumanAction = CapabilityAction;
export type AttentionAction = Exclude<CapabilityAction, 'NONE'>;
export type AttentionSeverity = 'INFO' | 'WARNING' | 'ERROR';

export interface AttentionItem {
  readonly id: string;
  readonly sourceCapability: CommissionerHubId;
  readonly severity: AttentionSeverity;
  readonly title: string;
  readonly description: string;
  readonly actionType: AttentionAction;
  readonly ctaLabel: string;
  readonly destination: string | null;
  readonly amount?: number;
  readonly count?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface OperationalBlocker {
  readonly code: string;
  readonly id: string;
  readonly sourceCapability: CommissionerHubId;
  readonly title: string;
  readonly description: string;
  readonly severity: AttentionSeverity;
  readonly state: 'ACTIVE' | 'CLEARED' | 'UNKNOWN';
  readonly affects: readonly string[];
  readonly requiresHumanAction: boolean;
  readonly destination?: string | null;
}

export interface WeeklyOperations {
  readonly season: number;
  readonly week: number | null;
  readonly lifecycle: string;
  readonly phase: SeasonalRelevance;
  readonly freshness: string | null;
  readonly matchupState: string | null;
  readonly latestSafelyCompletedWeek: number | null;
  readonly finalizationState: string | null;
  readonly awardState: string | null;
  readonly standingsState: string | null;
  readonly rankingsState: string | null;
  readonly predictorState: string | null;
  readonly automationHealth: string | null;
  readonly sourceSnapshot?: unknown;
  readonly finalityState: 'FINAL' | 'IN_PROGRESS' | 'UPCOMING' | 'UNKNOWN';
  readonly weeklyHighState: 'FINAL' | 'PROVISIONAL' | 'ACTION_REQUIRED' | 'UNAVAILABLE';
  readonly recapState: 'PUBLISHED' | 'PARTIAL' | 'UNAVAILABLE';
  readonly automationState: 'SOURCE_DRIVEN' | 'UNKNOWN';
  readonly postseasonState: 'ACTIVE' | 'INACTIVE' | 'UNRESOLVED' | 'UNKNOWN';
  readonly blockers: readonly OperationalBlocker[];
}

export interface CommissionerCapability {
  readonly id: CommissionerCapabilityId;
  readonly label: string;
  readonly availability: CapabilityAvailability;
  readonly health: CapabilityHealth;
  readonly seasonalRelevance: SeasonalRelevance;
  readonly humanAction: HumanAction;
  readonly route: string | null;
  readonly visibility: 'VISIBLE' | 'HIDDEN';
  readonly attentionCount?: number;
  readonly statusText?: string | null;
  readonly permissionKey?: keyof CommissionerHubPermissions;
  readonly description: string;
}

export interface LeagueIntelligenceProduct {
  readonly id: string;
  readonly label: string;
  readonly availability: CapabilityAvailability;
  readonly health: CapabilityHealth;
  readonly seasonalRelevance: SeasonalRelevance;
  readonly humanAction: HumanAction;
  readonly workflowState: 'AUTOMATED' | 'PUBLISHED' | 'ARCHIVE_ONLY' | 'SUPPORTED' | 'NOT_IMPLEMENTED';
  readonly publicationState: string | null;
  readonly route: string | null;
  readonly commissionerRoute?: string | null;
  readonly statusText?: string | null;
  readonly description: string;
}

export interface SystemHealthSummary {
  readonly overallHealth: CapabilityHealth;
  readonly sourceFreshness: string | null;
  readonly automationScheduler: string | null;
  readonly providerRuntime: string | null;
  readonly authIdentityDiagnostics: string | null;
  readonly finalizationDiagnostics: string | null;
  readonly issueCount: number;
  readonly destination: string | null;
  readonly availability: CapabilityAvailability;
  readonly health: CapabilityHealth;
  readonly authentication: 'AVAILABLE' | 'UNKNOWN';
  readonly providerState: 'AVAILABLE' | 'UNKNOWN';
  readonly reconciliationState: 'AVAILABLE' | 'BLOCKED' | 'UNKNOWN';
  readonly automationState: 'SOURCE_DRIVEN' | 'UNKNOWN';
  readonly blockers: readonly OperationalBlocker[];
}

export interface CommissionerHubModel {
  readonly leagueIdentity: {
    readonly name: string;
    readonly season: number;
    readonly provider: string;
    readonly teamCount: number;
    readonly member: LccMemberIdentity | null;
  };
  readonly permissions: CommissionerHubPermissions;
  readonly attentionItems: readonly AttentionItem[];
  readonly weeklyOperations: WeeklyOperations;
  readonly capabilities: readonly CommissionerCapability[];
  readonly leagueSpecificCapabilities: readonly CommissionerCapability[];
  readonly inactiveCapabilities: readonly LeagueIntelligenceProduct[];
  readonly leagueIntelligenceProducts: readonly LeagueIntelligenceProduct[];
  readonly systemHealthSummary: SystemHealthSummary;
}

export interface CommissionerHubPermissions {
    readonly authenticated: boolean;
    readonly commissioner: boolean;
    readonly warRoom: boolean;
    readonly warRoomScope: string | null;
}
