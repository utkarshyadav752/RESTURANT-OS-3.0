import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, Award, Phone, Mail, Calendar, 
  Search, Plus, Heart, ShoppingBag, DollarSign,
  Sparkles, Gift, Percent, ArrowUpRight, TrendingUp,
  AlertTriangle, CheckCircle2, Copy, Share2,
  Sliders, RefreshCw, X, ChevronRight, ShieldCheck,
  Star, Zap, Clock, Tag, Flame, MessageCircle, ExternalLink
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { 
  Customer, CustomerLoyaltyTier, CustomerVisitRecord, 
  LoyaltyPointsTransaction, PersonalizedDiscountOffer, 
  LoyaltyProgramConfig 
} from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

type TabView = 'OVERVIEW' | 'VISITS' | 'LEDGER' | 'DISCOUNTS';
type FilterTier = 'ALL' | 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'AT_RISK';
type SortOption = 'POINTS_DESC' | 'SPEND_DESC' | 'VISITS_DESC' | 'RECENT';

const TIER_COLORS: Record<CustomerLoyaltyTier, {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accent: string;
  ring: string;
  icon: string;
}> = {
  PLATINUM: {
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/30',
    accent: 'from-cyan-500 to-indigo-600',
    ring: 'ring-cyan-500/40',
    icon: '💎'
  },
  GOLD: {
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/30',
    accent: 'from-amber-400 to-amber-600',
    ring: 'ring-amber-500/40',
    icon: '🥇'
  },
  SILVER: {
    badgeBg: 'bg-slate-300/15',
    badgeText: 'text-slate-200',
    badgeBorder: 'border-slate-400/30',
    accent: 'from-slate-300 to-slate-500',
    ring: 'ring-slate-400/30',
    icon: '🥈'
  },
  BRONZE: {
    badgeBg: 'bg-orange-600/15',
    badgeText: 'text-orange-300',
    badgeBorder: 'border-orange-500/30',
    accent: 'from-orange-500 to-amber-700',
    ring: 'ring-orange-500/30',
    icon: '🥉'
  }
};

