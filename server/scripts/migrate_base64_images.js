import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = "postgresql://jg_admin:GgCXXuFM5H40Yj4uv@localhost:5432/joshuagen";
const uploadsDir = "/var/www/joshuageneration/server/data/uploads";

async function run() {
  const pool = new pg.Pool({ connectionString: dbUrl });
  console.log("Connected to database. Starting base64 image migration...");

  // 1. Migrate blog posts
  try {
    const blogRes = await pool.query("SELECT id, title, image_url FROM blog_posts WHERE image_url LIKE 'data:%'");
    console.log(`Found ${blogRes.rows.length} blog posts with base64 images.`);

    for (const row of blogRes.rows) {
      const match = row.image_url.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!match) {
        console.log(`Skipping blog post ${row.id} - invalid data URI format`);
        continue;
      }
      let ext = match[1];
      if (ext === 'jpeg') ext = 'jpg';
      if (ext === 'svg+xml') ext = 'svg';
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      const filename = `base64_blog_${row.id}_${Date.now()}.${ext}`;
      const destPath = path.join(uploadsDir, filename);
      fs.writeFileSync(destPath, buffer);
      console.log(`Saved image for blog post "${row.title}" to ${destPath}`);

      const newUrl = `/api/uploads/${filename}`;
      await pool.query("UPDATE blog_posts SET image_url = $1 WHERE id = $2", [newUrl, row.id]);
      console.log(`Updated blog post ${row.id} image_url to ${newUrl}`);
    }
  } catch (err) {
    console.error("Error migrating blog posts:", err);
  }

  // 2. Migrate books
  try {
    const booksRes = await pool.query("SELECT id, title, cover_url FROM books WHERE cover_url LIKE 'data:%'");
    console.log(`Found ${booksRes.rows.length} books with base64 covers.`);

    for (const row of booksRes.rows) {
      const match = row.cover_url.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!match) {
        console.log(`Skipping book ${row.id} - invalid data URI format`);
        continue;
      }
      let ext = match[1];
      if (ext === 'jpeg') ext = 'jpg';
      if (ext === 'svg+xml') ext = 'svg';
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      const filename = `base64_book_${row.id}_${Date.now()}.${ext}`;
      const destPath = path.join(uploadsDir, filename);
      fs.writeFileSync(destPath, buffer);
      console.log(`Saved cover for book "${row.title}" to ${destPath}`);

      const newUrl = `/api/uploads/${filename}`;
      await pool.query("UPDATE books SET cover_url = $1 WHERE id = $2", [newUrl, row.id]);
      console.log(`Updated book ${row.id} cover_url to ${newUrl}`);
    }
  } catch (err) {
    console.error("Error migrating books:", err);
  }

  await pool.end();
  console.log("Migration finished.");
}

run();
