import express, { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import {
  DEFAULT_BRANCHES,
  validateVasaviRollNumber,
  validateMobileNumber,
  validatePassword,
  validateListingPermissions,
  validateRequestPermissions,
} from './src/utils/validation.ts';
import { INITIAL_COMPONENTS } from './src/data/sampleComponents.ts';
import { ComponentItem, ItemRequest, StudentUser, ChatMessage, Conversation } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? path.join('/tmp', 'c2c-data') : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export function getSeedDbPath(): string | null {
  const candidates = [
    path.join(process.cwd(), 'data', 'db.json'),
    path.join(__dirname, 'data', 'db.json'),
    path.join(__dirname, '..', 'data', 'db.json'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function normalizeVercelRequest(req: any) {
  if (!req) return;

  // 1. Check Vercel proxy matched path headers
  const matchedPath =
    req.headers?.['x-matched-path'] ||
    req.headers?.['x-vercel-matched-path'] ||
    req.headers?.['x-forwarded-uri'] ||
    req.headers?.['x-original-uri'];

  if (typeof matchedPath === 'string' && matchedPath.startsWith('/api')) {
    const queryIndex = typeof req.url === 'string' ? req.url.indexOf('?') : -1;
    const query = queryIndex !== -1 ? req.url.substring(queryIndex) : '';
    req.url = matchedPath.includes('?') ? matchedPath : `${matchedPath}${query}`;
    return;
  }

  // 2. Check query path parameter passed by vercel.json rewrite (/api?path=$1) or [...path].ts
  if (req.query?.path) {
    const rawPath = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path);
    const cleanPath = rawPath.replace(/^\/+/, '');
    let queryString = '';
    try {
      const urlObj = new URL(req.url || '/', 'http://localhost');
      urlObj.searchParams.delete('path');
      queryString = urlObj.search;
    } catch (e) {
      // ignore
    }
    req.url = `/api/${cleanPath}${queryString}`;
    return;
  }

  // 3. Fallback: normalize known API subroutes without /api prefix (e.g. /auth/login -> /api/auth/login)
  // Crucial: Do NOT rewrite '/' or frontend routes so root URL serves the frontend website.
  if (typeof req.url === 'string') {
    if (
      req.url.startsWith('/auth') ||
      req.url.startsWith('/config') ||
      req.url.startsWith('/listings') ||
      req.url.startsWith('/my') ||
      req.url.startsWith('/requests') ||
      req.url.startsWith('/conversations') ||
      req.url.startsWith('/upload')
    ) {
      req.url = `/api${req.url}`;
      return;
    }
  }
}

// Interface for database storage
interface StoredUser extends StudentUser {
  passwordHash: string;
}

interface StoredSession {
  token: string;
  userId: string;
  createdAt: string;
}

interface StoredReport {
  id: string;
  reporterId: string;
  reporterRoll: string;
  conversationId: string;
  reason: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  sessions: StoredSession[];
  listings: ComponentItem[];
  requests: ItemRequest[];
  branches: string[];
  conversations: Conversation[];
  messages: ChatMessage[];
  reports: StoredReport[];
  uploads?: Record<string, string>;
}

// Password Hashing using Node.js scrypt
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (err) {
    return false;
  }
}

// Ensure database file exists
function loadDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      // ignore in read-only environments
    }
  }

  // On Vercel / serverless runtime, initialize /tmp from bundled seed if not yet present
  const seedPath = getSeedDbPath();
  if (!fs.existsSync(DB_FILE) && seedPath) {
    try {
      const initialContent = fs.readFileSync(seedPath, 'utf-8');
      fs.writeFileSync(DB_FILE, initialContent, 'utf-8');
    } catch (e) {
      console.warn('Could not initialize DB in /tmp, falling back to source DB:', e);
    }
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data: DatabaseSchema = JSON.parse(content);
      if (!data.conversations) data.conversations = [];
      if (!data.messages) data.messages = [];
      if (!data.reports) data.reports = [];
      if (!data.requests) data.requests = [];
      if (!data.branches) data.branches = DEFAULT_BRANCHES;
      return data;
    } catch (e) {
      console.error('Failed to parse database, reinitializing...', e);
    }
  }

  // Fallback to reading bundled DB directly if DB_FILE was not readable
  if (seedPath) {
    try {
      const content = fs.readFileSync(seedPath, 'utf-8');
      const data: DatabaseSchema = JSON.parse(content);
      return data;
    } catch (e) {
      // fallback
    }
  }

  // Initial seed with sample accounts & initial inventory
  const defaultUsers: StoredUser[] = [
    {
      id: 'usr-vasavi-01',
      name: 'Praveen Kumar',
      rollNumber: '25A81A4300', // Matches sample from prompt
      branch: 'Artificial Intelligence & Data Science (AI & DS)',
      mobile: '9876543210',
      year: '2nd Year',
      shareMobilePublicly: false,
      passwordHash: hashPassword('Password123'),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-vasavi-02',
      name: 'Bhavya Sri',
      rollNumber: '21A81A0501',
      branch: 'Computer Science & Engineering (CSE)',
      mobile: '9848022338',
      year: '4th Year',
      shareMobilePublicly: true,
      passwordHash: hashPassword('Password123'),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-vasavi-03',
      name: 'Kiran Teja',
      rollNumber: '25A81A0401',
      branch: 'Electronics & Communication Engineering (ECE)',
      mobile: '9123456780',
      year: '1st Year',
      shareMobilePublicly: false,
      passwordHash: hashPassword('Password123'),
      createdAt: new Date().toISOString(),
    },
  ];

  const demoConvId = 'conv-demo-01';
  const initialConversations: Conversation[] = [
    {
      id: demoConvId,
      listingId: 'c2c-001',
      listingTitle: 'Arduino Uno R3 Microcontroller Board (with USB A-B Cable)',
      listingPrice: '₹40 / week (sample)',
      listingTransactionType: 'rent',
      listingCategory: 'Microcontrollers',
      listingIconType: 'microcontroller',
      sellerId: 'usr-vasavi-02',
      sellerName: 'Bhavya Sri',
      sellerRollNumber: '21A81A0501',
      sellerBranch: 'Computer Science & Engineering (CSE)',
      buyerId: 'usr-vasavi-01',
      buyerName: 'Praveen Kumar',
      buyerRollNumber: '25A81A4300',
      buyerBranch: 'Artificial Intelligence & Data Science (AI & DS)',
      buyerYear: '2nd Year',
      lastMessageText: 'Sounds good! I can meet you tomorrow at 1:30 PM near the central library foyer.',
      lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      isBlocked: false,
      reportCount: 0,
    },
  ];

  const initialMessages: ChatMessage[] = [
    {
      id: 'msg-01',
      conversationId: demoConvId,
      senderId: 'usr-vasavi-01',
      senderName: 'Praveen Kumar',
      senderRollNumber: '25A81A4300',
      text: 'Hi Bhavya! Is the Arduino Uno still available for a 2-week lab rental for our AI & DS embedded systems practicals?',
      createdAt: new Date(Date.now() - 7000000).toISOString(),
      readBy: ['usr-vasavi-01', 'usr-vasavi-02'],
    },
    {
      id: 'msg-02',
      conversationId: demoConvId,
      senderId: 'usr-vasavi-02',
      senderName: 'Bhavya Sri',
      senderRollNumber: '21A81A0501',
      text: 'Yes Praveen, it is tested and working! I just verified the blink sketch with the CH340 driver. Comes with the USB A-B cable too.',
      createdAt: new Date(Date.now() - 5400000).toISOString(),
      readBy: ['usr-vasavi-01', 'usr-vasavi-02'],
    },
    {
      id: 'msg-03',
      conversationId: demoConvId,
      senderId: 'usr-vasavi-01',
      senderName: 'Praveen Kumar',
      senderRollNumber: '25A81A4300',
      text: 'Great! Where on campus can we meet to test and handover?',
      createdAt: new Date(Date.now() - 4000000).toISOString(),
      readBy: ['usr-vasavi-01', 'usr-vasavi-02'],
    },
    {
      id: 'msg-04',
      conversationId: demoConvId,
      senderId: 'usr-vasavi-02',
      senderName: 'Bhavya Sri',
      senderRollNumber: '21A81A0501',
      text: 'Sounds good! I can meet you tomorrow at 1:30 PM near the central library foyer.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      readBy: ['usr-vasavi-02'], // Unread for Praveen until opened!
    },
  ];

  const initialDb: DatabaseSchema = {
    users: defaultUsers,
    sessions: [],
    listings: INITIAL_COMPONENTS,
    requests: [],
    branches: DEFAULT_BRANCHES,
    conversations: initialConversations,
    messages: initialMessages,
    reports: [],
  };

    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    } catch (e) {
      // ignore in read-only environments
    }
    return initialDb;
  }

  let db = loadDatabase();
  let lastDbMtime = 0;
  try {
    if (fs.existsSync(DB_FILE)) {
      lastDbMtime = fs.statSync(DB_FILE).mtimeMs;
    }
  } catch (e) {}

  export function reloadDatabaseIfChanged() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const stats = fs.statSync(DB_FILE);
        if (stats.mtimeMs > lastDbMtime) {
          const content = fs.readFileSync(DB_FILE, 'utf-8');
          db = JSON.parse(content);
          lastDbMtime = stats.mtimeMs;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  function saveDatabase() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        try {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        } catch (e) {
          // ignore
        }
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
      try {
        lastDbMtime = fs.statSync(DB_FILE).mtimeMs;
      } catch (e) {}
    } catch (err) {
      console.warn('Could not save database to disk:', err);
    }
  }

