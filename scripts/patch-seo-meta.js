'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://kalyanteja.vercel.app';
const OG = `${SITE}/assets/images/logo-f.png`;

const PAGE_META = {
  'index.html': {
    title: 'KalyanTeja Inspired Digital Solutions | Web Design & SEO — Hyderabad',
    description:
      'Hyderabad agency for website design, UI/UX, mobile apps, SEO, digital marketing and social media. KalyanTeja — request a project quote.',
    keywords:
      'website design Hyderabad, web development Telangana, mobile app development, SEO services Hyderabad, digital marketing agency, UI UX design, KalyanTeja',
    ogTitle: 'KalyanTeja | Website, App & Digital Marketing — Hyderabad',
    ogDescription:
      'Websites, apps, SEO and digital marketing from Hyderabad. KalyanTeja helps businesses turn online traffic into genuine enquiries.',
    twitterTitle: 'KalyanTeja | Inspired Digital Solutions — Hyderabad',
    twitterDescription:
      'Website design, UI/UX, mobile apps, SEO and social media management in Hyderabad, Telangana.',
    canonical: `${SITE}/`,
    ogUrl: `${SITE}/`,
    siteName: 'KalyanTeja Inspired Digital Solutions',
  },
  'services.html': {
    title: 'Services | Website Design, SEO & Digital Marketing — KalyanTeja Hyderabad',
    description:
      'KalyanTeja services in Hyderabad: website design, UI/UX, mobile apps, SEO, digital marketing and social media with clear scope and timelines.',
    keywords:
      'website design services Hyderabad, SEO company Telangana, mobile app development, digital marketing services, social media management, UI UX agency',
    ogTitle: 'Our Services | KalyanTeja — Hyderabad',
    ogDescription:
      'Websites, apps, UI/UX, SEO, digital marketing and social media delivered from Hyderabad, Telangana.',
    twitterTitle: 'Services | KalyanTeja Inspired Digital Solutions',
    twitterDescription:
      'Website design, mobile apps, SEO and digital marketing for businesses in Hyderabad and across India.',
    canonical: `${SITE}/services`,
    ogUrl: `${SITE}/services`,
    siteName: 'KalyanTeja Inspired Digital Solutions',
  },
  'contact.html': {
    title: 'Contact | KalyanTeja Inspired Digital Solutions — Hyderabad',
    description:
      'Contact KalyanTeja in Hyderabad for websites, apps, SEO and marketing. Call +91 83281 06802 or email kalyanteja.web@gmail.com.',
    keywords:
      'contact KalyanTeja, web design company Uppal Hyderabad, SEO agency Telangana, get quote digital marketing',
    ogTitle: 'Contact Us | KalyanTeja — Hyderabad',
    ogDescription:
      'Reach our team in Hyderabad for website, app, SEO, and marketing projects. We respond within one business day.',
    twitterTitle: 'Contact KalyanTeja — Hyderabad',
    twitterDescription:
      'Share your project brief with KalyanTeja Inspired Digital Solutions. Phone, email, and contact form available.',
    canonical: `${SITE}/contact`,
    ogUrl: `${SITE}/contact`,
    siteName: 'KalyanTeja Inspired Digital Solutions',
  },
  'about.html': {
    title: 'About Us | KalyanTeja Inspired Digital Solutions — Hyderabad',
    description:
      'About KalyanTeja — a Hyderabad team building websites, apps and digital marketing for startups and established businesses in Telangana.',
    keywords:
      'about KalyanTeja, digital agency Hyderabad, web development company Telangana, KalyanTeja story',
    ogTitle: 'About KalyanTeja | Inspired Digital Solutions',
    ogDescription:
      'Our story, mission, and approach to website design, software delivery, and digital growth from Hyderabad.',
    twitterTitle: 'About KalyanTeja — Hyderabad',
    twitterDescription:
      'Meet the team behind KalyanTeja — digital products and marketing rooted in Hyderabad, Telangana.',
    canonical: `${SITE}/about`,
    ogUrl: `${SITE}/about`,
    siteName: 'KalyanTeja Inspired Digital Solutions',
  },
  'portfolio.html': {
    title: 'Portfolio | Web & App Projects — KalyanTeja Hyderabad',
    description:
      'KalyanTeja portfolio: web platforms, mobile apps and digital work for finance, healthcare, government, retail and education clients.',
    keywords:
      'web design portfolio Hyderabad, app development case studies, KalyanTeja projects, digital agency work',
    ogTitle: 'Portfolio | KalyanTeja Inspired Digital Solutions',
    ogDescription:
      'Selected web, mobile, and platform projects showcasing design, engineering, and delivery quality.',
    twitterTitle: 'Portfolio | KalyanTeja',
    twitterDescription:
      'Case studies and project highlights from KalyanTeja Inspired Digital Solutions.',
    canonical: `${SITE}/portfolio`,
    ogUrl: `${SITE}/portfolio`,
    siteName: 'KalyanTeja Inspired Digital Solutions',
  },
  'faq.html': {
    title: 'FAQ | KalyanTeja Digital Services — Hyderabad',
    description:
      'FAQ for KalyanTeja clients in Hyderabad — services, timelines, support and how we deliver website, app, SEO and marketing projects.',
    keywords:
      'KalyanTeja FAQ, web development questions Hyderabad, SEO project timeline, digital marketing agency FAQ',
    ogTitle: 'FAQ | KalyanTeja Inspired Digital Solutions',
    ogDescription:
      'Answers about engagement models, industries, support, and kickoff timelines before you start a project.',
    twitterTitle: 'FAQ | KalyanTeja',
    twitterDescription:
      'Common questions from teams evaluating KalyanTeja for websites, apps, and digital marketing.',
    canonical: `${SITE}/faq`,
    ogUrl: `${SITE}/faq`,
    siteName: 'KalyanTeja Inspired Digital Solutions',
  },
  'blog.html': {
    title: 'Blog | Digital Marketing & Technology Insights — KalyanTeja',
    description:
      'KalyanTeja blog: web development, SEO, mobile apps and digital growth tips for business teams in Hyderabad and India.',
    keywords:
      'KalyanTeja blog, SEO tips Hyderabad, web development articles, digital transformation insights',
    ogTitle: 'Insights & Blog | KalyanTeja',
    ogDescription:
      'Practical technology and marketing insights from the KalyanTeja team.',
    twitterTitle: 'Blog | KalyanTeja',
    twitterDescription:
      'Expert perspectives on cloud, AI, mobile development, SEO, and digital transformation.',
    canonical: `${SITE}/blog`,
    ogUrl: `${SITE}/blog`,
    siteName: 'KalyanTeja Inspired Digital Solutions',
  },
  'gallery.html': {
    title: 'Gallery | KalyanTeja Team & Workspace — Hyderabad',
    description:
      'Gallery: KalyanTeja team, workspace and project moments in Hyderabad — collaboration, workshops and delivery in action.',
    keywords:
      'KalyanTeja gallery, software team Hyderabad, digital agency culture, office photos',
    ogTitle: 'Gallery | KalyanTeja Inspired Digital Solutions',
    ogDescription:
      'Moments from our Hyderabad team — collaboration, events, and delivery in action.',
    twitterTitle: 'Gallery | KalyanTeja',
    twitterDescription:
      'Inside KalyanTeja — team, workspace, and company events.',
    canonical: `${SITE}/gallery`,
    ogUrl: `${SITE}/gallery`,
    siteName: 'KalyanTeja Inspired Digital Solutions',
  },
  'careers.html': {
    title: 'Careers | Join KalyanTeja — Hyderabad & Remote',
    description:
      'Careers at KalyanTeja — engineering, design and marketing roles in Hyderabad with remote-friendly options. See open positions.',
    keywords:
      'KalyanTeja careers, web developer jobs Hyderabad, UI UX designer jobs Telangana, digital marketing jobs',
    ogTitle: 'Careers at KalyanTeja | Inspired Digital Solutions',
    ogDescription:
      'Grow your career building websites, apps, and digital products with a Hyderabad-based team.',
    twitterTitle: 'Careers | KalyanTeja',
    twitterDescription:
      'Explore open engineering, design, and marketing roles at KalyanTeja.',
    canonical: `${SITE}/careers`,
    ogUrl: `${SITE}/careers`,
    siteName: 'KalyanTeja Inspired Digital Solutions',
  },
};

function patchHead(file, meta) {
  const full = path.join(ROOT, file);
  let html = fs.readFileSync(full, 'utf8');

  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${meta.description}">`);
  html = html.replace(/<meta name="keywords" content="[^"]*">/, `<meta name="keywords" content="${meta.keywords}">`);
  html = html.replace(/<meta name="author" content="[^"]*">/, `<meta name="author" content="KalyanTeja Inspired Digital Solutions">`);
  html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${meta.canonical}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${meta.ogTitle}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${meta.ogDescription}">`);
  html = html.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${OG}">`);
  html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${meta.ogUrl}">`);
  html = html.replace(/<meta property="og:site_name" content="[^"]*">/, `<meta property="og:site_name" content="${meta.siteName}">`);
  if (!html.includes('og:locale')) {
    html = html.replace(
      '<meta property="og:type" content="website">',
      '<meta property="og:type" content="website">\n  <meta property="og:locale" content="en_IN">'
    );
  }
  html = html.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${meta.twitterTitle}">`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${meta.twitterDescription}">`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${OG}">`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`);

  fs.writeFileSync(full, html, 'utf8');
}

for (const [file, meta] of Object.entries(PAGE_META)) {
  patchHead(file, meta);
  console.log('Patched', file);
}
