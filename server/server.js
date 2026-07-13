import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import webpush from 'web-push';

const vapidPublicKey = 'BJBaNfrwFP_ZX_Awp6_rgOoWJt42KKagStsZfInoih_gZyK7dDDogJA_2cm0JCNDY0erJ7g7_WRr8Xe3m_wZjls';
const vapidPrivateKey = 'aKHYYiUWorSmhB8bGJc8lTlBDeP-1bgOd1QHU-MMzxo';
webpush.setVapidDetails('mailto:hello@joshuagen.org', vapidPublicKey, vapidPrivateKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from local .env file
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const index = trimmed.indexOf('=');
        const key = trimmed.substring(0, index).trim();
        let value = trimmed.substring(index + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (err) {
  console.warn('Warning: Failed to load .env file:', err.message);
}

const PORT = process.env.PORT || 5000;
let DATA_DIR = process.env.JG_DATA_DIR || path.join(__dirname, 'data');

// Ensure database directory exists for local fallback
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn(`Warning: Failed to access database directory at ${DATA_DIR} (${err.message}). Falling back to local directory.`);
  DATA_DIR = path.join(__dirname, 'data');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const uploadsDir = path.join(DATA_DIR, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

const SERMONS_FILE = path.join(DATA_DIR, 'sermons.json');
const BOOKS_FILE = path.join(DATA_DIR, 'books.json');
const BLOG_FILE = path.join(DATA_DIR, 'blog_posts.json');
const RADIO_FILE = path.join(DATA_DIR, 'radio.json');
const CREDENTIALS_FILE = path.join(DATA_DIR, 'credentials.json');
const DONATIONS_FILE = path.join(DATA_DIR, 'donations.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const DEFAULTS_FILE = path.resolve(__dirname, 'default_data.json');

// In-memory sessions store
const sessions = new Map(); // token -> { username, expiresAt }

// --- Database Connection Pool (Supabase Postgres) ---
let pool = null;
if (process.env.DATABASE_URL) {
  try {
    const pgModule = await import('pg');
    pool = new pgModule.default.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    console.log('DATABASE_URL detected. Connecting to PostgreSQL database...');
  } catch (err) {
    console.error('Failed to load pg module. Database pool inactive.', err);
  }
}

// --- Crypto Helpers ---
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const newHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return newHash === hash;
}

// --- Zepto Mail & OTP Helpers ---
const pendingRegistrations = new Map();
const pendingPasswordResets = new Map();

async function sendZeptoEmail(toEmail, toName, subject, htmlBody) {
  const token = process.env.ZEPTOMAIL_TOKEN;
  const senderEmail = process.env.ZEPTOMAIL_SENDER_EMAIL || "noreply@joshuagen.org";
  const senderName = process.env.ZEPTOMAIL_SENDER_NAME || "Joshua Generation";

  if (!token) {
    console.log(`[ZeptoMail Fallback] No Token found in environment. Logging email content instead:`);
    console.log(`To: ${toName} <${toEmail}>`);
    console.log(`Sender: ${senderName} <${senderEmail}>`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${htmlBody}`);
    console.log("-----------------------------------------");
    return true;
  }

  try {
    const response = await fetch("https://api.zeptomail.com/v1.1/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": token.startsWith("Zoho-enczapikey") ? token : `Zoho-enczapikey ${token}`
      },
      body: JSON.stringify({
        "from": {
          "address": senderEmail,
          "name": senderName
        },
        "to": [
          {
            "email_address": {
              "address": toEmail,
              "name": toName || toEmail
            }
          }
        ],
        "subject": subject,
        "htmlbody": htmlBody
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ZeptoMail Error] Failed to send email to ${toEmail}. Status: ${response.status}. Response: ${errText}`);
      return false;
    }

    console.log(`[ZeptoMail Success] Email sent successfully to ${toEmail}`);
    return true;
  } catch (err) {
    console.error(`[ZeptoMail Exception] Exception while sending email to ${toEmail}:`, err);
    return false;
  }
}

const defaultEvents = [
  { id: '1', title: 'Kingdom Conference 2026', date: '2026-01-20', time: '09:00 AM', location: 'Jerusalem Convention Center', registrations: 1200, capacity: 2000, status: 'Upcoming', speakers: ['Apostle Joshua Iyemifokhae', 'Apostle David Thompson', 'Pastor Sarah Williams'], description: 'A life-changing global conference.', imageUrl: '' },
  { id: '2', title: 'Youth Revival Night', date: '2026-01-15', time: '06:00 PM', location: 'JGen Youth Auditorium', registrations: 450, capacity: 500, status: 'Upcoming', speakers: ['Minister Rachel Grace', 'Youth Pastor Mark'], description: 'Revival, praise, and fire for the youth.', imageUrl: '' },
  { id: '3', title: 'Women of Faith Summit', date: '2026-02-08', time: '10:00 AM', location: 'Grace Cathedral', registrations: 680, capacity: 1000, status: 'Upcoming', speakers: ['Pastor Sarah Williams', 'Minister Rachel Grace'], description: 'Gathering of women of destiny.', imageUrl: '' }
];

const defaultUsers = [
  { id: 1, name: 'Apostle Joshua Iyemifokhae', email: 'john@joshuagen.org', status: 'active', joined: 'Jan 1, 2020', sermons: 312, donations: 15000, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', role: 'Superadmin' }
];

// --- File Data Init Helpers ---
function initLocalData() {
  let defaults = { sermons: [], books: [], blogPosts: [], radio: { url: 'https://mixlr.com/users/8375836/embed', active: false } };
  if (fs.existsSync(DEFAULTS_FILE)) {
    try {
      defaults = JSON.parse(fs.readFileSync(DEFAULTS_FILE, 'utf-8'));
    } catch (e) {
      console.error('Failed to parse default_data.json', e);
    }
  }

  if (!fs.existsSync(SERMONS_FILE)) {
    fs.writeFileSync(SERMONS_FILE, JSON.stringify(defaults.sermons, null, 2), 'utf-8');
    console.log('Initialized local sermons database.');
  }
  if (!fs.existsSync(BOOKS_FILE)) {
    fs.writeFileSync(BOOKS_FILE, JSON.stringify(defaults.books, null, 2), 'utf-8');
    console.log('Initialized local books database.');
  }
  if (!fs.existsSync(BLOG_FILE)) {
    fs.writeFileSync(BLOG_FILE, JSON.stringify(defaults.blogPosts, null, 2), 'utf-8');
    console.log('Initialized local blog posts database.');
  }
  if (!fs.existsSync(RADIO_FILE)) {
    fs.writeFileSync(RADIO_FILE, JSON.stringify(defaults.radio, null, 2), 'utf-8');
    console.log('Initialized local radio settings.');
  }
  if (!fs.existsSync(DONATIONS_FILE)) {
    fs.writeFileSync(DONATIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
    console.log('Initialized local donations database.');
  }
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    const superAdminHash = hashPassword('admin123');
    const adminHash = hashPassword('admin123');
    const defaultCredentials = [
      { username: 'admin@joshuagen.org', salt: superAdminHash.salt, hash: superAdminHash.hash, role: 'superadmin' },
      { username: 'assistant@joshuagen.org', salt: adminHash.salt, hash: adminHash.hash, role: 'admin' }
    ];
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(defaultCredentials, null, 2), 'utf-8');
    console.log('Initialized local credentials array with superadmin and admin.');
  } else {
    try {
      const fileData = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
      if (!Array.isArray(fileData)) {
        const superAdminHash = fileData;
        superAdminHash.role = superAdminHash.role || 'superadmin';
        const adminHash = hashPassword('admin123');
        const defaultCredentials = [
          superAdminHash,
          { username: 'assistant@joshuagen.org', salt: adminHash.salt, hash: adminHash.hash, role: 'admin' }
        ];
        fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(defaultCredentials, null, 2), 'utf-8');
        console.log('Migrated single credentials to credentials array and added assistant@joshuagen.org.');
      }
    } catch (e) {
      console.error('Failed to parse or migrate credentials file:', e);
    }
  }
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
      flutterwave_prophetic_client_id: '',
      flutterwave_prophetic_client_secret: '',
      flutterwave_mission_client_id: '',
      flutterwave_mission_client_secret: '',
      contactEmail: 'hello@joshuagen.org',
      contactPhone: '+1 (555) 123-4567',
      contactAddress: '42 Kingdom Way,\nJerusalem, Israel',
      socialFacebook: '#',
      socialTwitter: '#',
      socialInstagram: '#',
      socialYoutube: '#'
    }, null, 2), 'utf-8');
    console.log('Initialized local settings database.');
  } else {
    // Migrate old key-based settings to V4 fields if needed
    try {
      const existing = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      let needsUpdate = false;
      if (!('flutterwave_prophetic_client_id' in existing)) {
        existing.flutterwave_prophetic_client_id = existing.flutterwave_prophetic_key || '';
        existing.flutterwave_prophetic_client_secret = '';
        existing.flutterwave_mission_client_id = existing.flutterwave_mission_key || '';
        existing.flutterwave_mission_client_secret = '';
        needsUpdate = true;
      }
      if (!('contactEmail' in existing)) {
        existing.contactEmail = 'hello@joshuagen.org';
        existing.contactPhone = '+1 (555) 123-4567';
        existing.contactAddress = '42 Kingdom Way,\nJerusalem, Israel';
        existing.socialFacebook = '#';
        existing.socialTwitter = '#';
        existing.socialInstagram = '#';
        existing.socialYoutube = '#';
        needsUpdate = true;
      }
      if (needsUpdate) {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(existing, null, 2), 'utf-8');
        console.log('Migrated settings to include contact fields.');
      }
    } catch (e) {
      console.warn('Failed to migrate settings:', e.message);
    }
  }
  if (!fs.existsSync(EVENTS_FILE)) {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(defaultEvents, null, 2), 'utf-8');
    console.log('Initialized local events database.');
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf-8');
    console.log('Initialized local users database.');
  }
}

