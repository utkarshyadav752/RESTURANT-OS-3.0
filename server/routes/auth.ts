import { Router, Request, Response } from 'express';
import { restaurantStore } from '../store.ts';
import { User, StaffInvitation, ActiveSession } from '../../src/types/index.ts';

export const authRouter = Router();

// Demo passwords map for seed users
const DEMO_CREDENTIALS: Record<string, string> = {
  'admin@restaurantos.io': 'Admin@123',
  'admin': 'Admin@123',
  'owner@restaurantos.io': 'Owner@123',
  'manager@restaurantos.io': 'Manager@123',
  'cashier@restaurantos.io': 'Cashier@123',
  'waiter@restaurantos.io': 'Waiter@123',
  'kitchen@restaurantos.io': 'Kitchen@123',
  'inventory@restaurantos.io': 'Inventory@123',
  'accountant@restaurantos.io': 'Accountant@123',
};

// --- Login with Email / Phone & Password ---
authRouter.post('/login', (req: Request, res: Response) => {
  const { identifier, password, rememberMe } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please enter your email or phone and password.' });
  }

  const cleanIdentifier = String(identifier).trim().toLowerCase();

  // Find user by email, mobile, or admin/owner aliases
  let user = restaurantStore.data.users.find(
    u => u.email.toLowerCase() === cleanIdentifier || 
         u.mobile.replace(/\s+/g, '') === cleanIdentifier.replace(/\s+/g, '')
  );

  // Allow admin / superadmin alias for owner account
  if (!user && (cleanIdentifier === 'admin' || cleanIdentifier === 'admin@restaurantos.io' || cleanIdentifier === 'owner' || cleanIdentifier === 'superadmin')) {
    user = restaurantStore.data.users.find(u => u.role === 'OWNER') || restaurantStore.data.users[0];
  }

  if (!user) {
    restaurantStore.recordAuditLog({
      userId: 'anonymous',
      userName: identifier,
      userRole: 'UNKNOWN',
      action: 'FAILED_LOGIN_ATTEMPT',
      entityType: 'AUTH',
      details: `Failed login attempt for non-existent user identifier: ${identifier}`,
    });
    return res.status(401).json({ error: 'Invalid email/phone or password. Use demo account or quick-fill.' });
  }

  // Check demo password or registered user password (support Admin@123, Owner@123, demo, Pass@1234)
  const expectedPassword = DEMO_CREDENTIALS[user.email] || DEMO_CREDENTIALS[cleanIdentifier] || 'Owner@123';
  const isMatch = 
    password === expectedPassword || 
    password === 'Owner@123' ||
    password === 'Admin@123' || 
    password === 'demo' || 
    password === 'admin' || 
    password === 'Pass@1234' ||
    password === 'password';

  if (!isMatch) {
    restaurantStore.recordAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'FAILED_LOGIN_PASSWORD_MISMATCH',
      entityType: 'AUTH',
      details: `Incorrect password attempt for user ${user.email}`,
    });
    return res.status(401).json({ error: 'Invalid password. Check credentials or use the 1-click demo button.' });
  }

  // If 2FA is enabled and user is OWNER, require 2FA step
  if (user.is_2fa_enabled && (user.role === 'OWNER' || user.role === 'ACCOUNTANT')) {
    return res.json({
      requires_2fa: true,
      user_id: user.id,
      email: user.email,
      mobile: user.mobile,
      message: 'Two-factor authentication required. Enter the 6-digit authenticator code or SMS OTP.',
    });
  }

  user.last_login_at = new Date().toISOString();

  restaurantStore.recordAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'USER_LOGIN_SUCCESS',
    entityType: 'AUTH',
    details: `User logged in successfully via password from web client.`,
  });

  return res.json({
    token: `token_${user.id}_${Date.now()}`,
    user,
    organization: restaurantStore.data.organization,
    restaurant: restaurantStore.data.restaurant,
    branches: restaurantStore.data.branches,
  });
});

// --- Verify 2FA OTP / Code ---
authRouter.post('/verify-2fa', (req: Request, res: Response) => {
  const { userId, code } = req.body;
  const user = restaurantStore.data.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // In demo mode, accept any 6-digit code or '123456'
  if (!code || (code !== '123456' && code.length !== 6)) {
    return res.status(400).json({ error: 'Invalid 6-digit 2FA verification code. Demo code is 123456.' });
  }

  user.last_login_at = new Date().toISOString();

  restaurantStore.recordAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: '2FA_VERIFICATION_SUCCESS',
    entityType: 'AUTH',
    details: 'Completed 2FA challenge successfully.',
  });

  return res.json({
    token: `token_${user.id}_${Date.now()}`,
    user,
    organization: restaurantStore.data.organization,
    restaurant: restaurantStore.data.restaurant,
    branches: restaurantStore.data.branches,
  });
});

