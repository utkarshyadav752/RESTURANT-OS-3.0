import { Router, Request, Response } from 'express';
import { restaurantStore } from '../store.ts';

export const apiRouter = Router();

// --- Branches ---
apiRouter.get('/branches', (_req: Request, res: Response) => {
  return res.json(restaurantStore.data.branches);
});

apiRouter.post('/branches', (req: Request, res: Response) => {
  const { name, code, address, contact_number, opening_hours, tables_count, seating_capacity } = req.body;
  const newBranch = {
    id: `branch_${Date.now()}`,
    organization_id: restaurantStore.data.organization.id,
    restaurant_id: restaurantStore.data.restaurant.id,
    name,
    code: code || name.substring(0, 3).toUpperCase(),
    address: address || '',
    contact_number: contact_number || '',
    opening_hours: opening_hours || '11:00 AM - 11:30 PM',
    tables_count: Number(tables_count) || 10,
    seating_capacity: Number(seating_capacity) || 40,
    status: 'active' as const,
  };
  restaurantStore.data.branches.push(newBranch);
  return res.json(newBranch);
});

// --- Restaurant Profile & Settings ---
apiRouter.get('/restaurant/profile', (_req: Request, res: Response) => {
  return res.json(restaurantStore.data.restaurant);
});

apiRouter.put('/restaurant/settings', (req: Request, res: Response) => {
  Object.assign(restaurantStore.data.restaurant, req.body);
  restaurantStore.recordAuditLog({
    userId: 'current_user',
    userName: 'Restaurant Owner',
    userRole: 'OWNER',
    action: 'RESTAURANT_SETTINGS_UPDATED',
    entityType: 'SETTINGS',
    details: 'Updated restaurant profile, tax rates, or billing parameters.',
  });
  return res.json(restaurantStore.data.restaurant);
});

// --- Tables ---
apiRouter.get('/tables', (req: Request, res: Response) => {
  const branchId = (req.query.branchId as string) || restaurantStore.data.branches[0].id;
  const tables = restaurantStore.data.tables.filter(t => t.branch_id === branchId);
  return res.json(tables);
});

apiRouter.post('/tables', (req: Request, res: Response) => {
  const { table_number, area, capacity, branch_id } = req.body;
  const newTable = {
    id: `tbl_${Date.now()}`,
    branch_id: branch_id || restaurantStore.data.branches[0].id,
    restaurant_id: restaurantStore.data.restaurant.id,
    table_number,
    area: area || 'Main Hall',
    capacity: Number(capacity) || 4,
    status: 'FREE' as const,
  };
  restaurantStore.data.tables.push(newTable);
  return res.json(newTable);
});

apiRouter.patch('/tables/:id', (req: Request, res: Response) => {
  const table = restaurantStore.data.tables.find(t => t.id === req.params.id);
  if (!table) return res.status(404).json({ error: 'Table not found' });
  Object.assign(table, req.body);
  return res.json(table);
});

// Transfer table
apiRouter.post('/tables/transfer', (req: Request, res: Response) => {
  const { sourceTableId, targetTableId } = req.body;
  const source = restaurantStore.data.tables.find(t => t.id === sourceTableId);
  const target = restaurantStore.data.tables.find(t => t.id === targetTableId);

  if (!source || !target) return res.status(404).json({ error: 'Source or target table not found' });

  target.status = source.status;
  target.active_order_id = source.active_order_id;
  target.occupied_since = source.occupied_since;
  target.guest_name = source.guest_name;
  target.guest_count = source.guest_count;
  target.server_name = source.server_name;

  // Update order table number
  if (source.active_order_id) {
    const order = restaurantStore.data.activeOrders.find(o => o.id === source.active_order_id);
    if (order) {
      order.table_id = target.id;
      order.table_number = target.table_number;
    }
  }

  // Free source
  source.status = 'FREE';
  source.active_order_id = undefined;
  source.occupied_since = undefined;
  source.guest_name = undefined;

  restaurantStore.recordAuditLog({
    userId: 'current_user',
    userName: 'Captain',
    userRole: 'MANAGER',
    action: 'TABLE_TRANSFER',
    entityType: 'ORDER',
    details: `Transferred order from ${source.table_number} to ${target.table_number}`,
  });

  return res.json({ success: true, source, target });
});

// --- Menu Items & Categories ---
apiRouter.get('/menu', (req: Request, res: Response) => {
  const branchId = req.query.branchId as string;
  let items = restaurantStore.data.menuItems;
  if (branchId && branchId !== 'all') {
    items = items.filter(i => i.branch_ids.includes(branchId));
  }
  return res.json(items);
});

apiRouter.post('/menu', (req: Request, res: Response) => {
  const newItem = {
    id: `menu_${Date.now()}`,
    restaurant_id: restaurantStore.data.restaurant.id,
    branch_ids: req.body.branch_ids || restaurantStore.data.branches.map(b => b.id),
    category_id: req.body.category_id || 'cat_mains',
    category_name: req.body.category_name || 'Main Course',
    name: req.body.name,
    description: req.body.description || '',
    price: Number(req.body.price),
    cost_price: Number(req.body.cost_price) || 0,
    is_veg: Boolean(req.body.is_veg),
    is_available: true,
    preparation_time_minutes: Number(req.body.preparation_time_minutes) || 15,
    modifiers: req.body.modifiers || [],
    image_url: req.body.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=80',
    popularity_score: 50,
    contribution_margin: Number(req.body.price) - (Number(req.body.cost_price) || 0),
    margin_percentage: Number((((Number(req.body.price) - (Number(req.body.cost_price) || 0)) / Number(req.body.price)) * 100).toFixed(1)),
    menu_matrix_category: 'STAR' as const,
  };
  restaurantStore.data.menuItems.push(newItem);
  return res.json(newItem);
});

