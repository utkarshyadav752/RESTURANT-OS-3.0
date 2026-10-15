/**
 * Core Domain Models for RestaurantOS Multi-Tenant Architecture & Operations
 */

export type RoleType = 
  | 'SUPER_ADMIN'
  | 'OWNER'
  | 'MANAGER'
  | 'CASHIER'
  | 'WAITER'
  | 'KITCHEN'
  | 'INVENTORY_MANAGER'
  | 'ACCOUNTANT';

export type PermissionKey =
  | 'orders.view'
  | 'orders.create'
  | 'orders.cancel'
  | 'orders.refund'
  | 'payments.view'
  | 'payments.create'
  | 'inventory.view'
  | 'inventory.adjust'
  | 'inventory.purchase'
  | 'menu.view'
  | 'menu.create'
  | 'menu.edit'
  | 'menu.delete'
  | 'reports.view'
  | 'analytics.view'
  | 'ai.view'
  | 'ai.approve'
  | 'staff.manage'
  | 'branches.manage'
  | 'settings.manage';

export interface User {
  id: string;
  organization_id: string;
  restaurant_id: string;
  name: string;
  email: string;
  mobile: string;
  role: RoleType;
  custom_role_name?: string;
  assigned_branch_ids: string[]; // ['all'] or array of specific branch IDs
  permissions: PermissionKey[];
  avatar?: string;
  is_2fa_enabled: boolean;
  status: 'active' | 'suspended' | 'invited';
  created_at: string;
  last_login_at: string;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface Restaurant {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  logo_url?: string;
  restaurant_type: 
    | 'Restaurant'
    | 'Cafe'
    | 'Bakery'
    | 'Cloud Kitchen'
    | 'QSR'
    | 'Bar & Restaurant'
    | 'Food Court'
    | 'Other';
  country: string;
  state: string;
  city: string;
  address: string;
  currency: string; // 'INR', 'USD', 'AED', etc.
  currency_symbol: string; // '₹', '$', 'AED'
  timezone: string;
  gstin?: string;
  cgst_rate: number; // e.g. 2.5
  sgst_rate: number; // e.g. 2.5
  service_charge_rate: number; // e.g. 5.0
  is_service_charge_mandatory: boolean;
  is_tax_inclusive: boolean;
  business_phone: string;
  business_email: string;
  created_at: string;
}

export interface Branch {
  id: string;
  organization_id: string;
  restaurant_id: string;
  name: string;
  code: string;
  address: string;
  contact_number: string;
  opening_hours: string;
  tables_count: number;
  seating_capacity: number;
  status: 'active' | 'inactive';
}

export interface Table {
  id: string;
  branch_id: string;
  restaurant_id: string;
  table_number: string;
  area: 'Main Hall' | 'Terrace' | 'Lounge Bar' | 'Private Dining';
  capacity: number;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED' | 'BILLING';
  active_order_id?: string;
  occupied_since?: string;
  guest_name?: string;
  guest_count?: number;
  server_name?: string;
}

export interface ModifierOption {
  id: string;
  name: string;
  price_delta: number;
}

export interface MenuModifier {
  id: string;
  name: string; // e.g. "Size", "Spice Level", "Add-ons"
  required: boolean;
  multi_select: boolean;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  branch_ids: string[]; // branches where available
  category_id: string;
  category_name: string;
  name: string;
  description: string;
  price: number;
  cost_price: number; // calculated from recipe BOM
  is_veg: boolean;
  is_spicy?: boolean;
  is_bestseller?: boolean;
  is_available: boolean;
  preparation_time_minutes: number;
  recipe_id?: string;
  modifiers: MenuModifier[];
  image_url?: string;
  tags?: string[];
  // Profit intelligence & Menu matrix
  popularity_score?: number; // 0-100
  contribution_margin?: number; // price - cost_price
  margin_percentage?: number;
  menu_matrix_category?: 'STAR' | 'PLOWHORSE' | 'PUZZLE' | 'DOG';
}

export interface RecipeItem {
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
  quantity_required: number; // e.g., 0.25 kg
  unit_cost: number;
}

export interface Recipe {
  id: string;
  restaurant_id: string;
  menu_item_id: string;
  menu_item_name: string;
  yield_servings: number;
  ingredients: RecipeItem[];
  instructions?: string;
  total_batch_cost: number;
  cost_per_serving: number;
}

export interface InventoryItem {
  id: string;
  restaurant_id: string;
  branch_id: string;
  name: string;
  barcode?: string; // e.g. EAN-13 "8901262010053" or internal QR
  sku?: string; // e.g. "SKU-BUTTER-500G"
  brand?: string; // e.g. "Amul", "Tata Sampann", "Fortune"
  category: 'Poultry & Meat' | 'Dairy' | 'Produce' | 'Dry Goods & Spices' | 'Beverages & Bar' | 'Packaging' | 'Snacks & Bakery' | 'Oils & Ghee';
  unit: 'kg' | 'g' | 'L' | 'ml' | 'pcs' | 'box' | 'pkt' | 'tin' | 'bottle';
  current_stock: number;
  minimum_stock: number; // reorder point
  optimal_stock: number;
  cost_per_unit: number; // Purchase price
  mrp?: number; // Retail MRP or valuation
  gst_rate?: number; // 0, 5, 12, 18, 28
  hsn_code?: string;
  storage_location?: string; // "Dry Store", "Cold Room", "Deep Freezer", "Bar Cellar"
  supplier_id: string;
  supplier_name: string;
  shelf_life_days: number;
  is_perishable: boolean;
  status: 'OPTIMAL' | 'LOW' | 'CRITICAL' | 'OVERSTOCK';
  last_restocked_at?: string;
}

export interface InventoryBatch {
  id: string;
  inventory_item_id: string;
  item_name: string;
  batch_number: string;
  purchase_date: string;
  expiry_date: string;
  initial_quantity: number;
  remaining_quantity: number;
  unit: string;
  days_until_expiry: number;
  risk_level: 'SAFE' | 'EXPIRING_SOON' | 'EXPIRED';
}

export type StockMovementType = 
  | 'PURCHASE'
  | 'SALE_CONSUMPTION'
  | 'WASTAGE'
  | 'RETURN'
  | 'ADJUSTMENT'
  | 'TRANSFER'
  | 'OPENING_BALANCE';

export interface StockLedgerEntry {
  id: string;
  organization_id: string;
  restaurant_id: string;
  branch_id: string;
  inventory_item_id: string;
  item_name: string;
  movement_type: StockMovementType;
  quantity: number; // positive for addition, negative for deduction
  balance_after: number;
  unit: string;
  unit_cost?: number; // Latest inward/purchase unit cost
  total_value?: number;
  reference_id?: string; // order_id, purchase_id, wastage_id
  notes: string;
  created_by: string;
  created_at: string;
}

// Real-time Costing Engine Models
export interface RealtimeIngredientCost {
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
  quantity_required: number;
  standard_unit_cost: number;
  market_unit_cost: number;
  standard_ingredient_cost: number;
  market_ingredient_cost: number;
  cost_delta: number;
  cost_delta_percentage: number;
  current_stock: number;
  supplier_name: string;
  storage_location?: string;
  last_purchase_ref?: string;
  last_purchase_date?: string;
  price_trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface RealtimeRecipeCosting {
  recipe_id: string;
  menu_item_id: string;
  menu_item_name: string;
  yield_servings: number;
  standard_plate_cost: number;
  live_plate_cost: number;
  cost_delta: number;
  cost_delta_percentage: number;
  menu_selling_price: number;
  standard_food_cost_percentage: number;
  live_food_cost_percentage: number;
  standard_contribution_margin: number;
  live_contribution_margin: number;
  margin_delta: number;
  ingredients: RealtimeIngredientCost[];
  last_recalculated_at: string;
  overhead_cost: number;
}

export interface WastageEntry {
  id: string;
  restaurant_id: string;
  branch_id: string;
  inventory_item_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_loss_cost: number;
  reason: 
    | 'SPOILED'
    | 'EXPIRED'
    | 'OVER_PREPARATION'
    | 'BURNED'
    | 'DAMAGED'
    | 'WRONG_ORDER'
    | 'CUSTOMER_RETURN'
    | 'OTHER';
  reported_by: string;
  created_at: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  restaurant_id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  lead_time_days: number;
  minimum_order_value: number;
  rating: number; // 1-5
  supplied_categories: string[];
}

export interface PurchaseOrderItem {
  inventory_item_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  restaurant_id: string;
  branch_id: string;
  supplier_id: string;
  supplier_name: string;
  status: 'DRAFT' | 'APPROVED' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  items: PurchaseOrderItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  created_by: string;
  approved_by?: string;
  created_at: string;
  expected_delivery: string;
  received_at?: string;
}

export type CustomerLoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface CustomerVisitRecord {
  id: string;
  date: string;
  branch_name: string;
  table_number?: string;
  order_id?: string;
  bill_amount: number;
  items_summary: string[];
  points_earned: number;
  points_redeemed?: number;
  discount_applied?: number;
  payment_method: string;
  notes?: string;
}

export interface LoyaltyPointsTransaction {
  id: string;
  customer_id: string;
  date: string;
  type: 'EARNED_SPEND' | 'EARNED_BONUS' | 'REDEEMED_DISCOUNT' | 'TIER_UPGRADE_BONUS' | 'BIRTHDAY_GIFT' | 'MANUAL_ADJUST';
  points: number; // positive for earn, negative for burn
  balance_after: number;
  description: string;
  reference_id?: string;
}

export interface PersonalizedDiscountOffer {
  id: string;
  customer_id: string;
  code: string;
  title: string;
  description: string;
  discount_type: 'PERCENTAGE' | 'FLAT_AMOUNT' | 'FREE_ITEM';
  discount_value: number; // e.g. 20 for 20% or 250 for ₹250
  free_item_name?: string;
  min_order_value: number;
  max_discount_cap?: number;
  target_item?: string;
  expiry_date: string;
  is_claimed: boolean;
  claimed_at?: string;
  reason: string;
  badge_label: string;
}

export interface LoyaltyProgramConfig {
  points_per_rupee: number; // e.g. 0.02 = 1 pt per ₹50
  rupee_per_point_redemption: number; // e.g. 1 = 1 pt is ₹1
  min_points_to_redeem: number; // e.g. 100
  welcome_points: number; // e.g. 50
  tier_thresholds: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  tier_multipliers: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
}

export interface Customer {
  id: string;
  restaurant_id: string;
  name: string;
  phone: string;
  email?: string;
  loyalty_points: number;
  tier: CustomerLoyaltyTier;
  points_to_next_tier?: number;
  lifetime_points_earned: number;
  lifetime_points_redeemed: number;
  total_spent: number;
  visit_count: number;
  first_visit: string;
  last_visit: string;
  favorite_items: string[];
  notes?: string;
  dining_preference?: 'VEGETARIAN' | 'NON_VEGETARIAN' | 'JAIN' | 'ALL';
  avg_spend_per_visit: number;
  days_since_last_visit: number;
  churn_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  visit_history: CustomerVisitRecord[];
  points_ledger: LoyaltyPointsTransaction[];
  personalized_discounts: PersonalizedDiscountOffer[];
}

export interface OrderItem {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: {
    group_name: string;
    option_name: string;
    price_delta: number;
  }[];
  special_instructions?: string;
  status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  item_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  organization_id: string;
  restaurant_id: string;
  branch_id: string;
  table_id?: string;
  table_number?: string;
  order_type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  status: 'PENDING' | 'KOT_SENT' | 'PREPARING' | 'READY' | 'BILLING' | 'COMPLETED' | 'CANCELLED';
  items: OrderItem[];
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  discount_amount: number;
  discount_reason?: string;
  cgst_amount: number;
  sgst_amount: number;
  service_charge: number;
  rounding_adjustment: number;
  grand_total: number;
  payment_status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED';
  payment_method?: 'CASH' | 'CARD' | 'UPI' | 'SPLIT' | 'WALLET';
  created_by_name: string;
  created_at: string;
  updated_at: string;
  is_held?: boolean;
}

export interface KOTItem {
  id: string;
  item_name: string;
  quantity: number;
  modifiers: string[];
  instructions?: string;
  station: 'Tandoor' | 'Curry & Rice' | 'Bar & Drinks' | 'Desserts & Breads';
}

export interface KOT {
  id: string;
  kot_number: string;
  order_id: string;
  order_number: string;
  branch_id: string;
  table_number: string;
  order_type: string;
  items: KOTItem[];
  status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED';
  created_at: string;
  elapsed_seconds: number;
  server_name: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  restaurant_id: string;
  branch_id: string;
  customer_name?: string;
  customer_phone?: string;
  table_number?: string;
  subtotal: number;
  discount: number;
  cgst: number;
  sgst: number;
  service_charge: number;
  total: number;
  payments: {
    method: 'CASH' | 'CARD' | 'UPI' | 'WALLET';
    amount: number;
    transaction_id?: string;
    timestamp: string;
  }[];
  is_refunded: boolean;
  refund_reason?: string;
  refunded_by?: string;
  created_at: string;
}

export interface DemandForecast {
  menu_item_id: string;
  item_name: string;
  target_date: string;
  forecasted_units: number;
  confidence_percentage: number;
  lower_bound: number;
  upper_bound: number;
  key_factors: string[]; // "Weekend surge", "Cloudy evening", "Historical high demand"
}

export interface PurchaseRecommendation {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  current_usable_stock: number;
  forecast_demand: number;
  safety_stock: number;
  recommended_quantity: number;
  unit: string;
  estimated_cost: number;
  supplier_name: string;
  reason: string;
  action_type: 'BUY' | 'DONT_BUY' | 'URGENT_USE';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'MODIFIED';
}

export interface RecipeDriftSignal {
  ingredient_id: string;
  ingredient_name: string;
  expected_consumption: number;
  actual_consumption: number;
  unit: string;
  drift_percentage: number;
  financial_impact: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  suspected_cause: string;
}

export interface ActiveSession {
  id: string;
  user_id: string;
  device_name: string;
  browser: string;
  os: string;
  ip_address: string;
  location: string;
  last_active: string;
  is_current: boolean;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  restaurant_id: string;
  branch_id?: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  entity_type: 'AUTH' | 'ORDER' | 'PAYMENT' | 'REFUND' | 'INVENTORY' | 'STAFF' | 'BRANCH' | 'SETTINGS' | 'AI';
  details: string;
  ip_address: string;
  timestamp: string;
}

export interface StaffInvitation {
  id: string;
  organization_id: string;
  restaurant_id: string;
  token: string;
  name: string;
  email: string;
  mobile: string;
  role: RoleType;
  assigned_branch_ids: string[];
  invited_by: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  created_at: string;
  expires_at: string;
}

// --- Daily Huddle & Shift AI Types ---
export type ShiftFocusMode = 'BALANCED' | 'SPEED' | 'PROFIT' | 'ZERO_WASTE' | 'VIP';

export interface StationStatus {
  id: string;
  stationName: string;
  leadName: string;
  staffCount: number;
  readinessPct: number;
  status: 'OPTIMAL' | 'ATTENTION' | 'CRITICAL';
  statusNote: string;
  keyDirectives: string[];
}

export interface ProjectedPeakWindow {
  id: string;
  timeWindow: string;
  projectedCovers: number;
  capacityUtilization: number;
  loadLevel: 'MODERATE' | 'HIGH' | 'CRITICAL_PEAK';
  rushStatus: string;
  highlight: string;
  prepPrerequisite: string;
}

export interface TacticalDirectiveItem {
  id: string;
  dishOrItem: string;
  category: 'PUSH_PROFIT' | 'PORTION_DRIFT' | '86_WATCH' | 'VIP_EXPERIENCE';
  rationale: string;
  marginOrCostImpact: string;
  badge: string;
}

export interface DailyHuddleData {
  shiftInfo: {
    shiftName: string;
    shiftLead: string;
    serviceWindow: string;
    date: string;
    branchName: string;
    focusMode: ShiftFocusMode;
  };
  operationalMetrics: {
    todayRevenue: number;
    revenueTarget: number;
    targetProgressPct: number;
    activeOrdersCount: number;
    completedCovers: number;
    avgTicketSize: number;
    tableOccupancyPct: number;
    occupiedTablesCount: number;
    totalTablesCount: number;
    kitchenKotAvgTimeMins: number;
    foodCostDriftPct: number;
    wastageLossToday: number;
    healthScore: number;
  };
  staffingStatus: {
    totalActiveStaff: number;
    stationCoverageRatioPct: number;
    shiftLeadName: string;
    shiftNotes: string;
    stations: StationStatus[];
  };
  projectedPeaks: {
    currentPhase: string;
    totalProjectedShiftCovers: number;
    peakRushTime: string;
    windows: ProjectedPeakWindow[];
    prepRecommendations: string[];
  };
  tacticalDirectives: {
    pushItems: TacticalDirectiveItem[];
    watchItems: TacticalDirectiveItem[];
    servicePledges: string[];
  };
  aiBriefing: {
    generatedBy: string;
    strategicMotto: string;
    speechBriefing: string;
    confidenceScore: number;
    aiNotes: string[];
    generatedAt: string;
  };
}

// --- Smart Shift Scheduling Types ---
export type ShiftType = 'LUNCH' | 'DINNER';
export type StationType = 'KITCHEN' | 'SERVICE' | 'CASHIER' | 'STORE';

export interface ShiftSlot {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  dateStr: string;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  projectedCovers: number;
  projectedRevenue: number;
  demandIntensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK_SURGE';
  suggestedStaffCount: {
    kitchen: number;
    service: number;
    cashier: number;
    store: number;
    total: number;
  };
  assignedStaffIds: string[];
  status: 'OPTIMAL' | 'UNDERSTAFFED' | 'OVERSTAFFED';
  riskNote?: string;
}

export interface WeeklyScheduleData {
  weekRange: string;
  totalProjectedCovers: number;
  totalProjectedRevenue: number;
  totalScheduledHours: number;
  estimatedLaborCost: number;
  laborCostPct: number;
  optimalLaborCostPct: number;
  shifts: ShiftSlot[];
  staffRoster: {
    id: string;
    name: string;
    role: RoleType;
    station: StationType;
    avatar: string;
    maxWeeklyHours: number;
    assignedHours: number;
    assignedShiftCount: number;
  }[];
  aiRecommendations: string[];
}

// --- Automated Stock-Level Monitoring & Velocity Types ---
export type StockHealthStatus = 'CRITICAL_OUT' | 'CRITICAL_LOW' | 'LOW_STOCK' | 'OPTIMAL' | 'OVERSTOCK';

export interface StockMonitorAnalysis {
  itemId: string;
  itemName: string;
  sku?: string;
  barcode?: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  optimalStock: number;
  costPerUnit: number;
  supplierId: string;
  supplierName: string;
  storageLocation: string;
  isPerishable: boolean;
  shelfLifeDays: number;
  
