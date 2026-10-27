import { ref, set, push, onValue, off, get, remove } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { OrderStatus } from '../types/order';

export interface NewOrderNotificationEvent {
  orderId: string;
  totalAmount: number;
  customerName: string;
  timestamp: number;
  isPreOrder?: boolean;
  orderType?: 'standard' | 'pre_order' | 'mixed';
}

export const realtimeEventsService = {
  async notifyNewOrder(event: NewOrderNotificationEvent): Promise<void> {
    try {
      const eventsRef = ref(rtdb, 'events/new_orders');
      const newEventRef = push(eventsRef);
      await set(newEventRef, event);

      // Set latest counter for instant badge updates
      const latestRef = ref(rtdb, 'notifications/latest_order');
      await set(latestRef, event);
    } catch (error) {
      console.warn('[RealtimeEventsService] RTDB push failed or unconfigured:', error);
    }
  },

  /**
   * Clears the latest order notification from RTDB if it matches the specified orderId.
   * Prevents stale order popups from recurring when reopening the dashboard.
   */
  async clearLatestOrderIfMatches(orderId: string): Promise<void> {
    try {
      const formatted = orderId.trim().toUpperCase();
      const latestRef = ref(rtdb, 'notifications/latest_order');
      const snap = await get(latestRef);
      if (snap.exists()) {
        const val = snap.val();
        if (val && (val.orderId === orderId || val.orderId?.toUpperCase() === formatted)) {
          await remove(latestRef);
        }
      }
    } catch (error) {
      console.warn('[RealtimeEventsService] Failed to clear latest order:', error);
    }
  },

  async notifyOrderStatusChange(orderId: string, status: OrderStatus, timestamp: number): Promise<void> {
    try {
      const statusRef = ref(rtdb, `order_updates/${orderId}`);
      await set(statusRef, { status, timestamp });
    } catch (error) {
      console.warn('[RealtimeEventsService] Failed to notify status change:', error);
    }
  },

  subscribeToNewOrderEvents(callback: (event: NewOrderNotificationEvent | null) => void): () => void {
    const latestRef = ref(rtdb, 'notifications/latest_order');
    onValue(latestRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as NewOrderNotificationEvent);
      } else {
        callback(null);
      }
    });

    return () => off(latestRef);
  }
};
