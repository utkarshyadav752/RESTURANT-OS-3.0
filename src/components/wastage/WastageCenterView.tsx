import React, { useState, useEffect } from 'react';
import { 
  Trash2, AlertTriangle, TrendingDown, DollarSign, 
  Flame, Plus, Calendar, ShieldCheck, Scale
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { WastageEntry, InventoryItem } from '../../types/index.ts';

export const WastageCenterView: React.FC = () => {
  const { currentBranch, user } = useAuth();
  const [entries, setEntries] = useState<WastageEntry[]>([]);
  const [totalLoss, setTotalLoss] = useState<number>(0);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  
  // Log waste modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [wasteQty, setWasteQty] = useState<number>(1);
  const [wasteReason, setWasteReason] = useState<WastageEntry['reason']>('SPOILED');
  const [wasteNotes, setWasteNotes] = useState('');

  useEffect(() => {
    async function loadWastageData() {
      try {
        const [wRes, invRes] = await Promise.all([
          api.get(`/wastage?branchId=${currentBranch?.id || ''}`),
          api.get(`/inventory?branchId=${currentBranch?.id || ''}`),
        ]);
        setEntries(wRes.entries || []);
        setTotalLoss(wRes.totalLossCost || 0);
        setInventoryItems(invRes.items || []);
        if (invRes.items && invRes.items.length > 0) {
          setSelectedItemId(invRes.items[0].id);
        }
      } catch (err) {
        console.error('Error fetching wastage:', err);
      }
    }
    loadWastageData();
  }, [currentBranch]);

  const handleLogWastage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || wasteQty <= 0) return;
    try {
      const res = await api.post('/wastage', {
        inventoryItemId: selectedItemId,
        branchId: currentBranch?.id,
        quantity: wasteQty,
        reason: wasteReason,
        reportedBy: user?.name || 'Chef Vikram Singh',
        userId: user?.id || 'user_kitchen',
        userRole: user?.role || 'KITCHEN',
        notes: wasteNotes,
      });

      setEntries(prev => [res.wastage, ...prev]);
      setTotalLoss(prev => prev + res.wastage.total_loss_cost);
      setShowLogModal(false);
      setWasteNotes('');
      setWasteQty(1);
    } catch (err) {
      console.error('Failed to log wastage:', err);
    }
  };

  const reasons = [
    'SPOILED', 'EXPIRED', 'OVER_PREPARATION', 'BURNED',
    'DAMAGED', 'WRONG_ORDER', 'CUSTOMER_RETURN', 'OTHER'
  ] as const;

  // Waste Heatmap mock days of week
  const heatmapDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-400" />
              Waste-to-Profit Intelligence Center
            </h2>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
              Kitchen Cost Recovery
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Turn invisible kitchen bin loss into measurable margin recovery and prevent food spoilage
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Log Kitchen Wastage
        </button>
      </div>

      {/* Waste-to-Profit Multiplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1 h-full shadow-sm hover:border-stone-700 transition-colors">
          <span className="text-[10px] font-bold uppercase text-stone-400">Total Recorded Waste Loss</span>
          <div className="text-2xl font-black font-mono text-rose-400">₹{totalLoss.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-stone-400">This current billing cycle</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1 h-full shadow-sm hover:border-stone-700 transition-colors">
          <span className="text-[10px] font-bold uppercase text-stone-400">Profit Margin Equivalent</span>
          <div className="text-2xl font-black font-mono text-amber-400">
            {Math.round(totalLoss / 321.6)} Dishes
          </div>
          <div className="text-[11px] text-stone-400">Equal to profit from {Math.round(totalLoss / 321.6)} Butter Chickens lost</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1 h-full shadow-sm hover:border-stone-700 transition-colors">
          <span className="text-[10px] font-bold uppercase text-stone-400">Annual Run-Rate Exposure</span>
          <div className="text-2xl font-black font-mono text-purple-400">
            ₹{(totalLoss * 12).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-stone-400">Estimated if current waste rate continues unaddressed</div>
        </div>
      </div>

      {/* Waste Heatmap Matrix */}
      <div className="p-5 rounded-2xl glass-panel-elevated bg-slate-900/90 border border-slate-700/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Weekly Kitchen Spoilage & Burning Heatmap</h3>
            <p className="text-[11px] text-slate-400">Identifies shifts and days with recurring ingredient loss</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
            <span>Low</span>
            <span className="w-3 h-3 rounded bg-slate-800" />
            <span className="w-3 h-3 rounded bg-amber-500/40" />
            <span className="w-3 h-3 rounded bg-rose-500" />
            <span>High</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {heatmapDays.map((day, idx) => {
            const isHeavy = day === 'Sun' || day === 'Tue';
            const isMedium = day === 'Fri' || day === 'Sat';

            return (
              <div
                key={day}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isHeavy
                    ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                    : isMedium
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <div className="text-xs font-bold uppercase">{day}</div>
                <div className="text-sm font-mono font-bold mt-1">
                  {isHeavy ? '₹612' : isMedium ? '₹340' : '₹90'}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  {isHeavy ? 'Dinner rush' : 'Routine'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wastage Incident Log Table */}
      <div className="rounded-2xl glass-panel-elevated bg-slate-900/90 border border-slate-700/80 overflow-hidden shadow-2xl">
        <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 text-xs font-bold text-slate-300">
          Recent Wastage Incidents
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] bg-slate-950/40">
                <th className="py-2.5 px-4 font-sans">Timestamp</th>
                <th className="py-2.5 px-4 font-sans">Ingredient</th>
                <th className="py-2.5 px-4 font-sans">Quantity Wasted</th>
                <th className="py-2.5 px-4 font-sans">Financial Loss</th>
                <th className="py-2.5 px-4 font-sans">Root Cause</th>
                <th className="py-2.5 px-4 font-sans">Reported By & Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {entries.map(w => (
                <tr key={w.id} className="hover:bg-slate-850/60">
                  <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                    {new Date(w.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-4 font-sans font-bold text-white">
                    {w.item_name}
                  </td>
                  <td className="py-2.5 px-4 text-slate-200">
                    {w.quantity} {w.unit}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-rose-400">
                    ₹{w.total_loss_cost}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {w.reason}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-400 text-[11px]">
                    <span className="text-slate-300">{w.notes || 'Routine prep trim'}</span>
                    <span className="block text-slate-500 text-[10px]">By {w.reported_by}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Wastage Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-700 space-y-4">
            <h3 className="text-base font-bold text-white">Record Kitchen Food Wastage</h3>
            <p className="text-xs text-slate-400">
              Every log updates the double-entry stock ledger with a negative balance and calculates true food cost impact.
            </p>

            <form onSubmit={handleLogWastage} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ingredient Discarded *
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.current_stock} {item.unit} available · ₹{item.cost_per_unit}/{item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Quantity Discarded *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={0.1}
                  value={wasteQty}
                  onChange={(e) => setWasteQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Wastage Reason Category
                </label>
                <select
                  value={wasteReason}
                  onChange={(e) => setWasteReason(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  {reasons.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kitchen Notes / Context
                </label>
                <input
                  type="text"
                  value={wasteNotes}
                  onChange={(e) => setWasteNotes(e.target.value)}
                  placeholder="e.g. Burned during high flame flare-up on tandoor station..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Log Wastage & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
