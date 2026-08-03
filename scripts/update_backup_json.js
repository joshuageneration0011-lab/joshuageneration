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

async function run() {
  try {
    const r = await pool.query(
      `SELECT id, title, speaker, duration, thumbnail, views, downloads, date, 
              description, category, video_url as "videoUrl", audio_url as "audioUrl", audios 
       FROM sermons ORDER BY date DESC`
    );
    const sermons = r.rows.map(row => ({ ...row, audios: row.audios || [] }));

    const dataPath = path.resolve(__dirname, '../data/sermons.json');
    fs.writeFileSync(dataPath, JSON.stringify(sermons, null, 2), 'utf-8');

    const defaultsPath = path.resolve(__dirname, '../default_data.json');
    if (fs.existsSync(defaultsPath)) {
      const defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf-8'));
      defaults.sermons = sermons;
      fs.writeFileSync(defaultsPath, JSON.stringify(defaults, null, 2), 'utf-8');
    }

    console.log(`Updated backup files with ${sermons.length} sermons and accurate durations.`);

    // Quick sample of durations
    console.log('\nSample durations:');
    sermons.slice(0, 10).forEach(s => console.log(`  ${s.duration}  "${s.title}"`));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
