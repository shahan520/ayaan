import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  DollarSign,
  Download,
  Edit,
  History,
  Key,
  Layers,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Unlock,
  UserCheck,
  UserCog,
  Users,
  Wallet,
  XCircle,
  X,
  AlertCircle,
  ExternalLink,
  Star,
} from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AdminPermission,
  AdminUser,
  CustomComboRule,
  DEMO_TRC20_ADDRESS_POOL,
  User,
} from '../../types';
import {
  generateHybridComboSchedule,
  TARGET_CYCLE_COMBO_COUNT,
  DEFAULT_VIP_COMBO_SCHEDULE,
  PRESET_6_COMBO_SCHEDULE,
  PRESET_7_COMBO_SCHEDULE,
} from '../../utils/comboGenerator';
import { QRCodeSVG } from '../common/QRCodeSVG';

export const AdminPanel: React.FC = () => {
  const {
    admins,
    currentAdmin,
    switchAdmin,
    hasPermission,
    users,
    deposits,
    withdrawals,
    inviteCodes,
    auditLogs,
    systemConfig,
    approveDeposit,
    rejectDeposit,
    approveWithdrawal,
    rejectWithdrawal,
    adjustUserBalance,
    toggleUserStatus,
    resetUserPassword,
    generateInviteCode,
    generateBulkInviteCodes,
    toggleInviteCodeStatus,
    createSubAdmin,
    updateSubAdminPermissions,
    updateSystemConfig,
    resetUserTaskCycle,
    resetUserToFreshCycle,
    toggleUserVip,
    toggleUserLock,
    setCustomUserCombos,
    clearUserTax,
    createDemoAccount,
    toggleUserWorkPermission,
    resetUserWallet,
    adminUpdateUserWallet,
    switchUser,
    setActiveView,
    adminLogout,
    updateSubAdminPassword,
    updateSuperAdminSecurity,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'deposits' | 'withdrawals' | 'users' | 'invites' | 'subadmins' | 'wallet' | 'logs'
  >('overview');

  // Search & filter states
  const [userSearch, setUserSearch] = useState('');
  const [userAccountTypeFilter, setUserAccountTypeFilter] = useState<'all' | 'real' | 'demo'>('all');
  const [inviteFilter, setInviteFilter] = useState<'all' | 'system' | 'user'>('all');
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('pending');

  // Demo Account Creation Modal State
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoUsername, setDemoUsername] = useState('');
  const [demoPassword, setDemoPassword] = useState('123456');
  const [demoBalance, setDemoBalance] = useState('300');
  const [demoSelectedAddress, setDemoSelectedAddress] = useState<string>(DEMO_TRC20_ADDRESS_POOL[0]);
  const [demoWorkPermission, setDemoWorkPermission] = useState(true);
  const [createdDemoUser, setCreatedDemoUser] = useState<User | null>(null);

  // Balance adjustment modal state
  const [balanceModalUser, setBalanceModalUser] = useState<{ id: string; username: string; uid: string; balance: number } | null>(null);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Password reset modal state
  const [passwordModalUser, setPasswordModalUser] = useState<{ id: string; username: string; uid: string } | null>(null);
  const [resetType, setResetType] = useState<'login' | 'withdrawal'>('login');
  const [newPassword, setNewPassword] = useState('');

  // Custom Combo Configuration modal state
  const [comboModalUser, setComboModalUser] = useState<User | null>(null);
  const [customRulesList, setCustomRulesList] = useState<CustomComboRule[]>([]);
  const [newComboStep, setNewComboStep] = useState<string>('14');
  const [newComboDepositPct, setNewComboDepositPct] = useState<string>('36');
  const [newComboCommPct, setNewComboCommPct] = useState<string>('20');

  // Wallet Reset / Correction Modal State (Admin-Only TRC-20 Address Reset)
  const [walletModalUser, setWalletModalUser] = useState<User | null>(null);
  const [adminWalletAddress, setAdminWalletAddress] = useState('');
  const [adminWalletName, setAdminWalletName] = useState('');
  const [adminAccountName, setAdminAccountName] = useState('');
  const [adminWalletError, setAdminWalletError] = useState('');

  // Invite code creation state
  const [newCustomCode, setNewCustomCode] = useState('');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState('');
  const [bulkCount, setBulkCount] = useState('5');
  const [bulkPrefix, setBulkPrefix] = useState('SYS');

  // Sub-admin creation state
  const [showAddSubAdminModal, setShowAddSubAdminModal] = useState(false);
  const [newSubUsername, setNewSubUsername] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubPassword, setNewSubPassword] = useState('sub123456');
  const [newSubPermissions, setNewSubPermissions] = useState<AdminPermission[]>([
    'can_manage_users',
    'can_view_logs',
  ]);

  // Super Admin Credentials & Master PIN Management Modal State
  const [showSuperSecurityModal, setShowSuperSecurityModal] = useState(false);
  const [superNewPassword, setSuperNewPassword] = useState('');
  const [superConfirmPassword, setSuperConfirmPassword] = useState('');
  const [superNewPin, setSuperNewPin] = useState('');
  const [superConfirmPin, setSuperConfirmPin] = useState('');

  // Sub-Admin Password Change Modal State (Super Admin exclusive authority)
  const [subAdminToEditPassword, setSubAdminToEditPassword] = useState<AdminUser | null>(null);
  const [subAdminNewPass, setSubAdminNewPass] = useState('');

  // Wallet address & rotating pool edit state
  const [editWalletAddress, setEditWalletAddress] = useState(systemConfig.trc20DepositAddress);
  const [newPoolAddress, setNewPoolAddress] = useState('');
  const [bulkPoolText, setBulkPoolText] = useState('');
  const [showBulkPoolInput, setShowBulkPoolInput] = useState(false);
  const [simulatedAddress, setSimulatedAddress] = useState<string | null>(null);
  const [simulatedTxNumber, setSimulatedTxNumber] = useState<number>(1);

  // Global action feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const notify = (res: { success: boolean; message?: string }) => {
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message || (res.success ? 'Operation succeeded' : 'Operation failed'),
    });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Metrics for overview
  const totalUsersCount = users.length;
  const pendingDepositsCount = deposits.filter((d) => d.status === 'pending').length;
  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'pending').length;
  const totalApprovedDepositsAmount = deposits
    .filter((d) => d.status === 'approved')
    .reduce((sum, d) => sum + d.amount, 0);
  const totalApprovedWithdrawalsAmount = withdrawals
    .filter((w) => w.status === 'approved')
    .reduce((sum, w) => sum + w.amount, 0);

  const allPermissionsList: { key: AdminPermission; label: string; desc: string }[] = [
    { key: 'can_manage_users', label: 'Manage Users', desc: 'Freeze/unfreeze accounts & reset passwords' },
    { key: 'can_credit_debit', label: 'Credit/Debit Balance', desc: 'Manually adjust user USDT balances' },
    { key: 'can_approve_deposits', label: 'Approve Deposits', desc: 'Review TXID and approve USDT deposits' },
    { key: 'can_approve_withdrawals', label: 'Approve Withdrawals', desc: 'Audit and approve USDT payouts' },
    { key: 'can_generate_invites', label: 'Generate Invites', desc: 'Create single or bulk system invitation codes' },
    { key: 'can_view_logs', label: 'View Audit Logs', desc: 'Inspect system action audit trails' },
    { key: 'can_modify_wallet', label: 'System Wallet Config', desc: 'Change TRC-20 deposit address' },
    { key: 'can_manage_admins', label: 'Manage Sub-Admins', desc: 'Super admin capability to provision sub-admins' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Header Bar */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-900/60 border border-red-700/50 flex items-center justify-center text-red-400 font-bold shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base text-white tracking-tight">
                QuDaizi Trading Admin Console
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 uppercase font-bold">
                RBAC Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Role-Based Access Control · Financial Settlements · Audit Trails
            </p>
          </div>
        </div>

        {/* Current Admin Role Switcher & Status */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
          <div className="px-3 py-1 text-left">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
              Current Logged Role:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">{currentAdmin.name}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  currentAdmin.role === 'super_admin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}
              >
                {currentAdmin.role === 'super_admin' ? 'SUPER ADMIN' : 'SUB-ADMIN'}
              </span>
            </div>
          </div>

          <div className="h-7 w-px bg-slate-800" />

          {/* Quick Admin Account Switcher */}
          <select
            value={currentAdmin.id}
            onChange={(e) => switchAdmin(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-red-500 font-medium"
          >
            {admins.map((adm) => (
              <option key={adm.id} value={adm.id}>
                {adm.name} ({adm.role === 'super_admin' ? 'Full Access' : 'Custom Perms'})
              </option>
            ))}
          </select>

          {/* Super Admin Security Settings Button (Only visible for Super Admin) */}
          {currentAdmin.role === 'super_admin' && (
            <button
              onClick={() => {
                setSuperNewPassword('');
                setSuperConfirmPassword('');
                setSuperNewPin('');
                setSuperConfirmPin('');
                setShowSuperSecurityModal(true);
              }}
              title="Super Admin Password & Master PIN Security Settings"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs text-amber-300 font-semibold transition-colors cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Security Settings</span>
            </button>
          )}

          {/* Secure Exit Admin Button */}
          <button
            onClick={() => {
              if (window.confirm('Log out of Administrator Console and return to public website?')) {
                adminLogout();
              }
            }}
            title="Log out of Admin Console"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-xs text-red-200 font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Exit Admin</span>
          </button>
        </div>
      </header>

      {/* Global Feedback Toast */}
      {feedback && (
        <div
          className={`mx-6 mt-4 p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              : 'bg-red-950/80 border-red-800 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Sub-Header Tabs */}
      <div className="bg-slate-950/70 border-b border-slate-800 px-6 flex items-center overflow-x-auto gap-2 py-2">
        {[
          { key: 'overview' as const, label: 'Overview', icon: Layers },
          {
            key: 'deposits' as const,
            label: 'Deposit Requests',
            icon: ArrowDownLeft,
            badge: pendingDepositsCount > 0 ? pendingDepositsCount : null,
          },
          {
            key: 'withdrawals' as const,
            label: 'Withdrawals',
            icon: ArrowUpRight,
            badge: pendingWithdrawalsCount > 0 ? pendingWithdrawalsCount : null,
          },
          { key: 'users' as const, label: 'User Management', icon: Users },
          { key: 'invites' as const, label: 'Invitation Codes', icon: Tag },
          { key: 'subadmins' as const, label: 'Sub-Admins & RBAC', icon: UserCog },
          { key: 'wallet' as const, label: 'System Wallet', icon: Wallet },
          { key: 'logs' as const, label: 'Audit Logs', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== null && tab.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* ------------------------------------------------------------- */}
        {/* 1. OVERVIEW TAB */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">{totalUsersCount}</div>
                <div className="text-[11px] text-slate-400 mt-1">100% verified by invite codes</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Pending Deposits
                  </span>
                  <ArrowDownLeft className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-amber-400 font-mono">
                  {pendingDepositsCount}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Requires TXID review</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Pending Payouts
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-rose-400" />
                </div>
                <div className="text-3xl font-extrabold text-rose-400 font-mono">
                  {pendingWithdrawalsCount}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Awaiting one-click transfer</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Total Volume (USDT)
                  </span>
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                  +{totalApprovedDepositsAmount.toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Settled payouts: -{totalApprovedWithdrawalsAmount.toFixed(2)} USDT
                </div>
              </div>
            </div>

            {/* Quick Actions & System Health */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3 md:col-span-2">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-red-500" />
                  Active Role Privileges for {currentAdmin.name}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {allPermissionsList.map((p) => {
                    const granted = hasPermission(p.key);
                    return (
                      <div
                        key={p.key}
                        className={`p-2.5 rounded-xl border text-xs ${
                          granted
                            ? 'bg-slate-900 border-emerald-900/50 text-emerald-300'
                            : 'bg-slate-900/40 border-slate-800 text-slate-500 line-through opacity-60'
                        }`}
                      >
                        <span className="font-semibold block">{p.label}</span>
                        <span className="text-[10px] block opacity-80 mt-0.5">
                          {granted ? 'Granted' : 'Restricted'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  Official TRC-20 System Wallet
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Active one-time receiver address served to users in Deposit QR screen:
                </p>
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-slate-200 break-all select-all">
                  {systemConfig.trc20DepositAddress}
                </div>
                <button
                  onClick={() => setActiveTab('wallet')}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Manage Wallet Config
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 2. DEPOSIT REQUESTS TAB */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'deposits' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xs space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">TRC-20 USDT Deposit Management</h2>
                <p className="text-xs text-slate-400">
                  Review transaction hashes (TXIDs) and one-click credit user balances
                </p>
              </div>

              {/* Filter */}
              <div className="flex gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setDepositFilter(st)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md uppercase transition-colors ${
                      depositFilter === st
                        ? 'bg-red-700 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Deposits Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">UID / User</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Network</th>
                    <th className="py-3 px-3">TXID / Transaction Hash</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Submitted</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {deposits
                    .filter((d) => (depositFilter === 'all' ? true : d.status === depositFilter))
                    .map((dep) => (
                      <tr key={dep.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-bold text-white block">{dep.username}</span>
                          <span className="text-[11px] font-mono text-slate-400">UID: {dep.userUid}</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-400 text-sm">
                          +{dep.amount.toFixed(2)} USDT
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                            {dep.protocol}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-[240px]">
                          <span className="font-mono text-[11px] text-slate-300 truncate block select-all" title={dep.txid}>
                            {dep.txid}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {dep.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-[10px]">
                              PENDING REVIEW
                            </span>
                          )}
                          {dep.status === 'approved' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-[10px]">
                              APPROVED
                            </span>
                          )}
                          {dep.status === 'rejected' && (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-semibold text-[10px]">
                              REJECTED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">{dep.createdAt}</td>
                        <td className="py-3 px-3 text-right">
                          {dep.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => notify(approveDeposit(dep.id))}
                                title={!hasPermission('can_approve_deposits') ? 'Permission Required' : 'One-Click Approve'}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                                  hasPermission('can_approve_deposits')
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => notify(rejectDeposit(dep.id))}
                                title={!hasPermission('can_approve_deposits') ? 'Permission Required' : 'Reject'}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                                  hasPermission('can_approve_deposits')
                                    ? 'bg-red-800 hover:bg-red-700 text-white'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              By {dep.reviewedBy || 'System'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 3. WITHDRAWAL REQUESTS TAB */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'withdrawals' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xs space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">TRC-20 Withdrawal Requests</h2>
                <p className="text-xs text-slate-400">
                  Verify destination wallet addresses and execute or reject payout requests
                </p>
              </div>

              {/* Filter */}
              <div className="flex gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(['pending', 'completed', 'rejected', 'all'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setWithdrawalFilter(st)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md uppercase transition-colors ${
                      withdrawalFilter === st
                        ? 'bg-red-700 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">UID / Member</th>
                    <th className="py-3 px-3">Withdraw Amount</th>
                    <th className="py-3 px-3">Destination Wallet (TRC-20)</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Requested At</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {withdrawals
                    .filter((w) => {
                      if (withdrawalFilter === 'all') return true;
                      if (withdrawalFilter === 'completed') return w.status === 'completed' || w.status === 'approved';
                      return w.status === withdrawalFilter;
                    })
                    .map((wd) => (
                      <tr key={wd.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-bold text-white block">{wd.username}</span>
                          <span className="text-[11px] font-mono text-slate-400">UID: {wd.userUid}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-rose-400 text-sm block">
                            {wd.amount.toFixed(2)} USDT
                          </span>
                          <span className="text-[10px] text-amber-400 block font-medium">
                            Fee (15%): -{(wd.feeAmount || Number((wd.amount * 0.15).toFixed(2))).toFixed(2)} USDT
                          </span>
                          <span className="text-[11px] font-mono font-bold text-emerald-400 block">
                            Net: +{(wd.netAmount || Number((wd.amount * 0.85).toFixed(2))).toFixed(2)} USDT
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-[260px]">
                          <span
                            className="font-mono text-[11px] text-slate-300 truncate block select-all"
                            title={wd.walletAddress}
                          >
                            {wd.walletAddress}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {wd.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-[10px]">
                              PENDING
                            </span>
                          )}
                          {(wd.status === 'completed' || wd.status === 'approved') && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-[10px]">
                              COMPLETED
                            </span>
                          )}
                          {wd.status === 'rejected' && (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-semibold text-[10px]">
                              REJECTED (REFUNDED)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">{wd.createdAt}</td>
                        <td className="py-3 px-3 text-right">
                          {wd.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => notify(approveWithdrawal(wd.id))}
                                title={!hasPermission('can_approve_withdrawals') ? 'Permission Required' : 'Accept Withdrawal Net Payout'}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                                  hasPermission('can_approve_withdrawals')
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                Accept Payout (85%: {(wd.netAmount || Number((wd.amount * 0.85).toFixed(2))).toFixed(2)} USDT)
                              </button>
                              <button
                                onClick={() => notify(rejectWithdrawal(wd.id))}
                                title={!hasPermission('can_approve_withdrawals') ? 'Permission Required' : 'Reject & Refund'}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                                  hasPermission('can_approve_withdrawals')
                                    ? 'bg-red-800 hover:bg-red-700 text-white'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                Reject & Refund
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              By {wd.reviewedBy || 'System'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 4. USER MANAGEMENT TAB */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'users' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xs space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-bold text-white">Registered User Database</h2>
                  <button
                    onClick={() => {
                      setDemoUsername(`demo_${Math.random().toString(36).substring(2, 7)}`);
                      setDemoPassword('123456');
                      setDemoBalance('500');
                      setDemoSelectedAddress(DEMO_TRC20_ADDRESS_POOL[0]);
                      setDemoWorkPermission(true);
                      setShowDemoModal(true);
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Demo Account</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track auto-assigned 6-digit UIDs, referral codes, work authorizations, demo accounts, and cycle locks
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Account Type Filter */}
                <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                  <button
                    onClick={() => setUserAccountTypeFilter('all')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      userAccountTypeFilter === 'all'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({users.length})
                  </button>
                  <button
                    onClick={() => setUserAccountTypeFilter('real')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      userAccountTypeFilter === 'real'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Real ({users.filter((u) => !u.isDemoAccount).length})
                  </button>
                  <button
                    onClick={() => setUserAccountTypeFilter('demo')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      userAccountTypeFilter === 'demo'
                        ? 'bg-cyan-900/60 text-cyan-200 border border-cyan-500/40 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Demo ({users.filter((u) => !!u.isDemoAccount).length})
                  </button>
                </div>

                {/* Search */}
                <div className="relative w-56">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search UID or Username..."
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg pl-9 pr-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">UID (6-digit)</th>
                    <th className="py-3 px-3">Username & Type</th>
                    <th className="py-3 px-3">Balance (USDT)</th>
                    <th className="py-3 px-3">VIP Tier</th>
                    <th className="py-3 px-3">Bound TRC-20 Wallet</th>
                    <th className="py-3 px-3">Own Code / Referred By</th>
                    <th className="py-3 px-3">Work Permission</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">25-Task Cycle</th>
                    <th className="py-3 px-3">Withdraw Pass</th>
                    <th className="py-3 px-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {users
                    .filter((u) => {
                      if (userAccountTypeFilter === 'real') return !u.isDemoAccount;
                      if (userAccountTypeFilter === 'demo') return !!u.isDemoAccount;
                      return true;
                    })
                    .filter((u) => {
                      if (!userSearch) return true;
                      const q = userSearch.toLowerCase();
                      return u.uid.includes(q) || u.username.toLowerCase().includes(q);
                    })
                    .map((user) => (
                      <tr key={user.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-amber-400">{user.uid}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white block">{user.username}</span>
                            {user.isDemoAccount && (
                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-black uppercase tracking-wider">
                                Demo
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">{user.createdAt.substring(0, 10)}</span>
                          {user.isDemoAccount && (
                            <div className="mt-1 space-y-0.5">
                              <span className="text-[9px] font-mono text-cyan-400 block truncate max-w-[200px]" title={user.demoWalletAddress}>
                                TRC-20: {user.demoWalletAddress ? `${user.demoWalletAddress.substring(0, 8)}...${user.demoWalletAddress.substring(user.demoWalletAddress.length - 6)}` : 'Pool'}
                              </span>
                              <span className="text-[9px] text-cyan-300/90 font-bold block">
                                Combos: #9, #14, #19, #24
                              </span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.isVipAccount && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-bold">
                                ★ VIP (5 Combos)
                              </span>
                            )}
                            {user.isLockedAccount && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-bold">
                                🔒 WD LOCKED
                              </span>
                            )}
                            {user.customCombos && user.customCombos.length > 0 && !user.isDemoAccount && (
                              <span
                                className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold"
                                title={
                                  user.customCombos.length < 5
                                    ? `Hybrid active: ${user.customCombos.length} custom triggers + ${5 - user.customCombos.length} auto-filled fallbacks (${Math.max(5, user.customCombos.length)} combos total per cycle)`
                                    : `Dynamic custom schedule: ${user.customCombos.length} custom combos configured (all ${user.customCombos.length} will trigger without limits)`
                                }
                              >
                                ⚡ {user.customCombos.length} Custom
                                {user.customCombos.length < 5
                                  ? ` + ${5 - user.customCombos.length} Auto (5 Combos)`
                                  : ` Combos (${user.customCombos.length} Active)`}
                              </span>
                            )}
                            {user.balance >= 50000 && (
                              user.taxPaid ? (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                                  ✓ 25% Tax Cleared (Current WD)
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                                  ⚠ Recurring 25% Tax Pending (${(user.balance * 0.25).toFixed(0)})
                                </span>
                              )
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-white text-sm">
                          {user.balance.toFixed(2)} USDT
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[10px] block w-fit">
                              VIP {user.vipLevel}
                            </span>
                          </div>
                        </td>
                        {/* Bound TRC-20 Wallet Column (Locked) */}
                        <td className="py-3 px-3">
                          {user.wallet ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span
                                  className="font-mono text-xs text-emerald-400 font-bold block truncate max-w-[130px] select-all cursor-pointer hover:underline"
                                  title={user.wallet.walletAddress}
                                  onClick={() => {
                                    navigator.clipboard.writeText(user.wallet!.walletAddress);
                                    notify({ success: true, message: 'TRC-20 address copied!' });
                                  }}
                                >
                                  {user.wallet.walletAddress.substring(0, 6)}...{user.wallet.walletAddress.substring(user.wallet.walletAddress.length - 4)}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[9px] font-bold flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5 text-amber-400" /> Locked
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                                {user.wallet.accountName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[10px] italic">Not Bound</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-emerald-400 font-semibold block">
                            Code: {user.inviteCode}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            By: {user.referredBy || 'None'}
                          </span>
                        </td>
                        {/* Work Permission Column */}
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            {user.workPermission !== false ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Granted
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-[10px] inline-flex items-center gap-1">
                                <Lock className="w-3 h-3 text-rose-400" /> Pending
                              </span>
                            )}
                            <button
                              onClick={() => notify(toggleUserWorkPermission(user.id))}
                              title={user.workPermission !== false ? 'Revoke Work Permission' : 'Grant Work Permission (allow task grabbing)'}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold block transition-colors cursor-pointer ${
                                user.workPermission !== false
                                  ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/40'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                              }`}
                            >
                              {user.workPermission !== false ? 'Revoke' : 'Approve'}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {user.status === 'active' ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold text-[10px]">
                              FROZEN
                            </span>
                          )}
                        </td>
                        {/* 25-Task Work Cycle Progress */}
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-xs">
                              <span className="text-white">
                                {user.currentCycleTasks || 0} / 25 Tasks
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                (Cycle #{user.cycleNumber || 1})
                              </span>
                            </div>
                            {(user.currentCycleTasks || 0) >= 25 || !user.cycleApprovedByAdmin ? (
                              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-[10px] inline-flex items-center gap-1">
                                <Lock className="w-3 h-3 text-rose-400" /> Locked (Cycle Done)
                              </span>
                            ) : (
                              <div className="w-28 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(100, (((user.currentCycleTasks || 0) / 25) * 100))}%`,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {user.withdrawalPassword ? (
                            <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Set
                            </span>
                          ) : (
                            <span className="text-amber-400 text-[11px] flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Not Set
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-[440px]">
                            {/* Quick Login / Test Demo Account */}
                            {user.isDemoAccount && (
                              <button
                                onClick={() => {
                                  switchUser(user.id);
                                  setActiveView('user');
                                }}
                                title="Switch to this Demo Account and open User app view"
                                className="px-2 py-1 bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 text-xs font-bold rounded transition-colors flex items-center gap-1 border border-cyan-500/40 cursor-pointer shadow-xs"
                              >
                                <ExternalLink className="w-3 h-3 text-cyan-300" />
                                <span>Login Demo</span>
                              </button>
                            )}

                            {/* Work Permission Toggle */}
                            <button
                              onClick={() => notify(toggleUserWorkPermission(user.id))}
                              title={user.workPermission !== false ? 'Revoke Work Permission' : 'Grant Work Permission (allow task grabbing)'}
                              className={`px-2 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1 cursor-pointer ${
                                user.workPermission !== false
                                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xs ring-1 ring-emerald-400/50'
                              }`}
                            >
                              {user.workPermission !== false ? (
                                <UserCheck className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <ShieldAlert className="w-3 h-3 text-white" />
                              )}
                              <span>{user.workPermission !== false ? 'Work OK' : 'Grant Work'}</span>
                            </button>

                            {/* Reset Task Cycle & Approve Next 25 Tasks Button */}
                            <button
                              onClick={() => notify(resetUserTaskCycle(user.id))}
                              title="Reset Task Cycle & Approve Next 25 Tasks"
                              className={`px-2 py-1 text-xs font-bold rounded transition-all flex items-center gap-1 ${
                                (user.currentCycleTasks || 0) >= 25 || !user.cycleApprovedByAdmin
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md ring-2 ring-amber-400/50'
                                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              <RefreshCw className="w-3 h-3 shrink-0" />
                              <span className="whitespace-nowrap">Approve 25 Tasks</span>
                            </button>

                            {/* Reset to Fresh Cycle 1 Button */}
                            <button
                              onClick={() => notify(resetUserToFreshCycle(user.id))}
                              title="Reset user to Fresh Cycle 1 (Progress 0, 1 Combo planned for Task #14 or #15)"
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded transition-colors flex items-center gap-1 border border-cyan-500/20"
                            >
                              <RotateCcw className="w-3 h-3 text-cyan-400" />
                              <span className="whitespace-nowrap">Fresh Cycle 1</span>
                            </button>

                            {/* VIP Toggle (5 Combo Orders schedule) */}
                            <button
                              onClick={() => notify(toggleUserVip(user.id))}
                              title={user.isVipAccount ? 'Disable VIP Account' : 'Mark as VIP Account (Enforces 5 Combos schedule)'}
                              className={`px-2 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1 ${
                                user.isVipAccount
                                  ? 'bg-purple-900/80 text-purple-200 border border-purple-500 hover:bg-purple-800'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              <Sparkles className="w-3 h-3 text-purple-400" />
                              <span>{user.isVipAccount ? 'VIP (5 Combos)' : 'Set VIP'}</span>
                            </button>

                            {/* Account Lock Toggle (Tasks work, Withdrawal blocked) */}
                            <button
                              onClick={() => notify(toggleUserLock(user.id))}
                              title={user.isLockedAccount ? 'Unlock Account Withdrawal' : 'Lock Account Withdrawal (Tasks work, WD strictly blocked)'}
                              className={`px-2 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1 ${
                                user.isLockedAccount
                                  ? 'bg-rose-900/80 text-rose-200 border border-rose-500 hover:bg-rose-800'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {user.isLockedAccount ? (
                                <Lock className="w-3 h-3 text-rose-400" />
                              ) : (
                                <Unlock className="w-3 h-3 text-slate-400" />
                              )}
                              <span>{user.isLockedAccount ? 'WD Locked' : 'Lock WD'}</span>
                            </button>

                            {/* Custom Combos Config Button */}
                            <button
                              onClick={() => {
                                setComboModalUser(user);
                                setCustomRulesList(user.customCombos || []);
                                setNewComboStep('14');
                                setNewComboDepositPct('36');
                                setNewComboCommPct('20');
                              }}
                              title="Configure Custom Combo Triggers & Percentages"
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded transition-colors flex items-center gap-1 border border-amber-500/20"
                            >
                              <Layers className="w-3 h-3 text-amber-400" />
                              <span>Custom Combos</span>
                            </button>

                            {/* Clear Tax Button if balance >= 50k and not paid */}
                            {user.balance >= 50000 && !user.taxPaid && (
                              <button
                                onClick={() => notify(clearUserTax(user.id))}
                                title="Clear / Approve Recurring 25% Tax Requirement for Current Withdrawal"
                                className="px-2 py-1 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 text-xs font-bold rounded transition-colors flex items-center gap-1 border border-emerald-500"
                              >
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                <span>Clear Tax</span>
                              </button>
                            )}

                            {/* Adjust balance */}
                            <button
                              onClick={() => {
                                setBalanceModalUser({
                                  id: user.id,
                                  username: user.username,
                                  uid: user.uid,
                                  balance: user.balance,
                                });
                                setAdjustAmount('');
                                setAdjustReason('Manual admin adjustment');
                              }}
                              title="Modify USDT balance"
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded transition-colors flex items-center gap-1"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Adjust</span>
                            </button>

                            {/* Reset / Unlock Bound TRC-20 Wallet Address */}
                            <button
                              onClick={() => {
                                setWalletModalUser(user);
                                setAdminWalletAddress(user.wallet?.walletAddress || '');
                                setAdminWalletName(user.wallet?.walletName || 'TRC-20 Wallet');
                                setAdminAccountName(user.wallet?.accountName || user.username);
                                setAdminWalletError('');
                              }}
                              title={user.wallet ? "Reset or Unlock user's bound TRC-20 wallet address" : "Bind / Setup user's TRC-20 wallet address"}
                              className={`px-2 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1 border cursor-pointer ${
                                user.wallet
                                  ? 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-600/60'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                              }`}
                            >
                              <Wallet className="w-3 h-3 text-amber-400" />
                              <span>{user.wallet ? 'Reset Wallet' : 'Bind Wallet'}</span>
                            </button>

                            {/* Reset Password */}
                            <button
                              onClick={() => {
                                setPasswordModalUser({
                                  id: user.id,
                                  username: user.username,
                                  uid: user.uid,
                                });
                                setNewPassword('');
                              }}
                              title="Reset Password"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>

                            {/* Freeze / Unfreeze */}
                            <button
                              onClick={() => notify(toggleUserStatus(user.id))}
                              title={user.status === 'active' ? 'Freeze User' : 'Unfreeze User'}
                              className={`p-1.5 rounded transition-colors ${
                                user.status === 'active'
                                  ? 'bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800/60'
                                  : 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/60'
                              }`}
                            >
                              {user.status === 'active' ? (
                                <Lock className="w-3.5 h-3.5" />
                              ) : (
                                <Unlock className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 5. INVITATION CODE GENERATOR TAB */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'invites' && (
          <div className="space-y-6">
            {/* Generator Form Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Single custom invite generator */}
              <div className="space-y-3 pr-0 md:pr-4 md:border-r border-slate-800">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  Generate Custom System Invite Code
                </h3>
                <p className="text-xs text-slate-400">
                  Super Admin & permitted Sub-Admins can create unlimited system-wide registration codes.
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={newCustomCode}
                    onChange={(e) => setNewCustomCode(e.target.value.toUpperCase())}
                    placeholder="Custom Code (e.g. VIP2026, LUCKY88) or leave blank"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono uppercase text-white focus:outline-hidden focus:ring-1 focus:ring-red-500"
                  />
                  <input
                    type="number"
                    value={newCodeMaxUses}
                    onChange={(e) => setNewCodeMaxUses(e.target.value)}
                    placeholder="Max uses limit (leave blank for unlimited)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <button
                  onClick={() => {
                    const limit = newCodeMaxUses ? parseInt(newCodeMaxUses) : null;
                    const res = generateInviteCode(newCustomCode, limit);
                    notify(res);
                    if (res.success) {
                      setNewCustomCode('');
                      setNewCodeMaxUses('');
                    }
                  }}
                  disabled={!hasPermission('can_generate_invites')}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition-colors ${
                    hasPermission('can_generate_invites')
                      ? 'bg-red-700 hover:bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Generate System Code
                </button>
              </div>

              {/* Bulk generator */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Batch / Bulk Code Generator
                </h3>
                <p className="text-xs text-slate-400">
                  Quickly spin up 5, 10, or 20 system invitation codes with custom prefixes.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                      Prefix:
                    </label>
                    <input
                      type="text"
                      value={bulkPrefix}
                      onChange={(e) => setBulkPrefix(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono uppercase text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                      Count (1 - 20):
                    </label>
                    <select
                      value={bulkCount}
                      onChange={(e) => setBulkCount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="5">5 codes</option>
                      <option value="10">10 codes</option>
                      <option value="20">20 codes</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const res = generateBulkInviteCodes(parseInt(bulkCount), bulkPrefix);
                    notify(res);
                  }}
                  disabled={!hasPermission('can_generate_invites')}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition-colors ${
                    hasPermission('can_generate_invites')
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Generate {bulkCount} Bulk Codes
                </button>
              </div>
            </div>

            {/* Master Tracking Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xs p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Master Invitation Code Registry ({inviteCodes.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Track which codes were generated by system vs generated by users, with registration counts
                  </p>
                </div>

                <div className="flex gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {(['all', 'system', 'user'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setInviteFilter(filter)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md uppercase transition-colors ${
                        inviteFilter === filter
                          ? 'bg-red-700 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {filter} Codes
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">Code</th>
                      <th className="py-3 px-3">Origin Type</th>
                      <th className="py-3 px-3">Created By</th>
                      <th className="py-3 px-3">Usage Count</th>
                      <th className="py-3 px-3">Limit</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Created Date</th>
                      <th className="py-3 px-3 text-right">Toggle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {inviteCodes
                      .filter((c) => (inviteFilter === 'all' ? true : c.type === inviteFilter))
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-amber-400 text-sm">
                            {c.code}
                          </td>
                          <td className="py-3 px-3">
                            {c.type === 'system' ? (
                              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold text-[10px]">
                                SYSTEM
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px]">
                                USER DOWNLINE
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-300">{c.createdBy}</td>
                          <td className="py-3 px-3 font-mono font-bold text-white text-sm">
                            {c.usageCount} registered
                          </td>
                          <td className="py-3 px-3 text-slate-400">
                            {c.maxUses === null ? 'Unlimited' : `${c.maxUses} max`}
                          </td>
                          <td className="py-3 px-3">
                            {c.status === 'active' ? (
                              <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </span>
                            ) : (
                              <span className="text-rose-400 font-semibold text-[11px] flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Disabled
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-400 text-[11px]">
                            {c.createdAt.substring(0, 16)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => toggleInviteCodeStatus(c.id)}
                              className={`px-2.5 py-1 text-xs rounded font-semibold transition-colors ${
                                c.status === 'active'
                                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                  : 'bg-emerald-900/80 text-emerald-200 hover:bg-emerald-800'
                              }`}
                            >
                              {c.status === 'active' ? 'Disable' : 'Enable'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 6. SUB-ADMIN MANAGEMENT & RBAC TAB */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'subadmins' && (
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Sub-Admin Role & Permission Engine</h2>
                <p className="text-xs text-slate-400">
                  Super Admin can create unlimited Sub-Admins with granular, toggleable permissions
                </p>
              </div>

              {currentAdmin.role === 'super_admin' ? (
                <button
                  onClick={() => setShowAddSubAdminModal(true)}
                  className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Sub-Admin Account</span>
                </button>
              ) : (
                <div className="text-xs text-amber-400 bg-amber-950/40 border border-amber-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Only Super Admin can provision sub-admins</span>
                </div>
              )}
            </div>

            {/* Sub-Admin Role Restrictions Notice */}
            {currentAdmin.role === 'sub_admin' && (
              <div className="p-3.5 bg-blue-950/40 border border-blue-800/80 rounded-xl text-xs text-blue-300 flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  <strong>Role Restricted:</strong> Sub-admins cannot alter their own passwords or roles. All credentials, passwords, and permissions are managed exclusively by the Super Admin.
                </span>
              </div>
            )}

            {/* Sub-Admins Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {admins.map((adm) => {
                const isSuper = adm.role === 'super_admin';
                return (
                  <div
                    key={adm.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xs space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                            isSuper
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          <UserCog className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">{adm.name}</h3>
                          <span className="font-mono text-xs text-slate-400">
                            @{adm.username} · Joined {adm.createdAt.substring(0, 10)}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          isSuper
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {isSuper ? 'Super Admin' : 'Sub-Admin'}
                      </span>
                    </div>

                    {/* Permissions list */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Assigned Permissions ({isSuper ? 'Full System' : adm.permissions.length}):
                      </span>

                      <div className="grid grid-cols-2 gap-1.5">
                        {allPermissionsList.map((p) => {
                          const hasIt = isSuper || adm.permissions.includes(p.key);
                          return (
                            <label
                              key={p.key}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] transition-colors ${
                                hasIt
                                  ? 'bg-slate-900 border-slate-700 text-slate-200'
                                  : 'bg-slate-900/30 border-slate-800/80 text-slate-500 line-through'
                              } ${
                                !isSuper && currentAdmin.role === 'super_admin'
                                  ? 'cursor-pointer hover:bg-slate-850'
                                  : 'cursor-default'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={hasIt}
                                disabled={isSuper || currentAdmin.role !== 'super_admin'}
                                onChange={(e) => {
                                  if (isSuper || currentAdmin.role !== 'super_admin') return;
                                  const updated = e.target.checked
                                    ? [...adm.permissions, p.key]
                                    : adm.permissions.filter((k) => k !== p.key);
                                  updateSubAdminPermissions(adm.id, updated);
                                }}
                                className="rounded text-red-600 focus:ring-0 cursor-pointer"
                              />
                              <span className="truncate">{p.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Super Admin Exclusive Authority: Change Sub-Admin Password */}
                    {!isSuper && currentAdmin.role === 'super_admin' && (
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Credentials: <span className="font-mono text-slate-300 font-bold">Protected</span></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSubAdminToEditPassword(adm);
                            setSubAdminNewPass('');
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-500/50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Key className="w-3 h-3 text-amber-400" />
                          <span>Change Password</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 7. SYSTEM WALLET CONFIG TAB */}
        {/* ------------------------------------------------------------- */}
        {/* ------------------------------------------------------------- */}
        {/* 7. SYSTEM WALLET CONFIG TAB & ROTATING POOL */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'wallet' && (
          <div className="max-w-3xl mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  Real Account TRC-20 Wallet & Sequential Rotation Pool
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage multiple TRC-20 deposit addresses for real user accounts. Deposit and combo order payment pages automatically cycle through distinct addresses sequentially across consecutive transactions (Tx #1 &rarr; Address #1, Tx #2 &rarr; Address #2, etc.) to prevent reuse.
                </p>
              </div>
              <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {(systemConfig.trc20AddressPool?.length || 1)} Addresses in Rotation Pool
              </span>
            </div>

            {/* Address Pool List & Add Section */}
            <div className="space-y-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-200 block">
                    Active TRC-20 Addresses Pool (Sequential Rotation)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Cycles sequentially: Tx #1 &rarr; Addr #1 &bull; Tx #2 &rarr; Addr #2 &bull; Tx #3 &rarr; Addr #3...
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBulkPoolInput(!showBulkPoolInput)}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
                >
                  {showBulkPoolInput ? 'Hide Bulk Import' : '+ Bulk Import / Replace'}
                </button>
              </div>

              {/* Add Single Address Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPoolAddress}
                  onChange={(e) => setNewPoolAddress(e.target.value.trim())}
                  placeholder="Paste new TRC-20 address (starts with T)..."
                  disabled={!hasPermission('can_modify_wallet')}
                  className="flex-1 bg-slate-950 border border-slate-800 text-xs font-mono text-white rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newPoolAddress.startsWith('T') || newPoolAddress.length < 30) {
                      notify({ success: false, message: 'Invalid TRON address format (must start with T)' });
                      return;
                    }
                    const pool = systemConfig.trc20AddressPool || [systemConfig.trc20DepositAddress];
                    if (pool.includes(newPoolAddress)) {
                      notify({ success: false, message: 'Address already exists in rotation pool' });
                      return;
                    }
                    const updated = [...pool, newPoolAddress];
                    updateSystemConfig({ trc20AddressPool: updated, trc20DepositAddress: updated[0] });
                    setNewPoolAddress('');
                    notify({ success: true, message: 'Added new TRC-20 address to pool!' });
                  }}
                  disabled={!hasPermission('can_modify_wallet')}
                  className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Pool</span>
                </button>
              </div>

              {/* Bulk Import Textarea */}
              {showBulkPoolInput && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 animate-in fade-in duration-150">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    Bulk Paste TRC-20 Addresses (One address per line):
                  </label>
                  <textarea
                    rows={4}
                    value={bulkPoolText}
                    onChange={(e) => setBulkPoolText(e.target.value)}
                    placeholder="TC14p55R17Neg8Qmom6dj1GmaK1vo2Mpg5&#10;TYDzsYUEpvnYmQk4zGP9sWWcTEd36mDksB&#10;TXn8g8G7Lq17kQmom6dj1GmaK1vo2Mpt9"
                    className="w-full bg-slate-900 border border-slate-800 text-xs font-mono text-white rounded-lg p-2.5 focus:outline-hidden focus:ring-1 focus:ring-red-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkPoolInput(false)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const lines = bulkPoolText
                          .split('\n')
                          .map((l) => l.trim())
                          .filter((l) => l.startsWith('T') && l.length >= 30);
                        if (lines.length === 0) {
                          notify({ success: false, message: 'No valid TRON addresses found' });
                          return;
                        }
                        const unique = Array.from(new Set(lines));
                        updateSystemConfig({ trc20AddressPool: unique, trc20DepositAddress: unique[0] });
                        setBulkPoolText('');
                        setShowBulkPoolInput(false);
                        notify({ success: true, message: `Updated pool with ${unique.length} addresses!` });
                      }}
                      className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Save Address Pool
                    </button>
                  </div>
                </div>
              )}

              {/* Address Pool Cards */}
              <div className="space-y-2 pt-2 max-h-60 overflow-y-auto">
                {(systemConfig.trc20AddressPool && systemConfig.trc20AddressPool.length > 0
                  ? systemConfig.trc20AddressPool
                  : [systemConfig.trc20DepositAddress]
                ).map((addr, idx, arr) => (
                  <div
                    key={addr + idx}
                    className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-6 h-6 rounded-md bg-red-950 text-red-400 border border-red-800/60 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="w-8 h-8 bg-white p-0.5 rounded-sm shrink-0 flex items-center justify-center">
                        <QRCodeSVG value={addr} size={28} className="p-0 border-0 shadow-none" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-mono text-xs text-white font-semibold truncate block">
                          {addr}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {idx === 0
                            ? 'Primary (#1 in sequence • Tx #1, #' + (1 + arr.length) + '...)'
                            : `Rotation #${idx + 1} (Tx #${idx + 1}, #${idx + 1 + arr.length}...`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const pool = systemConfig.trc20AddressPool || [systemConfig.trc20DepositAddress];
                            const filtered = pool.filter((a) => a !== addr);
                            const reordered = [addr, ...filtered];
                            updateSystemConfig({ trc20AddressPool: reordered, trc20DepositAddress: addr });
                            notify({ success: true, message: 'Set as primary address (#1 in rotation)!' });
                          }}
                          disabled={!hasPermission('can_modify_wallet')}
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Set as Primary (#1 in sequence)"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(addr);
                          notify({ success: true, message: 'Address copied to clipboard!' });
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Copy Address"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const pool = systemConfig.trc20AddressPool || [systemConfig.trc20DepositAddress];
                          if (pool.length <= 1) {
                            notify({ success: false, message: 'At least one address must remain in the pool' });
                            return;
                          }
                          const updated = pool.filter((a) => a !== addr);
                          updateSystemConfig({ trc20AddressPool: updated, trc20DepositAddress: updated[0] });
                          notify({ success: true, message: 'Removed address from pool' });
                        }}
                        disabled={!hasPermission('can_modify_wallet')}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
                        title="Delete Address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sequential Rotation Simulation */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-300 font-semibold block">Sequential Rotation Simulator</span>
                  <span className="text-[10px] text-slate-500">Step through consecutive transactions to test sequential rotation</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const pool = systemConfig.trc20AddressPool || [systemConfig.trc20DepositAddress];
                      const nextTx = simulatedTxNumber + 1;
                      setSimulatedTxNumber(nextTx);
                      const addrIdx = (nextTx - 1) % pool.length;
                      setSimulatedAddress(pool[addrIdx]);
                    }}
                    className="px-3 py-1.5 bg-red-800/80 hover:bg-red-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-3 h-3 text-red-300" />
                    <span>Next Transaction (Tx #{simulatedTxNumber + 1})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const pool = systemConfig.trc20AddressPool || [systemConfig.trc20DepositAddress];
                      setSimulatedTxNumber(1);
                      setSimulatedAddress(pool[0]);
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Reset (Tx #1)
                  </button>
                </div>
              </div>

              {simulatedAddress && (
                <div className="p-3 bg-slate-900 border border-slate-700/80 rounded-xl flex items-center gap-3 animate-in fade-in">
                  <div className="w-12 h-12 bg-white p-1 rounded-lg shrink-0 flex items-center justify-center">
                    <QRCodeSVG value={simulatedAddress} size={40} className="p-0 border-0 shadow-none" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-300 text-[10px] font-bold border border-red-800/60">
                        Simulated Transaction #{simulatedTxNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-800/60">
                        Assigned Address #{(((simulatedTxNumber - 1) % (systemConfig.trc20AddressPool?.length || 1)) + 1)} of {(systemConfig.trc20AddressPool?.length || 1)}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-white font-bold truncate block">
                      {simulatedAddress}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      &bull; Next user transaction will sequentially rotate to Address #{((simulatedTxNumber % (systemConfig.trc20AddressPool?.length || 1)) + 1)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* General System Config */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={systemConfig.platformName}
                  onChange={(e) => updateSystemConfig({ platformName: e.target.value })}
                  disabled={!hasPermission('can_modify_wallet')}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Minimum Deposit (USDT)
                  </label>
                  <input
                    type="number"
                    value={systemConfig.minDeposit}
                    onChange={(e) => updateSystemConfig({ minDeposit: parseFloat(e.target.value) || 10 })}
                    disabled={!hasPermission('can_modify_wallet')}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Minimum Withdrawal (USDT)
                  </label>
                  <input
                    type="number"
                    value={systemConfig.minWithdrawal}
                    onChange={(e) => updateSystemConfig({ minWithdrawal: parseFloat(e.target.value) || 10 })}
                    disabled={!hasPermission('can_modify_wallet')}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg px-3 py-2.5"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 8. AUDIT LOGS TAB */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'logs' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xs p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                Immutable System Audit Logs ({auditLogs.length})
              </h2>
              <p className="text-xs text-slate-400">
                Tamper-proof audit trails tracking every administrative deposit, withdrawal, balance adjust, and user freeze action
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">Admin</th>
                    <th className="py-3 px-3">Action Type</th>
                    <th className="py-3 px-3">Target UID</th>
                    <th className="py-3 px-3">Log Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition-colors font-mono text-[11px]">
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white">@{log.adminUsername}</span>
                        <span className="text-[10px] text-slate-400 block">({log.role})</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">{log.targetUserUid || 'N/A'}</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans text-xs">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: Adjust User Balance Modal */}
      {/* ------------------------------------------------------------- */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm">
                Adjust USDT Balance for {balanceModalUser.username}
              </h3>
              <button
                onClick={() => setBalanceModalUser(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-400">
              UID: <strong className="text-white">{balanceModalUser.uid}</strong> · Current
              Balance: <strong className="text-emerald-400">{balanceModalUser.balance.toFixed(2)} USDT</strong>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('credit')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                    adjustType === 'credit'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Credit (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('debit')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                    adjustType === 'debit'
                      ? 'bg-rose-950 text-rose-300 border-rose-700'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Debit (-)
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Amount (USDT)
                </label>
                <input
                  type="number"
                  step="any"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 50.00"
                  className="w-full bg-white border-2 border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-black placeholder:text-black/60 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Audit Reason / Note
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Reason for audit log"
                  className="w-full bg-white border-2 border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-black placeholder:text-black/60 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setBalanceModalUser(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const amt = parseFloat(adjustAmount);
                    if (isNaN(amt) || amt <= 0) {
                      notify({ success: false, message: 'Please enter a valid positive amount.' });
                      return;
                    }
                    const res = adjustUserBalance(
                      balanceModalUser.id,
                      amt,
                      adjustType,
                      adjustReason || 'Manual adjustment'
                    );
                    notify(res);
                    if (res.success) setBalanceModalUser(null);
                  }}
                  className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-bold rounded-lg"
                >
                  Confirm Adjustment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: Reset Password Modal */}
      {/* ------------------------------------------------------------- */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm">
                Reset Password for {passwordModalUser.username}
              </h3>
              <button
                onClick={() => setPasswordModalUser(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResetType('login')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                    resetType === 'login'
                      ? 'bg-red-950 text-red-300 border-red-700'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Login Password
                </button>
                <button
                  type="button"
                  onClick={() => setResetType('withdrawal')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                    resetType === 'withdrawal'
                      ? 'bg-red-950 text-red-300 border-red-700'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Withdrawal Password
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  New {resetType} Password
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter temporary password"
                  className="w-full bg-white border-2 border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-black placeholder:text-black/60 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setPasswordModalUser(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newPassword.trim()) {
                      notify({ success: false, message: 'Please enter a password' });
                      return;
                    }
                    const res = resetUserPassword(passwordModalUser.id, resetType, newPassword.trim());
                    notify(res);
                    if (res.success) setPasswordModalUser(null);
                  }}
                  className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-bold rounded-lg"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: Create Sub-Admin Account Modal */}
      {/* ------------------------------------------------------------- */}
      {showAddSubAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <UserCog className="w-4 h-4 text-red-500" />
                Create New Sub-Admin Account
              </h3>
              <button
                onClick={() => setShowAddSubAdminModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Sub-Admin Username</label>
                <input
                  type="text"
                  value={newSubUsername}
                  onChange={(e) => setNewSubUsername(e.target.value)}
                  placeholder="e.g. sub_auditor"
                  className="w-full bg-white border-2 border-slate-300 rounded-lg px-3 py-2 text-black font-bold placeholder:text-black/60 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Display Name</label>
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g. Senior Compliance Officer"
                  className="w-full bg-white border-2 border-slate-300 rounded-lg px-3 py-2 text-black font-bold placeholder:text-black/60 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Assigned Login Password</label>
                <input
                  type="text"
                  value={newSubPassword}
                  onChange={(e) => setNewSubPassword(e.target.value)}
                  placeholder="Min 4 characters (e.g. sub123456)"
                  className="w-full bg-white border-2 border-slate-300 rounded-lg px-3 py-2 text-black font-mono font-bold placeholder:text-black/60 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Super Admin assigns credentials. Sub-admins cannot change their own passwords.
                </span>
              </div>

              <div className="pt-1">
                <label className="font-bold text-slate-300 block mb-2">
                  Select Granular Role Permissions:
                </label>
                <div className="space-y-2">
                  {allPermissionsList
                    .filter((p) => p.key !== 'can_manage_admins')
                    .map((p) => {
                      const checked = newSubPermissions.includes(p.key);
                      return (
                        <label
                          key={p.key}
                          className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                            checked
                              ? 'bg-slate-900 border-red-800 text-white'
                              : 'bg-slate-900/40 border-slate-800 text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewSubPermissions((prev) => [...prev, p.key]);
                              } else {
                                setNewSubPermissions((prev) => prev.filter((k) => k !== p.key));
                              }
                            }}
                            className="mt-0.5 rounded text-red-600 focus:ring-0"
                          />
                          <div>
                            <span className="font-semibold block">{p.label}</span>
                            <span className="text-[10px] text-slate-400">{p.desc}</span>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubAdminModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newSubUsername.trim()) {
                      notify({ success: false, message: 'Please enter a username.' });
                      return;
                    }
                    if (!newSubPassword.trim() || newSubPassword.trim().length < 4) {
                      notify({ success: false, message: 'Password must be at least 4 characters.' });
                      return;
                    }
                    const res = createSubAdmin(
                      newSubUsername,
                      newSubName,
                      newSubPermissions,
                      newSubPassword
                    );
                    notify(res);
                    if (res.success) {
                      setShowAddSubAdminModal(false);
                      setNewSubUsername('');
                      setNewSubName('');
                      setNewSubPassword('sub123456');
                    }
                  }}
                  className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg font-bold"
                >
                  Create Sub-Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: Custom Combo Configuration Modal */}
      {/* ------------------------------------------------------------- */}
      {comboModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  Custom Combo Orders: {comboModalUser.username}
                </h3>
                <p className="text-[11px] text-slate-400">
                  UID: <span className="font-mono text-amber-400 font-bold">{comboModalUser.uid}</span> · Balance: {comboModalUser.balance.toFixed(2)} USDT
                </p>
              </div>
              <button
                onClick={() => setComboModalUser(null)}
                className="text-slate-400 hover:text-white text-base p-1"
              >
                ✕
              </button>
            </div>

            {/* Explanatory note with Dynamic Multi-Combo / Hybrid indicator */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {customRulesList.length >= 5
                    ? 'Dynamic Custom Multi-Combo Mode'
                    : 'Hybrid Combo Generation (Custom + Auto Fallback)'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {customRulesList.length < 5
                    ? `${customRulesList.length} Custom + ${5 - customRulesList.length} Auto = 5 Total`
                    : `${customRulesList.length} Custom Combos (Dynamic)`}
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                {customRulesList.length >= 5
                  ? `Dynamic combo count active: You have configured ${customRulesList.length} custom combo triggers (e.g., 6 or 7 combos). The system dynamically triggers and generates all ${customRulesList.length} custom combos across this user's 25 tasks without upper limit restrictions.`
                  : `When you configure partial custom combos (${customRulesList.length} triggers), missing slots are automatically filled from the system/VIP rule to maintain the baseline 5 combos. You can configure any arbitrary count (e.g., 6 or 7 combos) with no upper limit.`}
              </p>
            </div>

            {/* Quick Presets for 5, 6, 7 Combos */}
            <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Quick Presets:</span>
                <span className="text-[10px] text-slate-400">Arbitrary count supported (5, 6, 7+ combos)</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCustomRulesList([...DEFAULT_VIP_COMBO_SCHEDULE])}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  title="Default 5-Combo Schedule (Tasks #8, #15, #19, #23, #25)"
                >
                  5-Combo Preset (#8, #15, #19, #23, #25)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomRulesList([...PRESET_6_COMBO_SCHEDULE])}
                  className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  title="6-Combo Dynamic Schedule (Tasks #5, #9, #13, #17, #21, #25)"
                >
                  6-Combo Preset (#5, #9, #13, #17, #21, #25)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomRulesList([...PRESET_7_COMBO_SCHEDULE])}
                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  title="7-Combo Dynamic Schedule (Tasks #4, #8, #12, #15, #18, #22, #25)"
                >
                  7-Combo Preset (#4, #8, #12, #15, #18, #22, #25)
                </button>
              </div>
            </div>

            {/* Current Active Rules */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white block">Active Custom Combo Triggers ({customRulesList.length})</span>
                {customRulesList.length > 0 && (
                  <span className="text-[10px] text-amber-400 font-semibold">
                    Admin specified · No upper limit
                  </span>
                )}
              </div>
              {customRulesList.length === 0 ? (
                <div className="p-3 bg-slate-900/50 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                  No custom triggers configured. Default cycle/VIP rules apply.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {customRulesList
                    .sort((a, b) => a.stepNumber - b.stepNumber)
                    .map((r, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-slate-900 border border-amber-500/30 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black font-mono text-xs border border-amber-500/40">
                            Task #{r.stepNumber}
                          </span>
                          <span className="text-slate-300">
                            Deposit: <strong className="text-rose-400 font-mono">+{r.requiredPercent}%</strong> of balance
                          </span>
                          <span className="text-slate-300">
                            Commission: <strong className="text-emerald-400 font-mono">+{r.commissionPercent}%</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomRulesList((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="text-rose-400 hover:text-rose-300 p-1"
                          title="Remove Rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Complete Dynamic / Hybrid Schedule Preview */}
            {(() => {
              const fullSchedule = generateHybridComboSchedule(comboModalUser, customRulesList);
              return (
                <div className="space-y-1.5 p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      Complete Cycle Combo Schedule ({fullSchedule.length} Combos Total)
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono font-bold">
                      {fullSchedule.length} Combos across 25 Tasks
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1 pt-1 max-h-36 overflow-y-auto">
                    {fullSchedule.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] border ${
                          item.isAutoFallback
                            ? 'bg-slate-950/70 border-slate-800 text-slate-300'
                            : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">
                            Task #{item.stepNumber}
                          </span>
                          <span className="text-slate-400">
                            Dep: <strong className="text-rose-400 font-mono">+{item.requiredPercent}%</strong>
                          </span>
                          <span className="text-slate-400">
                            Comm: <strong className="text-emerald-400 font-mono">+{item.commissionPercent}%</strong>
                          </span>
                        </div>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            item.isAutoFallback
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {item.isAutoFallback ? `Auto Fallback (${item.sourceLabel})` : 'Custom Trigger'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Add New Trigger Form */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 block">+ Add Custom Combo Trigger</span>
                <span className="text-[10px] text-slate-400">Step 1-25 · Any count (e.g. 6, 7 combos)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                    Task Step (1-25)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={newComboStep}
                    onChange={(e) => setNewComboStep(e.target.value)}
                    placeholder="e.g. 14"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                    Required Deposit %
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newComboDepositPct}
                    onChange={(e) => setNewComboDepositPct(e.target.value)}
                    placeholder="e.g. 36"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-rose-300 font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                    Commission %
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newComboCommPct}
                    onChange={(e) => setNewComboCommPct(e.target.value)}
                    placeholder="e.g. 20"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-300 font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const s = parseInt(newComboStep, 10);
                  const dep = parseFloat(newComboDepositPct);
                  const comm = parseFloat(newComboCommPct);
                  if (isNaN(s) || s < 1 || s > 25) {
                    notify({ success: false, message: 'Step number must be between 1 and 25.' });
                    return;
                  }
                  if (isNaN(dep) || dep <= 0) {
                    notify({ success: false, message: 'Please enter a valid deposit percent.' });
                    return;
                  }
                  if (isNaN(comm) || comm <= 0) {
                    notify({ success: false, message: 'Please enter a valid commission percent.' });
                    return;
                  }

                  // Replace if step already exists, or append
                  setCustomRulesList((prev) => {
                    const filtered = prev.filter((r) => r.stepNumber !== s);
                    return [...filtered, { stepNumber: s, requiredPercent: dep, commissionPercent: comm }];
                  });
                }}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-lg transition-colors border border-amber-500/30 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add / Update Trigger for Task #{newComboStep}</span>
              </button>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setCustomRulesList([])}
                className="px-3 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-medium"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setComboModalUser(null)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = setCustomUserCombos(comboModalUser.id, customRulesList);
                  notify(res);
                  if (res.success) setComboModalUser(null);
                }}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-lg text-xs transition-colors"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DEMO ACCOUNT CREATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create & Issue Demo Account</h3>
                  <p className="text-[11px] text-slate-400">
                    Mirrors real account UI with preset 4-combo schedule and fixed TRC-20 address
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 text-xs">
              {/* Username & Password Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Demo Username
                  </label>
                  <input
                    type="text"
                    value={demoUsername}
                    onChange={(e) => setDemoUsername(e.target.value)}
                    placeholder="e.g. demo_trader1"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Initial Password
                  </label>
                  <input
                    type="text"
                    value={demoPassword}
                    onChange={(e) => setDemoPassword(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Initial Balance */}
              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                  Starting Balance (USDT)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={demoBalance}
                  onChange={(e) => setDemoBalance(e.target.value)}
                  placeholder="300"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Tip: Standard demo starting balance is 300 USDT (VIP 1). Final balance after 25 tasks lands accurately between 2200 and 2600 USDT.
                </span>
              </div>

              {/* Fixed TRC-20 Address Pool */}
              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1.5 flex items-center justify-between">
                  <span>Preset TRC-20 Wallet Address Pool (Select 1 of 5)</span>
                  <span className="text-[10px] text-cyan-400 font-normal">Fixed Pool</span>
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {DEMO_TRC20_ADDRESS_POOL.map((addr, idx) => {
                    const isSelected = demoSelectedAddress === addr;
                    return (
                      <div
                        key={addr}
                        onClick={() => setDemoSelectedAddress(addr)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-xs'
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <input
                            type="radio"
                            name="demoAddressRadio"
                            checked={isSelected}
                            onChange={() => setDemoSelectedAddress(addr)}
                            className="text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                          />
                          <div className="truncate">
                            <span className="text-[10px] font-bold text-cyan-400 block">
                              Address #{idx + 1}
                            </span>
                            <span className="font-mono text-[11px] text-slate-200 block truncate">
                              {addr}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(addr);
                            notify({ success: true, message: `Copied Address #${idx + 1}` });
                          }}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white shrink-0"
                          title="Copy Address"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Work Permission Checkbox */}
              <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="demoWorkPermissionCheck"
                  checked={demoWorkPermission}
                  onChange={(e) => setDemoWorkPermission(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                />
                <label htmlFor="demoWorkPermissionCheck" className="cursor-pointer">
                  <span className="font-semibold text-white block text-[11px]">
                    Grant Immediate Work Permission
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Enables demo user to start grabbing tasks immediately without waiting for Admin authorization.
                  </span>
                </label>
              </div>

              {/* Rules Explanatory Box */}
              <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl space-y-1.5 text-[11px] text-cyan-300/90">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Demo Account System Rules</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[10px] text-slate-300">
                  <li>Zero UI/operational difference: perfectly mirrors real user accounts</li>
                  <li>
                    <strong className="text-cyan-200">Balance Target:</strong> Starts at <span className="font-mono font-bold text-white">300 USDT</span>; final balance after completing all 25 tasks strictly lands between <span className="font-mono font-bold text-emerald-300">2300 to 2700 USDT</span> (target ~2500 USDT)
                  </li>
                  <li>
                    <strong className="text-cyan-200">Strict 4-Combo Schedule & Amounts:</strong>
                    <div className="pl-3 pt-0.5 space-y-0.5 text-slate-300">
                      <div>• Task <span className="font-mono font-bold text-white">#9</span>: Combo amount within 150 USDT (135 USDT)</div>
                      <div>• Task <span className="font-mono font-bold text-white">#14</span>: Combo amount within 240 USDT (220 USDT)</div>
                      <div>• Task <span className="font-mono font-bold text-white">#19</span>: Dynamically scaled progress towards target</div>
                      <div>• Task <span className="font-mono font-bold text-white">#24</span>: Final combo strictly over 400 USDT (410–430 USDT, set: 420 USDT)</div>
                    </div>
                  </li>
                  <li>
                    <strong className="text-cyan-200">Dynamic TRC-20 Address Rotation:</strong> Automatically rotates unique addresses across the 4 stages (Pool #1 to #4) without repetition
                  </li>
                  <li>Regular users cannot register or open demo accounts themselves</li>
                  <li>TRC-20 deposit and withdrawal address pre-bound to chosen pool address</li>
                </ul>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const bal = parseFloat(demoBalance);
                  if (!demoUsername.trim()) {
                    notify({ success: false, message: 'Please provide a username for the demo account.' });
                    return;
                  }
                  if (isNaN(bal) || bal < 0) {
                    notify({ success: false, message: 'Please enter a valid starting balance.' });
                    return;
                  }
                  const res = createDemoAccount({
                    username: demoUsername.trim(),
                    password: demoPassword.trim() || '123456',
                    initialBalance: bal,
                    demoWalletAddress: demoSelectedAddress,
                    workPermission: demoWorkPermission,
                  });
                  notify(res);
                  if (res.success && res.user) {
                    setShowDemoModal(false);
                    setCreatedDemoUser(res.user);
                  }
                }}
                className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs transition-all shadow-md cursor-pointer"
              >
                Issue Demo Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CREATED DEMO USER CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {createdDemoUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Demo Account Ready!</h3>
              <p className="text-xs text-slate-400">
                The demo account has been initialized with the 4-combo schedule and TRC-20 address.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Username:</span>
                <span className="font-bold text-white">{createdDemoUser.username}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Password:</span>
                <span className="font-mono font-bold text-cyan-400">{createdDemoUser.password}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Assigned UID:</span>
                <span className="font-mono font-bold text-amber-400">{createdDemoUser.uid}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Balance:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {createdDemoUser.balance.toFixed(2)} USDT (VIP {createdDemoUser.vipLevel})
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Work Permission:</span>
                <span className="font-bold text-emerald-400">Granted ✓</span>
              </div>
              <div className="py-1 border-b border-slate-800">
                <span className="text-slate-400 block mb-0.5">TRC-20 Wallet Address:</span>
                <div className="flex items-center justify-between gap-1 bg-slate-950 p-1.5 rounded font-mono text-[10px] text-cyan-300">
                  <span className="truncate">{createdDemoUser.demoWalletAddress}</span>
                  <button
                    onClick={() => {
                      if (createdDemoUser.demoWalletAddress) {
                        navigator.clipboard.writeText(createdDemoUser.demoWalletAddress);
                        notify({ success: true, message: 'Copied TRC-20 wallet address' });
                      }
                    }}
                    className="p-1 hover:text-white shrink-0"
                    title="Copy"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="py-1">
                <span className="text-slate-400 block mb-0.5">Preset 4-Combos Schedule:</span>
                <span className="font-mono font-bold text-amber-300 text-[11px]">
                  Tasks #9, #14, #19, and #24
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCreatedDemoUser(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  switchUser(createdDemoUser.id);
                  setActiveView('user');
                  setCreatedDemoUser(null);
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Switch to Demo Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: RESET / CORRECT USER TRC-20 WALLET ADDRESS */}
      {/* ------------------------------------------------------------- */}
      {walletModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in select-none">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Manage Bound TRC-20 Wallet: {walletModalUser.username}
                  </h3>
                  <p className="text-xs text-slate-400">
                    UID: <span className="font-mono text-amber-400 font-bold">{walletModalUser.uid}</span>
                    {walletModalUser.isDemoAccount && <span className="ml-2 text-cyan-400 font-bold">(Demo Account)</span>}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setWalletModalUser(null);
                  setAdminWalletError('');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adminWalletError && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{adminWalletError}</span>
              </div>
            )}

            {/* Current Bound Status */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Bound Status:</span>
                {walletModalUser.wallet ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked & Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">
                    Not Bound (Unlocked)
                  </span>
                )}
              </div>
              {walletModalUser.wallet && (
                <>
                  <div className="space-y-1">
                    <span className="text-slate-500 text-[11px]">Bound TRC-20 Address:</span>
                    <p className="font-mono text-xs text-emerald-300 break-all bg-slate-900 p-2 rounded-lg border border-slate-800 select-all">
                      {walletModalUser.wallet.walletAddress}
                    </p>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px] pt-1">
                    <span>Account Holder: {walletModalUser.wallet.accountName}</span>
                    <span>Bound At: {walletModalUser.wallet.boundAt}</span>
                  </div>
                </>
              )}
            </div>

            {/* Action 1: Complete Reset & Unlock */}
            {walletModalUser.wallet && (
              <div className="bg-rose-950/30 border border-rose-900/50 p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  Option 1: Complete Reset & Unlock for Client
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Clear the bound address completely so the client is unlocked to bind a new TRC-20 address on their next withdrawal or in Wallet Management.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const res = resetUserWallet(walletModalUser.id);
                    notify(res);
                    if (res.success) setWalletModalUser(null);
                  }}
                  className="w-full mt-1 py-2 px-3 bg-rose-900/80 hover:bg-rose-800 text-rose-100 text-xs font-bold rounded-xl transition-colors border border-rose-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset & Unlock Address</span>
                </button>
              </div>
            )}

            {/* Action 2: Direct Admin Correction / Setup */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                {walletModalUser.wallet ? 'Option 2: Direct Address Correction (Fix Typo)' : 'Direct Admin Setup'}
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Directly set or correct the member's TRC-20 receiving address to resolve user typos without requiring them to start over.
              </p>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1 font-semibold">
                    TRC-20 Wallet Address (Starts with 'T')
                  </label>
                  <input
                    type="text"
                    value={adminWalletAddress}
                    onChange={(e) => setAdminWalletAddress(e.target.value.trim())}
                    placeholder="e.g. TLedger99WhaleAssetTRC20Security99"
                    className="w-full bg-slate-900 border border-slate-800 text-xs font-mono text-white rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-semibold">Account Holder Name</label>
                    <input
                      type="text"
                      value={adminAccountName}
                      onChange={(e) => setAdminAccountName(e.target.value)}
                      placeholder="Account Holder"
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-semibold">Wallet Label</label>
                    <input
                      type="text"
                      value={adminWalletName}
                      onChange={(e) => setAdminWalletName(e.target.value)}
                      placeholder="TRC-20 Wallet"
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAdminWalletError('');
                  if (!adminWalletAddress || !adminWalletAddress.startsWith('T') || adminWalletAddress.length < 30) {
                    setAdminWalletError('Invalid TRC-20 wallet address. Must start with "T" and be at least 30 characters.');
                    return;
                  }
                  const res = adminUpdateUserWallet(walletModalUser.id, {
                    walletAddress: adminWalletAddress,
                    accountName: adminAccountName || walletModalUser.username,
                    walletName: adminWalletName || 'TRC-20 Wallet',
                  });
                  notify(res);
                  if (res.success) setWalletModalUser(null);
                }}
                className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save & Lock Corrected Address</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 6: Super Admin Security Credentials & Master PIN Modal */}
      {/* ------------------------------------------------------------- */}
      {showSuperSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Super Admin Security Credentials
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Change Super Admin login password & Master Security PIN
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSuperSecurityModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Super Admin Login Password Section */}
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
                <span className="font-bold text-slate-200 block text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>1. Change Super Admin Login Password:</span>
                </span>
                <div>
                  <label className="text-slate-400 block mb-1">New Password</label>
                  <input
                    type="password"
                    value={superNewPassword}
                    onChange={(e) => setSuperNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={superConfirmPassword}
                    onChange={(e) => setSuperConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Master Security PIN Section */}
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
                <span className="font-bold text-slate-200 block text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span>2. Change Master Security PIN:</span>
                </span>
                <div>
                  <label className="text-slate-400 block mb-1">New Master PIN (4-6 digits)</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={superNewPin}
                    onChange={(e) => setSuperNewPin(e.target.value)}
                    placeholder="Leave blank to keep current PIN"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono tracking-widest focus:outline-hidden focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Confirm Master PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={superConfirmPin}
                    onChange={(e) => setSuperConfirmPin(e.target.value)}
                    placeholder="Re-enter new PIN"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono tracking-widest focus:outline-hidden focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSuperSecurityModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (superNewPassword && superNewPassword !== superConfirmPassword) {
                      notify({ success: false, message: 'New password and confirmation do not match.' });
                      return;
                    }
                    if (superNewPin && superNewPin !== superConfirmPin) {
                      notify({ success: false, message: 'New Master PIN and confirmation do not match.' });
                      return;
                    }
                    if (!superNewPassword && !superNewPin) {
                      notify({ success: false, message: 'Please provide a new password or a new Master PIN to update.' });
                      return;
                    }
                    const res = updateSuperAdminSecurity(
                      superNewPassword || undefined,
                      superNewPin || undefined
                    );
                    notify(res);
                    if (res.success) {
                      setShowSuperSecurityModal(false);
                      setSuperNewPassword('');
                      setSuperConfirmPassword('');
                      setSuperNewPin('');
                      setSuperConfirmPin('');
                    }
                  }}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg font-bold"
                >
                  Save Credentials
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 7: Sub-Admin Password Change Modal (Super Admin Authority) */}
      {/* ------------------------------------------------------------- */}
      {subAdminToEditPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Change Sub-Admin Password
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Target: <span className="font-bold text-white">{subAdminToEditPassword.name}</span> (@{subAdminToEditPassword.username})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSubAdminToEditPassword(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-xl text-amber-200 text-[11px] leading-relaxed">
                Super Admin holds exclusive authority over all sub-admin accounts. Sub-admins cannot change their own credentials.
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  New Password for @{subAdminToEditPassword.username}
                </label>
                <input
                  type="text"
                  value={subAdminNewPass}
                  onChange={(e) => setSubAdminNewPass(e.target.value)}
                  placeholder="Enter new password (min 4 characters)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSubAdminToEditPassword(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!subAdminNewPass.trim() || subAdminNewPass.trim().length < 4) {
                      notify({ success: false, message: 'Password must be at least 4 characters long.' });
                      return;
                    }
                    const res = updateSubAdminPassword(subAdminToEditPassword.id, subAdminNewPass);
                    notify(res);
                    if (res.success) {
                      setSubAdminToEditPassword(null);
                      setSubAdminNewPass('');
                    }
                  }}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg font-bold"
                >
                  Update Sub-Admin Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
