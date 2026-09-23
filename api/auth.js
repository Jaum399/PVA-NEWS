const { createCookie, clearCookie, isValid } = require('./session');

function json(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(body));
}

module.exports = async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  if (request.method === 'POST') {
    const input = request.body || {};
    const user = process.env.ADMIN_USER || 'francimar';
    const password = process.env.ADMIN_PASSWORD || process.env.FRANCIMAR;
    if (!password || input.username !== user || input.password !== password) return json(response, 401, { error: 'Usuario ou senha invalidos' });
    response.setHeader('Set-Cookie', createCookie());
    return json(response, 200, { authenticated: true });
  }
  if (request.method === 'DELETE') {
    response.setHeader('Set-Cookie', clearCookie());
    return json(response, 200, { authenticated: false });
  }
  if (request.method === 'GET') return json(response, 200, { authenticated: isValid(request) });
  return json(response, 405, { error: 'Metodo nao permitido' });
};
