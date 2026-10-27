'use strict';

const siteLinks = require('./site-links');

/** Canonical site origin — must match <link rel="canonical"> on every page. */
const SITE = 'https://kalyanteja.vercel.app';
const ORG_ID = `${SITE}/#organization`;
const WEB_ID = `${SITE}/#website`;

const BUSINESS_NAME = 'KalyanTeja Inspired Digital Solutions';
const BUSINESS_SHORT = 'KalyanTeja';
const TAGLINE = 'Inspired Digital Solutions';
const PHONE = '+91-83281-06802';
const EMAIL = 'kalyanteja.web@gmail.com';
const LOGO = `${SITE}/assets/images/logo-f.png`;

function pageUrl(path) {
  if (!path || path === '/') return `${SITE}/`;
  return `${SITE}${path.startsWith('/') ? path : `/${path}`}`;
}

function graph(...nodes) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

function organizationFull() {
  return {
    '@type': ['Organization', 'ProfessionalService'],
    '@id': ORG_ID,
    name: BUSINESS_NAME,
    alternateName: BUSINESS_SHORT,
    url: pageUrl('/'),
    logo: LOGO,
    image: LOGO,
    description:
      'Website design and development, UI/UX design, mobile apps, SEO, digital marketing, and social media management for businesses in Hyderabad and across India.',
    slogan: TAGLINE,
    foundingDate: '2014',
    areaServed: [
      {
        '@type': 'City',
        name: 'Hyderabad',
        containedInPlace: { '@type': 'State', name: 'Telangana' },
      },
      { '@type': 'Country', name: 'India' },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Hyderabad',
      addressRegion: 'Telangana',
      addressCountry: 'IN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: PHONE,
      contactType: 'customer service',
      email: EMAIL,
      availableLanguage: ['English', 'Hindi', 'Telugu'],
      areaServed: 'IN',
    },
    knowsAbout: [
      'Website Design and Development',
      'UI/UX Design',
      'Mobile App Development',
      'Search Engine Optimization',
      'Digital Marketing',
      'Social Media Management',
    ],
    sameAs: siteLinks.schemaSameAs(),
  };
}

function websiteFull() {
  return {
    '@type': 'WebSite',
    '@id': WEB_ID,
    url: pageUrl('/'),
    name: BUSINESS_NAME,
    description:
      'Website design, mobile app development, SEO, and digital marketing in Hyderabad, Telangana.',
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-IN',
  };
}

function organizationStub() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: BUSINESS_NAME,
    url: pageUrl('/'),
    logo: LOGO,
    telephone: PHONE,
    email: EMAIL,
  };
}

function websiteStub() {
  return {
    '@type': 'WebSite',
    '@id': WEB_ID,
    url: pageUrl('/'),
    name: BUSINESS_NAME,
  };
}

function baseWebPage({ path, type = 'WebPage', name, description, extra = {} }) {
  const url = pageUrl(path);
  return {
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { '@id': WEB_ID },
    about: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-IN',
    ...extra,
  };
}

function offerCatalog() {
  return {
    '@type': 'OfferCatalog',
    name: 'Digital services',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Website Design and Development' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'UI/UX Design' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Mobile App Development' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'SEO Services' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Digital Marketing' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Social Media Management' } },
    ],
  };
}

function faqQuestions() {
  return [
    {
      '@type': 'Question',
      name: 'What industries do you specialize in?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We work with businesses across 12+ industries including retail, healthcare, education, finance, real estate, logistics, e-commerce, and startups — with websites, apps, SEO, and digital marketing tailored to each sector.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do engagement models work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Choose fixed-scope projects or ongoing retainers for SEO and social media. We define deliverables, timelines, and communication before work begins.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you provide post-launch support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. We offer maintenance, content updates, SEO monitoring, and priority support packages after launch.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can you modernize legacy systems?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We can refresh outdated websites, improve performance and mobile UX, and integrate modern tools such as analytics, forms, and payment gateways.',
      },
    },
    {
      '@type': 'Question',
      name: 'How quickly can a project start?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most projects begin within 1–2 weeks after we agree on scope and receive the initial brief and assets.',
      },
    },
  ];
}

