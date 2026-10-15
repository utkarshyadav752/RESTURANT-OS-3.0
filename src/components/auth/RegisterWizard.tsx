import React, { useState } from 'react';
import { 
  Building2, ArrowRight, ArrowLeft, CheckCircle2, 
  MapPin, Clock, Users, Utensils, Sparkles, Shield,
  Phone, Mail, Lock, UploadCloud, FileSpreadsheet, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext.tsx';

interface Props {
  onNavigateLogin: () => void;
  onComplete: () => void;
}

export const RegisterWizard: React.FC<Props> = ({ onNavigateLogin, onComplete }) => {
  const { register, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Account
    fullName: 'Rajesh Mehra',
    email: 'rajesh.mehra@zafranbistro.in',
    mobile: '+91 98100 11223',
    password: 'Owner@123',
    confirmPassword: 'Owner@123',

    // Step 2: Restaurant
    restaurantName: 'Zafran Gourmet Bistro',
    restaurantType: 'Bar & Restaurant',
    country: 'India',
    state: 'Delhi NCR',
    city: 'Gurgaon',
    address: 'DLF CyberCity Phase 2, Cyber Hub Floor 2',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    gstin: '07AABCT2345A1Z5',
    cgstRate: 2.5,
    sgstRate: 2.5,
    serviceChargeRate: 5.0,
    businessPhone: '+91 98110 44220',
    businessEmail: 'operations@zafranbistro.in',

    // Step 3: First Branch
    branchName: 'Cyber Hub Flagship',
    branchAddress: 'Shop 204-206, Cyber Hub, DLF CyberCity, Gurgaon',
    branchContact: '+91 98110 44221',
    openingHours: '12:00 PM - 12:30 AM',
    tablesCount: 18,
    seatingCapacity: 84,

    // Step 4: Initial Menu Choice
    menuSetupType: 'DEMO', // 'DEMO' | 'UPLOAD' | 'MANUAL' | 'CSV'
  });

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const steps = [
    { number: 1, title: 'Account', subtitle: 'Owner credentials' },
    { number: 2, title: 'Restaurant', subtitle: 'Brand & Tax GST' },
    { number: 3, title: 'Branch', subtitle: 'First outlet & tables' },
    { number: 4, title: 'Menu', subtitle: 'Recipes & setup' },
  ];

  const handleNext = () => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (!formData.fullName || !formData.email || !formData.password) {
        setErrorMessage('Please fill in your name, email, and password.');
        return;
      }
      if (formData.password.length < 8) {
        setErrorMessage('Password must be at least 8 characters.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.restaurantName || !formData.city) {
        setErrorMessage('Please provide restaurant name and city.');
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.branchName) {
        setErrorMessage('Please provide the branch name.');
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    try {
      await register(formData);
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore in tests
      }
      onComplete();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete registration.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden py-8 px-4 sm:px-6">
      <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">RestaurantOS</h1>
            <p className="text-xs text-slate-400">Multi-tenant Workspace Onboarding</p>
          </div>
        </div>

        <button
          onClick={onNavigateLogin}
          className="text-xs text-slate-400 hover:text-amber-400 transition-colors font-medium flex items-center gap-1 cursor-pointer"
        >
          Already registered? Sign In →
        </button>
      </header>

      {/* Main Registration Card */}
      <main className="max-w-4xl mx-auto w-full flex-1">
        {/* Progress Bar / Indicator */}
        <div className="p-4 rounded-2xl glass-panel border border-slate-800/80 mb-6">
          <div className="grid grid-cols-4 gap-2">
            {steps.map((s) => {
              const isDone = currentStep > s.number;
              const isCurrent = currentStep === s.number;
              return (
                <div key={s.number} className="flex flex-col items-center text-center">
                  <div className="flex items-center w-full mb-2">
                    <div className={`h-1 w-full rounded-full transition-all ${
                      isDone ? 'bg-emerald-500' : isCurrent ? 'bg-amber-500' : 'bg-slate-800'
                    }`} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isDone 
                        ? 'bg-emerald-500 text-slate-950' 
                        : isCurrent 
                        ? 'bg-amber-500 text-slate-950' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : s.number}
                    </span>
                    <span className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                      {s.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 hidden sm:block mt-0.5">{s.subtitle}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Form Container */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-700/60 shadow-2xl">
          {errorMessage && (
            <div className="p-3 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* STEP 1: Account */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Create Restaurant Owner Account</h2>
                <p className="text-xs text-slate-400 mt-1">
                  You will have super-administrative privileges to manage all branches, staff roles, and AI models.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="Rajesh Mehra"
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Work Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="owner@zafranbistro.in"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mobile Number (SMS Alerts / OTP) *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => updateField('mobile', e.target.value)}
                      placeholder="+91 98100 11223"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Role Assigned
                  </label>
                  <div className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-amber-400 font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Restaurant Owner (Tenant Root)
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Create Password (min. 8 chars) *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Restaurant Profile & Tax/GST */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Restaurant Entity & Tax Configuration</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure business legal details, GST/VAT rates, and billing currency.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Restaurant Brand Name *
                  </label>
                  <input
                    type="text"
                    value={formData.restaurantName}
                    onChange={(e) => updateField('restaurantName', e.target.value)}
                    placeholder="Zafran Gourmet Bistro"
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Restaurant Type
                  </label>
                  <select
                    value={formData.restaurantType}
                    onChange={(e) => updateField('restaurantType', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Restaurant">Restaurant (Fine Dining)</option>
                    <option value="Cafe">Cafe & Bistro</option>
                    <option value="Bakery">Bakery & Patisserie</option>
                    <option value="Cloud Kitchen">Cloud Kitchen / Delivery Only</option>
                    <option value="QSR">QSR / Fast Casual</option>
                    <option value="Bar & Restaurant">Bar & Restaurant</option>
                    <option value="Food Court">Food Court Kiosk</option>
                    <option value="Other">Other Hospitality</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    GSTIN / Tax ID Number
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => updateField('gstin', e.target.value.toUpperCase())}
                    placeholder="07AABCT2345A1Z5"
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      CGST Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.cgstRate}
                      onChange={(e) => updateField('cgstRate', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      SGST Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.sgstRate}
                      onChange={(e) => updateField('sgstRate', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Currency & Symbol
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => updateField('currency', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="INR">Indian Rupee (INR - ₹)</option>
                    <option value="USD">US Dollar (USD - $)</option>
                    <option value="AED">UAE Dirham (AED)</option>
                    <option value="EUR">Euro (EUR - €)</option>
                    <option value="GBP">British Pound (GBP - £)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Service Charge (Optional %)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.serviceChargeRate}
                    onChange={(e) => updateField('serviceChargeRate', e.target.value)}
                    placeholder="5.0"
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Registered Operating Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="DLF CyberCity Phase 2, Cyber Hub Floor 2, Gurgaon, Haryana"
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: First Branch */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Setup Your First Branch / Outlet</h2>
                <p className="text-xs text-slate-400 mt-1">
                  You can add more branches later. Each branch maintains separate inventory, tables, and staff shifts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    value={formData.branchName}
                    onChange={(e) => updateField('branchName', e.target.value)}
                    placeholder="Cyber Hub Flagship"
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Branch Contact Phone
                  </label>
                  <input
                    type="text"
                    value={formData.branchContact}
                    onChange={(e) => updateField('branchContact', e.target.value)}
                    placeholder="+91 98110 44221"
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={formData.openingHours}
                    onChange={(e) => updateField('openingHours', e.target.value)}
                    placeholder="12:00 PM - 12:30 AM"
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      No. of Tables
                    </label>
                    <input
                      type="number"
                      value={formData.tablesCount}
                      onChange={(e) => updateField('tablesCount', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Total Capacity
                    </label>
                    <input
                      type="number"
                      value={formData.seatingCapacity}
                      onChange={(e) => updateField('seatingCapacity', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Branch Physical Location
                  </label>
                  <input
                    type="text"
                    value={formData.branchAddress}
                    onChange={(e) => updateField('branchAddress', e.target.value)}
                    placeholder="Shop 204-206, Cyber Hub, DLF CyberCity, Gurgaon"
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Initial Menu Choice */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Initialize Menu, Recipes & Inventory</h2>
                <p className="text-xs text-slate-400 mt-1">
                  How would you like to seed your menu catalog and recipe BOM consumption engine?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateField('menuSetupType', 'DEMO')}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    formData.menuSetupType === 'DEMO'
                      ? 'border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-500/15'
                      : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                        <Sparkles className="w-5 h-5" />
                      </span>
                      {formData.menuSetupType === 'DEMO' && (
                        <CheckCircle2 className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white">Preload Gourmet Menu (Recommended)</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Includes 20+ dishes (Butter Chicken, Biryani, Naan, Cocktails), 40+ raw ingredients, and full recipe BOM ledger connections.
                    </p>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mt-3">
                    Fastest Evaluation
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateField('menuSetupType', 'MANUAL')}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    formData.menuSetupType === 'MANUAL'
                      ? 'border-amber-500 bg-amber-500/15'
                      : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                        <Utensils className="w-5 h-5" />
                      </span>
                      {formData.menuSetupType === 'MANUAL' && (
                        <CheckCircle2 className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white">Build Menu From Scratch</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Start with a clean slate. You will enter categories, dishes, ingredients, and recipes manually in the dashboard.
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-3">
                    Custom Catalog
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateField('menuSetupType', 'UPLOAD')}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    formData.menuSetupType === 'UPLOAD'
                      ? 'border-amber-500 bg-amber-500/15'
                      : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                        <UploadCloud className="w-5 h-5" />
                      </span>
                      {formData.menuSetupType === 'UPLOAD' && (
                        <CheckCircle2 className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white">Upload Existing Menu PDF/Image</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      AI OCR extracts dishes, prices, and categories automatically.
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-3">
                    AI Auto-Parse
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateField('menuSetupType', 'CSV')}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    formData.menuSetupType === 'CSV'
                      ? 'border-amber-500 bg-amber-500/15'
                      : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                        <FileSpreadsheet className="w-5 h-5" />
                      </span>
                      {formData.menuSetupType === 'CSV' && (
                        <CheckCircle2 className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white">Import from CSV / Excel</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Upload standard restaurant spreadsheet with SKU, Name, Price, Tax, and Cost.
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-3">
                    Bulk Import
                  </span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <span className="font-semibold text-amber-400">What happens next:</span> Your isolated tenant workspace will be generated with active tables for <strong>{formData.branchName}</strong>, initial inventory ledger balances, and owner access credentials.
              </div>
            </div>
          )}

          {/* Action Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous Step
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                Continue to {steps[currentStep].title}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="py-2.5 px-6 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs tracking-wide uppercase transition-all shadow-lg shadow-amber-500/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Creating Workspace...' : 'Launch Restaurant Workspace'}
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-slate-500 mt-6">
        Protected by RestaurantOS RBAC Multi-Tenant Kernel. All tenant operations are isolated at the database layer.
      </footer>
    </div>
  );
};
