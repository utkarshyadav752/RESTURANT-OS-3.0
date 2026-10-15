import React, { useState } from 'react';
import { X, Sparkles, Send, Phone, Mail, Bot, User, ShieldCheck } from 'lucide-react';
import { ChildProfile } from '../../types/pocketFund.ts';

interface PocketFundAIDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeChild?: ChildProfile;
  childrenList: ChildProfile[];
  role: 'parent' | 'teen' | 'visitor';
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  isHelpdesk?: boolean;
}

export const PocketFundAIDrawer: React.FC<PocketFundAIDrawerProps> = ({
  isOpen,
  onClose,
  activeChild,
  childrenList,
  role,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: role === 'parent'
        ? `Hello Priya! I'm your Pocket Fund Family Financial AI. I'm actively monitoring allowances, category guardrails, and savings trajectories for ${activeChild?.name || 'your children'}. How can I assist your parenting routine today?`
        : role === 'teen'
        ? `Hey ${activeChild?.name || 'there'}! I'm your Pocket Fund Smart Wallet Coach. Ask me how to accelerate your savings goals, manage canteen limits, or build a daily money streak!`
        : `Welcome to Pocket Fund! I'm the platform AI advisor. Ask me anything about Indian teen allowances, RBI partner wallet security, or getting started with family accounts!`,
      time: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const quickQuestions = role === 'parent'
    ? [
        `Audit ${activeChild?.name || 'Aarav'}'s spending habits`,
        `How to speed up ${activeChild?.name || 'Aarav'}'s savings goal?`,
        'Compare spending across all my children',
        'Chores vs allowance best practices in India',
      ]
    : role === 'teen'
    ? [
        'How can I reach my savings goal faster?',
        'Smart ways to save money on daily canteen snacks',
        '3-question test before making impulse purchases',
        'How can teenagers earn extra pocket money?',
      ]
    : [
        'What is an appropriate allowance for a 14-year-old in India?',
        'How are merchant categories like betting and alcohol blocked?',
        'How does the parent UPI approval loop work?',
        'How do I contact customer support?',
      ];

  const handleSend = async (questionText?: string) => {
    const q = questionText || input;
    if (!q.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const queryLower = q.toLowerCase();

    // Check if support contact was requested
    if (
      queryLower.includes('contact') ||
      queryLower.includes('support') ||
      queryLower.includes('helpdesk') ||
      queryLower.includes('helpline')
    ) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `📞 You can reach Pocket Fund Customer Support at support@pocketfund.in or call 1800-100-9988 (Mon–Sun 8:00 AM – 10:00 PM IST). Our support desk is here to assist families with onboarding and app features!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isHelpdesk: true,
          },
        ]);
        setIsTyping(false);
      }, 500);
      return;
    }

    // Server-side Gemini API or intelligent grounded knowledge generator
    try {
      const response = await fetch('/api/v1/pocketfund/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          role,
          activeChild: activeChild ? {
            name: activeChild.name,
            age: activeChild.age,
            allowance: activeChild.allowance,
            spent: activeChild.spent,
            saved: activeChild.saved,
            balance: activeChild.balance,
            foodSpent: activeChild.foodSpent,
            foodLimit: activeChild.foodLimit,
            goals: activeChild.goals,
            streakDays: activeChild.streakDays,
          } : null,
          allChildren: childrenList.map(c => ({
            name: c.name,
            age: c.age,
            allowance: c.allowance,
            spent: c.spent,
            saved: c.saved,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: data.reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setIsTyping(false);
        return;
      }
    } catch {
      // Fallback to deterministic expert domain rules
    }

    // Local expert fallback rules
    setTimeout(() => {
      let reply = '';
      const childName = activeChild?.name || 'Aarav';

      if (queryLower.includes('audit') || queryLower.includes('spending')) {
        const spentPct = Math.round(((activeChild?.spent || 1120) / (activeChild?.allowance || 2000)) * 100);
        reply = `📊 Spending Audit for ${childName}: ${childName} has used ₹${(activeChild?.spent || 1120).toLocaleString('en-IN')} of the ₹${(activeChild?.allowance || 2000).toLocaleString('en-IN')} monthly allowance (${spentPct}%). Food & dining is at ₹${activeChild?.foodSpent || 280}/₹${activeChild?.foodLimit || 400}. Recommendation: Set a weekly guideline for canteen and snacking to maintain savings pace.`;
      } else if (queryLower.includes('goal') || queryLower.includes('speed') || queryLower.includes('save')) {
        const goal = activeChild?.goals[0] || { name: 'New Headphones', current: 1050, target: 1500 };
        const remaining = Math.max(0, goal.target - goal.current);
        reply = `🎯 Goal Acceleration for ${childName}: Current target "${goal.name}" is ${Math.round((goal.current / goal.target) * 100)}% complete (₹${goal.current.toLocaleString('en-IN')} / ₹${goal.target.toLocaleString('en-IN')}). ${childName} is ₹${remaining.toLocaleString('en-IN')} away (~2 weeks). Consider a 1:1 parent matching reward for the final 15%!`;
      } else if (queryLower.includes('compare') || queryLower.includes('all children')) {
        reply = `👨‍👩‍👧‍👦 Family Overview: ${childrenList.map(c => `${c.name}: ₹${c.spent}/₹${c.allowance} spent (${Math.round((c.spent / c.allowance) * 100)}%), ₹${c.saved} saved`).join(' | ')}. Overall savings rate is healthy across all children!`;
      } else if (queryLower.includes('chore') || queryLower.includes('earn')) {
        reply = `🗣️ Chores & Allowance Framework: Keep base monthly allowance separate from routine household duties. Offer special top-ups for proactive family contributions, such as organizing study spaces, tutoring siblings, or washing family vehicles.`;
      } else if (queryLower.includes('block') || queryLower.includes('mcc') || queryLower.includes('safety') || queryLower.includes('upi')) {
        reply = `🛡️ Security & MCC Blocking: Pocket Fund partners with RBI-licensed PPI issuers. High-risk merchant codes—including betting, alcohol, lottery, and mature entertainment—are permanently blocked at the card network switch. Transfers to unverified personal UPI IDs exceeding ₹250 require instant 1-tap parent authorization.`;
      } else {
        reply = `✦ Pocket Fund Family Guidance: In urban Indian families, clear boundaries and automated 1st-of-month allowances reduce WhatsApp friction by 95%. When teenagers know their exact monthly budget for transport and food, they naturally practice mindful pacing.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-[#071d31] border-l border-[#153e63] flex flex-col text-[#c2d5e3] shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-[#14395b] bg-[#051321] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-teal-500/20">
              <Sparkles className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-[#dbeaf5] flex items-center gap-2">
                Ask Pocket Fund AI
                <span className="text-[10px] font-mono bg-teal-400/20 text-teal-300 px-1.5 py-0.5 rounded font-bold">
                  ACTIVE
                </span>
              </div>
              <div className="text-[11px] text-[#799ab2]">
                Family Financial & Habit Advisor
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#799ab2] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center shrink-0 text-xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-teal-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-[#092239] border border-[#164168] text-[#d5e5f2] rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                {m.isHelpdesk && (
                  <div className="mt-3 pt-2.5 border-t border-[#1a4a75] flex gap-2 flex-wrap">
                    <a
                      href="tel:9554460651"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white rounded text-[11px] font-bold no-underline"
                    >
                      <Phone className="w-3 h-3" /> Call: 9554460651
                    </a>
                    <a
                      href="mailto:support@pocketfund.in?subject=Pocket%20Fund%20Support%20Inquiry"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-500 text-white rounded text-[11px] font-bold no-underline"
                    >
                      <Mail className="w-3 h-3" /> Email Support
                    </a>
                  </div>
                )}
                <div
                  className={`text-[9px] mt-1 ${
                    m.sender === 'user' ? 'text-teal-900 text-right' : 'text-[#62859e]'
                  }`}
                >
                  {m.time}
                </div>
              </div>
              {m.sender === 'user' && (
                <div className="w-6 h-6 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 flex items-center justify-center shrink-0 text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2 items-center text-[#799ab2] text-xs">
              <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="p-2.5 bg-[#092239] border border-[#164168] rounded-2xl text-[11px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse delay-100" />
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse delay-200" />
                <span className="ml-1">Formulating guidance...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 border-t border-[#133758] bg-[#051423] overflow-x-auto">
          <div className="flex gap-1.5 whitespace-nowrap">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                className="px-2.5 py-1 rounded-full bg-[#09243c] hover:bg-[#103454] border border-[#164168] text-[11px] text-[#93b7d1] hover:text-white transition-colors cursor-pointer shrink-0"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-[#14395b] bg-[#051321]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about allowances, safety, or savings goals..."
              className="flex-1 px-3 py-2 bg-[#081f33] border border-[#18446c] rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-teal-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2 bg-teal-400 hover:bg-teal-300 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-teal-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-[#63849c] mt-2 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-teal-400" /> RBI PPI Compliant Advice
            </span>
            <span className="text-teal-400 font-mono">
              Support Desk: support@pocketfund.in
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
