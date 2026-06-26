import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established successfully with 84.46.243.59.');
  console.log('Installing Certbot and generating SSL certificate...');
  
  const cmd = 'apt update && apt install -y certbot python3-certbot-nginx && certbot --nginx -d joshuasgeneration.com -d www.joshuasgeneration.com --non-interactive --agree-tos -m dunamishubvideo@gmail.com';
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Failed to run SSL setup command:', err);
      conn.end();
      return;
    }
    
    stream.on('close', (code) => {
      console.log(`\nSSL setup finished with exit code: ${code}`);
      conn.end();
    })
    .on('data', (data) => {
      process.stdout.write(data.toString());
    })
    .stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('SSH Connection Error:', err.message);
}).connect({
  host: '84.46.243.59',
  port: 22,
  username: 'root',
  password: 'GgCXXuFM5H40Yj4uv',
  readyTimeout: 30000
});