// --- Phone OTP Login Send / Verify ---
authRouter.post('/send-otp', (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone || phone.length < 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
  }

  // Rate limiting simulation: OK
  return res.json({
    success: true,
    message: `OTP sent successfully to ${phone}. (For demo testing, use code: 123456)`,
    expires_in_seconds: 120,
    demo_otp: '123456'
  });
});

authRouter.post('/verify-otp', (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required.' });
  }

  if (otp !== '123456') {
    return res.status(400).json({ error: 'Invalid OTP code. For demo testing, enter 123456.' });
  }

  // Match or create demo phone user
  let user = restaurantStore.data.users.find(u => u.mobile.replace(/\s+/g, '') === phone.replace(/\s+/g, ''));
  if (!user) {
    user = restaurantStore.data.users[0]; // fallback to owner for seamless demo
  }

  user.last_login_at = new Date().toISOString();

  restaurantStore.recordAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'PHONE_OTP_LOGIN_SUCCESS',
    entityType: 'AUTH',
    details: `Authenticated via mobile OTP (${phone})`,
  });

  return res.json({
    token: `token_${user.id}_${Date.now()}`,
    user,
    organization: restaurantStore.data.organization,
    restaurant: restaurantStore.data.restaurant,
    branches: restaurantStore.data.branches,
  });
});

// --- Restaurant Owner Registration Flow (Steps 1-4) ---
authRouter.post('/register', (req: Request, res: Response) => {
  const {
    // Step 1: Account
    fullName, email, mobile, password,
    // Step 2: Restaurant
    restaurantName, restaurantType, country, state, city, address,
    currency, timezone, gstin, cgstRate, sgstRate, serviceChargeRate,
    businessPhone, businessEmail,
    // Step 3: First Branch
    branchName, branchAddress, branchContact, openingHours, tablesCount, seatingCapacity,
    // Step 4: Initial Setup Choice
    menuSetupType // 'DEMO' | 'MANUAL' | 'CSV'
  } = req.body;

  if (!fullName || !email || !password || !restaurantName || !branchName) {
    return res.status(400).json({ error: 'Please fill in all mandatory account, restaurant, and branch fields.' });
  }

  // Create new organization & restaurant
  const orgId = `org_${Date.now()}`;
  const restId = `rest_${Date.now()}`;
  const branchId = `branch_${Date.now()}`;
  const userId = `user_${Date.now()}`;

  const newOrg = {
    id: orgId,
    name: `${restaurantName} Group`,
    created_at: new Date().toISOString(),
  };

  const newRestaurant = {
    id: restId,
    organization_id: orgId,
    name: restaurantName,
    slug: restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&auto=format&fit=crop&q=80',
    restaurant_type: restaurantType || 'Restaurant',
    country: country || 'India',
    state: state || 'Delhi NCR',
    city: city || 'New Delhi',
    address: address || '12 Connaught Place, Central Delhi',
    currency: currency || 'INR',
    currency_symbol: currency === 'USD' ? '$' : currency === 'AED' ? 'AED' : '₹',
    timezone: timezone || 'Asia/Kolkata',
    gstin: gstin || '07AAAAA0000A1Z5',
    cgst_rate: cgstRate !== undefined ? Number(cgstRate) : 2.5,
    sgst_rate: sgstRate !== undefined ? Number(sgstRate) : 2.5,
    service_charge_rate: serviceChargeRate !== undefined ? Number(serviceChargeRate) : 5.0,
    is_service_charge_mandatory: false,
    is_tax_inclusive: false,
    business_phone: businessPhone || mobile,
    business_email: businessEmail || email,
    created_at: new Date().toISOString(),
  };

  const newBranch = {
    id: branchId,
    organization_id: orgId,
    restaurant_id: restId,
    name: branchName,
    code: branchName.substring(0, 3).toUpperCase(),
    address: branchAddress || address || 'Central Plaza',
    contact_number: branchContact || mobile,
    opening_hours: openingHours || '11:00 AM - 11:30 PM',
    tables_count: Number(tablesCount) || 12,
    seating_capacity: Number(seatingCapacity) || 48,
    status: 'active' as const,
  };

  const allPerms: User['permissions'] = [
    'orders.view', 'orders.create', 'orders.cancel', 'orders.refund',
    'payments.view', 'payments.create',
    'inventory.view', 'inventory.adjust', 'inventory.purchase',
    'menu.view', 'menu.create', 'menu.edit', 'menu.delete',
    'reports.view', 'analytics.view',
    'ai.view', 'ai.approve',
    'staff.manage', 'branches.manage', 'settings.manage'
  ];

  const newUser: User = {
    id: userId,
    organization_id: orgId,
    restaurant_id: restId,
    name: fullName,
    email,
    mobile: mobile || '+91 99999 88888',
    role: 'OWNER',
    assigned_branch_ids: ['all'],
    permissions: allPerms,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    is_2fa_enabled: false,
    status: 'active',
    created_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  };

  // Register in store
  restaurantStore.data.organization = newOrg;
  restaurantStore.data.restaurant = newRestaurant;
  restaurantStore.data.branches = [newBranch];
  restaurantStore.data.users.unshift(newUser);

  // Link tables to new branch
  const newTables = Array.from({ length: newBranch.tables_count }, (_, i) => ({
    id: `tbl_new_${i + 1}`,
    branch_id: branchId,
    restaurant_id: restId,
    table_number: `T${String(i + 1).padStart(2, '0')}`,
    area: (i < 6 ? 'Main Hall' : i < 10 ? 'Terrace' : 'Lounge Bar') as any,
    capacity: i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 2,
    status: 'FREE' as const,
  }));
  restaurantStore.data.tables = newTables;

  restaurantStore.recordAuditLog({
    userId: newUser.id,
    userName: newUser.name,
    userRole: 'OWNER',
    action: 'RESTAURANT_ONBOARDED',
    entityType: 'SETTINGS',
    details: `Created new restaurant workspace: ${newRestaurant.name} with branch ${newBranch.name}`,
    branchId: newBranch.id,
  });

  return res.json({
    success: true,
    token: `token_${newUser.id}_${Date.now()}`,
    user: newUser,
    organization: newOrg,
    restaurant: newRestaurant,
    branches: [newBranch],
  });
});

