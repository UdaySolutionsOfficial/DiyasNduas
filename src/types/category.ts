export interface Category {
  id: string;
  name: string;
  description: string;
  image?: string;
  icon?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: number;
  updatedAt: number;
}

export type CategoryDraft = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;
