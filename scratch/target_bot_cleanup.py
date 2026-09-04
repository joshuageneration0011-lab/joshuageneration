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

const { Pool } = require('/var/www/joshuageneration/server/node_modules/pg');
const dbUrl = process.env.DATABASE_URL || 'postgresql://jg_admin:GgCXXuFM5H40Yj4uv@localhost:5432/joshuagen';
const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
});

function isBot(name, email) {
  name = (name || '').trim();
  email = (email || '').trim().toLowerCase();

  const userPart = email.split('@')[0] || '';

  // 1. Email with 3+ dots in username (e.g. b.etha.n.yp.i.ck.a.rd)
  const dotCount = (userPart.match(/\\./g) || []).length;
  if (dotCount >= 3) {
    return { isBot: true, reason: `Excessive dots in email address (${dotCount} dots)` };
  }

  // 2. Known bot spam domains
  const spamDomains = ['agcbio.com', 'werfen.com', 'aitx.com', 'exactsciences.com', 'gzeos.com', 'wwllmail.com', 'rootsec.nl', 'signet.nl', 'aeliustech.com', 'mmt-inc.com'];
  for (const dom of spamDomains) {
    if (email.endsWith(`@${dom}`)) {
      return { isBot: true, reason: `Spam domain @${dom}` };
    }
  }

  // 3. Gibberish name prefix / cluster rules
  if (name) {
    const words = name.split(/\\s+/);
    for (const w of words) {
      const clean = w.replace(/[^a-zA-Z]/g, '');
      if (!clean) continue;

      // Words starting with rare/impossible English consonant pairs
      if (/^(Kj|Lv|Qx|Wx|Fz|Zc|Xb|Kk|Rx|Wg|Qf|Xj|Zd|Oj|Ts|Ur|Dz|Gh|Dp|Wn|Xt|Wc|Cw|Lg|Qy|Dx|Nb|Pz|Vz|Jm|Qv|Hp|Bq|Gz|Fp)/i.test(clean) && clean.length > 3) {
        return { isBot: true, reason: `Bot name prefix pattern in word '${clean}'` };
      }

      // Words containing impossible consonant clusters (e.g. "xxd", "jlj", "ntx", "bsk", "fmg", "gkzs", "lsxz")
      if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(clean)) {
        const matches = clean.match(/[bcdfghjklmnpqrstvwxyz]{4,}/gi);
        const valid = matches.every(m => /^(schm|schlg|schtr|pstr)$/i.test(m));
        if (!valid) {
          return { isBot: true, reason: `Unnatural 4+ consonant cluster '${matches.join(',')}' in word '${clean}'` };
        }
      }

      // Words ending with 3+ unusual consonants (e.g., "Afomgkzs", "Ilasxz", "Ntxesd")
      if (/[bcdfghjklmnpqrstvwxyz]{3,}$/i.test(clean) && !/(ght|th|nd|nt|ld|lt|st|rd|rt|ng|nk|ck|sk|mp|ct|ft)$/i.test(clean)) {
        return { isBot: true, reason: `Unnatural trailing consonant ending in word '${clean}'` };
      }
    }
  }

  return { isBot: false };
}

async function run() {
  console.log('=== TARGETED BOT PURGE ===');
  const res = await pool.query('SELECT id, name, email FROM subscribers ORDER BY created_at DESC');
  const subscribers = res.rows;

  console.log(`Total subscribers in DB: ${subscribers.length}`);

  const botIds = [];
  for (const s of subscribers) {
    const check = isBot(s.name, s.email);
    if (check.isBot) {
      botIds.push(s.id);
      console.log(`[BOT TO DELETE] Name: "${s.name}", Email: <${s.email}> | Reason: ${check.reason}`);
    }
  }

  console.log(`\\nFound ${botIds.length} bot subscribers out of ${subscribers.length}.`);

  if (botIds.length > 0) {
    await pool.query('DELETE FROM subscribers WHERE id = ANY($1::text[])', [botIds]);
    console.log(`Successfully deleted ${botIds.length} bot subscribers from PostgreSQL!`);

    // Sync subscribers.json cache
    const filePath = '/var/www/joshuageneration/server/data/subscribers.json';
    if (fs.existsSync(filePath)) {
      const jsonSubs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const filtered = jsonSubs.filter(s => !botIds.includes(s.id));
      fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf-8');
      console.log(`Successfully updated ${filePath}!`);
    }
  } else {
    console.log('No remaining bots found.');
  }

  await pool.end();
}

run().catch(console.error);
""";

        ssh.exec_command("cat << 'EOF' > /tmp/target_clean.js\n" + node_script + "\nEOF")
        
        stdin, stdout, stderr = ssh.exec_command("cd /var/www/joshuageneration/server && NODE_PATH=/var/www/joshuageneration/server/node_modules node /tmp/target_clean.js")
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
