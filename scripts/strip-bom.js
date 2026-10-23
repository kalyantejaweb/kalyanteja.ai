'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const p = path.join(ROOT, file);
  let buf = fs.readFileSync(p);
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    buf = buf.subarray(3);
    fs.writeFileSync(p, buf);
    console.log('Removed BOM from', file);
  }
}
