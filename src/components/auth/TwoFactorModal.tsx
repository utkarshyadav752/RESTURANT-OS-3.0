import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, X, Smartphone, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  mobile: string;
}

export const TwoFactorModal: React.FC<Props> = ({ isOpen, onClose, email, mobile }) => {
  const { verify2FA, isLoading } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setError(null);
    try {
      await verify2FA(code);
    } catch (err: any) {
      setError(err.message || 'Invalid 2FA code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 rounded-2xl glass-panel-elevated bg-slate-900/95 border border-slate-700/60 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Two-Factor Authentication</h3>
            <p className="text-xs text-slate-400">Security challenge required for admin access</p>
          </div>
        </div>

        <div className="p-3 my-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300">
            <span className="font-semibold text-slate-200">Device Prompt:</span> An authentication code has been generated. Enter code from your authenticator app or SMS sent to <span className="font-mono text-amber-300 font-semibold">{mobile || email}</span>.
            <div className="mt-1 text-slate-400 font-mono">Demo bypass code: <strong className="text-amber-300">123456</strong></div>
          </div>
        </div>

        {error && (
          <div className="p-3 my-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Enter 6-Digit Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              autoFocus
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-center text-xl font-mono tracking-widest text-amber-300 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCode('123456')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-xl transition-all"
            >
              Fill Demo Code
            </button>
            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Verifying...' : 'Verify & Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
