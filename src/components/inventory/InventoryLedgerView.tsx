import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, AlertTriangle, Clock, ArrowUpDown, 
  Plus, History, ShieldCheck, Sparkles, Filter, Check,
  Scan, Barcode as BarcodeIcon, FileText, Search, Printer, Bot,
  TrendingDown, CheckCircle2, ChevronRight, RefreshCw, X,
  ShoppingCart, Flame, Zap, DollarSign, Activity, ArrowRight
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { 
  InventoryItem, InventoryBatch, StockLedgerEntry,
  StockMonitoringSummary, StockMonitorAnalysis 
} from '../../types/index.ts';
import { BarcodeScannerModal } from './BarcodeScannerModal.tsx';
import { KiranaManualEntryModal } from './KiranaManualEntryModal.tsx';
import { AIInvoiceImporterModal } from './AIInvoiceImporterModal.tsx';
import { InventoryAIAuditModal } from './InventoryAIAuditModal.tsx';
import { AutomatedStockMonitorDock } from './AutomatedStockMonitorDock.tsx';
import { QuickReorderModal } from './QuickReorderModal.tsx';

export const InventoryLedgerView: React.FC = () => {
  const { currentBranch, user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [ledger, setLedger] = useState<StockLedgerEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'LEDGER' | 'EXPIRY'>('ITEMS');

  // Automated Stock Monitoring State
  const [stockSummary, setStockSummary] = useState<StockMonitoringSummary | null>(null);
  const [isMonitorLoading, setIsMonitorLoading] = useState<boolean>(false);
  const [targetCoverageDays, setTargetCoverageDays] = useState<number>(5);
  const [reorderItem, setReorderItem] = useState<StockMonitorAnalysis | null>(null);
  const [selectedStockHealthFilter, setSelectedStockHealthFilter] = useState<'ALL' | 'CRITICAL' | 'LOW' | 'OPTIMAL' | 'OVERSTOCK'>('ALL');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // KiranaSetu Modals
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [showAIInvoiceModal, setShowAIInvoiceModal] = useState(false);
  const [showAIAuditModal, setShowAIAuditModal] = useState(false);
  const [scannedBarcodeForNewItem, setScannedBarcodeForNewItem] = useState<string>('');

  // Quick Barcode Sticker Print Modal for an item
  const [stickerItem, setStickerItem] = useState<InventoryItem | null>(null);

  // Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');

  const loadInventory = useCallback(async () => {
    try {
      const res = await api.get(`/inventory?branchId=${currentBranch?.id || ''}`);
      setItems(res.items || []);
      setBatches(res.batches || []);
      setLedger(res.stockLedger || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  }, [currentBranch?.id]);

  const fetchStockMonitoring = useCallback(async () => {
    setIsMonitorLoading(true);
    try {
      const summary = await api.get<StockMonitoringSummary>(
        `/inventory/stock-monitor?branchId=${currentBranch?.id || ''}&targetCoverageDays=${targetCoverageDays}&leadTimeDays=2`
      );
      setStockSummary(summary);
    } catch (err) {
      console.error('Failed to load stock monitoring summary:', err);
    } finally {
      setIsMonitorLoading(false);
    }
  }, [currentBranch?.id, targetCoverageDays]);

  useEffect(() => {
    loadInventory();
    fetchStockMonitoring();
  }, [loadInventory, fetchStockMonitoring]);

  // Global Hardware Barcode Gun listener
  useEffect(() => {
    let keyBuffer = '';
    let lastTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return;
      }

      const now = Date.now();
      if (now - lastTime > 250) {
        keyBuffer = '';
      }
      lastTime = now;

      if (e.key === 'Enter') {
        if (keyBuffer.length >= 3) {
          e.preventDefault();
          setShowScannerModal(true);
          keyBuffer = '';
        }
      } else if (e.key.length === 1) {
        keyBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem || adjustQty === 0 || !adjustReason) return;
    try {
      const res = await api.post('/inventory/adjust', {
        inventoryItemId: adjustItem.id,
        quantity: adjustQty,
        reason: adjustReason,
        adjustedBy: user?.name || 'Inventory Manager',
      });
      setItems(prev => prev.map(i => i.id === adjustItem.id ? res.item : i));
      setLedger(prev => [res.ledgerEntry, ...prev]);
      setShowAdjustModal(false);
      setAdjustItem(null);
      setAdjustQty(0);
      setAdjustReason('');
    } catch (err) {
      console.error('Adjustment failed:', err);
    }
  };

  // Map analyses for quick lookup by itemId
  const analysisMap = new Map((stockSummary?.analyses || []).map(a => [a.itemId, a]));

  // Filter items by search, category, and automated stock health filter
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.barcode && item.barcode.includes(searchQuery)) ||
      (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

    const analysis = analysisMap.get(item.id);
    const matchesHealth = 
      selectedStockHealthFilter === 'ALL' ||
      (selectedStockHealthFilter === 'CRITICAL' && (analysis?.healthStatus === 'CRITICAL_LOW' || analysis?.healthStatus === 'CRITICAL_OUT' || item.status === 'CRITICAL')) ||
      (selectedStockHealthFilter === 'LOW' && (analysis?.healthStatus === 'LOW_STOCK' || item.status === 'LOW')) ||
      (selectedStockHealthFilter === 'OPTIMAL' && (analysis?.healthStatus === 'OPTIMAL' || item.status === 'OPTIMAL')) ||
      (selectedStockHealthFilter === 'OVERSTOCK' && (analysis?.healthStatus === 'OVERSTOCK' || item.status === 'OVERSTOCK'));

    return matchesSearch && matchesCategory && matchesHealth;
  });

  const categories = ['ALL', ...Array.from(new Set(items.map(i => i.category)))];
  const criticalItems = items.filter(i => i.status === 'CRITICAL' || i.status === 'LOW');
  const expiringBatches = batches.filter(b => b.days_until_expiry <= 2);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header & KiranaSetu Action Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              KiranaSetu Smart Inventory & Double-Entry Ledger
            </h2>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {items.length} SKUs Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Full-spectrum Kirana barcode scanner, manual product creation, Gemini AI invoice parsing, and double-entry stock ledger
          </p>
        </div>

        {/* Kirana Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Barcode Scanner Button */}
          <button
            onClick={() => setShowScannerModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Scan className="w-4 h-4" />
            <span>Barcode Scanner</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950/30 text-slate-950 font-bold">
              Live
            </span>
          </button>

          {/* Manual Entry Button */}
          <button
            onClick={() => {
              setScannedBarcodeForNewItem('');
              setShowManualEntryModal(true);
            }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            Manual Entry
          </button>

          {/* AI Invoice Inward Button */}
          <button
            onClick={() => setShowAIInvoiceModal(true)}
            className="px-3 py-2 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 font-bold text-xs rounded-xl border border-purple-500/30 flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            AI Invoice Reader
          </button>

          {/* AI Audit Button */}
          <button
            onClick={() => setShowAIAuditModal(true)}
            className="px-3 py-2 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 font-bold text-xs rounded-xl border border-blue-500/30 flex items-center gap-1.5 transition-all"
          >
            <Bot className="w-3.5 h-3.5 text-blue-400" />
            AI Health Audit
          </button>
        </div>
      </div>

      {/* Automated Stock-Level Monitoring Service Dock */}
      <AutomatedStockMonitorDock
        summary={stockSummary}
        isLoading={isMonitorLoading}
        onRefresh={() => {
          loadInventory();
          fetchStockMonitoring();
        }}
        onQuickReorder={(item) => setReorderItem(item)}
        onCoverageChange={(days) => setTargetCoverageDays(days)}
        targetCoverageDays={targetCoverageDays}
      />

      {/* Tabs Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
        <div className="flex p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('ITEMS')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'ITEMS' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Current Stock ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'LEDGER' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Stock Ledger ({ledger.length})
          </button>
          <button
            onClick={() => setActiveTab('EXPIRY')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'EXPIRY' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Perishable Batches ({batches.length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ingredient name, barcode (890...), or SKU..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:border-amber-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Bars: Stock Health Status & Categories */}
      {activeTab === 'ITEMS' && (
        <div className="space-y-2">
          {/* Stock Health Badges Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0 mr-1 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              Stock Health:
            </span>
            
            <button
              onClick={() => setSelectedStockHealthFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedStockHealthFilter === 'ALL'
                  ? 'bg-slate-200 text-slate-950 font-bold border-slate-300 shadow'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              All SKUs ({items.length})
            </button>

            <button
              onClick={() => setSelectedStockHealthFilter('CRITICAL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedStockHealthFilter === 'CRITICAL'
                  ? 'bg-rose-500 text-slate-950 font-bold border-rose-400 shadow-md shadow-rose-500/20'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
              }`}
            >
              <Flame className="w-3 h-3 text-rose-400" />
              <span>Critical Low ({stockSummary?.criticalCount || 0})</span>
            </button>

            <button
              onClick={() => setSelectedStockHealthFilter('LOW')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedStockHealthFilter === 'LOW'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Low Reorder ({stockSummary?.lowStockCount || 0})</span>
            </button>

            <button
              onClick={() => setSelectedStockHealthFilter('OPTIMAL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedStockHealthFilter === 'OPTIMAL'
                  ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Optimal Buffer ({stockSummary?.optimalCount || 0})</span>
            </button>

            <button
              onClick={() => setSelectedStockHealthFilter('OVERSTOCK')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedStockHealthFilter === 'OVERSTOCK'
                  ? 'bg-blue-500 text-slate-950 font-bold border-blue-400 shadow'
                  : 'bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20'
              }`}
            >
              <TrendingDown className="w-3 h-3 text-blue-400" />
              <span>Overstocked ({stockSummary?.overstockCount || 0})</span>
            </button>
          </div>

          {/* Category Pills Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0 mr-1">
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Warning Banners */}
      {criticalItems.length > 0 && selectedStockHealthFilter === 'ALL' && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Automated Alert:</strong> {criticalItems.map(i => `${i.name} (${i.current_stock} ${i.unit})`).join(', ')} require immediate reorder to prevent kitchen line shutdown.
            </span>
          </div>
          <button
            onClick={() => setSelectedStockHealthFilter('CRITICAL')}
            className="text-[10px] font-mono uppercase font-bold text-rose-400 hover:underline shrink-0"
          >
            Filter Critical SKUs →
          </button>
        </div>
      )}

      {/* TAB 1: Current Stock Items */}
      {activeTab === 'ITEMS' && (
        <div className="rounded-2xl glass-panel-elevated bg-slate-900/90 border border-slate-700/80 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] bg-slate-950/60">
                  <th className="py-3 px-4">Raw Material / SKU</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Sales Burn Velocity</th>
                  <th className="py-3 px-4">Health Status & Runway</th>
                  <th className="py-3 px-4">Suggested Reorder</th>
                  <th className="py-3 px-4">Cost Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                      No inventory items match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    const analysis = analysisMap.get(item.id);
                    const isCritical = analysis?.badgeVariant === 'critical' || item.status === 'CRITICAL';
                    const isLow = analysis?.badgeVariant === 'low' || item.status === 'LOW';
                    const isOverstock = analysis?.badgeVariant === 'overstock' || item.status === 'OVERSTOCK';

                    return (
                      <tr key={item.id} className="hover:bg-slate-850/60 transition-colors">
                        
                        {/* 1. Item Name, Brand, Location */}
                        <td className="py-3.5 px-4 font-sans font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span>{item.name}</span>
                            {item.brand && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-mono">
                                {item.brand}
                              </span>
                            )}
                          </div>
                          <span className="block text-[10px] text-slate-500 font-normal mt-0.5">
                            SKU: {item.sku || 'N/A'} • {item.category} • {item.storage_location || 'Dry Store'}
                          </span>
                        </td>

                        {/* 2. Current Usable Stock */}
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-bold font-mono">{item.current_stock}</span>
                            <span className="text-slate-400 font-normal text-xs">{item.unit}</span>
                          </div>
                          <span className="block text-[10px] text-slate-500 font-normal font-sans mt-0.5">
                            Min Buffer: {item.minimum_stock} {item.unit}
                          </span>
                        </td>

                        {/* 3. Sales Burn Velocity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-baseline gap-1 font-mono">
                            <span className="font-bold text-amber-300 text-xs">
                              {analysis ? analysis.dailySalesVelocity : (item.minimum_stock / 3).toFixed(1)}
                            </span>
                            <span className="text-[10px] text-slate-400">{item.unit}/day</span>
                          </div>
                          <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                            ~{analysis ? analysis.weeklySalesVelocity : ((item.minimum_stock / 3) * 7).toFixed(1)} {item.unit}/wk
                          </span>
                        </td>

                        {/* 4. Color-Coded Health Status Badges & Runway */}
                        <td className="py-3.5 px-4">
                          {isCritical ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/10">
                                <Flame className="w-3 h-3 text-rose-400 animate-pulse" />
                                <span>CRITICAL: {analysis?.runwayDisplay || '< 24h'}</span>
                              </span>
                              <span className="block text-[9px] font-mono text-rose-400/90 pl-1 font-sans">
                                {analysis?.stockoutProjectedDate || 'Stockout imminent'}
                              </span>
                            </div>
                          ) : isLow ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                <span>LOW: {analysis?.runwayDisplay || '1-2 days'}</span>
                              </span>
                              <span className="block text-[9px] font-mono text-slate-400 pl-1 font-sans">
                                Below reorder threshold
                              </span>
                            </div>
                          ) : isOverstock ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                <TrendingDown className="w-3 h-3 text-blue-400" />
                                <span>OVERSTOCK ({analysis?.runwayDisplay || '15d+'})</span>
                              </span>
                              <span className="block text-[9px] font-mono text-slate-500 pl-1 font-sans">
                                Capital buffer high
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                <span>OPTIMAL ({analysis?.runwayDisplay || '4-7 days'})</span>
                              </span>
                              <span className="block text-[9px] font-mono text-emerald-400/80 pl-1 font-sans">
                                Balanced runway
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 5. Velocity-Based Suggested Reorder */}
                        <td className="py-3.5 px-4 font-sans">
                          {analysis && analysis.isAutoReorderRecommended && analysis.suggestedReorderQty > 0 ? (
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="flex items-baseline gap-1 font-mono">
                                  <span className="font-bold text-emerald-400 text-sm">
                                    +{analysis.suggestedReorderQty}
                                  </span>
                                  <span className="text-[10px] text-slate-400">{item.unit}</span>
                                </div>
                                <span className="block text-[10px] text-slate-400 font-mono">
                                  Est. ₹{analysis.estimatedReorderCost} ({analysis.targetCoverageDays}d supply)
                                </span>
                              </div>

                              <button
                                onClick={() => setReorderItem(analysis)}
                                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                title="Review and generate Purchase Order"
                              >
                                <ShoppingCart className="w-3 h-3" />
                                <span>Reorder</span>
                              </button>
                            </div>
                          ) : isOverstock ? (
                            <span className="text-[11px] text-slate-500 font-mono italic">
                              Halt PO (Excess stock)
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono">
                              0 {item.unit} (Runway safe)
                            </span>
                          )}
                        </td>

                        {/* 6. Cost Price */}
                        <td className="py-3.5 px-4 text-amber-400 font-bold">
                          ₹{item.cost_per_unit}/{item.unit}
                          {item.mrp && (
                            <span className="block text-[10px] text-slate-500 font-normal">
                              MRP: ₹{item.mrp}
                            </span>
                          )}
                        </td>

                        {/* 7. Kirana Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 font-sans">
                            {/* Print Label Sticker */}
                            <button
                              onClick={() => setStickerItem(item)}
                              title="Print Barcode Shelf Label"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 rounded-lg border border-slate-700 transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Quick Inward / Adjust Button */}
                            <button
                              onClick={() => {
                                setAdjustItem(item);
                                setAdjustQty(0);
                                setAdjustReason('');
                                setShowAdjustModal(true);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                            >
                              Adjust
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Audit Stock Ledger */}
      {activeTab === 'LEDGER' && (
        <div className="rounded-2xl glass-panel-elevated bg-slate-900/90 border border-slate-700/80 overflow-hidden shadow-2xl">
          <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Statutory Double-Entry Stock Movement Trail</span>
            <span className="text-[10px] text-slate-500 font-mono">Immutable audit records with barcode references</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] bg-slate-950/40">
                  <th className="py-2.5 px-4 font-sans">Timestamp</th>
                  <th className="py-2.5 px-4 font-sans">Ingredient</th>
                  <th className="py-2.5 px-4 font-sans">Movement Type</th>
                  <th className="py-2.5 px-4 font-sans">Delta Quantity</th>
                  <th className="py-2.5 px-4 font-sans">Balance After</th>
                  <th className="py-2.5 px-4 font-sans">Recorded By & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ledger.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-850/60">
                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                      {new Date(entry.created_at).toLocaleDateString()} {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-4 font-sans font-bold text-white">
                      {entry.item_name}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        entry.movement_type === 'PURCHASE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : entry.movement_type === 'SALE_CONSUMPTION'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : entry.movement_type === 'WASTAGE'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {entry.movement_type}
                      </span>
                    </td>
                    <td className={`py-2.5 px-4 font-bold ${entry.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity} {entry.unit}
                    </td>
                    <td className="py-2.5 px-4 text-slate-300">
                      {entry.balance_after} {entry.unit}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-400 text-[11px]">
                      <span className="text-slate-300 font-medium">{entry.notes}</span>
                      <span className="block text-slate-500 text-[10px]">{entry.created_by}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Expiry Intelligence */}
      {activeTab === 'EXPIRY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {batches.map(b => (
            <div
              key={b.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                b.risk_level === 'EXPIRING_SOON'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  : 'border-slate-800 bg-slate-900/80 text-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-white">{b.batch_number}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                    b.risk_level === 'EXPIRING_SOON' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {b.days_until_expiry <= 1 ? 'Expires in 24h' : `${b.days_until_expiry} days left`}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{b.item_name}</h4>
                <div className="text-xs font-mono text-slate-400 mt-2 space-y-1">
                  <div>Remaining: <strong className="text-white">{b.remaining_quantity} {b.unit}</strong></div>
                  <div>Purchased: {b.purchase_date}</div>
                  <div>Expiry Date: {b.expiry_date}</div>
                </div>
              </div>

              {b.risk_level === 'EXPIRING_SOON' && (
                <div className="mt-3 pt-2 border-t border-amber-500/20 text-[11px] text-amber-300 font-sans">
                  💡 Chef Tip: Prioritize in today's gravy prep or evening cocktail garnish.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Kirana Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onItemInwarded={() => {
          loadInventory();
        }}
        onOpenManualEntryWithBarcode={(scannedCode) => {
          setScannedBarcodeForNewItem(scannedCode);
          setShowManualEntryModal(true);
        }}
      />

      {/* Kirana Smart Manual Product Entry Modal */}
      <KiranaManualEntryModal
        isOpen={showManualEntryModal}
        onClose={() => setShowManualEntryModal(false)}
        initialBarcode={scannedBarcodeForNewItem}
        onItemCreated={(newItem) => {
          setItems(prev => [newItem, ...prev]);
          loadInventory();
        }}
      />

      {/* AI Invoice & Voice Inward Modal */}
      <AIInvoiceImporterModal
        isOpen={showAIInvoiceModal}
        onClose={() => setShowAIInvoiceModal(false)}
        onImportComplete={() => {
          loadInventory();
        }}
      />

      {/* AI Inventory Health Audit Modal */}
      <InventoryAIAuditModal
        isOpen={showAIAuditModal}
        onClose={() => setShowAIAuditModal(false)}
      />

      {/* Printable Barcode Shelf Sticker Modal */}
      {stickerItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-amber-400" />
                Print Shelf Barcode Sticker
              </h3>
              <button onClick={() => setStickerItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sticker Preview */}
            <div className="p-4 bg-white text-slate-950 rounded-xl shadow-inner border border-slate-300 font-sans space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 text-[10px]">
                <span className="font-black uppercase tracking-tight text-slate-900">
                  Zafran Bistro
                </span>
                <span className="font-mono text-slate-500">
                  {stickerItem.storage_location || 'Dry Store'}
                </span>
              </div>

              <div className="text-center py-0.5">
                <div className="text-xs font-black truncate text-slate-900">
                  {stickerItem.name}
                </div>
                <div className="text-[10px] text-slate-600 font-bold">
                  {stickerItem.category} • {stickerItem.unit}
                </div>
              </div>

              {/* Barcode lines graphic */}
              <div className="flex flex-col items-center py-1">
                <div className="flex items-end justify-center h-10 w-44 gap-0.5 bg-white">
                  {Array.from({ length: 38 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-full bg-black ${
                        i % 2 === 0 ? 'w-1' : i % 4 === 0 ? 'w-1.5' : 'w-0.5'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-mono text-[11px] font-bold tracking-widest mt-1 text-slate-900">
                  {stickerItem.barcode || '8901001001015'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px]">
                <div>
                  <span className="text-slate-500 block">SKU: {stickerItem.sku}</span>
                  <span className="text-slate-500 block">Shelf: {stickerItem.shelf_life_days}d</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 uppercase block font-bold">Rate</span>
                  <span className="text-sm font-black font-mono text-slate-950">
                    ₹{stickerItem.cost_per_unit}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStickerItem(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
              >
                Done
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Sticker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {showAdjustModal && adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-700 space-y-4">
            <h3 className="text-base font-bold text-white">Adjust Stock: {adjustItem.name}</h3>
            <p className="text-xs text-slate-400">
              Current level: {adjustItem.current_stock} {adjustItem.unit}. Enter positive number to add stock, or negative to deduct.
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adjustment Delta ({adjustItem.unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  placeholder="e.g. +5 or -2.5"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Audit Reason *
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Physical inventory count reconciliation..."
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                >
                  Confirm Ledger Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Velocity-Based Quick Reorder Modal */}
      <QuickReorderModal
        item={reorderItem}
        isOpen={Boolean(reorderItem)}
        onClose={() => setReorderItem(null)}
        onSuccess={() => {
          loadInventory();
          fetchStockMonitoring();
        }}
      />

    </div>
  );
};

