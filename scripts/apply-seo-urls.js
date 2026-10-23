'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://kalyanteja.vercel.app';
const OG_IMAGE = `${SITE}/assets/images/logo-f.png`;

const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));

for (const file of files) {
  const full = path.join(ROOT, file);
  let html = fs.readFileSync(full, 'utf8');

  html = html
    .replace(/https:\/\/www\.kalyanteja\.com/g, SITE)
    .replace(/https:\/\/kalyanteja\.com/g, SITE)
    .replace(/content="assets\/images\/logo-f\.png"/g, `content="${OG_IMAGE}"`)
    .replace(new RegExp(`${SITE.replace(/\./g, '\\.')}/([a-z]+)\\.html`, 'g'), `${SITE}/$1`);

  fs.writeFileSync(full, html, 'utf8');
}

console.log('Updated URLs in', files.length, 'HTML files.');
