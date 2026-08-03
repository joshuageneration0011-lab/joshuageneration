const fs = require('fs');

const file = '/var/lib/postgresql/14/main/base/16384/16396';
const buffer = fs.readFileSync(file);

const pageSize = 8192;
const numPages = buffer.length / pageSize;

const columns = [
  { name: 'id', type: 'text' },
  { name: 'title', type: 'text' },
  { name: 'author', type: 'text' },
  { name: 'cover_url', type: 'text' },
  { name: 'description', type: 'text' },
  { name: 'category', type: 'text' },
  { name: 'download_url', type: 'text' },
  { name: 'rating', type: 'real' },
  { name: 'amazon_url', type: 'text' },
  { name: 'selar_url', type: 'text' },
  { name: 'pages', type: 'integer' },
  { name: 'chapters', type: 'jsonb' },
  { name: 'downloads', type: 'integer' },
  { name: 'pdfs', type: 'jsonb' }
];

const results = [];

for (let p = 0; p < numPages; p++) {
  const pageStart = p * pageSize;
  const page = buffer.slice(pageStart, pageStart + pageSize);
  
  const pd_lower = page.readUInt16LE(12);
  const pd_upper = page.readUInt16LE(14);
  
  const numItemIds = (pd_lower - 24) / 4;
  
  for (let i = 0; i < numItemIds; i++) {
    const lpOffset = 24 + i * 4;
    const lp = page.readUInt32LE(lpOffset);
    
    const off = lp & 0x7fff;
    const flags = (lp >> 15) & 0x3;
    const len = (lp >> 17) & 0x7fff;
    
    if (flags === 0) continue; // unused
    
    const tuple = page.slice(off, off + len);
    
    if (tuple.length < 23) continue;
    const t_infomask2 = tuple.readUInt16LE(18);
    const t_infomask = tuple.readUInt16LE(20);
    const t_hoff = tuple[22];
    
    const numAttributes = t_infomask2 & 0x07ff;
    const hasNulls = (t_infomask & 0x0001) !== 0;
    
    let dataOffset = t_hoff;
    
    let nullBitmap = null;
    if (hasNulls) {
      const bitmapLen = Math.ceil(numAttributes / 8);
      nullBitmap = tuple.slice(23, 23 + bitmapLen);
    }
    
    const record = {};
    
    for (let c = 0; c < numAttributes && c < columns.length; c++) {
      const col = columns[c];
      
      if (nullBitmap) {
        const byteIdx = Math.floor(c / 8);
        const bitIdx = c % 8;
        const bit = (nullBitmap[byteIdx] >> bitIdx) & 1;
        if (bit === 0) {
          record[col.name] = null;
          continue;
        }
      }
      
      if (col.type === 'text' || col.type === 'jsonb') {
        if (dataOffset >= tuple.length) break;
        const firstByte = tuple[dataOffset];
        
        let valLen = 0;
        let headerLen = 0;
        
        if ((firstByte & 0x01) === 0x01) {
          valLen = (firstByte >> 1) - 1;
          headerLen = 1;
        } else if ((firstByte & 0x03) === 0x02) {
          valLen = (firstByte >> 2);
          headerLen = 1;
        } else {
          const va_header = tuple.readUInt32LE(dataOffset);
          valLen = (va_header >> 2) - 4;
          headerLen = 4;
        }
        
        const rawVal = tuple.slice(dataOffset + headerLen, dataOffset + headerLen + valLen);
        let valStr = '';
        if (col.type === 'jsonb') {
          if (rawVal.length > 0 && rawVal[0] === 1) {
            valStr = rawVal.slice(1).toString('utf8');
          } else {
            valStr = rawVal.toString('utf8');
          }
        } else {
          valStr = rawVal.toString('utf8');
        }
        
        record[col.name] = valStr;
        dataOffset += headerLen + valLen;
      } else if (col.type === 'real') {
        if (dataOffset + 4 <= tuple.length) {
          record[col.name] = tuple.readFloatLE(dataOffset);
          dataOffset += 4;
        }
      } else if (col.type === 'integer') {
        if (dataOffset + 4 <= tuple.length) {
          record[col.name] = tuple.readInt32LE(dataOffset);
          dataOffset += 4;
        }
      }
      
      // Align to 4 bytes (in Postgres, all heap tuple fields are aligned based on their type alignment requirements)
      dataOffset = Math.ceil(dataOffset / 4) * 4;
    }
    
    results.push(record);
  }
}

console.log(JSON.stringify(results, null, 2));
