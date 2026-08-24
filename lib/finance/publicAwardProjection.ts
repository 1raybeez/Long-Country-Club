import { getFirebaseAdminFirestore } from '@/lib/auth/firebaseAdmin';
import { getOwnerById } from '@/lib/ownerRegistry';
import type { PublicAwardProjection, PublicAwardRecord, PublicAwardStatus } from '@/lib/types/operationalFinance';

const PUBLIC_STATUSES = new Set<PublicAwardStatus>(['approved', 'paid']);

export function serializePublicAward(data: Record<string, unknown>): PublicAwardRecord | null {
  const status = data.status as PublicAwardStatus;
  const category = typeof data.category === 'string' ? data.category : null;
  const season = Number(data.season);
  const amountCents = Number(data.amountCents);
  if (!PUBLIC_STATUSES.has(status) || !category || !Number.isInteger(season) || !Number.isInteger(amountCents) || amountCents < 0) return null;
  const ownerId = typeof data.ownerId === 'string' ? data.ownerId : null;
  const owner = ownerId ? getOwnerById(ownerId) : undefined;
  return { season, category, week: Number.isInteger(data.week) ? Number(data.week) : null, ownerId: owner ? owner.ownerId : null, displayName: owner?.displayName ?? 'Award recipient unavailable', teamName: owner?.teamName ?? 'Team unavailable', amountCents, status };
}

export function buildPublicAwardProjection(awards: readonly PublicAwardRecord[]): PublicAwardProjection {
  const approved = awards.filter((award) => award.status === 'approved');
  const paid = awards.filter((award) => award.status === 'paid');
  const sum = (items: readonly PublicAwardRecord[]) => items.reduce((total, award) => total + award.amountCents, 0);
  return { awards, approvedAwardCount: approved.length, paidAwardCount: paid.length, approvedOutstandingAmountCents: sum(approved), paidAwardAmountCents: sum(paid), confirmedAwardAmountCents: sum(approved) + sum(paid) };
}

export async function getPublicAwardProjection(season: number): Promise<PublicAwardProjection> {
  const db = getFirebaseAdminFirestore();
  if (!db) return buildPublicAwardProjection([]);
  const snapshot = await db.collection('financeSeasons').doc(String(season)).collection('awards').get();
  const awards = snapshot.docs.map((doc) => serializePublicAward(doc.data())).filter((award): award is PublicAwardRecord => Boolean(award));
  return buildPublicAwardProjection(awards);
}
