import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
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

// Export Firebase Service instances
export const db: Firestore = getFirestore(app);
export const rtdb: Database = getDatabase(app);
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

export const isFirebaseReady = env.firebase.isConfigured;

export default app;
