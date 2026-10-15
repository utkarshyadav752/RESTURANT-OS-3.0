import React, { useState } from 'react';
import { 
  Sparkles, X, FileText, CheckCircle2, ArrowRight, 
  RefreshCw, Mic, MicOff, AlertCircle, Plus, Trash2, Package
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

const SAMPLE_INVOICES = [
  {
    title: 'Azadpur Mandi Fresh Produce Bill',
    text: `Azadpur Sabzi Mandi - Invoice #AZD-8891
Date: 29 Sept 2026
Items:
1. Farm Plum Tomatoes - 25 kg @ Rs 36 per kg
2. Nashik Red Onions - 40 kg @ Rs 28 per kg
3. Fresh Green Coriander - 5 kg @ Rs 45 per kg
4. Himachali Ginger Fresh - 4 kg @ Rs 110 per kg
5. Fresh Mint Leaves (Pudina) - 3 kg @ Rs 50 per kg
Vendor: Azadpur Mandi Direct Wholesale`,
  },
  {
    title: 'Punjab Dairy Fresh Delivery Memo',
    text: `Punjab Dairy & Cream Co. - Daily Delivery Challan
Customer: Zafran Bistro Cyber Hub
Malai Paneer Fresh Block: 15 kg at Rs 280
Amul Butter Salted (500g): 20 pkt at Rs 260
Full Cream Milk: 30 L at Rs 66
Fresh Malai Cream 1kg: 8 pkt at Rs 210
Delivery Time: 06:30 AM`,
  },
  {
    title: 'Heritage Spices & Dry Goods Bill',
    text: `Khari Baoli Heritage Spices - Bill #KB-402
1. India Gate Basmati Rice 5kg: 10 bag @ Rs 580 each
2. MDH Deggi Mirch 500g: 8 pkt @ Rs 310
3. Tata Vacuum Salt 1kg: 25 pkt @ Rs 24
4. Whole Green Cardamom (Elaichi): 1 kg @ Rs 2400
5. Fortune Refined Sunflower Oil 15L Tin: 2 tin @ Rs 1950`,
  },
];

export const AIInvoiceImporterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const { currentBranch, user } = useAuth();
  const [inputText, setInputText] = useState(SAMPLE_INVOICES[0].text);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);

  if (!isOpen) return null;

  const handleParseAI = async () => {
    if (!inputText.trim()) return;
    setIsParsing(true);
    setParsedData(null);
    setSuccessCount(null);

    try {
      const res = await api.post('/inventory/ai-parse', {
        text: inputText,
      });

      if (res.success) {
        setParsedData(res);
      }
    } catch (err) {
      console.error('AI Invoice parsing failed:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommitBulkInward = async () => {
    if (!parsedData || !parsedData.items?.length) return;
    setIsImporting(true);

    try {
      const res = await api.post('/inventory/bulk-inward', {
        items: parsedData.items,
        branchId: currentBranch?.id || 'branch_cybercity',
        createdBy: `${user?.name || 'Inventory Lead'} (via AI Invoice Reader)`,
      });

      if (res.success) {
        setSuccessCount(res.count);
        onImportComplete?.();
      }
    } catch (err) {
      console.error('Bulk inward failed:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleItemFieldChange = (index: number, field: string, value: any) => {
    if (!parsedData?.items) return;
    const updated = [...parsedData.items];
    updated[index] = { ...updated[index], [field]: value };
    setParsedData({ ...parsedData, items: updated });
  };

  const handleRemoveItem = (index: number) => {
    if (!parsedData?.items) return;
    const updated = parsedData.items.filter((_: any, idx: number) => idx !== index);
    setParsedData({ ...parsedData, items: updated });
  };

  // Simulated voice note recording
  const toggleVoiceInput = () => {
    if (!isListening) {
      setIsListening(true);
      setTimeout(() => {
        setInputText(
          "Voice Note Transcribed:\nReceived 12 kg fresh chicken breasts from Delhi Farms at Rs 220 per kg, and 15 kg malai paneer at Rs 280 per kg. Both checked for temperature under 4 degrees."
        );
        setIsListening(false);
      }, 2500);
    } else {
      setIsListening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                KiranaSetu AI Invoice & Voice Inward
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  Gemini 3.8 Flash AI Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Paste WhatsApp orders, paper invoice text, or speak items — AI automatically extracts SKUs, rates, and stock ledger inward entries
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Success Banner */}
          {successCount !== null && (
            <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs text-emerald-200 animate-slide-down">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  <strong>Success!</strong> Successfully inwarded {successCount} SKUs to stock ledger and generated FIFO batch records.
                </span>
              </div>
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl"
              >
                Close View
              </button>
            </div>
          )}

          {/* Preset Buttons */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              ⚡ Try Sample Supplier Invoices:
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_INVOICES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(sample.text);
                    setParsedData(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  {sample.title}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area Input */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Raw Bill / Invoice Text or Voice Transcript
              </label>
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                {isListening ? (
                  <>
                    <Mic className="w-3.5 h-3.5 animate-bounce" />
                    Listening to Voice Note...
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    Simulate Voice Inward
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw bill text, e.g.: 25kg Onion @ 28, 10kg Tomato @ 36, 5L Oil @ 135..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 font-mono focus:border-purple-400 focus:outline-none"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleParseAI}
                disabled={isParsing || !inputText.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
              >
                {isParsing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing Invoice with Gemini AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Extract & Match SKUs with AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Extracted Table */}
          {parsedData && parsedData.items && (
            <div className="rounded-2xl bg-slate-950 border border-purple-500/30 p-4 sm:p-5 space-y-4 animate-slide-up">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      Extracted {parsedData.items.length} Line Items
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                      Vendor: {parsedData.vendorName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {parsedData.aiNotes}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated Bill Total</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    ₹{parsedData.invoiceTotal?.toLocaleString('en-IN') || 0}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">Item / SKU</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Quantity</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">Purchase Rate (₹)</th>
                      <th className="py-2.5 px-3">Line Total (₹)</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {parsedData.items.map((item: any, idx: number) => {
                      const lineTotal = (item.quantity || 0) * (item.cost_per_unit || 0);
                      return (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="py-2 px-3 font-sans">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemFieldChange(idx, 'name', e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold w-full"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleItemFieldChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold w-20"
                            />
                          </td>
                          <td className="py-2 px-3 text-slate-400">
                            {item.unit}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              step="any"
                              value={item.cost_per_unit}
                              onChange={(e) => handleItemFieldChange(idx, 'cost_per_unit', parseFloat(e.target.value) || 0)}
                              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold w-20"
                            />
                          </td>
                          <td className="py-2 px-3 text-white font-bold">
                            ₹{lineTotal.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Commit Action */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Ready to post to double-entry stock ledger with automatic FIFO batches
                </span>
                <button
                  type="button"
                  onClick={handleCommitBulkInward}
                  disabled={isImporting || parsedData.items.length === 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Posting Inward to Stock Ledger...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Inward All {parsedData.items.length} SKUs
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
