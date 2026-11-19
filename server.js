/**
 * ==============================================================================
 * FULL-STACK BACKEND SERVER (server.js)
 * Database: Self-contained Local SQLite VPS Database (./data/worldexaglobal.db)
 * Environment: dotenv (.env)
 * Web Framework: Express.js
 * ==============================================================================
 */

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import {
  DB_FILE_PATH,
  CHAT_UPLOADS_DIR,
  ensureChatUploadsDir,
  bootstrapDatabase,
  normalizeWallet,
  resolveEffectiveTodayCount,
  getAllUsers,
  findUserByIdentifier,
  findUserForLogin,
  findMemberByInviteOrIdentity,
  saveUser,
  updateUserFields,
  getAllDeposits,
  getDepositById,
  upsertDeposit,
  getOrders,
  findOrderByIdOrNo,
  upsertOrder,
  clearIncompleteOrdersForUser,
  getComboRules,
  replaceComboRulesForUser,
  getWithdrawalsForUser,
  insertWithdrawalRecord,
  getChatMessages,
  findChatMessageById,
  insertChatMessage,
  markChatMessagesRead,
  saveChatUpload,
  getChatUpload,
  getAllMonitoringRecords,
  getMonitoringRecordByUid,
  upsertMonitoringRow,
  runTransaction,
} from './db/sqlite.js';

// 1. Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Explicit CORS Middleware with Origin Reflection, Full Headers & 204 Preflight Handling
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token, Access-Control-Request-Method, Access-Control-Request-Headers'
  );
  res.setHeader(
    'Access-Control-Expose-Headers',
    'Content-Length, Content-Range, X-Content-Range, Authorization, x-admin-token'
  );

  // Return status 204 on preflight OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Fallback cors package handler
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'x-admin-token',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    optionsSuccessStatus: 204,
  })
);
app.options('*', (req, res) => res.status(204).end());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==============================================================================
// 2. INITIAL SEED DATA & LOCAL SQLITE DATABASE BOOTSTRAP
// ==============================================================================

const SEEDED_MEMBERS = [
  {
    id: 'user_jackal_232602',
    uid: '232602',
    username: 'Jackal',
    password: 'password123',
    withdrawalPassword: '654321',
    inviteCode: '232602',
    referredBy: 'SYS888',
    balance: 500.0,
    totalDeposit: 500.0,
    totalWithdrawal: 0.0,
    createdAt: '2026-05-01 10:00:00',
    vipLevel: 1,
    status: 'active',
    workPermission: true,
    cycleApprovedByAdmin: true,
  },
  { uid: '925886', username: 'Hanif8989', password: 'password123', inviteCode: '925886', referredBy: 'SYS888', balance: 479.31, totalDeposit: 450.0, totalWithdrawal: 0.0, vipLevel: 1, status: 'active', workPermission: true, cycleApprovedByAdmin: true },
  { uid: '771101', username: 'Karim_88', password: 'password123', inviteCode: '771101', referredBy: '925886', balance: 150.0, totalDeposit: 250.0, totalWithdrawal: 100.0, createdAt: '2026-05-12 10:00:00', vipLevel: 0, status: 'active', workPermission: false },
  { uid: '771102', username: 'Rafiq_21', password: 'password123', inviteCode: '771102', referredBy: '925886', balance: 300.0, totalDeposit: 500.0, totalWithdrawal: 200.0, createdAt: '2026-05-20 11:30:00', vipLevel: 0, status: 'active', workPermission: false },
  { uid: '771105', username: 'Sumon_77', password: 'password123', inviteCode: '771105', referredBy: '925886', balance: 0.0, totalDeposit: 0.0, totalWithdrawal: 0.0, createdAt: '2026-06-02 09:15:00', vipLevel: 0, status: 'active', workPermission: false },
  { uid: '771103', username: 'Nasrin_09', password: 'password123', inviteCode: '771103', referredBy: '771101', balance: 80.0, totalDeposit: 120.0, totalWithdrawal: 40.0, createdAt: '2026-05-18 14:00:00', vipLevel: 0, status: 'active', workPermission: false },
  { uid: '771104', username: 'Jahid_55', password: 'password123', inviteCode: '771104', referredBy: '771101', balance: 150.0, totalDeposit: 300.0, totalWithdrawal: 150.0, createdAt: '2026-05-25 16:45:00', vipLevel: 0, status: 'active', workPermission: false },
  { uid: '771106', username: 'Mitu_43', password: 'password123', inviteCode: '771106', referredBy: '771102', balance: 80.0, totalDeposit: 80.0, totalWithdrawal: 0.0, createdAt: '2026-06-10 12:10:00', vipLevel: 0, status: 'active', workPermission: false },
  { uid: '771107', username: 'Rakib_16', password: 'password123', inviteCode: '771107', referredBy: '771103', balance: 40.0, totalDeposit: 60.0, totalWithdrawal: 20.0, createdAt: '2026-06-05 13:20:00', vipLevel: 0, status: 'active', workPermission: false },
  { uid: '771108', username: 'Shanta_30', password: 'password123', inviteCode: '771108', referredBy: '771104', balance: 0.0, totalDeposit: 0.0, totalWithdrawal: 0.0, createdAt: '2026-06-15 15:30:00', vipLevel: 0, status: 'active', workPermission: false },
  { uid: '819203', username: 'VIP_Trader25', password: 'password123', inviteCode: '819203', referredBy: 'SYS888', balance: 550.0, totalDeposit: 550.0, totalWithdrawal: 0.0, vipLevel: 2, status: 'active', workPermission: false },
  { uid: '772109', username: 'Newbie_VIP0', password: 'password123', inviteCode: '772109', referredBy: 'SYS100', balance: 0.0, totalDeposit: 0.0, totalWithdrawal: 0.0, vipLevel: 0, status: 'active', workPermission: false },
  { uid: '381942', username: 'Cycle2_Trader', password: 'password123', inviteCode: '381942', referredBy: 'SYS888', balance: 35.0, totalDeposit: 35.0, totalWithdrawal: 0.0, vipLevel: 1, status: 'active', workPermission: true, cycleApprovedByAdmin: true },
  { uid: '888001', username: 'Demo_Trader', password: 'password123', inviteCode: '888001', referredBy: 'ADMIN_DEMO', balance: 300.0, totalDeposit: 300.0, totalWithdrawal: 0.0, vipLevel: 1, status: 'active', workPermission: true, cycleApprovedByAdmin: true },
  { uid: '998811', username: 'Whale_Investor50k', password: 'password123', inviteCode: '998811', referredBy: 'SYS888', balance: 58500.0, totalDeposit: 58500.0, totalWithdrawal: 0.0, vipLevel: 3, status: 'active', workPermission: true, cycleApprovedByAdmin: true },
];

const SEEDED_DEPOSITS = [
  {
    id: 'dep_101',
    userId: 'user_1',
    userUid: '925886',
    username: 'Hanif8989',
    amount: 100.0,
    currency: 'USDT',
    protocol: 'TRC-20',
    depositAddress: 'TC14p55R17Neg8Qmom6dj1GmaK1vo2Mpg5',
    txid: 'f8d3b4e6a1c872990deab5512b9308cc4b1f618a5996611f7c0062bca90823c1',
    status: 'approved',
    createdAt: '2026-02-11 10:20:15',
    reviewedAt: '2026-02-11 10:24:00',
    reviewedBy: 'sub_finance',
  },
  {
    id: 'dep_102',
    userId: 'user_1',
    userUid: '925886',
    username: 'Hanif8989',
    amount: 350.0,
    currency: 'USDT',
    protocol: 'TRC-20',
    depositAddress: 'TC14p55R17Neg8Qmom6dj1GmaK1vo2Mpg5',
    txid: '2c5e7b899a01fd45a6c0e812d431f0ba679b32e185f29910a34bcf921d78ea94',
    status: 'approved',
    createdAt: '2026-02-12 14:05:30',
    reviewedAt: '2026-02-12 14:09:12',
    reviewedBy: 'admin',
  },
  {
    id: 'dep_103',
    userId: 'user_2',
    userUid: '418290',
    username: 'Elena_Crypto',
    amount: 950.0,
    currency: 'USDT',
    protocol: 'TRC-20',
    depositAddress: 'TC14p55R17Neg8Qmom6dj1GmaK1vo2Mpg5',
    txid: '99a4c11876b5de3301fae2984bb3009712cf5a6d9018e47265ba189cd2007f31',
    status: 'approved',
    createdAt: '2026-02-14 11:45:00',
    reviewedAt: '2026-02-14 11:48:30',
    reviewedBy: 'sub_finance',
  },
  {
    id: 'dep_104',
    userId: 'user_1',
    userUid: '925886',
    username: 'Hanif8989',
    amount: 200.0,
    currency: 'USDT',
    protocol: 'TRC-20',
    depositAddress: 'TC14p55R17Neg8Qmom6dj1GmaK1vo2Mpg5',
    txid: 'e49987aa12c09d5600b39f1165aae044199c80dfa3172089ba85cd55419077de',
    status: 'pending',
    createdAt: '2026-02-21 02:45:10',
  },
  {
    id: 'dep_105',
    userId: 'user_4',
    userUid: '772109',
    username: 'Newbie_VIP0',
    amount: 50.0,
    currency: 'USDT',
    protocol: 'TRC-20',
    depositAddress: 'TC14p55R17Neg8Qmom6dj1GmaK1vo2Mpg5',
    txid: '71acdd99201f9450abce614399b1a0942e48fa1119572630048ba8123dfac095',
    status: 'pending',
    createdAt: '2026-02-21 03:10:44',
  },
  {
    id: 'dep_106',
    userId: 'user_3',
    userUid: '637184',
    username: 'Marcus_T',
    amount: 320.0,
    currency: 'USDT',
    protocol: 'TRC-20',
    depositAddress: 'TC14p55R17Neg8Qmom6dj1GmaK1vo2Mpg5',
    txid: '3c89f1a0e1b23908ac447e9112b0561aa4f58c70129bcfe34591028374a6b291',
    status: 'approved',
    createdAt: '2026-02-16 16:30:00',
    reviewedAt: '2026-02-16 16:35:00',
    reviewedBy: 'sub_finance',
  },
  {
    id: 'dep_107',
    userId: 'user_l2_1',
    userUid: '529104',
    username: 'Lucas_Defi',
    amount: 640.0,
    currency: 'USDT',
    protocol: 'TRC-20',
    depositAddress: 'TC14p55R17Neg8Qmom6dj1GmaK1vo2Mpg5',
    txid: '5d1209e84b76a01298c4fe713a2908f51cb7e40918a2456bc9013847291a084c',
    status: 'approved',
    createdAt: '2026-02-17 15:30:00',
    reviewedAt: '2026-02-17 15:35:00',
    reviewedBy: 'admin',
  },
  {
    id: 'dep_108',
    userId: 'user_l2_2',
    userUid: '738192',
    username: 'Amina_K',
    amount: 180.0,
    currency: 'USDT',
    protocol: 'TRC-20',
    depositAddress: 'TC14p55R17Neg8Qmom6dj1GmaK1vo2Mpg5',
    txid: '7e2319f09a87b1234c56e78901f23456789a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    status: 'approved',
    createdAt: '2026-02-18 10:45:00',
    reviewedAt: '2026-02-18 10:50:00',
    reviewedBy: 'sub_finance',
  },
  {
    id: 'dep_109',
    userId: 'user_l3_1',
    userUid: '849201',
    username: 'David_Pro',
    amount: 250.0,
    currency: 'USDT',
    protocol: 'TRC-20',
    depositAddress: 'TC14p55R17Neg8Qmom6dj1GmaK1vo2Mpg5',
    txid: '9f3420a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9',
    status: 'approved',
    createdAt: '2026-02-19 17:30:00',
    reviewedAt: '2026-02-19 17:34:00',
    reviewedBy: 'admin',
  },
];

