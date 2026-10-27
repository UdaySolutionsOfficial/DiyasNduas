export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'pre_order_confirmed' 
  | 'processing' 
  | 'ready' 
  | 'delivered' 
  | 'cancelled' 
  | 'cancel_requested';

export interface CustomerInfo {
  fullName: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  city: string;
  pincode: string;
  notes?: string;
}

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  unitPrice: number; // Selling price snapshot at order time
  originalUnitPrice: number; // Original price snapshot at order time
  quantity: number;
  image?: string;
  subtotal: number;
  isPreOrder?: boolean;
  isSpecialOffer?: boolean;
  specialOfferPrice?: number;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: number;
  note?: string;
  updatedBy?: string;
}

export interface Order {
  id: string; // Firestore document ID or RTDB key
  orderId: string; // Human-readable reference e.g., CK-260824-00127
  customerInfo: CustomerInfo;
  items: OrderItemSnapshot[];
  itemCount: number;
  subtotal: number;
  isPreOrder?: boolean;
  isSpecialOffer?: boolean;
  specialOfferPrice?: number;
  orderType?: 'standard' | 'pre_order' | 'mixed';
  hasPreOrderItems?: boolean;
  discountAmount: number;
  couponCode?: string;
  couponDiscount?: number;
  taxAmount?: number;
  taxRate?: number;
  taxName?: string;
  deliveryFee: number;
  total: number;
  orderStatus: OrderStatus;
  statusHistory: OrderStatusHistoryItem[];
  cancellationReason?: string;
  cancelRequestedAt?: number;
  fcmToken?: string;
  createdAt: number;
  updatedAt: number;
}

export type OrderCreateRequest = {
  customerInfo: CustomerInfo;
  items: Array<{
    productId: string;
    quantity: number;
    isPreOrder?: boolean;
    isSpecialOffer?: boolean;
    specialOfferPrice?: number;
  }>;
  orderType?: 'standard' | 'pre_order' | 'mixed';
  notes?: string;
  couponCode?: string;
  fcmToken?: string;
};