import { NextResponse } from 'next/server';
import { getFirebaseAdminAuth } from '@/lib/auth/firebaseAdmin';
import { LCC_SESSION_COOKIE } from '@/lib/auth/session';

const SESSION_LENGTH_MS = 1000 * 60 * 60 * 24 * 5;

export async function POST(request: Request) {
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
    const sessionCookie = await adminAuth.createSessionCookie(body.idToken, {
      expiresIn: SESSION_LENGTH_MS,
    });
    const response = NextResponse.json({ ok: true, uid: decoded.uid });
    response.cookies.set(LCC_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_LENGTH_MS / 1000,
    });
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
  return response;
}
