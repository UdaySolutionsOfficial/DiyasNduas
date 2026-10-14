import React from 'react';
import { Order } from '../../types/order';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { formatINR, formatDate } from '../../utils/formatters';
import { Printer, Sparkles } from 'lucide-react';
import { env } from '../../config/env';

export interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    const receiptElement = document.getElementById('printable-receipt');
    if (!receiptElement) {
      window.print();
      return;
    }

    // Create an isolated hidden print iframe so ONLY the receipt document prints
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt #${order.orderId}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 15mm;
              }
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 10px;
                color: #0f172a;
                background: #ffffff;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              * {
                box-sizing: border-box;
              }
              #printable-receipt {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 auto !important;
                padding: 24px !important;
                border: 2px solid #0f172a !important;
                border-radius: 12px !important;
                background: #ffffff !important;
                color: #0f172a !important;
              }
              .border-b { border-bottom: 1px solid #e2e8f0; }
              .border-t-2 { border-top: 2px solid #0f172a; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-bold { font-weight: 700; }
              .font-black { font-weight: 900; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
              .col-span-2 { grid-column: span 2; }
              table { width: 100%; border-collapse: collapse; margin-top: 8px; }
              th, td { padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: left; }
              th { border-bottom: 2px solid #0f172a; font-weight: 800; font-size: 11px; text-transform: uppercase; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .items-baseline { align-items: baseline; }
              .space-y-1 > * + * { margin-top: 4px; }
              .space-y-2 > * + * { margin-top: 8px; }
              .space-y-5 > * + * { margin-top: 20px; }
              .pt-3 { padding-top: 12px; }
              .pb-4 { padding-bottom: 16px; }
              .text-xs { font-size: 12px; }
              .text-sm { font-size: 14px; }
              .text-2xl { font-size: 24px; }
              .text-lg { font-size: 18px; }
              .text-brand-700 { color: #0055a7; }
              .text-slate-400 { color: #94a3b8; }
              .text-slate-500 { color: #64748b; }
              .text-slate-700 { color: #334155; }
              .text-slate-900 { color: #0f172a; }
            </style>
          </head>
          <body>
            ${receiptElement.outerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 250);
    }
  };

  return (
    <Modal isOpen={Boolean(order)} onClose={onClose} title={`Print Receipt #${order.orderId}`}>
      <div className="space-y-6">
        {/* Printable Receipt Card Container */}
        <div id="printable-receipt" className="p-6 bg-white text-slate-900 rounded-2xl border border-slate-200 space-y-5 font-sans">
          {/* Receipt Brand Header */}
          <div className="text-center space-y-1 pb-4 border-b border-slate-200">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold uppercase tracking-widest border border-brand-200">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{env.store.name}</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">DIYAS N DUAS</h2>
            <p className="text-xs text-slate-500">Premium Handcrafted Festive Diyas & Sacred Essentials</p>
            <p className="text-[11px] text-slate-400 font-medium">Support Call: {env.store.supportPhone}</p>
          </div>

          {/* Receipt Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs py-1 border-b border-slate-200">
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Order Reference</span>
              <span className="font-mono font-black text-sm text-brand-700">{order.orderId}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Order Date & Time</span>
              <span className="font-semibold text-slate-700">{formatDate(order.createdAt)}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Customer Name</span>
              <span className="font-bold text-slate-900">{order.customerInfo.fullName}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Mobile Phone</span>
              <span className="font-bold text-slate-900">{order.customerInfo.phone}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Delivery / Local Address</span>
              <span className="font-semibold text-slate-800">{order.customerInfo.address}</span>
            </div>
          </div>

          {/* Ordered Item Snapshots Table */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Ordered Items Breakdown</h4>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-1.5 font-bold">Item Description</th>
                  <th className="py-1.5 text-center font-bold">Qty</th>
                  <th className="py-1.5 text-right font-bold">Unit Price</th>
                  <th className="py-1.5 text-right font-bold">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="text-slate-800">
                    <td className="py-2 font-bold max-w-[160px] truncate">{item.name}</td>
                    <td className="py-2 text-center font-semibold">{item.quantity}</td>
                    <td className="py-2 text-right">{formatINR(item.unitPrice)}</td>
                    <td className="py-2 text-right font-black">{formatINR(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals Summary */}
          <div className="pt-3 border-t-2 border-slate-900 space-y-1.5 text-xs text-right">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal:</span>
              <span className="font-bold">{formatINR(order.subtotal)}</span>
            </div>
            {order.couponCode && order.couponDiscount ? (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Coupon Discount ({order.couponCode}):</span>
                <span>- {formatINR(order.couponDiscount)}</span>
              </div>
            ) : null}
            {order.taxAmount && order.taxAmount > 0 ? (
              <div className="flex justify-between text-slate-600">
                <span>{order.taxName || 'GST'} ({order.taxRate || 5}%):</span>
                <span className="font-bold">+{formatINR(order.taxAmount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-slate-600">
              <span>Delivery Charges:</span>
              <span className="font-bold">
                {order.deliveryFee === 0 ? 'FREE' : formatINR(order.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Amount:</span>
              <span className="text-lg text-brand-700">{formatINR(order.total)}</span>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-medium">
            Thank you for celebrating with Diyas N Duas! Please preserve this order receipt for delivery verification.
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-3 no-print">
          <Button variant="ghost" size="md" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="md" onClick={handlePrint} className="font-bold" leftIcon={<Printer className="w-4 h-4" />}>
            <span>Print A4 Receipt</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
