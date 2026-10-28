export type AdminPermission =
  | 'can_manage_users'
  | 'can_credit_debit'
  | 'can_approve_deposits'
  | 'can_approve_withdrawals'
  | 'can_generate_invites'
  | 'can_view_logs'
  | 'can_modify_wallet'
  | 'can_manage_admins';

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: 'super_admin' | 'sub_admin';
  permissions: AdminPermission[];
  createdAt: string;
  status: 'active' | 'disabled';
}

export interface UserWallet {
  walletName: string;
  protocol: 'TRC-20' | 'ERC-20' | 'BEP-20';
  walletAddress: string;
  accountName: string;
  boundAt: string;
}

// Fixed pool of 5 preset TRC-20 wallet addresses specifically for demo accounts
export const DEMO_TRC20_ADDRESS_POOL = [
  'TJ9r7z8X4kL1mN3pQ6vW9yB2aC5dE8fG1h',
  'TX8m2p9K5nL3qR7vS1tW4yC6bE8dF0gH2j',
  'TK3v8n1P7qL5mW9sR2tY4aB6cD8eF0gH3k',
  'TY7p1m4R9qL2nW6sV8tX3aC5bE7dF9gH4l',
  'TZ5n9q3S8rL6mV1tW7tY2aB4cD6eF8gH5m',
] as const;

export interface CustomComboRule {
  stepNumber: number;
  requiredPercent: number; // e.g. 36 means 36% of user's balance
  commissionPercent: number; // e.g. 20 means 20% of user's balance
}

export interface User {
  id: string;
  uid: string; // 6-digit number, e.g. "925886"
  username: string;
  password?: string;
  withdrawalPassword: string | null;
  inviteCode: string; // user's own invitation code
  referredBy: string | null; // code entered at registration
  balance: number; // USDT
  frozenBalance: number;
  vipLevel: number; // 0, 1, 2, 3
  status: 'active' | 'frozen';
  wallet: UserWallet | null;
  avatarUrl?: string;
  createdAt: string;
  todayOrdersCount: number;
  todayCommission: number;
  yesterdayCommission?: number;
  lastActiveDate?: string; // YYYY-MM-DD for midnight reset
  completedTasksCount: number;
  currentCycleTasks: number; // 0 to 25 tasks in current cycle
  cycleNumber: number; // work cycle index: 1, 2, ...
  cycleApprovedByAdmin: boolean; // locked when 25 tasks reached until admin approves
  comboOrderStep: number; // triggers special combo order at task 14 or 15
  isVipAccount?: boolean; // Admin VIP Account flag (triggers 5 combos or custom combos)
  isLockedAccount?: boolean; // Admin Locked Account flag (tasks run, withdrawal strictly blocked)
  customCombos?: CustomComboRule[]; // Custom combo rules configured by Admin
  taxPaid?: boolean; // Indicates if recurring 25% tax has been cleared for current withdrawal when balance >= 50,000 USDT
  taxAmountPaid?: number;
  workPermission?: boolean; // Admin granted work permission (new users locked until approved)
  isDemoAccount?: boolean; // Admin issued demo account
  demoWalletAddress?: string; // TRC-20 wallet assigned from Demo Pool
  cycleStartBalance?: number; // Starting balance when commencing the current work cycle (e.g. 30-40 USDT for Cycle #2)
}

export interface InviteCode {
  id: string;
  code: string;
  type: 'system' | 'user';
  createdBy: string; // Admin username or User UID
  creatorRole: 'super_admin' | 'sub_admin' | 'user';
  usageCount: number;
  maxUses: number | null; // null = unlimited
  status: 'active' | 'disabled';
  createdAt: string;
}

export interface DepositRecord {
  id: string;
  userId: string;
  userUid: string;
  username: string;
  amount: number;
  currency: 'USDT';
  protocol: 'TRC-20';
  depositAddress: string;
  txid: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface DepositNavigationParams {
  fromComboShortage?: boolean;
  shortfall?: number;
  comboStepNumber?: number;
  requiredAmount?: number;
}

export interface WithdrawalRecord {
  id: string;
  userId: string;
  userUid: string;
  username: string;
  amount: number; // Requested gross amount
  feePercent?: number; // 15% mandatory fee
  feeAmount?: number; // e.g. amount * 0.15
  netAmount?: number; // e.g. amount * 0.85 (actual payout)
  currency: 'USDT';
  protocol: 'TRC-20';
  walletAddress: string;
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface OrderProductItem {
  id: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  detailsLabel?: string;
}

export interface GrabbedOrder {
  id: string;
  orderNo: string;
  userId: string;
  vipTier: 'VIP 1' | 'VIP 2' | 'VIP 3';
  platform: 'Amazon' | 'Alibaba' | 'Aliexpress';
  items?: OrderProductItem[];
  productTitle: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  orderAmount: number;
  commissionRate: number; // e.g. 0.04
  commission: number;
  expectedIncome: number;
  status: 'incomplete' | 'completed';
  createdAt: string;
  completedAt?: string;
  isComboOrder?: boolean;
  comboStepNumber?: number; // e.g. 7, 8, 14, 15, 19, 23, 25
  requiredBalance?: number;
  comboDepositPercent?: number; // e.g. 36%, 55%, 267%
  comboCommissionPercent?: number; // e.g. 20%, 26%, 81%
  requiredDepositDeficit?: number; // Mandatory deposit deficit
  depositAddress?: string; // Stage-assigned TRC-20 deposit address (for combo deposits)
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminUsername: string;
  role: 'super_admin' | 'sub_admin';
  action:
    | 'APPROVE_DEPOSIT'
    | 'REJECT_DEPOSIT'
    | 'APPROVE_WITHDRAWAL'
    | 'REJECT_WITHDRAWAL'
    | 'CREDIT_BALANCE'
    | 'DEBIT_BALANCE'
    | 'FREEZE_USER'
    | 'UNFREEZE_USER'
    | 'RESET_PASSWORD'
    | 'CREATE_INVITE_CODE'
    | 'BULK_INVITE_CODES'
    | 'DISABLE_INVITE_CODE'
    | 'CREATE_SUBADMIN'
    | 'UPDATE_SUBADMIN'
    | 'RESET_TASK_CYCLE'
    | 'SET_VIP_STATUS'
    | 'TOGGLE_ACCOUNT_LOCK'
    | 'SET_CUSTOM_COMBOS'
    | 'CLEAR_USER_TAX'
    | 'UPDATE_SYSTEM_WALLET'
    | 'CREATE_DEMO_ACCOUNT'
    | 'GRANT_WORK_PERMISSION'
    | 'REVOKE_WORK_PERMISSION'
    | 'RESET_USER_WALLET'
    | 'UPDATE_USER_WALLET';
  details: string;
  targetUserUid?: string;
  timestamp: string;
}

export interface SystemConfig {
  trc20DepositAddress: string;
  trc20AddressPool?: string[];
  platformName: string;
  minDeposit: number;
  minWithdrawal: number;
  depositNotice: string;
}
