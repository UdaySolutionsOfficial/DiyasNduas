export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  originalPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  images: string[];
  badge?: string; // e.g. "Bestseller", "New", "Sparkler Special"
  isActive: boolean;
  isFeatured: boolean;
  createdAt: number; // UTC timestamp
  updatedAt: number; // UTC timestamp
}

export type ProductDraft = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
