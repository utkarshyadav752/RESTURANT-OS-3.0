import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LoginPage } from './components/auth/LoginPage.tsx';
import { RegisterWizard } from './components/auth/RegisterWizard.tsx';
import { InvitePage } from './components/auth/InvitePage.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';
import { RoleDashboard } from './components/dashboards/RoleDashboard.tsx';
import { InteractiveOnboardingWizard } from './components/wizard/InteractiveOnboardingWizard.tsx';
import { POSView } from './components/pos/POSView.tsx';
import { KDSView } from './components/kitchen/KDSView.tsx';
import { TablesView } from './components/tables/TablesView.tsx';
import { OrdersBillingView } from './components/orders/OrdersBillingView.tsx';
import { InventoryLedgerView } from './components/inventory/InventoryLedgerView.tsx';
import { RecipeBOMView } from './components/recipes/RecipeBOMView.tsx';
import { WastageCenterView } from './components/wastage/WastageCenterView.tsx';
import { PurchasingView } from './components/purchases/PurchasingView.tsx';
import { MenuEngineeringView } from './components/menu/MenuEngineeringView.tsx';
import { ForecastView } from './components/forecast/ForecastView.tsx';
import { RestaurantSettingsView } from './components/settings/RestaurantSettingsView.tsx';
import { CustomersView } from './components/crm/CustomersView.tsx';
import { TeamProgressTracker } from './components/analytics/TeamProgressTracker.tsx';
import { DailyHuddleSummary } from './components/analytics/DailyHuddleSummary.tsx';
import { SmartSchedulingView } from './components/scheduling/SmartSchedulingView.tsx';
import { RestaurantLanding } from './components/landing/RestaurantLanding.tsx';
import { BookDemoModal } from './components/modals/BookDemoModal.tsx';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal.tsx';
import { TwoFactorModal } from './components/auth/TwoFactorModal.tsx';
import { ToastNotification } from './components/common/ToastNotification.tsx';
import { AICopilotDrawer } from './components/ai/AICopilotDrawer.tsx';

