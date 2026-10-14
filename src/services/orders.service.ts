import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc,
  updateDoc,
  deleteDoc,
  Unsubscribe 
} from 'firebase/firestore';
import { ref, set, get, remove, onValue, off } from 'firebase/database';
import { db, rtdb } from '../firebase/config';
import { Order, OrderCreateRequest, OrderStatus } from '../types/order';
import { generateHumanReadableOrderId } from '../utils/orderIdGenerator';
import { realtimeEventsService } from './realtimeEvents.service';
import { settingsService } from './settings.service';
import { couponService } from './coupon.service';

const ORDERS_COLLECTION = 'orders';
const PRODUCTS_COLLECTION = 'products';
const RTDB_LIVE_ORDERS_PATH = 'liveOrders';

const MOCK_ORDERS_STORE: Order[] = [];

/**
 * Strips all undefined properties from objects to prevent Firebase RTDB "set failed: value argument contains undefined" errors.
 */
function sanitizeForFirebase<T>(obj: T): T {
  if (!obj) return obj;
  return JSON.parse(JSON.stringify(obj));
}

export const ordersService = {
  async getOrderById(idOrOrderId: string): Promise<Order | null> {
    const formattedId = idOrOrderId.trim().toUpperCase();

    // 1. Check RTDB Live Orders by exact key
    try {
      const liveRef = ref(rtdb, `${RTDB_LIVE_ORDERS_PATH}/${idOrOrderId}`);
      const snap = await get(liveRef);
      if (snap.exists()) {
        return snap.val() as Order;
      }
    } catch (err) {
      console.warn('[OrdersService] RTDB fetch key warning:', err);
    }

    // 2. Check RTDB Live Orders by searching all live orders (matching id or orderId)
    try {
      const liveColRef = ref(rtdb, RTDB_LIVE_ORDERS_PATH);
      const snap = await get(liveColRef);
      if (snap.exists()) {
        const val = snap.val();
        const found = Object.values(val).find(
          (o: any) => o.id === idOrOrderId || o.orderId === formattedId || o.id === formattedId
        );
        if (found) return found as Order;
      }
    } catch (err) {
      console.warn('[OrdersService] RTDB scan warning:', err);
    }

    // 3. Check Firestore Completed Orders by doc ID
    try {
      const docRef = doc(db, ORDERS_COLLECTION, idOrOrderId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Order;
      }
    } catch (error) {
      console.warn('[OrdersService] Firestore doc ID fetch warning:', error);
    }

    // 4. Check Firestore Completed Orders by orderId query
    try {
      const colRef = collection(db, ORDERS_COLLECTION);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const found = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() } as Order))
          .find(o => o.id === idOrOrderId || o.orderId === formattedId);
        if (found) return found;
      }
    } catch (error) {
      console.warn('[OrdersService] Firestore scan warning:', error);
    }

    // 5. Fallback to local memory store
    return MOCK_ORDERS_STORE.find(o => o.id === idOrOrderId || o.orderId === formattedId || o.id === formattedId) || null;
  },

  async getOrderByHumanReadableId(orderId: string): Promise<Order | null> {
    return this.getOrderById(orderId);
  },

  /**
   * Realtime Single-Order Listener.
   */
  subscribeToOrder(orderId: string, onUpdate: (order: Order | null) => void): Unsubscribe {
    const formattedId = orderId.trim().toUpperCase();

    // Listen to RTDB Live Orders
    const liveRef = ref(rtdb, RTDB_LIVE_ORDERS_PATH);
    const unsubscribeRTDB = onValue(liveRef, async (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const found = Object.values(val).find(
          (o: any) => o.orderId === formattedId || o.id === formattedId || o.id === orderId
        );
        if (found) {
          onUpdate(found as Order);
          return;
        }
      }

      // Check Firestore completed/archived orders if delivered
      try {
        const docRef = doc(db, ORDERS_COLLECTION, orderId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          onUpdate({ id: snap.id, ...snap.data() } as Order);
          return;
        }

        const colRef = collection(db, ORDERS_COLLECTION);
        const firestoreSnap = await getDocs(colRef);
        if (!firestoreSnap.empty) {
          const found = firestoreSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as Order))
            .find(o => o.id === orderId || o.orderId === formattedId);
          if (found) {
            onUpdate(found);
            return;
          }
        }
      } catch (e) {
        console.warn('[OrdersService] Firestore single order fetch error:', e);
      }

      onUpdate(null);
    });

    return () => off(liveRef, 'value', unsubscribeRTDB);
  },

  /**
   * Subscribes to ALL orders in real-time for Admin Panel updates.
   */
  subscribeToAllOrders(onUpdate: (orders: Order[]) => void): Unsubscribe {
    const liveRef = ref(rtdb, RTDB_LIVE_ORDERS_PATH);

    const unsubscribeRTDB = onValue(liveRef, async (snapshot) => {
      let liveOrders: Order[] = [];
      if (snapshot.exists()) {
        liveOrders = Object.values(snapshot.val()) as Order[];
      }

      // Fetch completed orders from Firestore
      let completedOrders: Order[] = [];
      try {
        const colRef = collection(db, ORDERS_COLLECTION);
        const firestoreSnap = await getDocs(colRef);
        if (!firestoreSnap.empty) {
          completedOrders = firestoreSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        }
      } catch (e) {
        console.warn('[OrdersService] Firestore completed orders fetch warning:', e);
      }

      // Combine RTDB live orders + Firestore completed orders + local memory orders
      const map = new Map<string, Order>();
    [...completedOrders, ...liveOrders].forEach(o => {
        map.set(o.id, o);
      });

      const merged = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onUpdate(merged);
    });

    return () => off(liveRef, 'value', unsubscribeRTDB);
  },

  async getAllOrders(): Promise<Order[]> {
    let liveOrders: Order[] = [];
    try {
      const liveRef = ref(rtdb, RTDB_LIVE_ORDERS_PATH);
      const snap = await get(liveRef);
      if (snap.exists()) {
        liveOrders = Object.values(snap.val()) as Order[];
      }
    } catch (e) {
      console.warn('[OrdersService] Failed to fetch live orders from RTDB:', e);
    }

    let completedOrders: Order[] = [];
    try {
      const colRef = collection(db, ORDERS_COLLECTION);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        completedOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      }
    } catch (error) {
      console.warn('[OrdersService] Failed to fetch completed orders from Firestore:', error);
    }

    const map = new Map<string, Order>();
    [...completedOrders, ...liveOrders].forEach(o => {
      map.set(o.id, o);
    });

    return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  async createOrderAtomic(request: OrderCreateRequest): Promise<Order> {
    const humanOrderId = generateHumanReadableOrderId();
    const now = Date.now();
    const generatedId = `ord_${now}_${Math.floor(1000 + Math.random() * 9000)}`;

    let subtotal = 0;
    const itemSnapshots = [];

    for (const itemReq of request.items) {
      let productData: any = null;
      const productRef = doc(db, PRODUCTS_COLLECTION, itemReq.productId);
      
      try {
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          productData = productSnap.data();
        }
      } catch (err) {
        console.warn('[OrdersService] Firestore product check error:', err);
      }

      if (!productData) {
        throw new Error(`Product is no longer available.`);
      }

      if (productData.stockQuantity < itemReq.quantity) {
        throw new Error(`Insufficient stock for product "${productData.name}". Available: ${productData.stockQuantity}`);
      }

      const itemSubtotal = productData.sellingPrice * itemReq.quantity;
      subtotal += itemSubtotal;

      itemSnapshots.push({
        productId: itemReq.productId,
        name: productData.name,
        unitPrice: productData.sellingPrice,
        originalUnitPrice: productData.originalPrice || productData.sellingPrice,
        quantity: itemReq.quantity,
        image: productData.images?.[0] || '',
        subtotal: itemSubtotal,
      });

      // Deduct stock quantity in Firestore
      const newStock = Math.max(0, productData.stockQuantity - itemReq.quantity);
      try {
        await updateDoc(productRef, {
          stockQuantity: newStock,
          updatedAt: Date.now(),
        });
      } catch (stockErr) {
        console.warn('[OrdersService] Stock updateDoc fallback setDoc:', stockErr);
        await setDoc(productRef, { stockQuantity: newStock, updatedAt: Date.now() }, { merge: true });
      }
    }

    // Fetch store settings for delivery & taxes
    let deliveryFee = 80;
    let taxRate = 0;
    let taxName = 'GST';
    let taxAmount = 0;

    try {
      const storeSettings = await settingsService.getStoreSettings();
      const threshold = storeSettings.freeDeliveryThreshold !== undefined ? storeSettings.freeDeliveryThreshold : 1000;
      const standardFee = storeSettings.defaultDeliveryFee !== undefined ? storeSettings.defaultDeliveryFee : 80;
      deliveryFee = subtotal >= threshold ? 0 : standardFee;

      if (storeSettings.taxSettings && storeSettings.taxSettings.enabled) {
        taxRate = Number(storeSettings.taxSettings.rate) || 0;
        taxName = storeSettings.taxSettings.name || 'GST';
      }
    } catch (settErr) {
      console.warn('[OrdersService] Could not fetch settings, applying fallback:', settErr);
      deliveryFee = subtotal >= 1000 ? 0 : 80;
    }

    // Coupon discount validation & calculation
    let couponDiscount = 0;
    let validCouponCode = '';

    if (request.couponCode) {
      try {
        const couponVal = await couponService.validateCoupon(request.couponCode, subtotal);
        if (couponVal.isValid) {
          couponDiscount = couponVal.discountAmount;
          validCouponCode = couponVal.coupon?.code || request.couponCode.toUpperCase();
        }
      } catch (couponErr) {
        console.warn('[OrdersService] Coupon validation failed, skipping coupon discount:', couponErr);
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - couponDiscount);

    // Compute Tax on discounted subtotal if enabled
    if (taxRate > 0) {
      taxAmount = Math.round((discountedSubtotal * taxRate) / 100);
    }

    const total = discountedSubtotal + taxAmount + deliveryFee;

    const newOrderData: Order = {
      id: generatedId,
      orderId: humanOrderId,
      customerInfo: request.customerInfo,
      items: itemSnapshots,
      itemCount: itemSnapshots.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      discountAmount: couponDiscount,
      couponCode: validCouponCode || undefined,
      couponDiscount: couponDiscount > 0 ? couponDiscount : undefined,
      taxAmount: taxAmount > 0 ? taxAmount : undefined,
      taxRate: taxRate > 0 ? taxRate : undefined,
      taxName: taxRate > 0 ? taxName : undefined,
      deliveryFee,
      total,
      orderStatus: 'pending',
      statusHistory: [
        {
          status: 'pending',
          timestamp: now,
          note: 'Order request received by Diyas N Duas. Pending store confirmation.',
        }
      ],
      createdAt: now,
      updatedAt: now,
    };

    const sanitizedData = sanitizeForFirebase(newOrderData);

    // Save live order to Firebase RTDB for ultra-fast response
    try {
      const liveOrderRef = ref(rtdb, `${RTDB_LIVE_ORDERS_PATH}/${generatedId}`);
      await set(liveOrderRef, sanitizedData);
    } catch (rtdbErr) {
      console.warn('[OrdersService] RTDB live order write fallback:', rtdbErr);
    }

    // Backup to memory store
    MOCK_ORDERS_STORE.unshift(sanitizedData);

    // Broadcast RTDB notification event for admin dashboard popups & audio alerts
    realtimeEventsService.notifyNewOrder({
      orderId: humanOrderId,
      totalAmount: total,
      customerName: request.customerInfo.fullName,
      timestamp: now,
    }).catch(err => console.warn('[RTDB Notification Warning]', err));

    return sanitizedData;
  },

  async updateOrderStatus(idOrOrderId: string, newStatus: OrderStatus, note?: string, updatedBy?: string): Promise<void> {
    const now = Date.now();
    let existingOrder: Order | null = await this.getOrderById(idOrOrderId);

    if (!existingOrder) {
      existingOrder = MOCK_ORDERS_STORE.find(o => o.id === idOrOrderId || o.orderId === idOrOrderId) || null;
    }

    if (!existingOrder) {
      throw new Error(`Order #${idOrOrderId} not found.`);
    }

    const targetId = existingOrder.id; // Target true RTDB/Firestore ID

    // Build clean history entry without undefined properties
    const historyEntry: Record<string, any> = {
      status: newStatus,
      timestamp: now,
    };
    if (note) historyEntry.note = note;
    if (updatedBy) historyEntry.updatedBy = updatedBy;

    const updatedHistory = [
      ...existingOrder.statusHistory,
      historyEntry
    ];

    const updatedOrder: Order = {
      ...existingOrder,
      orderStatus: newStatus,
      statusHistory: updatedHistory as any,
      updatedAt: now,
    };

    const sanitizedOrder = sanitizeForFirebase(updatedOrder);

    // If cancelled, restore stock quantity in Firestore
    if (newStatus === 'cancelled' && existingOrder.orderStatus !== 'cancelled') {
      for (const item of existingOrder.items) {
        try {
          const pRef = doc(db, PRODUCTS_COLLECTION, item.productId);
          const pSnap = await getDoc(pRef);
          if (pSnap.exists()) {
            const current = pSnap.data().stockQuantity || 0;
            await setDoc(pRef, { stockQuantity: current + item.quantity, updatedAt: Date.now() }, { merge: true });
          }
        } catch (e) {
          console.warn('[OrdersService] Stock restoration warning:', e);
        }
      }
    }

    // Check if order is being completed / finalized (delivered or cancelled)
    const isCompletedStatus = newStatus === 'delivered' || newStatus === 'cancelled';

    if (isCompletedStatus) {
      // Archive finalized order into Firestore
      try {
        const docRef = doc(db, ORDERS_COLLECTION, targetId);
        await setDoc(docRef, sanitizedOrder, { merge: true });
      } catch (e) {
        console.warn('[OrdersService] Firestore archiving warning:', e);
      }

      // Remove from RTDB Live Orders
      try {
        const liveOrderRef = ref(rtdb, `${RTDB_LIVE_ORDERS_PATH}/${targetId}`);
        await remove(liveOrderRef);
      } catch (e) {
        console.warn('[OrdersService] RTDB cleanup warning:', e);
      }
    } else {
      // Keep updating live order in RTDB
      try {
        const liveOrderRef = ref(rtdb, `${RTDB_LIVE_ORDERS_PATH}/${targetId}`);
        await set(liveOrderRef, sanitizedOrder);
      } catch (e) {
        console.warn('[OrdersService] RTDB status update warning:', e);
      }
    }

    // Update local memory store
    const localIdx = MOCK_ORDERS_STORE.findIndex(o => o.id === targetId || o.orderId === existingOrder!.orderId);
    if (localIdx !== -1) {
      MOCK_ORDERS_STORE[localIdx] = sanitizedOrder;
    } else {
      MOCK_ORDERS_STORE.unshift(sanitizedOrder);
    }

    // Broadcast RTDB status update notification
    realtimeEventsService.notifyOrderStatusChange(existingOrder.orderId, newStatus, now)
      .catch(err => console.warn('[RTDB Status Warning]', err));
  },

  /**
   * Submits a customer order cancellation request.
   */
  async requestOrderCancellation(idOrOrderId: string, reason: string): Promise<void> {
    const existingOrder = await this.getOrderById(idOrOrderId);
    if (!existingOrder) {
      throw new Error(`Order #${idOrOrderId} not found.`);
    }

    const now = Date.now();
    const updatedHistory = [
      ...existingOrder.statusHistory,
      {
        status: 'cancel_requested' as OrderStatus,
        timestamp: now,
        note: `Cancel request initiated by customer. Reason: "${reason}"`,
      }
    ];

    const updatedOrder: Order = {
      ...existingOrder,
      orderStatus: 'cancel_requested',
      cancellationReason: reason,
      cancelRequestedAt: now,
      statusHistory: updatedHistory,
      updatedAt: now,
    };

    const sanitized = sanitizeForFirebase(updatedOrder);

    // Update RTDB Live Orders
    try {
      const liveOrderRef = ref(rtdb, `${RTDB_LIVE_ORDERS_PATH}/${existingOrder.id}`);
      await set(liveOrderRef, sanitized);
    } catch (e) {
      console.warn('[OrdersService] Cancellation request RTDB write error:', e);
    }

    // Memory Store update
    const idx = MOCK_ORDERS_STORE.findIndex(o => o.id === existingOrder.id);
    if (idx !== -1) MOCK_ORDERS_STORE[idx] = sanitized;
  },

  /**
   * Permanently deletes an order record from RTDB and Firestore.
   */
  async deleteOrder(idOrOrderId: string): Promise<void> {
    const existingOrder = await this.getOrderById(idOrOrderId);
    const targetId = existingOrder ? existingOrder.id : idOrOrderId;

    // Delete from RTDB
    try {
      const liveOrderRef = ref(rtdb, `${RTDB_LIVE_ORDERS_PATH}/${targetId}`);
      await remove(liveOrderRef);
    } catch (e) {
      console.warn('[OrdersService] RTDB delete error:', e);
    }

    // Delete from Firestore
    try {
      const docRef = doc(db, ORDERS_COLLECTION, targetId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('[OrdersService] Firestore delete error:', e);
    }

    // Remove from memory store
    const idx = MOCK_ORDERS_STORE.findIndex(o => o.id === targetId || o.orderId === idOrOrderId);
    if (idx !== -1) {
      MOCK_ORDERS_STORE.splice(idx, 1);
    }
  }
};
