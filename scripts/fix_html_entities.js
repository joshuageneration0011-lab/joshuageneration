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

function decodeHtmlEntities(str) {
  return str
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8230;/g, '...')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

async function fixTitles() {
  try {
    const res = await pool.query('SELECT id, title FROM sermons');
    let fixedCount = 0;
    
    for (const row of res.rows) {
      const cleaned = decodeHtmlEntities(row.title);
      if (cleaned !== row.title) {
        await pool.query('UPDATE sermons SET title = $1 WHERE id = $2', [cleaned, row.id]);
        console.log(`Fixed: "${row.title}" -> "${cleaned}"`);
        fixedCount++;
      }
    }
    
    console.log(`\nFixed ${fixedCount} titles.`);
    const count = await pool.query('SELECT COUNT(*) FROM sermons');
    console.log(`Total sermons in database: ${count.rows[0].count}`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

fixTitles();
