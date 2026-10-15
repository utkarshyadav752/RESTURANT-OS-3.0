import React, { useState, useRef, useEffect } from 'react';
import { Store, ChevronDown, Check, MapPin, Building, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Branch } from '../../types/index.ts';

export const BranchSwitcher: React.FC = () => {
  const { branches, currentBranch, switchBranch, user, canAccessBranch } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentBranch && branches.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all text-left cursor-pointer group shadow-sm"
      >
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
          <Store className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 pr-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
            <span>Branch</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[180px]">
            {currentBranch?.name || 'All Authorized Branches'}
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 p-2 rounded-2xl glass-panel-elevated bg-slate-900/95 border border-slate-700/80 shadow-2xl z-50">
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800/80 mb-1">
            <span>Select Authorized Branch</span>
            <span className="text-amber-400 font-mono text-[9px]">{branches.length} Outlets</span>
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
            {branches.map((b) => {
              const isSelected = currentBranch?.id === b.id;
              const hasAccess = canAccessBranch(b.id);

              return (
                <button
                  key={b.id}
                  disabled={!hasAccess}
                  onClick={() => {
                    if (hasAccess) {
                      switchBranch(b.id);
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between ${
                    !hasAccess
                      ? 'opacity-40 cursor-not-allowed bg-transparent'
                      : isSelected
                      ? 'bg-amber-500/15 border border-amber-500/40 text-white'
                      : 'hover:bg-slate-800/80 text-slate-300 hover:text-white cursor-pointer border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg border ${
                      isSelected ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}>
                      <Building className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                        <span className="truncate">{b.name}</span>
                        {!hasAccess && <Lock className="w-3 h-3 text-slate-500 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-slate-500" />
                        <span>{b.code} · {b.tables_count} Tables ({b.seating_capacity} pax)</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-amber-400 shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </div>

          {user && (user.role === 'OWNER' || user.assigned_branch_ids.includes('all')) && (
            <div className="pt-1 mt-1 border-t border-slate-800/80 text-center">
              <span className="text-[10px] text-slate-500">
                You have global multi-branch permissions.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