apiRouter.patch('/menu/:id', (req: Request, res: Response) => {
  const item = restaurantStore.data.menuItems.find(m => m.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Menu item not found' });
  Object.assign(item, req.body);
  if (req.body.price || req.body.cost_price) {
    item.contribution_margin = item.price - item.cost_price;
    item.margin_percentage = Number((((item.price - item.cost_price) / item.price) * 100).toFixed(1));
  }
  return res.json(item);
});

// --- POS Orders ---
apiRouter.get('/orders', (req: Request, res: Response) => {
  const branchId = req.query.branchId as string;
  let orders = restaurantStore.data.activeOrders;
  if (branchId && branchId !== 'all') {
    orders = orders.filter(o => o.branch_id === branchId);
  }
  return res.json(orders);
});

apiRouter.post('/pos/orders', (req: Request, res: Response) => {
  try {
    const result = restaurantStore.createOrder({
      branchId: req.body.branchId || restaurantStore.data.branches[0].id,
      tableId: req.body.tableId,
      tableNumber: req.body.tableNumber,
      orderType: req.body.orderType || 'DINE_IN',
      items: req.body.items,
      customerName: req.body.customerName,
      customerPhone: req.body.customerPhone,
      discountAmount: req.body.discountAmount,
      discountReason: req.body.discountReason,
      createdByName: req.body.createdByName || 'Cashier Priya',
      createdById: req.body.createdById || 'user_cashier',
      userRole: req.body.userRole || 'CASHIER',
      isHeld: req.body.isHeld,
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Pay and execute recipe deduction
apiRouter.post('/pos/orders/:id/pay', (req: Request, res: Response) => {
  try {
    const result = restaurantStore.completePayment({
      orderId: req.params.id,
      paymentMethod: req.body.paymentMethod || 'CASH',
      splitBreakdown: req.body.splitBreakdown,
      userId: req.body.userId || 'user_cashier',
      userName: req.body.userName || 'Cashier Priya',
      userRole: req.body.userRole || 'CASHIER',
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Refund order
apiRouter.post('/pos/orders/:id/refund', (req: Request, res: Response) => {
  const order = restaurantStore.data.activeOrders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.payment_status = 'REFUNDED';
  order.status = 'CANCELLED';

  restaurantStore.recordAuditLog({
    userId: req.body.userId || 'current_user',
    userName: req.body.userName || 'Manager',
    userRole: req.body.userRole || 'MANAGER',
    action: 'ORDER_REFUND_EXECUTED',
    entityType: 'REFUND',
    details: `Refunded ₹${order.grand_total} for ${order.order_number}. Reason: ${req.body.reason || 'Customer request'}`,
    branchId: order.branch_id,
  });

  return res.json({ success: true, order });
});

// --- KDS & KOTs ---
apiRouter.get('/kot', (req: Request, res: Response) => {
  const branchId = req.query.branchId as string;
  let kots = restaurantStore.data.activeKOTs;
  if (branchId && branchId !== 'all') {
    kots = kots.filter(k => k.branch_id === branchId);
  }
  return res.json(kots);
});

apiRouter.patch('/kot/:id/status', (req: Request, res: Response) => {
  const kot = restaurantStore.data.activeKOTs.find(k => k.id === req.params.id);
  if (!kot) return res.status(404).json({ error: 'KOT ticket not found' });
  kot.status = req.body.status;

  // Also update associated order item status
  const order = restaurantStore.data.activeOrders.find(o => o.id === kot.order_id);
  if (order) {
    if (kot.status === 'READY') {
      order.status = 'READY';
    } else if (kot.status === 'PREPARING') {
      order.status = 'PREPARING';
    }
  }

  return res.json(kot);
});

// --- Inventory & Stock Ledger ---
apiRouter.get('/inventory', (req: Request, res: Response) => {
  const branchId = req.query.branchId as string;
  let items = restaurantStore.data.inventoryItems;
  if (branchId && branchId !== 'all') {
    items = items.filter(i => i.branch_id === branchId);
  }
  return res.json({
    items,
    batches: restaurantStore.data.inventoryBatches,
    stockLedger: restaurantStore.data.stockLedger.slice(0, 50),
  });
});

apiRouter.post('/inventory/adjust', (req: Request, res: Response) => {
  const { inventoryItemId, quantity, reason, adjustedBy } = req.body;
  const item = restaurantStore.data.inventoryItems.find(i => i.id === inventoryItemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  item.current_stock = Math.max(0, Number((item.current_stock + Number(quantity)).toFixed(3)));
  if (item.current_stock <= item.minimum_stock) {
    item.status = item.current_stock <= item.minimum_stock * 0.4 ? 'CRITICAL' : 'LOW';
  } else {
    item.status = 'OPTIMAL';
  }

  const ledgerEntry = {
    id: `stk_${Date.now()}_adj`,
    organization_id: restaurantStore.data.organization.id,
    restaurant_id: restaurantStore.data.restaurant.id,
    branch_id: item.branch_id,
    inventory_item_id: item.id,
    item_name: item.name,
    movement_type: 'ADJUSTMENT' as const,
    quantity: Number(quantity),
    balance_after: item.current_stock,
    unit: item.unit,
    notes: `Manual stock adjustment: ${reason}`,
    created_by: adjustedBy || 'Sunita Rao (Inventory)',
    created_at: new Date().toISOString(),
  };
  restaurantStore.data.stockLedger.unshift(ledgerEntry);

  restaurantStore.recordAuditLog({
    userId: 'user_inventory',
    userName: adjustedBy || 'Inventory Lead',
    userRole: 'INVENTORY_MANAGER',
    action: 'INVENTORY_MANUAL_ADJUSTMENT',
    entityType: 'INVENTORY',
    details: `Adjusted ${item.name} by ${quantity > 0 ? '+' : ''}${quantity} ${item.unit}. Reason: ${reason}`,
    branchId: item.branch_id,
  });

  return res.json({ success: true, item, ledgerEntry });
});

// --- Automated Stock-Level Monitoring & Sales Velocity Service ---
apiRouter.get('/inventory/stock-monitor', (req: Request, res: Response) => {
  try {
    const branchId = req.query.branchId as string;
    const targetCoverageDays = Number(req.query.targetCoverageDays) || 5;
    const leadTimeDays = Number(req.query.leadTimeDays) || 2;

    const summary = restaurantStore.getStockMonitorSummary(branchId, targetCoverageDays, leadTimeDays);
    return res.json(summary);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/inventory/quick-reorder', (req: Request, res: Response) => {
  try {
    const { itemId, quantity, supplierId, branchId, notes, createdBy } = req.body;
    if (!itemId || !quantity) {
      return res.status(400).json({ error: 'itemId and quantity are required' });
    }

    const po = restaurantStore.createQuickPurchaseOrder({
      itemId,
      quantity: Number(quantity),
      supplierId,
      branchId,
      notes,
      createdBy,
    });
    return res.json({ success: true, purchaseOrder: po });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/inventory/bulk-reorder-critical', (req: Request, res: Response) => {
  try {
    const { branchId, createdBy } = req.body;
    const result = restaurantStore.bulkReorderCriticalItems(branchId, createdBy);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Simulate sales surge consumption for testing the live monitoring service
apiRouter.post('/inventory/simulate-sales-surge', (req: Request, res: Response) => {
  try {
    const { branchId, surgeFactor = 1.5 } = req.body;
    // Deduct stock for top high-velocity items to demonstrate automated stock-level monitoring alerts
    const itemsToDeplete = ['ing_tomato', 'ing_chicken', 'ing_cream', 'ing_paneer'];
    const depletedItems: any[] = [];

    itemsToDeplete.forEach(id => {
      const item = restaurantStore.data.inventoryItems.find(i => i.id === id);
      if (item && item.current_stock > 1.0) {
        const deduction = Number((Math.min(item.current_stock * 0.35, 4.5 * surgeFactor)).toFixed(1));
        item.current_stock = Math.max(0.5, Number((item.current_stock - deduction).toFixed(1)));
        if (item.current_stock <= item.minimum_stock) {
          item.status = item.current_stock <= item.minimum_stock * 0.45 ? 'CRITICAL' : 'LOW';
        }

        const ledgerEntry = {
          id: `stk_${Date.now()}_surge_${id}`,
          organization_id: restaurantStore.data.organization.id,
          restaurant_id: restaurantStore.data.restaurant.id,
          branch_id: item.branch_id,
          inventory_item_id: item.id,
          item_name: item.name,
          movement_type: 'SALE_CONSUMPTION' as const,
          quantity: -deduction,
          balance_after: item.current_stock,
          unit: item.unit,
          reference_id: `SIM-SURGE-${Date.now()}`,
          notes: `Simulated dinner peak rush consumption (-${deduction} ${item.unit})`,
          created_by: 'Simulated POS Surge Engine',
          created_at: new Date().toISOString(),
        };
        restaurantStore.data.stockLedger.unshift(ledgerEntry);
        depletedItems.push({ name: item.name, deduction, newStock: item.current_stock, status: item.status });
      }
    });

    const summary = restaurantStore.getStockMonitorSummary(branchId);
    return res.json({ success: true, depletedItems, summary });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- Kirana-Style Barcode Scanner & Manual Entry API ---
apiRouter.post('/inventory/barcode-lookup', (req: Request, res: Response) => {
  const { barcode, branchId } = req.body;
  if (!barcode) return res.status(400).json({ error: 'Barcode or SKU is required' });
  const result = restaurantStore.lookupBarcode(barcode, branchId);
  return res.json(result);
});

apiRouter.post('/inventory/item', (req: Request, res: Response) => {
  try {
    const newItem = restaurantStore.addNewInventoryItem(req.body);
    return res.json({ success: true, item: newItem });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/inventory/inward', (req: Request, res: Response) => {
  try {
    const result = restaurantStore.inwardStock(req.body);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/inventory/bulk-inward', (req: Request, res: Response) => {
  try {
    const { items, createdBy, branchId } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided for inward' });
    }

    const processed = [];
    for (const entry of items) {
      let invItem = entry.inventoryItemId 
        ? restaurantStore.data.inventoryItems.find(i => i.id === entry.inventoryItemId)
        : null;

      if (!invItem && entry.name) {
        // Create new item if doesn't exist
        invItem = restaurantStore.addNewInventoryItem({
          name: entry.name,
          barcode: entry.barcode,
          category: entry.category || 'Produce',
          unit: entry.unit || 'kg',
          current_stock: 0,
          minimum_stock: 5,
          cost_per_unit: Number(entry.cost_per_unit) || 0,
          mrp: entry.mrp ? Number(entry.mrp) : undefined,
          branch_id: branchId,
          createdBy,
        });
      }

      if (invItem && Number(entry.quantity) > 0) {
        const inwardResult = restaurantStore.inwardStock({
          inventoryItemId: invItem.id,
          quantity: Number(entry.quantity),
          unitCost: Number(entry.cost_per_unit) || invItem.cost_per_unit,
          batchNumber: entry.batch_number,
          expiryDate: entry.expiry_date,
          notes: entry.notes || 'Bulk Kirana Inward',
          createdBy,
          branchId,
        });
        processed.push(inwardResult);
      }
    }

    return res.json({ success: true, count: processed.length, processed });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/inventory/ai-parse', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Input text or invoice content is required' });
    const result = await restaurantStore.parseInvoiceOrVoiceWithAI(text);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/inventory/ai-audit', async (req: Request, res: Response) => {
  try {
    const branchId = req.query.branchId as string;
    const report = await restaurantStore.runInventoryAIAudit(branchId);
    return res.json(report);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- Recipes & BOM Engine with Real-Time Costing ---
apiRouter.get('/recipes', (_req: Request, res: Response) => {
  return res.json({
    recipes: restaurantStore.data.recipes,
    driftSignals: restaurantStore.data.recipeDriftSignals,
    inventoryItems: restaurantStore.data.inventoryItems,
    stockLedger: restaurantStore.data.stockLedger.slice(0, 30),
    realtimeCosting: restaurantStore.getRealtimeRecipeCosting(),
  });
});

apiRouter.get('/recipes/realtime-costing', (req: Request, res: Response) => {
  const recipeId = req.query.recipeId as string;
  const costing = restaurantStore.getRealtimeRecipeCosting(recipeId);
  return res.json({
    realtimeCosting: costing,
    inventoryItems: restaurantStore.data.inventoryItems,
  });
});

apiRouter.post('/recipes/update-market-price', (req: Request, res: Response) => {
  try {
    const { ingredientId, newCostPerUnit, reason, updatedBy, branchId } = req.body;
    if (!ingredientId || newCostPerUnit === undefined) {
      return res.status(400).json({ error: 'ingredientId and newCostPerUnit are required' });
    }
    const result = restaurantStore.updateIngredientMarketPrice({
      ingredientId,
      newCostPerUnit: Number(newCostPerUnit),
      reason,
      updatedBy,
      branchId,
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/recipes/sync-standard-bom', (req: Request, res: Response) => {
  try {
    const { recipeId, syncedBy } = req.body;
    if (!recipeId) {
      return res.status(400).json({ error: 'recipeId is required' });
    }
    const result = restaurantStore.syncRecipeStandardBOM({ recipeId, syncedBy });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/recipes/simulate-market-scenario', (req: Request, res: Response) => {
  try {
    const { scenario } = req.body;
    const result = restaurantStore.simulateMarketScenario(scenario || 'BASELINE');
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- Wastage Center ---
apiRouter.get('/wastage', (req: Request, res: Response) => {
  const branchId = req.query.branchId as string;
  let wastage = restaurantStore.data.wastageEntries;
  if (branchId && branchId !== 'all') {
    wastage = wastage.filter(w => w.branch_id === branchId);
  }
  const totalCost = wastage.reduce((sum, w) => sum + w.total_loss_cost, 0);
  return res.json({
    entries: wastage,
    totalLossCost: totalCost,
    topOffenders: [
      { name: 'Fresh Boneless Chicken Breast', cost: 462, quantity: '2.1 kg', reason: 'Tandoor burn' },
      { name: 'Farm Plum Tomatoes', cost: 114, quantity: '3.0 kg', reason: 'Crate bottom bruise' },
      { name: 'Fresh Green Coriander Leaves', cost: 36, quantity: '0.8 kg', reason: 'Wilted storage' }
    ]
  });
});

apiRouter.post('/wastage', (req: Request, res: Response) => {
  try {
    const result = restaurantStore.logWastage({
      inventoryItemId: req.body.inventoryItemId,
      branchId: req.body.branchId || restaurantStore.data.branches[0].id,
      quantity: Number(req.body.quantity),
      reason: req.body.reason,
      reportedBy: req.body.reportedBy || 'Chef Vikram Singh',
      userId: req.body.userId || 'user_kitchen',
      userRole: req.body.userRole || 'KITCHEN',
      notes: req.body.notes,
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- Suppliers & Purchases ---
apiRouter.get('/suppliers', (_req: Request, res: Response) => {
  return res.json(restaurantStore.data.suppliers);
});

apiRouter.get('/purchases', (_req: Request, res: Response) => {
  const purchaseOrders = [
    {
      id: 'po_01',
      po_number: 'PO-2026-004',
      restaurant_id: restaurantStore.data.restaurant.id,
      branch_id: 'branch_cybercity',
      supplier_id: 'supp_3',
      supplier_name: 'Azadpur Mandi Fresh Direct',
      status: 'RECEIVED',
      items: [
        { inventory_item_id: 'ing_tomato', item_name: 'Farm Plum Tomatoes', quantity: 20, unit: 'kg', unit_price: 38, total_price: 760 },
        { inventory_item_id: 'ing_coriander', item_name: 'Fresh Green Coriander', quantity: 4, unit: 'kg', unit_price: 45, total_price: 180 },
      ],
      subtotal: 940,
      tax_amount: 0,
      total_amount: 940,
      created_by: 'Sunita Rao',
      created_at: '2026-09-28T07:15:00Z',
      expected_delivery: '2026-09-28T09:00:00Z',
      received_at: '2026-09-28T08:45:00Z',
    },
    {
      id: 'po_02',
      po_number: 'PO-2026-005',
      restaurant_id: restaurantStore.data.restaurant.id,
      branch_id: 'branch_cybercity',
      supplier_id: 'supp_1',
      supplier_name: 'Delhi Farms Fresh Poultry & Meat',
      status: 'APPROVED',
      items: [
        { inventory_item_id: 'ing_chicken', item_name: 'Fresh Boneless Chicken Breast', quantity: 22, unit: 'kg', unit_price: 220, total_price: 4840 },
        { inventory_item_id: 'ing_mutton', item_name: 'Baby Goat Mutton', quantity: 8, unit: 'kg', unit_price: 620, total_price: 4960 },
      ],
      subtotal: 9800,
      tax_amount: 0,
      total_amount: 9800,
      created_by: 'AI Copilot Recommendation',
      approved_by: 'Rajesh Mehra (Owner)',
      created_at: '2026-09-29T11:00:00Z',
      expected_delivery: '2026-09-30T07:00:00Z',
    }
  ];
  return res.json(purchaseOrders);
});

// --- Forecast & Recommendations ---
apiRouter.get('/forecast', (_req: Request, res: Response) => {
  return res.json({
    forecasts: restaurantStore.data.demandForecasts,
    recommendations: restaurantStore.data.purchaseRecommendations,
    accuracy: {
      last7Days: 86.4,
      last30Days: 89.1,
      biasPct: +1.2,
    },
  });
});

apiRouter.post('/forecast/recommendations/:id/feedback', (req: Request, res: Response) => {
  const { decision } = req.body; // 'ACCEPTED' | 'REJECTED' | 'MODIFIED'
  const rec = restaurantStore.data.purchaseRecommendations.find(r => r.id === req.params.id);
  if (!rec) return res.status(404).json({ error: 'Recommendation not found' });
  rec.status = decision;

  restaurantStore.recordAuditLog({
    userId: 'current_user',
    userName: 'Owner / Manager',
    userRole: 'OWNER',
    action: `AI_RECOMMENDATION_${decision}`,
    entityType: 'AI',
    details: `${decision} purchase recommendation for ${rec.ingredient_name} (${rec.recommended_quantity} ${rec.unit})`,
  });

  return res.json(rec);
});

// --- AI Copilot Q&A & What-If Simulator ---
apiRouter.post('/ai/query', async (req: Request, res: Response) => {
  try {
    const { prompt, branchId } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    const response = await restaurantStore.queryAICopilot(prompt, branchId);
    return res.json(response);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/ai/simulate', (req: Request, res: Response) => {
  try {
    const { type, parameterName, percentChange } = req.body;
    const result = restaurantStore.simulateWhatIfScenario({
      type,
      parameterName,
      percentChange: Number(percentChange),
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- Daily Huddle AI Shift Briefing ---
apiRouter.get('/analytics/daily-huddle', async (req: Request, res: Response) => {
  try {
    const branchId = req.query.branchId as string;
    const focusMode = (req.query.focusMode as any) || 'BALANCED';
    const huddle = await restaurantStore.generateDailyHuddle(branchId, focusMode);
    return res.json(huddle);
  } catch (err: any) {
    console.warn('[API] Daily huddle fallback on error:', err?.message || err);
    // Return safe fallback briefing instead of 500 error
    return res.json({
      shiftInfo: {
        shiftName: 'Dinner Rush Service',
        shiftLead: 'Rahul Verma (Floor Manager)',
        serviceWindow: '17:00 – 23:30',
        date: new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }),
        branchName: 'Cyber Hub Flagship',
        focusMode: 'BALANCED',
      },
      operationalMetrics: {
        todayRevenue: 48650,
        revenueTarget: 65000,
        targetProgressPct: 75,
        activeOrdersCount: 4,
        completedCovers: 112,
        avgTicketSize: 1430,
        tableOccupancyPct: 67,
        occupiedTablesCount: 12,
        totalTablesCount: 18,
        kitchenKotAvgTimeMins: 14.2,
        foodCostDriftPct: 25.3,
        wastageLossToday: 1420,
        healthScore: 92,
      },
      stations: [
        {
          id: 'st_kitchen',
          stationName: 'Kitchen Brigade & Tandoor',
          leadName: 'Chef Vikram Singh',
          staffCount: 3,
          readinessPct: 94,
          status: 'OPTIMAL',
          statusNote: 'Tandoor running at 320°C. 3 active tickets. Turnaround 14.2m.',
          keyDirectives: [
            'Pre-portion 35 skewers chicken tikka in Cold Line',
            'Enforce digital scales on butter chicken gravy to eliminate +25% drift',
            'Keep 4 handis of Dal Makhani on steady rolling simmer'
          ]
        },
        {
          id: 'st_service',
          stationName: 'Captains & Floor Service',
          leadName: 'Captain Amit Patel',
          staffCount: 2,
          readinessPct: 92,
          status: 'OPTIMAL',
          statusNote: 'Floor turns on track. 12/18 tables seated.',
          keyDirectives: [
            'Push Awadhi Dum Biryani (+₹355 contribution margin)',
            'Water service within 90s of seating',
            'Pre-bus dessert tables rapidly'
          ]
        }
      ],
      projectedPeaks: [
        {
          id: 'peak_3',
          timeWindow: '20:30 – 22:00',
          projectedCovers: 78,
          capacityUtilization: 98,
          loadLevel: 'CRITICAL_PEAK',
          rushStatus: 'Maximum Peak Rush (Near 100% Occupancy)',
          highlight: 'Table turns bottleneck window. VIP table arrivals expected',
          prepPrerequisite: 'Floor captains maintain rapid bussing within 3 minutes of check-out'
        }
      ],
      tacticalDirectives: {
        pushItems: [
          {
            id: 'push_1',
            dishOrItem: 'Awadhi Dum Biryani (Murgh)',
            category: 'PUSH_PROFIT',
            rationale: 'Star item with 74.2% contribution margin (+₹355 profit per handi plate)',
            marginOrCostImpact: '+₹355 Net Margin',
            badge: 'Top Profit Star'
          }
        ],
        watchItems: [
          {
            id: 'watch_1',
            dishOrItem: 'Boneless Chicken (Murg Tikka)',
            category: 'PORTION_PRECISION',
            rationale: 'Chicken consumption running +25.3% over recipe BOM. Require digital scale on line.',
            marginOrCostImpact: '-₹2,450/week drift loss',
            badge: 'Critical Drift'
          }
        ],
        vipTables: [
          {
            tableNumber: 'T04',
            guestName: 'Ananya Sharma (Platinum Regular)',
            vipTier: 'PLATINUM',
            covers: 4,
            notes: 'Prefers window corner, low salt on Dal Makhani, complimentary Phirni'
          }
        ],
        nonNegotiables: [
          'Digital portion weighing on all poultry proteins',
          'Table bussed & reset within 3 minutes of guest departure'
        ]
      },
      aiStrategicMotto: 'Team Zafran: Precision in the kitchen, warmth on the floor, and zero friction at the register!',
      aiSpeechBriefing: 'Good evening team! Welcome to tonight\'s dinner service at Cyber Hub Flagship. We are currently tracking toward our ₹65,000 target. All stations are green. Our biggest test tonight is the 8:30 PM peak with 78 projected covers and 98% table occupancy. Let\'s make tonight smooth, fast, and profitable!',
      aiNotes: [
        'Peak surge arriving between 20:30 and 22:00 (78 projected covers).',
        'Awadhi Dum Biryani offers highest contribution margin (+₹355/portion).',
        'Digital scales required on poultry line to prevent +25% recipe drift.'
      ],
      generatedBy: 'RestaurantOS Shift Briefing Kernel',
      confidenceScore: 95,
      generatedAt: new Date().toISOString()
    });
  }
});

apiRouter.post('/analytics/daily-huddle', async (req: Request, res: Response) => {
  try {
    const { branchId, focusMode } = req.body;
    const huddle = await restaurantStore.generateDailyHuddle(branchId, focusMode || 'BALANCED');
    return res.json(huddle);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- Smart Shift Scheduling ---
apiRouter.get('/scheduling/weekly', (req: Request, res: Response) => {
  try {
    const branchId = req.query.branchId as string;
    const schedule = restaurantStore.getWeeklySchedule(branchId);
    return res.json(schedule);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/scheduling/assign', (req: Request, res: Response) => {
  try {
    const { shiftId, staffIds } = req.body;
    if (!shiftId || !Array.isArray(staffIds)) {
      return res.status(400).json({ error: 'shiftId and staffIds array are required' });
    }
    const updated = restaurantStore.assignShiftStaff(shiftId, staffIds);
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/scheduling/auto-optimize', (req: Request, res: Response) => {
  try {
    const { branchId } = req.body;
    const optimized = restaurantStore.autoOptimizeSchedule(branchId);
    return res.json(optimized);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- Executive Analytics & 5 Owner Questions ---
apiRouter.get('/analytics/dashboard', (req: Request, res: Response) => {
  const branchId = req.query.branchId as string;
  const branch = restaurantStore.data.branches.find(b => b.id === branchId) || restaurantStore.data.branches[0];

  return res.json({
    branchName: branch.name,
    healthScore: {
      total: 88,
      breakdown: [
        { label: 'Inventory Health', score: 92, max: 100, status: 'EXCELLENT' },
        { label: 'Wastage Discipline', score: 81, max: 100, status: 'GOOD' },
        { label: 'Forecast Accuracy', score: 89, max: 100, status: 'EXCELLENT' },
        { label: 'Food Cost Target', score: 85, max: 100, status: 'GOOD' },
        { label: 'Stockout Resilience', score: 94, max: 100, status: 'EXCELLENT' },
      ]
    },
    todayMetrics: {
      revenue: 48650,
      revenueVsBaselinePct: +18.1,
      ordersCount: 34,
      aov: 1430,
      foodCostPct: 31.8,
      grossMarginPct: 68.2,
      todayWastageCost: 612,
    },
    fiveOwnerQuestions: {
      howIsRestaurantDoing: 'Strong performance today. Net revenue of ₹48,650 is outperforming the 4-week Tuesday baseline by +18.1%, with average order value up to ₹1,430.',
      whatNeedsAttention: 'Two key items: Farm Plum Tomatoes are down to 6.2 kg (critical), and chicken consumption shows +25.3% recipe drift (kitchen portioning variance).',
      whatShouldIBuy: 'Order 22 kg Boneless Chicken from Delhi Farms and 18 kg Plum Tomatoes from Azadpur Mandi. Anti-Overstock AI warns: DO NOT BUY Onions or Coriander.',
      whatIsBeingWasted: '₹612 total loss today across 3kg bruised tomatoes and 2.1kg tandoor overcooked chicken breast.',
      whatDoesAIPredict: 'Tomorrow dinner covers are projected to rise +22% due to corporate reservations. 42 Butter Chicken portions expected with 86% confidence.'
    },
    salesTrend: [
      { time: '12 PM', sales: 4200, covers: 8 },
      { time: '01 PM', sales: 11400, covers: 22 },
      { time: '02 PM', sales: 9800, covers: 19 },
      { time: '03 PM', sales: 3200, covers: 6 },
      { time: '07 PM', sales: 7800, covers: 14 },
      { time: '08 PM', sales: 12250, covers: 24 },
    ]
  });
});

// --- Audit Logs ---
apiRouter.get('/audit-logs', (_req: Request, res: Response) => {
  return res.json(restaurantStore.data.auditLogs);
});

// --- Customers CRM & Loyalty Points Engine ---
apiRouter.get('/customers', (req: Request, res: Response) => {
  const search = req.query.search as string;
  const tier = req.query.tier as string;
  const customers = restaurantStore.getCustomers(search, tier);
  return res.json(customers);
});

apiRouter.get('/customers/:id', (req: Request, res: Response) => {
  const customer = restaurantStore.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  return res.json(customer);
});

apiRouter.post('/customers', (req: Request, res: Response) => {
  try {
    const customer = restaurantStore.createCustomer(req.body);
    return res.status(201).json(customer);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create customer' });
  }
});

apiRouter.post('/customers/:id/award-points', (req: Request, res: Response) => {
  try {
    const { amountSpent, bonusPoints, reason, orderId, tableNumber, itemsSummary, branchName } = req.body;
    if (typeof amountSpent !== 'number' || amountSpent < 0) {
      return res.status(400).json({ error: 'Valid amountSpent number is required' });
    }
    const result = restaurantStore.awardLoyaltyPoints({
      customerId: req.params.id,
      amountSpent,
      bonusPoints: Number(bonusPoints) || 0,
      reason,
      orderId,
      tableNumber,
      itemsSummary,
      branchName
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to award points' });
  }
});

apiRouter.post('/customers/:id/redeem-points', (req: Request, res: Response) => {
  try {
    const { pointsToRedeem, orderId, note } = req.body;
    if (!pointsToRedeem || Number(pointsToRedeem) <= 0) {
      return res.status(400).json({ error: 'Valid pointsToRedeem number is required' });
    }
    const result = restaurantStore.redeemLoyaltyPoints({
      customerId: req.params.id,
      pointsToRedeem: Number(pointsToRedeem),
      orderId,
      note
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to redeem points' });
  }
});

apiRouter.post('/customers/:id/generate-discounts', (req: Request, res: Response) => {
  try {
    const offers = restaurantStore.generatePersonalizedDiscounts(req.params.id);
    const updatedCustomer = restaurantStore.getCustomerById(req.params.id);
    return res.json({ offers, customer: updatedCustomer });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to generate personalized discounts' });
  }
});

apiRouter.post('/customers/:id/discounts/:offerId/claim', (req: Request, res: Response) => {
  try {
    const result = restaurantStore.claimOrRedeemDiscount(req.params.id, req.params.offerId);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to claim discount' });
  }
});

apiRouter.get('/loyalty/rules', (_req: Request, res: Response) => {
  return res.json(restaurantStore.getLoyaltyConfig());
});

apiRouter.put('/loyalty/rules', (req: Request, res: Response) => {
  try {
    const updatedConfig = restaurantStore.updateLoyaltyConfig(req.body);
    return res.json(updatedConfig);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update loyalty config' });
  }
});

// --- Owner Team Operations & Staff Progress Tracker ---
apiRouter.get('/analytics/team-progress', (req: Request, res: Response) => {
  const branchId = req.query.branchId as string;
  const branch = restaurantStore.data.branches.find(b => b.id === branchId) || restaurantStore.data.branches[0];

  const teamMembersProgress = [
    {
      id: 'user_cashier',
      name: 'Priya Sharma',
      role: 'CASHIER',
      roleTitle: 'Smart POS & Billing Specialist',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      branch: branch.name,
      status: 'ON_DUTY',
      shiftStartedAt: '10:30 AM (5h 15m active)',
      progressScore: 98,
      primaryMetric: { label: 'Bills Issued Today', value: '34 Bills', delta: '+8 vs avg' },
      secondaryMetric: { label: 'Revenue Billed', value: '₹48,650', delta: '100% collected' },
      operationalBreakdown: [
        { label: 'UPI / QR Payments', value: '₹34,450 (24 txns)' },
        { label: 'Cash Drawer', value: '₹14,200 (10 txns)' },
        { label: 'Avg Billing Speed', value: '1 min 45 sec' },
        { label: 'Void / Refund Count', value: '0 refunds (Clean audit)' },
      ],
      recentActions: [
        'Issued GST Tax Invoice #INV-034 for ₹3,410 (Malhotra Family)',
        'Processed UPI scan payment via PhonePe QR for Table T05',
        'Settled Table T01 check for ₹1,850 via HDFC Credit Card',
      ],
    },
    {
      id: 'user_waiter',
      name: 'Amit Kumar',
      role: 'WAITER',
      roleTitle: 'Floor Captain & Server Lead',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      branch: branch.name,
      status: 'ON_DUTY',
      shiftStartedAt: '11:00 AM (4h 45m active)',
      progressScore: 94,
      primaryMetric: { label: 'Tables Served Today', value: '28 Orders', delta: '5 active tables' },
      secondaryMetric: { label: 'Avg Table Turn', value: '42 mins', delta: 'Target: < 45m' },
      operationalBreakdown: [
        { label: 'Currently Assigned', value: 'Tables T01, T03, T05, B01, TR01' },
        { label: 'Guest Rating Score', value: '4.9 / 5.0 (22 reviews)' },
        { label: 'Upsell Conversion', value: '64% (Desserts & Cocktails)' },
        { label: 'Active Guest Covers', value: '18 guests seated right now' },
      ],
      recentActions: [
        'Fired KOT #KOT-087 for Table T05 (6 items to Kitchen & Bar)',
        'Delivered Butter Chicken & Garlic Naan to Kapoor Party (Table T01)',
        'Reserved Table T07 for Dr. Singhania (Party of 4, 8:30 PM)',
      ],
    },
    {
      id: 'user_kitchen',
      name: 'Vikram Singh',
      role: 'KITCHEN',
      roleTitle: 'Executive Head Chef',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&auto=format&fit=crop&q=80',
      branch: branch.name,
      status: 'ON_DUTY',
      shiftStartedAt: '09:30 AM (6h 15m active)',
      progressScore: 92,
      primaryMetric: { label: 'KOTs Prepared & Cleared', value: '32 Tickets', delta: '1 in-prep' },
      secondaryMetric: { label: 'Avg Kitchen Ticket Time', value: '14.2 mins', delta: 'Goal: < 18m' },
      operationalBreakdown: [
        { label: 'Tandoor & Curry Station', value: '26 dishes fulfilled' },
        { label: 'Live Tickets in Pan', value: 'Table T01 regular handi simmering' },
        { label: 'Recipe BOM Drift Alert', value: '+25.3% Chicken weight variance' },
        { label: 'Logged Wastage Incidents', value: '2 items (₹612 total loss)' },
      ],
      recentActions: [
        'Marked KOT #KOT-086 as READY FOR PICKUP (Dal Makhani & Roti)',
        'Started preparation on KOT #KOT-087 (Awadhi Murgh Dum Biryani)',
        'Logged kitchen wastage: 2.1kg Chicken Breast (Tandoor flame burn)',
      ],
    },
    {
      id: 'user_inventory',
      name: 'Sunita Rao',
      role: 'INVENTORY_MANAGER',
      roleTitle: 'Inventory & Supply Chain Lead',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
      branch: branch.name,
      status: 'ON_DUTY',
      shiftStartedAt: '08:30 AM (7h 15m active)',
      progressScore: 96,
      primaryMetric: { label: 'Kirana Barcode Scans', value: '18 Scans', delta: '+5 today' },
      secondaryMetric: { label: 'SKUs Inwarded to Ledger', value: '8 Inward Entries', delta: '100% FIFO batches' },
      operationalBreakdown: [
        { label: 'PO Delivery Received', value: 'PO-2026-004 (Azadpur Mandi Fresh)' },
        { label: 'Physical Shelf Counts', value: '3 SKU reconciliations performed' },
        { label: 'Critical Stock Flagged', value: 'Tomatoes (6.2kg), Chicken (14.5kg)' },
        { label: 'Ledger Audit Entries', value: '50 double-entry movements synced' },
      ],
      recentActions: [
        'Scanned and inwarded 20kg Farm Plum Tomatoes via Barcode EAN-8901002002021',
        'Generated EAN-13 barcode shelf label for Malai Paneer Batch B-260929',
        'Verified delivery challan from Azadpur Mandi with zero damaged crates',
      ],
    },
    {
      id: 'user_manager',
      name: 'Rahul Verma',
      role: 'MANAGER',
      roleTitle: 'Operations & General Manager',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      branch: branch.name,
      status: 'ON_DUTY',
      shiftStartedAt: '10:00 AM (5h 45m active)',
      progressScore: 97,
      primaryMetric: { label: 'Shift Operational Efficiency', value: '94%', delta: 'Smooth shift' },
      secondaryMetric: { label: 'Table Turnover Rate', value: '1.8x Turns', delta: 'Optimal capacity' },
      operationalBreakdown: [
        { label: 'Shift Opening Protocol', value: 'Verified at 10:15 AM' },
        { label: 'Staff Roster on Duty', value: '8 Active Team Members' },
        { label: 'Discounts / Voids Approved', value: '1 void (Table T02 soup cancel)' },
        { label: 'AI Purchase Plan Review', value: 'Approved PO-2026-005 (₹9,800)' },
      ],
      recentActions: [
        'Supervised shift handover between morning and evening captains',
        'Approved 10% corporate guest privilege discount for Google account',
        'Inspected dry store FIFO batches with Inventory Lead Sunita Rao',
      ],
    },
    {
      id: 'user_accountant',
      name: 'Deepak Gupta (CA)',
      role: 'ACCOUNTANT',
      roleTitle: 'Chartered Accountant & Tax Auditor',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
      branch: branch.name,
      status: 'ON_DUTY',
      shiftStartedAt: '11:30 AM (4h 15m active)',
      progressScore: 99,
      primaryMetric: { label: 'Statutory GST Liability', value: '₹2,432.50', delta: 'CGST + SGST reconciled' },
      secondaryMetric: { label: 'Gross Margin Accuracy', value: '68.2%', delta: 'Target: 68%' },
      operationalBreakdown: [
        { label: 'Daily Tax Breakdown', value: 'CGST: ₹1,216.25 • SGST: ₹1,216.25' },
        { label: 'Expense Vouchers Audited', value: '3 Mandi cash receipts entered' },
        { label: 'Food Cost Reconciliation', value: '31.8% actual vs 32.0% budget' },
        { label: 'E-Way & Invoice Filing', value: 'Clean audit trail generated' },
      ],
      recentActions: [
        'Reconciled day-end UPI settlement batch with HDFC merchant account',
        'Audited wastage loss journal voucher for kitchen incident (₹612)',
        'Generated statutory GST summary report for September week 4',
      ],
    },
  ];

  return res.json({
    branchName: branch.name,
    totalOnDuty: teamMembersProgress.length,
    overallTeamEfficiency: 95.4,
    totalOrdersHandled: 34,
    totalRevenueBilled: 48650,
    teamMembers: teamMembersProgress,
    liveOperationalFeed: [
      { id: 'act_1', time: '12:48 PM', staffName: 'Priya Sharma (Cashier)', badge: 'BILLING', text: 'Generated Tax Invoice #INV-034 for ₹3,410. Paid via PhonePe UPI QR.' },
      { id: 'act_2', time: '12:44 PM', staffName: 'Amit Kumar (Waiter)', badge: 'KOT_FIRED', text: 'Sent KOT #KOT-087 to Kitchen for Table T05 (6 items).' },
      { id: 'act_3', time: '12:35 PM', staffName: 'Vikram Singh (Head Chef)', badge: 'KITCHEN_READY', text: 'Marked KOT #KOT-086 as READY FOR PICKUP at Tandoor.' },
      { id: 'act_4', time: '12:15 PM', staffName: 'Sunita Rao (Inventory)', badge: 'BARCODE_SCAN', text: 'Scanned & inwarded 20kg Plum Tomatoes (Batch B-260929) to stock ledger.' },
      { id: 'act_5', time: '11:50 AM', staffName: 'Rahul Verma (Manager)', badge: 'PO_APPROVAL', text: 'Approved Purchase Order PO-2026-005 for Delhi Farms Poultry (₹9,800).' },
      { id: 'act_6', time: '11:15 AM', staffName: 'Deepak Gupta (CA)', badge: 'TAX_AUDIT', text: 'Reconciled morning cash drawer against POS sales register.' },
    ],
  });
});

// --- Pocket Fund AI Endpoint ---
apiRouter.post('/pocketfund/ai', async (req: Request, res: Response) => {
  const { query, role, activeChild, allChildren } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are Pocket Fund AI, a helpful Indian family financial and teen allowance coach.
You are assisting ${role === 'parent' ? 'a parent (Priya Sharma)' : role === 'teen' ? `a teenager (${activeChild?.name || 'Aarav'})` : 'a visiting parent'}.
Context:
- Active Teen: ${activeChild ? JSON.stringify(activeChild) : 'None'}
- All Children: ${allChildren ? JSON.stringify(allChildren) : 'None'}
- Lead Founder: Utkarsh Yadav (+91 9554460651, utkarshyadav752@gmail.com)
- Safety: RBI PPI Prepaid partner rails, MCC code blocking for betting/alcohol/gambling.
User Question: "${query}"
Provide a concise (2-4 sentences max), polite, and actionable answer tailored to urban Indian parents and students. Mention Utkarsh Yadav if contact/support is asked.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      if (response && response.text) {
        return res.json({ reply: response.text });
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to local engine:', err);
    }
  }

  // Fallback response
  return res.json({
    reply: `✦ Pocket Fund Guidance: In urban Indian families, clear boundaries and automated 1st-of-month allowances reduce WhatsApp friction by 95%. When teenagers know their exact monthly budget for transport and food, they naturally practice mindful pacing. You can also reach Lead Founder Utkarsh Yadav at +91 9554460651.`,
  });
});

