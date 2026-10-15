import React from 'react';
import { 
  Building2, UserCheck, Receipt, Layers, ChefHat, 
  Package, Calculator, Sparkles, ArrowRight, Table as TableIcon, 
  Flame, Clock, AlertTriangle, CheckCircle2, TrendingUp, 
  DollarSign, ShoppingCart, Trash2, Printer, Plus, Shield, 
  ArrowUpRight, HeartPulse, RefreshCw, FlaskConical, Scan
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ExecutiveDashboardView } from '../analytics/ExecutiveDashboardView.tsx';
import { DailyHuddleSummary } from '../analytics/DailyHuddleSummary.tsx';

interface Props {
  onNavigateTab: (tab: string) => void;
  onOpenCopilot: () => void;
}

export const RoleDashboard: React.FC<Props> = ({ onNavigateTab, onOpenCopilot }) => {
  const { user, currentBranch, restaurant } = useAuth();
  const [managerTab, setManagerTab] = React.useState<'DASHBOARD' | 'DAILY_HUDDLE'>('DASHBOARD');

  const role = user?.role || 'OWNER';

  // 1. OWNER / SUPER_ADMIN: Renders the full Executive Dashboard with 5 Owner Questions
  if (role === 'OWNER' || role === 'SUPER_ADMIN') {
    return (
      <ExecutiveDashboardView
        onNavigateTab={onNavigateTab}
        onOpenCopilot={onOpenCopilot}
      />
    );
  }

  // 2. MANAGER DASHBOARD
  if (role === 'MANAGER') {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-400" />
                Operations & Shift Manager Dashboard
              </h2>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                Shift In-Progress
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Welcome back, {user?.name}. Managing daily floor operations, table turns, and staff shifts for {currentBranch?.name}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-stone-900 rounded-xl border border-stone-800 text-xs font-semibold">
              <button
                onClick={() => setManagerTab('DASHBOARD')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  managerTab === 'DASHBOARD'
                    ? 'bg-blue-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Shift Operations
              </button>
              <button
                onClick={() => setManagerTab('DAILY_HUDDLE')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  managerTab === 'DAILY_HUDDLE'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Daily Huddle (AI Voice & 3D Peak)
              </button>
            </div>

            <button
              onClick={() => onNavigateTab('tables')}
              className="px-3.5 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20 button-3d"
            >
              <TableIcon className="w-3.5 h-3.5" />
              Live Floor Plan
            </button>
          </div>
        </div>

        {managerTab === 'DAILY_HUDDLE' ? (
          <DailyHuddleSummary
            onNavigateTab={onNavigateTab}
            onOpenCopilot={onOpenCopilot}
          />
        ) : (
          <>
            {/* Daily Huddle Quick Briefing Card for Shift Manager */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      Shift Daily Huddle Briefing Active · Dinner Rush (17:00 – 23:30)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      100% Station Coverage
                    </span>
                  </div>
                  <span className="text-stone-300 text-[11px] mt-0.5 block">
                    Lead: <strong>Rahul Verma</strong> · Peak Window: <strong>20:30 (78 covers)</strong> · Star Push: <strong>Awadhi Dum Biryani (+₹355 margin)</strong>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setManagerTab('DAILY_HUDDLE')}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-md shadow-amber-500/20"
              >
                <span>Open Daily Huddle</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Manager KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1 h-full shadow-sm hover:border-stone-700 transition-all">
                <span className="text-[10px] text-stone-400 uppercase font-semibold">Table Occupancy</span>
                <div className="text-2xl font-black font-mono text-white">12 / 18 <span className="text-xs font-normal text-stone-400">(67%)</span></div>
                <div className="text-[11px] text-emerald-400 font-medium">6 Tables available for walk-ins</div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1 h-full shadow-sm hover:border-stone-700 transition-all">
                <span className="text-[10px] text-stone-400 uppercase font-semibold">Active Staff on Shift</span>
                <div className="text-2xl font-black font-mono text-blue-400">6 Staff</div>
                <div className="text-[11px] text-stone-400">2 Captains, 3 Kitchen, 1 Cashier</div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1 h-full shadow-sm hover:border-stone-700 transition-all">
                <span className="text-[10px] text-stone-400 uppercase font-semibold">Kitchen Turnaround</span>
                <div className="text-2xl font-black font-mono text-amber-400">14.2 mins</div>
                <div className="text-[11px] text-emerald-400 font-medium">Under 16m service target</div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1 h-full shadow-sm hover:border-stone-700 transition-all">
                <span className="text-[10px] text-stone-400 uppercase font-semibold">Kitchen Attention</span>
                <div className="text-2xl font-black font-mono text-rose-400">3 Tickets</div>
                <div className="text-[11px] text-rose-300">Table T01 prep elapsed 12 mins</div>
              </div>
            </div>
          </>
        )}

        {/* Manager Quick Action Shortcuts */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Manager Operational Shortcuts
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => onNavigateTab('tables')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <TableIcon className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-blue-300">Floor & Tables</div>
                <div className="text-[10px] text-slate-400">Assign servers, transfer tables, seat guests</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('kitchen')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-orange-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <ChefHat className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-orange-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-orange-300">Kitchen Display (KDS)</div>
                <div className="text-[10px] text-slate-400">Monitor cooking pace & rush hour tickets</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('forecast')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-300">Review Purchase Plan</div>
                <div className="text-[10px] text-slate-400">Verify tomorrow's raw ingredients order</div>
              </div>
            </button>

            <button
              onClick={onOpenCopilot}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-emerald-300">AI Shift Copilot</div>
                <div className="text-[10px] text-slate-400">Ask operational questions with verified data</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. CASHIER DASHBOARD
  if (role === 'CASHIER') {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                Smart POS & Cashier Station Dashboard
              </h2>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Register #1 Online
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as {user?.name}. Manage customer settlements, UPI dynamic QR payments, and instant receipt printing.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('pos')}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            Open Smart POS Terminal
          </button>
        </div>

        {/* Cashier Shift Drawer Breakdown */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Cash in Drawer</span>
            <div className="text-2xl font-black font-mono text-emerald-400">₹14,500</div>
            <div className="text-[11px] text-slate-400">Opening float: ₹5,000</div>
          </div>

          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">UPI Dynamic QR Total</span>
            <div className="text-2xl font-black font-mono text-amber-400">₹24,800</div>
            <div className="text-[11px] text-slate-400">18 successful digital transactions</div>
          </div>

          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Card Terminal Total</span>
            <div className="text-2xl font-black font-mono text-blue-400">₹9,350</div>
            <div className="text-[11px] text-slate-400">7 POS swipes settled</div>
          </div>

          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Held Orders</span>
            <div className="text-2xl font-black font-mono text-purple-400">1 Order</div>
            <div className="text-[11px] text-purple-300">Ready to resume in POS</div>
          </div>
        </div>

        {/* Cashier Shortcuts */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Cashier Fast Actions
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => onNavigateTab('pos')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Plus className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-emerald-300">New Dine-In Bill</div>
                <div className="text-[10px] text-slate-400">Select table & take guest order</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('orders')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Printer className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-blue-300">Reprint Tax Invoices</div>
                <div className="text-[10px] text-slate-400">Lookup past bills & reprint 80mm receipts</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('tables')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <TableIcon className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-purple-300">Floor Overview</div>
                <div className="text-[10px] text-slate-400">Check tables ready for billing</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('pos')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-300">Takeaway & Quick Bill</div>
                <div className="text-[10px] text-slate-400">Fast checkout for pickup customers</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. WAITER DASHBOARD
  if (role === 'WAITER') {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Captain & Waiter Station Dashboard
              </h2>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Floor Section: Main Hall
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Welcome, {user?.name}. Track your assigned tables, send kitchen order tickets (KOT), and receive dish ready alerts.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('tables')}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <TableIcon className="w-3.5 h-3.5" />
            View Floor Tables
          </button>
        </div>

        {/* Waiter KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Tables</span>
            <div className="text-2xl font-black font-mono text-white">4 Tables</div>
            <div className="text-[11px] text-slate-400">T01, T03, T05, B01</div>
          </div>

          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Guests Seated</span>
            <div className="text-2xl font-black font-mono text-indigo-400">16 Guests</div>
            <div className="text-[11px] text-slate-400">Average party size: 4 pax</div>
          </div>

          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Food Ready for Pick</span>
            <div className="text-2xl font-black font-mono text-emerald-400 animate-pulse">Table B01</div>
            <div className="text-[11px] text-emerald-300">Galouti Kebab & Drinks ready at counter!</div>
          </div>

          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Bills Requested</span>
            <div className="text-2xl font-black font-mono text-purple-400">Table T03</div>
            <div className="text-[11px] text-purple-300">Ready for cashier printout</div>
          </div>
        </div>

        {/* Waiter Fast Shortcuts */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Waiter Actions
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onNavigateTab('pos')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Plus className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-indigo-300">Take Order / Fire KOT</div>
                <div className="text-[10px] text-slate-400">Select table items and fire to kitchen stations</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('tables')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <TableIcon className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-blue-300">Table Floor Plan</div>
                <div className="text-[10px] text-slate-400">Check vacant tables & seat incoming guests</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('kitchen')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ChefHat className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-emerald-300">Check Kitchen KDS Status</div>
                <div className="text-[10px] text-slate-400">See elapsed preparation times for your orders</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. KITCHEN / HEAD CHEF DASHBOARD
  if (role === 'KITCHEN') {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-orange-400" />
                Head Chef & Kitchen Display Dashboard
              </h2>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30">
                Kitchen Station Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Welcome, {user?.name}. Monitor active cooking stations, ticket turnaround times, and log kitchen wastage.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('kitchen')}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20"
          >
            <ChefHat className="w-4 h-4" />
            Open Full KDS Display
          </button>
        </div>

        {/* Kitchen KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Active KOT Tickets</span>
            <div className="text-2xl font-black font-mono text-white">3 Tickets</div>
            <div className="text-[11px] text-slate-400">1 New, 1 In Prep, 1 Ready</div>
          </div>

          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Avg Ticket Time</span>
            <div className="text-2xl font-black font-mono text-emerald-400">14.2 mins</div>
            <div className="text-[11px] text-slate-400">Goal: Under 18 mins</div>
          </div>

          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Urgent Dish Alert</span>
            <div className="text-2xl font-black font-mono text-amber-400">Butter Chicken</div>
            <div className="text-[11px] text-amber-300">Table T01 regular handi waiting</div>
          </div>

          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Recipe Drift Flag</span>
            <div className="text-2xl font-black font-mono text-rose-400">+25.3%</div>
            <div className="text-[11px] text-rose-300">Chicken portioning running +35g heavy</div>
          </div>
        </div>

        {/* Kitchen Shortcuts */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Kitchen Action Shortcuts
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onNavigateTab('kitchen')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-orange-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Flame className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-orange-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-orange-300">Live KDS Display</div>
                <div className="text-[10px] text-slate-400">Advance ticket status & mark food ready</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('wastage')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Trash2 className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-rose-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-rose-300">Log Kitchen Wastage</div>
                <div className="text-[10px] text-slate-400">Record burned, spoiled, or misfired items</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('menu')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-300">Recipe BOM Standards</div>
                <div className="text-[10px] text-slate-400">Inspect exact grammage & ingredient proportions</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 6. INVENTORY MANAGER DASHBOARD
  if (role === 'INVENTORY_MANAGER') {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-400" />
                Inventory & Supply Chain Dashboard
              </h2>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                Ledger Balanced
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Welcome, {user?.name}. Monitor raw materials, expiry tracking, incoming supplier deliveries, and stock adjustments.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('inventory')}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Package className="w-4 h-4" />
            Stock Ledger & SKUs
          </button>
        </div>

        {/* Inventory KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Critical Low Stock</span>
            <div className="text-2xl font-black font-mono text-rose-400">2 Items</div>
            <div className="text-[11px] text-rose-300">Tomatoes (6.2 kg), Chicken (14.5 kg)</div>
          </div>

          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Batches Expiring &lt;48h</span>
            <div className="text-2xl font-black font-mono text-amber-400">2 Batches</div>
            <div className="text-[11px] text-slate-400">Fresh Coriander & Farm Plum Tomatoes</div>
          </div>

          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Inbound Purchase POs</span>
            <div className="text-2xl font-black font-mono text-emerald-400">PO-2026-005</div>
            <div className="text-[11px] text-emerald-300">₹9,800 delivery scheduled tomorrow 7 AM</div>
          </div>

          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Today's Wastage Loss</span>
            <div className="text-2xl font-black font-mono text-purple-400">₹612</div>
            <div className="text-[11px] text-slate-400">3kg bruised tomatoes, 2.1kg grill burn</div>
          </div>
        </div>

        {/* Inventory Shortcuts */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Kirana & Inventory Operational Shortcuts
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              onClick={() => onNavigateTab('inventory')}
              className="p-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 hover:border-amber-400 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Scan className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-300">Kirana Barcode Scanner</div>
                <div className="text-[10px] text-slate-400">Scan camera, USB laser gun, or presets</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('inventory')}
              className="p-4 rounded-2xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/30 hover:border-purple-400 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-purple-300">AI Invoice & Voice Reader</div>
                <div className="text-[10px] text-slate-400">Gemini extracts line items from Mandi bills</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('inventory')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <Package className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-teal-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-teal-300">Stock Count & Adjust</div>
                <div className="text-[10px] text-slate-400">Perform physical reconciliation audits</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('purchases')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-blue-300">Receive Vendor Delivery</div>
                <div className="text-[10px] text-slate-400">Check in PO and auto-increment stock ledger</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('forecast')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-300">Anti-Overstock "Don't Buy"</div>
                <div className="text-[10px] text-slate-400">Prevent over-ordering perishable items</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('wastage')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Trash2 className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-rose-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-rose-300">Log Wastage Incident</div>
                <div className="text-[10px] text-slate-400">Record spoiled batch with loss cost impact</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 7. ACCOUNTANT DASHBOARD
  if (role === 'ACCOUNTANT') {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Calculator className="w-5 h-5 text-violet-400" />
                Chartered Accountant & Tax Compliance Dashboard
              </h2>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                GSTIN: {restaurant?.gstin || '07AABCT2345A1Z5'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Welcome, {user?.name}. Monitor GST liability breakdown, recipe food cost contribution margins, and financial audit logs.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('orders')}
            className="px-4 py-2 bg-violet-500 hover:bg-violet-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            Tax Invoices & Billing
          </button>
        </div>

        {/* Accountant KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Today's CGST + SGST</span>
            <div className="text-2xl font-black font-mono text-emerald-400">₹2,432.50</div>
            <div className="text-[11px] text-slate-400">CGST (2.5%): ₹1,216.25 · SGST: ₹1,216.25</div>
          </div>

          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Gross Food Margin</span>
            <div className="text-2xl font-black font-mono text-amber-400">68.2%</div>
            <div className="text-[11px] text-slate-400">Actual food cost: 31.8%</div>
          </div>

          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Service Charge Collected</span>
            <div className="text-2xl font-black font-mono text-blue-400">₹2,432.50</div>
            <div className="text-[11px] text-slate-400">Discretionary 5% staff pool</div>
          </div>

          <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-750 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Discounts / Voids</span>
            <div className="text-2xl font-black font-mono text-purple-400">₹245.00</div>
            <div className="text-[11px] text-slate-400">10% Corporate partner card logged</div>
          </div>
        </div>

        {/* Accountant Shortcuts */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Financial & Tax Compliance Actions
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onNavigateTab('orders')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-violet-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Receipt className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-violet-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-violet-300">Invoice Registry</div>
                <div className="text-[10px] text-slate-400">Audit settled bills, refunds, and discounts</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('profit')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-emerald-300">Dish Margin Engineering</div>
                <div className="text-[10px] text-slate-400">Inspect recipe contribution margins & food costs</div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('settings')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 transition-all text-left group cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Shield className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-300">Statutory Audit Logs</div>
                <div className="text-[10px] text-slate-400">Review forensic trail for refunds, voids & access</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback default
  return (
    <ExecutiveDashboardView
      onNavigateTab={onNavigateTab}
      onOpenCopilot={onOpenCopilot}
    />
  );
};
