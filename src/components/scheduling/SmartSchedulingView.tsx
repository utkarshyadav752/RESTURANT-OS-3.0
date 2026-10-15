import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, TrendingUp, Clock, AlertTriangle, 
  CheckCircle2, Sparkles, Plus, Share2, Printer, 
  RefreshCw, ChefHat, Utensils, Receipt, Package, 
  ShieldCheck, ArrowRight, Zap, Filter, Check, X,
  ChevronRight, BarChart3, HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import confetti from 'canvas-confetti';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { 
  WeeklyScheduleData, ShiftSlot, ShiftType, 
  StationType, RoleType 
} from '../../types/index.ts';

export const SmartSchedulingView: React.FC = () => {
  const { currentBranch, user } = useAuth();
  const [scheduleData, setScheduleData] = useState<WeeklyScheduleData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStationFilter, setSelectedStationFilter] = useState<'ALL' | StationType>('ALL');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<'ALL' | ShiftType>('ALL');
  const [copied, setCopied] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // Edit Shift Modal State
  const [activeShiftToEdit, setActiveShiftToEdit] = useState<ShiftSlot | null>(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const data = await api.get<WeeklyScheduleData>(`/scheduling/weekly?branchId=${currentBranch?.id || ''}`);
      setScheduleData(data);
    } catch (err) {
      console.error('Failed to fetch schedule data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [currentBranch?.id]);

  // One-click Auto-optimize from AI Demand Forecast
  const handleAutoOptimize = async () => {
    setIsOptimizing(true);
    try {
      const optimized = await api.post<WeeklyScheduleData>('/scheduling/auto-optimize', {
        branchId: currentBranch?.id
      });
      setScheduleData(optimized);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    } catch (err) {
      console.error('Auto-optimization failed:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Assign staff to shift
  const handleSaveShiftAssignment = async () => {
    if (!activeShiftToEdit) return;
    try {
      await api.post('/scheduling/assign', {
        shiftId: activeShiftToEdit.id,
        staffIds: selectedStaffIds
      });
      await fetchSchedule();
      setActiveShiftToEdit(null);
    } catch (err) {
      console.error('Failed to update shift:', err);
    }
  };

  // WhatsApp Roster Export
  const handleWhatsAppExport = () => {
    if (!scheduleData) return;

    let text = `📅 *ZAFRAN GOURMET BISTRO — WEEKLY ROSTER (${scheduleData.weekRange})*\n`;
    text += `Branch: ${currentBranch?.name || 'Cyber Hub'} · Demand-Optimized Schedule\n\n`;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
    days.forEach(d => {
      text += `*--- ${d.toUpperCase()} ---*\n`;
      const dayShifts = scheduleData.shifts.filter(s => s.day === d);
      dayShifts.forEach(s => {
        const assignedNames = s.assignedStaffIds
          .map(id => scheduleData.staffRoster.find(r => r.id === id)?.name || id)
          .join(', ');
        text += `• ${s.shiftType} (${s.startTime}-${s.endTime}) [${s.projectedCovers} Covers]: ${assignedNames || 'Unassigned'}\n`;
      });
      text += '\n';
    });

    text += `*AI Shift Note:* ${scheduleData.aiRecommendations[0]}\n`;
    text += `Please report 10 minutes prior to shift lineup. Let's make it a stellar week! 🚀`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading && !scheduleData) {
    return (
      <div className="p-12 text-center rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-800 space-y-4 max-w-7xl mx-auto my-6">
        <div className="inline-flex p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 animate-spin">
          <RefreshCw className="w-8 h-8" />
        </div>
        <div className="text-base font-bold text-white tracking-wide">
          Calculating Demand-Driven Staffing Matrix for {currentBranch?.name || 'Restaurant'}...
        </div>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Merging covers demand forecasts, peak hours, and labor-to-revenue models to build your optimal weekly shift schedule.
        </p>
      </div>
    );
  }

  if (!scheduleData) return null;

  const daysList: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Recharts Chart Dataset: Covers Demand vs Staff Assigned
  const chartDataset = scheduleData.shifts.map(s => ({
    name: `${s.day} ${s.shiftType === 'LUNCH' ? 'L' : 'D'}`,
    covers: s.projectedCovers,
    neededStaff: s.suggestedStaffCount.total,
    assignedStaff: s.assignedStaffIds.length,
    isSurge: s.demandIntensity === 'PEAK_SURGE'
  }));

  // Station Icon Helper
  const getStationIcon = (st: StationType) => {
    switch (st) {
      case 'KITCHEN': return <ChefHat className="w-3.5 h-3.5 text-orange-400" />;
      case 'SERVICE': return <Utensils className="w-3.5 h-3.5 text-blue-400" />;
      case 'CASHIER': return <Receipt className="w-3.5 h-3.5 text-emerald-400" />;
      case 'STORE': return <Package className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header & Executive Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-6 h-6 text-amber-400" />
              Smart Shift Scheduling & Labor Optimization
            </h2>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Demand-Grounded
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Auto-aligning kitchen brigade and floor captains with AI customer demand peaks to eliminate rush hour understaffing and control labor cost.
          </p>
        </div>

        {/* Global Shift Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* One-Click Auto-Optimize Button */}
          <button
            onClick={handleAutoOptimize}
            disabled={isOptimizing}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-2xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 button-3d"
          >
            <Sparkles className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : 'text-slate-950'}`} />
            <span>{isOptimizing ? 'Optimizing Roster...' : 'Auto-Optimize from Demand Forecast'}</span>
          </button>

          {/* WhatsApp Share Button */}
          <button
            onClick={handleWhatsAppExport}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-750 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer button-3d shadow-md"
            title="Copy formatted weekly roster to clipboard for WhatsApp"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-400" />
                <span>Share WhatsApp Roster</span>
              </>
            )}
          </button>

          {/* Refresh Data */}
          <button
            onClick={fetchSchedule}
            className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer button-3d"
            title="Refresh Schedule"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Telemetry Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weekly Projected Covers */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1 h-full flex flex-col justify-between hover:border-stone-700 transition-colors shadow-sm">
          <span className="text-[10px] text-stone-400 uppercase font-semibold">Weekly Customer Volume</span>
          <div>
            <div className="text-2xl font-black font-mono text-white">
              {scheduleData.totalProjectedCovers.toLocaleString('en-IN')}
              <span className="text-xs font-normal text-stone-400 ml-1.5">covers</span>
            </div>
            <div className="text-[11px] text-amber-400 font-medium">
              Peak: Sat Dinner (187 covers)
            </div>
          </div>
          <div className="text-[10px] text-stone-400 font-mono mt-2">
            Est. Gross: ₹{(scheduleData.totalProjectedRevenue / 100000).toFixed(1)}L
          </div>
        </div>

        {/* Scheduled Brigade Hours */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1 h-full flex flex-col justify-between hover:border-stone-700 transition-colors shadow-sm">
          <span className="text-[10px] text-stone-400 uppercase font-semibold">Total Brigade Hours</span>
          <div>
            <div className="text-2xl font-black font-mono text-blue-400">
              {scheduleData.totalScheduledHours}
              <span className="text-xs font-normal text-stone-400 ml-1.5">hours</span>
            </div>
            <div className="text-[11px] text-blue-300 font-medium">
              7 active staff members scheduled
            </div>
          </div>
          <div className="text-[10px] text-stone-400 font-mono mt-2">
            Average 33.3 hrs / team member
          </div>
        </div>

        {/* Labor-to-Revenue Efficiency Ratio */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1 h-full flex flex-col justify-between hover:border-stone-700 transition-colors shadow-sm">
          <span className="text-[10px] text-stone-400 uppercase font-semibold">Labor Cost Ratio</span>
          <div>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {scheduleData.laborCostPct}%
            </div>
            <div className="text-[11px] text-emerald-300 font-medium">
              Within optimal {scheduleData.optimalLaborCostPct}% target
            </div>
          </div>
          <div className="text-[10px] text-stone-400 font-mono mt-2">
            Payroll: ₹{scheduleData.estimatedLaborCost.toLocaleString('en-IN')} / week
          </div>
        </div>

        {/* Understaffing Risk Warnings */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1 h-full flex flex-col justify-between hover:border-stone-700 transition-colors shadow-sm">
          <span className="text-[10px] text-stone-400 uppercase font-semibold">Staffing Risk Index</span>
          <div>
            <div className="text-2xl font-black font-mono text-rose-400">
              {scheduleData.shifts.filter(s => s.status === 'UNDERSTAFFED').length} Shifts
            </div>
            <div className="text-[11px] text-rose-300 font-medium">
              Require staff reinforcement
            </div>
          </div>
          <div className="text-[10px] text-amber-400 font-bold mt-2">
            Friday & Saturday dinner peaks
          </div>
        </div>
      </div>

      {/* AI Staffing Recommendations Hero Box */}
      <div className="p-5 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-750 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-white">
              AI Demand-Driven Staffing Directives ({scheduleData.weekRange})
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Optimal Efficiency
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-300">
          {scheduleData.aiRecommendations.map((rec, idx) => (
            <div 
              key={idx}
              className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5 leading-snug"
            >
              <span className="text-amber-400 font-bold shrink-0">•</span>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Coverage vs Customer Demand Curve */}
      <div className="p-5 sm:p-6 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              Staff Coverage vs Customer Demand Curve (14 Shifts)
            </h3>
            <p className="text-[11px] text-stone-400">
              Visualizing where table volume surges demand additional brigade reinforcement
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400" />
              <span className="text-stone-300">Projected Covers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-400" />
              <span className="text-stone-300">Staff Assigned</span>
            </div>
          </div>
        </div>

        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartDataset} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis yAxisId="left" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" tick={{ fill: '#38bdf8', fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#141210', borderColor: '#292524', borderRadius: '12px', fontSize: '11px' }}
              />
              <Area yAxisId="left" type="monotone" dataKey="covers" fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" strokeWidth={2} name="Customer Covers" />
              <Bar yAxisId="right" dataKey="assignedStaff" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Staff Assigned" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter Tabs for Shifts */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Filter Schedule:
          </span>
          <div className="flex p-0.5 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold trough-3d">
            <button
              onClick={() => setSelectedShiftFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedShiftFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Shifts (14)
            </button>
            <button
              onClick={() => setSelectedShiftFilter('LUNCH')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedShiftFilter === 'LUNCH'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lunch Only (11:30 - 16:00)
            </button>
            <button
              onClick={() => setSelectedShiftFilter('DINNER')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedShiftFilter === 'DINNER'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dinner Only (17:30 - 23:30)
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Week of <strong className="text-white">{scheduleData.weekRange}</strong>
        </div>
      </div>

      {/* --- WEEKLY 7-DAY SHIFT MATRIX --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {daysList.map(day => {
          const dayShifts = scheduleData.shifts.filter(s => 
            s.day === day && (selectedShiftFilter === 'ALL' || s.shiftType === selectedShiftFilter)
          );

          return (
            <div key={day} className="space-y-3 flex flex-col">
              {/* Day Header */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
                <span className="text-xs font-black uppercase tracking-wider text-white block">
                  {day}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {dayShifts[0]?.dateStr || ''}
                </span>
              </div>

              {/* Shifts for the Day */}
              <div className="space-y-3 flex-1">
                {dayShifts.map(shift => {
                  const isSurge = shift.demandIntensity === 'PEAK_SURGE';
                  const isHigh = shift.demandIntensity === 'HIGH';
                  const isUnderstaffed = shift.status === 'UNDERSTAFFED';

                  return (
                    <div
                      key={shift.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 text-xs ${
                        isSurge
                          ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-950/20'
                          : isHigh
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : 'bg-slate-900/70 border-slate-800'
                      }`}
                    >
                      {/* Shift Header Meta */}
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-white flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {shift.shiftType}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            isSurge
                              ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                              : isHigh
                              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {shift.projectedCovers} Covers
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {shift.startTime} – {shift.endTime}
                        </div>
                      </div>

                      {/* Required vs Assigned Status */}
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Coverage:</span>
                          <span className={`font-mono font-bold ${isUnderstaffed ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {shift.assignedStaffIds.length} / {shift.suggestedStaffCount.total} Needed
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-500 flex justify-between font-mono">
                          <span>K:{shift.suggestedStaffCount.kitchen}</span>
                          <span>S:{shift.suggestedStaffCount.service}</span>
                          <span>C:{shift.suggestedStaffCount.cashier}</span>
                        </div>
                      </div>

                      {/* Assigned Staff Avatars & Tags */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
                          Assigned ({shift.assignedStaffIds.length})
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {shift.assignedStaffIds.map(stId => {
                            const staff = scheduleData.staffRoster.find(r => r.id === stId);
                            if (!staff) return null;
                            return (
                              <span
                                key={stId}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 flex items-center gap-1 border border-slate-700 max-w-[120px] truncate"
                                title={`${staff.name} (${staff.station})`}
                              >
                                {getStationIcon(staff.station)}
                                <span className="truncate">{staff.name.split(' ')[0]}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Risk Alert Note if Understaffed */}
                      {shift.riskNote && (
                        <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[10px] text-rose-300 leading-snug">
                          {shift.riskNote}
                        </div>
                      )}

                      {/* Edit Assignment Button */}
                      <button
                        onClick={() => {
                          setActiveShiftToEdit(shift);
                          setSelectedStaffIds([...shift.assignedStaffIds]);
                        }}
                        className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer border border-slate-700 button-3d"
                      >
                        <Plus className="w-3 h-3 text-amber-400" />
                        <span>Edit Brigade</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Staff Brigade Team Roster Overview Strip */}
      <div className="p-5 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-750 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Active Staff Brigade Roster & Weekly Workload
            </h3>
            <p className="text-xs text-slate-400">
              Station distribution, assigned hours, and fatigue safeguards
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {scheduleData.staffRoster.length} Total Team Members Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {scheduleData.staffRoster.map(st => {
            const utilization = Math.round((st.assignedHours / st.maxWeeklyHours) * 100);
            return (
              <div 
                key={st.id} 
                className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2.5 hover:border-stone-700 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                    <img src={st.avatar} alt={st.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{st.name}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      {getStationIcon(st.station)}
                      <span>{st.station}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Assigned: {st.assignedHours}h / {st.maxWeeklyHours}h max</span>
                    <span className="font-bold text-white">{utilization}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full ${utilization > 90 ? 'bg-amber-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, utilization)}%` }}
                    />
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono">
                  {st.assignedShiftCount} Shifts Scheduled
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- EDIT SHIFT BRIGADE MODAL --- */}
      {activeShiftToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Assign Staff to {activeShiftToEdit.day} {activeShiftToEdit.shiftType}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {activeShiftToEdit.startTime} – {activeShiftToEdit.endTime} · {activeShiftToEdit.projectedCovers} Projected Covers
                </span>
              </div>
              <button 
                onClick={() => setActiveShiftToEdit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Select Brigade Members:
              </span>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {scheduleData.staffRoster.map(staff => {
                  const isSelected = selectedStaffIds.includes(staff.id);
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedStaffIds(selectedStaffIds.filter(id => id !== staff.id));
                        } else {
                          setSelectedStaffIds([...selectedStaffIds, staff.id]);
                        }
                      }}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/50 text-white'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
                          <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{staff.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{staff.station} ({staff.role})</div>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        isSelected ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs font-mono text-slate-400">
                {selectedStaffIds.length} of {activeShiftToEdit.suggestedStaffCount.total} suggested staff selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveShiftToEdit(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveShiftAssignment}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md button-3d"
                >
                  Save Shift Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
