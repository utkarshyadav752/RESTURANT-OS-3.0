import React, { useState, useEffect } from 'react';
import { 
  Receipt, Search, Printer, RotateCcw, AlertTriangle, 
  CheckCircle2, X, Download, ShieldCheck
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Order } from '../../types/index.ts';

export const OrdersBillingView: React.FC = () => {
  const { currentBranch, restaurant, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await api.get(`/orders?branchId=${currentBranch?.id || ''}`);
        setOrders(res || []);
        if (res && res.length > 0 && !selectedOrder) {
          setSelectedOrder(res[0]);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      }
    }
    loadOrders();
  }, [currentBranch]);

  const filteredOrders = orders.filter(o => statusFilter === 'ALL' || o.status === statusFilter);

  const handleRefund = async () => {
    if (!selectedOrder || !refundReason) return;
    try {
      await api.post(`/pos/orders/${selectedOrder.id}/refund`, {
        reason: refundReason,
        userId: user?.id,
        userName: user?.name,
        userRole: user?.role,
      });
      // Refresh
      const res = await api.get(`/orders?branchId=${currentBranch?.id || ''}`);
      setOrders(res || []);
      const updated = res.find((o: Order) => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
      setShowRefundModal(false);
      setRefundReason('');
    } catch (err) {
      console.error('Refund processing failed:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            Billing Engine & Order Invoices
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            GST invoice generation, split settlements, payment records, and financial refund audits
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex p-0.5 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold">
          {['ALL', 'COMPLETED', 'BILLING', 'PREPARING', 'CANCELLED'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === s ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Orders Feed */}
        <div className="lg:col-span-6 space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 rounded-2xl bg-slate-900/60 border border-slate-800">
              No orders found for selected filter
            </div>
          ) : (
            filteredOrders.map(order => {
              const isSelected = selectedOrder?.id === order.id;

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/10'
                      : 'border-slate-800/80 bg-slate-900/70 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black font-mono text-white">
                        {order.order_number}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                        order.payment_status === 'PAID'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : order.payment_status === 'REFUNDED'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {order.payment_status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-medium truncate">
                      {order.customer_name || 'Walk-in Guest'} · {order.table_number || order.order_type}
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {order.items.length} items
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-black font-mono text-amber-400">
                      ₹{order.grand_total}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {order.payment_method || 'PENDING'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Invoice & Printable Receipt Preview */}
        <div className="lg:col-span-6">
          {selectedOrder ? (
            <div className="p-6 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-700 space-y-4 shadow-2xl">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tax Invoice Preview (80mm Format)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    Print Receipt
                  </button>

                  {selectedOrder.payment_status === 'PAID' && (
                    <button
                      onClick={() => setShowRefundModal(true)}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Refund
                    </button>
                  )}
                </div>
              </div>

              {/* Printable Receipt Container */}
              <div id="printable-receipt" className="p-6 rounded-2xl bg-white text-slate-950 font-mono text-xs space-y-3 shadow-md max-w-sm mx-auto">
                <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">{restaurant?.name || 'ZAFRAN GOURMET BISTRO'}</h3>
                  <p className="text-[10px] text-slate-600">{currentBranch?.address}</p>
                  <p className="text-[10px] text-slate-600">GSTIN: {restaurant?.gstin || '07AABCT2345A1Z5'}</p>
                  <p className="text-[10px] text-slate-600">Tel: {currentBranch?.contact_number}</p>
                </div>

                <div className="flex justify-between text-[11px] border-b border-dashed border-slate-300 pb-2">
                  <div>
                    <div>Bill: <strong>{selectedOrder.order_number}</strong></div>
                    <div>Table: <strong>{selectedOrder.table_number || 'Takeaway'}</strong></div>
                  </div>
                  <div className="text-right">
                    <div>Date: {new Date(selectedOrder.created_at).toLocaleDateString()}</div>
                    <div>Time: {new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                    <span>Item</span>
                    <span>Qty x Price</span>
                    <span>Total</span>
                  </div>
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span className="truncate max-w-[140px]">{it.name}</span>
                      <span>{it.quantity} x {it.price}</span>
                      <span className="font-bold">₹{it.item_total}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount ({selectedOrder.discount_reason}):</span>
                      <span>-₹{selectedOrder.discount_amount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>CGST ({restaurant?.cgst_rate || 2.5}%):</span>
                    <span>₹{selectedOrder.cgst_amount}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST ({restaurant?.sgst_rate || 2.5}%):</span>
                    <span>₹{selectedOrder.sgst_amount}</span>
                  </div>
                  {selectedOrder.service_charge > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Service Charge ({restaurant?.service_charge_rate}%):</span>
                      <span>₹{selectedOrder.service_charge}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-slate-400">
                    <span>GRAND TOTAL:</span>
                    <span>₹{selectedOrder.grand_total}</span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-500 pt-1">
                  <p>Paid via: {selectedOrder.payment_method || 'CASH'}</p>
                  <p className="mt-1 font-sans">Thank you for dining with us!</p>
                  <p className="font-sans">Powered by RestaurantOS</p>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 rounded-3xl bg-slate-900 border border-slate-800">
              Select an order to view invoice breakdown
            </div>
          )}
        </div>

      </div>

      {/* Refund Modal */}
      {showRefundModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-400" />
                Process Order Refund
              </h3>
              <button
                onClick={() => setShowRefundModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              Refunding <strong>₹{selectedOrder.grand_total}</strong> for {selectedOrder.order_number}. This financial event will be permanently written to the statutory audit trail.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mandatory Refund Reason *
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Customer disputed preparation or billing discrepancy..."
                rows={3}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowRefundModal(false)}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={!refundReason.trim()}
                className="flex-1 py-2 px-4 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-40 cursor-pointer"
              >
                Approve & Execute Refund
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
