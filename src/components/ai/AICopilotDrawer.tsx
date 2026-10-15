import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Sparkles, Send, X, ArrowUpRight, CheckCircle2, 
  AlertTriangle, Sliders, TrendingUp, DollarSign, HelpCircle, 
  RotateCcw, ShieldCheck, Flame, Scale, Volume2, Square, 
  Mic, MicOff, Users, Clock, Utensils, Zap, ChevronRight,
  Radio, Copy, Check, MessageSquare
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  structuredInsights?: { metricName: string; value: string; status: 'POSITIVE' | 'WARNING' | 'NEUTRAL' }[];
  suggestedAction?: { label: string; type: string; payload?: any };
  timestamp: string;
}

export const AICopilotDrawer: React.FC<Props> = ({ isOpen, onClose, onNavigateToTab }) => {
  const { currentBranch, restaurant } = useAuth();
  const [activeTab, setActiveTab] = useState<'COPILOT' | 'SHIFT_INSIGHTS' | 'SIMULATOR'>('COPILOT');
  
  // Chat state
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<MessageItem[]>([
    {
      id: 'init_1',
      role: 'assistant',
      content: `Welcome to **RestaurantOS AI Copilot** for **${currentBranch?.name || 'Zafran Bistro'}**.

I am grounded in your live POS orders, table occupancy, recipe BOM drift variance, and tonight's dinner surge projections. Ask me any operational query or explore instant shift insights below.`,
      timestamp: 'Live Engine',
      structuredInsights: [
        { metricName: "Shift Revenue", value: "₹48,650 / ₹65k", status: "POSITIVE" },
        { metricName: "Dinner Peak", value: "20:30 (78 covers)", status: "WARNING" },
        { metricName: "Chicken Drift", value: "+25.3% over BOM", status: "WARNING" },
        { metricName: "Brigade Coverage", value: "100% (6 staff)", status: "POSITIVE" }
      ],
      suggestedAction: {
        label: "Open 3D Daily Huddle Shift Sync",
        type: "NAVIGATE_HUDDLE"
      }
    }
  ]);

  // Audio / Speech Synthesis state
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Shift Insights Live Data state
  const [shiftData, setShiftData] = useState<any>(null);
  const [isFetchingShift, setIsFetchingShift] = useState(false);

  // Simulator state
  const [simType, setSimType] = useState<'RAW_INGREDIENT_PRICE_HIKE' | 'COVERS_SURGE' | 'WASTAGE_REDUCTION'>('RAW_INGREDIENT_PRICE_HIKE');
  const [simParam, setSimParam] = useState('Fresh Boneless Chicken Breast');
  const [simPercent, setSimPercent] = useState<number>(15);
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'COPILOT') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, isLoading, activeTab]);

  // Load shift insights when drawer opens or tab switches
  useEffect(() => {
    if (isOpen) {
      loadShiftData();
    }
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isOpen, currentBranch?.id]);

  const loadShiftData = async () => {
    setIsFetchingShift(true);
    try {
      const data = await api.get(`/analytics/daily-huddle?branchId=${currentBranch?.id || ''}&focusMode=BALANCED`);
      setShiftData(data);
    } catch (err) {
      console.warn('Failed to load shift telemetry:', err);
    } finally {
      setIsFetchingShift(false);
    }
  };

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Categorized Quick Operational Query Chips
  const quickQueryCategories = [
    {
      category: '⚡ Shift Peaks',
      prompts: [
        'When is tonight\'s peak dinner rush?',
        'What prep is required before 19:30 surge?',
        'What is our current table occupancy?'
      ]
    },
    {
      category: '💰 Margins & Push',
      prompts: [
        'Which dishes have the highest contribution margin?',
        'How much profit does Awadhi Dum Biryani make per dish?',
        'What are the best dessert pairings tonight?'
      ]
    },
    {
      category: '🍗 Recipe Drift',
      prompts: [
        'Why did chicken consumption drift +25.3% over recipe?',
        'How much margin are we losing on butter chicken portioning?',
        'How can we enforce portion controls on the cold line?'
      ]
    },
    {
      category: '🛒 Stock & Mandi PO',
      prompts: [
        'What should I purchase tomorrow morning?',
        'Why does the AI advise DON\'T BUY on onions and coriander?',
        'What ingredients are at critical low stock right now?'
      ]
    }
  ];

  // Send Query to Backend AI Engine
  const handleSendQuery = async (promptToSend?: string) => {
    const text = promptToSend || query;
    if (!text.trim() || isLoading) return;

    if (playingMessageId && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setPlayingMessageId(null);
    }

    const userMsgId = `u_${Date.now()}`;
    const userMsg: MessageItem = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversation((prev) => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    try {
      const res = await api.post('/ai/query', {
        prompt: text,
        branchId: currentBranch?.id,
      });

      const assistantMsg: MessageItem = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        structuredInsights: res.structuredInsights,
        suggestedAction: res.suggestedAction,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConversation((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setConversation((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'I encountered an issue querying the operational database. Please verify backend connection and try again.',
          timestamp: 'Just now',
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Play audio readout of message (AI Voice Support)
  const togglePlayAudio = (msg: MessageItem) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this device.');
      return;
    }

    if (playingMessageId === msg.id) {
      window.speechSynthesis.cancel();
      setPlayingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown asterisks for smooth audio speech
    const cleanSpeech = msg.content.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.03;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN';

    utterance.onend = () => setPlayingMessageId(null);
    utterance.onerror = () => setPlayingMessageId(null);

    setPlayingMessageId(msg.id);
    window.speechSynthesis.speak(utterance);
  };

  // Web Speech API Voice Dictation
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setQuery(transcript);
        }
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // Run What-If Simulation
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await api.post('/ai/simulate', {
        type: simType,
        parameterName: simParam,
        percentChange: simPercent,
      });
      setSimResult(res);
    } catch (err: any) {
      console.error('Simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleActionNavigation = (action?: { type: string }) => {
    if (!action || !onNavigateToTab) return;
    if (action.type === 'PURCHASE_PO') onNavigateToTab('forecast');
    else if (action.type === 'RECIPE_AUDIT') onNavigateToTab('menu');
    else if (action.type === 'NAVIGATE_HUDDLE') onNavigateToTab('huddle');
    else if (action.type === 'NAVIGATE') onNavigateToTab('dashboard');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose}
        aria-label="Close Copilot"
      />

      {/* 3D Glass-morphism Drawer Container */}
      <div className="w-full max-w-xl h-full flex flex-col relative overflow-hidden bg-slate-950/80 backdrop-blur-3xl border-l border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.85)] z-10 animate-in slide-in-from-right duration-300">
        
        {/* Specular Edge Highlighting (Simulates light refraction on physical 3D glass edge) */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none z-20" />
        <div className="absolute top-0 left-0 bottom-0 w-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none z-20" />
        
        {/* Ambient Spatial Radial Glows */}
        <div className="absolute top-10 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* --- Top 3D Header Bar --- */}
        <div className="relative px-5 py-4 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {/* Holographic 3D AI Orb */}
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950/90 rounded-[14px] flex items-center justify-center text-amber-400">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                  RestaurantOS AI Copilot
                </h3>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                  3D Grounded
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {currentBranch?.name || 'All Outlets'} • Connected to Live Kernel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Segmented Mode Switcher */}
            <div className="flex p-1 bg-stone-900 rounded-xl border border-stone-800 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('COPILOT')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'COPILOT'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3 h-3" />
                Copilot
              </button>
              <button
                onClick={() => setActiveTab('SHIFT_INSIGHTS')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'SHIFT_INSIGHTS'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3 h-3" />
                Shift Pulse
              </button>
              <button
                onClick={() => {
                  setActiveTab('SIMULATOR');
                  if (!simResult) handleRunSimulation();
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'SIMULATOR'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3 h-3" />
                What-If
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Copilot (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- TAB 1: OPERATIONAL COPILOT (CHAT) --- */}
        {activeTab === 'COPILOT' && (
          <div className="flex-1 flex flex-col overflow-hidden relative z-10">
            {/* Conversation Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {conversation.map((msg) => {
                const isAssistant = msg.role === 'assistant';
                const isPlaying = playingMessageId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[92%] p-4 rounded-2xl text-xs leading-relaxed transition-all relative ${
                        isAssistant
                          ? 'bg-stone-900/90 text-stone-200 border border-stone-800 rounded-tl-none shadow-sm'
                          : 'bg-amber-500 text-stone-950 font-medium rounded-tr-none shadow-sm'
                      }`}
                    >
                      {/* Assistant Header with Voice Audio Play button */}
                      {isAssistant && (
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-bold text-[11px] text-white">Verified AI Insight</span>
                          </div>

                          <button
                            onClick={() => togglePlayAudio(msg)}
                            className={`p-1 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer ${
                              isPlaying
                                ? 'bg-rose-500 text-white animate-pulse'
                                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-750'
                            }`}
                            title={isPlaying ? 'Stop audio readout' : 'Read answer aloud'}
                          >
                            {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Volume2 className="w-3 h-3" />}
                            <span>{isPlaying ? 'Stop' : 'Voice'}</span>
                          </button>
                        </div>
                      )}

                      {/* Content */}
                      <div className="whitespace-pre-line font-sans space-y-2">
                        {msg.content}
                      </div>

                      {/* Grounded telemetry badges */}
                      {msg.structuredInsights && msg.structuredInsights.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-1.5">
                          {msg.structuredInsights.map((ins, i) => (
                            <div
                              key={i}
                              className={`text-[10px] p-2 rounded-xl border font-mono flex flex-col justify-between ${
                                ins.status === 'POSITIVE'
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                  : ins.status === 'WARNING'
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                  : 'bg-slate-800/60 border-slate-700 text-slate-300'
                              }`}
                            >
                              <span className="text-slate-400 text-[9px] uppercase">{ins.metricName}</span>
                              <strong className="text-xs font-bold text-white mt-0.5">{ins.value}</strong>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Suggested Action Navigation Button */}
                      {msg.suggestedAction && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                          <button
                            onClick={() => handleActionNavigation(msg.suggestedAction)}
                            className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md button-3d"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {msg.suggestedAction.label}
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}

              {/* Loading animation */}
              {isLoading && (
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-stone-900/90 border border-amber-500/30 text-xs text-amber-300 w-fit shadow-sm animate-in fade-in">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Synthesizing live operational telemetry & recipes...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Operational Query Tray */}
            <div className="p-3 border-t border-white/10 bg-slate-950/60 backdrop-blur-md space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold flex items-center gap-1 text-slate-300">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Quick Operational Queries
                </span>
                <span className="text-[10px]">Tap to ask immediately</span>
              </div>

              {/* Categorized Prompts Carousel */}
              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                {quickQueryCategories.map((cat, cIdx) => (
                  <div key={cIdx} className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase shrink-0">
                      {cat.category}:
                    </span>
                    {cat.prompts.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSendQuery(p)}
                        className="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer button-3d truncate max-w-[280px]"
                        title={p}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Input Bar with Voice Support */}
            <div className="p-3 sm:p-4 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuery();
                }}
                className="flex items-center gap-2"
              >
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer button-3d ${
                    isListening
                      ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                      : 'bg-slate-900/80 text-slate-400 border-white/10 hover:text-white'
                  }`}
                  title={isListening ? 'Listening... click to stop' : 'Click to speak query (Voice Input)'}
                >
                  {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isListening ? 'Listening to voice...' : 'Ask operational query or shift peak insight...'}
                  className="flex-1 px-4 py-2.5 bg-slate-900/90 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all shadow-inner"
                />

                <button
                  type="submit"
                  disabled={!query.trim() || isLoading}
                  className="p-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-md shadow-amber-500/20 button-3d"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- TAB 2: SHIFT INSIGHTS (LIVE PULSE) --- */}
        {activeTab === 'SHIFT_INSIGHTS' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 relative z-10">
            {/* Top Shift Status Card */}
            <div className="p-5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <Zap className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">Current Shift Operations</h4>
                    <span className="text-[11px] text-stone-400">Dinner Rush (17:00 – 23:30)</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                  100% Station Green
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Revenue vs Goal</span>
                  <span className="text-base font-black font-mono text-emerald-400">₹48,650</span>
                  <span className="text-[10px] text-stone-400 block">75% of ₹65k target</span>
                </div>

                <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Live Table Occupancy</span>
                  <span className="text-base font-black font-mono text-blue-400">12 / 18</span>
                  <span className="text-[10px] text-stone-400 block">67% capacity seated</span>
                </div>

                <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Kitchen Ticket Pace</span>
                  <span className="text-base font-black font-mono text-amber-400">14.2 min</span>
                  <span className="text-[10px] text-emerald-400 block">Target &lt; 16 mins met</span>
                </div>

                <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Primary Rush Peak</span>
                  <span className="text-base font-black font-mono text-rose-400">20:30 – 22:00</span>
                  <span className="text-[10px] text-rose-300 block">78 covers (98% capacity)</span>
                </div>
              </div>

              {/* Direct action button to Daily Huddle view */}
              <button
                onClick={() => {
                  if (onNavigateToTab) onNavigateToTab('huddle');
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Full Daily Huddle View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tactical Push & 86 Alert Cards */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-400" />
                Shift Strategic Action Items
              </span>

              {/* High Margin Push Dish */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start justify-between gap-3 shadow-md">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Push: Awadhi Dum Biryani</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      74% Margin
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Yields +₹355 profit per plate. Instruct captains to actively pair with garlic naan and raita.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('COPILOT');
                    handleSendQuery('How can we maximize sales of Awadhi Dum Biryani tonight?');
                  }}
                  className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-lg border border-emerald-500/30 cursor-pointer shrink-0"
                >
                  Ask AI
                </button>
              </div>

              {/* Drift & Portion Warning */}
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-3 shadow-md">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Watch: Chicken Portion Drift</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                      +25.3% Drift
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Unmeasured handi ladling causing ₹1,012 extra cost today. Enforce digital kitchen scales on station.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('COPILOT');
                    handleSendQuery('Explain the chicken portion drift and how to fix it.');
                  }}
                  className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold rounded-lg border border-rose-500/30 cursor-pointer shrink-0"
                >
                  Analyze
                </button>
              </div>

              {/* Low Stock Warning */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 shadow-md">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Alert: Fresh Cream Buffer</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      2.4L Left
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Risk of 86 on Dal Makhani and Butter Chicken if not monitored during the 20:30 rush surge.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('COPILOT');
                    handleSendQuery('What happens if fresh cream runs out tonight?');
                  }}
                  className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold rounded-lg border border-amber-500/30 cursor-pointer shrink-0"
                >
                  Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: "WHAT-IF" SIMULATOR --- */}
        {activeTab === 'SIMULATOR' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Sliders className="w-4 h-4" />
                Restaurant Profitability Sandbox
              </div>
              <h4 className="text-base font-bold text-white">Simulate Cost & Margin Changes</h4>
              <p className="text-xs text-slate-400 mt-1">
                Test ingredient price inflation, customer volume swings, or kitchen waste reduction before making operational decisions.
              </p>
            </div>

            {/* Scenario Configuration Controls */}
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-4 shadow-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Scenario Model
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSimType('RAW_INGREDIENT_PRICE_HIKE');
                      setSimParam('Fresh Boneless Chicken Breast');
                      setSimPercent(15);
                    }}
                    className={`p-2.5 text-xs font-bold rounded-xl border transition-all text-left cursor-pointer button-3d ${
                      simType === 'RAW_INGREDIENT_PRICE_HIKE'
                        ? 'border-amber-500 bg-amber-500/15 text-white'
                        : 'border-white/10 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Ingredient Price
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimType('COVERS_SURGE');
                      setSimParam('Dinner Covers');
                      setSimPercent(20);
                    }}
                    className={`p-2.5 text-xs font-bold rounded-xl border transition-all text-left cursor-pointer button-3d ${
                      simType === 'COVERS_SURGE'
                        ? 'border-amber-500 bg-amber-500/15 text-white'
                        : 'border-white/10 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Footfall Surge
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimType('WASTAGE_REDUCTION');
                      setSimParam('Kitchen Spoilage');
                      setSimPercent(-25);
                    }}
                    className={`p-2.5 text-xs font-bold rounded-xl border transition-all text-left cursor-pointer button-3d ${
                      simType === 'WASTAGE_REDUCTION'
                        ? 'border-amber-500 bg-amber-500/15 text-white'
                        : 'border-white/10 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Waste Cut
                  </button>
                </div>
              </div>

              {simType === 'RAW_INGREDIENT_PRICE_HIKE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Raw Ingredient
                  </label>
                  <select
                    value={simParam}
                    onChange={(e) => setSimParam(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="Fresh Boneless Chicken Breast">Fresh Boneless Chicken Breast (₹220/kg)</option>
                    <option value="Amul Salted Table Butter">Amul Salted Table Butter (₹490/kg)</option>
                    <option value="Malai Cottage Paneer">Malai Cottage Paneer (₹280/kg)</option>
                    <option value="Aged Dum Basmati Rice">Aged Dum Basmati Rice (₹145/kg)</option>
                  </select>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-semibold text-slate-300">Percentage Shift</span>
                  <span className="font-mono font-bold text-amber-400">
                    {simPercent > 0 ? `+${simPercent}%` : `${simPercent}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min={simType === 'WASTAGE_REDUCTION' ? -50 : -30}
                  max={simType === 'WASTAGE_REDUCTION' ? 0 : 50}
                  step={5}
                  value={simPercent}
                  onChange={(e) => setSimPercent(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/20 button-3d"
              >
                {isSimulating ? 'Recalculating Ledger Impact...' : 'Run Simulation'}
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Simulation Results Card */}
            {simResult && (
              <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-amber-400" />
                    Projected Financial Impact
                  </span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    simResult.projected.netImpactDelta >= 0 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {simResult.projected.netImpactDelta >= 0 ? '+' : ''}₹{Math.abs(simResult.projected.netImpactDelta).toLocaleString('en-IN')}/mo
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800">
                    <div className="text-[10px] text-stone-400 uppercase font-semibold">Baseline Food Cost %</div>
                    <div className="text-lg font-mono font-bold text-stone-200 mt-0.5">
                      {simResult.baseline.foodCostPct}%
                    </div>
                    <div className="text-[10px] text-stone-500">₹{(simResult.baseline.foodCost / 1000).toFixed(0)}k monthly</div>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800">
                    <div className="text-[10px] text-stone-400 uppercase font-semibold">Projected Food Cost %</div>
                    <div className={`text-lg font-mono font-bold mt-0.5 ${
                      simResult.projected.foodCostPct <= simResult.baseline.foodCostPct ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {simResult.projected.foodCostPct}%
                    </div>
                    <div className="text-[10px] text-stone-500">₹{(simResult.projected.foodCost / 1000).toFixed(0)}k monthly</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 text-xs text-stone-300 leading-relaxed font-sans">
                  {simResult.explanation}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
