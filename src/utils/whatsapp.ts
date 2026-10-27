import { Order, OrderStatus } from '../types/order';
import { Product } from '../types/product';
import { formatINR } from './formatters';
import { env } from '../config/env';

/**
 * Resolves the public order tracking URL for a given orderId.
 */
export function getOrderTrackingUrl(orderId: string): string {
  if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')) {
    return `${window.location.origin}/order?orderId=${encodeURIComponent(orderId)}`;
  }
  return `https://diyasnduas.web.app/order?orderId=${encodeURIComponent(orderId)}`;
}

/**
 * Builds a clean prefilled WhatsApp message for initial checkout / order confirmation.
 */
export function buildWhatsAppOrderMessage(order: Order): string {
  const hasPreOrder = Boolean(
    order.isPreOrder ||
    order.orderType === 'pre_order' ||
    order.orderType === 'mixed' ||
    order.items.some((i) => i.isPreOrder)
  );

  const itemList = order.items
    .map((item) => `• ${item.name}${item.isSpecialOffer ? ' [SPECIAL OFFER DEAL]' : item.isPreOrder ? ' [PRE-ORDER]' : ''} × ${item.quantity} (${formatINR(item.subtotal)})`)
    .join('\n');

  const deliveryText = order.deliveryFee === 0 
    ? 'FREE Delivery (Orders ₹1,000+)' 
    : formatINR(order.deliveryFee);

  let breakdownDetails = `*Items Subtotal:* ${formatINR(order.subtotal)}\n`;
  if (order.couponCode && order.couponDiscount) {
    breakdownDetails += `*Promo Coupon (${order.couponCode}):* -${formatINR(order.couponDiscount)}\n`;
  }
  if (order.taxAmount && order.taxAmount > 0) {
    breakdownDetails += `*${order.taxName || 'GST'} (${order.taxRate || 5}%):* +${formatINR(order.taxAmount)}\n`;
  }
  breakdownDetails += `*Delivery Fee:* ${deliveryText}\n`;
  breakdownDetails += `*Total Payable:* ${formatINR(order.total)}`;

  const orderTypeBadge = hasPreOrder
    ? (order.orderType === 'mixed' ? '*Order Classification:* Mixed Order (In-Stock & Pre-Order Items)\n' : '*Order Classification:* ✨ Pre-Order Request\n')
    : '';

  const preOrderNotice = hasPreOrder
    ? `\n\n✨ *Pre-Order Crafting Notice:* This order includes artisan pre-order item(s). Once accepted by the store, crafting will begin and dispatch dates will be confirmed.`
    : '';

  return `Hello ${env.store.name},

I have placed an order request on your website.

*Order Reference:* ${order.orderId}
${orderTypeBadge}*Customer:* ${order.customerInfo.fullName}
*Phone:* ${order.customerInfo.phone}
*Delivery Address:* ${order.customerInfo.address}
${order.customerInfo.notes ? `*Notes:* ${order.customerInfo.notes}\n` : ''}*Ordered Items:*
${itemList}

${breakdownDetails}${preOrderNotice}

Please confirm my order and payment instructions.
Thank you!`;
}

/**
 * Builds a dedicated prefilled WhatsApp support/inquiry message for the Order Tracking page.
 */
export function buildWhatsAppSupportMessage(order: Order): string {
  const hasPreOrder = Boolean(
    order.isPreOrder ||
    order.orderType === 'pre_order' ||
    order.orderType === 'mixed' ||
    order.items.some((i) => i.isPreOrder)
  );

  const itemList = order.items
    .map((item) => `• ${item.name}${item.isSpecialOffer ? ' [SPECIAL OFFER DEAL]' : item.isPreOrder ? ' [PRE-ORDER]' : ''} × ${item.quantity} (${formatINR(item.subtotal)})`)
    .join('\n');

  let statusLabel = order.orderStatus.toUpperCase().replace(/_/g, ' ');
  if (order.orderStatus === 'pre_order_confirmed') {
    statusLabel = 'PRE-ORDER ACCEPTED & CONFIRMED';
  } else if (order.orderStatus === 'pending' && hasPreOrder) {
    statusLabel = 'PRE-ORDER REQUESTED';
  }

  return `Hello ${env.store.name},

I need support regarding my ${hasPreOrder ? 'pre-order' : 'order'} request.

*Order Reference:* ${order.orderId}
*Current Status:* ${statusLabel}
*Customer:* ${order.customerInfo.fullName}
*Phone:* ${order.customerInfo.phone}

*Ordered Items Summary:*
${itemList}

*Total:* ${formatINR(order.total)}

Could you please provide an update or assistance regarding this order?
Thank you!`;
}

