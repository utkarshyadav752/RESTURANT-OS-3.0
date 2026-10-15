import React, { useState, useEffect } from 'react';
import { 
  Activity, AlertTriangle, Flame, ShieldCheck, ShoppingCart, 
  RefreshCw, TrendingDown, Clock, Zap, ArrowRight, CheckCircle2,
  DollarSign, Package, Bell, Volume2, VolumeX, Sparkles, Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StockMonitoringSummary, StockMonitorAnalysis } from '../../types/index.ts';
import { api } from '../../lib/api.ts';

interface AutomatedStockMonitorDockProps {
  summary: StockMonitoringSummary | null;
  isLoading: boolean;
  onRefresh: () => void;
  onQuickReorder: (item: StockMonitorAnalysis) => void;
  onCoverageChange?: (days: number) => void;
  targetCoverageDays?: number;
}

export const AutomatedStockMonitorDock: React.FC<AutomatedStockMonitorDockProps> = ({
  summary,
  isLoading,
  onRefresh,
  onQuickReorder,
  onCoverageChange,
  targetCoverageDays = 5,
}) => {
  const [isAutoMonitoringActive, setIsAutoMonitoringActive] = useState<boolean>(true);
  const [secondsUntilNextScan, setSecondsUntilNextScan] = useState<number>(25);
  const [isSimulatingSurge, setIsSimulatingSurge] = useState<boolean>(false);
  const [isBulkReordering, setIsBulkReordering] = useState<boolean>(false);

  // Automated background polling loop
  useEffect(() => {
    if (!isAutoMonitoringActive) return;

    const interval = setInterval(() => {
      setSecondsUntilNextScan((prev) => {
        if (prev <= 1) {
          onRefresh();
          return 25;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoMonitoringActive, onRefresh]);

  // Simulate Peak Dinner Surge Test Feature
  const handleSimulateSurge = async () => {
    setIsSimulatingSurge(true);
    try {
      await api.post('/inventory/simulate-sales-surge', { surgeFactor: 1.8 });
      onRefresh();
      setSecondsUntilNextScan(25);
    } catch (err) {
      console.error('Failed to simulate surge:', err);
    } finally {
      setIsSimulatingSurge(false);
    }
  };

  // 1-Click Reorder for ALL critical items
  const handleBulkReorderAllCritical = async () => {
    if (!summary || summary.criticalCount === 0) return;
    setIsBulkReordering(true);
    try {
      const res = await api.post('/inventory/bulk-reorder-critical', {});
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 }
      });
      onRefresh();
    } catch (err) {
      console.error('Bulk reorder failed:', err);
    } finally {
      setIsBulkReordering(false);
    }
  };

  if (!summary) return null;

  return (
    <div className="space-y-4">
      
      {/* Monitoring Command Strip */}
      <div className="rounded-3xl bg-stone-900/90 border border-stone-800 p-4 sm:p-5 shadow-sm relative overflow-hidden">
        
        {/* Subtle Ambient Background Gradient */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Control Bar: Status Indicator, Auto-Monitoring Toggle, Rush Simulator */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          
          {/* Live Status Badge */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className={`w-3 h-3 rounded-full ${
                isAutoMonitoringActive ? 'bg-emerald-400' : 'bg-slate-500'
              }`} />
              {isAutoMonitoringActive && (
                <span className="absolute w-5 h-5 rounded-full bg-emerald-400/40 animate-ping" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Automated Stock-Level Monitoring Service
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                  Live Velocity Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Continuous sales velocity evaluation • Next auto-scan in <strong className="text-amber-400 font-mono">{secondsUntilNextScan}s</strong>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Auto-Monitoring Switch */}
            <button
              onClick={() => setIsAutoMonitoringActive(!isAutoMonitoringActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                isAutoMonitoringActive
                  ? 'bg-slate-950 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
              title="Toggle automatic background monitoring timer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Auto-Scan: {isAutoMonitoringActive ? 'ON' : 'PAUSED'}</span>
            </button>

            {/* Manual Scan Now Button */}
            <button
              onClick={() => {
                onRefresh();
                setSecondsUntilNextScan(25);
              }}
              disabled={isLoading}
              className="p-1.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Trigger instant stock-level and velocity re-audit"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Scan Now</span>
            </button>

            {/* Simulate Peak Rush Test Trigger */}
            <button
              onClick={handleSimulateSurge}
              disabled={isSimulatingSurge}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Simulate dinner peak sales to test automated low-stock warnings"
            >
              <Flame className={`w-3.5 h-3.5 text-rose-400 ${isSimulatingSurge ? 'animate-bounce' : ''}`} />
              <span>{isSimulatingSurge ? 'Burning Stock...' : 'Simulate Dinner Rush'}</span>
            </button>

          </div>
        </div>

        {/* 4 Key Fleet Stat Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          
          {/* 1. Critical Stockouts (< 24-36h) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-rose-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-rose-400 font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                Critical Low Stock
              </span>
              {summary.criticalCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-rose-400">
                {summary.criticalCount}
              </span>
              <span className="text-[11px] text-slate-400">SKUs &lt; 36h runway</span>
            </div>
            <div className="text-[10px] text-rose-300/80 mt-1 font-mono">
              Stockout imminent without reorder
            </div>
          </div>

          {/* 2. Low Stock Warnings */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30">
            <div className="flex items-center justify-between text-xs text-amber-400 font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Low Reorder Level
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-amber-400">
                {summary.lowStockCount}
              </span>
              <span className="text-[11px] text-slate-400">SKUs below min point</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              Reorder suggested this cycle
            </div>
          </div>

          {/* 3. Optimal Stock Health */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/25">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Healthy Stock Buffer
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-emerald-400">
                {summary.optimalCount}
              </span>
              <span className="text-[11px] text-slate-400">of {summary.totalSKUs} SKUs</span>
            </div>
            <div className="text-[10px] text-emerald-400/80 mt-1 font-mono">
              Avg runway: {summary.averageRunwayDays} days
            </div>
          </div>

          {/* 4. Urgent Procurement Capital */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                Urgent Reorder Need
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black font-mono text-amber-400">
                ₹{summary.totalEstimatedUrgentReorderCost.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Est. replenishment capital
            </div>
          </div>

        </div>

        {/* Urgent Critical Items Tray */}
        {summary.topUrgentItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  Urgent Reorder Attention ({summary.topUrgentItems.length} SKUs Critical / Low)
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                  — Suggested quantities calculated using sales burn velocity
                </span>
              </div>

              {/* 1-Click Batch Reorder All Button */}
              {summary.criticalCount > 0 && (
                <button
                  onClick={handleBulkReorderAllCritical}
                  disabled={isBulkReordering}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/20 cursor-pointer transition-all"
                  title="Generate purchase orders for all critical low-stock items at once"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isBulkReordering ? 'animate-spin' : ''}`} />
                  <span>{isBulkReordering ? 'Generating POs...' : `Auto-Reorder All Critical (₹${summary.totalEstimatedUrgentReorderCost})`}</span>
                </button>
              )}
            </div>

            {/* Horizontal Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {summary.topUrgentItems.map(item => (
                <div 
                  key={item.itemId}
                  className={`p-3.5 rounded-2xl bg-slate-950 border transition-all hover:border-slate-650 flex flex-col justify-between space-y-3 ${
                    item.badgeVariant === 'critical'
                      ? 'border-rose-500/40 shadow-sm shadow-rose-500/5'
                      : 'border-amber-500/30'
                  }`}
                >
                  <div>
                    {/* Item Name & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-white block leading-tight">
                          {item.itemName}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          {item.category} • {item.supplierName}
                        </span>
                      </div>

                      {/* Color-Coded Badge */}
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 border ${
                        item.badgeVariant === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}>
                        {item.badgeLabel}
                      </span>
                    </div>

                    {/* Stock & Runway Stats */}
                    <div className="grid grid-cols-2 gap-2 mt-3 p-2 rounded-xl bg-slate-900 border border-slate-850">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-medium">Current Usable</span>
                        <span className="text-xs font-mono font-bold text-white">
                          {item.currentStock} {item.unit}
                        </span>
                        <span className="text-[9px] text-slate-500 block">Min: {item.minimumStock} {item.unit}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-medium">Burn Velocity</span>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {item.dailySalesVelocity} {item.unit}/d
                        </span>
                        <span className={`text-[9px] font-mono block ${
                          item.runwayHours < 24 ? 'text-rose-400 font-bold' : 'text-slate-400'
                        }`}>
                          Runway: {item.runwayDisplay}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Velocity-based Suggested Reorder & Action Button */}
                  <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-medium block">
                        Suggested Reorder
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        +{item.suggestedReorderQty} {item.unit}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 ml-1">
                        (₹{item.estimatedReorderCost})
                      </span>
                    </div>

                    <button
                      onClick={() => onQuickReorder(item)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Reorder</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
