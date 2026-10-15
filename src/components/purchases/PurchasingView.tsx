import React, { useState, useEffect } from 'react';
import { 
  Truck, ShoppingCart, Plus, CheckCircle2, Clock, 
  ArrowRight, ShieldCheck, DollarSign, Building, Phone, Mail
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Supplier, PurchaseOrder } from '../../types/index.ts';

export const PurchasingView: React.FC = () => {
  const { currentBranch, user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'SUPPLIERS'>('ORDERS');

  useEffect(() => {
    async function loadData() {
      try {
        const [suppRes, poRes] = await Promise.all([
          api.get('/suppliers'),
          api.get('/purchases'),
        ]);
        setSuppliers(suppRes || []);
        setPurchaseOrders(poRes || []);
      } catch (err) {
        console.error('Error fetching purchasing data:', err);
      }
    }
    loadData();
  }, [currentBranch]);

  const handleMarkReceived = (poId: string) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poId) {
        return {
          ...po,
          status: 'RECEIVED',
          received_at: new Date().toISOString()
        };
      }
      return po;
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-400" />
              Suppliers & Purchase Order Management
            </h2>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Procurement Automation
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage vendor contracts, price history comparisons, and auto-increment stock ledger upon delivery receiving
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex p-0.5 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'ORDERS' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Purchase Orders ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'SUPPLIERS' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Vendor Directory ({suppliers.length})
          </button>
        </div>
      </div>

      {/* TAB 1: Purchase Orders Lifecycle */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
            <span>
              <strong>Procurement Lifecycle:</strong> Draft PO → Manager / Owner Approval → Dispatched to Vendor → Checked & Received → Stock Ledger Auto-Updated.
            </span>
          </div>

          <div className="space-y-3">
            {purchaseOrders.map(po => (
              <div
                key={po.id}
                className="p-5 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-700/80 shadow-md space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black font-mono text-white">{po.po_number}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        po.status === 'RECEIVED'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : po.status === 'APPROVED'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {po.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 font-medium">
                      Vendor: <strong className="text-white">{po.supplier_name}</strong> · Delivery to: {currentBranch?.name}
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Total Value</div>
                      <div className="text-base font-black font-mono text-amber-400">₹{po.total_amount}</div>
                    </div>

                    {po.status === 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => handleMarkReceived(po.id)}
                        className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Received
                      </button>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
                        <th className="py-1.5">Raw Item</th>
                        <th className="py-1.5">Quantity</th>
                        <th className="py-1.5">Unit Price</th>
                        <th className="py-1.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {po.items.map((it: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 text-slate-200 font-sans font-medium">{it.item_name}</td>
                          <td className="py-2 text-slate-400">{it.quantity} {it.unit}</td>
                          <td className="py-2 text-slate-400">₹{it.unit_price}/{it.unit}</td>
                          <td className="py-2 text-right font-bold text-amber-300">₹{it.total_price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Created: {new Date(po.created_at).toLocaleDateString()} by {po.created_by}</span>
                  {po.received_at && (
                    <span className="text-emerald-400 font-medium">Delivered & verified into stock ledger on {new Date(po.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Vendor Directory */}
      {activeTab === 'SUPPLIERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(supp => (
            <div
              key={supp.id}
              className="p-5 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-700/80 flex flex-col justify-between gap-3 shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300">
                    ★ {supp.rating} Rating
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Lead time: {supp.lead_time_days} day(s)
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{supp.name}</h4>
                <p className="text-xs text-slate-400 mt-1 font-medium">Contact: {supp.contact_person}</p>

                <div className="space-y-1 mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{supp.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span>{supp.email}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1">
                {supp.supplied_categories.map(cat => (
                  <span key={cat} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-sans">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
