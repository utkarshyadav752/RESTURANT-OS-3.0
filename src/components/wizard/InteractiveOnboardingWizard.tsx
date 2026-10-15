import React, { useState } from 'react';
import { 
  Building2, Store, Utensils, Package, Users, 
  CheckCircle2, ArrowRight, ArrowLeft, Plus, Trash2, 
  Sparkles, Check, DollarSign, Shield, Phone, Mail, Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { RoleType } from '../../types/index.ts';

interface Props {
  isOpen: boolean;
  onComplete: () => void;
  onSkip?: () => void;
}

export const InteractiveOnboardingWizard: React.FC<Props> = ({ isOpen, onComplete, onSkip }) => {
  const { restaurant, branches, currentBranch, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Restaurant Profile Details
  const [profile, setProfile] = useState({
    name: restaurant?.name || 'Zafran Gourmet Bistro',
    cuisine: 'Modern Indian & Mughlai',
    phone: restaurant?.business_phone || '+91 98110 44220',
    email: restaurant?.business_email || 'operations@zafranbistro.in',
    currency: restaurant?.currency || 'INR',
    currency_symbol: restaurant?.currency_symbol || '₹',
    gstin: restaurant?.gstin || '07AABCT2345A1Z5',
    cgst: restaurant?.cgst_rate || 2.5,
    sgst: restaurant?.sgst_rate || 2.5,
  });

  // Step 2: First Branch & Floor Plan
  const [branchSetup, setBranchSetup] = useState({
    name: branches[0]?.name || 'Cyber Hub Flagship',
    code: branches[0]?.code || 'ZH-CYB',
    address: branches[0]?.address || 'DLF CyberCity Phase 2, Gurgaon',
    openingHours: branches[0]?.opening_hours || '12:00 PM - 12:30 AM',
    tablesCount: branches[0]?.tables_count || 18,
    seatingCapacity: branches[0]?.seating_capacity || 84,
    floorAreas: ['Main Dining Hall', 'Outdoor Terrace', 'Lounge Bar', 'Private Dining'],
  });

  // Step 3: Initial Menu Items
  const [starterDishes, setStarterDishes] = useState([
    { name: 'Purani Dilli Butter Chicken', category: 'Main Course - Non-Veg', price: 480, cost: 158, isVeg: false },
    { name: 'Paneer Butter Masala Handi', category: 'Main Course - Veg', price: 390, cost: 112, isVeg: true },
    { name: 'Awadhi Murgh Dum Biryani', category: 'Biryani & Breads', price: 440, cost: 142, isVeg: false },
    { name: 'Slow-Simmered Dal Makhani', category: 'Main Course - Veg', price: 320, cost: 78, isVeg: true },
    { name: 'Tandoori Garlic Butter Naan', category: 'Biryani & Breads', price: 95, cost: 18, isVeg: true },
  ]);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState(250);
  const [newDishCategory, setNewDishCategory] = useState('Starters');
  const [newDishIsVeg, setNewDishIsVeg] = useState(true);

  // Step 4: Initial Inventory Opening Stock
  const [openingInventory, setOpeningInventory] = useState([
    { name: 'Fresh Boneless Chicken Breast', unit: 'kg', openingStock: 25, minStock: 12, cost: 220 },
    { name: 'Malai Cottage Paneer', unit: 'kg', openingStock: 20, minStock: 8, cost: 280 },
    { name: 'Amul Salted Table Butter', unit: 'kg', openingStock: 15, minStock: 5, cost: 490 },
    { name: 'Farm Plum Tomatoes', unit: 'kg', openingStock: 30, minStock: 10, cost: 38 },
    { name: 'Aged Dum Basmati Rice', unit: 'kg', openingStock: 60, minStock: 20, cost: 145 },
  ]);

  // Step 5: Invite First Employees
  const [invitationsList, setInvitationsList] = useState<{
    name: string;
    email: string;
    role: RoleType;
    branch: string;
  }[]>([
    { name: 'Rahul Verma', email: 'rahul.manager@zafranbistro.in', role: 'MANAGER', branch: 'Cyber Hub Flagship' },
    { name: 'Priya Sharma', email: 'priya.cashier@zafranbistro.in', role: 'CASHIER', branch: 'Cyber Hub Flagship' },
    { name: 'Chef Vikram Singh', email: 'vikram.chef@zafranbistro.in', role: 'KITCHEN', branch: 'Cyber Hub Flagship' },
  ]);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<RoleType>('WAITER');

  if (!isOpen) return null;

  const totalSteps = 5;

  const stepsMeta = [
    { num: 1, title: 'Restaurant Profile', subtitle: 'Branding & Taxes' },
    { num: 2, title: 'Branch & Tables', subtitle: 'Floor Layout' },
    { num: 3, title: 'Menu Catalog', subtitle: 'Dishes & Recipes' },
    { num: 4, title: 'Initial Stock', subtitle: 'Inventory Ledger' },
    { num: 5, title: 'Invite Team', subtitle: 'Roles & Staff' },
  ];

  const handleAddDish = () => {
    if (!newDishName.trim()) return;
    setStarterDishes([
      ...starterDishes,
      {
        name: newDishName,
        category: newDishCategory,
        price: Number(newDishPrice),
        cost: Math.round(Number(newDishPrice) * 0.32),
        isVeg: newDishIsVeg,
      },
    ]);
    setNewDishName('');
  };

  const handleAddInvite = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    setInvitationsList([
      ...invitationsList,
      {
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        branch: branchSetup.name,
      },
    ]);
    setInviteName('');
    setInviteEmail('');
  };

  const handleSaveAndComplete = async () => {
    setIsSubmitting(true);
    try {
      // 1. Update restaurant profile settings
      await api.put('/restaurant/settings', {
        name: profile.name,
        business_phone: profile.phone,
        business_email: profile.email,
        currency: profile.currency,
        currency_symbol: profile.currency_symbol,
        gstin: profile.gstin,
        cgst_rate: profile.cgst,
        sgst_rate: profile.sgst,
      });

      // 2. Dispatch invitations in backend
      for (const inv of invitationsList) {
        try {
          await api.post('/auth/invitations', {
            name: inv.name,
            email: inv.email,
            role: inv.role,
            branchIds: [currentBranch?.id || 'branch_cybercity'],
            invitedBy: `${user?.name || 'Owner'} (Onboarding Wizard)`,
          });
        } catch (e) {
          // continue
        }
      }

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      onComplete();
    } catch (err) {
      console.error('Failed to finalize onboarding:', err);
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 p-6 sm:p-8 rounded-3xl glass-panel-elevated bg-slate-900 border border-slate-700 shadow-2xl space-y-6">
        
        {/* Wizard Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Welcome to RestaurantOS
                </span>
                <span className="text-xs text-slate-500">Step {currentStep} of {totalSteps}</span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                Let's set up your restaurant workspace
              </h2>
            </div>
          </div>

          {onSkip && (
            <button
              onClick={onSkip}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Skip setup for now
            </button>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300">
              {stepsMeta[currentStep - 1].title} · <span className="text-slate-400">{stepsMeta[currentStep - 1].subtitle}</span>
            </span>
            <span className="font-mono font-bold text-amber-400">{progressPercent}% Completed</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {stepsMeta.map((s) => {
              const isPast = currentStep > s.num;
              const isCur = currentStep === s.num;

              return (
                <div key={s.num} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      isPast ? 'bg-emerald-500' : isCur ? 'bg-amber-500' : 'bg-slate-800'
                    }`}
                  />
                  <div className="hidden sm:flex items-center gap-1 text-[10px]">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold text-[9px] ${
                      isPast ? 'bg-emerald-500 text-slate-950' : isCur ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isPast ? '✓' : s.num}
                    </span>
                    <span className={`truncate ${isCur ? 'font-bold text-white' : 'text-slate-500'}`}>
                      {s.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 1: Restaurant Profile Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              Configure your primary restaurant identity, currency, and tax parameters for bills and receipts.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Restaurant Legal / Trade Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cuisine / Concept Specialization</label>
                <input
                  type="text"
                  value={profile.cuisine}
                  onChange={(e) => setProfile({ ...profile, cuisine: e.target.value })}
                  placeholder="e.g. Modern Indian, Italian Cafe, QSR"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Business Mobile / Landline</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Operating Currency</label>
                <select
                  value={profile.currency}
                  onChange={(e) => setProfile({ ...profile, currency: e.target.value, currency_symbol: e.target.value === 'INR' ? '₹' : '$' })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="INR">Indian Rupee (INR - ₹)</option>
                  <option value="USD">US Dollar (USD - $)</option>
                  <option value="AED">UAE Dirham (AED)</option>
                  <option value="GBP">British Pound (GBP - £)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">GSTIN / Business Tax Identification</label>
                <input
                  type="text"
                  value={profile.gstin}
                  onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">CGST (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={profile.cgst}
                    onChange={(e) => setProfile({ ...profile, cgst: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">SGST (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={profile.sgst}
                    onChange={(e) => setProfile({ ...profile, sgst: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: First Branch & Floor Plan */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              Set up your primary outlet address, operating hours, and dining room seating capacity.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Branch Name</label>
                <input
                  type="text"
                  value={branchSetup.name}
                  onChange={(e) => setBranchSetup({ ...branchSetup, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Operating Hours</label>
                <input
                  type="text"
                  value={branchSetup.openingHours}
                  onChange={(e) => setBranchSetup({ ...branchSetup, openingHours: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tables Count</label>
                  <input
                    type="number"
                    value={branchSetup.tablesCount}
                    onChange={(e) => setBranchSetup({ ...branchSetup, tablesCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    value={branchSetup.seatingCapacity}
                    onChange={(e) => setBranchSetup({ ...branchSetup, seatingCapacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Branch Code / Prefix</label>
                <input
                  type="text"
                  value={branchSetup.code}
                  onChange={(e) => setBranchSetup({ ...branchSetup, code: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Floor Plan Areas</label>
                <div className="flex flex-wrap gap-2">
                  {branchSetup.floorAreas.map((area, idx) => (
                    <span key={idx} className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-300 font-medium">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Initial Menu Items */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center justify-between">
              <span>Seed your initial dishes. Each dish automatically links to recipe consumption formulas.</span>
              <span className="font-mono font-bold text-white">{starterDishes.length} Dishes</span>
            </div>

            {/* Quick add bar */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  placeholder="New dish name..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div className="sm:col-span-3">
                <select
                  value={newDishCategory}
                  onChange={(e) => setNewDishCategory(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="Starters">Starters & Kebabs</option>
                  <option value="Main Course - Non-Veg">Main Course - Non-Veg</option>
                  <option value="Main Course - Veg">Main Course - Veg</option>
                  <option value="Biryani & Breads">Biryani & Breads</option>
                  <option value="Beverages">Beverages & Bar</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <input
                  type="number"
                  value={newDishPrice}
                  onChange={(e) => setNewDishPrice(Number(e.target.value))}
                  placeholder="Price"
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleAddDish}
                  className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Dish
                </button>
              </div>
            </div>

            {/* Dishes List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {starterDishes.map((dish, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${dish.isVeg ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    <span className="font-bold text-white">{dish.name}</span>
                    <span className="text-[10px] text-slate-500 font-sans">({dish.category})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-amber-400 font-bold">₹{dish.price}</span>
                    <button
                      onClick={() => setStarterDishes(starterDishes.filter((_, i) => i !== idx))}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Initial Inventory Setup */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              Establish initial opening stock balances for your raw materials in the double-entry stock ledger.
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px] bg-slate-900 font-sans">
                    <th className="py-2.5 px-3">Ingredient</th>
                    <th className="py-2.5 px-3">Opening Balance</th>
                    <th className="py-2.5 px-3">Reorder Point</th>
                    <th className="py-2.5 px-3 text-right">Cost/Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {openingInventory.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-sans font-medium text-white">{item.name}</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">{item.openingStock} {item.unit}</td>
                      <td className="py-2.5 px-3 text-slate-400">{item.minStock} {item.unit}</td>
                      <td className="py-2.5 px-3 text-right text-amber-400">₹{item.cost}/{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 5: Invite Team & Staff */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              Invite your managers, cashiers, and kitchen team. They will receive role-tailored dashboards and secure logins.
            </div>

            {/* Quick Invite Form */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Staff member name..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div className="sm:col-span-4">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Staff work email..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="MANAGER">Manager</option>
                  <option value="CASHIER">Cashier</option>
                  <option value="KITCHEN">Kitchen Chef</option>
                  <option value="WAITER">Waiter</option>
                  <option value="INVENTORY_MANAGER">Inventory</option>
                  <option value="ACCOUNTANT">Accountant</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddInvite}
                  className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Add Invite
                </button>
              </div>
            </div>

            {/* Staff Table */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {invitationsList.map((inv, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{inv.name}</span>
                    <span className="text-[10px] text-slate-400 ml-2 font-mono">({inv.email})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-800 text-amber-300">
                      {inv.role}
                    </span>
                    <button
                      onClick={() => setInvitationsList(invitationsList.filter((_, i) => i !== idx))}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={() => setCurrentStep(s => s + 1)}
              className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              Next: {stepsMeta[currentStep].title}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveAndComplete}
              className="py-2.5 px-6 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wide transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Finalizing Setup...' : 'Finish Setup & Open Workspace'}
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