export const CustomersView: React.FC = () => {
  const { currentBranch } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyProgramConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filter
  const [search, setSearch] = useState<string>('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<FilterTier>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('POINTS_DESC');

  // Modals & Active Selections
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeDossierTab, setActiveDossierTab] = useState<TabView>('OVERVIEW');
  const [showDossierModal, setShowDossierModal] = useState<boolean>(false);

  // Award Points Modal
  const [showAwardModal, setShowAwardModal] = useState<boolean>(false);
  const [awardTargetCustomer, setAwardTargetCustomer] = useState<Customer | null>(null);
  const [awardBillAmount, setAwardBillAmount] = useState<number>(1500);
  const [awardBonusPoints, setAwardBonusPoints] = useState<number>(0);
  const [awardReason, setAwardReason] = useState<string>('Dining Bill Settlement');
  const [awardTableNumber, setAwardTableNumber] = useState<string>('T01');
  const [isAwarding, setIsAwarding] = useState<boolean>(false);
  const [awardSuccessMsg, setAwardSuccessMsg] = useState<string | null>(null);

  // Redeem Points Modal
  const [showRedeemModal, setShowRedeemModal] = useState<boolean>(false);
  const [redeemTargetCustomer, setRedeemTargetCustomer] = useState<Customer | null>(null);
  const [redeemPointsAmount, setRedeemPointsAmount] = useState<number>(100);
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [redeemSuccessMsg, setRedeemSuccessMsg] = useState<string | null>(null);

  // Loyalty Program Config Modal
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [configForm, setConfigForm] = useState<Partial<LoyaltyProgramConfig>>({});
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Register New Customer Modal
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustEmail, setNewCustEmail] = useState<string>('');
  const [newCustFavorites, setNewCustFavorites] = useState<string>('Purani Dilli Butter Chicken');
  const [newCustNotes, setNewCustNotes] = useState<string>('Walk-in guest registered in loyalty club');
  const [newCustDiet, setNewCustDiet] = useState<'ALL' | 'VEGETARIAN' | 'NON_VEGETARIAN'>('ALL');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Copy feedback tracking
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [custRes, configRes] = await Promise.all([
        api.get<Customer[]>('/customers'),
        api.get<LoyaltyProgramConfig>('/loyalty/rules')
      ]);
      setCustomers(custRes || []);
      setLoyaltyConfig(configRes || null);
      if (configRes) {
        setConfigForm(configRes);
      }
    } catch (err) {
      console.error('Error fetching customers and loyalty config:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep selectedCustomer in sync with customers array
  useEffect(() => {
    if (selectedCustomer) {
      const updated = customers.find(c => c.id === selectedCustomer.id);
      if (updated) setSelectedCustomer(updated);
    }
  }, [customers, selectedCustomer]);

  // Filter and Sort Customers
  const processedCustomers = useMemo(() => {
    let result = [...customers];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.phone.includes(q) || 
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.favorite_items.some(f => f.toLowerCase().includes(q))
      );
    }

    if (selectedTierFilter !== 'ALL') {
      if (selectedTierFilter === 'AT_RISK') {
        result = result.filter(c => c.churn_risk === 'HIGH' || c.days_since_last_visit >= 25);
      } else {
        result = result.filter(c => c.tier === selectedTierFilter);
      }
    }

    result.sort((a, b) => {
      if (sortBy === 'POINTS_DESC') return b.loyalty_points - a.loyalty_points;
      if (sortBy === 'SPEND_DESC') return b.total_spent - a.total_spent;
      if (sortBy === 'VISITS_DESC') return b.visit_count - a.visit_count;
      if (sortBy === 'RECENT') return a.days_since_last_visit - b.days_since_last_visit;
      return 0;
    });

    return result;
  }, [customers, search, selectedTierFilter, sortBy]);

  // Summary Metrics
  const stats = useMemo(() => {
    const totalMembers = customers.length;
    const totalCirculatingPoints = customers.reduce((acc, c) => acc + c.loyalty_points, 0);
    const totalLifetimeSpend = customers.reduce((acc, c) => acc + c.total_spent, 0);
    const totalVisits = customers.reduce((acc, c) => acc + c.visit_count, 0);
    const atRiskCount = customers.filter(c => c.churn_risk === 'HIGH' || c.days_since_last_visit >= 25).length;
    const platinumCount = customers.filter(c => c.tier === 'PLATINUM').length;
    const goldCount = customers.filter(c => c.tier === 'GOLD').length;
    const silverCount = customers.filter(c => c.tier === 'SILVER').length;
    const bronzeCount = customers.filter(c => c.tier === 'BRONZE').length;

    return {
      totalMembers,
      totalCirculatingPoints,
      totalLifetimeSpend,
      totalVisits,
      atRiskCount,
      platinumCount,
      goldCount,
      silverCount,
      bronzeCount
    };
  }, [customers]);

  // Handle Copy Voucher Code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Handle Share WhatsApp Voucher
  const handleShareWhatsApp = (customer: Customer, offer: PersonalizedDiscountOffer) => {
    const message = `Hello ${customer.name}! 🌟 Greetings from Zafran Gourmet Bistro. Here is an exclusive loyalty gift for you: "${offer.title}". Use coupon code *${offer.code}* on your next visit to enjoy ${offer.discount_type === 'PERCENTAGE' ? `${offer.discount_value}% off` : offer.discount_type === 'FLAT_AMOUNT' ? `₹${offer.discount_value} off` : `Complimentary ${offer.free_item_name}`} (Min bill ₹${offer.min_order_value}). Valid until ${offer.expiry_date}. We look forward to hosting you!`;
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Handle Award Points
  const handleAwardPointsSubmit = async () => {
    if (!awardTargetCustomer) return;
    setIsAwarding(true);
    setAwardSuccessMsg(null);
    try {
      const res = await api.post<{
        success: boolean;
        customer: Customer;
        transaction: LoyaltyPointsTransaction;
        pointsAwarded: number;
        newTierUpgraded: boolean;
      }>(`/customers/${awardTargetCustomer.id}/award-points`, {
        amountSpent: Number(awardBillAmount),
        bonusPoints: Number(awardBonusPoints),
        reason: awardReason,
        tableNumber: awardTableNumber,
        branchName: currentBranch?.name || 'Cyber City Hub',
        itemsSummary: ['Dining Bill Settlement']
      });

      setAwardSuccessMsg(`Successfully awarded +${res.pointsAwarded} pts! New Balance: ${res.customer.loyalty_points} pts`);
      // Update local state
      setCustomers(prev => prev.map(c => c.id === res.customer.id ? res.customer : c));
      if (selectedCustomer?.id === res.customer.id) {
        setSelectedCustomer(res.customer);
      }
      setTimeout(() => {
        setShowAwardModal(false);
        setAwardSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to award points');
    } finally {
      setIsAwarding(false);
    }
  };

  // Handle Redeem Points
  const handleRedeemPointsSubmit = async () => {
    if (!redeemTargetCustomer) return;
    setIsRedeeming(true);
    setRedeemSuccessMsg(null);
    try {
      const res = await api.post<{
        success: boolean;
        customer: Customer;
        discountAmountRupees: number;
        transaction: LoyaltyPointsTransaction;
      }>(`/customers/${redeemTargetCustomer.id}/redeem-points`, {
        pointsToRedeem: Number(redeemPointsAmount),
        note: `Redeemed ${redeemPointsAmount} pts for ₹${redeemPointsAmount} discount`
      });

      setRedeemSuccessMsg(`Successfully redeemed ${redeemPointsAmount} pts for ₹${res.discountAmountRupees} discount!`);
      setCustomers(prev => prev.map(c => c.id === res.customer.id ? res.customer : c));
      if (selectedCustomer?.id === res.customer.id) {
        setSelectedCustomer(res.customer);
      }
      setTimeout(() => {
        setShowRedeemModal(false);
        setRedeemSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to redeem points');
    } finally {
      setIsRedeeming(false);
    }
  };

  // Handle Generate Personalized Discounts
  const handleGenerateDiscounts = async (customerId: string) => {
    try {
      const res = await api.post<{ offers: PersonalizedDiscountOffer[]; customer: Customer }>(
        `/customers/${customerId}/generate-discounts`,
        {}
      );
      setCustomers(prev => prev.map(c => c.id === customerId ? res.customer : c));
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(res.customer);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate discounts');
    }
  };

  // Handle Register Customer
  const handleRegisterCustomerSubmit = async () => {
    if (!newCustName || !newCustPhone) {
      alert('Please enter guest name and phone number');
      return;
    }
    setIsRegistering(true);
    try {
      const created = await api.post<Customer>('/customers', {
        name: newCustName,
        phone: newCustPhone,
        email: newCustEmail,
        favorite_items: newCustFavorites.split(',').map(s => s.trim()).filter(Boolean),
        notes: newCustNotes,
        dining_preference: newCustDiet,
      });
      setCustomers(prev => [created, ...prev]);
      setShowRegisterModal(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustEmail('');
    } catch (err: any) {
      alert(err.message || 'Failed to register customer');
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle Save Loyalty Config
  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const updated = await api.put<LoyaltyProgramConfig>('/loyalty/rules', configForm);
      setLoyaltyConfig(updated);
      setShowConfigModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update loyalty rules');
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-400" />
              Customer Loyalty & VIP Rewards Engine
            </h2>
            <span className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Automated Point Multipliers & Personal Discounts
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracks real-time dining spend, calculates tier multipliers, automatically awards points, and generates personalized coupon incentives.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            Loyalty Program Rules
          </button>

          <button
            onClick={() => {
              if (customers.length > 0) {
                setAwardTargetCustomer(customers[0]);
                setShowAwardModal(true);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-slate-950" />
            Award Points for Bill
          </button>

          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Register VIP Member
          </button>
        </div>
      </div>

      {/* Program KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Registered VIPs */}
        <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Loyalty Members
            </div>
            <div className="text-2xl font-black text-white mt-1 font-mono">
              {stats.totalMembers} <span className="text-xs font-normal text-slate-500">Guests</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
              <span className="text-cyan-400 font-bold">{stats.platinumCount} 💎</span>
              <span className="text-amber-400 font-bold">{stats.goldCount} 🥇</span>
              <span className="text-slate-300 font-bold">{stats.silverCount} 🥈</span>
              <span className="text-orange-400 font-bold">{stats.bronzeCount} 🥉</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Circulating Points Pool */}
        <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Points Pool
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
              {stats.totalCirculatingPoints.toLocaleString('en-IN')} <span className="text-xs font-normal text-amber-500/80">pts</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3" />
              <span>₹{stats.totalCirculatingPoints.toLocaleString('en-IN')} redemption value</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Gift className="w-5 h-5" />
          </div>
        </div>

        {/* Lifetime Spend Tracked */}
        <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tracked Member Spend
            </div>
            <div className="text-2xl font-black text-white mt-1 font-mono">
              ₹{stats.totalLifetimeSpend.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>{stats.totalVisits} total dining visits</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Churn Risk / Lapsed Regulars Alert */}
        <div className="p-4 rounded-2xl glass-panel-elevated bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Lapsed Regulars (Risk)
            </div>
            <div className="text-2xl font-black text-rose-400 mt-1 font-mono">
              {stats.atRiskCount} <span className="text-xs font-normal text-slate-500">Alerts</span>
            </div>
            <div className="text-[11px] text-rose-300/90 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Win-back discounts available</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Flame className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Search, Filter Tabs & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
        
        {/* Tier Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedTierFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedTierFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            All Guests ({customers.length})
          </button>

          <button
            onClick={() => setSelectedTierFilter('PLATINUM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              selectedTierFilter === 'PLATINUM'
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'bg-slate-800/80 text-cyan-300 hover:bg-slate-800'
            }`}
          >
            💎 Platinum ({stats.platinumCount})
          </button>

          <button
            onClick={() => setSelectedTierFilter('GOLD')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              selectedTierFilter === 'GOLD'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-slate-800/80 text-amber-300 hover:bg-slate-800'
            }`}
          >
            🥇 Gold ({stats.goldCount})
          </button>

          <button
            onClick={() => setSelectedTierFilter('SILVER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              selectedTierFilter === 'SILVER'
                ? 'bg-slate-200 text-slate-950 font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            🥈 Silver ({stats.silverCount})
          </button>

          <button
            onClick={() => setSelectedTierFilter('BRONZE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              selectedTierFilter === 'BRONZE'
                ? 'bg-orange-500 text-slate-950 font-black'
                : 'bg-slate-800/80 text-orange-300 hover:bg-slate-800'
            }`}
          >
            🥉 Bronze ({stats.bronzeCount})
          </button>

          <button
            onClick={() => setSelectedTierFilter('AT_RISK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              selectedTierFilter === 'AT_RISK'
                ? 'bg-rose-500 text-white font-black'
                : 'bg-rose-950/40 text-rose-300 border border-rose-500/20 hover:bg-rose-900/40'
            }`}
          >
            ⚠️ At-Risk ({stats.atRiskCount})
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, dish..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="POINTS_DESC">Sort: Points (High)</option>
            <option value="SPEND_DESC">Sort: Lifetime Spend</option>
            <option value="VISITS_DESC">Sort: Most Visits</option>
            <option value="RECENT">Sort: Recent Visit</option>
          </select>
        </div>
      </div>

      {/* Customer Cards Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-sm font-semibold">Loading VIP loyalty profiles & visit ledgers...</p>
        </div>
      ) : processedCustomers.length === 0 ? (
        <div className="p-16 text-center text-slate-500 glass-panel rounded-3xl border border-slate-800">
          <Award className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No customers found matching your filter</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting the search query or tier filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedCustomers.map(cust => {
            const tierStyle = TIER_COLORS[cust.tier] || TIER_COLORS.BRONZE;
            const topOffer = cust.personalized_discounts?.[0];

            return (
              <div
                key={cust.id}
                className="group relative p-5 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex flex-col justify-between gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
              >
                {/* Card Top: Avatar, Name, Tier Badge, Points */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar Initials with Tier Ring */}
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${tierStyle.accent} p-[2px] shadow-sm`}>
                        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-sm font-black text-white">
                          {cust.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                            {cust.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{cust.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tier Badge */}
                    <div className={`px-2.5 py-1 rounded-xl ${tierStyle.badgeBg} border ${tierStyle.badgeBorder} ${tierStyle.badgeText} font-mono text-[11px] font-black flex items-center gap-1 shrink-0`}>
                      <span>{tierStyle.icon}</span>
                      <span>{cust.tier}</span>
                    </div>
                  </div>

                  {/* Points Balance Pill & Tier Progress */}
                  <div className="mt-4 p-3 rounded-2xl bg-slate-950/90 border border-slate-850 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Loyalty Points Balance
                      </span>
                      <div className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1">
                        <span>₹{cust.loyalty_points.toLocaleString('en-IN')} off</span>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl font-black text-amber-400 font-mono tracking-tight flex items-center gap-1.5">
                        <Award className="w-5 h-5 text-amber-400" />
                        <span>{cust.loyalty_points.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-slate-400 font-normal">pts</span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono">
                        {cust.tier === 'PLATINUM' ? (
                          <span className="text-cyan-300 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-cyan-400" /> Max Tier (2.0x)
                          </span>
                        ) : (
                          <span>
                            +{cust.points_to_next_tier || 0} pts to next tier
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mini Progress Bar to next tier */}
                    {cust.tier !== 'PLATINUM' && (
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${tierStyle.accent}`}
                          style={{
                            width: `${Math.min(100, Math.max(15, (cust.loyalty_points / ((cust.loyalty_points + (cust.points_to_next_tier || 100)))) * 100))}%`
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Dining Matrix (Spend, Visits, Avg Ticket) */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-950/60 rounded-xl my-3 text-xs font-mono text-center">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Lifetime Spend</span>
                      <span className="font-bold text-white text-xs">₹{cust.total_spent.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Visits</span>
                      <span className="font-bold text-emerald-400 text-xs">{cust.visit_count} times</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Avg Ticket</span>
                      <span className="font-bold text-amber-300 text-xs">₹{cust.avg_spend_per_visit.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Last Visit Status / Churn Alert */}
                  <div className="flex items-center justify-between text-[11px] mb-2 px-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Last: {cust.last_visit}</span>
                    </span>

                    {cust.churn_risk === 'HIGH' ? (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        At Risk ({cust.days_since_last_visit}d ago)
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400/90 font-mono">
                        Active Regular
                      </span>
                    )}
                  </div>

                  {/* Favorite Items */}
                  <div className="space-y-1 text-xs">
                    <div className="text-slate-400 flex items-start gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {cust.favorite_items.slice(0, 2).map((fav, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] text-slate-200 border border-slate-700 font-medium">
                            {fav}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Personalized Discount Highlight Preview */}
                  {topOffer && (
                    <div className="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/20 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-amber-400" />
                          Personal Discount
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Expires {topOffer.expiry_date}
                        </span>
                      </div>

                      <div className="font-bold text-white text-[11px] truncate">
                        {topOffer.title}
                      </div>

                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <div className="px-2 py-0.5 rounded bg-slate-950 font-mono font-bold text-[10px] text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <span>{topOffer.code}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyCode(topOffer.code)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Copy Voucher Code"
                          >
                            {copiedCode === topOffer.code ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleShareWhatsApp(cust, topOffer)}
                            className="p-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 hover:text-emerald-200 transition-colors"
                            title="Send via WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Card Actions Bottom */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setActiveDossierTab('OVERVIEW');
                      setShowDossierModal(true);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Full Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setAwardTargetCustomer(cust);
                      setShowAwardModal(true);
                    }}
                    className="py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Award Points"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Points</span>
                  </button>

                  <button
                    onClick={() => {
                      setRedeemTargetCustomer(cust);
                      setShowRedeemModal(true);
                    }}
                    className="py-1.5 px-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Redeem Points"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Redeem</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* FULL CUSTOMER DOSSIER & LOYALTY MODAL                     */}
      {/* ========================================================= */}
      {showDossierModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${TIER_COLORS[selectedCustomer.tier]?.accent} p-[2px]`}>
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-base font-black text-white">
                    {selectedCustomer.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-white">{selectedCustomer.name}</h3>
                    <span className={`px-2 py-0.5 rounded-lg ${TIER_COLORS[selectedCustomer.tier]?.badgeBg} ${TIER_COLORS[selectedCustomer.tier]?.badgeText} border ${TIER_COLORS[selectedCustomer.tier]?.badgeBorder} text-xs font-black font-mono flex items-center gap-1`}>
                      <span>{TIER_COLORS[selectedCustomer.tier]?.icon}</span>
                      <span>{selectedCustomer.tier} TIER</span>
                    </span>
                    {selectedCustomer.churn_risk === 'HIGH' && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400" /> High Churn Risk
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {selectedCustomer.phone}
                    </span>
                    {selectedCustomer.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {selectedCustomer.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xl font-black text-amber-400 font-mono">
                    {selectedCustomer.loyalty_points.toLocaleString('en-IN')} pts
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    ≈ ₹{selectedCustomer.loyalty_points.toLocaleString('en-IN')} off food bill
                  </div>
                </div>

                <button
                  onClick={() => setShowDossierModal(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dossier Tabs Navigation */}
            <div className="px-5 border-b border-slate-800 bg-slate-950/40 flex items-center gap-4 overflow-x-auto scrollbar-none text-xs font-bold">
              <button
                onClick={() => setActiveDossierTab('OVERVIEW')}
                className={`py-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeDossierTab === 'OVERVIEW'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Award className="w-4 h-4" />
                Loyalty & Tier Status
              </button>

              <button
                onClick={() => setActiveDossierTab('VISITS')}
                className={`py-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeDossierTab === 'VISITS'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Visit History ({selectedCustomer.visit_history.length})
              </button>

              <button
                onClick={() => setActiveDossierTab('LEDGER')}
                className={`py-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeDossierTab === 'LEDGER'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Points Ledger ({selectedCustomer.points_ledger.length})
              </button>

              <button
                onClick={() => setActiveDossierTab('DISCOUNTS')}
                className={`py-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeDossierTab === 'DISCOUNTS'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Percent className="w-4 h-4" />
                Personalized Discounts ({selectedCustomer.personalized_discounts.length})
              </button>
            </div>

            {/* Dossier Content Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              
              {/* TAB 1: OVERVIEW & TIER STATUS */}
              {activeDossierTab === 'OVERVIEW' && (
                <div className="space-y-5">
                  
                  {/* Tier Metrics Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Current Balance</span>
                      <span className="text-xl font-black text-amber-400 font-mono">{selectedCustomer.loyalty_points} pts</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Lifetime Earned</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">{selectedCustomer.lifetime_points_earned} pts</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Points Redeemed</span>
                      <span className="text-xl font-black text-cyan-400 font-mono">{selectedCustomer.lifetime_points_redeemed} pts</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Total Lifetime Spend</span>
                      <span className="text-xl font-black text-white font-mono">₹{selectedCustomer.total_spent.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Tier Benefits & Multiplier Perks */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Active Tier Perks ({selectedCustomer.tier})
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                        <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white">Points Earning Multiplier</div>
                          <div className="text-[11px] text-slate-400">
                            {selectedCustomer.tier === 'PLATINUM' ? '2.0x Points on every ₹ spend' : selectedCustomer.tier === 'GOLD' ? '1.5x Points on every ₹ spend' : selectedCustomer.tier === 'SILVER' ? '1.25x Points on every ₹ spend' : '1.0x Base points'}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                        <Star className="w-5 h-5 text-cyan-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white">Priority Reservation</div>
                          <div className="text-[11px] text-slate-400">
                            Dedicated booth table hold & zero-wait seating
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                        <Gift className="w-5 h-5 text-rose-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white">Birthday & Milestone Treat</div>
                          <div className="text-[11px] text-slate-400">
                            +200 Bonus points and complimentary signature dessert
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white">VIP Host Concierge</div>
                          <div className="text-[11px] text-slate-400">
                            Custom spice preferences & portion customization
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dining Habits & Notes */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Dining Preferences & Staff Directives
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono">Favorite Dishes:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCustomer.favorite_items.map((fav, idx) => (
                            <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-medium">
                              {fav}
                            </span>
                          ))}
                        </div>
                      </div>

                      {selectedCustomer.notes && (
                        <div className="p-3 rounded-xl bg-slate-900 text-slate-300 italic border border-slate-800 text-[11px]">
                          "{selectedCustomer.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: VISIT HISTORY */}
              {activeDossierTab === 'VISITS' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Chronological Dining Visits & Order Breakdown
                    </h4>
                    <span className="text-xs text-slate-500 font-mono">
                      {selectedCustomer.visit_history.length} logged visits
                    </span>
                  </div>

                  {selectedCustomer.visit_history.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 glass-panel rounded-2xl">
                      No visits recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedCustomer.visit_history.map((vis) => (
                        <div
                          key={vis.id}
                          className="p-4 rounded-2xl bg-slate-950 border border-slate-850 hover:border-slate-750 transition-colors space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 font-mono text-xs">
                                <span className="font-bold text-white">{vis.date}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-400">{vis.branch_name}</span>
                                {vis.table_number && (
                                  <>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-amber-400 font-bold">Table {vis.table_number}</span>
                                  </>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Settled via {vis.payment_method}
                              </div>
                            </div>

                            <div className="text-right font-mono">
                              <div className="text-sm font-bold text-white">
                                ₹{vis.bill_amount.toLocaleString('en-IN')}
                              </div>
                              <div className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                                <Plus className="w-3 h-3" />
                                <span>{vis.points_earned} pts earned</span>
                              </div>
                            </div>
                          </div>

                          {/* Items summary */}
                          <div className="p-2.5 rounded-xl bg-slate-900 text-xs text-slate-300 flex items-center gap-2">
                            <UtensilsIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{vis.items_summary.join(', ')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: POINTS LEDGER */}
              {activeDossierTab === 'LEDGER' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Complete Points Audit Ledger
                    </h4>
                    <span className="text-xs text-slate-500 font-mono">
                      Current: {selectedCustomer.loyalty_points} pts
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedCustomer.points_ledger.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl shrink-0 ${
                            tx.points > 0 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {tx.points > 0 ? <Plus className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
                          </div>

                          <div>
                            <div className="text-xs font-bold text-white">{tx.description}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{tx.date}</div>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div className={`text-sm font-black ${tx.points > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Bal: {tx.balance_after} pts
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: PERSONALIZED DISCOUNTS */}
              {activeDossierTab === 'DISCOUNTS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-amber-400" />
                        Hyper-Personalized Dining Vouchers
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Generated automatically from guest dining frequency and preferred kitchen recipes.
                      </p>
                    </div>

                    <button
                      onClick={() => handleGenerateDiscounts(selectedCustomer.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 flex items-center gap-1 transition-colors border border-slate-700"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Refresh Offers
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedCustomer.personalized_discounts.map((offer) => (
                      <div
                        key={offer.id}
                        className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono">
                            {offer.badge_label}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Valid till {offer.expiry_date}
                          </span>
                        </div>

                        <div>
                          <div className="text-sm font-bold text-white">{offer.title}</div>
                          <p className="text-xs text-slate-400 mt-0.5">{offer.description}</p>
                        </div>

                        <div className="text-[10px] text-slate-500 font-mono">
                          Min bill: ₹{offer.min_order_value} {offer.max_discount_cap ? `• Cap: ₹${offer.max_discount_cap}` : ''}
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold">
                            {offer.code}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleCopyCode(offer.code)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              {copiedCode === offer.code ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleShareWhatsApp(selectedCustomer, offer)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Quick Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-400 font-mono hidden sm:block">
                Customer ID: {selectedCustomer.id}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => {
                    setAwardTargetCustomer(selectedCustomer);
                    setShowAwardModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  Award Points for Bill
                </button>

                <button
                  onClick={() => {
                    setRedeemTargetCustomer(selectedCustomer);
                    setShowRedeemModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Gift className="w-4 h-4" />
                  Redeem Points (Cashback)
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* AWARD LOYALTY POINTS MODAL                                */}
      {/* ========================================================= */}
      {showAwardModal && awardTargetCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Award Loyalty Points
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Guest: <span className="text-amber-300 font-bold">{awardTargetCustomer.name}</span> ({awardTargetCustomer.tier})
                </p>
              </div>
              <button
                onClick={() => setShowAwardModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {awardSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold">
                {awardSuccessMsg}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Dining Bill Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={awardBillAmount}
                    onChange={(e) => setAwardBillAmount(Number(e.target.value))}
                    min={1}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Table Number
                    </label>
                    <input
                      type="text"
                      value={awardTableNumber}
                      onChange={(e) => setAwardTableNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Bonus Points (Gift)
                    </label>
                    <input
                      type="number"
                      value={awardBonusPoints}
                      onChange={(e) => setAwardBonusPoints(Number(e.target.value))}
                      min={0}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Award Reason / Reference
                  </label>
                  <input
                    type="text"
                    value={awardReason}
                    onChange={(e) => setAwardReason(e.target.value)}
                    placeholder="e.g. Lunch Check Settlement"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Live Point Calculation Breakdown */}
                {loyaltyConfig && (
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs font-mono">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                      Points Award Calculation
                    </div>
                    {(() => {
                      const multiplier = awardTargetCustomer.tier === 'PLATINUM' ? 2.0 : awardTargetCustomer.tier === 'GOLD' ? 1.5 : awardTargetCustomer.tier === 'SILVER' ? 1.25 : 1.0;
                      const basePts = Math.floor(awardBillAmount * loyaltyConfig.points_per_rupee);
                      const tierPts = Math.floor(basePts * multiplier);
                      const totalPts = tierPts + awardBonusPoints;
                      return (
                        <>
                          <div className="flex justify-between text-slate-400">
                            <span>Base Points (2% of ₹{awardBillAmount}):</span>
                            <span>{basePts} pts</span>
                          </div>
                          <div className="flex justify-between text-amber-300">
                            <span>{awardTargetCustomer.tier} Tier Multiplier ({multiplier}x):</span>
                            <span>{tierPts} pts</span>
                          </div>
                          {awardBonusPoints > 0 && (
                            <div className="flex justify-between text-emerald-400">
                              <span>Special Bonus Points:</span>
                              <span>+{awardBonusPoints} pts</span>
                            </div>
                          )}
                          <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-white text-sm">
                            <span>Total Points to Award:</span>
                            <span className="text-amber-400">+{totalPts} pts</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                <button
                  onClick={handleAwardPointsSubmit}
                  disabled={isAwarding || awardBillAmount <= 0}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isAwarding ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Recording Points & Updating Ledger...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Confirm & Award Loyalty Points</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* REDEEM POINTS MODAL                                       */}
      {/* ========================================================= */}
      {showRedeemModal && redeemTargetCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Gift className="w-5 h-5 text-indigo-400" />
                  Redeem Loyalty Points
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Guest: <span className="text-amber-300 font-bold">{redeemTargetCustomer.name}</span> (Available: {redeemTargetCustomer.loyalty_points} pts)
                </p>
              </div>
              <button
                onClick={() => setShowRedeemModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {redeemSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold">
                {redeemSuccessMsg}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Points to Redeem
                  </label>
                  <input
                    type="number"
                    value={redeemPointsAmount}
                    onChange={(e) => setRedeemPointsAmount(Number(e.target.value))}
                    min={100}
                    max={redeemTargetCustomer.loyalty_points}
                    step={50}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Minimum threshold: 100 points
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Instant Food Bill Discount</span>
                    <div className="text-xl font-black text-emerald-400 font-mono">
                      ₹{redeemPointsAmount.toLocaleString('en-IN')} off
                    </div>
                  </div>
                  <div className="text-right text-xs font-mono text-slate-400">
                    Remaining: {Math.max(0, redeemTargetCustomer.loyalty_points - redeemPointsAmount)} pts
                  </div>
                </div>

                <button
                  onClick={handleRedeemPointsSubmit}
                  disabled={isRedeeming || redeemPointsAmount > redeemTargetCustomer.loyalty_points || redeemPointsAmount < 100}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isRedeeming ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing Redemption...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Apply ₹{redeemPointsAmount} Bill Cashback</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* LOYALTY PROGRAM RULES CONFIG MODAL                         */}
      {/* ========================================================= */}
      {showConfigModal && loyaltyConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  Loyalty Program Rules & Multipliers
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure point accrual velocity, redemption rates, and tier milestones
                </p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Accrual Rate (pts per ₹100 spend)
                  </label>
                  <input
                    type="number"
                    value={Math.round((configForm.points_per_rupee || 0.02) * 100)}
                    onChange={(e) => setConfigForm(prev => ({
                      ...prev,
                      points_per_rupee: Number(e.target.value) / 100
                    }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500">Default: 2 pts / ₹100 (2% value)</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Welcome Bonus Points
                  </label>
                  <input
                    type="number"
                    value={configForm.welcome_points || 50}
                    onChange={(e) => setConfigForm(prev => ({
                      ...prev,
                      welcome_points: Number(e.target.value)
                    }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500">Awarded on guest registration</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Min Points to Redeem
                  </label>
                  <input
                    type="number"
                    value={configForm.min_points_to_redeem || 100}
                    onChange={(e) => setConfigForm(prev => ({
                      ...prev,
                      min_points_to_redeem: Number(e.target.value)
                    }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Redemption Rate (₹ per point)
                  </label>
                  <input
                    type="number"
                    value={configForm.rupee_per_point_redemption || 1.0}
                    onChange={(e) => setConfigForm(prev => ({
                      ...prev,
                      rupee_per_point_redemption: Number(e.target.value)
                    }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Tier Multipliers */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-amber-300">
                  Tier Point Multipliers
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Bronze</span>
                    <input
                      type="number"
                      step={0.1}
                      value={configForm.tier_multipliers?.bronze || 1.0}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        tier_multipliers: {
                          bronze: Number(e.target.value),
                          silver: prev.tier_multipliers?.silver || 1.25,
                          gold: prev.tier_multipliers?.gold || 1.5,
                          platinum: prev.tier_multipliers?.platinum || 2.0,
                        }
                      }))}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-300 block">Silver</span>
                    <input
                      type="number"
                      step={0.05}
                      value={configForm.tier_multipliers?.silver || 1.25}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        tier_multipliers: {
                          bronze: prev.tier_multipliers?.bronze || 1.0,
                          silver: Number(e.target.value),
                          gold: prev.tier_multipliers?.gold || 1.5,
                          platinum: prev.tier_multipliers?.platinum || 2.0,
                        }
                      }))}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-amber-400 block">Gold</span>
                    <input
                      type="number"
                      step={0.1}
                      value={configForm.tier_multipliers?.gold || 1.5}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        tier_multipliers: {
                          bronze: prev.tier_multipliers?.bronze || 1.0,
                          silver: prev.tier_multipliers?.silver || 1.25,
                          gold: Number(e.target.value),
                          platinum: prev.tier_multipliers?.platinum || 2.0,
                        }
                      }))}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-cyan-400 block">Platinum</span>
                    <input
                      type="number"
                      step={0.1}
                      value={configForm.tier_multipliers?.platinum || 2.0}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        tier_multipliers: {
                          bronze: prev.tier_multipliers?.bronze || 1.0,
                          silver: prev.tier_multipliers?.silver || 1.25,
                          gold: prev.tier_multipliers?.gold || 1.5,
                          platinum: Number(e.target.value),
                        }
                      }))}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={isSavingConfig}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSavingConfig ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Rules...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Loyalty Program Rules</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* REGISTER NEW GUEST MODAL                                  */}
      {/* ========================================================= */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Register VIP Loyalty Member
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automatically grants +50 welcome bonus points & welcome voucher
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Shalini Singhal"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="shalini@gmail.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Dining Preference
                </label>
                <select
                  value={newCustDiet}
                  onChange={(e) => setNewCustDiet(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Cuisines</option>
                  <option value="NON_VEGETARIAN">Non-Vegetarian</option>
                  <option value="VEGETARIAN">Vegetarian</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Favorite Dish / Specialty
                </label>
                <input
                  type="text"
                  value={newCustFavorites}
                  onChange={(e) => setNewCustFavorites(e.target.value)}
                  placeholder="Purani Dilli Butter Chicken, Garlic Naan"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  VIP Directives & Notes
                </label>
                <textarea
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleRegisterCustomerSubmit}
                disabled={isRegistering || !newCustName || !newCustPhone}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isRegistering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Registering & Crediting Points...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Register Member (+50 Welcome Points)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Mini icon component helper
const UtensilsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
    <path d="M15 2v20" />
    <path d="M5 2v20" />
    <path d="M2 2v4a3 3 0 0 0 3 3 3 3 0 0 0 3-3V2" />
  </svg>
);
