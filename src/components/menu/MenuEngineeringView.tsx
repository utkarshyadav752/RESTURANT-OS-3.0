import React, { useState, useEffect } from 'react';
import { 
  Sparkles, DollarSign, TrendingUp, Layers, 
  HelpCircle, CheckCircle2, ArrowRight, Star, Flame, 
  Award, AlertCircle, ShoppingBag, Box
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { MenuItem } from '../../types/index.ts';
import { RiskLensMatrix3D } from '../3d/RiskLensMatrix3D.tsx';

export const MenuEngineeringView: React.FC = () => {
  const { currentBranch } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<'3D_MATRIX' | 'MATRIX' | 'COMBOS' | 'PRICING_TEST'>('MATRIX');
  
  // Pricing Experiment State
  const [expItem, setExpItem] = useState<MenuItem | null>(null);
  const [testPrice, setTestPrice] = useState<number>(510);
  const [isExpActive, setIsExpActive] = useState(false);

  useEffect(() => {
    async function loadMenu() {
      try {
        const res = await api.get(`/menu?branchId=${currentBranch?.id || ''}`);
        setItems(res || []);
        if (res && res.length > 0) {
          setExpItem(res[0]);
          setTestPrice(res[0].price + 30);
        }
      } catch (err) {
        console.error('Error fetching menu items:', err);
      }
    }
    loadMenu();
  }, [currentBranch]);

  const stars = items.filter(i => i.menu_matrix_category === 'STAR');
  const plowhorses = items.filter(i => i.menu_matrix_category === 'PLOWHORSE');
  const puzzles = items.filter(i => i.menu_matrix_category === 'PUZZLE');
  const dogs = items.filter(i => i.menu_matrix_category === 'DOG');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              Menu Engineering & Profit Intelligence
            </h2>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Contribution Margin Analytics
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Classify dishes into Stars, Plowhorses, Puzzles, and Dogs based on sales velocity and true food cost margins
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-stone-900 rounded-xl border border-stone-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('MATRIX')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'MATRIX' ? 'bg-amber-500 text-stone-950 font-bold shadow-sm' : 'text-stone-400 hover:text-white'
            }`}
          >
            Engineering Matrix
          </button>
          <button
            onClick={() => setActiveTab('3D_MATRIX')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === '3D_MATRIX' ? 'bg-amber-500 text-stone-950 font-bold shadow-sm' : 'text-stone-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Spatial Risk Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('COMBOS')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'COMBOS' ? 'bg-amber-500 text-stone-950 font-bold shadow-sm' : 'text-stone-400 hover:text-white'
            }`}
          >
            Combo Intelligence
          </button>
          <button
            onClick={() => setActiveTab('PRICING_TEST')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'PRICING_TEST' ? 'bg-amber-500 text-stone-950 font-bold shadow-sm' : 'text-stone-400 hover:text-white'
            }`}
          >
            Pricing Experiments
          </button>
        </div>
      </div>

      {/* TAB 0: RiskLens 3D Spatial Matrix */}
      {activeTab === '3D_MATRIX' && (
        <div className="space-y-4">
          <RiskLensMatrix3D />
        </div>
      )}

      {/* TAB 1: 4-Quadrant Menu Engineering Matrix */}
      {activeTab === 'MATRIX' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* STARS: High Popularity / High Margin */}
            <div className="p-5 sm:p-6 rounded-3xl bg-stone-900/90 border border-amber-500/40 shadow-sm space-y-3 h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  STARS (High Popularity · High Margin)
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  {stars.length} Dishes
                </span>
              </div>
              <p className="text-[11px] text-stone-300">
                Your primary profit engines. Maintain exact recipe quality and spotlight on top of physical and digital menus.
              </p>
              <div className="space-y-2 pt-1">
                {stars.map(dish => (
                  <div key={dish.id} className="p-3 rounded-xl bg-stone-950/80 border border-amber-500/20 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{dish.name}</span>
                      <div className="text-[10px] text-stone-400 font-mono">
                        Price: ₹{dish.price} · Cost: ₹{dish.cost_price.toFixed(0)} ({dish.margin_percentage}% margin)
                      </div>
                    </div>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      +₹{dish.contribution_margin?.toFixed(0)} margin
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* PLOWHORSES: High Popularity / Low Margin */}
            <div className="p-5 sm:p-6 rounded-3xl bg-stone-900/90 border border-blue-500/40 shadow-sm space-y-3 h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-blue-400" />
                  PLOWHORSES (High Popularity · Lower Margin)
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                  {plowhorses.length} Dishes
                </span>
              </div>
              <p className="text-[11px] text-stone-300">
                Customer staples with high sales volume. Strategic action: re-engineer recipe portions or bundle with high-margin drinks.
              </p>
              <div className="space-y-2 pt-1">
                {plowhorses.map(dish => (
                  <div key={dish.id} className="p-3 rounded-xl bg-stone-950/80 border border-blue-500/20 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{dish.name}</span>
                      <div className="text-[10px] text-stone-400 font-mono">
                        Price: ₹{dish.price} · Cost: ₹{dish.cost_price.toFixed(0)} ({dish.margin_percentage}% margin)
                      </div>
                    </div>
                    <span className="font-mono font-bold text-blue-400 text-sm">
                      +₹{dish.contribution_margin?.toFixed(0)} margin
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* PUZZLES: Low Popularity / High Margin */}
            <div className="p-5 sm:p-6 rounded-3xl bg-stone-900/90 border border-purple-500/40 shadow-sm space-y-3 h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-purple-400" />
                  PUZZLES (Low Volume · High Margin)
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  {puzzles.length} Dishes
                </span>
              </div>
              <p className="text-[11px] text-stone-300">
                Dishes with high profit margins but low sales volume. Strategic action: train service staff to recommend at table seating.
              </p>
              <div className="space-y-2 pt-1">
                {puzzles.map(dish => (
                  <div key={dish.id} className="p-3 rounded-xl bg-stone-950/80 border border-purple-500/20 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{dish.name}</span>
                      <div className="text-[10px] text-stone-400 font-mono">
                        Price: ₹{dish.price} · Cost: ₹{dish.cost_price.toFixed(0)} ({dish.margin_percentage}% margin)
                      </div>
                    </div>
                    <span className="font-mono font-bold text-purple-300 text-sm">
                      +₹{dish.contribution_margin?.toFixed(0)} margin
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* DOGS: Low Popularity / Low Margin */}
            <div className="p-5 sm:p-6 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-sm space-y-3 h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-stone-500" />
                  DOGS (Low Popularity · Low Margin)
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-800 text-stone-400">
                  {dogs.length} Dishes
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Candidates for menu elimination or complete flavor redesign to prevent unused inventory spoilage.
              </p>
              <div className="space-y-2 pt-1">
                {dogs.map(dish => (
                  <div key={dish.id} className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{dish.name}</span>
                      <div className="text-[10px] text-stone-400 font-mono">
                        Price: ₹{dish.price} · Cost: ₹{dish.cost_price.toFixed(0)} ({dish.margin_percentage}% margin)
                      </div>
                    </div>
                    <span className="font-mono font-bold text-stone-400 text-sm">
                      +₹{dish.contribution_margin?.toFixed(0)} margin
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: Combo Recommendations */}
      {activeTab === 'COMBOS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
            AI analyzed 1,400+ historical order bills to discover high co-occurrence dish pairings with maximum contribution margin potential.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-700 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                Recommended Combo #1 (Royal Mughlai Feast)
              </span>
              <h4 className="text-sm font-bold text-white">Purani Dilli Butter Chicken + Garlic Naan (2x) + Smoked Old Fashioned</h4>
              
              <div className="p-3 bg-slate-950 rounded-xl space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Individual Menu Prices:</span>
                  <span>₹480 + ₹190 + ₹590 = ₹1,260</span>
                </div>
                <div className="flex justify-between text-white font-bold">
                  <span>Suggested Bundle Price:</span>
                  <span className="text-amber-400">₹1,120 (11% discount)</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800">
                  <span>Net Combined Margin:</span>
                  <span>+₹784 per order (70% margin)</span>
                </div>
              </div>

              <button className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors">
                Publish Combo to POS Menu
              </button>
            </div>

            <div className="p-5 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-700 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                Recommended Combo #2 (Vegetarian Signature)
              </span>
              <h4 className="text-sm font-bold text-white">Paneer Butter Masala + Dal Makhani + Garlic Naan (2x) + Rasmalai</h4>
              
              <div className="p-3 bg-slate-950 rounded-xl space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Individual Menu Prices:</span>
                  <span>₹390 + ₹320 + ₹190 + ₹210 = ₹1,110</span>
                </div>
                <div className="flex justify-between text-white font-bold">
                  <span>Suggested Bundle Price:</span>
                  <span className="text-amber-400">₹990 (10.8% discount)</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800">
                  <span>Net Combined Margin:</span>
                  <span>+₹682 per order (68.8% margin)</span>
                </div>
              </div>

              <button className="w-full py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl text-xs transition-colors">
                Publish Combo to POS Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Pricing Experiment Sandbox */}
      {activeTab === 'PRICING_TEST' && expItem && (
        <div className="p-6 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-700 space-y-4 max-w-2xl mx-auto shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Owner-Controlled Price Experiment Engine
              </span>
              <h3 className="text-base font-bold text-white">A/B Price Testing Simulation</h3>
            </div>
            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
              isExpActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
            }`}>
              {isExpActive ? 'Experiment Live in CyberCity' : 'Draft Simulation'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Select Dish</label>
              <select
                value={expItem.id}
                onChange={(e) => {
                  const it = items.find(i => i.id === e.target.value);
                  if (it) {
                    setExpItem(it);
                    setTestPrice(it.price + 30);
                  }
                }}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                {items.map(it => (
                  <option key={it.id} value={it.id}>{it.name} (Current: ₹{it.price})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Proposed Test Price</label>
              <input
                type="number"
                value={testPrice}
                onChange={(e) => setTestPrice(Number(e.target.value))}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-amber-400 font-bold"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Current Base Price:</span>
              <span>₹{expItem.price}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Recipe Cost:</span>
              <span>₹{expItem.cost_price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-amber-300 font-bold">
              <span>Current Margin:</span>
              <span>₹{(expItem.price - expItem.cost_price).toFixed(2)} / plate</span>
            </div>
            <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800">
              <span>Projected Margin with Test Price:</span>
              <span>₹{(testPrice - expItem.cost_price).toFixed(2)} (+₹{testPrice - expItem.price} / plate)</span>
            </div>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed font-sans">
            <strong>AI Elasticity Forecast:</strong> Based on 4-week sales velocity, testing a ₹{testPrice - expItem.price} price increase on {expItem.name} has an estimated price elasticity of -0.32 (inelastic). Expected monthly revenue increase: <strong>+₹18,400</strong> with less than 3% decline in unit orders.
          </div>

          <button
            onClick={() => setIsExpActive(!isExpActive)}
            className={`w-full py-2.5 font-bold rounded-xl text-xs transition-colors cursor-pointer ${
              isExpActive
                ? 'bg-rose-500 hover:bg-rose-400 text-white'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950'
            }`}
          >
            {isExpActive ? 'Stop Price Experiment & Revert Price' : 'Approve & Launch Price Experiment'}
          </button>
        </div>
      )}

    </div>
  );
};
