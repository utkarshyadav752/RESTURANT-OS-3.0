import React, { useState, useEffect } from 'react';
import { 
  ChefHat, Clock, AlertTriangle, CheckCircle2, 
  Flame, Filter, Bell, ArrowRight, Check
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { KOT } from '../../types/index.ts';

export const KDSView: React.FC = () => {
  const { currentBranch } = useAuth();
  const [kots, setKots] = useState<KOT[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Poll / load KOTs
  useEffect(() => {
    async function loadKots() {
      try {
        const res = await api.get(`/kot?branchId=${currentBranch?.id || ''}`);
        setKots(res || []);
      } catch (err) {
        console.error('Error fetching KOTs:', err);
      }
    }
    loadKots();
    const interval = setInterval(loadKots, 6000);
    return () => clearInterval(interval);
  }, [currentBranch]);

  const updateKotStatus = async (kotId: string, nextStatus: KOT['status']) => {
    try {
      await api.patch(`/kot/${kotId}/status`, { status: nextStatus });
      setKots(prev => prev.map(k => k.id === kotId ? { ...k, status: nextStatus } : k));
    } catch (err) {
      console.error('Error updating KOT status:', err);
    }
  };

  const stations = ['ALL', 'Tandoor', 'Curry & Rice', 'Bar & Drinks', 'Desserts & Breads'];

  // Filter KOT items by station
  const filteredKots = kots.map(kot => {
    if (selectedStation === 'ALL') return kot;
    const matchingItems = kot.items.filter(i => i.station === selectedStation);
    return { ...kot, items: matchingItems };
  }).filter(kot => kot.items.length > 0);

  const columns: { status: KOT['status']; label: string; count: number }[] = [
    { status: 'NEW', label: 'New Tickets', count: filteredKots.filter(k => k.status === 'NEW').length },
    { status: 'PREPARING', label: 'Preparing', count: filteredKots.filter(k => k.status === 'PREPARING').length },
    { status: 'READY', label: 'Ready for Pick', count: filteredKots.filter(k => k.status === 'READY').length },
  ];

  // Urgency indicator based on elapsed minutes
  const getElapsedBadge = (createdIso: string) => {
    const elapsedMinutes = Math.floor((Date.now() - new Date(createdIso).getTime()) / 60000);
    if (elapsedMinutes < 8) {
      return { text: `${elapsedMinutes}m ago`, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    } else if (elapsedMinutes < 18) {
      return { text: `${elapsedMinutes}m (Attention)`, color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    } else {
      return { text: `${elapsedMinutes}m (Delayed)`, color: 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' };
    }
  };

  return (
    <div className="h-[calc(100vh-4.5rem)] flex flex-col bg-slate-950 overflow-hidden">
      
      {/* KDS Header bar */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center font-bold">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Kitchen Display System (KDS)
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h2>
            <p className="text-[11px] text-slate-400">Live ticket dispatcher for {currentBranch?.name || 'Kitchen'}</p>
          </div>
        </div>

        {/* Station Filters */}
        <div className="flex items-center gap-2">
          <div className="flex p-0.5 bg-slate-950 rounded-xl border border-slate-800">
            {stations.map(st => (
              <button
                key={st}
                onClick={() => setSelectedStation(st)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  selectedStation === st ? 'bg-orange-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
              soundEnabled ? 'border-amber-500/40 text-amber-300 bg-amber-500/10' : 'border-slate-800 text-slate-500'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            {soundEnabled ? 'Chime ON' : 'Muted'}
          </button>
        </div>
      </div>

      {/* Ticket Columns */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
        {columns.map(col => {
          const ticketsInCol = filteredKots.filter(k => k.status === col.status);

          return (
            <div key={col.status} className="flex flex-col h-full rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
              
              {/* Column Header */}
              <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    col.status === 'NEW' ? 'bg-blue-400' : col.status === 'PREPARING' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  {col.label}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs font-mono font-bold text-slate-300">
                  {ticketsInCol.length}
                </span>
              </div>

              {/* Tickets Feed */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {ticketsInCol.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-xs text-slate-600">
                    No tickets in this state
                  </div>
                ) : (
                  ticketsInCol.map(kot => {
                    const badge = getElapsedBadge(kot.created_at);

                    return (
                      <div
                        key={kot.id}
                        className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 hover:border-stone-700 transition-all flex flex-col justify-between gap-3 shadow-sm"
                      >
                        {/* Ticket Meta */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black font-mono text-white tracking-wider">
                              {kot.kot_number}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                              {badge.text}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-stone-300 font-medium">
                            <span className="text-amber-400 font-bold">{kot.table_number}</span>
                            <span>{kot.order_type} · Server: {kot.server_name}</span>
                          </div>
                        </div>

                        {/* Items Checklist */}
                        <div className="space-y-2 py-2 border-y border-stone-800">
                          {kot.items.map(item => (
                            <div key={item.id} className="text-xs">
                              <div className="flex items-start justify-between">
                                <span className="font-bold text-white flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded bg-stone-800 text-amber-300 font-mono flex items-center justify-center text-[11px]">
                                    {item.quantity}x
                                  </span>
                                  {item.item_name}
                                </span>
                                <span className="text-[10px] text-stone-400 font-mono">
                                  {item.station}
                                </span>
                              </div>

                              {item.modifiers.length > 0 && (
                                <div className="text-[10px] text-amber-300/90 pl-6 mt-0.5 font-medium">
                                  {item.modifiers.join(', ')}
                                </div>
                              )}

                              {item.instructions && (
                                <div className="text-[10px] text-rose-400 pl-6 italic mt-0.5 font-medium">
                                  Note: {item.instructions}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          {col.status === 'NEW' && (
                            <button
                              type="button"
                              onClick={() => updateKotStatus(kot.id, 'PREPARING')}
                              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Flame className="w-3.5 h-3.5" />
                              Start Preparation
                            </button>
                          )}

                          {col.status === 'PREPARING' && (
                            <button
                              type="button"
                              onClick={() => updateKotStatus(kot.id, 'READY')}
                              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Mark Ready for Waiter
                            </button>
                          )}

                          {col.status === 'READY' && (
                            <button
                              type="button"
                              onClick={() => updateKotStatus(kot.id, 'SERVED')}
                              className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-stone-700"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Served to Guest
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
