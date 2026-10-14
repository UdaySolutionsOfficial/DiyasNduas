import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { AdminUser } from '../types/admin';

export const adminAuthService = {
  async login(email: string, pass: string): Promise<User> {
    const creds = await signInWithEmailAndPassword(auth, email, pass);
    return creds.user;
  },

  async logout(): Promise<void> {
    await firebaseSignOut(auth);
  },

  subscribeToAuthChanges(callback: (user: AdminUser | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Store Admin',
          role: 'super_admin',
        });
      } else {
        callback(null);
      }
    });
  }
};
