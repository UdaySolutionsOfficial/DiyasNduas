import React, { useEffect, useState } from 'react';
import { ordersService } from '../../services/orders.service';
import { Order, OrderStatus } from '../../types/order';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { formatINR, formatDate } from '../../utils/formatters';
import { Eye, Printer, Trash2, FileSpreadsheet, Sparkles } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { revenueExportService } from '../../services/revenueExport.service';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Delete Confirmation Dialog State
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const toast = useToast();

  const loadData = async () => {
    try {
      const data = await ordersService.getAllOrders();
      setOrders(data);
    } catch (err) {
      console.warn('[AdminOrders]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Realtime listener for instant RTDB push updates
    const unsubscribe = ordersService.subscribeToAllOrders((updatedOrders) => {
      setOrders(updatedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus, note?: string) => {
    try {
      await ordersService.updateOrderStatus(orderId, newStatus, note);
      toast.success('Order Status Updated', `Order status updated to "${newStatus}".`);
      
      // Update selected order in state if details modal is open
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.orderId === orderId)) {
        const updatedObj = await ordersService.getOrderById(orderId);
        setSelectedOrder(updatedObj);
      }
    } catch (err) {
      console.error('[Update Order Status Error]', err);
      toast.error('Update Failed', 'Failed to update order status.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    try {
      await ordersService.deleteOrder(orderToDelete.id);
      toast.success('Order Deleted', `Order #${orderToDelete.orderId} permanently deleted.`);
      setShowDeleteDialog(false);
      setOrderToDelete(null);
      loadData();
    } catch (err) {
      console.error('[Delete Order Error]', err);
      toast.error('Delete Failed', 'Failed to delete order record.');
    }
  };

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Pending Store Confirmation', value: 'pending' },
    { label: 'Pre-Order Accepted', value: 'pre_order_confirmed' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Packaging / Processing', value: 'processing' },
    { label: 'Ready for Transport', value: 'ready' },
    { label: 'Delivered / Fulfilled', value: 'delivered' },
    { label: 'Cancel Requested', value: 'cancel_requested' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  // Search & Filter
  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      o.orderId.toLowerCase().includes(q) ||
      o.customerInfo.fullName.toLowerCase().includes(q) ||
      o.customerInfo.phone.includes(q);

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && o.orderStatus !== statusFilter) return false;
    return true;
  });

  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'pre_order_confirmed':
        return (
          <Badge className="bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700 font-bold">
            ✨ Pre-Order Accepted
          </Badge>
        );
      case 'confirmed':
        return <Badge variant="brand">Confirmed</Badge>;
      case 'processing':
        return <Badge variant="brand">Processing</Badge>;
      case 'ready':
        return <Badge variant="success">Ready</Badge>;
      case 'delivered':
        return <Badge variant="success">Delivered</Badge>;
      case 'cancel_requested':
        return <Badge variant="warning">Cancel Requested</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (loading) {
    return <Loading message="Loading customer order requests..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Order Request Management</h1>
          <p className="text-sm text-slate-500">Review incoming orders, manage statuses, and print receipts.</p>
        </div>
        <Button
          onClick={() => revenueExportService.exportOrdersLedger(filteredOrders, statusFilter !== 'all' ? statusFilter : undefined)}
          variant="secondary"
          size="sm"
          className="font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-xs border-slate-300 dark:border-slate-700 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-500" />}
        >
          <span>Export Excel ({filteredOrders.length})</span>
        </Button>
      </div>

      {/* Search & Filter Controls */}
      <Card glass className="p-4 flex flex-col sm:flex-row gap-3">
        <SearchInput
          placeholder="Search by Order ID, Customer Name, or Phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          className="flex-1"
        />
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-56"
        />
      </Card>

      {/* Order Cards Grid */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <p className="text-center text-slate-500 py-10 text-sm">No matching order requests found.</p>
        ) : (
          filteredOrders.map((order) => {
            const isPreOrder = Boolean(
              order.isPreOrder ||
              order.orderType === 'pre_order' ||
              order.orderType === 'mixed' ||
              order.items?.some((i) => i.isPreOrder)
            );

            return (
              <Card
                key={order.id}
                glass
                className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border ${
                  order.orderStatus === 'cancel_requested'
                    ? 'border-amber-500/50 bg-amber-500/5'
                    : isPreOrder
                    ? 'border-purple-300/40 dark:border-purple-800/40'
                    : ''
                }`}
              >
                {/* Order Info & Customer Details */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-black text-brand-600 dark:text-brand-400 text-base">
                      {order.orderId}
                    </span>
                    {renderStatusBadge(order.orderStatus)}
                    {isPreOrder && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        <Sparkles className="w-2.5 h-2.5" />
                        {order.orderType === 'mixed' ? 'Mixed Order' : 'Pre-Order'}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">{formatDate(order.createdAt)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700 dark:text-slate-300 pt-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{order.customerInfo.fullName}</span>
                    <span className="text-slate-500">📞 {order.customerInfo.phone}</span>
                    <span className="text-slate-500">📍 {order.customerInfo.address}</span>
                  </div>

                  <div className="text-xs text-slate-400 font-medium">
                    {order.itemCount} items ordered
                  </div>
                </div>

                {/* Total & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-left md:text-right">
                    <span className="text-xs text-slate-400 block font-semibold">Total</span>
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                      {formatINR(order.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedOrder(order);
                      }}
                      className="font-bold text-xs"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      <span>Details</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReceiptOrder(order)}
                      className="px-2.5"
                      title="Print Receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setOrderToDelete(order);
                        setShowDeleteDialog(true);
                      }}
                      className="px-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete Order"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Details & Status Update Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
        onPrintReceipt={(order) => setReceiptOrder(order)}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />

      {/* Permanent Order Delete Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Order Record Permanently"
        message={`Are you sure you want to permanently delete order #${orderToDelete?.orderId}? This cannot be undone.`}
        confirmText="Delete Order"
        isDestructive
      />
    </div>
  );
};