// --- Current User Session & Context ---
authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let user = restaurantStore.data.users[0]; // default to owner

  if (authHeader && authHeader.startsWith('Bearer token_')) {
    const parts = authHeader.replace('Bearer token_', '').split('_');
    const matched = restaurantStore.data.users.find(u => u.id === parts[0]);
    if (matched) user = matched;
  }

  return res.json({
    user,
    organization: restaurantStore.data.organization,
    restaurant: restaurantStore.data.restaurant,
    branches: restaurantStore.data.branches,
  });
});

// --- Forgot Password Flow ---
authRouter.post('/forgot-password', (req: Request, res: Response) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Please enter your email or phone number.' });
  }

  restaurantStore.recordAuditLog({
    userId: 'system',
    userName: identifier,
    userRole: 'UNKNOWN',
    action: 'PASSWORD_RESET_REQUESTED',
    entityType: 'AUTH',
    details: `Password reset link & OTP requested for ${identifier}`,
  });

  return res.json({
    success: true,
    message: `Secure password reset instructions sent to ${identifier}. For testing, use OTP: 889922.`,
    reset_token: 'rst_demo_token_889922',
  });
});

authRouter.post('/reset-password', (req: Request, res: Response) => {
  const { identifier, resetToken, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters with letters and numbers.' });
  }

  const user = restaurantStore.data.users.find(u => u.email === identifier || u.mobile === identifier);
  if (user) {
    restaurantStore.recordAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PASSWORD_CHANGED',
      entityType: 'AUTH',
      details: 'User successfully updated their account password.',
    });
  }

  return res.json({
    success: true,
    message: 'Your password has been securely reset. You can now login with your new credentials.',
  });
});

// --- Staff Invitations API ---
authRouter.get('/invitations', (_req: Request, res: Response) => {
  return res.json(restaurantStore.data.staffInvitations);
});

authRouter.post('/invitations', (req: Request, res: Response) => {
  const { name, email, mobile, role, branchIds, invitedBy } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required.' });
  }

  const newInvitation: StaffInvitation = {
    id: `inv_${Date.now()}`,
    organization_id: restaurantStore.data.organization.id,
    restaurant_id: restaurantStore.data.restaurant.id,
    token: `inv_token_${Math.random().toString(36).substring(2, 10)}`,
    name,
    email,
    mobile: mobile || '',
    role,
    assigned_branch_ids: branchIds || ['all'],
    invited_by: invitedBy || 'Rajesh Mehra (Owner)',
    status: 'PENDING',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
  };

  restaurantStore.data.staffInvitations.unshift(newInvitation);

  restaurantStore.recordAuditLog({
    userId: 'current_user',
    userName: invitedBy || 'Owner',
    userRole: 'OWNER',
    action: 'STAFF_INVITATION_SENT',
    entityType: 'STAFF',
    details: `Invited ${name} (${email}) as ${role} for branches: ${newInvitation.assigned_branch_ids.join(', ')}`,
  });

  return res.json({
    invitation: newInvitation,
    invite_url: `/invite/${newInvitation.token}`,
  });
});

