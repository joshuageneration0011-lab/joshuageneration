import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection established successfully with 84.46.243.59.');
  
  const cmd = 'cat /etc/nginx/sites-enabled/joshuageneration';
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Failed to run check command:', err);
      conn.end();
      return;
    }
    
    stream.on('close', (code) => {
      console.log(`\nCheck command finished with exit code: ${code}`);
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
