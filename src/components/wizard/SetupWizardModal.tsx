import React, { useState } from 'react';
import { 
  Sparkles, CheckCircle2, Building, Store, Table as TableIcon, 
  UtensilsCrossed, FlaskConical, Package, Truck, Users, 
  Percent, Bot, ArrowRight, ArrowLeft, X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupWizardModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const steps = [
    { num: 1, title: 'Restaurant Profile', desc: 'Brand, logo, legal address, contact' },
    { num: 2, title: 'Branches', desc: 'Configure multi-outlet layout' },
    { num: 3, title: 'Tables & Floor', desc: 'Seating areas & dining capacity' },
    { num: 4, title: 'Menu Catalog', desc: 'Dishes, pricing & modifier options' },
    { num: 5, title: 'Recipes (BOM)', desc: 'Connect ingredients to dishes' },
    { num: 6, title: 'Inventory Opening', desc: 'Initial stock ledger balances' },
    { num: 7, title: 'Suppliers', desc: 'Vendor directory & lead times' },
    { num: 8, title: 'Team & RBAC', desc: 'Invite staff & assign permissions' },
    { num: 9, title: 'Tax & GST', desc: 'GSTIN, CGST/SGST & payments' },
    { num: 10, title: 'AI Copilot Engine', desc: 'Forecast algorithms & anti-overstock' },
    { num: 11, title: 'Workspace Ready!', desc: 'All modules integrated' },
  ];

  const handleFinish = () => {
    try {
      confetti({ particleCount: 70, spread: 60 });
    } catch (e) {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-2xl p-6 rounded-3xl glass-panel-elevated bg-slate-900 border border-slate-700 shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Restaurant Setup & Configuration Wizard</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Step {step} of 11: <strong>{steps[step - 1].title}</strong></span>
            <span className="font-mono text-amber-400">{Math.round((step / 11) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all"
              style={{ width: `${(step / 11) * 100}%` }}
            />
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3 min-h-[220px] flex flex-col items-center justify-center">
          {step === 11 ? (
            <>
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 mb-1">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white">Your Restaurant Operating System is Ready!</h4>
              <p className="text-xs text-slate-400 max-w-md">
                POS orders, KDS tickets, recipe BOM deductions, double-entry stock ledger, and AI demand forecasting are connected in real-time.
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 mb-1">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">{steps[step - 1].title}</h4>
              <p className="text-xs text-slate-400 max-w-md">{steps[step - 1].desc}</p>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
                ✓ Pre-configured with Zafran Gourmet Bistro defaults & compliant GST formulas
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          {step > 1 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          ) : <div />}

          {step < 11 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="py-2 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
            >
              Continue
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="py-2 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              Enter Main Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
