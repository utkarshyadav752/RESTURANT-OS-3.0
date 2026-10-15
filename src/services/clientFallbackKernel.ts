/**
 * Emergency Client Fallback Kernel for RestaurantOS
 * Provides offline/Vercel-static fallback authentication data so users and testers
 * can always log in and test all role dashboards even if the Express backend server
 * is not running or returning 404 on Vercel.
 */

import { User, Organization, Restaurant, Branch, RoleType } from '../types/index.ts';

export const FALLBACK_ORGANIZATION: Organization = {
  id: 'org_taj_group',
  name: 'Taj Hospitality Ventures Ltd.',
  created_at: '2025-01-10T09:00:00.000Z',
};

export const FALLBACK_RESTAURANT: Restaurant = {
  id: 'rest_zafran',
  organization_id: 'org_taj_group',
  name: 'Zafran Gourmet Bistro & Bar',
  slug: 'zafran-bistro',
  logo_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=160&auto=format&fit=crop&q=80',
  restaurant_type: 'Bar & Restaurant',
  country: 'India',
  state: 'Delhi NCR',
  city: 'Gurgaon',
  address: 'DLF CyberCity, Phase 2, Sector 24, Cyber Hub Floor 2',
  currency: 'INR',
  currency_symbol: '₹',
  timezone: 'Asia/Kolkata',
  gstin: '07AABCT2345A1Z5',
  cgst_rate: 2.5,
  sgst_rate: 2.5,
  service_charge_rate: 5.0,
  is_service_charge_mandatory: false,
  is_tax_inclusive: false,
  business_phone: '+91 98110 44220',
  business_email: 'operations@zafranbistro.in',
  created_at: '2025-01-15T10:00:00.000Z',
};

export const FALLBACK_BRANCHES: Branch[] = [
  {
    id: 'branch_cybercity',
    organization_id: 'org_taj_group',
    restaurant_id: 'rest_zafran',
    name: 'Cyber Hub Flagship',
    code: 'ZH-CYB',
    address: 'Shop 204-206, Cyber Hub, DLF CyberCity, Gurgaon',
    contact_number: '+91 98110 44221',
    opening_hours: '12:00 PM - 12:30 AM',
    tables_count: 18,
    seating_capacity: 84,
    status: 'active',
  },
  {
    id: 'branch_cp',
    organization_id: 'org_taj_group',
    restaurant_id: 'rest_zafran',
    name: 'Connaught Place Colonial Hub',
    code: 'ZH-CP',
    address: 'M-Block, Inner Circle, Connaught Place, New Delhi',
    contact_number: '+91 98110 44222',
    opening_hours: '11:30 AM - 11:30 PM',
    tables_count: 14,
    seating_capacity: 65,
    status: 'active',
  },
  {
    id: 'branch_aerocity',
    organization_id: 'org_taj_group',
    restaurant_id: 'rest_zafran',
    name: 'Aerocity Worldmark Lounge',
    code: 'ZH-AERO',
    address: 'Asset Area 4, Worldmark 2, Aerocity, New Delhi',
    contact_number: '+91 98110 44223',
    opening_hours: '12:00 PM - 01:00 AM',
    tables_count: 20,
    seating_capacity: 94,
    status: 'active',
  },
];

const allPermissions = [
  'orders.view', 'orders.create', 'orders.cancel', 'orders.refund',
  'payments.view', 'payments.create',
  'inventory.view', 'inventory.adjust', 'inventory.purchase',
  'menu.view', 'menu.create', 'menu.edit', 'menu.delete',
  'reports.view', 'analytics.view',
  'ai.view', 'ai.approve',
  'staff.manage', 'branches.manage', 'settings.manage'
] as const;

