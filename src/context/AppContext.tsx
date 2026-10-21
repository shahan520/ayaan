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
import { generateTieredMatchedProducts } from '../data/productCatalog';
import {
  AdminPermission,
  AdminUser,
  AuditLog,
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
  setWithdrawalPassword: (password: string) => { success: boolean; message?: string };
  bindWallet: (wallet: Omit<UserWallet, 'boundAt'>) => { success: boolean; message?: string };
  submitDeposit: (amount: number, txid: string) => { success: boolean; message?: string };
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
  };
  submitOrder: (orderId: string) => { success: boolean; message?: string };

  // Admin methods
  switchAdmin: (adminId: string) => void;
  hasPermission: (permission: AdminPermission) => boolean;
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
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
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

  const submitDeposit = (amount: number, txid: string) => {
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

    const newDeposit: DepositRecord = {
      id: 'dep_' + Date.now(),
      userId: currentUser.id,
      userUid: currentUser.uid,
      username: currentUser.username,
      amount,
      currency: 'USDT',
      protocol: 'TRC-20',
      depositAddress: systemConfig.trc20DepositAddress,
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

    // Step 1: Task check (< 25 tasks completed)
    const completedTasks = currentUser.completedTasksCount || 0;
    if (completedTasks < 25) {
      return {
        success: false,
        message: 'TASK_COUNT_BELOW_25',
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
  // VIP ORDER MATCHING / GRABBING ENGINE
  // --------------------------------------------------------------------------

  const grabOrder = (vipTier: 'VIP 1' | 'VIP 2' | 'VIP 3') => {
    if (!currentUser) return { success: false, message: 'Please login first.' };

    // Check if user has an incomplete order
    const hasIncomplete = orders.some(
      (o) => o.userId === currentUser.id && o.status === 'incomplete'
    );
    if (hasIncomplete) {
      return {
        success: false,
        message: 'You have an unpaid order, please complete the payment first',
      };
    }

    // VIP Balance Rules matching screenshots
    const bal = currentUser.balance;
    if (vipTier === 'VIP 1') {
      if (bal < 20 || bal > 498) {
        return {
          success: false,
          message: 'Amazon only allows users with balances 20-498 to grab orders',
        };
      }
    } else if (vipTier === 'VIP 2') {
      if (bal < 499 || bal > 899) {
        return {
          success: false,
          message: 'Alibaba only allows users with balances 499-899 to grab orders',
        };
      }
    } else if (vipTier === 'VIP 3') {
      if (bal < 899) {
        return {
          success: false,
          message: 'Aliexpress requires a minimum balance of 899 USDT to grab orders',
        };
      }
    }

    // Determine platform and commission rate
    const platform =
      vipTier === 'VIP 1' ? 'Amazon' : vipTier === 'VIP 2' ? 'Alibaba' : 'Aliexpress';
    const rate = vipTier === 'VIP 1' ? 0.04 : vipTier === 'VIP 2' ? 0.08 : 0.12;

    // Calculate target order amount (typically 50-80% of balance)
    const targetOrderAmt = Number((bal * (0.55 + Math.random() * 0.25)).toFixed(2));
    const matchedItems = generateTieredMatchedProducts(bal, targetOrderAmt);

    // Sum up exact amount from matched items
    const actualOrderAmt = Number(
      matchedItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0).toFixed(2)
    );
    const comm = Number((actualOrderAmt * rate).toFixed(4));
    const expected = Number((actualOrderAmt + comm).toFixed(4));

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
      productTitle: matchedItems[0]?.name || 'Retail Matched Item',
      productImage: matchedItems[0]?.image || '/assets/aistudio/a1.3f945898_a31a0efe.png',
      unitPrice: matchedItems[0]?.unitPrice || 0.26,
      quantity: matchedItems[0]?.quantity || 100,
      orderAmount: actualOrderAmt,
      commissionRate: rate,
      commission: comm,
      expectedIncome: expected,
      status: 'incomplete',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setOrders((prev) => [newOrder, ...prev]);
    return { success: true, order: newOrder };
  };

  const submitOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found.' };
    if (order.status === 'completed') return { success: false, message: 'Order already completed.' };

    const targetUser = users.find((u) => u.id === order.userId);
    if (!targetUser) return { success: false, message: 'User not found.' };

    // Update order status to completed
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'completed',
              completedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : o
      )
    );

    // Credit commission directly to user's balance
    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUser.id
          ? {
              ...u,
              balance: Number((u.balance + order.commission).toFixed(4)),
              todayOrdersCount: u.todayOrdersCount + 1,
              todayCommission: Number((u.todayCommission + order.commission).toFixed(4)),
              completedTasksCount: (u.completedTasksCount || 0) + 1,
            }
          : u
      )
    );

    return {
      success: true,
      message: `Order submitted successfully! Earned +${order.commission.toFixed(4)} USDT commission!`,
    };
  };

  // --------------------------------------------------------------------------
  // ADMIN PANEL METHODS & ROLE-BASED ACCESS CONTROL
  // --------------------------------------------------------------------------

  const switchAdmin = (adminId: string) => {
    setCurrentAdminId(adminId);
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
      prev.map((u) =>
        u.id === targetId
          ? { ...u, completedTasksCount: Math.max(0, (u.completedTasksCount || 0) + count) }
          : u
      )
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
        setWithdrawalPassword,
        bindWallet,
        submitDeposit,
        submitWithdrawal,
        addCompletedTasks,
        grabOrder,
        submitOrder,
        switchAdmin,
        hasPermission,
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
