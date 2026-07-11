import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function syncData() {
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL found. Skipping sync.');
    process.exit(0);
  }
  
  console.log('Starting automated data synchronization to Postgres (FULL SYNC)...');

  // 1. Sync Blog Posts
  const blogFile = path.join(__dirname, 'data', 'blog_posts.json');
  if (fs.existsSync(blogFile)) {
    try {
      const posts = JSON.parse(fs.readFileSync(blogFile, 'utf-8'));
      const jsonIds = posts.map(p => p.id.toString());
      
      // Delete missing
      const dbPosts = await pool.query('SELECT id FROM blog_posts');
      for (const row of dbPosts.rows) {
        if (!jsonIds.includes(row.id.toString())) {
          await pool.query('DELETE FROM blog_posts WHERE id = $1', [row.id]);
          console.log(`Deleted blog post: ${row.id}`);
        }
      }

      console.log(`Syncing ${posts.length} blog posts...`);
      for (const p of posts) {
        const check = await pool.query('SELECT id FROM blog_posts WHERE id = $1', [p.id]);
        if (check.rowCount === 0) {
          await pool.query(
            `INSERT INTO blog_posts (id, title, author, date, read_time, excerpt, image_url, category, content, seo_title, seo_description, seo_keywords, slug)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [p.id, p.title, p.author, p.date, p.readTime || p.read_time, p.excerpt, p.imageUrl || p.image_url, p.category, p.content, p.seoTitle || p.seo_title, p.seoDescription || p.seo_description, p.seoKeywords || p.seo_keywords, p.slug]
          );
        } else {
          await pool.query(
            `UPDATE blog_posts SET title=$1, author=$2, date=$3, read_time=$4, excerpt=$5, image_url=$6, category=$7, content=$8, seo_title=$9, seo_description=$10, seo_keywords=$11, slug=$12 WHERE id=$13`,
            [p.title, p.author, p.date, p.readTime || p.read_time, p.excerpt, p.imageUrl || p.image_url, p.category, p.content, p.seoTitle || p.seo_title, p.seoDescription || p.seo_description, p.seoKeywords || p.seo_keywords, p.slug, p.id]
          );
        }
      }
      console.log('Blog posts synchronized.');
    } catch (e) {
      console.error('Failed to sync blog posts:', e);
    }
  }

  // 2. Sync Sermons
  const sermonsFile = path.join(__dirname, 'data', 'sermons.json');
  if (fs.existsSync(sermonsFile)) {
    try {
      const sermons = JSON.parse(fs.readFileSync(sermonsFile, 'utf-8'));
      const jsonIds = sermons.map(s => s.id.toString());
      
      const dbSermons = await pool.query('SELECT id FROM sermons');
      for (const row of dbSermons.rows) {
        if (!jsonIds.includes(row.id.toString())) {
          await pool.query('DELETE FROM sermons WHERE id = $1', [row.id]);
          console.log(`Deleted sermon: ${row.id}`);
        }
      }

      console.log(`Syncing ${sermons.length} sermons...`);
      for (const s of sermons) {
        const check = await pool.query('SELECT id FROM sermons WHERE id = $1', [s.id]);
        if (check.rowCount === 0) {
          await pool.query(
            `INSERT INTO sermons (id, title, speaker, duration, thumbnail, views, downloads, date, description, category, video_url, audio_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [s.id, s.title, s.speaker, s.duration, s.thumbnail, s.views || 0, s.downloads || 0, s.date, s.description, s.category, s.videoUrl || s.video_url, s.audioUrl || s.audio_url]
          );
        } else {
          await pool.query(
            `UPDATE sermons SET title=$1, speaker=$2, duration=$3, thumbnail=$4, views=$5, downloads=$6, date=$7, description=$8, category=$9, video_url=$10, audio_url=$11 WHERE id=$12`,
            [s.title, s.speaker, s.duration, s.thumbnail, s.views || 0, s.downloads || 0, s.date, s.description, s.category, s.videoUrl || s.video_url, s.audioUrl || s.audio_url, s.id]
          );
        }
      }
      console.log('Sermons synchronized.');
    } catch (e) {
      console.error('Failed to sync sermons:', e);
    }
  }

  // 3. Sync Books
  const booksFile = path.join(__dirname, 'data', 'books.json');
  if (fs.existsSync(booksFile)) {
    try {
      const books = JSON.parse(fs.readFileSync(booksFile, 'utf-8'));
      const jsonIds = books.map(b => b.id.toString());
      
      const dbBooks = await pool.query('SELECT id FROM books');
      for (const row of dbBooks.rows) {
        if (!jsonIds.includes(row.id.toString())) {
          await pool.query('DELETE FROM books WHERE id = $1', [row.id]);
          console.log(`Deleted book: ${row.id}`);
        }
      }

      console.log(`Syncing ${books.length} books...`);
      for (const b of books) {
        const check = await pool.query('SELECT id FROM books WHERE id = $1', [b.id]);
        if (check.rowCount === 0) {
          await pool.query(
            `INSERT INTO books (id, title, author, cover_url, description, category, download_url, rating, amazon_url, selar_url, pages, chapters)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [b.id, b.title, b.author, b.coverUrl || b.cover_url, b.description, b.category, b.downloadUrl || b.download_url, b.rating || 4.8, b.amazonUrl || b.amazon_url || '', b.selarUrl || b.selar_url || '', b.pages || 150, JSON.stringify(b.chapters || [])]
          );
        } else {
          await pool.query(
            `UPDATE books SET title=$1, author=$2, cover_url=$3, description=$4, category=$5, download_url=$6, rating=$7, amazon_url=$8, selar_url=$9, pages=$10, chapters=$11 WHERE id=$12`,
            [b.title, b.author, b.coverUrl || b.cover_url, b.description, b.category, b.downloadUrl || b.download_url, b.rating || 4.8, b.amazonUrl || b.amazon_url || '', b.selarUrl || b.selar_url || '', b.pages || 150, JSON.stringify(b.chapters || []), b.id]
          );
        }
      }
      console.log('Books synchronized.');
    } catch (e) {
      console.error('Failed to sync books:', e);
    }
  }

  // 4. Sync Events
  const eventsFile = path.join(__dirname, 'data', 'events.json');
  if (fs.existsSync(eventsFile)) {
    try {
      const events = JSON.parse(fs.readFileSync(eventsFile, 'utf-8'));
      const jsonIds = events.map(ev => ev.id.toString());
      
      const dbEvents = await pool.query('SELECT id FROM events');
      for (const row of dbEvents.rows) {
        if (!jsonIds.includes(row.id.toString())) {
          await pool.query('DELETE FROM events WHERE id = $1', [row.id]);
          console.log(`Deleted event: ${row.id}`);
        }
      }

      console.log(`Syncing ${events.length} events...`);
      for (const ev of events) {
        const check = await pool.query('SELECT id FROM events WHERE id = $1', [ev.id]);
        if (check.rowCount === 0) {
          await pool.query(
            `INSERT INTO events (id, title, date, time, location, description, image_url, type, is_featured, registration_link)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [ev.id, ev.title, ev.date, ev.time, ev.location, ev.description, ev.imageUrl || ev.image_url, ev.type, ev.isFeatured || ev.is_featured || false, ev.registrationLink || ev.registration_link || '']
          );
        } else {
          await pool.query(
            `UPDATE events SET title=$1, date=$2, time=$3, location=$4, description=$5, image_url=$6, type=$7, is_featured=$8, registration_link=$9 WHERE id=$10`,
            [ev.title, ev.date, ev.time, ev.location, ev.description, ev.imageUrl || ev.image_url, ev.type, ev.isFeatured || ev.is_featured || false, ev.registrationLink || ev.registration_link || '', ev.id]
          );
        }
      }
      console.log('Events synchronized.');
    } catch (e) {
      console.error('Failed to sync events:', e);
    }
  }

  console.log('Data synchronization complete.');
  process.exit(0);
}

syncData().catch((err) => {
  console.error('Sync process failed:', err);
  process.exit(1);
});
