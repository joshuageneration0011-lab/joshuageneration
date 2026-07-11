import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_SPEAKER = 'Apostle Joshua Iyemifokhae';
const DEFAULT_CATEGORY = 'Faith';

// Curated pool of high-quality worship/sermon-themed images (used as fallback)
const SERMON_THUMBNAILS = [
  'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  'https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=800&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
  'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&q=80',
  'https://images.unsplash.com/photo-1532635248-cdd3d399f56b?w=800&q=80',
  'https://images.unsplash.com/photo-1463594373317-c40da600a0e1?w=800&q=80',
  'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80',
  'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=800&q=80',
  'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80',
  'https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=800&q=80',
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80',
  'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?w=800&q=80',
  'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=800&q=80',
  'https://images.unsplash.com/photo-1428515613728-6b4607e44363?w=800&q=80',
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&q=80',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
];

function pickThumbnail(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return SERMON_THUMBNAILS[Math.abs(hash) % SERMON_THUMBNAILS.length];
}

// Helper to load environment variables from server/.env
function loadEnv() {
  const serverDir = path.resolve(__dirname, '..');
  const envPath = path.join(serverDir, '.env');
  if (!fs.existsSync(envPath)) {
    console.warn('.env file not found in server directory. Using process.env.');
    return;
  }
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
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

loadEnv();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL environment variable is missing.');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

// Helper to strip HTML tags and decode HTML entities
function cleanHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
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

// Helper to extract MP3 URLs from content or post attributes
function extractAudioUrl(post) {
  const contentHtml = post.content?.rendered || '';
  const excerptHtml = post.excerpt?.rendered || '';
  
  // Look for src="..." or href="..." containing .mp3
  const srcMatch = contentHtml.match(/(?:src|href)="([^"]+\.mp3)"/i) || excerptHtml.match(/(?:src|href)="([^"]+\.mp3)"/i);
  if (srcMatch) return srcMatch[1];

  // Try custom fields/metadata if present
  if (post.meta && (post.meta.sermon_audio || post.meta.audio_url)) {
    return post.meta.sermon_audio || post.meta.audio_url;
  }

  return '';
}

async function restoreSermons() {
  try {
    const wpUrl = 'https://joshuasgeneration.net/wp-json/wp/v2/sermon?per_page=100&_embed';
    console.log(`📡 Fetching all sermons from WordPress CPT REST API: ${wpUrl}...`);
    
    const response = await fetch(wpUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    
    const posts = await response.json();
    console.log(`✅ Loaded ${posts.length} posts from WordPress.`);
    
    const sermons = [];
    
    for (const post of posts) {
      const title = cleanHtml(post.title.rendered);
      const audioUrl = extractAudioUrl(post);
      
      if (!audioUrl) {
        console.warn(`⚠️ Warning: Sermon "${title}" does not have an audio URL. Skipping.`);
        continue;
      }
      
      // Get featured image URL from the embedded data, fall back to curated pool
      let thumbnail = pickThumbnail(uniqueId);
      const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
      if (featuredMedia && featuredMedia.source_url) {
        thumbnail = featuredMedia.source_url;
      }
      
      // Truncate clean description
      const fullDesc = cleanHtml(post.excerpt.rendered || post.content.rendered);
      const description = fullDesc.length > 200 ? fullDesc.slice(0, 197) + '...' : fullDesc;
      
      const slug = post.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const uniqueId = `sermon_${slug || post.id}`;
      
      sermons.push({
        id: uniqueId,
        title: title,
        speaker: DEFAULT_SPEAKER,
        duration: '45:00', // Default duration representation
        thumbnail: thumbnail,
        views: Math.floor(Math.random() * 500) + 50, // Simulated initial views
        downloads: Math.floor(Math.random() * 100) + 10, // Simulated initial downloads
        date: post.date ? post.date.split('T')[0] : new Date().toISOString().split('T')[0],
        description: description,
        category: DEFAULT_CATEGORY,
        audioUrl: audioUrl,
        videoUrl: '',
        audios: []
      });
    }

    console.log(`🎵 Parsed ${sermons.length} valid sermons with audio files.`);

    // 1. Write to database (PostgreSQL)
    console.log('Inserting/updating records in PostgreSQL database...');
    for (const s of sermons) {
      const checkRes = await pool.query('SELECT 1 FROM sermons WHERE id = $1', [s.id]);
      if (checkRes.rowCount === 0) {
        await pool.query(
          `INSERT INTO sermons (id, title, speaker, duration, thumbnail, views, downloads, date, description, category, video_url, audio_url, audios)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            s.id,
            s.title,
            s.speaker,
            s.duration,
            s.thumbnail,
            s.views,
            s.downloads,
            s.date,
            s.description,
            s.category,
            s.videoUrl || '',
            s.audioUrl || '',
            JSON.stringify(s.audios || [])
          ]
        );
        console.log(`Inserted: "${s.title}"`);
      } else {
        // Update to make sure it matches (especially paths and urls)
        await pool.query(
          `UPDATE sermons 
           SET title = $1, speaker = $2, duration = $3, thumbnail = $4, date = $5, description = $6, category = $7, audio_url = $8
           WHERE id = $9`,
          [
            s.title,
            s.speaker,
            s.duration,
            s.thumbnail,
            s.date,
            s.description,
            s.category,
            s.audioUrl,
            s.id
          ]
        );
        console.log(`Updated: "${s.title}"`);
      }
    }

    // Verify count in PostgreSQL
    const dbCountRes = await pool.query('SELECT COUNT(*) FROM sermons');
    console.log(`\n🎉 PostgreSQL count is now: ${dbCountRes.rows[0].count}`);

    // 2. Overwrite fallback files
    const localSermonsPath = path.resolve(__dirname, '../data/sermons.json');
    const localDefaultsPath = path.resolve(__dirname, '../default_data.json');

    console.log(`\nWriting full sermons array to ${localSermonsPath}...`);
    fs.writeFileSync(localSermonsPath, JSON.stringify(sermons, null, 2), 'utf-8');

    if (fs.existsSync(localDefaultsPath)) {
      console.log(`Writing full sermons array to ${localDefaultsPath}...`);
      try {
        const defaults = JSON.parse(fs.readFileSync(localDefaultsPath, 'utf-8'));
        defaults.sermons = sermons;
        fs.writeFileSync(localDefaultsPath, JSON.stringify(defaults, null, 2), 'utf-8');
      } catch (err) {
        console.error('Failed to update default_data.json:', err.message);
      }
    }

    console.log('\n🎉 Restoration process completed successfully!');

  } catch (error) {
    console.error('❌ Restoration failed:', error.message);
  } finally {
    await pool.end();
    console.log('Database connection closed.');
  }
}

restoreSermons();