const graphsByFile = {
  'index.html': () => graph(websiteFull(), organizationFull()),
  'about.html': () =>
    graph(
      baseWebPage({
        path: '/about',
        type: 'AboutPage',
        name: `About ${BUSINESS_NAME}`,
        description:
          'Learn about KalyanTeja Inspired Digital Solutions — 14+ years, 90+ projects delivered, and 12+ industries served from Hyderabad.',
        extra: { mainEntity: { '@id': ORG_ID } },
      }),
      websiteStub(),
      organizationStub()
    ),
  'services.html': () =>
    graph(
      baseWebPage({
        path: '/services',
        name: `Services | ${BUSINESS_NAME}`,
        description:
          'Website design, UI/UX, mobile apps, SEO, digital marketing, and social media management in Hyderabad, Telangana.',
        extra: {
          mainEntity: {
            '@type': 'ProfessionalService',
            name: BUSINESS_NAME,
            url: pageUrl('/services'),
            provider: { '@id': ORG_ID },
            areaServed: {
              '@type': 'City',
              name: 'Hyderabad',
              containedInPlace: { '@type': 'State', name: 'Telangana' },
            },
            hasOfferCatalog: offerCatalog(),
          },
        },
      }),
      websiteStub(),
      organizationStub()
    ),
  'portfolio.html': () =>
    graph(
      baseWebPage({
        path: '/portfolio',
        type: 'CollectionPage',
        name: `Portfolio | ${BUSINESS_NAME}`,
        description:
          'Portfolio of 90+ website, app, and digital marketing projects across 12+ industries.',
      }),
      websiteStub(),
      organizationStub()
    ),
  'contact.html': () =>
    graph(
      baseWebPage({
        path: '/contact',
        type: 'ContactPage',
        name: `Contact ${BUSINESS_NAME}`,
        description:
          'Contact KalyanTeja Inspired Digital Solutions in Hyderabad for websites, apps, SEO, and digital marketing. Phone +91 83281 06802.',
        extra: { mainEntity: { '@id': ORG_ID } },
      }),
      websiteStub(),
      organizationStub()
    ),
  'faq.html': () =>
    graph(
      {
        ...baseWebPage({
          path: '/faq',
          type: 'FAQPage',
          name: `FAQ | ${BUSINESS_NAME}`,
          description: 'Common questions about websites, apps, SEO, and digital marketing with KalyanTeja Inspired Digital Solutions.',
        }),
        mainEntity: faqQuestions(),
      },
      websiteStub(),
      organizationStub()
    ),
  'gallery.html': () =>
    graph(
      baseWebPage({
        path: '/gallery',
        name: `Gallery | ${BUSINESS_NAME}`,
        description: 'Photos and moments from the KalyanTeja Inspired Digital Solutions team in Hyderabad.',
      }),
      websiteStub(),
      organizationStub()
    ),
  'careers.html': () =>
    graph(
      baseWebPage({
        path: '/careers',
        name: `Careers | ${BUSINESS_NAME}`,
        description: 'Open engineering, design, and marketing roles at KalyanTeja Inspired Digital Solutions in Hyderabad.',
      }),
      websiteStub(),
      organizationStub()
    ),
  'blog.html': () =>
    graph(
      baseWebPage({
        path: '/blog',
        name: `Blog — Coming Soon | ${BUSINESS_NAME}`,
        description:
          'Articles on web design, SEO, mobile apps, and digital marketing will be published here soon.',
      }),
      websiteStub(),
      organizationStub()
    ),
};

function jsonLdHtml(data) {
  const json = JSON.stringify(data, null, 2);
  return `  <script type="application/ld+json">\n${json
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n')}\n  </script>`;
}

module.exports = {
  SITE,
  ORG_ID,
  WEB_ID,
  BUSINESS_NAME,
  graphsByFile,
  jsonLdHtml,
};