export const FALLBACK_USERS: Record<string, { user: User; pass: string }> = {
  'owner@restaurantos.io': {
    user: {
      id: 'user_owner',
      organization_id: 'org_taj_group',
      restaurant_id: 'rest_zafran',
      name: 'Rajesh Mehra',
      email: 'owner@restaurantos.io',
      mobile: '+91 98100 11223',
      role: 'OWNER',
      assigned_branch_ids: ['all'],
      permissions: [...allPermissions],
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      is_2fa_enabled: false,
      status: 'active',
      created_at: '2025-01-15T10:00:00Z',
      last_login_at: new Date().toISOString(),
    },
    pass: 'Owner@123',
  },
  'manager@restaurantos.io': {
    user: {
      id: 'user_manager',
      organization_id: 'org_taj_group',
      restaurant_id: 'rest_zafran',
      name: 'Rahul Verma',
      email: 'manager@restaurantos.io',
      mobile: '+91 98111 22334',
      role: 'MANAGER',
      assigned_branch_ids: ['branch_cybercity', 'branch_cp'],
      permissions: [
        'orders.view', 'orders.create', 'orders.cancel', 'orders.refund',
        'payments.view', 'payments.create',
        'inventory.view', 'inventory.adjust', 'inventory.purchase',
        'menu.view', 'menu.edit',
        'reports.view', 'analytics.view',
        'ai.view', 'ai.approve',
        'staff.manage',
      ],
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      is_2fa_enabled: false,
      status: 'active',
      created_at: '2025-01-20T11:00:00Z',
      last_login_at: new Date().toISOString(),
    },
    pass: 'Manager@123',
  },
  'cashier@restaurantos.io': {
    user: {
      id: 'user_cashier',
      organization_id: 'org_taj_group',
      restaurant_id: 'rest_zafran',
      name: 'Priya Sharma',
      email: 'cashier@restaurantos.io',
      mobile: '+91 98222 33445',
      role: 'CASHIER',
      assigned_branch_ids: ['branch_cybercity'],
      permissions: [
        'orders.view', 'orders.create', 'orders.refund',
        'payments.view', 'payments.create',
        'menu.view',
      ],
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      is_2fa_enabled: false,
      status: 'active',
      created_at: '2025-02-01T09:30:00Z',
      last_login_at: new Date().toISOString(),
    },
    pass: 'Cashier@123',
  },
  'waiter@restaurantos.io': {
    user: {
      id: 'user_waiter',
      organization_id: 'org_taj_group',
      restaurant_id: 'rest_zafran',
      name: 'Amit Kumar',
      email: 'waiter@restaurantos.io',
      mobile: '+91 98333 44556',
      role: 'WAITER',
      assigned_branch_ids: ['branch_cybercity'],
      permissions: [
        'orders.view', 'orders.create',
        'menu.view',
      ],
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      is_2fa_enabled: false,
      status: 'active',
      created_at: '2025-02-05T12:00:00Z',
      last_login_at: new Date().toISOString(),
    },
    pass: 'Waiter@123',
  },
  'kitchen@restaurantos.io': {
    user: {
      id: 'user_kitchen',
      organization_id: 'org_taj_group',
      restaurant_id: 'rest_zafran',
      name: 'Vikram Singh',
      email: 'kitchen@restaurantos.io',
      mobile: '+91 98444 55667',
      role: 'KITCHEN',
      assigned_branch_ids: ['branch_cybercity'],
      permissions: [
        'orders.view',
        'menu.view',
      ],
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
      is_2fa_enabled: false,
      status: 'active',
      created_at: '2025-02-08T14:15:00Z',
      last_login_at: new Date().toISOString(),
    },
    pass: 'Kitchen@123',
  },
  'inventory@restaurantos.io': {
    user: {
      id: 'user_inventory',
      organization_id: 'org_taj_group',
      restaurant_id: 'rest_zafran',
      name: 'Sunita Rao',
      email: 'inventory@restaurantos.io',
      mobile: '+91 98555 66778',
      role: 'INVENTORY_MANAGER',
      assigned_branch_ids: ['all'],
      permissions: [
        'inventory.view', 'inventory.adjust', 'inventory.purchase',
        'menu.view',
        'reports.view',
      ],
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      is_2fa_enabled: false,
      status: 'active',
      created_at: '2025-02-10T16:00:00Z',
      last_login_at: new Date().toISOString(),
    },
    pass: 'Inventory@123',
  },
  'accountant@restaurantos.io': {
    user: {
      id: 'user_accountant',
      organization_id: 'org_taj_group',
      restaurant_id: 'rest_zafran',
      name: 'Deepak Gupta',
      email: 'accountant@restaurantos.io',
      mobile: '+91 98666 77889',
      role: 'ACCOUNTANT',
      assigned_branch_ids: ['all'],
      permissions: [
        'orders.view',
        'payments.view',
        'reports.view', 'analytics.view',
      ],
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
      is_2fa_enabled: false,
      status: 'active',
      created_at: '2025-02-12T10:45:00Z',
      last_login_at: new Date().toISOString(),
    },
    pass: 'Accountant@123',
  },
  'admin@restaurantos.io': {
    user: {
      id: 'user_admin',
      organization_id: 'org_taj_group',
      restaurant_id: 'rest_zafran',
      name: 'System Administrator (Executive)',
      email: 'admin@restaurantos.io',
      mobile: '+91 98100 00001',
      role: 'OWNER',
      assigned_branch_ids: ['all'],
      permissions: [...allPermissions],
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      is_2fa_enabled: false,
      status: 'active',
      created_at: '2025-01-01T00:00:00Z',
      last_login_at: new Date().toISOString(),
    },
    pass: 'Admin@123',
  },
};

export function findFallbackUser(identifier: string): { user: User; pass: string } | null {
  const cleanId = identifier.trim().toLowerCase();
  const cleanMobile = identifier.replace(/[\s+-]/g, '');

  // Direct check for admin aliases
  if (cleanId === 'admin' || cleanId === 'admin@restaurantos.io' || cleanId === 'owner' || cleanId === 'superadmin' || cleanId === 'root') {
    return FALLBACK_USERS['admin@restaurantos.io'] || FALLBACK_USERS['owner@restaurantos.io'];
  }

  for (const item of Object.values(FALLBACK_USERS)) {
    if (item.user.email.toLowerCase() === cleanId) {
      return item;
    }
    const userMobile = item.user.mobile.replace(/[\s+-]/g, '');
    if (userMobile === cleanMobile || (cleanMobile.length >= 10 && userMobile.endsWith(cleanMobile))) {
      return item;
    }
  }

  return null;
}
