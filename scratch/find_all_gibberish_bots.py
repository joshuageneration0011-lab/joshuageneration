import paramiko
import sys

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        node_script = """
const { Pool } = require('/var/www/joshuageneration/server/node_modules/pg');
const fs = require('fs');

const pool = new Pool({ connectionString: 'postgresql://jg_admin:GgCXXuFM5H40Yj4uv@localhost:5432/joshuagen' });

// Comprehensive bot detector
function inspectBot(name, email) {
  name = (name || '').trim();
  email = (email || '').trim().toLowerCase();

  const userPart = email.split('@')[0] || '';

  // 1. Email dot abuse (3+ dots in username e.g. b.etha.n.yp.i.ck.a.rd)
  const dotCount = (userPart.match(/\\./g) || []).length;
  if (dotCount >= 3) {
    return { isBot: true, reason: `Excessive dots (${dotCount}) in email` };
  }

  // 2. Known bot spam domains
  const spamDomains = ['exactsciences.com', 'agcbio.com', 'werfen.com', 'aitx.com', 'gzeos.com', 'wwllmail.com', 'rootsec.nl', 'signet.nl', 'aeliustech.com', 'mmt-inc.com'];
  for (const dom of spamDomains) {
    if (email.endsWith(`@${dom}`)) {
      return { isBot: true, reason: `Spam domain @${dom}` };
    }
  }

  // 3. Gibberish name analysis
  if (name) {
    const words = name.split(/\\s+/);
    for (const w of words) {
      const clean = w.replace(/[^a-zA-Z]/g, '');
      if (!clean) continue;

      // Unnatural capital / lower combinations or 2+ uppercase letters inside word (e.g. "Ngcfvjah", "Tjjljaex", "Bksyelbs")
      if (/^[A-Z][a-z]*[A-Z]/.test(clean)) {
        // pattern
      }

      // Check rare/impossible English initial consonant pairs
      if (/^(Kj|Lv|Qx|Wx|Fz|Zc|Xb|Kk|Rx|Wg|Qf|Xj|Zd|Oj|Ts|Ur|Dz|Gh|Dp|Wn|Xt|Wc|Cw|Lg|Qy|Dx|Nb|Pz|Vz|Jm|Qv|Hp|Bq|Gz|Fp|Sj|Ff|Iq|Zq)/i.test(clean) && clean.length > 3) {
        return { isBot: true, reason: `Bot name prefix pattern in word '${clean}'` };
      }

      // Consonant clusters of 4+ consonants not matching English
      const consCluster = clean.match(/[^aeiouyAEIOUY]{4,}/gi);
      if (consCluster) {
        const invalid = consCluster.some(c => !/^(str|sch|thr|ndr|ght|chr|phr)$/i.test(c));
        if (invalid) {
          return { isBot: true, reason: `Consonant cluster '${consCluster.join(',')}' in word '${clean}'` };
        }
      }

      // Trailing consonant ending clusters of 3+ (e.g. "Afomgkzs", "Ilasxz", "Ntxesd")
      if (/[bcdfghjklmnpqrstvwxyz]{3,}$/i.test(clean) && !/(ght|th|nd|nt|ld|lt|st|rd|rt|ng|nk|ck|sk|mp|ct|ft|ll|ss|ff|zz)$/i.test(clean)) {
        return { isBot: true, reason: `Trailing consonant cluster in word '${clean}'` };
      }
    }
  }

  return { isBot: false };
}

async function run() {
  console.log('=== SCANNING ALL SUBSCRIBERS FOR BOTS ===');
  const res = await pool.query('SELECT id, name, email FROM subscribers ORDER BY created_at DESC');
  const subscribers = res.rows;

  console.log(`Total subscribers in DB: ${subscribers.length}`);
  const botIds = [];

  for (const s of subscribers) {
    const check = inspectBot(s.name, s.email);
    if (check.isBot) {
      botIds.push(s.id);
      console.log(`[BOT MATCH] ID: ${s.id} | Name: "${s.name}", Email: <${s.email}> | Reason: ${check.reason}`);
    }
  }

  console.log(`\\nFound ${botIds.length} bot subscribers.`);

  if (botIds.length > 0) {
    // Delete in postgres
    for (const id of botIds) {
      await pool.query('DELETE FROM subscribers WHERE id = $1', [id]);
    }
    console.log(`Successfully deleted ${botIds.length} bot subscribers from PostgreSQL!`);

    // Sync JSON file
    const filePath = '/var/www/joshuageneration/server/data/subscribers.json';
    if (fs.existsSync(filePath)) {
      const jsonSubs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const filtered = jsonSubs.filter(s => !botIds.includes(s.id));
      fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf-8');
      console.log(`Successfully updated ${filePath}!`);
    }
  } else {
    console.log('No bot subscribers found.');
  }

  pool.end();
}

run().catch(console.error);
""";

        ssh.exec_command("cat << 'EOF' > /tmp/scan_bots.js\n" + node_script + "\nEOF")
        
        stdin, stdout, stderr = ssh.exec_command("cd /var/www/joshuageneration/server && NODE_PATH=/var/www/joshuageneration/server/node_modules node /tmp/scan_bots.js")
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
