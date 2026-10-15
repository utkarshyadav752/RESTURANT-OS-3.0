import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  Legend
} from 'recharts';
import { 
  TrendingUp, Sparkles, Clock, Flame, Users, 
  Layers, BarChart3, AlertTriangle, ShieldCheck,
  Calendar, Zap, ArrowUpRight
} from 'lucide-react';
import { DemandForecast } from '../../types/index.ts';

interface DemandPeaksChart3DProps {
  forecasts?: DemandForecast[];
  className?: string;
}

// Custom 3D Isometric Bar Renderer with Front, Top Cap & Shadow Side
const Custom3DBar = (props: any) => {
  const { x, y, width, height, fill, payload } = props;
  if (!height || height <= 0) return null;

  const isPeak = payload?.isPeak || payload?.loadLevel === 'CRITICAL_PEAK';
  const depth = Math.min(8, Math.max(4, width * 0.28));

  const barColor = isPeak ? '#f43f5e' : fill || '#38bdf8';
  const topCapColor = isPeak ? 'rgba(255, 180, 195, 0.7)' : 'rgba(255, 255, 255, 0.45)';
  const sideColor = isPeak ? 'rgba(159, 18, 57, 0.6)' : 'rgba(0, 0, 0, 0.4)';

  return (
    <g className="transition-all duration-300 cursor-pointer">
      {/* Front Face */}
      <rect
        x={x}
        y={y}
        width={width - depth}
        height={height}
        fill={barColor}
        rx={3}
      />
      {/* Top 3D Extruded Cap */}
      <polygon
        points={`${x},${y} ${x + depth},${y - depth} ${x + width},${y - depth} ${x + width - depth},${y}`}
        fill={topCapColor}
      />
      {/* Right 3D Shadow Side Face */}
      <polygon
        points={`${x + width - depth},${y} ${x + width},${y - depth} ${x + width},${y + height - depth} ${x + width - depth},${y + height}`}
        fill={sideColor}
      />
      {/* Top Specular Rim */}
      <line
        x1={x}
        y1={y}
        x2={x + width - depth}
        y2={y}
        stroke="rgba(255, 255, 255, 0.6)"
        strokeWidth={1}
      />
      {/* Peak Glow Ring indicator */}
      {isPeak && (
        <circle
          cx={x + (width - depth) / 2}
          cy={y - depth - 6}
          r={4}
          fill="#f43f5e"
          className="animate-ping"
          opacity={0.8}
        />
      )}
    </g>
  );
};

