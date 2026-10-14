export type AnnouncementType = 'info' | 'festive' | 'warning' | 'success';

export interface Announcement {
  id: string;
  text: string;
  type: AnnouncementType;
  isActive: boolean;
  displayOrder: number;
  createdAt: number;
  updatedAt: number;
}

export type AnnouncementDraft = Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>;
