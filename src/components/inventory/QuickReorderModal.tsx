import React, { useState } from 'react';
import { 
  X, ShoppingCart, Truck, AlertTriangle, CheckCircle2, 
  Sparkles, DollarSign, Clock, MessageSquare, Copy, Check,
  ChevronUp, ChevronDown, ArrowRight, ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StockMonitorAnalysis } from '../../types/index.ts';
import { api } from '../../lib/api.ts';

interface QuickReorderModalProps {
  item: StockMonitorAnalysis | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (po: any) => void;
}

export const QuickReorderModal: React.FC<QuickReorderModalProps> = ({
  item,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !item) return null;

  const [quantity, setQuantity] = useState<number>(item.suggestedReorderQty || 10);
  const [coverageDays, setCoverageDays] = useState<number>(item.targetCoverageDays || 5);
  const [notes, setNotes] = useState<string>(`Velocity-based automated reorder for ${item.itemName}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Recalculate if user shifts coverage days
  const handleCoverageChange = (days: number) => {
    setCoverageDays(days);
    const newTarget = (item.dailySalesVelocity * days) + (item.dailySalesVelocity * item.leadTimeDays * 1.5);
    const newQty = Math.max(1, Math.ceil(newTarget - item.currentStock));
    setQuantity(newQty);
  };

  const estimatedSubtotal = Math.round(quantity * item.costPerUnit);
  const estimatedTax = Math.round(estimatedSubtotal * 0.05);
  const estimatedTotal = estimatedSubtotal + estimatedTax;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/inventory/quick-reorder', {
        itemId: item.itemId,
        quantity,
        supplierId: item.supplierId,
        notes,
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      onSuccess(res.purchaseOrder);
      onClose();
    } catch (err) {
      console.error('Failed to create quick purchase order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyWhatsApp = () => {
    const text = `📦 *PURCHASE ORDER — ZAFRAN GOURMET BISTRO*\n` +
      `Supplier: *${item.supplierName}*\n` +
      `Item: *${item.itemName}* (SKU: ${item.sku || 'N/A'})\n` +
      `Required Quantity: *${quantity} ${item.unit}*\n` +
      `Agreed Rate: ₹${item.costPerUnit}/${item.unit} (Est: ₹${estimatedTotal})\n` +
      `Urgency: ${item.urgencyLevel === 'CRITICAL' ? '🚨 URGENT — Stockout imminent within ' + item.runwayDisplay : 'Standard Restock'}\n` +
      `Delivery Location: Zafran Bistro Cyber Hub Loading Bay\n` +
      `Please confirm dispatch & expected delivery ETA. Thank you!`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              item.badgeVariant === 'critical' 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Suggested Velocity Reorder
                </h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
                  item.badgeVariant === 'critical'
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}>
                  {item.badgeLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auto-calculated from sales burn velocity and supplier lead time
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handlePlaceOrder} className="p-6 space-y-5">
          
          {/* Target Product Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-sm font-bold text-white block">{item.itemName}</span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Supplier: <strong className="text-slate-300">{item.supplierName}</strong>
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-slate-400 block">Current Stock</span>
                <span className="text-sm font-mono font-bold text-amber-400">
                  {item.currentStock} {item.unit}
                </span>
              </div>
            </div>

            {/* Velocity & Runway Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-850 text-center">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Daily Burn Rate</span>
                <span className="text-xs font-mono font-bold text-white">
                  {item.dailySalesVelocity} {item.unit}/day
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Stock Runway</span>
                <span className={`text-xs font-mono font-bold ${
                  item.runwayHours < 24 ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {item.runwayDisplay}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Unit Cost</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  ₹{item.costPerUnit}/{item.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Coverage Days Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Target Coverage Window:
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                Includes {item.leadTimeDays}d supplier buffer
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[3, 5, 7].map(days => (
                <button
                  type="button"
                  key={days}
                  onClick={() => handleCoverageChange(days)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    coverageDays === days
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
                  }`}
                >
                  {days} Days Supply
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Stepper */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Reorder Quantity ({item.unit}):
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 5))}
                className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
              >
                -1
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-center text-lg font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  {item.unit}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 5)}
                className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
              >
                +5
              </button>
            </div>
          </div>

          {/* Cost Estimate Pill */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
            <div className="text-emerald-300">
              <span className="block font-bold">Estimated Procurement Cost</span>
              <span className="text-[10px] text-emerald-400/80 font-mono">
                {quantity} {item.unit} × ₹{item.costPerUnit} + 5% GST
              </span>
            </div>
            <div className="text-right">
              <span className="text-base font-black font-mono text-emerald-300">
                ₹{estimatedTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="px-4 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              title="Copy formatted purchase order message for WhatsApp"
            >
              {copiedWhatsApp ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp PO</span>
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Truck className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'Creating Purchase Order...' : 'Generate Purchase Order'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
