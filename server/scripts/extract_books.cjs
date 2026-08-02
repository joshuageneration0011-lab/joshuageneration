const fs = require('fs');
const buffer = fs.readFileSync('/var/lib/postgresql/14/main/base/16384/16396');
let offset = 0;
const pattern = Buffer.from('b_1783');
while (true) {
  const index = buffer.indexOf(pattern, offset);
  if (index === -1) break;
  console.log(`\n--- Match at offset ${index} ---`);
  const start = Math.max(0, index - 20);
  const end = Math.min(buffer.length, index + 2500);
  const slice = buffer.slice(start, end);
  let text = '';
  for (let i = 0; i < slice.length; i++) {
    const char = slice[i];
    if (char >= 32 && char <= 126) {
      text += String.fromCharCode(char);
    } else if (char === 10 || char === 13) {
      text += '\n';
    } else {
      text += ' ';
    }
  }
  console.log(text);
  offset = index + 1;
}
