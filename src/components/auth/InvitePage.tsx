import React, { useState } from 'react';
import { Shield, Lock, CheckCircle2, ArrowRight, Building2, User } from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface Props {
  token: string;
  onActivated: () => void;
  onCancel: () => void;
}

export const InvitePage: React.FC<Props> = ({ token, onActivated, onCancel }) => {
  const { login } = useAuth();
  const [password, setPassword] = useState('Pass@1234');
  const [confirmPassword, setConfirmPassword] = useState('Pass@1234');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.post('/auth/invitations/accept', { token, password });
      if (res.user && res.token) {
        localStorage.setItem('restaurantos_token', res.token);
        onActivated();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to accept invitation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-700/60 shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 mb-3 shadow-lg shadow-amber-500/10">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            Staff Team Invitation
          </span>
          <h2 className="text-xl font-bold text-white mt-2">Join Zafran Gourmet Bistro</h2>
          <p className="text-xs text-slate-400 mt-1">
            You have been invited by the restaurant management to access the RestaurantOS platform.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5 mb-5">
          <div className="flex justify-between">
            <span className="text-slate-500">Assigned Role:</span>
            <span className="font-bold text-amber-300">Operations Staff</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Assigned Branch:</span>
            <span className="font-semibold text-slate-200">Cyber Hub Flagship</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Token Status:</span>
            <span className="text-emerald-400 font-mono">Active & Verified</span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Set Your Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Activating account...' : 'Activate Account & Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Cancel and Return
          </button>
        </form>
      </div>
    </div>
  );
};
