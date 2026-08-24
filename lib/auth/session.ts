import { cookies } from 'next/headers';
import { getFirebaseAdminAuth } from './firebaseAdmin';
import { resolveMemberSession } from './memberResolver';
import type { AuthenticatedIdentity, LccMemberSession } from './types';

export const LCC_SESSION_COOKIE = 'lcc_session';

export async function getAuthenticatedIdentity(): Promise<AuthenticatedIdentity | null> {
  const auth = getFirebaseAdminAuth();
  if (!auth) return null;

  const token = (await cookies()).get(LCC_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = await auth.verifySessionCookie(token, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      picture: decoded.picture ?? null,
    };
  } catch {
    return null;
  }
}

export async function getCurrentMemberSession(): Promise<LccMemberSession | null> {
  const identity = await getAuthenticatedIdentity();
  return identity ? resolveMemberSession(identity) : null;
}