  // Sales Velocity Metrics
  dailySalesVelocity: number; // units/day consumed
  weeklySalesVelocity: number; // units/week consumed
  runwayDays: number; // currentStock / dailySalesVelocity
  runwayHours: number;
  runwayDisplay: string; // e.g. "14 hrs" or "2.3 days"
  
  // Health & Color-Coded Badging
  healthStatus: StockHealthStatus;
  badgeLabel: string;
  badgeVariant: 'critical' | 'low' | 'optimal' | 'overstock';
  urgencyLevel: 'CRITICAL' | 'WARNING' | 'HEALTHY' | 'EXCESS';
  stockoutProjectedDate?: string;
  
  // Dynamic Reorder Suggestion (Velocity-Based)
  suggestedReorderQty: number;
  targetCoverageDays: number;
  leadTimeDays: number;
  estimatedReorderCost: number;
  reorderReason: string;
  isAutoReorderRecommended: boolean;
}

export interface StockMonitoringSummary {
  monitoredAt: string;
  totalSKUs: number;
  criticalCount: number;
  lowStockCount: number;
  optimalCount: number;
  overstockCount: number;
  totalEstimatedUrgentReorderCost: number;
  averageRunwayDays: number;
  stockHealthScore: number; // 0 - 100
  topUrgentItems: StockMonitorAnalysis[];
  analyses: StockMonitorAnalysis[];
}

export interface QuickReorderRequest {
  itemId: string;
  quantity: number;
  supplierId?: string;
  branchId?: string;
  notes?: string;
}

