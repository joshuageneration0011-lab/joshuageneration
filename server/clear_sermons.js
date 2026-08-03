import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = process.env.DATABASE_URL || 'postgresql://jg_admin:GgCXXuFM5H40Yj4uv@localhost:5432/joshuagen';

async function clearSermons() {
  console.log('Connecting to PostgreSQL database to clear sermons...');
  const pool = new pg.Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query('DELETE FROM sermons');
    console.log(`Successfully deleted all rows from sermons table. Rows deleted: ${res.rowCount}`);
  } catch (err) {
    console.error('Error deleting sermons from database:', err.message);
  } finally {
    await pool.end();
  }

  // Clear local json sermons file if it exists
  const localSermonsFile = path.join(__dirname, 'data', 'sermons.json');
  if (fs.existsSync(localSermonsFile)) {
    fs.writeFileSync(localSermonsFile, JSON.stringify([], null, 2), 'utf-8');
    console.log('Successfully cleared local sermons.json cache file.');
  }
}

clearSermons();
