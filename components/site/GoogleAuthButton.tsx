'use client';

import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { auth } from '@/lib/firebase';

export function GoogleAuthButton({
  mode,
  returnTo,
  className = '',
}: {
  mode: 'sign-in' | 'sign-out';
  returnTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      if (mode === 'sign-out') {
        await signOut(auth);
        await fetch('/api/auth/session', { method: 'DELETE' });
        router.refresh();
        return;
      }

      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await result.user.getIdToken();
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) throw new Error('Authentication is not configured for this deployment.');
      router.push(returnTo || '/');
      router.refresh();
    } catch (error) {
      if (error instanceof Error && error.message) window.alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={busy} className={className}>
      {busy ? 'Working…' : mode === 'sign-in' ? 'Sign In' : 'Sign Out'}
    </button>
  );
}
