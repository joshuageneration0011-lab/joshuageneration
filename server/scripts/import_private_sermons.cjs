const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WP_API_URL = 'https://joshuasgeneration.net/wp-json/wp/v2/sermon?sermons-category=199&per_page=100';
const ROOT_DIR = path.join(__dirname, '..', '..');
const SERMONS_DIR = path.join(ROOT_DIR, 'public', 'sermons');
const THUMBS_DIR = path.join(ROOT_DIR, 'public', 'thumbnails');
const OUTPUT_FILE = path.join(__dirname, '..', 'private_sermons.json');

// Ensure directories exist
if (!fs.existsSync(SERMONS_DIR)) fs.mkdirSync(SERMONS_DIR, { recursive: true });
if (!fs.existsSync(THUMBS_DIR)) fs.mkdirSync(THUMBS_DIR, { recursive: true });

function getDuration(filePath) {
  try {
    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    const output = execSync(cmd).toString().trim();
    const durationSeconds = parseFloat(output);
    if (!isNaN(durationSeconds)) {
      return formatSecondsToDuration(durationSeconds);
    }
  } catch (err) {
    // ffprobe failed
  }
  
  try {
    const cmd = `afinfo "${filePath}"`;
    const output = execSync(cmd).toString().trim();
    const match = output.match(/estimated duration:\s+([\d.]+)\s+sec/i);
    if (match) {
      const durationSeconds = parseFloat(match[1]);
      if (!isNaN(durationSeconds)) {
        return formatSecondsToDuration(durationSeconds);
      }
    }
  } catch (err) {
    // afinfo failed
  }

  return '00:00';
}

function parseDurationToSeconds(durationStr) {
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

function formatSecondsToDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function resizeImage(inputPath, outputPath) {
  try {
    execSync(`ffmpeg -y -i "${inputPath}" -vf scale=800:-1 "${outputPath}"`, { stdio: 'ignore' });
    if (fs.existsSync(outputPath)) {
      return true;
    }
  } catch (e) {
    // Ffmpeg resizing failed, return false to fallback to original
  }
  return false;
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "-")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&rsquo;/g, "'")
    .replace(/&ndash;/g, "-");
}