/**
 * Builds a tailored, highly professional WhatsApp message sent by the Admin to the Customer
 * for any given Order Status.
 */
export function buildWhatsAppStatusMessage(order: Order, status: OrderStatus): string {
  const storeName = env.store.name;
  const customerName = order.customerInfo.fullName;
  const orderId = order.orderId;
  const trackingUrl = getOrderTrackingUrl(orderId);
  const supportPhone = env.store.supportPhone;
  const totalBill = formatINR(order.total);

  const itemList = order.items
    .map((item) => `• ${item.name}${item.isPreOrder ? ' [PRE-ORDER]' : ''} × ${item.quantity}`)
    .join('\n');

  switch (status) {
    case 'pending':
      return `Hello ${customerName},

Thank you for placing your order with *${storeName}*! 🪔✨

*Order Reference:* ${orderId}
*Current Status:* Order Request Received (Under Review)
*Total Payable:* ${totalBill}
*Delivery Address:* ${order.customerInfo.address}

Our team is reviewing your item details. We will confirm your order and share payment instructions shortly.

Track live status updates anytime:
${trackingUrl}

Thank you for your patience!
*${storeName}*`;

    case 'pre_order_confirmed':
      return `Hello ${customerName},

Great news! Your Pre-Order Request #${orderId} has been *ACCEPTED* by *${storeName}*! ✨🪔

*Order Reference:* ${orderId}
*Current Status:* Pre-Order Accepted & Scheduled
*Pre-Ordered Items:*
${itemList}

*Total Payable:* ${totalBill}
*Delivery Address:* ${order.customerInfo.address}

Our artisans have scheduled the crafting of your sacred items. We will keep you updated as crafting and packing progress.

Track live crafting & order progress:
${trackingUrl}

Thank you for choosing *${storeName}*!`;

    case 'confirmed':
      return `Hello ${customerName},

Your order request has been *CONFIRMED* by *${storeName}*! 🪔✨

*Order Reference:* ${orderId}
*Current Status:* Confirmed & Reserved
*Ordered Items:*
${itemList}

*Total Bill:* ${totalBill}
*Delivery Address:* ${order.customerInfo.address}

We have reserved your items and our team is preparing them for packaging. We will update you once your parcel is packed and ready for dispatch.

Track live order status:
${trackingUrl}

Thank you for shopping with *${storeName}*!`;

    case 'processing':
      return `Hello ${customerName},

Update on your order #${orderId}: Your items are currently being *PACKED* with festive care! 📦✨🪔

*Order Reference:* ${orderId}
*Current Status:* Packaging in Progress
*Customer:* ${customerName}
*Delivery Address:* ${order.customerInfo.address}

Each handcrafted diya is being carefully inspected, bubble-wrapped, and packed for safe transport.

Track live packaging & shipping progress:
${trackingUrl}

Warm regards,
*${storeName}*`;

    case 'ready':
      return `Hello ${customerName},

Exciting news! Your order #${orderId} is packed, sealed, and *READY FOR TRANSPORT*! 🚚✨🪔

*Order Reference:* ${orderId}
*Current Status:* Ready for Transport / Dispatch
*Customer:* ${customerName}
*Delivery Address:* ${order.customerInfo.address}
*Total Payable:* ${totalBill}

Your package has been prepared for local transport dispatch. Please ensure someone is available at the delivery location.

Track live dispatch updates:
${trackingUrl}

Thank you for choosing *${storeName}*!`;

    case 'delivered':
      return `Hello ${customerName},

Your order #${orderId} from *${storeName}* has been successfully *DELIVERED & FULFILLED*! 🪔🎉✨

*Order Reference:* ${orderId}
*Status:* Delivered / Fulfilled
*Total:* ${totalBill}

May our sacred diyas bring immense light, prosperity, peace, and festive happiness to your home and loved ones.

We would love to hear your feedback! If you need any assistance, feel free to reply to this message.

With warm regards & divine blessings,
*${storeName}* 🪔`;

    case 'cancel_requested':
      return `Hello ${customerName},

We have received your cancellation request for order #${orderId}.

*Order Reference:* ${orderId}
*Current Status:* Cancellation Request Under Review
${order.cancellationReason ? `*Reason Stated:* "${order.cancellationReason}"\n` : ''}
Our store admin is reviewing your request. We will update you shortly on this chat.

Support Helpline: ${supportPhone}
*${storeName}*`;

    case 'cancelled':
      return `Hello ${customerName},

This is an update regarding order #${orderId} with *${storeName}*.

*Order Reference:* ${orderId}
*Current Status:* Cancelled

Your order has been cancelled by our store admin. If you did not request this or have any queries, please reach out to us directly.

Support Helpline: ${supportPhone}
Thank you, *${storeName}*`;

    default:
      return `Hello ${customerName},

Update regarding your order #${orderId} with *${storeName}*:

*Order Reference:* ${orderId}
*Current Status:* ${String(status).toUpperCase().replace(/_/g, ' ')}
*Total Bill:* ${totalBill}

Track live status anytime:
${trackingUrl}

Thank you!
*${storeName}*`;
  }
}

