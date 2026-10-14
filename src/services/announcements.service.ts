import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Announcement, AnnouncementDraft } from '../types/announcement';

const ANNOUNCEMENTS_COLLECTION = 'announcements';

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_1',
    text: '🪔 Welcome to Diyas N Duas! Handcrafted Festive Diyas & Brass Lamps with Careful Transport Despatch.',
    type: 'festive',
    isActive: true,
    displayOrder: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const announcementsService = {
  async getActiveAnnouncements(): Promise<Announcement[]> {
    try {
      const colRef = collection(db, ANNOUNCEMENTS_COLLECTION);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        let anns = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
        anns = anns.filter(a => a.isActive);
        anns.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        return anns;
      }
    } catch (e) {
      console.warn('[AnnouncementsService] Firestore fetch failed, using fallback:', e);
    }
    return MOCK_ANNOUNCEMENTS.filter((a) => a.isActive);
  },

  async getAllAnnouncements(): Promise<Announcement[]> {
    try {
      const colRef = collection(db, ANNOUNCEMENTS_COLLECTION);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        let anns = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
        anns.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        return anns;
      }
    } catch (e) {
      console.warn('[AnnouncementsService] Firestore fetch failed, using fallback:', e);
    }
    return MOCK_ANNOUNCEMENTS;
  },

  async createAnnouncement(draft: AnnouncementDraft): Promise<Announcement> {
    const now = Date.now();
    try {
      const colRef = collection(db, ANNOUNCEMENTS_COLLECTION);
      const docRef = await addDoc(colRef, {
        ...draft,
        createdAt: now,
        updatedAt: now,
      });
      return { id: docRef.id, ...draft, createdAt: now, updatedAt: now };
    } catch (e) {
      console.warn('[AnnouncementsService] Local fallback create:', e);
      const newObj: Announcement = {
        id: `ann_${now}`,
        ...draft,
        createdAt: now,
        updatedAt: now,
      };
      MOCK_ANNOUNCEMENTS.push(newObj);
      return newObj;
    }
  },

  async updateAnnouncement(id: string, updates: Partial<AnnouncementDraft>): Promise<void> {
    const now = Date.now();
    try {
      const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);
      await updateDoc(docRef, { ...updates, updatedAt: now });
      return;
    } catch (e) {
      console.warn('[AnnouncementsService] Local fallback update:', e);
    }

    const mockItem = MOCK_ANNOUNCEMENTS.find((a) => a.id === id);
    if (mockItem) {
      Object.assign(mockItem, { ...updates, updatedAt: now });
    }
  },

  async deleteAnnouncement(id: string): Promise<void> {
    try {
      const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);
      await deleteDoc(docRef);
      return;
    } catch (e) {
      console.warn('[AnnouncementsService] Local fallback delete:', e);
    }

    const idx = MOCK_ANNOUNCEMENTS.findIndex((a) => a.id === id);
    if (idx > -1) MOCK_ANNOUNCEMENTS.splice(idx, 1);
  },
};
