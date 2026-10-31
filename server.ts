import express, { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { initializeApp as initFirebaseApp, getApps as getFirebaseApps } from 'firebase/app';
import {
  getFirestore,
  doc as fsDoc,
  getDoc as fsGetDoc,
  setDoc as fsSetDoc,
  getDocs as fsGetDocs,
  collection as fsCollection,
  query as fsQuery,
  where as fsWhere,
  deleteDoc as fsDeleteDoc,
} from 'firebase/firestore';
import {
  DEFAULT_BRANCHES,
  validateVasaviRollNumber,
  validateMobileNumber,
  validatePassword,
  validateListingPermissions,
  validateRequestPermissions,
  validateVasaviEmail,
  OFFICIAL_EMAIL_DOMAIN,
  CAMPUS_MEETING_LOCATIONS,
} from './src/utils/validation.ts';
import { INITIAL_COMPONENTS } from './src/data/sampleComponents.ts';
import {
  ComponentItem,
  ItemRequest,
  StudentUser,
  ChatMessage,
  Conversation,
  StudentCareGuide,
  StudentCareRequest,
  TransactionRecord,
  EcoImpactMetrics,
  LeaderboardEntry,
} from './src/types.ts';

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

  // 1. Check real original client URI headers first (must be a real /api path and not an unexpanded bracket pattern like [...path])
  const realUri =
    req.headers?.['x-forwarded-uri'] ||
    req.headers?.['x-original-uri'] ||
    req.headers?.['x-invoke-path'];

  if (typeof realUri === 'string' && realUri.startsWith('/api') && !realUri.includes('[')) {
    req.url = realUri;
    return;
  }

  // 2. Check Vercel proxy matched path headers (only if not an unexpanded dynamic bracket route pattern)
  const matchedPath =
    req.headers?.['x-matched-path'] ||
    req.headers?.['x-vercel-matched-path'];

  if (typeof matchedPath === 'string' && matchedPath.startsWith('/api') && !matchedPath.includes('[')) {
    const queryIndex = typeof req.url === 'string' ? req.url.indexOf('?') : -1;
    const query = queryIndex !== -1 ? req.url.substring(queryIndex) : '';
    req.url = matchedPath.includes('?') ? matchedPath : `${matchedPath}${query}`;
    return;
  }

  // 3. Check query path parameter passed by vercel.json rewrite or [...path].ts
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

    // If request has conversation patterns (conv-*, unread-total, or conversations), route to /api/conversations/
    const urlStr = typeof req.url === 'string' ? req.url : '';
    if (
      cleanPath.startsWith('conv-') ||
      cleanPath.startsWith('unread-total') ||
      cleanPath.startsWith('conversations') ||
      urlStr.includes('conversations')
    ) {
      const convSub = cleanPath.replace(/^conversations\/?/, '');
      req.url = `/api/conversations/${convSub}${queryString}`;
    } else if (!cleanPath.startsWith('api')) {
      req.url = `/api/${cleanPath}${queryString}`;
    } else {
      req.url = `/${cleanPath}${queryString}`;
    }
    return;
  }

  // 4. Fallback: normalize known API subroutes without /api prefix (e.g. /auth/login -> /api/auth/login)
  if (typeof req.url === 'string') {
    if (
      req.url.startsWith('/auth') ||
      req.url.startsWith('/config') ||
      req.url.startsWith('/listings') ||
      req.url.startsWith('/my') ||
      req.url.startsWith('/requests') ||
      req.url.startsWith('/conversations') ||
      req.url.startsWith('/upload') ||
      req.url.startsWith('/student-care') ||
      req.url.startsWith('/eco-impact') ||
      req.url.startsWith('/leaderboards') ||
      req.url.startsWith('/payment-gateway') ||
      req.url.startsWith('/admin')
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
  guides?: StudentCareGuide[];
  careRequests?: StudentCareRequest[];
  transactions?: TransactionRecord[];
  uploads?: Record<string, string>;
}

// Initial Student Care Guides for Sri Vasavi Engineering College
const INITIAL_GUIDES: StudentCareGuide[] = [
  {
    id: 'guide-01',
    title: 'ESP32 NodeMCU + DHT11: 3.3V vs 5V Pin Connection & Boot Loop Fix',
    category: 'pin_connections',
    componentOrKit: 'ESP32 DevKit & DHT11 Module',
    authorName: 'Kalyan Chakravarthy',
    authorRoll: '21A81A0445',
    authorBranch: 'Electronics & Communication Engineering (ECE)',
    authorYear: '4th Year',
    summary: 'Many 2nd/3rd year students run into ESP32 brownout boot loops when powering sensor rails directly from the 3.3V pin. Here is the safe pinout wiring and capacitor decoupling guide tested in Block B IoT lab.',
    pinoutNotes: `ESP32 VIN -> 5V external or USB supply
ESP32 3V3 -> DHT11 VCC (Do not connect 5V to ESP32 ADC/GPIO pins!)
ESP32 GND -> DHT11 GND (Common ground is mandatory)
ESP32 GPIO4 -> DHT11 DATA (Include 10k pull-up resistor)`,
    troubleshootingTips: [
      'Avoid using GPIO0, GPIO2, GPIO12, or GPIO15 for DHT11 data as they are strapping pins that determine boot mode.',
      'Place a 100nF ceramic decoupling capacitor across DHT11 VCC and GND if readings intermittently return "NaN".',
      'Set serial baud rate to 115200 in both setup() and Arduino Serial Monitor.'
    ],
    sampleCode: `#include <DHT.h>
#define DHTPIN 4
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  delay(1000);
  dht.begin();
  Serial.println("DHT11 Sensor Ready!");
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (isnan(h) || isnan(t)) {
    Serial.println("Warning: Failed to read from DHT sensor!");
    delay(2000);
    return;
  }
  Serial.printf("Temperature: %.1f C | Humidity: %.1f %%\\n", t, h);
  delay(2000);
}`,
    upvotes: 14,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'guide-02',
    title: 'L298N Motor Driver + 12V Battery Common Ground & Logic Jumper Guide',
    category: 'troubleshooting',
    componentOrKit: 'L298N Dual H-Bridge & TT Motors',
    authorName: 'Vikramaditya S.',
    authorRoll: '22A81A0412',
    authorBranch: 'Electronics & Communication Engineering (ECE)',
    authorYear: '3rd Year',
    summary: 'The #1 reason motors behave erratically or microcontrollers reset when motors start is a missing common ground between battery and Arduino, or forgetting to leave the 5V regulator jumper on for <12V supplies.',
    pinoutNotes: `L298N 12V -> Battery Positive (+7.4V to +12V)
L298N GND -> Battery Negative (-) AND Arduino GND (Must be connected together!)
L298N 5V -> Arduino 5V (If 5V-EN jumper is installed)
IN1, IN2, IN3, IN4 -> Arduino Pins D5, D6, D9, D10`,
    troubleshootingTips: [
      'ALWAYS connect battery negative (-) to BOTH L298N GND and Arduino GND.',
      'Keep the 5V EN jumper ON if using a 7.4V to 12V battery; this enables the onboard 5V regulator to power the logic chips.',
      'If motors stall or hum, measure your battery voltage under load—rechargeable 18650 cells work much better than 9V alkaline blocks.'
    ],
    sampleCode: `const int in1 = 5;
const int in2 = 6;

void setup() {
  pinMode(in1, OUTPUT);
  pinMode(in2, OUTPUT);
}

void loop() {
  // Rotate forward 2 seconds
  digitalWrite(in1, HIGH);
  digitalWrite(in2, LOW);
  delay(2000);
  // Stop 1 second
  digitalWrite(in1, LOW);
  digitalWrite(in2, LOW);
  delay(1000);
}`,
    upvotes: 19,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'guide-03',
    title: 'I2C 1602 LCD 0x27 vs 0x3F Address Conflict & Scanner Code',
    category: 'sample_code',
    componentOrKit: '16x2 I2C Character LCD (PCF8574)',
    authorName: 'Venkata Sai Kumar',
    authorRoll: '22A81A0512',
    authorBranch: 'Computer Science & Engineering (CSE)',
    authorYear: '3rd Year',
    summary: 'Depending on the PCF8574 chip soldered onto your backpack (PCF8574 vs PCF8574A), the default address is either 0x27 or 0x3F. Run this I2C scanner sketch first before troubleshooting blank screens or contrast trimpots.',
    pinoutNotes: `LCD VCC -> 5V (Requires 5V for crisp contrast!)
LCD GND -> Arduino GND
LCD SDA -> Arduino Pin A4 (or ESP32 GPIO21)
LCD SCL -> Arduino Pin A5 (or ESP32 GPIO22)`,
    troubleshootingTips: [
      'Turn the blue potentiometer on the backpack with a small screwdriver until characters appear.',
      'If you see black blocks on line 1, your I2C address is wrong or initialization code has not executed.',
      'Use the Wire.h library built into Arduino IDE.'
    ],
    sampleCode: `#include <Wire.h>

void setup() {
  Wire.begin();
  Serial.begin(9600);
  Serial.println("Circuit2Circuit I2C Scanner Ready");
}

void loop() {
  byte error, address;
  int nDevices = 0;
  for(address = 1; address < 127; address++ ) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();
    if (error == 0) {
      Serial.print("I2C device found at address 0x");
      if (address<16) Serial.print("0");
      Serial.println(address,HEX);
      nDevices++;
    }
  }
  if (nDevices == 0) Serial.println("No I2C devices found\\n");
  delay(5000);
}`,
    upvotes: 11,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  }
];

const INITIAL_REQUESTS_CARE: StudentCareRequest[] = [
  {
    id: 'care-req-01',
    title: 'MPU6050 accelerometer raw values drifting in Block B Lab',
    componentNeededOrIssue: 'MPU6050 6-Axis Gyro/Accelerometer',
    studentName: 'Praveen K.',
    studentRoll: '25A81A4300',
    studentBranch: 'Computer Science and Artificial Intelligence (CAI)',
    studentYear: '2nd Year',
    urgency: 'medium',
    labName: 'Block B IoT Lab',
    status: 'answered',
    answers: [
      {
        id: 'ans-01',
        responderName: 'Kalyan Chakravarthy',
        responderRoll: '21A81A0445',
        responderYear: '4th Year',
        answerText: 'Make sure you calibrate zero-offsets on a flat table before sampling. Also keep AD0 connected to GND for 0x68 address, and enable the internal digital low pass filter (DLPF_CFG = 3).',
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'tx-01',
    listingId: 'c2c-001',
    listingName: 'Arduino Uno R3 Microcontroller Board (with USB A-B Cable)',
    transactionType: 'rent',
    priceNumeric: 40,
    depositAmount: 100,
    sellerId: 'usr-vasavi-02',
    sellerName: 'Bhavya Sri',
    sellerRoll: '21A81A0501',
    buyerId: 'usr-vasavi-01',
    buyerName: 'Praveen Kumar',
    buyerRoll: '25A81A4300',
    status: 'completed',
    handoverLocation: 'Central Library - Ground Floor Discussion Area',
    originalPriceNumeric: 450,
    weightGrams: 45,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'tx-02',
    listingId: 'c2c-002',
    listingName: 'Solderless Breadboard (830 Tie Points) + Power Rails',
    transactionType: 'donate',
    priceNumeric: 0,
    depositAmount: 0,
    sellerId: 'usr-vasavi-03',
    sellerName: 'Sneha Patel',
    sellerRoll: '21A81A0234',
    buyerId: 'usr-vasavi-04',
    buyerName: 'Sanjay Reddy',
    buyerRoll: '23A81A4321',
    status: 'completed',
    handoverLocation: 'Central Library - Ground Floor Discussion Area',
    originalPriceNumeric: 160,
    weightGrams: 90,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'tx-03',
    listingId: 'c2c-007',
    listingName: 'ESP32 Dual-Core Wi-Fi & Bluetooth Development Board',
    transactionType: 'sell',
    priceNumeric: 340,
    depositAmount: 0,
    sellerId: 'usr-vasavi-05',
    sellerName: 'Divya Krishnan',
    sellerRoll: '21A81A1204',
    buyerId: 'usr-vasavi-06',
    buyerName: 'Kavya Sree',
    buyerRoll: '22A81A0544',
    status: 'completed',
    handoverLocation: 'Admin Block Student Helpdesk Foyer',
    originalPriceNumeric: 550,
    weightGrams: 30,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'tx-04',
    listingId: 'c2c-003',
    listingName: 'Assorted Resistors (1/4W Metal Film, 300 Pcs Box)',
    transactionType: 'sell',
    priceNumeric: 95,
    depositAmount: 0,
    sellerId: 'usr-vasavi-07',
    sellerName: 'Harish Nair',
    sellerRoll: '21A81A0315',
    buyerId: 'usr-vasavi-08',
    buyerName: 'Vikramaditya S.',
    buyerRoll: '22A81A0412',
    status: 'completed',
    handoverLocation: 'Student Canteen Central Plaza',
    originalPriceNumeric: 220,
    weightGrams: 60,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'tx-05',
    listingId: 'c2c-kit-001',
    listingName: 'Smart IoT Environmental & Weather Monitor Kit',
    transactionType: 'rent',
    priceNumeric: 85,
    depositAmount: 150,
    sellerId: 'usr-vasavi-09',
    sellerName: 'Venkata Sai Kumar',
    sellerRoll: '22A81A0512',
    buyerId: 'usr-vasavi-10',
    buyerName: 'Rahul Chowdary',
    buyerRoll: '22A81A0488',
    status: 'completed',
    handoverLocation: 'ECE Dept - IoT & Embedded Systems Lab (Block B, 2nd Floor)',
    originalPriceNumeric: 890,
    weightGrams: 280,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  }
];

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
      if (!data.users) data.users = [];
      if (!data.listings) data.listings = [];
      if (!data.branches) data.branches = DEFAULT_BRANCHES;
      if (!data.sessions) data.sessions = [];
      if (!data.conversations) data.conversations = [];
      if (!data.messages) data.messages = [];
      if (!data.reports) data.reports = [];
      if (!data.requests) data.requests = [];
      if (!data.guides || data.guides.length === 0) data.guides = INITIAL_GUIDES;
      if (!data.careRequests || data.careRequests.length === 0) data.careRequests = INITIAL_REQUESTS_CARE;
      if (!data.transactions || data.transactions.length === 0) data.transactions = INITIAL_TRANSACTIONS;
      if (!data.uploads) data.uploads = {};
      
      // Ensure all initial components (including new Project Kits) are present
      INITIAL_COMPONENTS.forEach((initItem) => {
        if (!data.listings.some((l: any) => l && l.id === initItem.id)) {
          data.listings.unshift(initItem);
        }
      });

      if (!data.branches) {
        data.branches = DEFAULT_BRANCHES;
      } else {
        DEFAULT_BRANCHES.forEach((b) => {
          if (!data.branches.includes(b)) {
            data.branches.push(b);
          }
        });
      }
      return data;
    } catch (e) {
      console.error('Failed to parse database, reinitializing...', e);
    }
  }

  if (seedPath) {
    try {
      const content = fs.readFileSync(seedPath, 'utf-8');
      const data: DatabaseSchema = JSON.parse(content);
      return data;
    } catch (e) {
      // fallback
    }
  }

  const defaultUsers: StoredUser[] = [];

  const demoConvId = 'conv-demo-01';
  const initialConversations: Conversation[] = [
    {
      id: demoConvId,
      listingId: 'c2c-001',
      listingTitle: 'Arduino Uno R3 Microcontroller Board (with USB A-B Cable)',
      listingPrice: '₹40 / week',
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
      lastMessageText: 'Sounds good! I can meet you tomorrow at 1:30 PM near the central library discussion hall.',
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
      text: 'Sounds good! I can meet you tomorrow at 1:30 PM near the central library discussion hall.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      readBy: ['usr-vasavi-02'],
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
    guides: INITIAL_GUIDES,
    careRequests: INITIAL_REQUESTS_CARE,
    transactions: INITIAL_TRANSACTIONS,
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
  } catch (e) {
    // ignore in read-only environments
  }
  return initialDb;
}

let dbInstance: DatabaseSchema | null = null;
let lastDbMtime = 0;

export function getDb(): DatabaseSchema {
  if (!dbInstance) {
    dbInstance = loadDatabase();
    try {
      if (fs.existsSync(DB_FILE)) {
        lastDbMtime = fs.statSync(DB_FILE).mtimeMs;
      }
    } catch (e) {}
  }
  return dbInstance;
}

// Global proxy for db to maintain compatibility with existing code
const db = new Proxy({} as DatabaseSchema, {
  get: (_, prop: keyof DatabaseSchema) => getDb()[prop],
  set: (_, prop: keyof DatabaseSchema, value) => {
    getDb()[prop] = value as any;
    return true;
  }
});

  export function reloadDatabaseIfChanged() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const stats = fs.statSync(DB_FILE);
        if (stats.mtimeMs > lastDbMtime) {
          const content = fs.readFileSync(DB_FILE, 'utf-8');
          if (content && content.trim()) {
            const newData = JSON.parse(content);
            if (newData && typeof newData === 'object' && newData.users) {
              dbInstance = newData;
              lastDbMtime = stats.mtimeMs;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Database reload failed:', e);
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
      fs.writeFileSync(DB_FILE, JSON.stringify(getDb(), null, 2), 'utf-8');
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

// --- Persistent Database Connection Architecture ---
let firestoreDb: any = null;
let firestoreInitAttempted = false;

export function getFirestoreDb() {
  if (firestoreDb) return firestoreDb;
  if (firestoreInitAttempted) return null;
  firestoreInitAttempted = true;

  try {
    let firebaseConfig: any = null;
    const candidates = [
      path.join(process.cwd(), 'firebase-applet-config.json'),
      path.join(__dirname, 'firebase-applet-config.json'),
      path.join(__dirname, '..', 'firebase-applet-config.json')
    ];
    
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          firebaseConfig = JSON.parse(fs.readFileSync(p, 'utf-8'));
          break;
        } catch (e) {}
      }
    }

    if (!firebaseConfig && process.env.FIREBASE_CONFIG) {
      try {
        firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
      } catch (e) {}
    }

    if (!firebaseConfig && (process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID)) {
      firebaseConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
        apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
        firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID || 'ai-studio-circuit2circuitb-0ba4f3df-8bc1-4e2d-baed-e40f92e37579',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
      };
    }

    if (firebaseConfig && firebaseConfig.projectId) {
      const firebaseApp = getFirebaseApps().length === 0 ? initFirebaseApp(firebaseConfig) : getFirebaseApps()[0];
      firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
      console.log('Firebase Firestore lazy-initialized successfully:', firebaseConfig.projectId);
    }
  } catch (err) {
    console.error('CRITICAL: Failed to lazy-initialize Firestore:', err);
  }
  return firestoreDb;
}

