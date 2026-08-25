import { NextResponse } from 'next/server';
import { getFirebaseAdminAuth } from '@/lib/auth/firebaseAdmin';
import { LCC_LEGACY_SESSION_COOKIE, LCC_SESSION_COOKIE } from '@/lib/auth/cookie';

const SESSION_LENGTH_MS = 1000 * 60 * 60 * 24 * 5;

export async function POST(request: Request) {
  console.info('LCC_AUTH_SESSION_POST_START');
  const adminAuth = getFirebaseAdminAuth();
  if (!adminAuth) {
    return NextResponse.json({ error: 'Authentication is not configured.' }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { idToken?: string } | null;
  if (!body?.idToken) {
    return NextResponse.json({ error: 'Missing Firebase ID token.' }, { status: 400 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(body.idToken);
    console.info('LCC_AUTH_ID_TOKEN_VERIFIED', { verified: true });
    const sessionCookie = await adminAuth.createSessionCookie(body.idToken, {
      expiresIn: SESSION_LENGTH_MS,
    });
    console.info('LCC_AUTH_SESSION_COOKIE_CREATED', { created: true });
    const response = NextResponse.json({ ok: true, uid: decoded.uid });
    response.cookies.set(LCC_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_LENGTH_MS / 1000,
    });
    response.cookies.set(LCC_LEGACY_SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    console.info('LCC_AUTH_SET_COOKIE_ATTACHED', { attached: response.headers.has('set-cookie') });
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(LCC_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set(LCC_LEGACY_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
