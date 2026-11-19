/**
 * ==============================================================================
 * SELF-CONTAINED LOCAL VPS DATABASE LAYER (SQLite via better-sqlite3)
 * File: ./data/worldexaglobal.db
 * - WAL mode enabled for concurrency and crash safety
 * - Auto-creates tables & indexes on startup
 * - Automatically imports legacy ./data/persistent_*.json and seeds initial pool
 * ==============================================================================
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

export const DATA_DIR = path.resolve(ROOT_DIR, 'data');
export const CHAT_UPLOADS_DIR = path.join(DATA_DIR, 'chat_uploads');

const resolvedDbPath = process.env.DB_PATH
  ? path.isAbsolute(process.env.DB_PATH)
    ? process.env.DB_PATH
    : path.resolve(ROOT_DIR, process.env.DB_PATH)
  : path.join(DATA_DIR, 'worldexaglobal.db');

export const DB_FILE_PATH = resolvedDbPath;

export const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const dbParent = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dbParent)) {
    fs.mkdirSync(dbParent, { recursive: true });
  }
};

export const ensureChatUploadsDir = () => {
  ensureDataDir();
  if (!fs.existsSync(CHAT_UPLOADS_DIR)) {
    fs.mkdirSync(CHAT_UPLOADS_DIR, { recursive: true });
  }
};

ensureDataDir();

const db = new Database(DB_FILE_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');

// Create relational schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY,
    id TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password TEXT NOT NULL,
    withdrawalPassword TEXT DEFAULT NULL,
    inviteCode TEXT NOT NULL,
    referredBy TEXT DEFAULT NULL,
    balance REAL NOT NULL DEFAULT 0.0,
    frozenBalance REAL NOT NULL DEFAULT 0.0,
    vipLevel INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    avatarUrl TEXT NOT NULL DEFAULT '/assets/aistudio/a3.f53cf407_cf3e68d0.png',
    walletJson TEXT DEFAULT NULL,
    taxPaid INTEGER NOT NULL DEFAULT 0,
    taxAmountPaid REAL NOT NULL DEFAULT 0,
    totalDeposit REAL NOT NULL DEFAULT 0.0,
    totalWithdrawal REAL NOT NULL DEFAULT 0.0,
    todayOrdersCount INTEGER NOT NULL DEFAULT 0,
    todayCompletedCount INTEGER NOT NULL DEFAULT 0,
    todayCommission REAL NOT NULL DEFAULT 0.0,
    yesterdayCommission REAL NOT NULL DEFAULT 0.0,
    lastActiveDate TEXT NOT NULL DEFAULT '',
    isVipAccount INTEGER NOT NULL DEFAULT 0,
    isLockedAccount INTEGER NOT NULL DEFAULT 0,
    workPermission INTEGER NOT NULL DEFAULT 0,
    completedTasksCount INTEGER NOT NULL DEFAULT 0,
    currentCycleTasks INTEGER NOT NULL DEFAULT 0,
    cycleNumber INTEGER NOT NULL DEFAULT 1,
    cycleApprovedByAdmin INTEGER NOT NULL DEFAULT 0,
    comboOrderStep INTEGER NOT NULL DEFAULT 14,
    cycleStartBalance REAL NOT NULL DEFAULT 30,
    customCombosJson TEXT NOT NULL DEFAULT '[]',
    isDemoAccount INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT DEFAULT '',
    updatedAt TEXT DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
  CREATE INDEX IF NOT EXISTS idx_users_invite ON users(inviteCode);

  CREATE TABLE IF NOT EXISTS deposits (
    id TEXT PRIMARY KEY,
    userId TEXT DEFAULT '',
    userUid TEXT NOT NULL,
    username TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USDT',
    protocol TEXT NOT NULL DEFAULT 'TRC-20',
    depositAddress TEXT DEFAULT '',
    txid TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    balanceCredited INTEGER NOT NULL DEFAULT 0,
    creditedAt TEXT DEFAULT NULL,
    createdAt TEXT DEFAULT '',
    reviewedAt TEXT DEFAULT NULL,
    reviewedBy TEXT DEFAULT NULL,
    rejectionReason TEXT DEFAULT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_deposits_userUid ON deposits(userUid);
  CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);

  CREATE TABLE IF NOT EXISTS orders (
    orderNo TEXT PRIMARY KEY,
    orderId TEXT NOT NULL,
    userUid TEXT NOT NULL,
    userId TEXT DEFAULT '',
    username TEXT DEFAULT '',
    platform TEXT NOT NULL DEFAULT 'Amazon',
    vipTier TEXT NOT NULL DEFAULT 'VIP 1',
    productTitle TEXT NOT NULL DEFAULT 'Matched Retail Order',
    orderAmount REAL NOT NULL DEFAULT 0,
    commission REAL NOT NULL DEFAULT 0,
    expectedIncome REAL NOT NULL DEFAULT 0,
    isComboOrder INTEGER NOT NULL DEFAULT 0,
    comboStepNumber INTEGER NOT NULL DEFAULT 0,
    requiredBalance REAL DEFAULT NULL,
    comboDepositPercent REAL DEFAULT NULL,
    comboCommissionPercent REAL DEFAULT NULL,
    requiredDepositDeficit REAL DEFAULT NULL,
    depositAddress TEXT DEFAULT NULL,
    itemsJson TEXT NOT NULL DEFAULT '[]',
    balanceBefore REAL DEFAULT NULL,
    balanceAfter REAL DEFAULT NULL,
    taskNumber INTEGER DEFAULT 0,
    cycleNumber INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'completed',
    createdAt TEXT DEFAULT '',
    completedAt TEXT DEFAULT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_orders_userUid ON orders(userUid);
  CREATE INDEX IF NOT EXISTS idx_orders_orderId ON orders(orderId);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

  CREATE TABLE IF NOT EXISTS combo_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    targetUserUid TEXT DEFAULT NULL,
    vipLevel INTEGER NOT NULL DEFAULT 1,
    cycleNumber INTEGER NOT NULL DEFAULT 1,
    slotIndex INTEGER DEFAULT NULL,
    stepNumber INTEGER NOT NULL,
    requiredPercent REAL NOT NULL,
    commissionPercent REAL NOT NULL,
    customOrderAmount REAL DEFAULT NULL,
    customDepositAmount REAL DEFAULT NULL,
    customCommissionAmount REAL DEFAULT NULL,
    isCustomOverride INTEGER DEFAULT NULL,
    isCustom INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_combo_rules_uid ON combo_rules(targetUserUid);

  CREATE TABLE IF NOT EXISTS withdrawals (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    username TEXT DEFAULT '',
    amount REAL NOT NULL,
    userBalanceAtRequest REAL NOT NULL,
    isHighBalanceTaxApplied INTEGER NOT NULL DEFAULT 0,
    taxPercent REAL NOT NULL DEFAULT 0,
    taxAmount REAL NOT NULL DEFAULT 0,
    netAmount REAL NOT NULL,
    walletAddress TEXT NOT NULL,
    protocol TEXT NOT NULL DEFAULT 'TRC-20',
    status TEXT NOT NULL DEFAULT 'pending',
    adminRemarks TEXT DEFAULT '',
    createdAt TEXT DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_withdrawals_userId ON withdrawals(userId);

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    userUid TEXT NOT NULL,
    username TEXT NOT NULL,
    sender TEXT NOT NULL,
    adminName TEXT DEFAULT 'Support Agent',
    text TEXT DEFAULT '',
    imageUrl TEXT DEFAULT NULL,
    imageName TEXT DEFAULT NULL,
    timestamp TEXT NOT NULL,
    readByAdmin INTEGER NOT NULL DEFAULT 0,
    readByUser INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_chat_messages_uid ON chat_messages(userUid);
  CREATE INDEX IF NOT EXISTS idx_chat_messages_ts ON chat_messages(timestamp);

  CREATE TABLE IF NOT EXISTS chat_uploads (
    filename TEXT PRIMARY KEY,
    mimeType TEXT NOT NULL,
    dataBase64 TEXT NOT NULL,
    createdAt TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS user_monitoring (
    userUid TEXT PRIMARY KEY,
    username TEXT DEFAULT '',
    lastActiveAt TEXT DEFAULT NULL,
    lastLoginAt TEXT DEFAULT NULL,
    lastIp TEXT DEFAULT NULL,
    locationCountry TEXT DEFAULT NULL,
    locationCity TEXT DEFAULT NULL,
    locationRegion TEXT DEFAULT NULL,
    lastCopiedTrc20At TEXT DEFAULT NULL,
    lastCopiedTrc20Address TEXT DEFAULT NULL,
    copyCount INTEGER NOT NULL DEFAULT 0,
    activePlatform TEXT DEFAULT NULL
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    valueJson TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`);

export const normalizeWallet = (w) => {
  if (w && typeof w.walletAddress === 'string' && w.walletAddress.trim().length > 0) {
    return w;
  }
  return null;
};

export const resolveEffectiveTodayCount = (u) => {
  const cycleTasks = typeof u?.currentCycleTasks === 'number' ? u.currentCycleTasks : 0;
  const rawToday =
    typeof u?.todayOrdersCount === 'number'
      ? u.todayOrdersCount
      : typeof u?.todayCompletedCount === 'number'
      ? u.todayCompletedCount
      : 0;
  if (cycleTasks > 0) {
    return Math.max(rawToday, cycleTasks);
  }
  return rawToday;
};

const safeJsonParse = (str, fallback) => {
  if (typeof str !== 'string' || !str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

const rowToUser = (row) => {
  if (!row) return null;
  const wallet = normalizeWallet(safeJsonParse(row.walletJson, null));
  const customCombos = safeJsonParse(row.customCombosJson, []);
  const user = {
    id: row.id || 'user_' + row.uid,
    uid: String(row.uid),
    username: row.username,
    password: row.password,
    withdrawalPassword: row.withdrawalPassword || null,
    inviteCode: row.inviteCode || String(row.uid),
    referredBy: row.referredBy || null,
    balance: Number(row.balance || 0),
    frozenBalance: Number(row.frozenBalance || 0),
    vipLevel: Number(row.vipLevel || 0),
    status: row.status || 'active',
    avatarUrl: row.avatarUrl || '/assets/aistudio/a3.f53cf407_cf3e68d0.png',
    wallet,
    taxPaid: row.taxPaid === 1,
    taxAmountPaid: Number(row.taxAmountPaid || 0),
    totalDeposit: typeof row.totalDeposit === 'number' ? row.totalDeposit : 0,
    totalWithdrawal: typeof row.totalWithdrawal === 'number' ? row.totalWithdrawal : 0,
    todayOrdersCount: Number(row.todayOrdersCount || 0),
    todayCompletedCount: Number(row.todayCompletedCount || 0),
    todayCommission: Number(row.todayCommission || 0),
    yesterdayCommission: Number(row.yesterdayCommission || 0),
    lastActiveDate: row.lastActiveDate || '',
    isVipAccount: row.isVipAccount === 1,
    isLockedAccount: row.isLockedAccount === 1,
    workPermission: row.workPermission === 1,
    completedTasksCount: Number(row.completedTasksCount || 0),
    currentCycleTasks: Number(row.currentCycleTasks || 0),
    cycleNumber: typeof row.cycleNumber === 'number' && row.cycleNumber >= 1 ? row.cycleNumber : 1,
    cycleApprovedByAdmin: row.cycleApprovedByAdmin === 1,
    comboOrderStep: Number(row.comboOrderStep || 14),
    cycleStartBalance: typeof row.cycleStartBalance === 'number' ? row.cycleStartBalance : 30,
    customCombos: Array.isArray(customCombos) ? customCombos : [],
    isDemoAccount: row.isDemoAccount === 1,
    createdAt: row.createdAt || '',
    updatedAt: row.updatedAt || '',
  };
  const effectiveToday = resolveEffectiveTodayCount(user);
  user.todayOrdersCount = effectiveToday;
  user.todayCompletedCount = effectiveToday;
  return user;
};

const userToParams = (u) => {
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const cleanUid = String(u.uid);
  const walletObj = normalizeWallet(u.wallet);
  const combosArr = Array.isArray(u.customCombos) ? u.customCombos : [];
  return {
    uid: cleanUid,
    id: u.id || 'user_' + cleanUid,
    username: String(u.username || '').trim(),
    password: String(u.password || 'password123'),
    withdrawalPassword: u.withdrawalPassword || null,
    inviteCode: String(u.inviteCode || cleanUid),
    referredBy: u.referredBy || null,
    balance: Number(u.balance || 0),
    frozenBalance: Number(u.frozenBalance || 0),
    vipLevel: Number(u.vipLevel || 0),
    status: u.status || 'active',
    avatarUrl: u.avatarUrl || '/assets/aistudio/a3.f53cf407_cf3e68d0.png',
    walletJson: walletObj ? JSON.stringify(walletObj) : null,
    taxPaid: u.taxPaid === true || u.taxPaid === 1 ? 1 : 0,
    taxAmountPaid: Number(u.taxAmountPaid || 0),
    totalDeposit:
      typeof u.totalDeposit === 'number'
        ? u.totalDeposit
        : Number(u.balance || 0) > 0
        ? Number(u.balance || 0)
        : 0,
    totalWithdrawal: Number(u.totalWithdrawal || 0),
    todayOrdersCount: Number(u.todayOrdersCount || 0),
    todayCompletedCount: Number(u.todayCompletedCount ?? u.todayOrdersCount ?? 0),
    todayCommission: Number(u.todayCommission || 0),
    yesterdayCommission: Number(u.yesterdayCommission || 0),
    lastActiveDate: String(u.lastActiveDate || ''),
    isVipAccount: u.isVipAccount === true || u.isVipAccount === 1 ? 1 : 0,
    isLockedAccount: u.isLockedAccount === true || u.isLockedAccount === 1 ? 1 : 0,
    workPermission: u.workPermission === true || u.workPermission === 1 ? 1 : 0,
    completedTasksCount: Number(u.completedTasksCount || 0),
    currentCycleTasks: Number(u.currentCycleTasks || 0),
    cycleNumber: typeof u.cycleNumber === 'number' && u.cycleNumber >= 1 ? u.cycleNumber : 1,
    cycleApprovedByAdmin: u.cycleApprovedByAdmin === true || u.cycleApprovedByAdmin === 1 ? 1 : 0,
    comboOrderStep: Number(u.comboOrderStep || 14),
    cycleStartBalance: typeof u.cycleStartBalance === 'number' ? u.cycleStartBalance : 30,
    customCombosJson: JSON.stringify(combosArr),
    isDemoAccount: u.isDemoAccount === true || u.isDemoAccount === 1 ? 1 : 0,
    createdAt: u.createdAt || nowStr,
    updatedAt: u.updatedAt || nowStr,
  };
};

const rowToDeposit = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId || '',
    userUid: String(row.userUid),
    username: row.username,
    amount: Number(row.amount || 0),
    currency: row.currency || 'USDT',
    protocol: row.protocol || 'TRC-20',
    depositAddress: row.depositAddress || '',
    txid: row.txid,
    status: row.status || 'pending',
    balanceCredited: row.balanceCredited === 1,
    creditedAt: row.creditedAt || undefined,
    createdAt: row.createdAt || '',
    reviewedAt: row.reviewedAt || undefined,
    reviewedBy: row.reviewedBy || undefined,
    rejectionReason: row.rejectionReason || undefined,
  };
};

const rowToOrder = (row) => {
  if (!row) return null;
  const items = safeJsonParse(row.itemsJson, []);
  return {
    id: row.orderId || row.orderNo,
    orderId: row.orderId,
    orderNo: String(row.orderNo),
    userUid: String(row.userUid),
    userId: row.userId || 'user_' + row.userUid,
    username: row.username || '',
    platform: row.platform || 'Amazon',
    vipTier: row.vipTier || 'VIP 1',
    productTitle: row.productTitle || 'Matched Retail Order',
    orderAmount: Number(row.orderAmount || 0),
    commission: Number(row.commission || 0),
    expectedIncome: Number(row.expectedIncome || 0),
    isComboOrder: row.isComboOrder === 1,
    comboStepNumber: Number(row.comboStepNumber || 0),
    requiredBalance: row.requiredBalance ?? undefined,
    comboDepositPercent: row.comboDepositPercent ?? undefined,
    comboCommissionPercent: row.comboCommissionPercent ?? undefined,
    requiredDepositDeficit: row.requiredDepositDeficit ?? undefined,
    depositAddress: row.depositAddress || undefined,
    items: Array.isArray(items) ? items : [],
    balanceBefore: row.balanceBefore ?? undefined,
    balanceAfter: row.balanceAfter ?? undefined,
    taskNumber: Number(row.taskNumber || 0),
    cycleNumber: Number(row.cycleNumber || 1),
    status: row.status || 'completed',
    createdAt: row.createdAt || '',
    completedAt: row.completedAt || undefined,
  };
};

const rowToChat = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userUid: String(row.userUid),
    username: row.username,
    sender: row.sender,
    adminName: row.adminName || undefined,
    text: row.text || '',
    imageUrl: row.imageUrl || undefined,
    imageName: row.imageName || undefined,
    timestamp: row.timestamp,
    readByAdmin: row.readByAdmin === 1,
    readByUser: row.readByUser === 1,
  };
};

const rowToMonitoring = (row) => {
  if (!row) return null;
  return {
    userUid: String(row.userUid),
    username: row.username || '',
    lastActiveAt: row.lastActiveAt || null,
    lastLoginAt: row.lastLoginAt || null,
    lastIp: row.lastIp || null,
    locationCountry: row.locationCountry || null,
    locationCity: row.locationCity || null,
    locationRegion: row.locationRegion || null,
    lastCopiedTrc20At: row.lastCopiedTrc20At || null,
    lastCopiedTrc20Address: row.lastCopiedTrc20Address || null,
    copyCount: Number(row.copyCount || 0),
    activePlatform: row.activePlatform || null,
  };
};

// Prepared statements
const stmtInsertIgnoreUser = db.prepare(`
  INSERT OR IGNORE INTO users (
    uid, id, username, password, withdrawalPassword, inviteCode, referredBy,
    balance, frozenBalance, vipLevel, status, avatarUrl, walletJson, taxPaid,
    taxAmountPaid, totalDeposit, totalWithdrawal, todayOrdersCount, todayCompletedCount,
    todayCommission, yesterdayCommission, lastActiveDate, isVipAccount, isLockedAccount,
    workPermission, completedTasksCount, currentCycleTasks, cycleNumber,
    cycleApprovedByAdmin, comboOrderStep, cycleStartBalance, customCombosJson,
    isDemoAccount, createdAt, updatedAt
  ) VALUES (
    @uid, @id, @username, @password, @withdrawalPassword, @inviteCode, @referredBy,
    @balance, @frozenBalance, @vipLevel, @status, @avatarUrl, @walletJson, @taxPaid,
    @taxAmountPaid, @totalDeposit, @totalWithdrawal, @todayOrdersCount, @todayCompletedCount,
    @todayCommission, @yesterdayCommission, @lastActiveDate, @isVipAccount, @isLockedAccount,
    @workPermission, @completedTasksCount, @currentCycleTasks, @cycleNumber,
    @cycleApprovedByAdmin, @comboOrderStep, @cycleStartBalance, @customCombosJson,
    @isDemoAccount, @createdAt, @updatedAt
  )
`);

const stmtUpsertUser = db.prepare(`
  INSERT INTO users (
    uid, id, username, password, withdrawalPassword, inviteCode, referredBy,
    balance, frozenBalance, vipLevel, status, avatarUrl, walletJson, taxPaid,
    taxAmountPaid, totalDeposit, totalWithdrawal, todayOrdersCount, todayCompletedCount,
    todayCommission, yesterdayCommission, lastActiveDate, isVipAccount, isLockedAccount,
    workPermission, completedTasksCount, currentCycleTasks, cycleNumber,
    cycleApprovedByAdmin, comboOrderStep, cycleStartBalance, customCombosJson,
    isDemoAccount, createdAt, updatedAt
  ) VALUES (
    @uid, @id, @username, @password, @withdrawalPassword, @inviteCode, @referredBy,
    @balance, @frozenBalance, @vipLevel, @status, @avatarUrl, @walletJson, @taxPaid,
    @taxAmountPaid, @totalDeposit, @totalWithdrawal, @todayOrdersCount, @todayCompletedCount,
    @todayCommission, @yesterdayCommission, @lastActiveDate, @isVipAccount, @isLockedAccount,
    @workPermission, @completedTasksCount, @currentCycleTasks, @cycleNumber,
    @cycleApprovedByAdmin, @comboOrderStep, @cycleStartBalance, @customCombosJson,
    @isDemoAccount, @createdAt, @updatedAt
  )
  ON CONFLICT(uid) DO UPDATE SET
    id = excluded.id,
    username = excluded.username,
    password = excluded.password,
    withdrawalPassword = excluded.withdrawalPassword,
    inviteCode = excluded.inviteCode,
    referredBy = excluded.referredBy,
    balance = excluded.balance,
    frozenBalance = excluded.frozenBalance,
    vipLevel = excluded.vipLevel,
    status = excluded.status,
    avatarUrl = excluded.avatarUrl,
    walletJson = excluded.walletJson,
    taxPaid = excluded.taxPaid,
    taxAmountPaid = excluded.taxAmountPaid,
    totalDeposit = excluded.totalDeposit,
    totalWithdrawal = excluded.totalWithdrawal,
    todayOrdersCount = excluded.todayOrdersCount,
    todayCompletedCount = excluded.todayCompletedCount,
    todayCommission = excluded.todayCommission,
    yesterdayCommission = excluded.yesterdayCommission,
    lastActiveDate = excluded.lastActiveDate,
    isVipAccount = excluded.isVipAccount,
    isLockedAccount = excluded.isLockedAccount,
    workPermission = excluded.workPermission,
    completedTasksCount = excluded.completedTasksCount,
    currentCycleTasks = excluded.currentCycleTasks,
    cycleNumber = excluded.cycleNumber,
    cycleApprovedByAdmin = excluded.cycleApprovedByAdmin,
    comboOrderStep = excluded.comboOrderStep,
    cycleStartBalance = excluded.cycleStartBalance,
    customCombosJson = excluded.customCombosJson,
    isDemoAccount = excluded.isDemoAccount,
    updatedAt = excluded.updatedAt
`);

const stmtInsertIgnoreDeposit = db.prepare(`
  INSERT OR IGNORE INTO deposits (
    id, userId, userUid, username, amount, currency, protocol, depositAddress,
    txid, status, balanceCredited, creditedAt, createdAt, reviewedAt, reviewedBy, rejectionReason
  ) VALUES (
    @id, @userId, @userUid, @username, @amount, @currency, @protocol, @depositAddress,
    @txid, @status, @balanceCredited, @creditedAt, @createdAt, @reviewedAt, @reviewedBy, @rejectionReason
  )
`);

const stmtUpsertDeposit = db.prepare(`
  INSERT INTO deposits (
    id, userId, userUid, username, amount, currency, protocol, depositAddress,
    txid, status, balanceCredited, creditedAt, createdAt, reviewedAt, reviewedBy, rejectionReason
  ) VALUES (
    @id, @userId, @userUid, @username, @amount, @currency, @protocol, @depositAddress,
    @txid, @status, @balanceCredited, @creditedAt, @createdAt, @reviewedAt, @reviewedBy, @rejectionReason
  )
  ON CONFLICT(id) DO UPDATE SET
    userId = excluded.userId,
    userUid = excluded.userUid,
    username = excluded.username,
    amount = excluded.amount,
    currency = excluded.currency,
    protocol = excluded.protocol,
    depositAddress = excluded.depositAddress,
    txid = excluded.txid,
    status = excluded.status,
    balanceCredited = excluded.balanceCredited,
    creditedAt = excluded.creditedAt,
    reviewedAt = excluded.reviewedAt,
    reviewedBy = excluded.reviewedBy,
    rejectionReason = excluded.rejectionReason
`);

const stmtUpsertOrder = db.prepare(`
  INSERT INTO orders (
    orderNo, orderId, userUid, userId, username, platform, vipTier, productTitle,
    orderAmount, commission, expectedIncome, isComboOrder, comboStepNumber,
    requiredBalance, comboDepositPercent, comboCommissionPercent, requiredDepositDeficit,
    depositAddress, itemsJson, balanceBefore, balanceAfter, taskNumber, cycleNumber,
    status, createdAt, completedAt
  ) VALUES (
    @orderNo, @orderId, @userUid, @userId, @username, @platform, @vipTier, @productTitle,
    @orderAmount, @commission, @expectedIncome, @isComboOrder, @comboStepNumber,
    @requiredBalance, @comboDepositPercent, @comboCommissionPercent, @requiredDepositDeficit,
    @depositAddress, @itemsJson, @balanceBefore, @balanceAfter, @taskNumber, @cycleNumber,
    @status, @createdAt, @completedAt
  )
  ON CONFLICT(orderNo) DO UPDATE SET
    orderId = excluded.orderId,
    userUid = excluded.userUid,
    userId = excluded.userId,
    username = excluded.username,
    platform = excluded.platform,
    vipTier = excluded.vipTier,
    productTitle = excluded.productTitle,
    orderAmount = excluded.orderAmount,
    commission = excluded.commission,
    expectedIncome = excluded.expectedIncome,
    isComboOrder = excluded.isComboOrder,
    comboStepNumber = excluded.comboStepNumber,
    requiredBalance = COALESCE(excluded.requiredBalance, orders.requiredBalance),
    comboDepositPercent = COALESCE(excluded.comboDepositPercent, orders.comboDepositPercent),
    comboCommissionPercent = COALESCE(excluded.comboCommissionPercent, orders.comboCommissionPercent),
    requiredDepositDeficit = COALESCE(excluded.requiredDepositDeficit, orders.requiredDepositDeficit),
    depositAddress = COALESCE(excluded.depositAddress, orders.depositAddress),
    itemsJson = CASE WHEN excluded.itemsJson != '[]' THEN excluded.itemsJson ELSE orders.itemsJson END,
    balanceBefore = COALESCE(excluded.balanceBefore, orders.balanceBefore),
    balanceAfter = COALESCE(excluded.balanceAfter, orders.balanceAfter),
    taskNumber = CASE WHEN excluded.taskNumber > 0 THEN excluded.taskNumber ELSE orders.taskNumber END,
    cycleNumber = COALESCE(excluded.cycleNumber, orders.cycleNumber),
    status = excluded.status,
    completedAt = COALESCE(excluded.completedAt, orders.completedAt)
`);

// Helper API exported to server.js
export const getAllUsers = () => {
  return db.prepare('SELECT * FROM users').all().map(rowToUser);
};

export const findUserByIdentifier = ({ uid, id, username } = {}) => {
  if (uid) {
    const row = db.prepare('SELECT * FROM users WHERE uid = ?').get(String(uid).trim());
    if (row) return rowToUser(row);
  }
  if (id) {
    const cleanId = String(id).trim();
    const row = db.prepare('SELECT * FROM users WHERE id = ? OR uid = ?').get(cleanId, cleanId);
    if (row) return rowToUser(row);
  }
  if (username) {
    const cleanUname = String(username).trim();
    const row = db.prepare('SELECT * FROM users WHERE lower(username) = lower(?)').get(cleanUname);
    if (row) return rowToUser(row);
  }
  return null;
};

export const findUserForLogin = (identifier) => {
  const clean = String(identifier || '').trim();
  if (!clean) return null;
  const row = db
    .prepare('SELECT * FROM users WHERE lower(username) = lower(?) OR uid = ?')
    .get(clean, clean);
  return rowToUser(row);
};

export const findMemberByInviteOrIdentity = (code) => {
  const clean = String(code || '').trim();
  if (!clean) return null;
  const row = db
    .prepare(
      `SELECT * FROM users
       WHERE status != 'frozen'
         AND (upper(inviteCode) = upper(?) OR upper(uid) = upper(?) OR upper(username) = upper(?))`
    )
    .get(clean, clean, clean);
  return rowToUser(row);
};

export const saveUser = (userObj) => {
  const params = userToParams(userObj);
  stmtUpsertUser.run(params);
  return findUserByIdentifier({ uid: params.uid });
};

export const updateUserFields = (identifier, updates = {}) => {
  const current = findUserByIdentifier(
    typeof identifier === 'string'
      ? { uid: identifier, id: identifier }
      : identifier
  );
  if (!current) return null;
  const merged = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };
  if ('wallet' in updates) {
    merged.wallet = normalizeWallet(updates.wallet);
  }
  return saveUser(merged);
};

export const getAllDeposits = () => {
  return db.prepare('SELECT * FROM deposits ORDER BY createdAt DESC').all().map(rowToDeposit);
};

export const getDepositById = (id) => {
  const row = db.prepare('SELECT * FROM deposits WHERE id = ?').get(String(id));
  return rowToDeposit(row);
};

export const upsertDeposit = (dep) => {
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
  stmtUpsertDeposit.run({
    id: String(dep.id),
    userId: dep.userId || '',
    userUid: String(dep.userUid || ''),
    username: String(dep.username || ''),
    amount: Number(dep.amount || 0),
    currency: dep.currency || 'USDT',
    protocol: dep.protocol || 'TRC-20',
    depositAddress: dep.depositAddress || '',
    txid: String(dep.txid || ''),
    status: dep.status || 'pending',
    balanceCredited: dep.balanceCredited ? 1 : 0,
    creditedAt: dep.creditedAt || null,
    createdAt: dep.createdAt || nowStr,
    reviewedAt: dep.reviewedAt || null,
    reviewedBy: dep.reviewedBy || null,
    rejectionReason: dep.rejectionReason || null,
  });
  return getDepositById(dep.id);
};

export const getOrders = (userUid = null) => {
  if (userUid) {
    return db
      .prepare('SELECT * FROM orders WHERE userUid = ? ORDER BY rowid DESC')
      .all(String(userUid))
      .map(rowToOrder);
  }
  return db.prepare('SELECT * FROM orders ORDER BY rowid DESC').all().map(rowToOrder);
};

export const findOrderByIdOrNo = ({ orderId, orderNo } = {}) => {
  if (orderNo) {
    const r = db.prepare('SELECT * FROM orders WHERE orderNo = ?').get(String(orderNo));
    if (r) return rowToOrder(r);
  }
  if (orderId) {
    const r = db.prepare('SELECT * FROM orders WHERE orderId = ?').get(String(orderId));
    if (r) return rowToOrder(r);
  }
  return null;
};

export const upsertOrder = (order) => {
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const ordNo = String(order.orderNo || order.orderNumber || 'ORD' + Date.now());
  const ordId = String(order.orderId || order.id || 'ord_' + Date.now());
  stmtUpsertOrder.run({
    orderNo: ordNo,
    orderId: ordId,
    userUid: String(order.userUid || order.userId || ''),
    userId: String(order.userId || ''),
    username: String(order.username || ''),
    platform: order.platform || 'Amazon',
    vipTier: order.vipTier || 'VIP 1',
    productTitle: order.productTitle || 'Matched Retail Order',
    orderAmount: Number(order.orderAmount ?? order.productPrice ?? 0),
    commission: Number(order.commission || 0),
    expectedIncome: Number(order.expectedIncome || 0),
    isComboOrder: order.isComboOrder || order.isCombo ? 1 : 0,
    comboStepNumber: Number(order.comboStepNumber ?? order.comboStep ?? 0),
    requiredBalance:
      typeof order.requiredBalance === 'number' ? order.requiredBalance : null,
    comboDepositPercent:
      typeof order.comboDepositPercent === 'number' ? order.comboDepositPercent : null,
    comboCommissionPercent:
      typeof order.comboCommissionPercent === 'number' ? order.comboCommissionPercent : null,
    requiredDepositDeficit:
      typeof order.requiredDepositDeficit === 'number' ? order.requiredDepositDeficit : null,
    depositAddress: order.depositAddress || null,
    itemsJson: JSON.stringify(Array.isArray(order.items) ? order.items : []),
    balanceBefore: typeof order.balanceBefore === 'number' ? order.balanceBefore : null,
    balanceAfter: typeof order.balanceAfter === 'number' ? order.balanceAfter : null,
    taskNumber: Number(order.taskNumber || 0),
    cycleNumber: Number(order.cycleNumber || 1),
    status: order.status || 'completed',
    createdAt: order.createdAt || nowStr,
    completedAt: order.completedAt || null,
  });
  return findOrderByIdOrNo({ orderNo: ordNo });
};

export const clearIncompleteOrdersForUser = (userUid, exceptOrderNo = null) => {
  if (exceptOrderNo) {
    db.prepare(
      "DELETE FROM orders WHERE userUid = ? AND status = 'incomplete' AND orderNo != ?"
    ).run(String(userUid), String(exceptOrderNo));
  } else {
    db.prepare("DELETE FROM orders WHERE userUid = ? AND status = 'incomplete'").run(
      String(userUid)
    );
  }
};

export const getComboRules = () => {
  return db
    .prepare('SELECT * FROM combo_rules ORDER BY stepNumber ASC')
    .all()
    .map((r) => ({
      id: r.id,
      targetUserUid: r.targetUserUid,
      vipLevel: r.vipLevel,
      cycleNumber: r.cycleNumber,
      slotIndex: r.slotIndex ?? undefined,
      stepNumber: r.stepNumber,
      requiredPercent: r.requiredPercent,
      commissionPercent: r.commissionPercent,
      customOrderAmount: r.customOrderAmount ?? undefined,
      customDepositAmount: r.customDepositAmount ?? undefined,
      customCommissionAmount: r.customCommissionAmount ?? undefined,
      isCustomOverride: r.isCustomOverride === null ? undefined : r.isCustomOverride === 1,
      isCustom: r.isCustom === 1,
      createdAt: r.createdAt,
    }));
};

export const replaceComboRulesForUser = (targetUserUid, customCombos) => {
  const tx = db.transaction((uid, combos) => {
    db.prepare('DELETE FROM combo_rules WHERE targetUserUid = ?').run(String(uid));
    const ins = db.prepare(`
      INSERT INTO combo_rules (
        targetUserUid, vipLevel, cycleNumber, slotIndex, stepNumber,
        requiredPercent, commissionPercent, customOrderAmount,
        customDepositAmount, customCommissionAmount, isCustomOverride, isCustom, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    for (const c of combos) {
      ins.run(
        String(uid),
        Number(c.vipLevel || 1),
        Number(c.cycleNumber || 1),
        typeof c.slotIndex === 'number' ? c.slotIndex : null,
        Number(c.stepNumber),
        Number(c.requiredPercent || 0),
        Number(c.commissionPercent || 0),
        typeof c.customOrderAmount === 'number' ? c.customOrderAmount : null,
        typeof c.customDepositAmount === 'number' ? c.customDepositAmount : null,
        typeof c.customCommissionAmount === 'number' ? c.customCommissionAmount : null,
        c.isCustomOverride !== false ? 1 : 0,
        1,
        nowStr
      );
    }
  });
  tx(targetUserUid, customCombos);
};

export const getWithdrawalsForUser = ({ uid, id, username }) => {
  return db
    .prepare(
      `SELECT * FROM withdrawals
       WHERE status != 'rejected'
         AND (userId = ? OR userId = ? OR lower(username) = lower(?))`
    )
    .all(String(uid || ''), String(id || ''), String(username || ''));
};

export const insertWithdrawalRecord = (rec) => {
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const wdId = String(rec.id || 'wd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
  db.prepare(`
    INSERT INTO withdrawals (
      id, userId, username, amount, userBalanceAtRequest, isHighBalanceTaxApplied,
      taxPercent, taxAmount, netAmount, walletAddress, protocol, status, adminRemarks, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    wdId,
    String(rec.userId),
    String(rec.username || ''),
    Number(rec.amount || 0),
    Number(rec.userBalanceAtRequest || 0),
    rec.isHighBalanceTaxApplied ? 1 : 0,
    Number(rec.taxPercent || 0),
    Number(rec.taxAmount || 0),
    Number(rec.netAmount || 0),
    String(rec.walletAddress || ''),
    String(rec.protocol || 'TRC-20'),
    String(rec.status || 'pending'),
    String(rec.adminRemarks || ''),
    rec.createdAt || nowStr
  );
  return db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(wdId);
};

export const getChatMessages = (filterUserUid = null) => {
  if (filterUserUid) {
    return db
      .prepare('SELECT * FROM chat_messages WHERE userUid = ? ORDER BY timestamp ASC')
      .all(String(filterUserUid))
      .map(rowToChat);
  }
  return db.prepare('SELECT * FROM chat_messages ORDER BY timestamp ASC').all().map(rowToChat);
};

export const findChatMessageById = (id) => {
  const r = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(String(id));
  return rowToChat(r);
};

export const insertChatMessage = (msg) => {
  db.prepare(`
    INSERT OR IGNORE INTO chat_messages (
      id, userUid, username, sender, adminName, text, imageUrl, imageName,
      timestamp, readByAdmin, readByUser
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    String(msg.id),
    String(msg.userUid),
    String(msg.username || ''),
    String(msg.sender),
    msg.adminName || null,
    msg.text || '',
    msg.imageUrl || null,
    msg.imageName || null,
    String(msg.timestamp),
    msg.readByAdmin ? 1 : 0,
    msg.readByUser ? 1 : 0
  );
  return findChatMessageById(msg.id);
};

export const markChatMessagesRead = (userUid, reader) => {
  if (reader === 'admin') {
    db.prepare(
      "UPDATE chat_messages SET readByAdmin = 1 WHERE userUid = ? AND sender = 'user' AND readByAdmin = 0"
    ).run(String(userUid));
  } else if (reader === 'user') {
    db.prepare(
      "UPDATE chat_messages SET readByUser = 1 WHERE userUid = ? AND sender = 'admin' AND readByUser = 0"
    ).run(String(userUid));
  }
};

export const saveChatUpload = ({ filename, mimeType, dataBase64 }) => {
  const nowStr = new Date().toISOString();
  db.prepare(`
    INSERT OR REPLACE INTO chat_uploads (filename, mimeType, dataBase64, createdAt)
    VALUES (?, ?, ?, ?)
  `).run(String(filename), String(mimeType), String(dataBase64), nowStr);
};

export const getChatUpload = (filename) => {
  return db.prepare('SELECT * FROM chat_uploads WHERE filename = ?').get(String(filename)) || null;
};

export const getAllMonitoringRecords = () => {
  return db.prepare('SELECT * FROM user_monitoring').all().map(rowToMonitoring);
};

export const getMonitoringRecordByUid = (userUid) => {
  const r = db.prepare('SELECT * FROM user_monitoring WHERE userUid = ?').get(String(userUid));
  return rowToMonitoring(r);
};

export const upsertMonitoringRow = (uid, patch = {}) => {
  const cleanUid = String(uid || '').trim();
  if (!cleanUid) return null;
  const current = getMonitoringRecordByUid(cleanUid) || { userUid: cleanUid };
  const merged = { ...current, ...patch, userUid: cleanUid };
  db.prepare(`
    INSERT INTO user_monitoring (
      userUid, username, lastActiveAt, lastLoginAt, lastIp, locationCountry,
      locationCity, locationRegion, lastCopiedTrc20At, lastCopiedTrc20Address,
      copyCount, activePlatform
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(userUid) DO UPDATE SET
      username = excluded.username,
      lastActiveAt = excluded.lastActiveAt,
      lastLoginAt = excluded.lastLoginAt,
      lastIp = excluded.lastIp,
      locationCountry = excluded.locationCountry,
      locationCity = excluded.locationCity,
      locationRegion = excluded.locationRegion,
      lastCopiedTrc20At = excluded.lastCopiedTrc20At,
      lastCopiedTrc20Address = excluded.lastCopiedTrc20Address,
      copyCount = excluded.copyCount,
      activePlatform = excluded.activePlatform
  `).run(
    cleanUid,
    merged.username || '',
    merged.lastActiveAt || null,
    merged.lastLoginAt || null,
    merged.lastIp || null,
    merged.locationCountry || null,
    merged.locationCity || null,
    merged.locationRegion || null,
    merged.lastCopiedTrc20At || null,
    merged.lastCopiedTrc20Address || null,
    typeof merged.copyCount === 'number' ? merged.copyCount : 0,
    merged.activePlatform || null
  );
  return getMonitoringRecordByUid(cleanUid);
};

export const runTransaction = (fn) => db.transaction(fn)();

/**
 * Bootstrap SQLite database with legacy JSON files (if present) + initial seed members/deposits.
 * Uses INSERT OR IGNORE so existing SQLite rows are NEVER overwritten.
 */
