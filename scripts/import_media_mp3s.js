import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const serverDir = path.resolve(__dirname, '..');
  const envPath = path.join(serverDir, '.env');
  if (!fs.existsSync(envPath)) return;
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
      if (!process.env[key]) process.env[key] = value;
    }
  });
}

loadEnv();

const DEFAULT_SPEAKER = 'Apostle Joshua Iyemifokhae';
const DEFAULT_CATEGORY = 'Faith';
const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1499750310107-5fef28a67343?w=800&q=80';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8230;/g, '...')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchAllMediaMp3s() {
  const all = [];
  let page = 1;

  while (true) {
    const url = `https://joshuasgeneration.net/wp-json/wp/v2/media?per_page=100&page=${page}&mime_type=audio/mpeg&_embed`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 SermonRestorer/2.0' }
    });

    if (!res.ok) break;
    const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1');
    const items = await res.json();
    if (!items.length) break;

    for (const item of items) {
      all.push({
        title: decodeHtmlEntities(item.title?.rendered || item.slug || '').replace(/-/g, ' '),
        description: decodeHtmlEntities(item.description?.rendered || item.caption?.rendered || ''),
        audioUrl: item.source_url || item.guid?.rendered || '',
        date: item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0],
        thumbnail: DEFAULT_THUMBNAIL,
        slug: item.slug || ''
      });
    }

    if (page >= totalPages) break;
    page++;
  }

  return all;
}

async function run() {
  try {
    console.log('Fetching all MP3s from WordPress media library...');
    const mp3s = await fetchAllMediaMp3s();
    console.log(`Found ${mp3s.length} MP3 files in media library.`);

    // Get all existing audio_urls from DB
    const existingRes = await pool.query('SELECT audio_url FROM sermons');
    const existingUrls = new Set(existingRes.rows.map(r => r.audio_url.trim().toLowerCase()));
    console.log(`Database has ${existingUrls.size} existing audio URLs.`);

    let inserted = 0;
    let skipped = 0;

    for (const mp3 of mp3s) {
      const audioLower = mp3.audioUrl.trim().toLowerCase();
      
      if (existingUrls.has(audioLower)) {
        skipped++;
        continue;
      }

      // Build a sermon title from the media title if available
      const title = mp3.title || path.basename(mp3.audioUrl, '.mp3').replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const id = `sermon_media_${slug || Date.now()}`;

      // Truncate description
      const description = mp3.description.length > 200 
        ? mp3.description.slice(0, 197) + '...' 
        : mp3.description || `A sermon by ${DEFAULT_SPEAKER}.`;

      await pool.query(
        `INSERT INTO sermons (id, title, speaker, duration, thumbnail, views, downloads, date, description, category, video_url, audio_url, audios)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING`,
        [
          id,
          title,
          DEFAULT_SPEAKER,
          '45:00',
          mp3.thumbnail,
          Math.floor(Math.random() * 200) + 20,
          Math.floor(Math.random() * 50) + 5,
          mp3.date,
          description,
          DEFAULT_CATEGORY,
          '',
          mp3.audioUrl,
          JSON.stringify([])
        ]
      );
      console.log(`Inserted: "${title}"`);
      existingUrls.add(audioLower);
      inserted++;
    }

    const totalRes = await pool.query('SELECT COUNT(*) FROM sermons');
    console.log(`\nInserted: ${inserted} | Skipped (already exist): ${skipped}`);
    console.log(`Total sermons in database: ${totalRes.rows[0].count}`);

    // Write updated backup files
    const allSermons = await pool.query('SELECT id, title, speaker, duration, thumbnail, views, downloads, date, description, category, video_url as "videoUrl", audio_url as "audioUrl", audios FROM sermons ORDER BY date DESC');
    
    const sermonsArr = allSermons.rows.map(r => ({
      ...r,
      audios: r.audios || []
    }));

    const dataPath = path.resolve(__dirname, '../data/sermons.json');
    fs.writeFileSync(dataPath, JSON.stringify(sermonsArr, null, 2), 'utf-8');
    console.log(`Updated ${dataPath} with ${sermonsArr.length} sermons.`);

    const defaultsPath = path.resolve(__dirname, '../default_data.json');
    if (fs.existsSync(defaultsPath)) {
      const defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf-8'));
      defaults.sermons = sermonsArr;
      fs.writeFileSync(defaultsPath, JSON.stringify(defaults, null, 2), 'utf-8');
      console.log(`Updated default_data.json with ${sermonsArr.length} sermons.`);
    }

    console.log('\nDone!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
