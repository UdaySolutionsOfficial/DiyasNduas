/**
 * Firebase Cloud Functions (v2) for Diyas N Duas
 * Automatically dispatches FCM push notifications when:
 * 1. An order status is updated by store admin (pending, confirmed, processing, ready, delivered, cancelled).
 * 2. An admin broadcasts a promotional campaign.
 * 
 * Works even when the customer's browser is completely closed or phone screen is locked!
 */

const { onDocumentUpdated, onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Triggered on every order update in Firestore: orders/{orderId}
 */
exports.onOrderStatusChanged = onDocumentUpdated("orders/{orderId}", async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  const orderId = event.params.orderId;

  if (!before || !after) return null;

  // Only dispatch if status changed
  const prevStatus = before.orderStatus || before.status;
  const nextStatus = after.orderStatus || after.status;

  if (prevStatus === nextStatus) return null;

  const readableOrderId = after.orderId || orderId;

  // Find customer's device FCM token
  let fcmToken = after.fcmToken;

  if (!fcmToken) {
    try {
      const tokensSnap = await admin
        .firestore()
        .collection("fcm_tokens")
        .where("associatedOrderId", "==", readableOrderId)
        .limit(1)
        .get();

      if (!tokensSnap.empty) {
        fcmToken = tokensSnap.docs[0].id;
      }
    } catch (tokenErr) {
      console.warn("[FCM Function] Error querying fcm_tokens:", tokenErr);
    }
  }

  if (!fcmToken) {
    console.log(`[FCM Function] No FCM token found for order #${readableOrderId}. Skipping push.`);
    return null;
  }

  const statusTitles = {
    pending: `🪔 Order Received (#${readableOrderId})`,
    confirmed: `✅ Order Confirmed (#${readableOrderId})`,
    processing: `📦 Packaging Handcrafted Diyas (#${readableOrderId})`,
    ready: `🚚 Ready for Transport (#${readableOrderId})`,
    delivered: `🎉 Order Fulfilled (#${readableOrderId})`,
    cancelled: `❌ Order Update (#${readableOrderId})`,
    cancel_requested: `⚠️ Cancellation Requested (#${readableOrderId})`,
  };

  const statusBodies = {
    pending: "Your festive order has been received by Diyas N Duas and is pending confirmation.",
    confirmed: "Your order has been verified and confirmed! Our artisans are preparing your diyas.",
    processing: "Your clay diyas are being carefully packed with protective festive packaging.",
    ready: "Your package is ready for dispatch and on its way to your doorstep. Tap to track live.",
    delivered: "Your order has been safely delivered! May your home be blessed with radiant light.",
    cancelled: after.cancellationReason ? `Order was cancelled. Reason: ${after.cancellationReason}` : "Your order request was cancelled. Stock has been restored.",
    cancel_requested: "Your cancellation request was submitted to the store admin for review.",
  };

  const title = statusTitles[nextStatus] || `Order Update (#${readableOrderId})`;
  const body = statusBodies[nextStatus] || `Order status updated to ${nextStatus}`;

  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
    data: {
      url: `/order/${readableOrderId}`,
      orderId: readableOrderId,
      type: "order_status_update",
    },
    webpush: {
      headers: {
        Urgency: "high",
      },
      notification: {
        title,
        body,
        icon: "/logo.png",
        badge: "/favicon.svg",
        tag: `order-${readableOrderId}-${nextStatus}`,
        sound: "/notification_bell.mp3",
      },
      fcmOptions: {
        link: `https://diyasnduas.com/order/${readableOrderId}`,
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`[FCM Function] Successfully sent push for order #${readableOrderId}:`, response);
    return response;
  } catch (err) {
    console.error(`[FCM Function] Failed to send push for order #${readableOrderId}:`, err);
    if (err.code === "messaging/registration-token-not-registered" || err.code === "messaging/invalid-registration-token") {
      console.log(`[FCM Function] Pruning stale token for order #${readableOrderId}`);
      admin.firestore().collection("fcm_tokens").doc(fcmToken).delete().catch(() => {});
    }
    return null;
  }
});

/**
 * Triggered when a new promotional campaign is posted by admin: campaigns/{campaignId}
 */
