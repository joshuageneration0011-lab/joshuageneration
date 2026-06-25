import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
let DATA_DIR = process.env.JGEN_DATA_DIR || path.join(__dirname, 'data');

// Ensure database directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn(`Warning: Failed to access database directory at ${DATA_DIR} (${err.message}). Falling back to local 'data' directory.`);
  DATA_DIR = path.join(__dirname, 'data');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Local file paths
const SERMONS_FILE = path.join(DATA_DIR, 'sermons.json');
const BOOKS_FILE = path.join(DATA_DIR, 'books.json');
const BLOG_POSTS_FILE = path.join(DATA_DIR, 'blog_posts.json');
const RADIO_FILE = path.join(DATA_DIR, 'radio.json');
const CREDENTIALS_FILE = path.join(DATA_DIR, 'credentials.json');

// Session store in-memory
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
    console.log('DATABASE_URL detected. Using Supabase PostgreSQL database.');
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

// --- Default Mock Data Seeds ---
const defaultSermons = [
  {
    id: 's1',
    title: 'Walking in Divine Authority',
    speaker: 'Pastor John Michael',
    duration: '45:22',
    thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a67343?w=800&q=80',
    views: 12400,
    date: '2025-12-10',
    description: 'Discover the authority given to every believer through Christ and how to walk in it daily.',
    category: 'Faith',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 's2',
    title: 'The Power of Kingdom Prayer',
    speaker: 'Pastor Sarah Williams',
    duration: '38:15',
    thumbnail: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&q=80',
    views: 9800,
    date: '2025-12-03',
    description: 'Learn the principles of effective prayer that moves mountains and transforms lives.',
    category: 'Prayer',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: 's3',
    title: 'Breaking Generational Chains',
    speaker: 'Apostle David Thompson',
    duration: '52:40',
    thumbnail: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&q=80',
    views: 15600,
    date: '2025-11-28',
    description: 'Find freedom from patterns that have held your family line captive for generations.',
    category: 'Freedom',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: 's4',
    title: 'Grace That Transforms',
    speaker: 'Pastor John Michael',
    duration: '42:10',
    thumbnail: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
    views: 11200,
    date: '2025-11-20',
    description: 'Understanding the radical grace of God that doesn\'t just forgive but transforms.',
    category: 'Grace',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    id: 's5',
    title: 'Rising in Unshakable Faith',
    speaker: 'Minister Rachel Grace',
    duration: '35:50',
    thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
    views: 8700,
    date: '2025-11-15',
    description: 'Build a faith that stands firm no matter what storms life brings your way.',
    category: 'Faith',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
  {
    id: 's6',
    title: 'The Season of Harvest',
    speaker: 'Pastor Sarah Williams',
    duration: '48:30',
    thumbnail: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800&q=80',
    views: 13200,
    date: '2025-11-08',
    description: 'Recognize the season you\'re in and position yourself for the harvest God is bringing.',
    category: 'Season',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  }
];

const defaultBooks = [
  {
    id: 'b1',
    title: 'Purpose & Destiny',
    author: 'Pastor John Michael',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    description: 'Discover God\'s unique purpose for your life and walk boldly in your destiny.',
    category: 'Purpose',
    downloadUrl: '#',
    chapters: [
      {
        title: 'Chapter 1: The Sovereign Plan',
        content: 'Before you were formed in the womb, God knew you and set you apart. Your life is not an accident or a product of chance. There is a divine blueprint written in heaven specifically for you. The sovereign plan of God is the foundation of all true purpose. When you align with His will, your path becomes clear, and your steps are ordered by His grace. Step forward in the confidence that He who began a good work in you will carry it on to completion.'
      },
      {
        title: 'Chapter 2: Uncovering Your Divine Gifts',
        content: 'Every individual has been uniquely equipped by God with talents, spiritual gifts, and capabilities designed to serve the Kingdom. Understanding your gifts is a vital step toward fulfilling your destiny. Take time to pray, self-reflect, and seek counsel to recognize what comes naturally to you and where God\'s power amplifies your efforts. Use your gifts to lift others, build the church, and display His glory.'
      },
      {
        title: 'Chapter 3: Standing Firm in Trials',
        content: 'A strong destiny is forged in the fire of testing. Trials are not meant to destroy you; they are designed to refine you. Keep your eyes fixed on Jesus, the author and finisher of our faith. When storms arise, hold fast to His promises and remember that the trials of today are preparing you for the victories of tomorrow.'
      }
    ]
  },
  {
    id: 'b2',
    title: 'The Prayer Warrior',
    author: 'Sarah Williams',
    coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80',
    description: 'A comprehensive guide to developing a powerful and effective prayer life.',
    category: 'Prayer',
    downloadUrl: '#',
    chapters: [
      {
        title: 'Chapter 1: The Language of Heaven',
        content: 'Prayer is not a religious duty; it is a relationship. It is the language of communication between heaven and earth. To pray effectively is to communicate from the heart of a child to the ears of a loving Father. When you enter your secret closet and close the door, you enter a realm of limitless power and deep communion.'
      },
      {
        title: 'Chapter 2: Persistent Faith',
        content: 'Persistence in prayer is the key to breakthroughs. Do not grow weary in asking, seeking, and knocking. The answers are on the way. Continue to stand in faith, declaring the scriptures, and praise God even before you see the physical manifestation of your prayers.'
      }
    ]
  },
  {
    id: 'b3',
    title: 'Kingdom Economics',
    author: 'David Thompson',
    coverUrl: 'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400&q=80',
    description: 'Biblical principles for financial freedom and kingdom stewardship.',
    category: 'Finance',
    downloadUrl: '#',
    chapters: [
      {
        title: 'Chapter 1: The Principle of Ownership',
        content: 'Everything belongs to God. Once we realize we are not owners but stewards, our relationship with wealth changes. Wealth is a tool to advance the kingdom and bless others, not a treasure to hoard.'
      },
      {
        title: 'Chapter 2: The Sowing and Reaping Cycle',
        content: 'Generosity is the currency of the kingdom. As you sow seed, God multiplies your harvest. Give cheerfully and trust that He will provide all your needs according to His riches in glory.'
      }
    ]
  },
  {
    id: 'b4',
    title: 'Walking in the Spirit',
    author: 'Rachel Grace',
    coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80',
    description: 'Learn to live a Spirit-led life in every area of your daily walk.',
    category: 'Spiritual Growth',
    downloadUrl: '#',
    chapters: [
      {
        title: 'Chapter 1: Cultivating Sensitivity',
        content: 'The Holy Spirit speaks in a still, small voice. To hear Him, we must quiet the noise of the world. Set aside time each morning to listen and surrender your day to His guidance.'
      },
      {
        title: 'Chapter 2: Fruits of the Spirit',
        content: 'A spirit-led life is evidenced by the character of Christ. Love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control should flow naturally from a heart rooted in Him.'
      }
    ]
  },
  {
    id: 'b5',
    title: 'Healing for the Broken',
    author: 'Pastor John Michael',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    description: 'Find emotional and spiritual healing through God\'s restoring power.',
    category: 'Healing',
    downloadUrl: '#',
    chapters: [
      {
        title: 'Chapter 1: Binding Up the Wounds',
        content: 'God is close to the brokenhearted and saves those who are crushed in spirit. Bring your pain to the altar. Jesus took our stripes, and by His wounds, we are healed, both physically and emotionally.'
      },
      {
        title: 'Chapter 2: The Freedom of Forgiveness',
        content: 'Unforgiveness is a prison that blocks your healing. Release the offenses and trust God to vindicate you. When you forgive, you release yourself from the burden of the past.'
      }
    ]
  },
  {
    id: 'b6',
    title: 'The Family Altar',
    author: 'Minister Rachel Grace',
    coverUrl: 'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400&q=80',
    description: 'Building a strong spiritual foundation for your family through daily devotion.',
    category: 'Family',
    downloadUrl: '#',
    chapters: [
      {
        title: 'Chapter 1: The Devoted Home',
        content: 'A home built on prayer stands strong. Establish a daily family altar where you worship, read the word, and pray together. It seals the hearts of your children and invites God\'s peace into your household.'
      },
      {
        title: 'Chapter 2: Legacy of Faith',
        content: 'What you model in the home will outlive you. Pass down a legacy of scripture reading, integrity, and faith that will guide generations to come.'
      }
    ]
  }
];

const defaultBlogPosts = [
  {
    id: 'p1',
    title: '5 Ways to Strengthen Your Faith in Difficult Times',
    author: 'Pastor John Michael',
    date: '2025-12-08',
    readTime: '7 min read',
    excerpt: 'When life gets tough, our faith is tested. Here are five powerful ways to keep your faith strong...',
    imageUrl: 'https://images.unsplash.com/photo-1504052434561-5adf5a5c1a1e?w=800&q=80',
    category: 'Faith',
    content: `When life gets tough, our faith is tested in ways we never anticipated. The storms of life have a way of revealing the foundations upon which we stand. If our foundation is weak, we will falter. But if our foundation is built upon the solid rock of Jesus Christ, we can withstand any trial.\n\nHere are five powerful ways to keep your faith strong when you face adversity:\n\n1. Immerse Yourself in the Word of God: Romans 10:17 reminds us that faith comes by hearing, and hearing by the word of God. When the noise of the world is loud, tune in to the whisper of Scripture. Declare the promises of God daily.\n\n2. Maintain a Lifestyle of Praise: Worship is a powerful weapon. Praising God in the midst of your struggle shifts your focus from the size of your giant to the size of your God. It changes the atmosphere of your heart.\n\n3. Stay Connected to Community: Do not isolate yourself. Find a group of believers who will lift you up in prayer, encourage your heart, and stand with you in faith. We are stronger together.\n\n4. Remember Past Victories: David defeated Goliath because he remembered how God had delivered him from the lion and the bear. Journal your testimonies; they will serve as anchors of hope in seasons of doubt.\n\n5. Pray without Ceasing: Keep the communication lines with heaven wide open. Pour out your heart to the Father and allow His peace, which surpasses all understanding, to guard your heart and mind.`
  },
  {
    id: 'p2',
    title: 'The Power of Daily Devotion',
    author: 'Sarah Williams',
    date: '2025-12-05',
    readTime: '5 min read',
    excerpt: 'How establishing a daily devotional practice can transform your spiritual life and deepen your...',
    imageUrl: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&q=80',
    category: 'Devotion',
    content: `In our fast-paced world, it is easy to get caught up in the hustle and bustle of daily activities. However, neglecting our spiritual health leads to exhaustion and dryness. Establishing a daily devotional practice is the key to maintaining a vibrant relationship with Jesus.\n\nA daily devotion is not a ritual to check off your to-do list; it is a vital connection to the Source of life. Here is how it can transform your walk:\n\nFirst, it aligns your perspective. Spending your first moments with God clears the mental clutter and prepares you to face the day with grace and patience. Second, it fills your spiritual tank. Just as physical food sustains the body, the Word sustains the spirit.\n\nStart small: set aside 15 minutes each morning. Read a chapter of Scripture, meditate on it, and pray. You will find that consistency yields deep spiritual growth, bringing peace and strength into every corner of your daily life.`
  },
  {
    id: 'p3',
    title: 'Understanding God\'s Grace in a Performance-Driven World',
    author: 'Rachel Grace',
    date: '2025-12-01',
    readTime: '6 min read',
    excerpt: 'In a world that constantly demands more, understanding God\'s unearned favor brings true freedom...',
    imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
    category: 'Grace',
    content: `We live in a performance-driven culture that measures our worth by our achievements. From a young age, we are taught that to receive rewards, we must perform. Unfortunately, we often carry this performance mentality into our relationship with God.\n\nWe think we must earn His love, deserve His mercy, and work for His blessings. But the gospel tells a completely different story. The gospel is a story of grace—unearned, unmerited, and undeserved favor.\n\nGrace means that God loves you because of who He is, not because of what you have done. Ephesians 2:8-9 declares, "For by grace you have been saved through faith; and that not of yourselves, it is the gift of God; not as a result of works, so that no one may boast." When you embrace grace, the pressure is off. You no longer serve God to get Him to love you; you serve Him because He already does.`
  },
  {
    id: 'p4',
    title: 'Building a Prayer Life That Moves Mountains',
    author: 'David Thompson',
    date: '2025-11-28',
    readTime: '8 min read',
    excerpt: 'Discover the secrets to a prayer life that produces results and brings heaven\'s power to earth...',
    imageUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&q=80',
    category: 'Prayer',
    content: `Prayer is one of the most powerful privileges given to believers, yet it is often one of the most underutilized. True prayer is not merely reciting a list of requests; it is partnering with heaven to release God's will on earth.\n\nIf you want to build a prayer life that moves mountains, keep these principles in mind:\n\n1. Pray in Alignment with God's Will: Effective prayer is rooted in the Word. When we pray the scriptures, we are praying the very heart of God, and we can be confident He hears us.\n\n2. Pray with Faith: Jesus said, "Whatever you ask for in prayer, believe that you have received it, and it will be yours." Faith is the spark that ignites our prayers.\n\n3. Pray with Persistence: Don't give up. Elijah prayed persistently for rain until a cloud appeared. Persistence builds spiritual muscle and demonstrates earnest trust.`
  }
];

const defaultRadio = {
  url: 'https://mixlr.com/users/8375836/embed',
  active: false
};

// --- Local File Database Initializers ---
function initLocalData() {
  if (!fs.existsSync(SERMONS_FILE)) {
    fs.writeFileSync(SERMONS_FILE, JSON.stringify(defaultSermons, null, 2), 'utf-8');
    console.log('Initialized local sermons database.');
  }
  if (!fs.existsSync(BOOKS_FILE)) {
    fs.writeFileSync(BOOKS_FILE, JSON.stringify(defaultBooks, null, 2), 'utf-8');
    console.log('Initialized local books database.');
  }
  if (!fs.existsSync(BLOG_POSTS_FILE)) {
    fs.writeFileSync(BLOG_POSTS_FILE, JSON.stringify(defaultBlogPosts, null, 2), 'utf-8');
    console.log('Initialized local blog posts database.');
  }
  if (!fs.existsSync(RADIO_FILE)) {
    fs.writeFileSync(RADIO_FILE, JSON.stringify(defaultRadio, null, 2), 'utf-8');
    console.log('Initialized local radio settings.');
  }
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    const { salt, hash } = hashPassword('admin123');
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify({ username: 'admin@joshuagen.org', salt, hash }, null, 2), 'utf-8');
    console.log('Initialized local admin credentials.');
  }
}

