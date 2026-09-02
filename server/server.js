import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import webpush from 'web-push';
import { exec } from 'child_process';
import { DEFAULT_PRIVACY_POLICY, DEFAULT_TERMS_OF_SERVICE } from './legal_defaults.js';

const vapidPublicKey = 'BJBaNfrwFP_ZX_Awp6_rgOoWJt42KKagStsZfInoih_gZyK7dDDogJA_2cm0JCNDY0erJ7g7_WRr8Xe3m_wZjls';
const vapidPrivateKey = 'aKHYYiUWorSmhB8bGJc8lTlBDeP-1bgOd1QHU-MMzxo';
webpush.setVapidDetails('mailto:hello@joshuagen.org', vapidPublicKey, vapidPrivateKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from local .env file
try {
  let envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    envPath = path.join(__dirname, '..', '.env');
  }
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

const PORT = process.env.PORT || 5001;
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
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');
const SA_SUBSCRIBERS_FILE = path.join(DATA_DIR, 'sa_subscribers.json');
const SD_SUBSCRIBERS_FILE = path.join(DATA_DIR, 'sd_subscribers.json');
const TESTIMONIES_FILE = path.join(DATA_DIR, 'testimonies.json');
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');
const DEFAULTS_FILE = path.resolve(__dirname, 'default_data.json');

// In-memory sessions store
const sessions = new Map(); // token -> { username, expiresAt }

// --- Database Connection Pool (Postgres) ---
let pool = null;
const dbConnectionString = process.env.DATABASE_URL || 'postgresql://jg_admin:GgCXXuFM5H40Yj4uv@localhost:5432/joshuagen';

try {
  const pgModule = await import('pg');
  pool = new pgModule.default.Pool({
    connectionString: dbConnectionString,
    ssl: dbConnectionString.includes('sslmode=require') || dbConnectionString.includes('supabase') ? {
      rejectUnauthorized: false
    } : false
  });
  console.log('Connecting to PostgreSQL database:', dbConnectionString.replace(/:[^:@]+@/, ':****@'));
} catch (err) {
  console.error('Failed to load pg module. Database pool inactive.', err);
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

  const cleanToEmail = (toEmail || '').trim().replace(/^\.+/, '');

  if (!cleanToEmail) {
    console.error('[ZeptoMail Error] Recipient email is empty or invalid:', toEmail);
    return { success: false, error: 'Recipient email address is invalid.' };
  }

  if (!token) {
    console.error('[ZeptoMail Error] ZEPTOMAIL_TOKEN is missing in environment variables.');
    return { success: false, error: 'ZeptoMail Send Mail Token (ZEPTOMAIL_TOKEN) is not configured in server/.env.' };
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
              "address": cleanToEmail,
              "name": toName || cleanToEmail
            }
          }
        ],
        "subject": subject,
        "htmlbody": htmlBody
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ZeptoMail Error] Failed to send email to ${cleanToEmail}. Status: ${response.status}. Response: ${errText}`);
      let parsedError = 'ZeptoMail API Error';
      try {
        const errJson = JSON.parse(errText);
        parsedError = errJson.message || errJson.error?.message || errText;
      } catch (e) {
        parsedError = errText;
      }
      return { success: false, error: parsedError };
    }

    console.log(`[ZeptoMail Success] Email sent successfully to ${cleanToEmail}`);
    return { success: true };
  } catch (err) {
    console.error(`[ZeptoMail Exception] Exception while sending email to ${cleanToEmail}:`, err);
    return { success: false, error: err.message || 'Network exception connecting to ZeptoMail' };
  }
}

function wrapInEmailTemplate(subject, content) {
  const bodyHtml = content
    .replace(/\r\n/g, '\n')
    .replace(/\n\n/g, '</p><p style="margin-bottom: 16px; color: #334155; line-height: 1.6; font-size: 16px;">')
    .replace(/\n/g, '<br />');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
  </style>
</head>
<body>
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600px" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background-color: #0f172a; padding: 30px 20px;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 10px;">
                    <img src="https://joshuasgeneration.com/favicon.png" alt="Logo" width="40" height="40" style="display: block; width: 40px; height: 40px; border-radius: 50%;" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family: system-ui, sans-serif; font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 0.05em;">
                    <span style="color: #ffffff;">Joshuas</span><span style="color: #d97706;">Generation</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              <h1 style="margin-top: 0; margin-bottom: 24px; font-size: 22px; font-weight: bold; color: #0f172a; line-height: 1.3;">
                ${subject}
              </h1>
              <div style="font-size: 16px; color: #334155; line-height: 1.6;">
                <p style="margin-bottom: 16px; color: #334155; line-height: 1.6; font-size: 16px;">
                  ${bodyHtml}
                </p>
              </div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 30px;">
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #ffffff; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                You are receiving this email because you subscribed to our newsletter on <a href="https://joshuasgeneration.com" style="color: #2563eb; text-decoration: none; font-weight: 500;">joshuasgeneration.com</a>.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">
                <a href="https://joshuasgeneration.com/api/unsubscribe?email={{RECIPIENT_EMAIL}}" style="color: #64748b; text-decoration: underline; font-weight: 500;">Unsubscribe from this list</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

const defaultEvents = [];

const defaultUsers = [
  { id: 1, name: 'Apostle Joshua Iyemifokhae', email: 'john@joshuagen.org', status: 'active', joined: 'Jan 1, 2020', sermons: 312, donations: 15000, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', role: 'Superadmin' }
];

const defaultTestimonies = [
  {
    id: 't1',
    name: 'Maria Gonzalez',
    content: 'I came to JGen broken and hopeless. Through the teachings and the community, I found my purpose. Today I\'m a youth leader mentoring others!',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    type: 'written',
    date: '2025-11-25'
  },
  {
    id: 't2',
    name: 'James O\'Brien',
    content: 'After 20 years of addiction, God set me free during a JGen conference. The prayer team never gave up on me. Now I\'m free indeed!',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    type: 'written',
    date: '2025-11-20'
  },
  {
    id: 't3',
    name: 'Sarah & David Chen',
    content: 'Our marriage was at the brink of divorce when we attended the Kingdom Marriage seminar. God restored what the enemy stole!',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    type: 'written',
    date: '2025-11-15'
  },
  {
    id: 't4',
    name: 'Pastor Amos Kiprop',
    content: 'The leadership training at JGen transformed how I pastor my church. The resources and mentorship are unparalleled.',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80',
    type: 'written',
    date: '2025-11-10'
  },
  {
    id: 't5',
    name: 'Emily Watson',
    content: 'I was diagnosed with a chronic illness, but through the teachings on divine healing and the prayers of the saints, I am completely healed!',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    type: 'written',
    date: '2025-11-05'
  },
  {
    id: 't6',
    name: 'Michael Adebayo',
    content: 'God used JGen to teach me kingdom economics. I went from debt to financial freedom in one year. The principles work!',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80',
    type: 'written',
    date: '2025-10-30'
  }
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
    fs.writeFileSync(SERMONS_FILE, JSON.stringify((defaults.sermons || []).map(s => ({ ...s, audience: 'public' })), null, 2), 'utf-8');
    console.log('Initialized local sermons database.');
  } else {
    try {
      const sermons = JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8'));
      if (Array.isArray(sermons)) {
        let updated = false;
        sermons.forEach(s => {
          if (!s.audience) {
            s.audience = 'public';
            updated = true;
          }
        });
        if (updated) {
          fs.writeFileSync(SERMONS_FILE, JSON.stringify(sermons, null, 2), 'utf-8');
          console.log('Migrated local sermons database to add audience fields.');
        }
      }
    } catch (e) {
      console.error('Failed to migrate local sermons file:', e);
    }
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
  if (!fs.existsSync(TESTIMONIES_FILE)) {
    fs.writeFileSync(TESTIMONIES_FILE, JSON.stringify(defaultTestimonies, null, 2), 'utf-8');
    console.log('Initialized local testimonies database.');
  }
  if (!fs.existsSync(COMMENTS_FILE)) {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify([], null, 2), 'utf-8');
    console.log('Initialized local comments database.');
  }
  if (!fs.existsSync(SA_SUBSCRIBERS_FILE)) {
    fs.writeFileSync(SA_SUBSCRIBERS_FILE, JSON.stringify([], null, 2), 'utf-8');
    console.log('Initialized local South Africa subscribers database.');
  }
  if (!fs.existsSync(SD_SUBSCRIBERS_FILE)) {
    fs.writeFileSync(SD_SUBSCRIBERS_FILE, JSON.stringify([], null, 2), 'utf-8');
    console.log('Initialized local Sons and Daughters subscribers database.');
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
          audios JSONB DEFAULT '[]'::jsonb,
          audience VARCHAR DEFAULT 'public'
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
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sa_subscribers (
          id VARCHAR PRIMARY KEY,
          email VARCHAR UNIQUE NOT NULL,
          name VARCHAR,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sd_subscribers (
          id VARCHAR PRIMARY KEY,
          email VARCHAR UNIQUE NOT NULL,
          name VARCHAR,
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
      try {
        await pool.query("ALTER TABLE sermons ADD COLUMN IF NOT EXISTS audience VARCHAR DEFAULT 'public'");
      } catch (err) {
        console.warn("Failed to check/add audience column to sermons table:", err.message);
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
        await pool.query("ALTER TABLE books ADD COLUMN IF NOT EXISTS views INT DEFAULT 0");
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

      try {
        await pool.query("ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS views INT DEFAULT 0");
      } catch (err) {
        console.warn("Failed to migrate blog_posts table:", err.message);
      }

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
      for (const col of ['flutterwave_prophetic_client_id', 'flutterwave_prophetic_client_secret', 'flutterwave_mission_client_id', 'flutterwave_mission_client_secret', 'contactEmail', 'contactPhone', 'contactAddress', 'socialFacebook', 'socialTwitter', 'socialInstagram', 'socialYoutube', 'homeHeadlinePrefix', 'homeHeadlineHighlight', 'homeHeadlineSuffix', 'homeSubheading', 'homeBibleVerse', 'homeBibleReference', 'adsense_auto_code', 'adsense_above_blog_code', 'adsense_center_blog_code', 'adsense_beneath_blog_code', 'filter_words', 'block_links', 'privacyPolicy', 'termsOfService']) {
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
        await pool.query(`
          INSERT INTO settings (
            id, 
            flutterwave_prophetic_client_id, 
            flutterwave_prophetic_client_secret, 
            flutterwave_mission_client_id, 
            flutterwave_mission_client_secret
          ) VALUES (
            1, 
            'FLWPUBK-e83f5b22f448ff39c1f157b929adadc9-X', 
            'FLWSECK-8062008c8cdda5846480c599b94c9b80-19fc7c47ad9vt-X', 
            'FLWPUBK-4d5fe16c0831195900d5e49808253e0f-X', 
            'FLWSECK-5df1ed2b34c0770e965289c196aa770a-19fc7c2e858vt-X'
          )
        `);
      } else {
        await pool.query(`
          UPDATE settings SET 
            flutterwave_prophetic_client_id = COALESCE(NULLIF(flutterwave_prophetic_client_id, ''), 'FLWPUBK-e83f5b22f448ff39c1f157b929adadc9-X'),
            flutterwave_prophetic_client_secret = COALESCE(NULLIF(flutterwave_prophetic_client_secret, ''), 'FLWSECK-8062008c8cdda5846480c599b94c9b80-19fc7c47ad9vt-X'),
            flutterwave_mission_client_id = COALESCE(NULLIF(flutterwave_mission_client_id, ''), 'FLWPUBK-4d5fe16c0831195900d5e49808253e0f-X'),
            flutterwave_mission_client_secret = COALESCE(NULLIF(flutterwave_mission_client_secret, ''), 'FLWSECK-5df1ed2b34c0770e965289c196aa770a-19fc7c2e858vt-X')
          WHERE id = 1
        `);
      }
      try {
        await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS counter_page_views INT DEFAULT 0');
      } catch (e) {
        console.error('Failed to add counter_page_views column:', e);
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

      // Events table created cleanly without auto-seeding mock data

      await pool.query(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          endpoint VARCHAR PRIMARY KEY,
          keys JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS custom_forms (
          id VARCHAR PRIMARY KEY,
          slug VARCHAR UNIQUE NOT NULL,
          title VARCHAR NOT NULL,
          description TEXT DEFAULT '',
          fields JSONB DEFAULT '[]'::jsonb,
          is_active BOOLEAN DEFAULT true,
          enable_redirect BOOLEAN DEFAULT false,
          redirect_button_label VARCHAR DEFAULT 'CLICK HERE TO COMPLETE REGISTRATION',
          redirect_url TEXT DEFAULT '',
          success_message TEXT DEFAULT 'Thank you for filling out this form! Your details have been successfully recorded.',
          banner_image_url TEXT DEFAULT '',
          featured_image TEXT DEFAULT '',
          banner_position TEXT DEFAULT 'center center',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      for (const col of ['featured_image', 'banner_position']) {
        try { await pool.query(`ALTER TABLE custom_forms ADD COLUMN IF NOT EXISTS ${col} TEXT DEFAULT ''`); } catch (e) {}
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS form_submissions (
          id VARCHAR PRIMARY KEY,
          form_id VARCHAR NOT NULL,
          form_slug VARCHAR NOT NULL,
          answers JSONB DEFAULT '{}'::jsonb,
          submitter_ip VARCHAR DEFAULT '',
          user_agent TEXT DEFAULT '',
          created_at TIMESTAMP DEFAULT NOW()
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

      await pool.query(`
        CREATE TABLE IF NOT EXISTS testimonies (
          id VARCHAR PRIMARY KEY,
          name VARCHAR NOT NULL,
          content TEXT NOT NULL,
          image_url TEXT,
          type VARCHAR DEFAULT 'written',
          date VARCHAR
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS comments (
          id VARCHAR PRIMARY KEY,
          item_type VARCHAR NOT NULL,
          item_id VARCHAR NOT NULL,
          name VARCHAR NOT NULL,
          text TEXT NOT NULL,
          created_at VARCHAR NOT NULL,
          status VARCHAR DEFAULT 'approved'
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          token VARCHAR(255) PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          expires_at BIGINT NOT NULL
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS redirect_links (
          id SERIAL PRIMARY KEY,
          slug VARCHAR(255) UNIQUE NOT NULL,
          target_url TEXT NOT NULL,
          title VARCHAR(255) DEFAULT '',
          click_count INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      let defaults = { sermons: [], books: [], blogPosts: [], radio: { url: 'https://mixlr.com/users/8375836/embed', active: false } };
      if (fs.existsSync(DEFAULTS_FILE)) {
        try {
          defaults = JSON.parse(fs.readFileSync(DEFAULTS_FILE, 'utf-8'));
        } catch (e) {
          console.error('Failed to parse default_data.json', e);
        }
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
  try {
    await generateSitemap();
  } catch (err) {
    console.error('Failed to run sitemap generation on startup:', err);
  }
}

// --- Sitemap Generator ---
async function generateSitemap() {
  try {
    let sermons = [];
    let books = [];
    let blogPosts = [];

    if (pool) {
      const sermonsRes = await pool.query('SELECT id FROM sermons');
      sermons = sermonsRes.rows;
      const booksRes = await pool.query('SELECT id FROM books');
      books = booksRes.rows;
      const blogRes = await pool.query('SELECT id FROM blog_posts');
      blogPosts = blogRes.rows;
    } else {
      if (fs.existsSync(SERMONS_FILE)) sermons = JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf8'));
      if (fs.existsSync(BOOKS_FILE)) books = JSON.parse(fs.readFileSync(BOOKS_FILE, 'utf8'));
      if (fs.existsSync(BLOG_FILE)) blogPosts = JSON.parse(fs.readFileSync(BLOG_FILE, 'utf8'));
    }

    const domain = 'https://joshuasgeneration.com';
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    const staticPages = [
      '',
      '/sermons',
      '/books',
      '/blog',
      '/podcast',
      '/contact',
      '/donate',
      '/partnership'
    ];

    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${domain}${page}</loc>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic sermons
    for (const sermon of sermons) {
      xml += `  <url>\n`;
      xml += `    <loc>${domain}/sermon/${sermon.id}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic books
    for (const book of books) {
      xml += `  <url>\n`;
      xml += `    <loc>${domain}/books/${book.id}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic blog posts
    for (const post of blogPosts) {
      xml += `  <url>\n`;
      xml += `    <loc>${domain}/blog/${post.id}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    const publicPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    const distPath = path.join(__dirname, '..', 'dist', 'sitemap.xml');

    try {
      fs.writeFileSync(publicPath, xml, 'utf8');
      console.log(`Successfully generated public sitemap at ${publicPath}`);
    } catch (e) {
      console.warn('Failed to write to public sitemap.xml:', e.message);
    }

    try {
      fs.writeFileSync(distPath, xml, 'utf8');
      console.log(`Successfully generated dist sitemap at ${distPath}`);
    } catch (e) {
      console.warn('Failed to write to dist sitemap.xml:', e.message);
    }
  } catch (err) {
    console.error('Failed to generate sitemap:', err);
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
async function getAuthenticatedUser(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);

  if (pool) {
    try {
      const result = await pool.query('SELECT username, role, expires_at FROM sessions WHERE token = $1', [token]);
      if (result.rowCount === 0) return null;
      
      const session = result.rows[0];
      const expiresAt = Number(session.expires_at);
      if (Date.now() > expiresAt) {
        await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
        return null;
      }
      return { username: session.username, role: session.role || 'admin' };
    } catch (dbErr) {
      console.warn('Database session fetch failed, falling back to in-memory sessions:', dbErr.message);
    }
  }

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

  // --- SHORT REDIRECT LINKS HANDLER (Pretty Links) ---
  if ((method === 'GET' || method === 'HEAD') && pathname !== '/' && !pathname.startsWith('/api/') && !pathname.startsWith('/assets/') && !pathname.startsWith('/static/')) {
    const rawSlug = pathname.replace(/^\/+|\/+$/g, '').trim();
    const reservedSlugs = [
      'admin', 'sermons', 'books', 'blog', 'events', 'radio', 'donate',
      'contact', 'privacy-policy', 'terms', 'cookie-policy', 'createimage',
      'getupdates', 'southafricaupdates', 'sondaughter', 'thank-you', 'podcast', 'counter'
    ];

    if (rawSlug && !reservedSlugs.includes(rawSlug.toLowerCase()) && !rawSlug.includes('.')) {
      if (pool) {
        try {
          const linkRes = await pool.query(
            'SELECT * FROM redirect_links WHERE LOWER(slug) = LOWER($1) AND is_active = TRUE LIMIT 1',
            [rawSlug]
          );
          if (linkRes.rows.length > 0) {
            const link = linkRes.rows[0];
            // Asynchronously increment click count
            pool.query('UPDATE redirect_links SET click_count = click_count + 1, updated_at = NOW() WHERE id = $1', [link.id])
              .catch(err => console.error('Error incrementing link click count:', err));

            let targetUrl = link.target_url.trim();
            if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
              targetUrl = `https://${targetUrl}`;
            }

            res.writeHead(302, { 'Location': targetUrl });
            res.end();
            return;
          }
        } catch (err) {
          console.error('Redirect link lookup error:', err);
        }
      }
    }
  }

  // --- SEO DYNAMIC OPENGRAPH HANDLER ---
  if (pathname === '/createimage' || pathname === '/createimage/' || pathname === '/image-generator' || pathname === '/getupdates' || pathname === '/getupdates/' || pathname === '/southafricaupdates' || pathname === '/southafricaupdates/' || pathname === '/sondaughter' || pathname === '/sondaughter/' || pathname.startsWith('/sermon/') || pathname.startsWith('/blog/') || pathname.startsWith('/books/')) {
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
      let imageUrl = 'https://joshuasgeneration.com/favicon.png';
      let keywords = 'faith, joshua generation, christian growth, ministry';

      // Helper to ensure URL is absolute
      const makeAbsolute = (url) => {
        if (!url) return url;
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        if (url.startsWith('/')) return `https://joshuasgeneration.com${url}`;
        return `https://joshuasgeneration.com/${url}`;
      };

      if (targetPath === '/getupdates' || targetPath === '/getupdates/') {
        title = "Get Spiritual Updates - Joshua's Generation";
        description = "Join our global family to receive spiritual updates, Zoom mentorship invitations, and midnight prayer reminders directly from Apostle Joshua Iyemifokhae.";
        imageUrl = "https://joshuasgeneration.com/newsletter-preview.jpg";
      } else if (targetPath === '/southafricaupdates' || targetPath === '/southafricaupdates/') {
        title = "Stay Connected (South Africa) - Joshua's Generation";
        description = "Join our South African family to receive updates, Zoom invitations, and meeting details directly from Apostle Joshua Iyemifokhae.";
        imageUrl = "https://joshuasgeneration.com/south-africa-updates.jpg";
      } else if (targetPath === '/sondaughter' || targetPath === '/sondaughter/') {
        title = "Sons & Daughters Mentorship - Joshua's Generation";
        description = "Connect as a son or daughter under the mentorship of Apostle Joshua Iyemifokhae. Receive specialized teachings, resources, and meetings updates.";
        imageUrl = "https://joshuasgeneration.com/newsletter-preview.jpg";
      } else if (targetPath.startsWith('/sermon/')) {
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
          const result = await pool.query('SELECT title, excerpt, image_url, seo_title, seo_description, seo_keywords FROM blog_posts WHERE id = $1 OR slug = $1', [id]);
          if (result.rows.length > 0) {
            const post = result.rows[0];
            title = post.seo_title || `${post.title} - Joshua Generation Blog`;
            description = post.seo_description || post.excerpt || description;
            imageUrl = makeAbsolute(post.image_url) || imageUrl;
            if (post.seo_keywords) {
              keywords = post.seo_keywords;
            }
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
      } else if (targetPath.startsWith('/form/')) {
        const slugOrId = targetPath.split('/form/')[1]?.split('/')[0]?.split('?')[0];
        if (slugOrId && pool) {
          const result = await pool.query(
            'SELECT title, description, featured_image, banner_image_url FROM custom_forms WHERE slug = $1 OR id::text = $1',
            [slugOrId]
          );
          if (result.rows.length > 0) {
            const form = result.rows[0];
            title = `${form.title} - Joshua's Generation`;
            if (form.description) {
              const plainDesc = form.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
              if (plainDesc) {
                description = plainDesc.length > 200 ? plainDesc.substring(0, 197) + '...' : plainDesc;
              }
            }
            const formImg = form.featured_image || form.banner_image_url;
            if (formImg) {
              imageUrl = makeAbsolute(formImg);
            }
          }
        }
      }

      // Strip existing Open Graph, Twitter, and description meta tags to prevent crawlers using the default homepage values
      html = html.replace(/<meta\s+[^>]*property=["']og:[^"']*["'][^>]*>/gi, '');
      html = html.replace(/<meta\s+[^>]*name=["']twitter:[^"']*["'][^>]*>/gi, '');
      html = html.replace(/<meta\s+[^>]*name=["']description["'][^>]*>/gi, '');
      html = html.replace(/<meta\s+[^>]*name=["']keywords["'][^>]*>/gi, '');

      html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
      const ogTags = `
        <meta name="description" content="${description.replace(/"/g, '&quot;')}">
        <meta name="keywords" content="${keywords.replace(/"/g, '&quot;')}">
        <meta property="og:title" content="${title.replace(/"/g, '&quot;')}">
        <meta property="og:description" content="${description.replace(/"/g, '&quot;')}">
        <meta property="og:image" content="${imageUrl}">
        <meta property="og:url" content="https://joshuasgeneration.com${targetPath}">
        <meta property="og:site_name" content="Joshua's Generation">
        <meta property="og:type" content="website">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}">
        <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}">
        <meta name="twitter:image" content="${imageUrl}">
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
  
  // --- ZeptoMail Bounce Webhook ---
  if (pathname === '/api/webhooks/zeptomail' && method === 'POST') {
    const params = new URLSearchParams(parsedUrl.search);
    const secret = params.get('secret');
    if (secret !== 'jgen_zepto_webhook_secret_2026') {
      return sendJson(res, 401, { error: 'Unauthorized secret key' });
    }

    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        console.log('[Webhook] ZeptoMail event received:', payload.action, payload.actionType);

        if (payload.action === 'bounce' && (payload.actionType === 'hard bounce' || payload.bounce_type === 'hard')) {
          const events = payload.data || [];
          for (const ev of events) {
            const email = ev.contact_email?.trim().toLowerCase();
            if (email) {
              console.log('[Webhook] Hard bounce detected. Deleting subscriber:', email);
              if (pool) {
                await pool.query('DELETE FROM subscribers WHERE LOWER(email) = $1', [email]);
                await pool.query('DELETE FROM sa_subscribers WHERE LOWER(email) = $1', [email]);
                await pool.query('DELETE FROM sd_subscribers WHERE LOWER(email) = $1', [email]);
              } else {
                if (fs.existsSync(SUBSCRIBERS_FILE)) {
                  let subs = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8'));
                  subs = subs.filter(s => s.email.toLowerCase() !== email);
                  fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
                }
                if (fs.existsSync(SA_SUBSCRIBERS_FILE)) {
                  let saSubs = JSON.parse(fs.readFileSync(SA_SUBSCRIBERS_FILE, 'utf-8'));
                  saSubs = saSubs.filter(s => s.email.toLowerCase() !== email);
                  fs.writeFileSync(SA_SUBSCRIBERS_FILE, JSON.stringify(saSubs, null, 2), 'utf-8');
                }
                if (fs.existsSync(SD_SUBSCRIBERS_FILE)) {
                  let sdSubs = JSON.parse(fs.readFileSync(SD_SUBSCRIBERS_FILE, 'utf-8'));
                  sdSubs = sdSubs.filter(s => s.email.toLowerCase() !== email);
                  fs.writeFileSync(SD_SUBSCRIBERS_FILE, JSON.stringify(sdSubs, null, 2), 'utf-8');
                }
              }
            }
          }
        }
        return sendJson(res, 200, { success: true });
      } catch (err) {
        console.error('[Webhook] Failed to process ZeptoMail webhook:', err);
        return sendJson(res, 500, { error: 'Internal Server Error' });
      }
    });
    return;
  }

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
        
        if (pool) {
          // Use ON CONFLICT to handle duplicates gracefully
          await pool.query(`
            INSERT INTO subscribers (id, email, name, is_active) 
            VALUES ($1, $2, $3, true)
            ON CONFLICT (email) DO UPDATE SET is_active = true, name = EXCLUDED.name
          `, [id, email, name]);
        } else {
          let subscribers = [];
          if (fs.existsSync(SUBSCRIBERS_FILE)) {
            subscribers = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8'));
          }
          const index = subscribers.findIndex(s => s.email.toLowerCase() === email.toLowerCase());
          if (index !== -1) {
            subscribers[index].is_active = true;
            if (name) subscribers[index].name = name;
          } else {
            subscribers.push({
              id,
              email,
              name,
              is_active: true,
              created_at: new Date().toISOString()
            });
          }
          fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf-8');
        }

        // Send welcome email asynchronously
        (async () => {
          const recipientName = name || email.split('@')[0];
          const nameParts = (name || '').trim().split(/\s+/);
          const firstName = nameParts[0] || email.split('@')[0];

          const welcomeSubject = "Welcome to Joshua's Generation!";
          const welcomeBody = `Dear ${firstName}

Welcome to Joshua's Generation!

I am absolutely thrilled to welcome you into this global family of believers who are burning for God, walking in their divine purpose, and transforming their world.

Here is what you now have access to:
•  Spiritual resources, and apostolic teachings that will help your walk with Jesus.
•  Private Mentorship Zoom Meetings (invitation details and links will be shared here).
•  Our Midnight Prayers reminders and join link.

I pray that your connection to this community sparks a fresh fire of revival and purpose in your life. Stay tuned for our upcoming meetings and I await your beautiful testimonies!

In Christ Love,
Apostle Joshua Iyemifokhae
Joshua's Generation`;

          const templateHtml = wrapInEmailTemplate(welcomeSubject, welcomeBody);
          const personalizedHtml = templateHtml.replace('{{RECIPIENT_EMAIL}}', encodeURIComponent(email));

          await sendZeptoEmail(email, recipientName, welcomeSubject, personalizedHtml);
          console.log(`[Subscription] Welcome email successfully sent to: ${email}`);
        })().catch(err => {
          console.error('[Subscription] Failed to send welcome email:', err);
        });

        return sendJson(res, 200, { success: true, message: 'Subscribed successfully!' });
      } catch (err) {
        console.error('Subscription error:', err);
        return sendJson(res, 500, { success: false, error: 'Internal Server Error' });
      }
    });
    return;
  }

  // --- South Africa Newsletter Subscriptions ---
  if (pathname === '/api/sa/subscribe' && method === 'POST') {
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
        
        if (pool) {
          await pool.query(`
            INSERT INTO sa_subscribers (id, email, name, is_active) 
            VALUES ($1, $2, $3, true)
            ON CONFLICT (email) DO UPDATE SET is_active = true, name = EXCLUDED.name
          `, [id, email, name]);
        } else {
          let subscribers = [];
          if (fs.existsSync(SA_SUBSCRIBERS_FILE)) {
            subscribers = JSON.parse(fs.readFileSync(SA_SUBSCRIBERS_FILE, 'utf-8'));
          }
          const index = subscribers.findIndex(s => s.email.toLowerCase() === email.toLowerCase());
          if (index !== -1) {
            subscribers[index].is_active = true;
            if (name) subscribers[index].name = name;
          } else {
            subscribers.push({
              id,
              email,
              name,
              is_active: true,
              created_at: new Date().toISOString()
            });
          }
          fs.writeFileSync(SA_SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf-8');
        }

        // Send welcome email asynchronously
        (async () => {
          const recipientName = name || email.split('@')[0];
          const nameParts = (name || '').trim().split(/\s+/);
          const firstName = nameParts[0] || email.split('@')[0];

          const welcomeSubject = "Welcome to Joshua's Generation South Africa!";
          const welcomeBody = `Dear ${firstName}

Welcome to Joshua's Generation South Africa!

I am absolutely thrilled to welcome you into this global family of believers who are burning for God, walking in their divine purpose, and transforming their world.

Stay tuned for our upcoming South African meetings, Zoom links, and updates. I await your beautiful testimonies!

In Christ Love,
Apostle Joshua Iyemifokhae
Joshua's Generation`;

          const templateHtml = wrapInEmailTemplate(welcomeSubject, welcomeBody);
          const personalizedHtml = templateHtml.replace('{{RECIPIENT_EMAIL}}', encodeURIComponent(email) + '&segment=sa');

          await sendZeptoEmail(email, recipientName, welcomeSubject, personalizedHtml);
          console.log(`[SA Subscription] Welcome email successfully sent to: ${email}`);
        })().catch(err => {
          console.error('[SA Subscription] Failed to send welcome email:', err);
        });

        return sendJson(res, 200, { success: true, message: 'Subscribed successfully!' });
      } catch (err) {
        console.error('SA Subscription error:', err);
        return sendJson(res, 500, { success: false, error: 'Internal Server Error' });
      }
    });
    return;
  }

  // --- Sons & Daughters Newsletter Subscriptions ---
  if (pathname === '/api/sd/subscribe' && method === 'POST') {
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
        
        if (pool) {
          await pool.query(`
            INSERT INTO sd_subscribers (id, email, name, is_active) 
            VALUES ($1, $2, $3, true)
            ON CONFLICT (email) DO UPDATE SET is_active = true, name = EXCLUDED.name
          `, [id, email, name]);
        } else {
          let subscribers = [];
          if (fs.existsSync(SD_SUBSCRIBERS_FILE)) {
            subscribers = JSON.parse(fs.readFileSync(SD_SUBSCRIBERS_FILE, 'utf-8'));
          }
          const index = subscribers.findIndex(s => s.email.toLowerCase() === email.toLowerCase());
          if (index !== -1) {
            subscribers[index].is_active = true;
            if (name) subscribers[index].name = name;
          } else {
            subscribers.push({
              id,
              email,
              name,
              is_active: true,
              created_at: new Date().toISOString()
            });
          }
          fs.writeFileSync(SD_SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf-8');
        }

        // Send welcome email asynchronously
        (async () => {
          const recipientName = name || email.split('@')[0];
          const nameParts = (name || '').trim().split(/\s+/);
          const firstName = nameParts[0] || email.split('@')[0];

          const welcomeSubject = "Welcome to the Sons & Daughters Mentorship!";
          const welcomeBody = `Dear ${firstName}

Welcome to Joshua's Generation Sons & Daughters Mentorship!

I am absolutely thrilled to welcome you into this special mentorship family. As a son/daughter under this mandate, you are called to walk in power, character, and apostolic alignment.

Here is what this mentorship list gives you access to:
•  Direct access to specialized teachings, books, and study materials.
•  Private Mentorship Zoom Links and interactive Q&A sessions.
•  Midnight Prayers priority alerts and direct apostolic guidance.

Stay tuned for our next scheduled meeting details and links. I declare that the fire of God will burn continuously upon the altar of your heart!

In Christ Love,
Apostle Joshua Iyemifokhae
Joshua's Generation`;

          const templateHtml = wrapInEmailTemplate(welcomeSubject, welcomeBody);
          const personalizedHtml = templateHtml.replace('{{RECIPIENT_EMAIL}}', encodeURIComponent(email) + '&segment=sd');

          await sendZeptoEmail(email, recipientName, welcomeSubject, personalizedHtml);
          console.log(`[SD Subscription] Welcome email successfully sent to: ${email}`);
        })().catch(err => {
          console.error('[SD Subscription] Failed to send welcome email:', err);
        });

        return sendJson(res, 200, { success: true, message: 'Subscribed successfully!' });
      } catch (err) {
        console.error('SD Subscription error:', err);
        return sendJson(res, 500, { success: false, error: 'Internal Server Error' });
      }
    });
    return;
  }

  if (pathname === '/api/admin/subscribers' && method === 'GET') {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Unauthorized' });
    }
    try {
      if (pool) {
        const result = await pool.query('SELECT * FROM subscribers ORDER BY created_at DESC');
        return sendJson(res, 200, result.rows);
      } else {
        let subscribers = [];
        if (fs.existsSync(SUBSCRIBERS_FILE)) {
          subscribers = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8'));
        }
        return sendJson(res, 200, subscribers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (err) {
      console.error('Fetch subscribers error:', err);
      return sendJson(res, 500, { error: 'Internal Server Error' });
    }
    return;
  }
  if (pathname.startsWith('/api/admin/subscribers/') && method === 'DELETE') {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Unauthorized' });
    }
    const id = pathname.split('/').pop();
    try {
      if (pool) {
        await pool.query('DELETE FROM subscribers WHERE id = $1', [id]);
      } else {
        if (fs.existsSync(SUBSCRIBERS_FILE)) {
          let subs = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8'));
          subs = subs.filter(s => s.id !== id);
          fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
        }
      }
      return sendJson(res, 200, { success: true, message: 'Subscriber deleted successfully' });
    } catch (err) {
      console.error('Delete subscriber error:', err);
      return sendJson(res, 500, { error: 'Internal Server Error' });
    }
  }

  if (pathname === '/api/admin/subscribers/email' && method === 'POST') {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Unauthorized' });
    }

    let body;
    try {
      body = await getJsonBody(req);
    } catch (e) {
      return sendJson(res, 400, { error: 'Invalid JSON body' });
    }

    const { subject, htmlBody, testEmail } = body;
    if (!subject || !htmlBody) {
      return sendJson(res, 400, { error: 'Subject and email body are required' });
    }

    try {
      let subscribers = [];
      if (testEmail) {
        subscribers = [{ name: 'Test Recipient', email: testEmail }];
      } else {
        if (pool) {
          const result = await pool.query('SELECT name, email FROM subscribers WHERE is_active = true');
          subscribers = result.rows;
        } else {
          if (fs.existsSync(SUBSCRIBERS_FILE)) {
            const allSubs = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8'));
            subscribers = allSubs.filter(s => s.is_active !== false);
          }
        }
      }

      if (subscribers.length === 0) {
        return sendJson(res, 200, { success: true, count: 0, message: 'No active subscribers found.' });
      }

      // Start background sending task to prevent HTTP connection timeouts
      (async () => {
        let successCount = 0;
        let failCount = 0;
        for (const sub of subscribers) {
          const email = sub.email;
          const fullName = sub.name || email.split('@')[0];
          const nameParts = (sub.name || '').trim().split(/\s+/);
          const firstName = nameParts[0] || email.split('@')[0];
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

          const personalizedSubject = subject
            .replace(/\{\{name\}\}/gi, fullName)
            .replace(/\{\{firstName\}\}/gi, firstName)
            .replace(/\{\{lastName\}\}/gi, lastName);

          const personalizedBodyText = htmlBody
            .replace(/\{\{name\}\}/gi, fullName)
            .replace(/\{\{firstName\}\}/gi, firstName)
            .replace(/\{\{lastName\}\}/gi, lastName);

          const emailTemplateHtml = wrapInEmailTemplate(personalizedSubject, personalizedBodyText);
          const personalizedHtml = emailTemplateHtml.replace('{{RECIPIENT_EMAIL}}', encodeURIComponent(email));

          const sent = await sendZeptoEmail(email, fullName, personalizedSubject, personalizedHtml);
          if (sent && sent.success) successCount++;
          else failCount++;
          
          // Wait 200ms between emails to prevent flooding/rate-limiting on ZeptoMail
          await new Promise(r => setTimeout(r, 200));
        }
        console.log(`[Bulk Email] Broadcaster complete. Sent to: ${subscribers.length}. Success: ${successCount}, Failed: ${failCount}`);
      })().catch(err => {
        console.error('[Bulk Email] Background broadcaster encountered an error:', err);
      });

      return sendJson(res, 202, { success: true, count: subscribers.length, message: `Broadcasting email to ${subscribers.length} active subscribers in the background.` });
    } catch (err) {
      console.error('Bulk email sending setup failed:', err);
      return sendJson(res, 500, { error: 'Internal Server Error' });
    }
  }

  // --- GET SA Subscribers ---
  if (pathname === '/api/admin/sa/subscribers' && method === 'GET') {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Unauthorized' });
    }
    try {
      if (pool) {
        const result = await pool.query('SELECT * FROM sa_subscribers ORDER BY created_at DESC');
        return sendJson(res, 200, result.rows);
      } else {
        let subscribers = [];
        if (fs.existsSync(SA_SUBSCRIBERS_FILE)) {
          subscribers = JSON.parse(fs.readFileSync(SA_SUBSCRIBERS_FILE, 'utf-8'));
        }
        return sendJson(res, 200, subscribers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (err) {
      console.error('Fetch SA subscribers error:', err);
      return sendJson(res, 500, { error: 'Internal Server Error' });
    }
    return;
  }

  // --- DELETE SA Subscriber ---
  if (pathname.startsWith('/api/admin/sa/subscribers/') && method === 'DELETE') {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Unauthorized' });
    }
    const id = pathname.split('/').pop();
    try {
      if (pool) {
        await pool.query('DELETE FROM sa_subscribers WHERE id = $1', [id]);
      } else {
        if (fs.existsSync(SA_SUBSCRIBERS_FILE)) {
          let subs = JSON.parse(fs.readFileSync(SA_SUBSCRIBERS_FILE, 'utf-8'));
          subs = subs.filter(s => s.id !== id);
          fs.writeFileSync(SA_SUBSCRIBERS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
        }
      }
      return sendJson(res, 200, { success: true, message: 'Subscriber deleted successfully' });
    } catch (err) {
      console.error('Delete SA subscriber error:', err);
      return sendJson(res, 500, { error: 'Internal Server Error' });
    }
  }

  // --- Send Bulk Email to SA Subscribers ---
  if (pathname === '/api/admin/sa/subscribers/email' && method === 'POST') {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Unauthorized' });
    }

    let body;
    try {
      body = await getJsonBody(req);
    } catch (e) {
      return sendJson(res, 400, { error: 'Invalid JSON body' });
    }

    const { subject, htmlBody, testEmail } = body;
    if (!subject || !htmlBody) {
      return sendJson(res, 400, { error: 'Subject and email body are required' });
    }

    try {
      let subscribers = [];
      if (testEmail) {
        subscribers = [{ name: 'Test SA Recipient', email: testEmail }];
      } else {
        if (pool) {
          const result = await pool.query('SELECT name, email FROM sa_subscribers WHERE is_active = true');
          subscribers = result.rows;
        } else {
          if (fs.existsSync(SA_SUBSCRIBERS_FILE)) {
            const allSubs = JSON.parse(fs.readFileSync(SA_SUBSCRIBERS_FILE, 'utf-8'));
            subscribers = allSubs.filter(s => s.is_active !== false);
          }
        }
      }

      if (subscribers.length === 0) {
        return sendJson(res, 200, { success: true, count: 0, message: 'No active South Africa subscribers found.' });
      }

      (async () => {
        let successCount = 0;
        let failCount = 0;
        for (const sub of subscribers) {
          const email = sub.email;
          const fullName = sub.name || email.split('@')[0];
          const nameParts = (sub.name || '').trim().split(/\s+/);
          const firstName = nameParts[0] || email.split('@')[0];
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

          const personalizedSubject = subject
            .replace(/\{\{name\}\}/gi, fullName)
            .replace(/\{\{firstName\}\}/gi, firstName)
            .replace(/\{\{lastName\}\}/gi, lastName);

          const personalizedBodyText = htmlBody
            .replace(/\{\{name\}\}/gi, fullName)
            .replace(/\{\{firstName\}\}/gi, firstName)
            .replace(/\{\{lastName\}\}/gi, lastName);

          const emailTemplateHtml = wrapInEmailTemplate(personalizedSubject, personalizedBodyText);
          const personalizedHtml = emailTemplateHtml.replace('{{RECIPIENT_EMAIL}}', encodeURIComponent(email) + '&segment=sa');

          const sent = await sendZeptoEmail(email, fullName, personalizedSubject, personalizedHtml);
          if (sent && sent.success) successCount++;
          else failCount++;
          
          await new Promise(r => setTimeout(r, 200));
        }
        console.log(`[SA Bulk Email] Broadcaster complete. Sent to: ${subscribers.length}. Success: ${successCount}, Failed: ${failCount}`);
      })().catch(err => {
        console.error('[SA Bulk Email] Background broadcaster encountered an error:', err);
      });

      return sendJson(res, 202, { success: true, count: subscribers.length, message: `Broadcasting email to ${subscribers.length} South Africa subscribers in the background.` });
    } catch (err) {
      console.error('SA Bulk email sending setup failed:', err);
      return sendJson(res, 500, { error: 'Internal Server Error' });
    }
  }

  // --- GET SD Subscribers ---
  if (pathname === '/api/admin/sd/subscribers' && method === 'GET') {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Unauthorized' });
    }
    try {
      if (pool) {
        const result = await pool.query('SELECT * FROM sd_subscribers ORDER BY created_at DESC');
        return sendJson(res, 200, result.rows);
      } else {
        let subscribers = [];
        if (fs.existsSync(SD_SUBSCRIBERS_FILE)) {
          subscribers = JSON.parse(fs.readFileSync(SD_SUBSCRIBERS_FILE, 'utf-8'));
        }
        return sendJson(res, 200, subscribers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (err) {
      console.error('Fetch SD subscribers error:', err);
      return sendJson(res, 500, { error: 'Internal Server Error' });
    }
    return;
  }

  // --- DELETE SD Subscriber ---
  if (pathname.startsWith('/api/admin/sd/subscribers/') && method === 'DELETE') {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Unauthorized' });
    }
    const id = pathname.split('/').pop();
    try {
      if (pool) {
        await pool.query('DELETE FROM sd_subscribers WHERE id = $1', [id]);
      } else {
        if (fs.existsSync(SD_SUBSCRIBERS_FILE)) {
          let subs = JSON.parse(fs.readFileSync(SD_SUBSCRIBERS_FILE, 'utf-8'));
          subs = subs.filter(s => s.id !== id);
          fs.writeFileSync(SD_SUBSCRIBERS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
        }
      }
      return sendJson(res, 200, { success: true, message: 'Subscriber deleted successfully' });
    } catch (err) {
      console.error('Delete SD subscriber error:', err);
      return sendJson(res, 500, { error: 'Internal Server Error' });
    }
  }

  // --- Send Bulk Email to SD Subscribers ---
  if (pathname === '/api/admin/sd/subscribers/email' && method === 'POST') {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Unauthorized' });
    }

    let body;
    try {
      body = await getJsonBody(req);
    } catch (e) {
      return sendJson(res, 400, { error: 'Invalid JSON body' });
    }

    const { subject, htmlBody, testEmail } = body;
    if (!subject || !htmlBody) {
      return sendJson(res, 400, { error: 'Subject and email body are required' });
    }

    try {
      let subscribers = [];
      if (testEmail) {
        subscribers = [{ name: 'Test SD Recipient', email: testEmail }];
      } else {
        if (pool) {
          const result = await pool.query('SELECT name, email FROM sd_subscribers WHERE is_active = true');
          subscribers = result.rows;
        } else {
          if (fs.existsSync(SD_SUBSCRIBERS_FILE)) {
            const allSubs = JSON.parse(fs.readFileSync(SD_SUBSCRIBERS_FILE, 'utf-8'));
            subscribers = allSubs.filter(s => s.is_active !== false);
          }
        }
      }

      if (subscribers.length === 0) {
        return sendJson(res, 200, { success: true, count: 0, message: 'No active Sons & Daughters subscribers found.' });
      }

      (async () => {
        let successCount = 0;
        let failCount = 0;
        for (const sub of subscribers) {
          const email = sub.email;
          const fullName = sub.name || email.split('@')[0];
          const nameParts = (sub.name || '').trim().split(/\s+/);
          const firstName = nameParts[0] || email.split('@')[0];
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

          const personalizedSubject = subject
            .replace(/\{\{name\}\}/gi, fullName)
            .replace(/\{\{firstName\}\}/gi, firstName)
            .replace(/\{\{lastName\}\}/gi, lastName);

          const personalizedBodyText = htmlBody
            .replace(/\{\{name\}\}/gi, fullName)
            .replace(/\{\{firstName\}\}/gi, firstName)
            .replace(/\{\{lastName\}\}/gi, lastName);

          const emailTemplateHtml = wrapInEmailTemplate(personalizedSubject, personalizedBodyText);
          const personalizedHtml = emailTemplateHtml.replace('{{RECIPIENT_EMAIL}}', encodeURIComponent(email) + '&segment=sd');

          const sent = await sendZeptoEmail(email, fullName, personalizedSubject, personalizedHtml);
          if (sent && sent.success) successCount++;
          else failCount++;
          
          await new Promise(r => setTimeout(r, 200));
        }
        console.log(`[SD Bulk Email] Broadcaster complete. Sent to: ${subscribers.length}. Success: ${successCount}, Failed: ${failCount}`);
      })().catch(err => {
        console.error('[SD Bulk Email] Background broadcaster encountered an error:', err);
      });

      return sendJson(res, 202, { success: true, count: subscribers.length, message: `Broadcasting email to ${subscribers.length} Sons & Daughters subscribers in the background.` });
    } catch (err) {
      console.error('SD Bulk email sending setup failed:', err);
      return sendJson(res, 500, { error: 'Internal Server Error' });
    }
  }

  // --- Unsubscribe ---
  if (pathname === '/api/unsubscribe' && method === 'GET') {
    const email = parsedUrl.searchParams.get('email');
    const segment = parsedUrl.searchParams.get('segment');
    if (!email) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      return res.end('<h1>Invalid Request</h1><p>Missing email parameter.</p>');
    }
    try {
      if (segment === 'sa') {
        if (pool) {
          await pool.query('UPDATE sa_subscribers SET is_active = false WHERE email = $1', [email]);
        } else {
          if (fs.existsSync(SA_SUBSCRIBERS_FILE)) {
            const subs = JSON.parse(fs.readFileSync(SA_SUBSCRIBERS_FILE, 'utf-8'));
            const idx = subs.findIndex(s => s.email.toLowerCase() === email.toLowerCase());
            if (idx !== -1) {
              subs[idx].is_active = false;
              fs.writeFileSync(SA_SUBSCRIBERS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
            }
          }
        }
      } else if (segment === 'sd') {
        if (pool) {
          await pool.query('UPDATE sd_subscribers SET is_active = false WHERE email = $1', [email]);
        } else {
          if (fs.existsSync(SD_SUBSCRIBERS_FILE)) {
            const subs = JSON.parse(fs.readFileSync(SD_SUBSCRIBERS_FILE, 'utf-8'));
            const idx = subs.findIndex(s => s.email.toLowerCase() === email.toLowerCase());
            if (idx !== -1) {
              subs[idx].is_active = false;
              fs.writeFileSync(SD_SUBSCRIBERS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
            }
          }
        }
      } else {
        if (pool) {
          await pool.query('UPDATE subscribers SET is_active = false WHERE email = $1', [email]);
        } else {
          if (fs.existsSync(SUBSCRIBERS_FILE)) {
            const subs = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8'));
            const idx = subs.findIndex(s => s.email.toLowerCase() === email.toLowerCase());
            if (idx !== -1) {
              subs[idx].is_active = false;
              fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
            }
          }
        }
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 50px 20px; background-color: #f8fafc; min-height: 100vh; box-sizing: border-box; display: flex; items-center: center; justify-content: center; align-items: center;">
          <div style="max-width: 480px; width: 100%; background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; text-align: center;">
            <div style="width: 56px; height: 56px; background-color: #f1f5f9; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </div>
            <h1 style="color: #0f172a; margin: 0 0 12px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Unsubscribed successfully</h1>
            <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">You have been unsubscribed from ${segment === 'sa' ? "Joshua's Generation South Africa updates" : "our mailing list"}. You will no longer receive updates, event reminders, or newsletters from us.</p>
            <a href="https://joshuasgeneration.com" style="display: inline-block; width: 100%; padding: 14px; background-color: #0f172a; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px; transition: background-color 0.2s;">Return to Home Page</a>
          </div>
        </div>
      `);
    } catch (err) {
      console.error('Unsubscribe error:', err);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      return res.end('<h1>Error</h1><p>An error occurred while unsubscribing.</p>');
    }
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
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      if (pool) {
        try {
          await pool.query(
            'INSERT INTO sessions (token, username, role, expires_at) VALUES ($1, $2, $3, $4)',
            [token, email, 'member', expiresAt]
          );
        } catch (dbErr) {
          console.error('Failed to save session to DB, using in-memory:', dbErr);
          sessions.set(token, { username: email, role: 'member', expiresAt });
        }
      } else {
        sessions.set(token, { username: email, role: 'member', expiresAt });
      }

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
        const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
        if (pool) {
          try {
            await pool.query(
              'INSERT INTO sessions (token, username, role, expires_at) VALUES ($1, $2, $3, $4)',
              [token, creds.username, role, expiresAt]
            );
          } catch (dbErr) {
            console.error('Failed to save login session to DB, using in-memory:', dbErr);
            sessions.set(token, { username: creds.username, role, expiresAt });
          }
        } else {
          sessions.set(token, { username: creds.username, role, expiresAt });
        }
        sendJson(res, 200, { success: true, token, role });
      } else {
        sendJson(res, 401, { error: 'Invalid email or password' });
      }
    } catch (e) {
      sendJson(res, 500, { error: 'Authentication failed' });
    }
    return;
  }

  // GET Sons & Daughters sermons (Public access by direct URL)
  if (pathname === '/api/sermons/sons-daughters' && method === 'GET') {
    try {
      if (pool) {
        try {
          const result = await pool.query("SELECT * FROM sermons WHERE audience = 'sons-daughters' ORDER BY date DESC, id DESC");
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
            audios: typeof row.audios === 'string' ? JSON.parse(row.audios) : (row.audios || []),
            audience: row.audience || 'sons-daughters'
          }));
          sendJson(res, 200, sermons);
          return;
        } catch (dbErr) {
          console.warn('Database SELECT failed for private sermons:', dbErr.message);
        }
      }
      if (fs.existsSync(SERMONS_FILE)) {
        const data = JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8'));
        const privateSermons = data.filter(s => s.audience === 'sons-daughters');
        sendJson(res, 200, privateSermons);
      } else {
        sendJson(res, 200, []);
      }
    } catch (e) {
      console.error('All private sermon retrieval sources failed:', e);
      sendJson(res, 500, { error: 'Failed to retrieve private sermons' });
    }
    return;
  }

  // GET Partners sermons (Public access by direct URL)
  if (pathname === '/api/sermons/partners' && method === 'GET') {
    try {
      if (pool) {
        try {
          const result = await pool.query("SELECT * FROM sermons WHERE audience = 'partners' ORDER BY date DESC, id DESC");
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
            audios: typeof row.audios === 'string' ? JSON.parse(row.audios) : (row.audios || []),
            audience: row.audience || 'partners'
          }));
          sendJson(res, 200, sermons);
          return;
        } catch (dbErr) {
          console.warn('Database SELECT failed for private sermons:', dbErr.message);
        }
      }
      if (fs.existsSync(SERMONS_FILE)) {
        const data = JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8'));
        const privateSermons = data.filter(s => s.audience === 'partners');
        sendJson(res, 200, privateSermons);
      } else {
        sendJson(res, 200, []);
      }
    } catch (e) {
      console.error('All private sermon retrieval sources failed:', e);
      sendJson(res, 500, { error: 'Failed to retrieve private sermons' });
    }
    return;
  }

  // GET Sermons
  if (pathname === '/api/sermons' && method === 'GET') {
    try {
      if (pool) {
        try {
          const result = await pool.query("SELECT * FROM sermons WHERE audience = 'public' OR audience IS NULL ORDER BY date DESC, id DESC");
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
            audios: typeof row.audios === 'string' ? JSON.parse(row.audios) : (row.audios || []),
            audience: row.audience || 'public'
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
        const publicSermons = data.filter(s => s.audience === 'public' || !s.audience);
        sendJson(res, 200, publicSermons);
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

  // POST Increment Book Views (Public)
  if (pathname.startsWith('/api/books/') && pathname.endsWith('/view') && method === 'POST') {
    try {
      const id = pathname.substring('/api/books/'.length, pathname.length - '/view'.length);
      let updatedViews = 0;
      if (pool) {
        const result = await pool.query('UPDATE books SET views = COALESCE(views, 0) + 1 WHERE id = $1 RETURNING views', [id]);
        if (result.rowCount > 0) {
          updatedViews = result.rows[0].views;
        }
      } else {
        const data = JSON.parse(fs.readFileSync(BOOKS_FILE, 'utf-8'));
        const index = data.findIndex(x => x.id === id);
        if (index !== -1) {
          data[index].views = (data[index].views || 0) + 1;
          updatedViews = data[index].views;
          fs.writeFileSync(BOOKS_FILE, JSON.stringify(data, null, 2), 'utf-8');
        }
      }
      sendJson(res, 200, { success: true, views: updatedViews });
    } catch (e) {
      console.error('Failed to increment book views:', e);
      sendJson(res, 500, { error: 'Failed to increment book views' });
    }
    return;
  }

  // POST Increment Blog Post Views (Public)
  if (pathname.startsWith('/api/blog/') && pathname.endsWith('/view') && method === 'POST') {
    try {
      const id = pathname.substring('/api/blog/'.length, pathname.length - '/view'.length);
      let updatedViews = 0;
      if (pool) {
        const result = await pool.query('UPDATE blog_posts SET views = COALESCE(views, 0) + 1 WHERE id = $1 RETURNING views', [id]);
        if (result.rowCount > 0) {
          updatedViews = result.rows[0].views;
        }
      } else {
        const data = JSON.parse(fs.readFileSync(BLOG_FILE, 'utf-8'));
        const index = data.findIndex(x => x.id === id);
        if (index !== -1) {
          data[index].views = (data[index].views || 0) + 1;
          updatedViews = data[index].views;
          fs.writeFileSync(BLOG_FILE, JSON.stringify(data, null, 2), 'utf-8');
        }
      }
      sendJson(res, 200, { success: true, views: updatedViews });
    } catch (e) {
      console.error('Failed to increment blog post views:', e);
      sendJson(res, 500, { error: 'Failed to increment blog post views' });
    }
    return;
  }

  // GET Comments for a specific item (Public)
  if (pathname.startsWith('/api/comments/') && method === 'GET') {
    try {
      const parts = pathname.split('/');
      if (parts.length >= 5) {
        const itemType = parts[3]; // 'sermon' | 'book' | 'blog'
        const itemId = parts[4];
        let comments = [];

        if (pool) {
          const result = await pool.query(
            'SELECT * FROM comments WHERE item_type = $1 AND item_id = $2 AND status = \'approved\' ORDER BY created_at DESC',
            [itemType, itemId]
          );
          comments = result.rows;
        } else {
          const data = JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf-8'));
          comments = data.filter(c => c.item_type === itemType && c.item_id === itemId && c.status === 'approved');
          comments.sort((a, b) => b.created_at.localeCompare(a.created_at));
        }

        sendJson(res, 200, comments);
      } else {
        sendJson(res, 400, { error: 'Invalid comments route parameters' });
      }
    } catch (e) {
      console.error('Failed to get comments:', e);
      sendJson(res, 500, { error: 'Failed to get comments' });
    }
    return;
  }

  // POST Comment (Public)
  if (pathname.startsWith('/api/comments/') && method === 'POST') {
    try {
      const parts = pathname.split('/');
      if (parts.length >= 5) {
        const itemType = parts[3]; // 'sermon' | 'book' | 'blog'
        const itemId = parts[4];
        const { name, text } = await getJsonBody(req);
        if (!name || !text) {
          sendJson(res, 400, { error: 'Name and comment text are required' });
          return;
        }

        let filterWordsStr = '';
        let blockLinksStr = 'true';
        if (pool) {
          const result = await pool.query('SELECT filter_words, block_links FROM settings WHERE id = 1');
          if (result.rowCount > 0) {
            filterWordsStr = result.rows[0].filter_words || '';
            blockLinksStr = result.rows[0].block_links || 'true';
          }
        } else {
          const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
          filterWordsStr = settings.filter_words || '';
          blockLinksStr = settings.block_links || 'true';
        }

        const filterWords = filterWordsStr.split(',')
          .map(w => w.trim().toLowerCase())
          .filter(Boolean);

        const linkPattern = /https?:\/\/|www\.|[a-z0-9]+\.(com|net|org|edu|gov|mil|biz|info|mobi|name|xyz|ly|gl|co|cc|tv|me)/i;
        const containsLink = linkPattern.test(text);
        const shouldBlockLinks = blockLinksStr === 'true';

        const textLower = text.toLowerCase();
        const containsBadWord = filterWords.some(word => textLower.includes(word));

        const status = ((containsLink && shouldBlockLinks) || containsBadWord) ? 'blocked' : 'approved';

        const newComment = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
          item_type: itemType,
          item_id: itemId,
          name: name.trim(),
          text: text.trim(),
          created_at: new Date().toISOString(),
          status: status
        };

        if (pool) {
          await pool.query(
            'INSERT INTO comments (id, item_type, item_id, name, text, created_at, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [newComment.id, newComment.item_type, newComment.item_id, newComment.name, newComment.text, newComment.created_at, newComment.status]
          );
        } else {
          const data = JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf-8'));
          data.unshift(newComment);
          fs.writeFileSync(COMMENTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
        }

        sendJson(res, 200, { success: true, comment: newComment });
      } else {
        sendJson(res, 400, { error: 'Invalid comments route parameters' });
      }
    } catch (e) {
      console.error('Failed to post comment:', e);
      sendJson(res, 500, { error: 'Failed to post comment' });
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

  // POST Verify Donation (Public callback endpoint)
  if (pathname === '/api/donations/verify' && method === 'POST') {
    try {
      const { tx_ref, transaction_id, status, backup } = await getJsonBody(req);
      
      console.log(`Verifying payment tx_ref: ${tx_ref}, transaction_id: ${transaction_id}, status: ${status}`);

      // Check if it already exists in the database
      if (pool) {
        const existRes = await pool.query('SELECT * FROM donations WHERE id = $1', [tx_ref || transaction_id]);
        if (existRes.rows.length > 0) {
          sendJson(res, 200, existRes.rows[0]);
          return;
        }
      } else {
        const donations = JSON.parse(fs.readFileSync(DONATIONS_FILE, 'utf-8'));
        const existing = donations.find(d => d.id === (tx_ref || transaction_id));
        if (existing) {
          sendJson(res, 200, existing);
          return;
        }
      }

      // 1. Try verifying with Flutterwave API if credentials exist
      let donation = null;
      let clientSecret = '';
      if (pool) {
        const result = await pool.query('SELECT flutterwave_prophetic_client_secret, flutterwave_mission_client_secret FROM settings WHERE id = 1');
        const row = result.rows[0] || {};
        // Use client secret depending on cause if backup is available, otherwise try prophetic then mission
        const isProphetic = backup?.purpose === 'Prophetic Offering' || backup?.purpose === 'Prophet Offering / Faith Seed';
        clientSecret = isProphetic 
          ? (row.flutterwave_prophetic_client_secret || row.flutterwave_mission_client_secret)
          : (row.flutterwave_mission_client_secret || row.flutterwave_prophetic_client_secret);
      } else {
        try {
          const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
          const isProphetic = backup?.purpose === 'Prophetic Offering' || backup?.purpose === 'Prophet Offering / Faith Seed';
          clientSecret = isProphetic 
            ? (data.flutterwave_prophetic_client_secret || data.flutterwave_mission_client_secret)
            : (data.flutterwave_mission_client_secret || data.flutterwave_prophetic_client_secret);
        } catch(e) {}
      }

      if (clientSecret && transaction_id && !transaction_id.toString().startsWith('mock')) {
        try {
          const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${clientSecret}`,
              'Content-Type': 'application/json'
            }
          });
          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            if (verifyData.status === 'success' && verifyData.data.status === 'successful') {
              const tx = verifyData.data;
              const desc = tx.narration || '';
              let purpose = 'Mission / Outreach';
              if (desc.includes('Prophetic') || desc.includes('Prophet') || backup?.purpose === 'Prophetic Offering' || backup?.purpose === 'Prophet Offering / Faith Seed') {
                purpose = 'Prophet Offering / Faith Seed';
              }
              
              donation = {
                id: tx.tx_ref || transaction_id.toString(),
                donor: tx.customer.name || backup?.donor || 'Generous Donor',
                email: tx.customer.email || backup?.email || 'donor@joshuagen.org',
                amount: Number(tx.amount),
                purpose: purpose,
                date: new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                method: tx.payment_type || 'Flutterwave',
                frequency: backup?.frequency || 'one-time',
                currency: tx.currency || backup?.currency || 'USD'
              };
            }
          }
        } catch (e) {
          console.error('Flutterwave transaction verification call failed:', e);
        }
      }

      // 2. Fallback to backup client-side details if verification failed or was a mock payment
      if (!donation && backup && status === 'successful') {
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        donation = {
          id: tx_ref || `JG-TXN-${randomNum}`,
          donor: backup.donor || 'Generous Donor',
          email: backup.email || 'donor@joshuagen.org',
          amount: Number(backup.amount) || 50.00,
          purpose: backup.purpose || 'Prophet Offering / Faith Seed',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          method: 'Flutterwave',
          frequency: backup.frequency || 'one-time',
          currency: backup.currency || 'USD'
        };
      }

      // If we still do not have a donation object, throw error
      if (!donation) {
        sendJson(res, 400, { error: 'Failed to verify transaction and no backup details provided' });
        return;
      }

      // 3. Save donation record to database
      if (pool) {
        await pool.query(
          `INSERT INTO donations (id, donor, email, amount, purpose, date, method, frequency, currency)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET donor = EXCLUDED.donor`,
          [donation.id, donation.donor, donation.email, donation.amount, donation.purpose, donation.date, donation.method, donation.frequency, donation.currency]
        );
      } else {
        const donations = JSON.parse(fs.readFileSync(DONATIONS_FILE, 'utf-8'));
        const idx = donations.findIndex(d => d.id === donation.id);
        if (idx >= 0) {
          donations[idx] = donation;
        } else {
          donations.unshift(donation);
        }
        fs.writeFileSync(DONATIONS_FILE, JSON.stringify(donations, null, 2), 'utf-8');
      }

      console.log(`Donation ${donation.id} successfully recorded in database!`);

      // 4. Send Heartfelt Thank You Email to Donor
      try {
        const currencySymbols = {
          NGN: '₦',
          USD: '$',
          GBP: '£',
          EUR: '€',
          CAD: 'C$',
          ZAR: 'R'
        };
        const symbol = currencySymbols[donation.currency] || '$';
        const formattedAmount = `${symbol}${donation.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const thankYouSubject = "Thank You for Your Generous Offering - Joshua Generation";
        const thankYouHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; bg-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; width: 50px; height: 50px; line-height: 50px; border-radius: 25px; background-color: #fef3c7; color: #d97706; font-size: 24px; font-weight: bold; text-align: center;">🙏</div>
            </div>
            <h2 style="color: #1f2937; text-align: center; font-size: 22px; font-weight: bold; margin-top: 0;">Offering Received</h2>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Dear ${donation.donor},</p>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">We have successfully received your generous offering of <strong>${formattedAmount} ${donation.currency}</strong> to <strong>Joshua Generation Ministry</strong>. Thank you for your obedience, love, and seed in supporting the propagation of the Gospel.</p>
            
            <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Receipt Details</h3>
              <table style="width: 100%; font-size: 13px; color: #4b5563; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; font-weight: 500;">Transaction ID:</td>
                  <td style="padding: 4px 0; text-align: right; color: #111827; font-family: monospace;">${donation.id}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: 500;">Date:</td>
                  <td style="padding: 4px 0; text-align: right; color: #111827;">${donation.date}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: 500;">Cause / Purpose:</td>
                  <td style="padding: 4px 0; text-align: right; color: #111827;">${donation.purpose}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: 500;">Method:</td>
                  <td style="padding: 4px 0; text-align: right; color: #111827;">${donation.method}</td>
                </tr>
              </table>
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
              console.log(`[Donation Verify Email] Successfully sent thank you to ${donation.email}`);
            } else {
              console.warn(`[Donation Verify Email] Failed to send thank you to ${donation.email}`);
            }
          })
          .catch(err => {
            console.error(`[Donation Verify Email] Error during email dispatch:`, err);
          });
      } catch (err) {
        console.error('Failed to generate verification thank you email:', err);
      }

      sendJson(res, 200, donation);
    } catch (e) {
      console.error('Verify donation error:', e);
      sendJson(res, 500, { error: 'Failed to verify donation' });
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
          views: row.views || 0,
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
          slug: row.slug,
          views: row.views || 0
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
        clientId = (cause === 'Prophetic Offering' || cause === 'Prophet Offering / Faith Seed') ? row.flutterwave_prophetic_client_id : row.flutterwave_mission_client_id;
        clientSecret = (cause === 'Prophetic Offering' || cause === 'Prophet Offering / Faith Seed') ? row.flutterwave_prophetic_client_secret : row.flutterwave_mission_client_secret;
      } else {
        const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
        clientId = (cause === 'Prophetic Offering' || cause === 'Prophet Offering / Faith Seed') ? data.flutterwave_prophetic_client_id : data.flutterwave_mission_client_id;
        clientSecret = (cause === 'Prophetic Offering' || cause === 'Prophet Offering / Faith Seed') ? data.flutterwave_prophetic_client_secret : data.flutterwave_mission_client_secret;
      }

      if (!clientId || !clientSecret) {
        sendJson(res, 503, { error: 'Payment gateway not configured. Please contact the administrator.' });
        return;
      }

      const txRef = 'JG-TXN-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
      const host = req.headers.host || 'joshuasgeneration.com';
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const callbackUrl = `${protocol}://${host}/donate`;

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

  // POST Increment Counter Page Views (Public)
  if (pathname === '/api/counter/increment' && method === 'POST') {
    try {
      let updatedViews = 0;
      if (pool) {
        const result = await pool.query('UPDATE settings SET counter_page_views = COALESCE(counter_page_views, 0) + 1 WHERE id = 1 RETURNING counter_page_views');
        updatedViews = result.rows[0]?.counter_page_views || 0;
      } else {
        const file = path.join(__dirname, 'counter_views.json');
        let count = 0;
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf-8');
          count = parseInt(content, 10) || 0;
        }
        count += 1;
        fs.writeFileSync(file, String(count), 'utf-8');
        updatedViews = count;
      }
      sendJson(res, 200, { success: true, views: updatedViews });
    } catch (e) {
      console.error('Failed to increment counter views:', e);
      sendJson(res, 500, { error: 'Failed to increment counter views' });
    }
    return;
  }

  // GET Counter stats (Public)
  if (pathname === '/api/counter/stats' && method === 'GET') {
    try {
      let pageViews = 0;
      let registeredUsers = 0;
      let sermonsCount = 0;
      let totalSermonViews = 0;

      if (pool) {
        const viewsRes = await pool.query('SELECT counter_page_views FROM settings WHERE id = 1');
        pageViews = viewsRes.rows[0]?.counter_page_views || 0;

        const usersRes = await pool.query('SELECT COUNT(*) FROM users');
        registeredUsers = parseInt(usersRes.rows[0].count, 10);

        const sermonsCountRes = await pool.query('SELECT COUNT(*) FROM sermons');
        sermonsCount = parseInt(sermonsCountRes.rows[0].count, 10);

        const sermonViewsRes = await pool.query('SELECT SUM(COALESCE(views, 0)) as total FROM sermons');
        totalSermonViews = parseInt(sermonViewsRes.rows[0].total || '0', 10);
      } else {
        const file = path.join(__dirname, 'counter_views.json');
        if (fs.existsSync(file)) {
          pageViews = parseInt(fs.readFileSync(file, 'utf-8'), 10) || 0;
        }
        if (fs.existsSync(USERS_FILE)) {
          registeredUsers = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')).length;
        }
        if (fs.existsSync(SERMONS_FILE)) {
          const sermons = JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8'));
          sermonsCount = sermons.length;
          totalSermonViews = sermons.reduce((sum, s) => sum + (s.views || 0), 0);
        }
      }

      sendJson(res, 200, {
        pageViews,
        registeredUsers,
        sermonsCount,
        totalSermonViews
      });
    } catch (e) {
      console.error('Failed to fetch counter stats:', e);
      sendJson(res, 500, { error: 'Failed to fetch counter stats' });
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

  // GET Testimonies (Public)
  if (pathname === '/api/testimonies' && method === 'GET') {
    try {
      if (pool) {
        const result = await pool.query('SELECT * FROM testimonies ORDER BY id DESC');
        const testimonies = result.rows.map(row => ({
          id: row.id,
          name: row.name,
          content: row.content,
          imageUrl: row.image_url,
          type: row.type || 'written',
          date: row.date
        }));
        sendJson(res, 200, testimonies);
      } else {
        if (fs.existsSync(TESTIMONIES_FILE)) {
          const data = JSON.parse(fs.readFileSync(TESTIMONIES_FILE, 'utf-8'));
          sendJson(res, 200, data);
        } else {
          sendJson(res, 200, defaultTestimonies);
        }
      }
    } catch (e) {
      console.error('Failed to retrieve testimonies:', e);
      sendJson(res, 500, { error: 'Failed to retrieve testimonies' });
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

  // --- REPLICATE IMAGE GENERATOR ---
  if (pathname === '/api/generate-image' && method === 'POST') {
    try {
      const authUser = await getAuthenticatedUser(req);
      if (!authUser) {
        sendJson(res, 401, { error: 'Unauthorized: Admin access required to generate AI images.' });
        return;
      }

      const { prompt, size = '1024x1024', n = 4, model = 'flux-schnell', aspect_ratio = '1:1', image, engine, bannerbear_template } = await getJsonBody(req);
      
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        sendJson(res, 400, { error: 'Prompt is required' });
        return;
      }


      const apiKey = process.env.REPLICATE_API_TOKEN;
      if (!apiKey) {
        sendJson(res, 400, { 
          error: 'Image engine service error: API credentials missing on server.' 
        });
        return;
      }

      let targetModelUrl = 'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions';
      let modelLabel = 'FLUX.1 Schnell';

      if (model === 'flux-dev') {
        targetModelUrl = 'https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions';
        modelLabel = 'FLUX.1 Dev Studio';
      } else if (model === 'realvis-xl') {
        targetModelUrl = 'https://api.replicate.com/v1/models/cjwbw/realvisxl-v4.0/predictions';
        modelLabel = 'RealVisXL 4.0';
      } else if (model === 'recraft-v3') {
        targetModelUrl = 'https://api.replicate.com/v1/models/recraft-ai/recraft-v3/predictions';
        modelLabel = 'Recraft V3';
      }

      const numImages = Math.min(Math.max(parseInt(n) || 4, 1), 4);

      // Helper function for a single prediction with 429 rate limit retry logic
      async function runSinglePrediction(index) {
        // Small initial staggered delay to prevent hitting concurrency burst limit
        if (index > 0) {
          await new Promise((resolve) => setTimeout(resolve, index * 600));
        }

        let payload = {
          input: {
            prompt: prompt.trim(),
            aspect_ratio: aspect_ratio || '1:1',
            output_format: 'webp',
            output_quality: 95,
            seed: Math.floor(Math.random() * 1000000) + (index * 137)
          }
        };

        if (image) {
          payload.input.image = image;
        }

        let prediction = null;
        let startAttempts = 0;
        const maxStartAttempts = 4;

        while (startAttempts < maxStartAttempts) {
          startAttempts++;
          let response = await fetch(targetModelUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'wait=30'
            },
            body: JSON.stringify(payload)
          });

          prediction = await response.json();

          if (response.status === 429) {
            // Rate limited: wait 1.8 seconds and retry
            await new Promise((resolve) => setTimeout(resolve, 1800));
            continue;
          }

          if (!response.ok) {
            throw new Error(prediction.detail || prediction.error || `Replicate API error: ${response.status}`);
          }

          break; // Successfully created prediction!
        }

        if (!prediction || (prediction.status !== 'starting' && prediction.status !== 'processing' && prediction.status !== 'succeeded')) {
          throw new Error(prediction?.error || 'Failed to start prediction on Replicate');
        }

        let attempts = 0;
        const maxAttempts = 35;
        while (
          (prediction.status === 'starting' || prediction.status === 'processing') &&
          attempts < maxAttempts
        ) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          attempts++;
          if (prediction.urls && prediction.urls.get) {
            const pollRes = await fetch(prediction.urls.get, {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            });
            if (pollRes.ok) {
              prediction = await pollRes.json();
            }
          }
        }

        if (prediction.status === 'succeeded') {
          return Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
        } else {
          throw new Error(prediction.error || `Prediction failed with status ${prediction.status}`);
        }
      }

      // Execute predictions with retry handling for 4 images
      const results = await Promise.allSettled(
        Array.from({ length: numImages }).map((_, idx) => runSinglePrediction(idx))
      );

      const successfulUrls = results
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value);

      if (successfulUrls.length === 0) {
        const firstError = results.find(r => r.status === 'rejected')?.reason?.message || 'Failed to generate images';
        sendJson(res, 500, { error: firstError });
        return;
      }

      sendJson(res, 200, {
        success: true,
        output: successfulUrls,
        model: model,
        modelLabel: modelLabel,
        prompt: prompt.trim()
      });
      return;

    } catch (err) {
      console.error('Image generator route error:', err);
      sendJson(res, 500, { error: err.message || 'Internal server error' });
    }
  }

  // GET Public Settings (Unauthenticated)
  if (pathname === '/api/settings/public' && method === 'GET') {
    try {
      const defaults = {
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
        homeBibleReference: 'Joshua 1:9',
        adsense_auto_code: '',
        adsense_above_blog_code: '',
        adsense_center_blog_code: '',
        adsense_beneath_blog_code: '',
        filter_words: '',
        block_links: 'true',
        privacyPolicy: DEFAULT_PRIVACY_POLICY,
        termsOfService: DEFAULT_TERMS_OF_SERVICE
      };

      if (pool) {
        const { rows } = await pool.query('SELECT "contactEmail", "contactPhone", "contactAddress", "socialFacebook", "socialTwitter", "socialInstagram", "socialYoutube", "homeHeadlinePrefix", "homeHeadlineHighlight", "homeHeadlineSuffix", "homeSubheading", "homeBibleVerse", "homeBibleReference", "adsense_auto_code", "adsense_above_blog_code", "adsense_center_blog_code", "adsense_beneath_blog_code", "filter_words", "block_links", "privacyPolicy", "termsOfService" FROM settings WHERE id = 1');
        const row = rows[0] || {};
        const responseData = {};
        for (const key in defaults) {
          responseData[key] = row[key] || defaults[key];
        }
        sendJson(res, 200, responseData);
      } else {
        const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
        const responseData = {};
        for (const key in defaults) {
          responseData[key] = data[key] || defaults[key];
        }
        sendJson(res, 200, responseData);
      }
    } catch (e) {
      console.error('Failed to retrieve public settings:', e);
      sendJson(res, 500, { error: 'Failed to retrieve public settings' });
    }
    return;
  }

  // --- CUSTOM FORMS API ENDPOINTS ---

  // GET /api/forms/export/:id (Download CSV)
  if (pathname.startsWith('/api/forms/export/') && method === 'GET') {
    try {
      const auth = await getAuthenticatedUser(req);
      if (!auth) {
        sendJson(res, 401, { error: 'Admin access required' });
        return;
      }
      const formId = pathname.split('/').pop();
      if (!pool) {
        sendJson(res, 400, { error: 'Database inactive' });
        return;
      }

      const formRes = await pool.query('SELECT * FROM custom_forms WHERE id = $1', [formId]);
      if (formRes.rowCount === 0) {
        sendJson(res, 404, { error: 'Form not found' });
        return;
      }
      const form = formRes.rows[0];
      const fields = typeof form.fields === 'string' ? JSON.parse(form.fields) : (form.fields || []);

      const subRes = await pool.query('SELECT * FROM form_submissions WHERE form_id = $1 ORDER BY created_at DESC', [formId]);
      const submissions = subRes.rows;

      // Build CSV
      const headers = ['Submission ID', 'Submitted At', ...fields.map(f => `"${(f.label || f.id).replace(/"/g, '""')}"`)];
      let csv = headers.join(',') + '\n';

      for (const sub of submissions) {
        const answers = typeof sub.answers === 'string' ? JSON.parse(sub.answers) : (sub.answers || {});
        const dateStr = sub.created_at ? new Date(sub.created_at).toISOString() : '';
        const row = [
          `"${sub.id}"`,
          `"${dateStr}"`,
          ...fields.map(f => {
            let val = answers[f.id] || answers[f.label] || '';
            if (Array.isArray(val)) val = val.join('; ');
            return `"${String(val).replace(/"/g, '""')}"`;
          })
        ];
        csv += row.join(',') + '\n';
      }

      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${form.slug}-responses.csv"`
      });
      res.end(csv);
      return;
    } catch (e) {
      console.error('Failed to export form submissions:', e);
      sendJson(res, 500, { error: 'Failed to export CSV' });
      return;
    }
  }

  // DELETE /api/forms/submissions/:submissionId
  if (pathname.startsWith('/api/forms/submissions/') && method === 'DELETE') {
    try {
      const auth = await getAuthenticatedUser(req);
      if (!auth) {
        sendJson(res, 401, { error: 'Admin access required' });
        return;
      }
      const subId = pathname.split('/').pop();
      if (pool) {
        await pool.query('DELETE FROM form_submissions WHERE id = $1', [subId]);
        sendJson(res, 200, { success: true });
      } else {
        sendJson(res, 400, { error: 'Database inactive' });
      }
    } catch (e) {
      console.error('Failed to delete submission:', e);
      sendJson(res, 500, { error: 'Failed to delete submission' });
    }
    return;
  }

  // GET /api/forms/:id/submissions
  if (pathname.match(/^\/api\/forms\/([^\/]+)\/submissions$/) && method === 'GET') {
    try {
      const auth = await getAuthenticatedUser(req);
      if (!auth) {
        sendJson(res, 401, { error: 'Admin access required' });
        return;
      }
      const formId = pathname.split('/')[3];
      if (pool) {
        const { rows } = await pool.query('SELECT * FROM form_submissions WHERE form_id = $1 ORDER BY created_at DESC', [formId]);
        sendJson(res, 200, { submissions: rows });
      } else {
        sendJson(res, 400, { error: 'Database inactive' });
      }
    } catch (e) {
      console.error('Failed to fetch submissions:', e);
      sendJson(res, 500, { error: 'Failed to fetch submissions' });
    }
    return;
  }

  // POST /api/forms/:id/submit
  if (pathname.match(/^\/api\/forms\/([^\/]+)\/submit$/) && method === 'POST') {
    try {
      const formId = pathname.split('/')[3];
      const data = await getJsonBody(req);
      if (!pool) {
        sendJson(res, 400, { error: 'Database inactive' });
        return;
      }

      const formRes = await pool.query('SELECT * FROM custom_forms WHERE id = $1 OR slug = $1', [formId]);
      if (formRes.rowCount === 0) {
        sendJson(res, 404, { error: 'Form not found' });
        return;
      }
      const form = formRes.rows[0];

      const subId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      await pool.query(
        `INSERT INTO form_submissions (id, form_id, form_slug, answers, submitter_ip, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [subId, form.id, form.slug, JSON.stringify(data.answers || {}), ip, userAgent]
      );

      sendJson(res, 200, {
        success: true,
        submissionId: subId,
        enableRedirect: form.enable_redirect,
        redirectButtonLabel: form.redirect_button_label || 'CLICK HERE TO COMPLETE REGISTRATION',
        redirectUrl: form.redirect_url || '',
        successMessage: form.success_message || 'Thank you for filling out this form!'
      });
    } catch (e) {
      console.error('Failed to submit form:', e);
      sendJson(res, 500, { error: e.message || 'Failed to submit form' });
    }
    return;
  }

  // GET /api/forms (List forms)
  if (pathname === '/api/forms' && method === 'GET') {
    try {
      const auth = await getAuthenticatedUser(req);
      if (pool) {
        let query = 'SELECT f.*, (SELECT COUNT(*)::int FROM form_submissions s WHERE s.form_id = f.id) as response_count FROM custom_forms f ORDER BY f.created_at DESC';
        if (!auth) {
          query = 'SELECT f.*, (SELECT COUNT(*)::int FROM form_submissions s WHERE s.form_id = f.id) as response_count FROM custom_forms f WHERE f.is_active = true ORDER BY f.created_at DESC';
        }
        const { rows } = await pool.query(query);
        sendJson(res, 200, { forms: rows });
      } else {
        sendJson(res, 200, { forms: [] });
      }
    } catch (e) {
      console.error('Failed to fetch forms:', e);
      sendJson(res, 500, { error: 'Failed to fetch forms' });
    }
    return;
  }

  // GET /api/forms/:slugOrId
  if (pathname.startsWith('/api/forms/') && method === 'GET' && !pathname.includes('/submissions') && !pathname.includes('/export') && !pathname.includes('/submit')) {
    try {
      const slugOrId = pathname.split('/')[3];
      if (pool && slugOrId) {
        const { rows } = await pool.query('SELECT * FROM custom_forms WHERE slug = $1 OR id = $1', [slugOrId]);
        if (rows.length === 0) {
          sendJson(res, 404, { error: 'Form not found' });
          return;
        }
        sendJson(res, 200, { form: rows[0] });
      } else {
        sendJson(res, 404, { error: 'Form not found' });
      }
    } catch (e) {
      console.error('Failed to fetch form:', e);
      sendJson(res, 500, { error: 'Failed to fetch form' });
    }
    return;
  }

  // POST /api/forms (Create form)
  if (pathname === '/api/forms' && method === 'POST') {
    try {
      const auth = await getAuthenticatedUser(req);
      if (!auth) {
        sendJson(res, 401, { error: 'Admin access required' });
        return;
      }
      const data = await getJsonBody(req);
      if (!data.title) {
        sendJson(res, 400, { error: 'Form title is required' });
        return;
      }

      const formId = `form_${Date.now()}`;
      let slug = (data.slug || data.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (!slug) slug = `form-${Date.now()}`;

      if (pool) {
        // Ensure slug unique
        const slugCheck = await pool.query('SELECT 1 FROM custom_forms WHERE slug = $1', [slug]);
        if (slugCheck.rows.length > 0) {
          slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }

        const resInsert = await pool.query(
          `INSERT INTO custom_forms (
            id, slug, title, description, fields, is_active, enable_redirect,
            redirect_button_label, redirect_url, success_message, banner_image_url,
            featured_image, banner_position
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
          [
            formId,
            slug,
            data.title,
            data.description || '',
            JSON.stringify(data.fields || []),
            data.is_active !== undefined ? data.is_active : true,
            data.enable_redirect || false,
            data.redirect_button_label || 'CLICK HERE TO COMPLETE REGISTRATION',
            data.redirect_url || '',
            data.success_message || 'Thank you for filling out this form! Your details have been successfully recorded.',
            data.banner_image_url || data.bannerUrl || '',
            data.featured_image || data.featured_image_url || data.featuredImageUrl || '',
            data.banner_position || data.bannerPosition || 'center center'
          ]
        );
        sendJson(res, 201, { success: true, form: resInsert.rows[0] });
      } else {
        sendJson(res, 400, { error: 'Database inactive' });
      }
    } catch (e) {
      console.error('Failed to create form:', e);
      sendJson(res, 500, { error: e.message || 'Failed to create form' });
    }
    return;
  }

  // PUT /api/forms/:id (Update form)
  if (pathname.startsWith('/api/forms/') && method === 'PUT') {
    try {
      const auth = await getAuthenticatedUser(req);
      if (!auth) {
        sendJson(res, 401, { error: 'Admin access required' });
        return;
      }
      const formId = pathname.split('/')[3];
      const data = await getJsonBody(req);

      if (pool && formId) {
        let slug = (data.slug || data.title || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        if (slug) {
          const checkSlug = await pool.query('SELECT 1 FROM custom_forms WHERE slug = $1 AND id != $2', [slug, formId]);
          if (checkSlug.rows.length > 0) {
            slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
          }
        }

        const resUpdate = await pool.query(
          `UPDATE custom_forms SET
            title = COALESCE($1, title),
            slug = COALESCE(NULLIF($2, ''), slug),
            description = COALESCE($3, description),
            fields = COALESCE($4, fields),
            is_active = COALESCE($5, is_active),
            enable_redirect = COALESCE($6, enable_redirect),
            redirect_button_label = COALESCE($7, redirect_button_label),
            redirect_url = COALESCE($8, redirect_url),
            success_message = COALESCE($9, success_message),
            banner_image_url = COALESCE($10, banner_image_url),
            featured_image = COALESCE($11, featured_image),
            banner_position = COALESCE($12, banner_position),
            updated_at = NOW()
          WHERE id = $13
          RETURNING *`,
          [
            data.title,
            slug,
            data.description,
            data.fields ? JSON.stringify(data.fields) : null,
            data.is_active,
            data.enable_redirect,
            data.redirect_button_label,
            data.redirect_url,
            data.success_message,
            data.banner_image_url || data.bannerUrl,
            data.featured_image || data.featured_image_url || data.featuredImageUrl,
            data.banner_position || data.bannerPosition,
            formId
          ]
        );
        sendJson(res, 200, { success: true, form: resUpdate.rows[0] });
      } else {
        sendJson(res, 400, { error: 'Database inactive' });
      }
    } catch (e) {
      console.error('Failed to update form:', e);
      sendJson(res, 500, { error: e.message || 'Failed to update form' });
    }
    return;
  }

  // DELETE /api/forms/:id (Delete form and responses)
  if (pathname.startsWith('/api/forms/') && method === 'DELETE' && !pathname.includes('/submissions')) {
    try {
      const auth = await getAuthenticatedUser(req);
      if (!auth) {
        sendJson(res, 401, { error: 'Admin access required' });
        return;
      }
      const formId = pathname.split('/')[3];
      if (pool && formId) {
        await pool.query('DELETE FROM form_submissions WHERE form_id = $1', [formId]);
        await pool.query('DELETE FROM custom_forms WHERE id = $1', [formId]);
        sendJson(res, 200, { success: true });
      } else {
        sendJson(res, 400, { error: 'Database inactive' });
      }
    } catch (e) {
      console.error('Failed to delete form:', e);
      sendJson(res, 500, { error: 'Failed to delete form' });
    }
    return;
  }

  // --- SECURE ADMIN ROUTES (Requires authorization header) ---
  const user = await getAuthenticatedUser(req);
  if (!user) {
    sendJson(res, 401, { error: 'Unauthorized admin access' });
    return;
  }

  // GET All Sermons for Admin (includes private ones)
  if (pathname === '/api/admin/sermons' && method === 'GET') {
    try {
      if (pool) {
        const result = await pool.query('SELECT * FROM sermons ORDER BY date DESC, id DESC');
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
          audios: typeof row.audios === 'string' ? JSON.parse(row.audios) : (row.audios || []),
          audience: row.audience || 'public'
        }));
        sendJson(res, 200, sermons);
      } else {
        if (fs.existsSync(SERMONS_FILE)) {
          const data = JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8'));
          sendJson(res, 200, data);
        } else {
          sendJson(res, 200, []);
        }
      }
    } catch (e) {
      console.error('Failed to retrieve admin sermons:', e);
      sendJson(res, 500, { error: 'Failed to retrieve sermons' });
    }
    return;
  }

  if (pathname === '/api/admin/settings' && method === 'GET') {
    if (user.role !== 'superadmin') {
      sendJson(res, 403, { error: 'Superadmin access required' });
      return;
    }
    try {
      if (pool) {
        const result = await pool.query('SELECT flutterwave_prophetic_client_id, flutterwave_prophetic_client_secret, flutterwave_mission_client_id, flutterwave_mission_client_secret, "contactEmail", "contactPhone", "contactAddress", "socialFacebook", "socialTwitter", "socialInstagram", "socialYoutube", "homeHeadlinePrefix", "homeHeadlineHighlight", "homeHeadlineSuffix", "homeSubheading", "homeBibleVerse", "homeBibleReference", "adsense_auto_code", "adsense_above_blog_code", "adsense_center_blog_code", "adsense_beneath_blog_code", "filter_words", "block_links", "privacyPolicy", "termsOfService" FROM settings WHERE id = 1');
        const row = result.rows[0] || {};
        const responseData = {
          flutterwave_prophetic_client_id: '', flutterwave_prophetic_client_secret: '',
          flutterwave_mission_client_id: '', flutterwave_mission_client_secret: '',
          adsense_auto_code: '', adsense_above_blog_code: '', adsense_center_blog_code: '', adsense_beneath_blog_code: '',
          filter_words: '', block_links: 'true', ...row
        };
        if (!responseData.privacyPolicy) responseData.privacyPolicy = DEFAULT_PRIVACY_POLICY;
        if (!responseData.termsOfService) responseData.termsOfService = DEFAULT_TERMS_OF_SERVICE;
        sendJson(res, 200, responseData);
      } else {
        const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
        if (!data.privacyPolicy) data.privacyPolicy = DEFAULT_PRIVACY_POLICY;
        if (!data.termsOfService) data.termsOfService = DEFAULT_TERMS_OF_SERVICE;
        sendJson(res, 200, data);
      }
    } catch (e) {
      console.error('Failed to retrieve admin settings:', e);
      sendJson(res, 500, { error: 'Failed to retrieve admin settings' });
    }
    return;
  }

  if (pathname === '/api/admin/settings' && method === 'POST') {
    if (user.role !== 'superadmin') {
      sendJson(res, 403, { error: 'Superadmin access required' });
      return;
    }
    try {
      const data = await getJsonBody(req);
      if (pool) {
        const currentRes = await pool.query('SELECT * FROM settings WHERE id = 1');
        const current = currentRes.rows[0] || {};
        
        const prophetic_id = data.flutterwave_prophetic_client_id || current.flutterwave_prophetic_client_id || 'FLWPUBK-e83f5b22f448ff39c1f157b929adadc9-X';
        const prophetic_secret = data.flutterwave_prophetic_client_secret || current.flutterwave_prophetic_client_secret || 'FLWSECK-8062008c8cdda5846480c599b94c9b80-19fc7c47ad9vt-X';
        const mission_id = data.flutterwave_mission_client_id || current.flutterwave_mission_client_id || 'FLWPUBK-4d5fe16c0831195900d5e49808253e0f-X';
        const mission_secret = data.flutterwave_mission_client_secret || current.flutterwave_mission_client_secret || 'FLWSECK-5df1ed2b34c0770e965289c196aa770a-19fc7c2e858vt-X';

        await pool.query(
          `UPDATE settings SET 
            flutterwave_prophetic_client_id = $1, 
            flutterwave_prophetic_client_secret = $2,
            flutterwave_mission_client_id = $3, 
            flutterwave_mission_client_secret = $4,
            "contactEmail" = $5,
            "contactPhone" = $6,
            "contactAddress" = $7,
            "socialFacebook" = $8,
            "socialTwitter" = $9,
            "socialInstagram" = $10,
            "socialYoutube" = $11,
            "homeHeadlinePrefix" = $12,
            "homeHeadlineHighlight" = $13,
            "homeHeadlineSuffix" = $14,
            "homeSubheading" = $15,
            "homeBibleVerse" = $16,
            "homeBibleReference" = $17,
            "adsense_auto_code" = $18,
            "adsense_above_blog_code" = $19,
            "adsense_center_blog_code" = $20,
            "adsense_beneath_blog_code" = $21,
            "filter_words" = $22,
            "block_links" = $23,
            "privacyPolicy" = $24,
            "termsOfService" = $25
           WHERE id = 1`,
          [
            prophetic_id,
            prophetic_secret,
            mission_id,
            mission_secret,
            data.contactEmail || '',
            data.contactPhone || '',
            data.contactAddress || '',
            data.socialFacebook || '',
            data.socialTwitter || '',
            data.socialInstagram || '',
            data.socialYoutube || '',
            data.homeHeadlinePrefix || '',
            data.homeHeadlineHighlight || '',
            data.homeHeadlineSuffix || '',
            data.homeSubheading || '',
            data.homeBibleVerse || '',
            data.homeBibleReference || '',
            data.adsense_auto_code || '',
            data.adsense_above_blog_code || '',
            data.adsense_center_blog_code || '',
            data.adsense_beneath_blog_code || '',
            data.filter_words || '',
            data.block_links || 'true',
            data.privacyPolicy || '',
            data.termsOfService || ''
          ]
        );
      } else {
        let existing = {};
        if (fs.existsSync(SETTINGS_FILE)) {
          try { existing = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')); } catch (e) {}
        }
        const mergedData = {
          ...data,
          flutterwave_prophetic_client_id: data.flutterwave_prophetic_client_id || existing.flutterwave_prophetic_client_id || 'FLWPUBK-e83f5b22f448ff39c1f157b929adadc9-X',
          flutterwave_prophetic_client_secret: data.flutterwave_prophetic_client_secret || existing.flutterwave_prophetic_client_secret || 'FLWSECK-8062008c8cdda5846480c599b94c9b80-19fc7c47ad9vt-X',
          flutterwave_mission_client_id: data.flutterwave_mission_client_id || existing.flutterwave_mission_client_id || 'FLWPUBK-4d5fe16c0831195900d5e49808253e0f-X',
          flutterwave_mission_client_secret: data.flutterwave_mission_client_secret || existing.flutterwave_mission_client_secret || 'FLWSECK-5df1ed2b34c0770e965289c196aa770a-19fc7c2e858vt-X'
        };
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(mergedData, null, 2), 'utf-8');
      }

      // Sync adsense_auto_code into dist/index.html static file on disk so Google AdSense crawler detects it
      if (data.adsense_auto_code) {
        try {
          const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');
          if (fs.existsSync(distIndexPath)) {
            let html = fs.readFileSync(distIndexPath, 'utf-8');
            if (!html.includes(data.adsense_auto_code)) {
              // Inject before </head>
              html = html.replace('</head>', `${data.adsense_auto_code}\n</head>`);
              fs.writeFileSync(distIndexPath, html, 'utf-8');
              console.log('Synced AdSense code directly into dist/index.html');
            }
          }
        } catch (err) {
          console.error('Error syncing AdSense code to dist/index.html:', err);
        }
      }

      sendJson(res, 200, { success: true });
    } catch (e) {
      console.error('Failed to save settings:', e);
      sendJson(res, 500, { error: 'Failed to save settings' });
    }
    return;
  }

  // Backup Export Endpoint
  if (pathname === '/api/admin/backup/export' && method === 'GET') {
    try {
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        site: 'Joshua Generation Ministry',
        data: {}
      };

      if (pool) {
        const [s, serm, b, p, ev, test, sub, saSub, sdSub, forms, links] = await Promise.all([
          pool.query('SELECT * FROM settings WHERE id = 1'),
          pool.query('SELECT * FROM sermons'),
          pool.query('SELECT * FROM books'),
          pool.query('SELECT * FROM blog_posts'),
          pool.query('SELECT * FROM events'),
          pool.query('SELECT * FROM testimonies'),
          pool.query('SELECT * FROM subscribers'),
          pool.query('SELECT * FROM sa_subscribers'),
          pool.query('SELECT * FROM sd_subscribers'),
          pool.query('SELECT * FROM custom_forms'),
          pool.query('SELECT * FROM redirect_links')
        ]);

        backupData.data.settings = s.rows[0] || {};
        backupData.data.sermons = serm.rows || [];
        backupData.data.books = b.rows || [];
        backupData.data.blog_posts = p.rows || [];
        backupData.data.events = ev.rows || [];
        backupData.data.testimonies = test.rows || [];
        backupData.data.subscribers = sub.rows || [];
        backupData.data.sa_subscribers = saSub.rows || [];
        backupData.data.sd_subscribers = sdSub.rows || [];
        backupData.data.custom_forms = forms.rows || [];
        backupData.data.redirect_links = links.rows || [];
      } else {
        backupData.data.settings = fs.existsSync(SETTINGS_FILE) ? JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) : {};
        backupData.data.sermons = fs.existsSync(SERMONS_FILE) ? JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8')) : [];
        backupData.data.books = fs.existsSync(BOOKS_FILE) ? JSON.parse(fs.readFileSync(BOOKS_FILE, 'utf-8')) : [];
        backupData.data.blog_posts = fs.existsSync(BLOG_FILE) ? JSON.parse(fs.readFileSync(BLOG_FILE, 'utf-8')) : [];
        backupData.data.events = fs.existsSync(EVENTS_FILE) ? JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8')) : [];
        backupData.data.testimonies = fs.existsSync(TESTIMONIES_FILE) ? JSON.parse(fs.readFileSync(TESTIMONIES_FILE, 'utf-8')) : [];
        backupData.data.subscribers = fs.existsSync(SUBSCRIBERS_FILE) ? JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8')) : [];
        backupData.data.sa_subscribers = fs.existsSync(SA_SUBSCRIBERS_FILE) ? JSON.parse(fs.readFileSync(SA_SUBSCRIBERS_FILE, 'utf-8')) : [];
        backupData.data.sd_subscribers = fs.existsSync(SD_SUBSCRIBERS_FILE) ? JSON.parse(fs.readFileSync(SD_SUBSCRIBERS_FILE, 'utf-8')) : [];
      }

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="jg_site_backup_${new Date().toISOString().slice(0, 10)}.json"`
      });
      res.end(JSON.stringify(backupData, null, 2));
      return;
    } catch (err) {
      console.error('Backup export error:', err);
      return sendJson(res, 500, { error: 'Failed to generate site backup' });
    }
  }

  // Backup Restore Endpoint
  if (pathname === '/api/admin/backup/restore' && method === 'POST') {
    try {
      const payload = await getJsonBody(req);
      if (!payload || (!payload.data && !payload.sermons)) {
        return sendJson(res, 400, { error: 'Invalid backup format. Missing data object.' });
      }

      const data = payload.data || payload;
      const restoredCounts = {
        events: 0,
        books: 0,
        sermons: 0,
        blog_posts: 0,
        subscribers: 0,
        sa_subscribers: 0,
        sd_subscribers: 0,
        custom_forms: 0
      };

      if (pool) {
        if (data.settings && typeof data.settings === 'object') {
          const s = { ...data.settings };
          delete s.id;
          const keys = Object.keys(s).filter(k => typeof s[k] !== 'function');
          if (keys.length > 0) {
            const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
            const values = keys.map(k => s[k] !== undefined && s[k] !== null ? s[k] : '');
            await pool.query(`UPDATE settings SET ${setClause} WHERE id = 1`, values);
          }
        }

        if (Array.isArray(data.events)) {
          for (const ev of data.events) {
            await pool.query(
              `INSERT INTO events (id, title, date, time, location, description, image_url, registration_url, registrations)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT (id) DO UPDATE SET
               title=EXCLUDED.title, date=EXCLUDED.date, time=EXCLUDED.time, location=EXCLUDED.location,
               description=EXCLUDED.description, image_url=EXCLUDED.image_url, registration_url=EXCLUDED.registration_url, registrations=EXCLUDED.registrations`,
              [ev.id, ev.title, ev.date, ev.time || '', ev.location || '', ev.description || '', ev.image_url || ev.imageUrl || '', ev.registration_url || ev.registrationUrl || '', ev.registrations || 0]
            );
          }
          restoredCounts.events = data.events.length;
        }

        if (Array.isArray(data.books)) {
          for (const b of data.books) {
            await pool.query(
              `INSERT INTO books (id, title, author, cover_url, description, category, download_url, pdfs, chapters, views, rating, amazon_url, selar_url)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
               ON CONFLICT (id) DO UPDATE SET
               title=EXCLUDED.title, author=EXCLUDED.author, cover_url=EXCLUDED.cover_url, description=EXCLUDED.description,
               category=EXCLUDED.category, download_url=EXCLUDED.download_url, pdfs=EXCLUDED.pdfs, chapters=EXCLUDED.chapters,
               views=EXCLUDED.views, rating=EXCLUDED.rating, amazon_url=EXCLUDED.amazon_url, selar_url=EXCLUDED.selar_url`,
              [
                b.id, b.title, b.author, b.cover_url || b.coverUrl || '', b.description, b.category,
                b.download_url || b.downloadUrl || '', JSON.stringify(b.pdfs || []), JSON.stringify(b.chapters || []),
                b.views || 0, b.rating || 4.8, b.amazon_url || b.amazonUrl || '', b.selar_url || b.selarUrl || ''
              ]
            );
          }
          restoredCounts.books = data.books.length;
        }

        if (Array.isArray(data.sermons)) {
          for (const s of data.sermons) {
            await pool.query(
              `INSERT INTO sermons (id, title, speaker, date, duration, description, category, thumbnail, audio_url, video_url, views, audience, series_audios)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
               ON CONFLICT (id) DO UPDATE SET
               title=EXCLUDED.title, speaker=EXCLUDED.speaker, date=EXCLUDED.date, duration=EXCLUDED.duration,
               description=EXCLUDED.description, category=EXCLUDED.category, thumbnail=EXCLUDED.thumbnail,
               audio_url=EXCLUDED.audio_url, video_url=EXCLUDED.video_url, views=EXCLUDED.views, audience=EXCLUDED.audience, series_audios=EXCLUDED.series_audios`,
              [
                s.id, s.title, s.speaker, s.date, s.duration, s.description, s.category,
                s.thumbnail, s.audio_url || s.audioUrl || '', s.video_url || s.videoUrl || '',
                s.views || 0, s.audience || 'public', JSON.stringify(s.series_audios || s.seriesAudios || [])
              ]
            );
          }
          restoredCounts.sermons = data.sermons.length;
        }

        if (Array.isArray(data.blog_posts)) {
          for (const p of data.blog_posts) {
            await pool.query(
              `INSERT INTO blog_posts (id, title, author, date, read_time, category, excerpt, content, image_url, views, audio_url, featured)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
               ON CONFLICT (id) DO UPDATE SET
               title=EXCLUDED.title, author=EXCLUDED.author, date=EXCLUDED.date, read_time=EXCLUDED.read_time,
               category=EXCLUDED.category, excerpt=EXCLUDED.excerpt, content=EXCLUDED.content, image_url=EXCLUDED.image_url,
               views=EXCLUDED.views, audio_url=EXCLUDED.audio_url, featured=EXCLUDED.featured`,
              [
                p.id, p.title, p.author, p.date, p.read_time || p.readTime || '5 min', p.category,
                p.excerpt, p.content, p.image_url || p.imageUrl || '', p.views || 0, p.audio_url || p.audioUrl || '', p.featured ? true : false
              ]
            );
          }
          restoredCounts.blog_posts = data.blog_posts.length;
        }

        if (Array.isArray(data.subscribers)) {
          for (const sub of data.subscribers) {
            await pool.query(
              `INSERT INTO subscribers (id, email, name, created_at, is_active)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (email) DO UPDATE SET
               name=EXCLUDED.name, is_active=EXCLUDED.is_active`,
              [sub.id || 'sub_' + Date.now(), sub.email, sub.name || '', sub.created_at || sub.createdAt || new Date().toISOString(), sub.is_active !== false]
            );
          }
          restoredCounts.subscribers = data.subscribers.length;
        }

        if (Array.isArray(data.sa_subscribers)) {
          for (const sub of data.sa_subscribers) {
            await pool.query(
              `INSERT INTO sa_subscribers (id, email, name, created_at, is_active)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (email) DO UPDATE SET
               name=EXCLUDED.name, is_active=EXCLUDED.is_active`,
              [sub.id || 'sa_' + Date.now(), sub.email, sub.name || '', sub.created_at || sub.createdAt || new Date().toISOString(), sub.is_active !== false]
            );
          }
          restoredCounts.sa_subscribers = data.sa_subscribers.length;
        }

        if (Array.isArray(data.sd_subscribers)) {
          for (const sub of data.sd_subscribers) {
            await pool.query(
              `INSERT INTO sd_subscribers (id, email, name, created_at, is_active)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (email) DO UPDATE SET
               name=EXCLUDED.name, is_active=EXCLUDED.is_active`,
              [sub.id || 'sd_' + Date.now(), sub.email, sub.name || '', sub.created_at || sub.createdAt || new Date().toISOString(), sub.is_active !== false]
            );
          }
          restoredCounts.sd_subscribers = data.sd_subscribers.length;
        }

        if (Array.isArray(data.custom_forms)) {
          for (const f of data.custom_forms) {
            await pool.query(
              `INSERT INTO custom_forms (id, title, slug, description, banner_image, featured_image, fields, is_active, responses_count, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
               ON CONFLICT (id) DO UPDATE SET
               title=EXCLUDED.title, slug=EXCLUDED.slug, description=EXCLUDED.description, banner_image=EXCLUDED.banner_image,
               featured_image=EXCLUDED.featured_image, fields=EXCLUDED.fields, is_active=EXCLUDED.is_active`,
              [
                f.id, f.title, f.slug, f.description, f.banner_image || f.bannerImage || '', f.featured_image || f.featuredImage || '',
                JSON.stringify(f.fields || []), f.is_active !== false, f.responses_count || f.responsesCount || 0, f.created_at || new Date().toISOString()
              ]
            );
          }
          restoredCounts.custom_forms = data.custom_forms.length;
        }

        if (Array.isArray(data.redirect_links)) {
          for (const link of data.redirect_links) {
            await pool.query(
              `INSERT INTO redirect_links (id, short_code, target_url, clicks, created_at)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (short_code) DO UPDATE SET
               target_url=EXCLUDED.target_url, clicks=EXCLUDED.clicks`,
              [link.id || 'link_' + Date.now(), link.short_code || link.shortCode, link.target_url || link.targetUrl, link.clicks || 0, link.created_at || new Date().toISOString()]
            );
          }
        }
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Site backup restored successfully!',
        restored: restoredCounts
      });
    } catch (err) {
      console.error('Backup restore error:', err);
      return sendJson(res, 500, { error: 'Failed to restore site backup: ' + err.message });
    }
  }

  // GET Users (Superadmin only)
  if (pathname === '/api/users' && method === 'GET') {
    if (user.role !== 'superadmin') {
      sendJson(res, 403, { error: 'Superadmin access required' });
      return;
    }
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

  // POST Users (Superadmin only)
  if (pathname === '/api/users' && method === 'POST') {
    if (user.role !== 'superadmin') {
      sendJson(res, 403, { error: 'Superadmin access required' });
      return;
    }
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
            
            if (u.password && u.password.trim() !== '') {
              const { salt, hash } = hashPassword(u.password.trim());
              const checkCred = await pool.query('SELECT * FROM credentials WHERE LOWER(username) = LOWER($1)', [u.email]);
              if (checkCred.rows.length > 0) {
                await pool.query(
                  'UPDATE credentials SET salt = $1, hash = $2, role = $3 WHERE LOWER(username) = LOWER($4)',
                  [salt, hash, credRole, u.email]
                );
              } else {
                await pool.query(
                  'INSERT INTO credentials (username, salt, hash, role) VALUES ($1, $2, $3, $4)',
                  [u.email, salt, hash, credRole]
                );
              }
            } else {
              await pool.query(
                `UPDATE credentials SET role = $1 WHERE LOWER(username) = LOWER($2)`,
                [credRole, u.email]
              );
            }
          }
          await pool.query('COMMIT');
        } else {
          fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
          // Update credentials.json too
          if (fs.existsSync(CREDENTIALS_FILE)) {
            let creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
            if (Array.isArray(creds)) {
              for (const u of data) {
                let credRole = 'member';
                if (u.role === 'Admin') credRole = 'admin';
                if (u.role === 'Superadmin') credRole = 'superadmin';

                const idx = creds.findIndex(c => c.username.toLowerCase() === u.email.toLowerCase());
                if (u.password && u.password.trim() !== '') {
                  const { salt, hash } = hashPassword(u.password.trim());
                  if (idx !== -1) {
                    creds[idx].salt = salt;
                    creds[idx].hash = hash;
                    creds[idx].role = credRole;
                  } else {
                    creds.push({ username: u.email, salt, hash, role: credRole });
                  }
                } else if (idx !== -1) {
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
          frequency: row.frequency,
          currency: row.currency || 'USD'
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
        
        const extLower = ext.toLowerCase();
        if (extLower === '.jpg' || extLower === '.jpeg' || extLower === '.png') {
          const pyCmd = `python3 -c "
from PIL import Image
try:
    img = Image.open('${filePath}')
    w, h = img.size
    if w > 800 or h > 800:
        ratio = min(800/w, 800/h)
        img = img.resize((int(w*ratio), int(h*ratio)), Image.Resampling.LANCZOS if hasattr(Image, 'Resampling') else Image.ANTIALIAS)
    if '${extLower}' in ['.jpg', '.jpeg']:
        img.save('${filePath}', 'JPEG', quality=82, optimize=True)
    elif '${extLower}' == '.png':
        if img.mode in ('RGBA', 'LA'):
            img.save('${filePath}', 'PNG', optimize=True)
        else:
            img.convert('RGB').save('${filePath}', 'JPEG', quality=82, optimize=True)
except Exception as e:
    print(e)
"`;
          exec(pyCmd, (err) => {
            if (err) console.error('Failed to compress upload in-place:', err);
            else console.log('Successfully compressed uploaded image in-place');
          });
        }
        
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
          `INSERT INTO sermons (id, title, speaker, duration, thumbnail, views, downloads, date, description, category, video_url, audio_url, audios, audience)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
             audios = EXCLUDED.audios,
             audience = EXCLUDED.audience`,
          [item.id, item.title, item.speaker, item.duration, item.thumbnail, item.views || 0, item.downloads || 0, item.date, item.description, item.category, item.videoUrl, item.audioUrl, JSON.stringify(item.audios || []), item.audience || 'public']
        );
      } else {
        const data = JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8'));
        const index = data.findIndex(x => x.id === item.id);
        const sermonToSave = { ...item, audience: item.audience || 'public' };
        if (index > -1) {
          data[index] = sermonToSave;
        } else {
          data.push(sermonToSave);
        }
        fs.writeFileSync(SERMONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
      }
      generateSitemap();
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
      generateSitemap();
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
          `INSERT INTO books (id, title, author, cover_url, description, category, download_url, rating, amazon_url, selar_url, pages, downloads, pdfs, views)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
             pdfs = EXCLUDED.pdfs,
             views = EXCLUDED.views`,
          [item.id, item.title, item.author, item.coverUrl || '', item.description || '', item.category || '', item.downloadUrl || '', item.rating || 4.8, item.amazonUrl || '', item.selarUrl || '', item.pages || 150, item.downloads || 0, JSON.stringify(item.pdfs || []), item.views || 0]
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
      generateSitemap();
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
      generateSitemap();
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
          `INSERT INTO blog_posts (id, title, author, date, read_time, excerpt, image_url, category, content, seo_title, seo_description, seo_keywords, slug, views)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
             slug = EXCLUDED.slug,
             views = EXCLUDED.views`,
          [item.id, item.title, item.author, item.date, item.readTime, item.excerpt, item.imageUrl, item.category, item.content, item.seoTitle || item.title, item.seoDescription || item.excerpt, item.seoKeywords || '', item.slug || '', item.views || 0]
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
      generateSitemap();
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
      generateSitemap();
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

  // POST /api/testimonies (Save / Create / Edit)
  if (pathname === '/api/testimonies' && method === 'POST') {
    try {
      const item = await getJsonBody(req);
      if (!item.name || !item.content) {
        sendJson(res, 400, { error: 'Name and content are required' });
        return;
      }
      const id = item.id || `t_${Date.now()}`;
      item.id = id;
      item.date = item.date || new Date().toISOString().split('T')[0];
      item.type = item.type || 'written';

      // Check and handle base64 uploads for imageUrl
      if (item.imageUrl && item.imageUrl.startsWith('data:')) {
        const commaIndex = item.imageUrl.indexOf(',');
        if (commaIndex !== -1) {
          const prefix = item.imageUrl.substring(0, commaIndex);
          const base64Data = item.imageUrl.substring(commaIndex + 1);
          const mimeMatch = prefix.match(/data:([^;]+);base64/);
          if (mimeMatch) {
            const mimeType = mimeMatch[1];
            const buffer = Buffer.from(base64Data, 'base64');
            let ext = '.jpg';
            if (mimeType.includes('png')) ext = '.png';
            else if (mimeType.includes('webp')) ext = '.webp';
            else if (mimeType.includes('gif')) ext = '.gif';

            const uploadDir = path.join(DATA_DIR, 'uploads');
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filename = `testimony_${item.id}_${Date.now()}${ext}`;
            const filepath = path.join(uploadDir, filename);
            fs.writeFileSync(filepath, buffer);
            item.imageUrl = `/api/uploads/${filename}`;
          }
        }
      }

      if (pool) {
        await pool.query(
          `INSERT INTO testimonies (id, name, content, image_url, type, date)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             content = EXCLUDED.content,
             image_url = EXCLUDED.image_url,
             type = EXCLUDED.type,
             date = EXCLUDED.date`,
          [item.id, item.name, item.content, item.imageUrl || '', item.type, item.date]
        );
      } else {
        let testimonies = [];
        if (fs.existsSync(TESTIMONIES_FILE)) {
          testimonies = JSON.parse(fs.readFileSync(TESTIMONIES_FILE, 'utf-8'));
        }
        const index = testimonies.findIndex(x => x.id === item.id);
        if (index > -1) {
          testimonies[index] = item;
        } else {
          testimonies.unshift(item);
        }
        fs.writeFileSync(TESTIMONIES_FILE, JSON.stringify(testimonies, null, 2), 'utf-8');
      }
      sendJson(res, 200, { success: true, item });
    } catch (e) {
      console.error('Failed to save testimony:', e);
      sendJson(res, 500, { error: 'Failed to save testimony' });
    }
    return;
  }

  // --- PRETTY REDIRECT LINKS CRUD ENDPOINTS ---
  // GET /api/redirect-links
  if (pathname === '/api/redirect-links' && method === 'GET') {
    try {
      if (pool) {
        const result = await pool.query('SELECT * FROM redirect_links ORDER BY created_at DESC');
        sendJson(res, 200, { success: true, links: result.rows });
      } else {
        sendJson(res, 200, { success: true, links: [] });
      }
    } catch (e) {
      console.error('Failed to fetch redirect links:', e);
      sendJson(res, 500, { error: 'Failed to fetch redirect links' });
    }
    return;
  }

  // POST /api/redirect-links
  if (pathname === '/api/redirect-links' && method === 'POST') {
    try {
      const auth = await getAuthenticatedUser(req);
      if (!auth) {
        sendJson(res, 401, { error: 'Admin access required' });
        return;
      }

      const body = await getJsonBody(req);
      let { slug, target_url, title, is_active } = body;
      if (!slug || !target_url) {
        sendJson(res, 400, { error: 'Slug and Target URL are required' });
        return;
      }

      slug = slug.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
      target_url = target_url.trim();
      if (!target_url.startsWith('http://') && !target_url.startsWith('https://')) {
        target_url = `https://${target_url}`;
      }
      title = (title || '').trim();
      const active = is_active !== false;

      const reservedSlugs = [
        'admin', 'sermons', 'books', 'blog', 'events', 'radio', 'donate',
        'contact', 'privacy-policy', 'terms', 'cookie-policy', 'createimage',
        'getupdates', 'southafricaupdates', 'sondaughter', 'thank-you', 'podcast', 'counter', 'api'
      ];

      if (reservedSlugs.includes(slug)) {
        sendJson(res, 400, { error: `The slug "/${slug}" is reserved for system pages. Please choose a different slug.` });
        return;
      }

      if (pool) {
        const check = await pool.query('SELECT 1 FROM redirect_links WHERE LOWER(slug) = $1', [slug]);
        if (check.rows.length > 0) {
          sendJson(res, 400, { error: `Slug "/${slug}" is already in use. Please choose another slug.` });
          return;
        }

        const insertRes = await pool.query(
          `INSERT INTO redirect_links (slug, target_url, title, is_active)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [slug, target_url, title, active]
        );
        sendJson(res, 201, { success: true, link: insertRes.rows[0] });
      } else {
        sendJson(res, 400, { error: 'Database inactive' });
      }
    } catch (e) {
      console.error('Failed to create redirect link:', e);
      sendJson(res, 500, { error: e.message || 'Failed to create redirect link' });
    }
    return;
  }

  // PUT /api/redirect-links/:id
  if (pathname.startsWith('/api/redirect-links/') && method === 'PUT') {
    try {
      const auth = await getAuthenticatedUser(req);
      if (!auth) {
        sendJson(res, 401, { error: 'Admin access required' });
        return;
      }

      const id = pathname.split('/').pop();
      const body = await getJsonBody(req);
      let { slug, target_url, title, is_active } = body;
      if (!slug || !target_url) {
        sendJson(res, 400, { error: 'Slug and Target URL are required' });
        return;
      }

      slug = slug.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
      target_url = target_url.trim();
      if (!target_url.startsWith('http://') && !target_url.startsWith('https://')) {
        target_url = `https://${target_url}`;
      }
      title = (title || '').trim();
      const active = is_active !== false;

      const reservedSlugs = [
        'admin', 'sermons', 'books', 'blog', 'events', 'radio', 'donate',
        'contact', 'privacy-policy', 'terms', 'cookie-policy', 'createimage',
        'getupdates', 'southafricaupdates', 'sondaughter', 'thank-you', 'podcast', 'counter', 'api'
      ];

      if (reservedSlugs.includes(slug)) {
        sendJson(res, 400, { error: `The slug "/${slug}" is reserved for system pages.` });
        return;
      }

      if (pool) {
        const check = await pool.query('SELECT 1 FROM redirect_links WHERE LOWER(slug) = $1 AND id != $2', [slug, id]);
        if (check.rows.length > 0) {
          sendJson(res, 400, { error: `Slug "/${slug}" is already used by another link.` });
          return;
        }

        const updateRes = await pool.query(
          `UPDATE redirect_links
           SET slug = $1, target_url = $2, title = $3, is_active = $4, updated_at = NOW()
           WHERE id = $5
           RETURNING *`,
          [slug, target_url, title, active, id]
        );
        sendJson(res, 200, { success: true, link: updateRes.rows[0] });
      } else {
        sendJson(res, 400, { error: 'Database inactive' });
      }
    } catch (e) {
      console.error('Failed to update redirect link:', e);
      sendJson(res, 500, { error: e.message || 'Failed to update redirect link' });
    }
    return;
  }

  // DELETE /api/redirect-links/:id
  if (pathname.startsWith('/api/redirect-links/') && method === 'DELETE') {
    try {
      const auth = await getAuthenticatedUser(req);
      if (!auth) {
        sendJson(res, 401, { error: 'Admin access required' });
        return;
      }

      const id = pathname.split('/').pop();
      if (pool) {
        await pool.query('DELETE FROM redirect_links WHERE id = $1', [id]);
        sendJson(res, 200, { success: true });
      } else {
        sendJson(res, 400, { error: 'Database inactive' });
      }
    } catch (e) {
      console.error('Failed to delete redirect link:', e);
      sendJson(res, 500, { error: 'Failed to delete redirect link' });
    }
    return;
  }


  // DELETE /api/testimonies/:id
  if (pathname.startsWith('/api/testimonies/') && method === 'DELETE') {
    try {
      const parts = pathname.split('/');
      const id = parts[parts.length - 1];
      if (!id) {
        sendJson(res, 400, { error: 'Testimony ID is required' });
        return;
      }

      if (pool) {
        await pool.query('DELETE FROM testimonies WHERE id = $1', [id]);
      } else {
        if (fs.existsSync(TESTIMONIES_FILE)) {
          const testimonies = JSON.parse(fs.readFileSync(TESTIMONIES_FILE, 'utf-8'));
          const filtered = testimonies.filter(x => x.id !== id);
          fs.writeFileSync(TESTIMONIES_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
        }
      }
      sendJson(res, 200, { success: true });
    } catch (e) {
      console.error('Failed to delete testimony:', e);
      sendJson(res, 500, { error: 'Failed to delete testimony' });
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

  // GET /api/admin/comments (Protected)
  if (pathname === '/api/admin/comments' && method === 'GET') {
    try {
      let comments = [];
      if (pool) {
        const result = await pool.query(`
          SELECT c.*, 
                 COALESCE(s.title, b.title, p.title) as item_title
          FROM comments c
          LEFT JOIN sermons s ON c.item_type = 'sermon' AND c.item_id = s.id
          LEFT JOIN books b ON c.item_type = 'book' AND c.item_id = b.id
          LEFT JOIN blog_posts p ON c.item_type = 'blog' AND c.item_id = p.id
          ORDER BY c.created_at DESC
        `);
        comments = result.rows;
      } else {
        const rawComments = JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf-8'));
        const sermons = fs.existsSync(SERMONS_FILE) ? JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8')) : [];
        const books = fs.existsSync(BOOKS_FILE) ? JSON.parse(fs.readFileSync(BOOKS_FILE, 'utf-8')) : [];
        const posts = fs.existsSync(BLOG_FILE) ? JSON.parse(fs.readFileSync(BLOG_FILE, 'utf-8')) : [];

        const itemTitleMap = {};
        sermons.forEach(s => { itemTitleMap[`sermon_${s.id}`] = s.title; });
        books.forEach(b => { itemTitleMap[`book_${b.id}`] = b.title; });
        posts.forEach(p => { itemTitleMap[`blog_${p.id}`] = p.title; });

        comments = rawComments.map(c => ({
          ...c,
          item_title: itemTitleMap[`${c.item_type}_${c.item_id}`] || 'Unknown Item'
        }));
      }
      sendJson(res, 200, comments);
    } catch (e) {
      console.error('Failed to get admin comments:', e);
      sendJson(res, 500, { error: 'Failed to get admin comments' });
    }
    return;
  }

  // PUT /api/admin/comments/:id/approve (Protected)
  if (pathname.startsWith('/api/admin/comments/') && pathname.endsWith('/approve') && method === 'PUT') {
    try {
      const parts = pathname.split('/');
      const id = parts[parts.length - 2];
      if (pool) {
        await pool.query('UPDATE comments SET status = \'approved\' WHERE id = $1', [id]);
      } else {
        const data = JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf-8'));
        const index = data.findIndex(c => c.id === id);
        if (index !== -1) {
          data[index].status = 'approved';
          fs.writeFileSync(COMMENTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
        }
      }
      sendJson(res, 200, { success: true });
    } catch (e) {
      console.error('Failed to approve comment:', e);
      sendJson(res, 500, { error: 'Failed to approve comment' });
    }
    return;
  }

  // DELETE /api/admin/comments/:id (Protected)
  if (pathname.startsWith('/api/admin/comments/') && method === 'DELETE') {
    try {
      const parts = pathname.split('/');
      const id = parts[parts.length - 1];
      if (pool) {
        await pool.query('DELETE FROM comments WHERE id = $1', [id]);
      } else {
        const data = JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf-8'));
        const filtered = data.filter(c => c.id !== id);
        fs.writeFileSync(COMMENTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      }
      sendJson(res, 200, { success: true });
    } catch (e) {
      console.error('Failed to delete comment:', e);
      sendJson(res, 500, { error: 'Failed to delete comment' });
    }
    return;
  }

  // SPA Fallback for non-API GET/HEAD requests
  if ((method === 'GET' || method === 'HEAD') && !pathname.startsWith('/api/')) {
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      if (method === 'HEAD') {
        res.end();
      } else {
        fs.createReadStream(indexPath).pipe(res);
      }
      return;
    }
  }

  // If no match found
  sendJson(res, 404, { error: 'Route Not Found' });
});

server.listen(PORT, () => {
  console.log(`Joshua Generation API Server running on port ${PORT}`);
});
