'use strict';

/**
 * Lists Business Profile accounts and locations so the reviews function
 * can be pointed at the verified location.
 *
 * PowerShell:
 *   $env:GOOGLE_CLIENT_ID="..."
 *   $env:GOOGLE_CLIENT_SECRET="..."
 *   $env:GOOGLE_REFRESH_TOKEN="..."
 *   node scripts/google-business-locations.js
 */

const reviews = require('../api/google-reviews');

function required(config) {
  const missing = [];
  if (!config.clientId) missing.push('GOOGLE_CLIENT_ID');
  if (!config.clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
  if (!config.refreshToken) missing.push('GOOGLE_REFRESH_TOKEN');
  if (missing.length) {
    console.error('Missing ' + missing.join(', ') + '.');
    process.exit(1);
  }
}

function addressLine(location) {
  const address = location && location.storefrontAddress;
  if (!address || typeof address !== 'object') return '';
  const lines = Array.isArray(address.addressLines) ? address.addressLines : [];
  return lines.filter((line) => typeof line === 'string').join(', ');
}

async function main() {
  const config = reviews.readConfig();
  required(config);
  let token;
  try {
    token = await reviews.refreshAccessToken(config);
  } catch (err) {
    console.error('Could not refresh the Google access token (' + ((err && err.code) || 'authorization_failed') + ').');
    console.error('Check the OAuth client, refresh token, and that the Business Profile APIs are enabled.');
    process.exit(1);
  }

  let accounts;
  try {
    accounts = await reviews.listAccounts(token);
  } catch (err) {
    console.error('Account lookup failed (' + ((err && err.status) || 'network') + ').');
    console.error('Enable My Business Account Management API, My Business Business Information API, and Google My Business API.');
    console.error('Request access: https://developers.google.com/my-business/content/prereqs');
    process.exit(1);
  }

  if (!accounts.length) {
    console.error('No Business Profile accounts were returned for this Google account.');
    process.exit(1);
  }

  for (const account of accounts) {
    const name = typeof account.name === 'string' ? account.name : '';
    const label = typeof account.accountName === 'string' ? account.accountName : name;
    console.log('Account: ' + label + ' (' + name + ')');
    if (!name) continue;
    let locations;
    try {
      locations = await reviews.listLocations(token, name);
    } catch (err) {
      console.error('  Location lookup failed (' + ((err && err.status) || 'network') + ').');
      continue;
    }
    if (!locations.length) {
      console.log('  No locations returned.');
      continue;
    }
    locations.forEach((location) => {
      const locationName = typeof location.name === 'string' ? location.name : '';
      const title = typeof location.title === 'string' ? location.title : locationName;
      const accountId = reviews.resourceId(name, 'accounts');
      const locationId = reviews.resourceId(locationName, 'locations');
      console.log('  Location: ' + title + (addressLine(location) ? ' — ' + addressLine(location) : ''));
      console.log('    GOOGLE_BUSINESS_ACCOUNT_ID=' + accountId);
      console.log('    GOOGLE_BUSINESS_LOCATION_ID=' + locationId);
    });
  }
}

main().catch(() => {
  console.error('Could not list Business Profile locations.');
  process.exit(1);
});
