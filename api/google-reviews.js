'use strict';

/**
 * Server-side Google Business Profile reviews.
 * Credentials are read from the environment and are never included in the response.
 *
 * Official reviews endpoint:
 * https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews
 */

const crypto = require('crypto');

const STAR_RATINGS = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
const DEFAULT_CACHE_SECONDS = 60 * 60;
const MAX_STALE_MS = 24 * 60 * 60 * 1000;
const FAILURE_COOLDOWN_MS = 60 * 1000;
const MAX_UPSTREAM_PER_HOUR = 30;
const MAX_PAGES = 10;
const PAGE_SIZE = 50;
const REVIEWS_ENDPOINT = 'https://mybusiness.googleapis.com/v4';

const memory = {
  payload: null,
  freshUntil: 0,
  staleUntil: 0,
  lastFailureAt: 0,
  token: null,
  tokenExpiresAt: 0,
  inflight: null,
  upstreamHits: [],
};

function resetState() {
  memory.payload = null;
  memory.freshUntil = 0;
  memory.staleUntil = 0;
  memory.lastFailureAt = 0;
  memory.token = null;
  memory.tokenExpiresAt = 0;
  memory.inflight = null;
  memory.upstreamHits = [];
}

function clampInt(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function resourceId(value, collection) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const match = raw.match(new RegExp('(?:^|/)' + collection + '/([^/]+)'));
  if (match) return match[1];
  if (!/^[A-Za-z0-9_-]+$/.test(raw)) return '';
  return raw;
}

function readConfig() {
  return {
    clientId: String(process.env.GOOGLE_CLIENT_ID || '').trim(),
    clientSecret: String(process.env.GOOGLE_CLIENT_SECRET || '').trim(),
    refreshToken: String(process.env.GOOGLE_REFRESH_TOKEN || '').trim(),
    accountId: resourceId(process.env.GOOGLE_BUSINESS_ACCOUNT_ID, 'accounts'),
    locationId: resourceId(process.env.GOOGLE_BUSINESS_LOCATION_ID, 'locations'),
    cacheSeconds: clampInt(process.env.GOOGLE_REVIEWS_CACHE_SECONDS, DEFAULT_CACHE_SECONDS, 300, 86400),
    syncSecret: String(process.env.CRON_SECRET || process.env.REVIEWS_SYNC_SECRET || '').trim(),
  };
}

function isConfigured(config) {
  return Boolean(
    config.clientId &&
      config.clientSecret &&
      config.refreshToken &&
      config.accountId &&
      config.locationId
  );
}

function headerValue(req, name) {
  const headers = (req && req.headers) || {};
  const raw = headers[name] || headers[name.toLowerCase()] || '';
  const value = Array.isArray(raw) ? raw[0] : raw;
  return String(value || '');
}

function safeEqual(leftValue, rightValue) {
  const left = Buffer.from(String(leftValue));
  const right = Buffer.from(String(rightValue));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function isSyncRequest(req, secret) {
  if (!secret) return false;
  const header = headerValue(req, 'authorization');
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  return safeEqual(match[1].trim(), secret);
}

function send(res, status, body, cacheControl) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cacheControl);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Length', Buffer.byteLength(payload));
  res.end(payload);
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function plainReviewText(value) {
  if (typeof value !== 'string') return '';
  let text = value.replace(/\u0000/g, '').replace(/\r\n/g, '\n').trim();
  if (/\(Original\)/i.test(text)) {
    const parts = text.split(/\n?\(Original\)\n?/i);
    text = parts[parts.length - 1].trim();
  }
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  text = decodeEntities(text.replace(/<[^>]*>/g, ''));
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  if (text.length > 5000) text = text.slice(0, 5000).trim();
  return text;
}

