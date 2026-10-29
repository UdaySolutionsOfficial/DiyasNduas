export interface ProductSection {
  title?: string;
  content: string;
}

export interface Product {
  id: string;
  name: string;
  slug?: string; // SEO friendly URL slug (e.g. royal-peacock-lotus-diya)
  description: string;
  sections?: ProductSection[]; // Optional multiple structured paragraphs with optional title
  categoryId: string;
  categoryName?: string;
  originalPrice: number;
  sellingPrice: number;
  actualCost?: number; // Internal procurement / manufacturing cost (Admin confidential)
  stockQuantity: number;
  images: string[];
  badge?: string; // e.g. "Bestseller", "New", "Sparkler Special"
  isActive: boolean;
  isFeatured: boolean;
  allowPreOrder?: boolean; // When stockQuantity <= 0: true = allow customer pre-orders; false/undefined = WhatsApp "I'm Interested" inquiries
  createdAt: number; // UTC timestamp
  updatedAt: number; // UTC timestamp
}

export type ProductDraft = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
