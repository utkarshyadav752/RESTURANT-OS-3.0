import React, { useState, useEffect, useRef } from 'react';
import { 
  Scan, X, Camera, Zap, CheckCircle2, AlertTriangle, 
  ArrowRight, Plus, RefreshCw, Volume2, VolumeX, Sparkles, 
  Package, Tag, ShieldCheck, DollarSign, Calendar
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { InventoryItem, InventoryBatch, StockLedgerEntry } from '../../types/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onItemInwarded?: (updatedItem: InventoryItem) => void;
  onOpenManualEntryWithBarcode?: (scannedCode: string) => void;
}

// Common Indian FMCG & Restaurant Barcode Presets for instant testing
const TEST_BARCODE_PRESETS = [
  { name: 'Fresh Boneless Chicken', code: '8901001001015', category: 'Poultry & Meat', icon: '🍗' },
  { name: 'Malai Cottage Paneer', code: '8901262010084', category: 'Dairy', icon: '🧀' },
  { name: 'Amul Butter 500g', code: '8901262010053', category: 'Dairy', icon: '🧈' },
  { name: 'Farm Plum Tomatoes', code: '8901002002021', category: 'Produce', icon: '🍅' },
  { name: 'Basmati Rice 5kg', code: '8901004004043', category: 'Dry Goods', icon: '🍚' },
  { name: 'Tata Salt Vacuum Evap', code: '8901030010012', category: 'Dry Goods', icon: '🧂' },
  { name: 'MDH Deggi Mirch 100g', code: '8902519001021', category: 'Spices', icon: '🌶️' },
  { name: 'Coca-Cola 300ml Can', code: '8901764012234', category: 'Beverage', icon: '🥤' },
];

