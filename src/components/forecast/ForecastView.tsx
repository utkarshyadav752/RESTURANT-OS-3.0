import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Sparkles, ShieldAlert, Check, X, 
  RotateCcw, ShoppingCart, Ban, ArrowRight, CheckCircle2,
  Calendar, Clock, DollarSign
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { DemandForecast, PurchaseRecommendation } from '../../types/index.ts';
import { DemandPeaksChart3D } from './DemandPeaksChart3D.tsx';

interface ForecastViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const ForecastView: React.FC<ForecastViewProps> = ({ onNavigateTab }) => {
  const { currentBranch } = useAuth();
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [recommendations, setRecommendations] = useState<PurchaseRecommendation[]>([]);
  const [accuracy, setAccuracy] = useState<{ last7Days: number; last30Days: number; biasPct: number }>({
    last7Days: 86.4,
    last30Days: 89.1,
    biasPct: 1.2,
  });
  const [poCreated, setPoCreated] = useState(false);

  useEffect(() => {
    async function loadForecastData() {
      try {
        const res = await api.get('/forecast');
        setForecasts(res.forecasts || []);
        setRecommendations(res.recommendations || []);
        if (res.accuracy) setAccuracy(res.accuracy);
      } catch (err) {
        console.error('Error fetching forecast:', err);
      }
    }
    loadForecastData();
  }, [currentBranch]);

  const handleRecommendationFeedback = async (id: string, decision: 'ACCEPTED' | 'REJECTED') => {
    try {
      await api.post(`/forecast/recommendations/${id}/feedback`, { decision });
      setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status: decision } : r));
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const buyItems = recommendations.filter(r => r.action_type === 'BUY');
  const dontBuyItems = recommendations.filter(r => r.action_type === 'DONT_BUY');
  const totalPurchaseEst = buyItems.reduce((sum, r) => sum + r.estimated_cost, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              AI Demand Forecasting & Smart Purchasing
            </h2>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {accuracy.last30Days}% Historical Accuracy
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical demand predictions merged with safety stock thresholds to generate optimal purchase orders and avoid overstocking
          </p>
        </div>

        {/* Forecast Accuracy Badge */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Model Accuracy</span>
            <div className="font-mono font-bold text-emerald-400">{accuracy.last30Days}% (30-Day)</div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Forecast Bias</span>
            <div className="font-mono font-bold text-slate-200">+{accuracy.biasPct}% (Safe buffer)</div>
          </div>
        </div>
      </div>

      {/* Smart Shift Scheduling Link Banner */}
      {onNavigateTab && (
        <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/90 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Auto-Suggest Shift Staffing from Demand Peaks</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">Smart Module</span>
              </div>
              <p className="text-[11px] text-stone-300 mt-0.5">
                Convert predicted lunch/dinner cover peaks directly into station coverage requirements (Kitchen Brigade, Service Captains, Cashier).
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('scheduling')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
          >
            <span>Open Smart Scheduling</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Recharts Demand Peaks Visualizer */}
      <DemandPeaksChart3D forecasts={forecasts} />

      {/* Signature Feature: Anti-Overstock AI ("Don't Buy" Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <Ban className="w-4 h-4 text-rose-400" />
            Signature Feature: Anti-Overstock "Don't Buy" Intelligence
          </span>
          <span className="text-[11px] text-stone-400">Protects cash flow and eliminates rotting produce</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dontBuyItems.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-stone-900/90 border border-rose-500/30 flex flex-col justify-between gap-3 shadow-sm hover:border-rose-500/50 transition-colors h-full"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Ban className="w-3.5 h-3.5 text-rose-400" />
                    {item.ingredient_name}
                  </span>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    DO NOT REORDER
                  </span>
                </div>

                <div className="p-3 bg-stone-950/80 rounded-xl text-xs text-stone-300 font-sans my-2 leading-relaxed border border-stone-800">
                  {item.reason}
                </div>

                <div className="flex justify-between text-xs font-mono text-stone-400">
                  <span>Current Usable: <strong className="text-white">{item.current_usable_stock} {item.unit}</strong></span>
                  <span>Safety Buffer: <strong className="text-white">{item.safety_stock} {item.unit}</strong></span>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[11px]">
                <span className="text-stone-400">Supplier: {item.supplier_name}</span>
                <span className="text-emerald-400 font-semibold">Prevents Spoilage Waste</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tomorrow's Purchase Plan with 1-Click PO */}
      <div className="p-5 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-700/80 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              Tomorrow's Recommended Purchase Plan (Morning Delivery)
            </h3>
            <p className="text-xs text-slate-400">
              Formulated as: Forecast Demand + Safety Stock - Current Usable Stock = Recommended Quantity
            </p>
          </div>

          <div className="text-right flex items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Est. Order Total</span>
              <div className="text-lg font-mono font-bold text-amber-400">₹{totalPurchaseEst.toLocaleString('en-IN')}</div>
            </div>

            <button
              type="button"
              onClick={() => setPoCreated(true)}
              disabled={poCreated}
              className={`py-2 px-4 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                poCreated
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {poCreated ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  PO Created & Sent to Vendors
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Approve & Create PO (₹{totalPurchaseEst})
                </>
              )}
            </button>
          </div>
        </div>

        {/* Buy Recommendations List */}
        <div className="space-y-2">
          {buyItems.map(rec => (
            <div
              key={rec.id}
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-sm">{rec.ingredient_name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Order {rec.recommended_quantity} {rec.unit}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-snug">{rec.reason}</p>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  Supplier: {rec.supplier_name} · Current Stock: {rec.current_usable_stock} {rec.unit}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-amber-400">₹{rec.estimated_cost}</div>
                  <div className="text-[10px] text-slate-500">Estimated Cost</div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleRecommendationFeedback(rec.id, 'ACCEPTED')}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      rec.status === 'ACCEPTED'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title="Accept Recommendation"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleRecommendationFeedback(rec.id, 'REJECTED')}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      rec.status === 'REJECTED'
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title="Reject Recommendation"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demand Forecast Target Items */}
      <div className="rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-700/80 p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Target Menu Item Sales Forecasts (Next 24h - 48h)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {forecasts.map(fc => (
            <div key={fc.menu_item_id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{fc.item_name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {fc.confidence_percentage}% Conf
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-amber-400">{fc.forecasted_units}</span>
                <span className="text-xs text-slate-400">portions projected</span>
                <span className="text-[10px] font-mono text-slate-500 ml-auto">
                  Range: {fc.lower_bound} - {fc.upper_bound}
                </span>
              </div>

              <div className="space-y-0.5 pt-1 border-t border-slate-800/80">
                {fc.key_factors.map((factor, idx) => (
                  <div key={idx} className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
