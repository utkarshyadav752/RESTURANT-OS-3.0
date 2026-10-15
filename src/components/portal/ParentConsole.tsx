import React, { useState } from 'react';
import {
  Shield,
  Smartphone,
  Check,
  X,
  Plus,
  Sparkles,
  Download,
  Mail,
  User,
  Users,
  Settings,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Lock,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { ChildProfile, ParentProfile, ExpenseRequest } from '../../types/pocketFund.ts';
import { quotes } from '../../data/pocketFundSeed.ts';

interface ParentConsoleProps {
  parent: ParentProfile;
  childrenList: ChildProfile[];
  activeChildId: string;
  onSelectChild: (id: string) => void;
  onApproveRequest: (req: ExpenseRequest) => void;
  onDeclineRequest: (reqId: string, childId: string) => void;
  onSendInstantMoney: (childId: string, amount: number) => void;
  onSignOut: () => void;
  onOpenAIAdvisor: () => void;
  onResetDemo: () => void;
  showToast: (msg: string) => void;
}

export const ParentConsole: React.FC<ParentConsoleProps> = ({
  parent,
  childrenList,
  activeChildId,
  onSelectChild,
  onApproveRequest,
  onDeclineRequest,
  onSendInstantMoney,
  onSignOut,
  onOpenAIAdvisor,
  onResetDemo,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'insights' | 'family' | 'settings'>('overview');
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [requestFilter, setRequestFilter] = useState<string>('all');
  const [aiCustomInput, setAiCustomInput] = useState('');
  const [aiResponse, setAiResponse] = useState<string>(
    'Aarav has saved consistently. Consider moving ₹100 from food to their primary savings goal this week.'
  );
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Settings switches
  const [settingsState, setSettingsState] = useState({
    requireCategory: true,
    instantAlerts: true,
    weekendLock: false,
    mccStrict: true,
  });

  // Top-up modal state
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('250');

  // Add child modal state
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState(13);
  const [newChildAllowance, setNewChildAllowance] = useState('1200');

  const activeChild = childrenList.find((c) => c.id === activeChildId) || childrenList[0];
  const allRequests = childrenList.flatMap((c) => c.requests);
  const filteredRequests =
    requestFilter === 'all' ? allRequests : allRequests.filter((r) => r.childId === requestFilter);

  const spentPct = Math.min(100, Math.round((activeChild.spent / activeChild.allowance) * 100));
  const mainGoal = activeChild.goals[0] || { name: 'Savings Goal', icon: '🎯', current: activeChild.saved, target: 1500 };
  const goalPct = Math.min(100, Math.round((mainGoal.current / mainGoal.target) * 100));

  const handleNextQuote = () => {
    setQuoteIdx((prev) => (prev + 1) % quotes.length);
  };

  const handleAiAsk = (prompt?: string) => {
    const text = prompt || aiCustomInput;
    if (!text.trim()) return;

    setIsAiLoading(true);
    setTimeout(() => {
      setIsAiLoading(false);
      setAiCustomInput('');
      const lower = text.toLowerCase();
      if (lower.includes('audit')) {
        setAiResponse(
          `📊 Spending Audit for ${activeChild.name}: Used ₹${activeChild.spent}/₹${activeChild.allowance} (${spentPct}%). Food & dining is at ₹${activeChild.foodSpent}/₹${activeChild.foodLimit}. Recommendation: Maintain the current pace and praise their streak!`
        );
      } else if (lower.includes('goal')) {
        setAiResponse(
          `🎯 Goal Acceleration: ${activeChild.name} is ₹${Math.max(0, mainGoal.target - mainGoal.current)} away from "${mainGoal.name}". Consider a 1-to-1 match bonus for their next milestone!`
        );
      } else {
        setAiResponse(
          `✦ Family AI Advice: Guiding teen spending through structured weekly checkpoints prevents end-of-month budget depletion while fostering autonomy.`
        );
      }
      showToast('AI financial coach updated for your family.');
    }, 400);
  };

  const handleDownloadReport = () => {
    const childSummaries = childrenList
      .map(
        (c) =>
          `• Child Name        : ${c.name} (Age ${c.age})\n• Monthly Allowance : ₹${c.allowance.toLocaleString('en-IN')}\n• Total Spent       : ₹${c.spent.toLocaleString('en-IN')} (${Math.round((c.spent / c.allowance) * 100)}%)\n• Total Saved       : ₹${c.saved.toLocaleString('en-IN')}\n• Available Balance : ₹${c.balance.toLocaleString('en-IN')}\n• Habit Streak      : ${c.streakDays} days\n• Main Goal         : ${c.goals[0]?.name || 'Savings'} (₹${c.goals[0]?.current || c.saved} / ₹${c.goals[0]?.target || 1000})`
      )
      .join('\n-----------------------------------------------------\n');

    const reportText = `=====================================================
POCKET FUND — MULTI-CHILD FAMILY REPORT
Parent / Guardian : ${parent.name}
Total Children    : ${childrenList.length}
=====================================================
1. CHILDREN ACCOUNT SUMMARIES
-----------------------------------------------------
${childSummaries}
=====================================================
2. AI FAMILY COACH OBSERVATION
-----------------------------------------------------
${aiResponse}
=====================================================
Pocket Fund — Money skills start here.
Parent-authorized companion profiles enabled through RBI PPI partners.
Customer Support Desk: support@pocketfund.in
=====================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pocket-fund-family-report-${activeChild.name.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Full family report downloaded for ${childrenList.length} children.`);
  };

  return (
    <div className="min-h-screen bg-[#05111d] text-[#c2d5e3] flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#05111d]/95 backdrop-blur-md border-b border-[#133350] px-4 sm:px-6 py-2.5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 font-black text-lg text-[#dbeaf5] cursor-pointer hover:opacity-90"
          >
            <span className="w-8 h-8 rounded-lg bg-teal-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-teal-500/20">
              ₹
            </span>
            <span>Pocket Fund</span>
          </button>
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 flex items-center gap-1">
            <Shield className="w-3 h-3" /> PARENT CONSOLE
          </span>
        </div>

        {/* Managing Child Pill Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-[#081a2b] border border-[#153a5c] rounded-xl text-xs">
          <span className="text-[10px] font-mono text-[#799ab2] font-semibold uppercase px-2">
            CHILD:
          </span>
          {childrenList.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onSelectChild(c.id);
                showToast(`Viewing ${c.name}'s account.`);
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                c.id === activeChild.id
                  ? 'bg-teal-500/20 border border-teal-400 text-teal-300 font-bold'
                  : 'text-[#8daec7] hover:text-white'
              }`}
            >
              <span>{c.avatar}</span>
              <span>{c.name}</span>
              <span className="text-[10px] opacity-70 font-mono">({c.age}y)</span>
            </button>
          ))}
          <button
            onClick={() => setShowAddChildModal(true)}
            className="px-2 py-1 text-teal-400 hover:text-teal-300 font-semibold cursor-pointer border border-dashed border-teal-500/40 rounded-lg text-xs"
            title="Enroll another child"
          >
            + Add
          </button>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-2.5">
          {allRequests.length > 0 && (
            <button
              onClick={() => setActiveTab('requests')}
              className="text-xs font-semibold px-2.5 py-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" /> {allRequests.length} Pending
            </button>
          )}

          <div className="flex items-center gap-2 px-2.5 py-1 bg-[#092136] border border-[#164064] rounded-lg text-xs">
            <span>{parent.avatar}</span>
            <div className="leading-tight text-left hidden sm:block">
              <div className="font-bold text-white text-[11px]">{parent.name}</div>
              <div className="text-[9px] text-[#799ab2]">Guardian Account</div>
            </div>
          </div>

          <button
            onClick={onResetDemo}
            className="px-2.5 py-1.5 bg-[#092238] hover:bg-[#103454] border border-[#163f68] text-xs text-[#8daec7] rounded-lg cursor-pointer"
            title="Reset demo data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onSignOut}
            className="px-3 py-1.5 bg-[#0f3a58] hover:bg-[#154a70] border border-[#1e5a88] text-sky-300 font-semibold rounded-lg text-xs cursor-pointer flex items-center gap-1"
          >
            ← Exit
          </button>
        </div>
      </header>

      {/* Main Layout: Sidebar Nav + Workspace */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sub-Nav */}
        <aside className="w-full md:w-60 bg-[#051423] border-r border-[#123657] p-4 flex flex-col justify-between">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-teal-400 text-slate-950 font-extrabold shadow-md shadow-teal-500/20'
                  : 'text-[#8daec7] hover:bg-[#081f33] hover:text-white'
              }`}
            >
              <span>▦</span> Overview
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-teal-400 text-slate-950 font-extrabold shadow-md shadow-teal-500/20'
                  : 'text-[#8daec7] hover:bg-[#081f33] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span>📩</span> Requests
              </div>
              {allRequests.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  activeTab === 'requests' ? 'bg-slate-950 text-teal-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {allRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'insights'
                  ? 'bg-teal-400 text-slate-950 font-extrabold shadow-md shadow-teal-500/20'
                  : 'text-[#8daec7] hover:bg-[#081f33] hover:text-white'
              }`}
            >
              <span>💡</span> Insights & AI
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'family'
                  ? 'bg-teal-400 text-slate-950 font-extrabold shadow-md shadow-teal-500/20'
                  : 'text-[#8daec7] hover:bg-[#081f33] hover:text-white'
              }`}
            >
              <span>👥</span> Family Accounts ({childrenList.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-teal-400 text-slate-950 font-extrabold shadow-md shadow-teal-500/20'
                  : 'text-[#8daec7] hover:bg-[#081f33] hover:text-white'
              }`}
            >
              <span>⚙️</span> Safety Guardrails
            </button>
          </div>

          <div className="pt-4 mt-6 border-t border-[#123657] text-xs">
            <div className="p-3 bg-[#081d30] border border-[#163f68] rounded-xl space-y-2">
              <div className="text-[10px] font-mono text-teal-400 font-bold uppercase">
                ✦ AI Quick Coach
              </div>
              <p className="text-[11px] text-[#8daec7] leading-relaxed">
                Need advice on allowances or chores?
              </p>
              <button
                onClick={onOpenAIAdvisor}
                className="w-full py-1.5 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Ask Pocket Fund AI →
              </button>
            </div>
          </div>
        </aside>

        {/* Main Work Area */}
        <main className="flex-1 p-5 sm:p-8 overflow-y-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-teal-400 font-bold">
                    PARENT COMMAND CENTER
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#dbeaf5] tracking-tight">
                    {activeChild.avatar} {activeChild.name}’s Dashboard
                  </h1>
                  <p className="text-xs text-[#799ab2] mt-0.5">
                    Managing monthly allowance, independent category limits, and milestone savings.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTopupModal(true)}
                    className="px-4 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer transition-all shadow-md shadow-teal-500/20 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Instant Top-up
                  </button>
                </div>
              </div>

              {/* KPI Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 bg-[#081d30] border border-[#153e63] rounded-xl">
                  <div className="text-[11px] uppercase font-mono text-[#799ab2]">Monthly Allowance</div>
                  <div className="text-2xl font-black text-white mt-1">₹{activeChild.allowance}</div>
                  <div className="text-[10px] text-teal-300 mt-1 flex items-center gap-1">
                    ✓ Next deposit: 1st Nov
                  </div>
                </div>

                <div className="p-4 bg-[#081d30] border border-[#153e63] rounded-xl">
                  <div className="text-[11px] uppercase font-mono text-[#799ab2]">Total Spent</div>
                  <div className="text-2xl font-black text-amber-300 mt-1">₹{activeChild.spent}</div>
                  <div className="text-[10px] text-[#799ab2] mt-1">{spentPct}% of monthly quota</div>
                </div>

                <div className="p-4 bg-[#081d30] border border-[#153e63] rounded-xl">
                  <div className="text-[11px] uppercase font-mono text-[#799ab2]">Saved in Goals</div>
                  <div className="text-2xl font-black text-teal-300 mt-1">₹{activeChild.saved}</div>
                  <div className="text-[10px] text-teal-400 mt-1">{activeChild.streakDays} days savings streak</div>
                </div>

                <div className="p-4 bg-[#081d30] border border-[#153e63] rounded-xl">
                  <div className="text-[11px] uppercase font-mono text-[#799ab2]">Available Balance</div>
                  <div className="text-2xl font-black text-sky-300 mt-1">₹{activeChild.balance}</div>
                  <div className="text-[10px] text-sky-400 mt-1">Companion wallet active</div>
                </div>
              </div>

              {/* Two Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Budgets */}
                <div className="p-5 bg-[#081d30] border border-[#153e63] rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Category Guardrails</h3>
                      <p className="text-[11px] text-[#799ab2]">Enforced caps on teen's daily & monthly spending</p>
                    </div>
                    <span className="text-[10px] font-mono text-teal-300 font-bold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                      STRICT CAPS
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <div className="flex justify-between text-[#8daec7] mb-1.5">
                        <span className="font-semibold text-white">🍔 Food & School Canteen</span>
                        <span className="font-mono">₹{activeChild.foodSpent} / ₹{activeChild.foodLimit}</span>
                      </div>
                      <div className="w-full h-2 bg-[#05121e] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-400"
                          style={{ width: `${Math.min(100, (activeChild.foodSpent / activeChild.foodLimit) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[#8daec7] mb-1.5">
                        <span className="font-semibold text-white">🚌 Transport & Commute</span>
                        <span className="font-mono">₹{activeChild.transportSpent} / ₹{activeChild.transportLimit}</span>
                      </div>
                      <div className="w-full h-2 bg-[#05121e] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-400"
                          style={{ width: `${Math.min(100, (activeChild.transportSpent / activeChild.transportLimit) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {activeChild.budgets.map((b) => (
                      <div key={b.id}>
                        <div className="flex justify-between text-[#8daec7] mb-1.5">
                          <span className="font-semibold text-white">{b.icon} {b.name}</span>
                          <span className="font-mono">₹{b.spent} / ₹{b.limit}</span>
                        </div>
                        <div className="w-full h-2 bg-[#05121e] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-400"
                            style={{ width: `${Math.min(100, (b.spent / b.limit) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Savings Goal & Daily Quote */}
                <div className="space-y-4">
                  {/* Goal Card */}
                  <div className="p-5 bg-[#081d30] border border-[#153e63] rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-white">{activeChild.name}’s Target Goal</h3>
                      <span className="text-xs font-mono font-bold text-teal-300">{goalPct}% Complete</span>
                    </div>

                    <div className="flex items-center gap-3.5 p-3.5 bg-[#051423] border border-[#133758] rounded-xl mb-3">
                      <span className="text-3xl">{mainGoal.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-white text-sm">{mainGoal.name}</div>
                        <div className="text-xs text-[#799ab2] font-mono">
                          ₹{mainGoal.current.toLocaleString('en-IN')} of ₹{mainGoal.target.toLocaleString('en-IN')}
                        </div>
                        <div className="w-full h-2 bg-[#081c2d] rounded-full overflow-hidden mt-2">
                          <div className="h-full bg-teal-400" style={{ width: `${goalPct}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#799ab2] mb-3">
                      Matching bonus: Parents who match the final 20% increase goal completion by 3.4x.
                    </div>
                  </div>

                  {/* Daily Money Reflection */}
                  <div className="p-4 bg-[#081d30] border border-[#153e63] rounded-2xl">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold block mb-1">
                      DAILY FINANCIAL WISDOM
                    </span>
                    <blockquote className="text-xs italic text-[#d5e5f2] leading-relaxed">
                      "{quotes[quoteIdx][0]}"
                    </blockquote>
                    <div className="text-[10px] text-[#799ab2] mt-1.5 flex justify-between items-center">
                      <span>{quotes[quoteIdx][1]}</span>
                      <button
                        onClick={handleNextQuote}
                        className="text-teal-400 hover:text-teal-300 text-[10px] font-semibold cursor-pointer"
                      >
                        Next ↻
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Requests Preview */}
              <div className="p-5 bg-[#081d30] border border-[#153e63] rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Pending Requests ({allRequests.length})</h3>
                    <p className="text-[11px] text-[#799ab2]">Discretionary purchases requiring parent approval</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className="text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
                  >
                    View All →
                  </button>
                </div>

                {allRequests.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#799ab2]">
                    🎉 No pending requests right now. Everything is up to date!
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {allRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3.5 bg-[#051423] border border-[#153e63] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{req.icon}</span>
                          <div>
                            <div className="font-bold text-white text-xs">{req.title}</div>
                            <div className="text-[11px] text-[#799ab2]">
                              <span className="text-teal-300 font-semibold">{req.who}</span> · ₹{req.amount} · "{req.desc}"
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onApproveRequest(req)}
                            className="px-3 py-1.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve UPI
                          </button>
                          <button
                            onClick={() => onDeclineRequest(req.id, req.childId)}
                            className="px-2.5 py-1.5 bg-[#092238] hover:bg-[#10304c] text-[#8daec7] hover:text-rose-400 rounded-lg text-xs cursor-pointer border border-[#143a5c]"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#dbeaf5]">
                    Allowance & Expense Requests
                  </h1>
                  <p className="text-xs text-[#799ab2]">
                    Review out-of-budget purchases and release companion funds with 1-tap UPI.
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="flex gap-1.5 p-1 bg-[#051321] border border-[#153a5c] rounded-xl text-xs">
                  <button
                    onClick={() => setRequestFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      requestFilter === 'all'
                        ? 'bg-teal-400 text-slate-950 font-bold'
                        : 'text-[#8daec7] hover:text-white'
                    }`}
                  >
                    All ({allRequests.length})
                  </button>
                  {childrenList.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setRequestFilter(c.id)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                        requestFilter === c.id
                          ? 'bg-teal-400 text-slate-950 font-bold'
                          : 'text-[#8daec7] hover:text-white'
                      }`}
                    >
                      {c.name} ({c.requests.length})
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-[#081d30] border border-[#153e63] rounded-2xl">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12 text-[#799ab2] text-xs">
                    No requests found under this filter. All caught up!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 bg-[#051423] border border-[#153e63] rounded-xl flex flex-wrap items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{req.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm">{req.title}</h4>
                              <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono text-[10px] font-bold">
                                {req.who}
                              </span>
                            </div>
                            <p className="text-xs text-[#8daec7] mt-0.5">
                              Requested {req.when} · ₹{req.amount} · Purpose: "{req.desc}"
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2.5">
                          <button
                            onClick={() => onApproveRequest(req)}
                            className="px-4 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer transition-all shadow-md shadow-teal-500/20 flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" /> Approve UPI
                          </button>
                          <button
                            onClick={() => onDeclineRequest(req.id, req.childId)}
                            className="px-3 py-2 bg-[#092238] hover:bg-[#10304c] text-[#8daec7] hover:text-rose-400 rounded-xl text-xs cursor-pointer border border-[#143a5c]"
                          >
                            <X className="w-4 h-4" /> Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INSIGHTS & AI */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-[#dbeaf5]">
                  Family Financial Insights & AI Coach
                </h1>
                <p className="text-xs text-[#799ab2]">
                  Personalized habit diagnostics and monthly family expenditure statements.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Coach Box */}
                <div className="p-5 bg-[#081d30] border border-[#153e63] rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-400" /> Pocket Fund Family AI Coach
                    </h3>
                    <span className="text-[10px] font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 font-bold">
                      FOCUSED ON {activeChild.name.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-[#8daec7]">
                    Ask anything about Indian teen allowance benchmarks, reducing friction, or compare habits across children:
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      `Audit ${activeChild.name}'s spending habits`,
                      `How to speed up ${activeChild.name}'s savings goal?`,
                      'Compare spending across all my children',
                      'Chores vs allowance best practices',
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAiAsk(chip)}
                        className="px-2.5 py-1 rounded-full bg-[#051423] hover:bg-[#0a2742] border border-[#143758] text-[11px] text-[#93b7d1] hover:text-white cursor-pointer transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <div className="p-3.5 bg-[#051423] border border-[#14395b] rounded-xl text-xs leading-relaxed text-[#dbeaf5]">
                    {isAiLoading ? (
                      <div className="flex items-center gap-2 text-teal-400">
                        <span className="animate-spin">✦</span> Formulating guidance...
                      </div>
                    ) : (
                      aiResponse
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiCustomInput}
                      onChange={(e) => setAiCustomInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()}
                      placeholder={`Ask a question about ${activeChild.name}...`}
                      className="flex-1 px-3 py-2 bg-[#051321] border border-[#173e63] rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-teal-400"
                    />
                    <button
                      onClick={() => handleAiAsk()}
                      className="px-4 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Ask AI
                    </button>
                  </div>
                </div>

                {/* Family Statement Box */}
                <div className="p-5 bg-[#081d30] border border-[#153e63] rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Monthly Family Statement</h3>
                    <p className="text-xs text-[#799ab2] mt-1">
                      Consolidated overview across all {childrenList.length} enrolled companion accounts.
                    </p>

                    <div className="p-4 bg-[#051423] border border-[#143758] rounded-xl my-4 space-y-2.5 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-[#799ab2]">Enrolled Children:</span>
                        <span className="font-bold text-white">{childrenList.length} Accounts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#799ab2]">Total Monthly Allocation:</span>
                        <span className="font-bold text-teal-300">
                          ₹{childrenList.reduce((acc, c) => acc + c.allowance, 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#799ab2]">Total Saved in Goals:</span>
                        <span className="font-bold text-sky-300">
                          ₹{childrenList.reduce((acc, c) => acc + c.saved, 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#799ab2]">Pending Requests:</span>
                        <span className="font-bold text-amber-300">{allRequests.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadReport}
                      className="flex-1 py-2.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20"
                    >
                      <Download className="w-3.5 h-3.5" /> Download .txt Report
                    </button>
                    <button
                      onClick={() => showToast(`Report emailed to ${parent.email}.`)}
                      className="flex-1 py-2.5 bg-[#092238] hover:bg-[#103454] border border-[#163f68] text-teal-300 font-semibold rounded-xl text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FAMILY PROFILES */}
          {activeTab === 'family' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#dbeaf5]">Family Profiles</h1>
                  <p className="text-xs text-[#799ab2]">
                    Each teenager receives their own unique Gmail login & independent password.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddChildModal(true)}
                  className="px-4 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-md shadow-teal-500/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Enroll Another Child
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {childrenList.map((child) => (
                  <div
                    key={child.id}
                    className={`p-5 bg-[#081d30] border rounded-2xl transition-all space-y-4 ${
                      child.id === activeChild.id ? 'border-teal-400 shadow-lg shadow-teal-500/10' : 'border-[#153e63]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{child.avatar}</span>
                        <div>
                          <h3 className="font-bold text-white text-base">{child.name}</h3>
                          <span className="text-xs text-[#799ab2] font-mono">
                            {child.grade} · Age {child.age}
                          </span>
                        </div>
                      </div>
                      {child.id === activeChild.id && (
                        <span className="text-[10px] font-mono bg-teal-400 text-slate-950 px-2 py-0.5 rounded font-extrabold">
                          ACTIVE VIEW
                        </span>
                      )}
                    </div>

                    <div className="p-3 bg-[#051423] border border-[#143b5e] rounded-xl text-xs space-y-1.5 font-mono">
                      <div className="text-[10px] uppercase font-bold text-teal-400">
                        Student Companion Login
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#799ab2]">Gmail:</span>
                        <span className="text-sky-300 font-semibold">{child.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#799ab2]">Password:</span>
                        <span className="text-white font-semibold">{child.password}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-center">
                      <div className="p-2 bg-[#051423] rounded-lg">
                        <div className="text-[10px] text-[#799ab2]">Monthly</div>
                        <div className="font-extrabold text-white">₹{child.allowance}</div>
                      </div>
                      <div className="p-2 bg-[#051423] rounded-lg">
                        <div className="text-[10px] text-[#799ab2]">Balance</div>
                        <div className="font-extrabold text-teal-300">₹{child.balance}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSelectChild(child.id);
                        setActiveTab('overview');
                        showToast(`Now managing ${child.name}'s account.`);
                      }}
                      className="w-full py-2 bg-[#092238] hover:bg-[#11375a] border border-[#173e63] text-teal-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      {child.id === activeChild.id ? '✓ Current View' : `Switch to ${child.name}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h1 className="text-2xl font-extrabold text-[#dbeaf5]">
                  Safety Controls & Guardrails
                </h1>
                <p className="text-xs text-[#799ab2]">
                  Configure global restrictions enforced by our RBI-compliant partner rails.
                </p>
              </div>

              <div className="p-5 bg-[#081d30] border border-[#153e63] rounded-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#143758]">
                  <div>
                    <div className="font-bold text-white text-xs">Require purchase category note</div>
                    <div className="text-[11px] text-[#799ab2]">
                      Teenagers must specify a spending reason before wallet approval
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsState.requireCategory}
                    onChange={(e) =>
                      setSettingsState((prev) => ({ ...prev, requireCategory: e.target.checked }))
                    }
                    className="w-4 h-4 accent-teal-400 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-[#143758]">
                  <div>
                    <div className="font-bold text-white text-xs">Instant WhatsApp & SMS Spending Alerts</div>
                    <div className="text-[11px] text-[#799ab2]">
                      Receive immediate notifications whenever a card or UPI payment is made
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsState.instantAlerts}
                    onChange={(e) =>
                      setSettingsState((prev) => ({ ...prev, instantAlerts: e.target.checked }))
                    }
                    className="w-4 h-4 accent-teal-400 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-[#143758]">
                  <div>
                    <div className="font-bold text-white text-xs">Weekend Outing Limit Lock</div>
                    <div className="text-[11px] text-[#799ab2]">
                      Caps canteen and dining expenses to ₹150 on Saturdays & Sundays
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsState.weekendLock}
                    onChange={(e) =>
                      setSettingsState((prev) => ({ ...prev, weekendLock: e.target.checked }))
                    }
                    className="w-4 h-4 accent-teal-400 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs">Strict Merchant Category Code (MCC) Blocking</div>
                    <div className="text-[11px] text-[#799ab2]">
                      Betting, liquor, adult services, and unauthorized gaming tokens permanently declined
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-teal-400 font-bold">100% LOCKED</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Top-up Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#071d31] border border-[#16426a] rounded-2xl p-6 text-[#c2d5e3] shadow-2xl">
            <h3 className="text-lg font-extrabold text-white mb-1">
              Top-up {activeChild.name}’s Wallet
            </h3>
            <p className="text-xs text-[#799ab2] mb-4">
              Funds are instantly available on their virtual RuPay companion card.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono uppercase text-[#799ab2] block mb-1">
                  Amount (₹)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {['100', '250', '500'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopupAmount(amt)}
                      className={`py-1.5 text-xs font-bold rounded border cursor-pointer ${
                        topupAmount === amt
                          ? 'bg-teal-400 text-slate-950 border-teal-400'
                          : 'bg-[#051423] text-slate-300 border-[#153c5f]'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-[#051321] border border-[#173e63] rounded-lg text-white text-xs font-mono focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopupModal(false)}
                  className="flex-1 py-2 bg-[#092238] border border-[#153e63] rounded-xl text-xs font-semibold text-[#8daec7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const amt = Number(topupAmount) || 200;
                    onSendInstantMoney(activeChild.id, amt);
                    setShowTopupModal(false);
                  }}
                  className="flex-1 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer shadow-md shadow-teal-500/20"
                >
                  Confirm & Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Child Modal */}
      {showAddChildModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#071d31] border border-[#16426a] rounded-2xl p-6 text-[#c2d5e3] shadow-2xl">
            <h3 className="text-lg font-extrabold text-white mb-1">
              Enroll Child Profile
            </h3>
            <p className="text-xs text-[#799ab2] mb-4">
              Add a companion account with independent limits and dedicated Gmail login.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-mono uppercase text-[#799ab2] block mb-1">
                  Child's Name
                </label>
                <input
                  type="text"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="e.g. Rohan"
                  className="w-full px-3 py-2 bg-[#051321] border border-[#173e63] rounded-lg text-white focus:outline-none focus:border-teal-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#799ab2] block mb-1">
                    Age
                  </label>
                  <select
                    value={newChildAge}
                    onChange={(e) => setNewChildAge(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#051321] border border-[#173e63] rounded-lg text-white focus:outline-none focus:border-teal-400"
                  >
                    {[11, 12, 13, 14, 15, 16, 17].map((a) => (
                      <option key={a} value={a}>{a} yrs</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#799ab2] block mb-1">
                    Allowance (₹)
                  </label>
                  <input
                    type="number"
                    value={newChildAllowance}
                    onChange={(e) => setNewChildAllowance(e.target.value)}
                    className="w-full px-3 py-2 bg-[#051321] border border-[#173e63] rounded-lg text-white font-mono focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddChildModal(false)}
                  className="flex-1 py-2 bg-[#092238] border border-[#153e63] rounded-xl text-xs font-semibold text-[#8daec7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newChildName.trim()) {
                      showToast('Please enter child’s name');
                      return;
                    }
                    showToast(`Enrolled ${newChildName} into family console!`);
                    setShowAddChildModal(false);
                    setNewChildName('');
                  }}
                  className="flex-1 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer shadow-md shadow-teal-500/20"
                >
                  Enroll Child
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
