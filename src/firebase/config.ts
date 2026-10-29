import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  initializeFirestore, 
  getFirestore, 
  Firestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { env } from '../config/env';

// Initialize Firebase App instance safely
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp({
    apiKey: env.firebase.apiKey,
    authDomain: env.firebase.authDomain,
    projectId: env.firebase.projectId,
    storageBucket: env.firebase.storageBucket,
    messagingSenderId: env.firebase.messagingSenderId,
    appId: env.firebase.appId,
    databaseURL: env.firebase.databaseURL,
  });
} else {
  app = getApp();
}

// Export Firebase Firestore instance with Persistent Multi-Tab Local Cache
function initFirestore(firebaseApp: FirebaseApp): Firestore {
  try {
    if (typeof window !== 'undefined') {
      return initializeFirestore(firebaseApp, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    }
  } catch (err) {
    console.warn('[Firebase Firestore] Persistent cache initialization fallback:', err);
  }
  return getFirestore(firebaseApp);
}

export const db: Firestore = initFirestore(app);
export const rtdb: Database = getDatabase(app);
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

// Safe export for Firebase Cloud Messaging in browser environments supporting service workers
export const getMessagingInstance = async () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const { getMessaging, isSupported } = await import('firebase/messaging');
      const supported = await isSupported();
      if (supported) {
        return getMessaging(app);
      }
    } catch (err) {
      console.warn('[Firebase Messaging] Unsupported or blocked:', err);
    }
  }
  return null;
};

export const isFirebaseReady = env.firebase.isConfigured;

export default app;
