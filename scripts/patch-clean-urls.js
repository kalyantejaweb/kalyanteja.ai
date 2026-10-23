'use strict';

/**
 * Internal navigation uses relative *.html paths so links work when opening
 * files locally (file://) and on static hosts. Production SEO canonicals
 * remain clean paths on https://kalyanteja.vercel.app (see vercel.json).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));

for (const file of files) {
  const full = path.join(ROOT, file);
  let html = fs.readFileSync(full, 'utf8');

  html = html.replace(/href="\/#([^"]+)"/g, 'href="index.html#$1"');
  html = html.replace(/href="\/"/g, 'href="index.html"');
  html = html.replace(/href="\/([a-z0-9-]+)#([^"]+)"/g, 'href="$1.html#$2"');
  html = html.replace(/href="\/([a-z0-9-]+)"/g, 'href="$1.html"');

  fs.writeFileSync(full, html, 'utf8');
  console.log('Relative nav URLs:', file);
}
