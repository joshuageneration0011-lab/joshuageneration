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

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Curated thumbnail pool
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

async function checkImageUrl(url) {
  if (!url) return false;
  // Skip unsplash — they are always good
  if (url.includes('unsplash.com')) return true;
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 SermonChecker/1.0' }
    });
    return res.ok; // 200-299
  } catch {
    return false;
  }
}

async function run() {
  try {
    // ─── STEP 1: Remove non-Apostle-Joshua sermons ─────────────────────
    console.log('='.repeat(55));
    console.log('STEP 1: Removing non-Apostle-Joshua sermons...');
    console.log('='.repeat(55));

    const nonJoshuaRes = await pool.query(
      `SELECT id, title, speaker FROM sermons 
       WHERE LOWER(speaker) NOT LIKE '%joshua%'`
    );

    if (nonJoshuaRes.rows.length === 0) {
      console.log('No non-Joshua sermons found.');
    } else {
      for (const row of nonJoshuaRes.rows) {
        console.log(`Deleting: "${row.title}" by ${row.speaker}`);
        await pool.query('DELETE FROM sermons WHERE id = $1', [row.id]);
      }
      console.log(`Deleted ${nonJoshuaRes.rows.length} sermons.`);
    }

    // ─── STEP 2: Fix broken thumbnails ─────────────────────────────────
    console.log('\n' + '='.repeat(55));
    console.log('STEP 2: Checking & fixing broken thumbnails...');
    console.log('='.repeat(55));

    const allRes = await pool.query('SELECT id, title, thumbnail FROM sermons ORDER BY date DESC');
    let checked = 0;
    let fixed = 0;
    let ok = 0;

    for (const row of allRes.rows) {
      checked++;
      const isOk = await checkImageUrl(row.thumbnail);
      if (!isOk) {
        const newThumb = pickThumbnail(row.id);
        await pool.query('UPDATE sermons SET thumbnail = $1 WHERE id = $2', [newThumb, row.id]);
        console.log(`FIXED broken thumb for: "${row.title}"`);
        console.log(`  Was: ${row.thumbnail || 'empty'}`);
        console.log(`  Now: ${newThumb}`);
        fixed++;
      } else {
        ok++;
      }
      // Small delay to be polite to external servers
      await new Promise(r => setTimeout(r, 100));
    }

    console.log(`\nChecked: ${checked} | OK: ${ok} | Fixed: ${fixed}`);

    // ─── STEP 3: Final verification ─────────────────────────────────────
    const countRes = await pool.query('SELECT COUNT(*) FROM sermons');
    console.log(`\nTotal sermons remaining: ${countRes.rows[0].count}`);

    console.log('\nDone!');
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
  } finally {
    await pool.end();
  }
}

run();
