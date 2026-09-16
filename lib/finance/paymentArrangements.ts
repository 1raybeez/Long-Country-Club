import { FieldValue } from 'firebase-admin/firestore';
import { getCurrentMemberSession } from '@/lib/auth/session';
import { getFirebaseAdminFirestore } from '@/lib/auth/firebaseAdmin';

export type PaymentArrangementStatus = 'NONE' | 'APPROVED';
export interface PaymentArrangement { readonly season: number; readonly ownerId: string; readonly status: PaymentArrangementStatus; readonly settlementTiming?: string; readonly updatedAt?: unknown; readonly updatedByMemberId?: string; }

export async function getPaymentArrangements(season: number): Promise<readonly PaymentArrangement[]> {
  const db = getFirebaseAdminFirestore(); if (!db) return [];
  const snapshot = await db.collection('financeSeasons').doc(String(season)).collection('paymentArrangements').get();
  return snapshot.docs.map((doc) => ({ season, ownerId: doc.id, status: doc.data().status === 'APPROVED' ? 'APPROVED' : 'NONE', settlementTiming: typeof doc.data().settlementTiming === 'string' ? doc.data().settlementTiming : undefined }));
}

async function commissioner() {
  const session = await getCurrentMemberSession();
  if (!session?.member?.capabilities.includes('commissioner')) throw new Error('Commissioner authorization required.');
  return session.member;
}

export async function setPaymentArrangement(input: { season: number; ownerId: string; settlementTiming?: string; note?: string }) {
  const actor = await commissioner(); const db = getFirebaseAdminFirestore();
  if (!db || !Number.isInteger(input.season) || !input.ownerId || (input.note?.length ?? 0) > 500 || (input.settlementTiming?.length ?? 0) > 200) throw new Error('Invalid payment arrangement.');
  await db.collection('financeSeasons').doc(String(input.season)).collection('paymentArrangements').doc(input.ownerId).set({ season: input.season, ownerId: input.ownerId, status: 'APPROVED', settlementTiming: input.settlementTiming?.trim() || null, note: input.note?.trim() || null, updatedAt: FieldValue.serverTimestamp(), updatedByMemberId: actor.memberId, source: 'commissioner-payment-arrangement' });
  return { ok: true, status: 'APPROVED' as const };
}

export async function clearPaymentArrangement(season: number, ownerId: string) {
  await commissioner(); const db = getFirebaseAdminFirestore(); if (!db) throw new Error('Operational finance storage is unavailable.');
  await db.collection('financeSeasons').doc(String(season)).collection('paymentArrangements').doc(ownerId).delete(); return { ok: true, status: 'NONE' as const };
}
