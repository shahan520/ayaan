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
  Menu,
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
  Headphones,
  Activity,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchChatThreads, connectChatWebSocket } from '../../utils/chatClient';
import { fetchMonitoringRecords, connectMonitorWebSocket } from '../../utils/monitoringClient';
import { AdminSupportChat } from './AdminSupportChat';
import { AdminUserMonitoring } from './AdminUserMonitoring';
import { AdminUserRecoveryModal } from './AdminUserRecoveryModal';
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
    orders,
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
    recalculateUserBalanceFromDeposits,
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
    recoverUserStateAndOrder,
    resetUserWallet,
    adminUpdateUserWallet,
    switchUser,
    setActiveView,
    adminLogout,
    updateSubAdminPassword,
    updateSuperAdminSecurity,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'deposits' | 'withdrawals' | 'users' | 'monitoring' | 'invites' | 'subadmins' | 'wallet' | 'logs' | 'support'
  >('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const syncSupportUnread = async () => {
      try {
        const { totalUnread } = await fetchChatThreads();
        if (mounted) setSupportUnreadCount(totalUnread);
      } catch {
        // Ignore transient network errors
      }
    };
    syncSupportUnread();

    const disconnectChat = connectChatWebSocket({
      role: 'admin',
      onMessage: () => {
        syncSupportUnread();
      },
      onRead: () => {
        syncSupportUnread();
      },
      onReconnect: () => {
        syncSupportUnread();
      },
    });

    const syncOnlineUsers = async () => {
      try {
        const { onlineCount } = await fetchMonitoringRecords();
        if (mounted) setOnlineUsersCount(onlineCount);
      } catch {
        // Ignore transient network errors
      }
    };
    syncOnlineUsers();

    const disconnectMonitor = connectMonitorWebSocket({
      role: 'admin',
      onSnapshot: (records) => {
        if (mounted) setOnlineUsersCount(records.filter((r) => r.isOnline).length);
      },
      onUpdate: () => {
        syncOnlineUsers();
      },
      onReconnect: () => {
        syncOnlineUsers();
      },
    });

    return () => {
      mounted = false;
      disconnectChat();
      disconnectMonitor();
    };
  }, []);

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
  const [demoWorkPermission, setDemoWorkPermission] = useState(false);
  const [createdDemoUser, setCreatedDemoUser] = useState<User | null>(null);

  // Balance adjustment modal state
  const [balanceModalUser, setBalanceModalUser] = useState<{ id: string; username: string; uid: string; balance: number } | null>(null);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit' | 'set'>('credit');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [processingDepositIds, setProcessingDepositIds] = useState<Set<string>>(new Set());

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

  // Comprehensive User State & Order Recovery Modal
  const [recoveryModalUser, setRecoveryModalUser] = useState<User | null>(null);

  // Mandatory Confirmation Dialog State for Critical Admin Actions
  const [pendingConfirmAction, setPendingConfirmAction] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'success';
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [isConfirmExecuting, setIsConfirmExecuting] = useState(false);

  const requestConfirmation = (opts: {
    title: string;
    description: string;
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'success';
    onConfirm: () => Promise<void> | void;
  }) => {
    setPendingConfirmAction(opts);
  };

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

  const navSections = [
    {
      sectionLabel: 'Operations',
      items: [
        { key: 'overview' as const, label: 'Dashboard Overview', icon: Layers, badge: null },
        {
          key: 'deposits' as const,
          label: 'Deposit Approvals',
          icon: ArrowDownLeft,
          badge: pendingDepositsCount > 0 ? pendingDepositsCount : null,
          badgeTone: 'amber' as const,
        },
        {
          key: 'withdrawals' as const,
          label: 'Withdrawal Payouts',
          icon: ArrowUpRight,
          badge: pendingWithdrawalsCount > 0 ? pendingWithdrawalsCount : null,
          badgeTone: 'amber' as const,
        },
        { key: 'users' as const, label: 'User Directory', icon: Users, badge: null },
        {
          key: 'monitoring' as const,
          label: 'Live Activity Monitor',
          icon: Activity,
          badge: onlineUsersCount > 0 ? onlineUsersCount : null,
          badgeTone: 'emerald' as const,
        },
      ],
    },
    {
      sectionLabel: 'Platform & Support',
      items: [
        { key: 'invites' as const, label: 'Invite Codes', icon: Tag, badge: null },
        { key: 'subadmins' as const, label: 'Roles & Permissions', icon: UserCog, badge: null },
        { key: 'wallet' as const, label: 'Treasury Wallet', icon: Wallet, badge: null },
        {
          key: 'support' as const,
          label: 'Live Support Desk',
          icon: Headphones,
          badge: supportUnreadCount > 0 ? supportUnreadCount : null,
          badgeTone: 'red' as const,
        },
        { key: 'logs' as const, label: 'Audit Logs', icon: History, badge: null },
      ],
    },
  ];

  const renderSidebarNav = (isMobileDrawer = false) => (
    <div className="flex flex-col h-full">
      {/* Sidebar Brand Strip */}
      <div className="px-5 py-4 border-b border-slate-800/90 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-700 to-amber-600/90 border border-red-500/40 flex items-center justify-center text-white shadow-sm shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-white tracking-tight truncate">
              WorldexaGlobal
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/90">
              Enterprise Admin
            </div>
          </div>
        </div>
        {isMobileDrawer && (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation menu"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Admin Navigation">
        {navSections.map((group) => (
          <div key={group.sectionLabel} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              {group.sectionLabel}
            </div>
            {group.items.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              const badgeClasses =
                tab.badgeTone === 'emerald'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : tab.badgeTone === 'red'
                  ? 'bg-red-500 text-white'
                  : 'bg-amber-400 text-slate-950';

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    if (isMobileDrawer) setIsSidebarOpen(false);
                  }}
                  className={`group relative w-full flex items-center justify-between gap-2.5 pl-3.5 pr-3 py-2.5 rounded-xl text-[13px] transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-red-950/90 via-red-950/55 to-slate-900/60 text-white font-semibold border border-red-800/60 shadow-xs'
                      : 'text-slate-400 font-medium hover:text-slate-100 hover:bg-slate-900/90 border border-transparent'
                  }`}
                >
                  {/* Sleek Red/Amber Active Indicator Bar */}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-red-500 via-rose-500 to-amber-400"
                    />
                  )}
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-amber-400'
                          : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span className="truncate">{tab.label}</span>
                  </span>
                  {tab.badge !== null && tab.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums shrink-0 leading-none ${badgeClasses}`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Operator Footer */}
      <div className="px-4 py-3 border-t border-[#1b2436] bg-[#080c14]">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="text-slate-400 truncate font-medium">{currentAdmin.name}</span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#131b2c] border border-[#222f46] text-slate-300 uppercase font-semibold shrink-0">
            {currentAdmin.role === 'super_admin' ? 'Root' : 'RBAC'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Fixed Left Vertical Sidebar (Desktop) */}
      <aside className="hidden lg:flex lg:flex-col w-[250px] shrink-0 bg-[#080c14] border-r border-[#1b2436] sticky top-0 h-screen select-none z-20">
        {renderSidebarNav(false)}
      </aside>

      {/* Collapsible Drawer Sidebar (Mobile / Tablet) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="relative z-10 w-[250px] max-w-[82vw] h-full bg-[#080c14] border-r border-[#1b2436] flex flex-col shadow-2xl">
            {renderSidebarNav(true)}
          </aside>
        </div>
      )}

      {/* Right Main Workspace Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Admin Header Bar */}
        <header className="bg-[#0b0f19]/95 backdrop-blur-sm border-b border-[#1b2436] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="w-9 h-9 rounded-xl bg-red-900/60 border border-red-700/50 hidden sm:flex lg:hidden items-center justify-center text-red-400 font-bold shadow-md shrink-0">
              <Shield className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight truncate">
                  WorldexaGlobal Admin Console
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 uppercase font-bold shrink-0">
                  RBAC Active
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Role-Based Access Control · Financial Settlements · Audit Trails
              </p>
            </div>
          </div>

          {/* Current Admin Role Switcher & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 bg-[#111827] border border-[#1e293b] rounded-xl p-1.5">
            <div className="px-2.5 py-1 text-left hidden xl:block">
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

            <div className="h-7 w-px bg-slate-800 hidden xl:block" />

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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs text-amber-300 font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-xs text-red-200 font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Exit Admin</span>
            </button>
          </div>
        </header>

        {/* Global Feedback Toast */}
        {feedback && (
          <div
            className={`mx-4 sm:mx-6 mt-4 p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-200 ${
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

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-5 max-w-[1600px] w-full mx-auto space-y-5">
        {/* ------------------------------------------------------------- */}
        {/* 1. OVERVIEW TAB */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0f1523] border border-[#1d273b] p-4 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Total Users</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-extrabold text-white font-mono tabular-nums">{totalUsersCount}</div>
                <div className="text-[11px] text-slate-500 mt-1">100% verified by invite codes</div>
              </div>

              <div className="bg-[#0f1523] border border-[#1d273b] p-4 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Pending Deposits
                  </span>
                  <ArrowDownLeft className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-extrabold text-amber-400 font-mono tabular-nums">
                  {pendingDepositsCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Requires TXID review</div>
              </div>

              <div className="bg-[#0f1523] border border-[#1d273b] p-4 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Pending Payouts
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-extrabold text-rose-400 font-mono tabular-nums">
                  {pendingWithdrawalsCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Awaiting one-click transfer</div>
              </div>

              <div className="bg-[#0f1523] border border-[#1d273b] p-4 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Total Volume (USDT)
                  </span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
                  +{totalApprovedDepositsAmount.toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
                  Settled payouts: -{totalApprovedWithdrawalsAmount.toFixed(2)} USDT
                </div>
              </div>
            </div>

            {/* Quick Actions & System Health */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0f1523] border border-[#1d273b] p-5 rounded-xl space-y-3 md:col-span-2">
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
                        className={`p-2.5 rounded-lg border text-xs ${
                          granted
                            ? 'bg-[#141c2d] border-emerald-900/60 text-emerald-300'
                            : 'bg-[#0b101b] border-[#1b2436] text-slate-500 line-through opacity-60'
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

              <div className="bg-[#0f1523] border border-[#1d273b] p-5 rounded-xl space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  Official TRC-20 System Wallet
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Active one-time receiver address served to users in Deposit QR screen:
                </p>
                <div className="p-2.5 bg-[#0b101b] border border-[#1d273b] rounded-lg font-mono text-xs text-slate-200 break-all select-all">
                  {systemConfig.trc20DepositAddress}
                </div>
                <button
                  onClick={() => setActiveTab('wallet')}
                  className="w-full py-2 bg-[#141c2d] hover:bg-[#1a2438] text-slate-200 border border-[#222f46] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
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
          <div className="bg-[#0f1523] border border-[#1d273b] rounded-xl overflow-hidden space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-white">TRC-20 USDT Deposit Management</h2>
                <p className="text-xs text-slate-400">
                  Review transaction hashes (TXIDs) and one-click credit user balances
                </p>
              </div>

              {/* Filter */}
              <div className="flex gap-1 bg-[#141c2d] p-1 rounded-lg border border-[#1d273b]">
                {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setDepositFilter(st)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md uppercase transition-colors cursor-pointer ${
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
                <thead className="bg-[#141c2d] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-y border-[#1d273b]">
                  <tr>
                    <th className="py-2.5 px-3">UID / User</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Network</th>
                    <th className="py-2.5 px-3">TXID / Transaction Hash</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Submitted</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2336]">
                  {deposits
                    .filter((d) => (depositFilter === 'all' ? true : d.status === depositFilter))
                    .map((dep) => (
                      <tr key={dep.id} className="hover:bg-[#141d2f] transition-colors">
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
                                disabled={!hasPermission('can_approve_deposits') || processingDepositIds.has(dep.id)}
                                onClick={() => {
                                  if (processingDepositIds.has(dep.id)) return;
                                  requestConfirmation({
                                    title: 'Approve Deposit Request?',
                                    description: `Are you sure you want to approve +${dep.amount.toFixed(2)} USDT deposit for ${dep.username} (UID: ${dep.userUid})? This will credit their account balance. Click Confirm to proceed.`,
                                    confirmLabel: 'Confirm Approve',
                                    variant: 'success',
                                    onConfirm: async () => {
                                      setProcessingDepositIds((prev) => new Set(prev).add(dep.id));
                                      try {
                                        const res = await approveDeposit(dep.id);
                                        notify(res);
                                      } finally {
                                        setProcessingDepositIds((prev) => {
                                          const next = new Set(prev);
                                          next.delete(dep.id);
                                          return next;
                                        });
                                      }
                                    },
                                  });
                                }}
                                title={!hasPermission('can_approve_deposits') ? 'Permission Required' : 'Approve Deposit'}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                                  hasPermission('can_approve_deposits') && !processingDepositIds.has(dep.id)
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                {processingDepositIds.has(dep.id) ? 'Approving...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => {
                                  if (!hasPermission('can_approve_deposits')) {
                                    notify(rejectDeposit(dep.id));
                                    return;
                                  }
                                  requestConfirmation({
                                    title: 'Reject Deposit Request?',
                                    description: `Are you sure you want to reject the +${dep.amount.toFixed(2)} USDT deposit request from ${dep.username} (UID: ${dep.userUid})? Click Confirm to proceed.`,
                                    confirmLabel: 'Confirm Reject',
                                    variant: 'danger',
                                    onConfirm: () => {
                                      notify(rejectDeposit(dep.id));
                                    },
                                  });
                                }}
                                title={!hasPermission('can_approve_deposits') ? 'Permission Required' : 'Reject'}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
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
          <div className="bg-[#0f1523] border border-[#1d273b] rounded-xl overflow-hidden space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-white">TRC-20 Withdrawal Requests</h2>
                <p className="text-xs text-slate-400">
                  Verify destination wallet addresses and execute or reject payout requests
                </p>
              </div>

              {/* Filter */}
              <div className="flex gap-1 bg-[#141c2d] p-1 rounded-lg border border-[#1d273b]">
                {(['pending', 'completed', 'rejected', 'all'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setWithdrawalFilter(st)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md uppercase transition-colors cursor-pointer ${
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
                <thead className="bg-[#141c2d] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-y border-[#1d273b]">
                  <tr>
                    <th className="py-2.5 px-3">UID / Member</th>
                    <th className="py-2.5 px-3">Withdraw Amount</th>
                    <th className="py-2.5 px-3">Destination Wallet (TRC-20)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Requested At</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2336]">
                  {withdrawals
                    .filter((w) => {
                      if (withdrawalFilter === 'all') return true;
                      if (withdrawalFilter === 'completed') return w.status === 'completed' || w.status === 'approved';
                      return w.status === withdrawalFilter;
                    })
                    .map((wd) => (
                      <tr key={wd.id} className="hover:bg-[#141d2f] transition-colors">
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
                                onClick={() => {
                                  if (!hasPermission('can_approve_withdrawals')) {
                                    notify(approveWithdrawal(wd.id));
                                    return;
                                  }
                                  const netAmt = (wd.netAmount || Number((wd.amount * 0.85).toFixed(2))).toFixed(2);
                                  requestConfirmation({
                                    title: 'Approve Withdrawal Payout?',
                                    description: `Are you sure you want to approve the ${wd.amount.toFixed(2)} USDT withdrawal (Net 85% payout: ${netAmt} USDT) for ${wd.username} (UID: ${wd.userUid})? Click Confirm to proceed.`,
                                    confirmLabel: 'Confirm Payout',
                                    variant: 'success',
                                    onConfirm: () => {
                                      notify(approveWithdrawal(wd.id));
                                    },
                                  });
                                }}
                                title={!hasPermission('can_approve_withdrawals') ? 'Permission Required' : 'Accept Withdrawal Net Payout'}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                                  hasPermission('can_approve_withdrawals')
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                Accept Payout (85%: {(wd.netAmount || Number((wd.amount * 0.85).toFixed(2))).toFixed(2)} USDT)
                              </button>
                              <button
                                onClick={() => {
                                  if (!hasPermission('can_approve_withdrawals')) {
                                    notify(rejectWithdrawal(wd.id));
                                    return;
                                  }
                                  requestConfirmation({
                                    title: 'Reject Withdrawal & Refund?',
                                    description: `Are you sure you want to reject the ${wd.amount.toFixed(2)} USDT withdrawal for ${wd.username} (UID: ${wd.userUid}) and refund the full amount to their balance? Click Confirm to proceed.`,
                                    confirmLabel: 'Confirm Reject & Refund',
                                    variant: 'danger',
                                    onConfirm: () => {
                                      notify(rejectWithdrawal(wd.id));
                                    },
                                  });
                                }}
                                title={!hasPermission('can_approve_withdrawals') ? 'Permission Required' : 'Reject & Refund'}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
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
          <div className="bg-[#0f1523] border border-[#1d273b] rounded-xl overflow-hidden space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold text-white">Registered User Database</h2>
                  <button
                    onClick={() => {
                      setDemoUsername(`demo_${Math.random().toString(36).substring(2, 7)}`);
                      setDemoPassword('123456');
                      setDemoBalance('500');
                      setDemoSelectedAddress(DEMO_TRC20_ADDRESS_POOL[0]);
                      setDemoWorkPermission(true);
                      setShowDemoModal(true);
                    }}
                    className="px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-[11px] rounded-lg shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Demo</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Track auto-assigned 6-digit UIDs, referral codes, work authorizations, demo accounts, and cycle locks
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Account Type Filter */}
                <div className="flex bg-[#141c2d] border border-[#1d273b] rounded-lg p-0.5 text-[11px]">
                  <button
                    onClick={() => setUserAccountTypeFilter('all')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      userAccountTypeFilter === 'all'
                        ? 'bg-[#1e2940] text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({users.length})
                  </button>
                  <button
                    onClick={() => setUserAccountTypeFilter('real')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      userAccountTypeFilter === 'real'
                        ? 'bg-[#1e2940] text-white shadow-xs'
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
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search UID or Username..."
                    className="w-full bg-slate-900 border border-[#222f46] text-xs text-white rounded-lg pl-8 pr-3 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto lg:overflow-x-hidden">
              <table className="w-full text-left text-[11px] text-slate-300">
                <thead className="bg-[#141c2d] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-y border-[#1d273b]">
                  <tr>
                    <th className="py-2 px-1.5 sm:px-2">User &amp; UID</th>
                    <th className="py-2 px-1.5 sm:px-2">Balance</th>
                    <th className="py-2 px-1.5 sm:px-2">VIP</th>
                    <th className="py-2 px-1.5 sm:px-2">Wallet</th>
                    <th className="py-2 px-1.5 sm:px-2">Code</th>
                    <th className="py-2 px-1.5 sm:px-2">Work Auth</th>
                    <th className="py-2 px-1.5 sm:px-2">Status</th>
                    <th className="py-2 px-1.5 sm:px-2">Task Cycle</th>
                    <th className="py-2 px-1.5 sm:px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2336]">
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
                    .map((user) => {
                      const referrerUser = users.find(
                        (u) =>
                          u.inviteCode === user.referredBy ||
                          u.uid === user.referredBy ||
                          (user.referredBy && u.username.toLowerCase() === user.referredBy.toLowerCase())
                      );
                      return (
                      <tr
                        key={user.id}
                        onClick={() => setRecoveryModalUser(user)}
                        title="Click row to open Edit User State & Order Details"
                        className="hover:bg-[#141d2f] transition-colors cursor-pointer group align-middle"
                      >
                        <td className="py-2 px-1.5 sm:px-2 max-w-[170px]">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="font-semibold text-white text-xs truncate group-hover:text-amber-300 transition-colors">
                              {user.username}
                            </span>
                            {user.isDemoAccount && (
                              <span className="px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-black uppercase tracking-wider shrink-0">
                                Demo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 font-mono tabular-nums">
                            <span className="group-hover:text-amber-300 transition-colors">
                              UID: {user.uid}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-500 font-sans truncate">{user.createdAt.substring(0, 10)}</span>
                          </div>
                          {user.isDemoAccount && (
                            <div className="mt-0.5 space-y-0.5">
                              <span className="text-[9px] font-mono text-cyan-400 block truncate max-w-[155px]" title={user.demoWalletAddress}>
                                {user.demoWalletAddress ? `${user.demoWalletAddress.substring(0, 6)}...${user.demoWalletAddress.substring(user.demoWalletAddress.length - 5)}` : 'Pool'}
                              </span>
                              <span className="text-[9px] text-cyan-300/90 font-bold block">
                                Combos: #9, #14, #19, #24
                              </span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.isVipAccount && (
                              <span className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-bold">
                                ★ VIP (5)
                              </span>
                            )}
                            {user.isLockedAccount && (
                              <span className="px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-bold">
                                🔒 WD LOCKED
                              </span>
                            )}
                            {user.customCombos && user.customCombos.length > 0 && !user.isDemoAccount && (
                              <span
                                className="px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold"
                                title={
                                  user.customCombos.length < 5
                                    ? `Hybrid active: ${user.customCombos.length} custom triggers + ${5 - user.customCombos.length} auto-filled fallbacks (${Math.max(5, user.customCombos.length)} combos total per cycle)`
                                    : `Dynamic custom schedule: ${user.customCombos.length} custom combos configured (all ${user.customCombos.length} will trigger without limits)`
                                }
                              >
                                ⚡ {user.customCombos.length} Custom
                              </span>
                            )}
                            {user.balance >= 50000 && (
                              user.taxPaid ? (
                                <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                                  ✓ Tax OK
                                </span>
                              ) : (
                                <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                                  ⚠ 25% Tax (${(user.balance * 0.25).toFixed(0)})
                                </span>
                              )
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-1.5 sm:px-2 font-mono font-bold text-white tabular-nums">
                          <span className="text-xs block">{user.balance.toFixed(2)}</span>
                          <span className="text-[9px] text-slate-500 font-semibold">USDT</span>
                        </td>
                        <td className="py-2 px-1.5 sm:px-2 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/35 font-bold text-[10px] inline-block">
                            VIP {user.vipLevel}
                          </span>
                        </td>
                        {/* Bound TRC-20 Wallet Column (Locked) */}
                        <td className="py-2 px-1.5 sm:px-2 max-w-[125px]">
                          {user.wallet ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span
                                  className="font-mono text-[11px] text-emerald-400 font-bold truncate select-all cursor-pointer hover:underline"
                                  title={`${user.wallet.walletAddress} (Locked)`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(user.wallet!.walletAddress);
                                    notify({ success: true, message: 'TRC-20 address copied!' });
                                  }}
                                >
                                  {user.wallet.walletAddress.substring(0, 5)}...{user.wallet.walletAddress.substring(user.wallet.walletAddress.length - 4)}
                                </span>
                                <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" aria-label="Wallet Locked" />
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {user.wallet.accountName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[10px] italic">Not Bound</span>
                          )}
                        </td>
                        <td className="py-2 px-1.5 sm:px-2 max-w-[130px]">
                          <div className="space-y-0.5">
                            <span className="font-mono text-emerald-400 font-bold block text-[11px] truncate">
                              {user.inviteCode || user.uid}
                            </span>
                            <div className="text-[10px] text-slate-400 truncate" title={user.referredBy ? `Referred by: ${user.referredBy}${referrerUser ? ` (${referrerUser.username})` : ''}` : 'Direct / None'}>
                              {user.referredBy ? (
                                <span className="font-mono text-slate-300">
                                  Ref: {user.referredBy}
                                  {referrerUser && (
                                    <span className="text-emerald-400 ml-1 font-sans">
                                      ({referrerUser.username})
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-slate-500 italic">Direct</span>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Work Permission Column */}
                        <td className="py-2 px-1.5 sm:px-2 whitespace-nowrap">
                          <div className="space-y-1">
                            {user.workPermission === true ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 font-bold text-[10px] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Granted
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/35 font-bold text-[10px] inline-flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5 text-rose-400" /> Pending
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!hasPermission('can_manage_users')) {
                                  notify(toggleUserWorkPermission(user.id));
                                  return;
                                }
                                requestConfirmation({
                                  title: user.workPermission === true ? 'Revoke Work Permission?' : 'Grant Work Permission?',
                                  description: `Are you sure you want to ${user.workPermission === true ? 'revoke' : 'grant'} task work permission for ${user.username} (UID: ${user.uid})? Click Confirm to proceed.`,
                                  confirmLabel: user.workPermission === true ? 'Confirm Revoke' : 'Confirm Approve',
                                  variant: user.workPermission === true ? 'danger' : 'success',
                                  onConfirm: () => {
                                    notify(toggleUserWorkPermission(user.id));
                                  },
                                });
                              }}
                              title={user.workPermission === true ? 'Revoke Work Permission' : 'Grant Work Permission (allow task grabbing)'}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold block transition-colors cursor-pointer ${
                                user.workPermission === true
                                  ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/40'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                              }`}
                            >
                              {user.workPermission === true ? 'Revoke' : 'Approve'}
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-1.5 sm:px-2 whitespace-nowrap">
                          <div className="space-y-1">
                            {user.status === 'active' ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold text-[10px] inline-block">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 font-semibold text-[10px] inline-block">
                                FROZEN
                              </span>
                            )}
                            <div className="text-[9px] flex items-center gap-1">
                              {user.withdrawalPassword ? (
                                <span className="text-emerald-400/90 flex items-center gap-0.5" title="Withdrawal Password Set">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Pass Set
                                </span>
                              ) : (
                                <span className="text-amber-400/90 flex items-center gap-0.5" title="Withdrawal Password Not Set">
                                  <Clock className="w-2.5 h-2.5" /> No Pass
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* 25-Task Work Cycle Progress */}
                        <td className="py-2 px-1.5 sm:px-2 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 font-bold text-[11px] tabular-nums">
                              <span className="text-white">
                                {user.currentCycleTasks || 0}/25
                              </span>
                              <span className="text-[9px] text-slate-400 font-normal">
                                · C#{user.cycleNumber || 1}
                              </span>
                            </div>
                            {(user.currentCycleTasks || 0) >= 25 || !user.cycleApprovedByAdmin ? (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/35 font-bold text-[9px] inline-flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5 text-rose-400" /> Locked
                              </span>
                            ) : (
                              <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
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
                        <td className="py-2 px-1.5 sm:px-2 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex flex-wrap items-center justify-end gap-1 max-w-[186px]">
                            {/* Open Comprehensive State & Order Recovery Editor */}
                            <button
                              onClick={() => setRecoveryModalUser(user)}
                              title="Edit User State & Order Details (Balance, Order #, Combo Config)"
                              className="h-6 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <Edit className="w-3 h-3 text-amber-400" />
                              <span>Edit</span>
                            </button>

                            {/* Quick Login / Switch to User Account */}
                            <button
                              onClick={() => {
                                switchUser(user.id);
                                setActiveView('user');
                              }}
                              title={`Switch to ${user.username}'s account and open user app / teams`}
                              className={`h-6 px-2 text-[11px] font-semibold rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer border whitespace-nowrap ${
                                user.isDemoAccount
                                  ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                  : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                              }`}
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>{user.isDemoAccount ? 'Demo' : 'Login'}</span>
                            </button>

                            {/* Work Permission Toggle (Expanded micro-pill if pending, compact icon if granted) */}
                            <button
                              onClick={() => {
                                if (!hasPermission('can_manage_users')) {
                                  notify(toggleUserWorkPermission(user.id));
                                  return;
                                }
                                requestConfirmation({
                                  title: user.workPermission === true ? 'Revoke Work Permission?' : 'Grant Work Permission?',
                                  description: `Are you sure you want to ${user.workPermission === true ? 'revoke' : 'grant'} task work permission for ${user.username} (UID: ${user.uid})? Click Confirm to proceed.`,
                                  confirmLabel: user.workPermission === true ? 'Confirm Revoke' : 'Confirm Grant',
                                  variant: user.workPermission === true ? 'danger' : 'success',
                                  onConfirm: () => {
                                    notify(toggleUserWorkPermission(user.id));
                                  },
                                });
                              }}
                              title={user.workPermission === true ? 'Work Permission Granted — Click to Revoke' : 'Grant Work Permission (allow task grabbing)'}
                              aria-label={user.workPermission === true ? 'Revoke Work Permission' : 'Grant Work Permission'}
                              className={`h-6 rounded-md transition-colors inline-flex items-center justify-center cursor-pointer border whitespace-nowrap ${
                                user.workPermission === true
                                  ? 'w-6 bg-[#141c2d] hover:bg-rose-950/60 text-emerald-400 hover:text-rose-300 border-[#222f46] hover:border-rose-700/50'
                                  : 'px-2 gap-1 bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 text-[11px] font-semibold shadow-xs'
                              }`}
                            >
                              {user.workPermission === true ? (
                                <UserCheck className="w-3 h-3" />
                              ) : (
                                <>
                                  <ShieldAlert className="w-3 h-3 text-white" />
                                  <span>Grant</span>
                                </>
                              )}
                            </button>

                            {/* Reset Task Cycle & Approve Next 25 Tasks Button */}
                            <button
                              onClick={() => {
                                if (!hasPermission('can_manage_users')) {
                                  notify(resetUserTaskCycle(user.id));
                                  return;
                                }
                                requestConfirmation({
                                  title: 'Reset Task Cycle & Approve Next 25 Tasks?',
                                  description: `Are you sure you want to reset completed task progress to 0/25 and advance ${user.username} (UID: ${user.uid}) to Cycle #${(user.cycleNumber || 1) + 1}? Click Confirm to proceed.`,
                                  confirmLabel: 'Confirm Approve 25 Tasks',
                                  variant: 'warning',
                                  onConfirm: () => {
                                    notify(resetUserTaskCycle(user.id));
                                  },
                                });
                              }}
                              title="Reset Task Cycle & Approve Next 25 Tasks"
                              aria-label="Reset Task Cycle & Approve Next 25 Tasks"
                              className={`h-6 rounded-md transition-all inline-flex items-center justify-center cursor-pointer border whitespace-nowrap ${
                                (user.currentCycleTasks || 0) >= 25 || !user.cycleApprovedByAdmin
                                  ? 'px-2 gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 text-[11px] font-bold shadow-xs'
                                  : 'w-6 bg-[#141c2d] hover:bg-[#1c273d] text-amber-300 border-amber-500/25'
                              }`}
                            >
                              <RefreshCw className="w-3 h-3 shrink-0" />
                              {((user.currentCycleTasks || 0) >= 25 || !user.cycleApprovedByAdmin) && (
                                <span>25 Tasks</span>
                              )}
                            </button>

                            {/* Clear Tax Button if balance >= 50k and not paid */}
                            {user.balance >= 50000 && !user.taxPaid && (
                              <button
                                onClick={() => {
                                  if (!hasPermission('can_manage_users')) {
                                    notify(clearUserTax(user.id));
                                    return;
                                  }
                                  requestConfirmation({
                                    title: 'Clear 25% Tax Requirement?',
                                    description: `Are you sure you want to mark the 25% tax requirement as cleared for ${user.username} (UID: ${user.uid})? Click Confirm to proceed.`,
                                    confirmLabel: 'Confirm Clear Tax',
                                    variant: 'success',
                                    onConfirm: () => {
                                      notify(clearUserTax(user.id));
                                    },
                                  });
                                }}
                                title="Clear / Approve Recurring 25% Tax Requirement for Current Withdrawal"
                                className="h-6 px-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] font-semibold rounded-md transition-colors inline-flex items-center gap-1 border border-emerald-500/40 cursor-pointer whitespace-nowrap"
                              >
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                <span>Tax</span>
                              </button>
                            )}

                            {/* Reset to Fresh Cycle 1 Button */}
                            <button
                              onClick={() => {
                                if (!hasPermission('can_manage_users')) {
                                  notify(resetUserToFreshCycle(user.id));
                                  return;
                                }
                                requestConfirmation({
                                  title: 'Reset Account to Fresh Cycle 1?',
                                  description: `Are you sure you want to reset ${user.username} (UID: ${user.uid}) back to Fresh Cycle 1 (0/25 progress and cleared pending order)? Click Confirm to proceed.`,
                                  confirmLabel: 'Confirm Fresh Cycle 1',
                                  variant: 'danger',
                                  onConfirm: () => {
                                    notify(resetUserToFreshCycle(user.id));
                                  },
                                });
                              }}
                              title="Reset user to Fresh Cycle 1 (Progress 0, 1 Combo planned for Task #14 or #15)"
                              aria-label="Reset to Fresh Cycle 1"
                              className="w-6 h-6 bg-[#141c2d] hover:bg-[#1c273d] text-cyan-300 rounded-md transition-colors inline-flex items-center justify-center border border-[#222f46] hover:border-cyan-500/40 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>

                            {/* VIP Toggle (5 Combo Orders schedule) */}
                            <button
                              onClick={() => {
                                if (!hasPermission('can_manage_users')) {
                                  notify(toggleUserVip(user.id));
                                  return;
                                }
                                requestConfirmation({
                                  title: user.isVipAccount ? 'Disable VIP 5-Combo Mode?' : 'Enable VIP 5-Combo Mode?',
                                  description: `Are you sure you want to ${user.isVipAccount ? 'disable VIP 5-Combo mode' : 'mark account as VIP (5 Combos)'} for ${user.username} (UID: ${user.uid})? Click Confirm to proceed.`,
                                  confirmLabel: 'Confirm',
                                  variant: 'warning',
                                  onConfirm: () => {
                                    notify(toggleUserVip(user.id));
                                  },
                                });
                              }}
                              title={user.isVipAccount ? 'VIP Active (5 Combos) — Click to Disable' : 'Mark as VIP Account (Enforces 5 Combos schedule)'}
                              aria-label={user.isVipAccount ? 'Disable VIP Account' : 'Enable VIP Account'}
                              className={`w-6 h-6 rounded-md transition-colors inline-flex items-center justify-center border cursor-pointer ${
                                user.isVipAccount
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30'
                                  : 'bg-[#141c2d] text-slate-400 border-[#222f46] hover:text-purple-300 hover:bg-[#1c273d]'
                              }`}
                            >
                              <Sparkles className="w-3 h-3" />
                            </button>

                            {/* Account Lock Toggle (Tasks work, Withdrawal blocked) */}
                            <button
                              onClick={() => {
                                if (!hasPermission('can_manage_users')) {
                                  notify(toggleUserLock(user.id));
                                  return;
                                }
                                requestConfirmation({
                                  title: user.isLockedAccount ? 'Unlock Account Withdrawal?' : 'Lock Account Withdrawal?',
                                  description: `Are you sure you want to ${user.isLockedAccount ? 'unlock withdrawals' : 'lock withdrawals (tasks work, withdrawals blocked)'} for ${user.username} (UID: ${user.uid})? Click Confirm to proceed.`,
                                  confirmLabel: 'Confirm',
                                  variant: user.isLockedAccount ? 'success' : 'warning',
                                  onConfirm: () => {
                                    notify(toggleUserLock(user.id));
                                  },
                                });
                              }}
                              title={user.isLockedAccount ? 'Withdrawals Locked — Click to Unlock' : 'Lock Account Withdrawals (Tasks work, WD blocked)'}
                              aria-label={user.isLockedAccount ? 'Unlock Account Withdrawal' : 'Lock Account Withdrawal'}
                              className={`w-6 h-6 rounded-md transition-colors inline-flex items-center justify-center border cursor-pointer ${
                                user.isLockedAccount
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                                  : 'bg-[#141c2d] text-slate-400 border-[#222f46] hover:text-rose-300 hover:bg-[#1c273d]'
                              }`}
                            >
                              {user.isLockedAccount ? (
                                <Lock className="w-3 h-3" />
                              ) : (
                                <Unlock className="w-3 h-3" />
                              )}
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
                              aria-label="Configure Custom Combos"
                              className="w-6 h-6 bg-[#141c2d] hover:bg-[#1c273d] text-amber-300 rounded-md transition-colors inline-flex items-center justify-center border border-[#222f46] hover:border-amber-500/40 cursor-pointer"
                            >
                              <Layers className="w-3 h-3" />
                            </button>

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
                              title="Adjust USDT Balance"
                              aria-label="Adjust USDT Balance"
                              className="w-6 h-6 bg-[#141c2d] hover:bg-[#1c273d] text-emerald-300 rounded-md transition-colors inline-flex items-center justify-center border border-[#222f46] hover:border-emerald-500/40 cursor-pointer"
                            >
                              <DollarSign className="w-3 h-3" />
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
                              aria-label={user.wallet ? 'Reset Wallet' : 'Bind Wallet'}
                              className={`w-6 h-6 rounded-md transition-colors inline-flex items-center justify-center border cursor-pointer ${
                                user.wallet
                                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                                  : 'bg-[#141c2d] hover:bg-[#1c273d] text-slate-400 border-[#222f46]'
                              }`}
                            >
                              <Wallet className="w-3 h-3" />
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
                              title="Reset Login / Withdrawal Password"
                              aria-label="Reset Password"
                              className="w-6 h-6 bg-[#141c2d] hover:bg-[#1c273d] text-slate-300 rounded-md transition-colors inline-flex items-center justify-center border border-[#222f46] cursor-pointer"
                            >
                              <Key className="w-3 h-3" />
                            </button>

                            {/* Freeze / Unfreeze */}
                            <button
                              onClick={() => {
                                if (!hasPermission('can_manage_users')) {
                                  notify(toggleUserStatus(user.id));
                                  return;
                                }
                                requestConfirmation({
                                  title: user.status === 'active' ? 'Freeze User Account?' : 'Unfreeze User Account?',
                                  description: `Are you sure you want to ${user.status === 'active' ? 'freeze' : 'unfreeze'} account ${user.username} (UID: ${user.uid})? Click Confirm to proceed.`,
                                  confirmLabel: user.status === 'active' ? 'Confirm Freeze' : 'Confirm Unfreeze',
                                  variant: user.status === 'active' ? 'danger' : 'success',
                                  onConfirm: () => {
                                    notify(toggleUserStatus(user.id));
                                  },
                                });
                              }}
                              title={user.status === 'active' ? 'Freeze User Account' : 'Unfreeze User Account'}
                              aria-label={user.status === 'active' ? 'Freeze User Account' : 'Unfreeze User Account'}
                              className={`w-6 h-6 rounded-md transition-colors inline-flex items-center justify-center border cursor-pointer ${
                                user.status === 'active'
                                  ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/30'
                                  : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border-emerald-500/40'
                              }`}
                            >
                              {user.status === 'active' ? (
                                <XCircle className="w-3 h-3" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 5. INVITATION CODE GENERATOR TAB */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'invites' && (
          <div className="space-y-5">
            {/* Generator Form Card */}
            <div className="bg-[#0f1523] border border-[#1d273b] rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Single custom invite generator */}
              <div className="space-y-3 pr-0 md:pr-4 md:border-r border-[#1d273b]">
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
            <div className="bg-[#0f1523] border border-[#1d273b] rounded-xl overflow-hidden p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Master Invitation Code Registry ({inviteCodes.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Track which codes were generated by system vs generated by users, with registration counts
                  </p>
                </div>

                <div className="flex gap-1 bg-[#141c2d] p-1 rounded-lg border border-[#1d273b]">
                  {(['all', 'system', 'user'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setInviteFilter(filter)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md uppercase transition-colors cursor-pointer ${
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
                  <thead className="bg-[#141c2d] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-y border-[#1d273b]">
                    <tr>
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Origin Type</th>
                      <th className="py-2.5 px-3">Created By</th>
                      <th className="py-2.5 px-3">Usage Count</th>
                      <th className="py-2.5 px-3">Limit</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Created Date</th>
                      <th className="py-2.5 px-3 text-right">Toggle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a2336]">
                    {inviteCodes
                      .filter((c) => (inviteFilter === 'all' ? true : c.type === inviteFilter))
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-[#141d2f] transition-colors">
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
          <div className="space-y-5">
            <div className="bg-[#0f1523] border border-[#1d273b] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-white">Sub-Admin Role &amp; Permission Engine</h2>
                <p className="text-xs text-slate-400">
                  Super Admin can create unlimited Sub-Admins with granular, toggleable permissions
                </p>
              </div>

              {currentAdmin.role === 'super_admin' ? (
                <button
                  onClick={() => setShowAddSubAdminModal(true)}
                  className="px-3.5 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
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
                    className="bg-[#0f1523] border border-[#1d273b] rounded-xl p-5 space-y-4"
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
          <div className="max-w-3xl mx-auto bg-[#0f1523] border border-[#1d273b] rounded-xl p-5 sm:p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1d273b] pb-4">
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
                          requestConfirmation({
                            title: 'Remove TRC-20 Address from Pool?',
                            description: `Are you sure you want to remove ${addr} from the active rotation pool? Click Confirm to proceed.`,
                            confirmLabel: 'Confirm Delete',
                            variant: 'danger',
                            onConfirm: () => {
                              const updated = pool.filter((a) => a !== addr);
                              updateSystemConfig({ trc20AddressPool: updated, trc20DepositAddress: updated[0] });
                              notify({ success: true, message: 'Removed address from pool' });
                            },
                          });
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
          <div className="bg-[#0f1523] border border-[#1d273b] rounded-xl overflow-hidden p-4 sm:p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                Immutable System Audit Logs ({auditLogs.length})
              </h2>
              <p className="text-xs text-slate-400">
                Tamper-proof audit trails tracking every administrative deposit, withdrawal, balance adjust, and user freeze action
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#141c2d] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-y border-[#1d273b]">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Admin</th>
                    <th className="py-2.5 px-3">Action Type</th>
                    <th className="py-2.5 px-3">Target UID</th>
                    <th className="py-2.5 px-3">Log Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2336]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#141d2f] transition-colors font-mono text-[11px]">
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

        {/* ------------------------------------------------------------- */}
        {/* 9. CUSTOMER SERVICE LIVE CHAT TAB */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'support' && (
          <AdminSupportChat
            users={users}
            adminName={currentAdmin.name}
            onUnreadCountChange={setSupportUnreadCount}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* 10. REAL-TIME USER MONITORING TAB */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'monitoring' && (
          <AdminUserMonitoring
            users={users}
            orders={orders}
            onOnlineCountChange={setOnlineUsersCount}
            onSelectUserForRecovery={(u) => setRecoveryModalUser(u)}
          />
        )}
        </main>
      </div>

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

            {/* Approved Deposits Summary Card with 1-Click Exact Total Recalculation */}
            {(() => {
              const userApprovedDeps = deposits.filter(
                (d) =>
                  (d.userId === balanceModalUser.id ||
                    String(d.userUid) === String(balanceModalUser.uid) ||
                    (d.username && d.username.toLowerCase() === balanceModalUser.username.toLowerCase())) &&
                  d.status === 'approved'
              );
              const approvedSum = userApprovedDeps.reduce((sum, d) => sum + Number(d.amount || 0), 0);
              const fullModalUser = users.find(
                (u) => u.id === balanceModalUser.id || String(u.uid) === String(balanceModalUser.uid)
              );
              const earnedCommSum = Number(
                ((fullModalUser?.todayCommission || 0) + (fullModalUser?.yesterdayCommission || 0)).toFixed(4)
              );
              const wdSum = Number(fullModalUser?.totalWithdrawal || 0);
              const netTotal = Number(Math.max(0, approvedSum + earnedCommSum - wdSum).toFixed(2));

              return (
                <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Approved Deposits Total:
                    </span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {approvedSum.toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Verified {userApprovedDeps.length} approved deposit record{userApprovedDeps.length === 1 ? '' : 's'}
                    {earnedCommSum > 0 ? ` + ${earnedCommSum.toFixed(2)} commissions` : ''}
                    {wdSum > 0 ? ` - ${wdSum.toFixed(2)} withdrawals` : ''}.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      requestConfirmation({
                        title: 'Recalculate User Balance?',
                        description: `Are you sure you want to recalculate ${balanceModalUser.username}'s balance from approved deposits (${approvedSum.toFixed(2)}) + commissions (${earnedCommSum.toFixed(2)}) - withdrawals (${wdSum.toFixed(2)}) ≈ ${netTotal.toFixed(2)} USDT? Click Confirm to proceed.`,
                        confirmLabel: 'Confirm Recalculate',
                        variant: 'warning',
                        onConfirm: async () => {
                          const res = await recalculateUserBalanceFromDeposits(balanceModalUser.id);
                          notify(res);
                          setBalanceModalUser(null);
                        },
                      });
                    }}
                    className="w-full py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    Recalculate Balance (Deposits + Commissions - Withdrawals ≈ {netTotal.toFixed(2)} USDT)
                  </button>
                </div>
              );
            })()}

            <div className="space-y-3">
              <div className="flex gap-1.5">
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
                <button
                  type="button"
                  onClick={() => setAdjustType('set')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                    adjustType === 'set'
                      ? 'bg-amber-950 text-amber-300 border-amber-700'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Set Exact (=)
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  {adjustType === 'set' ? 'New Exact Balance (USDT)' : 'Amount (USDT)'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder={adjustType === 'set' ? 'e.g. 500.00' : 'e.g. 50.00'}
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
                    if (adjustType === 'set') {
                      if (isNaN(amt) || amt < 0) {
                        notify({ success: false, message: 'Please enter a valid non-negative balance.' });
                        return;
                      }
                    } else {
                      if (isNaN(amt) || amt <= 0) {
                        notify({ success: false, message: 'Please enter a valid positive amount.' });
                        return;
                      }
                    }
                    const reason =
                      adjustReason || (adjustType === 'set' ? 'Balance reset to exact amount' : 'Manual adjustment');
                    requestConfirmation({
                      title: 'Confirm Balance Adjustment?',
                      description: `Are you sure you want to ${adjustType === 'credit' ? `credit +${amt.toFixed(2)}` : adjustType === 'debit' ? `debit -${amt.toFixed(2)}` : `set balance to ${amt.toFixed(2)}`} USDT for ${balanceModalUser.username} (UID: ${balanceModalUser.uid})? Click Confirm to proceed.`,
                      confirmLabel: 'Confirm Adjustment',
                      variant: adjustType === 'debit' ? 'danger' : 'warning',
                      onConfirm: () => {
                        const res = adjustUserBalance(balanceModalUser.id, amt, adjustType, reason);
                        notify(res);
                        if (res.success) setBalanceModalUser(null);
                      },
                    });
                  }}
                  className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-bold rounded-lg cursor-pointer"
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
                  requestConfirmation({
                    title: 'Save Custom Combo Configuration?',
                    description: `Are you sure you want to apply ${customRulesList.length} custom combo trigger rule(s) to ${comboModalUser.username} (UID: ${comboModalUser.uid})? Click Confirm to proceed.`,
                    confirmLabel: 'Confirm Save Combos',
                    variant: 'warning',
                    onConfirm: () => {
                      const res = setCustomUserCombos(comboModalUser.id, customRulesList);
                      notify(res);
                      if (res.success) setComboModalUser(null);
                    },
                  });
                }}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-lg text-xs transition-colors cursor-pointer"
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
                    requestConfirmation({
                      title: 'Reset & Unlock Bound Wallet?',
                      description: `Are you sure you want to reset and unlock the bound TRC-20 wallet for ${walletModalUser.username} (UID: ${walletModalUser.uid})? Click Confirm to proceed.`,
                      confirmLabel: 'Confirm Reset Wallet',
                      variant: 'danger',
                      onConfirm: () => {
                        const res = resetUserWallet(walletModalUser.id);
                        notify(res);
                        if (res.success) setWalletModalUser(null);
                      },
                    });
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
      {/* ------------------------------------------------------------- */}
      {/* MODAL 8: Comprehensive User State & Order Recovery Editor */}
      {/* ------------------------------------------------------------- */}
      {recoveryModalUser && (
        <AdminUserRecoveryModal
          user={users.find((u) => u.id === recoveryModalUser.id) || recoveryModalUser}
          orders={orders}
          onClose={() => setRecoveryModalUser(null)}
          onSaveRecovery={async (params) => {
            const res = await recoverUserStateAndOrder(params);
            notify(res);
            return res;
          }}
          onRequestConfirm={requestConfirmation}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 9: Mandatory Confirmation Dialog for Critical Admin Actions */}
      {/* ------------------------------------------------------------- */}
      {pendingConfirmAction && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
          onClick={() => {
            if (!isConfirmExecuting) setPendingConfirmAction(null);
          }}
        >
          <div
            className="w-full max-w-md bg-slate-950 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  pendingConfirmAction.variant === 'danger'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : pendingConfirmAction.variant === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}
              >
                {pendingConfirmAction.variant === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-extrabold text-white">{pendingConfirmAction.title}</h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {pendingConfirmAction.description}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800/80">
              <button
                type="button"
                disabled={isConfirmExecuting}
                onClick={() => setPendingConfirmAction(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isConfirmExecuting}
                onClick={async () => {
                  if (isConfirmExecuting) return;
                  setIsConfirmExecuting(true);
                  try {
                    await pendingConfirmAction.onConfirm();
                    setPendingConfirmAction(null);
                  } finally {
                    setIsConfirmExecuting(false);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-colors disabled:opacity-60 cursor-pointer ${
                  pendingConfirmAction.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : pendingConfirmAction.variant === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                {isConfirmExecuting ? 'Executing...' : pendingConfirmAction.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
