'use strict';

const fs = require('fs');
const path = require('path');
const siteLinks = require('./site-links');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const sameAs = siteLinks.schemaSameAs();
if (!sameAs.length) {
  console.log('No schema sameAs URLs configured.');
  process.exit(0);
}

const sameAsJson = JSON.stringify(sameAs, null, 10).replace(/\n/g, '\n        ');

if (html.includes('"sameAs"')) {
  html = html.replace(/"sameAs":\s*\[[^\]]*\]/, `"sameAs": ${sameAsJson}`);
} else {
  html = html.replace(
    /("knowsAbout":\s*\[[\s\S]*?\])\s*\n(\s*\}\s*\n\s*\])/,
    `$1,\n        "sameAs": ${sameAsJson}\n$2`
  );
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Updated index.html schema sameAs:', sameAs.join(', '));
