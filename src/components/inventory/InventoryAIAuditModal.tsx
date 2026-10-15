import React, { useState, useEffect } from 'react';
import { 
  Bot, X, ShieldAlert, Sparkles, TrendingUp, AlertTriangle, 
  CheckCircle2, ArrowRight, RefreshCw, DollarSign, Package, Clock
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenPO?: () => void;
}

export const InventoryAIAuditModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenPO,
}) => {
  const { currentBranch } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [auditData, setAuditData] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchAudit = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/inventory/ai-audit?branchId=${currentBranch?.id || 'all'}`);
        setAuditData(res);
      } catch (err) {
        console.error('Error fetching inventory AI audit:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAudit();
  }, [isOpen, currentBranch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                KiranaSetu AI Inventory Health Audit
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Real-time Risk Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                AI evaluates stockout probabilities, dead capital lockup, and 72-hour perishable spoilage risk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-300">
                Auditing shelf stock against reservations & recipe burn rates...
              </p>
            </div>
          ) : auditData ? (
            <div className="space-y-6">
              
              {/* Score & Key Metrics Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Health Score
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-amber-400 font-mono">
                      {auditData.healthScore}
                    </span>
                    <span className="text-xs text-slate-500">/ 100</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold mt-1">
                    Good Operational Discipline
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Shelf Valuation
                  </span>
                  <div className="text-xl font-bold font-mono text-white mt-2">
                    ₹{auditData.totalStockValuation?.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Across {auditData.totalItemsTracked} SKUs
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    At-Risk Expiring
                  </span>
                  <div className="text-xl font-bold font-mono text-rose-400 mt-2">
                    ₹{auditData.atRiskValuation?.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-rose-400/90 font-bold">
                    {auditData.expiringCount} Batches within 72h
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Dead Overstock
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-300 mt-2">
                    ₹{auditData.deadStockValuation?.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {auditData.overstockCount} SKUs exceeding 3.5x buffer
                  </span>
                </div>
              </div>

              {/* Actionable AI Insights */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  AI Prescriptive Findings
                </span>
                <div className="space-y-3">
                  {auditData.insights?.map((ins: any, i: number) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          ins.severity === 'HIGH' 
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                            : ins.severity === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {ins.severity === 'HIGH' ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : ins.severity === 'MEDIUM' ? (
                            <Clock className="w-4 h-4" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-2">
                            {ins.title}
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                              ins.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {ins.severity} PRIORITY
                            </span>
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 max-w-xl">
                            {ins.description}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onClose();
                          if (ins.actionText?.includes('PO')) onOpenPO?.();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1 shrink-0 transition-all"
                      >
                        {ins.actionText}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
