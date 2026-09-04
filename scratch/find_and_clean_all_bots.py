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

function isBotSubscriber(name, email) {
  name = (name || '').trim();
  email = (email || '').trim().toLowerCase();

  // 1. Email dot abuse (e.g. b.etha.n.yp.i.ck.a.rd@gmail.com)
  const emailUser = email.split('@')[0] || '';
  const dotCount = (emailUser.match(/\\./g) || []).length;
  if (dotCount >= 4) {
    return { isBot: true, reason: `Excessive dots in email (${dotCount} dots)` };
  }

  // 2. Specific spam corporate email domains
  const spamDomains = ['exactsciences.com', 'agcbio.com', 'werfen.com', 'aitx.com'];
  for (const domain of spamDomains) {
    if (email.endsWith(`@${domain}`)) {
      return { isBot: true, reason: `Known spam domain @${domain}` };
    }
  }

  // 3. Name analysis
  if (name) {
    const words = name.split(/\\s+/);
    for (const w of words) {
      const cleanW = w.replace(/[^a-zA-Z]/g, '');
      if (!cleanW) continue;

      // Word has length >= 3 and zero vowels (a, e, i, o, u, y)
      if (cleanW.length >= 3 && !/[aeiouyAEIOUY]/.test(cleanW)) {
        return { isBot: true, reason: `No vowels in word '${cleanW}'` };
      }

      // Word has 3 or more consecutive consonants (excluding common prefixes/suffixes)
      const consCluster = cleanW.match(/[^aeiouyAEIOUY]{3,}/g);
      if (consCluster) {
        // Exclude common valid English/German/Dutch consonant clusters if any, e.g. "str", "sch", "thr", "ndr"
        const invalidCluster = consCluster.some(c => !/^(str|sch|thr|ndr|ght|chr|phr)$/i.test(c));
        if (invalidCluster) {
          return { isBot: true, reason: `Invalid consonant cluster '${consCluster.join(', ')}' in word '${cleanW}'` };
        }
      }

      // High consonant ratio in length >= 5 (<= 1 vowel)
      const vowelCount = (cleanW.match(/[aeiouyAEIOUY]/g) || []).length;
      if (cleanW.length >= 5 && vowelCount <= 1) {
        return { isBot: true, reason: `High consonant ratio (${vowelCount} vowel) in '${cleanW}'` };
      }
    }
  }

  return { isBot: false };
}

async function runCleanup() {
  console.log('=== COMPREHENSIVE BOT CLEANUP ===');
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
    const check = isBotSubscriber(s.name, s.email);
    if (check.isBot) {
      botIds.push(s.id);
      console.log(`[BOT DELETED] Name: "${s.name}", Email: <${s.email}> | Reason: ${check.reason}`);
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

runCleanup().catch(console.error);
""";

        ssh.exec_command("cat << 'EOF' > /tmp/clean_all_bots.js\n" + node_script + "\nEOF")
        
        stdin, stdout, stderr = ssh.exec_command("cd /var/www/joshuageneration/server && NODE_PATH=/var/www/joshuageneration/server/node_modules node /tmp/clean_all_bots.js")
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
