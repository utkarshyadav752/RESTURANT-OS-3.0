/**
 * RestaurantOS Authentication & Deployment Diagnostic Service
 * Captures, analyzes, and provides actionable remediation for Firebase,
 * REST API, and Vercel serverless/static deployment failures during authentication.
 */

export type DiagnosticLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'CRITICAL';

export type DiagnosticCategory = 
  | 'FIREBASE_AUTH' 
  | 'REST_API' 
  | 'VERCEL_DEPLOYMENT' 
  | 'NETWORK' 
  | 'SESSION_KERNEL' 
  | 'OFFLINE_FALLBACK';

export interface AuthDiagnosticLogEntry {
  id: string;
  timestamp: string; // ISO string
  timeFormatted: string; // HH:mm:ss.SSS
  level: DiagnosticLogLevel;
  category: DiagnosticCategory;
  provider: 'Firebase Auth' | 'RestaurantOS REST API' | 'Kernel Session' | 'Emergency Client Fallback' | 'Network Engine';
  code: string;
  message: string;
  summary: string;
  remediation?: string;
  technicalDetails?: {
    url?: string;
    method?: string;
    status?: number;
    statusText?: string;
    targetDomain?: string;
    clientOrigin?: string;
    isVercelEnvironment?: boolean;
    isHtmlResponse?: boolean;
    errorCode?: string;
    errorMessage?: string;
    sanitizedPayload?: Record<string, any>;
    responseSnippet?: string;
    stack?: string;
  };
}

export interface ConnectionTestResult {
  timestamp: string;
  isOnline: boolean;
  status: 'connected' | 'degraded' | 'disconnected' | 'error';
  latencyMs: number;
  environment: 'Vercel Edge / Static' | 'Localhost Dev Server' | 'Cloud Run Container' | 'Production Web';
  endpointChecked: string;
  httpStatus?: number;
  isHtmlResponse?: boolean;
  firebaseConfigured: boolean;
  firebaseStatus: 'configured' | 'unconfigured' | 'mock_mode';
  message: string;
  remediation?: string;
}

const STORAGE_KEY = 'restaurantos_auth_diagnostics_logs';
const MAX_LOG_ENTRIES = 60;

class AuthDiagnosticsService {
  private logs: AuthDiagnosticLogEntry[] = [];
  private listeners: Set<(logs: AuthDiagnosticLogEntry[]) => void> = new Set();
  private lastTestResult: ConnectionTestResult | null = null;

  constructor() {
    this.loadFromStorage();
    // Run initial passive environment diagnostic
    this.recordEnvironmentDiagnostics();
  }

  private loadFromStorage() {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch {
      this.logs = [];
    }
  }

