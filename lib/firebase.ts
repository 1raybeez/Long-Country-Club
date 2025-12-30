import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your project-specific configuration
const firebaseConfig = {
  apiKey: "AIzaSyCP0M7e1N758YAC1Zzyrj5hA8ns9ZilUC4",
  authDomain: "river-city-ffl.firebaseapp.com",
  projectId: "river-city-ffl",
  storageBucket: "river-city-ffl.firebasestorage.app",
  messagingSenderId: "905503961976",
  appId: "1:905503961976:web:6219debd8f793f8a1f4e8d",
  measurementId: "G-X8MXRMTKYW"
};

// Initialize Firebase only if it hasn't been started yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);