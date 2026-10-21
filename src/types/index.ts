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
  protocol: 'TRC-20';
  walletAddress: string;
  accountName: string;
  boundAt: string;
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
  completedTasksCount: number;
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

export interface WithdrawalRecord {
  id: string;
  userId: string;
  userUid: string;
  username: string;
  amount: number;
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
    | 'UPDATE_SYSTEM_WALLET';
  details: string;
  targetUserUid?: string;
  timestamp: string;
}

export interface SystemConfig {
  trc20DepositAddress: string;
  platformName: string;
  minDeposit: number;
  minWithdrawal: number;
  depositNotice: string;
}