bootstrapDatabase({
  seededMembers: SEEDED_MEMBERS,
  seededDeposits: SEEDED_DEPOSITS,
});
console.log(`Local SQLite VPS Database initialized: ${DB_FILE_PATH}`);

// ==============================================================================
// 3. REAL-TIME CHAT & MONITORING WEBSOCKET INFRASTRUCTURE
// ==============================================================================

const chatClients = new Set();

const broadcastChatEvent = (payload, targetUserUid) => {
  const serialized = JSON.stringify(payload);
  chatClients.forEach((client) => {
    try {
      if (client.readyState !== 1) return;
      if (
        client.role === 'admin' ||
        (targetUserUid && String(client.userUid) === String(targetUserUid))
      ) {
        client.send(serialized);
      }
    } catch {}
  });
};

const monitorAdminClients = new Set();
const monitorUserSockets = new Map(); // userUid -> Set<WebSocket>
const ipGeoCache = new Map(); // ip -> { country, city, region, cachedAt }

const isPrivateOrLocalIp = (ip) => {
  if (!ip) return true;
  const clean = String(ip).trim();
  if (
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean === 'localhost' ||
    clean.startsWith('10.') ||
    clean.startsWith('192.168.') ||
    clean.startsWith('fc') ||
    clean.startsWith('fd') ||
    clean.startsWith('fe80')
  ) {
    return true;
  }
  const m = clean.match(/^172\.(\d+)\./);
  if (m) {
    const second = Number(m[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
};

const extractClientIp = (req) => {
  const fwd = req?.headers?.['x-forwarded-for'];
  let ip = '';
  if (typeof fwd === 'string' && fwd.trim()) {
    ip = fwd.split(',')[0].trim();
  } else if (Array.isArray(fwd) && fwd.length > 0) {
    ip = String(fwd[0]).split(',')[0].trim();
  } else if (typeof req?.headers?.['x-real-ip'] === 'string') {
    ip = req.headers['x-real-ip'].trim();
  } else if (req?.socket?.remoteAddress) {
    ip = String(req.socket.remoteAddress).trim();
  }
  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }
  return ip || null;
};

const lookupIpGeo = async (ip) => {
  if (!ip || isPrivateOrLocalIp(ip)) return null;
  const cached = ipGeoCache.get(ip);
  if (cached && Date.now() - cached.cachedAt < 24 * 60 * 60 * 1000) {
    return cached;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data && data.success !== false && (data.country || data.city)) {
      const geo = {
        country: data.country || null,
        city: data.city || null,
        region: data.region || null,
        cachedAt: Date.now(),
      };
      ipGeoCache.set(ip, geo);
      return geo;
    }
  } catch {
    // Non-blocking lookup
  }
  return null;
};

const buildNormalizedMonitoringRecord = (uid, base = {}, userMap = null) => {
  const cleanUid = String(uid);
  const userObj = userMap ? userMap.get(cleanUid) : findUserByIdentifier({ uid: cleanUid });
  const sockets = monitorUserSockets.get(cleanUid);
  const isOnline = Boolean(sockets && sockets.size > 0);
  return {
    userUid: cleanUid,
    username: base.username || userObj?.username || `User_${cleanUid}`,
    isOnline,
    lastActiveAt: base.lastActiveAt || null,
    lastLoginAt: base.lastLoginAt || null,
    lastIp: base.lastIp || null,
    locationCountry: base.locationCountry || null,
    locationCity: base.locationCity || null,
    locationRegion: base.locationRegion || null,
    lastCopiedTrc20At: base.lastCopiedTrc20At || null,
    lastCopiedTrc20Address: base.lastCopiedTrc20Address || null,
    copyCount: typeof base.copyCount === 'number' ? base.copyCount : 0,
    activePlatform: base.activePlatform || null,
  };
};

const broadcastMonitorEvent = (payload) => {
  const serialized = JSON.stringify(payload);
  monitorAdminClients.forEach((client) => {
    try {
      if (client.readyState === 1) {
        client.send(serialized);
      }
    } catch {}
  });
};

const upsertMonitoringRecord = (uid, patch = {}) => {
  const saved = upsertMonitoringRow(uid, patch);
  if (!saved) return null;
  const normalized = buildNormalizedMonitoringRecord(saved.userUid, saved);
  broadcastMonitorEvent({ type: 'monitor:update', record: normalized });
  return normalized;
};

const getMergedMonitoringRecords = () => {
  const users = getAllUsers();
  const userMap = new Map(users.map((u) => [String(u.uid), u]));
  const map = new Map();

  users.forEach((u) => {
    if (u?.uid) {
      map.set(
        String(u.uid),
        buildNormalizedMonitoringRecord(u.uid, { username: u.username }, userMap)
      );
    }
  });

  getAllMonitoringRecords().forEach((m) => {
    if (m?.userUid) {
      const uid = String(m.userUid);
      const prev = map.get(uid) || {};
      map.set(uid, buildNormalizedMonitoringRecord(uid, { ...prev, ...m }, userMap));
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    return String(b.lastActiveAt || '').localeCompare(String(a.lastActiveAt || ''));
  });
};

// ==============================================================================
// 4. REST API ROUTES
// ==============================================================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend server is running',
    database: {
      connected: true,
      engine: 'sqlite',
      state: 'connected',
      path: './data/worldexaglobal.db',
    },
  });
});

