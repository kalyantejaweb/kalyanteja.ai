'use strict';

const fs = require('fs');
const path = require('path');
const { SITE, graphsByFile, jsonLdHtml } = require('./schema-shared');

const ROOT = path.join(__dirname, '..');
const LD_JSON_RE =
  /  <!-- JSON-LD -->\r?\n  <script type="application\/ld\+json">[\s\S]*?<\/script>/;

/** Match JSON-LD when the HTML comment is missing (legacy faq layout). */
const LD_JSON_ONLY_RE = /  <script type="application\/ld\+json">[\s\S]*?<\/script>/;

function canonicalPair(pathSuffix) {
  const href = pathSuffix === '/' ? `${SITE}/` : `${SITE}${pathSuffix}`;
  return {
    canonical: `  <link rel="canonical" href="${href}">`,
    ogUrl: `  <meta property="og:url" content="${href}">`,
  };
}

const CANONICAL_BY_FILE = {
  'index.html': canonicalPair('/'),
  'about.html': canonicalPair('/about'),
  'services.html': canonicalPair('/services'),
  'portfolio.html': canonicalPair('/portfolio'),
  'contact.html': canonicalPair('/contact'),
  'faq.html': canonicalPair('/faq'),
  'gallery.html': canonicalPair('/gallery'),
  'careers.html': canonicalPair('/careers'),
  'blog.html': canonicalPair('/blog'),
};

function syncCanonicalAndOg(html, file) {
  const pair = CANONICAL_BY_FILE[file];
  if (!pair) return html;
  html = html.replace(/  <link rel="canonical" href="[^"]*">/, pair.canonical);
  if (/property="og:url"/.test(html)) {
    html = html.replace(/  <meta property="og:url" content="[^"]*">/, pair.ogUrl);
  }
  return html;
}

for (const [file, buildGraph] of Object.entries(graphsByFile)) {
  const full = path.join(ROOT, file);
  let html = fs.readFileSync(full, 'utf8');
  const block = `  <!-- JSON-LD -->\n${jsonLdHtml(buildGraph())}`;

  if (LD_JSON_RE.test(html)) {
    html = html.replace(LD_JSON_RE, block);
  } else if (LD_JSON_ONLY_RE.test(html)) {
    html = html.replace(LD_JSON_ONLY_RE, block.replace('  <!-- JSON-LD -->\r\n', '').replace('  <!-- JSON-LD -->\n', ''));
  } else {
    console.warn('Skip (no JSON-LD block):', file);
    continue;
  }

  html = syncCanonicalAndOg(html, file);
  fs.writeFileSync(full, html, 'utf8');
  console.log('Updated schema + canonical:', file);
}
