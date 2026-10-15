import React, { useState } from 'react';
import {
  Phone,
  Mail,
  Sparkles,
  ArrowRight,
  Shield,
  Smartphone,
  Check,
  CheckCircle2,
  Copy,
  ChevronDown,
  CreditCard,
  Users,
  Compass,
  Star,
  ExternalLink,
} from 'lucide-react';
import {
  allowanceBenchmarks,
  storyTestimonials,
  faqList,
  pricingPlans,
} from '../../data/pocketFundSeed.ts';
import { ChildProfile } from '../../types/pocketFund.ts';
import { InteractiveSandbox } from '../demo/InteractiveSandbox.tsx';

interface PocketFundLandingProps {
  childrenList: ChildProfile[];
  onOpenPilot: () => void;
  onOpenLogin: (role: 'parent' | 'student') => void;
  onOpenAIAdvisor: () => void;
  showToast: (msg: string) => void;
}

export const PocketFundLanding: React.FC<PocketFundLandingProps> = ({
  childrenList,
  onOpenPilot,
  onOpenLogin,
  onOpenAIAdvisor,
  showToast,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Calculator State
  const [calcAge, setCalcAge] = useState<number>(14);
  const [cityTier, setCityTier] = useState<'metro' | 'tier2'>('metro');
  const [commuteMode, setCommuteMode] = useState<'metro_bus' | 'school_bus' | 'walk'>('metro_bus');

  // Multi-child preview state
  const [activeChildPreview, setActiveChildPreview] = useState<string>('child-1');

  // Calculator calculation
  const benchmark = allowanceBenchmarks[calcAge] || allowanceBenchmarks[14];
  let totalAllowance = cityTier === 'metro' ? benchmark.metroAmount : benchmark.tier2Amount;
  if (commuteMode === 'metro_bus') totalAllowance += 200;
  if (commuteMode === 'walk') totalAllowance -= 150;

  const foodAmt = Math.round((totalAllowance * benchmark.foodShare) / 100);
  const transitAmt = Math.round((totalAllowance * benchmark.transitShare) / 100);
  const booksAmt = Math.round((totalAllowance * benchmark.booksShare) / 100);
  const savingsAmt = totalAllowance - foodAmt - transitAmt - booksAmt;

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  return (
    <div className="website-root min-h-screen bg-[#05111d] text-[#c2d5e3] selection:bg-teal-500/20 selection:text-teal-200">
      {/* 1. Support Announcement Bar */}
      <div className="support-announcement-bar bg-gradient-to-r from-[#051a2f] via-[#0d2e50] to-[#051a2f] border-b border-[#143d63] py-2 px-4 text-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px] sm:text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-bold tracking-wide">
              Family Pilot Batch Open
            </span>
            <span className="text-[#8daec7] hidden md:inline">
              — Zero subscription fees for early onboarding families
            </span>
          </div>

          <div className="flex items-center gap-3 text-[#cbd5e1] flex-wrap">
            <span className="text-[#799ab2] hidden sm:inline">
              Customer Support:
            </span>
            <a
              href="mailto:support@pocketfund.in?subject=Pocket%20Fund%20Support%20Inquiry"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded text-[11px] no-underline transition-colors"
            >
              <Mail className="w-3 h-3 text-slate-950" />
              <span>Email Support</span>
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
              ₹
            </span>
            <span>Pocket Fund</span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-[#8daec7]">
            <a href="#how" onClick={(e) => { e.preventDefault(); scrollToSection('how'); }} className="hover:text-teal-300 transition-colors">Method</a>
            <a href="#multi-child" onClick={(e) => { e.preventDefault(); scrollToSection('multi-child'); }} className="hover:text-teal-300 transition-colors">Multi-Child</a>
            <a href="#calculator" onClick={(e) => { e.preventDefault(); scrollToSection('calculator'); }} className="hover:text-teal-300 transition-colors">Allowance Calculator</a>
            <a href="#platforms" onClick={(e) => { e.preventDefault(); scrollToSection('platforms'); }} className="hover:text-teal-300 transition-colors">Platforms</a>
            <a href="#safety" onClick={(e) => { e.preventDefault(); scrollToSection('safety'); }} className="hover:text-teal-300 transition-colors">Safety</a>
            <a href="#demo" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }} className="hover:text-teal-300 transition-colors">Live Sandbox</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }} className="hover:text-teal-300 transition-colors">Pricing</a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }} className="hover:text-teal-300 transition-colors">FAQ</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenLogin('parent')}
              className="px-3 py-1.5 border border-teal-400 text-teal-300 hover:bg-teal-400/10 rounded-xl text-xs font-bold transition-all cursor-pointer hidden sm:flex items-center gap-1"
            >
              Parent Sign In 👩
            </button>
            <button
              onClick={() => onOpenLogin('student')}
              className="px-3 py-1.5 border border-sky-400 text-sky-300 hover:bg-sky-400/10 rounded-xl text-xs font-bold transition-all cursor-pointer hidden sm:flex items-center gap-1"
            >
              Student Sign In 🧑
            </button>
            <button
              onClick={onOpenPilot}
              className="px-3.5 py-1.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md shadow-teal-500/20 cursor-pointer"
            >
              Join Pilot
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
            <a href="#how" onClick={(e) => { e.preventDefault(); scrollToSection('how'); }} className="block py-1 text-[#8daec7] hover:text-white">Method</a>
            <a href="#multi-child" onClick={(e) => { e.preventDefault(); scrollToSection('multi-child'); }} className="block py-1 text-[#8daec7] hover:text-white">Multi-Child Console</a>
            <a href="#calculator" onClick={(e) => { e.preventDefault(); scrollToSection('calculator'); }} className="block py-1 text-[#8daec7] hover:text-white">Allowance Calculator</a>
            <a href="#platforms" onClick={(e) => { e.preventDefault(); scrollToSection('platforms'); }} className="block py-1 text-[#8daec7] hover:text-white">Platforms</a>
            <a href="#safety" onClick={(e) => { e.preventDefault(); scrollToSection('safety'); }} className="block py-1 text-[#8daec7] hover:text-white">Safety & Guardrails</a>
            <a href="#demo" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }} className="block py-1 text-teal-300 hover:text-white">Live Interactive Demo</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }} className="block py-1 text-[#8daec7] hover:text-white">Pricing</a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }} className="block py-1 text-[#8daec7] hover:text-white">FAQ</a>
            <div className="pt-2 border-t border-[#143758] flex gap-2">
              <button
                onClick={() => { setIsMobileMenuOpen(false); onOpenLogin('parent'); }}
                className="flex-1 py-2 border border-teal-400 text-teal-300 rounded-lg text-xs font-bold"
              >
                Parent Sign In 👩
              </button>
              <button
                onClick={() => { setIsMobileMenuOpen(false); onOpenLogin('student'); }}
                className="flex-1 py-2 border border-sky-400 text-sky-300 rounded-lg text-xs font-bold"
              >
                Student Sign In 🧑
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 3. Hero Section */}
      <section id="top" className="relative pt-12 sm:pt-20 pb-16 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Hero Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
                <span className="w-5 h-[1px] bg-teal-400" />
                THE PARENT-GUIDED ALLOWANCE PLATFORM
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#dbeaf5] tracking-tight leading-[1.08]">
                Money skills don't start at eighteen.
              </h1>

              <p className="text-base sm:text-lg text-[#8daec7] leading-relaxed max-w-xl">
                Pocket Fund gives Indian parents a stress-free system to automate teen allowances, instill mindful spending, and replace chaos with real financial habits.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={onOpenPilot}
                  className="px-6 py-3.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-black rounded-xl text-sm transition-all shadow-xl shadow-teal-500/25 cursor-pointer"
                >
                  Join the Family Pilot
                </button>
                <button
                  onClick={() => scrollToSection('demo')}
                  className="px-5 py-3.5 bg-[#081f33] hover:bg-[#0e2e4c] border border-[#16426a] text-[#dbeaf5] font-bold rounded-xl text-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  Test Interactive Demo ↗
                </button>
              </div>

              {/* Trust markers */}
              <div className="pt-6 border-t border-[#123657] flex flex-wrap items-center gap-6 text-xs text-[#799ab2] font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span>4,200+ Families Waitlisted</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span>RBI PPI Partner Rails</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span>Zero Overdraft Risk</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual: Animated Interactive Financial Orbit & Card Visual */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md p-6 bg-[#071f35]/80 border border-[#16426a] rounded-3xl shadow-2xl backdrop-blur-xl">
                {/* Simulated Parent & Teen Card Loop */}
                <div className="space-y-4">
                  {/* Parent mini card */}
                  <div className="p-4 bg-[#0a2742] border border-teal-500/40 rounded-2xl shadow-lg relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">👩</span>
                        <div>
                          <div className="text-xs font-bold text-white">Parent Auto-Allowance</div>
                          <div className="text-[10px] text-[#799ab2] font-mono">Priya Sharma</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-400 text-slate-950 font-black">
                        1ST OF MONTH
                      </span>
                    </div>
                    <div className="text-xl font-extrabold text-teal-300 font-mono">
                      ₹2,000 / month
                    </div>
                    <div className="text-[10px] text-[#799ab2] mt-1 flex items-center gap-1">
                      <span>✓ Dispatched to Aarav & Ananya</span>
                    </div>
                  </div>

                  {/* Flow Arrow */}
                  <div className="flex justify-center -my-1 text-teal-400 font-bold text-sm">
                    ↓ Real-Time Category Guardrails
                  </div>

                  {/* Teen mini card */}
                  <div className="p-4 bg-[#081d30] border border-sky-500/40 rounded-2xl shadow-lg relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🧑</span>
                        <div>
                          <div className="text-xs font-bold text-white">Aarav's Student Wallet</div>
                          <div className="text-[10px] text-sky-400 font-mono">Class XI · Age 16</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                        AVAILABLE: ₹880
                      </span>
                    </div>

                    <div className="space-y-1.5 mt-3 text-[11px]">
                      <div className="flex justify-between text-[#8daec7]">
                        <span>🎧 Headphones Goal</span>
                        <span className="text-teal-300 font-mono font-bold">₹1,050 / ₹1,500 (70%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#05121e] rounded-full overflow-hidden">
                        <div className="h-full bg-teal-400 w-[70%]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#133758] flex justify-between items-center text-[11px] text-[#799ab2]">
                  <span>🔒 MCC Gambling/Adult Blocked</span>
                  <button
                    onClick={() => onOpenLogin('parent')}
                    className="text-teal-400 font-bold hover:underline cursor-pointer"
                  >
                    Launch Live Console →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Method / How It Works (#how) */}
      <section id="how" className="py-16 sm:py-24 border-t border-[#11314e] bg-[#051424]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
              THE POCKET FUND METHOD
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#dbeaf5] mt-2 tracking-tight">
              Replaces WhatsApp friction with a calm money routine.
            </h2>
            <p className="text-sm text-[#8daec7] mt-3 leading-relaxed">
              Before Pocket Fund, teens ping parents for random ₹200 transfers. With Pocket Fund, children learn budget pacing, goal allocation, and mindful choices.
            </p>
          </div>

          {/* Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {/* The Old Way */}
            <div className="p-6 bg-[#0a1624] border border-[#1b354e] rounded-2xl space-y-3">
              <span className="text-[11px] font-mono text-rose-400 font-bold uppercase tracking-wider block">
                ❌ The Old Way: WhatsApp & Random UPI
              </span>
              <h3 className="text-lg font-bold text-white">Constant Micro-Friction</h3>
              <ul className="space-y-2 text-xs text-[#8daec7]">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Random ₹150–₹300 pings throughout the week for food, cabs, and snacks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Zero visibility into where the money actually goes or how much was transferred.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Teens never learn to pace a finite budget before turning eighteen.</span>
                </li>
              </ul>
            </div>

            {/* The Pocket Fund Way */}
            <div className="p-6 bg-[#07243d] border border-teal-500/40 rounded-2xl space-y-3 shadow-xl">
              <span className="text-[11px] font-mono text-teal-300 font-bold uppercase tracking-wider block">
                ✓ The Pocket Fund System
              </span>
              <h3 className="text-lg font-bold text-white">Predictable Budgeting & Lifelong Habits</h3>
              <ul className="space-y-2 text-xs text-[#8daec7]">
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span>Automated 1st-of-month allowance with clear Food & Transit category caps.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span>1-tap UPI approval workflow for legitimate school and project requests.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span>Milestone savings goals & chore earnings that build real pride of ownership.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 3 Core Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#081d30] border border-[#153e63] rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-bold text-lg">
                1
              </div>
              <h4 className="font-extrabold text-white text-base">Monthly Automated Routine</h4>
              <p className="text-xs text-[#8daec7] leading-relaxed">
                Parents configure a set monthly allowance transferred automatically on the 1st. Teenagers learn to pace their metro and snack expenses across 30 days.
              </p>
            </div>

            <div className="p-6 bg-[#081d30] border border-[#153e63] rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 font-bold text-lg">
                2
              </div>
              <h4 className="font-extrabold text-white text-base">Category Guardrails & MCC</h4>
              <p className="text-xs text-[#8daec7] leading-relaxed">
                Independent food, transit, and stationery caps prevent binge spending. High-risk merchant codes (gambling, adult, liquor) are permanently blocked at the network level.
              </p>
            </div>

            <div className="p-6 bg-[#081d30] border border-[#153e63] rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-lg">
                3
              </div>
              <h4 className="font-extrabold text-white text-base">Milestone Savings & Rewards</h4>
              <p className="text-xs text-[#8daec7] leading-relaxed">
                Visual savings progress bars motivate teens to set aside surplus money. Parents can match milestones or reward completed academic chores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Multi-Child Console Showcase (#multi-child) */}
      <section id="multi-child" className="py-16 sm:py-24 border-t border-[#11314e] bg-[#05111d]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
              MULTI-CHILD ARCHITECTURE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#dbeaf5] mt-2 tracking-tight">
              One parent console. Custom rules for every child.
            </h2>
            <p className="text-sm text-[#8daec7] mt-3 leading-relaxed">
              Every child has different maturity and transit needs. Manage multiple children with independent allowances, separate category caps, and individual companion logins.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {childrenList.map((child) => (
              <div
                key={child.id}
                onClick={() => setActiveChildPreview(child.id)}
                className={`p-6 bg-[#081d30] border rounded-2xl transition-all cursor-pointer space-y-4 ${
                  activeChildPreview === child.id
                    ? 'border-teal-400 shadow-xl shadow-teal-500/10 bg-[#09233a]'
                    : 'border-[#153c5f] hover:border-[#1d5282]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{child.avatar}</span>
                    <div>
                      <h3 className="font-extrabold text-white text-base">{child.name}</h3>
                      <span className="text-xs text-[#799ab2] font-mono">
                        {child.grade} · Age {child.age}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded border border-teal-500/30">
                    ₹{child.allowance}/mo
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-[#8daec7]">
                    <span>🍔 Food Limit:</span>
                    <span className="text-white font-mono font-bold">₹{child.foodLimit}</span>
                  </div>
                  <div className="flex justify-between text-[#8daec7]">
                    <span>🚌 Commute Limit:</span>
                    <span className="text-white font-mono font-bold">₹{child.transportLimit}</span>
                  </div>
                  <div className="flex justify-between text-[#8daec7]">
                    <span>🎧 Target Goal:</span>
                    <span className="text-teal-300 font-bold">{child.goals[0]?.name || 'Savings'}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#051423] border border-[#143b5e] rounded-xl text-[11px] font-mono text-[#799ab2] space-y-1">
                  <div className="text-teal-400 font-bold text-[10px] uppercase">Companion Credentials</div>
                  <div>Gmail: <b className="text-sky-300">{child.email}</b></div>
                  <div>Password: <b className="text-white">{child.password}</b></div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenLogin('parent')}
                  className="w-full py-2 bg-[#092238] hover:bg-[#11375a] border border-[#173e63] text-teal-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Configure Rules in Parent Console →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Interactive Allowance Calculator (#calculator) */}
      <section id="calculator" className="py-16 sm:py-24 border-t border-[#11314e] bg-[#051424]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
              INTERACTIVE BENCHMARK TOOL
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#dbeaf5] mt-2 tracking-tight">
              Indian Teen Allowance Calculator
            </h2>
            <p className="text-sm text-[#8daec7] mt-3 leading-relaxed">
              Wondering how much allowance is appropriate? Use our data-backed calculator calibrated for Indian metro and Tier 2 cities.
            </p>
          </div>

          <div className="max-w-3xl mx-auto p-6 sm:p-8 bg-[#081d30] border border-[#153e63] rounded-3xl shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Controls */}
              <div className="space-y-5 text-xs">
                <div>
                  <label className="block text-[#799ab2] font-mono font-bold uppercase mb-2">
                    SELECT TEEN'S AGE
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[12, 13, 14, 15, 16, 17].map((age) => (
                      <button
                        key={age}
                        type="button"
                        onClick={() => setCalcAge(age)}
                        className={`py-2 px-2.5 rounded-xl border font-bold cursor-pointer transition-all ${
                          calcAge === age
                            ? 'bg-teal-400 text-slate-950 border-teal-400 shadow-md shadow-teal-500/20'
                            : 'bg-[#051423] text-slate-300 border-[#153c5f] hover:border-teal-400/50'
                        }`}
                      >
                        {age} Years Old
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#799ab2] font-mono font-bold uppercase mb-1.5">
                      CITY TIER
                    </label>
                    <select
                      value={cityTier}
                      onChange={(e) => setCityTier(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#051321] border border-[#173e63] rounded-xl text-white focus:outline-none focus:border-teal-400"
                    >
                      <option value="metro">Tier 1 Metro (BLR, BOM, DEL)</option>
                      <option value="tier2">Tier 2 City (LKO, PUN, JAI)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#799ab2] font-mono font-bold uppercase mb-1.5">
                      SCHOOL COMMUTE
                    </label>
                    <select
                      value={commuteMode}
                      onChange={(e) => setCommuteMode(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#051321] border border-[#173e63] rounded-xl text-white focus:outline-none focus:border-teal-400"
                    >
                      <option value="metro_bus">Public Metro / Bus (+₹200)</option>
                      <option value="school_bus">School Bus Provided</option>
                      <option value="walk">Walking / Cycling (-₹150)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-[#051423] rounded-xl border border-[#123657] text-[11px] text-[#799ab2] leading-relaxed">
                  💡 <b>Pacing rule of thumb:</b> In urban India, an age-appropriate baseline provides sufficient funds for lunches and transit, plus exactly enough surplus to practice choosing between spending and saving for goals.
                </div>
              </div>

              {/* Recommended Result Box */}
              <div className="p-6 bg-[#051423] border border-teal-500/40 rounded-2xl space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-teal-400 font-bold block">
                  RECOMMENDED MONTHLY BASELINE
                </span>
                <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                  ₹{totalAllowance.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-[#799ab2]">
                  Calibrated for a {calcAge}-year-old student in {cityTier === 'metro' ? 'Metro cities' : 'Tier-2 cities'}.
                </div>

                {/* Breakdown */}
                <div className="space-y-2 pt-3 border-t border-[#133758] text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#8daec7]">🍔 Food & Canteen:</span>
                    <span className="text-white font-bold">₹{foodAmt} ({benchmark.foodShare}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8daec7]">🚌 Transit & Metro:</span>
                    <span className="text-white font-bold">₹{transitAmt} ({benchmark.transitShare}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8daec7]">📚 Books & Stationery:</span>
                    <span className="text-white font-bold">₹{booksAmt} ({benchmark.booksShare}%)</span>
                  </div>
                  <div className="flex justify-between text-teal-300 font-bold">
                    <span>🎧 Mindful Savings Target:</span>
                    <span>₹{savingsAmt}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onOpenLogin('parent');
                    showToast(`Sign in to Parent Console to configure ₹${totalAllowance.toLocaleString('en-IN')} allowance!`);
                  }}
                  className="w-full py-3 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-teal-500/20"
                >
                  Configure in Parent Console 👩 →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Live Interactive Sandbox Demo (#demo) */}
      <section id="demo" className="py-16 sm:py-24 border-t border-[#11314e] bg-[#05111d]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
              HANDS-ON SIMULATION
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#dbeaf5] mt-2 tracking-tight">
              Test the Pocket Fund Experience Live
            </h2>
            <p className="text-sm text-[#8daec7] mt-3 leading-relaxed">
              Interact with the live simulator below. Toggle between Parent Mode and Teen Wallet, approve requests, send instant UPI money, and deposit to savings goals.
            </p>
          </div>

          <InteractiveSandbox
            childrenList={childrenList}
            onOpenPilot={onOpenPilot}
            onOpenLogin={onOpenLogin}
            showToast={showToast}
          />
        </div>
      </section>

      {/* 8. Platforms Showcase (#platforms) */}
      <section id="platforms" className="py-16 sm:py-24 border-t border-[#11314e] bg-[#051424]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
              CROSS-PLATFORM ARCHITECTURE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#dbeaf5] mt-2 tracking-tight">
              Designed for Parent Control & Teen Growth
            </h2>
            <p className="text-sm text-[#8daec7] mt-3 leading-relaxed">
              Parents get a full command center on desktop or mobile. Teenagers get a clean, companion wallet on their smartphone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Parent Command Center */}
            <div className="p-7 bg-[#081d30] border border-[#153e63] rounded-3xl space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-bold">
                  👩
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">Parent Command Console</h3>
                  <span className="text-xs text-[#799ab2]">Desktop / Tablet / Web</span>
                </div>
              </div>
              <p className="text-xs text-[#8daec7] leading-relaxed">
                Configure automated allowances, inspect merchant-level receipts, set category caps, and review discretionary top-up requests in seconds.
              </p>
              <ul className="space-y-2 text-xs text-[#c2d5e3]">
                <li className="flex items-center gap-2">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span>Unified oversight across 1, 2, or 3+ children</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span>1-tap instant UPI transfer and top-up loop</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span>Downloadable statutory family monthly statements</span>
                </li>
              </ul>
              <button
                onClick={() => onOpenLogin('parent')}
                className="w-full py-2.5 bg-[#0a2742] hover:bg-[#0f3456] border border-teal-400 text-teal-300 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Launch Parent Console 👩 →
              </button>
            </div>

            {/* Teen Companion App */}
            <div className="p-7 bg-[#081d30] border border-[#153e63] rounded-3xl space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 font-bold">
                  🧑
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">Student Mobile Wallet</h3>
                  <span className="text-xs text-[#799ab2]">iOS & Android Companion App</span>
                </div>
              </div>
              <p className="text-xs text-[#8daec7] leading-relaxed">
                Empowers teenagers with their own contactless RuPay virtual card, savings targets, and an educational budget pace meter.
              </p>
              <ul className="space-y-2 text-xs text-[#c2d5e3]">
                <li className="flex items-center gap-2">
                  <span className="text-sky-400 font-bold">✓</span>
                  <span>Virtual RuPay card with zero overdraft risk</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sky-400 font-bold">✓</span>
                  <span>Visual goal milestones (Headphones, Fest, Games)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sky-400 font-bold">✓</span>
                  <span>Direct request form with itemized purpose</span>
                </li>
              </ul>
              <button
                onClick={() => onOpenLogin('student')}
                className="w-full py-2.5 bg-[#0a2742] hover:bg-[#0f3456] border border-sky-400 text-sky-300 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Launch Student Wallet 🧑 →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Safety & Guardrails (#safety) */}
      <section id="safety" className="py-16 sm:py-24 border-t border-[#11314e] bg-[#05111d]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
              BANK-GRADE GUARDRAILS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#dbeaf5] mt-2 tracking-tight">
              Safety engineered for minor protection.
            </h2>
            <p className="text-sm text-[#8daec7] mt-3 leading-relaxed">
              All transactions run on licensed RBI PPI partner rails with network-level merchant category filtering.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#081d30] border border-[#153e63] rounded-2xl space-y-3">
              <span className="text-2xl">🛡️</span>
              <h4 className="font-bold text-white text-base">Network MCC Blocking</h4>
              <p className="text-xs text-[#8daec7] leading-relaxed">
                Merchant Category Codes (MCC) for gambling, lottery, alcohol, adult content, and speculative gaming tokens are automatically declined at card processing.
              </p>
            </div>

            <div className="p-6 bg-[#081d30] border border-[#153e63] rounded-2xl space-y-3">
              <span className="text-2xl">💳</span>
              <h4 className="font-bold text-white text-base">Zero Overdraft & Debt</h4>
              <p className="text-xs text-[#8daec7] leading-relaxed">
                Prepaid wallet rails ensure teenagers can never spend more than the parent-funded balance. Zero debt, zero interest, and zero hidden penalties.
              </p>
            </div>

            <div className="p-6 bg-[#081d30] border border-[#153e63] rounded-2xl space-y-3">
              <span className="text-2xl">📲</span>
              <h4 className="font-bold text-white text-base">Instant Parental Consent</h4>
              <p className="text-xs text-[#8daec7] leading-relaxed">
                Any spending request outside regular allowances requires explicit 1-tap parent authorization before funds are released to the merchant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Family Stories & Testimonials (#stories) */}
      <section id="stories" className="py-16 sm:py-24 border-t border-[#11314e] bg-[#051424]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
              TESTED IN INDIAN HOMES
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#dbeaf5] mt-2 tracking-tight">
              Real Family Stories
            </h2>
            <p className="text-sm text-[#8daec7] mt-3 leading-relaxed">
              How urban parents and teenagers replaced constant WhatsApp transfers with peaceful budget pacing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {storyTestimonials.map((story, idx) => (
              <div
                key={idx}
                className="p-6 bg-[#081d30] border border-[#143a5c] rounded-2xl flex flex-col justify-between space-y-4 shadow-lg"
              >
                <p className="text-xs text-[#c2d5e3] italic leading-relaxed">
                  {story.quote}
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-[#133758]">
                  <span className="text-2xl">{story.avatar}</span>
                  <div>
                    <div className="font-bold text-white text-xs">{story.author}</div>
                    <div className="text-[11px] text-[#799ab2]">{story.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* 12. Transparent Pricing (#pricing) */}
      <section id="pricing" className="py-16 sm:py-24 border-t border-[#11314e] bg-[#051424]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
              TRANSPARENT PRICING
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#dbeaf5] mt-2 tracking-tight">
              Simple plans for every family.
            </h2>
            <p className="text-sm text-[#8daec7] mt-3 leading-relaxed">
              Join our family pilot today and receive lifetime grandfathered access to our core platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`p-7 bg-[#081d30] border rounded-3xl relative flex flex-col justify-between space-y-6 ${
                  plan.isFeatured
                    ? 'border-teal-400 shadow-2xl shadow-teal-500/15'
                    : 'border-[#153e63]'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 right-6 px-3 py-1 bg-teal-400 text-slate-950 font-mono font-black text-[10px] rounded-full uppercase tracking-wider">
                    {plan.badge}
                  </span>
                )}

                <div>
                  <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                  <p className="text-xs text-[#799ab2] mt-1">{plan.tagline}</p>
                  <div className="text-3xl font-black text-white font-mono mt-4">
                    {plan.price} <span className="text-xs text-[#799ab2] font-normal">{plan.priceSub}</span>
                  </div>

                  <ul className="space-y-2.5 mt-6 text-xs text-[#c2d5e3]">
                    {plan.features.map((f, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2">
                        <span className="text-teal-400 font-bold">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onOpenPilot}
                  className={`w-full py-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                    plan.isFeatured
                      ? 'bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-lg shadow-teal-500/20'
                      : 'bg-[#0a2742] hover:bg-[#0f3456] border border-teal-500/30 text-teal-300'
                  }`}
                >
                  {plan.ctaText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 13. Frequently Asked Questions (#faq) */}
      <section id="faq" className="py-16 sm:py-24 border-t border-[#11314e] bg-[#05111d]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
              GOT QUESTIONS?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#dbeaf5] mt-2 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#8daec7] mt-3 leading-relaxed">
              Everything parents want to know about safety, UPI, and managing student companion accounts.
            </p>
          </div>

          <div className="space-y-3">
            {faqList.map((item, idx) => {
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
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-teal-400 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-[#8daec7] leading-relaxed border-t border-white/5">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 14. Final Call to Action */}
      <section className="py-16 sm:py-20 border-t border-[#11314e] bg-gradient-to-b from-[#051424] to-[#040e18] text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-5">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
            START TODAY
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#dbeaf5] tracking-tight">
            Ready to give your teens a lifelong head start?
          </h2>
          <p className="text-sm text-[#8daec7] leading-relaxed max-w-xl mx-auto">
            Join our closed pilot today and help shape the way the next generation of Indian youth learns to manage money.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenPilot}
              className="px-6 py-3.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-black rounded-xl text-sm transition-all shadow-xl shadow-teal-500/25 cursor-pointer"
            >
              Join the Family Pilot
            </button>
            <button
              onClick={() => scrollToSection('demo')}
              className="px-5 py-3.5 bg-[#081f33] hover:bg-[#0e2e4c] border border-[#16426a] text-[#dbeaf5] font-bold rounded-xl text-sm transition-all cursor-pointer"
            >
              Test Interactive Demo ↗
            </button>
          </div>
        </div>
      </section>

      {/* 15. Comprehensive Footer */}
      <footer className="border-t border-[#11314e] bg-[#030c14] py-12 text-xs text-[#799ab2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#143758]">
            {/* Col 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-black text-lg text-white">
                <span className="w-7 h-7 rounded-lg bg-teal-400 text-slate-950 font-black flex items-center justify-center text-xs">
                  ₹
                </span>
                <span>Pocket Fund</span>
              </div>
              <p className="text-[11px] text-[#8daec7] leading-relaxed">
                The parent-guided allowance platform that helps teenagers build responsible money habits before turning eighteen.
              </p>
              <div className="text-[10px] text-[#63849c] font-mono">
                Lucknow, Uttar Pradesh, India
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-2">
              <b className="text-white text-xs uppercase tracking-wider block mb-1">Navigation</b>
              <div><a href="#how" onClick={(e) => { e.preventDefault(); scrollToSection('how'); }} className="hover:text-white">Methodology</a></div>
              <div><a href="#multi-child" onClick={(e) => { e.preventDefault(); scrollToSection('multi-child'); }} className="hover:text-white">Multi-Child Accounts</a></div>
              <div><a href="#calculator" onClick={(e) => { e.preventDefault(); scrollToSection('calculator'); }} className="hover:text-white">Allowance Calculator</a></div>
              <div><a href="#demo" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }} className="hover:text-white">Interactive Sandbox</a></div>
            </div>

            {/* Col 3 */}
            <div className="space-y-2">
              <b className="text-white text-xs uppercase tracking-wider block mb-1">Safety & Legal</b>
              <div><a href="#safety" onClick={(e) => { e.preventDefault(); scrollToSection('safety'); }} className="hover:text-white">RBI PPI Partner Rails</a></div>
              <div><a href="#safety" onClick={(e) => { e.preventDefault(); scrollToSection('safety'); }} className="hover:text-white">Merchant Category Code Blocks</a></div>
              <div><a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }} className="hover:text-white">Zero Overdraft Guarantee</a></div>
              <div><button onClick={onOpenAIAdvisor} className="hover:text-teal-300 bg-transparent border-0 p-0 text-inherit font-inherit cursor-pointer">✦ Ask Pocket Fund AI</button></div>
            </div>

            {/* Col 4 */}
            <div className="space-y-2 text-[11px]">
              <b className="text-white text-xs uppercase tracking-wider block mb-1">Customer Care Desk</b>
              <div>
                📞 Support Helpline:{' '}
                <a href="tel:18001009988" className="text-teal-300 font-bold hover:underline">
                  1800-100-9988
                </a>
              </div>
              <div>
                ✉️ Support Email:{' '}
                <a href="mailto:support@pocketfund.in" className="text-sky-300 hover:underline">
                  support@pocketfund.in
                </a>
              </div>
              <div className="text-[10px] text-[#63849c]">
                Support: Mon–Sun (8:00 AM – 10:00 PM IST)
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-between gap-4 text-[11px]">
            <div>
              © 2026 Pocket Fund Technologies Private Limited. All rights reserved. Registered under Indian Companies Act.
            </div>
            <div>
              Financial and payment processing services provided in partnership with authorized RBI-regulated banking partners.
            </div>
          </div>
        </div>
      </footer>

      {/* Floating "Ask Pocket Fund AI" Button */}
      <button
        onClick={onOpenAIAdvisor}
        className="fixed bottom-5 right-5 z-40 px-4 py-2.5 bg-gradient-to-r from-teal-400 to-sky-400 text-slate-950 font-black rounded-full shadow-2xl flex items-center gap-2 cursor-pointer hover:scale-105 transition-all"
        title="Ask Pocket Fund AI"
      >
        <Sparkles className="w-4 h-4 fill-slate-950" />
        <span className="text-xs">Ask Pocket Fund AI</span>
      </button>
    </div>
  );
};