function safePhotoUrl(value) {
  if (typeof value !== 'string' || !value || value.length > 2000) return null;
  let url;
  try {
    url = new URL(value);
  } catch (err) {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  const allowed =
    host === 'googleusercontent.com' ||
    host.endsWith('.googleusercontent.com') ||
    host === 'ggpht.com' ||
    host.endsWith('.ggpht.com');
  if (!allowed) return null;
  return url.toString();
}

function validTime(value) {
  if (typeof value !== 'string' || !value) return null;
  const time = Date.parse(value);
  if (Number.isNaN(time)) return null;
  return new Date(time).toISOString();
}

function clip(value, max) {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trim() + '\u2026';
}

function normalizeReview(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const reviewId = typeof raw.reviewId === 'string' ? raw.reviewId.trim() : '';
  const resourceName = typeof raw.name === 'string' ? raw.name.trim() : '';
  const id = reviewId || resourceName;
  if (!id || id.length > 300) return null;
  const reviewer = raw.reviewer && typeof raw.reviewer === 'object' ? raw.reviewer : {};
  const anonymous = reviewer.isAnonymous === true;
  const displayName = typeof reviewer.displayName === 'string' ? reviewer.displayName.trim() : '';
  const author = !anonymous && displayName ? clip(displayName, 120) : 'Google reviewer';
  const rating = Object.prototype.hasOwnProperty.call(STAR_RATINGS, raw.starRating)
    ? STAR_RATINGS[raw.starRating]
    : null;
  const text = plainReviewText(raw.comment);
  if (!text) return null;
  return {
    id,
    author,
    rating,
    text,
    photoUrl: safePhotoUrl(reviewer.profilePhotoUrl),
    publishedAt: validTime(raw.createTime),
    updatedAt: validTime(raw.updateTime),
  };
}

function normalizeReviews(rawList) {
  const seen = new Set();
  const reviews = [];
  const list = Array.isArray(rawList) ? rawList : [];
  for (const raw of list) {
    const review = normalizeReview(raw);
    if (!review || seen.has(review.id)) continue;
    seen.add(review.id);
    reviews.push(review);
  }
  return reviews;
}

function upstreamError(status) {
  const err = new Error('reviews_failed');
  err.status = status;
  if (status === 429) err.code = 'rate_limited';
  else if (status === 403) err.code = 'permission_denied';
  else if (status === 401) err.code = 'authorization_expired';
  else err.code = 'upstream_failed';
  return err;
}

async function refreshAccessToken(config) {
  const now = Date.now();
  if (memory.token && memory.tokenExpiresAt > now + 60000) return memory.token;
  let response;
  try {
    response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    const wrapped = new Error('token_failed');
    wrapped.code = 'authorization_failed';
    throw wrapped;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data || typeof data.access_token !== 'string') {
    memory.token = null;
    memory.tokenExpiresAt = 0;
    const wrapped = new Error('token_failed');
    wrapped.code = data && data.error === 'invalid_grant' ? 'authorization_expired' : 'authorization_failed';
    wrapped.status = response.status;
    throw wrapped;
  }
  memory.token = data.access_token;
  memory.tokenExpiresAt = now + (Number(data.expires_in) || 3000) * 1000;
  return memory.token;
}

async function fetchAllReviews(config, accessToken) {
  const reviews = [];
  const seenTokens = new Set();
  let pageToken = '';
  let token = accessToken;
  let refreshed = false;
  let useOrderBy = true;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    if (pageToken) {
      if (seenTokens.has(pageToken)) break;
      seenTokens.add(pageToken);
    }
    const url = new URL(
      REVIEWS_ENDPOINT +
        '/accounts/' +
        encodeURIComponent(config.accountId) +
        '/locations/' +
        encodeURIComponent(config.locationId) +
        '/reviews'
    );
    url.searchParams.set('pageSize', String(PAGE_SIZE));
    if (useOrderBy) url.searchParams.set('orderBy', 'updateTime desc');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    let response;
    try {
      response = await fetch(url, {
        headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
    } catch (err) {
      throw upstreamError(0);
    }
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && !refreshed) {
      refreshed = true;
      memory.token = null;
      memory.tokenExpiresAt = 0;
      token = await refreshAccessToken(config);
      page -= 1;
      continue;
    }
    if (response.status === 400 && useOrderBy) {
      useOrderBy = false;
      page -= 1;
      continue;
    }
    if (!response.ok) throw upstreamError(response.status);
    if (Array.isArray(data.reviews)) reviews.push(...data.reviews);
    pageToken = typeof data.nextPageToken === 'string' ? data.nextPageToken : '';
    if (!pageToken) break;
  }
  return reviews;
}

function allowUpstream(now) {
  memory.upstreamHits = memory.upstreamHits.filter((hit) => now - hit < 60 * 60 * 1000);
  if (memory.upstreamHits.length >= MAX_UPSTREAM_PER_HOUR) return false;
  memory.upstreamHits.push(now);
  return true;
}

function stalePayload() {
  if (!memory.payload || Date.now() >= memory.staleUntil) return null;
  return Object.assign({}, memory.payload, { stale: true });
}

async function fetchAndStore(config) {
  const accessToken = await refreshAccessToken(config);
  const raw = await fetchAllReviews(config, accessToken);
  const reviews = normalizeReviews(raw);
  const now = Date.now();
  const payload = {
    ok: true,
    source: 'google',
    stale: false,
    fetchedAt: new Date(now).toISOString(),
    count: reviews.length,
    reviews,
  };
  memory.payload = payload;
  memory.freshUntil = now + config.cacheSeconds * 1000;
  memory.staleUntil = now + MAX_STALE_MS;
  memory.lastFailureAt = 0;
  return payload;
}

async function loadReviews(config, force) {
  const now = Date.now();
  if (!force && memory.payload && now < memory.freshUntil) return memory.payload;
  if (!force && memory.inflight) return memory.inflight;
  if (!force && memory.lastFailureAt && now - memory.lastFailureAt < FAILURE_COOLDOWN_MS) {
    const stale = stalePayload();
    if (stale) return stale;
    const err = new Error('upstream_failed');
    err.code = 'upstream_failed';
    throw err;
  }
  if (!allowUpstream(now)) {
    const stale = stalePayload();
    if (stale) return stale;
    const err = new Error('rate_limited');
    err.code = 'rate_limited';
    throw err;
  }

  const run = fetchAndStore(config).catch((err) => {
    memory.lastFailureAt = Date.now();
    throw err;
  });
  memory.inflight = run;
  try {
    return await run;
  } finally {
    if (memory.inflight === run) memory.inflight = null;
  }
}

async function listAccounts(accessToken) {
  const response = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
    headers: { Authorization: 'Bearer ' + accessToken, Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error('accounts_failed');
    err.status = response.status;
    err.code = 'upstream_failed';
    throw err;
  }
  return Array.isArray(data.accounts) ? data.accounts : [];
}

async function listLocations(accessToken, accountName) {
  if (!/^accounts\/[A-Za-z0-9_-]+$/.test(accountName)) {
    const err = new Error('invalid_account');
    err.code = 'upstream_failed';
    throw err;
  }
  const locations = [];
  let pageToken = '';
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL(
      'https://mybusinessbusinessinformation.googleapis.com/v1/' + accountName + '/locations'
    );
    url.searchParams.set('readMask', 'name,title,storefrontAddress');
    url.searchParams.set('pageSize', '100');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const response = await fetch(url, {
      headers: { Authorization: 'Bearer ' + accessToken, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error('locations_failed');
      err.status = response.status;
      err.code = 'upstream_failed';
      throw err;
    }
    if (Array.isArray(data.locations)) locations.push(...data.locations);
    pageToken = typeof data.nextPageToken === 'string' ? data.nextPageToken : '';
    if (!pageToken) break;
  }
  return locations;
}

async function handler(req, res) {
  const config = readConfig();
  const authorized = isSyncRequest(req, config.syncSecret);
  if (!req || (req.method !== 'GET' && req.method !== 'HEAD')) {
    send(res, 405, { ok: false, error: 'reviews_unavailable' }, 'no-store');
    return;
  }
  if (!isConfigured(config)) {
    const body = { ok: false, error: 'reviews_unavailable' };
    if (authorized) body.code = 'not_configured';
    send(res, 503, body, 'no-store');
    return;
  }

  try {
    const payload = await loadReviews(config, authorized);
    const cacheControl = authorized
      ? 'private, no-store'
      : 'public, max-age=0, s-maxage=' + config.cacheSeconds + ', stale-while-revalidate=600';
    if (req.method === 'HEAD') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', cacheControl);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.end();
      return;
    }
    send(res, 200, payload, cacheControl);
  } catch (err) {
    const code = err && err.code ? err.code : 'upstream_failed';
    console.error('[google-reviews]', code);
    const stale = stalePayload();
    if (stale && !authorized) {
      send(res, 200, stale, 'public, max-age=0, s-maxage=60, stale-while-revalidate=60');
      return;
    }
    const body = { ok: false, error: 'reviews_unavailable' };
    if (authorized) body.code = code;
    send(res, 503, body, 'no-store');
  }
}

handler.resetState = resetState;
handler.expireFreshCache = () => {
  memory.freshUntil = 0;
};
handler.readConfig = readConfig;
handler.isConfigured = isConfigured;
handler.resourceId = resourceId;
handler.normalizeReview = normalizeReview;
handler.normalizeReviews = normalizeReviews;
handler.plainReviewText = plainReviewText;
handler.safePhotoUrl = safePhotoUrl;
handler.refreshAccessToken = refreshAccessToken;
handler.listAccounts = listAccounts;
handler.listLocations = listLocations;

module.exports = handler;
