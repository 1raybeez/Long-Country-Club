import { cookies } from 'next/headers';
import { getFirebaseAdminAuth } from './firebaseAdmin';
import { resolveMemberSession } from './memberResolver';
import { LCC_SESSION_COOKIE } from './cookie';
import type { AuthenticatedIdentity, LccMemberSession } from './types';

export { LCC_LEGACY_SESSION_COOKIE, LCC_SESSION_COOKIE } from './cookie';

export async function getAuthenticatedIdentity(): Promise<AuthenticatedIdentity | null> {
  const auth = getFirebaseAdminAuth();
  if (!auth) return null;

  const sessionCookie = (await cookies()).get(LCC_SESSION_COOKIE);
  const token = sessionCookie?.value;
  if (!token) return null;

  try {
    const decoded = await auth.verifySessionCookie(token, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      picture: decoded.picture ?? null,
    };
  } catch (error) {
    const errorCode = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code.replace(/[^a-zA-Z0-9/_-]/g, '').slice(0, 80) || 'unknown'
      : 'unknown';
    const errorName = error instanceof Error
      ? error.name.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || 'Error'
      : 'UnknownError';
    console.warn('LCC_AUTH_SESSION_COOKIE_VERIFY_FAILED', { errorName, errorCode });
    return null;
  }
}

export async function getCurrentMemberSession(): Promise<LccMemberSession | null> {
  const identity = await getAuthenticatedIdentity();
  const session = identity ? resolveMemberSession(identity) : null;
  const memberResolved = Boolean(session?.member);
  if (identity && !memberResolved) {
    console.warn('LCC_AUTH_MEMBER_NOT_RESOLVED', { resolved: false });
  }
  return session;
}
