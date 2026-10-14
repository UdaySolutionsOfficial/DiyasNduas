import { Order } from '../types/order';
import { formatINR } from './formatters';
import { env } from '../config/env';

/**
 * Builds a clean prefilled WhatsApp message for initial checkout / order confirmation.
 */
export function buildWhatsAppOrderMessage(order: Order): string {
  const itemList = order.items
    .map((item) => `• ${item.name} × ${item.quantity} (${formatINR(item.subtotal)})`)
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

  return `Hello ${env.store.name},

I have placed an order request on your website.

*Order Reference:* ${order.orderId}
*Customer:* ${order.customerInfo.fullName}
*Phone:* ${order.customerInfo.phone}
*Delivery Address:* ${order.customerInfo.address}
${order.customerInfo.notes ? `*Notes:* ${order.customerInfo.notes}\n` : ''}
*Ordered Items:*
${itemList}

${breakdownDetails}

Please confirm my order and payment instructions.
Thank you!`;
}

/**
 * Builds a dedicated prefilled WhatsApp support/inquiry message for the Order Tracking page.
 */
export function buildWhatsAppSupportMessage(order: Order): string {
  const itemList = order.items
    .map((item) => `• ${item.name} × ${item.quantity} (${formatINR(item.subtotal)})`)
    .join('\n');

  const statusLabel = order.orderStatus.toUpperCase().replace('_', ' ');

  return `Hello ${env.store.name},

I need support regarding my order request.

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
