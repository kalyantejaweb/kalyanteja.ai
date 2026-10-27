'use strict';

/**
 * One-time local helper. Prints a refresh token. Does not write it to disk.
 *
 * PowerShell:
 *   $env:GOOGLE_CLIENT_ID="..."
 *   $env:GOOGLE_CLIENT_SECRET="..."
 *   node scripts/google-business-auth.js
 *
 * Register this redirect URI on the OAuth client first:
 *   http://localhost:8787/oauth/callback
 */

const http = require('http');
const { URL } = require('url');

const PORT = 8787;
const REDIRECT_URI = 'http://localhost:' + PORT + '/oauth/callback';
const SCOPE = 'https://www.googleapis.com/auth/business.manage';

function required(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    console.error('Missing ' + name + '. Set it in the environment for this command only.');
    process.exit(1);
  }
  return value;
}

async function exchangeCode(clientId, clientSecret, code) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Token exchange failed (' + response.status + ').');
    console.error('Google error: ' + (data.error || 'unknown') + '.');
    process.exit(1);
  }
  return data;
}

function main() {
  const clientId = required('GOOGLE_CLIENT_ID');
  const clientSecret = required('GOOGLE_CLIENT_SECRET');
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPE);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('include_granted_scopes', 'true');

  const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, REDIRECT_URI);
    if (requestUrl.pathname !== '/oauth/callback') {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    const oauthError = requestUrl.searchParams.get('error');
    if (oauthError) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Authorization was not completed. You can close this tab.');
      console.error('Authorization was not completed (' + oauthError + ').');
      server.close();
      process.exit(1);
    }
    const code = requestUrl.searchParams.get('code');
    if (!code) {
      res.statusCode = 400;
      res.end('Missing authorization code.');
      return;
    }
    try {
      const token = await exchangeCode(clientId, clientSecret, code);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Authorization complete. Return to the terminal. You can close this tab.');
      if (!token.refresh_token) {
        console.error('Google did not return a refresh token. Remove the app\'s access in the Google Account and run this command again.');
        server.close();
        process.exit(1);
      }
      console.log('');
      console.log('Store this value as GOOGLE_REFRESH_TOKEN in Vercel. Do not commit it.');
      console.log(token.refresh_token);
      console.log('');
      server.close();
      process.exit(0);
    } catch (err) {
      res.statusCode = 500;
      res.end('Token exchange failed.');
      console.error('Token exchange could not be completed.');
      server.close();
      process.exit(1);
    }
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log('Open this URL in the Google account that manages the Business Profile:');
    console.log(authUrl.toString());
    console.log('');
    console.log('Waiting for the callback on ' + REDIRECT_URI);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error('Port ' + PORT + ' is already in use. Stop the other process and run this command again.');
    } else {
      console.error('Could not start the local authorization listener.');
    }
    process.exit(1);
  });

  setTimeout(() => {
    console.error('Timed out waiting for authorization.');
    server.close();
    process.exit(1);
  }, 5 * 60 * 1000).unref();
}

main();
