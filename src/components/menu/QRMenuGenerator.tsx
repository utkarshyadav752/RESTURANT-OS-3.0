import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, Printer, Download, Eye, Sparkles, Utensils, 
  Check, Copy, Wifi, Layers, Sliders, ExternalLink, 
  RefreshCw, X, ChevronDown, ChevronRight, ShieldCheck, 
  Flame, Leaf, Coffee, Search, Share2, FileText, CheckCircle2,
  Table as TableIcon
} from 'lucide-react';
import { Recipe, MenuItem, Table } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { TiltCard3D } from '../3d/TiltCard3D.tsx';

interface QRMenuGeneratorProps {
  recipes?: Recipe[];
  onNavigateTab?: (tab: string) => void;
}

type ThemeMode = 'NOIR_GOLD' | 'IMPERIAL_AMBER' | 'ROYAL_EMERALD' | 'CLEAN_IVORY';
type StandeeLayout = 'ACRYLIC_CARD' | 'TABLE_TENT' | 'MINIMAL_DISC';

interface EnrichedMenuItem extends MenuItem {
  recipe?: Recipe;
  ingredientsList?: string[];
  allergens?: string[];
}

export const QRMenuGenerator: React.FC<QRMenuGeneratorProps> = ({
  recipes = [],
}) => {
  const { currentBranch, restaurant } = useAuth();
  
  // Data states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [enrichedItems, setEnrichedItems] = useState<EnrichedMenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Configuration options
  const [selectedTableId, setSelectedTableId] = useState<string>('all'); // 'all', 'none', or table id
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [theme, setTheme] = useState<ThemeMode>('NOIR_GOLD');
  const [layout, setLayout] = useState<StandeeLayout>('ACRYLIC_CARD');
  const [showBOMTransparency, setShowBOMTransparency] = useState<boolean>(true);
  const [showWifiInfo, setShowWifiInfo] = useState<boolean>(true);
  const [wifiSsid, setWifiSsid] = useState<string>('ZafranGuest');
  const [wifiPassword, setWifiPassword] = useState<string>('zafran@2026');
  const [headline, setHeadline] = useState<string>('Zafran Gourmet Bistro');
  const [subheadline, setSubheadline] = useState<string>('Scan for Live Digital Menu & Farm-Fresh Recipe Ingredients');
  const [qrSize, setQrSize] = useState<number>(240);

  // Generated QR data URL cache
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [batchTableQrs, setBatchTableQrs] = useState<{ tableNum: string; dataUrl: string; tableName: string }[]>([]);

  // Customer Menu Preview Modal
  const [showCustomerPreview, setShowCustomerPreview] = useState<boolean>(false);
  const [previewFilterCategory, setPreviewFilterCategory] = useState<string>('ALL');
  const [previewDietaryFilter, setPreviewDietaryFilter] = useState<'ALL' | 'VEG' | 'NON_VEG' | 'BESTSELLER'>('ALL');
  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [selectedDishForBOMModal, setSelectedDishForBOMModal] = useState<EnrichedMenuItem | null>(null);

  // Copy notification
  const [copiedLink, setCopiedLink] = useState(false);
  const [orderNotification, setOrderNotification] = useState<string | null>(null);

  // Printable container ref
  const printContainerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Menu & Tables Data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [menuRes, tablesRes] = await Promise.all([
          api.get('/menu'),
          api.get('/tables').catch(() => ({ tables: [] }))
        ]);
        
        const rawMenuItems: MenuItem[] = Array.isArray(menuRes) ? menuRes : (menuRes.items || []);
        const rawTables: Table[] = Array.isArray(tablesRes) ? tablesRes : (tablesRes.tables || []);

        setMenuItems(rawMenuItems);
        setTables(rawTables);

        // Enrich Menu Items with Recipe BOM
        const enriched: EnrichedMenuItem[] = rawMenuItems.map(item => {
          const matchedRecipe = recipes.find(r => r.menu_item_id === item.id || r.menu_item_name === item.name);
          const ingredientsList = matchedRecipe?.ingredients.map(i => i.ingredient_name) || [];
          
          // Detect allergens from ingredients
          const allergens: string[] = [];
          const lowerIng = ingredientsList.join(' ').toLowerCase();
          if (lowerIng.includes('butter') || lowerIng.includes('cream') || lowerIng.includes('paneer') || lowerIng.includes('milk')) {
            allergens.push('Dairy');
          }
          if (lowerIng.includes('maida') || lowerIng.includes('flour') || lowerIng.includes('wheat')) {
            allergens.push('Gluten');
          }
          if (lowerIng.includes('cashew') || lowerIng.includes('badam') || lowerIng.includes('almond') || lowerIng.includes('nut')) {
            allergens.push('Tree Nuts');
          }

          return {
            ...item,
            recipe: matchedRecipe,
            ingredientsList,
            allergens,
          };
        });

        setEnrichedItems(enriched);
      } catch (err) {
        console.error('Failed to load menu or tables data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [recipes, currentBranch?.id]);

  // 2. Generate Primary QR Code
  useEffect(() => {
    async function generateMainQR() {
      try {
        const baseUrl = window.location.origin;
        let menuUrl = `${baseUrl}/customer-menu?branch=${currentBranch?.id || 'branch_cybercity'}`;
        if (selectedTableId && selectedTableId !== 'all' && selectedTableId !== 'none') {
          const targetTable = tables.find(t => t.id === selectedTableId);
          menuUrl += `&table=${targetTable?.table_number || selectedTableId}`;
        }
        if (selectedCategory !== 'ALL') {
          menuUrl += `&category=${encodeURIComponent(selectedCategory)}`;
        }
        if (showBOMTransparency) {
          menuUrl += `&transparency=1`;
        }

        const darkColor = theme === 'ROYAL_EMERALD' ? '#064e3b' : theme === 'CLEAN_IVORY' ? '#0f172a' : '#1e1b4b';
        const lightColor = '#ffffff';

        const dataUrl = await QRCode.toDataURL(menuUrl, {
          width: qrSize,
          margin: 1.5,
          color: {
            dark: darkColor,
            light: lightColor
          },
          errorCorrectionLevel: 'H'
        });

        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('QR code generation failed:', err);
      }
    }

    generateMainQR();
  }, [selectedTableId, selectedCategory, theme, showBOMTransparency, qrSize, currentBranch?.id, tables]);

  // 3. Batch Generate for All Tables (1 to 12)
  useEffect(() => {
    async function generateBatch() {
      const activeTables = tables.length > 0 ? tables : [
        { id: 't_1', table_number: 'T-01', capacity: 2, status: 'AVAILABLE' },
        { id: 't_2', table_number: 'T-02', capacity: 4, status: 'AVAILABLE' },
        { id: 't_3', table_number: 'T-03', capacity: 4, status: 'AVAILABLE' },
        { id: 't_4', table_number: 'T-04', capacity: 6, status: 'AVAILABLE' },
        { id: 't_5', table_number: 'T-05', capacity: 2, status: 'AVAILABLE' },
        { id: 't_6', table_number: 'T-06', capacity: 8, status: 'AVAILABLE' },
      ];

      const batchResults: { tableNum: string; dataUrl: string; tableName: string }[] = [];
      const baseUrl = window.location.origin;

      for (const t of activeTables) {
        try {
          const url = `${baseUrl}/customer-menu?branch=${currentBranch?.id || 'branch_cybercity'}&table=${t.table_number}&transparency=1`;
          const dataUrl = await QRCode.toDataURL(url, {
            width: 200,
            margin: 1,
            color: { dark: '#090d16', light: '#ffffff' },
            errorCorrectionLevel: 'M'
          });
          batchResults.push({
            tableNum: t.table_number,
            tableName: `Table ${t.table_number} (${t.capacity} pax)`,
            dataUrl
          });
        } catch (e) {
          console.warn(`Failed batch QR for ${t.table_number}`);
        }
      }

      setBatchTableQrs(batchResults);
    }

    generateBatch();
  }, [tables, currentBranch?.id]);

  // Download Standee PNG
  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `zafran-menu-qr-${selectedTableId === 'all' ? 'main' : selectedTableId}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  // Copy Digital Menu Link
  const handleCopyMenuLink = () => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/customer-menu?branch=${currentBranch?.id || 'branch_cybercity'}&table=T-01`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Trigger Print Dialog
  const handlePrint = () => {
    window.print();
  };

  const categories = ['ALL', ...Array.from(new Set(menuItems.map(m => m.category_name)))];

  // Theme styling helpers
  const getThemeClasses = () => {
    switch (theme) {
      case 'NOIR_GOLD':
        return {
          cardBg: 'bg-gradient-to-b from-slate-900 via-slate-950 to-black',
          border: 'border-amber-500/40',
          accentText: 'text-amber-400',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          subText: 'text-slate-400',
          glow: 'shadow-amber-500/10'
        };
      case 'ROYAL_EMERALD':
        return {
          cardBg: 'bg-gradient-to-b from-emerald-950 via-slate-950 to-black',
          border: 'border-emerald-500/40',
          accentText: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          subText: 'text-emerald-200/70',
          glow: 'shadow-emerald-500/10'
        };
      case 'IMPERIAL_AMBER':
        return {
          cardBg: 'bg-gradient-to-b from-orange-950 via-slate-950 to-black',
          border: 'border-orange-500/40',
          accentText: 'text-orange-400',
          badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          subText: 'text-orange-200/70',
          glow: 'shadow-orange-500/10'
        };
      case 'CLEAN_IVORY':
        return {
          cardBg: 'bg-slate-100 text-slate-900',
          border: 'border-slate-300',
          accentText: 'text-slate-900 font-black',
          badgeBg: 'bg-slate-900 text-white border-slate-700',
          subText: 'text-slate-600',
          glow: 'shadow-slate-300'
        };
    }
  };

  const themeStyle = getThemeClasses();

  return (
    <div className="space-y-6">
      
      {/* Print-specific stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-standee-dock, #printable-standee-dock * {
            visibility: visible;
          }
          #printable-standee-dock {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header & Controls Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-400" />
              Customer QR Menu Standee Generator
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              BOM Dynamic Sync
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-embeds real-time prices, dietary markers, and farm-fresh recipe ingredient transparency from your Recipe BOM
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Customer Menu Preview Button */}
          <button
            onClick={() => setShowCustomerPreview(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Customer Menu</span>
          </button>

          {/* Print Standees */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Standees</span>
          </button>

          {/* Download QR Code */}
          <button
            onClick={handleDownloadQR}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left Config Panel, Right 3D Standee Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Configuration Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-5 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Standee Design & QR Settings
            </span>
            <span className="text-[11px] font-mono text-slate-500">{enrichedItems.length} Dishes Linked</span>
          </div>

          {/* 1. Table Target Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>Table Assignment:</span>
              <span className="text-[10px] text-slate-500 font-normal">Embeds table number into QR</span>
            </label>
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            >
              <option value="all">Full Restaurant General Menu (Bar / Counter)</option>
              <option value="none">Takeaway / Delivery Packaging QR</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>
                  Table {t.table_number} ({t.capacity} Seats - {t.area || 'Main Hall'})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Theme & Aesthetics */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Standee Color & Aesthetics Theme:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('NOIR_GOLD')}
                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${
                  theme === 'NOIR_GOLD'
                    ? 'border-amber-400 bg-amber-500/15 text-amber-300 shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm" />
                <span>Zafran Noir & Gold</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('ROYAL_EMERALD')}
                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${
                  theme === 'ROYAL_EMERALD'
                    ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300 shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm" />
                <span>Royal Emerald</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('IMPERIAL_AMBER')}
                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${
                  theme === 'IMPERIAL_AMBER'
                    ? 'border-orange-400 bg-orange-500/15 text-orange-300 shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-orange-400 shadow-sm" />
                <span>Imperial Amber</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('CLEAN_IVORY')}
                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${
                  theme === 'CLEAN_IVORY'
                    ? 'border-slate-300 bg-white text-slate-900 shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-400" />
                <span>Clean Acrylic Ivory</span>
              </button>
            </div>
          </div>

          {/* 3. Standee Form Factor */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Standee Layout Format:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ACRYLIC_CARD', label: 'Acrylic Stand' },
                { id: 'TABLE_TENT', label: 'Tent Fold' },
                { id: 'MINIMAL_DISC', label: 'Compact Disc' },
              ].map(l => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLayout(l.id as StandeeLayout)}
                  className={`py-2 px-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                    layout === l.id
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Recipe BOM Transparency Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Recipe BOM Ingredient Transparency</span>
                  <span className="text-[10px] text-slate-400 block">
                    Displays authentic farm ingredient provenance & allergens
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showBOMTransparency}
                onChange={(e) => setShowBOMTransparency(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* 5. Wi-Fi Info Embed */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Guest Wi-Fi Details on Standee</span>
                  <span className="text-[10px] text-slate-400 block">Helps diners connect and order smoothly</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showWifiInfo}
                onChange={(e) => setShowWifiInfo(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {showWifiInfo && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  placeholder="Network Name"
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white"
                />
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="Password"
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono"
                />
              </div>
            )}
          </div>

          {/* 6. Quick Share / Copy URL */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleCopyMenuLink}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs text-slate-300 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Menu Link Copied!' : 'Copy Customer Menu URL'}</span>
            </button>
          </div>

        </div>

        {/* Right 3D Standee Live Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          
          <div className="w-full max-w-md" id="printable-standee-dock">
            <TiltCard3D maxTilt={6} className="w-full">
              
              {/* Standee Container */}
              <div className={`p-8 rounded-3xl border shadow-2xl relative flex flex-col items-center text-center space-y-5 transition-all ${themeStyle.cardBg} ${themeStyle.border} ${themeStyle.glow}`}>
                
                {/* Top Acrylic Gloss Highlight */}
                <div className="absolute top-0 inset-x-8 h-1 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent rounded-t-full" />

                {/* Restaurant Brand & Table Badge */}
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 shadow-inner">
                    <Utensils className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-bold tracking-widest uppercase text-white">
                      {restaurant?.name || 'Zafran Gourmet Bistro'}
                    </span>
                  </div>

                  <h4 className="text-xl font-black tracking-tight text-white mt-1">
                    {headline}
                  </h4>

                  {/* Selected Table Number Chip */}
                  <div className="pt-1">
                    <span className={`inline-block px-3 py-1 rounded-xl text-xs font-mono font-bold tracking-wider uppercase border ${themeStyle.badgeBg}`}>
                      {selectedTableId === 'all'
                        ? 'DINING ROOM • TABLE DIRECT'
                        : selectedTableId === 'none'
                        ? 'TAKEAWAY • DIGITAL COUNTER'
                        : `TABLE ${tables.find(t => t.id === selectedTableId)?.table_number || selectedTableId}`}
                    </span>
                  </div>
                </div>

                {/* High-Resolution QR Code Card */}
                <div className="p-4 rounded-2xl bg-white shadow-2xl border-4 border-slate-800/80 relative group">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Customer Menu QR Code"
                      className="w-48 h-48 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 animate-pulse">
                      Generating QR...
                    </div>
                  )}

                  {/* Center Brand Logo overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-md">
                      <Utensils className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Instruction Tagline */}
                <div className="space-y-1 max-w-xs">
                  <p className="text-xs font-bold text-white tracking-wide flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Point Phone Camera to Scan Menu</span>
                  </p>
                  <p className={`text-[11px] ${themeStyle.subText}`}>
                    {subheadline}
                  </p>
                </div>

                {/* BOM Provenance & Wi-Fi Details Footer */}
                <div className="w-full pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  {showBOMTransparency && (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Farm-Fresh Recipe Transparency</span>
                    </div>
                  )}

                  {showWifiInfo && (
                    <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
                      <Wifi className="w-3 h-3 text-blue-400" />
                      <span>{wifiSsid}</span>
                    </div>
                  )}
                </div>

              </div>
            </TiltCard3D>
          </div>

          <p className="text-[11px] text-slate-500 mt-3 text-center no-print">
            Preview reflects exact 3D acrylic standee. Click "Print Standees" for table-ready laser cut template.
          </p>

        </div>

      </div>

      {/* Batch All Tables Multi-Standee Gallery Section */}
      <div className="p-5 rounded-3xl glass-panel-elevated bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-amber-400" />
              Batch Table Standee Roster (Cyber Hub Floor Plan)
            </h4>
            <p className="text-xs text-slate-400">
              Unique QR code generated for every table with automated table-routing embedded
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print All Tables</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {batchTableQrs.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-slate-950 border border-slate-850 text-center space-y-2 hover:border-amber-500/40 transition-colors"
            >
              <div className="text-xs font-mono font-bold text-white">{item.tableNum}</div>
              <div className="p-2 bg-white rounded-xl shadow-inner inline-block">
                <img src={item.dataUrl} alt={item.tableNum} className="w-20 h-20 object-contain mx-auto" />
              </div>
              <div className="text-[10px] text-slate-400">{item.tableName}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* CUSTOMER DIGITAL MENU PREVIEW MODAL                      */}
      {/* Simulates exact mobile view when customers scan the QR   */}
      {/* ======================================================== */}
      {showCustomerPreview && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Zafran Bistro — Live Customer Digital Menu</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Live Preview
                    </span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Table {selectedTableId === 'all' ? 'T-01' : selectedTableId} • Powered by Recipe BOM
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowCustomerPreview(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Filters Strip */}
            <div className="p-3 bg-slate-950/60 border-b border-slate-800 space-y-2">
              
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  placeholder="Search dishes or ingredients (e.g. Butter Chicken, Paneer, Saffron)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Dietary Toggle Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(['ALL', 'VEG', 'NON_VEG', 'BESTSELLER'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setPreviewDietaryFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                      previewDietaryFilter === f
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {f === 'ALL' ? 'All Dishes' : f === 'VEG' ? '🌱 Pure Veg' : f === 'NON_VEG' ? '🍗 Non-Veg' : '⭐ Bestsellers'}
                  </button>
                ))}
              </div>
            </div>

            {/* Dishes Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {enrichedItems
                .filter(item => {
                  const matchesSearch = item.name.toLowerCase().includes(previewSearch.toLowerCase()) ||
                    item.description?.toLowerCase().includes(previewSearch.toLowerCase()) ||
                    item.ingredientsList?.some(i => i.toLowerCase().includes(previewSearch.toLowerCase()));
                  const matchesDiet = 
                    previewDietaryFilter === 'ALL' ||
                    (previewDietaryFilter === 'VEG' && item.is_veg) ||
                    (previewDietaryFilter === 'NON_VEG' && !item.is_veg) ||
                    (previewDietaryFilter === 'BESTSELLER' && item.is_bestseller);
                  return matchesSearch && matchesDiet;
                })
                .map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-2">
                        {/* Veg / Non-Veg Indicator */}
                        <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                          item.is_veg ? 'border-emerald-500' : 'border-rose-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                        </span>

                        <span className="text-sm font-bold text-white">{item.name}</span>

                        {item.is_bestseller && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            Bestseller
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2">
                        {item.description || 'Authentic slow-cooked bistro specialty prepared fresh to order.'}
                      </p>

                      {/* Recipe BOM Transparency Pill Button */}
                      {item.ingredientsList && item.ingredientsList.length > 0 && (
                        <div className="pt-1">
                          <button
                            onClick={() => setSelectedDishForBOMModal(item)}
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>BOM Transparency: {item.ingredientsList.length} Farm Ingredients ({item.ingredientsList.slice(0, 3).join(', ')}...)</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                      <span className="text-base font-black font-mono text-amber-400">
                        ₹{item.price}
                      </span>
                      <button
                        onClick={() => {
                          setOrderNotification(`Added ${item.name} to order simulation!`);
                          setTimeout(() => setOrderNotification(null), 2500);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                      >
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Simulated Order Notification Banner */}
            {orderNotification && (
              <div className="px-4 py-2 bg-emerald-500/20 border-t border-emerald-500/30 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{orderNotification}</span>
              </div>
            )}

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-400">
              <span>Customer Mobile Scan Simulation • Powered by RestaurantOS Recipe BOM</span>
            </div>

          </div>
        </div>
      )}

      {/* Dish Recipe BOM Transparency Breakdown Modal */}
      {selectedDishForBOMModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-60 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Recipe BOM Transparency</h4>
              </div>
              <button
                onClick={() => setSelectedDishForBOMModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h5 className="text-base font-bold text-white">{selectedDishForBOMModal.name}</h5>
              <p className="text-xs text-slate-400 mt-0.5">
                Full Bill of Materials (BOM) ingredient breakdown pulled from kitchen inventory ledger
              </p>
            </div>

            {/* Ingredients List */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Raw Ingredients in Portion:
              </span>
              <div className="space-y-1.5">
                {selectedDishForBOMModal.recipe?.ingredients.map(ing => (
                  <div key={ing.ingredient_id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{ing.ingredient_name}</span>
                    <span className="font-mono text-amber-300">{ing.quantity_required} {ing.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Allergens Notice */}
            {selectedDishForBOMModal.allergens && selectedDishForBOMModal.allergens.length > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                <span>Allergens: <strong>{selectedDishForBOMModal.allergens.join(', ')}</strong></span>
              </div>
            )}

            <button
              onClick={() => setSelectedDishForBOMModal(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