// --- Persistent Database & Cryptographic Session Architecture ---

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.JWT_SECRET ||
  process.env.SESSION_SECRET ||
  'circuit2circuit-srivasavi-autonomous-key-2026';

interface SignedSessionPayload {
  userId: string;
  rollNumber: string;
  name: string;
  branch: string;
  year: string;
  exp: number;
}

export function createSignedSessionToken(user: StoredUser): string {
  const payload: SignedSessionPayload = {
    userId: user.id,
    rollNumber: user.rollNumber.trim().toUpperCase(),
    name: user.name,
    branch: user.branch,
    year: user.year,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days session
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payloadB64).digest('base64url');
  return `c2c_${payloadB64}.${signature}`;
}

export function verifySignedSessionToken(token: string): SignedSessionPayload | null {
  if (!token || !token.startsWith('c2c_')) return null;
  const raw = token.slice(4);
  const dotIndex = raw.lastIndexOf('.');
  if (dotIndex === -1) return null;
  const payloadB64 = raw.slice(0, dotIndex);
  const signature = raw.slice(dotIndex + 1);

  const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(payloadB64).digest('base64url');
  if (signature !== expectedSig) return null;

  try {
    const payload: SignedSessionPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// PostgreSQL Connection Pool Setup
const PG_CONN_STRING =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.PGURI ||
  '';

let pgPool: pg.Pool | null = null;
let pgInitPromise: Promise<boolean> | null = null;

if (PG_CONN_STRING) {
  try {
    pgPool = new pg.Pool({
      connectionString: PG_CONN_STRING,
      ssl: PG_CONN_STRING.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  } catch (e) {
    console.error('Failed to create PostgreSQL pool:', e);
  }
}

async function ensurePgSchema(): Promise<boolean> {
  if (!pgPool) return false;
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS c2c_users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        roll_number VARCHAR(32) UNIQUE NOT NULL,
        branch VARCHAR(255) NOT NULL,
        mobile VARCHAR(32) NOT NULL,
        year VARCHAR(32) NOT NULL,
        share_mobile_publicly BOOLEAN NOT NULL DEFAULT FALSE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_c2c_users_roll ON c2c_users (UPPER(roll_number));

      CREATE TABLE IF NOT EXISTS c2c_sessions (
        token TEXT PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS c2c_listings (
        id VARCHAR(64) PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Seed default users if empty
    const checkCount = await pgPool.query('SELECT COUNT(*) as count FROM c2c_users');
    if (parseInt(checkCount.rows[0].count, 10) === 0 && db.users && db.users.length > 0) {
      for (const u of db.users) {
        await pgPool.query(
          `INSERT INTO c2c_users (id, name, roll_number, branch, mobile, year, share_mobile_publicly, password_hash, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (roll_number) DO NOTHING`,
          [
            u.id,
            u.name,
            u.rollNumber.trim().toUpperCase(),
            u.branch,
            u.mobile,
            u.year,
            u.shareMobilePublicly,
            u.passwordHash,
            u.createdAt,
          ]
        );
      }
    }
    return true;
  } catch (err) {
    console.error('PostgreSQL ensurePgSchema failed:', err);
    return false;
  }
}

export async function findUserByRollNumber(rollNumber: string): Promise<StoredUser | null> {
  const cleanRoll = rollNumber.trim().toUpperCase();
  if (pgPool) {
    try {
      await (pgInitPromise ||= ensurePgSchema());
      const res = await pgPool.query(
        'SELECT id, name, roll_number AS "rollNumber", branch, mobile, year, share_mobile_publicly AS "shareMobilePublicly", password_hash AS "passwordHash", created_at AS "createdAt" FROM c2c_users WHERE UPPER(roll_number) = $1',
        [cleanRoll]
      );
      if (res.rows.length > 0) {
        const u = res.rows[0];
        return {
          id: u.id,
          name: u.name,
          rollNumber: u.rollNumber,
          branch: u.branch,
          mobile: u.mobile,
          year: u.year,
          shareMobilePublicly: Boolean(u.shareMobilePublicly),
          passwordHash: u.passwordHash,
          createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
        };
      }
    } catch (err) {
      console.error('PostgreSQL findUserByRollNumber error:', err);
      throw err;
    }
  }

  // Fallback to local memory & disk database
  reloadDatabaseIfChanged();
  const mem = db.users.find((u) => u.rollNumber.trim().toUpperCase() === cleanRoll);
  return mem || null;
}

export async function findUserById(userId: string): Promise<StoredUser | null> {
  if (pgPool) {
    try {
      await (pgInitPromise ||= ensurePgSchema());
      const res = await pgPool.query(
        'SELECT id, name, roll_number AS "rollNumber", branch, mobile, year, share_mobile_publicly AS "shareMobilePublicly", password_hash AS "passwordHash", created_at AS "createdAt" FROM c2c_users WHERE id = $1',
        [userId]
      );
      if (res.rows.length > 0) {
        const u = res.rows[0];
        return {
          id: u.id,
          name: u.name,
          rollNumber: u.rollNumber,
          branch: u.branch,
          mobile: u.mobile,
          year: u.year,
          shareMobilePublicly: Boolean(u.shareMobilePublicly),
          passwordHash: u.passwordHash,
          createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
        };
      }
    } catch (err) {
      console.error('PostgreSQL findUserById error:', err);
    }
  }

  reloadDatabaseIfChanged();
  const mem = db.users.find((u) => u.id === userId);
  return mem || null;
}

export async function saveNewUser(newUser: StoredUser): Promise<void> {
  const cleanRoll = newUser.rollNumber.trim().toUpperCase();
  const sanitizedUser = { ...newUser, rollNumber: cleanRoll };

  // Always update memory & disk cache
  const idx = db.users.findIndex((u) => u.rollNumber.trim().toUpperCase() === cleanRoll);
  if (idx !== -1) {
    db.users[idx] = sanitizedUser;
  } else {
    db.users.push(sanitizedUser);
  }
  saveDatabase();

  if (pgPool) {
    try {
      await (pgInitPromise ||= ensurePgSchema());
      await pgPool.query(
        `INSERT INTO c2c_users (id, name, roll_number, branch, mobile, year, share_mobile_publicly, password_hash, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (roll_number) DO UPDATE SET
           name = EXCLUDED.name,
           branch = EXCLUDED.branch,
           mobile = EXCLUDED.mobile,
           year = EXCLUDED.year,
           share_mobile_publicly = EXCLUDED.share_mobile_publicly,
           password_hash = EXCLUDED.password_hash`,
        [
          sanitizedUser.id,
          sanitizedUser.name,
          sanitizedUser.rollNumber,
          sanitizedUser.branch,
          sanitizedUser.mobile,
          sanitizedUser.year,
          sanitizedUser.shareMobilePublicly,
          sanitizedUser.passwordHash,
          sanitizedUser.createdAt,
        ]
      );
    } catch (err) {
      console.error('PostgreSQL saveNewUser error:', err);
      throw err;
    }
  }
}

export async function saveSession(token: string, userId: string): Promise<void> {
  db.sessions.push({ token, userId, createdAt: new Date().toISOString() });
  saveDatabase();

  if (pgPool) {
    try {
      await (pgInitPromise ||= ensurePgSchema());
      await pgPool.query(
        'INSERT INTO c2c_sessions (token, user_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (token) DO NOTHING',
        [token, userId]
      );
    } catch (err) {
      console.error('PostgreSQL saveSession error:', err);
    }
  }
}

export async function deleteSession(token: string): Promise<void> {
  db.sessions = db.sessions.filter((s) => s.token !== token);
  saveDatabase();

  if (pgPool) {
    try {
      await (pgInitPromise ||= ensurePgSchema());
      await pgPool.query('DELETE FROM c2c_sessions WHERE token = $1', [token]);
    } catch (err) {
      console.error('PostgreSQL deleteSession error:', err);
    }
  }
}

// Authentication Middleware
interface AuthenticatedRequest extends Request {
  currentUser?: StoredUser;
  sessionToken?: string;
}

async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7).trim();

  // 1. Verify Cryptographic Signed Session Token (Stateless across all serverless lambda containers)
  const tokenPayload = verifySignedSessionToken(token);
  if (tokenPayload) {
    try {
      const user = await findUserById(tokenPayload.userId);
      if (user) {
        req.currentUser = user;
        req.sessionToken = token;
        return next();
      }
      // Reconstruct safe student user from verified cryptographic token payload
      req.currentUser = {
        id: tokenPayload.userId,
        name: tokenPayload.name,
        rollNumber: tokenPayload.rollNumber,
        branch: tokenPayload.branch,
        mobile: '',
        year: tokenPayload.year as StudentUser['year'],
        shareMobilePublicly: false,
        passwordHash: '',
        createdAt: new Date().toISOString(),
      };
      req.sessionToken = token;
      return next();
    } catch (e) {
      // Fallback to traditional sessions
    }
  }

  // 2. Check traditional session token
  reloadDatabaseIfChanged();
  const session = db.sessions.find((s) => s.token === token);
  if (session) {
    const user = await findUserById(session.userId);
    if (user) {
      req.currentUser = user;
      req.sessionToken = token;
    }
  }
  next();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.currentUser) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in with your Sri Vasavi Engineering College credentials.',
    });
  }
  next();
}

