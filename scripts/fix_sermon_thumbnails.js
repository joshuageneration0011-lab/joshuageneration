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

// Curated set of high-quality, diverse worship/sermon/ministry themed images
// All are free Unsplash photos, carefully selected to look premium and varied
const SERMON_THUMBNAILS = [
  // Worship & prayer scenes
  'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=800&q=80', // starry sky / light
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', // sunrise on water
  'https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=800&q=80', // misty mountain sunrise
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80', // open bible study
  'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&q=80', // prayer hands
  'https://images.unsplash.com/photo-1532635248-cdd3d399f56b?w=800&q=80', // cross in sunlight
  'https://images.unsplash.com/photo-1463594373317-c40da600a0e1?w=800&q=80', // dove/sky
  'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80', // open arms / light rays
  'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=800&q=80', // church interior light
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80', // person preaching / speaker
  // Nature & spiritual
  'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=800&q=80', // golden sunrise
  'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80', // mountain mist
  'https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=800&q=80', // golden light forest
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80', // green peaceful field
  'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?w=800&q=80', // dramatic sky
  // Study & scripture
  'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=800&q=80', // open book / bible
  'https://images.unsplash.com/photo-1428515613728-6b4607e44363?w=800&q=80', // candlelight reading
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&q=80', // book & light
  // Community & faith
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80', // group hands together
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80', // woman in praise / worship
];

const DEFAULT_THUMB = 'https://images.unsplash.com/photo-1499750310107-5fef28a67343?w=800&q=80';

async function fixThumbnails() {
  try {
    // Get all sermons with default or missing thumbnails
    const res = await pool.query(
      `SELECT id, title, thumbnail FROM sermons 
       WHERE thumbnail IS NULL OR thumbnail = '' OR thumbnail = $1 
       ORDER BY date DESC`,
      [DEFAULT_THUMB]
    );

    console.log(`Found ${res.rows.length} sermons needing thumbnails.`);

    let fixed = 0;
    for (const row of res.rows) {
      // Assign a thumbnail based on a hash of the ID to ensure each sermon
      // consistently gets the same image (deterministic, not random)
      let hash = 0;
      for (let i = 0; i < row.id.length; i++) {
        hash = ((hash << 5) - hash) + row.id.charCodeAt(i);
        hash |= 0;
      }
      const idx = Math.abs(hash) % SERMON_THUMBNAILS.length;
      const thumbnail = SERMON_THUMBNAILS[idx];

      await pool.query('UPDATE sermons SET thumbnail = $1 WHERE id = $2', [thumbnail, row.id]);
      console.log(`Fixed "${row.title}" -> image #${idx + 1}`);
      fixed++;
    }

    console.log(`\nFixed ${fixed} sermon thumbnails.`);
    console.log('\nVerifying final counts...');
    const verifyRes = await pool.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN thumbnail IS NOT NULL AND thumbnail != '' AND thumbnail != $1 THEN 1 ELSE 0 END) as with_real_thumb,
              SUM(CASE WHEN thumbnail IS NULL OR thumbnail = '' OR thumbnail = $1 THEN 1 ELSE 0 END) as still_missing
       FROM sermons`,
      [DEFAULT_THUMB]
    );
    const v = verifyRes.rows[0];
    console.log(`Total: ${v.total} | With thumbnail: ${v.with_real_thumb} | Still missing: ${v.still_missing}`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

fixThumbnails();
