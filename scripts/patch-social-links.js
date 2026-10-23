'use strict';

const fs = require('fs');
const path = require('path');
const { social } = require('./site-links');

const ROOT = path.join(__dirname, '..');
const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));

function socialHref(platform, fallback = '#') {
  const url = social[platform];
  return url && url.startsWith('http') ? url : fallback;
}

for (const file of files) {
  const full = path.join(ROOT, file);
  let html = fs.readFileSync(full, 'utf8');

  html = html.replace(
    /<a href="#" aria-label="LinkedIn">/g,
    `<a href="${socialHref('linkedin')}" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer me">`
  );
  html = html.replace(
    /<a href="#" aria-label="Twitter">/g,
    `<a href="${socialHref('twitter')}" aria-label="Twitter" target="_blank" rel="noopener noreferrer me">`
  );
  html = html.replace(
    /<a href="#" aria-label="Facebook">/g,
    `<a href="${socialHref('facebook')}" aria-label="Facebook" target="_blank" rel="noopener noreferrer me">`
  );
  html = html.replace(
    /<a href="#" aria-label="Instagram">/g,
    `<a href="${socialHref('instagram')}" aria-label="Instagram" target="_blank" rel="noopener noreferrer me">`
  );

  fs.writeFileSync(full, html, 'utf8');
  console.log('Social links:', file);
}