// Sanitize user object (strip passwordHash)
function sanitizeUser(user: StoredUser): StudentUser {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

// Clean price and scrub private phone numbers from public listings
function sanitizeListing(listing: ComponentItem, currentUserId?: string): ComponentItem {
  let cleanedPrice = listing.samplePrice ? listing.samplePrice.replace(/\s*\(sample.*?\)/gi, '').trim() : listing.samplePrice;
  
  // Attach verified product photos if missing on sample items and normalize legacy or local URLs
  let photoUrl = listing.photoUrl;
  if (photoUrl) {
    // Strip localhost or loopback URLs
    photoUrl = photoUrl.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i, '').trim();

    if (photoUrl.startsWith('/src/assets/images/')) {
      photoUrl = photoUrl.replace('/src/assets/images/', '/assets/images/');
    } else if (photoUrl.startsWith('src/assets/images/')) {
      photoUrl = photoUrl.replace('src/assets/images/', '/assets/images/');
    }

    // If listing references an uploaded file and we have it in db.uploads, inline data URI for 100% serverless persistence
    if (photoUrl.startsWith('/uploads/') || photoUrl.startsWith('/api/uploads/')) {
      const fileId = path.basename(photoUrl.split('?')[0]);
      if (db.uploads && db.uploads[fileId]) {
        photoUrl = db.uploads[fileId];
      }
    }
  }

  if (!photoUrl && listing.name) {
    const lower = listing.name.toLowerCase();
    if (lower.includes('nano')) {
      photoUrl = '/assets/images/arduino_nano_1793034898186.jpg';
    } else if (lower.includes('uno')) {
      photoUrl = '/assets/images/arduino_uno_1792860916720.jpg';
    } else if (lower.includes('breadboard')) {
      photoUrl = '/assets/images/solderless_breadboard_1793035175411.jpg';
    } else if (lower.includes('resistor')) {
      photoUrl = '/assets/images/resistor_assortment_1793035150193.jpg';
    } else if (lower.includes('jumper wire') || lower.includes('dupont')) {
      photoUrl = '/assets/images/jumper_wires_1793035149920.jpg';
    } else if (lower.includes('ultrasonic') || lower.includes('hc-sr04')) {
      photoUrl = '/assets/images/ultrasonic_sensor_1792860917671.jpg';
    } else if (lower.includes('capacitor')) {
      photoUrl = '/assets/images/capacitors_pack_1793035151474.jpg';
    } else if (lower.includes('esp32')) {
      photoUrl = '/assets/images/esp32_devkit_1792860917627.jpg';
    } else if (lower.includes('multimeter')) {
      photoUrl = '/assets/images/multimeter_dt830d_1793035151171.jpg';
    } else if (lower.includes('pir') || lower.includes('hc-sr501') || lower.includes('motion sensor')) {
      photoUrl = '/assets/images/pir_sensor_1792860918387.jpg';
    } else if (lower.includes('soil moisture')) {
      photoUrl = '/assets/images/soil_moisture_sensor_1792860929432.jpg';
    } else if (lower.includes('obstacle') || lower.includes('ir sensor')) {
      photoUrl = '/assets/images/ir_sensor_1792860930042.jpg';
    } else if (lower.includes('dht11') || lower.includes('temperature & relative humidity') || lower.includes('temperature and humidity')) {
      photoUrl = '/assets/images/dht11_sensor_1792860918160.jpg';
    }
  }

  let photoUrls = listing.photoUrls;
  if (Array.isArray(photoUrls) && photoUrls.length > 0) {
    photoUrls = photoUrls.map((u) => {
      let clean = u.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i, '').trim();
      if (clean.startsWith('/src/assets/images/')) clean = clean.replace('/src/assets/images/', '/assets/images/');
      if (clean.startsWith('src/assets/images/')) clean = clean.replace('src/assets/images/', '/assets/images/');
      if (clean.startsWith('/uploads/') || clean.startsWith('/api/uploads/')) {
        const fileId = path.basename(clean.split('?')[0]);
        if (db.uploads && db.uploads[fileId]) {
          clean = db.uploads[fileId];
        }
      }
      return clean;
    });
  } else if (photoUrl) {
    photoUrls = [photoUrl];
  }

  const cleanListing = { ...listing, samplePrice: cleanedPrice, photoUrl, photoUrls };

  // If user is owner or if seller opted in to share mobile publicly, include mobile
  if (cleanListing.sellerShareMobile || (cleanListing.sellerId && cleanListing.sellerId === currentUserId)) {
    return cleanListing;
  }
  // Otherwise, hide seller mobile
  const { sellerMobile, ...safeListing } = cleanListing;
  return { ...safeListing, sellerMobile: undefined };
}

