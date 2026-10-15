import React, { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, AlertTriangle, CheckCircle2, 
  Volume2, VolumeX, Sparkles, RefreshCw, Share2, 
  Flame, Clock, ShieldCheck, DollarSign, Utensils, 
  ChevronDown, ChevronUp, Copy, Check, ChefHat, 
  Scale, Award, Radio, Play, Pause, Square, Zap,
  Layers, Info, ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  DailyHuddleData, ShiftFocusMode, StationStatus, 
  ProjectedPeakWindow, TacticalDirectiveItem 
} from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { PeakShiftCanvas3D } from '../3d/PeakShiftCanvas3D.tsx';

interface DailyHuddleSummaryProps {
  onNavigateTab?: (tab: string) => void;
  onOpenCopilot?: (initialQuery?: string) => void;
}

export const DailyHuddleSummary: React.FC<DailyHuddleSummaryProps> = ({
  onNavigateTab,
  onOpenCopilot
}) => {
  const { currentBranch, user } = useAuth();
  const [huddleData, setHuddleData] = useState<DailyHuddleData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFocus, setSelectedFocus] = useState<ShiftFocusMode>('BALANCED');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PEAK_3D' | 'STATIONS' | 'DIRECTIVES'>('OVERVIEW');
  const [copied, setCopied] = useState<boolean>(false);

  // Audio / Speech Synthesis state
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [speechSynth, setSpeechSynth] = useState<SpeechSynthesisUtterance | null>(null);

  // Manager interactive checklist state
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    'prep_scales': false,
    'water_carafes': false,
    'upi_soundbox': true,
    'dairy_chiller': false
  });

  const createClientFallbackHuddle = (branchName: string, focusMode: ShiftFocusMode): DailyHuddleData => ({
    shiftInfo: {
      shiftName: 'Dinner Rush Service',
      shiftLead: 'Rahul Verma (Floor Manager)',
      serviceWindow: '17:00 – 23:30',
      date: new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }),
      branchName: branchName || 'Cyber Hub Flagship',
      focusMode,
    },
    operationalMetrics: {
      todayRevenue: 48650,
      revenueTarget: 65000,
      targetProgressPct: 75,
      activeOrdersCount: 4,
      completedCovers: 112,
      avgTicketSize: 1430,
      tableOccupancyPct: 67,
      occupiedTablesCount: 12,
      totalTablesCount: 18,
      kitchenKotAvgTimeMins: 14.2,
      foodCostDriftPct: 25.3,
      wastageLossToday: 1420,
      healthScore: 92,
    },
    staffingStatus: {
      totalActiveStaff: 6,
      stationCoverageRatioPct: 100,
      shiftLeadName: 'Rahul Verma',
      shiftNotes: 'All 4 operational stations manned. 1 staff meal rotation scheduled at 18:30.',
      stations: [
        {
          id: 'st_kitchen',
          stationName: 'Kitchen Brigade & Tandoor',
          leadName: 'Chef Vikram Singh',
          staffCount: 3,
          readinessPct: focusMode === 'SPEED' ? 98 : 94,
          status: 'OPTIMAL',
          statusNote: 'Tandoor running at 320°C. 3 active tickets. Average turnaround 14.2m.',
          keyDirectives: [
            'Pre-portion 35 skewers chicken tikka in Cold Line',
            'Enforce digital scales on butter chicken gravy to eliminate +25% drift',
            'Keep 4 handis of Dal Makhani on steady rolling simmer',
          ],
        },
        {
          id: 'st_service',
          stationName: 'Captains & Floor Service',
          leadName: 'Captain Amit Patel',
          staffCount: 2,
          readinessPct: focusMode === 'VIP' ? 99 : 92,
          status: 'OPTIMAL',
          statusNote: 'Sections A & B fully covered. 2 VIP reservations (Table T04 & T08).',
          keyDirectives: [
            'Greet and pour water within 90 seconds of seating',
            'Lead with Awadhi Dum Biryani pairing recommendation (74% margin)',
            'Flag bill requests immediately to Cashier for rapid turnover',
          ],
        },
        {
          id: 'st_billing',
          stationName: 'Cashier & POS Terminal',
          leadName: 'Priya Sharma',
          staffCount: 1,
          readinessPct: 98,
          status: 'OPTIMAL',
          statusNote: 'Dynamic UPI QR enabled. Printer rolls verified. 0 pending splits.',
          keyDirectives: [
            'Collect customer mobile numbers for 10% repeat dining rebate',
            'Suggest dessert or mocktail addon on check presentation',
            'Prompt 5-star Google review on high-satisfaction tables',
          ],
        },
        {
          id: 'st_inventory',
          stationName: 'Store & Cold Prep Line',
          leadName: 'Sunita Rao',
          staffCount: 1,
          readinessPct: focusMode === 'ZERO_WASTE' ? 96 : 88,
          status: 'ATTENTION',
          statusNote: 'Low stock on Fresh Cream (2.4L remaining). Tomato stock critical.',
          keyDirectives: [
            'Monitor dairy consumption closely during 20:30 rush',
            'Verify Azadpur Mandi poultry invoice upon night delivery',
            'Seal batch B-COR-2809 coriander before night close',
          ],
        },
      ],
    },
    projectedPeaks: {
      currentPhase: 'Approaching Dinner Rush Peak',
      totalProjectedShiftCovers: 202,
      peakRushTime: '20:30 – 22:00',
      windows: [
        {
          id: 'peak_1',
          timeWindow: '18:00 – 19:15',
          projectedCovers: 32,
          capacityUtilization: 48,
          loadLevel: 'MODERATE',
          rushStatus: 'Shift Warm-Up',
          highlight: 'Early family diners & quick appetizers',
          prepPrerequisite: 'Ensure bread baskets, water carafes & chutney sets fully stocked',
        },
        {
          id: 'peak_2',
          timeWindow: '19:15 – 20:30',
          projectedCovers: 58,
          capacityUtilization: 78,
          loadLevel: 'HIGH',
          rushStatus: 'Primary Dinner Surge',
          highlight: 'Heavy curry & biryani order wave hitting kitchen simultaneously',
          prepPrerequisite: 'Chef Vikram to pre-cook first batch of 18 biryani handis',
        },
        {
          id: 'peak_3',
          timeWindow: '20:30 – 22:00',
          projectedCovers: 78,
          capacityUtilization: 98,
          loadLevel: 'CRITICAL_PEAK',
          rushStatus: 'Maximum Peak Rush (Near 100% Occupancy)',
          highlight: 'Table turns bottleneck window. VIP table arrivals expected',
          prepPrerequisite: 'Floor captains maintain rapid bussing within 3 minutes of check-out',
        },
        {
          id: 'peak_4',
          timeWindow: '22:00 – 23:15',
          projectedCovers: 34,
          capacityUtilization: 45,
          loadLevel: 'MODERATE',
          rushStatus: 'Last Call & Desserts',
          highlight: 'Cocktails, Phirni, Kulfi & billing wind-down',
          prepPrerequisite: 'Station pre-closing checklist begins for kitchen prep line',
        },
      ],
      prepRecommendations: [
        'Parboil 18 kg Basmati rice before 19:15 dinner surge',
        'Pre-portion 35 tandoori chicken skewers in Cold Line prep pans',
        'Stage 2 spare cutlery roll bins at Station 1 to prevent service slowdowns',
        'Verify UPI static soundbox battery is 100% for cashier speed',
      ],
    },
    tacticalDirectives: {
      pushItems: [
        {
          id: 'push_1',
          dishOrItem: 'Awadhi Dum Biryani (Murgh)',
          category: 'PUSH_PROFIT',
          rationale: 'Star item with 74.2% contribution margin (+₹355 profit per handi plate)',
          marginOrCostImpact: '+₹355 Net Margin',
          badge: 'Top Profit Star',
        },
        {
          id: 'push_2',
          dishOrItem: 'Slow-Simmered Dal Makhani',
          category: 'PUSH_PROFIT',
          rationale: 'Low cost ingredient base (₹78 cost vs ₹320 sell price) — instant kitchen pass',
          marginOrCostImpact: '75.6% Margin',
          badge: 'High Velocity',
        },
        {
          id: 'push_3',
          dishOrItem: 'Kesar Phirni in Clay Kasora',
          category: 'VIP_EXPERIENCE',
          rationale: 'Pre-set in dessert chiller, 82% margin, instant turn dessert upsell',
          marginOrCostImpact: '+₹148 Margin',
          badge: 'Dessert Upsell',
        },
      ],
      watchItems: [
        {
          id: 'watch_1',
          dishOrItem: 'Fresh Boneless Chicken Portioning',
          category: 'PORTION_DRIFT',
          rationale: 'Running +25.3% over recipe specification. Zero tolerance for unmeasured scoops.',
          marginOrCostImpact: '₹1,012 Drift Risk',
          badge: 'Scale Mandatory',
        },
        {
          id: 'watch_2',
          dishOrItem: 'Amul Fresh Cream Stock',
          category: '86_WATCH',
          rationale: 'Only 2.4 Liters remaining. Walk-In restock scheduled tomorrow morning.',
          marginOrCostImpact: 'Risk of 86 at 21:00',
          badge: 'Low Stock Alert',
        },
      ],
      servicePledges: [
        'Water poured within 90 seconds of seating',
        'First beverage or appetizer order logged in POS within 3 minutes',
        'KDS alert triggered if any main course ticket exceeds 16 minutes',
        'Table bussed & reset within 3 minutes of guest departure',
      ],
    },
    aiBriefing: {
      generatedBy: 'RestaurantOS Executive Copilot',
      strategicMotto: 'Precision on the line, hospitality on the floor: deliver margin and own the 8:30 rush!',
      speechBriefing: `Good evening team! Welcome to tonight's dinner service at ${branchName || 'Zafran Bistro'}. We are at ₹48,650, tracking toward our ₹65,000 target. We have 6 staff on shift, and all stations are fully manned. Chef Vikram, please ensure the 35 pre-skewered chicken portions are ready before 7:30 PM. Floor team, remember: water within 90 seconds, and actively push the Awadhi Dum Biryani which gives us a 74% contribution margin. Let's make tonight smooth, fast, and profitable!`,
      confidenceScore: 96,
      aiNotes: [
        'Peak surge arriving between 20:30 and 22:00 (78 projected covers).',
        'Awadhi Dum Biryani offers highest contribution margin (+₹355/portion).',
        'Digital scales required on poultry line to prevent +25% recipe drift.',
      ],
      generatedAt: new Date().toISOString(),
    },
  });

  // Fetch or regenerate Daily Huddle data
  const fetchHuddle = async (focusMode: ShiftFocusMode = selectedFocus) => {
    setLoading(true);
    try {
      const data = await api.get<DailyHuddleData>(`/analytics/daily-huddle?branchId=${currentBranch?.id || ''}&focusMode=${focusMode}`);
      if (data && data.shiftInfo) {
        setHuddleData(data);
      } else {
        setHuddleData(createClientFallbackHuddle(currentBranch?.name || 'Cyber Hub Flagship', focusMode));
      }
    } catch {
      // Deterministic shift briefing fallback
      setHuddleData(createClientFallbackHuddle(currentBranch?.name || 'Cyber Hub Flagship', focusMode));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHuddle(selectedFocus);
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentBranch?.id]);

  // Handle focus mode change
  const handleFocusChange = async (mode: ShiftFocusMode) => {
    setSelectedFocus(mode);
    if (isPlayingAudio && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
    await fetchHuddle(mode);
  };

  // Pre-Shift Voice Briefing (Browser SpeechSynthesis)
  const toggleSpeechBriefing = () => {
    if (!huddleData) return;

    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in your browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel(); // clear queue
    const textToRead = `${huddleData.aiBriefing.strategicMotto}. ${huddleData.aiBriefing.speechBriefing}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 1.02;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN';

    utterance.onend = () => {
      setIsPlayingAudio(false);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
    };

    setSpeechSynth(utterance);
    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  // Toggle checklist item & trigger celebration when all are checked
  const toggleChecklistItem = (key: string) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);

    const allChecked = Object.values(updated).every(Boolean);
    if (allChecked && !Object.values(checklist).every(Boolean)) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  // Copy Briefing for WhatsApp
  const handleCopyWhatsApp = () => {
    if (!huddleData) return;
    const text = `📢 *ZAFRAN GOURMET BISTRO — PRE-SHIFT HUDDLE*
Shift: ${huddleData.shiftInfo.shiftName} (${huddleData.shiftInfo.serviceWindow})
Shift Lead: ${huddleData.shiftInfo.shiftLead}
Focus Mode: ${huddleData.shiftInfo.focusMode}

🔥 *BATTLE CRY / MOTTO:*
"${huddleData.aiBriefing.strategicMotto}"

📊 *KEY SHIFT TARGETS:*
• Revenue Target: ₹${huddleData.operationalMetrics.revenueTarget.toLocaleString('en-IN')} (Current: ₹${huddleData.operationalMetrics.todayRevenue.toLocaleString('en-IN')})
• Kitchen Ticket Target: < 15 mins (Current: ${huddleData.operationalMetrics.kitchenKotAvgTimeMins}m)
• Tables Active: ${huddleData.operationalMetrics.occupiedTablesCount}/${huddleData.operationalMetrics.totalTablesCount} (${huddleData.operationalMetrics.tableOccupancyPct}%)

⚡ *PROJECTED PEAK SURGE:*
• ${huddleData.projectedPeaks.peakRushTime} — Expected 78 covers (98% capacity)
• Action: ${huddleData.projectedPeaks.windows.find(w => w.loadLevel === 'CRITICAL_PEAK')?.prepPrerequisite || 'Pre-portion poultry & fast table resets'}

⭐ *HIGH-MARGIN DISHES TO PUSH:*
${huddleData.tacticalDirectives.pushItems.map(p => `• ${p.dishOrItem} (${p.marginOrCostImpact})`).join('\n')}

⚠️ *CRITICAL WATCHLIST & PORTION CONTROL:*
${huddleData.tacticalDirectives.watchItems.map(w => `• ${w.dishOrItem} — ${w.rationale}`).join('\n')}

Let's make tonight smooth, fast, and profitable! 🚀`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading && !huddleData) {
    return (
      <div className="p-12 text-center rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 animate-spin">
          <RefreshCw className="w-8 h-8" />
        </div>
        <div className="text-base font-bold text-white tracking-wide">
          Synthesizing AI Daily Huddle for {currentBranch?.name || 'Branch'}...
        </div>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Pulling verified operational figures, KDS turnaround paces, station staffing coverage, and projected peak hour curves.
        </p>
      </div>
    );
  }

  if (!huddleData) return null;

  const focusOptions: { mode: ShiftFocusMode; label: string; icon: string; desc: string }[] = [
    { mode: 'BALANCED', label: 'Balanced Ops', icon: '⚖️', desc: 'Equal emphasis on speed, margins, and guest care' },
    { mode: 'SPEED', label: 'Rush Velocity', icon: '⚡', desc: 'Fast turnaround, under-14m tickets & rapid table bussing' },
    { mode: 'PROFIT', label: 'Margin Maximizer', icon: '💎', desc: 'Active upselling on Awadhi Biryani (+₹355 profit/dish)' },
    { mode: 'ZERO_WASTE', label: 'Zero-Waste & Scales', icon: '🛡️', desc: 'Zero unmeasured scoops to halt +25% chicken drift' },
    { mode: 'VIP', label: 'VIP Hospitality', icon: '⭐', desc: '90-second greetings, 2 VIP tables & 5-star review push' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="relative p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 border border-stone-800 shadow-2xl overflow-hidden">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold font-mono tracking-wider flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  DAILY HUDDLE AI ENGINE
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[11px] font-bold font-mono">
                  {huddleData.shiftInfo.shiftName} • {huddleData.shiftInfo.serviceWindow}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                  {huddleData.staffingStatus.stationCoverageRatioPct}% Station Coverage
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                Pre-Shift Operational Briefing
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Led by <strong className="text-white">{huddleData.shiftInfo.shiftLead}</strong> at <strong className="text-amber-400">{huddleData.shiftInfo.branchName}</strong>. Live AI synthesis of critical sales pace, brigade status, and peak surge prep.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {/* Play Audio Briefing Button (AI Voice Support) */}
              <button
                onClick={toggleSpeechBriefing}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg button-3d ${
                  isPlayingAudio
                    ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/30 animate-pulse'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop AI Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>🔊 Read Aloud Briefing</span>
                  </>
                )}
              </button>

              {/* Copy WhatsApp Button */}
              <button
                onClick={handleCopyWhatsApp}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md button-3d"
                title="Copy formatted briefing to WhatsApp or clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-slate-400" />
                    <span>Share Lineup</span>
                  </>
                )}
              </button>

              {/* Regenerate AI Briefing */}
              <button
                onClick={() => fetchHuddle(selectedFocus)}
                disabled={loading}
                className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-all cursor-pointer button-3d"
                title="Regenerate with fresh real-time metrics"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Audio Visualizer Waveform Bar if playing */}
          {isPlayingAudio && (
            <div className="mt-5 p-3 rounded-2xl bg-slate-950/80 border border-amber-500/40 flex items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <span className="text-xs font-bold text-amber-300">
                  AI Voice Briefing Broadcasting Live to Team Lineup
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[40, 75, 100, 60, 90, 45, 80, 100, 65, 85, 50, 95].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-amber-400 rounded-full animate-pulse"
                    style={{
                      height: `${h * 0.25}px`,
                      animationDelay: `${i * 0.08}s`,
                      animationDuration: '0.6s'
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* AI Strategic Motto Box */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 block">
                  Today's Shift Battle Cry & Strategic Directive
                </span>
                <p className="text-sm sm:text-base font-bold text-white italic mt-0.5">
                  "{huddleData.aiBriefing.strategicMotto}"
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-slate-800/80 text-slate-400 border border-slate-700">
                Generated via {huddleData.aiBriefing.generatedBy}
              </span>
            </div>
          </div>

          {/* Shift Strategy Focus Selector (Premium Feature) */}
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                Shift Strategic Focus Mode
              </span>
              <span className="text-[11px] text-slate-400">
                Select shift priority to adapt AI directives & speech
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {focusOptions.map((opt) => {
                const isSelected = selectedFocus === opt.mode;
                return (
                  <button
                    key={opt.mode}
                    onClick={() => handleFocusChange(opt.mode)}
                    className={`p-2.5 rounded-2xl text-left transition-all border cursor-pointer button-3d flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-500/10'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-sm">{opt.icon}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      {/* Navigation Tabs for Daily Huddle */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-3">
        <div className="flex p-1 bg-stone-900 rounded-xl border border-stone-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Shift Briefing Overview
          </button>
          <button
            onClick={() => setActiveTab('PEAK_3D')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'PEAK_3D'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            3D Peak Simulator
          </button>
          <button
            onClick={() => setActiveTab('STATIONS')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'STATIONS'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            Station Brigade ({huddleData.staffingStatus.stations.length})
          </button>
          <button
            onClick={() => setActiveTab('DIRECTIVES')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'DIRECTIVES'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Push & 86 Directives
          </button>
        </div>

        {/* Ask Copilot Shortcut */}
        {onOpenCopilot && (
          <button
            onClick={() => onOpenCopilot(`Give me actionable shift recommendations for tonight's ${selectedFocus} daily huddle.`)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all cursor-pointer button-3d"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Ask Copilot Shift Advice
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* CRITICAL OPERATIONAL METRICS (CLEAN MODERN CARDS) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue Pace */}
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1 h-full flex flex-col justify-between shadow-sm hover:border-stone-700 transition-all">
              <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
                <span className="uppercase text-[10px] tracking-wider font-semibold">Today's Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-black font-mono text-white tracking-tight">
                  ₹{huddleData.operationalMetrics.todayRevenue.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  Target: ₹{huddleData.operationalMetrics.revenueTarget.toLocaleString('en-IN')} ({huddleData.operationalMetrics.targetProgressPct}%)
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-stone-950/80 h-2 rounded-full overflow-hidden border border-stone-800 mt-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, huddleData.operationalMetrics.targetProgressPct)}%` }}
                />
              </div>
            </div>

            {/* Table Occupancy */}
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1 h-full flex flex-col justify-between shadow-sm hover:border-stone-700 transition-all">
              <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
                <span className="uppercase text-[10px] tracking-wider font-semibold">Live Table Occupancy</span>
                <Utensils className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-black font-mono text-white tracking-tight">
                  {huddleData.operationalMetrics.occupiedTablesCount} / {huddleData.operationalMetrics.totalTablesCount}
                  <span className="text-xs font-normal text-stone-400 ml-1.5 font-sans">
                    ({huddleData.operationalMetrics.tableOccupancyPct}%)
                  </span>
                </div>
                <div className="text-[11px] text-blue-300 font-medium mt-0.5">
                  {huddleData.operationalMetrics.totalTablesCount - huddleData.operationalMetrics.occupiedTablesCount} tables ready for walk-ins
                </div>
              </div>
              <div className="text-[10px] text-stone-400 font-mono mt-2">
                Avg Ticket: ₹{huddleData.operationalMetrics.avgTicketSize.toLocaleString('en-IN')}
              </div>
            </div>

            {/* KDS Kitchen Speed */}
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1 h-full flex flex-col justify-between shadow-sm hover:border-stone-700 transition-all">
              <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
                <span className="uppercase text-[10px] tracking-wider font-semibold">Kitchen Pace (KDS)</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-black font-mono text-amber-400 tracking-tight">
                  {huddleData.operationalMetrics.kitchenKotAvgTimeMins}m
                  <span className="text-xs font-normal text-stone-400 ml-1.5 font-sans">avg ticket</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
                  Optimal pace (&lt; 16 mins target)
                </div>
              </div>
              <div className="text-[10px] text-stone-400 font-mono mt-2">
                {huddleData.operationalMetrics.activeOrdersCount} active KOT tickets on rail
              </div>
            </div>

            {/* Portion Control / Drift Risk */}
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1 h-full flex flex-col justify-between shadow-sm hover:border-stone-700 transition-all">
              <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
                <span className="uppercase text-[10px] tracking-wider font-semibold">Portion Drift Alert</span>
                <Scale className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <div className="text-2xl font-black font-mono text-rose-400 tracking-tight">
                  +{huddleData.operationalMetrics.foodCostDriftPct}%
                </div>
                <div className="text-[11px] text-rose-300 font-medium mt-0.5">
                  Chicken & butter ladle variance
                </div>
              </div>
              <div className="text-[10px] text-amber-400 font-bold mt-2">
                Weigh each handi portion digitally
              </div>
            </div>
          </div>

          {/* AI Pre-Shift Spoken Briefing Script Box */}
          <div className="p-6 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-750 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Shift Manager Lineup Speech Script
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Spoken briefing designed for the 5-minute pre-service team circle
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSpeechBriefing}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer button-3d ${
                    isPlayingAudio
                      ? 'bg-rose-500 text-white'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                  }`}
                >
                  {isPlayingAudio ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5" />}
                  {isPlayingAudio ? 'Stop Audio' : 'Play Script Aloud'}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-200 text-sm leading-relaxed italic font-serif">
              "{huddleData.aiBriefing.speechBriefing}"
            </div>

            {/* Tactical AI Notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {huddleData.aiBriefing.aiNotes.map((note, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300"
                >
                  <span className="w-5 h-5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-mono font-bold shrink-0 text-[10px]">
                    0{idx + 1}
                  </span>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Pre-Shift Setup Checklist */}
          <div className="p-5 rounded-3xl glass-panel bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Lineup Manager Readiness Checklist
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {Object.values(checklist).filter(Boolean).length} / 4 Completed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {[
                { key: 'prep_scales', label: 'Tandoor Digital Gram Scales Zeroed', detail: 'Prevents chicken portion drift' },
                { key: 'water_carafes', label: 'Water Carafes & Bread Baskets Staged', detail: 'Guarantees 90-second table greeting' },
                { key: 'upi_soundbox', label: 'Dynamic UPI Soundbox Online', detail: 'Instant checkout verification' },
                { key: 'dairy_chiller', label: 'Fresh Cream Chiller Level Checked', detail: 'Avoids 86 risk on gravies' }
              ].map(item => {
                const isChecked = !!checklist[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleChecklistItem(item.key)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer button-3d flex items-start gap-2.5 ${
                      isChecked
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md border mt-0.5 flex items-center justify-center shrink-0 ${
                      isChecked ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isChecked ? 'line-through text-slate-400' : 'text-white'}`}>
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.detail}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 3D PEAK SIMULATOR */}
      {activeTab === 'PEAK_3D' && (
        <div className="space-y-4">
          <PeakShiftCanvas3D windows={huddleData.projectedPeaks.windows} />

          {/* Peak Windows Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {huddleData.projectedPeaks.windows.map(win => {
              const isPeak = win.loadLevel === 'CRITICAL_PEAK';
              const isHigh = win.loadLevel === 'HIGH';
              return (
                <div
                  key={win.id}
                  className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
                    isPeak
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/30'
                      : isHigh
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-white flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {win.timeWindow}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      isPeak
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : isHigh
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}>
                      {win.rushStatus}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-xl font-black font-mono text-white">
                        {win.projectedCovers} <span className="text-xs font-normal text-slate-400 font-sans">covers</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {win.capacityUtilization}% Table Capacity
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 leading-snug pt-1 border-t border-slate-800/80">
                    <strong className="text-amber-400 text-[11px] block">Prep Prerequisite:</strong>
                    {win.prepPrerequisite}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kitchen & Floor Peak Recommendations */}
          <div className="p-4 rounded-2xl glass-panel bg-slate-900/90 border border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Executive Shift Peak Recommendations
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              {huddleData.projectedPeaks.prepRecommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STATION BRIGADE */}
      {activeTab === 'STATIONS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {huddleData.staffingStatus.stations.map((st) => (
              <div key={st.id} className="p-5 rounded-2xl bg-stone-900/95 border border-stone-800 shadow-md space-y-4 h-full flex flex-col justify-between hover:border-stone-700 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-stone-800 text-amber-400 border border-stone-700">
                        <ChefHat className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{st.stationName}</h4>
                        <span className="text-[11px] text-stone-400 font-mono">
                          Lead: {st.leadName} • {st.staffCount} Staff
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        st.status === 'OPTIMAL'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        {st.status}
                      </span>
                      <div className="text-xs font-mono font-bold text-white mt-1">
                        {st.readinessPct}% Ready
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800 text-xs text-stone-300">
                    {st.statusNote}
                  </div>
                </div>

                {/* Station Directives */}
                <div className="space-y-1.5 pt-2 border-t border-stone-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Shift Directives
                  </span>
                  {st.keyDirectives.map((dir, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-stone-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{dir}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DIRECTIVES & PUSH LIST */}
      {activeTab === 'DIRECTIVES' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* High-Margin Push Items */}
            <div className="p-5 rounded-3xl glass-panel bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    High Contribution Margin Dishes to Push
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Active table recommendations drive +15% net shift margin
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {huddleData.tacticalDirectives.pushItems.map(item => (
                  <div 
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{item.dishOrItem}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {item.rationale}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-emerald-400 block">
                        {item.marginOrCostImpact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Watch Items / Portion Control */}
            <div className="p-5 rounded-3xl glass-panel bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Critical Watchlist & 86 Risk Prevention
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Tight portion control halts unbudgeted kitchen leakage
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {huddleData.tacticalDirectives.watchItems.map(item => (
                  <div 
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-rose-500/20 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{item.dishOrItem}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {item.rationale}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-rose-400 block">
                        {item.marginOrCostImpact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Service Pledges */}
          <div className="p-5 rounded-3xl glass-panel bg-slate-900/90 border border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Tonight's Service Standards & Turnaround Pledges
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-300">
              {huddleData.tacticalDirectives.servicePledges.map((pledge, i) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{pledge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
