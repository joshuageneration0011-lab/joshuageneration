const https = require('https');

function post(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const body = JSON.stringify(data);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: rawData });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(url, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'GET',
      headers: headers
    }, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: rawData });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    const loginRes = await post("https://joshuasgeneration.com/api/auth/login", {
      email: "admin@joshuagen.org",
      password: "admin123"
    });
    console.log("Login Status:", loginRes.statusCode);
    console.log("Login Response:", loginRes.body);
    if (loginRes.statusCode !== 200) return;
    
    const token = JSON.parse(loginRes.body).token;
    
    const settingsRes = await get("https://joshuasgeneration.com/api/settings", {
      "Authorization": `Bearer ${token}`
    });
    console.log("GET Settings Status:", settingsRes.statusCode);
    console.log("GET Settings Response:", settingsRes.body);
  } catch (err) {
    console.error(err);
  }
}

main();