  private saveToStorage() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs.slice(0, MAX_LOG_ENTRIES)));
    } catch {
      // Storage quota or private browsing restriction
    }
  }

  private notify() {
    this.listeners.forEach(cb => cb([...this.logs]));
  }

  public subscribe(callback: (logs: AuthDiagnosticLogEntry[]) => void): () => void {
    this.listeners.add(callback);
    callback([...this.logs]);
    return () => this.listeners.delete(callback);
  }

  public getLogs(): AuthDiagnosticLogEntry[] {
    return [...this.logs];
  }

  public getRecentErrors(): AuthDiagnosticLogEntry[] {
    return this.logs.filter(l => l.level === 'ERROR' || l.level === 'CRITICAL');
  }

  public getLastError(): AuthDiagnosticLogEntry | null {
    const errors = this.getRecentErrors();
    return errors.length > 0 ? errors[0] : null;
  }

  public clearLogs() {
    this.logs = [];
    this.saveToStorage();
    this.notify();
    this.logInfo('SESSION_KERNEL', 'Diagnostic logs cleared by operator.', 'Kernel Session');
  }

  public log(entry: Omit<AuthDiagnosticLogEntry, 'id' | 'timestamp' | 'timeFormatted'>): AuthDiagnosticLogEntry {
    const now = new Date();
    const fullEntry: AuthDiagnosticLogEntry = {
      ...entry,
      id: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toISOString(),
      timeFormatted: now.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0'),
    };

    this.logs.unshift(fullEntry);
    if (this.logs.length > MAX_LOG_ENTRIES) {
      this.logs = this.logs.slice(0, MAX_LOG_ENTRIES);
    }

    this.saveToStorage();
    this.notify();

    // Also output to developer console with styled badge
    const badgeColor = 
      fullEntry.level === 'CRITICAL' ? 'background: #dc2626; color: #fff;' :
      fullEntry.level === 'ERROR' ? 'background: #ef4444; color: #fff;' :
      fullEntry.level === 'WARN' ? 'background: #f59e0b; color: #000;' :
      fullEntry.level === 'SUCCESS' ? 'background: #10b981; color: #fff;' :
      'background: #3b82f6; color: #fff;';

    console.log(
      `%c[AuthDiag] ${fullEntry.level}%c ${fullEntry.category} · ${fullEntry.code}: ${fullEntry.message}`,
      badgeColor + ' font-weight: bold; border-radius: 3px; padding: 1px 5px;',
      'color: inherit; font-weight: normal;',
      fullEntry.technicalDetails || ''
    );

    return fullEntry;
  }

  public logInfo(category: DiagnosticCategory, message: string, provider: AuthDiagnosticLogEntry['provider'] = 'RestaurantOS REST API', details?: any) {
    return this.log({
      level: 'INFO',
      category,
      provider,
      code: 'INFO_LOG',
      summary: message,
      message,
      technicalDetails: details,
    });
  }

  public logSuccess(category: DiagnosticCategory, message: string, provider: AuthDiagnosticLogEntry['provider'] = 'RestaurantOS REST API', details?: any) {
    return this.log({
      level: 'SUCCESS',
      category,
      provider,
      code: 'AUTH_SUCCESS',
      summary: message,
      message,
      technicalDetails: details,
    });
  }

  public logWarn(category: DiagnosticCategory, message: string, code = 'WARN_LOG', remediation?: string, details?: any) {
    return this.log({
      level: 'WARN',
      category,
      provider: 'RestaurantOS REST API',
      code,
      summary: message,
      message,
      remediation,
      technicalDetails: details,
    });
  }

  /**
   * Specifically analyzes any login error — including Firebase error codes,
   * Vercel deployment missing-backend (404/HTML rewrite) errors, and network issues.
   */
  public logAuthFailure(
    provider: 'Firebase Auth' | 'RestaurantOS REST API' | 'Kernel Session',
    error: any,
    context?: { identifier?: string; endpoint?: string; requestPayload?: any }
  ): AuthDiagnosticLogEntry {
    const isVercel = typeof window !== 'undefined' && (
      window.location.hostname.includes('vercel.app') || 
      window.location.hostname.includes('vercel')
    );

    const errorMessage = error?.message || String(error || 'Unknown authentication failure');
    const status = error?.status || error?.statusCode;
    const errorData = error?.data;

    let code = error?.code || 'AUTH_FAILURE_GENERIC';
    let summary = 'Authentication request failed.';
    let remediation = '';
    let category: DiagnosticCategory = 'REST_API';
    let level: DiagnosticLogLevel = 'ERROR';

    // 1. Detect Firebase-Specific Authentication Error Codes
    if (code.startsWith('auth/') || errorMessage.includes('auth/')) {
      category = 'FIREBASE_AUTH';
      provider = 'Firebase Auth';

      if (code === 'auth/unauthorized-domain' || errorMessage.includes('auth/unauthorized-domain')) {
        code = 'FIREBASE_UNAUTHORIZED_DOMAIN';
        level = 'CRITICAL';
        summary = 'Firebase Auth: Domain Not Authorized for Deployment';
        remediation = `Your current domain (${window.location.hostname}) is not whitelisted in Firebase Console.
To fix:
1. Open Firebase Console -> Authentication -> Settings tab.
2. Under "Authorized domains", click "Add domain".
3. Add "${window.location.hostname}" and click Save.
4. Refresh this page and log in again.`;
      } else if (code === 'auth/invalid-api-key' || errorMessage.includes('auth/invalid-api-key') || code === 'auth/api-key-not-valid') {
        code = 'FIREBASE_INVALID_API_KEY';
        level = 'CRITICAL';
        summary = 'Firebase Auth: Missing or Invalid API Key in Vercel Environment';
        remediation = `Firebase API Key is missing or invalid in your deployment build.
To fix:
1. In Vercel Project Settings -> Environment Variables, add:
   - VITE_FIREBASE_API_KEY = your_firebase_api_key
   - VITE_FIREBASE_PROJECT_ID = your_project_id
2. Trigger a redeploy in Vercel.
3. In the meantime, use the Emergency Client Fallback below to test and log in.`;
      } else if (code === 'auth/network-request-failed' || errorMessage.includes('auth/network-request-failed')) {
        code = 'FIREBASE_NETWORK_REQUEST_FAILED';
        summary = 'Firebase Auth: Network Request Blocked or Offline';
        remediation = 'Check your internet connection or browser adblocker. Some extensions block Google Identity Toolkit requests.';
      } else if (code === 'auth/user-not-found' || errorMessage.includes('auth/user-not-found')) {
        code = 'FIREBASE_USER_NOT_FOUND';
        summary = 'Firebase Auth: User Account Not Found in Firebase Directory';
        remediation = 'Verify the email address. For instant testing, use pre-seeded demo accounts (e.g. owner@restaurantos.io / Owner@123).';
      } else if (code === 'auth/wrong-password' || errorMessage.includes('auth/wrong-password')) {
        code = 'FIREBASE_WRONG_PASSWORD';
        summary = 'Firebase Auth: Invalid Password Provided';
        remediation = 'Verify your password. For demo accounts, the password is displayed on the login card (e.g. Owner@123).';
      } else if (code === 'auth/too-many-requests' || errorMessage.includes('auth/too-many-requests')) {
        code = 'FIREBASE_TOO_MANY_REQUESTS';
        summary = 'Firebase Auth: Rate Limit Triggered';
        remediation = 'Too many failed login attempts. Firebase has temporarily blocked requests from this IP. Wait 5 minutes or use client demo fallback.';
      } else if (code === 'auth/configuration-not-found' || errorMessage.includes('auth/configuration-not-found')) {
        code = 'FIREBASE_CONFIG_MISSING';
        summary = 'Firebase Auth: Provider Configuration Not Found';
        remediation = 'Firebase project authentication is not enabled or incomplete. Enable Email/Password auth in Firebase Console.';
      }
    }
    // 2. Detect Vercel Static Deployment & Missing Backend API Errors
    else if (
      status === 404 || 
      errorMessage.includes('404') || 
      (typeof errorData === 'string' && errorData.includes('<!doctype html>')) ||
      (typeof errorData === 'string' && errorData.includes('<html'))
    ) {
      category = 'VERCEL_DEPLOYMENT';
      code = 'ERR_VERCEL_BACKEND_404';
      level = 'CRITICAL';
      summary = 'Vercel Deployment Issue: Backend API Not Running / Returned 404';
      remediation = `When deploying this Vite React app to Vercel, static frontend files are served from 'dist', but the Express backend 'server.ts' does not run by default.
Solutions:
1. INSTANT CLIENT FALLBACK (Active Now): RestaurantOS has automatically activated the in-browser Demo Kernel! You can log in immediately with owner@restaurantos.io / Owner@123 or any demo card.
2. VERCEL SERVERLESS SETUP: Configure vercel.json with an /api serverless function or point VITE_API_URL to a hosted backend (e.g. Cloud Run, Render, or Railway).
3. CORS / PROXY: If using an external API, ensure CORS allows ${window.location.origin}.`;
    }
    // 3. Detect HTML Response on API Endpoint (Classic Vercel SPA Catch-All Rewrite)
    else if (
      errorMessage.includes('Unexpected token') || 
      errorMessage.includes('is not valid JSON') ||
      errorMessage.includes('<!doctype')
    ) {
      category = 'VERCEL_DEPLOYMENT';
      code = 'ERR_VERCEL_HTML_REWRITE';
      level = 'CRITICAL';
      summary = 'Vercel SPA Rewrite Caught API Route: Returned HTML Instead of JSON';
      remediation = `Vercel rewrite rule "/(.*) -> /index.html" intercepted the call to ${context?.endpoint || '/api/v1/auth/login'}.
Solutions:
1. Use the embedded Emergency Client Fallback to test and navigate all features locally.
2. Exclude /api routes in vercel.json rewrites or create a serverless API function in /api directory.`;
    }
    // 4. Detect General Network Connection Failure
    else if (
      errorMessage.includes('Failed to fetch') || 
      errorMessage.includes('NetworkError') || 
      errorMessage.includes('Load failed') ||
      !window.navigator.onLine
    ) {
      category = 'NETWORK';
      code = 'ERR_NETWORK_UNREACHABLE';
      summary = 'Cannot Connect to Backend Server';
      remediation = `Network connection failed or backend server is offline.
Solutions:
1. Ensure the development server is running ('npm run dev').
2. In deployed environments (e.g. Vercel), ensure backend API URL is reachable or use Client Demo Mode.`;
    }
    // 5. Standard 401 / Invalid Credentials
    else if (status === 401) {
      code = 'ERR_INVALID_CREDENTIALS';
      summary = 'Invalid Email/Phone or Password';
      remediation = 'Check your login credentials. Click any demo account pill (Owner, Manager, Cashier, Chef) to autofill correct credentials.';
    }

    return this.log({
      level,
      category,
      provider,
      code,
      summary,
      message: `${summary}: ${errorMessage}`,
      remediation,
      technicalDetails: {
        url: context?.endpoint,
        method: 'POST',
        status,
        clientOrigin: window.location.origin,
        targetDomain: window.location.hostname,
        isVercelEnvironment: isVercel,
        errorCode: code,
        errorMessage,
        sanitizedPayload: context?.requestPayload ? {
          ...context.requestPayload,
          password: context.requestPayload.password ? '••••••••' : undefined,
        } : undefined,
        responseSnippet: typeof errorData === 'string' ? errorData.slice(0, 300) : JSON.stringify(errorData || null),
        stack: error?.stack,
      },
    });
  }

  /**
   * Actively runs diagnostic probe against the network and API endpoints
   */
  public async testConnectivity(): Promise<ConnectionTestResult> {
    const startTime = performance.now();
    const isOnline = typeof window !== 'undefined' ? window.navigator.onLine : true;
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    
    let environment: ConnectionTestResult['environment'] = 'Production Web';
    if (hostname.includes('vercel.app') || hostname.includes('vercel')) {
      environment = 'Vercel Edge / Static';
    } else if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('3000')) {
      environment = 'Localhost Dev Server';
    } else if (hostname.includes('run.app')) {
      environment = 'Cloud Run Container';
    }

    const firebaseConfigured = typeof window !== 'undefined' && Boolean(
      (import.meta as any).env?.VITE_FIREBASE_API_KEY || 
      (window as any).__FIREBASE_CONFIG__
    );

    if (!isOnline) {
      const result: ConnectionTestResult = {
        timestamp: new Date().toISOString(),
        isOnline: false,
        status: 'disconnected',
        latencyMs: 0,
        environment,
        endpointChecked: '/api/health',
        firebaseConfigured,
        firebaseStatus: firebaseConfigured ? 'configured' : 'mock_mode',
        message: 'Browser is currently OFFLINE. No internet connection detected.',
        remediation: 'Check your Wi-Fi or network connection.',
      };
      this.lastTestResult = result;
      this.logWarn('NETWORK', result.message, 'ERR_CLIENT_OFFLINE', result.remediation);
      return result;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latencyMs = Math.round(performance.now() - startTime);
      const contentType = res.headers.get('content-type') || '';
      const isHtml = contentType.includes('text/html');

      if (res.ok && !isHtml) {
        const data = await res.json().catch(() => ({}));
        const result: ConnectionTestResult = {
          timestamp: new Date().toISOString(),
          isOnline: true,
          status: latencyMs > 800 ? 'degraded' : 'connected',
          latencyMs,
          environment,
          endpointChecked: '/api/health',
          httpStatus: res.status,
          isHtmlResponse: false,
          firebaseConfigured,
          firebaseStatus: firebaseConfigured ? 'configured' : 'mock_mode',
          message: `Backend API is healthy and reachable in ${latencyMs}ms.`,
        };
        this.lastTestResult = result;
        this.logSuccess('REST_API', `Connectivity probe passed in ${latencyMs}ms. Backend online.`, 'RestaurantOS REST API', data);
        return result;
      } else if (isHtml) {
        // Vercel SPA rewrite returned index.html for /api/health
        const result: ConnectionTestResult = {
          timestamp: new Date().toISOString(),
          isOnline: true,
          status: 'error',
          latencyMs,
          environment,
          endpointChecked: '/api/health',
          httpStatus: res.status,
          isHtmlResponse: true,
          firebaseConfigured,
          firebaseStatus: firebaseConfigured ? 'configured' : 'mock_mode',
          message: 'API returned HTML instead of JSON. Vercel static SPA rewrite detected.',
          remediation: 'Backend Express server is not running on this Vercel domain. Emergency Client Fallback is available to log in.',
        };
        this.lastTestResult = result;
        this.logWarn('VERCEL_DEPLOYMENT', result.message, 'ERR_VERCEL_BACKEND_MISSING', result.remediation);
        return result;
      } else {
        const result: ConnectionTestResult = {
          timestamp: new Date().toISOString(),
          isOnline: true,
          status: 'error',
          latencyMs,
          environment,
          endpointChecked: '/api/health',
          httpStatus: res.status,
          firebaseConfigured,
          firebaseStatus: firebaseConfigured ? 'configured' : 'mock_mode',
          message: `API endpoint returned HTTP ${res.status}.`,
          remediation: 'Check server logs or verify backend API routing.',
        };
        this.lastTestResult = result;
        this.logWarn('REST_API', result.message, 'ERR_HTTP_NON_200', result.remediation);
        return result;
      }
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      const isAbort = err?.name === 'AbortError';
      const result: ConnectionTestResult = {
        timestamp: new Date().toISOString(),
        isOnline: true,
        status: 'disconnected',
        latencyMs,
        environment,
        endpointChecked: '/api/health',
        firebaseConfigured,
        firebaseStatus: firebaseConfigured ? 'configured' : 'mock_mode',
        message: isAbort ? 'Connection probe timed out (> 6000ms).' : `Connection failed: ${err?.message || 'Network unreachable'}`,
        remediation: environment === 'Vercel Edge / Static'
          ? 'Vercel deployment: Express backend is not running on this domain. Emergency Client Fallback allows instant login.'
          : 'Ensure backend server is running on port 3000.',
      };
      this.lastTestResult = result;
      this.logWarn('NETWORK', result.message, 'ERR_PROBE_FAILED', result.remediation, { error: err?.message });
      return result;
    }
  }

  public getLastTestResult(): ConnectionTestResult | null {
    return this.lastTestResult;
  }

  private recordEnvironmentDiagnostics() {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const isVercel = hostname.includes('vercel.app') || hostname.includes('vercel');
    
    this.logInfo('SESSION_KERNEL', `App initialized on host: ${hostname} (${isVercel ? 'Vercel Deployment' : 'Standard Web Host'})`, 'Kernel Session', {
      origin: window.location.origin,
      pathname: window.location.pathname,
      protocol: window.location.protocol,
      userAgent: window.navigator.userAgent,
      online: window.navigator.onLine,
      isVercelDeployment: isVercel,
    });
  }

  public exportDiagnosticsReport(): string {
    const recent = this.logs.slice(0, 20);
    const test = this.lastTestResult;

    const report = {
      generatedAt: new Date().toISOString(),
      origin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
      isOnline: typeof window !== 'undefined' ? window.navigator.onLine : true,
      lastConnectionTest: test,
      summary: {
        totalLogs: this.logs.length,
        errorsCount: this.getRecentErrors().length,
        lastError: this.getLastError()?.message || 'None',
      },
      logs: recent.map(l => ({
        time: l.timeFormatted,
        level: l.level,
        category: l.category,
        provider: l.provider,
        code: l.code,
        message: l.message,
        remediation: l.remediation,
        technicalDetails: l.technicalDetails,
      })),
    };

    return JSON.stringify(report, null, 2);
  }
}

export const authDiagnostics = new AuthDiagnosticsService();
