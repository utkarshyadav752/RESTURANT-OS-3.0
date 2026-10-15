import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Receipt, Table as TableIcon, ChefHat, 
  ClipboardList, Utensils, Package, FlaskConical, Truck, 
  Trash2, Users, DollarSign, TrendingUp, Settings, 
  LogOut, Bell, Shield, Sparkles, Calendar,
  Menu as MenuIcon, X, Lock, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { RoleType } from '../../types/index.ts';
import { BranchSwitcher } from './BranchSwitcher.tsx';
import { AICopilotDrawer } from '../ai/AICopilotDrawer.tsx';
import { InteractiveOnboardingWizard } from '../wizard/InteractiveOnboardingWizard.tsx';

interface Props {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isCopilotOpen?: boolean;
  setIsCopilotOpen?: (open: boolean) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<Props> = ({ 
  activeTab, 
  onSelectTab, 
  isCopilotOpen: externalCopilotOpen,
  setIsCopilotOpen: externalSetIsCopilotOpen,
  children 
}) => {
  const { user, restaurant, logout } = useAuth();
  const [internalCopilotOpen, setInternalCopilotOpen] = useState(false);
  const isCopilotOpen = externalCopilotOpen !== undefined ? externalCopilotOpen : internalCopilotOpen;
  const setIsCopilotOpen = externalSetIsCopilotOpen || setInternalCopilotOpen;

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Default safely to non-owner if user is not loaded
  const userRole: RoleType = user?.role || 'WAITER';
  const isOwner = userRole === 'OWNER' || userRole === 'SUPER_ADMIN';

  // Helper to get default landing tab for a role
  const getRoleDefaultTab = (role: RoleType): string => {
    switch (role) {
      case 'OWNER':
      case 'SUPER_ADMIN':
        return 'dashboard';
      case 'CASHIER':
        return 'pos';
      case 'KITCHEN':
        return 'kitchen';
      case 'WAITER':
        return 'tables';
      case 'INVENTORY_MANAGER':
        return 'inventory';
      case 'ACCOUNTANT':
        return 'orders';
      case 'MANAGER':
        return 'tables';
      default:
        return 'pos';
    }
  };

  // STRICT ACCESS GUARD:
  // If a non-owner ever has activeTab set to 'dashboard' (Executive Overview), immediately redirect them to their station!
  useEffect(() => {
    if (!isOwner && activeTab === 'dashboard') {
      const target = getRoleDefaultTab(userRole);
      onSelectTab(target);
    }
  }, [userRole, activeTab, isOwner, onSelectTab]);

  // Role-Specific Wallpaper, Transparent Kitchen Photos & Ambiance Configurations
  const roleWallpapers: Record<RoleType, {
    bgGradient: string;
    ambientGlow: string;
    wallpaperPattern: string;
    photoUrl: string;
    photoOpacity: string;
    stationTitle: string;
    themeBadge: string;
    accentColor: string;
  }> = {
    OWNER: {
      bgGradient: 'bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950',
      ambientGlow: 'bg-amber-500/12',
      wallpaperPattern: 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.12), transparent 60%)',
      photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80', // Executive wine room & fine dining
      photoOpacity: 'opacity-10',
      stationTitle: 'Executive Owner Suite · Reserve Command',
      themeBadge: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
      accentColor: 'text-amber-400',
    },
    SUPER_ADMIN: {
      bgGradient: 'bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950',
      ambientGlow: 'bg-amber-500/12',
      wallpaperPattern: 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.12), transparent 60%)',
      photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80',
      photoOpacity: 'opacity-10',
      stationTitle: 'Super Administrator · System Operations',
      themeBadge: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
      accentColor: 'text-amber-400',
    },
    MANAGER: {
      bgGradient: 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950',
      ambientGlow: 'bg-blue-600/12',
      wallpaperPattern: 'radial-gradient(circle at 50% 10%, rgba(37, 99, 235, 0.12), transparent 60%)',
      photoUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1920&q=80', // Bustling luxury restaurant floor
      photoOpacity: 'opacity-12',
      stationTitle: 'Floor Operations & Guest Command Terminal',
      themeBadge: 'border-blue-500/40 text-blue-300 bg-blue-500/10',
      accentColor: 'text-blue-400',
    },
    KITCHEN: {
      bgGradient: 'bg-gradient-to-b from-stone-950 via-neutral-900 to-stone-950',
      ambientGlow: 'bg-orange-600/14',
      wallpaperPattern: 'radial-gradient(circle at 75% 20%, rgba(234, 88, 12, 0.14), transparent 55%)',
      photoUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1920&q=80', // Commercial stainless steel chef station & flame
      photoOpacity: 'opacity-14',
      stationTitle: 'Kitchen Brigade & Tandoor Station (KDS)',
      themeBadge: 'border-orange-500/40 text-orange-300 bg-orange-500/10',
      accentColor: 'text-orange-400',
    },
    CASHIER: {
      bgGradient: 'bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950',
      ambientGlow: 'bg-emerald-500/12',
      wallpaperPattern: 'radial-gradient(circle at 30% 10%, rgba(16, 185, 129, 0.12), transparent 60%)',
      photoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80', // Warm cafe espresso counter & rapid POS
      photoOpacity: 'opacity-12',
      stationTitle: 'Smart POS & Rapid Billing Terminal',
      themeBadge: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
      accentColor: 'text-emerald-400',
    },
    WAITER: {
      bgGradient: 'bg-gradient-to-b from-stone-950 via-slate-900 to-stone-950',
      ambientGlow: 'bg-amber-600/12',
      wallpaperPattern: 'radial-gradient(circle at 50% 10%, rgba(217, 119, 6, 0.12), transparent 60%)',
      photoUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&q=80', // Intimate candlelit dinner service
      photoOpacity: 'opacity-12',
      stationTitle: 'Table Captain & Hospitality Service Hub',
      themeBadge: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
      accentColor: 'text-amber-400',
    },
    INVENTORY_MANAGER: {
      bgGradient: 'bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950',
      ambientGlow: 'bg-teal-500/12',
      wallpaperPattern: 'radial-gradient(circle at 50% 10%, rgba(20, 184, 166, 0.12), transparent 60%)',
      photoUrl: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&w=1920&q=80', // Artisan pantry & wine storage cellar
      photoOpacity: 'opacity-12',
      stationTitle: 'Kirana Stock Ledger & Cold Prep Vault',
      themeBadge: 'border-teal-500/40 text-teal-300 bg-teal-500/10',
      accentColor: 'text-teal-400',
    },
    ACCOUNTANT: {
      bgGradient: 'bg-gradient-to-b from-stone-950 via-neutral-900 to-stone-950',
      ambientGlow: 'bg-purple-600/12',
      wallpaperPattern: 'radial-gradient(circle at 50% 10%, rgba(147, 51, 234, 0.12), transparent 60%)',
      photoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80', // Financial ledger & office suite
      photoOpacity: 'opacity-10',
      stationTitle: 'Statutory GST & Margin Audit Suite',
      themeBadge: 'border-purple-500/40 text-purple-300 bg-purple-500/10',
      accentColor: 'text-purple-400',
    },
  };

  const currentWallpaper = roleWallpapers[userRole] || roleWallpapers['OWNER'];

  // Navigation items with STRICT ROLE-BASED ACCESS
  // CRITICAL REQUIREMENT: ONLY OWNER (and SUPER_ADMIN) can see and access 'Executive Overview'!
  const allNavItems: {
    id: string;
    label: string;
    icon: React.ReactNode;
    roles: RoleType[];
    tag?: string;
  }[] = [
    { 
      id: 'dashboard', 
      label: 'Executive Overview', 
      icon: <LayoutDashboard className="w-4 h-4" />, 
      roles: ['OWNER', 'SUPER_ADMIN'],
      tag: 'Owner Only'
    },
    { 
      id: 'huddle', 
      label: 'Daily Huddle AI', 
      icon: <Sparkles className="w-4 h-4 text-amber-400" />, 
      roles: ['OWNER', 'MANAGER', 'KITCHEN'] 
    },
    { 
      id: 'team', 
      label: 'Staff Progress Tracker', 
      icon: <Users className="w-4 h-4" />, 
      roles: ['OWNER', 'MANAGER'] 
    },
    { 
      id: 'pos', 
      label: 'Smart POS', 
      icon: <Receipt className="w-4 h-4" />, 
      roles: ['OWNER', 'MANAGER', 'CASHIER', 'WAITER'] 
    },
    { 
      id: 'tables', 
      label: 'Floor & Tables', 
      icon: <TableIcon className="w-4 h-4" />, 
      roles: ['OWNER', 'MANAGER', 'WAITER', 'CASHIER'] 
    },
    { 
      id: 'kitchen', 
      label: 'Kitchen (KDS)', 
      icon: <ChefHat className="w-4 h-4" />, 
      roles: ['OWNER', 'MANAGER', 'KITCHEN', 'WAITER'] 
    },
    { 
      id: 'orders', 
      label: 'Orders & Billing', 
      icon: <ClipboardList className="w-4 h-4" />, 
      roles: ['OWNER', 'MANAGER', 'CASHIER', 'ACCOUNTANT'] 
    },
    { 
      id: 'menu', 
      label: 'Menu & Recipes (BOM)', 
      icon: <FlaskConical className="w-4 h-4" />, 
      roles: ['OWNER', 'MANAGER', 'KITCHEN', 'ACCOUNTANT'] 
    },
    { 
      id: 'inventory', 
      label: 'Inventory Ledger', 
      icon: <Package className="w-4 h-4" />, 
      roles: ['OWNER', 'MANAGER', 'INVENTORY_MANAGER'] 
    },
    { 
      id: 'purchases', 
      label: 'Purchases & Vendors', 
      icon: <Truck className="w-4 h-4" />, 
      roles: ['OWNER', 'MANAGER', 'INVENTORY_MANAGER'] 
    },
    { 
      id: 'wastage', 
      label: 'Wastage Center', 
      icon: <Trash2 className="w-4 h-4" />, 
      roles: ['OWNER', 'MANAGER', 'KITCHEN', 'INVENTORY_MANAGER'] 
    },
    { 
      id: 'customers', 
      label: 'Customers CRM', 
      icon: <Users className="w-4 h-4" />, 
      roles: ['OWNER', 'MANAGER', 'CASHIER'] 
    },
    { 
      id: 'profit', 
      label: 'Profit Intelligence', 
      icon: <DollarSign className="w-4 h-4" />, 
      roles: ['OWNER', 'ACCOUNTANT'] 
    },
    { 
      id: 'forecast', 
      label: 'AI Demand Forecast', 
      icon: <TrendingUp className="w-4 h-4" />, 
      roles: ['OWNER', 'MANAGER'] 
    },
    { 
      id: 'scheduling', 
      label: 'Smart Shift Scheduling', 
      icon: <Calendar className="w-4 h-4 text-emerald-400" />, 
      roles: ['OWNER', 'MANAGER'] 
    },
    { 
      id: 'settings', 
      label: 'Settings & Security', 
      icon: <Settings className="w-4 h-4" />, 
      roles: ['OWNER', 'SUPER_ADMIN'] 
    },
  ];

  // Strictly filter items: Non-owners NEVER see Overview or Owner-only tabs in the side navigation!
  const visibleNavItems = allNavItems.filter(item => {
    if (item.id === 'dashboard') {
      return isOwner;
    }
    return item.roles.includes(userRole);
  });

  const notifications = [
    { id: 1, title: 'Low Stock Alert', time: '10m ago', text: 'Farm Plum Tomatoes down to 6.2 kg (Critical)' },
    { id: 2, title: 'Recipe Drift Flag', time: '25m ago', text: 'Boneless chicken consumption +25.3% over recipe BOM' },
    { id: 3, title: 'Tomorrow Purchase Plan', time: '1h ago', text: 'AI recommendation: 22kg Chicken order ready for review' },
  ];

  return (
    <div className={`relative min-h-screen ${currentWallpaper.bgGradient} flex flex-col antialiased selection:bg-amber-500/20 selection:text-amber-200 transition-colors duration-500 overflow-x-hidden`}>
      
      {/* 1. Subtle Transparent Kitchen/Restaurant Atmosphere Photo Backdrop */}
      <div 
        className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${currentWallpaper.photoOpacity}`}
        style={{
          backgroundImage: `url(${currentWallpaper.photoUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mixBlendMode: 'luminosity',
          filter: 'contrast(115%) brightness(90%)',
        }}
      />

      {/* 2. Soft Dark Vignette Overlay for Crisp Readability */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-radial-gradient from-transparent via-stone-950/75 to-stone-950/95" />

      {/* 3. Role-Specific Ambient Restaurant Warm Glow & Radial Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 transition-all duration-700 opacity-60"
        style={{ backgroundImage: currentWallpaper.wallpaperPattern }}
      />
      <div className={`fixed top-0 right-1/4 w-[600px] h-[400px] ${currentWallpaper.ambientGlow} blur-[140px] rounded-full pointer-events-none`} />

      {/* Top Header Bar */}
      <header className="h-16 px-4 sm:px-6 bg-stone-950/85 border-b border-stone-800/80 backdrop-blur-md flex items-center justify-between z-30 sticky top-0 shadow-lg">
        
        {/* Left Brand + Mobile menu trigger + Branch Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-900 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>

          {/* Logo click routes safely: Owner goes to Executive Overview; non-owners go to their assigned operational station */}
          <button
            onClick={() => {
              if (isOwner) {
                onSelectTab('dashboard');
              } else {
                onSelectTab(getRoleDefaultTab(userRole));
              }
            }}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-stone-950 font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Utensils className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Restaurant<span className="text-amber-400">OS</span></span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {isOwner ? 'Owner Suite' : `${userRole} Station`}
                </span>
              </div>
              <div className="text-[10px] text-stone-400 truncate max-w-[140px]">
                {restaurant?.name || 'Zafran Bistro'}
              </div>
            </div>
          </button>

          <div className="h-5 w-px bg-stone-800 mx-1 hidden sm:block" />

          {/* Multi-Branch Selector */}
          <BranchSwitcher />
        </div>

        {/* Right Action Tools: Role Wallpaper Indicator, AI Copilot, Notifications, Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Active Role Clearance Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-sm ${currentWallpaper.themeBadge}`}>
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden md:inline opacity-75">Role:</span>
            <span>{userRole}</span>
          </div>

          {/* AI Copilot Drawer Trigger */}
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Copilot</span>
          </button>

          {/* Setup Wizard Trigger */}
          <button
            onClick={() => setIsWizardOpen(true)}
            className="hidden xl:flex items-center gap-1 text-xs text-stone-300 hover:text-white px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 cursor-pointer"
          >
            Wizard
          </button>

          {/* Notifications Drawer Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-900 transition-colors relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 p-3 rounded-2xl bg-stone-950/95 border border-stone-800 shadow-2xl backdrop-blur-xl z-50 text-xs animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800 font-bold text-white">
                  <span>Shift Alerts</span>
                  <span className="text-[10px] text-amber-400 font-mono">3 New</span>
                </div>
                <div className="py-2 space-y-2">
                  {notifications.map(n => (
                    <div key={n.id} className="p-2 rounded-xl bg-stone-900/60 border border-stone-800/80">
                      <div className="flex justify-between font-semibold text-stone-200 text-[11px]">
                        <span>{n.title}</span>
                        <span className="text-[9px] text-stone-500">{n.time}</span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-0.5">{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-stone-800">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
              alt={user?.name}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover border border-amber-500/40"
            />
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-white leading-tight truncate max-w-[110px]">{user?.name}</div>
              <div className="text-[10px] text-stone-400 leading-tight truncate max-w-[110px]">{user?.email}</div>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold cursor-pointer transition-colors"
              title="Logout session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex overflow-hidden z-10">
        
        {/* Navigation Sidebar */}
        <aside className={`w-64 bg-stone-950/90 border-r border-stone-800/80 backdrop-blur-md flex flex-col justify-between py-4 px-3 shrink-0 transition-transform z-20 ${
          isMobileMenuOpen ? 'fixed inset-y-16 left-0 shadow-2xl block' : 'hidden lg:flex'
        }`}>
          <div className="space-y-1 overflow-y-auto pr-1">
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                {isOwner ? 'Executive Command' : `${userRole} Station`}
              </span>
              <span className="text-[9px] font-mono text-amber-400/80">
                {visibleNavItems.length} Tabs
              </span>
            </div>

            {visibleNavItems.map(item => {
              const isActive = activeTab === item.id;
              const isOwnerOnly = item.id === 'dashboard';

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 font-black'
                      : 'text-stone-300 hover:text-white hover:bg-stone-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`${isActive ? 'text-stone-950' : isOwnerOnly ? 'text-amber-400' : 'text-stone-400'}`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {isOwnerOnly && !isActive && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                      <span>👑</span>
                      <span className="hidden xl:inline text-[8px]">Owner</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Role Wallpaper Station Indicator */}
          <div className="pt-3 border-t border-stone-800/80 space-y-2">
            <div className="p-3 rounded-2xl bg-stone-900/80 border border-stone-800 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-stone-200 text-[11px] truncate">{currentWallpaper.stationTitle}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>
              <p className="text-[10px] text-stone-400 leading-tight">
                Active Branch: <strong className="text-white">{restaurant?.city || 'Delhi NCR'}</strong>
              </p>
            </div>
          </div>
        </aside>

        {/* Primary Content View Area */}
        <main className="flex-1 overflow-y-auto relative z-10">
          {children}
        </main>

      </div>

      {/* AI Copilot Drawer */}
      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      {/* Interactive Setup Wizard Modal */}
      <InteractiveOnboardingWizard
        isOpen={isWizardOpen}
        onComplete={() => setIsWizardOpen(false)}
        onSkip={() => setIsWizardOpen(false)}
      />

    </div>
  );
};
