import React, { useState } from 'react';
import { Shield, Smartphone, Check, X, ArrowUpRight, Plus, Sparkles, CreditCard, Clock } from 'lucide-react';
import { ChildProfile, ExpenseRequest } from '../../types/pocketFund.ts';

interface InteractiveSandboxProps {
  childrenList: ChildProfile[];
  onOpenPilot: () => void;
  onOpenLogin: (role: 'parent' | 'student') => void;
  showToast: (msg: string) => void;
}

export const InteractiveSandbox: React.FC<InteractiveSandboxProps> = ({
  childrenList: initialList,
  onOpenPilot,
  onOpenLogin,
  showToast,
}) => {
  const [childrenList, setChildrenList] = useState<ChildProfile[]>(initialList);
  const [mode, setMode] = useState<'parent' | 'teen'>('parent');
  const [activeChildId, setActiveChildId] = useState<string>('child-1');
  const [quickTopupAmt, setQuickTopupAmt] = useState<number>(200);

  const activeChild = childrenList.find((c) => c.id === activeChildId) || childrenList[0];

  const handleApproveRequest = (req: ExpenseRequest) => {
    setChildrenList((prev) =>
      prev.map((c) => {
        if (c.id === req.childId) {
          const newSpent = c.spent + req.amount;
          const newBalance = Math.max(0, c.balance - req.amount);
          return {
            ...c,
            spent: newSpent,
            balance: newBalance,
            requests: c.requests.filter((r) => r.id !== req.id),
            walletHistory: [`✓ Approved ₹${req.amount} for ${req.title} · Just now`, ...c.walletHistory],
          };
        }
        return c;
      })
    );
    showToast(`Approved ₹${req.amount} via UPI for ${req.who}'s ${req.title}!`);
  };

  const handleDeclineRequest = (reqId: string, who: string) => {
    setChildrenList((prev) =>
      prev.map((c) => ({
        ...c,
        requests: c.requests.filter((r) => r.id !== reqId),
      }))
    );
    showToast(`Declined request from ${who}.`);
  };

  const handleSendInstantTopup = () => {
    setChildrenList((prev) =>
      prev.map((c) => {
        if (c.id === activeChildId) {
          return {
            ...c,
            balance: c.balance + quickTopupAmt,
            walletHistory: [`✓ Parent instant top-up ₹${quickTopupAmt} · Just now`, ...c.walletHistory],
          };
        }
        return c;
      })
    );
    showToast(`Sent ₹${quickTopupAmt} instant UPI allowance to ${activeChild.name}!`);
  };

  const handleDepositToGoal = (goalId: string, amount: number) => {
    if (activeChild.balance < amount) {
      showToast(`Insufficient balance in ${activeChild.name}'s wallet.`);
      return;
    }
    setChildrenList((prev) =>
      prev.map((c) => {
        if (c.id === activeChildId) {
          return {
            ...c,
            balance: c.balance - amount,
            saved: c.saved + amount,
            goals: c.goals.map((g) =>
              g.id === goalId ? { ...g, current: Math.min(g.target, g.current + amount) } : g
            ),
            walletHistory: [`✓ Saved ₹${amount} towards goal · Just now`, ...c.walletHistory],
          };
        }
        return c;
      })
    );
    showToast(`Saved ₹${amount} towards ${activeChild.name}'s goal!`);
  };

  const allRequests = childrenList.flatMap((c) => c.requests);
  const spentPct = Math.min(100, Math.round((activeChild.spent / activeChild.allowance) * 100));
  const mainGoal = activeChild.goals[0] || { name: 'Savings Goal', icon: '🎯', current: activeChild.saved, target: 1500 };
  const goalPct = Math.min(100, Math.round((mainGoal.current / mainGoal.target) * 100));

  return (
    <div className="bg-[#06182a] border border-[#163f68] rounded-2xl shadow-2xl overflow-hidden">
      {/* Sandbox Control Bar */}
      <div className="sandbox-bar flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#071d31] border-b border-[#153e63]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-teal-400 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> LIVE INTERACTIVE SANDBOX
          </span>
        </div>

        {/* Mode Toggles */}
        <div className="flex items-center gap-1 p-1 bg-[#051321] border border-[#143758] rounded-xl">
          <button
            type="button"
            onClick={() => setMode('parent')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'parent'
                ? 'bg-teal-400 text-slate-950 font-extrabold shadow-sm'
                : 'text-[#8daec7] hover:text-[#dbeaf5]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Parent View 👩
          </button>
          <button
            type="button"
            onClick={() => setMode('teen')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'teen'
                ? 'bg-sky-400 text-slate-950 font-extrabold shadow-sm'
                : 'text-[#8daec7] hover:text-[#dbeaf5]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Teen Wallet 🧑
          </button>
        </div>

        {/* Child Selector */}
        <div className="flex items-center gap-1.5 bg-[#051321] border border-[#143758] rounded-xl px-2 py-1">
          <span className="text-[10px] font-mono text-[#799ab2] font-semibold uppercase tracking-wider">
            TEEN:
          </span>
          {childrenList.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveChildId(c.id);
                showToast(`Switched sandbox to ${c.name} (${c.age}y).`);
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                c.id === activeChildId
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                  : 'text-[#8daec7] hover:text-white'
              }`}
            >
              {c.avatar} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sandbox Workspace Content */}
      <div className="p-5 sm:p-7">
        {mode === 'parent' ? (
          /* PARENT MODE WORKSPACE */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Child Allowance & Guardrails */}
            <div className="space-y-4">
              <div className="p-4 bg-[#081d30] border border-[#153e63] rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{activeChild.avatar}</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">{activeChild.name}’s Allowance</h4>
                      <span className="text-[11px] text-[#799ab2] font-mono">{activeChild.grade} · Age {activeChild.age}</span>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                    Auto 1st of Month
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#05121e] rounded-lg border border-[#11314e] text-center my-3">
                  <div>
                    <div className="text-[10px] text-[#799ab2] uppercase font-mono">Monthly</div>
                    <div className="text-sm font-extrabold text-white">₹{activeChild.allowance}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#799ab2] uppercase font-mono">Spent ({spentPct}%)</div>
                    <div className="text-sm font-extrabold text-amber-300">₹{activeChild.spent}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#799ab2] uppercase font-mono">Available</div>
                    <div className="text-sm font-extrabold text-teal-300">₹{activeChild.balance}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[#8daec7]">
                    <span>Monthly Pace</span>
                    <span>₹{activeChild.spent} / ₹{activeChild.allowance}</span>
                  </div>
                  <div className="w-full h-2 bg-[#05121e] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-400 to-amber-400 transition-all duration-300"
                      style={{ width: `${spentPct}%` }}
                    />
                  </div>
                </div>

                {/* Instant Top-up Action */}
                <div className="mt-4 pt-3 border-t border-[#133758]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#799ab2] block mb-2 font-bold">
                    Quick Instant UPI Top-up:
                  </span>
                  <div className="flex gap-2">
                    {[100, 200, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setQuickTopupAmt(amt)}
                        className={`flex-1 py-1 px-2 text-xs rounded border cursor-pointer font-bold transition-all ${
                          quickTopupAmt === amt
                            ? 'bg-teal-400 text-slate-950 border-teal-400'
                            : 'bg-[#051423] text-slate-300 border-[#153c5f] hover:border-teal-400/50'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleSendInstantTopup}
                      className="px-3 py-1 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" /> Send
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Limits */}
              <div className="p-4 bg-[#081d30] border border-[#153e63] rounded-xl">
                <h4 className="font-bold text-white text-xs mb-3 flex items-center justify-between">
                  <span>Category Guardrails for {activeChild.name}</span>
                  <span className="text-[10px] font-mono text-teal-400 font-bold">ENFORCED</span>
                </h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-[#8daec7] mb-1">
                      <span>🍔 Food & Dining</span>
                      <span className="text-white font-semibold">₹{activeChild.foodSpent} / ₹{activeChild.foodLimit}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#05121e] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-400"
                        style={{ width: `${Math.min(100, (activeChild.foodSpent / activeChild.foodLimit) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[#8daec7] mb-1">
                      <span>🚌 Transport & Metro</span>
                      <span className="text-white font-semibold">₹{activeChild.transportSpent} / ₹{activeChild.transportLimit}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#05121e] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-400"
                        style={{ width: `${Math.min(100, (activeChild.transportSpent / activeChild.transportLimit) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Pending Approval Queue */}
            <div className="space-y-4">
              <div className="p-4 bg-[#081d30] border border-[#153e63] rounded-xl h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    Pending Teen Requests
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-500/20 text-amber-300 font-bold">
                      {allRequests.length} Pending
                    </span>
                  </h4>
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[360px]">
                  {allRequests.length === 0 ? (
                    <div className="text-center py-10 text-[#799ab2] text-xs">
                      🎉 All requests reviewed! No pending items right now.
                    </div>
                  ) : (
                    allRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 bg-[#051423] border border-[#153e63] rounded-xl space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{req.icon}</span>
                            <div>
                              <div className="font-bold text-white text-xs">{req.title}</div>
                              <div className="text-[11px] text-[#799ab2]">
                                <span className="text-teal-300 font-semibold">{req.who}</span> · ₹{req.amount} · {req.when}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                            ₹{req.amount}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8daec7] italic">"{req.desc}"</p>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleApproveRequest(req)}
                            className="flex-1 py-1.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve UPI
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineRequest(req.id, req.who)}
                            className="px-3 py-1.5 bg-[#092238] hover:bg-[#10304c] text-[#8daec7] hover:text-rose-400 font-semibold rounded-lg text-xs transition-colors cursor-pointer border border-[#143a5c]"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Column 3: AI Family Coach & Savings Goals */}
            <div className="space-y-4">
              <div className="p-4 bg-[#081d30] border border-[#153e63] rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> POCKET FUND AI COACH
                  </span>
                  <span className="text-[10px] font-mono text-[#799ab2]">{activeChild.streakDays}d Streak</span>
                </div>
                <p className="text-xs text-[#c2d5e3] leading-relaxed mb-3">
                  {activeChild.name} is pacing at {spentPct}% of monthly allowance with ₹{activeChild.saved} saved. Trimming ₹40 weekly from canteen spending will accelerate their "{mainGoal.name}" target by 2 weeks.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenLogin('parent')}
                  className="w-full py-2 bg-[#092238] hover:bg-[#0f3454] border border-teal-500/30 text-teal-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Open Full AI Coach in Parent Console →
                </button>
              </div>

              {/* Goal Progress */}
              <div className="p-4 bg-[#081d30] border border-[#153e63] rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-white text-xs">{activeChild.name}’s Target Goal</h4>
                  <span className="text-xs font-mono font-bold text-teal-300">{goalPct}%</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#051423] rounded-lg border border-[#133758] mb-3">
                  <span className="text-2xl">{mainGoal.icon}</span>
                  <div className="flex-1">
                    <div className="font-bold text-white text-xs">{mainGoal.name}</div>
                    <div className="text-[11px] text-[#799ab2]">₹{mainGoal.current} of ₹{mainGoal.target} target</div>
                    <div className="w-full h-1.5 bg-[#081c2d] rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-teal-400" style={{ width: `${goalPct}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDepositToGoal(mainGoal.id, 50)}
                    className="flex-1 py-1.5 bg-[#092238] hover:bg-[#11375a] border border-[#173e63] rounded text-xs font-semibold text-teal-300 cursor-pointer"
                  >
                    +₹50 Save
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDepositToGoal(mainGoal.id, 100)}
                    className="flex-1 py-1.5 bg-[#092238] hover:bg-[#11375a] border border-[#173e63] rounded text-xs font-semibold text-teal-300 cursor-pointer"
                  >
                    +₹100 Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TEEN MODE WORKSPACE (Simulating Teen Mobile Wallet) */
          <div className="max-w-md mx-auto space-y-4">
            {/* Virtual Student RuPay Card */}
            <div className="relative p-5 rounded-2xl bg-gradient-to-tr from-[#0284c7] via-[#0d9488] to-[#042f2e] text-white shadow-xl overflow-hidden border border-white/20">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-teal-200 block">
                    Pocket Fund Student Companion
                  </span>
                  <span className="font-extrabold text-lg tracking-tight">₹ Student Debit</span>
                </div>
                <div className="px-2 py-1 bg-black/30 rounded text-[11px] font-mono tracking-wider">
                  RuPay Prepaid
                </div>
              </div>

              <div className="font-mono text-base tracking-widest my-2 drop-shadow">
                •••• •••• •••• 4289
              </div>

              <div className="flex justify-between items-end mt-4 pt-2 border-t border-white/10 text-xs">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-teal-100/70">Cardholder</div>
                  <div className="font-bold tracking-wide">{activeChild.name} Sharma</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-teal-100/70">Expires</div>
                  <div className="font-mono font-bold">09/29</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider text-teal-100/70">Balance</div>
                  <div className="font-mono font-extrabold text-sm text-teal-200">₹{activeChild.balance}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions for Teen */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (activeChild.balance < 45) {
                    showToast('Insufficient wallet balance!');
                    return;
                  }
                  setChildrenList((prev) =>
                    prev.map((c) =>
                      c.id === activeChildId
                        ? {
                            ...c,
                            balance: c.balance - 45,
                            spent: c.spent + 45,
                            foodSpent: c.foodSpent + 45,
                            walletHistory: ['✓ Paid ₹45 at Campus Canteen · Just now', ...c.walletHistory],
                          }
                        : c
                    )
                  );
                  showToast(`Paid ₹45 at Canteen. Balance is now ₹${activeChild.balance - 45}.`);
                }}
                className="p-3 bg-[#081d30] hover:bg-[#0d2a45] border border-[#163e63] rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="text-lg mb-1">🍔</div>
                <div className="font-bold text-white text-xs">Pay ₹45 Canteen</div>
                <div className="text-[10px] text-[#799ab2]">Deducts from food limit</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const newReq: ExpenseRequest = {
                    id: `req-${Date.now()}`,
                    title: 'Art Project Supplies',
                    amount: 180,
                    who: activeChild.name,
                    childId: activeChild.id,
                    when: 'Just now',
                    icon: '🎨',
                    desc: 'acrylic paint tubes and Bristol paper',
                  };
                  setChildrenList((prev) =>
                    prev.map((c) => (c.id === activeChildId ? { ...c, requests: [newReq, ...c.requests] } : c))
                  );
                  showToast(`Sent request for ₹180 to parent! Switch to Parent View to approve.`);
                }}
                className="p-3 bg-[#081d30] hover:bg-[#0d2a45] border border-teal-500/30 rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="text-lg mb-1">📩</div>
                <div className="font-bold text-teal-300 text-xs">Request ₹180</div>
                <div className="text-[10px] text-[#799ab2]">Asks Parent for approval</div>
              </button>
            </div>

            {/* Recent Transaction Log */}
            <div className="p-4 bg-[#081d30] border border-[#153e63] rounded-xl">
              <h5 className="font-bold text-white text-xs mb-2.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" /> Recent Wallet History
              </h5>
              <div className="space-y-2 text-xs font-mono">
                {activeChild.walletHistory.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="p-2 bg-[#051423] rounded border border-[#123657] text-[#c2d5e3] text-[11px]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CTA Bar below Sandbox */}
        <div className="mt-6 pt-5 border-t border-[#133758] flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-[#8daec7]">
            💡 This is a live simulation. Authenticate with real credentials or join our early access cohort.
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onOpenLogin('parent')}
              className="px-4 py-2 bg-[#0a2742] hover:bg-[#0f3456] border border-teal-400 text-teal-300 font-bold rounded-xl text-xs cursor-pointer transition-colors"
            >
              Sign into Parent Console 👩
            </button>
            <button
              onClick={onOpenPilot}
              className="px-4 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer transition-colors shadow-md shadow-teal-500/20"
            >
              Apply for Family Pilot →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
