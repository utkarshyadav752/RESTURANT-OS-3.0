import React, { useState } from 'react';
import { 
  X, Plus, Barcode as BarcodeIcon, Tag, Check, Sparkles, 
  Printer, DollarSign, Package, ShieldCheck, RefreshCw, Layers
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { InventoryItem } from '../../types/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onItemCreated?: (newItem: InventoryItem) => void;
  initialBarcode?: string;
}

// Popular Indian Kirana & Restaurant master item presets for rapid entry
const COMMON_KIRANA_PRESETS = [
  { name: 'Amul Taaza Toned Milk (1L Pouch)', brand: 'Amul', category: 'Dairy', unit: 'pkt', cost: 54, mrp: 56, gst: 0, shelfLife: 2, storage: 'Cold Walk-in Chiller' },
  { name: 'Fortune Sunlite Refined Sunflower Oil (1L)', brand: 'Fortune', category: 'Oils & Ghee', unit: 'L', cost: 132, mrp: 145, gst: 5, shelfLife: 180, storage: 'Dry Store' },
  { name: 'Tata Salt Vacuum Evaporated (1kg)', brand: 'Tata', category: 'Dry Goods & Spices', unit: 'pkt', cost: 24, mrp: 28, gst: 0, shelfLife: 365, storage: 'Dry Store' },
  { name: 'MDH Deggi Mirch Powder (500g)', brand: 'MDH', category: 'Dry Goods & Spices', unit: 'pkt', cost: 310, mrp: 345, gst: 5, shelfLife: 270, storage: 'Dry Store' },
  { name: 'India Gate Classic Basmati Rice (5kg)', brand: 'India Gate', category: 'Dry Goods & Spices', unit: 'pkt', cost: 580, mrp: 650, gst: 5, shelfLife: 365, storage: 'Dry Store' },
  { name: 'Fresh Boneless Mutton Curry Cut', brand: 'Delhi Farms', category: 'Poultry & Meat', unit: 'kg', cost: 620, mrp: 680, gst: 0, shelfLife: 2, storage: 'Deep Freezer' },
  { name: 'Fresh Green Capsicum (Simla Mirch)', brand: 'Azadpur Mandi', category: 'Produce', unit: 'kg', cost: 48, mrp: 60, gst: 0, shelfLife: 5, storage: 'Cold Walk-in Chiller' },
  { name: 'Paper Takeaway Container 750ml (50pk)', brand: 'EcoPack', category: 'Packaging', unit: 'box', cost: 280, mrp: 320, gst: 18, shelfLife: 720, storage: 'Dry Store' },
];

