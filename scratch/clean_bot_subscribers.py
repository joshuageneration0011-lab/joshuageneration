import paramiko
import sys

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        node_script = """
const path = require('path');
const fs = require('fs');

const envPath = '/var/www/joshuageneration/server/.env';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  });
}

let Pool;
try {
  Pool = require('/var/www/joshuageneration/server/node_modules/pg').Pool;
} catch (e) {
  try {
    Pool = require('/var/www/joshuageneration/node_modules/pg').Pool;
  } catch (err) {}
}

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/joshuageneration';
const pool = Pool ? new Pool({
  connectionString: dbUrl,
  ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
}) : null;

async function cleanSubscribers() {
  console.log('=== CLEANING BOT SUBSCRIBERS ===');
  let subscribers = [];
  
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM subscribers ORDER BY created_at DESC');
      subscribers = res.rows;
    } catch (err) {
      console.log('Postgres query error:', err.message);
    }
  }

  const filePath = '/var/www/joshuageneration/server/data/subscribers.json';
  if (subscribers.length === 0 && fs.existsSync(filePath)) {
    subscribers = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  console.log(`Found ${subscribers.length} total subscribers.`);
  
  const botIds = [];
  const legitSubscribers = [];

  for (const s of subscribers) {
    const name = (s.name || '').trim();
    const email = (s.email || '').trim().toLowerCase();
    
    let isBot = false;
    let reason = '';

    if (email.endsWith('@exactsciences.com')) {
      isBot = true;
      reason = '@exactsciences.com bot pattern';
    }

    if (name) {
      const words = name.split(/\\s+/);
      for (const w of words) {
        if (w.length > 5 && !/[aeiouyAEIOUY]/.test(w)) {
          isBot = true;
          reason = `Gibberish word '${w}' (no vowels)`;
          break;
        }
        const vowelCount = (w.match(/[aeiouyAEIOUY]/g) || []).length;
        if (w.length >= 7 && vowelCount <= 1 && /^[a-zA-Z]+$/.test(w)) {
          isBot = true;
          reason = `Gibberish word '${w}' (high consonant ratio)`;
          break;
        }
      }
    }

    if (isBot) {
      botIds.push(s.id);
      console.log(`[BOT DELETED] ID: ${s.id} | Name: "${s.name}", Email: <${s.email}> | Reason: ${reason}`);
    } else {
      legitSubscribers.push(s);
    }
  }

  console.log(`\\nSummary: ${botIds.length} Bots detected, ${legitSubscribers.length} Legitimate subscribers retained.`);

  if (botIds.length > 0) {
    if (pool) {
      try {
        await pool.query('DELETE FROM subscribers WHERE id = ANY($1::text[])', [botIds]);
        console.log(`Successfully deleted ${botIds.length} bot subscribers from PostgreSQL database!`);
      } catch (e) {
        console.error('Delete DB error:', e.message);
      }
    }
    
    if (fs.existsSync(filePath)) {
      const jsonSubs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const filtered = jsonSubs.filter(s => !botIds.includes(s.id));
      fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf-8');
      console.log(`Successfully updated ${filePath}!`);
    }
  } else {
    console.log('No bot subscribers found to delete.');
  }

  if (pool) await pool.end();
}

cleanSubscribers().catch(console.error);
""";

        ssh.exec_command("cat << 'EOF' > /tmp/clean_subs.js\n" + node_script + "\nEOF")
        
        stdin, stdout, stderr = ssh.exec_command("cd /var/www/joshuageneration/server && NODE_PATH=/var/www/joshuageneration/server/node_modules node /tmp/clean_subs.js")
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        
        print(out)
        if err:
            print("ERRORS/LOGS:", err)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