/**
 * POST /api/auth/register
 * Register a new user with strict invite code validation, 6-digit numeric UID, and local SQLite persistence
 */
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, inviteCode } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: 'Username is required.' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });
    }
    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({ success: false, message: 'Invitation code is required to register.' });
    }

    const cleanUser = username.trim();
    const cleanCode = inviteCode.trim().toUpperCase();

    const existingUser = findUserByIdentifier({ username: cleanUser });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This username is already taken.' });
    }

    const SYSTEM_CODES = ['SYS888', 'SYS100', 'TRADEVIP', 'ALPHA99', 'VELORA888'];
    const isSystemCode = SYSTEM_CODES.includes(cleanCode);

    let matchingMember = null;
    if (!isSystemCode) {
      matchingMember = findMemberByInviteOrIdentity(cleanCode);
    }

    const isSixDigitUserCode = /^\d{6}$/.test(cleanCode);

    if (!isSystemCode && !matchingMember && !isSixDigitUserCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Invitation Code. Please enter an active referral code provided by an admin or existing member.',
      });
    }

    const canonicalReferredBy = matchingMember ? (matchingMember.inviteCode || matchingMember.uid) : cleanCode;

    let uidCandidate = req.body.uid
      ? String(req.body.uid).trim()
      : Math.floor(100000 + Math.random() * 900000).toString();
    const existingUids = new Set(getAllUsers().map((u) => String(u.uid)));
    while (existingUids.has(uidCandidate)) {
      uidCandidate = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const newCreatedUser = {
      id: req.body.id || ('user_' + Date.now()),
      uid: uidCandidate,
      username: cleanUser,
      password,
      withdrawalPassword: null,
      inviteCode: uidCandidate,
      referredBy: canonicalReferredBy,
      balance: 0.0,
      frozenBalance: 0,
      totalDeposit: 0.0,
      totalWithdrawal: 0.0,
      vipLevel: 0,
      status: 'active',
      avatarUrl: '/assets/aistudio/a3.f53cf407_cf3e68d0.png',
      wallet: null,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      todayOrdersCount: 0,
      todayCompletedCount: 0,
      todayCommission: 0,
      yesterdayCommission: 0,
      lastActiveDate: new Date().toISOString().substring(0, 10),
      completedTasksCount: 0,
      currentCycleTasks: 0,
      cycleNumber: 1,
      cycleApprovedByAdmin: false,
      comboOrderStep: 14,
      isVipAccount: false,
      isLockedAccount: false,
      customCombos: [],
      workPermission: false,
      isDemoAccount: false,
    };

    const persisted = saveUser(newCreatedUser);

    return res.status(201).json({
      success: true,
      message: `Registration successful! Your UID is ${uidCandidate}`,
      user: persisted,
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

/**
 * GET /api/invites/validate/:code
 * Verify that an invitation code matches an active system code or member in SQLite
 */
app.get('/api/invites/validate/:code', (req, res) => {
  try {
    const rawCode = (req.params.code || '').trim().toUpperCase();
    if (!rawCode) {
      return res.status(400).json({ valid: false, message: 'Invite code is required.' });
    }

    const SYSTEM_CODES = ['SYS888', 'SYS100', 'TRADEVIP', 'ALPHA99', 'VELORA888'];
    if (SYSTEM_CODES.includes(rawCode)) {
      return res.json({ valid: true, type: 'system', code: rawCode });
    }

    const member = findMemberByInviteOrIdentity(rawCode);
    if (member) {
      return res.json({
        valid: true,
        type: 'member',
        inviter: {
          username: member.username,
          uid: member.uid,
          inviteCode: member.inviteCode,
        },
      });
    }

    if (/^\d{6}$/.test(rawCode)) {
      return res.json({
        valid: true,
        type: 'member',
        code: rawCode,
      });
    }

    return res.status(404).json({
      valid: false,
      message: 'Invalid Invitation Code. Please enter an active referral code provided by an admin or existing member.',
    });
  } catch (error) {
    return res.status(500).json({ valid: false, message: 'Server error checking invite code.' });
  }
});

/**
 * GET /api/users
 * Returns list of all registered users from local SQLite database
 */
app.get('/api/users', (req, res) => {
  try {
    const safeUsers = getAllUsers().map((u) => {
      const effectiveToday = resolveEffectiveTodayCount(u);
      return {
        ...u,
        id: u.id || ('user_' + u.uid),
        wallet: normalizeWallet(u.wallet),
        withdrawalPassword: u.withdrawalPassword || null,
        totalDeposit: typeof u.totalDeposit === 'number' ? u.totalDeposit : (u.balance > 0 ? u.balance : 0),
        totalWithdrawal: typeof u.totalWithdrawal === 'number' ? u.totalWithdrawal : 0,
        todayOrdersCount: effectiveToday,
        todayCompletedCount: effectiveToday,
        todayCommission: typeof u.todayCommission === 'number' ? u.todayCommission : 0,
        yesterdayCommission: typeof u.yesterdayCommission === 'number' ? u.yesterdayCommission : 0,
        lastActiveDate: u.lastActiveDate || '',
        cycleNumber: typeof u.cycleNumber === 'number' && u.cycleNumber >= 1 ? u.cycleNumber : 1,
        currentCycleTasks: typeof u.currentCycleTasks === 'number' ? u.currentCycleTasks : 0,
        completedTasksCount: typeof u.completedTasksCount === 'number' ? u.completedTasksCount : 0,
        comboOrderStep: u.comboOrderStep || 14,
        isVipAccount: u.isVipAccount === true,
        isLockedAccount: u.isLockedAccount === true,
        customCombos: Array.isArray(u.customCombos) ? u.customCombos : [],
        workPermission: u.workPermission === true,
        cycleApprovedByAdmin: u.cycleApprovedByAdmin === true,
      };
    });

    return res.json({ success: true, users: safeUsers });
  } catch (err) {
    console.error('Error fetching users:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to load users.' });
  }
});

/**
 * POST /api/users/sync
 * Sync users created on client into local SQLite database
 */
app.post('/api/users/sync', (req, res) => {
  try {
    const { users: clientUsers, user: clientUser } = req.body;

    runTransaction(() => {
      if (clientUser && clientUser.uid) {
        const existing = findUserByIdentifier({ uid: clientUser.uid });
        saveUser(existing ? { ...existing, ...clientUser } : clientUser);
      }

      if (Array.isArray(clientUsers)) {
        clientUsers.forEach((cu) => {
          if (!cu || !cu.uid || !cu.username) return;
          const existing = findUserByIdentifier({ uid: cu.uid });
          saveUser(existing ? { ...existing, ...cu } : cu);
        });
      }
    });

    const safeUsers = getAllUsers();
    return res.json({ success: true, users: safeUsers });
  } catch (err) {
    console.error('User sync error:', err.message);
    return res.status(500).json({ success: false, message: 'Sync failed' });
  }
});

/**
 * POST /api/users/update
 * Update user fields in local SQLite database
 */
app.post('/api/users/update', (req, res) => {
  try {
    const { uid, id, updates } = req.body;
    if (!uid && !id) {
      return res.status(400).json({ success: false, message: 'UID or ID is required.' });
    }

    const updated = updateUserFields({ uid, id }, updates || {});
    return res.json({
      success: true,
      user: updated ? { ...updated, wallet: normalizeWallet(updated.wallet) } : null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

/**
 * GET /api/deposits
 * Returns list of all deposit vouchers from local SQLite database
 */
app.get('/api/deposits', (req, res) => {
  try {
    const depositsList = getAllDeposits();
    return res.json({ success: true, deposits: depositsList });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load deposits' });
  }
});

/**
 * POST /api/deposits/submit
 * Submit a new deposit voucher into local SQLite database
 */
app.post('/api/deposits/submit', (req, res) => {
  try {
    const { deposit } = req.body;
    if (!deposit || !deposit.id) {
      return res.status(400).json({ success: false, message: 'Deposit record is required.' });
    }

    const existing = getDepositById(deposit.id);
    const normalizedDeposit = {
      ...(existing || {}),
      ...deposit,
      id: String(deposit.id),
      userUid: String(deposit.userUid || ''),
      amount: Number(deposit.amount || 0),
      txid:
        deposit.txid && String(deposit.txid).trim().length > 0
          ? String(deposit.txid).trim()
          : 'tx_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
      status: deposit.status || 'pending',
      balanceCredited: deposit.status === 'approved' ? Boolean(deposit.balanceCredited) : false,
    };

    const saved = upsertDeposit(normalizedDeposit);
    return res.json({ success: true, deposit: saved });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to submit deposit: ' + err.message });
  }
});

// In-flight lock set keyed strictly by unique depositId
const IN_FLIGHT_DEPOSIT_APPROVALS = new Set();

/**
 * POST /api/deposits/approve
 * Approves a deposit atomically in SQLite, marking deposit approved & incrementing user balance ONCE.
 */
app.post('/api/deposits/approve', (req, res) => {
  const { depositId, amount, userUid, userId, username, adminUsername, txid, depositAddress } = req.body || {};
  if (!depositId) {
    return res.status(400).json({ success: false, message: 'Deposit ID is required.' });
  }

  if (IN_FLIGHT_DEPOSIT_APPROVALS.has(depositId)) {
    return res.status(409).json({
      success: false,
      message: 'Deposit approval is currently in progress. Please wait.',
    });
  }

  IN_FLIGHT_DEPOSIT_APPROVALS.add(depositId);

  try {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const reviewer = adminUsername || 'admin';

    const result = runTransaction(() => {
      const targetDeposit = getDepositById(depositId);
      const effectiveUserUid = String(userUid || targetDeposit?.userUid || '');
      const effectiveUserId = String(userId || targetDeposit?.userId || '');
      const effectiveUsername = username || targetDeposit?.username || '';

      if (targetDeposit && targetDeposit.status === 'approved') {
        const existingUser = findUserByIdentifier({
          uid: effectiveUserUid,
          id: effectiveUserId,
          username: effectiveUsername,
        });
        return {
          httpStatus: 200,
          body: {
            success: true,
            alreadyApproved: true,
            message: `Deposit ${depositId} has already been approved. Balance was not incremented again.`,
            deposit: targetDeposit,
            user: existingUser,
          },
        };
      }

      if (targetDeposit && targetDeposit.status === 'rejected') {
        return {
          httpStatus: 400,
          body: {
            success: false,
            message: `Deposit ${depositId} was already rejected.`,
          },
        };
      }

      const parsedAmount = Number(Number(amount ?? targetDeposit?.amount ?? 0).toFixed(4));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return {
          httpStatus: 400,
          body: {
            success: false,
            message: 'Valid positive deposit amount is required.',
          },
        };
      }

      const targetUser = findUserByIdentifier({
        uid: effectiveUserUid,
        id: effectiveUserId,
        username: effectiveUsername,
      });

      if (!targetUser) {
        return {
          httpStatus: 404,
          body: {
            success: false,
            message: 'Target user not found. Deposit remains pending and was not approved.',
          },
        };
      }

      const savedDeposit = upsertDeposit({
        ...(targetDeposit || {}),
        id: depositId,
        userId: targetUser.id || effectiveUserId || '',
        userUid: String(targetUser.uid),
        username: targetUser.username || effectiveUsername,
        amount: parsedAmount,
        currency: targetDeposit?.currency || 'USDT',
        protocol: targetDeposit?.protocol || 'TRC-20',
        depositAddress: depositAddress || targetDeposit?.depositAddress || '',
        txid: txid || targetDeposit?.txid || ('tx_approved_' + Date.now()),
        status: 'approved',
        balanceCredited: true,
        creditedAt: nowStr,
        createdAt: targetDeposit?.createdAt || nowStr,
        reviewedAt: nowStr,
        reviewedBy: reviewer,
      });

      const newBal = Number((Number(targetUser.balance || 0) + parsedAmount).toFixed(4));
      const newTotalDep = Number((Number(targetUser.totalDeposit || 0) + parsedAmount).toFixed(4));

      let vip = targetUser.vipLevel || 0;
      if (newBal >= 899) vip = Math.max(vip, 3);
      else if (newBal >= 499) vip = Math.max(vip, 2);
      else if (newBal >= 20) vip = Math.max(vip, 1);

      // STRICT DECOUPLING: Deposit approval ONLY credits balance/totalDeposit/vipLevel.
      const updatedUser = updateUserFields(
        { uid: targetUser.uid },
        {
          balance: newBal,
          totalDeposit: newTotalDep,
          vipLevel: vip,
          workPermission: targetUser.workPermission === true,
          cycleApprovedByAdmin: targetUser.cycleApprovedByAdmin === true,
        }
      );

      return {
        httpStatus: 200,
        body: {
          success: true,
          alreadyApproved: false,
          message: `Deposit of ${parsedAmount} USDT approved and balance credited!`,
          deposit: savedDeposit,
          user: updatedUser,
        },
      };
    });

    return res.status(result.httpStatus).json(result.body);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to approve deposit: ' + err.message });
  } finally {
    IN_FLIGHT_DEPOSIT_APPROVALS.delete(depositId);
  }
});

/**
 * POST /api/admin/recalculate-balance
 * Recalculates balance from unique approved deposits + commissions - withdrawals
 */
app.post('/api/admin/recalculate-balance', (req, res) => {
  try {
    const {
      userUid,
      userId,
      username,
      baseBalance = 0,
      earnedCommissions: clientEarnedCommissions,
      totalWithdrawals: clientTotalWithdrawals,
    } = req.body || {};

    if (!userUid && !userId && !username) {
      return res.status(400).json({ success: false, message: 'User identifier (UID, ID, or username) is required.' });
    }

    const norm = (s) => (s ? String(s).trim().toLowerCase() : '');
    const u = findUserByIdentifier({ uid: userUid, id: userId, username });

    if (!u) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const uidStr = String(u.uid);
    const unameLower = norm(u.username);
    const uId = u.id;

    // Deduplicate approved deposits strictly by deposit id
    const approvedDepMap = new Map();
    getAllDeposits().forEach((d) => {
      if (
        d.status === 'approved' &&
        (String(d.userUid) === uidStr || d.userId === uId || norm(d.username) === unameLower)
      ) {
        approvedDepMap.set(String(d.id), d);
      }
    });

    const userApprovedDeposits = Array.from(approvedDepMap.values());
    const totalApprovedDeposits = Number(
      userApprovedDeposits.reduce((sum, d) => sum + Number(d.amount || 0), 0).toFixed(4)
    );

    // Sum earned commissions from completed orders & persisted counters
    const completedOrderMap = new Map();
    getOrders().forEach((o) => {
      if (
        o.status === 'completed' &&
        (String(o.userUid) === uidStr || o.userId === uId || norm(o.username) === unameLower)
      ) {
        const key = String(o.orderNo || o.orderId || '');
        if (key) completedOrderMap.set(key, Number(o.commission || 0));
      }
    });

    const ordersCommSum = Number(
      Array.from(completedOrderMap.values())
        .reduce((sum, c) => sum + c, 0)
        .toFixed(4)
    );
    const persistedCommSum = Number(
      ((Number(u.todayCommission || 0) || 0) + (Number(u.yesterdayCommission || 0) || 0)).toFixed(4)
    );
    const clientComm =
      typeof clientEarnedCommissions === 'number' && !isNaN(clientEarnedCommissions)
        ? Number(Math.max(0, clientEarnedCommissions).toFixed(4))
        : 0;
    const earnedCommissions = Number(Math.max(ordersCommSum, persistedCommSum, clientComm).toFixed(4));

    const dbWithdrawals = getWithdrawalsForUser({ uid: uidStr, id: uId, username: u.username });
    const dbWithdrawalsSum = Number(
      dbWithdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0).toFixed(4)
    );
    const clientWd =
      typeof clientTotalWithdrawals === 'number' && !isNaN(clientTotalWithdrawals)
        ? Number(Math.max(0, clientTotalWithdrawals).toFixed(4))
        : 0;
    const totalWithdrawals = Number(
      Math.max(dbWithdrawalsSum, clientWd, Number(u.totalWithdrawal || 0)).toFixed(4)
    );

    const exactBalance = Number(
      Math.max(0, Number(baseBalance || 0) + totalApprovedDeposits + earnedCommissions - totalWithdrawals).toFixed(4)
    );
    const exactTotalDeposit = totalApprovedDeposits;

    let vip = u.vipLevel || 0;
    if (exactBalance >= 899) vip = Math.max(vip, 3);
    else if (exactBalance >= 499) vip = Math.max(vip, 2);
    else if (exactBalance >= 20) vip = Math.max(vip, 1);

    const updatedRecord = updateUserFields(
      { uid: uidStr },
      {
        balance: exactBalance,
        totalDeposit: exactTotalDeposit,
        totalWithdrawal: totalWithdrawals,
        vipLevel: vip,
        workPermission: u.workPermission === true,
        cycleApprovedByAdmin: u.cycleApprovedByAdmin === true,
      }
    );

    return res.json({
      success: true,
      message: `User ${u.username}'s balance recalculated accurately: ${exactBalance.toFixed(2)} USDT (${userApprovedDeposits.length} approved deposits: ${exactTotalDeposit.toFixed(2)} + commissions: ${earnedCommissions.toFixed(2)} - withdrawals: ${totalWithdrawals.toFixed(2)}).`,
      user: updatedRecord,
      calculated: {
        approvedDepositsCount: userApprovedDeposits.length,
        totalApprovedDeposits: exactTotalDeposit,
        earnedCommissions,
        totalWithdrawals,
        correctedBalance: exactBalance,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to recalculate balance: ' + err.message });
  }
});

/**
 * POST /api/admin/adjust-balance
 * Explicitly sets or adjusts a user's balance
 */
app.post('/api/admin/adjust-balance', (req, res) => {
  try {
    const { userUid, userId, username, newBalance, mode = 'set', amount = 0 } = req.body;
    if (!userUid && !userId && !username) {
      return res.status(400).json({ success: false, message: 'User identifier is required.' });
    }

    const u = findUserByIdentifier({ uid: userUid, id: userId, username });
    if (!u) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let finalBal = u.balance || 0;
    if (mode === 'set' && typeof newBalance === 'number') {
      finalBal = Number(newBalance.toFixed(4));
    } else if (mode === 'credit') {
      finalBal = Number(((u.balance || 0) + Number(amount)).toFixed(4));
    } else if (mode === 'debit') {
      finalBal = Number(Math.max(0, (u.balance || 0) - Number(amount)).toFixed(4));
    }

    let vip = u.vipLevel || 0;
    if (finalBal >= 899) vip = Math.max(vip, 3);
    else if (finalBal >= 499) vip = Math.max(vip, 2);
    else if (finalBal >= 20) vip = Math.max(vip, 1);

    const updated = updateUserFields({ uid: u.uid }, { balance: finalBal, vipLevel: vip });

    return res.json({
      success: true,
      message: `User ${u.username} balance updated to ${finalBal.toFixed(2)} USDT`,
      user: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to adjust balance: ' + err.message });
  }
});

/**
 * POST /api/deposits/reject
 * Reject a deposit voucher
 */
app.post('/api/deposits/reject', (req, res) => {
  try {
    const { depositId, reason, adminUsername } = req.body;
    if (!depositId) {
      return res.status(400).json({ success: false, message: 'Deposit ID is required.' });
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const reviewer = adminUsername || 'admin';
    const rejectReason = reason || 'Invalid transaction hash';

    const existing = getDepositById(depositId);
    let targetDeposit = null;
    if (existing) {
      targetDeposit = upsertDeposit({
        ...existing,
        status: 'rejected',
        rejectionReason: rejectReason,
        reviewedAt: nowStr,
        reviewedBy: reviewer,
      });
    }

    return res.json({
      success: true,
      message: 'Deposit voucher rejected.',
      deposit: targetDeposit,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reject deposit: ' + err.message });
  }
});

/**
 * POST /api/orders/grab
 * Persists a newly grabbed incomplete order into local SQLite database
 */
app.post('/api/orders/grab', (req, res) => {
  try {
    const { order, userUid, username } = req.body;
    if (!order || !order.orderNo) {
      return res.status(400).json({ success: false, message: 'Order payload with orderNo is required.' });
    }

    const uidStr = String(userUid || order.userUid || '');
    const u = findUserByIdentifier({ uid: uidStr, id: order.userId });

    const existing = findOrderByIdOrNo({ orderNo: order.orderNo, orderId: order.id || order.orderId });
    if (existing && existing.status === 'completed') {
      return res.json({ success: true, order: existing });
    }

    const record = {
      ...order,
      orderId: order.id || order.orderId || ('ord_' + Date.now()),
      orderNo: String(order.orderNo),
      userUid: uidStr || (u ? String(u.uid) : ''),
      userId: order.userId || (u ? u.id : ''),
      username: username || (u ? u.username : ''),
      taskNumber: Number(order.comboStepNumber || (u ? (u.currentCycleTasks || 0) + 1 : 1)),
      cycleNumber: u?.cycleNumber || 1,
      status: 'incomplete',
    };

    const saved = upsertOrder(record);
    return res.json({ success: true, order: saved });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to persist grabbed order: ' + err.message });
  }
});

/**
 * POST /api/orders/submit
 * Atomically submits an order, credits commission to balance ONCE, and saves state in SQLite
 */
app.post('/api/orders/submit', (req, res) => {
  try {
    const {
      orderId,
      orderNo,
      userUid,
      userId,
      username,
      commission,
      orderAmount = 0,
      platform = 'Amazon',
      vipTier = 'VIP 1',
      productTitle = 'Matched Retail Order',
      isComboOrder = false,
      comboStepNumber = 0,
    } = req.body;

    if (!orderId && !orderNo) {
      return res.status(400).json({ success: false, message: 'Order identifier (orderId or orderNo) is required.' });
    }

    const outcome = runTransaction(() => {
      const alreadySubmittedRecord = findOrderByIdOrNo({ orderId, orderNo });
      if (alreadySubmittedRecord && alreadySubmittedRecord.status === 'completed') {
        const uExisting = findUserByIdentifier({ uid: userUid, id: userId, username });
        return {
          httpStatus: 200,
          body: {
            success: true,
            alreadySubmitted: true,
            message: 'Order has already been submitted and credited.',
            orderRecord: alreadySubmittedRecord,
            user: uExisting,
          },
        };
      }

      const u = findUserByIdentifier({ uid: userUid, id: userId, username });
      if (!u) {
        return { httpStatus: 404, body: { success: false, message: 'User not found.' } };
      }

      if (u.workPermission !== true) {
        return {
          httpStatus: 403,
          body: {
            success: false,
            isPermissionLocked: true,
            message: 'Work Permission Required: Your account is pending Admin approval before submitting orders.',
          },
        };
      }
      if ((u.currentCycleTasks || 0) >= 25 || !u.cycleApprovedByAdmin) {
        return {
          httpStatus: 403,
          body: {
            success: false,
            isCycleLocked: true,
            message: '25-Task Cycle Completed: Task-grabbing permission is locked until an Admin approves your next cycle.',
          },
        };
      }

      const comm = Number(Number(commission || 0).toFixed(4));
      if (isNaN(comm) || comm < 0) {
        return { httpStatus: 400, body: { success: false, message: 'Invalid commission amount.' } };
      }

      const today = new Date().toISOString().substring(0, 10);
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const isNewDay = u.lastActiveDate && u.lastActiveDate !== today;
      const currentTodayComm = isNewDay ? 0 : (u.todayCommission ?? 0);
      const yestComm = isNewDay ? (u.todayCommission ?? 0) : (u.yesterdayCommission ?? 0);

      const nextCompletedLifetime = (u.completedTasksCount || 0) + 1;
      const nextCycleTasks = (u.currentCycleTasks || 0) + 1;
      const isCycleNowFinished = nextCycleTasks >= 25;
      const nextTodayTimes = Math.max((u.todayOrdersCount ?? 0) + 1, nextCycleTasks);

      const balanceBefore = Number(u.balance || 0);
      let newBalance = Number((balanceBefore + comm).toFixed(4));

      const isCycle2Small =
        (u.cycleNumber || 1) === 2 &&
        (u.cycleStartBalance === undefined || (u.cycleStartBalance >= 25 && u.cycleStartBalance <= 45)) &&
        balanceBefore < 450 &&
        !(u.customCombos && u.customCombos.length > 0);

      if (u.isDemoAccount) {
        newBalance = isCycleNowFinished
          ? Number(Math.min(2680, Math.max(2320, newBalance)).toFixed(4))
          : Number(Math.min(2650, newBalance).toFixed(4));
      } else if (isCycle2Small) {
        newBalance = isCycleNowFinished
          ? Number(Math.min(348, Math.max(322, newBalance)).toFixed(4))
          : Number(Math.min(340, newBalance).toFixed(4));
      }

      let vip = u.vipLevel || 0;
      if (newBalance >= 899) vip = Math.max(vip, 3);
      else if (newBalance >= 499) vip = Math.max(vip, 2);
      else if (newBalance >= 20) vip = Math.max(vip, 1);

      const updatedUser = updateUserFields(
        { uid: u.uid },
        {
          balance: newBalance,
          vipLevel: vip,
          todayOrdersCount: nextTodayTimes,
          todayCompletedCount: nextTodayTimes,
          todayCommission: Number((currentTodayComm + comm).toFixed(4)),
          yesterdayCommission: yestComm,
          lastActiveDate: today,
          completedTasksCount: nextCompletedLifetime,
          currentCycleTasks: nextCycleTasks,
          cycleApprovedByAdmin: !isCycleNowFinished,
          workPermission: isCycleNowFinished ? false : true,
        }
      );

      const orderRecord = upsertOrder({
        orderId: orderId || ('ord_' + Date.now()),
        orderNo: String(orderNo || ('ORD' + Date.now())),
        userUid: String(u.uid),
        userId: u.id || ('user_' + u.uid),
        username: u.username,
        platform,
        vipTier,
        productTitle,
        orderAmount: Number(orderAmount || 0),
        commission: comm,
        expectedIncome: Number((Number(orderAmount || 0) + comm).toFixed(4)),
        isComboOrder: !!isComboOrder,
        comboStepNumber: comboStepNumber || 0,
        balanceBefore,
        balanceAfter: newBalance,
        taskNumber: nextCycleTasks,
        cycleNumber: u.cycleNumber || 1,
        status: 'completed',
        completedAt: nowStr,
      });

      return {
        httpStatus: 200,
        body: {
          success: true,
          alreadySubmitted: false,
          commission: comm,
          newBalance,
          isCycleNowFinished,
          message: `Order submitted! Commission +${comm.toFixed(4)} USDT credited to balance.`,
          orderRecord,
          user: {
            ...updatedUser,
            todayOrdersCount: nextTodayTimes,
            todayCompletedCount: nextTodayTimes,
            workPermission: updatedUser.workPermission === true,
            cycleApprovedByAdmin: updatedUser.cycleApprovedByAdmin === true,
          },
        },
      };
    });

    return res.status(outcome.httpStatus).json(outcome.body);
  } catch (err) {
    console.error('Order submit error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit order: ' + err.message });
  }
});

/**
 * GET /api/orders
 * Returns persisted incomplete & completed orders from local SQLite database
 */
app.get('/api/orders', (req, res) => {
  try {
    const { userUid } = req.query;
    const list = getOrders(userUid ? String(userUid) : null);
    return res.json({ success: true, orders: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/invites
 * Returns all active system and user referral invite codes
 */
app.get('/api/invites', (req, res) => {
  try {
    const SYSTEM_CODES = [
      { id: 'inv_sys_1', code: 'SYS888', type: 'system', createdBy: 'admin', creatorRole: 'super_admin', usageCount: 14, maxUses: null, status: 'active', createdAt: '2026-01-01 00:00:00' },
      { id: 'inv_sys_2', code: 'SYS100', type: 'system', createdBy: 'admin', creatorRole: 'super_admin', usageCount: 8, maxUses: null, status: 'active', createdAt: '2026-01-01 00:00:00' },
      { id: 'inv_sys_3', code: 'TRADEVIP', type: 'system', createdBy: 'admin', creatorRole: 'super_admin', usageCount: 5, maxUses: null, status: 'active', createdAt: '2026-01-01 00:00:00' },
      { id: 'inv_sys_4', code: 'ALPHA99', type: 'system', createdBy: 'admin', creatorRole: 'super_admin', usageCount: 12, maxUses: null, status: 'active', createdAt: '2026-01-01 00:00:00' },
      { id: 'inv_sys_5', code: 'VELORA888', type: 'system', createdBy: 'admin', creatorRole: 'super_admin', usageCount: 3, maxUses: null, status: 'active', createdAt: '2026-02-18 18:00:00' },
    ];

    const allUsers = getAllUsers();
    const userCodes = allUsers.map((u) => ({
      id: 'inv_user_' + u.uid,
      code: u.inviteCode || u.uid,
      type: 'user',
      createdBy: `${u.uid} (${u.username})`,
      creatorRole: 'user',
      usageCount: allUsers.filter((other) => other.referredBy === (u.inviteCode || u.uid) || other.referredBy === u.uid).length,
      maxUses: null,
      status: 'active',
      createdAt: u.createdAt || '2026-05-01 10:00:00',
    }));

    return res.json({ success: true, invites: [...SYSTEM_CODES, ...userCodes] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch invites' });
  }
});

/**
 * POST /api/auth/login
 * Strict password verification on login against local SQLite credentials
 */
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your username.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Please enter your password.' });
    }

    const user = findUserForLogin(username.trim());
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found. Please register first.' });
    }

    if (user.status === 'frozen') {
      return res.status(403).json({ success: false, message: 'Your account is frozen. Please contact customer service.' });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please verify your password and try again.',
      });
    }

    const effectiveTodayCount = resolveEffectiveTodayCount(user);

    return res.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id || ('user_' + user.uid),
        uid: user.uid,
        username: user.username,
        withdrawalPassword: user.withdrawalPassword || null,
        inviteCode: user.inviteCode || user.uid,
        referredBy: user.referredBy,
        balance: user.balance,
        frozenBalance: user.frozenBalance,
        totalDeposit: typeof user.totalDeposit === 'number' ? user.totalDeposit : 0,
        totalWithdrawal: typeof user.totalWithdrawal === 'number' ? user.totalWithdrawal : 0,
        vipLevel: user.vipLevel,
        avatarUrl: user.avatarUrl,
        wallet: normalizeWallet(user.wallet),
        todayOrdersCount: effectiveTodayCount,
        todayCompletedCount: effectiveTodayCount,
        todayCommission: user.todayCommission || 0,
        yesterdayCommission: user.yesterdayCommission || 0,
        lastActiveDate: user.lastActiveDate || '',
        cycleNumber: user.cycleNumber || 1,
        cycleStartBalance: user.cycleStartBalance,
        currentCycleTasks: user.currentCycleTasks || 0,
        completedTasksCount: user.completedTasksCount || 0,
        comboOrderStep: user.comboOrderStep || 14,
        cycleApprovedByAdmin: user.cycleApprovedByAdmin === true,
        isVipAccount: user.isVipAccount === true,
        isLockedAccount: user.isLockedAccount === true,
        customCombos: Array.isArray(user.customCombos) ? user.customCombos : [],
        taxPaid: user.taxPaid === true,
        workPermission: user.workPermission === true,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

/**
 * POST /api/user/avatar
 * Update and store profile photo URL in local SQLite database
 */
app.post('/api/user/avatar', (req, res) => {
  try {
    const { userId, avatarUrl } = req.body;
    if (!userId || !avatarUrl) {
      return res.status(400).json({ success: false, message: 'User ID and avatar URL are required.' });
    }

    const updated = updateUserFields({ id: userId, uid: userId }, { avatarUrl });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      message: 'Profile photo updated successfully!',
      avatarUrl: updated.avatarUrl,
    });
  } catch (error) {
    console.error('Avatar update error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating avatar.' });
  }
});

/**
 * POST /api/tasks/simulate
 * Simulates task completion, handles cycle progression, and saves record to SQLite
 */
app.post('/api/tasks/simulate', (req, res) => {
  try {
    const { userId, taskIndex, startBalance } = req.body;

    const user = findUserByIdentifier({ id: userId, uid: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const currentTask = taskIndex || user.currentCycleTasks + 1;
    const cycle = user.cycleNumber || 1;
    const initialCycleBal = startBalance || user.cycleStartBalance || 30;

    let commission = 0;
    let isCombo = false;
    const productPrice = +(user.balance * 0.45).toFixed(2);

    if (cycle === 2 && initialCycleBal >= 30 && initialCycleBal <= 40) {
      const totalProfitTarget = 300;
      const basePerTaskProfit = totalProfitTarget / 25;
      commission = +(basePerTaskProfit * (0.85 + Math.random() * 0.3)).toFixed(4);
    } else {
      commission = +(productPrice * 0.005).toFixed(4);
    }

    if (user.comboOrderStep === currentTask) {
      isCombo = true;
      commission = +(commission * 3.5).toFixed(4);
    }

    const balanceBefore = user.balance;
    const balanceAfter = +(user.balance + commission).toFixed(4);
    const orderNum = 'ORD' + Date.now().toString().slice(-8) + Math.floor(100 + Math.random() * 900);

    runTransaction(() => {
      updateUserFields(
        { uid: user.uid },
        {
          balance: balanceAfter,
          currentCycleTasks: currentTask,
          completedTasksCount: (user.completedTasksCount || 0) + 1,
        }
      );

      upsertOrder({
        orderId: 'ord_' + orderNum,
        orderNo: orderNum,
        userUid: user.uid,
        userId: user.id,
        username: user.username,
        taskNumber: currentTask,
        cycleNumber: cycle,
        productTitle: `Premium Asset Order #${currentTask}`,
        orderAmount: productPrice,
        commission,
        isComboOrder: isCombo,
        comboStepNumber: isCombo ? currentTask : 0,
        status: 'completed',
        balanceBefore,
        balanceAfter,
      });
    });

    return res.json({
      success: true,
      orderNumber: orderNum,
      taskNumber: currentTask,
      cycleNumber: cycle,
      commission,
      newBalance: balanceAfter,
      isCombo,
    });
  } catch (error) {
    console.error('Task simulation error:', error);
    return res.status(500).json({ success: false, message: 'Server error simulating task.' });
  }
});

/**
 * GET & POST /api/combos/rules
 * Fetch and configure VIP combo rules in SQLite
 */
app.get('/api/combos/rules', (req, res) => {
  try {
    const rules = getComboRules();
    return res.json({ success: true, rules });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching combo rules.' });
  }
});

app.post('/api/combos/rules', (req, res) => {
  try {
    const { targetUserUid, customCombos } = req.body;
    if (targetUserUid && Array.isArray(customCombos)) {
      replaceComboRulesForUser(targetUserUid, customCombos);
    }
    return res.json({ success: true, message: 'Custom combo rules saved successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error saving combo rules.' });
  }
});

/**
 * POST /api/withdrawals/request
 * Validates withdrawal password, wallet, lock state, and mandatory 25% high-balance tax
 */
app.post('/api/withdrawals/request', (req, res) => {
  try {
    const { userId, amount, withdrawalPassword } = req.body;

    const user = findUserByIdentifier({ id: userId, uid: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.withdrawalPassword) {
      return res.status(400).json({ success: false, message: 'Please set a withdrawal security password first.' });
    }
    if (user.withdrawalPassword !== withdrawalPassword) {
      return res.status(401).json({ success: false, message: 'Incorrect withdrawal security password.' });
    }

    if (!user.wallet || !user.wallet.walletAddress) {
      return res.status(400).json({ success: false, message: 'Please bind a TRC-20 wallet address first.' });
    }

    if (user.isLockedAccount) {
      return res.status(403).json({
        success: false,
        message: 'Withdrawal locked for security review. Please contact Customer Support.',
      });
    }

    const withdrawAmt = parseFloat(amount);
    if (isNaN(withdrawAmt) || withdrawAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount.' });
    }
    if (withdrawAmt > user.balance) {
      return res.status(400).json({ success: false, message: 'Insufficient balance for this withdrawal.' });
    }

    let taxPercent = 0;
    let taxAmount = 0;
    let isHighBalanceTax = false;

    if (user.balance >= 50000) {
      isHighBalanceTax = true;
      taxPercent = 25;
      taxAmount = +(withdrawAmt * 0.25).toFixed(4);
    }

    const netAmount = +(withdrawAmt - taxAmount).toFixed(4);
    const balanceBefore = user.balance;
    const balanceAfter = +(user.balance - withdrawAmt).toFixed(4);

    const record = runTransaction(() => {
      updateUserFields({ uid: user.uid }, { balance: balanceAfter });
      return insertWithdrawalRecord({
        userId: user.uid,
        username: user.username,
        amount: withdrawAmt,
        userBalanceAtRequest: balanceBefore,
        isHighBalanceTaxApplied: isHighBalanceTax,
        taxPercent,
        taxAmount,
        netAmount,
        walletAddress: user.wallet.walletAddress,
        protocol: user.wallet.protocol || 'TRC-20',
        status: 'pending',
      });
    });

    return res.json({
      success: true,
      message: isHighBalanceTax
        ? 'Withdrawal submitted with mandatory 25% high-balance tax deducted.'
        : 'Withdrawal submitted successfully.',
      record: {
        id: record.id,
        amount: withdrawAmt,
        taxPercent,
        taxAmount,
        netAmount,
        walletAddress: record.walletAddress,
        status: record.status,
      },
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing withdrawal.' });
  }
});

// ==============================================================================
// 4.1 ADMIN SECURE ROUTE PROTECTION & AUTHENTICATION MIDDLEWARE
// ==============================================================================

const verifyAdminAuth = (req, res, next) => {
  const token =
    req.headers['x-admin-token'] ||
    req.headers['authorization']?.replace(/^Bearer\s+/i, '');

  if (!token || (token !== 'admin_super_secret_token_2026' && token !== 'adm_sec_998877665544')) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Missing or invalid administrator authorization credentials.',
    });
  }
  next();
};

app.post('/api/admin/login', (req, res) => {
  const { username, password, securityPin } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Admin username and password are required.' });
  }

  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();
  const cleanPin = securityPin ? securityPin.trim() : '';

  const isSuperAdmin = cleanUser === 'admin' && cleanPass === 'admin123' && (!cleanPin || cleanPin === '9988');
  const isFinanceAdmin = cleanUser === 'sub_finance' && cleanPass === 'finance123';
  const isOpsAdmin = cleanUser === 'sub_moderator' && cleanPass === 'ops123';

  if (isSuperAdmin || isFinanceAdmin || isOpsAdmin) {
    const role = isSuperAdmin ? 'super_admin' : 'sub_admin';
    return res.json({
      success: true,
      message: 'Administrator authentication verified.',
      token: 'admin_super_secret_token_2026',
      admin: {
        username: cleanUser,
        role,
        name: isSuperAdmin ? 'Super Admin' : cleanUser === 'sub_finance' ? 'Finance Manager' : 'Operations Manager',
      },
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Access Denied: Invalid administrator credentials or Master PIN.',
  });
});

app.get('/api/admin/verify', verifyAdminAuth, (req, res) => {
  return res.json({
    success: true,
    message: 'Administrator session active and verified.',
  });
});

// ==============================================================================
// 4.2 CUSTOMER SERVICE LIVE CHAT REST API ROUTES
// ==============================================================================

app.get('/api/chat/threads', (req, res) => {
  try {
    const allMessages = getChatMessages();
    const userMap = new Map(getAllUsers().map((u) => [String(u.uid), u]));
    const threadsMap = new Map();

    allMessages.forEach((msg) => {
      const uid = String(msg.userUid);
      const userObj = userMap.get(uid);
      const existing = threadsMap.get(uid);
      const isUnreadForAdmin = msg.sender === 'user' && !msg.readByAdmin;

      const previewText =
        msg.text && String(msg.text).trim()
          ? String(msg.text).trim()
          : msg.imageUrl
          ? '[Photo attachment]'
          : '';

      if (!existing) {
        threadsMap.set(uid, {
          userUid: uid,
          username: userObj?.username || msg.username || `User_${uid}`,
          vipLevel: userObj?.vipLevel ?? 0,
          avatarUrl: userObj?.avatarUrl || '/assets/aistudio/a3.f53cf407_cf3e68d0.png',
          balance: typeof userObj?.balance === 'number' ? userObj.balance : 0,
          lastMessage: previewText,
          lastSender: msg.sender,
          lastTimestamp: msg.timestamp,
          unreadCount: isUnreadForAdmin ? 1 : 0,
          totalMessages: 1,
        });
      } else {
        existing.totalMessages += 1;
        if (isUnreadForAdmin) {
          existing.unreadCount += 1;
        }
        if (String(msg.timestamp || '') >= String(existing.lastTimestamp || '')) {
          existing.lastMessage = previewText;
          existing.lastSender = msg.sender;
          existing.lastTimestamp = msg.timestamp;
        }
        if (userObj?.username) {
          existing.username = userObj.username;
        }
      }
    });

    const threads = Array.from(threadsMap.values()).sort((a, b) =>
      String(b.lastTimestamp || '').localeCompare(String(a.lastTimestamp || ''))
    );
    const totalUnread = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);

    return res.json({ success: true, threads, totalUnread });
  } catch (err) {
    console.error('Error fetching chat threads:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to load chat threads.' });
  }
});

app.get('/api/chat/messages/:userId', (req, res) => {
  try {
    const rawUserId = String(req.params.userId || '').trim();
    if (!rawUserId) {
      return res.status(400).json({ success: false, message: 'userId is required.' });
    }
    const matchedUser = findUserByIdentifier({ uid: rawUserId, id: rawUserId });
    const resolvedUid = matchedUser ? String(matchedUser.uid) : rawUserId;
    const messages = getChatMessages(resolvedUid);
    return res.json({ success: true, messages });
  } catch (err) {
    console.error('Error fetching user chat messages:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to load messages.' });
  }
});

app.get('/api/chat/messages', (req, res) => {
  try {
    const rawUserId = String(req.query.userId || req.query.userUid || '').trim();
    if (!rawUserId) {
      const messages = getChatMessages();
      return res.json({ success: true, messages });
    }
    const matchedUser = findUserByIdentifier({ uid: rawUserId, id: rawUserId });
    const resolvedUid = matchedUser ? String(matchedUser.uid) : rawUserId;
    const messages = getChatMessages(resolvedUid);
    return res.json({ success: true, messages });
  } catch (err) {
    console.error('Error fetching chat messages:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to load messages.' });
  }
});

const handleSendChatMessage = (req, res) => {
  try {
    const {
      id,
      userUid,
      userId,
      username,
      sender,
      adminName,
      text,
      message,
      imageUrl,
      imageName,
      timestamp,
    } = req.body || {};

    const rawUidOrId = String(userUid || userId || '').trim();
    const matchedByUidOrId = findUserByIdentifier({ uid: rawUidOrId, id: rawUidOrId });
    const cleanUid = matchedByUidOrId ? String(matchedByUidOrId.uid) : rawUidOrId;
    const cleanText = String(text !== undefined ? text : message || '').trim();
    const rawImageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';
    const isValidImageUrl =
      !rawImageUrl ||
      rawImageUrl.startsWith('/api/chat/uploads/') ||
      rawImageUrl.startsWith('data:image/') ||
      /^https?:\/\//i.test(rawImageUrl);
    const cleanImageUrl = isValidImageUrl && rawImageUrl ? rawImageUrl : undefined;
    const cleanImageName =
      cleanImageUrl && typeof imageName === 'string' && imageName.trim()
        ? imageName.trim().slice(0, 120)
        : undefined;
    const cleanSender = sender === 'admin' ? 'admin' : 'user';
    const cleanTimestamp =
      typeof timestamp === 'string' && timestamp.trim()
        ? timestamp.trim()
        : new Date().toISOString();

    if (!cleanUid || (!cleanText && !cleanImageUrl)) {
      return res.status(400).json({
        success: false,
        message: 'User ID and either message text or an image attachment are required.',
      });
    }

    const userObj = matchedByUidOrId || findUserByIdentifier({ uid: cleanUid });
    const resolvedUsername = String(username || userObj?.username || `User_${cleanUid}`).trim();
    const msgId =
      id && String(id).trim()
        ? String(id).trim()
        : `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const existing = findChatMessageById(msgId);
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Message sent successfully',
        chatMessage: existing,
      });
    }

    const newMessage = insertChatMessage({
      id: msgId,
      userUid: cleanUid,
      username: resolvedUsername,
      sender: cleanSender,
      adminName: cleanSender === 'admin' ? String(adminName || 'Support Agent') : undefined,
      text: cleanText,
      imageUrl: cleanImageUrl,
      imageName: cleanImageName,
      timestamp: cleanTimestamp,
      readByAdmin: cleanSender === 'admin',
      readByUser: cleanSender === 'user',
    });

    broadcastChatEvent({ type: 'chat:message', message: newMessage }, cleanUid);

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      chatMessage: newMessage,
    });
  } catch (err) {
    console.error('Error saving chat message:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};

app.post('/api/chat/send', handleSendChatMessage);
app.post('/api/support/message', handleSendChatMessage);
app.post('/api/chat/messages', handleSendChatMessage);

app.post('/api/chat/upload', (req, res) => {
  try {
    const { dataUrl, fileName } = req.body || {};
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ success: false, message: 'Image data is required.' });
    }

    const match = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([A-Za-z0-9+/=]+)$/i.exec(
      dataUrl.trim()
    );
    if (!match) {
      return res.status(400).json({
        success: false,
        message: 'Only valid JPEG, PNG, WEBP, or GIF images are supported.',
      });
    }

    const mimeType = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length === 0 || buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Uploaded image must be between 1 byte and 10 MB.',
      });
    }

    const extMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const ext = extMap[mimeType] || 'png';
    const safeFilename = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    ensureChatUploadsDir();
    fs.writeFileSync(path.join(CHAT_UPLOADS_DIR, safeFilename), buffer);
    saveChatUpload({ filename: safeFilename, mimeType, dataBase64: base64Data });

    const cleanOrigName =
      typeof fileName === 'string' && fileName.trim()
        ? path.basename(fileName.trim()).slice(0, 100)
        : safeFilename;

    return res.status(200).json({
      success: true,
      imageUrl: `/api/chat/uploads/${safeFilename}`,
      fileName: cleanOrigName,
    });
  } catch (err) {
    console.error('Error uploading chat image:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to upload image.' });
  }
});

app.get('/api/chat/uploads/:filename', (req, res) => {
  try {
    const safeName = path.basename(String(req.params.filename || '').trim());
    if (!safeName || !/^[A-Za-z0-9_.-]+$/.test(safeName)) {
      return res.status(400).json({ success: false, message: 'Invalid image filename.' });
    }

    const ext = path.extname(safeName).toLowerCase();
    const mimeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    const defaultMime = mimeMap[ext] || 'image/png';

    const filePath = path.join(CHAT_UPLOADS_DIR, safeName);
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', defaultMime);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      return res.sendFile(filePath);
    }

    const record = getChatUpload(safeName);
    if (record && record.dataBase64) {
      const buffer = Buffer.from(record.dataBase64, 'base64');
      try {
        ensureChatUploadsDir();
        fs.writeFileSync(filePath, buffer);
      } catch {}
      res.setHeader('Content-Type', record.mimeType || defaultMime);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      return res.send(buffer);
    }

    return res.status(404).json({ success: false, message: 'Chat image not found.' });
  } catch (err) {
    console.error('Error serving chat image:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to load chat image.' });
  }
});

app.post('/api/chat/read', (req, res) => {
  try {
    const { userUid, reader } = req.body || {};
    const cleanUid = String(userUid || '').trim();
    if (!cleanUid || (reader !== 'admin' && reader !== 'user')) {
      return res.status(400).json({ success: false, message: 'Valid userUid and reader are required.' });
    }

    markChatMessagesRead(cleanUid, reader);
    broadcastChatEvent({ type: 'chat:read', userUid: cleanUid, reader }, cleanUid);

    return res.json({ success: true });
  } catch (err) {
    console.error('Error marking chat read:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update read status.' });
  }
});

// ==============================================================================
// 4.3 REAL-TIME USER MONITORING REST API ROUTES
// ==============================================================================

app.get('/api/monitoring/users', (req, res) => {
  try {
    const records = getMergedMonitoringRecords();
    const onlineCount = records.filter((r) => r.isOnline).length;
    return res.json({ success: true, records, onlineCount });
  } catch (err) {
    console.error('Error fetching monitoring records:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to load monitoring data.' });
  }
});

app.post('/api/monitoring/event', async (req, res) => {
  try {
    const {
      eventType,
      userUid,
      username,
      copiedAddress,
      activePlatform,
      clientGeo,
    } = req.body || {};

    const cleanUid = String(userUid || '').trim();
    if (!cleanUid) {
      return res.status(400).json({ success: false, message: 'userUid is required.' });
    }

    const nowIso = new Date().toISOString();
    const existing = getMonitoringRecordByUid(cleanUid) || {};
    const userObj = findUserByIdentifier({ uid: cleanUid });

    const patch = {
      username: username || userObj?.username || existing.username || `User_${cleanUid}`,
      lastActiveAt: nowIso,
    };

    if (eventType === 'session_start') {
      if (!existing.lastLoginAt) {
        patch.lastLoginAt = nowIso;
      } else if (existing.lastActiveAt) {
        const gapMs = Date.now() - new Date(existing.lastActiveAt).getTime();
        if (isNaN(gapMs) || gapMs > 5 * 60 * 1000) {
          patch.lastLoginAt = nowIso;
        }
      }

      const serverIp = extractClientIp(req);
      if (serverIp && !isPrivateOrLocalIp(serverIp)) {
        patch.lastIp = serverIp;
        const geo = await lookupIpGeo(serverIp);
        if (geo) {
          patch.locationCountry = geo.country;
          patch.locationCity = geo.city;
          patch.locationRegion = geo.region;
        }
      } else {
        if (clientGeo && typeof clientGeo === 'object') {
          if (clientGeo.ip) patch.lastIp = String(clientGeo.ip);
          if (clientGeo.country) patch.locationCountry = String(clientGeo.country);
          if (clientGeo.city) patch.locationCity = String(clientGeo.city);
          if (clientGeo.region) patch.locationRegion = String(clientGeo.region);
        } else if (!existing.locationCountry) {
          patch.lastIp = serverIp || '127.0.0.1';
          patch.locationCountry = 'Local Network';
          patch.locationCity = 'Preview Session';
        }
      }
    } else if (eventType === 'copy_trc20') {
      patch.lastCopiedTrc20At = nowIso;
      if (copiedAddress) {
        patch.lastCopiedTrc20Address = String(copiedAddress).trim();
      }
      patch.copyCount = (existing.copyCount || 0) + 1;
    } else if (eventType === 'platform_select') {
      if (activePlatform) {
        patch.activePlatform = String(activePlatform);
      }
    }

    const record = upsertMonitoringRecord(cleanUid, patch);
    return res.json({ success: true, record });
  } catch (err) {
    console.warn('Monitoring event error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to record monitoring event.' });
  }
});

// ==============================================================================
// 4.4 ADMIN ACCOUNT & ORDER RECOVERY ENDPOINT
// ==============================================================================

app.post('/api/admin/recover-user-state', (req, res) => {
  try {
    const { userUid, userId, userUpdates, activeOrderAction, activeOrderPayload } = req.body || {};
    const cleanUid = String(userUid || '').trim();
    const cleanId = String(userId || '').trim();

    if (!cleanUid && !cleanId) {
      return res.status(400).json({ success: false, message: 'User UID or ID is required.' });
    }

    const targetUser = findUserByIdentifier({ uid: cleanUid, id: cleanId });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }

    const targetUid = String(targetUser.uid);
    const normalizedUpdates = { ...(userUpdates || {}) };

    const result = runTransaction(() => {
      const updatedUser = updateUserFields({ uid: targetUid }, normalizedUpdates);
      let updatedActiveOrder = null;

      if (activeOrderAction === 'clear') {
        clearIncompleteOrdersForUser(targetUid);
      } else if ((activeOrderAction === 'update' || activeOrderAction === 'create') && activeOrderPayload) {
        const ordNo = String(activeOrderPayload.orderNo || ('260' + Date.now()));
        const ordId = String(activeOrderPayload.id || activeOrderPayload.orderId || ('ord_' + Date.now()));
        const cleanOrder = {
          ...activeOrderPayload,
          id: ordId,
          orderId: ordId,
          orderNo: ordNo,
          userUid: targetUid,
          userId: cleanId || updatedUser?.id || ('user_' + targetUid),
          username: updatedUser?.username || activeOrderPayload.username || '',
          taskNumber: Number(activeOrderPayload.comboStepNumber || normalizedUpdates.currentCycleTasks || 1),
          cycleNumber: Number(normalizedUpdates.cycleNumber || updatedUser?.cycleNumber || 1),
          status: 'incomplete',
        };

        clearIncompleteOrdersForUser(targetUid, ordNo);
        updatedActiveOrder = upsertOrder(cleanOrder);
      }

      return { updatedUser, updatedActiveOrder };
    });

    return res.json({
      success: true,
      message: `Account state recovered for UID ${targetUid}.`,
      user: result.updatedUser,
      activeOrder: result.updatedActiveOrder,
    });
  } catch (err) {
    console.error('Admin recover user state error:', err);
    return res.status(500).json({ success: false, message: 'Failed to recover user state: ' + err.message });
  }
});

// ==============================================================================
// 5. DEV & PRODUCTION ASSET SERVING
// ==============================================================================

let viteMiddlewareHandler = null;
let viteSetupError = null;

const setupViteOrStatic = async () => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      viteMiddlewareHandler = vite.middlewares;
      console.log('Vite dev middleware initialized successfully');
    } catch (err) {
      viteSetupError = err;
      console.error('Vite middleware initialization error, falling back to dist:', err?.message || err);
    }
  }
};

const viteReadyPromise = setupViteOrStatic();

app.get('/', (req, res, next) => {
  const accept = req.headers.accept || '';
  if (accept.includes('text/html') || accept === '*/*' || !accept) {
    return next();
  }
  return res.status(200).json({
    status: 'online',
    message: 'Server is running successfully.',
    health: '/api/health',
  });
});

const distDir = path.join(__dirname, 'dist');
const staticFallback = express.static(distDir);

app.use('/api', (req, res) => {
  return res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  if (req.path.startsWith('/api') || (req.originalUrl && req.originalUrl.startsWith('/api'))) {
    const statusCode = Number(err?.status || err?.statusCode || 500);
    return res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
      success: false,
      message: err?.message || 'Internal server error.',
    });
  }
  return next(err);
});

app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  if (process.env.NODE_ENV !== 'production') {
    await viteReadyPromise;
    if (viteMiddlewareHandler) {
      return viteMiddlewareHandler(req, res, next);
    }
    if (viteSetupError) {
      return staticFallback(req, res, next);
    }
  }
  return staticFallback(req, res, next);
});

app.get('*', async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  if (process.env.NODE_ENV !== 'production') {
    await viteReadyPromise;
    if (viteMiddlewareHandler) {
      return viteMiddlewareHandler(req, res, next);
    }
  }
  const indexFile = path.join(distDir, 'index.html');
  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }
  return res.status(503).send('Frontend build not found.');
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`======================================================================`);
  console.log(`Backend Server listening on http://0.0.0.0:${PORT}`);
  console.log(`Database: ${DB_FILE_PATH}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`======================================================================`);
});

server.on('error', (err) => {
  console.error('HTTP Server listen error:', err);
});

// Attach WebSocket Servers on /ws/chat and /ws/monitor using a unified upgrade dispatcher
const wssChat = new WebSocketServer({ noServer: true });
const wssMonitor = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  try {
    const reqUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    if (reqUrl.pathname === '/ws/chat') {
      wssChat.handleUpgrade(request, socket, head, (ws) => {
        wssChat.emit('connection', ws, request);
      });
    } else if (reqUrl.pathname === '/ws/monitor') {
      wssMonitor.handleUpgrade(request, socket, head, (ws) => {
        wssMonitor.emit('connection', ws, request);
      });
    }
  } catch {
    try {
      socket.destroy();
    } catch {}
  }
});

wssChat.on('connection', (ws, req) => {
  try {
    const reqUrl = new URL(req.url || '/ws/chat', `http://${req.headers.host || 'localhost'}`);
    ws.role = reqUrl.searchParams.get('role') === 'admin' ? 'admin' : 'user';
    ws.userUid = reqUrl.searchParams.get('userUid') || '';
  } catch {
    ws.role = 'user';
    ws.userUid = '';
  }

  chatClients.add(ws);

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(String(raw));
      if (data?.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch {}
  });

  ws.on('close', () => {
    chatClients.delete(ws);
  });

  ws.on('error', () => {
    chatClients.delete(ws);
  });
});

wssMonitor.on('connection', (ws, req) => {
  let role = 'user';
  let userUid = '';
  let username = '';
  try {
    const reqUrl = new URL(req.url || '/ws/monitor', `http://${req.headers.host || 'localhost'}`);
    role = reqUrl.searchParams.get('role') === 'admin' ? 'admin' : 'user';
    userUid = (reqUrl.searchParams.get('userUid') || '').trim();
    username = (reqUrl.searchParams.get('username') || '').trim();
  } catch {}

  ws.monitorRole = role;
  ws.monitorUserUid = userUid;

  if (role === 'admin') {
    monitorAdminClients.add(ws);
    try {
      const records = getMergedMonitoringRecords();
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'monitor:snapshot', records }));
      }
    } catch {}
  } else if (userUid) {
    if (!monitorUserSockets.has(userUid)) {
      monitorUserSockets.set(userUid, new Set());
    }
    monitorUserSockets.get(userUid).add(ws);

    const nowIso = new Date().toISOString();
    const serverIp = extractClientIp(req);
    const existing = getMonitoringRecordByUid(userUid) || {};
    const patch = {
      username: username || existing.username,
      lastActiveAt: nowIso,
    };
    if (serverIp && !isPrivateOrLocalIp(serverIp)) {
      patch.lastIp = serverIp;
    }
    upsertMonitoringRecord(userUid, patch);

    if (serverIp && !isPrivateOrLocalIp(serverIp) && (!existing.locationCountry || existing.lastIp !== serverIp)) {
      lookupIpGeo(serverIp)
        .then((geo) => {
          if (geo) {
            upsertMonitoringRecord(userUid, {
              locationCountry: geo.country,
              locationCity: geo.city,
              locationRegion: geo.region,
            });
          }
        })
        .catch(() => {});
    }
  }

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(String(raw));
      if (data?.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        if (role === 'user' && userUid) {
          upsertMonitoringRow(userUid, { lastActiveAt: new Date().toISOString() });
        }
      }
    } catch {}
  });

  const handleDisconnect = () => {
    if (role === 'admin') {
      monitorAdminClients.delete(ws);
    } else if (userUid) {
      const set = monitorUserSockets.get(userUid);
      if (set) {
        set.delete(ws);
        if (set.size === 0) {
          monitorUserSockets.delete(userUid);
          upsertMonitoringRecord(userUid, {
            lastActiveAt: new Date().toISOString(),
          });
        }
      }
    }
  };

  ws.on('close', handleDisconnect);
  ws.on('error', handleDisconnect);
});

export default app;
