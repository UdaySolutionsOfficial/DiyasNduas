/**
 * Application environment configuration parser & validator.
 * Provides safe defaults during Phase 0 initialization when real Firebase credentials
 * may not yet be provided in environment variables.
 */

export interface EnvConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    databaseURL: string;
    isConfigured: boolean;
  };
  store: {
    name: string;
    supportPhone: string;
  };
}

const parseEnv = (): EnvConfig => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
  const isConfigured = Boolean(apiKey && apiKey !== 'YOUR_FIREBASE_API_KEY');

  return {
    firebase: {
      apiKey: apiKey || 'demo-api-key',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://demo-project-default-rtdb.firebaseio.com',
      isConfigured,
    },
    store: {
      name: import.meta.env.VITE_STORE_NAME || 'Diyas N Duas',
      supportPhone: import.meta.env.VITE_SUPPORT_PHONE || '+91 9177536399',
    },
  };
};

export const env = parseEnv();
