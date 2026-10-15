import React, { useState } from 'react';
import { X, Shield, User, ArrowRight, KeyRound } from 'lucide-react';
import { ChildProfile, ParentProfile } from '../../types/pocketFund.ts';

interface LoginPortalModalProps {
  isOpen: boolean;
  defaultRole: 'parent' | 'student';
  parent: ParentProfile;
  childrenList: ChildProfile[];
  onClose: () => void;
  onLoginSuccess: (role: 'parent' | 'student', childId?: string) => void;
  showToast: (msg: string) => void;
}

export const LoginPortalModal: React.FC<LoginPortalModalProps> = ({
  isOpen,
  defaultRole,
  parent,
  childrenList,
  onClose,
  onLoginSuccess,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'parent' | 'student'>(defaultRole);
  const [selectedChildId, setSelectedChildId] = useState<string>(childrenList[0]?.id || 'child-1');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleQuickParentLogin = () => {
    onLoginSuccess('parent');
    showToast(`Welcome to Parent Command Center, ${parent.name}!`);
    onClose();
  };

  const handleQuickStudentLogin = (child: ChildProfile) => {
    onLoginSuccess('student', child.id);
    showToast(`Logged into Student Wallet as ${child.name} (${child.age} yrs)!`);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'parent') {
      onLoginSuccess('parent');
      showToast('Parent Console authenticated successfully.');
    } else {
      onLoginSuccess('student', selectedChildId);
      showToast('Student Wallet authenticated successfully.');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#071d31] border border-[#16426a] rounded-2xl p-6 sm:p-7 shadow-2xl text-[#c2d5e3]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#799ab2] hover:text-[#dbeaf5] p-1 rounded-lg transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-teal-400 text-slate-950 font-black flex items-center justify-center text-sm">
            ₹
          </div>
          <span className="font-extrabold text-[#dbeaf5] text-base tracking-tight">Pocket Fund Portal</span>
        </div>

        {/* Role Segmented Toggles */}
        <div className="flex items-center p-1 bg-[#051321] border border-[#153a5c] rounded-xl mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('parent')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'parent'
                ? 'bg-teal-400 text-slate-950 shadow-md font-extrabold'
                : 'text-[#8daec7] hover:text-[#dbeaf5]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Parent Console 👩
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('student')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'student'
                ? 'bg-sky-400 text-slate-950 shadow-md font-extrabold'
                : 'text-[#8daec7] hover:text-[#dbeaf5]'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Student Wallet 🧑
          </button>
        </div>

        {/* 1-Click Fast Evaluation Access */}
        <div className="p-3.5 bg-[#051423] border border-[#153e63] rounded-xl mb-5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#799ab2] block mb-2 font-bold">
            ⚡ 1-Click Sandbox Test Accounts
          </span>

          {activeTab === 'parent' ? (
            <button
              onClick={handleQuickParentLogin}
              className="w-full py-2.5 px-3 bg-[#0a2742] hover:bg-[#0e3355] border border-teal-500/40 hover:border-teal-400 text-teal-300 font-bold rounded-lg text-xs flex items-center justify-between transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{parent.avatar}</span>
                <div className="text-left leading-tight">
                  <div className="text-white font-semibold text-xs">{parent.name} (Guardian)</div>
                  <div className="text-[10px] text-[#799ab2] font-mono">{parent.email}</div>
                </div>
              </div>
              <span className="text-xs text-teal-400 group-hover:translate-x-0.5 transition-transform">
                Sign In →
              </span>
            </button>
          ) : (
            <div className="space-y-2">
              {childrenList.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleQuickStudentLogin(child)}
                  className="w-full py-2 px-3 bg-[#0a2742] hover:bg-[#0e3355] border border-sky-500/30 hover:border-sky-400 text-sky-200 font-semibold rounded-lg text-xs flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{child.avatar}</span>
                    <div className="text-left leading-tight">
                      <div className="text-white font-semibold text-xs">{child.name} ({child.age} yrs)</div>
                      <div className="text-[10px] text-[#799ab2] font-mono">{child.email}</div>
                    </div>
                  </div>
                  <span className="text-xs text-sky-400 group-hover:translate-x-0.5 transition-transform">
                    Enter Wallet →
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Or enter custom credentials */}
        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-[#133756] w-full" />
          <span className="bg-[#071d31] px-2 text-[10px] uppercase tracking-wider text-[#6387a2] font-mono">
            Or credentials
          </span>
          <div className="border-t border-[#133756] w-full" />
        </div>

        <form onSubmit={handleCustomSubmit} className="space-y-3 text-xs mt-3">
          <div>
            <label className="block text-[#799ab2] font-semibold mb-1 text-[11px] uppercase tracking-wider">
              {activeTab === 'parent' ? 'Parent Email' : 'Student Gmail'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={activeTab === 'parent' ? parent.email : 'aarav.sharma@gmail.com'}
              className="w-full px-3 py-2 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 text-xs"
            />
          </div>

          <div>
            <label className="block text-[#799ab2] font-semibold mb-1 text-[11px] uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-[#051321] border border-[#173e63] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2"
          >
            <span>Authenticate to {activeTab === 'parent' ? 'Parent Console' : 'Student Wallet'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
