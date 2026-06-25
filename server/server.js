import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
}

const SERMONS_FILE = path.join(DATA_DIR, 'sermons.json');
const BOOKS_FILE = path.join(DATA_DIR, 'books.json');
const BLOG_FILE = path.join(DATA_DIR, 'blog_posts.json');
const RADIO_FILE = path.join(DATA_DIR, 'radio.json');
const CREDENTIALS_FILE = path.join(DATA_DIR, 'credentials.json');
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
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    const { salt, hash } = hashPassword('admin123'); // Default password: admin123
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify({ username: 'admin@joshuagen.org', salt, hash }), 'utf-8');
    console.log('Initialized local admin credentials.');
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
          date VARCHAR,
          description TEXT,
          category VARCHAR,
          video_url TEXT,
          audio_url TEXT
        );
      `);

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
          hash VARCHAR NOT NULL
        );
      `);

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
            `INSERT INTO sermons (id, title, speaker, duration, thumbnail, views, date, description, category, video_url, audio_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [s.id, s.title, s.speaker, s.duration, s.thumbnail, s.views || 0, s.date, s.description, s.category, s.videoUrl, s.audioUrl]
          );
        }
        console.log('Seeded sermons table.');
      }

      const bookCheck = await pool.query('SELECT 1 FROM books LIMIT 1');
      if (bookCheck.rowCount === 0) {
        for (const b of defaults.books) {
          await pool.query(
            `INSERT INTO books (id, title, author, cover_url, description, category, download_url, rating, amazon_url, selar_url, pages, chapters)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [b.id, b.title, b.author, b.coverUrl, b.description, b.category, b.downloadUrl, b.rating || 4.8, b.amazonUrl || '', b.selarUrl || '', b.pages || 150, JSON.stringify(b.chapters || [])]
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
        const { salt, hash } = hashPassword('admin123'); // Default password: admin123
        await pool.query(
          `INSERT INTO credentials (username, salt, hash) VALUES ($1, $2, $3)`,
          ['admin@joshuagen.org', salt, hash]
        );
        console.log('Seeded admin credentials.');
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
  return session.username;
}

// --- Router ---
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

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

  // --- PUBLIC ROUTES ---

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
        const result = await pool.query('SELECT username, salt, hash FROM credentials WHERE LOWER(username) = LOWER($1)', [email]);
        if (result.rowCount > 0) {
          creds = result.rows[0];
        }
      } else {
        const fileData = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
        if (fileData.username.toLowerCase() === email.toLowerCase()) {
          creds = fileData;
        }
      }

      if (creds && verifyPassword(password, creds.salt, creds.hash)) {
        const token = crypto.randomBytes(32).toString('hex');
        sessions.set(token, {
          username: creds.username,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 Hours Session
        });
        sendJson(res, 200, { success: true, token });
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
        const result = await pool.query('SELECT * FROM sermons ORDER BY date DESC');
        // Map database naming back to frontend interface
        const sermons = result.rows.map(row => ({
          id: row.id,
          title: row.title,
          speaker: row.speaker,
          duration: row.duration,
          thumbnail: row.thumbnail,
          views: row.views,
          date: row.date,
          description: row.description,
          category: row.category,
          videoUrl: row.video_url,
          audioUrl: row.audio_url
        }));
        sendJson(res, 200, sermons);
      } else {
        const data = JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8'));
        sendJson(res, 200, data);
      }
    } catch (e) {
      sendJson(res, 500, { error: 'Failed to retrieve sermons' });
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
          chapters: typeof row.chapters === 'string' ? JSON.parse(row.chapters) : row.chapters
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

  // --- SECURE ADMIN ROUTES (Requires authorization header) ---
  const user = getAuthenticatedUser(req);
  if (!user) {
    sendJson(res, 401, { error: 'Unauthorized admin access' });
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

      if (pool) {
        await pool.query(
          `INSERT INTO sermons (id, title, speaker, duration, thumbnail, views, date, description, category, video_url, audio_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             speaker = EXCLUDED.speaker,
             duration = EXCLUDED.duration,
             thumbnail = EXCLUDED.thumbnail,
             views = EXCLUDED.views,
             date = EXCLUDED.date,
             description = EXCLUDED.description,
             category = EXCLUDED.category,
             video_url = EXCLUDED.video_url,
             audio_url = EXCLUDED.audio_url`,
          [item.id, item.title, item.speaker, item.duration, item.thumbnail, item.views || 0, item.date, item.description, item.category, item.videoUrl, item.audioUrl]
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
          `INSERT INTO books (id, title, author, cover_url, description, category, download_url, rating, amazon_url, selar_url, pages, chapters)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
             chapters = EXCLUDED.chapters`,
          [item.id, item.title, item.author, item.coverUrl, item.description, item.category, item.downloadUrl, item.rating || 4.8, item.amazonUrl || '', item.selarUrl || '', item.pages || 150, JSON.stringify(item.chapters || [])]
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

  // If no match found
  sendJson(res, 404, { error: 'Route Not Found' });
});

server.listen(PORT, () => {
  console.log(`Joshua Generation API Server running on port ${PORT}`);
});
