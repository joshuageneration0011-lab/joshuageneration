import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const sermonsFilePath = './server/data/sermons.json';

function formatDuration(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds <= 0) return '45:00';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  const minsStr = mins.toString().padStart(2, '0');
  const secsStr = secs.toString().padStart(2, '0');
  
  if (hrs > 0) {
    return `${hrs}:${minsStr}:${secsStr}`;
  }
  return `${mins}:${secsStr}`;
}

async function getUrlDuration(url) {
  try {
    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${url}"`;
    const { stdout } = await execPromise(cmd);
    const secVal = parseFloat(stdout.trim());
    if (!isNaN(secVal) && secVal > 0) {
      return secVal;
    }
  } catch (err) {
    // Fail silently, returning fallback 0
  }
  return 0;
}

// Concurrency pool helper
async function mapLimit(items, limit, fn) {
  const results = [];
  const executing = new Set();
  
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    executing.add(p);
    
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

async function run() {
  console.log('Reading public sermons...');
  const sermons = JSON.parse(fs.readFileSync(sermonsFilePath, 'utf8'));
  console.log(`Processing ${sermons.length} public sermons for exact durations...`);
  
  let processed = 0;
  
  await mapLimit(sermons, 8, async (sermon) => {
    try {
      if (sermon.audios && sermon.audios.length > 0) {
        console.log(`-> Fetching part durations for series: "${sermon.title}"`);
        let totalSeconds = 0;
        
        for (const track of sermon.audios) {
          if (track.audioUrl) {
            const sec = await getUrlDuration(track.audioUrl);
            track.duration = formatDuration(sec);
            totalSeconds += sec;
          } else {
            track.duration = '45:00';
          }
        }
        
        sermon.duration = formatDuration(totalSeconds);
        console.log(`   Unified Duration: ${sermon.duration} (parts: ${sermon.audios.length})`);
      } else {
        if (sermon.audioUrl) {
          const sec = await getUrlDuration(sermon.audioUrl);
          sermon.duration = formatDuration(sec);
        } else {
          sermon.duration = '45:00';
        }
        console.log(`-> Standalone Duration: ${sermon.duration} for "${sermon.title}"`);
      }
    } catch (e) {
      console.error(`Error on "${sermon.title}":`, e.message);
    }
    
    processed++;
    if (processed % 10 === 0) {
      console.log(`=== Progress: ${processed}/${sermons.length} completed ===`);
    }
  });
  
  fs.writeFileSync(sermonsFilePath, JSON.stringify(sermons, null, 2), 'utf8');
  console.log('\nSaved all updated durations to server/data/sermons.json!');
}

run();
