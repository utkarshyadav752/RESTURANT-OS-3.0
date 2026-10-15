import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Minus, Trash2, Printer, 
  CreditCard, Banknote, QrCode, PauseCircle, 
  Send, UserPlus, Table as TableIcon, 
  AlertCircle, CheckCircle2, ChevronRight, X, UtensilsCrossed
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { MenuItem, Table, OrderItem, MenuModifier } from '../../types/index.ts';

interface CartItem extends OrderItem {
  menuItemRef: MenuItem;
}

export const POSView: React.FC = () => {
  const { currentBranch, user, restaurant } = useAuth();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  // Active Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');

  // Modals & Action States
  const [modifierItem, setModifierItem] = useState<MenuItem | null>(null);
  const [selectedModifierOptions, setSelectedModifierOptions] = useState<Record<string, string>>({});
  const [itemInstructions, setItemInstructions] = useState('');
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'SPLIT'>('UPI');
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitUPI, setSplitUPI] = useState<number>(0);
  const [splitCard, setSplitCard] = useState<number>(0);

  const [activeCreatedOrder, setActiveCreatedOrder] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [heldOrders, setHeldOrders] = useState<any[]>([]);

  // Load menu and tables
  useEffect(() => {
    async function loadData() {
      try {
        const [itemsRes, tablesRes] = await Promise.all([
          api.get(`/menu?branchId=${currentBranch?.id || ''}`),
          api.get(`/tables?branchId=${currentBranch?.id || ''}`),
        ]);
        setMenuItems(itemsRes || []);
        setTables(tablesRes || []);
      } catch (err) {
        console.error('Error fetching POS data:', err);
      }
    }
    loadData();
  }, [currentBranch]);

  // Categories list
  const categories = ['ALL', ...Array.from(new Set(menuItems.map(m => m.category_name)))];

  const filteredItems = menuItems.filter(item => {
    if (selectedCategory !== 'ALL' && item.category_name !== selectedCategory) return false;
    if (vegOnly && !item.is_veg) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Open item modifiers or add directly
  const handleItemClick = (item: MenuItem) => {
    if (item.modifiers && item.modifiers.length > 0) {
      setModifierItem(item);
      const defaults: Record<string, string> = {};
      item.modifiers.forEach(mod => {
        if (mod.options.length > 0) {
          defaults[mod.id] = mod.options[0].id;
        }
      });
      setSelectedModifierOptions(defaults);
      setItemInstructions('');
    } else {
      addToCartDirect(item);
    }
  };

  const addToCartDirect = (item: MenuItem, selectedMods: { group_name: string; option_name: string; price_delta: number }[] = [], instructions = '') => {
    const extraPrice = selectedMods.reduce((sum, m) => sum + m.price_delta, 0);
    const unitPrice = item.price + extraPrice;

    setCart(prev => {
      // Find if exact same item with same modifiers exists
      const existingIdx = prev.findIndex(ci => 
        ci.menu_item_id === item.id && 
        ci.special_instructions === instructions &&
        JSON.stringify(ci.modifiers) === JSON.stringify(selectedMods)
      );

      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        updated[existingIdx].item_total = updated[existingIdx].quantity * unitPrice;
        return updated;
      }

      const newItem: CartItem = {
        id: `oi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        menu_item_id: item.id,
        name: item.name,
        price: unitPrice,
        quantity: 1,
        modifiers: selectedMods,
        special_instructions: instructions,
        status: 'NEW',
        item_total: unitPrice,
        menuItemRef: item,
      };
      return [...prev, newItem];
    });
  };

  const handleConfirmModifiers = () => {
    if (!modifierItem) return;
    const selectedMods: { group_name: string; option_name: string; price_delta: number }[] = [];

    modifierItem.modifiers.forEach(mod => {
      const selectedOptionId = selectedModifierOptions[mod.id];
      const option = mod.options.find(o => o.id === selectedOptionId);
      if (option) {
        selectedMods.push({
          group_name: mod.name,
          option_name: option.name,
          price_delta: option.price_delta,
        });
      }
    });

    addToCartDirect(modifierItem, selectedMods, itemInstructions);
    setModifierItem(null);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(ci => {
        if (ci.id === cartItemId) {
          const newQty = Math.max(0, ci.quantity + delta);
          return {
            ...ci,
            quantity: newQty,
            item_total: newQty * ci.price,
          };
        }
        return ci;
      }).filter(ci => ci.quantity > 0);
    });
  };

  // Calculations
  const subtotal = cart.reduce((sum, ci) => sum + ci.item_total, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const taxable = Math.max(0, subtotal - discountAmount);
  const cgst = Number(((taxable * (restaurant?.cgst_rate || 2.5)) / 100).toFixed(2));
  const sgst = Number(((taxable * (restaurant?.sgst_rate || 2.5)) / 100).toFixed(2));
  const serviceCharge = restaurant?.service_charge_rate ? Number(((taxable * restaurant.service_charge_rate) / 100).toFixed(2)) : 0;
  const rawTotal = taxable + cgst + sgst + serviceCharge;
  const grandTotal = Math.round(rawTotal);

  // Send Order & KOT
  const handleFireKOT = async (isHeld = false) => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await api.post('/pos/orders', {
        branchId: currentBranch?.id,
        tableId: selectedTable?.id,
        tableNumber: selectedTable?.table_number,
        orderType,
        items: cart,
        customerName: customerName || (selectedTable ? `Table ${selectedTable.table_number}` : 'Walk-in Guest'),
        customerPhone,
        discountAmount,
        discountReason,
        createdByName: user?.name || 'Cashier',
        createdById: user?.id || 'user_cashier',
        userRole: user?.role || 'CASHIER',
        isHeld,
      });

      if (isHeld) {
        setHeldOrders(prev => [res.order, ...prev]);
        setCart([]);
        setSelectedTable(null);
      } else {
        setActiveCreatedOrder(res.order);
        setShowPaymentModal(true);
        // Pre-fill split values
        setSplitCash(grandTotal);
        setSplitUPI(0);
        setSplitCard(0);
      }
    } catch (err: any) {
      console.error('Order creation failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Complete Payment and trigger recipe BOM deduction
  const handleCompletePayment = async () => {
    if (!activeCreatedOrder) return;
    setIsProcessing(true);
    try {
      let splitBreakdown = undefined;
      if (paymentMethod === 'SPLIT') {
        splitBreakdown = [
          { method: 'CASH' as const, amount: splitCash },
          { method: 'UPI' as const, amount: splitUPI },
          { method: 'CARD' as const, amount: splitCard },
        ].filter(b => b.amount > 0);
      }

      await api.post(`/pos/orders/${activeCreatedOrder.id}/pay`, {
        paymentMethod,
        splitBreakdown,
        userId: user?.id,
        userName: user?.name,
        userRole: user?.role,
      });

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore in tests
      }

      setShowPaymentModal(false);
      setActiveCreatedOrder(null);
      setCart([]);
      setSelectedTable(null);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountPercent(0);
    } catch (err: any) {
      console.error('Payment processing failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4.5rem)] flex flex-col lg:flex-row overflow-hidden bg-slate-950">
      
      {/* Left Menu Section (Categories, Search, Dish Grid) */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800/80 overflow-hidden">
        
        {/* Search & Filter Header */}
        <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes (e.g. Butter Chicken, Biryani, Naan)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans"
            />
          </div>

          {/* Pure Veg Toggle */}
          <button
            type="button"
            onClick={() => setVegOnly(!vegOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              vegOnly 
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400' 
                : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full border border-emerald-400 flex items-center justify-center p-0.5">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
            </span>
            Veg Only
          </button>

          {/* Held orders button */}
          {heldOrders.length > 0 && (
            <button
              onClick={() => {
                const held = heldOrders[0];
                setCart(held.items);
                setHeldOrders(heldOrders.slice(1));
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              Resume Held ({heldOrders.length})
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'All Dishes' : cat}
            </button>
          ))}
        </div>

        {/* Menu Items Touch Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredItems.map((dish) => (
            <div
              key={dish.id}
              onClick={() => handleItemClick(dish)}
              className="group p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between h-full shadow-sm relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center p-0.5 ${
                    dish.is_veg ? 'border-emerald-500' : 'border-rose-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dish.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </span>

                  <span className="text-[10px] text-stone-400 font-medium">
                    {dish.preparation_time_minutes}m
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-tight">
                  {dish.name}
                </h4>

                <p className="text-[10px] text-stone-400 line-clamp-2 mt-1 leading-snug">
                  {dish.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-stone-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold font-mono text-amber-400">
                    ₹{dish.price}
                  </span>
                  <span className="text-[9px] text-stone-500 ml-1.5 font-mono">
                    Cost: ₹{dish.cost_price.toFixed(0)}
                  </span>
                </div>

                <div className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center transition-colors font-bold shadow-sm">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Order Summary & Cart Section */}
      <div className="w-full lg:w-96 bg-slate-900/95 flex flex-col justify-between border-l border-slate-800 shadow-2xl overflow-hidden shrink-0">
        
        {/* Top Order Context: Dine-in vs Takeaway, Table Selector */}
        <div className="p-3.5 border-b border-slate-800 space-y-2.5 bg-slate-950/60">
          <div className="grid grid-cols-3 p-0.5 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setOrderType('DINE_IN')}
              className={`py-1.5 rounded-lg transition-all ${
                orderType === 'DINE_IN' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dine-In
            </button>
            <button
              onClick={() => { setOrderType('TAKEAWAY'); setSelectedTable(null); }}
              className={`py-1.5 rounded-lg transition-all ${
                orderType === 'TAKEAWAY' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Takeaway
            </button>
            <button
              onClick={() => { setOrderType('DELIVERY'); setSelectedTable(null); }}
              className={`py-1.5 rounded-lg transition-all ${
                orderType === 'DELIVERY' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Delivery
            </button>
          </div>

          {/* Table Selector Dropdown (Dine-in only) */}
          {orderType === 'DINE_IN' && (
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-amber-400 shrink-0" />
              <select
                value={selectedTable?.id || ''}
                onChange={(e) => {
                  const t = tables.find(tbl => tbl.id === e.target.value);
                  setSelectedTable(t || null);
                }}
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
              >
                <option value="">Select Table (Floor Plan)</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.table_number} ({t.area} · {t.capacity}pax) — {t.status}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Customer Name / Phone */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Guest Name (Optional)"
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500"
            />
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Mobile (Loyalty)"
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 font-mono"
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-12">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-600 mb-2">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-400">Order ticket is empty</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Click any dish from the menu to add</p>
            </div>
          ) : (
            cart.map((ci) => (
              <div key={ci.id} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-bold text-white line-clamp-1">{ci.name}</span>
                    {ci.modifiers && ci.modifiers.length > 0 && (
                      <div className="text-[10px] text-amber-400 flex flex-wrap gap-1 mt-0.5">
                        {ci.modifiers.map((m, idx) => (
                          <span key={idx}>{m.option_name}</span>
                        ))}
                      </div>
                    )}
                    {ci.special_instructions && (
                      <div className="text-[10px] text-slate-400 italic">
                        Note: {ci.special_instructions}
                      </div>
                    )}
                  </div>
                  <span className="font-mono font-bold text-slate-200">
                    ₹{ci.item_total}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-mono">₹{ci.price} ea</span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(ci.id, -1)}
                      className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold text-xs text-white min-w-[14px] text-center">
                      {ci.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(ci.id, 1)}
                      className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateQuantity(ci.id, -ci.quantity)}
                      className="text-rose-400 hover:text-rose-300 ml-1 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Calculations & Action Buttons */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 space-y-2">
          
          {/* Subtotal & Taxes breakdown */}
          <div className="space-y-1 text-xs text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="text-white">₹{subtotal.toFixed(2)}</span>
            </div>

            {/* Discount selector */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 text-slate-400">
                Discount:
                <select
                  value={discountPercent}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    setDiscountPercent(p);
                    setDiscountReason(p > 0 ? `${p}% Promo` : '');
                  }}
                  className="bg-slate-900 border border-slate-800 text-[10px] rounded px-1 text-amber-300"
                >
                  <option value={0}>0%</option>
                  <option value={5}>5% VIP</option>
                  <option value={10}>10% Corporate</option>
                  <option value={15}>15% Friends & Family</option>
                </select>
              </span>
              {discountAmount > 0 && <span className="text-emerald-400">-₹{discountAmount}</span>}
            </div>

            <div className="flex justify-between text-[11px] text-slate-500">
              <span>CGST ({restaurant?.cgst_rate || 2.5}%) + SGST ({restaurant?.sgst_rate || 2.5}%):</span>
              <span>₹{(cgst + sgst).toFixed(2)}</span>
            </div>

            {serviceCharge > 0 && (
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Service Charge ({restaurant?.service_charge_rate}%):</span>
                <span>₹{serviceCharge.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-slate-800 font-sans">
              <span>Grand Total:</span>
              <span className="font-mono text-amber-400 text-base">₹{grandTotal}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              disabled={cart.length === 0 || isProcessing}
              onClick={() => handleFireKOT(true)}
              className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              Hold Order
            </button>

            <button
              type="button"
              disabled={cart.length === 0 || isProcessing}
              onClick={() => handleFireKOT(false)}
              className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-stone-950" />
              Send KOT & Pay
            </button>
          </div>
        </div>

      </div>

      {/* Item Modifiers Modal */}
      {modifierItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-700 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{modifierItem.name}</h3>
                <p className="text-xs text-slate-400 font-mono">Base Price: ₹{modifierItem.price}</p>
              </div>
              <button
                onClick={() => setModifierItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modifier Groups */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {modifierItem.modifiers.map((mod) => (
                <div key={mod.id} className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-300">{mod.name}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {mod.options.map((opt) => {
                      const isSelected = selectedModifierOptions[mod.id] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedModifierOptions(prev => ({ ...prev, [mod.id]: opt.id }))}
                          className={`p-2 rounded-xl text-xs font-medium border text-left flex justify-between items-center transition-all ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500/15 text-white'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{opt.name}</span>
                          {opt.price_delta > 0 && (
                            <span className="font-mono text-amber-400">+₹{opt.price_delta}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Special Kitchen Note (e.g. Less oil, extra spicy)
                </label>
                <input
                  type="text"
                  value={itemInstructions}
                  onChange={(e) => setItemInstructions(e.target.value)}
                  placeholder="Kitchen instructions..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmModifiers}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              Add to Order Ticket
            </button>
          </div>
        </div>
      )}

      {/* Payment Processing Modal with Split & Recipe Deduction Feedback */}
      {showPaymentModal && activeCreatedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-3xl glass-panel-elevated bg-slate-900 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {activeCreatedOrder.order_number} · {activeCreatedOrder.table_number || 'Takeaway'}
                </span>
                <h3 className="text-lg font-bold text-white">Settle Bill & Print Invoice</h3>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase">Amount Due</div>
                <div className="text-xl font-black font-mono text-amber-400">₹{activeCreatedOrder.grand_total}</div>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  paymentMethod === 'UPI' ? 'border-amber-500 bg-amber-500/15 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <QrCode className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold">UPI QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  paymentMethod === 'CASH' ? 'border-amber-500 bg-amber-500/15 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold">Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  paymentMethod === 'CARD' ? 'border-amber-500 bg-amber-500/15 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-bold">Card</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('SPLIT');
                  setSplitCash(Math.round(activeCreatedOrder.grand_total / 2));
                  setSplitUPI(activeCreatedOrder.grand_total - Math.round(activeCreatedOrder.grand_total / 2));
                  setSplitCard(0);
                }}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  paymentMethod === 'SPLIT' ? 'border-amber-500 bg-amber-500/15 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <TableIcon className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-bold">Split Bill</span>
              </button>
            </div>

            {/* Method Details (e.g. UPI Dynamic QR Simulation) */}
            {paymentMethod === 'UPI' && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white">Dynamic UPI Payment QR</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Scan with GPay, PhonePe, or Paytm</p>
                  <p className="text-[11px] font-mono text-amber-400 mt-2 font-semibold">VPA: zafran.dlf@icici</p>
                </div>
                <div className="w-24 h-24 bg-white rounded-xl p-2 flex items-center justify-center shadow-lg">
                  <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center text-white text-[10px] text-center font-mono">
                    [UPI QR]
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'SPLIT' && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-300">
                  <span>Cash Portion:</span>
                  <input
                    type="number"
                    value={splitCash}
                    onChange={(e) => setSplitCash(Number(e.target.value))}
                    className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded font-mono text-right text-white"
                  />
                </div>
                <div className="flex items-center justify-between font-semibold text-slate-300">
                  <span>UPI Portion:</span>
                  <input
                    type="number"
                    value={splitUPI}
                    onChange={(e) => setSplitUPI(Number(e.target.value))}
                    className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded font-mono text-right text-white"
                  />
                </div>
                <div className="flex items-center justify-between font-semibold text-slate-300">
                  <span>Card Portion:</span>
                  <input
                    type="number"
                    value={splitCard}
                    onChange={(e) => setSplitCard(Number(e.target.value))}
                    className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded font-mono text-right text-white"
                  />
                </div>
                <div className="flex justify-between font-bold text-amber-400 pt-2 border-t border-slate-800">
                  <span>Sum Split Total:</span>
                  <span>₹{splitCash + splitUPI + splitCard} / ₹{activeCreatedOrder.grand_total}</span>
                </div>
              </div>
            )}

            {/* Automated Recipe BOM Ledger Info */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Completing payment will auto-deduct raw ingredients from the <strong>Stock Ledger</strong> according to active recipe BOM formulas.
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                Back to POS
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCompletePayment}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Recording Stock Ledger...' : 'Confirm Payment & Print Receipt'}
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
