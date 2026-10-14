export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: number;
  updatedAt: number;
}

export type BannerDraft = Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>;
