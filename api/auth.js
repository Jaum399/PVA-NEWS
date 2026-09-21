const crypto = require('crypto');

const COOKIE_NAME = 'pva_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function json(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(body));
}

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

function createSession() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `admin:${expires}`;
  return `${payload}.${sign(payload)}`;
}

function parseCookies(value = '') {
  return Object.fromEntries(value.split(';').map((part) => part.trim().split('=').map(decodeURIComponent)).filter(([key, item]) => key && item));
}

function validSession(request) {
  const token = parseCookies(request.headers.cookie).pva_admin_session || '';
  const [payload, signature] = token.split('.');
  const expected = payload && secret() ? sign(payload) : '';
  if (!payload || !signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  const [subject, expires] = payload.split(':');
  return subject === 'admin' && Number(expires) > Math.floor(Date.now() / 1000);
}

module.exports = async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  if (request.method === 'POST') {
    const input = request.body || {};
    const user = process.env.ADMIN_USER || 'francimar';
    const password = process.env.ADMIN_PASSWORD || process.env.FRANCIMAR;
    if (!password || input.username !== user || input.password !== password) return json(response, 401, { error: 'Usuário ou senha inválidos' });
    response.setHeader('Set-Cookie', `${COOKIE_NAME}=${createSession()}; Max-Age=${SESSION_TTL_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Strict`);
    return json(response, 200, { authenticated: true });
  }

  if (request.method === 'DELETE') {
    response.setHeader('Set-Cookie', `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`);
    return json(response, 200, { authenticated: false });
  }

  if (request.method === 'GET') return json(response, 200, { authenticated: validSession(request) });
  return json(response, 405, { error: 'Método não permitido' });
};
