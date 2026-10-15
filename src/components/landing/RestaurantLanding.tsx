import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Check,
  ChevronDown,
  CreditCard,
  ChefHat,
  Receipt,
  Table as TableIcon,
  Package,
  TrendingUp,
  Clock,
  Plus,
  Building2,
  Lock,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  UserCheck,
  DollarSign,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { RoleType } from '../../types/index.ts';

interface RestaurantLandingProps {
  onOpenBookDemo: () => void;
  onOpenAICopilot: () => void;
  onOpenForgotPassword?: () => void;
  showToast: (msg: string) => void;
  initialTab?: 'ONE_CLICK' | 'CREDENTIALS' | 'PHONE_OTP' | 'REGISTER';
}

export const RestaurantLanding: React.FC<RestaurantLandingProps> = ({
  onOpenBookDemo,
  onOpenAICopilot,
  onOpenForgotPassword,
  showToast,
  initialTab = 'ONE_CLICK',
}) => {
  const { login, loginWithOTP, loginDemoUser, register, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Merged Login & Onboarding State in the front web page
  const [loginMethod, setLoginMethod] = useState<'ONE_CLICK' | 'CREDENTIALS' | 'PHONE_OTP' | 'REGISTER'>(initialTab);
  const [identifier, setIdentifier] = useState('owner@restaurantos.io');
  const [password, setPassword] = useState('Owner@123');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('+91 98100 11223');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Quick Register State for new restaurant outlets
  const [regRestaurantName, setRegRestaurantName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCity, setRegCity] = useState('Cyber Hub, Gurugram');
  const [regCuisine, setRegCuisine] = useState<'mughlai' | 'multicuisine' | 'qsr' | 'bar'>('mughlai');

  // Sync tab if initialTab changes
  React.useEffect(() => {
    if (initialTab) {
      setLoginMethod(initialTab);
    }
  }, [initialTab]);

  // Food Cost Calculator State
  const [dailyCovers, setDailyCovers] = useState<number>(250);
  const [cuisineType, setCuisineType] = useState<'mughlai' | 'multicuisine' | 'qsr' | 'bar'>('mughlai');
  const [cityTier, setCityTier] = useState<'metro' | 'tier2'>('metro');

  // Interactive Live POS Sandbox State
  const [sandboxItems, setSandboxItems] = useState([
    { id: 'item-1', name: 'Purani Dilli Butter Chicken', price: 450, qty: 2, icon: '🍗' },
    { id: 'item-2', name: 'Garlic Butter Naan', price: 90, qty: 3, icon: '🫓' },
    { id: 'item-3', name: 'Dal Makhani Bukhara', price: 380, qty: 1, icon: '🍲' },
  ]);
  const [kotDispatched, setKotDispatched] = useState(false);
  const [billSettled, setBillSettled] = useState(false);

  // Calculator formulas
  const avgCheck = cuisineType === 'mughlai' ? 650 : cuisineType === 'bar' ? 950 : cuisineType === 'qsr' ? 320 : 550;
  const monthlyRevenue = dailyCovers * avgCheck * 30;
  const leakageRate = cityTier === 'metro' ? 0.042 : 0.035;
  const preventedLeakage = Math.round(monthlyRevenue * leakageRate);
  const inventoryRecovery = Math.round(preventedLeakage * 0.72);

  // Live Sandbox calculations
  const subtotal = sandboxItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const cgst = Math.round(subtotal * 0.025);
  const sgst = Math.round(subtotal * 0.025);
  const grandTotal = subtotal + cgst + sgst;

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 1-Click Fast Role Authentication
  const handleRoleQuickLogin = async (role: RoleType, label: string) => {
    try {
      setIsLoggingIn(true);
      showToast(`Authenticating into ${label}...`);
      await loginDemoUser(role);
      showToast(`Welcome! Logged into ${label} station.`);
    } catch (err: any) {
      showToast(err.message || 'Quick login failed, please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Direct Credential Submit
  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      showToast('Please enter your email and password.');
      return;
    }
    try {
      setIsLoggingIn(true);
      showToast('Verifying restaurant credentials...');
      await login(identifier, password, true);
      showToast('Login successful! Entering station workspace...');
    } catch (err: any) {
      showToast(err.message || 'Invalid credentials. You can also use 1-Click Test Drive above.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Phone OTP Submit
  const handlePhoneOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      setOtpSent(true);
      setOtpCode('123456');
      showToast(`Demo OTP code 123456 dispatched to ${phone}`);
      return;
    }
    try {
      setIsLoggingIn(true);
      await loginWithOTP(phone, otpCode || '123456');
      showToast('OTP verified! Entering station workspace...');
    } catch (err: any) {
      showToast(err.message || 'Invalid OTP code.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Register New Outlet Submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regRestaurantName || !regOwnerName || !regEmail || !regPassword) {
      showToast('Please fill in restaurant name, your name, email, and password.');
      return;
    }
    try {
      setIsLoggingIn(true);
      showToast(`Creating ${regRestaurantName} workspace & initial tables...`);
      await register({
        organizationName: `${regRestaurantName} Hospitality`,
        restaurantName: regRestaurantName,
        branchName: `${regRestaurantName} Flagship`,
        ownerName: regOwnerName,
        email: regEmail,
        password: regPassword,
        cuisineType: regCuisine,
        city: regCity,
      });
      showToast(`Welcome! ${regRestaurantName} is provisioned & ready.`);
    } catch (err: any) {
      showToast(err.message || 'Registration failed, please check inputs.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleFireKOT = () => {
    setKotDispatched(true);
    showToast('KOT #KOT-104 dispatched to Kitchen Station & Tandoor Station in real time!');
  };

  const handleSettleBill = () => {
    setBillSettled(true);
    showToast(`Bill #INV-891 of ₹${grandTotal} settled! Recipe BOM debited Chicken 560g, Butter 140g, Cream 120ml from Stock Ledger.`);
  };

  return (
    <div className="website-root min-h-screen bg-[#05111d] text-[#c2d5e3] selection:bg-teal-500/20 selection:text-teal-200 font-sans">
      {/* 1. Support Announcement Bar */}
      <div className="bg-gradient-to-r from-[#051a2f] via-[#0d2e50] to-[#051a2f] border-b border-[#143d63] py-2 px-4 text-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px] sm:text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-bold tracking-wide">
              RestaurantOS v4.8 Enterprise Release
            </span>
            <span className="text-[#8daec7] hidden md:inline">
              — Multi-Outlet Recipe BOM, Anti-Overstock AI & GST POS
            </span>
          </div>

          <div className="flex items-center gap-3 text-[#cbd5e1] flex-wrap">
            <span className="text-[#799ab2] hidden sm:inline">
              Support Desk:
            </span>
            <a
              href="tel:18002008899"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-[11px] no-underline transition-colors"
              title="Call Technical Support"
            >
              <Phone className="w-3 h-3 text-slate-950" />
              <span>Helpline: 1800-200-8899</span>
            </a>
            <a
              href="mailto:support@restaurantos.io?subject=RestaurantOS%20Support%20Inquiry"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded text-[11px] no-underline transition-colors"
            >
              <Mail className="w-3 h-3 text-slate-950" />
              <span>support@restaurantos.io</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Site Header */}
      <header className="sticky top-0 z-40 bg-[#05111d]/90 backdrop-blur-md border-b border-[#133350]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('top');
            }}
            className="flex items-center gap-2 font-black text-xl text-[#dbeaf5] tracking-tight hover:opacity-90 no-underline"
          >
            <span className="w-8 h-8 rounded-lg bg-teal-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-teal-500/20">
              🍽️
            </span>
            <span>RestaurantOS</span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-[#8daec7]">
            <a href="#login" onClick={(e) => { e.preventDefault(); scrollToSection('login'); }} className="text-teal-300 font-bold hover:text-teal-200 transition-colors">Sign In / Access</a>
            <a href="#recipe-bom" onClick={(e) => { e.preventDefault(); scrollToSection('recipe-bom'); }} className="hover:text-teal-300 transition-colors">Recipe BOM</a>
            <a href="#calculator" onClick={(e) => { e.preventDefault(); scrollToSection('calculator'); }} className="hover:text-teal-300 transition-colors">Food Cost Calculator</a>
            <a href="#multi-branch" onClick={(e) => { e.preventDefault(); scrollToSection('multi-branch'); }} className="hover:text-teal-300 transition-colors">Multi-Outlet</a>
            <a href="#demo" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }} className="hover:text-teal-300 transition-colors">Live POS Sandbox</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }} className="hover:text-teal-300 transition-colors">Pricing</a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }} className="hover:text-teal-300 transition-colors">FAQ</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollToSection('login')}
              className="px-3 py-1.5 border border-teal-400 text-teal-300 hover:bg-teal-400/10 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              Sign In 🔑
            </button>
            <button
              onClick={onOpenBookDemo}
              className="px-3.5 py-1.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md shadow-teal-500/20 cursor-pointer hidden sm:block"
            >
              Book Demo
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-1.5 text-[#799ab2] hover:text-white rounded-lg border border-[#163f68]"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {isMobileMenuOpen && (
          <div className="xl:hidden bg-[#071d31] border-b border-[#163f68] px-4 py-4 space-y-3 text-xs font-semibold">
            <a href="#login" onClick={(e) => { e.preventDefault(); scrollToSection('login'); }} className="block py-1 text-teal-300 hover:text-white">Sign In & Role Access</a>
            <a href="#recipe-bom" onClick={(e) => { e.preventDefault(); scrollToSection('recipe-bom'); }} className="block py-1 text-[#8daec7] hover:text-white">Recipe BOM Engine</a>
            <a href="#calculator" onClick={(e) => { e.preventDefault(); scrollToSection('calculator'); }} className="block py-1 text-[#8daec7] hover:text-white">Food Cost Calculator</a>
            <a href="#multi-branch" onClick={(e) => { e.preventDefault(); scrollToSection('multi-branch'); }} className="block py-1 text-[#8daec7] hover:text-white">Multi-Outlet Chains</a>
            <a href="#demo" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }} className="block py-1 text-[#8daec7] hover:text-white">Live POS Sandbox</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }} className="block py-1 text-[#8daec7] hover:text-white">Pricing</a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }} className="block py-1 text-[#8daec7] hover:text-white">FAQ</a>
            <div className="pt-2 border-t border-[#143758] flex gap-2">
              <button
                onClick={() => { setIsMobileMenuOpen(false); scrollToSection('login'); }}
                className="flex-1 py-2 bg-teal-400 text-slate-950 font-bold rounded-lg text-xs"
              >
                Sign In 🔑
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 3. Hero Section WITH MERGED LOGIN INLINE */}
      <section id="top" className="relative pt-10 sm:pt-16 pb-16 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-teal-500/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Hero Copy */}
            <div className="lg:col-span-6 space-y-6 pt-2">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
                <span className="w-5 h-[1px] bg-teal-400" />
                THE AI-FIRST MULTI-TENANT RESTAURANT OPERATING SYSTEM
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-[#dbeaf5] tracking-tight leading-[1.08]">
                Food margins don't protect themselves.
              </h1>

              <p className="text-base text-[#8daec7] leading-relaxed max-w-xl">
                RestaurantOS gives multi-outlet Indian restaurants an intelligent operating system combining Smart POS, real-time KOT, statutory stock ledger, true recipe BOM deduction, and waste-to-profit analytics.
              </p>

              {/* Value Highlights */}
              <div className="space-y-2.5 pt-2 text-xs text-[#c2d5e3]">
                <div className="flex items-center gap-2">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span><b>Automatic Recipe BOM Deduction:</b> Debits chicken, butter, and cream on every paid bill.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span><b>Anti-Overstock AI:</b> Specifically flags ingredients NOT to purchase to eliminate wilting waste.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span><b>Multi-Outlet RBAC:</b> Strict tenant isolation between Owner, Cashier, Kitchen, and Floor Waiters.</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4">
                <button
                  onClick={() => scrollToSection('login')}
                  className="px-6 py-3.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-black rounded-xl text-sm transition-all shadow-xl shadow-teal-500/25 cursor-pointer flex items-center gap-2"
                >
                  <span>Authenticate to Station</span>
                  <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded font-mono">🔑</span>
                </button>
                <button
                  onClick={() => scrollToSection('demo')}
                  className="px-5 py-3.5 bg-[#081f33] hover:bg-[#0e2e4c] border border-[#16426a] text-[#dbeaf5] font-bold rounded-xl text-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  Test Interactive POS Demo ↗
                </button>
              </div>

              {/* Trust markers */}
              <div className="pt-6 border-t border-[#123657] flex flex-wrap items-center gap-6 text-xs text-[#799ab2] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span>240+ Outlets Running</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span>India GST Compliant</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span>Zero Inventory Drift</span>
                </div>
              </div>
            </div>

            {/* Right Side: MERGED UNIFIED AUTHENTICATION CARD */}
            <div id="login" className="lg:col-span-6 scroll-mt-24">
              <div className="bg-[#071d31] border border-teal-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative space-y-4">
                {/* Header of merged login */}
                <div className="flex items-center justify-between pb-3 border-b border-[#14395b]">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-teal-400 text-slate-950 font-bold flex items-center justify-center text-xs">
                      🔐
                    </span>
                    <div>
                      <h3 className="font-extrabold text-white text-sm">Station Login & Test Drive</h3>
                      <span className="text-[10px] text-[#799ab2] font-mono">Select a clearance role or sign in</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded border border-teal-500/30 font-bold">
                    ONLINE KERNEL
                  </span>
                </div>

                {/* Login Method Segmented Control */}
                <div className="grid grid-cols-4 p-1 bg-[#051321] border border-[#153a5c] rounded-xl text-xs gap-1">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('ONE_CLICK')}
                    className={`py-1.5 px-1 font-bold rounded-lg transition-all cursor-pointer text-center truncate ${
                      loginMethod === 'ONE_CLICK'
                        ? 'bg-teal-400 text-slate-950 font-extrabold shadow-sm'
                        : 'text-[#8daec7] hover:text-white'
                    }`}
                  >
                    ⚡ Test Drive
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('CREDENTIALS')}
                    className={`py-1.5 px-1 font-bold rounded-lg transition-all cursor-pointer text-center truncate ${
                      loginMethod === 'CREDENTIALS'
                        ? 'bg-teal-400 text-slate-950 font-extrabold shadow-sm'
                        : 'text-[#8daec7] hover:text-white'
                    }`}
                  >
                    🔑 Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('PHONE_OTP')}
                    className={`py-1.5 px-1 font-bold rounded-lg transition-all cursor-pointer text-center truncate ${
                      loginMethod === 'PHONE_OTP'
                        ? 'bg-teal-400 text-slate-950 font-extrabold shadow-sm'
                        : 'text-[#8daec7] hover:text-white'
                    }`}
                  >
                    📱 Mobile OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('REGISTER')}
                    className={`py-1.5 px-1 font-bold rounded-lg transition-all cursor-pointer text-center truncate ${
                      loginMethod === 'REGISTER'
                        ? 'bg-teal-400 text-slate-950 font-extrabold shadow-sm'
                        : 'text-amber-400 hover:text-amber-300'
                    }`}
                  >
                    ✨ Register
                  </button>
                </div>

                {/* TAB A: 1-Click Fast Role Evaluator */}
                {loginMethod === 'ONE_CLICK' && (
                  <div className="space-y-2.5 pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#799ab2] font-bold block">
                      Choose Your Station to Launch:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Owner */}
                      <button
                        type="button"
                        onClick={() => handleRoleQuickLogin('OWNER', 'Executive Owner')}
                        disabled={isLoggingIn}
                        className="p-3 bg-[#081d30] hover:bg-[#0a253d] border border-amber-500/40 hover:border-amber-400 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">👑</span>
                          <div className="leading-tight">
                            <div className="font-bold text-white text-xs">Owner Suite</div>
                            <div className="text-[9px] text-amber-300/80 font-mono">Rajesh Mehra</div>
                          </div>
                        </div>
                        <span className="text-xs text-amber-400 group-hover:translate-x-0.5 transition-transform">→</span>
                      </button>

                      {/* Cashier */}
                      <button
                        type="button"
                        onClick={() => handleRoleQuickLogin('CASHIER', 'Cashier POS')}
                        disabled={isLoggingIn}
                        className="p-3 bg-[#081d30] hover:bg-[#0a253d] border border-teal-500/40 hover:border-teal-400 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">💳</span>
                          <div className="leading-tight">
                            <div className="font-bold text-white text-xs">Smart POS</div>
                            <div className="text-[9px] text-teal-300/80 font-mono">Priya Sharma</div>
                          </div>
                        </div>
                        <span className="text-xs text-teal-400 group-hover:translate-x-0.5 transition-transform">→</span>
                      </button>

                      {/* Kitchen Chef */}
                      <button
                        type="button"
                        onClick={() => handleRoleQuickLogin('KITCHEN', 'Head Chef KDS')}
                        disabled={isLoggingIn}
                        className="p-3 bg-[#081d30] hover:bg-[#0a253d] border border-rose-500/40 hover:border-rose-400 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🍳</span>
                          <div className="leading-tight">
                            <div className="font-bold text-white text-xs">Kitchen KDS</div>
                            <div className="text-[9px] text-rose-300/80 font-mono">Chef Vikram</div>
                          </div>
                        </div>
                        <span className="text-xs text-rose-400 group-hover:translate-x-0.5 transition-transform">→</span>
                      </button>

                      {/* Waiter Captain */}
                      <button
                        type="button"
                        onClick={() => handleRoleQuickLogin('WAITER', 'Floor Waiter')}
                        disabled={isLoggingIn}
                        className="p-3 bg-[#081d30] hover:bg-[#0a253d] border border-sky-500/40 hover:border-sky-400 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🍽️</span>
                          <div className="leading-tight">
                            <div className="font-bold text-white text-xs">Floor Tables</div>
                            <div className="text-[9px] text-sky-300/80 font-mono">Amit Kumar</div>
                          </div>
                        </div>
                        <span className="text-xs text-sky-400 group-hover:translate-x-0.5 transition-transform">→</span>
                      </button>

                      {/* Inventory Lead */}
                      <button
                        type="button"
                        onClick={() => handleRoleQuickLogin('INVENTORY_MANAGER', 'Inventory Manager')}
                        disabled={isLoggingIn}
                        className="p-3 bg-[#081d30] hover:bg-[#0a253d] border border-purple-500/40 hover:border-purple-400 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">📦</span>
                          <div className="leading-tight">
                            <div className="font-bold text-white text-xs">Stock Ledger</div>
                            <div className="text-[9px] text-purple-300/80 font-mono">Sunita Rao</div>
                          </div>
                        </div>
                        <span className="text-xs text-purple-400 group-hover:translate-x-0.5 transition-transform">→</span>
                      </button>

                      {/* Accountant CA */}
                      <button
                        type="button"
                        onClick={() => handleRoleQuickLogin('ACCOUNTANT', 'Tax Auditor CA')}
                        disabled={isLoggingIn}
                        className="p-3 bg-[#081d30] hover:bg-[#0a253d] border border-emerald-500/40 hover:border-emerald-400 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">📊</span>
                          <div className="leading-tight">
                            <div className="font-bold text-white text-xs">CA Auditor</div>
                            <div className="text-[9px] text-emerald-300/80 font-mono">Deepak Gupta</div>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-400 group-hover:translate-x-0.5 transition-transform">→</span>
                      </button>
                    </div>

                    <div className="p-2.5 bg-[#051423] border border-[#133758] rounded-xl text-[11px] text-[#799ab2] flex justify-between items-center">
                      <span>💡 1-click test enters with isolated demo data.</span>
                      <button
                        type="button"
                        onClick={() => setLoginMethod('REGISTER')}
                        className="text-teal-400 font-bold hover:underline cursor-pointer"
                      >
                        Register Brand →
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB B: Standard Credentials Form */}
                {loginMethod === 'CREDENTIALS' && (
                  <form onSubmit={handleCredentialLogin} className="space-y-3 pt-1 text-xs">
                    {/* Quick Demo Credentials Fill */}
                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#051423] border border-[#133758] rounded-xl text-[10px]">
                      <span className="text-[#799ab2] font-semibold">Demo Fill:</span>
                      <button
                        type="button"
                        onClick={() => { setIdentifier('owner@restaurantos.io'); setPassword('Owner@123'); }}
                        className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 font-bold cursor-pointer"
                      >
                        Owner
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIdentifier('cashier@restaurantos.io'); setPassword('Cashier@123'); }}
                        className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20 font-bold cursor-pointer"
                      >
                        Cashier
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIdentifier('chef@restaurantos.io'); setPassword('Kitchen@123'); }}
                        className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 font-bold cursor-pointer"
                      >
                        Chef
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIdentifier('waiter@restaurantos.io'); setPassword('Waiter@123'); }}
                        className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 font-bold cursor-pointer"
                      >
                        Waiter
                      </button>
                    </div>

                    <div>
                      <label className="block text-[#799ab2] font-semibold mb-1 text-[11px] uppercase tracking-wider">
                        Work Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#799ab2]" />
                        <input
                          type="email"
                          required
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="owner@restaurantos.io"
                          className="w-full pl-9 pr-3 py-2 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#799ab2] font-semibold mb-1 text-[11px] uppercase tracking-wider">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#799ab2]" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-9 py-2 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-[#799ab2] hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={onOpenForgotPassword}
                        className="text-teal-400 hover:text-teal-300 underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginMethod('REGISTER')}
                        className="text-[#8daec7] hover:text-white cursor-pointer"
                      >
                        New restaurant? Register →
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-2.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20"
                    >
                      {isLoggingIn ? 'Authenticating...' : 'Sign In to Station Workspace →'}
                    </button>
                  </form>
                )}

                {/* TAB C: Phone OTP Form */}
                {loginMethod === 'PHONE_OTP' && (
                  <form onSubmit={handlePhoneOTPLogin} className="space-y-3 pt-1 text-xs">
                    <div>
                      <label className="block text-[#799ab2] font-semibold mb-1 text-[11px] uppercase tracking-wider">
                        Registered Mobile Number
                      </label>
                      <div className="relative">
                        <Smartphone className="w-4 h-4 absolute left-3 top-2.5 text-[#799ab2]" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98100 11223"
                          className="w-full pl-9 pr-3 py-2 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 text-xs"
                        />
                      </div>
                    </div>

                    {otpSent && (
                      <div>
                        <label className="block text-[#799ab2] font-semibold mb-1 text-[11px] uppercase tracking-wider">
                          Enter 6-Digit OTP Code
                        </label>
                        <input
                          type="text"
                          required
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="123456"
                          maxLength={6}
                          className="w-full px-3 py-2 bg-[#051321] border border-[#173e63] rounded-lg text-white font-mono text-center tracking-widest text-sm focus:outline-none focus:border-teal-400"
                        />
                        <div className="text-[10px] text-teal-400 mt-1 font-mono">
                          ✓ Use demo verification code: 123456
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-2.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20"
                    >
                      {isLoggingIn
                        ? 'Verifying...'
                        : otpSent
                        ? 'Verify OTP & Enter Station →'
                        : 'Dispatch SMS OTP Code 📲'}
                    </button>
                  </form>
                )}

                {/* TAB D: INLINE REGISTER OUTLET ON THE FRONT WEB PAGE */}
                {loginMethod === 'REGISTER' && (
                  <form onSubmit={handleRegister} className="space-y-2.5 pt-1 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[#799ab2] font-semibold mb-1 text-[10px] uppercase tracking-wider">
                          Restaurant Brand *
                        </label>
                        <input
                          type="text"
                          required
                          value={regRestaurantName}
                          onChange={(e) => setRegRestaurantName(e.target.value)}
                          placeholder="e.g. Bukhara Darbar"
                          className="w-full px-2.5 py-1.5 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[#799ab2] font-semibold mb-1 text-[10px] uppercase tracking-wider">
                          Location / City *
                        </label>
                        <input
                          type="text"
                          required
                          value={regCity}
                          onChange={(e) => setRegCity(e.target.value)}
                          placeholder="Cyber Hub, Gurugram"
                          className="w-full px-2.5 py-1.5 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[#799ab2] font-semibold mb-1 text-[10px] uppercase tracking-wider">
                          Owner Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={regOwnerName}
                          onChange={(e) => setRegOwnerName(e.target.value)}
                          placeholder="e.g. Vikram Mehra"
                          className="w-full px-2.5 py-1.5 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[#799ab2] font-semibold mb-1 text-[10px] uppercase tracking-wider">
                          Cuisine Focus
                        </label>
                        <select
                          value={regCuisine}
                          onChange={(e) => setRegCuisine(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 bg-[#051321] border border-[#173e63] rounded-lg text-white focus:outline-none focus:border-teal-400 text-xs"
                        >
                          <option value="mughlai">Mughlai & Tandoor</option>
                          <option value="multicuisine">Multi-Cuisine Casual</option>
                          <option value="qsr">QSR & Fast Casual</option>
                          <option value="bar">Bar & Rooftop Lounge</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[#799ab2] font-semibold mb-1 text-[10px] uppercase tracking-wider">
                          Work Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="vikram@bukhara.in"
                          className="w-full px-2.5 py-1.5 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[#799ab2] font-semibold mb-1 text-[10px] uppercase tracking-wider">
                          Password *
                        </label>
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-2.5 py-1.5 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-[#799ab2]">Already registered?</span>
                      <button
                        type="button"
                        onClick={() => setLoginMethod('CREDENTIALS')}
                        className="text-teal-400 hover:text-teal-300 font-bold underline cursor-pointer"
                      >
                        Sign in to Station →
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-teal-400 hover:from-amber-300 hover:to-teal-300 text-slate-950 font-black rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/20"
                    >
                      {isLoggingIn ? 'Provisioning Restaurant...' : 'Create Outlet & Enter Station 🚀'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Recipe BOM Consumption Engine Section (#recipe-bom) */}
      <section id="recipe-bom" className="py-16 sm:py-24 border-t border-[#11314e] bg-[#051424]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
              CORE INNOVATION
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#dbeaf5] mt-2 tracking-tight">
              True Recipe BOM Consumption Engine
            </h2>
            <p className="text-sm text-[#8daec7] mt-3 leading-relaxed">
              Every dish sold at the POS automatically debits exact grammage from your statutory stock ledger in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#081d30] border border-[#153e63] rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-bold text-lg">
                1
              </div>
              <h4 className="font-extrabold text-white text-base">Automatic BOM Stock Debit</h4>
              <p className="text-xs text-[#8daec7] leading-relaxed">
                Selling a portion of Butter Chicken debits 280g chicken, 70g butter, and 60ml cream without requiring chefs to fill paper logs.
              </p>
            </div>

            <div className="p-6 bg-[#081d30] border border-[#153e63] rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 font-bold text-lg">
                2
              </div>
              <h4 className="font-extrabold text-white text-base">Recipe Drift Detection</h4>
              <p className="text-xs text-[#8daec7] leading-relaxed">
                Highlights variance between theoretical recipe standards and physical inventory consumption to catch portion creep and kitchen leakage immediately.
              </p>
            </div>

            <div className="p-6 bg-[#081d30] border border-[#153e63] rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-lg">
                3
              </div>
              <h4 className="font-extrabold text-white text-base">Anti-Overstock "Don't Buy" AI</h4>
              <p className="text-xs text-[#8daec7] leading-relaxed">
                Flags ingredients NOT to order when existing inventory covers forecasted dinner footfall, protecting operating cash flow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Food Cost & Profit Recovery Calculator (#calculator) */}
      <section id="calculator" className="py-16 sm:py-24 border-t border-[#11314e] bg-[#05111d]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
              PROFIT RECOVERY CALCULATOR
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#dbeaf5] mt-2 tracking-tight">
              Calculate Your Monthly Food Cost Savings
            </h2>
            <p className="text-sm text-[#8daec7] mt-3 leading-relaxed">
              In urban restaurants, unchecked portion drift and wilting inventory leak 3.5%–5% of top-line revenue. See how much RestaurantOS saves your outlet.
            </p>
          </div>

          <div className="max-w-3xl mx-auto p-6 sm:p-8 bg-[#081d30] border border-[#153e63] rounded-3xl shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Controls */}
              <div className="space-y-5 text-xs">
                <div>
                  <label className="block text-[#799ab2] font-mono font-bold uppercase mb-2">
                    DAILY GUEST COVERS
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[100, 250, 500, 750, 1000, 1500].map((covers) => (
                      <button
                        key={covers}
                        type="button"
                        onClick={() => setDailyCovers(covers)}
                        className={`py-2 px-2.5 rounded-xl border font-bold cursor-pointer transition-all ${
                          dailyCovers === covers
                            ? 'bg-teal-400 text-slate-950 border-teal-400 shadow-md shadow-teal-500/20'
                            : 'bg-[#051423] text-slate-300 border-[#153c5f] hover:border-teal-400/50'
                        }`}
                      >
                        {covers} Covers
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#799ab2] font-mono font-bold uppercase mb-1.5">
                      CUISINE PROFILE
                    </label>
                    <select
                      value={cuisineType}
                      onChange={(e) => setCuisineType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#051321] border border-[#173e63] rounded-xl text-white focus:outline-none focus:border-teal-400"
                    >
                      <option value="mughlai">North Indian / Tandoor (₹650 APC)</option>
                      <option value="multicuisine">Multi-Cuisine Casual (₹550 APC)</option>
                      <option value="qsr">QSR & Café (₹320 APC)</option>
                      <option value="bar">Restro-Bar & Brewery (₹950 APC)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#799ab2] font-mono font-bold uppercase mb-1.5">
                      LOCATION TIER
                    </label>
                    <select
                      value={cityTier}
                      onChange={(e) => setCityTier(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#051321] border border-[#173e63] rounded-xl text-white focus:outline-none focus:border-teal-400"
                    >
                      <option value="metro">Tier 1 Metro (Delhi, BLR, BOM)</option>
                      <option value="tier2">Tier 2 City (Lucknow, Pune, Jaipur)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-[#051423] rounded-xl border border-[#123657] text-[11px] text-[#799ab2] leading-relaxed">
                  💡 <b>Recipe Drift Protection:</b> By enforcing theoretical vs actual consumption reconciliations, kitchens eliminate portion creep and over-portioning leakages automatically.
                </div>
              </div>

              {/* Recommended Result Box */}
              <div className="p-6 bg-[#051423] border border-teal-500/40 rounded-2xl space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-teal-400 font-bold block">
                  ESTIMATED MONTHLY SAVINGS
                </span>
                <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight text-teal-300">
                  ₹{preventedLeakage.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-[#799ab2]">
                  Recovers directly to net EBITDA on ₹{(monthlyRevenue / 100000).toFixed(1)}L monthly billing.
                </div>

                {/* Breakdown */}
                <div className="space-y-2 pt-3 border-t border-[#133758] text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#8daec7]">🍗 Recipe Drift Prevented:</span>
                    <span className="text-white font-bold">₹{inventoryRecovery.toLocaleString('en-IN')}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8daec7]">🥗 Wilting Expiry Eliminated:</span>
                    <span className="text-white font-bold">₹{(preventedLeakage - inventoryRecovery).toLocaleString('en-IN')}/mo</span>
                  </div>
                  <div className="flex justify-between text-teal-300 font-bold">
                    <span>📈 Annual Margin Impact:</span>
                    <span>₹{(preventedLeakage * 12).toLocaleString('en-IN')} / year</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => scrollToSection('login')}
                  className="w-full py-3 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-teal-500/20"
                >
                  Enter Station Workspace 🔑 →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Live Interactive POS & KOT Sandbox Demo (#demo) */}
      <section id="demo" className="py-16 sm:py-24 border-t border-[#11314e] bg-[#051424]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
              HANDS-ON POS & KOT SIMULATOR
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#dbeaf5] mt-2 tracking-tight">
              Test the POS & Recipe BOM Engine Live
            </h2>
            <p className="text-sm text-[#8daec7] mt-3 leading-relaxed">
              Fire a live order below. Watch the GST split billing calculate, dispatch KOT to the kitchen station, and execute automatic ingredient debits from the inventory ledger.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-[#071d31] border border-[#16426a] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#14395b]">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-teal-400 text-slate-950 font-bold flex items-center justify-center text-sm">
                  💳
                </span>
                <div>
                  <h4 className="font-extrabold text-white text-sm">Table T-05 · Dine-in Order Register</h4>
                  <span className="text-[11px] text-[#799ab2] font-mono">Cyber Hub Gurgaon · GSTIN: 07AAAAA0000A1Z5</span>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 text-[11px] font-mono font-bold">
                  {kotDispatched ? '✓ KOT DISPATCHED' : 'READY TO FIRE'}
                </span>
                {billSettled && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold">
                    PAID & SETTLED
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order items list */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#799ab2] font-bold block">
                  CURRENT RUNNING TABLE ITEMS
                </span>
                <div className="space-y-2">
                  {sandboxItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#051423] border border-[#143758] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <div className="font-bold text-white">{item.name}</div>
                          <div className="text-[11px] text-[#799ab2]">₹{item.price} each</div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-teal-300">₹{item.price * item.qty}</div>
                        <div className="text-[10px] text-[#799ab2]">Qty: {item.qty}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Summary & Actions */}
              <div className="p-5 bg-[#051423] border border-[#143758] rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-[#8daec7]">
                    <span>Items Subtotal:</span>
                    <span className="text-white font-bold">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#8daec7]">
                    <span>CGST (2.5%):</span>
                    <span className="text-white font-bold">₹{cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#8daec7]">
                    <span>SGST (2.5%):</span>
                    <span className="text-white font-bold">₹{sgst.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#133758] flex justify-between text-base font-extrabold text-teal-300">
                    <span>Grand Total:</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {!kotDispatched ? (
                    <button
                      type="button"
                      onClick={handleFireKOT}
                      className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md"
                    >
                      Fire KOT to Kitchen Station 🔥
                    </button>
                  ) : !billSettled ? (
                    <button
                      type="button"
                      onClick={handleSettleBill}
                      className="w-full py-3 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-teal-500/20"
                    >
                      Complete Payment & Debit Recipe BOM 🧾
                    </button>
                  ) : (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs text-emerald-300 font-bold">
                      ✓ Bill settled & recipe ingredients automatically deducted from stock ledger!
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => scrollToSection('login')}
                    className="w-full py-2 bg-[#092238] hover:bg-[#0f3456] border border-teal-500/30 text-teal-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Open Full Smart POS Station 💳 →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Multi-Branch Architecture Showcase (#multi-branch) */}
      <section id="multi-branch" className="py-16 sm:py-24 border-t border-[#11314e] bg-[#05111d]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
              ENTERPRISE BRANCH ISOLATION
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#dbeaf5] mt-2 tracking-tight">
              One central brand. Isolated branch operations.
            </h2>
            <p className="text-sm text-[#8daec7] mt-3 leading-relaxed">
              Seamlessly switch between outlets with strict multi-tenant isolation for tables, inventory, local cashiers, and consolidated executive rollups.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#081d30] border border-teal-500/40 rounded-2xl space-y-3 shadow-xl">
              <div className="flex justify-between items-start">
                <span className="text-2xl">🏢</span>
                <span className="text-[10px] font-mono bg-teal-400/20 text-teal-300 px-2 py-0.5 rounded font-bold">
                  FLAGSHIP
                </span>
              </div>
              <h3 className="font-extrabold text-white text-base">Cyber Hub, Gurgaon</h3>
              <p className="text-xs text-[#8daec7]">
                Fine dining & active bar operations. 42 tables, 140 seats, 4 KDS prep stations.
              </p>
              <div className="text-xs font-mono text-[#799ab2] space-y-1 pt-2 border-t border-[#133758]">
                <div>Daily Revenue: <b className="text-white">₹1,48,200</b></div>
                <div>Live Occupancy: <b className="text-teal-300">82% (34 Tables)</b></div>
              </div>
            </div>

            <div className="p-6 bg-[#081d30] border border-[#153e63] rounded-2xl space-y-3 shadow-xl">
              <div className="flex justify-between items-start">
                <span className="text-2xl">🏛️</span>
                <span className="text-[10px] font-mono bg-sky-400/20 text-sky-300 px-2 py-0.5 rounded font-bold">
                  ACTIVE
                </span>
              </div>
              <h3 className="font-extrabold text-white text-base">Connaught Place, Delhi</h3>
              <p className="text-xs text-[#8daec7]">
                Heritage family dining. 28 tables, 110 seats, high weekend dinner footfall.
              </p>
              <div className="text-xs font-mono text-[#799ab2] space-y-1 pt-2 border-t border-[#133758]">
                <div>Daily Revenue: <b className="text-white">₹1,12,400</b></div>
                <div>Live Occupancy: <b className="text-teal-300">71% (20 Tables)</b></div>
              </div>
            </div>

            <div className="p-6 bg-[#081d30] border border-[#153e63] rounded-2xl space-y-3 shadow-xl">
              <div className="flex justify-between items-start">
                <span className="text-2xl">🌿</span>
                <span className="text-[10px] font-mono bg-purple-400/20 text-purple-300 px-2 py-0.5 rounded font-bold">
                  EXPANSION
                </span>
              </div>
              <h3 className="font-extrabold text-white text-base">Indiranagar, Bengaluru</h3>
              <p className="text-xs text-[#8daec7]">
                Modern bistro & rooftop lounge. 35 tables, cocktail bar, high UPI split volume.
              </p>
              <div className="text-xs font-mono text-[#799ab2] space-y-1 pt-2 border-t border-[#133758]">
                <div>Daily Revenue: <b className="text-white">₹98,600</b></div>
                <div>Live Occupancy: <b className="text-teal-300">65% (23 Tables)</b></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Transparent Pricing (#pricing) */}
      <section id="pricing" className="py-16 sm:py-24 border-t border-[#11314e] bg-[#051424]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
              TRANSPARENT RESTAURANT PRICING
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#dbeaf5] mt-2 tracking-tight">
              Predictable plans with zero hidden fees.
            </h2>
            <p className="text-sm text-[#8daec7] mt-3 leading-relaxed">
              Every plan includes unlimited KDS kitchen displays, table billing registers, recipe BOM tracking, and automated India GST filings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Plan 1 */}
            <div className="p-7 bg-[#081d30] border border-[#153e63] rounded-3xl flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-xl font-extrabold text-white">Single Outlet</h3>
                <p className="text-xs text-[#799ab2] mt-1">Perfect for standalone cafés, bistros, and cloud kitchens.</p>
                <div className="text-3xl font-black text-white font-mono mt-4">
                  ₹1,499 <span className="text-xs text-[#799ab2] font-normal">/ month billed annually</span>
                </div>

                <ul className="space-y-2.5 mt-6 text-xs text-[#c2d5e3]">
                  <li className="flex items-center gap-2"><span className="text-teal-400 font-bold">✓</span> 1 Branch POS + KOT System</li>
                  <li className="flex items-center gap-2"><span className="text-teal-400 font-bold">✓</span> 3 Kitchen KDS Displays</li>
                  <li className="flex items-center gap-2"><span className="text-teal-400 font-bold">✓</span> Real-Time Recipe BOM Deduction</li>
                  <li className="flex items-center gap-2"><span className="text-teal-400 font-bold">✓</span> Thermal 80mm Bill Printing</li>
                  <li className="flex items-center gap-2"><span className="text-teal-400 font-bold">✓</span> India GST CGST + SGST Billing</li>
                </ul>
              </div>

              <button
                onClick={onOpenBookDemo}
                className="w-full py-3 bg-[#0a2742] hover:bg-[#0f3456] border border-teal-500/30 text-teal-300 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Start 14-Day Free Trial
              </button>
            </div>

            {/* Plan 2: Featured */}
            <div className="p-7 bg-[#081d30] border border-teal-400 rounded-3xl relative flex flex-col justify-between space-y-6 shadow-2xl shadow-teal-500/15">
              <span className="absolute -top-3 right-6 px-3 py-1 bg-teal-400 text-slate-950 font-mono font-black text-[10px] rounded-full uppercase tracking-wider">
                MOST POPULAR · MULTI-OUTLET
              </span>

              <div>
                <h3 className="text-xl font-extrabold text-white">Multi-Outlet Pro</h3>
                <p className="text-xs text-[#799ab2] mt-1">For growing chains with 2 to 5 branches and central inventory.</p>
                <div className="text-3xl font-black text-white font-mono mt-4">
                  ₹3,499 <span className="text-xs text-[#799ab2] font-normal">/ month for 3 branches</span>
                </div>

                <ul className="space-y-2.5 mt-6 text-xs text-[#c2d5e3]">
                  <li className="flex items-center gap-2"><span className="text-teal-400 font-bold">✓</span> Up to 5 Isolated Outlets</li>
                  <li className="flex items-center gap-2"><span className="text-teal-400 font-bold">✓</span> Central Warehouse & Transfer POs</li>
                  <li className="flex items-center gap-2"><span className="text-teal-400 font-bold">✓</span> Anti-Overstock "Don't Buy" AI</li>
                  <li className="flex items-center gap-2"><span className="text-teal-400 font-bold">✓</span> Grounded Restaurant AI Copilot</li>
                  <li className="flex items-center gap-2"><span className="text-teal-400 font-bold">✓</span> Dynamic UPI QR & Split Tender</li>
                  <li className="flex items-center gap-2"><span className="text-teal-400 font-bold">✓</span> Dedicated WhatsApp Support Channel</li>
                </ul>
              </div>

              <button
                onClick={onOpenBookDemo}
                className="w-full py-3 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer transition-all shadow-lg shadow-teal-500/20"
              >
                Deploy Multi-Outlet Pro
              </button>
            </div>

            {/* Plan 3 */}
            <div className="p-7 bg-[#081d30] border border-[#153e63] rounded-3xl flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-xl font-extrabold text-white">Enterprise Chain</h3>
                <p className="text-xs text-[#799ab2] mt-1">For national restaurant franchises with 6+ locations.</p>
                <div className="text-3xl font-black text-white font-mono mt-4">
                  Custom <span className="text-xs text-[#799ab2] font-normal">/ volume pricing</span>
                </div>

                <ul className="space-y-2.5 mt-6 text-xs text-[#c2d5e3]">
                  <li className="flex items-center gap-2"><span className="text-teal-400 font-bold">✓</span> Unlimited Outlets & Registers</li>
                  <li className="flex items-center gap-2"><span className="text-teal-400 font-bold">✓</span> Custom ERP / SAP Inventory Sync</li>
                  <li className="flex items-center gap-2"><span className="text-teal-400 font-bold">✓</span> Dedicated On-Site Training</li>
                  <li className="flex items-center gap-2"><span className="text-teal-400 font-bold">✓</span> Custom Recipe Drift Alerts</li>
                  <li className="flex items-center gap-2"><span className="text-teal-400 font-bold">✓</span> 99.99% Uptime SLA Agreement</li>
                </ul>
              </div>

              <button
                onClick={onOpenBookDemo}
                className="w-full py-3 bg-[#0a2742] hover:bg-[#0f3456] border border-teal-500/30 text-teal-300 font-bold rounded-xl text-xs cursor-pointer transition-colors text-center"
              >
                Speak with Enterprise Architect
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Frequently Asked Questions (#faq) */}
      <section id="faq" className="py-16 sm:py-24 border-t border-[#11314e] bg-[#05111d]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#dbeaf5] mt-2 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#8daec7] mt-3 leading-relaxed">
              Everything restaurateurs ask about GST compliance, recipe deduction, offline reliability, and hardware compatibility.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'How does the True Recipe BOM Consumption Engine work?',
                a: 'Whenever a dish is billed at the POS (e.g. Purani Dilli Butter Chicken), the engine automatically checks the dish’s recipe bill of materials and deducts the exact raw ingredients (Chicken 280g, Amul Butter 70g, Cream 60ml, Tomato Gravy 250g) from your statutory stock ledger in real time.',
              },
              {
                q: 'What is Recipe Drift Detection?',
                a: 'Recipe Drift compares your theoretical recipe consumption against actual physical kitchen inventory audits. If your kitchen consumed 18kg of Chicken Breast instead of the theoretical 14.4kg billed at POS, the system highlights the 25% portion variance and calculates the exact rupee leakage.',
              },
              {
                q: 'Does RestaurantOS support India GST and split payments?',
                a: 'Yes! Full CGST 2.5% and SGST 2.5% (or 18% for liquor/AC lounges), customizable service charges, SAC codes, and dynamic UPI QR codes. Bills can be split across multiple payment tenders (Cash, Card, UPI).',
              },
              {
                q: 'What happens if our restaurant internet connection drops during peak dinner rush?',
                a: 'RestaurantOS uses resilient local cache kernel storage. Orders and KOTs continue firing to kitchen printers over local Wi-Fi/Ethernet LAN. Once internet connectivity is restored, all transactions sync automatically to the cloud ledger.',
              },
              {
                q: 'Can managers or waiters view the Owner Executive Overview?',
                a: 'No. RestaurantOS enforces strict Role-Based Access Control (RBAC). The Executive Overview and financial P&L tabs are strictly locked to the OWNER clearance level. Cashiers, waiters, chefs, and inventory managers are routed strictly to their operational stations.',
              },
              {
                q: 'How do I test drive the system right now?',
                a: 'Use the 1-Click Role Access buttons right at the top of this page! You can select any role (Owner, Cashier POS, Kitchen Chef, Floor Waiter, Inventory Manager, CA Accountant) to experience the full operational system immediately.',
              },
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#081d30] border border-[#143a5d] rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left font-bold text-sm text-[#dbeaf5] flex items-center justify-between gap-4 cursor-pointer hover:text-teal-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-teal-400 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-[#8daec7] leading-relaxed border-t border-white/5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. Final Call to Action */}
      <section className="py-16 sm:py-20 border-t border-[#11314e] bg-gradient-to-b from-[#051424] to-[#040e18] text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-5">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
            START MODERNIZING YOUR OUTLET
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#dbeaf5] tracking-tight">
            Ready to stop food waste and reclaim your margins?
          </h2>
          <p className="text-sm text-[#8daec7] leading-relaxed max-w-xl mx-auto">
            Test any station in 10 seconds or schedule a personalized walkthrough with our engineering team.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => scrollToSection('login')}
              className="px-6 py-3.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-black rounded-xl text-sm transition-all shadow-xl shadow-teal-500/25 cursor-pointer"
            >
              Sign In & Station Access ⚡
            </button>
            <button
              onClick={onOpenBookDemo}
              className="px-5 py-3.5 bg-[#081f33] hover:bg-[#0e2e4c] border border-[#16426a] text-[#dbeaf5] font-bold rounded-xl text-sm transition-all cursor-pointer"
            >
              Book Chain Demo ↗
            </button>
          </div>
        </div>
      </section>

      {/* 11. Comprehensive Corporate Footer */}
      <footer className="border-t border-[#11314e] bg-[#030c14] py-12 text-xs text-[#799ab2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#143758]">
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-black text-lg text-white">
                <span className="w-7 h-7 rounded-lg bg-teal-400 text-slate-950 font-black flex items-center justify-center text-xs">
                  🍽️
                </span>
                <span>RestaurantOS</span>
              </div>
              <p className="text-[11px] text-[#8daec7] leading-relaxed">
                The multi-tenant AI operating system powering modern Indian restaurant chains with POS, KOT, Recipe BOM, and waste intelligence.
              </p>
              <div className="text-[10px] text-[#63849c] font-mono">
                NCR & Bengaluru, India
              </div>
            </div>

            <div className="space-y-2">
              <b className="text-white text-xs uppercase tracking-wider block mb-1">Modules</b>
              <div><a href="#recipe-bom" onClick={(e) => { e.preventDefault(); scrollToSection('recipe-bom'); }} className="hover:text-white">Recipe BOM Engine</a></div>
              <div><a href="#calculator" onClick={(e) => { e.preventDefault(); scrollToSection('calculator'); }} className="hover:text-white">Food Cost Calculator</a></div>
              <div><a href="#multi-branch" onClick={(e) => { e.preventDefault(); scrollToSection('multi-branch'); }} className="hover:text-white">Multi-Branch Architecture</a></div>
              <div><a href="#demo" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }} className="hover:text-white">Live POS Simulator</a></div>
            </div>

            <div className="space-y-2">
              <b className="text-white text-xs uppercase tracking-wider block mb-1">Clearance Roles</b>
              <div><button onClick={() => scrollToSection('login')} className="hover:text-teal-300 bg-transparent border-0 p-0 text-inherit font-inherit cursor-pointer text-left">👑 Owner Executive Suite</button></div>
              <div><button onClick={() => scrollToSection('login')} className="hover:text-teal-300 bg-transparent border-0 p-0 text-inherit font-inherit cursor-pointer text-left">💳 Smart POS Billing</button></div>
              <div><button onClick={() => scrollToSection('login')} className="hover:text-teal-300 bg-transparent border-0 p-0 text-inherit font-inherit cursor-pointer text-left">🍳 Kitchen KDS Station</button></div>
              <div><button onClick={() => scrollToSection('login')} className="hover:text-teal-300 bg-transparent border-0 p-0 text-inherit font-inherit cursor-pointer text-left">📦 Stock Ledger & POs</button></div>
            </div>

            <div className="space-y-2 text-[11px]">
              <b className="text-white text-xs uppercase tracking-wider block mb-1">Customer Support</b>
              <div>
                📞 Technical Helpline:{' '}
                <a href="tel:18002008899" className="text-teal-300 font-bold hover:underline">
                  1800-200-8899
                </a>
              </div>
              <div>
                ✉️ Support Desk:{' '}
                <a href="mailto:support@restaurantos.io" className="text-sky-300 hover:underline">
                  support@restaurantos.io
                </a>
              </div>
              <div className="text-[10px] text-[#63849c]">
                Support: 7 Days / Week (8:00 AM – 11:30 PM IST)
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-between gap-4 text-[11px]">
            <div>
              © 2026 RestaurantOS Technologies Private Limited. All rights reserved.
            </div>
            <div>
              Full GST compliance, automated thermal KOT routing, and localized LAN offline resilience.
            </div>
          </div>
        </div>
      </footer>

      {/* Floating "Ask RestaurantOS AI" Button */}
      <button
        onClick={onOpenAICopilot}
        className="fixed bottom-5 right-5 z-40 px-4 py-2.5 bg-gradient-to-r from-teal-400 to-sky-400 text-slate-950 font-black rounded-full shadow-2xl flex items-center gap-2 cursor-pointer hover:scale-105 transition-all"
        title="Ask RestaurantOS AI Copilot"
      >
        <Sparkles className="w-4 h-4 fill-slate-950" />
        <span className="text-xs">Ask RestaurantOS AI</span>
      </button>
    </div>
  );
};
