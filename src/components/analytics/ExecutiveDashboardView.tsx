import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, ShoppingBag, Percent, 
  AlertTriangle, CheckCircle2, Sparkles, ArrowUpRight, 
  Flame, Ban, Scale, Clock, ShieldCheck, HeartPulse,
  Users, Activity, ChevronRight, Box, BarChart3
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { TeamProgressTracker } from './TeamProgressTracker.tsx';
import { DailyHuddleSummary } from './DailyHuddleSummary.tsx';
import { RiskLensMatrix3D } from '../3d/RiskLensMatrix3D.tsx';

interface Props {
  onNavigateTab: (tab: string) => void;
  onOpenCopilot: () => void;
}

export const ExecutiveDashboardView: React.FC<Props> = ({ onNavigateTab, onOpenCopilot }) => {
  const { currentBranch, restaurant } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<'EXECUTIVE' | 'DAILY_HUDDLE' | 'STAFF_PROGRESS'>('EXECUTIVE');
  const [show3DMatrix, setShow3DMatrix] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get(`/analytics/dashboard?branchId=${currentBranch?.id || ''}`);
        setDashboardData(res);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    }
    loadDashboard();
  }, [currentBranch]);

  if (!dashboardData) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading restaurant telemetry...
      </div>
    );
  }

  const { todayMetrics, healthScore, fiveOwnerQuestions, salesTrend } = dashboardData;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Welcome & Global Snapshot */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Executive Restaurant Intelligence
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Operations
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Overview for {currentBranch?.name || 'All Outlets'} · Real-time synchronization across POS, kitchen & inventory
          </p>
        </div>

        {/* View Switcher: Executive vs Daily Huddle vs Staff Progress */}
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-stone-900 rounded-xl border border-stone-800 text-xs font-semibold">
            <button
              onClick={() => setActiveSection('EXECUTIVE')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSection === 'EXECUTIVE'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Executive Pulse
            </button>
            <button
              onClick={() => setActiveSection('DAILY_HUDDLE')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'DAILY_HUDDLE'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Daily Huddle (AI Shift Sync)
            </button>
            <button
              onClick={() => setActiveSection('STAFF_PROGRESS')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'STAFF_PROGRESS'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Staff Progress (6)
            </button>
          </div>
        </div>
      </div>

      {/* Render Daily Huddle View if toggled */}
      {activeSection === 'DAILY_HUDDLE' && (
        <DailyHuddleSummary
          onNavigateTab={onNavigateTab}
          onOpenCopilot={onOpenCopilot}
        />
      )}

      {/* Render Team Progress View if toggled */}
      {activeSection === 'STAFF_PROGRESS' && (
        <TeamProgressTracker />
      )}

      {/* Render Main Executive View */}
      {activeSection === 'EXECUTIVE' && (
        <>
          {/* Quick Daily Huddle Teaser Banner inside Executive View */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    Tonight's AI Daily Huddle Active · Dinner Rush (17:00 – 23:30)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    100% Stations Covered
                  </span>
                </div>
                <span className="text-stone-300 text-[11px] mt-0.5 block">
                  Projected Peak: <strong>20:30 – 22:00 (78 covers)</strong> · Star Push: <strong>Awadhi Dum Biryani (+₹355 margin)</strong> · Pre-shift briefing ready with AI Voice readout
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveSection('DAILY_HUDDLE')}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <span>Launch Daily Huddle</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Staff Banner inside Executive View */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">
                  All 6 Assigned Staff Members Active on Shift
                </span>
                <span className="text-slate-400 text-[11px]">
                  Priya (Cashier: ₹48,650 billed) • Vikram (Chef: 32 KOTs) • Amit (Waiter: 28 orders) • Sunita (Inventory: 18 scans)
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveSection('STAFF_PROGRESS')}
              className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 flex items-center gap-1 transition-all shrink-0 cursor-pointer"
            >
              Inspect Everyone's Progress
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Health Score Pill */}
          <div className="flex justify-end">
            <div className="p-2.5 px-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-700/80 flex items-center gap-3 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black font-mono text-base">
                {healthScore.total}
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <HeartPulse className="w-3 h-3 text-emerald-400" />
                  Restaurant Health Score
                </div>
                <div className="text-xs font-bold text-slate-200">
                  Optimal Operating Health
                </div>
              </div>
            </div>
          </div>

      {/* TODAY'S CORE METRICS ROW (CLEAN, HIGH-CONTRAST CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-sm space-y-1 hover:border-stone-700 transition-all">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-bold">Today's Net Revenue</span>
            <span className="text-[10px] font-mono text-emerald-400 font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/15">+{todayMetrics.revenueVsBaselinePct}%</span>
          </div>
          <div className="text-2xl font-black font-mono text-white tracking-tight">
            ₹{todayMetrics.revenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-stone-400">
            Across {todayMetrics.ordersCount} completed bills (AOV: ₹{todayMetrics.aov})
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-sm space-y-1 hover:border-stone-700 transition-all">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-bold">Actual Food Cost %</span>
            <span className="text-[10px] font-mono text-emerald-400 font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/15">Within Target</span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
            {todayMetrics.foodCostPct}%
          </div>
          <div className="text-[11px] text-stone-400">
            Gross Margin: {todayMetrics.grossMarginPct}%
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-sm space-y-1 hover:border-stone-700 transition-all">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-bold">Logged Wastage Loss</span>
            <span className="text-[10px] font-mono text-rose-400 font-extrabold px-1.5 py-0.5 rounded bg-rose-500/15">2 Incidents</span>
          </div>
          <div className="text-2xl font-black font-mono text-rose-400 tracking-tight">
            ₹{todayMetrics.todayWastageCost}
          </div>
          <div className="text-[11px] text-stone-400">
            Equivalent to ~1.9 Butter Chickens lost
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-sm space-y-1 hover:border-stone-700 transition-all">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-bold">Forecast Accuracy</span>
            <span className="text-[10px] font-mono text-emerald-400 font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/15">30-Day Mean</span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400 tracking-tight">
            89.1%
          </div>
          <div className="text-[11px] text-stone-400">
            Safe buffer bias: +1.2%
          </div>
        </div>
      </div>

      {/* RISKLENS PROFIT & RISK MATRIX (CLEAN, MOBILE-FRIENDLY & FAST) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                RiskLens Menu Profit & Risk Matrix
              </h3>
              <p className="text-[11px] text-stone-400">
                BCG quadrant intelligence: Margins vs. order volume vs. ingredient risk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-stone-900 rounded-xl border border-stone-800 text-xs font-bold self-end sm:self-auto">
            <button
              onClick={() => setShow3DMatrix(false)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                !show3DMatrix
                  ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Mobile 2D Grid
            </button>
            <button
              onClick={() => setShow3DMatrix(true)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                show3DMatrix
                  ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              3D Spatial View
            </button>
          </div>
        </div>

        {!show3DMatrix ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-3 shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <div>
                  <div className="text-xs font-bold text-white tracking-tight">Profit Stars (High Volume · High Margin)</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">Maintain strict consistency; highlight in POS quick-picks</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold shrink-0 border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                  Keep Core
                </span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-stone-200">Butter Chicken Special</div>
                    <div className="text-[10px] text-stone-400 font-mono">Price: ₹440 · Cost: ₹79 · Vol: 92/100</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-emerald-400">82% Margin</div>
                    <div className="text-[10px] text-stone-400">Top Grosser</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-stone-200">Tandoori Garlic Naan</div>
                    <div className="text-[10px] text-stone-400 font-mono">Price: ₹85 · Cost: ₹10 · Vol: 98/100</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-emerald-400">88% Margin</div>
                    <div className="text-[10px] text-stone-400">Highest Attach</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-stone-200">Dal Makhani Heritage</div>
                    <div className="text-[10px] text-stone-400 font-mono">Price: ₹320 · Cost: ₹67 · Vol: 85/100</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-emerald-400">79% Margin</div>
                    <div className="text-[10px] text-stone-400">Stable Performer</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-3 shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <div>
                  <div className="text-xs font-bold text-white tracking-tight">Plowhorses (High Volume · Lower Margin)</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">Audit meat portioning; negotiate supplier bulk rates</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold shrink-0 border-amber-500/40 bg-amber-500/10 text-amber-400">
                  Margin Focus
                </span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-stone-200">Chicken Biryani Handi</div>
                    <div className="text-[10px] text-stone-400 font-mono">Price: ₹360 · Cost: ₹172 · Vol: 90/100</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-amber-400">52% Margin</div>
                    <div className="text-[10px] text-amber-400">Portion Drift +14%</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-stone-200">Mutton Rogan Josh</div>
                    <div className="text-[10px] text-stone-400 font-mono">Price: ₹520 · Cost: ₹270 · Vol: 72/100</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-amber-400">48% Margin</div>
                    <div className="text-[10px] text-stone-400">High Meat Cost</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-3 shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <div>
                  <div className="text-xs font-bold text-white tracking-tight">Puzzles (Low Volume · High Margin)</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">Train waitstaff to pitch as pairing recommendation</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold shrink-0 border-blue-500/40 bg-blue-500/10 text-blue-400">
                  Upsell Opportunity
                </span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-stone-200">Saffron Lassi Royale</div>
                    <div className="text-[10px] text-stone-400 font-mono">Price: ₹180 · Cost: ₹27 · Vol: 38/100</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-blue-400">85% Margin</div>
                    <div className="text-[10px] text-stone-400">High Potential</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-3 shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <div>
                  <div className="text-xs font-bold text-white tracking-tight">Dogs (Low Volume · Low Margin / Waste Risk)</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">Re-engineer recipe or replace with fresh alternatives</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold shrink-0 border-rose-500/40 bg-rose-500/10 text-rose-400">
                  Risk Alert
                </span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-stone-200">Fish Amritsari Fry</div>
                    <div className="text-[10px] text-stone-400 font-mono">Price: ₹460 · Cost: ₹294 · Risk: 82%</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-rose-400">36% Margin</div>
                    <div className="text-[10px] text-rose-400">High Spoilage</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-stone-200">Raw Papaya Salad</div>
                    <div className="text-[10px] text-stone-400 font-mono">Price: ₹210 · Cost: ₹126 · Risk: 78%</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-rose-400">40% Margin</div>
                    <div className="text-[10px] text-stone-400">Slow Mover</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-800 overflow-hidden">
            <RiskLensMatrix3D />
          </div>
        )}
      </div>

      {/* CORE 5 OWNER QUESTIONS EXECUTIVE BRIEFING */}
      <div className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Today's 5 Core Owner Questions Answered
            </h3>
          </div>
          <button
            onClick={onOpenCopilot}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
          >
            Ask AI Copilot Details →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Q1: How is my restaurant doing? */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              1. How is my restaurant doing?
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {fiveOwnerQuestions.howIsRestaurantDoing}
            </p>
          </div>

          {/* Q2: What needs attention? */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              2. What needs attention?
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {fiveOwnerQuestions.whatNeedsAttention}
            </p>
          </div>

          {/* Q3: What should I buy? */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              3. What should I buy?
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {fiveOwnerQuestions.whatShouldIBuy}
            </p>
          </div>

          {/* Q4: What is being wasted? */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              4. What is being wasted?
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {fiveOwnerQuestions.whatIsBeingWasted}
            </p>
          </div>

          {/* Q5: What does AI predict? */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 md:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              5. What does AI predict?
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {fiveOwnerQuestions.whatDoesAIPredict}
            </p>
          </div>

        </div>
      </div>

      {/* HEALTH SCORE COMPONENT BREAKDOWN & HOURLY SALES TREND */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Health Score Sub-Metrics */}
        <div className="lg:col-span-6 p-5 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-700 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Health Indicator Diagnostics
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Continuous operational evaluation</span>
          </div>

          <div className="space-y-3 pt-1">
            {healthScore.breakdown.map((b: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">{b.label}</span>
                  <span className="font-mono font-bold text-amber-400">{b.score} / {b.max}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
                    style={{ width: `${b.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Sales & Covers Bar Visual */}
        <div className="lg:col-span-6 p-5 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-700 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Today's Hourly Revenue Velocity
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Lunch vs Dinner Rush</span>
          </div>

          <div className="grid grid-cols-6 gap-2 h-44 items-end pt-4 pb-2">
            {salesTrend.map((st: any, idx: number) => {
              const maxVal = 13000;
              const heightPct = Math.round((st.sales / maxVal) * 100);

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[9px] font-mono text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{(st.sales / 1000).toFixed(1)}k
                  </span>
                  <div
                    className="w-full bg-gradient-to-t from-amber-500/30 to-amber-400 rounded-t-lg transition-all group-hover:to-amber-300"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10px] text-slate-400 font-mono">{st.time}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span>Peak Hour: <strong>08:00 PM (Dinner)</strong></span>
            <span>Table Turnover: <strong>1.8x</strong></span>
          </div>
        </div>
      </div>
    </>
  )}

    </div>
  );
};
