import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FlaskConical, AlertTriangle, Scale, Plus, 
  ArrowRight, ShieldCheck, TrendingDown, TrendingUp, DollarSign,
  QrCode, Sparkles, RefreshCw, Zap, Sliders, CheckCircle2,
  ChevronRight, Edit3, X, HelpCircle, ArrowUpRight, Percent,
  Info, Save, Layers, Package, Clock, ShoppingCart, Activity
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { 
  Recipe, RecipeDriftSignal, RealtimeRecipeCosting, 
  RealtimeIngredientCost, InventoryItem, StockLedgerEntry 
} from '../../types/index.ts';
import { QRMenuGenerator } from '../menu/QRMenuGenerator.tsx';

export const RecipeBOMView: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [driftSignals, setDriftSignals] = useState<RecipeDriftSignal[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stockLedger, setStockLedger] = useState<StockLedgerEntry[]>([]);
  const [realtimeCostings, setRealtimeCostings] = useState<RealtimeRecipeCosting[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeView, setActiveView] = useState<'RECIPES' | 'QR_GENERATOR'>('RECIPES');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Signature Feature: Real-time Costing Toggle
  const [isRealtimeCostingActive, setIsRealtimeCostingActive] = useState<boolean>(true);
  const [activeMarketScenario, setActiveMarketScenario] = useState<'LIVE' | 'VEG_SURGE' | 'POULTRY_SPIKE' | 'DAIRY_SPIKE' | 'BASELINE'>('LIVE');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Quick Ingredient Market Price Edit Modal
  const [editingIngredient, setEditingIngredient] = useState<RealtimeIngredientCost | null>(null);
  const [editPriceInput, setEditPriceInput] = useState<string>('');
  const [editReasonInput, setEditReasonInput] = useState<string>('');
  const [isSavingPrice, setIsSavingPrice] = useState<boolean>(false);

  // Sync Standard BOM Modal
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [isSyncingBOM, setIsSyncingBOM] = useState<boolean>(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);

  // Fetch recipe data and live costing
  const loadRecipeData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/recipes');
      setRecipes(res.recipes || []);
      setDriftSignals(res.driftSignals || []);
      setInventoryItems(res.inventoryItems || []);
      setStockLedger(res.stockLedger || []);
      setRealtimeCostings(res.realtimeCosting || []);
      if (res.recipes && res.recipes.length > 0 && !selectedRecipe) {
        setSelectedRecipe(res.recipes[0]);
      }
    } catch (err) {
      console.error('Error fetching recipes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRecipe]);

  useEffect(() => {
    loadRecipeData();
  }, [loadRecipeData]);

  // Lookup map for fast realtime costing access by recipe_id
  const costingMap = useMemo(() => {
    const map = new Map<string, RealtimeRecipeCosting>();
    realtimeCostings.forEach(c => map.set(c.recipe_id, c));
    return map;
  }, [realtimeCostings]);

  // Current selected recipe's live costing data
  const currentCosting = useMemo(() => {
    if (!selectedRecipe) return null;
    return costingMap.get(selectedRecipe.id) || null;
  }, [selectedRecipe, costingMap]);

  // Portfolio-wide live statistics when Real-time Costing is active
  const portfolioStats = useMemo(() => {
    if (!realtimeCostings.length) return null;

    let totalStdCost = 0;
    let totalLiveCost = 0;
    let totalSellingPrice = 0;
    let maxCostSpikeItem = '';
    let maxCostSpikePct = 0;

    realtimeCostings.forEach(r => {
      totalStdCost += r.standard_plate_cost;
      totalLiveCost += r.live_plate_cost;
      totalSellingPrice += r.menu_selling_price;

      r.ingredients.forEach(ing => {
        if (ing.cost_delta_percentage > maxCostSpikePct) {
          maxCostSpikePct = ing.cost_delta_percentage;
          maxCostSpikeItem = ing.ingredient_name;
        }
      });
    });

    const avgVariance = totalStdCost > 0 ? ((totalLiveCost - totalStdCost) / totalStdCost) * 100 : 0;
    const stdFoodCostPct = totalSellingPrice > 0 ? (totalStdCost / totalSellingPrice) * 100 : 0;
    const liveFoodCostPct = totalSellingPrice > 0 ? (totalLiveCost / totalSellingPrice) * 100 : 0;

    return {
      avgVariance,
      stdFoodCostPct,
      liveFoodCostPct,
      maxCostSpikeItem,
      maxCostSpikePct,
      totalDishesCount: realtimeCostings.length,
      linkedIngredientsCount: inventoryItems.length,
    };
  }, [realtimeCostings, inventoryItems]);

  // Handler: apply market scenario
  const handleApplyScenario = async (scenario: 'LIVE' | 'VEG_SURGE' | 'POULTRY_SPIKE' | 'DAIRY_SPIKE' | 'BASELINE') => {
    try {
      setIsSimulating(true);
      setActiveMarketScenario(scenario);
      const res = await api.post('/recipes/simulate-market-scenario', { scenario });
      if (res.realtimeCosting) {
        setRealtimeCostings(res.realtimeCosting);
      }
    } catch (err) {
      console.error('Error applying market scenario:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Handler: save updated ingredient market price in ledger
  const handleSaveMarketPrice = async () => {
    if (!editingIngredient || !editPriceInput) return;
    const priceNum = parseFloat(editPriceInput);
    if (isNaN(priceNum) || priceNum <= 0) return;

    try {
      setIsSavingPrice(true);
      const res = await api.post('/recipes/update-market-price', {
        ingredientId: editingIngredient.ingredient_id,
        newCostPerUnit: priceNum,
        reason: editReasonInput || 'Mandi Spot Purchase Ledger Update',
        updatedBy: 'Chef Vikram Singh (Executive Chef)',
      });

      if (res.realtimeCosting) {
        setRealtimeCostings(res.realtimeCosting);
      }
      setEditingIngredient(null);
      setEditPriceInput('');
      setEditReasonInput('');
      setSyncSuccessToast(`Market price for ${editingIngredient.ingredient_name} updated to ₹${priceNum}/${editingIngredient.unit} in Inventory Ledger!`);
      setTimeout(() => setSyncSuccessToast(null), 4000);
    } catch (err) {
      console.error('Error updating market price:', err);
    } finally {
      setIsSavingPrice(false);
    }
  };

  // Handler: sync recipe standard BOM with current live market price
  const handleSyncStandardBOM = async () => {
    if (!selectedRecipe) return;

    try {
      setIsSyncingBOM(true);
      const res = await api.post('/recipes/sync-standard-bom', {
        recipeId: selectedRecipe.id,
        syncedBy: 'Executive Chef Vikram',
      });

      if (res.recipe) {
        setRecipes(prev => prev.map(r => r.id === res.recipe.id ? res.recipe : r));
        setSelectedRecipe(res.recipe);
      }
      if (res.realtimeCosting) {
        setRealtimeCostings(prev => prev.map(c => c.recipe_id === res.realtimeCosting.recipe_id ? res.realtimeCosting : c));
      }
      setShowSyncModal(false);
      setSyncSuccessToast(`Standard BOM for "${selectedRecipe.menu_item_name}" has been permanently synchronized to live market rates (₹${res.recipe?.cost_per_serving}/plate).`);
      setTimeout(() => setSyncSuccessToast(null), 4500);
    } catch (err) {
      console.error('Error syncing standard BOM:', err);
    } finally {
      setIsSyncingBOM(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Toast Notification */}
      {syncSuccessToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 shadow-2xl backdrop-blur-md animate-fade-in text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncSuccessToast}</span>
          <button 
            onClick={() => setSyncSuccessToast(null)} 
            className="text-emerald-400 hover:text-emerald-200 ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & View Switcher */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-amber-400" />
              Recipe Engine & Bill of Materials (BOM)
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Automated Inventory Deduction
            </span>
            {isRealtimeCostingActive && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm shadow-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Market Costing
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Connect menu dishes to raw ingredient deductions, spot portioning drift, and recalculate plate costs dynamically from live inventory purchase ledgers
          </p>
        </div>

        {/* Action Controls: Real-time Costing Toggle & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* REAL-TIME COSTING TOGGLE SWITCH */}
          {activeView === 'RECIPES' && (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md">
              <div className="flex items-center gap-1.5 text-xs">
                <Zap className={`w-3.5 h-3.5 transition-colors ${isRealtimeCostingActive ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
                <span className="font-semibold text-slate-200">Real-time Costing</span>
              </div>

              {/* Intuitive Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isRealtimeCostingActive}
                onClick={() => setIsRealtimeCostingActive(!isRealtimeCostingActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  isRealtimeCostingActive ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span className="sr-only">Toggle Real-time Costing</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isRealtimeCostingActive ? 'translate-x-5 bg-slate-950 font-bold' : 'translate-x-0 bg-slate-300'
                  }`}
                />
              </button>

              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                isRealtimeCostingActive 
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {isRealtimeCostingActive ? 'ON' : 'OFF'}
              </span>
            </div>
          )}

          {/* Top Tab Switcher */}
          <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold trough-3d">
            <button
              onClick={() => setActiveView('RECIPES')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'RECIPES'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Recipe BOM & Live Cost</span>
            </button>

            <button
              onClick={() => setActiveView('QR_GENERATOR')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'QR_GENERATOR'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Customer QR Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: QR Menu Generator */}
      {activeView === 'QR_GENERATOR' && (
        <QRMenuGenerator recipes={recipes} />
      )}

      {/* VIEW 2: Recipe BOM Engine & Real-time Costing */}
      {activeView === 'RECIPES' && (
        <>
          {/* REAL-TIME COSTING STATUS & SCENARIO BAR (Appears when Real-time Costing is toggled ON) */}
          {isRealtimeCostingActive && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-emerald-500/10 border border-amber-500/30 shadow-lg space-y-3">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Activity className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Live Inventory Ledger Costing Active</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Synchronized with Azadpur Mandi & Supplier Inwards
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Dish food costs and gross margins dynamically update whenever raw ingredient purchase rates change in the stock ledger.
                    </p>
                  </div>
                </div>

                {/* Scenario Presets Pill Bar */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-[11px]">
                  <span className="text-slate-400 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-amber-400" />
                    Market Scenario:
                  </span>
                  
                  <button
                    onClick={() => handleApplyScenario('LIVE')}
                    disabled={isSimulating}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      activeMarketScenario === 'LIVE'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Actual Ledger Rates
                  </button>

                  <button
                    onClick={() => handleApplyScenario('VEG_SURGE')}
                    disabled={isSimulating}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      activeMarketScenario === 'VEG_SURGE'
                        ? 'bg-rose-500 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Veg Surge (+30%)
                  </button>

                  <button
                    onClick={() => handleApplyScenario('POULTRY_SPIKE')}
                    disabled={isSimulating}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      activeMarketScenario === 'POULTRY_SPIKE'
                        ? 'bg-rose-500 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Poultry (+18%)
                  </button>

                  <button
                    onClick={() => handleApplyScenario('DAIRY_SPIKE')}
                    disabled={isSimulating}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      activeMarketScenario === 'DAIRY_SPIKE'
                        ? 'bg-rose-500 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Dairy (+12%)
                  </button>

                  <button
                    onClick={() => handleApplyScenario('BASELINE')}
                    disabled={isSimulating}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      activeMarketScenario === 'BASELINE'
                        ? 'bg-slate-700 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Reset Baseline
                  </button>
                </div>
              </div>

              {/* Portfolio Metrics Grid */}
              {portfolioStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Average Basket Variance</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`font-mono font-bold text-sm ${
                        portfolioStats.avgVariance > 0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {portfolioStats.avgVariance > 0 ? '+' : ''}{portfolioStats.avgVariance.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">vs Standard BOM</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Live Food Cost %</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono font-bold text-sm text-white">
                        {portfolioStats.liveFoodCostPct.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        (Std: {portfolioStats.stdFoodCostPct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Top Cost Spike Ingredient</span>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <span className="font-medium text-white truncate text-[11px]">
                        {portfolioStats.maxCostSpikeItem || 'Tomatoes'}
                      </span>
                      <span className="font-mono text-rose-400 font-bold text-[11px] shrink-0">
                        +{portfolioStats.maxCostSpikePct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Ledger Sync Status</span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-emerald-400 font-medium text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{portfolioStats.linkedIngredientsCount} ingredients linked</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Signature Drift Alert Cards */}
          {driftSignals.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  AI Recipe Drift Signals (Actual vs Standard BOM Variance)
                </h3>
                <span className="text-[11px] text-slate-400">Identifies portion leakages & unmeasured servings</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {driftSignals.map((drift) => (
                  <div
                    key={drift.ingredient_id}
                    className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-amber-400" />
                          {drift.ingredient_name}
                        </span>
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          +{drift.drift_percentage}% Variance
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-950/80 rounded-xl text-xs font-mono mb-2">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase">Theoretical BOM</span>
                          <span className="text-slate-300 font-bold">{drift.expected_consumption} {drift.unit}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase">Actual Used</span>
                          <span className="text-rose-400 font-bold">{drift.actual_consumption} {drift.unit}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase">Cost Leakage</span>
                          <span className="text-amber-400 font-bold">₹{drift.financial_impact}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300">
                        <strong className="text-slate-200">Suspected Root Cause:</strong> {drift.suspected_cause}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Standardize Station Portioning</span>
                      <span className="text-emerald-400 font-bold">Recovers ~₹30,000 / month</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recipes Catalog & Ingredients Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Dish List */}
            <div className="lg:col-span-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Dishes with Connected Recipes ({recipes.length})
                </span>
                <span className="text-[10px] text-slate-500">
                  {isRealtimeCostingActive ? 'Showing Live Plate Cost' : 'Showing Standard Cost'}
                </span>
              </div>

              <div className="space-y-2 mt-1">
                {recipes.map(rec => {
                  const isSelected = selectedRecipe?.id === rec.id;
                  const live = costingMap.get(rec.id);
                  const displayCost = isRealtimeCostingActive && live ? live.live_plate_cost : rec.cost_per_serving;
                  const delta = live ? live.cost_delta : 0;
                  const deltaPct = live ? live.cost_delta_percentage : 0;
                  const hasSpike = delta > 0;

                  return (
                    <div
                      key={rec.id}
                      onClick={() => setSelectedRecipe(rec)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
                          : 'border-slate-800 bg-slate-900/70 hover:bg-slate-850'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">{rec.menu_item_name}</span>
                          {isRealtimeCostingActive && live && delta !== 0 && (
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                              hasSpike 
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {hasSpike ? `+₹${delta}` : `-₹${Math.abs(delta)}`}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>{rec.ingredients.length} raw ingredients</span>
                          <span>·</span>
                          <span>{rec.yield_servings} serving</span>
                          {isRealtimeCostingActive && live && (
                            <>
                              <span>·</span>
                              <span className="text-slate-300 font-mono">{live.live_food_cost_percentage}% Food Cost</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`text-xs font-mono font-bold flex items-center justify-end gap-1 ${
                          isRealtimeCostingActive && hasSpike 
                            ? 'text-amber-400' 
                            : isRealtimeCostingActive && delta < 0
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}>
                          {isRealtimeCostingActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                          )}
                          ₹{displayCost.toFixed(2)}
                        </div>

                        <div className="text-[9px] text-slate-500 font-mono">
                          {isRealtimeCostingActive && live ? (
                            <span className={hasSpike ? 'text-amber-400/90' : 'text-emerald-400/90'}>
                              Std: ₹{rec.cost_per_serving.toFixed(0)} ({hasSpike ? '+' : ''}{deltaPct.toFixed(1)}%)
                            </span>
                          ) : (
                            'Standard Cost'
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Ingredients Table & Real-time Costing Breakdown */}
            <div className="lg:col-span-8">
              {selectedRecipe ? (
                <div className="p-6 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-700 shadow-2xl space-y-4">
                  
                  {/* Dish Header & KPI Summary */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{selectedRecipe.menu_item_name}</h3>
                        {isRealtimeCostingActive && currentCosting && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
                            <Zap className="w-3 h-3 text-amber-400" />
                            Live Plate Costing Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Standard Yield: {selectedRecipe.yield_servings} portion(s) · Raw BOM ingredients: {selectedRecipe.ingredients.length}
                      </p>
                    </div>

                    {/* Quick Sync & Action Buttons */}
                    <div className="flex items-center gap-2">
                      {isRealtimeCostingActive && currentCosting && currentCosting.cost_delta !== 0 && (
                        <button
                          onClick={() => setShowSyncModal(true)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                          <span>Sync BOM to Market</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    
                    {/* Card 1: Plate Cost */}
                    <div className={`p-3 rounded-2xl border transition-all ${
                      isRealtimeCostingActive 
                        ? 'bg-amber-500/10 border-amber-500/30 shadow-md shadow-amber-500/5'
                        : 'bg-slate-950 border-slate-800'
                    }`}>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        {isRealtimeCostingActive ? 'Live Plate Cost' : 'Standard BOM Cost'}
                      </div>
                      <div className="text-base font-mono font-bold text-amber-400 mt-0.5">
                        ₹{(isRealtimeCostingActive && currentCosting ? currentCosting.live_plate_cost : selectedRecipe.cost_per_serving).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {isRealtimeCostingActive && currentCosting ? (
                          <span className={currentCosting.cost_delta > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                            Std: ₹{selectedRecipe.cost_per_serving.toFixed(2)} ({currentCosting.cost_delta > 0 ? '+' : ''}{currentCosting.cost_delta_percentage.toFixed(1)}%)
                          </span>
                        ) : (
                          'Theoretical Yield'
                        )}
                      </div>
                    </div>

                    {/* Card 2: Menu Selling Price */}
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Menu Price</div>
                      <div className="text-base font-mono font-bold text-white mt-0.5">
                        ₹{(currentCosting?.menu_selling_price || selectedRecipe.cost_per_serving * 3).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {isRealtimeCostingActive && currentCosting ? (
                          <span className="text-slate-300">
                            Food Cost: <strong className="text-white">{currentCosting.live_food_cost_percentage}%</strong>
                          </span>
                        ) : (
                          <span>Food Cost: {(selectedRecipe.cost_per_serving / (selectedRecipe.cost_per_serving * 3) * 100).toFixed(1)}%</span>
                        )}
                      </div>
                    </div>

                    {/* Card 3: Contribution Margin */}
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Contribution Margin</div>
                      <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">
                        ₹{(currentCosting 
                          ? (isRealtimeCostingActive ? currentCosting.live_contribution_margin : currentCosting.standard_contribution_margin)
                          : ((selectedRecipe.cost_per_serving * 3) - selectedRecipe.cost_per_serving)
                        ).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {isRealtimeCostingActive && currentCosting && currentCosting.margin_delta !== 0 ? (
                          <span className={currentCosting.margin_delta < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                            {currentCosting.margin_delta > 0 ? '+' : ''}₹{currentCosting.margin_delta.toFixed(2)} vs BOM
                          </span>
                        ) : (
                          'Gross Profit / Plate'
                        )}
                      </div>
                    </div>

                    {/* Card 4: Inventory Batch Production */}
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Batch Cost (1 Serving)</div>
                      <div className="text-base font-mono font-bold text-slate-200 mt-0.5">
                        ₹{(isRealtimeCostingActive && currentCosting ? currentCosting.live_plate_cost : selectedRecipe.total_batch_cost).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Package className="w-3 h-3 text-slate-500" />
                        <span>Auto-deducts POS</span>
                      </div>
                    </div>

                  </div>

                  {/* Real-time Costing Details Banner */}
                  {isRealtimeCostingActive && currentCosting && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-slate-300">
                          Raw ingredient unit costs are updated in real time from recent supplier inwards and inventory ledger receipts.
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Last recalculated: {new Date(currentCosting.last_recalculated_at).toLocaleTimeString()}
                      </span>
                    </div>
                  )}

                  {/* Ingredients Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Raw Ingredient & Inward Source</th>
                          <th className="py-2.5 px-3">BOM Portion</th>
                          <th className="py-2.5 px-3">
                            {isRealtimeCostingActive ? 'Standard vs Live Market Rate' : 'Standard Unit Cost'}
                          </th>
                          <th className="py-2.5 px-3 text-right">
                            {isRealtimeCostingActive ? 'Recalculated Plate Cost' : 'Ingredient Cost'}
                          </th>
                          <th className="py-2.5 px-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono bg-slate-900/60">
                        {currentCosting && isRealtimeCostingActive ? (
                          currentCosting.ingredients.map(ing => {
                            const isHigher = ing.market_unit_cost > ing.standard_unit_cost;
                            const isLower = ing.market_unit_cost < ing.standard_unit_cost;

                            return (
                              <tr key={ing.ingredient_id} className="hover:bg-slate-850/60 transition-colors">
                                <td className="py-2.5 px-3 font-sans">
                                  <div className="font-semibold text-slate-200">{ing.ingredient_name}</div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-slate-300 font-bold">{ing.current_stock} {ing.unit} in stock</span>
                                    <span>·</span>
                                    <span className="truncate max-w-[150px]">{ing.supplier_name}</span>
                                    <span>·</span>
                                    <span className="text-slate-500">{ing.last_purchase_ref}</span>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 text-slate-300">
                                  {ing.quantity_required} {ing.unit}
                                </td>

                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400 line-through text-[11px]">
                                      ₹{ing.standard_unit_cost}/{ing.unit}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-slate-600" />
                                    <span className={`font-bold ${
                                      isHigher ? 'text-amber-400' : isLower ? 'text-emerald-400' : 'text-slate-200'
                                    }`}>
                                      ₹{ing.market_unit_cost}/{ing.unit}
                                    </span>

                                    {ing.cost_delta_percentage !== 0 && (
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                                        isHigher ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                                      }`}>
                                        {isHigher ? '+' : ''}{ing.cost_delta_percentage.toFixed(1)}%
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 text-right">
                                  <div className="font-bold text-amber-300">
                                    ₹{ing.market_ingredient_cost.toFixed(2)}
                                  </div>
                                  {ing.cost_delta !== 0 && (
                                    <div className={`text-[10px] ${
                                      ing.cost_delta > 0 ? 'text-amber-400/90' : 'text-emerald-400/90'
                                    }`}>
                                      {ing.cost_delta > 0 ? '+' : ''}₹{ing.cost_delta.toFixed(2)} vs BOM
                                    </div>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    onClick={() => {
                                      setEditingIngredient(ing);
                                      setEditPriceInput(ing.market_unit_cost.toString());
                                      setEditReasonInput('');
                                    }}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-[10px] font-sans flex items-center gap-1 mx-auto"
                                    title="Adjust Market Purchase Rate"
                                  >
                                    <Edit3 className="w-3 h-3 text-amber-400" />
                                    <span>Rate</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          selectedRecipe.ingredients.map(ing => {
                            const totalCost = (ing.quantity_required * ing.unit_cost).toFixed(2);
                            return (
                              <tr key={ing.ingredient_id} className="hover:bg-slate-850/50">
                                <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                                  {ing.ingredient_name}
                                </td>
                                <td className="py-2.5 px-3 text-slate-400">
                                  {ing.quantity_required} {ing.unit}
                                </td>
                                <td className="py-2.5 px-3 text-slate-400">
                                  ₹{ing.unit_cost}/{ing.unit}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-amber-300">
                                  ₹{totalCost}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="text-[10px] text-slate-600 font-sans">BOM Fixed</span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* POS Integration Explainer Footer */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        When 1 portion is sold at POS:{' '}
                        <strong className="text-white">Auto-deducts {selectedRecipe.ingredients.length} raw items</strong> from the stock ledger.
                      </span>
                    </div>
                    <span className="text-amber-400 font-mono font-semibold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      {isRealtimeCostingActive && currentCosting ? (
                        `Live Material Consumption Value: ₹${currentCosting.live_plate_cost.toFixed(2)}`
                      ) : (
                        `Theoretical Consumption: ₹${selectedRecipe.cost_per_serving.toFixed(2)}`
                      )}
                    </span>
                  </div>

                </div>
              ) : (
                <div className="p-12 text-center text-xs text-slate-500 rounded-3xl bg-slate-900 border border-slate-800">
                  Select a recipe to view ingredient breakdown and live plate costing
                </div>
              )}
            </div>

          </div>
        </>
      )}

      {/* MODAL 1: Edit Ingredient Market Rate in Inventory Ledger */}
      {editingIngredient && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Adjust Market Purchase Rate</h3>
                  <p className="text-[11px] text-slate-400">Updates ingredient price in the inventory ledger</p>
                </div>
              </div>
              <button
                onClick={() => setEditingIngredient(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Raw Ingredient:</span>
                <span className="font-semibold text-white">{editingIngredient.ingredient_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Standard BOM Rate:</span>
                <span className="font-mono text-slate-300">₹{editingIngredient.standard_unit_cost}/{editingIngredient.unit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Ledger Market Rate:</span>
                <span className="font-mono text-amber-400 font-bold">₹{editingIngredient.market_unit_cost}/{editingIngredient.unit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Supplier:</span>
                <span className="text-slate-300">{editingIngredient.supplier_name}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  New Market Rate (₹ per {editingIngredient.unit})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-xs">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    value={editPriceInput}
                    onChange={(e) => setEditPriceInput(e.target.value)}
                    placeholder="Enter latest spot purchase price"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Revision Reason / Inward Note
                </label>
                <input
                  type="text"
                  value={editReasonInput}
                  onChange={(e) => setEditReasonInput(e.target.value)}
                  placeholder="e.g. Azadpur Mandi morning auction rate revision"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingIngredient(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMarketPrice}
                disabled={isSavingPrice || !editPriceInput}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-amber-500/20"
              >
                {isSavingPrice ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Recording in Ledger...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Update Ledger Price</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Sync Standard BOM Modal */}
      {showSyncModal && selectedRecipe && currentCosting && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Synchronize Standard BOM Cost</h3>
                  <p className="text-[11px] text-slate-400">Updates recipe theoretical baseline to current market rates</p>
                </div>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Recipe:</span>
                <span className="font-semibold text-white">{selectedRecipe.menu_item_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Previous Standard BOM Cost:</span>
                <span className="font-mono text-slate-300">₹{selectedRecipe.cost_per_serving.toFixed(2)}/plate</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">New Standard BOM Cost:</span>
                <span className="font-mono text-amber-400 font-bold">₹{currentCosting.live_plate_cost.toFixed(2)}/plate</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Variance to be Absorbed:</span>
                <span className={`font-mono font-bold ${
                  currentCosting.cost_delta > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {currentCosting.cost_delta > 0 ? '+' : ''}₹{currentCosting.cost_delta.toFixed(2)} ({currentCosting.cost_delta_percentage.toFixed(1)}%)
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Confirming this will overwrite the baseline unit costs of all {selectedRecipe.ingredients.length} raw ingredients in this recipe with current market ledger rates, and automatically update the POS menu cost price.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSyncStandardBOM}
                disabled={isSyncingBOM}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-amber-500/20"
              >
                {isSyncingBOM ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synchronizing BOM...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Sync BOM</span>
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