export const bootstrapDatabase = ({ seededMembers = [], seededDeposits = [] }) => {
  const readLegacyJson = (filename) => {
    try {
      const fullPath = path.join(DATA_DIR, filename);
      if (fs.existsSync(fullPath)) {
        const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (err) {
      console.warn(`SQLite migration note (${filename}):`, err.message);
    }
    return [];
  };

  const legacyUsers = readLegacyJson('persistent_users.json');
  const legacyDeposits = readLegacyJson('persistent_deposits.json');
  const legacyOrders = readLegacyJson('persistent_orders.json');
  const legacyChat = readLegacyJson('persistent_chat.json');
  const legacyMonitoring = readLegacyJson('persistent_monitoring.json');

  const tx = db.transaction(() => {
    for (const u of [...legacyUsers, ...seededMembers]) {
      if (u && u.uid && u.username) {
        stmtInsertIgnoreUser.run(userToParams(u));
      }
    }

    for (const d of [...legacyDeposits, ...seededDeposits]) {
      if (d && d.id) {
        stmtInsertIgnoreDeposit.run({
          id: String(d.id),
          userId: d.userId || '',
          userUid: String(d.userUid || ''),
          username: String(d.username || ''),
          amount: Number(d.amount || 0),
          currency: d.currency || 'USDT',
          protocol: d.protocol || 'TRC-20',
          depositAddress: d.depositAddress || '',
          txid: String(d.txid || ''),
          status: d.status || 'pending',
          balanceCredited: d.status === 'approved' || d.balanceCredited ? 1 : 0,
          creditedAt: d.creditedAt || null,
          createdAt: d.createdAt || '',
          reviewedAt: d.reviewedAt || null,
          reviewedBy: d.reviewedBy || null,
          rejectionReason: d.rejectionReason || null,
        });
      }
    }

    const existingOrderCount = db.prepare('SELECT COUNT(*) AS cnt FROM orders').get().cnt;
    if (existingOrderCount === 0) {
      for (const o of legacyOrders) {
        if (o && (o.orderNo || o.orderId)) {
          upsertOrder(o);
        }
      }
    }

    const existingChatCount = db.prepare('SELECT COUNT(*) AS cnt FROM chat_messages').get().cnt;
    if (existingChatCount === 0) {
      for (const m of legacyChat) {
        if (m && m.id && m.userUid) {
          insertChatMessage(m);
        }
      }
    }

    const existingMonCount = db.prepare('SELECT COUNT(*) AS cnt FROM user_monitoring').get().cnt;
    if (existingMonCount === 0) {
      for (const m of legacyMonitoring) {
        if (m && m.userUid) {
          upsertMonitoringRow(m.userUid, m);
        }
      }
    }
  });

  tx();
};

export default db;