// --- Supabase DB Initializer ---
async function initDb() {
  if (pool) {
    try {
      // 1. Credentials table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS credentials (
          username VARCHAR PRIMARY KEY,
          salt VARCHAR NOT NULL,
          hash VARCHAR NOT NULL
        );
      `);
      
      // 2. Radio table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS radio (
          id INT PRIMARY KEY,
          url TEXT NOT NULL,
          active BOOLEAN NOT NULL DEFAULT false
        );
      `);

      // 3. Sermons table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sermons (
          id VARCHAR PRIMARY KEY,
          title VARCHAR NOT NULL,
          speaker VARCHAR NOT NULL,
          duration VARCHAR,
          thumbnail TEXT,
          audio_url TEXT,
          video_url TEXT,
          views INT DEFAULT 0,
          date VARCHAR,
          description TEXT,
          category VARCHAR
        );
      `);

      // 4. Books table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS books (
          id VARCHAR PRIMARY KEY,
          title VARCHAR NOT NULL,
          author VARCHAR NOT NULL,
          cover_url TEXT,
          description TEXT,
          category VARCHAR,
          download_url TEXT,
          read_url TEXT,
          chapters JSONB,
          amazon_url TEXT,
          selar_url TEXT
        );
      `);

      // 5. Blog Posts table
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

      // Seed tables if empty
      const credentialsCheck = await pool.query('SELECT 1 FROM credentials');
      if (credentialsCheck.rowCount === 0) {
        const { salt, hash } = hashPassword('admin123');
        await pool.query('INSERT INTO credentials (username, salt, hash) VALUES ($1, $2, $3)', ['admin@joshuagen.org', salt, hash]);
        console.log('Seeded Supabase credentials.');
      }

      const radioCheck = await pool.query('SELECT 1 FROM radio WHERE id = 1');
      if (radioCheck.rowCount === 0) {
        await pool.query('INSERT INTO radio (id, url, active) VALUES (1, $1, $2)', [defaultRadio.url, defaultRadio.active]);
        console.log('Seeded Supabase radio settings.');
      }

      const sermonsCheck = await pool.query('SELECT 1 FROM sermons');
      if (sermonsCheck.rowCount === 0) {
        for (const s of defaultSermons) {
          await pool.query(
            'INSERT INTO sermons (id, title, speaker, duration, thumbnail, audio_url, video_url, views, date, description, category) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
            [s.id, s.title, s.speaker, s.duration, s.thumbnail, s.audioUrl || '', s.videoUrl || '', s.views, s.date, s.description, s.category]
          );
        }
        console.log('Seeded Supabase sermons.');
      }

      const booksCheck = await pool.query('SELECT 1 FROM books');
      if (booksCheck.rowCount === 0) {
        for (const b of defaultBooks) {
          await pool.query(
            'INSERT INTO books (id, title, author, cover_url, description, category, download_url, read_url, chapters, amazon_url, selar_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
            [b.id, b.title, b.author, b.coverUrl, b.description, b.category, b.downloadUrl || '', '', JSON.stringify(b.chapters || []), b.amazonUrl || '', b.selarUrl || '']
          );
        }
        console.log('Seeded Supabase books.');
      }

      const blogPostsCheck = await pool.query('SELECT 1 FROM blog_posts');
      if (blogPostsCheck.rowCount === 0) {
        for (const p of defaultBlogPosts) {
          await pool.query(
            'INSERT INTO blog_posts (id, title, author, date, read_time, excerpt, image_url, category, content, seo_title, seo_description, seo_keywords, slug) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
            [
              p.id, p.title, p.author, p.date, p.readTime, p.excerpt, p.imageUrl, p.category, p.content || '',
              p.title, p.excerpt, `${p.category.toLowerCase()}, christian, faith`,
              p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            ]
          );
        }
        console.log('Seeded Supabase blog posts.');
      }

      console.log('Supabase database initialized successfully.');
    } catch (err) {
      console.error('Failed to initialize Supabase tables, falling back to local files:', err);
      pool = null;
      initLocalData();
    }
  } else {
    initLocalData();
  }
}