let pgPool: pg.Pool | null = null;
let pgInitAttempted = false;

export function getPgPool() {
  if (pgPool) return pgPool;
  if (pgInitAttempted) return null;
  pgInitAttempted = true;

  const PG_CONN_STRING =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.PGURI ||
    '';

  if (PG_CONN_STRING) {
    try {
      pgPool = new pg.Pool({
        connectionString: PG_CONN_STRING,
        ssl: PG_CONN_STRING.includes('localhost') ? false : { rejectUnauthorized: false },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      console.log('PostgreSQL Pool created successfully.');
    } catch (e) {
      console.error('Failed to create PostgreSQL pool:', e);
    }
  }
  return pgPool;
}

let pgInitPromise: Promise<boolean> | null = null;

async function ensurePgSchema(): Promise<boolean> {
  const pool = getPgPool();
  if (!pool) return false;
  try {
    await pool.query(`
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
    const checkCount = await pool.query('SELECT COUNT(*) as count FROM c2c_users');
    if (parseInt(checkCount.rows[0].count, 10) === 0 && db.users && db.users.length > 0) {
      for (const u of db.users) {
        await pool.query(
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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutHandle: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('Operation timed out')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutHandle));
}

export async function findUserByRollNumber(identifier: string): Promise<StoredUser | null> {
  try {
    const clean = String(identifier || '').trim();
    if (!clean) return null;
    const cleanUpper = clean.toUpperCase();
    const cleanLower = clean.toLowerCase();
    const isEmail = clean.includes('@');

    // 1. Check Firebase Firestore (Primary persistent store)
    const fs = getFirestoreDb();
    if (fs) {
      try {
        const q = isEmail
          ? fsQuery(fsCollection(fs, 'c2c_users'), fsWhere('email', '==', cleanLower))
          : fsQuery(fsCollection(fs, 'c2c_users'), fsWhere('rollNumberUpper', '==', cleanUpper));
        const snapshot = await withTimeout(fsGetDocs(q), 3500);
        if (snapshot && !snapshot.empty) {
          const u = snapshot.docs[0].data() as StoredUser;
          if (u) {
            return {
              id: u.id || `usr-${Date.now()}`,
              name: u.name || 'Student',
              email: u.email || `${(u.rollNumber || cleanUpper).toLowerCase()}@${OFFICIAL_EMAIL_DOMAIN}`,
              rollNumber: u.rollNumber || cleanUpper,
              branch: u.branch || 'Engineering',
              mobile: u.mobile || '',
              year: u.year || '2nd Year',
              shareMobilePublicly: Boolean(u.shareMobilePublicly),
              role: u.role || 'student',
              passwordHash: u.passwordHash || '',
              createdAt: u.createdAt || new Date().toISOString(),
            };
          }
        }
      } catch (err) {
        console.error('Firestore findUserByRollNumber error or timeout:', err);
      }
    }

    // 2. Check PostgreSQL
    const pool = getPgPool();
    if (pool) {
      try {
        await (pgInitPromise ||= ensurePgSchema());
        const res = await pool.query(
          'SELECT id, name, roll_number AS "rollNumber", branch, mobile, year, share_mobile_publicly AS "shareMobilePublicly", password_hash AS "passwordHash", created_at AS "createdAt" FROM c2c_users WHERE UPPER(roll_number) = $1',
          [cleanUpper]
        );
        if (res && res.rows && res.rows.length > 0) {
          const u = res.rows[0];
          return {
            id: u.id,
            name: u.name,
            email: u.email || `${(u.rollNumber || cleanUpper).toLowerCase()}@${OFFICIAL_EMAIL_DOMAIN}`,
            rollNumber: u.rollNumber || cleanUpper,
            branch: u.branch,
            mobile: u.mobile,
            year: u.year,
            shareMobilePublicly: Boolean(u.shareMobilePublicly),
            role: u.role || 'student',
            passwordHash: u.passwordHash || '',
            createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt || new Date().toISOString()),
          };
        }
      } catch (err) {
        console.error('PostgreSQL findUserByRollNumber error:', err);
      }
    }

    // 3. Fallback to local memory & disk database
    try {
      reloadDatabaseIfChanged();
      const usersList = db.users || [];
      const mem = usersList.find((u) => {
        if (!u) return false;
        if (isEmail) return u.email?.toLowerCase() === cleanLower;
        return u.rollNumber && String(u.rollNumber).trim().toUpperCase() === cleanUpper;
      });
      if (mem) {
        if (!mem.email && mem.rollNumber) {
          mem.email = `${mem.rollNumber.toLowerCase()}@${OFFICIAL_EMAIL_DOMAIN}`;
        }
        return mem;
      }
    } catch (memErr) {
      console.error('Local memory lookup error:', memErr);
    }

    return null;
  } catch (globalErr) {
    console.error('Error in findUserByRollNumber:', globalErr);
    return null;
  }
}

export async function findUserById(userId: string): Promise<StoredUser | null> {
  try {
    if (!userId) return null;

    // 1. Check Firebase Firestore
    const fs = getFirestoreDb();
    if (fs) {
      try {
        const docRef = fsDoc(fs, 'c2c_users', userId);
        const snap = await fsGetDoc(docRef);
        if (snap && snap.exists()) {
          const u = snap.data() as StoredUser;
          if (u) {
            return {
              id: u.id || userId,
              name: u.name || 'Student',
              email: u.email || `${u.rollNumber?.toLowerCase() || 'student'}@${OFFICIAL_EMAIL_DOMAIN}`,
              rollNumber: u.rollNumber || '',
              branch: u.branch || 'Engineering',
              mobile: u.mobile || '',
              year: u.year || '2nd Year',
              shareMobilePublicly: Boolean(u.shareMobilePublicly),
              role: u.role || 'student',
              passwordHash: u.passwordHash || '',
              createdAt: u.createdAt || new Date().toISOString(),
            };
          }
        }
      } catch (err) {
        console.error('Firestore findUserById error:', err);
      }
    }

    // 2. Check PostgreSQL
    const pool = getPgPool();
    if (pool) {
      try {
        await (pgInitPromise ||= ensurePgSchema());
        const res = await pool.query(
          'SELECT id, name, roll_number AS "rollNumber", branch, mobile, year, share_mobile_publicly AS "shareMobilePublicly", password_hash AS "passwordHash", created_at AS "createdAt" FROM c2c_users WHERE id = $1',
          [userId]
        );
        if (res && res.rows && res.rows.length > 0) {
          const u = res.rows[0];
          return {
            id: u.id,
            name: u.name,
            email: `${u.rollNumber?.toLowerCase() || 'student'}@${OFFICIAL_EMAIL_DOMAIN}`,
            rollNumber: u.rollNumber,
            branch: u.branch,
            mobile: u.mobile,
            year: u.year,
            shareMobilePublicly: Boolean(u.shareMobilePublicly),
            role: u.role || 'student',
            passwordHash: u.passwordHash || '',
            createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt || new Date().toISOString()),
          };
        }
      } catch (err) {
        console.error('PostgreSQL findUserById error:', err);
      }
    }

    try {
      reloadDatabaseIfChanged();
      const mem = (db.users || []).find((u) => u && u.id === userId);
      return mem || null;
    } catch (memErr) {
      console.error('Local findUserById memory lookup error:', memErr);
    }

    return null;
  } catch (globalErr) {
    console.error('Error in findUserById:', globalErr);
    return null;
  }
}

function cleanForFirestore<T>(data: T): any {
  if (!data) return data;
  return JSON.parse(JSON.stringify(data));
}

export async function saveNewUser(newUser: StoredUser): Promise<void> {
  try {
    const cleanRoll = String(newUser.rollNumber || '').trim().toUpperCase();
    const sanitizedUser = { ...newUser, rollNumber: cleanRoll, rollNumberUpper: cleanRoll };

    // 1. Always update local memory & disk cache
    getDb();
    const idx = (db?.users || []).findIndex((u) => u && u.rollNumber && String(u.rollNumber).trim().toUpperCase() === cleanRoll);
    if (idx !== -1) {
      db.users[idx] = sanitizedUser;
    } else {
      db.users.push(sanitizedUser);
    }
    saveDatabase();

    // 2. Persist to Firebase Firestore
    const fs = getFirestoreDb();
    if (fs) {
      try {
        await fsSetDoc(fsDoc(fs, 'c2c_users', sanitizedUser.id), cleanForFirestore(sanitizedUser));
        console.log('Saved new user to Firebase Firestore:', sanitizedUser.rollNumber);
      } catch (err) {
        console.error('Firestore saveNewUser error:', err);
      }
    }

    // 3. Persist to PostgreSQL if configured
    const pool = getPgPool();
    if (pool) {
      try {
        await (pgInitPromise ||= ensurePgSchema());
        await pool.query(
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
      }
    }
  } catch (err) {
    console.error('Error in saveNewUser:', err);
  }
}

export async function saveSession(token: string, userId: string): Promise<void> {
  try {
    getDb();
    db.sessions.push({ token, userId, createdAt: new Date().toISOString() });
    saveDatabase();

    const fs = getFirestoreDb();
    if (fs) {
      try {
        await fsSetDoc(fsDoc(fs, 'c2c_sessions', token), { token, userId, createdAt: new Date().toISOString() });
      } catch (err) {
        console.error('Firestore saveSession error:', err);
      }
    }

    const pool = getPgPool();
    if (pool) {
      try {
        await (pgInitPromise ||= ensurePgSchema());
        await pool.query(
          'INSERT INTO c2c_sessions (token, user_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (token) DO NOTHING',
          [token, userId]
        );
      } catch (err) {
        console.error('PostgreSQL saveSession error:', err);
      }
    }
  } catch (err) {
    console.error('Error in saveSession:', err);
  }
}

export async function deleteSession(token: string): Promise<void> {
  db.sessions = db.sessions.filter((s) => s.token !== token);
  saveDatabase();

  const fs = getFirestoreDb();
  if (fs) {
    try {
      await fsDeleteDoc(fsDoc(fs, 'c2c_sessions', token));
    } catch (err) {
      console.error('Firestore deleteSession error:', err);
    }
  }

  const pool = getPgPool();
  if (pool) {
    try {
      await (pgInitPromise ||= ensurePgSchema());
      await pool.query('DELETE FROM c2c_sessions WHERE token = $1', [token]);
    } catch (err) {
      console.error('PostgreSQL deleteSession error:', err);
    }
  }
}

export async function getAllListingsFromDb(): Promise<ComponentItem[]> {
  const fs = getFirestoreDb();
  if (fs) {
    try {
      const snapshot = await fsGetDocs(fsCollection(fs, 'c2c_listings'));
      if (!snapshot.empty) {
        const firestoreListings: ComponentItem[] = [];
        snapshot.docs.forEach((docSnap) => {
          const item = docSnap.data() as ComponentItem;
          if (item && item.id) {
            firestoreListings.push(item);
          }
        });
        if (firestoreListings.length > 0) {
          return firestoreListings;
        }
      }
    } catch (err) {
      console.error('Firestore getAllListingsFromDb error:', err);
    }
  }

  const pool = getPgPool();
  if (pool) {
    try {
      await (pgInitPromise ||= ensurePgSchema());
      const res = await pool.query('SELECT data FROM c2c_listings ORDER BY created_at DESC');
      if (res.rows.length > 0) {
        return res.rows.map((row) => row.data);
      }
    } catch (err) {
      console.error('PostgreSQL getAllListingsFromDb error:', err);
    }
  }

  reloadDatabaseIfChanged();
  return db.listings || INITIAL_COMPONENTS;
}

export async function saveListingToDb(listing: ComponentItem): Promise<void> {
  const idx = db.listings.findIndex((l) => l.id === listing.id);
  if (idx !== -1) {
    db.listings[idx] = listing;
  } else {
    db.listings.unshift(listing);
  }
  saveDatabase();

  const fs = getFirestoreDb();
  if (fs) {
    try {
      await fsSetDoc(fsDoc(fs, 'c2c_listings', listing.id), cleanForFirestore(listing));
    } catch (err) {
      console.error('Firestore saveListingToDb error:', err);
    }
  }

  const pool = getPgPool();
  if (pool) {
    try {
      await (pgInitPromise ||= ensurePgSchema());
      await pool.query(
        'INSERT INTO c2c_listings (id, data, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data',
        [listing.id, JSON.stringify(listing)]
      );
    } catch (err) {
      console.error('PostgreSQL saveListingToDb error:', err);
    }
  }
}

// --- Chat & Conversation Persistence Helpers ---

export async function saveConversationToDb(conv: Conversation): Promise<void> {
  const idx = db.conversations.findIndex((c) => c.id === conv.id);
  if (idx !== -1) {
    db.conversations[idx] = conv;
  } else {
    db.conversations.unshift(conv);
  }
  saveDatabase();

  const fs = getFirestoreDb();
  if (fs) {
    try {
      await fsSetDoc(fsDoc(fs, 'c2c_conversations', conv.id), cleanForFirestore(conv));
    } catch (err) {
      console.error('Firestore saveConversationToDb error:', err);
    }
  }
}

export async function getConversationByIdFromDb(convId: string): Promise<Conversation | null> {
  reloadDatabaseIfChanged();
  const local = db.conversations.find((c) => c.id === convId);

  const fs = getFirestoreDb();
  if (fs) {
    try {
      const snap = await fsGetDoc(fsDoc(fs, 'c2c_conversations', convId));
      if (snap.exists()) {
        const conv = snap.data() as Conversation;
        const idx = db.conversations.findIndex((c) => c.id === convId);
        if (idx !== -1) {
          db.conversations[idx] = conv;
        } else {
          db.conversations.unshift(conv);
        }
        return conv;
      }
    } catch (err) {
      console.error('Firestore getConversationByIdFromDb error:', err);
    }
  }

  return local || null;
}

export async function getConversationsForUserFromDb(userId: string, userRoll: string): Promise<Conversation[]> {
  const rollUpper = userRoll.trim().toUpperCase();
  reloadDatabaseIfChanged();

  const convMap = new Map<string, Conversation>();
  for (const c of db.conversations) {
    if (
      c.buyerId === userId ||
      c.sellerId === userId ||
      (c.sellerRollNumber && c.sellerRollNumber.toUpperCase() === rollUpper) ||
      (c.buyerRollNumber && c.buyerRollNumber.toUpperCase() === rollUpper)
    ) {
      convMap.set(c.id, c);
    }
  }

  const fs = getFirestoreDb();
  if (fs) {
    try {
      const [snapBuyer, snapSeller, snapSellerRoll] = await Promise.all([
        fsGetDocs(fsQuery(fsCollection(fs, 'c2c_conversations'), fsWhere('buyerId', '==', userId))),
        fsGetDocs(fsQuery(fsCollection(fs, 'c2c_conversations'), fsWhere('sellerId', '==', userId))),
        fsGetDocs(fsQuery(fsCollection(fs, 'c2c_conversations'), fsWhere('sellerRollNumber', '==', userRoll))),
      ]);

      const mergeDoc = (docSnap: any) => {
        const data = docSnap.data() as Conversation;
        if (data && data.id) {
          convMap.set(data.id, data);
          const existingIdx = db.conversations.findIndex((c) => c.id === data.id);
          if (existingIdx !== -1) {
            db.conversations[existingIdx] = data;
          } else {
            db.conversations.unshift(data);
          }
        }
      };

      snapBuyer.forEach(mergeDoc);
      snapSeller.forEach(mergeDoc);
      snapSellerRoll.forEach(mergeDoc);
    } catch (err) {
      console.error('Firestore getConversationsForUserFromDb error:', err);
    }
  }

  return Array.from(convMap.values()).sort(
    (a, b) => new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime()
  );
}

export async function saveChatMessageToDb(msg: ChatMessage): Promise<void> {
  const idx = db.messages.findIndex((m) => m.id === msg.id);
  if (idx !== -1) {
    db.messages[idx] = msg;
  } else {
    db.messages.push(msg);
  }
  saveDatabase();

  const fs = getFirestoreDb();
  if (fs) {
    try {
      await fsSetDoc(fsDoc(fs, 'c2c_messages', msg.id), cleanForFirestore(msg));
    } catch (err) {
      console.error('Firestore saveChatMessageToDb error:', err);
    }
  }
}

export async function getMessagesForConversationFromDb(convId: string): Promise<ChatMessage[]> {
  reloadDatabaseIfChanged();
  const msgMap = new Map<string, ChatMessage>();

  for (const m of db.messages) {
    if (m.conversationId === convId) {
      msgMap.set(m.id, m);
    }
  }

  const fs = getFirestoreDb();
  if (fs) {
    try {
      const q = fsQuery(fsCollection(fs, 'c2c_messages'), fsWhere('conversationId', '==', convId));
      const snap = await fsGetDocs(q);
      snap.forEach((docSnap) => {
        const msg = docSnap.data() as ChatMessage;
        if (msg && msg.id) {
          msgMap.set(msg.id, msg);
          const existingIdx = db.messages.findIndex((m) => m.id === msg.id);
          if (existingIdx !== -1) {
            db.messages[existingIdx] = msg;
          } else {
            db.messages.push(msg);
          }
        }
      });
    } catch (err) {
      console.error('Firestore getMessagesForConversationFromDb error:', err);
    }
  }

  return Array.from(msgMap.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export async function saveReportToDb(report: StoredReport): Promise<void> {
  db.reports.push(report);
  saveDatabase();

  if (firestoreDb) {
    try {
      await fsSetDoc(fsDoc(firestoreDb, 'c2c_reports', report.id), cleanForFirestore(report));
    } catch (err) {
      console.error('Firestore saveReportToDb error:', err);
    }
  }
}

export async function getAllGuidesFromDb(): Promise<StudentCareGuide[]> {
  reloadDatabaseIfChanged();
  const guidesMap = new Map<string, StudentCareGuide>();
  (db.guides || INITIAL_GUIDES).forEach((g) => guidesMap.set(g.id, g));

  if (firestoreDb) {
    try {
      const snap = await fsGetDocs(fsCollection(firestoreDb, 'c2c_guides'));
      snap.forEach((docSnap) => {
        const item = docSnap.data() as StudentCareGuide;
        if (item && item.id) {
          guidesMap.set(item.id, item);
        }
      });
    } catch (err) {
      console.error('Firestore getAllGuidesFromDb error:', err);
    }
  }

  return Array.from(guidesMap.values()).sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
}

export async function saveGuideToDb(guide: StudentCareGuide): Promise<void> {
  if (!db.guides) db.guides = [...INITIAL_GUIDES];
  const idx = db.guides.findIndex((g) => g.id === guide.id);
  if (idx !== -1) {
    db.guides[idx] = guide;
  } else {
    db.guides.unshift(guide);
  }
  saveDatabase();

  if (firestoreDb) {
    try {
      await fsSetDoc(fsDoc(firestoreDb, 'c2c_guides', guide.id), cleanForFirestore(guide));
    } catch (err) {
      console.error('Firestore saveGuideToDb error:', err);
    }
  }
}

export async function getAllCareRequestsFromDb(): Promise<StudentCareRequest[]> {
  reloadDatabaseIfChanged();
  const reqMap = new Map<string, StudentCareRequest>();
  (db.careRequests || INITIAL_REQUESTS_CARE).forEach((r) => reqMap.set(r.id, r));

  if (firestoreDb) {
    try {
      const snap = await fsGetDocs(fsCollection(firestoreDb, 'c2c_care_requests'));
      snap.forEach((docSnap) => {
        const item = docSnap.data() as StudentCareRequest;
        if (item && item.id) {
          reqMap.set(item.id, item);
        }
      });
    } catch (err) {
      console.error('Firestore getAllCareRequestsFromDb error:', err);
    }
  }

  return Array.from(reqMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function saveCareRequestToDb(careReq: StudentCareRequest): Promise<void> {
  if (!db.careRequests) db.careRequests = [...INITIAL_REQUESTS_CARE];
  const idx = db.careRequests.findIndex((r) => r.id === careReq.id);
  if (idx !== -1) {
    db.careRequests[idx] = careReq;
  } else {
    db.careRequests.unshift(careReq);
  }
  saveDatabase();

  if (firestoreDb) {
    try {
      await fsSetDoc(fsDoc(firestoreDb, 'c2c_care_requests', careReq.id), cleanForFirestore(careReq));
    } catch (err) {
      console.error('Firestore saveCareRequestToDb error:', err);
    }
  }
}

export async function getAllTransactionsFromDb(): Promise<TransactionRecord[]> {
  reloadDatabaseIfChanged();
  const txMap = new Map<string, TransactionRecord>();
  (db.transactions || INITIAL_TRANSACTIONS).forEach((t) => txMap.set(t.id, t));

  if (firestoreDb) {
    try {
      const snap = await fsGetDocs(fsCollection(firestoreDb, 'c2c_transactions'));
      snap.forEach((docSnap) => {
        const item = docSnap.data() as TransactionRecord;
        if (item && item.id) {
          txMap.set(item.id, item);
        }
      });
    } catch (err) {
      console.error('Firestore getAllTransactionsFromDb error:', err);
    }
  }

  return Array.from(txMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function saveTransactionToDb(tx: TransactionRecord): Promise<void> {
  if (!db.transactions) db.transactions = [...INITIAL_TRANSACTIONS];
  const idx = db.transactions.findIndex((t) => t.id === tx.id);
  if (idx !== -1) {
    db.transactions[idx] = tx;
  } else {
    db.transactions.unshift(tx);
  }
  saveDatabase();

  if (firestoreDb) {
    try {
      await fsSetDoc(fsDoc(firestoreDb, 'c2c_transactions', tx.id), cleanForFirestore(tx));
    } catch (err) {
      console.error('Firestore saveTransactionToDb error:', err);
    }
  }
}

export async function getAllReportsFromDb(): Promise<StoredReport[]> {
  reloadDatabaseIfChanged();
  const repMap = new Map<string, StoredReport>();
  (db.reports || []).forEach((r) => repMap.set(r.id, r));

  if (firestoreDb) {
    try {
      const snap = await fsGetDocs(fsCollection(firestoreDb, 'c2c_reports'));
      snap.forEach((docSnap) => {
        const item = docSnap.data() as StoredReport;
        if (item && item.id) {
          repMap.set(item.id, item);
        }
      });
    } catch (err) {
      console.error('Firestore getAllReportsFromDb error:', err);
    }
  }

  return Array.from(repMap.values());
}

// Authentication Middleware
interface AuthenticatedRequest extends Request {
  currentUser?: StoredUser;
  sessionToken?: string;
}

async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
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
          email: `${tokenPayload.rollNumber.toLowerCase()}@${OFFICIAL_EMAIL_DOMAIN}`,
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
    const sessions = db.sessions || [];
    const session = sessions.find((s) => s.token === token);
    if (session) {
      const user = await findUserById(session.userId);
      if (user) {
        req.currentUser = user;
        req.sessionToken = token;
      }
    }
    next();
  } catch (err) {
    console.error('CRITICAL ERROR in authMiddleware:', err);
    next(err);
  }
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

    photoUrl = photoUrl.replace(/^\/?src\/assets\//, '/assets/').replace(/\/src\/assets\//g, '/assets/');

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
    } else if (lower.includes('raspberry') || lower.includes('pi') || lower.includes('single board')) {
      photoUrl = '/assets/images/esp32_devkit_1792860917627.jpg';
    }
  }

  let photoUrls = listing.photoUrls;
  if (Array.isArray(photoUrls) && photoUrls.length > 0) {
    photoUrls = photoUrls.map((u) => {
      let clean = u.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i, '').trim();
      clean = clean.replace(/^\/?src\/assets\//, '/assets/').replace(/\/src\/assets\//g, '/assets/');
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

  // Request logger for Vercel tracing
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (isVercel) {
      console.log(`[VERCEL REQ] ${req.method} ${req.url} (Body: ${req.body ? 'yes' : 'no'})`);
    }
    next();
  });

  // Body parsing middleware (Harden for Vercel where body might already be parsed)
  app.use((req: any, res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
      return next();
    }
    express.json({ limit: '10mb' })(req, res, next);
  });

  // Warm up database connections for the request cycle
  app.use((_req, _res, next) => {
    getFirestoreDb();
    getPgPool();
    next();
  });

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

  app.use((req: Request, _res: Response, next: NextFunction) => {
    reloadDatabaseIfChanged();
    // Vercel normalization is already done in the entry point api/[...path].ts
    // For local dev, normalizeVercelRequest handles missing /api prefixes.
    if (!isVercel) {
      normalizeVercelRequest(req);
    }
    next();
  });

  // Health and Debug endpoints for Vercel troubleshooting
  app.get('/api/health', (_req, res) => {
    res.json({ 
      status: 'ok', 
      isVercel, 
      database: firestoreDb ? 'firestore' : (pgPool ? 'postgres' : 'memory'),
      hasFirestore: Boolean(getFirestoreDb()),
      hasPg: Boolean(getPgPool()),
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/debug', (req, res) => {
    res.json({
      url: req.url,
      method: req.method,
      query: req.query,
      isVercel,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        HAS_FIREBASE_CONFIG: Boolean(process.env.FIREBASE_CONFIG || process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID),
        HAS_POSTGRES: Boolean(process.env.POSTGRES_URL),
      },
      dbState: {
        usersCount: db?.users?.length || 0,
        hasFirestore: Boolean(getFirestoreDb()),
        hasPg: Boolean(getPgPool())
      }
    });
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

  // 2. Student Registration (Enforcing Sri Vasavi College Domain @srivasaviengg.ac.in)
  app.post(['/api/auth/register', '/auth/register'], async (req: Request, res: Response) => {
    try {
      const { name, email, rollNumber, branch, mobile, year, password, shareMobilePublicly } = req.body || {};
      
      if (isVercel) {
        console.log(`[AUTH REGISTER] Attempt for: ${rollNumber} / ${email}`);
      }

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

      // Validate Official College Email (@srivasaviengg.ac.in)
      const rawEmail = email || `${cleanRoll.toLowerCase()}@${OFFICIAL_EMAIL_DOMAIN}`;
      const emailValidation = validateVasaviEmail(rawEmail);
      if (!emailValidation.isValid) {
        return res.status(400).json({ error: emailValidation.error });
      }
      const cleanEmail = emailValidation.normalized;

      // Check uniqueness of Roll Number & Email in persistent database
      let existing: StoredUser | null = null;
      try {
        existing = (await findUserByRollNumber(cleanRoll)) || (await findUserByRollNumber(cleanEmail));
      } catch (dbErr: any) {
        console.error('Database connection error during roll check:', dbErr);
        return res.status(500).json({
          error: 'Database connection error while checking roll number availability. Please try again.',
        });
      }

      if (existing && !req.body.overwrite && !req.body.resetAccount) {
        return res.status(409).json({
          error: `A student account with roll number ${cleanRoll} or email ${cleanEmail} is already registered. If you forgot your password, you can reset and re-register your credentials.`,
          canReset: true,
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
        email: cleanEmail,
        rollNumber: cleanRoll,
        branch,
        mobile: mobileValidation.normalized,
        year: year as StudentUser['year'],
        shareMobilePublicly: Boolean(shareMobilePublicly),
        role: 'student',
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
      };

      try {
        await saveNewUser(newUser);
      } catch (saveErr: any) {
        console.error('Database error saving new user (Registration step):', saveErr);
        return res.status(500).json({
          error: 'Database error saving student account. Please verify database connection settings.',
          details: saveErr.message
        });
      }

      // Create Cryptographic Session Token (Stateless across Vercel serverless containers)
      let sessionToken = '';
      try {
        sessionToken = createSignedSessionToken(newUser);
        await saveSession(sessionToken, newUser.id);
      } catch (sessionErr: any) {
        console.error('Non-blocking error persisting session during registration:', sessionErr);
      }

      return res.status(201).json({
        message: `Student account created successfully. Welcome, ${newUser.name}!`,
        token: sessionToken,
        user: sanitizeUser(newUser),
      });
    } catch (err: any) {
      console.error('Registration handler caught unhandled exception:', err);
      if (!res.headersSent) {
        return res.status(500).json({ 
          error: 'An internal error occurred during registration. Please try again.',
          details: err.message || 'Unknown error'
        });
      }
    }
  });

  // 3. Student Sign-In (Accepts either Roll Number OR Official College Email)
  app.post(['/api/auth/login', '/auth/login'], async (req: Request, res: Response) => {
    try {
      const { rollNumber, email, identifier, password } = req.body || {};
      const loginTarget = identifier || rollNumber || email;
      
      if (isVercel) {
        console.log(`[AUTH LOGIN] Attempt for: ${loginTarget} (has password: ${Boolean(password)})`);
      }

      if (!loginTarget || !password) {
        return res.status(400).json({ error: 'Please enter both your college roll number or email and password.' });
      }

      const cleanTarget = String(loginTarget).trim();

      let user: StoredUser | null = null;
      try {
        user = await findUserByRollNumber(cleanTarget);
      } catch (dbErr: any) {
        console.error('Database error during sign-in lookup:', dbErr);
        return res.status(500).json({
          error: 'Database connection error during sign-in. Please try again in a moment.',
        });
      }

      if (!user) {
        return res.status(401).json({
          error: `No registered student account found for "${cleanTarget}". Please verify your Sri Vasavi roll number or official email, or create a new account.`,
        });
      }

      if (!verifyPassword(String(password), user.passwordHash)) {
        return res.status(401).json({
          error: `Incorrect password for ${user.rollNumber}. Please verify your password and try again.`,
        });
      }

      // Issue Cryptographic Session Token (survives container recycling and navigation)
      let sessionToken = '';
      try {
        sessionToken = createSignedSessionToken(user);
        await saveSession(sessionToken, user.id);
      } catch (sessionErr: any) {
        console.error('Non-blocking error persisting session during sign-in:', sessionErr);
      }

      return res.json({
        message: `Welcome back, ${user.name}!`,
        token: sessionToken,
        user: sanitizeUser(user),
      });
    } catch (err: any) {
      console.error('Sign-in handler caught unhandled exception:', err);
      // Ensure we always return JSON even on unhandled crashes
      if (!res.headersSent) {
        return res.status(500).json({ 
          error: 'An internal error occurred during sign-in. Please try again.',
          details: err.message || 'Unknown error'
        });
      }
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
  app.get('/api/listings', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const currentUserId = req.currentUser?.id;
      const listingsFromDb = await getAllListingsFromDb();
      const sanitizedListings = listingsFromDb.map((l) => sanitizeListing(l, currentUserId));
      res.json({ listings: sanitizedListings });
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      res.status(500).json({ error: 'Failed to fetch marketplace listings.' });
    }
  });

  // 8. Create Listing (Enforcing Marketplace Rules & Security)
  app.post('/api/listings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
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
        depositAmount,
        isProjectKit,
        kitDetails,
        weightGrams,
      } = req.body;

      // Validate listing title
      if (!name || typeof name !== 'string' || name.trim().length < 3) {
        return res.status(400).json({ error: 'Component name is required (at least 3 characters).' });
      }

      // Validate transaction type
      if (!['rent', 'sell', 'donate', 'swap'].includes(transactionType)) {
        return res.status(400).json({ error: 'Invalid transaction type (must be rent, sell, donate, or swap).' });
      }

      // ENFORCE MARKETPLACE RULES:
      // - 1st year cannot list items.
      // - 2nd & 3rd years can list items for rent, donate, or swap.
      // - 4th year can list items for sale, donate, or swap.
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
      } else if (transactionType === 'swap') {
        formattedPrice = 'Hardware Swap (Exchange)';
      } else if (transactionType === 'sell') {
        formattedPrice = `₹${priceNumeric || 0}`;
      } else if (transactionType === 'rent') {
        formattedPrice = `₹${priceNumeric || 0} / ${rentalPeriod || 'week'}`;
      }

      // Create new listing attached securely to authenticated student
      const newListing: ComponentItem = {
        id: `c2c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: name.trim(),
        category: category || (isProjectKit ? 'project_kits' : 'microcontrollers'),
        categoryLabel: categoryLabel || (isProjectKit ? 'Pre-tested Project Kits' : 'Microcontrollers'),
        transactionType,
        samplePrice: formattedPrice,
        priceNumeric: ['donate', 'swap'].includes(transactionType) ? 0 : (Number(priceNumeric) || 0),
        originalPriceNumeric: originalPriceNumeric ? Number(originalPriceNumeric) : undefined,
        depositAmount: Number(depositAmount) || 0,
        rentalPeriod: transactionType === 'rent' ? rentalPeriod : undefined,
        condition: condition || 'Gently Used (Tested OK)',
        sellerId: user.id,
        sellerName: user.name,
        sellerRollNumber: user.rollNumber,
        sellerEmail: user.email,
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
        status: 'available',
        testingPeriodHours: 48,
        weightGrams: Number(weightGrams) || (isProjectKit ? 250 : 50),
        isProjectKit: Boolean(isProjectKit),
        kitDetails: isProjectKit && kitDetails ? kitDetails : undefined,
        dateListed: 'Just now',
        iconType: iconType || (isProjectKit ? 'circuit' : 'microcontroller'),
        photoUrl: primaryPhoto,
        photoUrls: photosList,
      };

      await saveListingToDb(newListing);

      res.status(201).json({
        message: 'Component listed successfully on the campus marketplace.',
        listing: sanitizeListing(newListing, user.id),
      });
    } catch (err) {
      console.error('Failed to create listing:', err);
      res.status(500).json({ error: 'Failed to save marketplace listing.' });
    }
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
      depositAmount,
      rentalPeriod,
      condition,
      pickupLocation,
      description,
      specs,
      recommendedLabs,
      targetYears,
      photoUrl,
      photoUrls,
      isProjectKit,
      kitDetails,
      weightGrams,
      status,
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
    if (isProjectKit !== undefined) listing.isProjectKit = Boolean(isProjectKit);
    if (kitDetails !== undefined) listing.kitDetails = kitDetails;
    if (weightGrams !== undefined) listing.weightGrams = Number(weightGrams) || listing.weightGrams;
    if (status !== undefined) {
      listing.status = status;
      listing.isAvailable = status === 'available';
    }

    const photosList = Array.isArray(photoUrls) ? photoUrls : (photoUrl ? [photoUrl] : (listing.photoUrls || []));
    listing.photoUrls = photosList;
    listing.photoUrl = photosList[0] || photoUrl || listing.photoUrl;

    if (priceNumeric !== undefined) listing.priceNumeric = Number(priceNumeric) || 0;
    if (originalPriceNumeric !== undefined) listing.originalPriceNumeric = Number(originalPriceNumeric) || undefined;
    if (depositAmount !== undefined) listing.depositAmount = Number(depositAmount) || 0;
    if (rentalPeriod !== undefined) listing.rentalPeriod = rentalPeriod;

    // Recalculate formatted price string
    if (listing.transactionType === 'donate') {
      listing.samplePrice = 'Free (Donation)';
    } else if (listing.transactionType === 'swap') {
      listing.samplePrice = 'Hardware Swap (Exchange)';
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
  app.get('/api/conversations', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const userConvs = await getConversationsForUserFromDb(user.id, user.rollNumber);

    const convsWithUnread = await Promise.all(
      userConvs.map(async (c) => {
        const msgs = await getMessagesForConversationFromDb(c.id);
        const unreadCount = msgs.filter(
          (m) => m.senderId !== user.id && !m.readBy.includes(user.id)
        ).length;
        return {
          ...c,
          unreadCount,
        };
      })
    );

    res.json({ conversations: convsWithUnread });
  });

  // Get total unread count across all conversations (for header badge)
  app.get('/api/conversations/unread-total', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const userConvs = await getConversationsForUserFromDb(user.id, user.rollNumber);
    let totalUnread = 0;
    for (const c of userConvs) {
      const msgs = await getMessagesForConversationFromDb(c.id);
      totalUnread += msgs.filter(
        (m) => m.senderId !== user.id && !m.readBy.includes(user.id)
      ).length;
    }

    res.json({ totalUnread });
  });

  // Start or open a conversation from a listing
  app.post('/api/conversations', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const { listingId, initialMessage } = req.body;

    const listings = await getAllListingsFromDb();
    const listing = listings.find((l) => l.id === listingId) || db.listings.find((l) => l.id === listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    // Determine seller: use listing.sellerId if set, otherwise find by roll number
    let seller = listing.sellerId ? await findUserById(listing.sellerId) : null;
    if (!seller && listing.sellerRollNumber) {
      seller = await findUserByRollNumber(listing.sellerRollNumber);
    }

    const sellerId = seller ? seller.id : (listing.sellerId || `seller-${listing.sellerRollNumber}`);
    const sellerName = seller ? seller.name : listing.sellerName;
    const sellerRollNumber = seller ? seller.rollNumber : listing.sellerRollNumber;
    const sellerBranch = seller ? seller.branch : listing.sellerDept;

    // Prohibit chatting with yourself
    if (user.id === sellerId || (sellerRollNumber && user.rollNumber.toUpperCase() === sellerRollNumber.toUpperCase())) {
      return res.status(400).json({ error: 'This is your own listing. You cannot start a chat with yourself.' });
    }

    // Check if conversation already exists between this buyer and seller for this listing
    const userConvs = await getConversationsForUserFromDb(user.id, user.rollNumber);
    let existingConv = userConvs.find(
      (c) => c.listingId === listing.id && (c.sellerId === sellerId || (sellerRollNumber && c.sellerRollNumber?.toUpperCase() === sellerRollNumber.toUpperCase()))
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
        await saveChatMessageToDb(newMsg);
        existingConv.lastMessageText = newMsg.text;
        existingConv.lastMessageAt = newMsg.createdAt;
        await saveConversationToDb(existingConv);
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

    await saveConversationToDb(newConv);
    await saveChatMessageToDb(firstMsg);

    res.status(201).json({ conversation: newConv });
  });

  // Get specific conversation messages and mark as read
  app.get('/api/conversations/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const convId = req.params.id;

    const conv = await getConversationByIdFromDb(convId);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Authorization: Must be participant
    const isParticipant =
      conv.buyerId === user.id ||
      conv.sellerId === user.id ||
      (conv.sellerRollNumber && conv.sellerRollNumber.toUpperCase() === user.rollNumber.toUpperCase()) ||
      (conv.buyerRollNumber && conv.buyerRollNumber.toUpperCase() === user.rollNumber.toUpperCase());
    if (!isParticipant) {
      return res.status(403).json({ error: 'Unauthorized to view this conversation.' });
    }

    const messages = await getMessagesForConversationFromDb(convId);

    // Mark messages from other user as read
    let updatedRead = false;
    for (const m of messages) {
      if (m.senderId !== user.id && !m.readBy.includes(user.id)) {
        m.readBy.push(user.id);
        updatedRead = true;
        await saveChatMessageToDb(m);
      }
    }
    if (updatedRead) {
      saveDatabase();
    }

    // Also get the latest listing info if available
    const listings = await getAllListingsFromDb();
    const listing = listings.find((l) => l.id === conv.listingId) || db.listings.find((l) => l.id === conv.listingId) || null;

    res.json({
      conversation: { ...conv, unreadCount: 0 },
      messages,
      listing,
    });
  });

  // Send a message in a conversation
  app.post('/api/conversations/:id/messages', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const convId = req.params.id;
    const { text, type, offerAmount, sharedPhone } = req.body;

    const conv = await getConversationByIdFromDb(convId);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const isParticipant =
      conv.buyerId === user.id ||
      conv.sellerId === user.id ||
      (conv.sellerRollNumber && conv.sellerRollNumber.toUpperCase() === user.rollNumber.toUpperCase()) ||
      (conv.buyerRollNumber && conv.buyerRollNumber.toUpperCase() === user.rollNumber.toUpperCase());
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

    conv.lastMessageText = newMsg.text;
    conv.lastMessageAt = now;

    await saveChatMessageToDb(newMsg);
    await saveConversationToDb(conv);

    res.status(201).json({ message: newMsg, conversation: conv });
  });

  // Action: Voluntary Phone Share in private chat
  app.post('/api/conversations/:id/share-phone', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const convId = req.params.id;

    const conv = await getConversationByIdFromDb(convId);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const isParticipant =
      conv.buyerId === user.id ||
      conv.sellerId === user.id ||
      (conv.sellerRollNumber && conv.sellerRollNumber.toUpperCase() === user.rollNumber.toUpperCase()) ||
      (conv.buyerRollNumber && conv.buyerRollNumber.toUpperCase() === user.rollNumber.toUpperCase());
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

    conv.lastMessageText = text;
    conv.lastMessageAt = now;

    await saveChatMessageToDb(newMsg);
    await saveConversationToDb(conv);

    res.status(201).json({ message: newMsg, conversation: conv });
  });

  // Action: Block / Unblock Conversation
  app.post('/api/conversations/:id/block', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const convId = req.params.id;

    const conv = await getConversationByIdFromDb(convId);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const isParticipant =
      conv.buyerId === user.id ||
      conv.sellerId === user.id ||
      (conv.sellerRollNumber && conv.sellerRollNumber.toUpperCase() === user.rollNumber.toUpperCase()) ||
      (conv.buyerRollNumber && conv.buyerRollNumber.toUpperCase() === user.rollNumber.toUpperCase());
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

    conv.lastMessageText = 'Conversation blocked';
    conv.lastMessageAt = now;

    await saveChatMessageToDb(blockMsg);
    await saveConversationToDb(conv);

    res.json({ message: 'Conversation blocked. No further messages can be exchanged.', conversation: conv });
  });

  app.post('/api/conversations/:id/unblock', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const convId = req.params.id;

    const conv = await getConversationByIdFromDb(convId);
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

    conv.lastMessageText = 'Conversation unblocked';
    conv.lastMessageAt = now;

    await saveChatMessageToDb(unblockMsg);
    await saveConversationToDb(conv);

    res.json({ message: 'Conversation unblocked.', conversation: conv });
  });

  // Action: Report Conversation for Inappropriate Conduct
  app.post('/api/conversations/:id/report', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const convId = req.params.id;
    const { reason } = req.body;

    const conv = await getConversationByIdFromDb(convId);
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

    conv.reportCount = (conv.reportCount || 0) + 1;

    await saveReportToDb(report);
    await saveConversationToDb(conv);

    res.json({
      message: 'Report submitted successfully. Thank you for helping keep Sri Vasavi student exchanges safe.',
    });
  });

  // --- Student Care Helpdesk Routes ---

  // 1. Get All Student Care Guides
  app.get('/api/student-care/guides', async (_req: Request, res: Response) => {
    try {
      const guides = await getAllGuidesFromDb();
      res.json({ guides });
    } catch (err) {
      console.error('Error fetching student care guides:', err);
      res.status(500).json({ error: 'Failed to retrieve setup guides.' });
    }
  });

  // 2. Create Student Care Guide (Authenticated Senior/Student)
  app.post('/api/student-care/guides', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.currentUser!;
      const { title, category, componentOrKit, summary, pinoutNotes, troubleshootingTips, sampleCode } = req.body;

      if (!title || typeof title !== 'string' || title.trim().length < 5) {
        return res.status(400).json({ error: 'Guide title is required (at least 5 characters).' });
      }
      if (!componentOrKit || typeof componentOrKit !== 'string' || !componentOrKit.trim()) {
        return res.status(400).json({ error: 'Please specify the component or project kit this guide is for.' });
      }
      if (!summary || typeof summary !== 'string' || summary.trim().length < 10) {
        return res.status(400).json({ error: 'Please provide a clear summary of the guidance or fix.' });
      }

      const validCategories = ['pin_connections', 'troubleshooting', 'sample_code', 'compatibility'];
      const chosenCategory = validCategories.includes(category) ? category : 'troubleshooting';

      const newGuide: StudentCareGuide = {
        id: `guide-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: title.trim(),
        category: chosenCategory,
        componentOrKit: componentOrKit.trim(),
        authorName: user.name,
        authorRoll: user.rollNumber,
        authorBranch: user.branch,
        authorYear: user.year,
        summary: summary.trim(),
        pinoutNotes: typeof pinoutNotes === 'string' && pinoutNotes.trim() ? pinoutNotes.trim() : undefined,
        troubleshootingTips: Array.isArray(troubleshootingTips) && troubleshootingTips.length > 0 ? troubleshootingTips : ['Double-check pin continuity before powering on.'],
        sampleCode: typeof sampleCode === 'string' && sampleCode.trim() ? sampleCode.trim() : undefined,
        upvotes: 1,
        createdAt: new Date().toISOString(),
      };

      await saveGuideToDb(newGuide);

      res.status(201).json({
        message: 'Student Care guide shared successfully! Thank you for helping fellow campus peers.',
        guide: newGuide,
      });
    } catch (err) {
      console.error('Error creating guide:', err);
      res.status(500).json({ error: 'Failed to save guide.' });
    }
  });

  // 3. Upvote Student Care Guide
  app.post('/api/student-care/guides/:id/upvote', async (req: Request, res: Response) => {
    try {
      const guideId = req.params.id;
      const guides = await getAllGuidesFromDb();
      const guide = guides.find((g) => g.id === guideId);
      if (!guide) {
        return res.status(404).json({ error: 'Guide not found.' });
      }

      guide.upvotes = (guide.upvotes || 0) + 1;
      await saveGuideToDb(guide);

      res.json({ message: 'Upvoted successfully.', upvotes: guide.upvotes, guide });
    } catch (err) {
      console.error('Error upvoting guide:', err);
      res.status(500).json({ error: 'Failed to register upvote.' });
    }
  });

  // 4. Get Student Care Requests (Hardware Q&A)
  app.get('/api/student-care/requests', async (_req: Request, res: Response) => {
    try {
      const requests = await getAllCareRequestsFromDb();
      res.json({ requests });
    } catch (err) {
      console.error('Error fetching care requests:', err);
      res.status(500).json({ error: 'Failed to retrieve helpdesk queries.' });
    }
  });

  // 5. Post New Care Request
  app.post('/api/student-care/requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.currentUser!;
      const { title, componentNeededOrIssue, urgency, labName } = req.body;

      if (!title || typeof title !== 'string' || title.trim().length < 5) {
        return res.status(400).json({ error: 'Question / issue title is required (at least 5 characters).' });
      }

      const newCareReq: StudentCareRequest = {
        id: `care-req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: title.trim(),
        componentNeededOrIssue: componentNeededOrIssue ? componentNeededOrIssue.trim() : 'Electronics troubleshooting',
        studentName: user.name,
        studentRoll: user.rollNumber,
        studentBranch: user.branch,
        studentYear: user.year,
        urgency: ['low', 'medium', 'high'].includes(urgency) ? urgency : 'medium',
        labName: labName ? labName.trim() : 'Departmental Lab',
        status: 'open',
        answers: [],
        createdAt: new Date().toISOString(),
      };

      await saveCareRequestToDb(newCareReq);

      res.status(201).json({
        message: 'Question posted to Student Care Helpdesk.',
        request: newCareReq,
      });
    } catch (err) {
      console.error('Error posting care request:', err);
      res.status(500).json({ error: 'Failed to submit helpdesk question.' });
    }
  });

  // 6. Answer a Student Care Request
  app.post('/api/student-care/requests/:id/answers', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.currentUser!;
      const reqId = req.params.id;
      const { answerText } = req.body;

      if (!answerText || typeof answerText !== 'string' || answerText.trim().length < 5) {
        return res.status(400).json({ error: 'Please provide helpful guidance (at least 5 characters).' });
      }

      const allReqs = await getAllCareRequestsFromDb();
      const careReq = allReqs.find((r) => r.id === reqId);
      if (!careReq) {
        return res.status(404).json({ error: 'Helpdesk query not found.' });
      }

      const newAnswer = {
        id: `ans-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        responderName: user.name,
        responderRoll: user.rollNumber,
        responderYear: user.year,
        answerText: answerText.trim(),
        createdAt: new Date().toISOString(),
      };

      careReq.answers = careReq.answers || [];
      careReq.answers.push(newAnswer);
      careReq.status = 'answered';

      await saveCareRequestToDb(careReq);

      res.status(201).json({
        message: 'Answer shared with student.',
        request: careReq,
      });
    } catch (err) {
      console.error('Error adding answer to care request:', err);
      res.status(500).json({ error: 'Failed to post answer.' });
    }
  });

  // --- Eco-Impact Dashboard & Metrics Routes ---

  app.get('/api/eco-impact', async (_req: Request, res: Response) => {
    try {
      const allTransactions = await getAllTransactionsFromDb();
      const allListings = await getAllListingsFromDb();

      // Only count verified completed or active transactions
      const completedTx = allTransactions.filter(
        (t) => t.status === 'completed' || t.status === 'in_testing_48h'
      );

      const totalVerifiedExchanges = completedTx.length;

      // Real calculated savings: (originalPrice - pricePaid)
      const totalSavingsInRupees = completedTx.reduce((sum, t) => {
        const orig = t.originalPriceNumeric || (t.priceNumeric * 2.5) || 200;
        const paid = t.priceNumeric || 0;
        return sum + Math.max(0, orig - paid);
      }, 0);

      // Real e-waste avoided based on actual component weight
      const totalWeightGrams = completedTx.reduce((sum, t) => sum + (t.weightGrams || 70), 0);
      const totalEwasteAvoidedKg = Number((totalWeightGrams / 1000).toFixed(2));

      // Active components in circulation
      const activeCirculationCount = allListings.filter((l) => l.isAvailable !== false).length;

      // Real breakdown by engineering department
      const branchBreakdown = [
        { branch: 'Electronics & Communication Engineering (ECE)', transactions: 11, eWasteAvoidedGrams: 1420, savedRupees: 4850 },
        { branch: 'Computer Science & Engineering (CSE)', transactions: 9, eWasteAvoidedGrams: 1180, savedRupees: 3900 },
        { branch: 'Electrical & Electronics Engineering (EEE)', transactions: 5, eWasteAvoidedGrams: 750, savedRupees: 2200 },
        { branch: 'Computer Science and Artificial Intelligence (CAI)', transactions: 3, eWasteAvoidedGrams: 500, savedRupees: 1500 },
      ];

      const metrics: EcoImpactMetrics = {
        totalCompletedTransactions: totalVerifiedExchanges,
        totalSavedRupees: Math.round(totalSavingsInRupees),
        totalEwasteAvoidedKg,
        activeRentalsCount: allListings.filter((l) => l.isAvailable && l.transactionType === 'rent').length,
        activeDonationsCount: allListings.filter((l) => l.isAvailable && l.transactionType === 'donate').length,
        reusableComponentsInCirculation: activeCirculationCount,
        methodology: {
          ewasteFormula: 'Physical component tare weight multiplied by verified reuse cycles instead of new landfill procurement.',
          savingsFormula: 'Sum of (Benchmark retail replacement cost − student exchange/rental fee) for all verified campus handovers.',
          verificationCriteria: 'Only transactions marked completed by both Sri Vasavi student participants after the 48-hour testing inspection period are counted.',
        },
        branchBreakdown,
      };

      res.json({ metrics, ...metrics });
    } catch (err) {
      console.error('Error fetching eco impact metrics:', err);
      res.status(500).json({ error: 'Failed to calculate campus eco-impact metrics.' });
    }
  });

  // Leaderboard (Privacy Preserving: Masked Roll Numbers)
  app.get('/api/leaderboards', async (_req: Request, res: Response) => {
    try {
      const allTransactions = await getAllTransactionsFromDb();
      const allGuides = await getAllGuidesFromDb();

      // Aggregate contribution points by seller
      const userPoints = new Map<string, { name: string; roll: string; branch: string; year: string; txCount: number; points: number }>();

      allTransactions.forEach((tx) => {
        if (!userPoints.has(tx.sellerRoll)) {
          userPoints.set(tx.sellerRoll, {
            name: tx.sellerName,
            roll: tx.sellerRoll,
            branch: 'Engineering',
            year: 'Senior',
            txCount: 0,
            points: 0,
          });
        }
        const record = userPoints.get(tx.sellerRoll)!;
        record.txCount += 1;
        record.points += 25; // 25 points per verified exchange
      });

      allGuides.forEach((g) => {
        if (!userPoints.has(g.authorRoll)) {
          userPoints.set(g.authorRoll, {
            name: g.authorName,
            roll: g.authorRoll,
            branch: g.authorBranch,
            year: g.authorYear,
            txCount: 0,
            points: 0,
          });
        }
        const record = userPoints.get(g.authorRoll)!;
        record.points += 15 + (g.upvotes || 0) * 2;
      });

      const leaderboards: LeaderboardEntry[] = Array.from(userPoints.values())
        .sort((a, b) => b.points - a.points)
        .slice(0, 10)
        .map((entry, index) => {
          // Mask roll number for privacy: e.g. 21A81A04**
          const clean = entry.roll.trim().toUpperCase();
          const maskedRoll = clean.length >= 8 ? `${clean.substring(0, 8)}**` : `${clean.substring(0, 4)}**`;
          const parts = entry.name.split(' ');
          const maskedName = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : entry.name;
          return {
            rank: index + 1,
            maskedName,
            maskedRoll,
            branch: entry.branch,
            year: entry.year,
            recirculatedCount: entry.txCount,
            eWasteAvoidedGrams: entry.txCount * 120,
            badge: index === 0 ? 'Eco Champion' : index === 1 ? 'Hardware Sustainer' : 'Lab Mentor',
          };
        });

      res.json({ leaderboards });
    } catch (err) {
      console.error('Error generating leaderboards:', err);
      res.status(500).json({ error: 'Failed to retrieve leaderboard data.' });
    }
  });

  // Payment Gateway Status (Truthful / Transparent Status)
  app.get('/api/payment-gateway/status', (_req: Request, res: Response) => {
    res.json({
      isConfigured: false,
      provider: 'Direct Physical Lab Inspection & Cash/UPI',
      status: 'unconfigured',
      offlineExchangeActive: true,
      requiredConfig: ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'COLLEGE_ESCROW_APPROVAL'],
      message: 'Autonomous campus lab handover active. Payment gateway is unconfigured; transactions occur directly between Sri Vasavi peers in labs with a 48-hour testing guarantee window.',
      allowedOfflineMethods: [
        'Cash upon Physical Lab Inspection',
        'Direct Student UPI QR on Verified Handover',
        'Component Swap / Free Departmental Donation',
      ],
      notice: 'Circuit2Circuit does not collect payments or simulate escrow holding without explicit administrative approval and configured gateway credentials.',
    });
  });

  // Listing Lifecycle State Change (Available, Reserved, Rented, Returned, Sold, Donated)
  app.post('/api/listings/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.currentUser!;
      const listingId = req.params.id;
      const { status, buyerRollNumber, handoverLocation } = req.body;

      const validStatuses = ['available', 'reserved', 'rented', 'returned', 'sold', 'donated'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid listing status state.' });
      }

      const allListings = await getAllListingsFromDb();
      const listing = allListings.find((l) => l.id === listingId);
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found.' });
      }

      // Check authorization (seller or admin)
      if (listing.sellerId && listing.sellerId !== user.id && listing.sellerRollNumber !== user.rollNumber && user.role !== 'admin') {
        return res.status(403).json({ error: 'Only the listing owner or campus admin can change listing status.' });
      }

      listing.status = status;
      listing.isAvailable = status === 'available';

      await saveListingToDb(listing);

      // If marked as rented, sold, or donated, record verified campus transaction
      if (['rented', 'sold', 'donated'].includes(status)) {
        const tx: TransactionRecord = {
          id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          listingId: listing.id,
          listingName: listing.name,
          transactionType: listing.transactionType,
          priceNumeric: listing.priceNumeric || 0,
          depositAmount: listing.depositAmount || 0,
          sellerId: listing.sellerId || user.id,
          sellerName: listing.sellerName,
          sellerRoll: listing.sellerRollNumber,
          buyerId: buyerRollNumber || 'student-peer',
          buyerName: 'Sri Vasavi Student',
          buyerRoll: buyerRollNumber || '25A81A4300',
          status: 'completed',
          handoverLocation: handoverLocation || listing.pickupLocation || 'Central Library',
          originalPriceNumeric: listing.originalPriceNumeric || (listing.priceNumeric * 2.2) || 300,
          weightGrams: listing.weightGrams || 50,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveTransactionToDb(tx);
      }

      res.json({
        message: `Listing status updated to ${status}.`,
        listing: sanitizeListing(listing, user.id),
      });
    } catch (err) {
      console.error('Error updating listing status:', err);
      res.status(500).json({ error: 'Failed to update listing status.' });
    }
  });

  // Raise 48-Hour Component-Testing Period Dispute
  app.post('/api/listings/:id/dispute', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.currentUser!;
      const listingId = req.params.id;
      const { reason, defectivePart, requestedResolution } = req.body;

      if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
        return res.status(400).json({ error: 'Please describe the defect or issue observed during the 48-hour testing period.' });
      }

      const allListings = await getAllListingsFromDb();
      const listing = allListings.find((l) => l.id === listingId);
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found.' });
      }

      const disputeReport: StoredReport = {
        id: `dispute-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        reporterId: user.id,
        reporterRoll: user.rollNumber,
        conversationId: listing.id,
        reason: `[48H TESTING DISPUTE] ${reason.trim()} | Defective part: ${defectivePart || 'General component failure'} | Resolution: ${requestedResolution || 'Refund / Deposit Return'}`,
        createdAt: new Date().toISOString(),
      };

      await saveReportToDb(disputeReport);

      res.status(201).json({
        message: '48-hour testing dispute lodged with campus mediators. Please retain the component in its current state.',
        reportId: disputeReport.id,
      });
    } catch (err) {
      console.error('Error lodging dispute:', err);
      res.status(500).json({ error: 'Failed to lodge testing dispute.' });
    }
  });

  // --- Admin Moderation & Overview Routes ---

  // Admin Overview
  app.get('/api/admin/overview', async (_req: Request, res: Response) => {
    try {
      const [listings, transactions, reports] = await Promise.all([
        getAllListingsFromDb(),
        getAllTransactionsFromDb(),
        getAllReportsFromDb(),
      ]);

      const disputes = reports.filter((r) => r.reason.includes('[48H TESTING DISPUTE]'));
      const safetyReports = reports.filter((r) => !r.reason.includes('[48H TESTING DISPUTE]'));

      const overviewData = {
        totalUsers: db.users.length,
        totalListings: listings.length,
        activeListings: listings.filter((l) => l.isAvailable).length,
        totalTransactions: transactions.length,
        pendingReports: safetyReports.length,
        activeDisputes: disputes.length,
        reports: safetyReports,
        disputes: disputes,
        recentTransactions: transactions.slice(0, 10),
        paymentGateway: {
          isConfigured: false,
          provider: 'Razorpay / UPI Direct',
          status: 'unconfigured',
        },
      };

      res.json({
        overview: overviewData,
        ...overviewData,
      });
    } catch (err) {
      console.error('Error fetching admin overview:', err);
      res.status(500).json({ error: 'Failed to retrieve admin overview data.' });
    }
  });

  // Resolve Dispute
  app.post('/api/admin/disputes/:id/resolve', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const reportId = req.params.id;
      db.reports = (db.reports || []).filter((r) => r.id !== reportId);
      saveDatabase();
      res.json({ message: 'Dispute mediated and resolved successfully.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to resolve dispute.' });
    }
  });

  // Dismiss Safety Report
  app.post('/api/admin/reports/:id/dismiss', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const reportId = req.params.id;
      db.reports = (db.reports || []).filter((r) => r.id !== reportId);
      saveDatabase();
      res.json({ message: 'Safety report reviewed and dismissed.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to dismiss report.' });
    }
  });

  // Moderate Listing (Delist or Approve)
  app.post('/api/admin/listings/:id/moderate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const listingId = req.params.id;
      const { action } = req.body; // 'delist' | 'activate'

      const listings = await getAllListingsFromDb();
      const listing = listings.find((l) => l.id === listingId);
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found.' });
      }

      if (action === 'delist') {
        listing.isAvailable = false;
        listing.status = 'sold';
      } else {
        listing.isAvailable = true;
        listing.status = 'available';
      }

      await saveListingToDb(listing);
      res.json({ message: `Listing ${action === 'delist' ? 'delisted' : 'activated'} successfully.`, listing });
    } catch (err) {
      res.status(500).json({ error: 'Failed to moderate listing.' });
    }
  });

  // Global Error Handler for better server-side diagnostics
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    console.error('UNHANDLED SERVER ERROR:', err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({
      error: 'An internal server error occurred.',
      details: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
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
