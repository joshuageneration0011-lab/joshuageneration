import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = process.env.DATABASE_URL;

async function resetViews() {
  if (dbUrl) {
    console.log('Connecting to PostgreSQL database to reset sermon views...');
    const pool = new pg.Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });

    try {
      const res = await pool.query('UPDATE sermons SET views = 0');
      console.log(`Successfully reset views in database. Rows updated: ${res.rowCount}`);
    } catch (err) {
      console.error('Error resetting database sermon views:', err.message);
    } finally {
      await pool.end();
    }
  } else {
    console.log('No DATABASE_URL configured. Skipping database view reset.');
  }

  // Reset local json sermons file if it exists
  const localSermonsFile = path.join(__dirname, 'data', 'sermons.json');
  if (fs.existsSync(localSermonsFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(localSermonsFile, 'utf-8'));
      if (Array.isArray(data)) {
        data.forEach(sermon => {
          sermon.views = 0;
        });
        fs.writeFileSync(localSermonsFile, JSON.stringify(data, null, 2), 'utf-8');
        console.log('Successfully reset views in local sermons.json cache file.');
      }
    } catch (err) {
      console.error('Error resetting local sermons.json views:', err.message);
    }
  }
}

resetViews();
