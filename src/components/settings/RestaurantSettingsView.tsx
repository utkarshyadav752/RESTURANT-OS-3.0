import React, { useState, useEffect } from 'react';
import { 
  Settings, Shield, Users, Building, Percent, 
  Smartphone, History, Plus, Trash2, CheckCircle2, 
  AlertTriangle, Copy, KeyRound, Laptop, MapPin
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { ActiveSession, AuditLog, StaffInvitation, RoleType } from '../../types/index.ts';

export const RestaurantSettingsView: React.FC = () => {
  const { restaurant, branches, user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'SECURITY' | 'TEAM' | 'AUDIT' | 'TAX'>('GENERAL');
  
  // Security State
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.is_2fa_enabled || false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);

  // Team & Invitations State
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMobile, setInviteMobile] = useState('');
  const [inviteRole, setInviteRole] = useState<RoleType>('CASHIER');
  const [inviteBranchIds, setInviteBranchIds] = useState<string[]>(['branch_cybercity']);
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // General Settings Form
  const [generalForm, setGeneralForm] = useState({
    name: restaurant?.name || '',
    business_phone: restaurant?.business_phone || '',
    business_email: restaurant?.business_email || '',
    address: restaurant?.address || '',
    cgst_rate: restaurant?.cgst_rate || 2.5,
    sgst_rate: restaurant?.sgst_rate || 2.5,
    service_charge_rate: restaurant?.service_charge_rate || 5.0,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [sessRes, invRes, auditRes] = await Promise.all([
          api.get('/auth/sessions'),
          api.get('/auth/invitations'),
          api.get('/audit-logs'),
        ]);
        setSessions(sessRes || []);
        setInvitations(invRes || []);
        setAuditLogs(auditRes || []);
      } catch (err) {
        console.error('Error loading settings data:', err);
      }
    }
    loadData();
  }, []);

  const handleToggle2FA = async (enable: boolean) => {
    try {
      const res = await api.post('/auth/2fa/toggle', {
        enabled: enable,
        userId: user?.id,
      });
      setIs2FAEnabled(res.is_2fa_enabled);
      setBackupCodes(res.backup_codes || []);
    } catch (err) {
      console.error('Failed to toggle 2FA:', err);
    }
  };

  const handleRevokeSession = async (sessId: string) => {
    try {
      await api.delete(`/auth/sessions/${sessId}`);
      setSessions(prev => prev.filter(s => s.id !== sessId));
    } catch (err) {
      console.error('Failed to revoke session:', err);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    try {
      await api.post('/auth/sessions/revoke-all');
      setSessions(prev => prev.filter(s => s.is_current));
    } catch (err) {
      console.error('Failed to revoke sessions:', err);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;
    try {
      const res = await api.post('/auth/invitations', {
        name: inviteName,
        email: inviteEmail,
        mobile: inviteMobile,
        role: inviteRole,
        branchIds: inviteBranchIds,
        invitedBy: `${user?.name} (${user?.role})`,
      });
      setInvitations(prev => [res.invitation, ...prev]);
      setCreatedInviteUrl(`${window.location.origin}${res.invite_url}`);
    } catch (err) {
      console.error('Failed to invite employee:', err);
    }
  };

  const handleRevokeInvite = async (invId: string) => {
    try {
      await api.delete(`/auth/invitations/${invId}`);
      setInvitations(prev => prev.map(i => i.id === invId ? { ...i, status: 'REVOKED' } : i));
    } catch (err) {
      console.error('Failed to revoke invitation:', err);
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/restaurant/settings', generalForm);
      alert('Restaurant configurations updated successfully.');
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          Restaurant Configurations & Security Center
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage entity profile, branches, staff invitations, 2FA credentials, and immutable audit logs
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto scrollbar-none">
        {[
          { key: 'GENERAL', label: 'General & Profile', icon: <Building className="w-4 h-4" /> },
          { key: 'TAX', label: 'Tax & GST Rates', icon: <Percent className="w-4 h-4" /> },
          { key: 'TEAM', label: 'Team & Invitations', icon: <Users className="w-4 h-4" /> },
          { key: 'SECURITY', label: 'Security & 2FA', icon: <Shield className="w-4 h-4" /> },
          { key: 'AUDIT', label: 'Immutable Audit Log', icon: <History className="w-4 h-4" /> },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === t.key
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: General & Profile */}
      {activeTab === 'GENERAL' && (
        <form onSubmit={handleSaveGeneral} className="p-6 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-700/80 space-y-4 max-w-2xl">
          <h3 className="text-sm font-bold text-white">Restaurant Entity Information</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Restaurant Legal Name</label>
              <input
                type="text"
                value={generalForm.name}
                onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Business Phone</label>
                <input
                  type="text"
                  value={generalForm.business_phone}
                  onChange={(e) => setGeneralForm({ ...generalForm, business_phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Business Email</label>
                <input
                  type="email"
                  value={generalForm.business_email}
                  onChange={(e) => setGeneralForm({ ...generalForm, business_email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Headquarters Operating Address</label>
              <input
                type="text"
                value={generalForm.address}
                onChange={(e) => setGeneralForm({ ...generalForm, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="py-2 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Save Changes
          </button>
        </form>
      )}

      {/* TAB 2: Tax & GST Rates */}
      {activeTab === 'TAX' && (
        <form onSubmit={handleSaveGeneral} className="p-6 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-700/80 space-y-4 max-w-2xl">
          <h3 className="text-sm font-bold text-white">Statutory Tax & Billing Rules</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">CGST Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={generalForm.cgst_rate}
                onChange={(e) => setGeneralForm({ ...generalForm, cgst_rate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">SGST Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={generalForm.sgst_rate}
                onChange={(e) => setGeneralForm({ ...generalForm, sgst_rate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Service Charge (%)</label>
            <input
              type="number"
              step="0.5"
              value={generalForm.service_charge_rate}
              onChange={(e) => setGeneralForm({ ...generalForm, service_charge_rate: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
            />
          </div>

          <button
            type="submit"
            className="py-2 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Update Tax Configuration
          </button>
        </form>
      )}

      {/* TAB 3: Team & Invitations */}
      {activeTab === 'TEAM' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Staff Team & Active Invitations</h3>
              <p className="text-xs text-slate-400">Generate secure invitation tokens to onboard managers, cashiers, and chefs</p>
            </div>
            <button
              onClick={() => {
                setCreatedInviteUrl(null);
                setShowInviteModal(true);
              }}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              Invite New Staff
            </button>
          </div>

          <div className="rounded-2xl glass-panel-elevated bg-slate-900/90 border border-slate-700/80 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] bg-slate-950/60 font-sans">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Branch Access</th>
                    <th className="py-3 px-4">Invited By</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {invitations.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-850/60">
                      <td className="py-3 px-4 font-sans font-medium text-white">
                        {inv.name}
                        <span className="block text-[10px] text-slate-500 font-mono">{inv.email}</span>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-800 text-amber-300">
                          {inv.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-sans text-[11px]">
                        {inv.assigned_branch_ids.join(', ')}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-sans text-[11px]">{inv.invited_by}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold font-sans px-2 py-0.5 rounded-full ${
                          inv.status === 'ACCEPTED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : inv.status === 'REVOKED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        {inv.status === 'PENDING' && (
                          <button
                            onClick={() => handleRevokeInvite(inv.id)}
                            className="text-rose-400 hover:text-rose-300 text-xs font-semibold ml-2 cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Security & 2FA & Active Sessions */}
      {activeTab === 'SECURITY' && (
        <div className="space-y-6 max-w-3xl">
          {/* 2FA Card */}
          <div className="p-6 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-700/80 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Two-Factor Authentication (2FA)</h4>
                  <p className="text-xs text-slate-400">Protects administrative and financial modifications</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle2FA(!is2FAEnabled)}
                className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  is2FAEnabled
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-emerald-500 text-slate-950 font-black'
                }`}
              >
                {is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </button>
            </div>

            {is2FAEnabled && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Two-factor authentication is active on your account
                </div>
                <p className="text-[11px] text-slate-300">
                  You will be prompted for an authenticator code or SMS OTP when signing in from an unrecognized browser.
                </p>

                {backupCodes.length > 0 && (
                  <div className="pt-2 border-t border-emerald-500/30">
                    <span className="font-bold text-white block mb-1">Your One-Time Recovery Codes:</span>
                    <div className="grid grid-cols-5 gap-1 font-mono text-[10px] text-amber-300">
                      {backupCodes.map((code, idx) => (
                        <span key={idx} className="p-1 rounded bg-slate-950 text-center">{code}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Sessions Card */}
          <div className="p-6 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-700/80 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Active Login Sessions</h4>
                  <p className="text-xs text-slate-400">Devices currently logged into this restaurant tenant</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRevokeAllOtherSessions}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Logout All Other Devices
              </button>
            </div>

            <div className="space-y-2">
              {sessions.map(s => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-white flex items-center gap-2">
                      {s.device_name}
                      {s.is_current && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Current Device
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {s.browser} · {s.os} · IP: {s.ip_address}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Location: {s.location} · Active: {s.last_active}
                    </div>
                  </div>

                  {!s.is_current && (
                    <button
                      onClick={() => handleRevokeSession(s.id)}
                      className="text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Immutable Statutory Audit Log */}
      {activeTab === 'AUDIT' && (
        <div className="rounded-2xl glass-panel-elevated bg-slate-900/90 border border-slate-700/80 overflow-hidden shadow-2xl">
          <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Immutable Audit Trail (Append-Only Event Log)</span>
            <span className="text-[10px] text-slate-500 font-mono">Guarantees forensic compliance</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] bg-slate-950/40 font-sans">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Action Event</th>
                  <th className="py-2.5 px-4">IP Address</th>
                  <th className="py-2.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-850/60">
                    <td className="py-2.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-4 font-sans font-bold text-white whitespace-nowrap">
                      {log.user_name}
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-800 text-amber-300">
                        {log.user_role}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] font-bold text-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">{log.ip_address}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-300 text-[11px]">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Invitation Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl glass-panel-elevated bg-slate-900 border border-slate-700 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Invite Employee / Assign Role</h3>
            <p className="text-xs text-slate-400">
              Generates a secure single-use invitation URL. The invited staff member sets their password upon onboarding.
            </p>

            {createdInviteUrl ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <span className="text-xs font-bold text-emerald-400 block">Invitation Generated Successfully!</span>
                <div className="p-2.5 bg-slate-950 rounded-xl font-mono text-[11px] text-slate-300 break-all select-all border border-slate-800">
                  {createdInviteUrl}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdInviteUrl);
                    alert('Invitation link copied to clipboard!');
                  }}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Invitation Link
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="w-full py-1 text-xs text-slate-400 hover:text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Vikramaditya Roy"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="e.g. vikram@zafranbistro.in"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number (Optional)</label>
                  <input
                    type="tel"
                    value={inviteMobile}
                    onChange={(e) => setInviteMobile(e.target.value)}
                    placeholder="+91 98110 00000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role & Permissions</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="MANAGER">Manager (Daily Operations)</option>
                    <option value="CASHIER">Cashier (POS & Billing)</option>
                    <option value="WAITER">Waiter (Tables & Orders)</option>
                    <option value="KITCHEN">Kitchen Staff (KDS Station)</option>
                    <option value="INVENTORY_MANAGER">Inventory Lead</option>
                    <option value="ACCOUNTANT">Accountant (Tax & Margins)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                  >
                    Generate Invite Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
