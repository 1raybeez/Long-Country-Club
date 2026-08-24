import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdminFirestore } from './auth/firebaseAdmin';
import {
  canReviewFeedback,
  canSubmitFeedback,
  validateFeedbackInput,
  validateFeedbackQueueUpdate,
  type FeedbackSubmissionInput,
} from './feedback';
import type { LccMemberIdentity } from './auth/types';
import { parseFeedbackQueueRecord, type FeedbackQueueItem } from './feedbackQueue';

export interface FeedbackQueueResult {
  readonly items: readonly FeedbackQueueItem[];
  readonly malformedCount: number;
  readonly storageAvailable: boolean;
}

async function requireCommissioner() {
  const { getCurrentMemberSession } = await import('./auth/session');
  const session = await getCurrentMemberSession();
  if (!session?.member || !canReviewFeedback(session.member)) throw new Error('Commissioner authorization required.');
  return session.member;
}

export async function createFeedbackSubmission(value: unknown, member: LccMemberIdentity | null) {
  if (!canSubmitFeedback(member)) {
    throw new Error('Active LCC member authorization required.');
  }

  const validation = validateFeedbackInput(value);
  if (validation.ok === false) {
    throw new Error(`Invalid feedback submission: ${validation.errors.join(', ')}`);
  }

  const db = getFirebaseAdminFirestore();
  if (!db) throw new Error('Feedback storage is unavailable.');

  const reference = db.collection('site_feedback').doc();
  const now = FieldValue.serverTimestamp();
  await reference.create({
    id: reference.id,
    ...validation.input,
    submitterOwnerId: member.ownerId,
    submitterDisplayName: member.displayName,
    submitterTeamName: member.teamName,
    status: 'OPEN',
    createdAt: now,
    updatedAt: now,
  });

  return { id: reference.id, status: 'OPEN' as const };
}

export async function getCommissionerFeedbackQueue(): Promise<FeedbackQueueResult> {
  await requireCommissioner();
  const db = getFirebaseAdminFirestore();
  if (!db) return { items: [], malformedCount: 0, storageAvailable: false };

  const snapshot = await db.collection('site_feedback').get();
  let malformedCount = 0;
  const items: FeedbackQueueItem[] = [];
  snapshot.docs.forEach((document) => {
    const item = parseFeedbackQueueRecord(document.id, document.data());
    if (!item) malformedCount += 1;
    else items.push(item);
  });
  items.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id.localeCompare(a.id));
  return { items, malformedCount, storageAvailable: true };
}

export async function updateCommissionerFeedback(feedbackId: string, value: unknown) {
  const member = await requireCommissioner();
  if (!/^[A-Za-z0-9_-]{1,150}$/.test(feedbackId)) throw new Error('Invalid feedback ID.');
  const validation = validateFeedbackQueueUpdate(value);
  if (validation.ok === false) throw new Error(`Invalid feedback update: ${validation.errors.join(', ')}`);

  const db = getFirebaseAdminFirestore();
  if (!db) throw new Error('Feedback storage is unavailable.');
  const reference = db.collection('site_feedback').doc(feedbackId);
  const existing = await reference.get();
  if (!existing.exists) throw new Error('Feedback item not found.');

  const updates: Record<string, unknown> = {
    status: validation.status,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByMemberId: member.memberId,
  };
  if (validation.commissionerNote !== undefined) {
    updates.commissionerNote = validation.commissionerNote
      ? validation.commissionerNote
      : FieldValue.delete();
  }
  await reference.update(updates);
  return { id: feedbackId, status: validation.status };
}

export type { FeedbackSubmissionInput };