/**
 * Builds a WhatsApp message from Admin to Customer confirming pre-order acceptance.
 * Preserved for backward compatibility.
 */
export function buildWhatsAppPreOrderAcceptedMessage(order: Order): string {
  return buildWhatsAppStatusMessage(order, 'pre_order_confirmed');
}

/**
 * Helper function to trigger WhatsApp link in a NEW separate browser tab (target="_blank").
 */
function openWhatsAppUrl(url: string): boolean {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.warn('[WhatsApp] Opening link in new tab failed, fallback to window.open:', err);
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
}

/**
 * Opens WhatsApp deep-link with checkout order request message in a NEW tab.
 */
export function openWhatsAppOrderLink(order: Order, whatsappNumber?: string): boolean {
  const phone = (whatsappNumber || env.store.supportPhone).replace(/[^0-9]/g, '');
  const message = buildWhatsAppOrderMessage(order);
  const encodedText = encodeURIComponent(message);
  const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
  const url = `https://wa.me/${formattedPhone}?text=${encodedText}`;
  return openWhatsAppUrl(url);
}

/**
 * Opens WhatsApp deep-link with dedicated support inquiry message from the Order Tracking page in a NEW tab.
 */
export function openWhatsAppSupportLink(order: Order, whatsappNumber?: string): boolean {
  const phone = (whatsappNumber || env.store.supportPhone).replace(/[^0-9]/g, '');
  const message = buildWhatsAppSupportMessage(order);
  const encodedText = encodeURIComponent(message);
  const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
  const url = `https://wa.me/${formattedPhone}?text=${encodedText}`;
  return openWhatsAppUrl(url);
}

/**
 * Opens WhatsApp deep-link from Admin to Customer with status-specific notification message in a NEW tab.
 */
export function openWhatsAppStatusMessageLink(order: Order, status: OrderStatus): boolean {
  const rawPhone = order.customerInfo.phone.replace(/[^0-9]/g, '');
  const message = buildWhatsAppStatusMessage(order, status);
  const encodedText = encodeURIComponent(message);
  const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
  const url = `https://wa.me/${formattedPhone}?text=${encodedText}`;
  return openWhatsAppUrl(url);
}

/**
 * Opens WhatsApp deep-link from Admin to Customer confirming pre-order acceptance in a NEW tab.
 * Preserved for backward compatibility.
 */
export function openWhatsAppPreOrderAcceptedLink(order: Order): boolean {
  return openWhatsAppStatusMessageLink(order, 'pre_order_confirmed');
}

/**
 * Builds a prefilled WhatsApp inquiry message when a customer is interested in an out-of-stock product.
 */
export function buildWhatsAppProductInterestMessage(product: Product, storeName = env.store.name): string {
  const productUrl = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
    ? `${window.location.origin}/?product=${encodeURIComponent(product.id)}`
    : `https://diyasnduas.web.app/?product=${encodeURIComponent(product.id)}`;

  return `Hello ${storeName}, 🪔✨

I am interested in purchasing this product, but noticed it is currently out of stock:

*Product Name:* ${product.name}
*Price:* ${formatINR(product.sellingPrice)}${product.categoryName ? `\n*Category:* ${product.categoryName}` : ''}
*Product Link:* ${productUrl}

Could you please let me know if this item can be arranged or when it will be back in stock?

Thank you!`;
}

/**
 * Opens WhatsApp inquiry for an out-of-stock product in a NEW tab.
 */
export function openWhatsAppProductInterest(product: Product, whatsappNumber?: string, storeName?: string): boolean {
  const targetPhone = whatsappNumber || env.store.supportPhone;
  const rawPhone = targetPhone.replace(/[^0-9]/g, '');
  const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
  const message = buildWhatsAppProductInterestMessage(product, storeName);
  const encodedText = encodeURIComponent(message);
  const url = `https://wa.me/${formattedPhone}?text=${encodedText}`;
  return openWhatsAppUrl(url);
}
