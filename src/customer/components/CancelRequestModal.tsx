import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { ordersService } from '../../services/orders.service';

interface CancelRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}

export const CancelRequestModal: React.FC<CancelRequestModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.warning('Reason Required', 'Please enter a reason for cancelling your order.');
      return;
    }

    try {
      setSubmitting(true);
      await ordersService.requestOrderCancellation(orderId, reason.trim());
      toast.success(
        'Cancellation Requested',
        `Cancellation request submitted for Order #${orderId}. Pending store admin review.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[CancelRequestModal]', err);
      toast.error('Submission Failed', err.message || 'Failed to submit cancellation request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Order Cancellation">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            Your cancellation request will be submitted to our store admin for review and approval.
          </span>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Cancellation Reason *
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Ordered by mistake, need to change delivery address, or plans changed..."
            className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5"
            required
          />
        </div>

        <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={submitting}
            className="font-bold bg-rose-600 hover:bg-rose-700 text-white border-none shadow-md"
          >
            Submit Cancel Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};
