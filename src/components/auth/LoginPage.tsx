import React, { useState } from 'react';
import { 
  Lock, Mail, Eye, EyeOff, Sparkles, UtensilsCrossed, 
  ArrowRight, Shield, Smartphone, HelpCircle, CheckCircle2,
  Building2, UserCheck, ChefHat, Receipt, 
  Package, Calculator, Globe, Scan, ShieldCheck, 
  Flame, Utensils, Zap, Clock, TrendingUp, Check, Wine,
  Layers, ShoppingBag, ArrowUpRight, DollarSign, Store,
  Printer, CheckCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ForgotPasswordModal } from './ForgotPasswordModal.tsx';
import { TwoFactorModal } from './TwoFactorModal.tsx';
import { RoleType } from '../../types/index.ts';
import { api } from '../../lib/api.ts';

interface Props {
  onNavigateRegister: () => void;
}

export const LoginPage: React.FC<Props> = ({ onNavigateRegister }) => {
  const { 
    login, 
    loginWithOTP, 
    isLoading, 
    twoFactorPending, 
    isFallbackMode, 
    lastAuthError, 
    loginDemoUser 
  } = useAuth();

  const [authMode, setAuthMode] = useState<'PASSWORD' | 'PHONE_OTP'>('PASSWORD');
  const [identifier, setIdentifier] = useState('admin@restaurantos.io');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Selected Pocket-Fund demo role index
  const [selectedRoleIdx, setSelectedRoleIdx] = useState(0);

  // Interactive Live Showcase Tab (Replaces 3D with clean, impressive real-world POS/KDS simulator)
  const [showcaseTab, setShowcaseTab] = useState<'POS' | 'KDS' | 'AGGREGATORS' | 'RECIPES'>('POS');

  // Phone OTP state
  const [phone, setPhone] = useState('+91 98100 11223');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Modals
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState<'TERMS' | 'PRIVACY' | 'SUPPORT' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pocket Fund Style 1-Click Role Profiles (Embedded directly inside the login section)
  const pocketDemoRoles: {
    role: RoleType;
    label: string;
    sublabel: string;
    email: string;
    pass: string;
    icon: React.ReactNode;
    badge: string;
  }[] = [
    {
      role: 'OWNER',
      label: 'Executive Owner',
      sublabel: 'Full Overview & Margin Audit',
      email: 'admin@restaurantos.io',
      pass: 'Admin@123',
      icon: <Building2 className="w-3.5 h-3.5" />,
      badge: '👑 Owner Only',
    },
    {
      role: 'MANAGER',
      label: 'Floor Manager',
      sublabel: 'Shift Ops & Table Turnover',
      email: 'manager@restaurantos.io',
      pass: 'Manager@123',
      icon: <UserCheck className="w-3.5 h-3.5" />,
      badge: 'Operations',
    },
    {
      role: 'KITCHEN',
      label: 'Head Chef',
      sublabel: 'KDS Prep & Station Pass',
      email: 'kitchen@restaurantos.io',
      pass: 'Kitchen@123',
      icon: <ChefHat className="w-3.5 h-3.5" />,
      badge: 'Brigade',
    },
    {
      role: 'CASHIER',
      label: 'Smart POS Cashier',
      sublabel: 'Rapid Billing & UPI QR',
      email: 'cashier@restaurantos.io',
      pass: 'Cashier@123',
      icon: <Receipt className="w-3.5 h-3.5" />,
      badge: 'Register',
    },
    {
      role: 'WAITER',
      label: 'Captain Waiter',
      sublabel: 'Tables & Table Service',
      email: 'waiter@restaurantos.io',
      pass: 'Waiter@123',
      icon: <Wine className="w-3.5 h-3.5" />,
      badge: 'Service',
    },
    {
      role: 'INVENTORY_MANAGER',
      label: 'Inventory Lead',
      sublabel: 'Kirana Stock & Ledgers',
      email: 'inventory@restaurantos.io',
      pass: 'Inventory@123',
      icon: <Package className="w-3.5 h-3.5" />,
      badge: 'Storeroom',
    },
  ];

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const res = await login(identifier, password, rememberMe);
      if (res?.requires2FA) {
        setShowTwoFactorModal(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    }
  };

  const handleDirectDemoSelect = (idx: number) => {
    setSelectedRoleIdx(idx);
    const r = pocketDemoRoles[idx];
    setAuthMode('PASSWORD');
    setIdentifier(r.email);
    setPassword(r.pass);
    setErrorMessage(null);
  };

  const handleDirectDemoLogin = async (roleItem: typeof pocketDemoRoles[0]) => {
    setAuthMode('PASSWORD');
    setIdentifier(roleItem.email);
    setPassword(roleItem.pass);
    setErrorMessage(null);
    try {
      const res = await login(roleItem.email, roleItem.pass, true);
      if (res?.requires2FA) {
        setShowTwoFactorModal(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    }
  };

  const handleSendPhoneOTP = async () => {
    if (!phone) {
      setErrorMessage('Please enter your mobile number.');
      return;
    }
    setErrorMessage(null);
    try {
      await api.post('/auth/send-otp', { phone });
      setOtpSent(true);
      setOtpCode('123456');
      setOtpCountdown(60);
      const timer = setInterval(() => {
        setOtpCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP.');
    }
  };

  const handlePhoneOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      setErrorMessage('Please enter the verification code.');
      return;
    }
    setErrorMessage(null);
    try {
      await loginWithOTP(phone, otpCode);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid OTP code.');
    }
  };

  const selectedRole = pocketDemoRoles[selectedRoleIdx];

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-between relative overflow-x-hidden text-stone-100 font-sans selection:bg-amber-500/25 selection:text-amber-200">
      
      {/* 1. AUTHENTIC RESTAURANT TRANSPARENT KITCHEN BACKGROUND (Clean photography, no 3D canvas) */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none opacity-10 mix-blend-luminosity filter contrast-125"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1920&auto=format&fit=crop&q=80')`,
        }}
      />

      {/* 2. Soft Warm Restaurant Ambient Glow & Gradients (Clean modern theme) */}
      <div className="fixed inset-0 z-0 bg-radial-gradient from-transparent via-stone-950/80 to-stone-950/98 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-[650px] h-[450px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 w-[500px] h-[350px] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-stone-800/80 bg-stone-950/90 backdrop-blur-md z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-stone-950">
            <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                Restaurant<span className="text-amber-400">OS</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                v2.6 Cloud POS
              </span>
            </div>
            <p className="text-[11px] text-stone-400 hidden sm:block">Intelligent POS, Kitchen KDS & Ledger OS</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveInfoModal('SUPPORT')}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors px-3 py-1.5 rounded-xl hover:bg-stone-900 border border-transparent hover:border-stone-800 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Role Permissions</span>
          </button>

          <button
            onClick={onNavigateRegister}
            className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Register Brand</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content Area: High-Impact Clean SaaS Layout */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 z-10 my-2 sm:my-4">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: CLEAN & IMPRESSIVE LIVE OPERATIONS SHOWCASE */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Next-Gen Restaurant Operating System · Indian & Global Market Ready</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Live Kitchen KDS to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400">High-Speed POS & GST Audits</span>.
              </h1>

              <p className="text-xs sm:text-sm text-stone-300/90 leading-relaxed max-w-2xl font-sans">
                Engineered for dine-in bistros, quick-service counters, and multi-branch cloud kitchens. Fast touch billing, real-time Kitchen Order Tickets (KOT), Swiggy & Zomato aggregator sync, and live recipe bill-of-materials costing.
              </p>
            </div>

            {/* LIVE OPERATIONS COMMAND CENTER SHOWCASE (CLEAN, INTERACTIVE & HIGH-IMPACT) */}
            <div className="rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl backdrop-blur-xl overflow-hidden">
              
              {/* Interactive Showcase Tabs */}
              <div className="flex items-center justify-between px-4 py-3 bg-stone-950/80 border-b border-stone-800">
                <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setShowcaseTab('POS')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      showcaseTab === 'POS'
                        ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                        : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Live POS Terminal</span>
                  </button>

                  <button
                    onClick={() => setShowcaseTab('KDS')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      showcaseTab === 'KDS'
                        ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                        : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
                    }`}
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>Kitchen KDS Pass</span>
                  </button>

                  <button
                    onClick={() => setShowcaseTab('AGGREGATORS')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      showcaseTab === 'AGGREGATORS'
                        ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                        : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Aggregators Sync</span>
                  </button>

                  <button
                    onClick={() => setShowcaseTab('RECIPES')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      showcaseTab === 'RECIPES'
                        ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                        : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>BOM Margins</span>
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-Time Engine</span>
                </div>
              </div>

              {/* Showcase Body Content */}
              <div className="p-4 sm:p-5">
                
                {/* 1. POS Terminal Showcase */}
                {showcaseTab === 'POS' && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 font-mono font-bold text-[11px] border border-amber-500/30">
                          Table T-04 · Dine-In
                        </span>
                        <span className="text-stone-400 text-[11px]">4 Guests · Waiter: Rahul</span>
                      </div>
                      <span className="text-stone-400 font-mono text-[11px]">Bill #INV-8821</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1.5 bg-stone-950/70 p-3 rounded-2xl border border-stone-800">
                        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                          Active Order Items
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-stone-800/60">
                          <span className="text-white font-medium">1x Butter Chicken Royale</span>
                          <span className="font-mono text-stone-200">₹440</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-stone-800/60">
                          <span className="text-white font-medium">2x Tandoori Garlic Naan</span>
                          <span className="font-mono text-stone-200">₹170</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-stone-800/60">
                          <span className="text-white font-medium">1x Dal Makhani Heritage</span>
                          <span className="font-mono text-stone-200">₹320</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-white font-medium">2x Saffron Lassi</span>
                          <span className="font-mono text-stone-200">₹360</span>
                        </div>
                      </div>

                      <div className="space-y-2 bg-stone-950/70 p-3 rounded-2xl border border-stone-800 flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                            GST & Bill Breakdown
                          </div>
                          <div className="space-y-1 text-[11px] text-stone-300">
                            <div className="flex justify-between">
                              <span>Subtotal</span>
                              <span className="font-mono">₹1,290.00</span>
                            </div>
                            <div className="flex justify-between text-stone-400">
                              <span>CGST (2.5%)</span>
                              <span className="font-mono">₹32.25</span>
                            </div>
                            <div className="flex justify-between text-stone-400">
                              <span>SGST (2.5%)</span>
                              <span className="font-mono">₹32.25</span>
                            </div>
                            <div className="flex justify-between font-black text-amber-400 text-sm pt-1 border-t border-stone-800">
                              <span>Grand Total</span>
                              <span className="font-mono">₹1,354.50</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-2">
                          <button className="py-1.5 px-2 rounded-xl bg-amber-500 text-stone-950 font-black text-[11px] flex items-center justify-center gap-1 shadow-sm">
                            <Scan className="w-3 h-3" />
                            <span>UPI QR Pay</span>
                          </button>
                          <button className="py-1.5 px-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-[11px] flex items-center justify-center gap-1">
                            <Printer className="w-3 h-3" />
                            <span>Print KOT</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Kitchen KDS Showcase */}
                {showcaseTab === 'KDS' && (
                  <div className="space-y-2.5 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      
                      <div className="p-3 rounded-2xl bg-stone-950/80 border border-amber-500/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-amber-400 text-[11px]">#KOT-104 · T-04</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">3m 42s</span>
                        </div>
                        <div className="text-[10px] text-stone-400 uppercase font-bold">Station: Tandoor Pass</div>
                        <div className="space-y-1 text-[11px] text-stone-200">
                          <div>• 2x Garlic Naan (Crisp)</div>
                          <div>• 1x Paneer Tikka (Extra mint)</div>
                        </div>
                        <div className="pt-2 border-t border-stone-800 flex justify-between items-center text-[10px]">
                          <span className="text-amber-400 font-semibold">● In Preparation</span>
                          <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-bold">Bump</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-stone-950/80 border border-emerald-500/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-emerald-400 text-[11px]">#KOT-105 · Swiggy</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono">1m 12s</span>
                        </div>
                        <div className="text-[10px] text-stone-400 uppercase font-bold">Station: Curry & Gravy</div>
                        <div className="space-y-1 text-[11px] text-stone-200">
                          <div>• 1x Butter Chicken Handi</div>
                          <div>• 1x Jeera Rice (Fragrant)</div>
                        </div>
                        <div className="pt-2 border-t border-stone-800 flex justify-between items-center text-[10px]">
                          <span className="text-emerald-400 font-semibold">● Firing</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">Ready</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-400 text-[11px]">#KOT-102 · T-02</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 font-mono">7m 50s</span>
                        </div>
                        <div className="text-[10px] text-stone-400 uppercase font-bold">Station: Bar Counter</div>
                        <div className="space-y-1 text-[11px] text-stone-200">
                          <div>• 2x Virgin Mojito</div>
                          <div>• 1x Fresh Lime Soda</div>
                        </div>
                        <div className="pt-2 border-t border-stone-800 flex justify-between items-center text-[10px]">
                          <span className="text-emerald-400 font-semibold">✓ Dispatched</span>
                          <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-400 font-bold">Served</span>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 3. Aggregators Sync Showcase */}
                {showcaseTab === 'AGGREGATORS' && (
                  <div className="space-y-2.5 animate-in fade-in text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 text-center">
                        <div className="font-bold text-white text-[12px]">Zomato Live</div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">● Connected (14 Orders)</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 text-center">
                        <div className="font-bold text-white text-[12px]">Swiggy Express</div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">● Connected (21 Orders)</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 text-center">
                        <div className="font-bold text-white text-[12px]">Direct QR Dine</div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">● 18 Tables Seated</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 text-center">
                        <div className="font-bold text-white text-[12px]">Takeaway Counter</div>
                        <div className="text-[10px] text-amber-400 font-mono mt-0.5">● 5 Pickups Waiting</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                          SW
                        </span>
                        <div>
                          <div className="font-bold text-white text-[11px]">Swiggy Order #SW-9021 · 2 Items</div>
                          <div className="text-[10px] text-stone-400">Rider: Vikram S. · Arriving in 4 mins · OTP: 8841</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] border border-emerald-500/30">
                        Auto-Accepted
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. Recipe BOM Showcase */}
                {showcaseTab === 'RECIPES' && (
                  <div className="space-y-2.5 animate-in fade-in text-xs">
                    <div className="space-y-1.5 bg-stone-950/80 p-3 rounded-2xl border border-stone-800">
                      <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 flex justify-between">
                        <span>Plate Costing & Live Margin Health</span>
                        <span className="text-emerald-400 font-mono">BOM Ledger Auto-Sync</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="p-2 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white text-[11px]">Butter Chicken Special</div>
                            <div className="text-[10px] text-stone-400">Price: ₹440 · Plate Cost: ₹98.40 (Chicken, Makhani, Butter)</div>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-400 font-mono font-bold text-xs">77.6% Margin</span>
                            <div className="text-[9px] text-stone-400 font-mono">Healthy (Target: 70%)</div>
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white text-[11px]">Dal Makhani Heritage</div>
                            <div className="text-[10px] text-stone-400">Price: ₹320 · Plate Cost: ₹58.20 (Black Urad, Cream, Ghee)</div>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-400 font-mono font-bold text-xs">81.8% Margin</span>
                            <div className="text-[9px] text-stone-400 font-mono">Top Profit Star</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Restaurant Operational Metric Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-stone-900/80 border border-stone-800 shadow-sm">
                <div className="text-amber-400 font-black text-lg sm:text-xl">1.4s</div>
                <div className="text-[11px] font-bold text-white mt-0.5">Fast POS Billing</div>
                <div className="text-[10px] text-stone-400">Instant capacitive checkout</div>
              </div>

              <div className="p-3 rounded-2xl bg-stone-900/80 border border-stone-800 shadow-sm">
                <div className="text-emerald-400 font-black text-lg sm:text-xl">100%</div>
                <div className="text-[11px] font-bold text-white mt-0.5">Live Recipe BOM</div>
                <div className="text-[10px] text-stone-400">Plate cost & ingredient sync</div>
              </div>

              <div className="p-3 rounded-2xl bg-stone-900/80 border border-stone-800 shadow-sm">
                <div className="text-blue-400 font-black text-lg sm:text-xl">4 Channels</div>
                <div className="text-[11px] font-bold text-white mt-0.5">Aggregators Auto-Pipe</div>
                <div className="text-[10px] text-stone-400">Zomato, Swiggy, Dine-in QR</div>
              </div>

              <div className="p-3 rounded-2xl bg-stone-900/80 border border-stone-800 shadow-sm">
                <div className="text-purple-400 font-black text-lg sm:text-xl">GST 5% & 18%</div>
                <div className="text-[11px] font-bold text-white mt-0.5">Statutory Ledger</div>
                <div className="text-[10px] text-stone-400">HSN 9963 tax reporting</div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: POCKET FUND STYLE LOGIN WITH EMBEDDED DEMO */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 w-full">
            <div className="w-full p-5 sm:p-7 rounded-3xl bg-stone-900/95 border border-stone-800 shadow-2xl backdrop-blur-2xl relative overflow-hidden space-y-4">
              
              {/* Blurred High-Quality Transparent Professional Kitchen Background Image */}
              <div 
                className="absolute inset-0 pointer-events-none z-0 bg-cover bg-center opacity-15 filter blur-[3px] contrast-125 saturate-110"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80')`,
                }}
              />
              {/* Subtle vignette gradient over the kitchen photo for crisp text contrast */}
              <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-stone-950/90 via-stone-900/95 to-stone-950/98" />

              {/* Card Content (z-10 above kitchen photo overlay) */}
              <div className="relative z-10 space-y-4">
              
                {/* Header with Mode Switcher */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Restaurant Terminal
                    </h2>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Role clearance required to enter operating station
                    </p>
                  </div>

                  <span className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    RBAC Protected
                  </span>
                </div>

                {/* Pocket-Fund Style 1-Click Fast Role Switcher (Embedded directly in login!) */}
                <div className="p-3.5 rounded-2xl bg-stone-950/90 border border-stone-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>Select Role (Pocket Fund Style):</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">1-tap demo credentials</span>
                  </div>

                  {/* 6 Quick Role Buttons */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {pocketDemoRoles.map((roleItem, idx) => {
                      const isSelected = selectedRoleIdx === idx;
                      return (
                        <button
                          key={roleItem.role}
                          type="button"
                          onClick={() => handleDirectDemoSelect(idx)}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500/80 shadow-md shadow-amber-500/20 ring-1 ring-amber-500/50'
                              : 'bg-stone-900/80 border-stone-800 hover:border-stone-700 hover:bg-stone-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="p-1 rounded-md bg-stone-800 text-amber-400">
                              {roleItem.icon}
                            </span>
                            <span className="text-[11px] font-bold text-white truncate">
                              {roleItem.label}
                            </span>
                          </div>
                          <div className="text-[9px] text-amber-300/80 truncate mt-1 font-mono">
                            {roleItem.badge}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Demo Card Info Strip */}
                  <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                        <span>{selectedRole.label}</span>
                        <span className="text-[9px] text-amber-400 font-mono px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                          {selectedRole.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                        {selectedRole.email} · {selectedRole.pass}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDirectDemoLogin(selectedRole)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      <span>Quick Login</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Tabs: Password vs Phone OTP */}
                <div className="grid grid-cols-2 p-1 bg-stone-950/80 rounded-xl border border-stone-800 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('PASSWORD'); setErrorMessage(null); }}
                    className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      authMode === 'PASSWORD'
                        ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Staff Email Login</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setAuthMode('PHONE_OTP'); setErrorMessage(null); }}
                    className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      authMode === 'PHONE_OTP'
                        ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile OTP</span>
                  </button>
                </div>

                {/* Error Banner with 1-Click Fallback & Diagnostics Shortcut */}
                {errorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="font-semibold text-rose-300">{errorMessage}</div>
                        {lastAuthError?.category === 'VERCEL_DEPLOYMENT' && (
                          <div className="text-[11px] text-amber-300/90 mt-1 font-sans">
                            Vercel deployment issue detected. Click below to bypass backend and explore immediately:
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-rose-500/20 text-[11px]">
                      <button
                        type="button"
                        onClick={() => loginDemoUser('OWNER')}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Instant Owner Login</span>
                      </button>

                      <span className="text-[10px] text-stone-400 font-mono">
                        See Diagnostics Indicator ↘
                      </span>
                    </div>
                  </div>
                )}

                {/* Password / Admin Login Form */}
                {authMode === 'PASSWORD' && (
                  <form onSubmit={handlePasswordLogin} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1">
                        Staff Email or Username
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-stone-500 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="e.g. admin@restaurantos.io or admin"
                          className="w-full pl-9 pr-3 py-2.5 bg-stone-950/80 border border-stone-700/80 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-stone-300">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowForgotModal(true)}
                          className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-stone-500 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2.5 bg-stone-950/80 border border-stone-700/80 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-stone-400 hover:text-white cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded bg-stone-950 border-stone-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="text-xs text-stone-300">Keep session active</span>
                      </label>

                      {isFallbackMode && (
                        <span className="text-[10px] text-amber-400 font-mono">
                          ⚡ Fallback Active
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl font-extrabold text-xs text-stone-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Sign into Terminal</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Phone OTP Login Form */}
                {authMode === 'PHONE_OTP' && (
                  <form onSubmit={handlePhoneOTPLogin} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1">
                        Registered Mobile Number
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Smartphone className="absolute left-3 top-3 w-4 h-4 text-stone-500 pointer-events-none" />
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 98100 11223"
                            className="w-full pl-9 pr-3 py-2.5 bg-stone-950/80 border border-stone-700/80 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSendPhoneOTP}
                          disabled={otpCountdown > 0}
                          className="px-3 py-2.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-xs font-bold text-amber-400 disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
                        >
                          {otpCountdown > 0 ? `${otpCountdown}s` : otpSent ? 'Resend' : 'Get OTP'}
                        </button>
                      </div>
                    </div>

                    {otpSent && (
                      <div className="space-y-2 animate-in fade-in">
                        <label className="block text-xs font-semibold text-stone-300">
                          6-Digit Verification Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="123456"
                          className="w-full text-center py-2.5 bg-stone-950/80 border border-stone-700/80 rounded-xl text-lg font-mono font-bold tracking-widest text-amber-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                        />
                        <p className="text-[11px] text-stone-400 text-center">
                          Demo OTP: <strong className="text-amber-400 font-mono">123456</strong>
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || (!otpSent && !otpCode)}
                      className="w-full py-3 px-4 rounded-xl font-extrabold text-xs text-stone-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Verify & Launch</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Footer link to register */}
                <div className="text-center pt-2 border-t border-stone-800/80 text-xs text-stone-400">
                  New restaurant brand?{' '}
                  <button
                    type="button"
                    onClick={onNavigateRegister}
                    className="text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
                  >
                    Register Organization
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Links & Indian/International Compliance Badges */}
      <footer className="w-full px-4 sm:px-8 py-3.5 border-t border-stone-800/80 bg-stone-950/90 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2.5 z-10">
        <div className="flex flex-wrap items-center gap-2">
          <span>© 2026 RestaurantOS Inc.</span>
          <span>·</span>
          <span>GST HSN 9963 & FSSAI Ready</span>
          <span>·</span>
          <span>Petpooja & Toast Standard Sync</span>
          <span>·</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Zero-Delay KOT Engine
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveInfoModal('TERMS')}
            className="hover:text-stone-300 transition-colors cursor-pointer"
          >
            Terms of Service
          </button>
          <span>·</span>
          <button
            onClick={() => setActiveInfoModal('PRIVACY')}
            className="hover:text-stone-300 transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>·</span>
          <button
            onClick={() => setActiveInfoModal('SUPPORT')}
            className="hover:text-stone-300 transition-colors cursor-pointer"
          >
            Role Permissions Guide
          </button>
        </div>
      </footer>

      {/* Modals */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        onSuccess={() => {
          setShowForgotModal(false);
          setErrorMessage(null);
        }}
      />

      <TwoFactorModal
        isOpen={showTwoFactorModal || !!twoFactorPending}
        onClose={() => setShowTwoFactorModal(false)}
        email={twoFactorPending?.email || identifier}
        mobile={twoFactorPending?.mobile || '+91 98100 11223'}
      />

      {/* Support / Help Modal */}
      {activeInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-stone-900 border border-stone-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-white">
                {activeInfoModal === 'TERMS' && 'RestaurantOS Terms of Service'}
                {activeInfoModal === 'PRIVACY' && 'Enterprise Data & Privacy Policy'}
                {activeInfoModal === 'SUPPORT' && 'RestaurantOS Architecture & Role Clearance'}
              </h3>
              <button
                onClick={() => setActiveInfoModal(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-4 text-xs text-stone-300 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {activeInfoModal === 'SUPPORT' && (
                <>
                  <p className="font-semibold text-amber-300">Strict Role Clearance:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-stone-300">
                    <li><strong className="text-white">Restaurant Owner:</strong> Executive overview, branch financials, AI configurations, menu pricing, staff invitations, and branch management. Only the Owner can access the Executive Overview.</li>
                    <li><strong className="text-white">Manager:</strong> Operations, table floor plan, daily huddles, and review AI purchase plans.</li>
                    <li><strong className="text-white">Cashier:</strong> High-speed POS, split billing, discounts, payment processing (Cash, Card, UPI), KOT firing.</li>
                    <li><strong className="text-white">Head Chef (Kitchen):</strong> Kitchen Display System (KDS), station tickets, order preparation status.</li>
                    <li><strong className="text-white">Inventory Manager:</strong> Stock ledger, batch expiry tracking, wastage recording, PO receiving.</li>
                    <li><strong className="text-white">Accountant:</strong> Tax / GST reports, contribution margins, recipe costs, financial exports.</li>
                  </ul>
                  <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 font-mono text-[11px] text-amber-300">
                    💡 Tip: Click any demo role in the login box to select credentials and sign in immediately.
                  </div>
                </>
              )}

              {activeInfoModal === 'TERMS' && (
                <>
                  <p>RestaurantOS guarantees strict tenant isolation. Every database record carries organization_id, restaurant_id, and branch_id. Multi-branch access tokens are verified at the backend API layer.</p>
                  <p>All stock movements (PURCHASE, SALE_CONSUMPTION, WASTAGE, RETURN, ADJUSTMENT) generate permanent ledger entries for statutory compliance.</p>
                </>
              )}

              {activeInfoModal === 'PRIVACY' && (
                <>
                  <p>Customer phone numbers and billing information are encrypted in transit and at rest. Historical transaction records remain immutable; corrections require credit notes or logged adjustments.</p>
                </>
              )}
            </div>

            <button
              onClick={() => setActiveInfoModal(null)}
              className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