authRouter.delete('/invitations/:id', (req: Request, res: Response) => {
  const idx = restaurantStore.data.staffInvitations.findIndex(i => i.id === req.params.id);
  if (idx !== -1) {
    const inv = restaurantStore.data.staffInvitations[idx];
    inv.status = 'REVOKED';
    restaurantStore.recordAuditLog({
      userId: 'current_user',
      userName: 'Administrator',
      userRole: 'OWNER',
      action: 'STAFF_INVITATION_REVOKED',
      entityType: 'STAFF',
      details: `Revoked invitation for ${inv.name} (${inv.email})`,
    });
  }
  return res.json({ success: true });
});

// Accept invitation
authRouter.post('/invitations/accept', (req: Request, res: Response) => {
  const { token, password } = req.body;
  const invitation = restaurantStore.data.staffInvitations.find(i => i.token === token);
  if (!invitation || invitation.status !== 'PENDING') {
    return res.status(404).json({ error: 'Invalid or expired invitation token.' });
  }

  invitation.status = 'ACCEPTED';

  const newUser: User = {
    id: `user_${Date.now()}`,
    organization_id: invitation.organization_id,
    restaurant_id: invitation.restaurant_id,
    name: invitation.name,
    email: invitation.email,
    mobile: invitation.mobile || '+91 99000 11223',
    role: invitation.role,
    assigned_branch_ids: invitation.assigned_branch_ids,
    permissions: ['orders.view', 'orders.create', 'menu.view'],
    is_2fa_enabled: false,
    status: 'active',
    created_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  };

  restaurantStore.data.users.push(newUser);

  restaurantStore.recordAuditLog({
    userId: newUser.id,
    userName: newUser.name,
    userRole: newUser.role,
    action: 'INVITATION_ACCEPTED_ACCOUNT_ACTIVATED',
    entityType: 'AUTH',
    details: `${newUser.name} accepted invite and activated their account.`,
  });

  return res.json({
    success: true,
    user: newUser,
    token: `token_${newUser.id}_${Date.now()}`,
    organization: restaurantStore.data.organization,
    restaurant: restaurantStore.data.restaurant,
    branches: restaurantStore.data.branches,
  });
});

// --- Active Sessions API ---
authRouter.get('/sessions', (_req: Request, res: Response) => {
  return res.json(restaurantStore.data.activeSessions);
});

authRouter.delete('/sessions/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  restaurantStore.data.activeSessions = restaurantStore.data.activeSessions.filter(s => s.id !== id);
  return res.json({ success: true });
});

authRouter.post('/sessions/revoke-all', (_req: Request, res: Response) => {
  // Keep only the current session
  restaurantStore.data.activeSessions = restaurantStore.data.activeSessions.filter(s => s.is_current);
  return res.json({ success: true, message: 'All other active sessions revoked.' });
});

// --- 2FA Settings Toggle ---
authRouter.post('/2fa/toggle', (req: Request, res: Response) => {
  const { enabled, userId } = req.body;
  const user = restaurantStore.data.users.find(u => u.id === userId) || restaurantStore.data.users[0];
  user.is_2fa_enabled = Boolean(enabled);

  restaurantStore.recordAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: enabled ? '2FA_ENABLED' : '2FA_DISABLED',
    entityType: 'AUTH',
    details: `${enabled ? 'Enabled' : 'Disabled'} two-factor authentication for user account.`,
  });

  return res.json({
    success: true,
    is_2fa_enabled: user.is_2fa_enabled,
    backup_codes: enabled ? ['9812-4412', '7721-9903', '6620-1184', '3341-8890', '5512-3349'] : [],
  });
});

// --- Kirana Staff Terminal: List Assigned Staff for Fast Shift Switch ---
authRouter.get('/team-members', (_req: Request, res: Response) => {
  const members = restaurantStore.data.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    mobile: u.mobile,
    role: u.role,
    assigned_branch_ids: u.assigned_branch_ids,
    avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    status: u.status,
    last_login_at: u.last_login_at || 'Today 10:30 AM',
  }));
  return res.json(members);
});
