import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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
import { generateHybridComboSchedule } from '../utils/comboGenerator';
import { LanguageCode, translations } from '../utils/i18n';
import { getApiUrl, renderKeepAlive } from '../utils/apiConfig';
import {
  AdminPermission,
  AdminUser,
  AuditLog,
  CustomComboRule,
  DEMO_TRC20_ADDRESS_POOL,
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
  loginUser: (
    username: string,
    password?: string
  ) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  registerUser: (
    username: string,
    password: string,
    inviteCode: string
  ) => Promise<{ success: boolean; message?: string; user?: User }>;
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
    isPermissionLocked?: boolean;
    isComboOrder?: boolean;
    isMandatoryComboPending?: boolean;
  };
  submitOrder: (orderId: string) => {
    success: boolean;
    message?: string;
    isPermissionLocked?: boolean;
    isInsufficientComboBalance?: boolean;
    shortfall?: number;
    requiredAmount?: number;
    currentBalance?: number;
    isCycleNowFinished?: boolean;
  };

  // Admin methods & Route Protection
  isAdminAuthenticated: boolean;
  adminLogin: (
    username: string,
    password: string,
    securityPin?: string
  ) => { success: boolean; message?: string; admin?: AdminUser };
  adminLogout: () => void;
  navigateToAdmin: () => void;
  navigateToUser: () => void;
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
    type: 'credit' | 'debit' | 'set',
    reason: string
  ) => { success: boolean; message?: string };
  recalculateUserBalanceFromDeposits: (
    userId: string
  ) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
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
    permissions: AdminPermission[],
    password?: string
  ) => { success: boolean; message?: string };
  updateSubAdminPermissions: (
    adminId: string,
    permissions: AdminPermission[]
  ) => { success: boolean; message?: string };
  updateSubAdminPassword: (
    adminId: string,
    newPass: string
  ) => { success: boolean; message?: string };
  updateSuperAdminSecurity: (
    newPassword?: string,
    newSecurityPin?: string
  ) => { success: boolean; message?: string };
  createDemoAccount: (data: {
    username: string;
    password?: string;
    initialBalance?: number;
    demoWalletAddress?: string;
    workPermission?: boolean;
  }) => { success: boolean; message?: string; user?: User };
  toggleUserWorkPermission: (
    userId: string
  ) => { success: boolean; message?: string; workPermission?: boolean };
  resetUserWallet: (userId: string) => { success: boolean; message?: string };
  adminUpdateUserWallet: (
    userId: string,
    data: { walletAddress: string; accountName?: string; walletName?: string; protocol?: 'TRC-20' | 'ERC-20' | 'BEP-20' }
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
      const legacyIds = new Set(['user_2', 'user_3', 'user_l2_1', 'user_l2_2', 'user_l3_1']);
      const filteredParsed = parsed.filter((u) => !legacyIds.has(u.id));
      const existingIds = new Set(filteredParsed.map((u) => u.id));
      const existingUids = new Set(filteredParsed.map((u) => String(u.uid)));
      const missingInitial = INITIAL_USERS.filter((u) => !existingIds.has(u.id) && !existingUids.has(String(u.uid)));
      const combined = [...filteredParsed, ...missingInitial];
      return combined.map((u) => {
        const isNewDay = u.lastActiveDate && u.lastActiveDate !== today;
        const normalizedWallet =
          u.wallet && typeof u.wallet.walletAddress === 'string' && u.wallet.walletAddress.trim().length > 0
            ? u.wallet
            : null;
        const workPerm = u.workPermission === true;
        return {
          ...u,
          wallet: normalizedWallet,
          withdrawalPassword: u.withdrawalPassword || null,
          todayOrdersCount: isNewDay ? 0 : (u.todayOrdersCount ?? 0),
          todayCommission: isNewDay ? 0 : (u.todayCommission ?? 0),
          yesterdayCommission: isNewDay ? (u.todayCommission ?? 0) : (u.yesterdayCommission ?? 0),
          lastActiveDate: today,
          completedTasksCount: u.completedTasksCount ?? 0,
          currentCycleTasks:
            u.currentCycleTasks ?? (u.completedTasksCount >= 25 ? 25 : u.completedTasksCount ?? 0),
          cycleNumber: typeof u.cycleNumber === 'number' && u.cycleNumber >= 1 ? u.cycleNumber : 1,
          cycleApprovedByAdmin:
            typeof u.cycleApprovedByAdmin === 'boolean'
              ? u.cycleApprovedByAdmin
              : (workPerm && (u.currentCycleTasks ?? 0) < 25),
          comboOrderStep: u.comboOrderStep ?? 14,
          cycleStartBalance: u.cycleStartBalance,
          workPermission: workPerm,
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
    if (!saved) return INITIAL_INVITE_CODES;
    try {
      const parsed = JSON.parse(saved) as InviteCode[];
      const existingCodes = new Set(parsed.map((c) => c.code.toUpperCase()));
      const missingInitial = INITIAL_INVITE_CODES.filter((c) => !existingCodes.has(c.code.toUpperCase()));
      return [...parsed, ...missingInitial];
    } catch {
      return INITIAL_INVITE_CODES;
    }
  });

  const [deposits, setDeposits] = useState<DepositRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEPOSITS);
    if (!saved) return INITIAL_DEPOSITS;
    try {
      const parsed = JSON.parse(saved) as DepositRecord[];
      const existingIds = new Set(parsed.map((d) => d.id));
      const missingInitial = INITIAL_DEPOSITS.filter((d) => !existingIds.has(d.id));
      return [...parsed, ...missingInitial];
    } catch {
      return INITIAL_DEPOSITS;
    }
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
    if (!saved) return INITIAL_WITHDRAWALS;
    try {
      const parsed = JSON.parse(saved) as WithdrawalRecord[];
      const existingIds = new Set(parsed.map((w) => w.id));
      const missingInitial = INITIAL_WITHDRAWALS.filter((w) => !existingIds.has(w.id));
      return [...parsed, ...missingInitial];
    } catch {
      return INITIAL_WITHDRAWALS;
    }
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
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || null;
  });

  const [currentAdminId, setCurrentAdminId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_ADMIN_ID) || 'admin_super';
  });

  const [activeView, setActiveView] = useState<'user' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;
      if (path.startsWith('/admin') || hash === '#admin' || search.includes('view=admin')) {
        return 'admin';
      }
    }
    return 'user';
  });
  const [deviceFrame, setDeviceFrame] = useState<boolean>(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_session_auth') === 'true';
  });

  // Dedicated Route Protection & URL Synchronization for /admin
  useEffect(() => {
    const handleRouteSync = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;
      if (path.startsWith('/admin') || hash === '#admin' || search.includes('view=admin')) {
        setActiveView('admin');
      } else {
        setActiveView('user');
      }
    };

    handleRouteSync();
    window.addEventListener('popstate', handleRouteSync);
    window.addEventListener('hashchange', handleRouteSync);
    return () => {
      window.removeEventListener('popstate', handleRouteSync);
      window.removeEventListener('hashchange', handleRouteSync);
    };
  }, []);

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

  // Start Render background warm-up / heartbeat ping
  useEffect(() => {
    renderKeepAlive.start();
    return () => renderKeepAlive.stop();
  }, []);

  // Track timestamps of in-flight/recent local user mutations so 3s background polling never clobbers optimistic updates
  const pendingUserMutationAt = useRef<Record<string, number>>({});

  // Helper to persist state modifications immediately to the centralized backend database
  const syncUserUpdateToBackend = (userUid: string, updates: Partial<User>) => {
    try {
      if (userUid) {
        pendingUserMutationAt.current[String(userUid)] = Date.now();
      }
      fetch(getApiUrl('/api/users/update'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: userUid, updates }),
      }).catch(() => {});
    } catch {}
  };

  // Real-time synchronization of users, deposits & invite codes across devices, tabs, and backend persistent store
  useEffect(() => {
    const fetchRemoteData = async () => {
      try {
        const [usersRes, invitesRes, depositsRes, ordersRes] = await Promise.all([
          fetch(getApiUrl('/api/users')).then((r) => r.json()).catch(() => null),
          fetch(getApiUrl('/api/invites')).then((r) => r.json()).catch(() => null),
          fetch(getApiUrl('/api/deposits')).then((r) => r.json()).catch(() => null),
          fetch(getApiUrl('/api/orders')).then((r) => r.json()).catch(() => null),
        ]);

        if (usersRes && usersRes.success && Array.isArray(usersRes.users) && usersRes.users.length > 0) {
          setUsers((prev) => {
            const prevMap = new Map(prev.map((u) => [String(u.uid), u]));
            let hasChanges = false;
            const newUsersToPrepend: User[] = [];
            const nowMs = Date.now();

            usersRes.users.forEach((remoteUser: User) => {
              const remoteUid = String(remoteUser.uid);
              const existing = prevMap.get(remoteUid);

              // Normalize strict booleans and wallet state from server
              const normalizedWallet =
                remoteUser.wallet &&
                typeof remoteUser.wallet.walletAddress === 'string' &&
                remoteUser.wallet.walletAddress.trim().length > 0
                  ? remoteUser.wallet
                  : null;
              const normalizedRemote: User = {
                ...remoteUser,
                wallet: normalizedWallet,
                withdrawalPassword: remoteUser.withdrawalPassword || null,
                workPermission: remoteUser.workPermission === true,
                cycleApprovedByAdmin: remoteUser.cycleApprovedByAdmin === true,
                isVipAccount: remoteUser.isVipAccount === true,
                isLockedAccount: remoteUser.isLockedAccount === true,
                customCombos: Array.isArray(remoteUser.customCombos) ? remoteUser.customCombos : [],
                cycleNumber: typeof remoteUser.cycleNumber === 'number' && remoteUser.cycleNumber >= 1 ? remoteUser.cycleNumber : 1,
              };

              if (!existing) {
                // New user registered from another device
                const brandNewUser: User = {
                  ...normalizedRemote,
                  id: normalizedRemote.id || ('user_' + normalizedRemote.uid),
                  totalDeposit:
                    typeof normalizedRemote.totalDeposit === 'number'
                      ? normalizedRemote.totalDeposit
                      : normalizedRemote.balance > 0
                      ? normalizedRemote.balance
                      : 0,
                  totalWithdrawal:
                    typeof normalizedRemote.totalWithdrawal === 'number' ? normalizedRemote.totalWithdrawal : 0,
                };
                prevMap.set(remoteUid, brandNewUser);
                newUsersToPrepend.push(brandNewUser);
                hasChanges = true;
              } else {
                // Skip overwriting if a local mutation was sent in the last 8 seconds (prevents poll race clobber)
                const lastMut = pendingUserMutationAt.current[remoteUid] || 0;
                if (nowMs - lastMut < 8000) {
                  return;
                }

                // Authoritative server state sync for existing users
                const needsUpdate =
                  existing.referredBy !== normalizedRemote.referredBy ||
                  existing.balance !== normalizedRemote.balance ||
                  existing.frozenBalance !== normalizedRemote.frozenBalance ||
                  existing.vipLevel !== normalizedRemote.vipLevel ||
                  existing.status !== normalizedRemote.status ||
                  existing.workPermission !== normalizedRemote.workPermission ||
                  existing.cycleApprovedByAdmin !== normalizedRemote.cycleApprovedByAdmin ||
                  existing.isVipAccount !== normalizedRemote.isVipAccount ||
                  existing.isLockedAccount !== normalizedRemote.isLockedAccount ||
                  existing.currentCycleTasks !== normalizedRemote.currentCycleTasks ||
                  existing.completedTasksCount !== normalizedRemote.completedTasksCount ||
                  existing.todayOrdersCount !== normalizedRemote.todayOrdersCount ||
                  existing.todayCommission !== normalizedRemote.todayCommission ||
                  existing.yesterdayCommission !== normalizedRemote.yesterdayCommission ||
                  existing.cycleNumber !== normalizedRemote.cycleNumber ||
                  existing.comboOrderStep !== normalizedRemote.comboOrderStep ||
                  existing.totalDeposit !== normalizedRemote.totalDeposit ||
                  existing.totalWithdrawal !== normalizedRemote.totalWithdrawal ||
                  (existing.withdrawalPassword || '') !== (normalizedRemote.withdrawalPassword || '') ||
                  Boolean(existing.taxPaid) !== Boolean(normalizedRemote.taxPaid) ||
                  JSON.stringify(existing.customCombos || []) !== JSON.stringify(normalizedRemote.customCombos || []) ||
                  JSON.stringify(existing.wallet || null) !== JSON.stringify(normalizedRemote.wallet || null);

                if (needsUpdate) {
                  prevMap.set(remoteUid, {
                    ...existing,
                    ...normalizedRemote,
                    id: existing.id || normalizedRemote.id || ('user_' + remoteUid),
                    password: existing.password || normalizedRemote.password,
                    withdrawalPassword: normalizedRemote.withdrawalPassword || existing.withdrawalPassword,
                  });
                  hasChanges = true;
                }
              }
            });

            if (hasChanges) {
              // Maintain ordering with new registrations at top
              const existingIds = new Set(newUsersToPrepend.map((u) => String(u.uid)));
              const remaining = Array.from(prevMap.values()).filter((u) => !existingIds.has(String(u.uid)));
              const merged = [...newUsersToPrepend, ...remaining];
              try {
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
              } catch {}
              return merged;
            }
            return prev;
          });
        }

        if (depositsRes && depositsRes.success && Array.isArray(depositsRes.deposits)) {
          setDeposits((prev) => {
            const prevMap = new Map(prev.map((d) => [d.id, d]));
            let hasChanges = false;

            depositsRes.deposits.forEach((remDep: DepositRecord) => {
              const existing = prevMap.get(remDep.id);
              if (!existing) {
                prevMap.set(remDep.id, remDep);
                hasChanges = true;
              } else if (
                existing.status !== remDep.status ||
                existing.reviewedBy !== remDep.reviewedBy ||
                existing.rejectionReason !== remDep.rejectionReason ||
                existing.amount !== remDep.amount
              ) {
                prevMap.set(remDep.id, { ...existing, ...remDep });
                hasChanges = true;
              }
            });

            if (hasChanges) {
              const sorted = Array.from(prevMap.values()).sort((a, b) => {
                return (b.createdAt || '').localeCompare(a.createdAt || '');
              });
              try {
                localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(sorted));
              } catch {}
              return sorted;
            }
            return prev;
          });
        }

        if (invitesRes && invitesRes.success && Array.isArray(invitesRes.invites) && invitesRes.invites.length > 0) {
          setInviteCodes((prev) => {
            const existingCodes = new Set(prev.map((c) => c.code.toUpperCase()));
            const toAdd: InviteCode[] = [];
            invitesRes.invites.forEach((rem: InviteCode) => {
              if (rem && rem.code && !existingCodes.has(rem.code.toUpperCase())) {
                toAdd.push(rem);
                existingCodes.add(rem.code.toUpperCase());
              }
            });
            if (toAdd.length > 0) {
              const updated = [...prev, ...toAdd];
              try {
                localStorage.setItem(STORAGE_KEYS.INVITES, JSON.stringify(updated));
              } catch {}
              return updated;
            }
            return prev;
          });
        }

        if (ordersRes && ordersRes.success && Array.isArray(ordersRes.orders) && ordersRes.orders.length > 0) {
          setOrders((prev) => {
            const existingOrderNos = new Set(prev.map((o) => o.orderNo));
            const remoteUsersList = (usersRes && Array.isArray(usersRes.users)) ? (usersRes.users as User[]) : [];
            const uidToUserId = new Map<string, string>();
            remoteUsersList.forEach((ru) => {
              if (ru.uid) uidToUserId.set(String(ru.uid), ru.id || ('user_' + ru.uid));
            });

            const toAdd: GrabbedOrder[] = [];
            ordersRes.orders.forEach((remOrd: {
              id?: string;
              orderNo?: string;
              userId?: string;
              userUid?: string;
              vipTier?: 'VIP 1' | 'VIP 2' | 'VIP 3';
              platform?: 'Amazon' | 'Alibaba' | 'Aliexpress';
              productTitle?: string;
              orderAmount?: number;
              commission?: number;
              status?: 'incomplete' | 'completed';
              createdAt?: string;
              completedAt?: string;
              isComboOrder?: boolean;
              comboStepNumber?: number;
            }) => {
              if (!remOrd || !remOrd.orderNo || existingOrderNos.has(remOrd.orderNo)) return;
              const resolvedUserId =
                remOrd.userId ||
                (remOrd.userUid ? uidToUserId.get(String(remOrd.userUid)) || ('user_' + remOrd.userUid) : '');
              if (!resolvedUserId) return;
              const amt = Number(remOrd.orderAmount || 0);
              const comm = Number(remOrd.commission || 0);
              toAdd.push({
                id: remOrd.id || ('ord_' + remOrd.orderNo),
                orderNo: remOrd.orderNo,
                userId: resolvedUserId,
                vipTier: remOrd.vipTier || 'VIP 1',
                platform: remOrd.platform || 'Amazon',
                productTitle: remOrd.productTitle || 'Retail Matched Item',
                productImage: '/assets/aistudio/41lyVjfaJ7L._AC_UY218__3d4a1b42.jpg',
                unitPrice: amt,
                quantity: 1,
                orderAmount: amt,
                commissionRate: amt > 0 ? Number((comm / amt).toFixed(4)) : 0.04,
                commission: comm,
                expectedIncome: Number((amt + comm).toFixed(4)),
                status: remOrd.status || 'completed',
                createdAt: remOrd.createdAt || remOrd.completedAt || new Date().toISOString().replace('T', ' ').substring(0, 19),
                completedAt: remOrd.completedAt,
                isComboOrder: Boolean(remOrd.isComboOrder),
                comboStepNumber: remOrd.comboStepNumber || undefined,
              });
              existingOrderNos.add(remOrd.orderNo);
            });

            if (toAdd.length > 0) {
              const merged = [...toAdd, ...prev].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
              try {
                localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(merged));
              } catch {}
              return merged;
            }
            return prev;
          });
        }
      } catch {}
    };

    fetchRemoteData();
    // Background polling every 3 seconds for instant real-time UI balance and deposit sync
    const interval = setInterval(fetchRemoteData, 3000);

    // Cross-tab instant synchronization via storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.USERS && e.newValue) {
        try {
          const remoteUsers = JSON.parse(e.newValue);
          if (Array.isArray(remoteUsers) && remoteUsers.length > 0) {
            setUsers(remoteUsers);
          }
        } catch {}
      }
      if (e.key === STORAGE_KEYS.DEPOSITS && e.newValue) {
        try {
          const remoteDeposits = JSON.parse(e.newValue);
          if (Array.isArray(remoteDeposits) && remoteDeposits.length > 0) {
            setDeposits(remoteDeposits);
          }
        } catch {}
      }
    };

    // In-tab instant custom events
    const handleTabSync = (e: Event) => {
      const customEvt = e as CustomEvent<User[]>;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        setUsers(customEvt.detail);
      }
    };

    const handleImmediateRefresh = () => {
      fetchRemoteData();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('tradeweb_users_updated', handleTabSync);
    window.addEventListener('tradeweb_balance_updated', handleImmediateRefresh);
    window.addEventListener('tradeweb_deposits_updated', handleImmediateRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('tradeweb_users_updated', handleTabSync);
      window.removeEventListener('tradeweb_balance_updated', handleImmediateRefresh);
      window.removeEventListener('tradeweb_deposits_updated', handleImmediateRefresh);
    };
  }, []);

  const currentUser = users.find(
    (u) =>
      u.id === currentUserId ||
      (currentUserId && String(u.uid) === String(currentUserId)) ||
      (currentUserId && u.username.toLowerCase() === currentUserId.toLowerCase())
  ) || null;
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

  const loginUser = async (username: string, password?: string) => {
    const trimmed = username.trim();
    if (!trimmed) {
      return { success: false, message: 'Please enter your username.' };
    }
    if (!password) {
      return { success: false, message: 'Please enter your password.' };
    }

    // Fast path: Check local users state
    const localUser = users.find(
      (u) =>
        u.username.toLowerCase() === trimmed.toLowerCase() ||
        u.uid === trimmed
    );

    if (localUser && localUser.password && localUser.password === password) {
      if (localUser.status === 'frozen') {
        return { success: false, message: 'Your account is frozen. Please contact customer service.' };
      }
      setCurrentUserId(localUser.id);
      return { success: true, message: 'Login successful!' };
    }

    // Centralized server authentication fallback (supports users registered from any device)
    try {
      const resp = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed, password }),
      });
      const data = await resp.json();
      if (resp.ok && data.success && data.user) {
        const normalizedWallet =
          data.user.wallet && typeof data.user.wallet.walletAddress === 'string' && data.user.wallet.walletAddress.trim().length > 0
            ? data.user.wallet
            : null;
        const authedUser: User = {
          ...data.user,
          id: data.user.id || ('user_' + data.user.uid),
          wallet: normalizedWallet,
          withdrawalPassword: data.user.withdrawalPassword || undefined,
          password,
        };
        setUsers((prev) => {
          const filtered = prev.filter((u) => u.uid !== authedUser.uid && u.id !== authedUser.id);
          const updated = [authedUser, ...filtered];
          try {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
          } catch {}
          return updated;
        });
        setCurrentUserId(authedUser.id);
        return { success: true, message: 'Login successful!' };
      } else {
        return {
          success: false,
          message:
            data.message ||
            (localUser
              ? 'Incorrect password. Please verify your password and try again.'
              : 'User account not found. Please register first.'),
        };
      }
    } catch {
      if (localUser) {
        return { success: false, message: 'Incorrect password. Please verify your password and try again.' };
      }
      return { success: false, message: 'User account not found. Please register first.' };
    }
  };

  const registerUser = async (username: string, password: string, inviteCodeInput: string) => {
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

    // Call centralized backend registration endpoint directly on live Render service
    try {
      const registerPayload = {
        username: cleanUser,
        password,
        inviteCode: cleanCode,
      };

      let response: Response;
      try {
        response = await fetch(getApiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerPayload),
        });
      } catch (firstErr) {
        // If live Render free service was in cold-start idle sleep, ping it and retry
        console.warn('Initial register attempt had network hiccup, waking backend and retrying...', firstErr);
        await renderKeepAlive.ping();
        await new Promise((r) => setTimeout(r, 1500));
        response = await fetch(getApiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerPayload),
        });
      }

      const data = await response.json();

      if (!response.ok || !data.success || !data.user) {
        return {
          success: false,
          message:
            data.message ||
            'Invalid Invitation Code. Please enter an active referral code provided by an admin or existing member.',
        };
      }

      const newUser: User = {
        ...data.user,
        id: data.user.id || ('user_' + data.user.uid),
        password,
        todayOrdersCount: 0,
        todayCommission: 0,
        completedTasksCount: 0,
        currentCycleTasks: 0,
        cycleNumber: 1,
        cycleApprovedByAdmin: false,
        comboOrderStep: data.user.comboOrderStep || 14,
        workPermission: false,
        isDemoAccount: false,
        totalDeposit: 0.0,
        totalWithdrawal: 0.0,
      };

      // Add user's own referral code to inviteCodes list
      const newUserInviteCode = newUser.inviteCode || newUser.uid;
      const newCodeObj: InviteCode = {
        id: 'inv_user_' + newUser.uid,
        code: newUserInviteCode,
        type: 'user',
        createdBy: `${newUser.uid} (${newUser.username})`,
        creatorRole: 'user',
        usageCount: 0,
        maxUses: null,
        status: 'active',
        createdAt: newUser.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 19),
      };

      setInviteCodes((prev) => {
        const filtered = prev.filter((c) => c.code.toUpperCase() !== newUserInviteCode.toUpperCase());
        return [newCodeObj, ...filtered];
      });

      setUsers((prev) => {
        const filtered = prev.filter((u) => u.uid !== newUser.uid && u.id !== newUser.id);
        const updated = [newUser, ...filtered];
        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setCurrentUserId(newUser.id);

      // Trigger cross-tab sync
      try {
        window.dispatchEvent(new CustomEvent('tradeweb_users_updated', { detail: [newUser, ...users] }));
      } catch {}

      return {
        success: true,
        user: newUser,
        message:
          data.message ||
          `Registration successful! Your UID is ${newUser.uid} and your Referral Code is ${newUserInviteCode}.`,
      };
    } catch (err: any) {
      console.error('Registration API error:', err);
      return {
        success: false,
        message: 'Network error connecting to registration server. Please try again in a moment.',
      };
    }
  };

  const logoutUser = () => {
    setCurrentUserId(null);
  };

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
  };

  const setWithdrawalPassword = (password: string) => {
    if (!currentUser) return { success: false, message: 'No user logged in.' };
    if (!/^\d{6}$/.test(password)) {
      return { success: false, message: 'Withdrawal password must be exactly 6 numeric digits.' };
    }

    syncUserUpdateToBackend(currentUser.uid, { withdrawalPassword: password });
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, withdrawalPassword: password } : u))
    );
    return { success: true, message: '6-digit withdrawal password set successfully!' };
  };

  const bindWallet = (walletData: Omit<UserWallet, 'boundAt'>) => {
    if (!currentUser) return { success: false, message: 'No user logged in.' };

    const latestUser =
      users.find((u) => u.id === currentUser.id || String(u.uid) === String(currentUser.uid)) ||
      currentUser;

    // Respect Admin account lock flag
    if (latestUser.isLockedAccount === true) {
      return {
        success: false,
        message: 'Your account is locked by Administrator. Please contact Customer Service.',
      };
    }

    // Security Lock: Only lock if a valid wallet address was genuinely bound previously
    const hasExistingBoundAddress = Boolean(
      latestUser.wallet &&
      typeof latestUser.wallet.walletAddress === 'string' &&
      latestUser.wallet.walletAddress.trim().length > 0
    );
    if (hasExistingBoundAddress) {
      return {
        success: false,
        message: 'Receiving address is locked for security. Please contact Customer Service or Admin to reset.',
      };
    }

    const trimmedAddress = walletData.walletAddress.trim();
    if (walletData.protocol === 'TRC-20') {
      if (!trimmedAddress.startsWith('T') || trimmedAddress.length < 30) {
        return { success: false, message: 'Please enter a valid TRC-20 wallet address (starts with T).' };
      }
    } else if (trimmedAddress.length < 20) {
      return { success: false, message: `Please enter a valid ${walletData.protocol} wallet address.` };
    }

    const boundWallet: UserWallet = {
      ...walletData,
      walletAddress: trimmedAddress,
      boundAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    syncUserUpdateToBackend(latestUser.uid, { wallet: boundWallet });
    setUsers((prev) =>
      prev.map((u) =>
        u.id === latestUser.id || String(u.uid) === String(latestUser.uid)
          ? { ...u, wallet: boundWallet }
          : u
      )
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

    // Send to centralized persistent backend store immediately
    fetch(getApiUrl('/api/deposits/submit'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deposit: newDeposit }),
    }).catch((err) => console.warn('Backend deposit submission sync notice:', err));

    try {
      window.dispatchEvent(new CustomEvent('tradeweb_deposits_updated'));
    } catch {}

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

    // RULE: Mandatory Recurring 25% Tax Check (>= 50,000 USDT Balance)
    // Whenever a user's account balance is 50,000 USDT or above at the time of a withdrawal request,
    // a mandatory 25% tax/fee check is triggered every single time without exception.
    if (currentUser.balance >= 50000 && !currentUser.taxPaid) {
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

    // Step 4: 15% Fee Calculation & Balance Deduction
    // Apply a mandatory 15% fee on all withdrawals, deducting the full requested amount from balance while processing the net 85% payout.
    const feePercent = 15;
    const feeAmount = Number((amount * 0.15).toFixed(4));
    const netAmount = Number((amount * 0.85).toFixed(4));

    // Full requested amount is immediately deducted from user balance.
    // Reset taxPaid to false so that whenever the user's account balance is 50,000 USDT or above
    // on any subsequent withdrawal request, the 25% tax check is triggered every single time without exception.
    const deductedBal = Number((currentUser.balance - amount).toFixed(4));
    syncUserUpdateToBackend(currentUser.uid, { balance: deductedBal, taxPaid: false });
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              balance: deductedBal,
              taxPaid: false,
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
      feePercent,
      feeAmount,
      netAmount,
      currency: 'USDT',
      protocol: 'TRC-20',
      walletAddress: targetAddress,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setWithdrawals((prev) => [newWithdrawal, ...prev]);
    return {
      success: true,
      message: `Withdrawal request for ${amount.toFixed(2)} USDT submitted! (Net payout after 15% fee: ${netAmount.toFixed(2)} USDT). Status: Pending review by Admin.`,
    };
  };

  // --------------------------------------------------------------------------
  // VIP ORDER MATCHING / GRABBING ENGINE WITH COMBO LOGIC
  // --------------------------------------------------------------------------

  // Helper function: Detect if user is in Cycle #2 and started with approximately 30-40 USDT
  const isCycle2SmallBalanceAccount = (user: User): boolean => {
    if (user.isDemoAccount) return false;
    if ((user.cycleNumber || 1) !== 2) return false;
    // If cycleStartBalance was explicitly recorded, check if it was in the ~30-40 USDT range (25 - 48 USDT)
    if (user.cycleStartBalance !== undefined) {
      return user.cycleStartBalance >= 25 && user.cycleStartBalance <= 48;
    }
    // Exclude pre-seeded large accounts like Elena_Crypto (950 USDT) or Marcus_T (320 USDT)
    if (user.id === 'user_2' || user.id === 'user_3') return false;
    const tasks = user.currentCycleTasks ?? 0;
    // If user is at the beginning of Cycle 2 (0-3 tasks) with balance in 25-55 USDT range
    if (tasks <= 3 && user.balance >= 25 && user.balance <= 55) return true;
    // If progressing in Cycle 2 within the 30-40 USDT calibration trajectory (balance under 360 USDT)
    if (user.balance <= 360 && tasks > 0) return true;
    return false;
  };

  // Helper function to resolve combo order trigger rules:
  // - Cycle 1: 1 Combo at #14 or #15 (36% deposit requirement, 20% commission)
  // - Cycle 2: 3 Combos: #7 (55% dep / 26% comm), #15 (50% dep / 18% comm), #23 (50% dep / 18% comm)
  // - Cycle 3: 4 Combos: #7 (55% dep / 26% comm), #13, #18, #23 (50% dep / 18% comm each)
  // - VIP / Locked Accounts: 5 Combos (#8: 267%/81%, #15: 150%/81%, #19: 130%/81%, #23: 90%/81%, #25: 43%/83%)
  // - Custom Combos configured by Admin take highest priority
  const getComboRuleForUser = (
    user: User,
    taskNumber: number
  ): {
    isCombo: boolean;
    depositPercent: number;
    commissionPercent: number;
    fixedDepositDeficit?: number;
    fixedCommission?: number;
    depositAddress?: string;
  } | null => {
    // 0. DEMO ACCOUNT COMBO SCHEDULE (EXACTLY 4 COMBOS):
    // For demo accounts, strictly trigger exactly 4 combo orders across the 25-task cycle at tasks: #9, #14, #19, and #24.
    // Starting balance: 300 USDT.
    // Total final balance after completing all 25 tasks must range between 2300 to 2700 USDT (target ~2500 USDT).
    // Dynamic TRC-20 Address Rotation: Sequentially cycles through distinct pool addresses across the 4 stages.
    if (user.isDemoAccount) {
      const bal = user.balance;
      const targetFinal = 2500.0; // Anchors accurately within [2300, 2700] USDT

      switch (taskNumber) {
        case 9: {
          // Task #9 (First Combo): Set combo amount within 150 USDT.
          // Combo deficit requirement is fixed within 150 USDT (135.00 USDT)
          // Stage 1/4 TRC-20 address: Pool Index 0
          const deficit = 135.0;
          const comm = 105.0;
          const depPct = Number(((deficit / Math.max(1, bal)) * 100).toFixed(2));
          const totalAmt = Number((bal + deficit).toFixed(2));
          const commPct = Number(((comm / totalAmt) * 100).toFixed(2));
          return {
            isCombo: true,
            depositPercent: depPct,
            commissionPercent: commPct,
            fixedDepositDeficit: deficit,
            fixedCommission: comm,
            depositAddress: DEMO_TRC20_ADDRESS_POOL[0],
          };
        }

        case 14: {
          // Task #14 (Second Combo): Set combo amount within 240 USDT.
          // Combo deficit requirement is fixed within 240 USDT (220.00 USDT)
          // Stage 2/4 TRC-20 address: Pool Index 1
          const deficit = 220.0;
          const comm = 225.0;
          const depPct = Number(((deficit / Math.max(1, bal)) * 100).toFixed(2));
          const totalAmt = Number((bal + deficit).toFixed(2));
          const commPct = Number(((comm / totalAmt) * 100).toFixed(2));
          return {
            isCombo: true,
            depositPercent: depPct,
            commissionPercent: commPct,
            fixedDepositDeficit: deficit,
            fixedCommission: comm,
            depositAddress: DEMO_TRC20_ADDRESS_POOL[1],
          };
        }

        case 19: {
          // Task #19 (Third Combo): Scale up progress towards intermediate target (~1650 USDT).
          // Stage 3/4 TRC-20 address: Pool Index 2
          const deficit = 260.0;
          const comm = 200.0;
          const depPct = Number(((deficit / Math.max(1, bal)) * 100).toFixed(2));
          const totalAmt = Number((bal + deficit).toFixed(2));
          const commPct = Number(((comm / totalAmt) * 100).toFixed(2));
          return {
            isCombo: true,
            depositPercent: depPct,
            commissionPercent: commPct,
            fixedDepositDeficit: deficit,
            fixedCommission: comm,
            depositAddress: DEMO_TRC20_ADDRESS_POOL[2],
          };
        }

        case 24: {
          // Task #24 (Fourth and Final Combo):
          // Set combo amount to be strictly over 400 USDT (410-430 USDT, chosen: 420.00 USDT)
          // Stage 4/4 TRC-20 address: Pool Index 3 (distinct, preventing repetition)
          const deficit = 420.0; // Strictly over 400 USDT, within 410-430 USDT
          const expectedTask25Comm = 30.0;
          // Calculate combo commission so final total balance strictly lands between 2300 and 2700 USDT (target 2500 USDT)
          const remainingForComm = targetFinal - (bal + deficit) - expectedTask25Comm;
          const comm = Number(Math.max(60, Math.min(350, remainingForComm)).toFixed(2));
          const depPct = Number(((deficit / Math.max(1, bal)) * 100).toFixed(2));
          const totalAmt = Number((bal + deficit).toFixed(2));
          const commPct = Number(((comm / totalAmt) * 100).toFixed(2));
          return {
            isCombo: true,
            depositPercent: depPct,
            commissionPercent: commPct,
            fixedDepositDeficit: deficit,
            fixedCommission: comm,
            depositAddress: DEMO_TRC20_ADDRESS_POOL[3],
          };
        }

        default:
          return null;
      }
    }

    // 1. ADMIN CUSTOM COMBOS OVERRIDE:
    // Honor exact custom combo triggers configured by Admin without injecting extra unwanted combos.
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

    // 3. Cycle 1 (New Account / 1st Cycle): Trigger EXACTLY 1 Combo Order (at Task #14 or Task #15).
    if (cycle === 1) {
      const targetStep = user.comboOrderStep === 15 ? 15 : 14;
      if (taskNumber === targetStep) {
        return { isCombo: true, depositPercent: 36, commissionPercent: 20 };
      }
      return null;
    }

    // 4. Cycle 2 & Onwards (cycle >= 2): Trigger EXACTLY 3 Combo Orders (at Task #7, Task #15, and Task #23).
    // For accounts starting Cycle #2 with ~30-40 USDT, calibrate Task #23 so final balance lands in 320-350 USDT.
    if (cycle >= 2) {
      const isSmallAccount = cycle === 2 && isCycle2SmallBalanceAccount(user);

      if (taskNumber === 7) {
        return { isCombo: true, depositPercent: 55, commissionPercent: 26 };
      }
      if (taskNumber === 15) {
        return { isCombo: true, depositPercent: 50, commissionPercent: 18 };
      }
      if (taskNumber === 23) {
        if (isSmallAccount) {
          const bal = user.balance;
          const deficitPct = 48;
          const deficit = Number(((bal * deficitPct) / 100).toFixed(2));
          const totalAmt = Number((bal + deficit).toFixed(2));
          const targetAfter23 = 326.0;
          const remainingForComm = Number((targetAfter23 - totalAmt).toFixed(2));
          const comm = Number(Math.max(35, Math.min(80, remainingForComm)).toFixed(2));
          const commPct = Number(((comm / totalAmt) * 100).toFixed(2));
          return {
            isCombo: true,
            depositPercent: deficitPct,
            commissionPercent: commPct,
            fixedDepositDeficit: deficit,
            fixedCommission: comm,
          };
        }
        return { isCombo: true, depositPercent: 50, commissionPercent: 18 };
      }
      return null;
    }

    return null;
  };

  const grabOrder = (vipTier: 'VIP 1' | 'VIP 2' | 'VIP 3') => {
    if (!currentUser) return { success: false, message: 'Please login first.' };

    // RULE 0: Admin Approval & Work Permission Check (Strict === true enforcement)
    // New registered accounts must remain locked/unapproved by default. Users cannot start working or grabbing tasks until an Admin manually grants "Work Permission"
    if (currentUser.workPermission !== true) {
      return {
        success: false,
        isPermissionLocked: true,
        message:
          'Work Permission Required: Your account is pending Admin approval. Please contact Admin or Customer Support to activate your work permission before grabbing orders.',
      };
    }

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

      if (comboRule.fixedDepositDeficit !== undefined) {
        requiredDepositDeficit = comboRule.fixedDepositDeficit;
        requiredBalance = Number((bal + requiredDepositDeficit).toFixed(2));
      } else {
        // Deficit amount = (balance * comboDepositPercent) / 100
        requiredDepositDeficit = Number(((bal * comboRule.depositPercent) / 100).toFixed(2));
        requiredBalance = Number((bal + requiredDepositDeficit).toFixed(2));
      }

      // Combo product set target matches the required balance (User Balance + Deposit Deficit)
      const combo = generateComboOrderProducts(bal, requiredBalance);
      matchedItems = combo.items;
      actualOrderAmt = combo.totalOrderAmount;

      if (comboRule.fixedCommission !== undefined) {
        comm = comboRule.fixedCommission;
        comboCommissionPercent = Number(((comm / actualOrderAmt) * 100).toFixed(2));
        rate = Number((comboCommissionPercent / 100).toFixed(4));
      } else {
        rate = Number((comboRule.commissionPercent / 100).toFixed(4));
        comm = Number(((actualOrderAmt * comboRule.commissionPercent) / 100).toFixed(4));
      }
      expected = Number((actualOrderAmt + comm).toFixed(4));
    } else {
      // Standard VIP Order
      rate = vipTier === 'VIP 1' ? 0.04 : vipTier === 'VIP 2' ? 0.08 : 0.12;
      const targetOrderAmt = Number((bal * (0.55 + Math.random() * 0.25)).toFixed(2));
      matchedItems = generateTieredMatchedProducts(bal, targetOrderAmt);
      actualOrderAmt = Number(
        matchedItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0).toFixed(2)
      );

      // Demo account specific calibration for task progression:
      if (currentUser.isDemoAccount) {
        if (nextTaskNumber === 25) {
          // Final task of cycle: calibrate commission so total final balance lands accurately at 2500 USDT (strictly 2300 - 2700 USDT)
          const targetFinal = 2500.0;
          const remainingToTarget = Number((targetFinal - bal).toFixed(2));
          comm = Number(Math.max(15, Math.min(60, remainingToTarget)).toFixed(4));
        } else if (nextTaskNumber <= 8) {
          // Tasks 1 to 8: ~6 to 8 USDT per task
          comm = Number((5.5 + Math.random() * 2.5).toFixed(4));
        } else if (nextTaskNumber >= 10 && nextTaskNumber <= 13) {
          // Tasks 10 to 13: ~14 to 20 USDT per task
          comm = Number((14.0 + Math.random() * 5.0).toFixed(4));
        } else if (nextTaskNumber >= 15 && nextTaskNumber <= 18) {
          // Tasks 15 to 18: ~20 to 26 USDT per task
          comm = Number((20.0 + Math.random() * 6.0).toFixed(4));
        } else if (nextTaskNumber >= 20 && nextTaskNumber <= 23) {
          // Tasks 20 to 23: ~24 to 30 USDT per task
          comm = Number((24.0 + Math.random() * 6.0).toFixed(4));
        } else {
          comm = Number((actualOrderAmt * 0.03).toFixed(4));
        }
        rate = Number((comm / Math.max(1, actualOrderAmt)).toFixed(4));
      } else if (isCycle2SmallBalanceAccount(currentUser)) {
        // SECOND WORK CYCLE (Cycle #2) FOR ACCOUNTS STARTING WITH ~30-40 USDT:
        // Adjust progression and commission multipliers across the 25 tasks so that
        // final total balance lands strictly between 320 and 350 USDT (target 335.00 USDT).
        if (nextTaskNumber === 25) {
          // Final task of Cycle #2: calibrate commission so total final balance lands at target 335.00 USDT (strictly 320 - 350 USDT)
          const targetFinal = 335.0;
          const remainingToTarget = Number((targetFinal - bal).toFixed(2));
          comm = Number(Math.max(2.0, Math.min(18.0, remainingToTarget)).toFixed(4));
        } else if (nextTaskNumber <= 6) {
          // Tasks 1 to 6 (leading to Combo #7): ~0.80 to 1.15 USDT per task
          comm = Number((0.80 + Math.random() * 0.35).toFixed(4));
        } else if (nextTaskNumber >= 8 && nextTaskNumber <= 14) {
          // Tasks 8 to 14 (leading to Combo #15): ~1.40 to 1.95 USDT per task
          comm = Number((1.40 + Math.random() * 0.55).toFixed(4));
        } else if (nextTaskNumber >= 16 && nextTaskNumber <= 22) {
          // Tasks 16 to 22 (leading to Combo #23): ~2.20 to 2.90 USDT per task
          comm = Number((2.20 + Math.random() * 0.70).toFixed(4));
        } else if (nextTaskNumber === 24) {
          // Task #24: ~3.50 to 4.50 USDT
          comm = Number((3.50 + Math.random() * 0.80).toFixed(4));
        } else {
          comm = Number((actualOrderAmt * 0.04).toFixed(4));
        }
        rate = Number((comm / Math.max(1, actualOrderAmt)).toFixed(4));
      } else {
        comm = Number((actualOrderAmt * rate).toFixed(4));
      }
      expected = Number((actualOrderAmt + comm).toFixed(4));
    }

    // Order number format matching screenshot: e.g., 260111110013013260870
    const randomSuffix = Math.floor(100000000000000000 + Math.random() * 900000000000000000).toString();
    const orderNo = `260${randomSuffix}`;

    // Resolve rotated deposit address for combo orders:
    let assignedDepositAddress = comboRule?.depositAddress;
    if (isComboOrder && !assignedDepositAddress) {
      // Real account sequential rotation from Admin TRC-20 address pool:
      const realPool =
        systemConfig.trc20AddressPool && systemConfig.trc20AddressPool.length > 0
          ? systemConfig.trc20AddressPool
          : [systemConfig.trc20DepositAddress];
      const previousCombosCount = orders.filter(
        (o) => o.userId === currentUser.id && o.isComboOrder
      ).length;
      assignedDepositAddress = realPool[previousCombosCount % realPool.length];
    }

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
      depositAddress: assignedDepositAddress,
    };

    setOrders((prev) => [newOrder, ...prev]);
    return { success: true, order: newOrder, isComboOrder };
  };

  const processingOrderIds = useRef<Set<string>>(new Set());

  const submitOrder = (orderId: string) => {
    if (processingOrderIds.current.has(orderId)) {
      return { success: false, message: 'Order submission is already in progress. Please wait.' };
    }

    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found.' };
    if (order.status === 'completed') return { success: false, message: 'Order already completed.' };

    const targetUser = users.find((u) => u.id === order.userId);
    if (!targetUser) return { success: false, message: 'User not found.' };

    // Strict Work Permission Enforcement on order submission
    if (targetUser.workPermission !== true) {
      return {
        success: false,
        isPermissionLocked: true,
        message:
          'Work Permission Required: Your account does not have active Work Permission. Please contact Admin to enable it.',
      };
    }

    // COMMISSION FORMULA: Respect fixed commission or Total Order Amount * Commission Percentage
    const calculatedCommission =
      order.commission > 0
        ? order.commission
        : order.isComboOrder && order.comboCommissionPercent
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

    // Acquire locks & guard 3s polling from overwriting before server acknowledges
    processingOrderIds.current.add(orderId);
    pendingUserMutationAt.current[String(targetUser.uid)] = Date.now();

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Update order status to completed immediately
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              commission: calculatedCommission,
              expectedIncome: Number((o.orderAmount + calculatedCommission).toFixed(4)),
              status: 'completed',
              completedAt: nowStr,
            }
          : o
      )
    );

    const nextCompletedLifetime = (targetUser.completedTasksCount || 0) + 1;
    const nextCycleTasks = (targetUser.currentCycleTasks || 0) + 1;
    const isCycleNowFinished = nextCycleTasks >= 25;

    const today = new Date().toISOString().substring(0, 10);
    const isNewDay = targetUser.lastActiveDate && targetUser.lastActiveDate !== today;
    const currentTimes = isNewDay ? 0 : (targetUser.todayOrdersCount ?? 0);
    const currentComm = isNewDay ? 0 : (targetUser.todayCommission ?? 0);
    const yestComm = isNewDay ? (targetUser.todayCommission ?? 0) : (targetUser.yesterdayCommission ?? 0);

    let newBalance = Number(((targetUser.balance || 0) + calculatedCommission).toFixed(4));
    if (targetUser.isDemoAccount) {
      if (isCycleNowFinished) {
        newBalance = Number(Math.min(2680, Math.max(2320, newBalance)).toFixed(4));
      } else {
        newBalance = Number(Math.min(2650, newBalance).toFixed(4));
      }
    } else if (isCycle2SmallBalanceAccount(targetUser)) {
      if (isCycleNowFinished) {
        newBalance = Number(Math.min(348, Math.max(322, newBalance)).toFixed(4));
      } else {
        newBalance = Number(Math.min(340, newBalance).toFixed(4));
      }
    }

    let nextVip = targetUser.vipLevel || 0;
    if (newBalance >= 899) nextVip = Math.max(nextVip, 3);
    else if (newBalance >= 499) nextVip = Math.max(nextVip, 2);
    else if (newBalance >= 20) nextVip = Math.max(nextVip, 1);

    const userPayloadUpdates: Partial<User> = {
      balance: newBalance,
      vipLevel: nextVip,
      todayOrdersCount: currentTimes + 1,
      todayCommission: Number((currentComm + calculatedCommission).toFixed(4)),
      yesterdayCommission: yestComm,
      lastActiveDate: today,
      completedTasksCount: nextCompletedLifetime,
      currentCycleTasks: nextCycleTasks,
      cycleNumber: targetUser.cycleNumber || 1,
      cycleApprovedByAdmin: !isCycleNowFinished,
      workPermission: !isCycleNowFinished,
    };

    // Credit commission directly to user's main account balance and update cycle tracking
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === targetUser.id || String(u.uid) === String(targetUser.uid)) {
          return {
            ...u,
            ...userPayloadUpdates,
          };
        }
        return u;
      })
    );

    // Persist order submission & commission crediting atomically to backend (with /api/users/update fallback)
    (async () => {
      try {
        const res = await fetch(getApiUrl('/api/orders/submit'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            orderNo: order.orderNo,
            userUid: targetUser.uid,
            userId: targetUser.id,
            username: targetUser.username,
            commission: calculatedCommission,
            orderAmount: order.orderAmount,
            platform: order.platform,
            vipTier: order.vipTier,
            productTitle: order.productTitle,
            isComboOrder: !!order.isComboOrder,
            comboStepNumber: order.comboStepNumber || 0,
          }),
        });

        const data = await res.json().catch(() => null);

        if (res.status === 403) {
          // Server explicitly rejected due to missing workPermission or cycle lock; sync server lock state
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: 'incomplete', completedAt: undefined } : o))
          );
          if (data && data.user) {
            setUsers((prev) =>
              prev.map((u) =>
                String(u.uid) === String(data.user.uid)
                  ? {
                      ...u,
                      balance: data.user.balance,
                      workPermission: data.user.workPermission === true,
                      cycleApprovedByAdmin: data.user.cycleApprovedByAdmin === true,
                      currentCycleTasks: data.user.currentCycleTasks,
                    }
                  : u
              )
            );
          }
          return;
        }

        if (!res.ok) {
          // Fallback to /api/users/update so balance, cycle lock & task count still persist permanently
          await fetch(getApiUrl('/api/users/update'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: targetUser.uid, updates: userPayloadUpdates }),
          }).catch(() => {});
          return;
        }

        if (data && data.success && data.user) {
          setUsers((prev) =>
            prev.map((u) =>
              String(u.uid) === String(data.user.uid)
                ? {
                    ...u,
                    balance: data.user.balance,
                    vipLevel: data.user.vipLevel,
                    todayOrdersCount: data.user.todayOrdersCount,
                    todayCommission: data.user.todayCommission,
                    yesterdayCommission: data.user.yesterdayCommission,
                    lastActiveDate: data.user.lastActiveDate,
                    completedTasksCount: data.user.completedTasksCount,
                    currentCycleTasks: data.user.currentCycleTasks,
                    cycleNumber: data.user.cycleNumber || u.cycleNumber || 1,
                    cycleApprovedByAdmin: data.user.cycleApprovedByAdmin === true,
                    workPermission: data.user.workPermission === true,
                  }
                : u
            )
          );
          try {
            window.dispatchEvent(
              new CustomEvent('tradeweb_balance_updated', {
                detail: { userUid: data.user.uid, newBalance: data.user.balance, amount: calculatedCommission },
              })
            );
            window.dispatchEvent(new CustomEvent('tradeweb_users_updated'));
          } catch {}
        }
      } catch (err) {
        console.warn('Backend order submit sync error, falling back to /api/users/update:', err);
        fetch(getApiUrl('/api/users/update'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: targetUser.uid, updates: userPayloadUpdates }),
        }).catch(() => {});
      } finally {
        processingOrderIds.current.delete(orderId);
      }
    })();

    if (order.isComboOrder) {
      return {
        success: true,
        isCycleNowFinished,
        message: `Special Combo Order #${order.comboStepNumber || 14} completed! Earned massive +${calculatedCommission.toFixed(4)} USDT super commission!`,
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
      message: `Order submitted successfully! Earned +${calculatedCommission.toFixed(4)} USDT commission!`,
    };
  };

  // --------------------------------------------------------------------------
  // ADMIN PANEL METHODS & ROLE-BASED ACCESS CONTROL
  // --------------------------------------------------------------------------

  const navigateToAdmin = () => {
    setActiveView('admin');
    try {
      if (window.location.pathname !== '/admin') {
        window.history.pushState({}, '', '/admin');
      }
    } catch {
      window.location.hash = '#admin';
    }
  };

  const navigateToUser = () => {
    setActiveView('user');
    try {
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
      }
    } catch {
      window.location.hash = '';
    }
  };

  const adminLogin = (
    username: string,
    password: string,
    securityPin?: string
  ): { success: boolean; message?: string; admin?: AdminUser } => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanPin = securityPin ? securityPin.trim() : '';

    const matchingAdmin = admins.find(
      (a) => a.username.toLowerCase() === cleanUser && a.status === 'active'
    );

    if (!matchingAdmin) {
      return { success: false, message: 'Access Denied: Administrator account not found.' };
    }

    const expectedPass = matchingAdmin.password || 'admin123';
    if (cleanPass !== expectedPass) {
      return { success: false, message: 'Access Denied: Incorrect administrator password.' };
    }

    const expectedPin = matchingAdmin.securityPin || '9988';
    if (cleanPin && cleanPin !== expectedPin) {
      return { success: false, message: 'Access Denied: Invalid Master Security PIN.' };
    }

    setCurrentAdminId(matchingAdmin.id);
    setIsAdminAuthenticated(true);
    sessionStorage.setItem('admin_session_auth', 'true');

    logAuditAction(
      'ADMIN_LOGIN_SUCCESS',
      `Administrator "${matchingAdmin.name}" (${matchingAdmin.username}) authenticated into Admin Console via secure route.`
    );

    return { success: true, admin: matchingAdmin };
  };

  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('admin_session_auth');
    setActiveView('user');
    try {
      window.history.pushState({}, '', '/');
    } catch {
      window.location.hash = '';
    }
  };

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

    syncUserUpdateToBackend(targetUser.uid, {
      todayOrdersCount: 0,
      currentCycleTasks: 0,
      cycleNumber: nextCycleNum,
      cycleStartBalance: targetUser.balance,
      cycleApprovedByAdmin: true,
      workPermission: true,
      comboOrderStep: plannedCycle1Combo,
    });

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              todayOrdersCount: 0, // When Admin resets task cycle, reset Today's Times back to 0
              currentCycleTasks: 0, // Reset progress strictly to 0
              cycleNumber: nextCycleNum,
              cycleStartBalance: targetUser.balance, // Record starting balance of newly approved cycle (e.g. 30-40 USDT for Cycle 2)
              cycleApprovedByAdmin: true,
              workPermission: true,
              comboOrderStep: plannedCycle1Combo, // Strictly Task #14 or #15 planned
            }
          : u
      )
    );

    try {
      window.dispatchEvent(new CustomEvent('tradeweb_users_updated'));
    } catch {}

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
    syncUserUpdateToBackend(target.uid, { isVipAccount: nextVip });
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
    syncUserUpdateToBackend(target.uid, { isLockedAccount: nextLock });
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

    syncUserUpdateToBackend(target.uid, { customCombos: combos });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, customCombos: combos } : u))
    );

    const customCount = combos.length;
    const summaryText =
      customCount === 0
        ? 'Cleared custom triggers (reverted to default cycle/VIP rules)'
        : `${customCount} custom combo trigger(s) active (exact Admin override)`;

    logAuditAction(
      'SET_CUSTOM_COMBOS',
      `Updated combo rules for UID: ${target.uid} (${target.username}): ${summaryText}`,
      target.uid
    );

    return {
      success: true,
      message: `Custom combo rules updated for ${target.username}: ${summaryText}.`,
    };
  };

  const clearUserTax = (userId: string) => {
    if (!hasPermission('can_manage_users') && !hasPermission('can_approve_withdrawals')) {
      return { success: false, message: 'Permission denied: Cannot clear user tax.' };
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found.' };

    const taxAmount = Number((target.balance * 0.25).toFixed(2));
    syncUserUpdateToBackend(target.uid, { taxPaid: true, taxAmountPaid: taxAmount });
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

  // In-flight processing lock to prevent any double-clicks or rapid parallel calls
  const processingDepositIds = useRef<Set<string>>(new Set());

  const approveDeposit = (depositId: string) => {
    if (!hasPermission('can_approve_deposits')) {
      return { success: false, message: 'Permission denied: Your role cannot approve deposits.' };
    }

    // 1. Guard against in-flight clicks or parallel executions
    if (processingDepositIds.current.has(depositId)) {
      return { success: false, message: 'Deposit approval is currently being processed. Please wait.' };
    }

    const dep = deposits.find((d) => d.id === depositId);
    if (!dep) return { success: false, message: 'Deposit record not found.' };

    // 2. Guard against already approved deposits (Strict Idempotency Check)
    if (dep.status === 'approved') {
      return {
        success: false,
        message: 'Deposit has already been approved previously. Balance was added exactly once.',
      };
    }
    if (dep.status !== 'pending') {
      return { success: false, message: `Deposit has already been processed (status: ${dep.status}).` };
    }

    processingDepositIds.current.add(depositId);

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const reviewer = currentAdmin.username;
    const depositAmt = Number(dep.amount);

    // 3. Immediately mark deposit as approved in React state
    setDeposits((prev) =>
      prev.map((d) =>
        d.id === depositId
          ? {
              ...d,
              status: 'approved',
              reviewedAt: nowStr,
              reviewedBy: reviewer,
            }
          : d
      )
    );

    // 4. Identify target user and compute new balance & totalDeposit
    const norm = (s?: string | null) => (s ? String(s).trim().toLowerCase() : '');
    const depUserUid = String(dep.userUid || '');
    const depUserId = String(dep.userId || '');
    const depUsername = norm(dep.username);

    const targetUser = users.find((u) => {
      return (
        (depUserUid && String(u.uid) === depUserUid) ||
        (depUserId && (u.id === depUserId || String(u.uid) === depUserId)) ||
        (depUsername && norm(u.username) === depUsername)
      );
    });

    const targetBal = targetUser ? targetUser.balance || 0 : 0;
    const targetTotalDep = targetUser ? targetUser.totalDeposit || 0 : 0;
    const currentVip = targetUser ? targetUser.vipLevel || 0 : 0;

    const newBal = Number((targetBal + depositAmt).toFixed(4));
    const newTotalDep = Number((targetTotalDep + depositAmt).toFixed(4));
    let newVip = currentVip;
    if (newBal >= 899) newVip = Math.max(newVip, 3);
    else if (newBal >= 499) newVip = Math.max(newVip, 2);
    else if (newBal >= 20) newVip = Math.max(newVip, 1);

    // Increment client balance EXACTLY ONCE
    setUsers((prev) =>
      prev.map((u) => {
        const matches =
          (depUserUid && String(u.uid) === depUserUid) ||
          (depUserId && (u.id === depUserId || String(u.uid) === depUserId)) ||
          (depUsername && norm(u.username) === depUsername);

        if (matches) {
          return {
            ...u,
            balance: newBal,
            totalDeposit: newTotalDep,
            vipLevel: newVip,
          };
        }
        return u;
      })
    );

    const effectiveUid = dep.userUid || targetUser?.uid;
    const effectiveUserId = dep.userId || targetUser?.id;
    const effectiveUsername = dep.username || targetUser?.username;
    if (effectiveUid) {
      pendingUserMutationAt.current[String(effectiveUid)] = Date.now();
    }

    // 5. Send single atomic approve request to backend
    // Notice: We do NOT make a duplicate call to syncUserUpdateToBackend here.
    // /api/deposits/approve is the single atomic authoritative backend handler.
    fetch(getApiUrl('/api/deposits/approve'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        depositId: dep.id,
        amount: depositAmt,
        userUid: effectiveUid,
        userId: effectiveUserId,
        username: effectiveUsername,
        adminUsername: reviewer,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.user) {
          // Adopt authoritative server state for exact synchronization
          setUsers((prev) =>
            prev.map((u) =>
              String(u.uid) === String(data.user.uid)
                ? {
                    ...u,
                    balance: data.user.balance,
                    totalDeposit: data.user.totalDeposit,
                    vipLevel: data.user.vipLevel,
                  }
                : u
            )
          );
        }
      })
      .catch((err) => console.warn('Backend deposit approve sync error:', err))
      .finally(() => {
        processingDepositIds.current.delete(depositId);
      });

    // 6. Dispatch instant UI events across windows/tabs
    try {
      window.dispatchEvent(
        new CustomEvent('tradeweb_balance_updated', {
          detail: { userUid: dep.userUid, newBalance: newBal, amount: depositAmt },
        })
      );
      window.dispatchEvent(new CustomEvent('tradeweb_users_updated'));
      window.dispatchEvent(new CustomEvent('tradeweb_deposits_updated'));
    } catch {}

    logAuditAction(
      'APPROVE_DEPOSIT',
      `Approved deposit of ${depositAmt} USDT for user ${dep.username} (UID: ${dep.userUid}). TXID: ${dep.txid.substring(0, 16)}... User balance updated to ${newBal} USDT`,
      dep.userUid
    );

    return {
      success: true,
      message: `Deposit of ${depositAmt} USDT approved! ${dep.username}'s balance is now ${newBal.toFixed(2)} USDT.`,
    };
  };

  const rejectDeposit = (depositId: string, reason = 'Invalid or unverified transaction hash') => {
    if (!hasPermission('can_approve_deposits')) {
      return { success: false, message: 'Permission denied: Your role cannot reject deposits.' };
    }

    const dep = deposits.find((d) => d.id === depositId);
    if (!dep) return { success: false, message: 'Deposit record not found.' };
    if (dep.status !== 'pending') return { success: false, message: 'Deposit has already been processed.' };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const reviewer = currentAdmin.username;

    setDeposits((prev) =>
      prev.map((d) =>
        d.id === depositId
          ? {
              ...d,
              status: 'rejected',
              rejectionReason: reason,
              reviewedAt: nowStr,
              reviewedBy: reviewer,
            }
          : d
      )
    );

    fetch(getApiUrl('/api/deposits/reject'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        depositId: dep.id,
        reason,
        adminUsername: reviewer,
      }),
    }).catch((err) => console.warn('Backend deposit reject sync error:', err));

    try {
      window.dispatchEvent(new CustomEvent('tradeweb_deposits_updated'));
    } catch {}

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

    const netPayout = wd.netAmount || Number((wd.amount * 0.85).toFixed(4));
    const fee = wd.feeAmount || Number((wd.amount * 0.15).toFixed(4));

    logAuditAction(
      'APPROVE_WITHDRAWAL',
      `Accepted payout of ${netPayout} USDT (net 85% after 15% fee of ${fee} USDT on gross ${wd.amount} USDT) to TRC20 address ${wd.walletAddress.substring(0, 12)}... for UID: ${wd.userUid} (Status: Completed)`,
      wd.userUid
    );

    return {
      success: true,
      message: `Withdrawal approved! Net payout of ${netPayout} USDT (85% after 15% fee) sent to wallet.`,
    };
  };

  const rejectWithdrawal = (withdrawalId: string, reason = 'Address verification failed') => {
    if (!hasPermission('can_approve_withdrawals')) {
      return { success: false, message: 'Permission denied: Your role cannot reject withdrawals.' };
    }

    const wd = withdrawals.find((w) => w.id === withdrawalId);
    if (!wd) return { success: false, message: 'Withdrawal record not found.' };
    if (wd.status !== 'pending') return { success: false, message: 'Withdrawal already processed.' };

    // Refund funds back to user and sync to backend
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === wd.userId || (wd.userUid && String(u.uid) === String(wd.userUid))) {
          const newBal = Number(((u.balance || 0) + wd.amount).toFixed(4));
          syncUserUpdateToBackend(u.uid, { balance: newBal });
          return {
            ...u,
            balance: newBal,
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

    try {
      window.dispatchEvent(new CustomEvent('tradeweb_balance_updated'));
      window.dispatchEvent(new CustomEvent('tradeweb_users_updated'));
    } catch {}

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
    type: 'credit' | 'debit' | 'set',
    reason: string
  ) => {
    if (!hasPermission('can_credit_debit')) {
      return { success: false, message: 'Permission denied: Your role cannot modify user balances.' };
    }

    const target = users.find((u) => u.id === userId || String(u.uid) === String(userId));
    if (!target) return { success: false, message: 'User not found.' };

    if (type === 'debit' && target.balance < amount) {
      return { success: false, message: 'User balance is insufficient for this debit.' };
    }

    let newBal = target.balance;
    if (type === 'set') {
      newBal = Number(Math.max(0, amount).toFixed(4));
    } else if (type === 'credit') {
      newBal = Number((target.balance + amount).toFixed(4));
    } else if (type === 'debit') {
      newBal = Number(Math.max(0, target.balance - amount).toFixed(4));
    }

    let vip = target.vipLevel || 0;
    if (newBal >= 899) vip = Math.max(vip, 3);
    else if (newBal >= 499) vip = Math.max(vip, 2);
    else if (newBal >= 20) vip = Math.max(vip, 1);

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === target.id || String(u.uid) === String(target.uid)) {
          return { ...u, balance: newBal, vipLevel: vip };
        }
        return u;
      })
    );

    syncUserUpdateToBackend(target.uid, { balance: newBal, vipLevel: vip });

    fetch(getApiUrl('/api/admin/adjust-balance'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userUid: target.uid,
        userId: target.id,
        username: target.username,
        newBalance: newBal,
        mode: type,
        amount,
        reason,
        adminUsername: currentAdmin.username,
      }),
    }).catch(() => {});

    try {
      window.dispatchEvent(new CustomEvent('tradeweb_balance_updated'));
      window.dispatchEvent(new CustomEvent('tradeweb_users_updated'));
    } catch {}

    const actionText = type === 'set' ? 'SET_BALANCE' : type === 'credit' ? 'CREDIT_BALANCE' : 'DEBIT_BALANCE';
    logAuditAction(
      actionText as any,
      `${actionText} ${type === 'set' ? 'to ' + newBal : amount} USDT for UID: ${target.uid} (${target.username}). Reason: ${reason}`,
      target.uid
    );

    return {
      success: true,
      message:
        type === 'set'
          ? `Successfully set balance to ${newBal.toFixed(2)} USDT for ${target.username}.`
          : `Successfully ${type}ed ${amount} USDT for ${target.username}. New balance: ${newBal.toFixed(2)} USDT.`,
    };
  };

  const recalculateUserBalanceFromDeposits = async (userId: string) => {
    if (!hasPermission('can_credit_debit')) {
      return { success: false, message: 'Permission denied: Your role cannot recalculate user balances.' };
    }

    const target = users.find((u) => u.id === userId || String(u.uid) === String(userId));
    if (!target) return { success: false, message: 'User not found.' };

    const norm = (s?: string | null) => (s ? String(s).trim().toLowerCase() : '');
    const tUid = String(target.uid);
    const tId = target.id;
    const tUname = norm(target.username);

    // Sum all approved deposits for this user
    const userApprovedDeps = deposits.filter((d) => {
      const matches =
        (d.userUid && String(d.userUid) === tUid) ||
        (d.userId && d.userId === tId) ||
        (d.username && norm(d.username) === tUname);
      return matches && d.status === 'approved';
    });

    const totalApprovedDeposits = Number(
      userApprovedDeps.reduce((sum, d) => sum + Number(d.amount || 0), 0).toFixed(4)
    );

    let vip = target.vipLevel || 0;
    if (totalApprovedDeposits >= 899) vip = Math.max(vip, 3);
    else if (totalApprovedDeposits >= 499) vip = Math.max(vip, 2);
    else if (totalApprovedDeposits >= 20) vip = Math.max(vip, 1);

    // Update client state immediately
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === target.id || String(u.uid) === tUid) {
          return {
            ...u,
            balance: totalApprovedDeposits,
            totalDeposit: totalApprovedDeposits,
            vipLevel: vip,
          };
        }
        return u;
      })
    );

    // Persist to server recalculation endpoint
    pendingUserMutationAt.current[tUid] = Date.now();
    try {
      const resp = await fetch(getApiUrl('/api/admin/recalculate-balance'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userUid: target.uid,
          userId: target.id,
          username: target.username,
        }),
      });
      const data = await resp.json();
      if (data && data.success && data.user) {
        setUsers((prev) =>
          prev.map((u) => (String(u.uid) === String(data.user.uid) ? { ...u, ...data.user } : u))
        );
      }
    } catch (err) {
      console.warn('Backend recalculate balance notice:', err);
    }

    try {
      window.dispatchEvent(new CustomEvent('tradeweb_balance_updated'));
      window.dispatchEvent(new CustomEvent('tradeweb_users_updated'));
    } catch {}

    logAuditAction(
      'CREDIT_BALANCE',
      `Recalculated balance for ${target.username} (UID: ${target.uid}) from ${userApprovedDeps.length} approved deposits. Exact balance set to ${totalApprovedDeposits} USDT.`,
      target.uid
    );

    return {
      success: true,
      message: `Balance for ${target.username} successfully reset to exact approved deposits total: ${totalApprovedDeposits.toFixed(2)} USDT (${userApprovedDeps.length} approved deposit${userApprovedDeps.length === 1 ? '' : 's'}).`,
    };
  };

  const toggleUserStatus = (userId: string) => {
    if (!hasPermission('can_manage_users')) {
      return { success: false, message: 'Permission denied: Cannot freeze/unfreeze users.' };
    }

    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found.' };

    const newStatus = target.status === 'active' ? 'frozen' : 'active';
    syncUserUpdateToBackend(target.uid, { status: newStatus });
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

    syncUserUpdateToBackend(
      target.uid,
      type === 'login' ? { password: newPass } : { withdrawalPassword: newPass }
    );

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

  const resetUserWallet = (userId: string) => {
    if (!hasPermission('can_manage_users') && !hasPermission('can_modify_wallet')) {
      return { success: false, message: 'Permission denied: Cannot reset user wallet.' };
    }

    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found.' };

    const oldAddr = target.wallet?.walletAddress || 'None';

    syncUserUpdateToBackend(target.uid, { wallet: null });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, wallet: null } : u))
    );

    logAuditAction(
      'RESET_USER_WALLET',
      `Reset and unlocked receiving TRC-20 wallet address for UID: ${target.uid} (${target.username}). Previous address: ${oldAddr}. User can now bind a fresh address.`,
      target.uid
    );

    return {
      success: true,
      message: `Receiving TRC-20 wallet address for ${target.username} has been reset and unlocked.`,
    };
  };

  const adminUpdateUserWallet = (
    userId: string,
    data: { walletAddress: string; accountName?: string; walletName?: string; protocol?: 'TRC-20' | 'ERC-20' | 'BEP-20' }
  ) => {
    if (!hasPermission('can_manage_users') && !hasPermission('can_modify_wallet')) {
      return { success: false, message: 'Permission denied: Cannot update user wallet.' };
    }

    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found.' };

    if (!data.walletAddress.startsWith('T') || data.walletAddress.length < 30) {
      return { success: false, message: 'Invalid TRC-20 address. Must start with "T" and be at least 30 characters.' };
    }

    const updatedWallet: UserWallet = {
      walletName: data.walletName || target.wallet?.walletName || 'TRC-20 Wallet',
      protocol: data.protocol || 'TRC-20',
      walletAddress: data.walletAddress.trim(),
      accountName: data.accountName || target.wallet?.accountName || target.username,
      boundAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    syncUserUpdateToBackend(target.uid, { wallet: updatedWallet });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, wallet: updatedWallet } : u))
    );

    logAuditAction(
      'UPDATE_USER_WALLET',
      `Admin updated/corrected receiving TRC-20 wallet address for UID: ${target.uid} (${target.username}) to ${data.walletAddress.trim()}`,
      target.uid
    );

    return {
      success: true,
      message: `Receiving TRC-20 wallet address for ${target.username} updated to ${data.walletAddress.trim()}.`,
    };
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
    permissions: AdminPermission[],
    password?: string
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
      password: password?.trim() || 'sub123456',
      name: name.trim() || 'Sub Admin',
      role: 'sub_admin',
      permissions,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'active',
    };

    setAdmins((prev) => [...prev, newSub]);
    logAuditAction(
      'CREATE_SUBADMIN',
      `Created sub-admin "${clean}" with assigned credentials and ${permissions.length} permissions`
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

  const updateSubAdminPassword = (adminId: string, newPass: string) => {
    if (currentAdmin.role !== 'super_admin') {
      return {
        success: false,
        message: 'Permission Denied: Sub-admins cannot modify credentials. Only Super Admin can manage sub-admin passwords.',
      };
    }
    const clean = newPass.trim();
    if (!clean || clean.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long.' };
    }

    const target = admins.find((a) => a.id === adminId);
    if (!target) return { success: false, message: 'Sub-admin account not found.' };

    setAdmins((prev) =>
      prev.map((a) => (a.id === adminId ? { ...a, password: clean } : a))
    );

    logAuditAction(
      'UPDATE_SUBADMIN',
      `Super Admin updated login password for sub-admin "${target.username}"`
    );

    return {
      success: true,
      message: `Password for sub-admin "${target.username}" updated successfully!`,
    };
  };

  const updateSuperAdminSecurity = (newPassword?: string, newSecurityPin?: string) => {
    if (currentAdmin.role !== 'super_admin') {
      return {
        success: false,
        message: 'Permission Denied: Only Super Admin can modify system security credentials.',
      };
    }

    const updates: { password?: string; securityPin?: string } = {};

    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        return { success: false, message: 'New password must be at least 4 characters.' };
      }
      updates.password = newPassword.trim();
    }

    if (newSecurityPin && newSecurityPin.trim()) {
      if (newSecurityPin.trim().length < 4 || newSecurityPin.trim().length > 6) {
        return { success: false, message: 'Master Security PIN must be between 4 and 6 digits.' };
      }
      updates.securityPin = newSecurityPin.trim();
    }

    if (Object.keys(updates).length === 0) {
      return { success: false, message: 'Please enter a new password or Master Security PIN to update.' };
    }

    setAdmins((prev) =>
      prev.map((a) => (a.id === currentAdmin.id ? { ...a, ...updates } : a))
    );

    logAuditAction(
      'UPDATE_SUBADMIN',
      `Super Admin successfully changed their security credentials (${Object.keys(updates).join(', ')})`
    );

    return {
      success: true,
      message: 'Super Admin credentials & Master Security PIN updated successfully!',
    };
  };

  const updateSystemConfig = (newConfig: Partial<SystemConfig>) => {
    if (!hasPermission('can_modify_wallet')) return;
    setSystemConfig((prev) => ({ ...prev, ...newConfig }));
    logAuditAction('UPDATE_SYSTEM_WALLET', 'Updated system TRC20 wallet configuration');
  };

  const createDemoAccount = (data: {
    username: string;
    password?: string;
    initialBalance?: number;
    demoWalletAddress?: string;
    workPermission?: boolean;
  }) => {
    if (!hasPermission('can_manage_users')) {
      return { success: false, message: 'Permission denied: Cannot create demo accounts.' };
    }
    const cleanUser = data.username.trim();
    if (!cleanUser) {
      return { success: false, message: 'Please enter a demo username.' };
    }
    if (users.some((u) => u.username.toLowerCase() === cleanUser.toLowerCase())) {
      return { success: false, message: 'This username is already taken. Please choose another.' };
    }

    const newUid = generateUniqueUid();
    const walletAddr = data.demoWalletAddress || DEMO_TRC20_ADDRESS_POOL[0];
    const initialBal =
      typeof data.initialBalance === 'number' && !isNaN(data.initialBalance)
        ? data.initialBalance
        : 300;

    let vip = 1;
    if (initialBal >= 899) vip = 3;
    else if (initialBal >= 499) vip = 2;

    const demoUser: User = {
      id: 'user_demo_' + Date.now(),
      uid: newUid,
      username: cleanUser,
      password: data.password || '123456',
      withdrawalPassword: '123456',
      inviteCode: newUid,
      referredBy: 'ADMIN_DEMO',
      balance: initialBal,
      frozenBalance: 0,
      vipLevel: vip,
      status: 'active',
      isDemoAccount: true,
      workPermission: data.workPermission !== undefined ? data.workPermission : true,
      demoWalletAddress: walletAddr,
      wallet: {
        walletName: 'TRC-20 Demo Wallet',
        protocol: 'TRC-20',
        walletAddress: walletAddr,
        accountName: cleanUser,
        boundAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      },
      avatarUrl: '/assets/aistudio/a3.f53cf407_cf3e68d0.png',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      todayOrdersCount: 0,
      todayCommission: 0,
      completedTasksCount: 0,
      currentCycleTasks: 0,
      cycleNumber: 1,
      cycleApprovedByAdmin: true,
      comboOrderStep: 9, // Demo combo at #9, #14, #19, #24
      isVipAccount: false,
      isLockedAccount: false,
      customCombos: [],
    };

    setUsers((prev) => [demoUser, ...prev]);

    logAuditAction(
      'CREATE_DEMO_ACCOUNT',
      `Created Demo Account: ${cleanUser} (UID: ${newUid}) with ${initialBal} USDT balance and preset TRC-20 address ${walletAddr}`,
      newUid
    );

    return {
      success: true,
      message: `Demo Account "${cleanUser}" (UID: ${newUid}) created successfully!`,
      user: demoUser,
    };
  };

  const toggleUserWorkPermission = (userId: string) => {
    if (!hasPermission('can_manage_users')) {
      return { success: false, message: 'Permission denied: Cannot manage user work permissions.' };
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found.' };

    const nextPermission = target.workPermission !== true;
    const isRestartingCompletedCycle = nextPermission && (target.currentCycleTasks || 0) >= 25;
    const nextCycleNum = isRestartingCompletedCycle ? (target.cycleNumber || 1) + 1 : target.cycleNumber;

    const permissionUpdates: Partial<User> = isRestartingCompletedCycle
      ? {
          workPermission: true,
          cycleApprovedByAdmin: true,
          currentCycleTasks: 0,
          todayOrdersCount: 0,
          cycleNumber: nextCycleNum,
          cycleStartBalance: target.balance,
        }
      : {
          workPermission: nextPermission,
          cycleApprovedByAdmin: nextPermission ? true : target.cycleApprovedByAdmin,
        };

    syncUserUpdateToBackend(target.uid, permissionUpdates);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              ...permissionUpdates,
            }
          : u
      )
    );

    try {
      window.dispatchEvent(new CustomEvent('tradeweb_users_updated'));
    } catch {}

    logAuditAction(
      nextPermission ? 'GRANT_WORK_PERMISSION' : 'REVOKE_WORK_PERMISSION',
      `${nextPermission ? 'Granted' : 'Revoked'} Work Permission for user ${target.username} (UID: ${target.uid})`,
      target.uid
    );

    return {
      success: true,
      workPermission: nextPermission,
      message: `Work permission ${nextPermission ? 'GRANTED' : 'REVOKED'} for ${target.username} (UID: ${target.uid}).`,
    };
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
    setCurrentUserId(null);
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
        isAdminAuthenticated,
        adminLogin,
        adminLogout,
        navigateToAdmin,
        navigateToUser,
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
        recalculateUserBalanceFromDeposits,
        toggleUserStatus,
        resetUserPassword,
        generateInviteCode,
        generateBulkInviteCodes,
        toggleInviteCodeStatus,
        createSubAdmin,
        updateSubAdminPermissions,
        updateSubAdminPassword,
        updateSuperAdminSecurity,
        createDemoAccount,
        toggleUserWorkPermission,
        resetUserWallet,
        adminUpdateUserWallet,
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
