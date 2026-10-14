export interface StoreSettings {
  storeName: string;
  contactPhone: string;
  whatsappNumber: string;
  storeEmail?: string;
  instagramUrl?: string;
  storeAddress: string;
  businessHours?: string;
  mapEmbedUrl?: string;
  mapDirectionsUrl?: string;
  minOrderValue: number;
  freeDeliveryThreshold?: number;
  defaultDeliveryFee: number;
  noticeBannerText?: string;
  isStoreOpen: boolean;
  acceptingOrders: boolean;
  featuredSectionTitle: string;
  checkoutInstructions: string;
  orderConfirmationNote: string;
  taxSettings?: {
    enabled: boolean;
    name: string; // e.g. "GST" or "VAT"
    rate: number; // percentage, e.g. 5, 12, 18
  };
  updatedAt: number;
}
