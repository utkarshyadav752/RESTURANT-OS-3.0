import React, { useState } from 'react';
import {
  CreditCard,
  Send,
  Plus,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Flame,
  Check,
} from 'lucide-react';
import { ChildProfile, ExpenseRequest } from '../../types/pocketFund.ts';

interface TeenCompanionAppProps {
  child: ChildProfile;
  onRequestMoney: (req: ExpenseRequest) => void;
  onDepositToGoal: (goalId: string, amount: number) => void;
  onSignOut: () => void;
  onOpenAIAdvisor: () => void;
  showToast: (msg: string) => void;
}

export const TeenCompanionApp: React.FC<TeenCompanionAppProps> = ({
  child,
  onRequestMoney,
  onDepositToGoal,
  onSignOut,
  onOpenAIAdvisor,
  showToast,
}) => {
  const [showCvv, setShowCvv] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestAmount, setRequestAmount] = useState('180');
  const [requestDesc, setRequestDesc] = useState('');
  const [requestCategory, setRequestCategory] = useState('Stationery');

  const [choresList, setChoresList] = useState(
    child.chores || [
      { id: 'c-1', title: 'Complete Mathematics homework', reward: 50, icon: '📝', completed: false },
      { id: 'c-2', title: 'Keep study table organized', reward: 30, icon: '🧹', completed: true },
      { id: 'c-3', title: 'Daily 30-min book reading', reward: 40, icon: '📚', completed: false },
    ]
  );

  const mainGoal = child.goals[0] || { name: 'Savings Goal', icon: '🎧', current: child.saved, target: 1500 };
  const goalPct = Math.min(100, Math.round((mainGoal.current / mainGoal.target) * 100));

  const handleCopyCard = () => {
    navigator.clipboard.writeText('4532 8920 1932 4289');
    showToast('Copied RuPay Virtual Card Number!');
  };

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTitle.trim()) {
      showToast('Please enter request title.');
      return;
    }

    const newReq: ExpenseRequest = {
      id: `req-${Date.now()}`,
      title: requestTitle,
      amount: Number(requestAmount) || 150,
      who: child.name,
      childId: child.id,
      when: 'Just now',
      icon: requestCategory === 'Food' ? '🍜' : requestCategory === 'Transit' ? '🚌' : '📚',
      desc: requestDesc || 'School / personal activity',
    };

    onRequestMoney(newReq);
    showToast(`Request sent to Parent Console for ₹${newReq.amount}!`);
    setShowRequestModal(false);
    setRequestTitle('');
    setRequestDesc('');
  };

  const handleToggleChore = (choreId: string) => {
    setChoresList((prev) =>
      prev.map((c) => {
        if (c.id === choreId) {
          const next = !c.completed;
          if (next) {
            showToast(`Completed "${c.title}"! ₹${c.reward} submitted for parent reward.`);
          }
          return { ...c, completed: next };
        }
        return c;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#05111d] text-[#c2d5e3] flex flex-col font-sans">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-40 bg-[#05111d]/95 backdrop-blur-md border-b border-[#133350] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-sky-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-sky-500/20">
            ₹
          </span>
          <div>
            <div className="font-extrabold text-[#dbeaf5] text-sm leading-tight flex items-center gap-1.5">
              {child.name}'s Wallet
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold">
                TEEN
              </span>
            </div>
            <div className="text-[10px] text-[#799ab2] font-mono">
              Student Companion · {child.grade || `Age ${child.age}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAIAdvisor}
            className="px-2.5 py-1.5 bg-teal-500/20 border border-teal-400/40 text-teal-300 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Coach
          </button>
          <button
            onClick={onSignOut}
            className="px-2.5 py-1.5 bg-[#092238] hover:bg-[#103454] border border-[#163f68] text-xs text-[#8daec7] rounded-lg cursor-pointer"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Main Companion Body */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-5 space-y-5 pb-12">
        {/* Virtual RuPay Companion Card */}
        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-[#0369a1] via-[#0d9488] to-[#064e3b] text-white shadow-2xl overflow-hidden border border-white/20">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-teal-200 block">
                Pocket Fund Student Companion
              </span>
              <span className="font-black text-xl tracking-tight">₹ Student Debit</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-black/30 rounded text-[10px] font-mono uppercase font-bold tracking-wider">
                RuPay Prepaid
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between font-mono text-base tracking-widest my-3 drop-shadow">
            <span>•••• •••• •••• 4289</span>
            <button
              onClick={handleCopyCard}
              className="p-1 hover:bg-white/10 rounded cursor-pointer transition-colors"
              title="Copy card number"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex justify-between items-end mt-5 pt-3 border-t border-white/10 text-xs">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-teal-100/70">Cardholder</div>
              <div className="font-bold tracking-wide">{child.name} Sharma</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wider text-teal-100/70">CVV</div>
              <button
                onClick={() => setShowCvv(!showCvv)}
                className="font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>{showCvv ? '841' : '•••'}</span>
                {showCvv ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-teal-100/70">Balance</div>
              <div className="font-mono font-black text-base text-teal-200">
                ₹{child.balance.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Balance Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 bg-[#081d30] border border-[#153e63] rounded-xl">
            <span className="text-[10px] font-mono text-[#799ab2] uppercase block">Current Allowance</span>
            <div className="text-xl font-black text-white mt-0.5">₹{child.allowance}</div>
            <span className="text-[10px] text-teal-400">Monthly auto-reload</span>
          </div>

          <div className="p-3.5 bg-[#081d30] border border-[#153e63] rounded-xl">
            <span className="text-[10px] font-mono text-[#799ab2] uppercase block">Saved Total</span>
            <div className="text-xl font-black text-teal-300 mt-0.5">₹{child.saved}</div>
            <span className="text-[10px] text-amber-300 flex items-center gap-1">
              <Flame className="w-3 h-3 fill-amber-300" /> {child.streakDays}d Streak
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowRequestModal(true)}
            className="p-3.5 bg-[#0a2742] hover:bg-[#0e3559] border border-teal-500/40 text-teal-300 font-bold rounded-xl text-xs flex flex-col items-start transition-all cursor-pointer shadow-md"
          >
            <Send className="w-4 h-4 mb-1 text-teal-400" />
            <span className="text-white text-xs font-bold">Ask Parent for Money</span>
            <span className="text-[10px] text-[#799ab2] font-normal">Send UPI request</span>
          </button>

          <button
            onClick={() => {
              if (child.balance < 50) {
                showToast('Insufficient wallet balance to deposit.');
                return;
              }
              onDepositToGoal(mainGoal.id, 50);
            }}
            className="p-3.5 bg-[#0a2742] hover:bg-[#0e3559] border border-sky-500/40 text-sky-300 font-bold rounded-xl text-xs flex flex-col items-start transition-all cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4 mb-1 text-sky-400" />
            <span className="text-white text-xs font-bold">+₹50 to Savings</span>
            <span className="text-[10px] text-[#799ab2] font-normal">Add to "{mainGoal.name}"</span>
          </button>
        </div>

        {/* Main Savings Goal */}
        <div className="p-4 bg-[#081d30] border border-[#153e63] rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{mainGoal.icon}</span>
              <div>
                <h4 className="font-bold text-white text-sm">{mainGoal.name}</h4>
                <div className="text-[11px] text-[#799ab2] font-mono">
                  ₹{mainGoal.current} of ₹{mainGoal.target} target
                </div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-teal-300">{goalPct}%</span>
          </div>

          <div className="w-full h-2.5 bg-[#05121e] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-sky-400 transition-all duration-300"
              style={{ width: `${goalPct}%` }}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onDepositToGoal(mainGoal.id, 50)}
              className="flex-1 py-1.5 bg-[#051423] hover:bg-[#0d2a45] border border-teal-500/30 text-teal-300 rounded text-xs font-semibold cursor-pointer"
            >
              Deposit ₹50
            </button>
            <button
              onClick={() => onDepositToGoal(mainGoal.id, 100)}
              className="flex-1 py-1.5 bg-[#051423] hover:bg-[#0d2a45] border border-teal-500/30 text-teal-300 rounded text-xs font-semibold cursor-pointer"
            >
              Deposit ₹100
            </button>
          </div>
        </div>

        {/* Chores & Challenges */}
        <div className="p-4 bg-[#081d30] border border-[#153e63] rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>🧹</span> Earn Extra Money (Chores)
            </h4>
            <span className="text-[10px] font-mono text-teal-400">Parent Verified</span>
          </div>

          <div className="space-y-2">
            {choresList.map((c) => (
              <div
                key={c.id}
                onClick={() => handleToggleChore(c.id)}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  c.completed
                    ? 'bg-[#051a2a] border-teal-500/40 text-teal-200'
                    : 'bg-[#051423] border-[#153c5f] text-[#8daec7] hover:border-teal-400/50'
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs">
                  <span>{c.icon}</span>
                  <span className={c.completed ? 'line-through opacity-70' : 'font-semibold text-white'}>
                    {c.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-teal-300">+₹{c.reward}</span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                      c.completed ? 'bg-teal-400 border-teal-400 text-slate-950 font-bold' : 'border-slate-500'
                    }`}
                  >
                    {c.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="p-4 bg-[#081d30] border border-[#153e63] rounded-2xl space-y-2.5">
          <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-400" /> Recent Activity
          </h4>
          <div className="space-y-1.5 text-xs font-mono">
            {child.walletHistory.slice(0, 4).map((entry, idx) => (
              <div key={idx} className="p-2 bg-[#051423] rounded-lg border border-[#133758] text-[#c2d5e3] text-[11px]">
                {entry}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Ask Parent Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#071d31] border border-[#16426a] rounded-2xl p-6 text-[#c2d5e3] shadow-2xl">
            <h3 className="text-lg font-extrabold text-white mb-1">
              Request Money from Parent
            </h3>
            <p className="text-xs text-[#799ab2] mb-4">
              Your parent will receive an instant notification to approve via 1-tap UPI.
            </p>

            <form onSubmit={handleSendRequest} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-mono uppercase text-[#799ab2] block mb-1">
                  Item or Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={requestTitle}
                  onChange={(e) => setRequestTitle(e.target.value)}
                  placeholder="e.g. Science Fair Project Components"
                  className="w-full px-3 py-2 bg-[#051321] border border-[#173e63] rounded-lg text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#799ab2] block mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#051321] border border-[#173e63] rounded-lg text-white font-mono focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#799ab2] block mb-1">
                    Category
                  </label>
                  <select
                    value={requestCategory}
                    onChange={(e) => setRequestCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#051321] border border-[#173e63] rounded-lg text-white focus:outline-none focus:border-teal-400"
                  >
                    <option value="Stationery">Books & Stationery</option>
                    <option value="Food">Food & Canteen</option>
                    <option value="Transit">Transport</option>
                    <option value="Outing">Social Outing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#799ab2] block mb-1">
                  Explanation Note
                </label>
                <textarea
                  value={requestDesc}
                  onChange={(e) => setRequestDesc(e.target.value)}
                  placeholder="Why is this needed right now?"
                  rows={2}
                  className="w-full px-3 py-2 bg-[#051321] border border-[#173e63] rounded-lg text-white focus:outline-none focus:border-teal-400 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 py-2 bg-[#092238] border border-[#153e63] rounded-xl text-xs font-semibold text-[#8daec7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer shadow-md shadow-teal-500/20"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
