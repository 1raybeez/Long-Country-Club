import type { LccMemberIdentity } from './auth/types';

export const FEEDBACK_TYPES = ['BUG', 'SUGGESTION'] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_AREAS = [
  'HOME',
  'MATCHUPS',
  'MANAGERS',
  'LEAGUE_INFO',
  'PREDICTOR',
  'WAR_ROOM',
  'PAYOUTS_FINANCE',
  'AUTH_ACCOUNT',
  'MOBILE_RESPONSIVE',
  'OTHER',
] as const;
export type FeedbackArea = (typeof FEEDBACK_AREAS)[number];

export const FEEDBACK_STATUSES = ['OPEN', 'REVIEWING', 'PLANNED', 'RESOLVED', 'DECLINED'] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_QUEUE_STATUSES = ['OPEN', 'PLANNED', 'DONE', 'DECLINED'] as const;
export type FeedbackQueueStatus = (typeof FEEDBACK_QUEUE_STATUSES)[number];

export const FEEDBACK_TITLE_MAX_LENGTH = 160;
export const FEEDBACK_DESCRIPTION_MAX_LENGTH = 5000;
export const FEEDBACK_PAGE_PATH_MAX_LENGTH = 300;

export interface FeedbackSubmissionInput {
  readonly type: FeedbackType;
  readonly title: string;
  readonly description: string;
  readonly area: FeedbackArea;
  readonly pagePath?: string;
}

export interface FeedbackSubmissionRecord extends FeedbackSubmissionInput {
  readonly id: string;
  readonly submitterOwnerId: string;
  readonly submitterDisplayName: string;
  readonly submitterTeamName: string;
  readonly status: 'OPEN';
  readonly createdAt: unknown;
  readonly updatedAt: unknown;
}

export type FeedbackValidationResult =
  | { readonly ok: true; readonly input: FeedbackSubmissionInput }
  | { readonly ok: false; readonly errors: readonly string[] };

export function validateFeedbackInput(value: unknown): FeedbackValidationResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: ['INVALID_BODY'] };
  }

  const body = value as Record<string, unknown>;
  const errors: string[] = [];
  const allowedKeys = new Set(['type', 'title', 'description', 'area', 'pagePath']);
  Object.keys(body).forEach((key) => {
    if (!allowedKeys.has(key)) errors.push(`UNEXPECTED_FIELD:${key}`);
  });

  const type = body.type;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const area = body.area;
  const pagePath = body.pagePath === undefined ? undefined : sanitizeFeedbackPagePath(body.pagePath);

  if (!FEEDBACK_TYPES.includes(type as FeedbackType)) errors.push('INVALID_TYPE');
  if (!title) errors.push('TITLE_REQUIRED');
  if (title.length > FEEDBACK_TITLE_MAX_LENGTH) errors.push('TITLE_TOO_LONG');
  if (!description) errors.push('DESCRIPTION_REQUIRED');
  if (description.length > FEEDBACK_DESCRIPTION_MAX_LENGTH) errors.push('DESCRIPTION_TOO_LONG');
  if (!FEEDBACK_AREAS.includes(area as FeedbackArea)) errors.push('INVALID_AREA');
  if (body.pagePath !== undefined && pagePath === null) errors.push('INVALID_PAGE_PATH');

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    input: {
      type: type as FeedbackType,
      title,
      description,
      area: area as FeedbackArea,
      ...(pagePath ? { pagePath } : {}),
    },
  };
}

export function sanitizeFeedbackPagePath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const path = value.trim();
  if (!path || path.length > FEEDBACK_PAGE_PATH_MAX_LENGTH || !path.startsWith('/') || path.startsWith('//')) return null;
  if (/[\u0000-\u001f\u007f]/.test(path)) return null;
  return path;
}

export function canSubmitFeedback(member: LccMemberIdentity | null): member is LccMemberIdentity {
  return member !== null;
}

export function canReviewFeedback(member: LccMemberIdentity | null): boolean {
  return member?.capabilities.includes('commissioner') ?? false;
}

export function normalizeFeedbackQueueStatus(value: unknown): FeedbackQueueStatus | null {
  if (FEEDBACK_QUEUE_STATUSES.includes(value as FeedbackQueueStatus)) return value as FeedbackQueueStatus;
  if (value === 'RESOLVED') return 'DONE';
  if (value === 'REVIEWING') return 'OPEN';
  return null;
}

export type FeedbackQueueUpdateValidationResult =
  | { readonly ok: true; readonly status: FeedbackQueueStatus; readonly commissionerNote?: string }
  | { readonly ok: false; readonly errors: readonly string[] };

export function validateFeedbackQueueUpdate(value: unknown): FeedbackQueueUpdateValidationResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, errors: ['INVALID_BODY'] };
  const body = value as Record<string, unknown>;
  const errors: string[] = [];
  Object.keys(body).forEach((key) => {
    if (!['status', 'commissionerNote'].includes(key)) errors.push(`IMMUTABLE_OR_UNEXPECTED_FIELD:${key}`);
  });
  const status = normalizeFeedbackQueueStatus(body.status);
  if (!status) errors.push('INVALID_STATUS');
  let commissionerNote: string | undefined;
  if (body.commissionerNote !== undefined) {
    if (typeof body.commissionerNote !== 'string') errors.push('INVALID_NOTE');
    else {
      commissionerNote = body.commissionerNote.trim();
      if (commissionerNote.length > 2000) errors.push('NOTE_TOO_LONG');
    }
  }
  if (errors.length || !status) return { ok: false, errors };
  return { ok: true, status, ...(commissionerNote !== undefined ? { commissionerNote } : {}) };
}
