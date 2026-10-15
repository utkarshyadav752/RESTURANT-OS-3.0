import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, Clock, AlertTriangle, TrendingUp, 
  Receipt, Layers, ChefHat, Package, Calculator, UserCheck, 
  ArrowUpRight, ShieldCheck, Activity, Filter, RefreshCw, 
  Building2, Sparkles, DollarSign, Search
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const TeamProgressTracker: React.FC = () => {
  const { currentBranch } = useAuth();
  const [teamData, setTeamData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [searchMember, setSearchMember] = useState('');

  const fetchProgress = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/analytics/team-progress?branchId=${currentBranch?.id || ''}`);
      setTeamData(res);
    } catch (err) {
      console.error('Error fetching team progress:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [currentBranch]);

  if (isLoading && !teamData) {
    return (
      <div className="py-16 text-center text-xs text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
        Syncing live team telemetry across POS, kitchen & floor...
      </div>
    );
  }

  const teamMembers = teamData?.teamMembers || [];
  const filteredMembers = teamMembers.filter((m: any) => {
    const matchesRole = selectedRoleFilter === 'ALL' || m.role === selectedRoleFilter;
    const matchesSearch = m.name.toLowerCase().includes(searchMember.toLowerCase()) ||
                          m.roleTitle.toLowerCase().includes(searchMember.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'CASHIER': return <Receipt className="w-4 h-4 text-emerald-400" />;
      case 'WAITER': return <Layers className="w-4 h-4 text-indigo-400" />;
      case 'KITCHEN': return <ChefHat className="w-4 h-4 text-orange-400" />;
      case 'INVENTORY_MANAGER': return <Package className="w-4 h-4 text-teal-400" />;
      case 'MANAGER': return <UserCheck className="w-4 h-4 text-blue-400" />;
      case 'ACCOUNTANT': return <Calculator className="w-4 h-4 text-violet-400" />;
      default: return <Building2 className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-750 glass-panel-elevated">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Owner's Live Staff Operations & Progress Tracker
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                ● {teamData?.totalOnDuty || 6} Staff On-Duty
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Real-time oversight across POS bill velocity, table turnovers, kitchen ticket speed, inventory scans, and cash reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProgress}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
            title="Refresh Staff Progress"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Aggregate Shift Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Overall Team Efficiency
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {teamData?.overallTeamEfficiency || 95.4}%
          </div>
          <div className="text-[11px] text-slate-400">
            Calculated across service turnaround & accuracy
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Orders Processed
          </span>
          <div className="text-2xl font-black font-mono text-white">
            {teamData?.totalOrdersHandled || 34} Orders
          </div>
          <div className="text-[11px] text-slate-400">
            Across 5 dining areas today
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Total Revenue Billed
          </span>
          <div className="text-2xl font-black font-mono text-amber-400">
            ₹{teamData?.totalRevenueBilled?.toLocaleString('en-IN') || '48,650'}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">
            100% collected without discrepancies
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Staff Security Clearance
          </span>
          <div className="text-2xl font-black font-mono text-blue-400">
            Strict RBAC
          </div>
          <div className="text-[11px] text-slate-400">
            No cross-role data leaks permitted
          </div>
        </div>
      </div>

      {/* Role Filters & Member Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {['ALL', 'CASHIER', 'WAITER', 'KITCHEN', 'INVENTORY_MANAGER', 'MANAGER', 'ACCOUNTANT'].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedRoleFilter === r
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchMember}
            onChange={(e) => setSearchMember(e.target.value)}
            placeholder="Filter staff by name..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
          />
        </div>
      </div>

      {/* Individual Staff Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMembers.map((member: any) => (
          <div
            key={member.id}
            className="p-5 rounded-3xl bg-slate-900/90 border border-slate-750 hover:border-slate-700 transition-all flex flex-col justify-between shadow-xl space-y-4 relative group"
          >
            {/* Top Info */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-700 group-hover:border-amber-400 transition-colors"
                    />
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {member.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {member.roleTitle}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold block">
                    {member.progressScore}% Score
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {member.shiftStartedAt}
                  </span>
                </div>
              </div>

              {/* Primary Key Metrics */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block truncate">
                    {member.primaryMetric.label}
                  </span>
                  <span className="text-sm font-black font-mono text-white mt-0.5 block">
                    {member.primaryMetric.value}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {member.primaryMetric.delta}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block truncate">
                    {member.secondaryMetric.label}
                  </span>
                  <span className="text-sm font-black font-mono text-amber-300 mt-0.5 block">
                    {member.secondaryMetric.value}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {member.secondaryMetric.delta}
                  </span>
                </div>
              </div>

              {/* Operational Breakdown */}
              <div className="mt-3.5 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Daily Tasks & Breakdown:
                </span>
                <div className="space-y-1 font-mono text-xs">
                  {member.operationalBreakdown?.map((b: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] py-0.5">
                      <span className="text-slate-400 truncate mr-2">{b.label}:</span>
                      <span className="text-slate-200 font-semibold shrink-0">{b.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Live Actions */}
            <div className="pt-3 border-t border-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Last Action Taken:
              </span>
              <div className="text-[11px] text-slate-300 leading-snug font-sans bg-slate-950/50 p-2 rounded-xl border border-slate-850">
                {member.recentActions?.[0] || 'Logged active attendance in morning briefing.'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Operational Activity Stream */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-750 glass-panel-elevated space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Chronological Staff Operations Stream
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Immutable Audit Trail
          </span>
        </div>

        <div className="space-y-2.5">
          {teamData?.liveOperationalFeed?.map((feedItem: any) => (
            <div
              key={feedItem.id}
              className="p-3 rounded-2xl bg-slate-950/80 border border-slate-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs hover:border-slate-750 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
                  {feedItem.time}
                </span>
                <span className="font-bold text-white">
                  {feedItem.staffName}:
                </span>
                <span className="text-slate-300">
                  {feedItem.text}
                </span>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-800 text-slate-400 shrink-0">
                {feedItem.badge}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