async function run() {
  console.log('Fetching private sermons from WordPress...');
  try {
    const res = await fetch(WP_API_URL);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    
    const items = await res.json();
    console.log(`Found ${items.length} private sermons to process.`);
    
    const privateSermons = [];
    
    for (const item of items) {
      let rawTitle = item.title?.rendered || 'Untitled';
      // Strip any anchor tags inside the title first (e.g. [Download Here] links)
      rawTitle = rawTitle.replace(/<a\s+[^>]*>[\s\S]*?<\/a>/gi, '');
      const title = decodeHtmlEntities(rawTitle.replace(/<[^>]+>/g, '')).trim();
      console.log(`\nProcessing: "${title}"`);
      
      const content = item.content?.rendered || '';
      
      // Parse all mp3 download links
      const audioMatches = [];
      const regex = /<a\s+[^>]*href="([^"]+\.mp3)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = regex.exec(content)) !== null) {
        audioMatches.push({
          url: match[1],
          text: match[2].replace(/<[^>]+>/g, '').trim()
        });
      }
      
      if (audioMatches.length === 0) {
        console.log(`No audio links found for "${title}". Skipping.`);
        continue;
      }
      
      const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      // Process and download each audio track
      const audiosList = [];
      let totalDurationSeconds = 0;
      
      for (let i = 0; i < audioMatches.length; i++) {
        const audioMatch = audioMatches[i];
        let trackName = audioMatch.text || `Part ${i + 1}`;
        // Clean up common prefixes/suffixes
        trackName = trackName
          .replace(/^(Download\s+|Get\s+)/i, '')
          .replace(/(\s+here|\s+now)$/i, '');
        if (trackName.toLowerCase() === 'here' || !trackName) {
          trackName = `Part ${i + 1}`;
        }
        
        const audioFileName = `private_${item.id}_part_${i + 1}.mp3`;
        const localAudioPath = path.join(SERMONS_DIR, audioFileName);
        
        if (!fs.existsSync(localAudioPath)) {
          console.log(`Downloading audio for "${trackName}": ${audioMatch.url}`);
          try {
            execSync(`curl -L -o "${localAudioPath}" "${audioMatch.url}"`);
          } catch (err) {
            console.error(`Failed to download audio track ${i + 1}:`, err.message);
            continue;
          }
        } else {
          console.log(`Audio track already exists: ${audioFileName}`);
        }
        
        const duration = getDuration(localAudioPath);
        totalDurationSeconds += parseDurationToSeconds(duration);
        
        audiosList.push({
          id: `track_${item.id}_${i + 1}`,
          title: trackName,
          audioUrl: `/sermons/${audioFileName}`,
          duration: duration
        });
      }
      
      if (audiosList.length === 0) {
        console.log(`Failed to download any audio for "${title}". Skipping.`);
        continue;
      }
      
      // Process and download thumbnail
      let localThumbRelPath = '';
      let thumbUrl = '';
      if (item.yoast_head_json?.og_image && item.yoast_head_json.og_image.length > 0) {
        thumbUrl = item.yoast_head_json.og_image[0].url;
      } else if (item.thumbnailUrl) {
        thumbUrl = item.thumbnailUrl;
      }
      
      if (thumbUrl) {
        const thumbExt = path.extname(thumbUrl).split('?')[0] || '.jpg';
        const rawThumbPath = path.join(THUMBS_DIR, `raw_private_${item.id}${thumbExt}`);
        const optimizedThumbName = `private_${item.id}.jpg`;
        const optimizedThumbPath = path.join(THUMBS_DIR, optimizedThumbName);
        
        if (!fs.existsSync(optimizedThumbPath)) {
          console.log(`Downloading thumbnail: ${thumbUrl}`);
          try {
            execSync(`curl -L -o "${rawThumbPath}" "${thumbUrl}"`);
            console.log('Optimizing thumbnail...');
            const success = resizeImage(rawThumbPath, optimizedThumbPath);
            if (success) {
              localThumbRelPath = `/thumbnails/${optimizedThumbName}`;
              try { fs.unlinkSync(rawThumbPath); } catch (e) {}
            } else {
              // fallback to raw
              const finalThumbName = `private_${item.id}${thumbExt}`;
              const finalThumbPath = path.join(THUMBS_DIR, finalThumbName);
              fs.renameSync(rawThumbPath, finalThumbPath);
              localThumbRelPath = `/thumbnails/${finalThumbName}`;
            }
          } catch (err) {
            console.error('Failed to download/process thumbnail:', err.message);
          }
        } else {
          console.log(`Thumbnail already exists: ${optimizedThumbName}`);
          localThumbRelPath = `/thumbnails/${optimizedThumbName}`;
        }
      }
      
      // Build Sermon Object
      const cleanDescription = decodeHtmlEntities(
        content
          .replace(/<a\s+[^>]*>[\s\S]*?<\/a>/gi, '') // Strip download links from text
          .replace(/<[^>]+>/g, '') // Strip remaining HTML
      ).trim();
        
      const mainAudioUrl = audiosList[0]?.audioUrl || '';
      
      const sermon = {
        id: `sermon_private_${item.id}`,
        title: title,
        speaker: 'Apostle Joshua Iyemifokhae',
        duration: formatSecondsToDuration(totalDurationSeconds),
        thumbnail: localThumbRelPath || 'https://images.unsplash.com/photo-1428515613728-6b4607e44363?w=800&q=80',
        audioUrl: mainAudioUrl,
        views: 0,
        downloads: 0,
        date: item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0],
        description: cleanDescription.substring(0, 500) + (cleanDescription.length > 500 ? '...' : ''),
        category: 'Sons & Daughters',
        audios: audiosList.length > 1 ? audiosList : [],
        audience: 'sons-daughters'
      };
      
      privateSermons.push(sermon);
      console.log(`Successfully added: "${title}" (${sermon.duration}, tracks: ${audiosList.length})`);
    }
    
    // Save to private_sermons.json
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(privateSermons, null, 2), 'utf-8');
    console.log(`\nImport complete! Saved ${privateSermons.length} sermons to ${OUTPUT_FILE}`);
    
  } catch (err) {
    console.error('Failed to import private sermons:', err.message);
  }
}

run();
