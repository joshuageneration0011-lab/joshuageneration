import fetch from 'node-fetch';
import { Pool } from 'pg';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'joshuagen',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'joshuagen',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

const MAX_PAGES = 17;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SERMONS_DIR = path.join(PUBLIC_DIR, 'sermons');
const THUMBS_DIR = path.join(PUBLIC_DIR, 'thumbnails');

// Ensure directories exist
if (!fs.existsSync(SERMONS_DIR)) fs.mkdirSync(SERMONS_DIR, { recursive: true });
if (!fs.existsSync(THUMBS_DIR)) fs.mkdirSync(THUMBS_DIR, { recursive: true });

function getDuration(filePath) {
  try {
    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    const output = execSync(cmd).toString().trim();
    const durationSeconds = parseFloat(output);
    if (isNaN(durationSeconds)) return '00:00';
    
    const h = Math.floor(durationSeconds / 3600);
    const m = Math.floor((durationSeconds % 3600) / 60);
    const s = Math.floor(durationSeconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } catch (err) {
    console.error(`Error getting duration for ${filePath}:`, err.message);
    return '00:00';
  }
}

function resizeImage(inputPath, outputPath) {
  try {
    // Attempt to use ImageMagick or ffmpeg to resize the image to 800px width
    // Ffmpeg is highly likely to be installed since we use ffprobe
    execSync(`ffmpeg -y -i "${inputPath}" -vf scale=800:-1 "${outputPath}"`, { stdio: 'ignore' });
    if (fs.existsSync(outputPath)) {
      return true;
    }
  } catch (e) {
    // If ffmpeg fails, just return false, we'll use original
  }
  return false;
}

async function run() {
  console.log(`Starting import from page ${MAX_PAGES} down to 1...`);
  
  for (let page = MAX_PAGES; page >= 1; page--) {
    console.log(`\n=== Fetching Page ${page} ===`);
    try {
      const res = await fetch(`https://joshuasgeneration.net/wp-json/wp/v2/sermon?page=${page}&per_page=10`);
      if (!res.ok) {
        console.error(`Failed to fetch page ${page}: ${res.statusText}`);
        continue;
      }
      
      const sermons = await res.json();
      console.log(`Found ${sermons.length} sermons on page ${page}`);
      
      // Process each sermon in the page in reverse order to maintain chronological order
      for (let i = sermons.length - 1; i >= 0; i--) {
        const item = sermons[i];
        const title = item.title?.rendered || 'Untitled';
        console.log(`\nProcessing: ${title}`);
        
        // Extract audio URL
        let audioUrl = '';
        const content = item.content?.rendered || '';
        const audioMatch = content.match(/href="([^"]+\.mp3)"/i);
        if (audioMatch) {
          audioUrl = audioMatch[1];
        } else {
          console.log(`No audio found for "${title}". Skipping.`);
          continue;
        }
        
        // Extract thumbnail URL
        let thumbUrl = '';
        if (item.yoast_head_json?.og_image && item.yoast_head_json.og_image.length > 0) {
          thumbUrl = item.yoast_head_json.og_image[0].url;
        } else if (item.thumbnailUrl) {
          thumbUrl = item.thumbnailUrl;
        }
        
        // Download Audio
        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const audioFileName = `${safeTitle}_${Date.now()}.mp3`;
        const localAudioPath = path.join(SERMONS_DIR, audioFileName);
        
        console.log(`Downloading audio: ${audioUrl}`);
        try {
          execSync(`curl.exe -L -o "${localAudioPath}" "${audioUrl}"`);
        } catch(e) {
          try {
            execSync(`curl -L -o "${localAudioPath}" "${audioUrl}"`);
          } catch(e2) {
            console.error('Failed to download audio:', e2.message);
            continue;
          }
        }
        
        const duration = getDuration(localAudioPath);
        console.log(`Duration: ${duration}`);
        
        // Download & process thumbnail
        let localThumbRelPath = '';
        if (thumbUrl) {
          const thumbExt = path.extname(thumbUrl).split('?')[0] || '.jpg';
          const rawThumbPath = path.join(THUMBS_DIR, `raw_${safeTitle}${thumbExt}`);
          const optimizedThumbName = `${safeTitle}_${Date.now()}.jpg`;
          const optimizedThumbPath = path.join(THUMBS_DIR, optimizedThumbName);
          
          console.log(`Downloading thumbnail: ${thumbUrl}`);
          try {
            try {
              execSync(`curl.exe -L -o "${rawThumbPath}" "${thumbUrl}"`);
            } catch(e) {
              execSync(`curl -L -o "${rawThumbPath}" "${thumbUrl}"`);
            }
            
            // Resize with ffmpeg
            console.log('Optimizing thumbnail...');
            const success = resizeImage(rawThumbPath, optimizedThumbPath);
            if (success) {
              localThumbRelPath = `/thumbnails/${optimizedThumbName}`;
              try { fs.unlinkSync(rawThumbPath); } catch(e){} // Cleanup raw
            } else {
              // fallback to raw
              const finalThumbName = `${safeTitle}_${Date.now()}${thumbExt}`;
              const finalThumbPath = path.join(THUMBS_DIR, finalThumbName);
              fs.renameSync(rawThumbPath, finalThumbPath);
              localThumbRelPath = `/thumbnails/${finalThumbName}`;
            }
          } catch (e) {
            console.error('Failed to download/process thumbnail:', e.message);
          }
        }
        
        // Insert into DB
        const sermonId = crypto.randomUUID();
        const description = content.replace(/<[^>]+>/g, '').substring(0, 500); // Strip HTML
        
        await pool.query(
          `INSERT INTO sermons (id, title, speaker, duration, thumbnail, views, downloads, date, description, category) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9)`,
          [sermonId, title, 'Apostle Joshua Iyemifokhae', duration, localThumbRelPath || '', 0, 0, description, 'Sunday Service']
        );
        
        const audioId = crypto.randomUUID();
        await pool.query(
          `INSERT INTO sermon_audios (id, sermon_id, title, audio_url, duration)
           VALUES ($1, $2, $3, $4, $5)`,
          [audioId, sermonId, 'Full Sermon', `/sermons/${audioFileName}`, duration]
        );
        
        console.log(`Successfully imported: ${title}`);
      }
    } catch (err) {
      console.error(`Error on page ${page}:`, err.message);
    }
  }
  
  console.log('\nImport complete!');
  process.exit(0);
}

run();