function MainRouter() {
  const { isAuthenticated, isLoading, user, login, logout, twoFactorPending } = useAuth();

  // Navigation mode for public visitors: 'LANDING' | 'LOGIN' | 'REGISTER' | 'INVITE'
  const [publicView, setPublicView] = useState<'LANDING' | 'LOGIN' | 'REGISTER' | 'INVITE'>('LANDING');
  const [inviteToken, setInviteToken] = useState<string>('inv_token_tandoor_lead_998');

  // Operational active station tab inside authenticated workspace
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // AI Copilot drawer state
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Book demo modal state
  const [isBookDemoOpen, setIsBookDemoOpen] = useState(false);

  // Forgot password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Interactive Onboarding Wizard state
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Check URL on mount
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/register') {
      setPublicView('REGISTER');
      setTimeout(() => {
        const el = document.getElementById('login');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else if (path === '/login') {
      setPublicView('LOGIN');
      setTimeout(() => {
        const el = document.getElementById('login');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else if (path.startsWith('/invite/')) {
      const token = path.replace('/invite/', '');
      setInviteToken(token);
      setPublicView('INVITE');
    } else {
      setPublicView('LANDING');
    }
  }, []);

  // Route user to their role-specific operational tab
  useEffect(() => {
    if (user) {
      if (user.role === 'OWNER' || user.role === 'SUPER_ADMIN') {
        setActiveTab('dashboard');
      } else if (user.role === 'CASHIER') {
        setActiveTab('pos');
      } else if (user.role === 'KITCHEN') {
        setActiveTab('kitchen');
      } else if (user.role === 'WAITER') {
        setActiveTab('tables');
      } else if (user.role === 'INVENTORY_MANAGER') {
        setActiveTab('inventory');
      } else if (user.role === 'ACCOUNTANT') {
        setActiveTab('orders');
      } else if (user.role === 'MANAGER') {
        setActiveTab('tables');
      } else {
        setActiveTab('pos');
      }
    }
  }, [user?.role]);

  // 1-Click Fast Test Drive
  const handleQuickLogin = async (email: string, pass: string, roleName: string) => {
    try {
      showToast(`Authenticating into ${roleName} Station...`);
      await login(email, pass);
      showToast(`Welcome! Logged into ${roleName} operational environment.`);
    } catch {
      showToast('Quick login failed, please check credentials.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#05111d] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin mb-4" />
        <span className="text-sm font-bold tracking-tight text-[#dbeaf5]">
          Initializing RestaurantOS Kernel...
        </span>
      </div>
    );
  }

  // Unauthenticated routing: Public Front Web Page MERGED with Login & Station Access
  if (!isAuthenticated) {
    if (publicView === 'INVITE') {
      return (
        <div className="relative min-h-screen bg-[#05111d]">
          <InvitePage
            token={inviteToken}
            onActivated={() => {
              setActiveTab('dashboard');
            }}
            onCancel={() => setPublicView('LANDING')}
          />
          <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
        </div>
      );
    }

    // Merged Front Web Page + Login Architecture
    return (
      <div className="relative min-h-screen bg-[#05111d]">
        <RestaurantLanding
          initialTab={publicView === 'REGISTER' ? 'REGISTER' : publicView === 'LOGIN' ? 'CREDENTIALS' : 'ONE_CLICK'}
          onOpenBookDemo={() => setIsBookDemoOpen(true)}
          onOpenAICopilot={() => setIsCopilotOpen(true)}
          onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
          showToast={showToast}
        />

        <BookDemoModal
          isOpen={isBookDemoOpen}
          onClose={() => setIsBookDemoOpen(false)}
          showToast={showToast}
        />

        <AICopilotDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          onNavigateToTab={setActiveTab}
        />

        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          onSuccess={() => {
            setIsForgotPasswordOpen(false);
            showToast('Password reset successfully! Please sign in with your new password.');
          }}
        />

        {twoFactorPending && (
          <TwoFactorModal
            isOpen={true}
            onClose={() => showToast('Two-factor verification cancelled.')}
            email={twoFactorPending.email}
            mobile={twoFactorPending.mobile}
          />
        )}

        <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      </div>
    );
  }

  // Authenticated Screen: Full-featured Operational RestaurantOS with Station Sidebar & Switcher
  return (
    <>
      {/* Top Banner allowing return to Public Landing Page */}
      <div className="bg-[#051a2f] border-b border-[#143d63] px-4 py-1.5 flex items-center justify-between text-xs z-30 relative">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-white font-bold text-[11px]">
            Connected to Live Restaurant Node: Cyber Hub Flagship
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              logout();
              setPublicView('LANDING');
            }}
            className="text-teal-400 hover:text-teal-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
          >
            ← Exit to Public Website & Landing Page
          </button>
        </div>
      </div>

      <AppLayout
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCopilotOpen={isCopilotOpen}
        setIsCopilotOpen={setIsCopilotOpen}
      >
        {/* Executive Overview: STRICTLY PROTECTED — ONLY OWNER & SUPER_ADMIN CAN VIEW */}
        {activeTab === 'dashboard' && (
          (user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN') ? (
            <RoleDashboard
              onNavigateTab={setActiveTab}
              onOpenCopilot={() => setIsCopilotOpen(true)}
            />
          ) : (
            <div className="p-8 max-w-lg mx-auto my-12 text-center bg-[#071d31] rounded-3xl border border-[#16426a] shadow-2xl backdrop-blur-xl text-white">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                👑
              </div>
              <h2 className="text-xl font-bold text-white">Owner Clearance Required</h2>
              <p className="text-xs text-[#8daec7] mt-2 leading-relaxed">
                Executive Overview and capital analytics are strictly restricted to the Restaurant Owner. Your current clearance is <strong className="text-teal-400">{user?.role}</strong>.
              </p>
              <button
                onClick={() => {
                  const target = user?.role === 'CASHIER' ? 'pos'
                    : user?.role === 'KITCHEN' ? 'kitchen'
                    : user?.role === 'INVENTORY_MANAGER' ? 'inventory'
                    : user?.role === 'ACCOUNTANT' ? 'orders'
                    : 'tables';
                  setActiveTab(target);
                }}
                className="mt-6 px-4 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-md shadow-teal-500/20"
              >
                Return to My Station
              </button>
            </div>
          )
        )}

        {activeTab === 'huddle' && (
          <div className="p-6 max-w-7xl mx-auto">
            <DailyHuddleSummary
              onNavigateTab={setActiveTab}
              onOpenCopilot={() => setIsCopilotOpen(true)}
            />
          </div>
        )}

        {activeTab === 'team' && (
          <div className="p-6 max-w-7xl mx-auto">
            <TeamProgressTracker />
          </div>
        )}

        {activeTab === 'pos' && <POSView />}

        {activeTab === 'tables' && (
          <TablesView
            onOpenTablePOS={() => {
              setActiveTab('pos');
            }}
          />
        )}

        {activeTab === 'kitchen' && <KDSView />}

        {activeTab === 'orders' && <OrdersBillingView />}

        {activeTab === 'menu' && <RecipeBOMView />}

        {activeTab === 'inventory' && <InventoryLedgerView />}

        {activeTab === 'purchases' && <PurchasingView />}

        {activeTab === 'wastage' && <WastageCenterView />}

        {activeTab === 'menu-engineering' && <MenuEngineeringView />}

        {activeTab === 'forecast' && <ForecastView />}

        {activeTab === 'scheduling' && <SmartSchedulingView />}

        {activeTab === 'crm' && <CustomersView />}

        {activeTab === 'settings' && <RestaurantSettingsView />}
      </AppLayout>

      {/* Onboarding Wizard Modal if requested */}
      {showOnboardingWizard && (
        <InteractiveOnboardingWizard
          isOpen={showOnboardingWizard}
          onComplete={() => setShowOnboardingWizard(false)}
          onSkip={() => setShowOnboardingWizard(false)}
        />
      )}

      {/* Omnipresent AI Copilot Drawer */}
      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onNavigateToTab={setActiveTab}
      />

      {/* Global Toast Notification */}
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
    </>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}

export default App;