export function createApp(): express.Application {
  const app = express();
  const UPLOADS_DIR = isVercel ? path.join('/tmp', 'c2c-uploads') : path.join(__dirname, 'public', 'uploads');
  const STATIC_UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
  const PUBLIC_ASSETS_DIR = path.join(__dirname, 'public', 'assets');
  const SRC_ASSETS_DIR = path.join(__dirname, 'src', 'assets');

  if (!fs.existsSync(UPLOADS_DIR)) {
    try {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    } catch (e) {
      // ignore
    }
  }

  app.use(express.json({ limit: '10mb' }));

  // Enable CORS headers for cross-origin requests & iframe previews
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Normalize incoming URLs for Vercel rewrites and sync database state
  app.use((req: Request, _res: Response, next: NextFunction) => {
    reloadDatabaseIfChanged();
    normalizeVercelRequest(req);
    next();
  });

  // Static routes for image assets across both dev and production Express servers
  app.use('/uploads', express.static(UPLOADS_DIR));
  if (UPLOADS_DIR !== STATIC_UPLOADS_DIR && fs.existsSync(STATIC_UPLOADS_DIR)) {
    app.use('/uploads', express.static(STATIC_UPLOADS_DIR));
  }
  app.use('/assets', express.static(PUBLIC_ASSETS_DIR));
  app.use('/assets', express.static(SRC_ASSETS_DIR));
  app.use('/src/assets', express.static(SRC_ASSETS_DIR));
  app.use('/src/assets', express.static(PUBLIC_ASSETS_DIR));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(authMiddleware);

  // Dynamic serving of student-uploaded images across dev, standalone Node, and serverless runtimes
  app.get(['/api/uploads/:file', '/uploads/:file'], (req: Request, res: Response) => {
    const fileName = req.params.file;
    if (!fileName || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).send('Invalid filename.');
    }
    const candidates = [
      path.join(UPLOADS_DIR, fileName),
      path.join(STATIC_UPLOADS_DIR, fileName),
      path.join(process.cwd(), 'public', 'uploads', fileName),
      path.join(process.cwd(), 'dist', 'uploads', fileName),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        const ext = path.extname(candidate).toLowerCase();
        let contentType = 'image/jpeg';
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.gif') contentType = 'image/gif';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        return res.sendFile(candidate);
      }
    }

    // If not found on disk, restore from persistent database uploads store
    if (db.uploads && db.uploads[fileName]) {
      try {
        const dataUri = db.uploads[fileName];
        const matches = dataUri.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/i);
        if (matches) {
          const contentType = matches[1].toLowerCase();
          const buffer = Buffer.from(matches[2], 'base64');
          try {
            fs.writeFileSync(path.join(UPLOADS_DIR, fileName), buffer);
          } catch (e) {}
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
          return res.send(buffer);
        }
      } catch (err) {
        console.error('Failed to restore photo from database uploads:', err);
      }
    }

    return res.status(404).send('Photo not found');
  });

  // Dedicated API Health Check Endpoint (keeps root / dedicated to the frontend website)
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Circuit2Circuit API',
      environment: isVercel ? 'vercel-serverless' : 'node',
      timestamp: new Date().toISOString(),
    });
  });

  // --- API Endpoints ---

  // Upload Photo Endpoint (Base64 / Image file)
  app.post(['/api/upload', '/upload'], requireAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { image, filename } = req.body || {};
      if (!image || typeof image !== 'string') {
        return res.status(400).json({ error: 'Image data is required.' });
      }

      // Match base64 data URI format
      const matches = image.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/i);
      let buffer: Buffer;
      let ext = 'jpg';
      let normalizedDataUri = image;

      if (matches && matches.length === 3) {
        const mime = matches[1].toLowerCase();
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('gif')) ext = 'gif';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(image, 'base64');
        // Validate magic bytes for image format
        if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
          ext = 'png';
        } else if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
          ext = 'jpg';
        } else if (buffer.length >= 12 && buffer.toString('utf-8', 0, 4) === 'RIFF' && buffer.toString('utf-8', 8, 12) === 'WEBP') {
          ext = 'webp';
        } else {
          return res.status(400).json({ error: 'Invalid image format. Please upload a valid JPG, PNG, or WebP photo.' });
        }
        normalizedDataUri = `data:image/${ext};base64,${buffer.toString('base64')}`;
      }

      // Check size limit: 5MB max
      if (buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'Image file size exceeds the 5MB campus upload limit.' });
      }

      const fileId = `item_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, fileId);
      fs.writeFileSync(filePath, buffer);

      // Also copy to STATIC_UPLOADS_DIR if different and writable
      if (STATIC_UPLOADS_DIR !== UPLOADS_DIR && fs.existsSync(STATIC_UPLOADS_DIR)) {
        try {
          fs.writeFileSync(path.join(STATIC_UPLOADS_DIR, fileId), buffer);
        } catch (e) {}
      }

      // Persist to database uploads store so it survives serverless container recycles
      db.uploads = db.uploads || {};
      db.uploads[fileId] = normalizedDataUri;
      saveDatabase();

      const localPath = `/uploads/${fileId}`;
      return res.status(201).json({
        message: 'Photo uploaded successfully.',
        photoUrl: normalizedDataUri,
        localPath,
        fileId,
      });
    } catch (err: any) {
      console.error('Upload failed:', err);
      return res.status(500).json({ error: 'Failed to process and store image upload.' });
    }
  });

  // 1. Get Configurable Branches
  app.get(['/api/config/branches', '/config/branches'], (_req: Request, res: Response) => {
    try {
      res.json({
        collegeName: 'Sri Vasavi Engineering College (Autonomous)',
        collegeCode: 'A8',
        branches: db.branches,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch branch configuration.' });
    }
  });

  // 2. Student Registration
  app.post(['/api/auth/register', '/auth/register'], async (req: Request, res: Response) => {
    try {
      const { name, rollNumber, branch, mobile, year, password, shareMobilePublicly } = req.body || {};

      // Validate Name
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: 'Please enter your full student name (minimum 2 characters).' });
      }

      // Validate Sri Vasavi Roll Number
      const rollValidation = validateVasaviRollNumber(rollNumber);
      if (!rollValidation.isValid) {
        return res.status(400).json({ error: rollValidation.error });
      }
      const cleanRoll = rollValidation.normalized.trim().toUpperCase();

      // Check uniqueness of Roll Number in persistent database
      let existing: StoredUser | null = null;
      try {
        existing = await findUserByRollNumber(cleanRoll);
      } catch (dbErr: any) {
        console.error('Database connection error during roll check:', dbErr);
        return res.status(500).json({
          error: 'Database connection error while checking roll number availability. Please try again.',
        });
      }

      if (existing) {
        return res.status(409).json({
          error: `A student account with roll number ${cleanRoll} is already registered. Please sign in instead.`,
        });
      }

      // Validate Branch
      if (!branch || !db.branches.includes(branch)) {
        return res.status(400).json({
          error: 'Please select a valid BTech branch from the college-approved branch list.',
        });
      }

      // Validate Year of study
      const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
      if (!year || !validYears.includes(year)) {
        return res.status(400).json({
          error: 'Please select your current BTech year of study (1st, 2nd, 3rd, or 4th Year).',
        });
      }

      // Validate Mobile Number
      const mobileValidation = validateMobileNumber(mobile);
      if (!mobileValidation.isValid) {
        return res.status(400).json({ error: mobileValidation.error });
      }

      // Validate Password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ error: passwordValidation.error });
      }

      // Create New Student Account
      const newUser: StoredUser = {
        id: `usr-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name: name.trim(),
        rollNumber: cleanRoll,
        branch,
        mobile: mobileValidation.normalized,
        year: year as StudentUser['year'],
        shareMobilePublicly: Boolean(shareMobilePublicly),
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
      };

      try {
        await saveNewUser(newUser);
      } catch (saveErr: any) {
        console.error('Database error saving new user:', saveErr);
        return res.status(500).json({
          error: 'Database error saving student account. Please verify database connection settings.',
        });
      }

      // Create Cryptographic Session Token (Stateless across Vercel serverless containers)
      const sessionToken = createSignedSessionToken(newUser);
      await saveSession(sessionToken, newUser.id);

      return res.status(201).json({
        message: `Student account created successfully. Welcome, ${newUser.name}!`,
        token: sessionToken,
        user: sanitizeUser(newUser),
      });
    } catch (err: any) {
      console.error('Registration failed:', err);
      return res.status(500).json({ error: 'Account registration failed due to a server error. Please try again.' });
    }
  });

  // 3. Student Sign-In
  app.post(['/api/auth/login', '/auth/login'], async (req: Request, res: Response) => {
    try {
      const { rollNumber, password } = req.body || {};

      if (!rollNumber || !password) {
        return res.status(400).json({ error: 'Please enter both your college roll number and password.' });
      }

      const cleanRoll = String(rollNumber).trim().toUpperCase();

      let user: StoredUser | null = null;
      try {
        user = await findUserByRollNumber(cleanRoll);
      } catch (dbErr: any) {
        console.error('Database error during sign-in lookup:', dbErr);
        return res.status(500).json({
          error: 'Database connection error during sign-in. Please try again in a moment.',
        });
      }

      if (!user) {
        return res.status(401).json({
          error: `No registered student account found for roll number ${cleanRoll}. Please check your roll number or register a new account.`,
        });
      }

      if (!verifyPassword(String(password), user.passwordHash)) {
        return res.status(401).json({
          error: `Incorrect password for roll number ${cleanRoll}. Please verify your password and try again.`,
        });
      }

      // Issue Cryptographic Session Token (survives container recycling and navigation)
      const sessionToken = createSignedSessionToken(user);
      await saveSession(sessionToken, user.id);

      return res.json({
        message: `Welcome back, ${user.name}!`,
        token: sessionToken,
        user: sanitizeUser(user),
      });
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      return res.status(500).json({ error: 'Sign-in failed due to an internal server error. Please try again.' });
    }
  });

  // 4. Student Sign-Out
  app.post(['/api/auth/logout', '/auth/logout'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.sessionToken) {
        await deleteSession(req.sessionToken);
      }
      return res.json({ message: 'Signed out successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Sign-out failed.' });
    }
  });

  // 5. Current Authenticated Profile
  app.get(['/api/auth/me', '/auth/me'], requireAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      return res.json({ user: sanitizeUser(req.currentUser!) });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve user profile.' });
    }
  });

  // 6. Update Profile
  app.put(['/api/auth/profile', '/auth/profile'], requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const { name, branch, mobile, year, shareMobilePublicly, currentPassword, newPassword } = req.body;

    // Name update
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters long.' });
      }
      user.name = name.trim();
    }

    // Branch update
    if (branch !== undefined) {
      if (!db.branches.includes(branch)) {
        return res.status(400).json({ error: 'Please choose an approved college branch.' });
      }
      user.branch = branch;
    }

    // Year update
    if (year !== undefined) {
      const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
      if (!validYears.includes(year)) {
        return res.status(400).json({ error: 'Invalid BTech year.' });
      }
      user.year = year;
    }

    // Mobile update
    if (mobile !== undefined) {
      const mobileVal = validateMobileNumber(mobile);
      if (!mobileVal.isValid) {
        return res.status(400).json({ error: mobileVal.error });
      }
      user.mobile = mobileVal.normalized;
    }

    // Privacy setting update
    if (shareMobilePublicly !== undefined) {
      user.shareMobilePublicly = Boolean(shareMobilePublicly);
      // Update any active listings owned by this user
      db.listings.forEach((l) => {
        if (l.sellerId === user.id) {
          l.sellerShareMobile = user.shareMobilePublicly;
          l.sellerMobile = user.shareMobilePublicly ? user.mobile : undefined;
        }
      });
    }

    // Optional Password Update
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password.' });
      }
      if (!verifyPassword(currentPassword, user.passwordHash)) {
        return res.status(401).json({ error: 'Incorrect current password.' });
      }
      const passVal = validatePassword(newPassword);
      if (!passVal.isValid) {
        return res.status(400).json({ error: passVal.error });
      }
      user.passwordHash = hashPassword(newPassword);
    }

    await saveNewUser(user);

    return res.json({
      message: 'Profile updated successfully.',
      user: sanitizeUser(user),
    });
  });

  // 7. Get Listings
  app.get('/api/listings', (req: AuthenticatedRequest, res: Response) => {
    const currentUserId = req.currentUser?.id;
    const sanitizedListings = db.listings.map((l) => sanitizeListing(l, currentUserId));
    res.json({ listings: sanitizedListings });
  });

  // 8. Create Listing (Enforcing Marketplace Rules & Security)
  app.post('/api/listings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const {
      name,
      category,
      categoryLabel,
      transactionType,
      samplePrice,
      priceNumeric,
      originalPriceNumeric,
      rentalPeriod,
      condition,
      pickupLocation,
      description,
      specs,
      recommendedLabs,
      targetYears,
      iconType,
      photoUrl,
      photoUrls,
    } = req.body;

    // Validate listing title
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return res.status(400).json({ error: 'Component name is required (at least 3 characters).' });
    }

    // Validate transaction type
    if (!['rent', 'sell', 'donate'].includes(transactionType)) {
      return res.status(400).json({ error: 'Invalid transaction type (must be rent, sell, or donate).' });
    }

    // ENFORCE MARKETPLACE RULES:
    // - 1st year cannot list items.
    // - 2nd & 3rd years can list items for rent or donate.
    // - 4th year can list items for sale or donate.
    const ruleCheck = validateListingPermissions(user.year, transactionType);
    if (!ruleCheck.isAllowed) {
      return res.status(403).json({ error: ruleCheck.message });
    }

    const photosList = Array.isArray(photoUrls) && photoUrls.length > 0 ? photoUrls : (photoUrl ? [photoUrl] : []);
    const primaryPhoto = photosList[0] || photoUrl;

    // Format display price based on transaction type
    let formattedPrice = samplePrice;
    if (transactionType === 'donate') {
      formattedPrice = 'Free (Donation)';
    } else if (transactionType === 'sell') {
      formattedPrice = `₹${priceNumeric || 0}`;
    } else if (transactionType === 'rent') {
      formattedPrice = `₹${priceNumeric || 0} / ${rentalPeriod || 'week'}`;
    }

    // Create new listing attached securely to authenticated student
    const newListing: ComponentItem = {
      id: `c2c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      category: category || 'microcontrollers',
      categoryLabel: categoryLabel || 'Microcontrollers',
      transactionType,
      samplePrice: formattedPrice,
      priceNumeric: transactionType === 'donate' ? 0 : (Number(priceNumeric) || 0),
      originalPriceNumeric: transactionType === 'sell' && originalPriceNumeric ? Number(originalPriceNumeric) : undefined,
      rentalPeriod: transactionType === 'rent' ? rentalPeriod : undefined,
      condition: condition || 'Gently Used (Tested OK)',
      sellerId: user.id,
      sellerName: user.name,
      sellerRollNumber: user.rollNumber,
      sellerYear: user.year,
      sellerDept: user.branch,
      sellerMobile: user.shareMobilePublicly ? user.mobile : undefined,
      sellerShareMobile: user.shareMobilePublicly,
      pickupLocation: pickupLocation || 'Campus Central Library / Department Foyer',
      description: description || 'Component tested and ready for campus peer handover.',
      specs: Array.isArray(specs) ? specs : [],
      recommendedLabs: Array.isArray(recommendedLabs) ? recommendedLabs : [],
      targetYears: Array.isArray(targetYears) && targetYears.length > 0 ? targetYears : ['All Years'],
      isAvailable: true,
      dateListed: 'Just now',
      iconType: iconType || 'microcontroller',
      photoUrl: primaryPhoto,
      photoUrls: photosList,
    };

    db.listings.unshift(newListing);
    saveDatabase();

    res.status(201).json({
      message: 'Component listed successfully on the campus marketplace.',
      listing: sanitizeListing(newListing, user.id),
    });
  });

  // 8b. Update Listing (Owner Only)
  app.put('/api/listings/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const listingId = req.params.id;

    const listing = db.listings.find((l) => l.id === listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    // Authorization: Owner only
    if (listing.sellerId && listing.sellerId !== user.id && listing.sellerRollNumber !== user.rollNumber) {
      return res.status(403).json({ error: 'You are only authorized to edit your own listings.' });
    }

    const {
      name,
      category,
      categoryLabel,
      transactionType,
      priceNumeric,
      originalPriceNumeric,
      rentalPeriod,
      condition,
      pickupLocation,
      description,
      specs,
      recommendedLabs,
      targetYears,
      photoUrl,
      photoUrls,
    } = req.body;

    if (name) listing.name = name.trim();
    if (category) listing.category = category;
    if (categoryLabel) listing.categoryLabel = categoryLabel;
    if (transactionType) listing.transactionType = transactionType;
    if (condition) listing.condition = condition;
    if (pickupLocation) listing.pickupLocation = pickupLocation.trim();
    if (description) listing.description = description.trim();
    if (Array.isArray(specs)) listing.specs = specs;
    if (Array.isArray(recommendedLabs)) listing.recommendedLabs = recommendedLabs;
    if (Array.isArray(targetYears)) listing.targetYears = targetYears;

    const photosList = Array.isArray(photoUrls) ? photoUrls : (photoUrl ? [photoUrl] : (listing.photoUrls || []));
    listing.photoUrls = photosList;
    listing.photoUrl = photosList[0] || photoUrl || listing.photoUrl;

    if (priceNumeric !== undefined) listing.priceNumeric = Number(priceNumeric) || 0;
    if (originalPriceNumeric !== undefined) listing.originalPriceNumeric = Number(originalPriceNumeric) || undefined;
    if (rentalPeriod !== undefined) listing.rentalPeriod = rentalPeriod;

    // Recalculate formatted price string
    if (listing.transactionType === 'donate') {
      listing.samplePrice = 'Free (Donation)';
    } else if (listing.transactionType === 'sell') {
      listing.samplePrice = `₹${listing.priceNumeric}`;
    } else if (listing.transactionType === 'rent') {
      listing.samplePrice = `₹${listing.priceNumeric} / ${listing.rentalPeriod || 'week'}`;
    }

    saveDatabase();

    res.json({
      message: 'Listing updated successfully.',
      listing: sanitizeListing(listing, user.id),
    });
  });

  // 9. Delete Listing (Owner Only)
  app.delete('/api/listings/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const listingId = req.params.id;

    const listingIndex = db.listings.findIndex((l) => l.id === listingId);
    if (listingIndex === -1) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    const listing = db.listings[listingIndex];
    // Check ownership
    if (listing.sellerId && listing.sellerId !== user.id && listing.sellerRollNumber !== user.rollNumber) {
      return res.status(403).json({ error: 'You are only authorized to delete your own listings.' });
    }

    db.listings.splice(listingIndex, 1);
    saveDatabase();

    res.json({ message: 'Listing removed successfully.' });
  });

  // 10. Submit Item Request (Enforcing Requesting Rules)
  app.post('/api/requests', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const { itemId, preferredTime, notes } = req.body;

    const item = db.listings.find((l) => l.id === itemId);
    if (!item) {
      return res.status(404).json({ error: 'Requested component could not be found.' });
    }

    // Enforce requesting permissions
    const requestRule = validateRequestPermissions(user.year, item.transactionType);
    if (!requestRule.isAllowed) {
      return res.status(403).json({ error: requestRule.message });
    }

    const newRequest: ItemRequest = {
      id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemId: item.id,
      itemName: item.name,
      itemTransactionType: item.transactionType,
      samplePrice: item.samplePrice,
      sellerId: item.sellerId,
      sellerName: item.sellerName,
      sellerRollNumber: item.sellerRollNumber,
      requesterId: user.id,
      requesterName: user.name,
      requesterRollNumber: user.rollNumber,
      requesterBranch: user.branch,
      requesterYear: user.year,
      requesterMobile: user.mobile,
      preferredTime: preferredTime || 'Tomorrow during lunch break',
      notes: notes || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    db.requests.unshift(newRequest);
    saveDatabase();

    res.status(201).json({
      message: `Handover request sent to ${item.sellerName} (${item.sellerRollNumber}).`,
      request: newRequest,
    });
  });

  // 11. Get My Requests (Both sent and received)
  app.get('/api/my/requests', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;

    const sentRequests = db.requests.filter((r) => r.requesterId === user.id);
    const receivedRequests = db.requests.filter(
      (r) => (r.sellerId && r.sellerId === user.id) || r.sellerRollNumber === user.rollNumber
    );

    res.json({
      sent: sentRequests,
      received: receivedRequests,
    });
  });

  // 12. Update Request Status (Accept / Decline / Complete)
  app.put('/api/requests/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const requestId = req.params.id;
    const { status } = req.body;

    if (!['pending', 'accepted', 'declined', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid request status.' });
    }

    const reqItem = db.requests.find((r) => r.id === requestId);
    if (!reqItem) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    // Only seller or requester can update status
    const isSeller = reqItem.sellerId === user.id || reqItem.sellerRollNumber === user.rollNumber;
    const isRequester = reqItem.requesterId === user.id;

    if (!isSeller && !isRequester) {
      return res.status(403).json({ error: 'Unauthorized to modify this request.' });
    }

    reqItem.status = status;
    saveDatabase();

    res.json({ message: `Request status updated to ${status}.`, request: reqItem });
  });

  // 13. My Active Listings
  app.get('/api/my/listings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const myListings = db.listings.filter(
      (l) => (l.sellerId && l.sellerId === user.id) || l.sellerRollNumber === user.rollNumber
    );
    res.json({ listings: myListings });
  });

  // --- 14. OLX-Style In-App Chat Routes ---

  // Get all conversations for current student
  app.get('/api/conversations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;

    const userConvs = db.conversations
      .filter((c) => c.buyerId === user.id || c.sellerId === user.id)
      .map((c) => {
        // Calculate unread count for current user
        const unreadCount = db.messages.filter(
          (m) => m.conversationId === c.id && m.senderId !== user.id && !m.readBy.includes(user.id)
        ).length;
        return {
          ...c,
          unreadCount,
        };
      })
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    res.json({ conversations: userConvs });
  });

  // Get total unread count across all conversations (for header badge)
  app.get('/api/conversations/unread-total', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const total = db.messages.filter(
      (m) => {
        const conv = db.conversations.find((c) => c.id === m.conversationId);
        if (!conv) return false;
        const isParticipant = conv.buyerId === user.id || conv.sellerId === user.id;
        return isParticipant && m.senderId !== user.id && !m.readBy.includes(user.id);
      }
    ).length;

    res.json({ totalUnread: total });
  });

  // Start or open a conversation from a listing
  app.post('/api/conversations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const { listingId, initialMessage } = req.body;

    const listing = db.listings.find((l) => l.id === listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    // Determine seller: use listing.sellerId if set, otherwise find by roll number
    let seller = listing.sellerId ? db.users.find((u) => u.id === listing.sellerId) : null;
    if (!seller && listing.sellerRollNumber) {
      seller = db.users.find((u) => u.rollNumber.toUpperCase() === listing.sellerRollNumber.toUpperCase()) || null;
    }

    const sellerId = seller ? seller.id : (listing.sellerId || `seller-${listing.sellerRollNumber}`);
    const sellerName = seller ? seller.name : listing.sellerName;
    const sellerRollNumber = seller ? seller.rollNumber : listing.sellerRollNumber;
    const sellerBranch = seller ? seller.branch : listing.sellerDept;

    // Prohibit chatting with yourself
    if (user.id === sellerId || user.rollNumber.toUpperCase() === sellerRollNumber.toUpperCase()) {
      return res.status(400).json({ error: 'This is your own listing. You cannot start a chat with yourself.' });
    }

    // Check if conversation already exists between this buyer and seller for this listing
    let existingConv = db.conversations.find(
      (c) => c.listingId === listing.id && c.buyerId === user.id && (c.sellerId === sellerId || c.sellerRollNumber === sellerRollNumber)
    );

    if (existingConv) {
      if (initialMessage && initialMessage.trim()) {
        const newMsg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          conversationId: existingConv.id,
          senderId: user.id,
          senderName: user.name,
          senderRollNumber: user.rollNumber,
          text: initialMessage.trim(),
          type: 'text',
          createdAt: new Date().toISOString(),
          readBy: [user.id],
        };
        db.messages.push(newMsg);
        existingConv.lastMessageText = newMsg.text;
        existingConv.lastMessageAt = newMsg.createdAt;
        saveDatabase();
      }
      return res.json({ conversation: existingConv });
    }

    // Create new conversation
    const newConvId = `conv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const defaultInitial = initialMessage?.trim() || `Hi ${sellerName}, is "${listing.name}" still available?`;

    const newConv: Conversation = {
      id: newConvId,
      listingId: listing.id,
      listingTitle: listing.name,
      listingPrice: listing.samplePrice,
      listingTransactionType: listing.transactionType,
      listingCategory: listing.categoryLabel,
      listingIconType: listing.iconType,
      sellerId,
      sellerName,
      sellerRollNumber,
      sellerBranch,
      buyerId: user.id,
      buyerName: user.name,
      buyerRollNumber: user.rollNumber,
      buyerBranch: user.branch,
      buyerYear: user.year,
      lastMessageText: defaultInitial,
      lastMessageAt: now,
      isBlocked: false,
      reportCount: 0,
      createdAt: now,
    };

    const firstMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      conversationId: newConvId,
      senderId: user.id,
      senderName: user.name,
      senderRollNumber: user.rollNumber,
      text: defaultInitial,
      type: 'text',
      createdAt: now,
      readBy: [user.id],
    };

    db.conversations.unshift(newConv);
    db.messages.push(firstMsg);
    saveDatabase();

    res.status(201).json({ conversation: newConv });
  });

  // Get specific conversation messages and mark as read
  app.get('/api/conversations/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const convId = req.params.id;

    const conv = db.conversations.find((c) => c.id === convId);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Authorization: Must be participant
    const isParticipant = conv.buyerId === user.id || conv.sellerId === user.id || conv.sellerRollNumber === user.rollNumber;
    if (!isParticipant) {
      return res.status(403).json({ error: 'Unauthorized to view this conversation.' });
    }

    // Mark messages from other user as read
    let updatedRead = false;
    db.messages.forEach((m) => {
      if (m.conversationId === convId && m.senderId !== user.id && !m.readBy.includes(user.id)) {
        m.readBy.push(user.id);
        updatedRead = true;
      }
    });

    if (updatedRead) {
      saveDatabase();
    }

    const messages = db.messages
      .filter((m) => m.conversationId === convId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Also get the latest listing info if available
    const listing = db.listings.find((l) => l.id === conv.listingId) || null;

    res.json({
      conversation: { ...conv, unreadCount: 0 },
      messages,
      listing,
    });
  });

  // Send a message in a conversation
  app.post('/api/conversations/:id/messages', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const convId = req.params.id;
    const { text, type, offerAmount, sharedPhone } = req.body;

    const conv = db.conversations.find((c) => c.id === convId);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const isParticipant = conv.buyerId === user.id || conv.sellerId === user.id || conv.sellerRollNumber === user.rollNumber;
    if (!isParticipant) {
      return res.status(403).json({ error: 'Unauthorized to post in this conversation.' });
    }

    if (conv.isBlocked) {
      return res.status(403).json({ error: 'This conversation has been blocked. Messages cannot be sent.' });
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Message text cannot be empty.' });
    }

    const now = new Date().toISOString();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      conversationId: convId,
      senderId: user.id,
      senderName: user.name,
      senderRollNumber: user.rollNumber,
      text: text.trim(),
      type: type || 'text',
      offerAmount,
      sharedPhone,
      createdAt: now,
      readBy: [user.id],
    };

    db.messages.push(newMsg);
    conv.lastMessageText = newMsg.text;
    conv.lastMessageAt = now;
    saveDatabase();

    res.status(201).json({ message: newMsg, conversation: conv });
  });

  // Action: Voluntary Phone Share in private chat
  app.post('/api/conversations/:id/share-phone', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const convId = req.params.id;

    const conv = db.conversations.find((c) => c.id === convId);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const isParticipant = conv.buyerId === user.id || conv.sellerId === user.id || conv.sellerRollNumber === user.rollNumber;
    if (!isParticipant) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    if (conv.isBlocked) {
      return res.status(403).json({ error: 'Conversation is blocked.' });
    }

    const now = new Date().toISOString();
    const text = `Shared verified mobile number for campus handover: +91 ${user.mobile}`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      conversationId: convId,
      senderId: user.id,
      senderName: user.name,
      senderRollNumber: user.rollNumber,
      text,
      type: 'phone_share',
      sharedPhone: user.mobile,
      createdAt: now,
      readBy: [user.id],
    };

    db.messages.push(newMsg);
    conv.lastMessageText = text;
    conv.lastMessageAt = now;
    saveDatabase();

    res.status(201).json({ message: newMsg, conversation: conv });
  });

  // Action: Block / Unblock Conversation
  app.post('/api/conversations/:id/block', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const convId = req.params.id;

    const conv = db.conversations.find((c) => c.id === convId);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const isParticipant = conv.buyerId === user.id || conv.sellerId === user.id || conv.sellerRollNumber === user.rollNumber;
    if (!isParticipant) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    conv.isBlocked = true;
    conv.blockedBy = user.id;

    // Add system notification message
    const now = new Date().toISOString();
    const blockMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      conversationId: convId,
      senderId: 'system',
      senderName: 'Circuit2Circuit Safety',
      senderRollNumber: 'SYSTEM',
      text: `Conversation has been blocked by ${user.name}. Neither participant can send new messages.`,
      type: 'system',
      createdAt: now,
      readBy: [user.id],
    };
    db.messages.push(blockMsg);
    conv.lastMessageText = 'Conversation blocked';
    conv.lastMessageAt = now;

    saveDatabase();

    res.json({ message: 'Conversation blocked. No further messages can be exchanged.', conversation: conv });
  });

  app.post('/api/conversations/:id/unblock', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const convId = req.params.id;

    const conv = db.conversations.find((c) => c.id === convId);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    if (conv.blockedBy && conv.blockedBy !== user.id) {
      return res.status(403).json({ error: 'Only the student who blocked this conversation can unblock it.' });
    }

    conv.isBlocked = false;
    conv.blockedBy = undefined;

    const now = new Date().toISOString();
    const unblockMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      conversationId: convId,
      senderId: 'system',
      senderName: 'Circuit2Circuit Safety',
      senderRollNumber: 'SYSTEM',
      text: `Conversation unblocked by ${user.name}.`,
      type: 'system',
      createdAt: now,
      readBy: [user.id],
    };
    db.messages.push(unblockMsg);
    conv.lastMessageText = 'Conversation unblocked';
    conv.lastMessageAt = now;

    saveDatabase();

    res.json({ message: 'Conversation unblocked.', conversation: conv });
  });

  // Action: Report Conversation for Inappropriate Conduct
  app.post('/api/conversations/:id/report', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const convId = req.params.id;
    const { reason } = req.body;

    const conv = db.conversations.find((c) => c.id === convId);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ error: 'Please provide a reason for the report.' });
    }

    const report: StoredReport = {
      id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      reporterId: user.id,
      reporterRoll: user.rollNumber,
      conversationId: convId,
      reason: reason.trim(),
      createdAt: new Date().toISOString(),
    };

    db.reports.push(report);
    conv.reportCount = (conv.reportCount || 0) + 1;
    saveDatabase();

    res.json({
      message: 'Report submitted successfully. Thank you for helping keep Sri Vasavi student exchanges safe.',
    });
  });

  return app;
}

export const app = createApp();

export async function startServer(serverApp: express.Application = app) {
  if (isVercel) return;

  // --- Serve Frontend via Vite ---
  if (process.env.NODE_ENV === 'production') {
    serverApp.use(express.static(path.join(__dirname, 'dist')));
    serverApp.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : undefined,
      },
      appType: 'spa',
    });
    serverApp.use(vite.middlewares);
  }

  serverApp.listen(PORT, '0.0.0.0', () => {
    console.log(`Circuit2Circuit server running on http://0.0.0.0:${PORT}`);
  });
}

// Only listen on port when running as a standalone entry point (not when imported as a module by serverless functions or tests)
const isDirectRun = Boolean(process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js')));
if (!isVercel && isDirectRun) {
  startServer().catch((err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
  });
}

export default app;
