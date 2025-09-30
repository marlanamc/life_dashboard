import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let initPromise = null;

function getFirebaseConfig() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  };

  const suppliedValues = Object.values(config).filter(Boolean);
  if (suppliedValues.length === 0) {
    console.warn(
      '[Firebase] Config missing. Set VITE_FIREBASE_* environment variables to enable cloud sync.'
    );
    return null;
  }

  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingRequired = requiredKeys.filter((key) => !config[key]);
  if (missingRequired.length > 0) {
    console.warn(`[Firebase] Missing required config values: ${missingRequired.join(', ')}`);
    return null;
  }

  return config;
}

export async function initializeFirebase() {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const config = getFirebaseConfig();
    if (!config) {
      return null;
    }

    const app = initializeApp(config);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    return { app, auth, firestore };
  })();

  return initPromise;
}