exports.onCampaignCreated = onDocumentCreated("campaigns/{campaignId}", async (event) => {
  const campaign = event.data?.data();
  if (!campaign) return null;

  try {
    const tokensSnap = await admin.firestore().collection("fcm_tokens").get();
    if (tokensSnap.empty) {
      console.log("[FCM Function] No subscribers registered in fcm_tokens.");
      return null;
    }

    const tokens = [];
    tokensSnap.forEach((doc) => {
      if (doc.id && doc.id.length > 20) {
        tokens.push(doc.id);
      }
    });

    if (tokens.length === 0) return null;

    const title = campaign.title || "✨ Diyas N Duas Special Festive Offer";
    const body = campaign.body || "Explore our latest handcrafted collection and exclusive discounts!";
    const link = campaign.actionUrl
      ? `https://diyasnduas.com${campaign.actionUrl.startsWith("/") ? "" : "/"}${campaign.actionUrl}`
      : "https://diyasnduas.com/products";

    const message = {
      tokens,
      notification: {
        title,
        body,
        imageUrl: campaign.imageUrl || undefined,
      },
      webpush: {
        headers: {
          Urgency: "normal",
        },
        notification: {
          title,
          body,
          icon: "/logo.png",
          badge: "/favicon.svg",
          image: campaign.imageUrl || undefined,
          sound: "/notification_bell.mp3",
        },
        fcmOptions: {
          link,
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[FCM Function] Broadcast sent: ${response.successCount} successes, ${response.failureCount} failures`);

    // Automatically prune dead / unregistered tokens
    if (response.failureCount > 0 && response.responses) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          if (errCode === "messaging/registration-token-not-registered" || errCode === "messaging/invalid-registration-token") {
            const staleToken = tokens[idx];
            console.log(`[FCM Function] Pruning dead subscriber token: ${staleToken?.substring(0, 15)}...`);
            admin.firestore().collection("fcm_tokens").doc(staleToken).delete().catch(() => {});
          }
        }
      });
    }

    return response;
  } catch (err) {
    console.error("[FCM Function] Error sending campaign broadcast:", err);
    return null;
  }
});

/**
 * Triggered when a new order is created in Firestore: orders/{orderId}
 * Dispatches high-urgency FCM push notifications to all registered admin devices
 * (mobile phones, laptops, tablets) even when the admin's app is closed or screen is locked.
 */
exports.onOrderCreated = onDocumentCreated("orders/{orderId}", async (event) => {
  const order = event.data?.data();
  const orderId = event.params.orderId;
  if (!order) return null;

  const readableOrderId = order.orderId || orderId;
  const customerName = order.customerInfo?.fullName || "Customer";
  const total = order.total || order.subtotal || 0;
  const itemCount = order.itemCount || (order.items ? order.items.length : 1);

  try {
    const adminTokens = new Set();

    // Query admin_fcm_tokens collection
    try {
      const adminSnap = await admin.firestore().collection("admin_fcm_tokens").get();
      adminSnap.forEach((doc) => {
        if (doc.id && doc.id.length > 20) {
          adminTokens.add(doc.id);
        }
      });
    } catch (e) {
      console.warn("[Admin FCM] Error reading admin_fcm_tokens:", e);
    }

    // Also query fcm_tokens with isAdmin == true
    try {
      const roleAdminSnap = await admin
        .firestore()
        .collection("fcm_tokens")
        .where("isAdmin", "==", true)
        .get();
      roleAdminSnap.forEach((doc) => {
        if (doc.id && doc.id.length > 20) {
          adminTokens.add(doc.id);
        }
      });
    } catch (e) {
      console.warn("[Admin FCM] Error reading fcm_tokens admin query:", e);
    }

    const tokensList = Array.from(adminTokens);

    if (tokensList.length === 0) {
      console.log(`[Admin FCM] No registered admin device tokens found for order #${readableOrderId}.`);
      return null;
    }

    console.log(`[Admin FCM] Sending new order alert to ${tokensList.length} admin device(s) for #${readableOrderId}`);

    const title = `🛍️ New Order Received (#${readableOrderId})!`;
    const body = `₹${total} by ${customerName} (${itemCount} items). Tap to view and process.`;

    const message = {
      tokens: tokensList,
      notification: {
        title,
        body,
      },
      data: {
        url: "/admin/orders",
        orderId: readableOrderId,
        type: "admin_new_order",
      },
      webpush: {
        headers: {
          Urgency: "high",
        },
        notification: {
          title,
          body,
          icon: "/logo.png",
          badge: "/favicon.svg",
          tag: `admin-order-${readableOrderId}`,
          sound: "/notification_bell.mp3",
          requireInteraction: true,
        },
        fcmOptions: {
          link: "https://diyasnduas.com/admin/orders",
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[Admin FCM] New order dispatch: ${response.successCount} successes, ${response.failureCount} failures`);

    // Automatically prune dead admin tokens
    if (response.failureCount > 0 && response.responses) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          if (errCode === "messaging/registration-token-not-registered" || errCode === "messaging/invalid-registration-token") {
            const staleToken = tokensList[idx];
            console.log(`[Admin FCM] Pruning dead admin token: ${staleToken?.substring(0, 15)}...`);
            admin.firestore().collection("admin_fcm_tokens").doc(staleToken).delete().catch(() => {});
            admin.firestore().collection("fcm_tokens").doc(staleToken).delete().catch(() => {});
          }
        }
      });
    }

    return response;
  } catch (err) {
    console.error(`[Admin FCM] Error sending admin order notification for #${readableOrderId}:`, err);
    return null;
  }
});
