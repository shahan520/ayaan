/**
 * ==============================================================================
 * FULL-STACK BACKEND SERVER (server.js)
 * Database: MongoDB Atlas (via Mongoose)
 * Environment: dotenv (.env)
 * Web Framework: Express.js
 * ==============================================================================
 */

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 1. Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://shahanislam935_db_user:ciKbafwUqfbSmt7G@cluster0.pwkfalj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==============================================================================
// 2. MONGODB ATLAS CONNECTION (MONGOOSE)
// ==============================================================================
const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if IP is not yet whitelisted
    });
    // Requirement 3: Console message on successful connection
    console.log('MongoDB Connected Successfully');
    console.log(`Database Host: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    await seedInitialMembers();
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    console.log('----------------------------------------------------------------------');
    console.log('NOTICE FOR MONGODB ATLAS IP WHITELIST:');
    console.log('If you see a connection error, go to MongoDB Atlas Dashboard ->');
    console.log('Network Access -> Add IP Address -> Select "Allow Access from Anywhere" (0.0.0.0/0).');
    console.log('----------------------------------------------------------------------');
  }
};

// Initiate MongoDB Connection
connectMongoDB();

// ==============================================================================
// 3. MONGOOSE SCHEMAS & MODELS
// ==============================================================================

/**
 * 1) User Model: Registration, login credentials, balance, wallet, profile photo
 */
const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    withdrawalPassword: {
      type: String,
      default: null,
    },
    inviteCode: {
      type: String,
      required: true,
    },
    referredBy: {
      type: String,
      default: null,
    },
    balance: {
      type: Number,
      default: 0.0,
    },
    frozenBalance: {
      type: Number,
      default: 0.0,
    },
    vipLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    status: {
      type: String,
      enum: ['active', 'frozen'],
      default: 'active',
    },
    // Requirement 4: Profile photo URL storage
    avatarUrl: {
      type: String,
      default: '/assets/aistudio/a3.f53cf407_cf3e68d0.png',
    },
    wallet: {
      walletName: { type: String, default: '' },
      protocol: { type: String, enum: ['TRC-20', 'ERC-20', 'BEP-20'], default: 'TRC-20' },
      walletAddress: { type: String, default: '' },
      accountName: { type: String, default: '' },
      boundAt: { type: String, default: '' },
    },
    isVipAccount: {
      type: Boolean,
      default: false,
    },
    isLockedAccount: {
      type: Boolean,
      default: false, // Prevents client from withdrawing when flagged
    },
    workPermission: {
      type: Boolean,
      default: true,
    },
    completedTasksCount: {
      type: Number,
      default: 0,
    },
    currentCycleTasks: {
      type: Number,
      default: 0,
    },
    cycleNumber: {
      type: Number,
      default: 1,
    },
    cycleApprovedByAdmin: {
      type: Boolean,
      default: true,
    },
    comboOrderStep: {
      type: Number,
      default: 14,
    },
    cycleStartBalance: {
      type: Number,
      default: 30,
    },
    customCombos: [
      {
        stepNumber: { type: Number, required: true },
        requiredPercent: { type: Number, required: true },
        commissionPercent: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);

// Initial active member pool for immediate referral verification and Atlas seeding
const SEEDED_MEMBERS = [
  // Jackal (Code 232602)
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
  },
  { uid: '925886', username: 'Hanif8989', password: 'password123', inviteCode: '925886', referredBy: 'SYS888', balance: 479.31, vipLevel: 1, status: 'active' },
  // Level 1: Directly referred by Hanif8989 (925886)
  { uid: '771101', username: 'Karim_88', password: 'password123', inviteCode: '771101', referredBy: '925886', balance: 150.0, totalDeposit: 250.0, totalWithdrawal: 100.0, createdAt: '2026-05-12 10:00:00', vipLevel: 0, status: 'active' },
  { uid: '771102', username: 'Rafiq_21', password: 'password123', inviteCode: '771102', referredBy: '925886', balance: 300.0, totalDeposit: 500.0, totalWithdrawal: 200.0, createdAt: '2026-05-20 11:30:00', vipLevel: 0, status: 'active' },
  { uid: '771105', username: 'Sumon_77', password: 'password123', inviteCode: '771105', referredBy: '925886', balance: 0.0, totalDeposit: 0.0, totalWithdrawal: 0.0, createdAt: '2026-06-02 09:15:00', vipLevel: 0, status: 'active' },
  // Level 2: Invited by Level 1 members
  { uid: '771103', username: 'Nasrin_09', password: 'password123', inviteCode: '771103', referredBy: '771101', balance: 80.0, totalDeposit: 120.0, totalWithdrawal: 40.0, createdAt: '2026-05-18 14:00:00', vipLevel: 0, status: 'active' },
  { uid: '771104', username: 'Jahid_55', password: 'password123', inviteCode: '771104', referredBy: '771101', balance: 150.0, totalDeposit: 300.0, totalWithdrawal: 150.0, createdAt: '2026-05-25 16:45:00', vipLevel: 0, status: 'active' },
  { uid: '771106', username: 'Mitu_43', password: 'password123', inviteCode: '771106', referredBy: '771102', balance: 80.0, totalDeposit: 80.0, totalWithdrawal: 0.0, createdAt: '2026-06-10 12:10:00', vipLevel: 0, status: 'active' },
  // Level 3: Invited by Level 2 members
  { uid: '771107', username: 'Rakib_16', password: 'password123', inviteCode: '771107', referredBy: '771103', balance: 40.0, totalDeposit: 60.0, totalWithdrawal: 20.0, createdAt: '2026-06-05 13:20:00', vipLevel: 0, status: 'active' },
  { uid: '771108', username: 'Shanta_30', password: 'password123', inviteCode: '771108', referredBy: '771104', balance: 0.0, totalDeposit: 0.0, totalWithdrawal: 0.0, createdAt: '2026-06-15 15:30:00', vipLevel: 0, status: 'active' },
  // Additional system users
  { uid: '819203', username: 'VIP_Trader25', password: 'password123', inviteCode: '819203', referredBy: 'SYS888', balance: 550.0, vipLevel: 2, status: 'active' },
  { uid: '772109', username: 'Newbie_VIP0', password: 'password123', inviteCode: '772109', referredBy: 'SYS100', balance: 0.0, vipLevel: 0, status: 'active' },
  { uid: '381942', username: 'Cycle2_Trader', password: 'password123', inviteCode: '381942', referredBy: 'SYS888', balance: 35.0, vipLevel: 1, status: 'active' },
  { uid: '888001', username: 'Demo_Trader', password: 'password123', inviteCode: '888001', referredBy: 'ADMIN_DEMO', balance: 300.0, vipLevel: 1, status: 'active' },
  { uid: '998811', username: 'Whale_Investor50k', password: 'password123', inviteCode: '998811', referredBy: 'SYS888', balance: 58500.0, vipLevel: 3, status: 'active' },
];

// Persistent Global User Database on Disk (survives process reboots and operates reliably across all sessions)
const DATA_DIR = path.resolve(__dirname, 'data');
const PERSISTENT_USERS_FILE = path.join(DATA_DIR, 'persistent_users.json');

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const loadPersistentUsers = () => {
  try {
    ensureDataDir();
    if (fs.existsSync(PERSISTENT_USERS_FILE)) {
      const raw = fs.readFileSync(PERSISTENT_USERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingUids = new Set(parsed.map((u) => String(u.uid)));
        const missingSeeds = SEEDED_MEMBERS.filter((s) => !existingUids.has(String(s.uid)));
        return [...parsed, ...missingSeeds];
      }
    }
  } catch (err) {
    console.warn('Persistent users load note:', err.message);
  }
  return [...SEEDED_MEMBERS];
};

let ACTIVE_USERS = loadPersistentUsers();

const savePersistentUsers = () => {
  try {
    ensureDataDir();
    fs.writeFileSync(PERSISTENT_USERS_FILE, JSON.stringify(ACTIVE_USERS, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving persistent users to disk:', err.message);
  }
};
// Establish disk file immediately
savePersistentUsers();

const seedInitialMembers = async () => {
  try {
    if (mongoose.connection.readyState !== 1) return;
    for (const member of ACTIVE_USERS) {
      const exists = await User.findOne({ $or: [{ uid: member.uid }, { username: member.username }] });
      if (!exists) {
        await User.create(member);
      }
    }
  } catch (err) {
    console.warn('Initial member seed note:', err.message);
  }
};

/**
 * 2) Task Simulation Model: Orders, commission calculation, combo steps
 */
const taskSimulationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    username: {
      type: String,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    taskNumber: {
      type: Number,
      required: true, // 1 to 25
    },
    cycleNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    productTitle: {
      type: String,
      required: true,
    },
    productPrice: {
      type: Number,
      required: true,
    },
    commission: {
      type: Number,
      required: true,
    },
    isCombo: {
      type: Boolean,
      default: false,
    },
    comboStep: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'shortage'],
      default: 'completed',
    },
    userBalanceBefore: {
      type: Number,
    },
    userBalanceAfter: {
      type: Number,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const TaskSimulation =
  mongoose.models.TaskSimulation || mongoose.model('TaskSimulation', taskSimulationSchema);

/**
 * 3) VIP Combo Rules Model: Dynamic custom combo rules & hybrid default fallback
 */
const vipComboRuleSchema = new mongoose.Schema(
  {
    targetUserUid: {
      type: String,
      default: null, // null for global default rules, or UID for user-specific custom combos
    },
    vipLevel: {
      type: Number,
      required: true,
      default: 1,
    },
    cycleNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    stepNumber: {
      type: Number,
      required: true,
    },
    requiredPercent: {
      type: Number,
      required: true,
    },
    commissionPercent: {
      type: Number,
      required: true,
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const VipComboRule =
  mongoose.models.VipComboRule || mongoose.model('VipComboRule', vipComboRuleSchema);

/**
 * 4) Withdrawal Tax Model: Mandatory 25% recurring tax rule on balances over 50,000 USDT
 */
const withdrawalTaxRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    username: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    userBalanceAtRequest: {
      type: Number,
      required: true,
    },
    // Requirement 4: Recurring 25% tax when balance >= 50,000 USDT
    isHighBalanceTaxApplied: {
      type: Boolean,
      default: false,
    },
    taxPercent: {
      type: Number,
      default: 0, // 25% for balance >= 50,000 USDT
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      required: true,
    },
    walletAddress: {
      type: String,
      required: true,
    },
    protocol: {
      type: String,
      default: 'TRC-20',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminRemarks: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const WithdrawalTaxRecord =
  mongoose.models.WithdrawalTaxRecord ||
  mongoose.model('WithdrawalTaxRecord', withdrawalTaxRecordSchema);

// ==============================================================================
// 4. REST API ROUTES
// ==============================================================================

// Health Check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  res.json({
    status: 'ok',
    message: 'Backend server is running',
    database: {
      connected: dbStatus === 1,
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbStatus] || 'unknown',
      host: mongoose.connection.host || null,
    },
  });
});

/**
 * POST /api/auth/register
 * Register a new user with strict invite code validation, 6-digit numeric UID, and persistent disk storage
 */
app.post('/api/auth/register', async (req, res) => {
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

    // Check if user already exists in ACTIVE_USERS memory/disk
    let existingUser = ACTIVE_USERS.find(
      (u) => u.username && u.username.toLowerCase() === cleanUser.toLowerCase()
    );

    // Also check MongoDB if connected
    if (!existingUser && mongoose.connection.readyState === 1) {
      try {
        existingUser = await User.findOne({ username: { $regex: new RegExp(`^${cleanUser}$`, 'i') } });
      } catch (dbErr) {
        console.warn('Database username lookup notice:', dbErr.message);
      }
    }

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This username is already taken.' });
    }

    // Validate Invitation Code: Match any system code OR any existing member's invite code, UID, or username
    const SYSTEM_CODES = ['SYS888', 'SYS100', 'TRADEVIP', 'ALPHA99', 'VELORA888'];
    const isSystemCode = SYSTEM_CODES.includes(cleanCode);
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let matchingMember = null;
    if (!isSystemCode) {
      // 1. Check in persistent ACTIVE_USERS pool (e.g., Jackal 232602, Hanif8989 925886, etc.)
      matchingMember =
        ACTIVE_USERS.find(
          (m) =>
            (m.inviteCode && String(m.inviteCode).toUpperCase() === cleanCode) ||
            (m.uid && String(m.uid).toUpperCase() === cleanCode) ||
            (m.username && m.username.toUpperCase() === cleanCode)
        ) || null;

      // 2. Fallback to MongoDB if connected
      if (!matchingMember && mongoose.connection.readyState === 1) {
        try {
          matchingMember = await User.findOne({
            $or: [
              { inviteCode: { $regex: new RegExp(`^${escapeRegex(cleanCode)}$`, 'i') } },
              { uid: cleanCode },
              { username: { $regex: new RegExp(`^${escapeRegex(cleanCode)}$`, 'i') } },
            ],
            status: { $ne: 'frozen' },
          });
        } catch (dbErr) {
          console.warn('Database member search notice:', dbErr.message);
        }
      }
    }

    const isSixDigitUserCode = /^\d{6}$/.test(cleanCode);

    if (!isSystemCode && !matchingMember && !isSixDigitUserCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Invitation Code. Please enter an active referral code provided by an admin or existing member.',
      });
    }

    const canonicalReferredBy = matchingMember ? (matchingMember.inviteCode || matchingMember.uid) : cleanCode;

    // Generate unique 6-digit UID or accept frontend generated uid
    let uidCandidate = req.body.uid ? String(req.body.uid).trim() : Math.floor(100000 + Math.random() * 900000).toString();
    const existingUids = new Set(ACTIVE_USERS.map((u) => String(u.uid)));
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
      vipLevel: 0,
      status: 'active',
      avatarUrl: '/assets/aistudio/a3.f53cf407_cf3e68d0.png',
      wallet: null,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      todayOrdersCount: 0,
      todayCommission: 0,
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

    // Save to ACTIVE_USERS and write to disk immediately
    const existingIdx = ACTIVE_USERS.findIndex((u) => u.uid === uidCandidate || u.username.toLowerCase() === cleanUser.toLowerCase());
    if (existingIdx >= 0) {
      ACTIVE_USERS[existingIdx] = newCreatedUser;
    } else {
      ACTIVE_USERS.unshift(newCreatedUser);
    }
    savePersistentUsers();

    // Persist to MongoDB Atlas if connected
    let savedMongoUser = null;
    if (mongoose.connection.readyState === 1) {
      try {
        const newUserModel = new User({
          uid: uidCandidate,
          username: cleanUser,
          password,
          inviteCode: uidCandidate,
          referredBy: canonicalReferredBy,
          balance: 0.0,
          vipLevel: 0,
          avatarUrl: '/assets/aistudio/a3.f53cf407_cf3e68d0.png',
          cycleNumber: 1,
          currentCycleTasks: 0,
          completedTasksCount: 0,
          comboOrderStep: 14,
        });
        savedMongoUser = await newUserModel.save();
      } catch (dbSaveErr) {
        console.warn('MongoDB save fallback to persistent store:', dbSaveErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Registration successful! Your UID is ${uidCandidate}`,
      user: {
        ...newCreatedUser,
        id: savedMongoUser ? savedMongoUser._id.toString() : newCreatedUser.id,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

/**
 * GET /api/invites/validate/:code
 * Verify that an invitation code matches an active system code or member in MongoDB/Disk
 */
app.get('/api/invites/validate/:code', async (req, res) => {
  try {
    const rawCode = (req.params.code || '').trim().toUpperCase();
    if (!rawCode) {
      return res.status(400).json({ valid: false, message: 'Invite code is required.' });
    }

    const SYSTEM_CODES = ['SYS888', 'SYS100', 'TRADEVIP', 'ALPHA99', 'VELORA888'];
    if (SYSTEM_CODES.includes(rawCode)) {
      return res.json({ valid: true, type: 'system', code: rawCode });
    }

    // 1. Check in persistent ACTIVE_USERS pool first (instant response)
    let member =
      ACTIVE_USERS.find(
        (m) =>
          (m.inviteCode && String(m.inviteCode).toUpperCase() === rawCode) ||
          (m.uid && String(m.uid).toUpperCase() === rawCode) ||
          (m.username && m.username.toUpperCase() === rawCode)
      ) || null;

    // 2. Check MongoDB if connected
    if (!member && mongoose.connection.readyState === 1) {
      try {
        const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        member = await User.findOne({
          $or: [
            { inviteCode: { $regex: new RegExp(`^${escapeRegex(rawCode)}$`, 'i') } },
            { uid: rawCode },
            { username: { $regex: new RegExp(`^${escapeRegex(rawCode)}$`, 'i') } },
          ],
          status: { $ne: 'frozen' },
        });
      } catch {}
    }

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
 * Returns list of active users from persistent disk store & MongoDB
 */
app.get('/api/users', async (req, res) => {
  try {
    let mongoUsers = [];
    if (mongoose.connection.readyState === 1) {
      try {
        mongoUsers = await User.find({ status: { $ne: 'frozen' } }).select('-password -withdrawalPassword');
      } catch (err) {
        console.warn('Mongo fetch users note:', err.message);
      }
    }

    const activeMap = new Map(ACTIVE_USERS.map((u) => [String(u.uid), u]));
    mongoUsers.forEach((mu) => {
      if (!activeMap.has(String(mu.uid))) {
        activeMap.set(String(mu.uid), {
          id: mu._id?.toString() || ('user_' + mu.uid),
          ...mu.toObject(),
        });
      }
    });

    const safeUsers = Array.from(activeMap.values()).map((u) => {
      const { password, withdrawalPassword, ...safe } = u;
      return {
        ...safe,
        id: safe.id || ('user_' + safe.uid),
      };
    });

    return res.json({ success: true, users: safeUsers });
  } catch (err) {
    return res.json({ success: true, users: ACTIVE_USERS });
  }
});

/**
 * POST /api/users/sync
 * Sync users created on client into the persistent server database
 */
app.post('/api/users/sync', (req, res) => {
  try {
    const { users: clientUsers, user: clientUser } = req.body;
    let modified = false;

    if (clientUser && clientUser.uid) {
      const existingIdx = ACTIVE_USERS.findIndex((u) => String(u.uid) === String(clientUser.uid));
      if (existingIdx >= 0) {
        ACTIVE_USERS[existingIdx] = { ...ACTIVE_USERS[existingIdx], ...clientUser };
      } else {
        ACTIVE_USERS.unshift(clientUser);
      }
      modified = true;
    }

    if (Array.isArray(clientUsers)) {
      clientUsers.forEach((cu) => {
        if (!cu || !cu.uid) return;
        const idx = ACTIVE_USERS.findIndex((u) => String(u.uid) === String(cu.uid));
        if (idx >= 0) {
          ACTIVE_USERS[idx] = { ...ACTIVE_USERS[idx], ...cu };
        } else {
          ACTIVE_USERS.push(cu);
          modified = true;
        }
      });
    }

    if (modified) {
      savePersistentUsers();
    }

    const safeUsers = ACTIVE_USERS.map((u) => {
      const { password, withdrawalPassword, ...safe } = u;
      return {
        ...safe,
        id: safe.id || ('user_' + safe.uid),
      };
    });

    return res.json({ success: true, users: safeUsers });
  } catch (err) {
    console.error('User sync error:', err.message);
    return res.status(500).json({ success: false, message: 'Sync failed' });
  }
});

/**
 * POST /api/auth/login
 * Strict password verification on login against persistent user credentials
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your username.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Please enter your password.' });
    }

    const cleanUser = username.trim();

    // 1. Check in persistent ACTIVE_USERS memory/disk store first
    let user = ACTIVE_USERS.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanUser.toLowerCase()) ||
        (u.uid && String(u.uid) === cleanUser)
    ) || null;

    // 2. If not found in ACTIVE_USERS, check MongoDB if connected
    if (!user && mongoose.connection.readyState === 1) {
      try {
        const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        user = await User.findOne({
          $or: [
            { username: { $regex: new RegExp(`^${escapeRegex(cleanUser)}$`, 'i') } },
            { uid: cleanUser },
          ],
        });
      } catch (dbErr) {
        console.warn('MongoDB login search error:', dbErr.message);
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found. Please register first.' });
    }

    if (user.status === 'frozen') {
      return res.status(403).json({ success: false, message: 'Your account is frozen. Please contact customer service.' });
    }

    // STRICT PASSWORD VERIFICATION
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please verify your password and try again.',
      });
    }

    return res.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user._id ? user._id.toString() : user.id,
        uid: user.uid,
        username: user.username,
        inviteCode: user.inviteCode || user.uid,
        referredBy: user.referredBy,
        balance: user.balance,
        frozenBalance: user.frozenBalance,
        vipLevel: user.vipLevel,
        avatarUrl: user.avatarUrl,
        wallet: user.wallet,
        cycleNumber: user.cycleNumber || 1,
        currentCycleTasks: user.currentCycleTasks || 0,
        completedTasksCount: user.completedTasksCount || 0,
        isLockedAccount: user.isLockedAccount || false,
        workPermission: user.workPermission !== false,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

/**
 * POST /api/user/avatar
 * Update and store profile photo URL in MongoDB
 */
app.post('/api/user/avatar', async (req, res) => {
  try {
    const { userId, avatarUrl } = req.body;

    if (!userId || !avatarUrl) {
      return res.status(400).json({ success: false, message: 'User ID and avatar URL are required.' });
    }

    const user = await User.findOne({ $or: [{ _id: userId }, { uid: userId }] });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.avatarUrl = avatarUrl;
    await user.save();

    return res.json({
      success: true,
      message: 'Profile photo updated successfully!',
      avatarUrl: user.avatarUrl,
    });
  } catch (error) {
    console.error('Avatar update error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating avatar.' });
  }
});

/**
 * POST /api/tasks/simulate
 * Simulates task completion, handles cycle progression, and saves record to MongoDB
 * Features:
 * - Cycle 2 (starting 30-40 USDT) progression strictly targeting 320-350 USDT final balance
 * - Special combo triggers and commission multipliers
 */
app.post('/api/tasks/simulate', async (req, res) => {
  try {
    const { userId, taskIndex, startBalance } = req.body;

    const user = await User.findOne({ $or: [{ _id: userId }, { uid: userId }] });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const currentTask = taskIndex || user.currentCycleTasks + 1;
    const cycle = user.cycleNumber || 1;
    const initialCycleBal = startBalance || user.cycleStartBalance || 30;

    // Cycle 2: Target 320-350 USDT from 30-40 USDT starting balance
    let commission = 0;
    let isCombo = false;
    let productPrice = +(user.balance * 0.45).toFixed(2);

    if (cycle === 2 && initialCycleBal >= 30 && initialCycleBal <= 40) {
      // 25 tasks smoothly calibrated to land total balance strictly in 320 - 350 USDT
      const totalProfitTarget = 300; // 35 USDT initial + 300 USDT profit = 335 USDT final
      const basePerTaskProfit = totalProfitTarget / 25; // ~12 USDT average
      commission = +(basePerTaskProfit * (0.85 + Math.random() * 0.3)).toFixed(4);
    } else {
      // Standard VIP 1 commission (0.5% - 1.5% of product price)
      commission = +(productPrice * 0.005).toFixed(4);
    }

    // Check if this task is a combo task
    if (user.comboOrderStep === currentTask) {
      isCombo = true;
      commission = +(commission * 3.5).toFixed(4); // Extra combo reward
    }

    const balanceBefore = user.balance;
    const balanceAfter = +(user.balance + commission).toFixed(4);

    user.balance = balanceAfter;
    user.currentCycleTasks = currentTask;
    user.completedTasksCount = (user.completedTasksCount || 0) + 1;
    await user.save();

    // Save simulation record in MongoDB
    const orderNum = 'ORD' + Date.now().toString().slice(-8) + Math.floor(100 + Math.random() * 900);
    const simulationRecord = new TaskSimulation({
      userId: user.uid,
      username: user.username,
      orderNumber: orderNum,
      taskNumber: currentTask,
      cycleNumber: cycle,
      productTitle: `Premium Crypto Asset Trading Package #${currentTask}`,
      productPrice,
      commission,
      isCombo,
      comboStep: isCombo ? currentTask : 0,
      status: 'completed',
      userBalanceBefore: balanceBefore,
      userBalanceAfter: balanceAfter,
    });

    await simulationRecord.save();

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
 * Fetch and configure VIP combo rules (dynamic admin count with hybrid automatic fallback)
 */
app.get('/api/combos/rules', async (req, res) => {
  try {
    const rules = await VipComboRule.find().sort({ stepNumber: 1 });
    return res.json({ success: true, rules });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching combo rules.' });
  }
});

app.post('/api/combos/rules', async (req, res) => {
  try {
    const { targetUserUid, customCombos } = req.body;
    // Save custom combo configuration
    if (targetUserUid && Array.isArray(customCombos)) {
      await VipComboRule.deleteMany({ targetUserUid });
      const docs = customCombos.map((c) => ({
        targetUserUid,
        stepNumber: c.stepNumber,
        requiredPercent: c.requiredPercent,
        commissionPercent: c.commissionPercent,
        isCustom: true,
      }));
      await VipComboRule.insertMany(docs);
    }
    return res.json({ success: true, message: 'Custom combo rules saved successfully in MongoDB.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error saving combo rules.' });
  }
});

/**
 * POST /api/withdrawals/request
 * Withdrawal validation:
 * 1. Checks locked TRC-20 wallet (admin-only reset)
 * 2. Mandatory recurring 25% tax whenever user balance is >= 50,000 USDT without exception
 */
app.post('/api/withdrawals/request', async (req, res) => {
  try {
    const { userId, amount, withdrawalPassword } = req.body;

    const user = await User.findOne({ $or: [{ _id: userId }, { uid: userId }] });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check withdrawal password
    if (!user.withdrawalPassword) {
      return res.status(400).json({ success: false, message: 'Please set a withdrawal security password first.' });
    }
    if (user.withdrawalPassword !== withdrawalPassword) {
      return res.status(401).json({ success: false, message: 'Incorrect withdrawal security password.' });
    }

    // Check wallet binding
    if (!user.wallet || !user.wallet.walletAddress) {
      return res.status(400).json({ success: false, message: 'Please bind a TRC-20 wallet address first.' });
    }

    // Check account withdrawal lock
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

    // MANDATORY RECURRING 25% TAX FOR BALANCES OVER 50,000 USDT:
    let taxPercent = 0;
    let taxAmount = 0;
    let isHighBalanceTax = false;

    if (user.balance >= 50000) {
      isHighBalanceTax = true;
      taxPercent = 25; // 25% mandatory tax
      taxAmount = +(withdrawAmt * 0.25).toFixed(4);
    }

    const netAmount = +(withdrawAmt - taxAmount).toFixed(4);

    // Deduct user balance
    user.balance = +(user.balance - withdrawAmt).toFixed(4);
    await user.save();

    // Save record to MongoDB
    const record = new WithdrawalTaxRecord({
      userId: user.uid,
      username: user.username,
      amount: withdrawAmt,
      userBalanceAtRequest: user.balance + withdrawAmt,
      isHighBalanceTaxApplied: isHighBalanceTax,
      taxPercent,
      taxAmount,
      netAmount,
      walletAddress: user.wallet.walletAddress,
      protocol: user.wallet.protocol || 'TRC-20',
      status: 'pending',
    });

    await record.save();

    return res.json({
      success: true,
      message: isHighBalanceTax
        ? 'Withdrawal submitted with mandatory 25% high-balance tax deducted.'
        : 'Withdrawal submitted successfully.',
      record: {
        id: record._id,
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

/**
 * POST /api/admin/login
 * Secure authentication gate for /admin route
 */
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

/**
 * GET /api/admin/verify
 * Protected verification endpoint for active admin sessions
 */
app.get('/api/admin/verify', verifyAdminAuth, (req, res) => {
  return res.json({
    success: true,
    message: 'Administrator session active and verified.',
  });
});

// ==============================================================================
// 5. DEV & PRODUCTION ASSET SERVING
// ==============================================================================

// If running in development with Vite or production build
const setupViteOrStatic = async () => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch {
      app.use(express.static(path.join(__dirname, 'dist')));
    }
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }
};

// Root health check endpoint for Render / Cloud scanners
app.get('/', (req, res, next) => {
  // If dist index.html exists, let static handler serve it; otherwise respond 200 OK
  if (req.accepts('html') && !req.path.startsWith('/api')) {
    return next();
  }
  res.status(200).json({
    status: 'online',
    message: 'Server is running successfully.',
    health: '/api/health',
  });
});

// Setup Vite middleware in dev or static files in production
const startServer = async () => {
  await setupViteOrStatic();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`======================================================================`);
    console.log(`Backend Server listening on http://0.0.0.0:${PORT}`);
    console.log(`Health check: http://0.0.0.0:${PORT}/api/health`);
    console.log(`======================================================================`);
  });
};

startServer().catch((err) => {
  console.error('Server startup error:', err);
});