await initDb();

// --- Request Body Parser Helper ---
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

// --- API Router ---
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS Preflight Options
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  try {
    // --- 1. AUTH ROUTES ---
    if (pathname === '/api/auth/login' && method === 'POST') {
      const { email, password } = await getJsonBody(req);
      if (!email || !password) {
        return sendJson(res, 400, { error: 'Email and password required' });
      }

      let creds = null;
      if (pool) {
        const result = await pool.query('SELECT username, salt, hash FROM credentials WHERE LOWER(username) = LOWER($1)', [email]);
        if (result.rowCount > 0) {
          creds = result.rows[0];
        }
      } else {
        creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
      }

      if (creds && creds.username.toLowerCase() === email.toLowerCase() && verifyPassword(password, creds.salt, creds.hash)) {
        const token = crypto.randomBytes(32).toString('hex');
        sessions.set(token, {
          username: creds.username,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 Hours Session
        });
        return sendJson(res, 200, { success: true, token });
      } else {
        return sendJson(res, 401, { error: 'Invalid email or password' });
      }
    }

    // --- 2. RADIO ROUTES ---
    if (pathname === '/api/radio' && method === 'GET') {
      if (pool) {
        const result = await pool.query('SELECT url, active FROM radio WHERE id = 1');
        return sendJson(res, 200, result.rows[0]);
      } else {
        const data = fs.readFileSync(RADIO_FILE, 'utf-8');
        return sendJson(res, 200, JSON.parse(data));
      }
    }

    if (pathname === '/api/radio' && method === 'POST') {
      const user = getAuthenticatedUser(req);
      if (!user) return sendJson(res, 401, { error: 'Unauthorized' });

      const { url, active } = await getJsonBody(req);
      if (url === undefined || active === undefined) {
        return sendJson(res, 400, { error: 'url and active status are required' });
      }

      if (pool) {
        await pool.query('UPDATE radio SET url = $1, active = $2 WHERE id = 1', [url, active]);
      } else {
        fs.writeFileSync(RADIO_FILE, JSON.stringify({ url, active }, null, 2), 'utf-8');
      }
      return sendJson(res, 200, { success: true });
    }

    // --- 3. SERMONS ROUTES ---
    if (pathname === '/api/sermons' && method === 'GET') {
      if (pool) {
        const result = await pool.query('SELECT id, title, speaker, duration, thumbnail, audio_url as "audioUrl", video_url as "videoUrl", views, date, description, category FROM sermons ORDER BY date DESC');
        return sendJson(res, 200, result.rows);
      } else {
        const data = fs.readFileSync(SERMONS_FILE, 'utf-8');
        return sendJson(res, 200, JSON.parse(data));
      }
    }

    if (pathname === '/api/sermons' && method === 'POST') {
      const user = getAuthenticatedUser(req);
      if (!user) return sendJson(res, 401, { error: 'Unauthorized' });

      const s = await getJsonBody(req);
      if (!s.id || !s.title || !s.speaker) {
        return sendJson(res, 400, { error: 'Missing required sermon fields: id, title, speaker' });
      }

      if (pool) {
        await pool.query(`
          INSERT INTO sermons (id, title, speaker, duration, thumbnail, audio_url, video_url, views, date, description, category)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            speaker = EXCLUDED.speaker,
            duration = EXCLUDED.duration,
            thumbnail = EXCLUDED.thumbnail,
            audio_url = EXCLUDED.audio_url,
            video_url = EXCLUDED.video_url,
            views = EXCLUDED.views,
            date = EXCLUDED.date,
            description = EXCLUDED.description,
            category = EXCLUDED.category
        `, [s.id, s.title, s.speaker, s.duration, s.thumbnail, s.audioUrl || '', s.videoUrl || '', s.views || 0, s.date, s.description, s.category]);
      } else {
        const sermons = JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8'));
        const index = sermons.findIndex(item => item.id === s.id);
        if (index !== -1) {
          sermons[index] = s;
        } else {
          sermons.push(s);
        }
        fs.writeFileSync(SERMONS_FILE, JSON.stringify(sermons, null, 2), 'utf-8');
      }
      return sendJson(res, 200, { success: true });
    }

    if (pathname.startsWith('/api/sermons/') && method === 'DELETE') {
      const user = getAuthenticatedUser(req);
      if (!user) return sendJson(res, 401, { error: 'Unauthorized' });

      const parts = pathname.split('/');
      const sermonId = parts[3];
      if (!sermonId) return sendJson(res, 400, { error: 'Sermon ID required' });

      if (pool) {
        await pool.query('DELETE FROM sermons WHERE id = $1', [sermonId]);
      } else {
        const sermons = JSON.parse(fs.readFileSync(SERMONS_FILE, 'utf-8'));
        const filtered = sermons.filter(item => item.id !== sermonId);
        fs.writeFileSync(SERMONS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      }
      return sendJson(res, 200, { success: true });
    }

    // --- 4. BOOKS ROUTES ---
    if (pathname === '/api/books' && method === 'GET') {
      if (pool) {
        const result = await pool.query('SELECT id, title, author, cover_url as "coverUrl", description, category, download_url as "downloadUrl", read_url as "readUrl", chapters, amazon_url as "amazonUrl", selar_url as "selarUrl" FROM books ORDER BY title ASC');
        return sendJson(res, 200, result.rows);
      } else {
        const data = fs.readFileSync(BOOKS_FILE, 'utf-8');
        return sendJson(res, 200, JSON.parse(data));
      }
    }

    if (pathname === '/api/books' && method === 'POST') {
      const user = getAuthenticatedUser(req);
      if (!user) return sendJson(res, 401, { error: 'Unauthorized' });

      const b = await getJsonBody(req);
      if (!b.id || !b.title || !b.author) {
        return sendJson(res, 400, { error: 'Missing required book fields: id, title, author' });
      }

      if (pool) {
        await pool.query(`
          INSERT INTO books (id, title, author, cover_url, description, category, download_url, read_url, chapters, amazon_url, selar_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            author = EXCLUDED.author,
            cover_url = EXCLUDED.cover_url,
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            download_url = EXCLUDED.download_url,
            read_url = EXCLUDED.read_url,
            chapters = EXCLUDED.chapters,
            amazon_url = EXCLUDED.amazon_url,
            selar_url = EXCLUDED.selar_url
        `, [b.id, b.title, b.author, b.coverUrl, b.description, b.category, b.downloadUrl || '', b.readUrl || '', JSON.stringify(b.chapters || []), b.amazonUrl || '', b.selarUrl || '']);
      } else {
        const books = JSON.parse(fs.readFileSync(BOOKS_FILE, 'utf-8'));
        const index = books.findIndex(item => item.id === b.id);
        if (index !== -1) {
          books[index] = b;
        } else {
          books.push(b);
        }
        fs.writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2), 'utf-8');
      }
      return sendJson(res, 200, { success: true });
    }

    if (pathname.startsWith('/api/books/') && method === 'DELETE') {
      const user = getAuthenticatedUser(req);
      if (!user) return sendJson(res, 401, { error: 'Unauthorized' });

      const parts = pathname.split('/');
      const bookId = parts[3];
      if (!bookId) return sendJson(res, 400, { error: 'Book ID required' });

      if (pool) {
        await pool.query('DELETE FROM books WHERE id = $1', [bookId]);
      } else {
        const books = JSON.parse(fs.readFileSync(BOOKS_FILE, 'utf-8'));
        const filtered = books.filter(item => item.id !== bookId);
        fs.writeFileSync(BOOKS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      }
      return sendJson(res, 200, { success: true });
    }

    // --- 5. BLOG ROUTES ---
    if (pathname === '/api/blog' && method === 'GET') {
      if (pool) {
        const result = await pool.query('SELECT id, title, author, date, read_time as "readTime", excerpt, image_url as "imageUrl", category, content, seo_title as "seoTitle", seo_description as "seoDescription", seo_keywords as "seoKeywords", slug FROM blog_posts ORDER BY date DESC');
        return sendJson(res, 200, result.rows);
      } else {
        const data = fs.readFileSync(BLOG_POSTS_FILE, 'utf-8');
        return sendJson(res, 200, JSON.parse(data));
      }
    }

    if (pathname === '/api/blog' && method === 'POST') {
      const user = getAuthenticatedUser(req);
      if (!user) return sendJson(res, 401, { error: 'Unauthorized' });

      const p = await getJsonBody(req);
      if (!p.id || !p.title || !p.author) {
        return sendJson(res, 400, { error: 'Missing required blog post fields: id, title, author' });
      }

      const slug = p.slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const seoTitle = p.seoTitle || p.title;
      const seoDescription = p.seoDescription || p.excerpt;
      const seoKeywords = p.seoKeywords || `${p.category.toLowerCase()}, christian, faith`;

      if (pool) {
        await pool.query(`
          INSERT INTO blog_posts (id, title, author, date, read_time, excerpt, image_url, category, content, seo_title, seo_description, seo_keywords, slug)
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
            slug = EXCLUDED.slug
        `, [p.id, p.title, p.author, p.date, p.readTime, p.excerpt, p.imageUrl, p.category, p.content || '', seoTitle, seoDescription, seoKeywords, slug]);
      } else {
        const posts = JSON.parse(fs.readFileSync(BLOG_POSTS_FILE, 'utf-8'));
        const index = posts.findIndex(item => item.id === p.id);
        const backfilledPost = {
          ...p,
          slug,
          seoTitle,
          seoDescription,
          seoKeywords
        };
        if (index !== -1) {
          posts[index] = backfilledPost;
        } else {
          posts.push(backfilledPost);
        }
        fs.writeFileSync(BLOG_POSTS_FILE, JSON.stringify(posts, null, 2), 'utf-8');
      }
      return sendJson(res, 200, { success: true });
    }

    if (pathname.startsWith('/api/blog/') && method === 'DELETE') {
      const user = getAuthenticatedUser(req);
      if (!user) return sendJson(res, 401, { error: 'Unauthorized' });

      const parts = pathname.split('/');
      const postId = parts[3];
      if (!postId) return sendJson(res, 400, { error: 'Blog post ID required' });

      if (pool) {
        await pool.query('DELETE FROM blog_posts WHERE id = $1', [postId]);
      } else {
        const posts = JSON.parse(fs.readFileSync(BLOG_POSTS_FILE, 'utf-8'));
        const filtered = posts.filter(item => item.id !== postId);
        fs.writeFileSync(BLOG_POSTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      }
      return sendJson(res, 200, { success: true });
    }

    // Default Fallback
    res.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
    res.end('API Route Not Found');
  } catch (error) {
    console.error('API Error:', error);
    sendJson(res, 500, { error: 'Internal Server Error', message: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Joshua Generation API Server running on port ${PORT}`);
});
