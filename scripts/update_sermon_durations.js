import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
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

// Format seconds into H:MM:SS or MM:SS
function formatDuration(totalSeconds) {
  const secs = Math.round(parseFloat(totalSeconds));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Get duration via ffprobe — reads only the container headers, not the full file
async function getDurationFromUrl(audioUrl) {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      audioUrl
    ], { timeout: 30000 });

    const data = JSON.parse(stdout);
    const durationSecs = data?.format?.duration;
    if (durationSecs && parseFloat(durationSecs) > 0) {
      return formatDuration(durationSecs);
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function run() {
  try {
    // Get all sermons — prioritise ones still with the default duration
    const res = await pool.query(
      `SELECT id, title, audio_url, duration FROM sermons 
       WHERE audio_url IS NOT NULL AND audio_url != ''
       ORDER BY 
         CASE WHEN duration = '45:00' THEN 0 ELSE 1 END,
         date DESC`
    );

    const total = res.rows.length;
    console.log(`Found ${total} sermons to process.\n`);

    let updated = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < res.rows.length; i++) {
      const row = res.rows[i];
      const num = `[${i + 1}/${total}]`;

      // Skip sermons that already have an accurate custom duration
      // (anything not exactly '45:00' was likely set deliberately or previously probed)
      if (row.duration && row.duration !== '45:00' && row.duration !== '') {
        console.log(`${num} SKIP  "${row.title}" — already has duration: ${row.duration}`);
        skipped++;
        continue;
      }

      process.stdout.write(`${num} Probing "${row.title}"... `);
      const duration = await getDurationFromUrl(row.audio_url);

      if (duration) {
        await pool.query('UPDATE sermons SET duration = $1 WHERE id = $2', [duration, row.id]);
        console.log(`=> ${duration}`);
        updated++;
      } else {
        console.log(`FAILED (keeping ${row.duration})`);
        failed++;
      }

      // Small pause between requests to avoid hammering the WP server
      await new Promise(r => setTimeout(r, 300));
    }

    console.log(`\n${'='.repeat(55)}`);
    console.log(`Done! Updated: ${updated} | Failed: ${failed} | Skipped: ${skipped}`);
    console.log(`Total sermons: ${total}`);

  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
