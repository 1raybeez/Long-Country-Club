import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

export const EXPECTED_FIREBASE_PROJECT_ID = 'long-country-club-ffl';

let adminApp: App | null = null;

function getFirebaseAdminApp(): App | null {
  if (adminApp) return adminApp;
  if (getApps().length) {
    const existingApp = getApps()[0];
    return existingApp.options.projectId === EXPECTED_FIREBASE_PROJECT_ID
      ? (adminApp = existingApp)
      : null;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId !== EXPECTED_FIREBASE_PROJECT_ID || !clientEmail || !privateKey) return null;

  adminApp = initializeApp({
    projectId: EXPECTED_FIREBASE_PROJECT_ID,
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return adminApp;
}

export function getFirebaseAdminAuth(): Auth | null {
  const app = getFirebaseAdminApp();
  return app ? getAuth(app) : null;
}

export function getFirebaseAdminFirestore(): Firestore | null {
  const app = getFirebaseAdminApp();
  return app ? getFirestore(app) : null;
}