export const DemandPeaksChart3D: React.FC<DemandPeaksChart3DProps> = ({
  forecasts = [],
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'HOURLY_PEAKS' | 'ITEM_CONFIDENCE' | 'WEEKLY_TRAJECTORY'>('HOURLY_PEAKS');
  const [chartType, setChartType] = useState<'AREA' | 'BAR'>('AREA');

  // 1. Hourly Service Shift Peaks Dataset
  const hourlyData = [
    { time: '12:00', covers: 18, kotLoad: 7, capacity: 80, revenue: 21600, status: 'Lunch Open', isPeak: false, note: 'Early walk-ins' },
    { time: '12:45', covers: 36, kotLoad: 14, capacity: 80, revenue: 43200, status: 'Lunch Rush', isPeak: false, note: 'Corporate thali rush' },
    { time: '13:30', covers: 48, kotLoad: 19, capacity: 80, revenue: 57600, status: 'Lunch Peak', isPeak: false, note: 'Tandoor bread peak' },
    { time: '14:30', covers: 22, kotLoad: 8, capacity: 80, revenue: 26400, status: 'Afternoon Lull', isPeak: false, note: 'Desserts & billing' },
    { time: '16:00', covers: 12, kotLoad: 4, capacity: 80, revenue: 14400, status: 'Prep Hours', isPeak: false, note: 'Line restocking' },
    { time: '18:00', covers: 28, kotLoad: 11, capacity: 80, revenue: 33600, status: 'Dinner Warm-Up', isPeak: false, note: 'Early diners' },
    { time: '19:15', covers: 56, kotLoad: 23, capacity: 80, revenue: 67200, status: 'Dinner Surge', isPeak: false, note: 'Heavy curry orders' },
    { time: '20:30', covers: 78, kotLoad: 35, capacity: 80, revenue: 93600, status: 'PRIMARY PEAK', isPeak: true, note: '98% table capacity! Prep bottleneck' },
    { time: '21:30', covers: 62, kotLoad: 24, capacity: 80, revenue: 74400, status: 'Post-Peak Surge', isPeak: false, note: 'Second table turn wave' },
    { time: '22:30', covers: 32, kotLoad: 10, capacity: 80, revenue: 38400, status: 'Last Call', isPeak: false, note: 'Cocktails & Phirni' },
  ];

  // 2. Item-Level Demand & Confidence Intervals
  const itemData = forecasts.length > 0 ? forecasts.map(f => ({
    name: f.item_name.replace('Purani Dilli ', '').replace('Slow-Simmered Zafran ', '').replace('Awadhi Murgh ', ''),
    projected: f.forecasted_units,
    lower: f.lower_bound,
    upper: f.upper_bound,
    confidence: f.confidence_percentage,
    spread: f.upper_bound - f.lower_bound,
    isPeak: f.forecasted_units >= 40,
    factors: f.key_factors.join(' · ')
  })) : [
    { name: 'Butter Chicken', projected: 42, lower: 38, upper: 47, confidence: 86, spread: 9, isPeak: true, factors: 'Bestseller' },
    { name: 'Dum Biryani', projected: 36, lower: 31, upper: 41, confidence: 82, spread: 10, isPeak: false, factors: 'Corporate group lunch' },
    { name: 'Dal Makhani', projected: 45, lower: 41, upper: 50, confidence: 94, spread: 9, isPeak: true, factors: 'Accompanies 84% orders' },
    { name: 'Paneer Handi', projected: 28, lower: 25, upper: 32, confidence: 89, spread: 7, isPeak: false, factors: 'Veg favorite' },
    { name: 'Old Fashioned', projected: 24, lower: 19, upper: 29, confidence: 78, spread: 10, isPeak: false, factors: 'Happy hour trend' },
  ];

  // 3. Weekly Trajectory Dataset (Demand Wave across the week)
  const weeklyData = [
    { day: 'Mon', covers: 112, revenue: 134400, confidence: 91, isPeak: false, note: 'Baseline weekday' },
    { day: 'Tue (Today)', covers: 146, revenue: 175200, confidence: 89, isPeak: false, note: 'Active shift (+18%)' },
    { day: 'Wed', covers: 165, revenue: 198000, confidence: 86, isPeak: false, note: 'Tomorrow PO target' },
    { day: 'Thu', covers: 178, revenue: 213600, confidence: 84, isPeak: false, note: 'Pre-weekend ramp' },
    { day: 'Fri', covers: 248, revenue: 297600, confidence: 82, isPeak: true, note: 'Weekend dinner surge' },
    { day: 'Sat', covers: 292, revenue: 350400, confidence: 85, isPeak: true, note: 'MAX PEAK: 100% capacity' },
    { day: 'Sun', covers: 260, revenue: 312000, confidence: 88, isPeak: true, note: 'Sunday family lunch & dinner' },
  ];

  // Custom 3D Glass Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPeak = data.isPeak;

      return (
        <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-700 shadow-xl max-w-xs animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between gap-3 border-b border-stone-800 pb-2 mb-2">
            <span className="font-bold text-xs text-white flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {label || data.time || data.name || data.day}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
              isPeak 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              {data.status || (isPeak ? 'HIGH DEMAND PEAK' : 'NORMAL DEMAND')}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            {viewMode === 'HOURLY_PEAKS' && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">Projected Volume:</span>
                  <strong className="text-white font-mono text-sm">{data.covers} Covers</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">KDS Active Tickets:</span>
                  <strong className="text-amber-400 font-mono">{data.kotLoad} KOTs</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Capacity Load:</span>
                  <strong className={`${data.covers >= 70 ? 'text-rose-400' : 'text-emerald-400'} font-mono`}>
                    {Math.round((data.covers / data.capacity) * 100)}% Full
                  </strong>
                </div>
                {data.note && (
                  <div className="text-[11px] text-slate-300 pt-1 border-t border-white/10 leading-snug">
                    <span className="text-amber-400 font-bold">Observation: </span>{data.note}
                  </div>
                )}
              </>
            )}

            {viewMode === 'ITEM_CONFIDENCE' && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">Projected Units:</span>
                  <strong className="text-amber-400 font-mono text-sm">{data.projected} portions</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Forecast Range:</span>
                  <span className="font-mono text-slate-200">{data.lower} – {data.upper} portions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AI Confidence:</span>
                  <strong className="text-emerald-400 font-mono">{data.confidence}% Verified</strong>
                </div>
                {data.factors && (
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-white/10 line-clamp-2">
                    {data.factors}
                  </div>
                )}
              </>
            )}

            {viewMode === 'WEEKLY_TRAJECTORY' && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">Daily Demand:</span>
                  <strong className="text-white font-mono text-sm">{data.covers} Covers</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Projected Gross:</span>
                  <strong className="text-emerald-400 font-mono">₹{data.revenue.toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Statistical Confidence:</span>
                  <strong className="text-blue-300 font-mono">{data.confidence}%</strong>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`p-5 sm:p-6 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-sm relative overflow-hidden ${className}`}>
      
      {/* Top Header & Controls */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 border-b border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Demand Peaks & Rush Velocity Matrix
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  Predictive Analysis
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Predictive capacity curves, KDS volume bottlenecks, and dinner surge warning zones
              </p>
            </div>
          </div>
        </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex p-0.5 bg-slate-950/90 rounded-xl border border-white/10 text-xs font-bold trough-3d">
              <button
                onClick={() => setViewMode('HOURLY_PEAKS')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'HOURLY_PEAKS'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Shift Rush (Today)</span>
              </button>
              <button
                onClick={() => setViewMode('ITEM_CONFIDENCE')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'ITEM_CONFIDENCE'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Dish Volumes</span>
              </button>
              <button
                onClick={() => setViewMode('WEEKLY_TRAJECTORY')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'WEEKLY_TRAJECTORY'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>7-Day Wave</span>
              </button>
            </div>

            {/* Area vs Bar 3D Switcher */}
            <div className="flex p-0.5 bg-slate-950/90 rounded-xl border border-white/10 text-xs font-bold trough-3d">
              <button
                onClick={() => setChartType('AREA')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartType === 'AREA'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-500 hover:text-white'
                }`}
                title="Continuous 3D Spline Curve"
              >
                <TrendingUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setChartType('BAR')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartType === 'BAR'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-500 hover:text-white'
                }`}
                title="Extruded 3D Isometric Pillars"
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* --- 3D Chart Canvas Container --- */}
        <div className="w-full h-72 sm:h-80 relative">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'HOURLY_PEAKS' ? (
              chartType === 'AREA' ? (
                <AreaChart data={hourlyData} margin={{ top: 20, right: 20, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="covers3dGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.75} />
                      <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="kot3dGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                    <filter id="glow3d" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#64748b" 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} 
                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} 
                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine 
                    y={80} 
                    label={{ value: 'Full Capacity Limit (80 Covers)', fill: '#f43f5e', fontSize: 10, position: 'top' }} 
                    stroke="#f43f5e" 
                    strokeDasharray="4 4" 
                  />
                  <Area
                    type="monotone"
                    dataKey="covers"
                    name="Covers Demand"
                    stroke="#fbbf24"
                    strokeWidth={3}
                    fill="url(#covers3dGrad)"
                    filter="url(#glow3d)"
                    activeDot={{ r: 6, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="kotLoad"
                    name="KDS Active Tickets"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fill="url(#kot3dGrad)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={hourlyData} margin={{ top: 20, right: 20, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#64748b" 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} 
                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} 
                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={80} stroke="#f43f5e" strokeDasharray="4 4" />
                  <Bar 
                    dataKey="covers" 
                    shape={<Custom3DBar />} 
                    fill="#38bdf8"
                  />
                </BarChart>
              )
            ) : viewMode === 'ITEM_CONFIDENCE' ? (
              <BarChart data={itemData} margin={{ top: 20, right: 20, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="itemBar3d" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 11 }} 
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} 
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="projected" 
                  shape={<Custom3DBar />} 
                  fill="url(#itemBar3d)" 
                />
              </BarChart>
            ) : (
              <AreaChart data={weeklyData} margin={{ top: 20, right: 20, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="weeklyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.7} />
                    <stop offset="50%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#022c22" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} 
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} 
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="covers" 
                  stroke="#34d399" 
                  strokeWidth={3} 
                  fill="url(#weeklyGrad)" 
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* --- Bottom Intelligence Metrics Bar --- */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-3 border-t border-stone-800">
          <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800">
            <span className="text-[10px] text-stone-400 uppercase font-semibold block">Dinner Peak Surge</span>
            <div className="text-lg font-black font-mono text-rose-400 mt-0.5">
              20:30 (78 Covers)
            </div>
            <span className="text-[10px] text-rose-300 font-mono">98% Table Capacity</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800">
            <span className="text-[10px] text-stone-400 uppercase font-semibold block">Max KDS Queue</span>
            <div className="text-lg font-black font-mono text-amber-400 mt-0.5">
              35 Active KOTs
            </div>
            <span className="text-[10px] text-stone-400 font-mono">Est 14.2m turnaround</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800">
            <span className="text-[10px] text-stone-400 uppercase font-semibold block">Top Volume Dish</span>
            <div className="text-lg font-black font-mono text-white mt-0.5 truncate">
              Dal Makhani (45)
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">94% Statistical Conf</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800">
            <span className="text-[10px] text-stone-400 uppercase font-semibold block">Weekend Surge Delta</span>
            <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
              +98% Saturday
            </div>
            <span className="text-[10px] text-stone-400 font-mono">292 covers projected</span>
          </div>
        </div>

    </div>
  );
};
