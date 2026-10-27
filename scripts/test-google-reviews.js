'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const reviews = require('../api/google-reviews');

const ROOT = path.join(__dirname, '..');
const savedEnv = {};
const ENV_KEYS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REFRESH_TOKEN',
  'GOOGLE_BUSINESS_ACCOUNT_ID',
  'GOOGLE_BUSINESS_LOCATION_ID',
  'GOOGLE_REVIEWS_CACHE_SECONDS',
  'CRON_SECRET',
  'REVIEWS_SYNC_SECRET',
];

function saveEnv() {
  ENV_KEYS.forEach((key) => {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  });
}

function restoreEnv() {
  ENV_KEYS.forEach((key) => {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  });
}

function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[String(name).toLowerCase()] = value;
    },
    end(payload) {
      this.body = payload || '';
    },
  };
}

async function invoke(method, headers) {
  reviews.resetState();
  const res = mockRes();
  await reviews({ method, headers: headers || {} }, res);
  let json = null;
  if (res.body) json = JSON.parse(res.body);
  return { res, json };
}

async function main() {
  saveEnv();
  try {
    const original = reviews.plainReviewText(
      '(Translated by Google) Hello\n\n(Original)\n<script>alert(1)</script>Excellent &amp; fast'
    );
    assert.strictEqual(original, 'Excellent & fast');
    assert.strictEqual(reviews.plainReviewText('  Kept as written  '), 'Kept as written');
    assert.strictEqual(reviews.plainReviewText(null), '');

    assert.strictEqual(reviews.safePhotoUrl('https://lh3.googleusercontent.com/a/photo'), 'https://lh3.googleusercontent.com/a/photo');
    assert.strictEqual(reviews.safePhotoUrl('http://lh3.googleusercontent.com/a/photo'), null);
    assert.strictEqual(reviews.safePhotoUrl('https://evil.example/photo.jpg'), null);
    assert.strictEqual(reviews.safePhotoUrl('javascript:alert(1)'), null);

    assert.strictEqual(reviews.resourceId('accounts/123456/locations/999', 'accounts'), '123456');
    assert.strictEqual(reviews.resourceId('locations/999', 'locations'), '999');
    assert.strictEqual(reviews.resourceId('999', 'locations'), '999');
    assert.strictEqual(reviews.resourceId('../etc/passwd', 'locations'), '');

    const normalized = reviews.normalizeReviews([
      {
        reviewId: 'abc',
        reviewer: { displayName: 'Asha', profilePhotoUrl: 'https://lh3.googleusercontent.com/a/asha', isAnonymous: false },
        starRating: 'FIVE',
        comment: 'Clear communication.',
        createTime: '2026-03-01T10:00:00Z',
        updateTime: '2026-03-02T10:00:00Z',
      },
      {
        reviewId: 'abc',
        reviewer: { displayName: 'Duplicate' },
        starRating: 'ONE',
        comment: 'Should be ignored.',
        createTime: '2026-03-03T10:00:00Z',
      },
      {
        name: 'accounts/1/locations/2/reviews/no-text',
        reviewer: { displayName: 'No Text' },
        starRating: 'FOUR',
      },
      {
        reviewId: 'anon',
        reviewer: { isAnonymous: true, displayName: 'Hidden' },
        starRating: 'THREE',
        comment: 'Helpful team.',
        createTime: 'not-a-date',
      },
      {
        reviewId: 'bad-photo',
        reviewer: { displayName: 'Ravi', profilePhotoUrl: 'https://example.com/a.jpg' },
        starRating: 'STAR_RATING_UNSPECIFIED',
        comment: 'Delivered on schedule.',
      },
    ]);

    assert.strictEqual(normalized.length, 3);
    assert.strictEqual(normalized[0].id, 'abc');
    assert.strictEqual(normalized[0].author, 'Asha');
    assert.strictEqual(normalized[0].rating, 5);
    assert.strictEqual(normalized[0].text, 'Clear communication.');
    assert.strictEqual(normalized[0].photoUrl, 'https://lh3.googleusercontent.com/a/asha');
    assert.strictEqual(normalized[0].publishedAt, '2026-03-01T10:00:00.000Z');
    assert.strictEqual(normalized[1].author, 'Google reviewer');
    assert.strictEqual(normalized[1].rating, 3);
    assert.strictEqual(normalized[1].publishedAt, null);
    assert.strictEqual(normalized[2].rating, null);
    assert.strictEqual(normalized[2].photoUrl, null);
    assert.deepStrictEqual(Object.keys(normalized[0]).sort(), [
      'author',
      'id',
      'photoUrl',
      'publishedAt',
      'rating',
      'text',
      'updatedAt',
    ]);

    process.env.GOOGLE_CLIENT_ID = 'canary-client-id-do-not-leak';
    process.env.CRON_SECRET = 'canary-cron-secret-do-not-leak';
    const missing = await invoke('GET');
    assert.strictEqual(missing.res.statusCode, 503);
    assert.deepStrictEqual(missing.json, { ok: false, error: 'reviews_unavailable' });
    assert.strictEqual(missing.res.headers['cache-control'], 'no-store');
    assert.strictEqual(missing.res.body.includes('canary-client-id-do-not-leak'), false);
    assert.strictEqual(missing.res.body.includes('canary-cron-secret-do-not-leak'), false);

    const authorized = await invoke('GET', { authorization: 'Bearer canary-cron-secret-do-not-leak' });
    assert.strictEqual(authorized.res.statusCode, 503);
    assert.strictEqual(authorized.json.code, 'not_configured');
    assert.strictEqual(authorized.res.body.includes('canary-client-id-do-not-leak'), false);

    const rejected = await invoke('POST', { authorization: 'Bearer wrong' });
    assert.strictEqual(rejected.res.statusCode, 405);
    assert.strictEqual(rejected.json.code, undefined);

    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret-do-not-leak';
    process.env.GOOGLE_REFRESH_TOKEN = 'refresh-token-do-not-leak';
    process.env.GOOGLE_BUSINESS_ACCOUNT_ID = 'accounts/55';
    process.env.GOOGLE_BUSINESS_LOCATION_ID = 'locations/77';
    process.env.GOOGLE_REVIEWS_CACHE_SECONDS = '3600';
    process.env.CRON_SECRET = 'cron-secret-do-not-leak';
    reviews.resetState();

    const originalFetch = global.fetch;
    const calls = [];
    function jsonResponse(body, status = 200) {
      return { ok: status >= 200 && status < 300, status, json: async () => body };
    }
    global.fetch = async (url, options) => {
      const href = String(url);
      calls.push(href);
      if (href.includes('oauth2.googleapis.com/token')) {
        return jsonResponse({ access_token: 'ya29-test-token', expires_in: 3600 });
      }
      if (href.includes('/accounts/55/locations/77/reviews')) {
        assert.strictEqual(options.headers.Authorization, 'Bearer ya29-test-token');
        const pageToken = new URL(href).searchParams.get('pageToken');
        if (!pageToken) {
          return jsonResponse({
            reviews: [
              {
                reviewId: 'p1',
                reviewer: { displayName: 'Asha' },
                starRating: 'FIVE',
                comment: 'Great',
                createTime: '2026-01-01T00:00:00Z',
              },
            ],
            nextPageToken: 'page-2',
          });
        }
        return jsonResponse({
          reviews: [
            { reviewId: 'p1', reviewer: { displayName: 'Asha' }, starRating: 'ONE', comment: 'dup' },
            { reviewId: 'p2', reviewer: { displayName: 'Ravi' }, starRating: 'FOUR', comment: 'Second page' },
          ],
        });
      }
      throw new Error('unexpected url');
    };

    try {
      const live = mockRes();
      await reviews({ method: 'GET', headers: {} }, live);
      const liveJson = JSON.parse(live.body);
      assert.strictEqual(live.statusCode, 200);
      assert.strictEqual(liveJson.ok, true);
      assert.strictEqual(liveJson.source, 'google');
      assert.strictEqual(liveJson.count, 2);
      assert.deepStrictEqual(liveJson.reviews.map((review) => review.id), ['p1', 'p2']);
      assert.strictEqual(live.body.includes('ya29-test-token'), false);
      assert.strictEqual(live.body.includes('client-secret-do-not-leak'), false);
      assert.strictEqual(live.body.includes('refresh-token-do-not-leak'), false);
      assert.ok(live.headers['cache-control'].includes('s-maxage=3600'));
      assert.ok(calls.some((href) => href.includes('pageToken=page-2')));

      const beforeCacheCalls = calls.length;
      const cached = mockRes();
      await reviews({ method: 'GET', headers: {} }, cached);
      assert.strictEqual(calls.length, beforeCacheCalls);
      assert.strictEqual(JSON.parse(cached.body).stale, false);

      reviews.expireFreshCache();
      global.fetch = async (url) => {
        const href = String(url);
        if (href.includes('oauth2.googleapis.com/token')) {
          return jsonResponse({ access_token: 'ya29-test-token', expires_in: 3600 });
        }
        return jsonResponse({}, 503);
      };
      const failed = mockRes();
      await reviews({ method: 'GET', headers: {} }, failed);
      const failedJson = JSON.parse(failed.body);
      assert.strictEqual(failed.statusCode, 200);
      assert.strictEqual(failedJson.stale, true);
      assert.strictEqual(failedJson.reviews.length, 2);
      assert.strictEqual(failed.body.includes('network down'), false);

      const authorizedFailure = mockRes();
      await reviews({ method: 'GET', headers: { authorization: 'Bearer cron-secret-do-not-leak' } }, authorizedFailure);
      assert.strictEqual(authorizedFailure.statusCode, 503);
      assert.strictEqual(JSON.parse(authorizedFailure.body).code, 'upstream_failed');
      assert.strictEqual(authorizedFailure.body.includes('ya29-test-token'), false);
    } finally {
      global.fetch = originalFetch;
    }

    const client = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'google-reviews.js'), 'utf8');
    const homepage = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const apiSource = fs.readFileSync(path.join(ROOT, 'api', 'google-reviews.js'), 'utf8');
    [client, homepage].forEach((source) => {
      assert.strictEqual(source.includes('GOOGLE_CLIENT_SECRET'), false);
      assert.strictEqual(source.includes('GOOGLE_REFRESH_TOKEN'), false);
      assert.strictEqual(source.includes('innerHTML'), false);
    });
    assert.strictEqual(client.includes('textContent'), true);
    assert.strictEqual(homepage.includes('They rebuilt our website and improved our Google visibility.'), true);
    assert.strictEqual(homepage.includes('assets/js/google-reviews.js?v=1'), true);
    assert.strictEqual(apiSource.includes('mybusiness.googleapis.com/v4'), true);
    assert.strictEqual(apiSource.includes('canary-client-id-do-not-leak'), false);

    console.log('Google reviews checks passed.');
  } finally {
    reviews.resetState();
    restoreEnv();
  }
}

main().catch((err) => {
  console.error(err);
  reviews.resetState();
  restoreEnv();
  process.exit(1);
});
