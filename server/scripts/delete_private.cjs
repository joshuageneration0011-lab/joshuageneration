const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  console.log('Finding Sons & Daughters Private category...');
  const catRes = await fetch('https://joshuasgeneration.net/wp-json/wp/v2/sermons-category?slug=sons-daughters-private');
  const cats = await catRes.json();
  
  if (!cats || cats.length === 0) {
    console.log('Category not found!');
    process.exit(1);
  }
  
  const catId = cats[0].id;
  console.log(`Category ID: ${catId}`);
  
  const sermonRes = await fetch(`https://joshuasgeneration.net/wp-json/wp/v2/sermon?sermons-category=${catId}&per_page=100`);
  const sermons = await sermonRes.json();
  
  console.log(`Found ${sermons.length} private sermons. Deleting them from DB...`);
  
  let deletedCount = 0;
  for (const s of sermons) {
    const title = s.title.rendered;
    
    // Find it in DB
    const dbRes = await pool.query('SELECT id, audio_url, thumbnail FROM sermons WHERE title = $1', [title]);
    if (dbRes.rows.length > 0) {
      const dbSermon = dbRes.rows[0];
      
      // Delete from DB
      await pool.query('DELETE FROM sermons WHERE id = $1', [dbSermon.id]);
      
      // Delete files
      try {
        if (dbSermon.audio_url) {
          const audioPath = path.join(__dirname, '..', 'public', dbSermon.audio_url);
          if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        }
        if (dbSermon.thumbnail) {
          const thumbPath = path.join(__dirname, '..', 'public', dbSermon.thumbnail);
          if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        }
      } catch (e) {
        console.error(`Failed to delete files for ${title}:`, e.message);
      }
      
      console.log(`Deleted: ${title}`);
      deletedCount++;
    }
  }
  
  console.log(`Successfully removed ${deletedCount} private sermons from the live database.`);
  process.exit(0);
}

run();