// --- Combined DB Initializer ---
async function initDb() {
  if (pool) {
    try {
      // Connect to pool to verify connection
      await pool.query('SELECT NOW()');
      console.log('Successfully connected to PostgreSQL.');

      // Create Tables
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sermons (
          id VARCHAR PRIMARY KEY,
          title VARCHAR NOT NULL,
          speaker VARCHAR NOT NULL,
          duration VARCHAR,
          thumbnail TEXT,
          views INT DEFAULT 0,
          downloads INT DEFAULT 0,
          date VARCHAR,
          description TEXT,
          category VARCHAR,
          video_url TEXT,
          audio_url TEXT,
          audios JSONB DEFAULT '[]'::jsonb
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS subscribers (
          id VARCHAR PRIMARY KEY,
          email VARCHAR UNIQUE NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      try {

      try {
        await pool.query("ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS name VARCHAR");
      } catch (err) {
        console.warn("Failed to check/add name column to subscribers table:", err.message);
      }
        await pool.query("ALTER TABLE sermons ADD COLUMN IF NOT EXISTS audios JSONB DEFAULT '[]'::jsonb");
      } catch (err) {
        console.warn("Failed to check/add audios column to sermons table:", err.message);
      }
      try {
        await pool.query("ALTER TABLE sermons ADD COLUMN IF NOT EXISTS downloads INT DEFAULT 0");
      } catch (err) {
        console.warn("Failed to check/add downloads column to sermons table:", err.message);
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS books (
          id VARCHAR PRIMARY KEY,
          title VARCHAR NOT NULL,
          author VARCHAR NOT NULL,
          cover_url TEXT,
          description TEXT,
          category VARCHAR,
          download_url TEXT,
          rating REAL DEFAULT 4.8,
          amazon_url TEXT,
          selar_url TEXT,
          pages INT DEFAULT 150,
          chapters JSONB
        );
      `);

      try {
        await pool.query("ALTER TABLE books ADD COLUMN IF NOT EXISTS downloads INT DEFAULT 0");
        await pool.query("ALTER TABLE books ADD COLUMN IF NOT EXISTS pdfs JSONB DEFAULT '[]'::jsonb");
      } catch (err) {
        console.warn("Failed to migrate books table:", err.message);
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS blog_posts (
          id VARCHAR PRIMARY KEY,
          title VARCHAR NOT NULL,
          author VARCHAR NOT NULL,
          date VARCHAR,
          read_time VARCHAR,
          excerpt TEXT,
          image_url TEXT,
          category VARCHAR,
          content TEXT,
          seo_title VARCHAR,
          seo_description TEXT,
          seo_keywords TEXT,
          slug VARCHAR
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS radio (
          id INT PRIMARY KEY,
          url TEXT NOT NULL,
          active BOOLEAN DEFAULT false
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS credentials (
          username VARCHAR PRIMARY KEY,
          salt VARCHAR NOT NULL,
          hash VARCHAR NOT NULL,
          role VARCHAR DEFAULT 'admin'
        );
      `);
      try {
        await pool.query("ALTER TABLE credentials ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'admin'");
        // Automatically make sure main admin is superadmin
        await pool.query("UPDATE credentials SET role = 'superadmin' WHERE LOWER(username) = 'admin@joshuagen.org'");
      } catch (err) {
        console.warn("Failed to check/add role column to credentials:", err.message);
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS donations (
          id VARCHAR PRIMARY KEY,
          donor VARCHAR NOT NULL,
          email VARCHAR NOT NULL,
          amount REAL NOT NULL,
          purpose VARCHAR NOT NULL,
          date VARCHAR NOT NULL,
          method VARCHAR NOT NULL,
          frequency VARCHAR NOT NULL,
          currency VARCHAR DEFAULT 'USD'
        );
      `);

      try {
        await pool.query("ALTER TABLE donations ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD'");
      } catch (err) {
        console.warn("Failed to check/add currency column to donations:", err.message);
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS settings (
          id INT PRIMARY KEY,
          flutterwave_prophetic_client_id TEXT DEFAULT '',
          flutterwave_prophetic_client_secret TEXT DEFAULT '',
          flutterwave_mission_client_id TEXT DEFAULT '',
          flutterwave_mission_client_secret TEXT DEFAULT ''
        );
      `);

      // Clean up accidental lowercase columns
      for (const col of ['contactEmail', 'contactPhone', 'contactAddress', 'socialFacebook', 'socialTwitter', 'socialInstagram', 'socialYoutube', 'homeHeadlinePrefix', 'homeHeadlineHighlight', 'homeHeadlineSuffix', 'homeSubheading', 'homeBibleVerse', 'homeBibleReference']) {
        try { await pool.query(`ALTER TABLE settings DROP COLUMN IF EXISTS ${col.toLowerCase()}`); } catch (e) {}
      }

      // Safe migration: add new columns first (idempotent), THEN remove old ones
      for (const col of ['flutterwave_prophetic_client_id', 'flutterwave_prophetic_client_secret', 'flutterwave_mission_client_id', 'flutterwave_mission_client_secret', 'contactEmail', 'contactPhone', 'contactAddress', 'socialFacebook', 'socialTwitter', 'socialInstagram', 'socialYoutube', 'homeHeadlinePrefix', 'homeHeadlineHighlight', 'homeHeadlineSuffix', 'homeSubheading', 'homeBibleVerse', 'homeBibleReference']) {
        try { await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS "${col}" TEXT DEFAULT ''`); } catch (e) { console.error('Migration error:', e); }
      }

      // Copy data from old column names into new ones (if old columns still exist)
      try {
        await pool.query(`UPDATE settings SET flutterwave_prophetic_client_id = flutterwave_prophetic_key WHERE flutterwave_prophetic_key IS NOT NULL AND flutterwave_prophetic_key != '' AND (flutterwave_prophetic_client_id IS NULL OR flutterwave_prophetic_client_id = '')`);
      } catch (e) { /* old column already gone - OK */ }
      try {
        await pool.query(`UPDATE settings SET flutterwave_mission_client_id = flutterwave_mission_key WHERE flutterwave_mission_key IS NOT NULL AND flutterwave_mission_key != '' AND (flutterwave_mission_client_id IS NULL OR flutterwave_mission_client_id = '')`);
      } catch (e) { /* old column already gone - OK */ }

      // Now safely drop old columns (data already copied above)
      for (const col of ['flutterwave_prophetic_key', 'flutterwave_mission_key']) {
        try { await pool.query(`ALTER TABLE settings DROP COLUMN IF EXISTS ${col}`); } catch (e) {}
      }

      const settingsCheck = await pool.query('SELECT 1 FROM settings WHERE id = 1');
      if (settingsCheck.rowCount === 0) {
        await pool.query(`INSERT INTO settings (id, flutterwave_prophetic_client_id, flutterwave_prophetic_client_secret, flutterwave_mission_client_id, flutterwave_mission_client_secret) VALUES (1, '', '', '', '')`);
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS events (
          id VARCHAR PRIMARY KEY,
          title VARCHAR NOT NULL,
          date VARCHAR NOT NULL,
          time VARCHAR NOT NULL,
          location VARCHAR NOT NULL,
          description TEXT,
          image_url TEXT,
          speakers JSONB DEFAULT '[]'::jsonb,
          registrations INT DEFAULT 0,
          capacity INT DEFAULT 1000,
          status VARCHAR DEFAULT 'Upcoming',
          type VARCHAR DEFAULT 'Service',
          is_featured BOOLEAN DEFAULT false,
          registration_link TEXT
        );
      `);

      const eventCheck = await pool.query('SELECT 1 FROM events LIMIT 1');
      if (eventCheck.rowCount === 0) {
        for (const ev of defaultEvents) {
          await pool.query(
            `INSERT INTO events (id, title, date, time, location, description, image_url, speakers, registrations, capacity, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [ev.id, ev.title, ev.date, ev.time, ev.location, ev.description, ev.imageUrl, JSON.stringify(ev.speakers), ev.registrations, ev.capacity, ev.status]
          );
        }
        console.log('Seeded events table.');
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          endpoint VARCHAR PRIMARY KEY,
          keys JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id BIGINT PRIMARY KEY,
          name VARCHAR NOT NULL,
          email VARCHAR NOT NULL,
          status VARCHAR NOT NULL,
          joined VARCHAR NOT NULL,
          sermons INT DEFAULT 0,
          donations REAL DEFAULT 0,
          avatar TEXT,
          role VARCHAR NOT NULL
        );

        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          name VARCHAR NOT NULL,
          email VARCHAR NOT NULL,
          subject VARCHAR NOT NULL,
          message TEXT NOT NULL,
          status VARCHAR DEFAULT 'unread',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      const userCheck = await pool.query('SELECT 1 FROM users LIMIT 1');
      if (userCheck.rowCount === 0) {
        for (const u of defaultUsers) {
          await pool.query(
            `INSERT INTO users (id, name, email, status, joined, sermons, donations, avatar, role)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [u.id, u.name, u.email, u.status, u.joined, u.sermons, u.donations, u.avatar, u.role]
          );
        }
        console.log('Seeded users table.');
      }

      // Seed if empty
      let defaults = { sermons: [], books: [], blogPosts: [], radio: { url: 'https://mixlr.com/users/8375836/embed', active: false } };
      if (fs.existsSync(DEFAULTS_FILE)) {
        try {
          defaults = JSON.parse(fs.readFileSync(DEFAULTS_FILE, 'utf-8'));
        } catch (e) {
          console.error('Failed to parse default_data.json', e);
        }
      }

      const sermonCheck = await pool.query('SELECT 1 FROM sermons LIMIT 1');
      if (sermonCheck.rowCount === 0) {
        for (const s of defaults.sermons) {
          await pool.query(
            `INSERT INTO sermons (id, title, speaker, duration, thumbnail, views, downloads, date, description, category, video_url, audio_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [s.id, s.title, s.speaker, s.duration, s.thumbnail, s.views || 0, s.downloads || 0, s.date, s.description, s.category, s.videoUrl, s.audioUrl]
          );
        }
        console.log('Seeded sermons table.');
      }

      const bookCheck = await pool.query('SELECT 1 FROM books LIMIT 1');
      if (bookCheck.rowCount === 0) {
        for (const b of defaults.books) {
          await pool.query(
            `INSERT INTO books (id, title, author, cover_url, description, category, download_url, rating, amazon_url, selar_url, pages, downloads, pdfs)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [b.id, b.title, b.author, b.coverUrl || '', b.description || '', b.category || '', b.downloadUrl || '', b.rating || 4.8, b.amazonUrl || '', b.selarUrl || '', b.pages || 150, b.downloads || 0, JSON.stringify(b.pdfs || [])]
          );
        }
        console.log('Seeded books table.');
      }

      const blogCheck = await pool.query('SELECT 1 FROM blog_posts LIMIT 1');
      if (blogCheck.rowCount === 0) {
        for (const p of defaults.blogPosts) {
          await pool.query(
            `INSERT INTO blog_posts (id, title, author, date, read_time, excerpt, image_url, category, content, seo_title, seo_description, seo_keywords, slug)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [p.id, p.title, p.author, p.date, p.readTime, p.excerpt, p.imageUrl, p.category, p.content, p.seoTitle || p.title, p.seoDescription || p.excerpt, p.seoKeywords || '', p.slug || '']
          );
        }
        console.log('Seeded blog posts table.');
      }

      const radioCheck = await pool.query('SELECT 1 FROM radio LIMIT 1');
      if (radioCheck.rowCount === 0) {
        await pool.query(
          `INSERT INTO radio (id, url, active) VALUES (1, $1, $2)`,
          [defaults.radio.url, defaults.radio.active]
        );
        console.log('Seeded radio settings.');
      }

      const credentialsCheck = await pool.query('SELECT 1 FROM credentials LIMIT 1');
      if (credentialsCheck.rowCount === 0) {
        const superAdminHash = hashPassword('admin123');
        await pool.query(
          `INSERT INTO credentials (username, salt, hash, role) VALUES ($1, $2, $3, $4)`,
          ['admin@joshuagen.org', superAdminHash.salt, superAdminHash.hash, 'superadmin']
        );
        const adminHash = hashPassword('admin123');
        await pool.query(
          `INSERT INTO credentials (username, salt, hash, role) VALUES ($1, $2, $3, $4)`,
          ['assistant@joshuagen.org', adminHash.salt, adminHash.hash, 'admin']
        );
        console.log('Seeded admin and assistant credentials.');
      } else {
        const assistantCheck = await pool.query("SELECT 1 FROM credentials WHERE LOWER(username) = 'assistant@joshuagen.org'");
        if (assistantCheck.rowCount === 0) {
          const adminHash = hashPassword('admin123');
          await pool.query(
            `INSERT INTO credentials (username, salt, hash, role) VALUES ($1, $2, $3, $4)`,
            ['assistant@joshuagen.org', adminHash.salt, adminHash.hash, 'admin']
          );
          console.log('Seeded assistant credentials to existing database.');
        }
      }

      console.log('Database tables successfully verified and initialized.');
    } catch (err) {
      console.error('Failed to initialize PostgreSQL, falling back to local JSON files:', err.message);
      pool = null;
      initLocalData();
    }
  } else {
    initLocalData();
  }
}

await initDb();

// --- Request Body Parser ---
async function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

// --- Response Helpers ---
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

// --- Auth Helper ---
function getAuthenticatedUser(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const session = sessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return { username: session.username, role: session.role || 'admin' };
}

// --- Router ---
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  console.log(`[${new Date().toISOString()}] ${method} ${pathname}`);

  // Handle CORS Preflight Options
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  // --- SEO DYNAMIC OPENGRAPH HANDLER ---
  if (pathname.startsWith('/sermon/') || pathname.startsWith('/blog/') || pathname.startsWith('/books/')) {
    const targetPath = pathname;
    try {
      const indexPath = path.join(__dirname, '../dist/index.html');
      if (!fs.existsSync(indexPath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      let html = fs.readFileSync(indexPath, 'utf-8');
      
      let title = 'Joshua Generation';
      let description = 'A digital ministry platform dedicated to raising a generation of believers who know God, walk in purpose, and transform their world.';
      let imageUrl = 'https://joshuasgeneration.com/assets/favicon.ico';

      // Helper to ensure URL is absolute
      const makeAbsolute = (url) => {
        if (!url) return url;
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        if (url.startsWith('/')) return `https://joshuasgeneration.com${url}`;
        return `https://joshuasgeneration.com/${url}`;
      };

      if (targetPath.startsWith('/sermon/')) {
        const id = targetPath.split('/').pop();
        if (pool) {
          const result = await pool.query('SELECT title, description, thumbnail as image_url FROM sermons WHERE id = $1', [id]);
          if (result.rows.length > 0) {
            title = `${result.rows[0].title} - Joshua Generation`;
            description = result.rows[0].description || description;
            imageUrl = makeAbsolute(result.rows[0].image_url) || imageUrl;
          }
        }
      } else if (targetPath.startsWith('/blog/')) {
        const id = targetPath.split('/').pop();
        if (pool) {
          const result = await pool.query('SELECT title, excerpt as description, image_url FROM blog_posts WHERE id = $1', [id]);
          if (result.rows.length > 0) {
            title = `${result.rows[0].title} - Joshua Generation Blog`;
            description = result.rows[0].description || description;
            imageUrl = makeAbsolute(result.rows[0].image_url) || imageUrl;
          }
        }
      } else if (targetPath.startsWith('/books/')) {
        const id = targetPath.split('/').pop();
        if (pool) {
          const result = await pool.query('SELECT title, description, cover_url as image_url FROM books WHERE id = $1', [id]);
          if (result.rows.length > 0) {
            title = `${result.rows[0].title} - Joshua Generation Books`;
            description = result.rows[0].description || description;
            imageUrl = makeAbsolute(result.rows[0].image_url) || imageUrl;
          }
        }
      }

      html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
      const ogTags = `
        <meta property="og:title" content="${title.replace(/"/g, '&quot;')}">
        <meta property="og:description" content="${description.replace(/"/g, '&quot;')}">
        <meta property="og:image" content="${imageUrl}">
        <meta property="og:type" content="website">
        <meta name="twitter:card" content="summary_large_image">
      `;
      html = html.replace('</head>', `${ogTags}</head>`);
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (err) {
      console.error('SEO Error:', err);
      res.writeHead(500);
      res.end('Server Error');
    }
    return;
  }

  // --- PUBLIC ROUTES ---

  // Push Notification Public Key
  
  // --- Newsletter Subscriptions ---
  if (pathname === '/api/subscribe' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const email = data.email?.trim().toLowerCase();
        const name = data.name?.trim() || '';
        
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return sendJson(res, 400, { success: false, error: 'Invalid email address' });
        }

        const id = crypto.randomUUID();
        
        // Use ON CONFLICT to handle duplicates gracefully
        await pool.query(`
          INSERT INTO subscribers (id, email, name, is_active) 
          VALUES ($1, $2, $3, true)
          ON CONFLICT (email) DO UPDATE SET is_active = true, name = EXCLUDED.name
        `, [id, email, name]);

        return sendJson(res, 200, { success: true, message: 'Subscribed successfully!' });
      } catch (err) {
        console.error('Subscription error:', err);
        return sendJson(res, 500, { success: false, error: 'Internal Server Error' });
      }
    });
    return;
  }

  if (pathname === '/api/admin/subscribers' && method === 'GET') {
    if (!authMiddleware(req, res)) return;
    try {
      const result = await pool.query('SELECT * FROM subscribers ORDER BY created_at DESC');
      return sendJson(res, 200, result.rows);
    } catch (err) {
      console.error('Fetch subscribers error:', err);
      return sendJson(res, 500, { error: 'Internal Server Error' });
    }
    return;
  }

  if (pathname === '/api/push/public-key' && method === 'GET') {
    sendJson(res, 200, { publicKey: vapidPublicKey });
    return;
  }

  // Push Notification Subscribe
  if (pathname === '/api/push/subscribe' && method === 'POST') {
    try {
      const subscription = await getJsonBody(req);
      if (!subscription || !subscription.endpoint) {
        sendJson(res, 400, { error: 'Invalid subscription object' });
        return;
      }
      if (pool) {
        await pool.query(
          'INSERT INTO push_subscriptions (endpoint, keys) VALUES ($1, $2) ON CONFLICT (endpoint) DO UPDATE SET keys = EXCLUDED.keys',
          [subscription.endpoint, JSON.stringify(subscription.keys || {})]
        );
      }
      sendJson(res, 201, { message: 'Subscribed successfully' });
    } catch (err) {
      console.error('Push Subscribe Error:', err);
      sendJson(res, 500, { error: 'Failed to subscribe' });
    }
    return;
  }

  // Register Request
  if (pathname === '/api/auth/register-request' && method === 'POST') {
    try {
      const { name, email, password } = await getJsonBody(req);
      if (!name || !email || !password) {
        sendJson(res, 400, { error: 'Name, email, and password required' });
        return;
      }

      // Check if user already exists
      let exists = false;
      if (pool) {
        const result = await pool.query('SELECT 1 FROM credentials WHERE LOWER(username) = LOWER($1)', [email]);
        exists = result.rowCount > 0;
      } else {
        if (fs.existsSync(CREDENTIALS_FILE)) {
          const fileData = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
          if (Array.isArray(fileData)) {
            exists = fileData.some(c => c.username.toLowerCase() === email.toLowerCase());
          } else {
            exists = fileData.username.toLowerCase() === email.toLowerCase();
          }
        }
      }

      if (exists) {
        sendJson(res, 400, { error: 'An account with this email already exists' });
        return;
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      pendingRegistrations.set(email.toLowerCase(), {
        name,
        password,
        otp,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 mins
      });

      const subject = "Verify Your Registration - Joshua Generation";
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #1e3a8a;">Welcome to Joshua Generation!</h2>
          <p>Thank you for registering. Please use the following One-Time Password (OTP) to complete your registration:</p>
          <div style="font-size: 24px; font-weight: bold; background: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; letter-spacing: 4px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
          <br/>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #666;">Joshua Generation Digital Ministry Platform</p>
        </div>
      `;

      await sendZeptoEmail(email, name, subject, htmlBody);
      sendJson(res, 200, { success: true });
    } catch (e) {
      console.error('Register request error:', e);
      sendJson(res, 500, { error: 'Failed to process registration request' });
    }
    return;
  }

  // Register Verify
  if (pathname === '/api/auth/register-verify' && method === 'POST') {
    try {
      const { email, otp } = await getJsonBody(req);
      if (!email || !otp) {
        sendJson(res, 400, { error: 'Email and OTP required' });
        return;
      }

      const pending = pendingRegistrations.get(email.toLowerCase());
      if (!pending || Date.now() > pending.expiresAt) {
        sendJson(res, 400, { error: 'Verification session expired or invalid' });
        return;
      }

      if (pending.otp !== otp) {
        sendJson(res, 400, { error: 'Invalid verification code' });
        return;
      }

      const { salt, hash } = hashPassword(pending.password);

      // Save credentials
      if (pool) {
        await pool.query(
          'INSERT INTO credentials (username, salt, hash, role) VALUES ($1, $2, $3, $4)',
          [email, salt, hash, 'member']
        );
      } else {
        let credsList = [];
        if (fs.existsSync(CREDENTIALS_FILE)) {
          const fileData = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
          credsList = Array.isArray(fileData) ? fileData : [fileData];
        }
        credsList.push({ username: email, salt, hash, role: 'member' });
        fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credsList, null, 2), 'utf-8');
      }

      // Add to users/members list
      const userId = Date.now();
      const joinedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const newUser = {
        id: userId,
        name: pending.name,
        email: email,
        status: 'active',
        joined: joinedDate,
        sermons: 0,
        donations: 0,
        avatar: '',
        role: 'User'
      };

      if (pool) {
        await pool.query(
          `INSERT INTO users (id, name, email, status, joined, sermons, donations, avatar, role)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [newUser.id, newUser.name, newUser.email, newUser.status, newUser.joined, newUser.sermons, newUser.donations, newUser.avatar, newUser.role]
        );
      } else {
        let usersList = [];
        if (fs.existsSync(USERS_FILE)) {
          usersList = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
        }
        usersList.push(newUser);
        fs.writeFileSync(USERS_FILE, JSON.stringify(usersList, null, 2), 'utf-8');
      }

      // Generate session token
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, {
        username: email,
        role: 'member',
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 Hours Session
      });

      pendingRegistrations.delete(email.toLowerCase());
      sendJson(res, 200, { success: true, token, role: 'member', name: pending.name });
    } catch (e) {
      console.error('Register verify error:', e);
      sendJson(res, 500, { error: 'Failed to verify registration' });
    }
    return;
  }

  // Forgot Password Request
  if (pathname === '/api/auth/forgot-password-request' && method === 'POST') {
    try {
      const { email } = await getJsonBody(req);
      if (!email) {
        sendJson(res, 400, { error: 'Email is required' });
        return;
      }

      // Verify email exists
      let exists = false;
      if (pool) {
        const result = await pool.query('SELECT 1 FROM credentials WHERE LOWER(username) = LOWER($1)', [email]);
        exists = result.rowCount > 0;
      } else {
        if (fs.existsSync(CREDENTIALS_FILE)) {
          const fileData = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
          if (Array.isArray(fileData)) {
            exists = fileData.some(c => c.username.toLowerCase() === email.toLowerCase());
          } else {
            exists = fileData.username.toLowerCase() === email.toLowerCase();
          }
        }
      }

      if (!exists) {
        // Return 200 for security to prevent user enumeration
        sendJson(res, 200, { success: true });
        return;
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      pendingPasswordResets.set(email.toLowerCase(), {
        otp,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 mins
      });

      const subject = "Reset Your Password - Joshua Generation";
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #1e3a8a;">Password Reset Request</h2>
          <p>We received a request to reset your password. Please use the following One-Time Password (OTP) to reset your password:</p>
          <div style="font-size: 24px; font-weight: bold; background: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; letter-spacing: 4px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code is valid for 10 minutes. If you did not request a password reset, you can safely ignore this email.</p>
          <br/>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #666;">Joshua Generation Digital Ministry Platform</p>
        </div>
      `;

      await sendZeptoEmail(email, email, subject, htmlBody);
      sendJson(res, 200, { success: true });
    } catch (e) {
      console.error('Forgot password request error:', e);
      sendJson(res, 500, { error: 'Failed to process password reset request' });
    }
    return;
  }

  // Forgot Password Reset
  if (pathname === '/api/auth/forgot-password-reset' && method === 'POST') {
    try {
      const { email, otp, newPassword } = await getJsonBody(req);
      if (!email || !otp || !newPassword) {
        sendJson(res, 400, { error: 'Email, OTP, and new password required' });
        return;
      }

      const pending = pendingPasswordResets.get(email.toLowerCase());
      if (!pending || Date.now() > pending.expiresAt) {
        sendJson(res, 400, { error: 'Verification session expired or invalid' });
        return;
      }

      if (pending.otp !== otp) {
        sendJson(res, 400, { error: 'Invalid verification code' });
        return;
      }

      const { salt, hash } = hashPassword(newPassword);

      if (pool) {
        await pool.query(
          'UPDATE credentials SET salt = $1, hash = $2 WHERE LOWER(username) = LOWER($3)',
          [salt, hash, email]
        );
      } else {
        if (fs.existsSync(CREDENTIALS_FILE)) {
          const fileData = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
          const credsList = Array.isArray(fileData) ? fileData : [fileData];
          const userIndex = credsList.findIndex(c => c.username.toLowerCase() === email.toLowerCase());
          if (userIndex !== -1) {
            credsList[userIndex].salt = salt;
            credsList[userIndex].hash = hash;
            fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credsList, null, 2), 'utf-8');
          }
        }
      }

      pendingPasswordResets.delete(email.toLowerCase());
      sendJson(res, 200, { success: true });
    } catch (e) {
      console.error('Forgot password reset error:', e);
      sendJson(res, 500, { error: 'Failed to reset password' });
    }
    return;
  }

  // Admin Login
  if (pathname === '/api/auth/login' && method === 'POST') {
    try {
      const { email, password } = await getJsonBody(req);
      if (!email || !password) {
        sendJson(res, 400, { error: 'Email and password required' });
        return;
      }

      let creds = null;
      if (pool) {
        const result = await pool.query('SELECT username, salt, hash, role FROM credentials WHERE LOWER(username) = LOWER($1)', [email]);
        if (result.rowCount > 0) {
          creds = result.rows[0];
        }
      } else {
        const fileData = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
        if (Array.isArray(fileData)) {
          creds = fileData.find(c => c.username.toLowerCase() === email.toLowerCase());
        } else if (fileData.username.toLowerCase() === email.toLowerCase()) {
          creds = { ...fileData, role: fileData.role || 'superadmin' };
        }
      }

      if (creds && verifyPassword(password, creds.salt, creds.hash)) {
        const token = crypto.randomBytes(32).toString('hex');
        const role = creds.role || 'admin';
        sessions.set(token, {
          username: creds.username,
          role: role,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 Hours Session
        });
        sendJson(res, 200, { success: true, token, role });
      } else {
        sendJson(res, 401, { error: 'Invalid email or password' });
      }
    } catch (e) {
      sendJson(res, 500, { error: 'Authentication failed' });
    }
    return;
  }

  // GET Sermons
  if (pathname === '/api/sermons' && method === 'GET') {
    try {
      if (pool) {
        try {
          const result = await pool.query('SELECT * FROM sermons ORDER BY id DESC');
          // Map database naming back to frontend interface
          const sermons = result.rows.map(row => ({
            id: row.id,
            title: row.title,
            speaker: row.speaker,
            duration: row.duration,
            thumbnail: row.thumbnail,
            views: row.views,
            downloads: row.downloads || 0,
            date: row.date,
            description: row.description,
            category: row.category,
            videoUrl: row.video_url,
            audioUrl: row.audio_url,
            audios: typeof row.audios === 'string' ? JSON.parse(row.audios) : (row.audios || [])
          }));
          // Cache locally as fallback backup
          try {
            fs.writeFileSync(SERMONS_FILE, JSON.stringify(sermons, null, 2), 'utf-8');
          } catch (cacheErr) {
            console.error('Failed to write local sermons cache:', cacheErr);
          }
          sendJson(res, 200, sermons);
          return;
        } catch (dbErr) {
          console.warn('Database SELECT failed, falling back to local JSON cache:', dbErr.message);
        }
      }

      // Local file fallback (used when pool is disabled or database query throws)
      if (fs.existsSync(SERMONS_FILE)) {
        const data = JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8'));
        sendJson(res, 200, data);
      } else {
        sendJson(res, 200, []);
      }
    } catch (e) {
      console.error('All sermon retrieval sources failed:', e);
      sendJson(res, 500, { error: 'Failed to retrieve sermons' });
    }
    return;
  }

  // POST Increment Sermon Views (Public)
  if (pathname.startsWith('/api/sermons/') && pathname.endsWith('/view') && method === 'POST') {
    try {
      const id = pathname.substring('/api/sermons/'.length, pathname.length - '/view'.length);
      let updatedViews = 0;
      if (pool) {
        const result = await pool.query('UPDATE sermons SET views = COALESCE(views, 0) + 1 WHERE id = $1 RETURNING views', [id]);
        if (result.rowCount > 0) {
          updatedViews = result.rows[0].views;
        }
      } else {
        const data = JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8'));
        const index = data.findIndex(x => x.id === id);
        if (index !== -1) {
          data[index].views = (data[index].views || 0) + 1;
          updatedViews = data[index].views;
          fs.writeFileSync(SERMONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
        }
      }
      sendJson(res, 200, { success: true, views: updatedViews });
    } catch (e) {
      console.error('Failed to increment views:', e);
      sendJson(res, 500, { error: 'Failed to increment views' });
    }
    return;
  }

  // POST Increment Sermon Downloads (Public)
  if (pathname.startsWith('/api/sermons/') && pathname.endsWith('/download') && method === 'POST') {
    try {
      const id = pathname.substring('/api/sermons/'.length, pathname.length - '/download'.length);
      let updatedDownloads = 0;
      if (pool) {
        const result = await pool.query('UPDATE sermons SET downloads = COALESCE(downloads, 0) + 1 WHERE id = $1 RETURNING downloads', [id]);
        if (result.rowCount > 0) {
          updatedDownloads = result.rows[0].downloads;
        }
      } else {
        const data = JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8'));
        const index = data.findIndex(x => x.id === id);
        if (index !== -1) {
          data[index].downloads = (data[index].downloads || 0) + 1;
          updatedDownloads = data[index].downloads;
          fs.writeFileSync(SERMONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
        }
      }
      sendJson(res, 200, { success: true, downloads: updatedDownloads });
    } catch (e) {
      console.error('Failed to increment downloads:', e);
      sendJson(res, 500, { error: 'Failed to increment downloads' });
    }
    return;
  }

  // POST Create Donation (Public)
  if (pathname === '/api/donations' && method === 'POST') {
    try {
      const { donor, email, amount, purpose, method: payMethod, frequency, currency } = await getJsonBody(req);
      if (!donor || !email || !amount || !purpose) {
        sendJson(res, 400, { error: 'Required fields missing: donor, email, amount, purpose' });
        return;
      }
      
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const donation = {
        id: `JG-TXN-${randomNum}`,
        donor,
        email,
        amount: Number(amount),
        purpose,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        method: payMethod || 'Credit Card',
        frequency: frequency || 'one-time',
        currency: currency || 'USD'
      };

      if (pool) {
        await pool.query(
          `INSERT INTO donations (id, donor, email, amount, purpose, date, method, frequency, currency)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [donation.id, donation.donor, donation.email, donation.amount, donation.purpose, donation.date, donation.method, donation.frequency, donation.currency]
        );
      } else {
        const donations = JSON.parse(fs.readFileSync(DONATIONS_FILE, 'utf-8'));
        donations.unshift(donation);
        fs.writeFileSync(DONATIONS_FILE, JSON.stringify(donations, null, 2), 'utf-8');
      }

      // Send Heartfelt Thank You Email to Donor
      try {
        const currencySymbols = {
          NGN: '₦',
          USD: '$',
          GBP: '£',
          EUR: '€',
          CAD: 'C$',
          ZAR: 'R'
        };
        const currencyCode = donation.currency || 'USD';
        const currencySymbol = currencySymbols[currencyCode] || '$';
        const formattedAmount = `${currencySymbol}${donation.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        const thankYouSubject = "Thank You for Your Generous Seed - Joshua Generation";
        const thankYouHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; color: #1f2937; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
            <div style="text-align: center; margin-bottom: 25px;">
              <h1 style="color: #1e3a8a; font-size: 26px; font-weight: 700; margin: 0;">Joshua Generation</h1>
              <p style="color: #6b7280; font-size: 14px; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px;">Partnership & Missions</p>
            </div>
            
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <h2 style="color: #1e3a8a; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 15px;">Dear ${donation.donor},</h2>
              
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                We are profoundly grateful for your generous donation of <strong>${formattedAmount}</strong> received on ${donation.date}. Your seed has been successfully received, and we thank God for your willingness to support the work of the Kingdom.
              </p>
              
              <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <p style="font-style: italic; font-size: 15px; line-height: 1.6; color: #1e40af; margin: 0;">
                  "Remember this: Whoever sows sparingly will also reap sparingly, and whoever sows generously will also reap generously. Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."
                </p>
                <p style="text-align: right; font-weight: 600; font-size: 13px; color: #1e40af; margin: 8px 0 0 0;">— 2 Corinthians 9:6-7</p>
              </div>

              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Through your partnership, we are able to reach more souls, publish life-transforming resources, and expand the gospel of our Lord Jesus Christ to the ends of the earth. We pray that the Lord opens the windows of heaven and pours out a blessing upon you that you will not have room enough to store.
              </p>
              
              <div style="border-top: 1px solid #f3f4f6; padding-top: 20px; margin-top: 25px; font-size: 14px; color: #4b5563;">
                <h3 style="color: #1e3a8a; font-size: 14px; font-weight: 600; margin-top: 0; margin-bottom: 8px;">Donation Summary:</h3>
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; font-weight: 500;">Transaction ID:</td>
                    <td style="padding: 4px 0; text-align: right; color: #111827; font-family: monospace;">${donation.id}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-weight: 500;">Amount Seeded:</td>
                    <td style="padding: 4px 0; text-align: right; color: #111827; font-weight: 600;">${formattedAmount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-weight: 500;">Purpose:</td>
                    <td style="padding: 4px 0; text-align: right; color: #111827;">${donation.purpose}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-weight: 500;">Method:</td>
                    <td style="padding: 4px 0; text-align: right; color: #111827;">${donation.method}</td>
                  </tr>
                </table>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #9ca3af;">
              <p style="margin: 0 0 5px 0;">You are receiving this email because you made a donation to Joshua Generation.</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Joshua Generation Ministry. All rights reserved.</p>
            </div>
          </div>
        `;

        sendZeptoEmail(donation.email, donation.donor, thankYouSubject, thankYouHtml)
          .then(success => {
            if (success) {
              console.log(`[Donation Email] Successfully sent thank you to ${donation.email}`);
            } else {
              console.warn(`[Donation Email] Failed to send thank you to ${donation.email}`);
            }
          })
          .catch(err => {
            console.error(`[Donation Email] Error during email dispatch:`, err);
          });
      } catch (err) {
        console.error('Failed to generate thank you email:', err);
      }

      sendJson(res, 200, donation);
    } catch (e) {
      console.error('Failed to create donation:', e);
      sendJson(res, 500, { error: 'Failed to create donation' });
    }
    return;
  }

  // GET Books
  if (pathname === '/api/books' && method === 'GET') {
    try {
      if (pool) {
        const result = await pool.query('SELECT * FROM books ORDER BY title ASC');
        const books = result.rows.map(row => ({
          id: row.id,
          title: row.title,
          author: row.author,
          coverUrl: row.cover_url,
          description: row.description,
          category: row.category,
          downloadUrl: row.download_url,
          rating: row.rating,
          amazonUrl: row.amazon_url,
          selarUrl: row.selar_url,
          pages: row.pages,
          downloads: row.downloads || 0,
          pdfs: row.pdfs ? (typeof row.pdfs === 'string' ? JSON.parse(row.pdfs) : row.pdfs) : (typeof row.chapters === 'string' ? JSON.parse(row.chapters) : row.chapters)
        }));
        sendJson(res, 200, books);
      } else {
        const data = JSON.parse(fs.readFileSync(BOOKS_FILE, 'utf-8'));
        sendJson(res, 200, data);
      }
    } catch (e) {
      sendJson(res, 500, { error: 'Failed to retrieve books' });
    }
    return;
  }

  // GET Blog Posts
  if (pathname === '/api/blog' && method === 'GET') {
    try {
      if (pool) {
        const result = await pool.query('SELECT * FROM blog_posts ORDER BY date DESC');
        const posts = result.rows.map(row => ({
          id: row.id,
          title: row.title,
          author: row.author,
          date: row.date,
          readTime: row.read_time,
          excerpt: row.excerpt,
          imageUrl: row.image_url,
          category: row.category,
          content: row.content,
          seoTitle: row.seo_title,
          seoDescription: row.seo_description,
          seoKeywords: row.seo_keywords,
          slug: row.slug
        }));
        sendJson(res, 200, posts);
      } else {
        const data = JSON.parse(fs.readFileSync(BLOG_FILE, 'utf-8'));
        sendJson(res, 200, data);
      }
    } catch (e) {
      sendJson(res, 500, { error: 'Failed to retrieve blog posts' });
    }
    return;
  }

  // GET Radio Settings
  if (pathname === '/api/radio' && method === 'GET') {
    try {
      if (pool) {
        const result = await pool.query('SELECT url, active FROM radio WHERE id = 1');
        sendJson(res, 200, result.rows[0]);
      } else {
        const data = JSON.parse(fs.readFileSync(RADIO_FILE, 'utf-8'));
        sendJson(res, 200, data);
      }
    } catch (e) {
      sendJson(res, 500, { error: 'Failed to retrieve radio settings' });
    }
    return;
  }

  // GET Platform Settings (Public - returns client IDs only, not secrets)
  if (pathname === '/api/settings' && method === 'GET') {
    try {
      if (pool) {
        const result = await pool.query('SELECT flutterwave_prophetic_client_id, flutterwave_mission_client_id FROM settings WHERE id = 1');
        sendJson(res, 200, result.rows[0] || { flutterwave_prophetic_client_id: '', flutterwave_mission_client_id: '' });
      } else {
        const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
        // Return only client IDs, strip secrets from public response
        sendJson(res, 200, {
          flutterwave_prophetic_client_id: data.flutterwave_prophetic_client_id || '',
          flutterwave_mission_client_id: data.flutterwave_mission_client_id || ''
        });
      }
    } catch (e) {
      sendJson(res, 500, { error: 'Failed to retrieve settings' });
    }
    return;
  }

  // POST /api/initiate-payment — Flutterwave V3 payment initiation (public)
  if (pathname === '/api/initiate-payment' && method === 'POST') {
    try {
      const { cause, amount, name, email, frequency, currency = 'NGN' } = await getJsonBody(req);
      if (!cause || !amount || !name || !email) {
        sendJson(res, 400, { error: 'cause, amount, name and email are required' });
        return;
      }

      // Load full settings (including secrets) server-side
      let clientId, clientSecret;
      if (pool) {
        const result = await pool.query('SELECT flutterwave_prophetic_client_id, flutterwave_prophetic_client_secret, flutterwave_mission_client_id, flutterwave_mission_client_secret, "contactEmail", "contactPhone", "contactAddress", "socialFacebook", "socialTwitter", "socialInstagram", "socialYoutube", "homeHeadlinePrefix", "homeHeadlineHighlight", "homeHeadlineSuffix", "homeSubheading", "homeBibleVerse", "homeBibleReference" FROM settings WHERE id = 1');
        const row = result.rows[0] || {};
        clientId = cause === 'Prophetic Offering' ? row.flutterwave_prophetic_client_id : row.flutterwave_mission_client_id;
        clientSecret = cause === 'Prophetic Offering' ? row.flutterwave_prophetic_client_secret : row.flutterwave_mission_client_secret;
      } else {
        const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
        clientId = cause === 'Prophetic Offering' ? data.flutterwave_prophetic_client_id : data.flutterwave_mission_client_id;
        clientSecret = cause === 'Prophetic Offering' ? data.flutterwave_prophetic_client_secret : data.flutterwave_mission_client_secret;
      }

      if (!clientId || !clientSecret) {
        sendJson(res, 503, { error: 'Payment gateway not configured. Please contact the administrator.' });
        return;
      }

      const txRef = 'JG-TXN-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
      const callbackUrl = 'https://joshuasgeneration.com/#payment-callback';

      console.log(`Initiating Standard Checkout payment link via V3 API with currency ${currency}...`);
      
      const paymentRes = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clientSecret}`
        },
        body: JSON.stringify({
          amount: Number(amount),
          currency: currency,
          tx_ref: txRef,
          redirect_url: callbackUrl,
          customer: { email, name },
          customizations: {
            title: 'Joshua Generation',
            description: `Donation: ${cause} (${frequency || 'one-time'})`,
            logo: 'https://joshuasgeneration.com/api/uploads/logo.png'
          }
        })
      });

      const paymentRaw = await paymentRes.text();
      let paymentData;
      try { paymentData = JSON.parse(paymentRaw); } catch(e) {
        console.error('Flutterwave payment non-JSON response:', paymentRaw.substring(0, 500));
        sendJson(res, 502, { error: 'Payment provider returned unexpected response.' });
        return;
      }

      console.log('Flutterwave V3 payment response:', JSON.stringify(paymentData));

      const paymentLink = paymentData?.data?.link;
      if (!paymentLink) {
        console.error('No payment link in response:', paymentData);
        sendJson(res, 502, { error: 'Failed to create payment link: ' + (paymentData?.message || JSON.stringify(paymentData)) });
        return;
      }

      sendJson(res, 200, { payment_link: paymentLink, tx_ref: txRef });
    } catch (e) {
      console.error('Payment initiation error:', e);
      sendJson(res, 500, { error: 'Payment initiation failed: ' + e.message });
    }
    return;
  }

  // GET Stats (Public)
  if (pathname === '/api/stats' && method === 'GET') {
    try {
      let sermonsCount = 0;
      let booksCount = 0;
      let membersCount = 0;

      if (pool) {
        const sermonsRes = await pool.query('SELECT COUNT(*) FROM sermons');
        sermonsCount = parseInt(sermonsRes.rows[0].count, 10);

        const booksRes = await pool.query('SELECT COUNT(*) FROM books');
        booksCount = parseInt(booksRes.rows[0].count, 10);

        const usersRes = await pool.query('SELECT COUNT(*) FROM users');
        membersCount = parseInt(usersRes.rows[0].count, 10);
      } else {
        if (fs.existsSync(SERMONS_FILE)) {
          const data = JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8'));
          sermonsCount = data.length;
        }
        if (fs.existsSync(BOOKS_FILE)) {
          const data = JSON.parse(fs.readFileSync(BOOKS_FILE, 'utf-8'));
          booksCount = data.length;
        }
        if (fs.existsSync(USERS_FILE)) {
          const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
          membersCount = data.length;
        }
      }

      sendJson(res, 200, {
        sermons: sermonsCount,
        books: booksCount,
        members: membersCount
      });
    } catch (e) {
      console.error('Failed to retrieve stats:', e);
      sendJson(res, 500, { error: 'Failed to retrieve stats' });
    }
    return;
  }

  // GET Events (Public)
  if (pathname === '/api/events' && method === 'GET') {
    try {
      if (pool) {
        const result = await pool.query('SELECT * FROM events ORDER BY date ASC');
        const events = result.rows.map(row => ({
          id: row.id,
          title: row.title,
          date: row.date,
          time: row.time,
          location: row.location,
          description: row.description,
          imageUrl: row.image_url,
          speakers: typeof row.speakers === 'string' ? JSON.parse(row.speakers) : (row.speakers || []),
          registrations: row.registrations,
          capacity: row.capacity,
          status: row.status
        }));
        sendJson(res, 200, events);
      } else {
        const data = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));
        sendJson(res, 200, data);
      }
    } catch (e) {
      sendJson(res, 500, { error: 'Failed to retrieve events' });
    }
    return;
  }

  // GET Uploaded Files (Audio & Images)
  if (pathname.startsWith('/api/uploads/') && method === 'GET') {
    try {
      const filename = path.basename(pathname);
      const filePath = path.join(DATA_DIR, 'uploads', filename);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === '.mp3') contentType = 'audio/mpeg';
        else if (ext === '.wav') contentType = 'audio/wav';
        else if (ext === '.ogg') contentType = 'audio/ogg';
        else if (ext === '.aac') contentType = 'audio/aac';
        else if (ext === '.m4a') contentType = 'audio/x-m4a';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.gif') contentType = 'image/gif';

        const stat = fs.statSync(filePath);
        const range = req.headers.range;

        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
          const chunksize = (end - start) + 1;
          const file = fs.createReadStream(filePath, { start, end });
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*'
          });
          file.pipe(res);
        } else {
          res.writeHead(200, {
            'Content-Length': stat.size,
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Accept-Ranges': 'bytes'
          });
          fs.createReadStream(filePath).pipe(res);
        }
      } else {
        sendJson(res, 404, { error: 'File not found' });
      }
    } catch (e) {
      sendJson(res, 500, { error: 'Failed to retrieve file' });
    }
    return;
  }

  // --- PUBLIC: Submit Contact Message ---
  if (pathname === '/api/messages' && method === 'POST') {
    try {
      const body = await getJsonBody(req);
      const { name, email, subject, message } = body;
      if (!name || !email || !message) {
        sendJson(res, 400, { error: 'Name, email, and message are required' });
        return;
      }
      if (pool) {
        await pool.query(
          `INSERT INTO messages (name, email, subject, message) VALUES ($1, $2, $3, $4)`,
          [name, email, subject || 'No Subject', message]
        );
      }
      sendJson(res, 200, { success: true });
    } catch (e) {
      console.error('Failed to submit message:', e);
      sendJson(res, 500, { error: 'Failed to submit message' });
    }
    return;
  }

  // --- SECURE ADMIN ROUTES (Requires authorization header) ---
  const user = getAuthenticatedUser(req);
  if (!user) {
    sendJson(res, 401, { error: 'Unauthorized admin access' });
    return;
  }

  // GET Settings (Admin only - returns full keys including secrets)
  if (pathname === '/api/admin/settings/public' && method === 'GET') {
    try {
      const { rows } = await pool.query('SELECT "contactEmail", "contactPhone", "contactAddress", "socialFacebook", "socialTwitter", "socialInstagram", "socialYoutube", "homeHeadlinePrefix", "homeHeadlineHighlight", "homeHeadlineSuffix", "homeSubheading", "homeBibleVerse", "homeBibleReference" FROM settings WHERE id = 1');
      if (rows.length > 0) {
        sendJson(res, 200, rows[0]);
      } else {
        sendJson(res, 200, {
          contactEmail: 'hello@joshuagen.org',
          contactPhone: '+1 (555) 123-4567',
          contactAddress: '42 Kingdom Way,\nJerusalem, Israel',
          socialFacebook: '#',
          socialTwitter: '#',
          socialInstagram: '#',
          socialYoutube: '#',
          homeHeadlinePrefix: 'Experience the ',
          homeHeadlineHighlight: 'Presence',
          homeHeadlineSuffix: ' of God',
          homeSubheading: 'A digital ministry where faith comes alive — through powerful audio sermons, life-changing books, and a growing global community of believers.',
          homeBibleVerse: 'Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.',
          homeBibleReference: 'Joshua 1:9'
        });
      }
    } catch (e) {
      console.error('Failed to retrieve public settings:', e);
      sendJson(res, 500, { error: 'Failed to retrieve public settings' });
    }
    return;
  }

  if (pathname === '/api/admin/settings' && method === 'GET') {
    try {
      if (pool) {
        const result = await pool.query('SELECT flutterwave_prophetic_client_id, flutterwave_prophetic_client_secret, flutterwave_mission_client_id, flutterwave_mission_client_secret, "contactEmail", "contactPhone", "contactAddress", "socialFacebook", "socialTwitter", "socialInstagram", "socialYoutube", "homeHeadlinePrefix", "homeHeadlineHighlight", "homeHeadlineSuffix", "homeSubheading", "homeBibleVerse", "homeBibleReference" FROM settings WHERE id = 1');
        sendJson(res, 200, result.rows[0] || { 
          flutterwave_prophetic_client_id: '', flutterwave_prophetic_client_secret: '',
          flutterwave_mission_client_id: '', flutterwave_mission_client_secret: '' 
        });
      } else {
        const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
        sendJson(res, 200, data);
      }
    } catch (e) {
      console.error('Failed to retrieve admin settings:', e);
      sendJson(res, 500, { error: 'Failed to retrieve admin settings' });
    }
    return;
  }

  // POST Settings (Admin only)
  if (pathname === '/api/admin/settings' && method === 'POST') {
    try {
      const data = await getJsonBody(req);
      if (pool) {
        await pool.query(
          `UPDATE settings SET 
            flutterwave_prophetic_client_id = $1, 
            flutterwave_prophetic_client_secret = $2,
            flutterwave_mission_client_id = $3, 
            flutterwave_mission_client_secret = $4 
           WHERE id = 1`,
          [
            data.flutterwave_prophetic_client_id || '',
            data.flutterwave_prophetic_client_secret || '',
            data.flutterwave_mission_client_id || '',
            data.flutterwave_mission_client_secret || ''
          ]
        );
      } else {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
      }
      sendJson(res, 200, { success: true });
    } catch (e) {
      console.error('Failed to save settings:', e);
      sendJson(res, 500, { error: 'Failed to save settings' });
    }
    return;
  }

  // GET Users (Admin only)
  if (pathname === '/api/users' && method === 'GET') {
    try {
      if (pool) {
        const result = await pool.query('SELECT * FROM users ORDER BY id ASC');
        const users = result.rows.map(row => ({
          id: Number(row.id),
          name: row.name,
          email: row.email,
          status: row.status,
          joined: row.joined,
          sermons: row.sermons,
          donations: row.donations,
          avatar: row.avatar,
          role: row.role
        }));
        sendJson(res, 200, users);
      } else {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
        sendJson(res, 200, users);
      }
    } catch (e) {
      console.error('Failed to retrieve users:', e);
      sendJson(res, 500, { error: 'Failed to retrieve users' });
    }
    return;
  }

  // POST Users (Admin only)
  if (pathname === '/api/users' && method === 'POST') {
    try {
      const data = await getJsonBody(req);
      if (Array.isArray(data)) {
        if (pool) {
          await pool.query('BEGIN');
          await pool.query('TRUNCATE TABLE users');
          for (const u of data) {
            await pool.query(
              `INSERT INTO users (id, name, email, status, joined, sermons, donations, avatar, role)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [u.id, u.name, u.email, u.status, u.joined, u.sermons, u.donations, u.avatar, u.role]
            );
            // Sync role to credentials
            let credRole = 'member';
            if (u.role === 'Admin') credRole = 'admin';
            if (u.role === 'Superadmin') credRole = 'superadmin';
            await pool.query(
              `UPDATE credentials SET role = $1 WHERE LOWER(username) = LOWER($2)`,
              [credRole, u.email]
            );
          }
          await pool.query('COMMIT');
        } else {
          fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
          // Update credentials.json too
          if (fs.existsSync(CREDENTIALS_FILE)) {
            let creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
            if (Array.isArray(creds)) {
              for (const u of data) {
                const idx = creds.findIndex(c => c.username.toLowerCase() === u.email.toLowerCase());
                if (idx !== -1) {
                  let credRole = 'member';
                  if (u.role === 'Admin') credRole = 'admin';
                  if (u.role === 'Superadmin') credRole = 'superadmin';
                  creds[idx].role = credRole;
                }
              }
              fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), 'utf-8');
            }
          }
        }
        sendJson(res, 200, { success: true });
      } else {
        sendJson(res, 400, { error: 'Expected users array' });
      }
    } catch (e) {
      if (pool) await pool.query('ROLLBACK');
      console.error('Failed to save users:', e);
      sendJson(res, 500, { error: 'Failed to save users' });
    }
    return;
  }

  // GET Donations (Superadmin only)
  if (pathname === '/api/donations' && method === 'GET') {
    if (user.role !== 'superadmin') {
      sendJson(res, 403, { error: 'Superadmin access required' });
      return;
    }
    try {
      if (pool) {
        const result = await pool.query('SELECT * FROM donations ORDER BY id DESC');
        const donations = result.rows.map(row => ({
          id: row.id,
          donor: row.donor,
          email: row.email,
          amount: row.amount,
          purpose: row.purpose,
          date: row.date,
          method: row.method,
          frequency: row.frequency
        }));
        sendJson(res, 200, donations);
      } else {
        const donations = JSON.parse(fs.readFileSync(DONATIONS_FILE, 'utf-8'));
        sendJson(res, 200, donations);
      }
    } catch (e) {
      console.error('Failed to retrieve donations:', e);
      sendJson(res, 500, { error: 'Failed to retrieve donations' });
    }
    return;
  }

  // POST Upload (Direct binary file streaming)
  if (pathname === '/api/upload' && method === 'POST') {
    try {
      const filename = parsedUrl.searchParams.get('filename') || 'upload';
      const ext = path.extname(filename).toLowerCase();
      const cleanFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
      
      const uploadDir = path.join(DATA_DIR, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filePath = path.join(uploadDir, cleanFilename);
      const fileStream = fs.createWriteStream(filePath);
      
      req.pipe(fileStream);
      
      req.on('end', () => {
        console.log(`Saved direct binary upload to ${filePath}`);
        sendJson(res, 200, { url: `/api/uploads/${cleanFilename}` });
      });
      
      req.on('error', (err) => {
        console.error('Error receiving binary upload:', err);
        try { fs.unlinkSync(filePath); } catch (e) {}
        sendJson(res, 500, { error: 'Failed to write upload stream' });
      });
    } catch (e) {
      console.error('Upload handler exception:', e);
      sendJson(res, 500, { error: 'Upload failed' });
    }
    return;
  }

  // POST Sermons (Save or Update)
  if (pathname === '/api/sermons' && method === 'POST') {
    try {
      const item = await getJsonBody(req);
      if (!item.id || !item.title || !item.speaker) {
        sendJson(res, 400, { error: 'Sermon id, title and speaker are required' });
        return;
      }

      // Get existing sermon if any to clean up replaced uploads
      let existingSermon = null;
      if (pool) {
        const result = await pool.query('SELECT audio_url, thumbnail, audios FROM sermons WHERE id = $1', [item.id]);
        if (result.rowCount > 0) {
          existingSermon = result.rows[0];
          if (existingSermon) {
            existingSermon.audios = typeof existingSermon.audios === 'string' ? JSON.parse(existingSermon.audios) : (existingSermon.audios || []);
          }
        }
      } else {
        if (fs.existsSync(SERMONS_FILE)) {
          const data = JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8'));
          existingSermon = data.find(x => x.id === item.id);
        }
      }

      // Clean up deleted series audio files
      if (existingSermon && Array.isArray(existingSermon.audios)) {
        const currentUrls = new Set((item.audios || []).map(a => a.audioUrl));
        for (const aud of existingSermon.audios) {
          const url = aud.audioUrl;
          if (url && url.startsWith('/api/uploads/') && !currentUrls.has(url)) {
            const oldPath = path.join(DATA_DIR, 'uploads', path.basename(url));
            if (fs.existsSync(oldPath)) {
              try { fs.unlinkSync(oldPath); } catch (e) { console.error('Failed to delete removed audio track:', e); }
            }
          }
        }
      }

      // Check and handle base64 uploads for audioUrl
      if (item.audioUrl && item.audioUrl.startsWith('data:')) {
        const commaIndex = item.audioUrl.indexOf(',');
        if (commaIndex !== -1) {
          const prefix = item.audioUrl.substring(0, commaIndex);
          const base64Data = item.audioUrl.substring(commaIndex + 1);
          const mimeMatch = prefix.match(/data:([^;]+);base64/);
          if (mimeMatch) {
            const mimeType = mimeMatch[1];
            // Delete old audio file if it was locally uploaded
            if (existingSermon) {
              const oldAudio = existingSermon.audioUrl || existingSermon.audio_url;
              if (oldAudio && oldAudio.startsWith('/api/uploads/')) {
                const oldPath = path.join(DATA_DIR, 'uploads', path.basename(oldAudio));
                if (fs.existsSync(oldPath)) {
                  try { fs.unlinkSync(oldPath); } catch (e) { console.error('Failed to delete old audio file', e); }
                }
              }
            }

            const buffer = Buffer.from(base64Data, 'base64');
            let ext = '.mp3';
            if (mimeType.includes('wav')) ext = '.wav';
            else if (mimeType.includes('ogg')) ext = '.ogg';
            else if (mimeType.includes('aac')) ext = '.aac';
            else if (mimeType.includes('m4a') || mimeType.includes('x-m4a')) ext = '.m4a';

            const uploadDir = path.join(DATA_DIR, 'uploads');
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filename = `audio_${item.id}_${Date.now()}${ext}`;
            const filepath = path.join(uploadDir, filename);
            fs.writeFileSync(filepath, buffer);
            item.audioUrl = `/api/uploads/${filename}`;
            console.log(`Saved audio file to ${filepath}`);
          }
        }
      }

      // Check and handle base64 uploads for thumbnail
      if (item.thumbnail && item.thumbnail.startsWith('data:')) {
        const commaIndex = item.thumbnail.indexOf(',');
        if (commaIndex !== -1) {
          const prefix = item.thumbnail.substring(0, commaIndex);
          const base64Data = item.thumbnail.substring(commaIndex + 1);
          const mimeMatch = prefix.match(/data:([^;]+);base64/);
          if (mimeMatch) {
            const mimeType = mimeMatch[1];
            // Delete old thumbnail file if it was locally uploaded
            if (existingSermon) {
              const oldThumb = existingSermon.thumbnail || existingSermon.thumbnail_url;
              if (oldThumb && oldThumb.startsWith('/api/uploads/')) {
                const oldPath = path.join(DATA_DIR, 'uploads', path.basename(oldThumb));
                if (fs.existsSync(oldPath)) {
                  try { fs.unlinkSync(oldPath); } catch (e) { console.error('Failed to delete old thumbnail file', e); }
                }
              }
            }

            const buffer = Buffer.from(base64Data, 'base64');
            let ext = '.jpg';
            if (mimeType.includes('png')) ext = '.png';
            else if (mimeType.includes('webp')) ext = '.webp';
            else if (mimeType.includes('gif')) ext = '.gif';

            const uploadDir = path.join(DATA_DIR, 'uploads');
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filename = `thumb_${item.id}_${Date.now()}${ext}`;
            const filepath = path.join(uploadDir, filename);
            fs.writeFileSync(filepath, buffer);
            item.thumbnail = `/api/uploads/${filename}`;
            console.log(`Saved thumbnail file to ${filepath}`);
          }
        }
      }

      if (pool) {
        await pool.query(
          `INSERT INTO sermons (id, title, speaker, duration, thumbnail, views, downloads, date, description, category, video_url, audio_url, audios)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             speaker = EXCLUDED.speaker,
             duration = EXCLUDED.duration,
             thumbnail = EXCLUDED.thumbnail,
             views = EXCLUDED.views,
             downloads = EXCLUDED.downloads,
             date = EXCLUDED.date,
             description = EXCLUDED.description,
             category = EXCLUDED.category,
             video_url = EXCLUDED.video_url,
             audio_url = EXCLUDED.audio_url,
             audios = EXCLUDED.audios`,
          [item.id, item.title, item.speaker, item.duration, item.thumbnail, item.views || 0, item.downloads || 0, item.date, item.description, item.category, item.videoUrl, item.audioUrl, JSON.stringify(item.audios || [])]
        );
      } else {
        const data = JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8'));
        const index = data.findIndex(x => x.id === item.id);
        if (index > -1) {
          data[index] = item;
        } else {
          data.push(item);
        }
        fs.writeFileSync(SERMONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
      }
      sendJson(res, 200, { success: true, item });
    } catch (e) {
      sendJson(res, 500, { error: 'Failed to save sermon' });
    }
    return;
  }

  // DELETE Sermons
  if (pathname.startsWith('/api/sermons/') && method === 'DELETE') {
    try {
      const id = pathname.substring('/api/sermons/'.length);

      // Check if we need to clean up local uploads
      let sermon = null;
      if (pool) {
        const result = await pool.query('SELECT audio_url, thumbnail, audios FROM sermons WHERE id = $1', [id]);
        if (result.rowCount > 0) {
          sermon = result.rows[0];
          if (sermon) {
            sermon.audios = typeof sermon.audios === 'string' ? JSON.parse(sermon.audios) : (sermon.audios || []);
          }
        }
      } else {
        const data = JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8'));
        sermon = data.find(x => x.id === id);
      }

      if (sermon) {
        const audioUrl = sermon.audioUrl || sermon.audio_url;
        const thumbnailUrl = sermon.thumbnail || sermon.thumbnail_url;
        const audiosList = sermon.audios || [];

        if (audioUrl && audioUrl.startsWith('/api/uploads/')) {
          const filepath = path.join(DATA_DIR, 'uploads', path.basename(audioUrl));
          if (fs.existsSync(filepath)) {
            try { fs.unlinkSync(filepath); } catch (e) { console.error('Failed to delete audio file', e); }
          }
        }
        if (thumbnailUrl && thumbnailUrl.startsWith('/api/uploads/')) {
          const filepath = path.join(DATA_DIR, 'uploads', path.basename(thumbnailUrl));
          if (fs.existsSync(filepath)) {
            try { fs.unlinkSync(filepath); } catch (e) { console.error('Failed to delete thumbnail file', e); }
          }
        }
        if (Array.isArray(audiosList)) {
          for (const aud of audiosList) {
            const url = aud.audioUrl;
            if (url && url.startsWith('/api/uploads/')) {
              const filepath = path.join(DATA_DIR, 'uploads', path.basename(url));
              if (fs.existsSync(filepath)) {
                try { fs.unlinkSync(filepath); } catch (e) { console.error('Failed to delete series audio file', e); }
              }
            }
          }
        }
      }

      if (pool) {
        await pool.query('DELETE FROM sermons WHERE id = $1', [id]);
      } else {
        const data = JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8'));
        const filtered = data.filter(x => x.id !== id);
        fs.writeFileSync(SERMONS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      }
      sendJson(res, 200, { success: true });
    } catch (e) {
      sendJson(res, 500, { error: 'Failed to delete sermon' });
    }
    return;
  }

  // POST Books (Save or Update)
  if (pathname === '/api/books' && method === 'POST') {
    try {
      const item = await getJsonBody(req);
      if (!item.id || !item.title || !item.author) {
        sendJson(res, 400, { error: 'Book id, title and author are required' });
        return;
      }

      if (pool) {
        await pool.query(
          `INSERT INTO books (id, title, author, cover_url, description, category, download_url, rating, amazon_url, selar_url, pages, downloads, pdfs)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             author = EXCLUDED.author,
             cover_url = EXCLUDED.cover_url,
             description = EXCLUDED.description,
             category = EXCLUDED.category,
             download_url = EXCLUDED.download_url,
             rating = EXCLUDED.rating,
             amazon_url = EXCLUDED.amazon_url,
             selar_url = EXCLUDED.selar_url,
             pages = EXCLUDED.pages,
             downloads = EXCLUDED.downloads,
             pdfs = EXCLUDED.pdfs`,
          [item.id, item.title, item.author, item.coverUrl || '', item.description || '', item.category || '', item.downloadUrl || '', item.rating || 4.8, item.amazonUrl || '', item.selarUrl || '', item.pages || 150, item.downloads || 0, JSON.stringify(item.pdfs || [])]
        );
      } else {
        const data = JSON.parse(fs.readFileSync(BOOKS_FILE, 'utf-8'));
        const index = data.findIndex(x => x.id === item.id);
        if (index > -1) {
          data[index] = item;
        } else {
          data.push(item);
        }
        fs.writeFileSync(BOOKS_FILE, JSON.stringify(data, null, 2), 'utf-8');
      }
      sendJson(res, 200, { success: true, item });
    } catch (e) {
      sendJson(res, 500, { error: 'Failed to save book' });
    }
    return;
  }

  // DELETE Books
  if (pathname.startsWith('/api/books/') && method === 'DELETE') {
    try {
      const id = pathname.substring('/api/books/'.length);
      if (pool) {
        await pool.query('DELETE FROM books WHERE id = $1', [id]);
      } else {
        const data = JSON.parse(fs.readFileSync(BOOKS_FILE, 'utf-8'));
        const filtered = data.filter(x => x.id !== id);
        fs.writeFileSync(BOOKS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      }
      sendJson(res, 200, { success: true });
    } catch (e) {
      sendJson(res, 500, { error: 'Failed to delete book' });
    }
    return;
  }

  // POST Blog Posts (Save or Update)
  if (pathname === '/api/blog' && method === 'POST') {
    try {
      const item = await getJsonBody(req);
      if (!item.id || !item.title || !item.author) {
        sendJson(res, 400, { error: 'Blog post id, title and author are required' });
        return;
      }

      if (pool) {
        await pool.query(
          `INSERT INTO blog_posts (id, title, author, date, read_time, excerpt, image_url, category, content, seo_title, seo_description, seo_keywords, slug)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             author = EXCLUDED.author,
             date = EXCLUDED.date,
             read_time = EXCLUDED.read_time,
             excerpt = EXCLUDED.excerpt,
             image_url = EXCLUDED.image_url,
             category = EXCLUDED.category,
             content = EXCLUDED.content,
             seo_title = EXCLUDED.seo_title,
             seo_description = EXCLUDED.seo_description,
             seo_keywords = EXCLUDED.seo_keywords,
             slug = EXCLUDED.slug`,
          [item.id, item.title, item.author, item.date, item.readTime, item.excerpt, item.imageUrl, item.category, item.content, item.seoTitle || item.title, item.seoDescription || item.excerpt, item.seoKeywords || '', item.slug || '']
        );
      } else {
        const data = JSON.parse(fs.readFileSync(BLOG_FILE, 'utf-8'));
        const index = data.findIndex(x => x.id === item.id);
        if (index > -1) {
          data[index] = item;
        } else {
          data.push(item);
        }
        fs.writeFileSync(BLOG_FILE, JSON.stringify(data, null, 2), 'utf-8');
      }
      sendJson(res, 200, { success: true, item });
    } catch (e) {
      sendJson(res, 500, { error: 'Failed to save blog post' });
    }
    return;
  }

  // DELETE Blog Posts
  if (pathname.startsWith('/api/blog/') && method === 'DELETE') {
    try {
      const id = pathname.substring('/api/blog/'.length);
      if (pool) {
        await pool.query('DELETE FROM blog_posts WHERE id = $1', [id]);
      } else {
        const data = JSON.parse(fs.readFileSync(BLOG_FILE, 'utf-8'));
        const filtered = data.filter(x => x.id !== id);
        fs.writeFileSync(BLOG_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      }
      sendJson(res, 200, { success: true });
    } catch (e) {
      sendJson(res, 500, { error: 'Failed to delete blog post' });
    }
    return;
  }

  // POST Radio Settings
  if (pathname === '/api/radio' && method === 'POST') {
    try {
      const { url, active } = await getJsonBody(req);
      if (url === undefined || active === undefined) {
        sendJson(res, 400, { error: 'Radio url and active are required' });
        return;
      }

      if (pool) {
        await pool.query('UPDATE radio SET url = $1, active = $2 WHERE id = 1', [url, active]);
      } else {
        fs.writeFileSync(RADIO_FILE, JSON.stringify({ url, active }, null, 2), 'utf-8');
      }
      sendJson(res, 200, { success: true });
    } catch (e) {
      sendJson(res, 500, { error: 'Failed to save radio settings' });
    }
    return;
  }

  // POST Settings (Superadmin only)
  if (pathname === '/api/settings' && method === 'POST') {
    if (user.role !== 'superadmin') {
      sendJson(res, 403, { error: 'Superadmin access required' });
      return;
    }
    try {
      const body = await getJsonBody(req);
      const {
        flutterwave_prophetic_client_id = '',
        flutterwave_prophetic_client_secret = '',
        flutterwave_mission_client_id = '',
        flutterwave_mission_client_secret = ''
      } = body;

      if (pool) {
        await pool.query(
          `UPDATE settings SET
            flutterwave_prophetic_client_id = $1,
            flutterwave_prophetic_client_secret = $2,
            flutterwave_mission_client_id = $3,
            flutterwave_mission_client_secret = $4
           WHERE id = 1`,
          [flutterwave_prophetic_client_id, flutterwave_prophetic_client_secret, flutterwave_mission_client_id, flutterwave_mission_client_secret]
        );
      } else {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
          flutterwave_prophetic_client_id,
          flutterwave_prophetic_client_secret,
          flutterwave_mission_client_id,
          flutterwave_mission_client_secret
        }, null, 2), 'utf-8');
      }
      sendJson(res, 200, { success: true });
    } catch (e) {
      console.error('Failed to save settings:', e);
      sendJson(res, 500, { error: 'Failed to save settings' });
    }
    return;
  }

  // POST /api/events (Create & Update / Edit)
  if (pathname === '/api/events' && method === 'POST') {
    try {
      const event = await getJsonBody(req);
      const { id, title, date, time, location, description, imageUrl, speakers, capacity, status, registrations } = event;
      if (!title || !date || !time || !location) {
        sendJson(res, 400, { error: 'Title, date, time, and location are required' });
        return;
      }
      
      const evId = id || crypto.randomUUID();
      const evSpeakers = Array.isArray(speakers) ? speakers : [];
      const evCapacity = capacity ? parseInt(capacity) : 1000;
      const evStatus = status || 'Upcoming';
      const evRegistrations = registrations ? parseInt(registrations) : 0;

      if (pool) {
        await pool.query(
          `INSERT INTO events (id, title, date, time, location, description, image_url, speakers, registrations, capacity, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             date = EXCLUDED.date,
             time = EXCLUDED.time,
             location = EXCLUDED.location,
             description = EXCLUDED.description,
             image_url = EXCLUDED.image_url,
             speakers = EXCLUDED.speakers,
             capacity = EXCLUDED.capacity,
             status = EXCLUDED.status,
             registrations = EXCLUDED.registrations`,
          [evId, title, date, time, location, description || '', imageUrl || '', JSON.stringify(evSpeakers), evRegistrations, evCapacity, evStatus]
        );
      } else {
        const events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));
        const index = events.findIndex(ev => ev.id === evId);
        if (index >= 0) {
          events[index] = { id: evId, title, date, time, location, description: description || '', imageUrl: imageUrl || '', speakers: evSpeakers, registrations: evRegistrations, capacity: evCapacity, status: evStatus };
        } else {
          events.push({ id: evId, title, date, time, location, description: description || '', imageUrl: imageUrl || '', speakers: evSpeakers, registrations: evRegistrations, capacity: evCapacity, status: evStatus });
        }
        fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf-8');
      }
      sendJson(res, 200, { id: evId, title, date, time, location, description, imageUrl, speakers: evSpeakers, registrations: evRegistrations, capacity: evCapacity, status: evStatus });
    } catch (e) {
      sendJson(res, 500, { error: 'Failed to save event' });
    }
    return;
  }

  // DELETE /api/events/:id
  if (pathname.startsWith('/api/events/') && method === 'DELETE') {
    try {
      const parts = pathname.split('/');
      const id = parts[parts.length - 1];
      if (!id) {
        sendJson(res, 400, { error: 'Event ID is required' });
        return;
      }

      if (pool) {
        await pool.query('DELETE FROM events WHERE id = $1', [id]);
      } else {
        const events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));
        const filtered = events.filter(ev => ev.id !== id);
        fs.writeFileSync(EVENTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      }
      sendJson(res, 200, { success: true });
    } catch (e) {
      sendJson(res, 500, { error: 'Failed to delete event' });
    }
    return;
  }

  // --- MESSAGES API ---

  // POST /api/messages (Public)
  if (pathname === '/api/messages' && method === 'POST') {
    try {
      const body = await getJsonBody(req);
      const { name, email, subject, message } = body;
      if (!name || !email || !message) {
        sendJson(res, 400, { error: 'Name, email, and message are required' });
        return;
      }
      
      if (pool) {
        await pool.query(
          `INSERT INTO messages (name, email, subject, message) VALUES ($1, $2, $3, $4)`,
          [name, email, subject || 'No Subject', message]
        );
      } else {
        // Fallback for local JSON storage if needed
        const messagesFile = path.join(DATA_DIR, 'messages.json');
        let messages = [];
        if (fs.existsSync(messagesFile)) {
          messages = JSON.parse(fs.readFileSync(messagesFile, 'utf-8'));
        }
        messages.push({
          id: Date.now(),
          name, email, subject: subject || 'No Subject', message,
          status: 'unread',
          created_at: new Date().toISOString()
        });
        fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
      }
      sendJson(res, 200, { success: true });
    } catch (e) {
      console.error('Failed to submit message:', e);
      sendJson(res, 500, { error: 'Failed to submit message' });
    }
    return;
  }

  // GET /api/admin/messages (Protected)
  if (pathname === '/api/admin/messages' && method === 'GET') {
    
    try {
      if (pool) {
        const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
        sendJson(res, 200, result.rows);
      } else {
        const messagesFile = path.join(DATA_DIR, 'messages.json');
        if (fs.existsSync(messagesFile)) {
          const messages = JSON.parse(fs.readFileSync(messagesFile, 'utf-8'));
          sendJson(res, 200, messages.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
        } else {
          sendJson(res, 200, []);
        }
      }
    } catch (e) {
      console.error('Failed to fetch messages:', e);
      sendJson(res, 500, { error: 'Failed to fetch messages' });
    }
    return;
  }

  // PUT /api/admin/messages/:id (Protected) - Update status
  if (pathname.startsWith('/api/admin/messages/') && method === 'PUT') {
    
    try {
      const parts = pathname.split('/');
      const id = parts[parts.length - 1];
      const body = await getJsonBody(req);
      const { status } = body;
      
      if (pool) {
        await pool.query('UPDATE messages SET status = $1 WHERE id = $2', [status, id]);
      } else {
        const messagesFile = path.join(DATA_DIR, 'messages.json');
        if (fs.existsSync(messagesFile)) {
          let messages = JSON.parse(fs.readFileSync(messagesFile, 'utf-8'));
          messages = messages.map(m => m.id == id ? { ...m, status } : m);
          fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
        }
      }
      sendJson(res, 200, { success: true });
    } catch (e) {
      console.error('Failed to update message:', e);
      sendJson(res, 500, { error: 'Failed to update message' });
    }
    return;
  }

  // DELETE /api/admin/messages/:id (Protected)
  if (pathname.startsWith('/api/admin/messages/') && method === 'DELETE') {
    
    try {
      const parts = pathname.split('/');
      const id = parts[parts.length - 1];
      
      if (pool) {
        await pool.query('DELETE FROM messages WHERE id = $1', [id]);
      } else {
        const messagesFile = path.join(DATA_DIR, 'messages.json');
        if (fs.existsSync(messagesFile)) {
          let messages = JSON.parse(fs.readFileSync(messagesFile, 'utf-8'));
          messages = messages.filter(m => m.id != id);
          fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
        }
      }
      sendJson(res, 200, { success: true });
    } catch (e) {
      console.error('Failed to delete message:', e);
      sendJson(res, 500, { error: 'Failed to delete message' });
    }
    return;
  }

  // If no match found
  sendJson(res, 404, { error: 'Route Not Found' });
});

server.listen(PORT, () => {
  console.log(`Joshua Generation API Server running on port ${PORT}`);
});
