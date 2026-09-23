const crypto = require('crypto');

const COOKIE_NAME = 'pva_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || process.env.FRANCIMAR || '';
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

function createCookie() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `admin:${expires}`;
  return `${COOKIE_NAME}=${payload}.${sign(payload)}; Max-Age=${SESSION_TTL_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

function clearCookie() {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

function getCookie(request) {
  const cookies = String(request.headers.cookie || '').split(';');
  const item = cookies.find((part) => part.trim().startsWith(`${COOKIE_NAME}=`));
  return item ? decodeURIComponent(item.trim().slice(COOKIE_NAME.length + 1)) : '';
}

function isValid(request) {
  const [payload, signature] = getCookie(request).split('.');
  const expected = payload && secret() ? sign(payload) : '';
  if (!payload || !signature || !expected || signature.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  const [subject, expires] = payload.split(':');
  return subject === 'admin' && Number(expires) > Math.floor(Date.now() / 1000);
}

module.exports = { createCookie, clearCookie, isValid };
