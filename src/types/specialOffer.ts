export interface SpecialOfferProduct {
  productId: string;
  productName: string;
  productImage: string;
  categoryName?: string;
  originalPrice: number;
  sellingPrice: number;
  offerPrice: number; // The subsidized clearance deal price unlocked at the cart threshold
  stockQuantity: number;
}

export interface SpecialOfferConfig {
  enabled: boolean;
  minCartThreshold: number; // e.g. 700
  bannerUrl?: string;
  title: string; // e.g. "Exclusive Cart Milestone Deal! 🪔✨"
  subtitle: string; // e.g. "Congratulations! Because your order reached ₹700 or more, you've unlocked these special deals!"
  products: SpecialOfferProduct[];
  updatedAt: number;
}
