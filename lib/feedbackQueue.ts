import {
  FEEDBACK_AREAS,
  FEEDBACK_TYPES,
  normalizeFeedbackQueueStatus,
  sanitizeFeedbackPagePath,
  type FeedbackQueueStatus,
} from './feedback';

export interface FeedbackQueueItem {
  readonly id: string;
  readonly type: 'BUG' | 'SUGGESTION';
  readonly title: string;
  readonly description: string;
  readonly area: string;
  readonly pagePath?: string;
  readonly submitterOwnerId: string;
  readonly submitterDisplayName: string;
  readonly submitterTeamName: string;
  readonly status: FeedbackQueueStatus;
  readonly commissionerNote?: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

function timestampToIso(value: unknown): string | null {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return new Date(value).toISOString();
  return null;
}

export function parseFeedbackQueueRecord(id: string, value: unknown): FeedbackQueueItem | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const type = data.type;
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  const area = data.area;
  const pagePath = data.pagePath === undefined ? undefined : sanitizeFeedbackPagePath(data.pagePath);
  const submitterOwnerId = typeof data.submitterOwnerId === 'string' ? data.submitterOwnerId.trim() : '';
  const submitterDisplayName = typeof data.submitterDisplayName === 'string' ? data.submitterDisplayName.trim() : '';
  const submitterTeamName = typeof data.submitterTeamName === 'string' ? data.submitterTeamName.trim() : '';
  const status = normalizeFeedbackQueueStatus(data.status);
  const createdAt = timestampToIso(data.createdAt);
  const updatedAt = data.updatedAt === undefined ? undefined : timestampToIso(data.updatedAt);
  const commissionerNote = data.commissionerNote === undefined ? undefined : typeof data.commissionerNote === 'string' ? data.commissionerNote : null;

  if (!FEEDBACK_TYPES.includes(type as 'BUG' | 'SUGGESTION') || !title || !description || !FEEDBACK_AREAS.includes(area as typeof FEEDBACK_AREAS[number]) || (data.pagePath !== undefined && !pagePath) || !submitterOwnerId || !submitterDisplayName || !submitterTeamName || !status || !createdAt || (data.updatedAt !== undefined && !updatedAt) || commissionerNote === null || (commissionerNote !== undefined && commissionerNote.length > 2000)) return null;

  return {
    id,
    type: type as 'BUG' | 'SUGGESTION',
    title,
    description,
    area: area as string,
    ...(pagePath ? { pagePath } : {}),
    submitterOwnerId,
    submitterDisplayName,
    submitterTeamName,
    status,
    ...(commissionerNote ? { commissionerNote } : {}),
    createdAt,
    ...(updatedAt ? { updatedAt } : {}),
  };
}
