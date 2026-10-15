# RestaurantOS — AI Operating System & POS

A production-grade, multi-tenant restaurant operating system combining **Smart POS + Real-time KOT + Interactive Floor Tables + GST Billing & Split Payments + Double-Entry Stock Ledger + Recipe/BOM Consumption Engine + Wastage-to-Profit Intelligence + AI Demand Forecasting + Real-Time AI Copilot & "What-If" Simulator**.

---

## 🚀 Key Differentiators & Architecture

1. **True Recipe BOM Consumption Engine**
   - Selling a dish at POS (e.g. *3x Purani Dilli Butter Chicken*) automatically debits ingredients (Chicken 840g, Butter 120g, Cream 180ml, Tomato 750g) in the statutory **Stock Ledger**.
2. **Anti-Overstock "Don't Buy" AI**
   - Does not just flag low stock. Specifically flags ingredients **NOT to purchase** when usable inventory covers forecasted demand (e.g., *Onions & Coriander*), eliminating wilting waste and protecting cash flow.
3. **Recipe Drift Detection**
   - Compares theoretical recipe BOM with actual kitchen consumption to catch portioning leakages (e.g., *Chicken Breast +25.3% variance / ₹1,012 financial leakage*).
4. **Waste-to-Profit Intelligence**
   - Translates raw discarded kilograms into dish profit margin equivalents (e.g., *₹612 waste today = 1.9 Butter Chickens lost*).
5. **AI Restaurant Copilot Grounded in Telemetry**
   - Powered by `@google/genai` with deterministic database injection: answers operational questions using real sales, recipes, and stock ledger facts without hallucinating figures.
6. **"What-If" Scenario Simulator**
   - Simulates ingredient cost inflation (+15% chicken price), customer footfall surges (+20% dinner covers), or kitchen waste reduction before making operational decisions.
7. **Multi-Tenant RBAC & Branch Isolation**
   - Complete tenant isolation with `organization_id`, `restaurant_id`, and `branch_id`.
   - Branch switcher updates tables, inventory, POS, and analytics in real-time.

---

## 👥 Demo Personas & Test Credentials

The login screen features an **Instant Role Evaluation Selector (1-Click Test)** to test any role:

| Persona | Email | Password | Role & Scope |
| :--- | :--- | :--- | :--- |
| **Rajesh Mehra** | `owner@restaurantos.io` | `Owner@123` | **OWNER** (All Branches, Full Financial & AI Access, 2FA enabled) |
| **Rahul Verma** | `manager@restaurantos.io` | `Manager@123` | **MANAGER** (Cyber Hub & CP, Operations, Staff, AI Review) |
| **Priya Sharma** | `cashier@restaurantos.io` | `Cashier@123` | **CASHIER** (Cyber Hub, Smart POS, Split Billing, Receipts) |
| **Amit Kumar** | `waiter@restaurantos.io` | `Waiter@123` | **WAITER** (Cyber Hub, Floor Tables, Dine-in Orders, KOT) |
| **Vikram Singh** | `kitchen@restaurantos.io` | `Kitchen@123` | **KITCHEN** (Cyber Hub, Live KDS, Station Tickets, Cooking Timers) |
| **Sunita Rao** | `inventory@restaurantos.io` | `Inventory@123` | **INVENTORY_MANAGER** (All Branches, Stock Ledger, Batches, POs) |
| **Deepak Gupta (CA)** | `accountant@restaurantos.io` | `Accountant@123` | **ACCOUNTANT** (All Branches, Tax/GST, Contribution Margins) |

*Note: For Phone OTP login or 2FA challenge, use demo code: `123456`.*

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Backend**: Node.js, Express, TSX, Vite Middleware.
- **AI/ML**: `@google/genai` TypeScript SDK (`gemini-3.8-flash`) with verified database metric grounding.
- **Billing**: India GST (CGST 2.5% + SGST 2.5%), Service Charge, 80mm thermal receipt printing, split payments (Cash, Card, UPI Dynamic QR).

---

## 📡 API Endpoints

- `POST /api/v1/auth/login`: Authenticate with password or 2FA challenge
- `POST /api/v1/auth/register`: 4-step restaurant onboarding wizard
- `POST /api/v1/auth/send-otp` & `POST /api/v1/auth/verify-otp`: Mobile OTP authentication
- `GET /api/v1/pos/orders`: Live orders with branch isolation
- `POST /api/v1/pos/orders`: Create order and dispatch real-time KOT
- `POST /api/v1/pos/orders/:id/pay`: Complete payment and execute automatic recipe BOM deduction
- `GET /api/v1/kot` & `PATCH /api/v1/kot/:id/status`: KDS station workflow
- `GET /api/v1/inventory`: Stock ledger, batches, expiry tracking
- `POST /api/v1/wastage`: Log waste with waste-to-profit multiplier
- `GET /api/v1/forecast`: Demand forecasts and Anti-Overstock "Don't Buy" alerts
- `POST /api/v1/ai/query`: AI Copilot grounded Q&A
- `POST /api/v1/ai/simulate`: "What-If" scenario sandbox
- `GET /api/v1/audit-logs`: Immutable statutory event log