export const KiranaManualEntryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onItemCreated,
  initialBarcode,
}) => {
  const { currentBranch, user } = useAuth();

  // Helper to generate real standard EAN-13 barcode with checksum
  const generateEan13 = () => {
    // 890 prefix is India GS1 country code
    let code = '890' + Math.floor(100000000 + Math.random() * 900000000).toString();
    // Calculate checksum digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return code + checkDigit.toString();
  };

  // Form State
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState(initialBarcode || generateEan13());
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<any>('Dry Goods & Spices');
  const [unit, setUnit] = useState<any>('kg');
  const [costPrice, setCostPrice] = useState<number>(100);
  const [mrp, setMrp] = useState<number>(120);
  const [gstRate, setGstRate] = useState<number>(5);
  const [currentStock, setCurrentStock] = useState<number>(10);
  const [minimumStock, setMinimumStock] = useState<number>(5);
  const [storageLocation, setStorageLocation] = useState('Dry Store');
  const [supplierName, setSupplierName] = useState('Azadpur Mandi Direct');
  const [shelfLifeDays, setShelfLifeDays] = useState<number>(30);
  const [batchNumber, setBatchNumber] = useState(`B-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-01`);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );
  const [showLabelPreview, setShowLabelPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate SKU when name or category changes
  const handleNameChange = (val: string) => {
    setName(val);
    if (!sku || sku.startsWith('SKU-')) {
      const catCode = category.substring(0, 4).toUpperCase();
      const nameCode = val.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
      setSku(`SKU-${catCode}-${nameCode || 'GEN'}-${Math.floor(100 + Math.random() * 900)}`);
    }
  };

  const applyPreset = (preset: typeof COMMON_KIRANA_PRESETS[0]) => {
    setName(preset.name);
    setBrand(preset.brand);
    setCategory(preset.category);
    setUnit(preset.unit);
    setCostPrice(preset.cost);
    setMrp(preset.mrp);
    setGstRate(preset.gst);
    setShelfLifeDays(preset.shelfLife);
    setStorageLocation(preset.storage);
    setExpiryDate(new Date(Date.now() + preset.shelfLife * 86400000).toISOString().slice(0, 10));
    const catCode = preset.category.substring(0, 4).toUpperCase();
    const nameCode = preset.brand.substring(0, 3).toUpperCase();
    setSku(`SKU-${catCode}-${nameCode}-${Math.floor(100 + Math.random() * 900)}`);
  };

  const handlePrintLabel = () => {
    window.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || costPrice < 0) return;
    setIsSubmitting(true);

    try {
      const res = await api.post('/inventory/item', {
        name,
        brand,
        barcode: barcode || generateEan13(),
        sku: sku || `SKU-${category.substring(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        category,
        unit,
        current_stock: Number(currentStock) || 0,
        minimum_stock: Number(minimumStock) || 5,
        cost_per_unit: Number(costPrice),
        mrp: Number(mrp),
        gst_rate: Number(gstRate),
        storage_location: storageLocation,
        supplier_name: supplierName,
        shelf_life_days: Number(shelfLifeDays),
        is_perishable: ['Produce', 'Dairy', 'Poultry & Meat'].includes(category),
        branch_id: currentBranch?.id || 'branch_cybercity',
        batchNumber,
        expiryDate,
        createdBy: user?.name || 'Inventory Lead',
      });

      if (res.success && res.item) {
        onItemCreated?.(res.item);
        onClose();
      }
    } catch (err) {
      console.error('Failed to create inventory item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Calculate gross margin %
  const marginAmt = mrp - costPrice;
  const marginPct = mrp > 0 ? ((marginAmt / mrp) * 100).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                KiranaSetu Smart Manual Entry
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  New Product & Barcode SKU
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Register fresh ingredients, retail packaged items, spices, or repacked goods with instant barcode generation
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

        {/* Preset Quick Chips */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto flex items-center gap-2 text-xs no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
            ⚡ Quick Master Presets:
          </span>
          {COMMON_KIRANA_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700/80 text-[11px] whitespace-nowrap transition-all"
            >
              {p.brand} {p.name.split(' ')[1] || p.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Section 1: Basic Product Information */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" />
              1. Product Identity & Barcode
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Product / Ingredient Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Amul Butter Pasteurized (500g Pack)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Brand / Manufacturer
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Amul, Tata, Mandi Direct"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-400">
                    Barcode (EAN-13 / GTIN) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setBarcode(generateEan13())}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold"
                  >
                    🎲 Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="890XXXXXXXXXX"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:border-amber-400 focus:outline-none"
                  />
                  <BarcodeIcon className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Internal SKU Code
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SKU-DAIR-BUT-101"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="Dairy">Dairy (Milk, Butter, Paneer, Curd)</option>
                  <option value="Poultry & Meat">Poultry & Meat</option>
                  <option value="Produce">Produce (Vegetables & Fruits)</option>
                  <option value="Dry Goods & Spices">Dry Goods & Spices (Grains, Dal, Masala)</option>
                  <option value="Oils & Ghee">Oils & Ghee</option>
                  <option value="Beverages & Bar">Beverages & Bar (Syrups, Soda, Liquor)</option>
                  <option value="Snacks & Bakery">Snacks & Bakery</option>
                  <option value="Packaging">Packaging & Disposables</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing, Margins & GST */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5" />
              2. Unit, Cost & Selling Valuation
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Unit of Measure *
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-bold"
                >
                  <option value="kg">kg (Kilogram)</option>
                  <option value="g">g (Gram)</option>
                  <option value="L">L (Litre)</option>
                  <option value="ml">ml (Millilitre)</option>
                  <option value="pcs">pcs (Pieces)</option>
                  <option value="pkt">pkt (Packet)</option>
                  <option value="box">box (Box / Carton)</option>
                  <option value="tin">tin (Tin / Can)</option>
                  <option value="bottle">bottle (Bottle)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Purchase Cost / {unit} (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  MRP / Valuation / {unit} (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={mrp}
                  onChange={(e) => setMrp(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  GST Rate Slab
                </label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value={0}>0% (Exempt / Fresh produce)</option>
                  <option value={5}>5% (Packaged dairy, staples, oils)</option>
                  <option value={12}>12% (Processed foods, condiments)</option>
                  <option value={18}>18% (Packaging, syrups, snacks)</option>
                  <option value={28}>28% (Aerated drinks, luxury goods)</option>
                </select>
              </div>
            </div>

            {/* Live Margin Calculation Card */}
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Gross Margin on MRP:
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-emerald-400 font-bold">
                  +₹{marginAmt.toFixed(2)} / {unit}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold">
                  {marginPct}% Margin
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Stock, Reorder Point & Batch Tracking */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              3. Initial Stock, Batch & Shelf Life
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Opening Usable Stock ({unit})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Min Reorder Alert ({unit})
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Storage Location
                </label>
                <select
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="Dry Store">Dry Store (Racks)</option>
                  <option value="Cold Walk-in Chiller">Cold Walk-in Chiller (2°C - 4°C)</option>
                  <option value="Deep Freezer">Deep Freezer (-18°C)</option>
                  <option value="Bar Cellar">Bar Cellar</option>
                  <option value="Kitchen Line Prep Station">Kitchen Line Prep Station</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Shelf Life (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={shelfLifeDays}
                  onChange={(e) => {
                    const days = parseInt(e.target.value, 10) || 1;
                    setShelfLifeDays(days);
                    setExpiryDate(new Date(Date.now() + days * 86400000).toISOString().slice(0, 10));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Batch Number
                </label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Printable Barcode Sticker Label Generator */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                KiranaSetu Barcode Shelf Sticker Preview
              </h4>
              <button
                type="button"
                onClick={() => setShowLabelPreview(!showLabelPreview)}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold"
              >
                {showLabelPreview ? 'Hide Sticker' : 'Preview Sticker'}
              </button>
            </div>

            {showLabelPreview && (
              <div className="p-4 bg-white text-slate-950 rounded-xl max-w-sm mx-auto shadow-2xl space-y-2 border-2 border-dashed border-slate-300 font-sans">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span className="text-[11px] font-black uppercase tracking-tight text-slate-900">
                    RestaurantOS Store
                  </span>
                  <span className="text-[9px] font-mono text-slate-600">
                    {storageLocation}
                  </span>
                </div>

                <div className="text-center py-0.5">
                  <div className="text-xs font-black truncate text-slate-900 leading-tight">
                    {name || 'Sample Product Name'}
                  </div>
                  <div className="text-[10px] text-slate-600 font-bold">
                    {brand && `${brand} • `}{category} • {unit}
                  </div>
                </div>

                {/* Simulated Barcode Lines */}
                <div className="bg-white py-1 flex flex-col items-center">
                  <div className="flex items-end justify-center h-10 w-48 gap-0.5 bg-white">
                    {Array.from({ length: 42 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-full bg-black ${
                          i % 3 === 0 ? 'w-1' : i % 5 === 0 ? 'w-1.5' : 'w-0.5'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[11px] font-bold tracking-widest mt-1 text-slate-900">
                    {barcode}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px]">
                  <div>
                    <span className="text-slate-500 block">Batch: {batchNumber}</span>
                    <span className="text-slate-500 block">Exp: {expiryDate}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">MRP / Value</span>
                    <span className="text-sm font-black font-mono text-slate-950">₹{mrp}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePrintLabel}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg flex items-center justify-center gap-1.5 transition-all mt-2"
                >
                  <Printer className="w-3 h-3" />
                  Print Shelf Sticker
                </button>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving Product & Ledger...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Product & Generate Barcode
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
