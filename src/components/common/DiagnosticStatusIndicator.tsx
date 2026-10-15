import React, { useState, useEffect } from 'react';
import { 
  Activity, AlertTriangle, CheckCircle2, XCircle, RefreshCw, 
  Copy, Check, ChevronUp, ChevronDown, Terminal, ShieldAlert, 
  ExternalLink, Sparkles, Globe, Server, Key, Eye, HelpCircle, 
  X, AlertCircle, Info, ArrowRight, UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { RoleType } from '../../types/index.ts';
import { AuthDiagnosticLogEntry } from '../../services/authDiagnostics.ts';

export const DiagnosticStatusIndicator: React.FC = () => {
  const { 
    connectionStatus, 
    diagnosticLogs, 
    lastAuthError, 
    isFallbackMode, 
    testConnection, 
    clearDiagnosticLogs, 
    exportDiagnostics,
    loginDemoUser,
    isAuthenticated,
    user
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'ERRORS' | 'FIREBASE' | 'VERCEL'>('ALL');
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  // Auto-expand drawer if a critical Vercel or Firebase error occurs during login
  useEffect(() => {
    if (lastAuthError && (lastAuthError.level === 'CRITICAL' || lastAuthError.category === 'VERCEL_DEPLOYMENT')) {
      // Keep it subtle or let user open it, but highlight the badge
    }
  }, [lastAuthError]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await testConnection();
      setPingLatency(res.latencyMs);
    } catch {
      setPingLatency(null);
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyReport = () => {
    const report = exportDiagnostics();
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const errorCount = diagnosticLogs.filter(l => l.level === 'ERROR' || l.level === 'CRITICAL').length;
  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel');

  // Filter logs based on selection
  const filteredLogs = diagnosticLogs.filter(log => {
    if (filterLevel === 'ERRORS') return log.level === 'ERROR' || log.level === 'CRITICAL';
    if (filterLevel === 'FIREBASE') return log.category === 'FIREBASE_AUTH';
    if (filterLevel === 'VERCEL') return log.category === 'VERCEL_DEPLOYMENT' || log.code.includes('VERCEL');
    return true;
  });

  return (
    <>
      {/* --- Small Persistent Floating Indicator in Bottom-Right Corner --- */}
      <div className="fixed bottom-3 right-3 z-50 flex items-center select-none font-sans">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-2xl backdrop-blur-md transition-all duration-200 text-xs font-medium cursor-pointer ${
            errorCount > 0
              ? 'bg-red-950/80 border-red-500/60 text-red-200 hover:bg-red-900/90 hover:border-red-400'
              : isFallbackMode
              ? 'bg-amber-950/80 border-amber-500/60 text-amber-200 hover:bg-amber-900/90 hover:border-amber-400'
              : connectionStatus === 'connected'
              ? 'bg-slate-900/90 border-slate-700/70 text-slate-200 hover:bg-slate-800/90 hover:border-emerald-500/60'
              : 'bg-slate-900/90 border-slate-700/70 text-slate-300 hover:bg-slate-800'
          }`}
          title="Click to view RestaurantOS Auth Diagnostics & Vercel Deployment Inspector"
        >
          {/* Status Dot with Pulse */}
          <span className="relative flex h-2 w-2">
            {connectionStatus === 'connected' && !isFallbackMode && (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </>
            )}
            {isFallbackMode && (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </>
            )}
            {(connectionStatus === 'disconnected' || connectionStatus === 'error' || errorCount > 0) && !isFallbackMode && (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </>
            )}
            {connectionStatus === 'testing' && (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 animate-spin" />
            )}
          </span>

          {/* Status Text Label */}
          <span className="font-semibold tracking-tight">
            {isTesting 
              ? 'Probing API...'
              : isFallbackMode 
              ? 'Vercel · Client Fallback'
              : connectionStatus === 'connected'
              ? `API Online ${pingLatency ? `(${pingLatency}ms)` : ''}`
              : connectionStatus === 'degraded'
              ? 'API Degraded'
              : isVercel
              ? 'Vercel Backend 404'
              : 'API Disconnected'}
          </span>

          {/* Error Count Badge */}
          {errorCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white animate-pulse">
              {errorCount} {errorCount === 1 ? 'err' : 'errs'}
            </span>
          )}

          {/* Expand Icon */}
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
      </div>

      {/* --- Detailed Diagnostics & Vercel Deployment Inspector Flyout Modal --- */}
      {isOpen && (
        <div 
          className="fixed bottom-12 right-3 z-50 w-full max-w-lg max-h-[85vh] bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-200"
          style={{ width: 'calc(100vw - 24px)', maxWidth: '520px' }}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  Auth & Deployment Diagnostics
                  {isVercel && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono">
                      Vercel
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-400">
                  Real-time Firebase, REST API & serverless connectivity probe
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                title="Test backend connection"
              >
                <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin text-amber-400' : ''}`} />
                <span>Probe</span>
              </button>

              <button
                onClick={handleCopyReport}
                className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                title="Copy full diagnostic report to clipboard"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Report'}</span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Environment & Connection Banner */}
          <div className="p-3 bg-slate-900/40 border-b border-slate-800/60 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Host:</span>
                <span className="font-mono text-[11px] text-slate-300 truncate max-w-[140px]" title={window.location.hostname}>
                  {window.location.hostname}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Status:</span>
                <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                  connectionStatus === 'connected' ? 'text-emerald-400' :
                  isFallbackMode ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                  {connectionStatus === 'connected' && !isFallbackMode ? 'Healthy' :
                   isFallbackMode ? 'Client Fallback' : 'Offline / Error'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>{diagnosticLogs.length} logs</span>
              {errorCount > 0 && (
                <span className="text-red-400 font-bold">({errorCount} errors)</span>
              )}
            </div>
          </div>

          {/* Critical Alert / Remediation Card for Vercel Deployment or Firebase */}
          {lastAuthError && (
            <div className="p-3 bg-red-950/40 border-b border-red-500/30 text-xs">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-300 text-xs">{lastAuthError.summary}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-900/60 text-red-200 border border-red-700/50">
                      {lastAuthError.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-red-200/90 leading-relaxed font-sans">
                    {lastAuthError.message}
                  </p>

                  {lastAuthError.remediation && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 text-amber-200/90 text-[11px] space-y-1">
                      <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Recommended Resolution:</span>
                      </div>
                      <pre className="whitespace-pre-wrap font-sans leading-relaxed text-[11px] text-slate-300">
                        {lastAuthError.remediation}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 1-Click Demo Login Panel (Especially useful for Vercel testers who cannot login) */}
          <div className="p-3 bg-amber-500/5 border-b border-amber-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Instant 1-Click Role Login (Bypasses Backend Blockers):</span>
              </span>
              {isAuthenticated && (
                <span className="text-[10px] text-emerald-400 font-medium">
                  Logged in as {user?.role}
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { role: 'OWNER' as RoleType, name: 'Owner', email: 'owner@restaurantos.io' },
                { role: 'MANAGER' as RoleType, name: 'Manager', email: 'manager@restaurantos.io' },
                { role: 'CASHIER' as RoleType, name: 'Cashier', email: 'cashier@restaurantos.io' },
                { role: 'KITCHEN' as RoleType, name: 'Chef', email: 'kitchen@restaurantos.io' },
              ].map(demo => (
                <button
                  key={demo.role}
                  onClick={() => loginDemoUser(demo.role)}
                  className="px-2 py-1.5 rounded-lg text-center bg-slate-900/90 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/50 text-[11px] font-medium text-slate-200 hover:text-amber-300 transition-all cursor-pointer"
                  title={`Log in immediately as ${demo.name} (${demo.email})`}
                >
                  <div className="font-bold">{demo.name}</div>
                  <div className="text-[9px] text-slate-400 truncate">{demo.role}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Log Filters */}
          <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              {(['ALL', 'ERRORS', 'FIREBASE', 'VERCEL'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterLevel(tab)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    filterLevel === tab 
                      ? 'bg-amber-500 text-slate-950 font-bold' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              onClick={clearDiagnosticLogs}
              className="text-[10px] text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
            >
              Clear Logs
            </button>
          </div>

          {/* Diagnostic Log Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[300px] text-xs font-mono">
            {filteredLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No diagnostic log entries matching filter "{filterLevel}".
              </div>
            ) : (
              filteredLogs.map(log => {
                const isExpanded = expandedLogId === log.id;
                const isErr = log.level === 'ERROR' || log.level === 'CRITICAL';
                const isWarn = log.level === 'WARN';
                const isSuccess = log.level === 'SUCCESS';

                return (
                  <div
                    key={log.id}
                    className={`p-2 rounded-xl border transition-all ${
                      isErr 
                        ? 'bg-red-950/20 border-red-500/30 text-red-200' 
                        : isWarn
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                        : isSuccess
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                        : 'bg-slate-900/40 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div 
                      className="flex items-start justify-between gap-2 cursor-pointer"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    >
                      <div className="flex items-start gap-1.5 flex-1 min-w-0">
                        <span className={`text-[9px] px-1 py-0.5 rounded font-bold uppercase shrink-0 mt-0.5 ${
                          isErr ? 'bg-red-600 text-white' :
                          isWarn ? 'bg-amber-600 text-slate-950' :
                          isSuccess ? 'bg-emerald-600 text-white' :
                          'bg-blue-600 text-white'
                        }`}>
                          {log.level}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[11px] truncate text-white">
                              {log.summary || log.code}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {log.timeFormatted}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-sans line-clamp-2 mt-0.5">
                            {log.message}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-slate-500">
                        <span className="text-[9px] px-1 py-0.5 rounded bg-slate-800/80 text-slate-400">
                          {log.category}
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    {/* Expandable Technical Details */}
                    {isExpanded && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-2 text-[10px] font-mono text-slate-300">
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div><span className="text-slate-500">Provider:</span> {log.provider}</div>
                          <div><span className="text-slate-500">Code:</span> {log.code}</div>
                          {log.technicalDetails?.url && (
                            <div className="col-span-2 truncate">
                              <span className="text-slate-500">Endpoint:</span> {log.technicalDetails.url}
                            </div>
                          )}
                          {log.technicalDetails?.status && (
                            <div>
                              <span className="text-slate-500">HTTP Status:</span> {log.technicalDetails.status}
                            </div>
                          )}
                          {log.technicalDetails?.clientOrigin && (
                            <div className="truncate">
                              <span className="text-slate-500">Origin:</span> {log.technicalDetails.clientOrigin}
                            </div>
                          )}
                        </div>

                        {log.remediation && (
                          <div className="p-2 rounded bg-slate-900/90 border border-amber-500/30 text-amber-200">
                            <div className="font-bold text-amber-400 text-[10px] mb-1">Fix / Workaround:</div>
                            <div className="whitespace-pre-wrap font-sans text-[10px] text-slate-300">
                              {log.remediation}
                            </div>
                          </div>
                        )}

                        {log.technicalDetails?.responseSnippet && (
                          <div className="p-2 rounded bg-black/50 border border-slate-800 max-h-24 overflow-y-auto">
                            <div className="text-[9px] text-slate-500 mb-1">Response Body Preview:</div>
                            <pre className="text-[9px] text-slate-400 whitespace-pre-wrap">
                              {log.technicalDetails.responseSnippet}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>RestaurantOS Kernel v2.4</span>
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">
                {isFallbackMode ? '⚡ Local Fallback Kernel Active' : '🟢 Live Full-Stack API Mode'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
