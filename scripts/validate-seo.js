'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://kalyanteja.vercel.app';
const PUBLIC_PAGES = [
  '/',
  '/services',
  '/portfolio',
  '/about',
  '/contact',
  '/gallery',
  '/careers',
  '/faq',
];

/** Pages allowed to use noindex (not listed in sitemap). */
const NOINDEX_OK = new Set(['blog.html']);

const htmlFiles = fs
  .readdirSync(ROOT)
  .filter((f) => f.endsWith('.html') && f !== '404.html');

const errors = [];
const warnings = [];

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

for (const file of htmlFiles) {
  const html = read(file);
  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (!canonicalMatch) {
    errors.push(`${file}: missing canonical link`);
  } else if (!canonicalMatch[1].startsWith(SITE)) {
    errors.push(`${file}: canonical must use ${SITE} (got ${canonicalMatch[1]})`);
  }

  if (/content="noindex/i.test(html) && !NOINDEX_OK.has(file)) {
    errors.push(`${file}: contains noindex directive`);
  }

  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  if (!titleMatch || titleMatch[1].trim().length < 10) {
    errors.push(`${file}: title missing or too short`);
  }

  const descMatch = html.match(/<meta name="description" content="([^"]*)"/);
  if (!descMatch || descMatch[1].length < 50) {
    errors.push(`${file}: meta description missing or under 50 characters`);
  } else if (descMatch[1].length > 150) {
    errors.push(`${file}: meta description length ${descMatch[1].length} (max 150 for SERP snippets)`);
  }

  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (!ogImage || !ogImage[1].startsWith('http')) {
    errors.push(`${file}: og:image must be an absolute URL`);
  }

  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1Count !== 1) {
    warnings.push(`${file}: expected 1 h1, found ${h1Count}`);
  }
}

const robots = read('robots.txt');
if (!robots.includes('Sitemap: https://kalyanteja.vercel.app/sitemap.xml')) {
  errors.push('robots.txt: missing or incorrect sitemap reference');
}

const sitemap = read('sitemap.xml');
for (const route of PUBLIC_PAGES) {
  const loc = `${SITE}${route === '/' ? '/' : route}`;
  if (!sitemap.includes(`<loc>${loc}</loc>`)) {
    errors.push(`sitemap.xml: missing ${loc}`);
  }
}

const jsonLdBlocks = htmlFiles.flatMap((file) => {
  const html = read(file);
  const blocks = [];
  const re = /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      JSON.parse(m[1]);
      blocks.push(file);
    } catch (e) {
      errors.push(`${file}: invalid JSON-LD — ${e.message}`);
    }
  }
  return blocks;
});

if (jsonLdBlocks.length === 0) {
  warnings.push('No JSON-LD blocks found in public pages');
}

console.log('SEO validation for', SITE);
console.log('Pages checked:', htmlFiles.length);
if (warnings.length) {
  console.log('\nWarnings:');
  warnings.forEach((w) => console.log('  -', w));
}
if (errors.length) {
  console.log('\nErrors:');
  errors.forEach((e) => console.log('  -', e));
  process.exit(1);
}
console.log('\nAll SEO checks passed.');