export const BarcodeScannerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onItemInwarded,
  onOpenManualEntryWithBarcode,
}) => {
  const { currentBranch, user } = useAuth();

  // Scanner state
  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [continuousMode, setContinuousMode] = useState(false);
  const [recentScansCount, setRecentScansCount] = useState(0);

  // Scan Results
  const [isSearching, setIsSearching] = useState(false);
  const [matchedItem, setMatchedItem] = useState<InventoryItem | null>(null);
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockLedgerEntry[]>([]);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);

  // Action Mode on matched item: 'INWARD' | 'COUNT' | 'VIEW'
  const [actionMode, setActionMode] = useState<'INWARD' | 'COUNT' | 'VIEW'>('INWARD');
  const [inwardQty, setInwardQty] = useState<number>(5);
  const [inwardRate, setInwardRate] = useState<number>(0);
  const [batchNo, setBatchNo] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [countedQty, setCountedQty] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Synthesize Kirana retail beep sound using Web Audio API
  const playScanBeep = (isSuccess = true) => {
    if (!audioFeedback) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(1760, audioCtx.currentTime); // High clear A6 retail beep
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.12);
      } else {
        osc.frequency.setValueAtTime(320, audioCtx.currentTime); // Low buzz
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch {
      // Audio not permitted without user gesture
    }
  };

  // Perform barcode lookup
  const lookupBarcode = async (code: string) => {
    if (!code.trim()) return;
    setIsSearching(true);
    setNotFoundCode(null);
    setSuccessToast(null);

    try {
      const res = await api.post('/inventory/barcode-lookup', {
        barcode: code.trim(),
        branchId: currentBranch?.id || 'all',
      });

      if (res.found && res.item) {
        playScanBeep(true);
        setMatchedItem(res.item);
        setBatches(res.batches || []);
        setRecentMovements(res.recentMovements || []);
        setInwardRate(res.item.cost_per_unit || 0);
        setCountedQty(res.item.current_stock || 0);
        setBatchNo(`B-${Date.now().toString().slice(-6)}`);
        setExpiryDate(new Date(Date.now() + (res.item.shelf_life_days || 15) * 86400000).toISOString().slice(0, 10));
        setRecentScansCount(c => c + 1);
      } else {
        playScanBeep(false);
        setMatchedItem(null);
        setNotFoundCode(code.trim());
      }
    } catch (err) {
      console.error('Barcode lookup failed:', err);
      playScanBeep(false);
      setNotFoundCode(code.trim());
    } finally {
      setIsSearching(false);
    }
  };

  // Start webcam camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access unavailable or blocked. You can use manual entry, presets, or a USB barcode gun.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Listen to physical USB/Bluetooth barcode scanner inputs
  useEffect(() => {
    if (!isOpen) return;

    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in a standard input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'textarea' || (targetTag === 'input' && (e.target as HTMLElement).id !== 'barcode-main-input')) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 3) {
          e.preventDefault();
          lookupBarcode(barcodeBuffer);
          barcodeBuffer = '';
        }
      } else if (e.key.length === 1) {
        // Fast typing buffer typical of hardware laser scanner (< 50ms per key)
        if (timeDiff > 250) {
          barcodeBuffer = ''; // Reset if slow (human typing)
        }
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Quick Inward
  const handleInward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedItem || inwardQty <= 0) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/inventory/inward', {
        inventoryItemId: matchedItem.id,
        quantity: inwardQty,
        unitCost: inwardRate,
        batchNumber: batchNo,
        expiryDate,
        branchId: currentBranch?.id || matchedItem.branch_id,
        createdBy: user?.name || 'Inventory Lead',
        notes: `Kirana Barcode Inward (${batchNo})`,
      });

      setSuccessToast(`+${inwardQty} ${matchedItem.unit} added! Balance: ${res.item.current_stock} ${matchedItem.unit}`);
      onItemInwarded?.(res.item);
      playScanBeep(true);

      if (continuousMode) {
        setMatchedItem(null);
        setManualCode('');
      } else {
        setMatchedItem(res.item);
      }
    } catch (err) {
      console.error('Inward failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Physical Shelf Count Audit
  const handleCountAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedItem) return;
    setIsSubmitting(true);
    try {
      const variance = Number((countedQty - matchedItem.current_stock).toFixed(3));
      const res = await api.post('/inventory/adjust', {
        inventoryItemId: matchedItem.id,
        quantity: variance,
        reason: `Kirana Physical Barcode Shelf Audit (${variance >= 0 ? '+' : ''}${variance} ${matchedItem.unit})`,
        adjustedBy: user?.name || 'Inventory Auditor',
      });

      setSuccessToast(`Stock count audited to ${res.item.current_stock} ${matchedItem.unit}`);
      onItemInwarded?.(res.item);
      setMatchedItem(res.item);
      playScanBeep(true);
    } catch (err) {
      console.error('Count adjustment failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  KiranaSetu Barcode Scanner
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Live Optical & Laser Gun
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Point camera, use USB laser gun, or click test barcodes for instant SKU recognition & stock inwarding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAudioFeedback(!audioFeedback)}
              title={audioFeedback ? 'Sound Muted' : 'Sound Enabled'}
              className={`p-2 rounded-xl border transition-all ${
                audioFeedback 
                  ? 'bg-slate-800 text-amber-400 border-slate-700' 
                  : 'bg-slate-800/40 text-slate-500 border-slate-800'
              }`}
            >
              {audioFeedback ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Success Banner */}
          {successToast && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-200 animate-slide-down">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                {successToast}
              </span>
              <button onClick={() => setSuccessToast(null)} className="text-emerald-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Scanner Viewport & Manual Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Left: Viewfinder / Camera Simulation */}
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 flex flex-col items-center justify-center min-h-[260px] overflow-hidden group">
              {isCameraActive ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    playsInline 
                    muted 
                    className="w-full h-56 object-cover rounded-xl"
                  />
                  {/* Red Laser Scanner Bar */}
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse" />
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={stopCamera}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/80 text-xs font-bold text-slate-300 hover:text-white border border-slate-700"
                    >
                      Stop Camera
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-all">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Live Camera Scanner</h4>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Scan grocery boxes, milk packets, spice cartons, and QR labels directly from phone or laptop camera
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/10 flex items-center gap-2 mx-auto transition-all"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Activate Camera Viewfinder
                  </button>
                  {cameraError && (
                    <p className="text-[11px] text-amber-400/90 max-w-xs mx-auto text-center mt-2">
                      {cameraError}
                    </p>
                  )}
                </div>
              )}

              {/* Optical Aim Frame Overlay */}
              <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-amber-400 rounded-tl pointer-events-none" />
              <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-amber-400 rounded-tr pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-amber-400 rounded-bl pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-amber-400 rounded-br pointer-events-none" />
            </div>

            {/* Right: Manual Input & Scan Presets */}
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <label className="text-xs font-bold text-slate-300 block">
                  Scan Barcode / SKU / Enter Code
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="barcode-main-input"
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          lookupBarcode(manualCode);
                        }
                      }}
                      placeholder="e.g. 8901262010053 or SKU-POUL-CHK"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400"
                    />
                    {manualCode && (
                      <button
                        onClick={() => setManualCode('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => lookupBarcode(manualCode)}
                    disabled={isSearching || !manualCode.trim()}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shrink-0"
                  >
                    {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />}
                    Lookup
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none">
                    <input
                      type="checkbox"
                      checked={continuousMode}
                      onChange={(e) => setContinuousMode(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
                    />
                    Continuous rapid inward mode
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    Scans this session: <strong className="text-white">{recentScansCount}</strong>
                  </span>
                </div>
              </div>

              {/* Instant Test Presets */}
              <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  ⚡ Quick Test Presets (Standard Indian FMCG & Restaurant SKUs)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {TEST_BARCODE_PRESETS.map((p) => (
                    <button
                      key={p.code}
                      onClick={() => {
                        setManualCode(p.code);
                        lookupBarcode(p.code);
                      }}
                      className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-all group flex items-center justify-between"
                    >
                      <div className="truncate">
                        <div className="text-xs font-semibold text-white group-hover:text-amber-400 truncate flex items-center gap-1.5">
                          <span>{p.icon}</span>
                          <span className="truncate">{p.name}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          {p.code}
                        </div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-amber-400 shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Barcode Not Found Fallback */}
          {notFoundCode && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Unrecognized SKU / Barcode: <span className="font-mono text-amber-300">{notFoundCode}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    This barcode is not registered in your restaurant's inventory database yet.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenManualEntryWithBarcode?.(notFoundCode);
                }}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add As New Kirana Product
              </button>
            </div>
          )}

          {/* Scanned Item Details & Rapid Inward / Audit Card */}
          {matchedItem && (
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5 space-y-5 animate-slide-up shadow-xl">
              
              {/* Item Card Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {matchedItem.category}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Barcode: <strong className="text-white">{matchedItem.barcode || 'N/A'}</strong>
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      SKU: <strong className="text-white">{matchedItem.sku}</strong>
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {matchedItem.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Supplier: {matchedItem.supplier_name} • Shelf Life: {matchedItem.shelf_life_days} days
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Usable</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      {matchedItem.current_stock} <span className="text-xs text-slate-400">{matchedItem.unit}</span>
                    </span>
                  </div>
                  <div className="text-right pl-3 border-l border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Cost / Rate</span>
                    <span className="text-xl font-bold font-mono text-white">
                      ₹{matchedItem.cost_per_unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Mode Toggle */}
              <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold max-w-sm">
                <button
                  type="button"
                  onClick={() => setActionMode('INWARD')}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    actionMode === 'INWARD' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Quick Inward
                </button>
                <button
                  type="button"
                  onClick={() => setActionMode('COUNT')}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    actionMode === 'COUNT' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Physical Count Audit
                </button>
              </div>

              {/* Action Form: INWARD */}
              {actionMode === 'INWARD' && (
                <form onSubmit={handleInward} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Inward Quantity ({matchedItem.unit})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      value={inwardQty}
                      onChange={(e) => setInwardQty(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Purchase Rate / {matchedItem.unit} (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={inwardRate}
                      onChange={(e) => setInwardRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Batch No & Expiry
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={batchNo}
                        onChange={(e) => setBatchNo(e.target.value)}
                        placeholder="Batch #"
                        className="w-1/2 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                      />
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-1/2 bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting || inwardQty <= 0}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Receive +{inwardQty} {matchedItem.unit}
                    </button>
                  </div>
                </form>
              )}

              {/* Action Form: COUNT AUDIT */}
              {actionMode === 'COUNT' && (
                <form onSubmit={handleCountAudit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Physical Shelf Count ({matchedItem.unit})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={countedQty}
                      onChange={(e) => setCountedQty(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      System Variance
                    </label>
                    <div className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold flex items-center justify-between">
                      <span className="text-slate-400">Current: {matchedItem.current_stock}</span>
                      <span className={countedQty >= matchedItem.current_stock ? 'text-emerald-400' : 'text-rose-400'}>
                        {countedQty - matchedItem.current_stock >= 0 ? '+' : ''}
                        {(countedQty - matchedItem.current_stock).toFixed(2)} {matchedItem.unit}
                      </span>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
                    >
                      {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      Commit Physical Audit
                    </button>
                  </div>
                </form>
              )}

              {/* Active Batches & Expiry Ledger */}
              {batches.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Active FIFO Batches in Shelf ({batches.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {batches.map((b) => (
                      <div key={b.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-mono font-bold text-white text-xs">{b.batch_number}</div>
                          <div className="text-[10px] text-slate-400">Exp: {b.expiry_date}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-amber-400">{b.remaining_quantity} {b.unit}</div>
                          <div className={`text-[10px] font-bold ${b.days_until_expiry <= 2 ? 'text-rose-400' : 'text-slate-500'}`}>
                            {b.days_until_expiry}d left
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Hardware Laser Gun Ready (EAN-13 / Code128 / QR)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all"
          >
            Done Scanning
          </button>
        </div>
      </div>
    </div>
  );
};
