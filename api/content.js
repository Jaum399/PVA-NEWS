const { MongoClient } = require('mongodb');

let cachedClient;
let cachedDb;

async function getDb() {
  if (cachedDb) return cachedDb;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI nao configurada');

  cachedClient = cachedClient || new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 5,
    minPoolSize: 0,
    maxIdleTimeMS: 20000,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000
  });
  await cachedClient.connect();
  cachedDb = cachedClient.db(process.env.MONGODB_DB || 'pva_news');
  return cachedDb;
}

function json(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(body));
}

function isAuthorized(request) {
  const expected = process.env.ADMIN_TOKEN;
  const adminUser = process.env.ADMIN_USER || 'francimar';
  const adminPassword = process.env.ADMIN_PASSWORD || process.env.FRANCIMAR;
  const authorization = request.headers.authorization || '';
  if (expected && authorization === `Bearer ${expected}`) return true;

  const [scheme, encoded] = authorization.split(' ');
  if (scheme !== 'Basic' || !encoded || !adminPassword) return false;
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const separator = decoded.indexOf(':');
  return separator > 0 && decoded.slice(0, separator) === adminUser && decoded.slice(separator + 1) === adminPassword;
}

function normalizeArticle(input) {
  const title = String(input.title || '').trim();
  const summary = String(input.summary || '').trim();
  const category = String(input.category || 'locais').trim();
  if (!title || !summary) throw new Error('Titulo e resumo sao obrigatorios');
  if (!['politica', 'saude', 'locais', 'economia', 'tecnologia'].includes(category)) throw new Error('Categoria invalida');
  return {
    title,
    summary,
    category,
    imageUrl: String(input.imageUrl || '').trim(),
    author: String(input.author || 'Redacao PVA NEWS').trim(),
    published: Boolean(input.published),
    updatedAt: new Date()
  };
}

module.exports = async function handler(request, response) {
  try {
    const db = await getDb();
    const articles = db.collection('articles');
    await articles.createIndex({ published: 1, updatedAt: -1 });

    if (request.method === 'GET') {
      const filter = request.query?.admin === '1' && isAuthorized(request) ? {} : { published: true };
      const items = await articles.find(filter).sort({ updatedAt: -1 }).limit(100).toArray();
      return json(response, 200, { articles: items });
    }

    if (!isAuthorized(request)) return json(response, 401, { error: 'Nao autorizado' });

    if (request.method === 'POST') {
      const article = normalizeArticle(request.body || {});
      const result = await articles.insertOne({ ...article, createdAt: new Date() });
      return json(response, 201, { article: { _id: result.insertedId, ...article } });
    }

    if (request.method === 'PUT') {
      const { ObjectId } = require('mongodb');
      const id = request.body?._id;
      if (!id || !ObjectId.isValid(id)) return json(response, 400, { error: 'ID invalido' });
      const article = normalizeArticle(request.body);
      const result = await articles.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: article }, { returnDocument: 'after' });
      if (!result) return json(response, 404, { error: 'Noticia nao encontrada' });
      return json(response, 200, { article: result });
    }

    if (request.method === 'DELETE') {
      const { ObjectId } = require('mongodb');
      const id = request.body?._id;
      if (!id || !ObjectId.isValid(id)) return json(response, 400, { error: 'ID invalido' });
      await articles.deleteOne({ _id: new ObjectId(id) });
      return json(response, 200, { ok: true });
    }

    return json(response, 405, { error: 'Metodo nao permitido' });
  } catch (error) {
    console.error(error);
    return json(response, 500, { error: 'Falha ao acessar o conteudo' });
  }
};
