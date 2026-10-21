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
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Trash2,
  Unlock,
  UserCheck,
  UserCog,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminPermission, AdminUser } from '../../types';

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
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'deposits' | 'withdrawals' | 'users' | 'invites' | 'subadmins' | 'wallet' | 'logs'
  >('overview');

  // Search & filter states
  const [userSearch, setUserSearch] = useState('');
  const [inviteFilter, setInviteFilter] = useState<'all' | 'system' | 'user'>('all');
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('pending');

  // Balance adjustment modal state
  const [balanceModalUser, setBalanceModalUser] = useState<{ id: string; username: string; uid: string; balance: number } | null>(null);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Password reset modal state
  const [passwordModalUser, setPasswordModalUser] = useState<{ id: string; username: string; uid: string } | null>(null);
  const [resetType, setResetType] = useState<'login' | 'withdrawal'>('login');
  const [newPassword, setNewPassword] = useState('');

  // Invite code creation state
  const [newCustomCode, setNewCustomCode] = useState('');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState('');
  const [bulkCount, setBulkCount] = useState('5');
  const [bulkPrefix, setBulkPrefix] = useState('SYS');

  // Sub-admin creation state
  const [showAddSubAdminModal, setShowAddSubAdminModal] = useState(false);
  const [newSubUsername, setNewSubUsername] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubPermissions, setNewSubPermissions] = useState<AdminPermission[]>([
    'can_manage_users',
    'can_view_logs',
  ]);

  // Wallet address edit state
  const [editWalletAddress, setEditWalletAddress] = useState(systemConfig.trc20DepositAddress);
  const [walletSavedToast, setWalletSavedToast] = useState(false);

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
                        <td className="py-3 px-3 font-mono font-bold text-rose-400 text-sm">
                          -{wd.amount.toFixed(2)} USDT
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
                                title={!hasPermission('can_approve_withdrawals') ? 'Permission Required' : 'Accept Withdrawal'}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                                  hasPermission('can_approve_withdrawals')
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                Accept (Complete)
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
                <h2 className="text-base font-bold text-white">Registered User Database</h2>
                <p className="text-xs text-slate-400">
                  Track auto-assigned 6-digit UIDs, referral codes, balances, and security freeze/reset actions
                </p>
              </div>

              {/* Search */}
              <div className="relative w-64">
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

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">UID (6-digit)</th>
                    <th className="py-3 px-3">Username</th>
                    <th className="py-3 px-3">Balance (USDT)</th>
                    <th className="py-3 px-3">VIP Tier</th>
                    <th className="py-3 px-3">Own Code / Referred By</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Withdraw Pass</th>
                    <th className="py-3 px-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {users
                    .filter((u) => {
                      if (!userSearch) return true;
                      const q = userSearch.toLowerCase();
                      return u.uid.includes(q) || u.username.toLowerCase().includes(q);
                    })
                    .map((user) => (
                      <tr key={user.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-amber-400">{user.uid}</td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-white block">{user.username}</span>
                          <span className="text-[10px] text-slate-500">{user.createdAt.substring(0, 10)}</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-white text-sm">
                          {user.balance.toFixed(2)} USDT
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[10px]">
                            VIP {user.vipLevel}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-emerald-400 font-semibold block">
                            Code: {user.inviteCode}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            By: {user.referredBy || 'None'}
                          </span>
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
                          <div className="flex items-center justify-end gap-1.5">
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
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 7. SYSTEM WALLET CONFIG TAB */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'wallet' && (
          <div className="max-w-2xl mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                System TRC-20 Wallet Configuration
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure the master TRON (TRC-20) address that is shown to all users on the Deposit screen
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Official TRC-20 Deposit Wallet Address
                </label>
                <input
                  type="text"
                  value={editWalletAddress}
                  onChange={(e) => setEditWalletAddress(e.target.value.trim())}
                  disabled={!hasPermission('can_modify_wallet')}
                  className="w-full bg-slate-900 border border-slate-800 text-xs font-mono text-white rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Must be a valid TRON address starting with "T". Updating this will immediately
                  reflect on the user QR deposit page.
                </p>
              </div>

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

              <button
                onClick={() => {
                  if (!editWalletAddress.startsWith('T') || editWalletAddress.length < 30) {
                    notify({ success: false, message: 'Invalid TRON address format (must start with T)' });
                    return;
                  }
                  updateSystemConfig({ trc20DepositAddress: editWalletAddress });
                  notify({ success: true, message: 'Official TRC-20 deposit wallet updated!' });
                }}
                disabled={!hasPermission('can_modify_wallet')}
                className={`w-full py-2.5 rounded-lg text-xs font-bold transition-colors ${
                  hasPermission('can_modify_wallet')
                    ? 'bg-red-700 hover:bg-red-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Save System Configuration
              </button>
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
                    const res = createSubAdmin(newSubUsername, newSubName, newSubPermissions);
                    notify(res);
                    if (res.success) {
                      setShowAddSubAdminModal(false);
                      setNewSubUsername('');
                      setNewSubName('');
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
    </div>
  );
};
