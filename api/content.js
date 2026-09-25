const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { isValid } = require('./session');
const { ValidationError, assessEditorialRisk, normalizeArticle, normalizeImageUrl, normalizeHttpsUrl } = require('./editorial-review');

let cachedClient;
let cachedDb;

async function getDb() {
  if (cachedDb) return cachedDb;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI nao configurada');
  cachedClient = cachedClient || new MongoClient(process.env.MONGODB_URI, {
    tls: true, tlsAllowInvalidCertificates: false, family: 4, maxPoolSize: 5,
    minPoolSize: 0, maxIdleTimeMS: 20000, serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000, serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
  });
  await cachedClient.connect();
  cachedDb = cachedClient.db(process.env.MONGODB_DB || 'pva_news');
  return cachedDb;
}

function json(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(body));
}

function isAuthorized(request) {
  return isValid(request);
}

function normalizeAd(input) {
  const company = String(input.company || '').trim();
  const title = String(input.title || '').trim();
  const description = String(input.description || '').trim();
  if (!company || !title || !description) throw new ValidationError('Empresa, titulo e descricao sao obrigatorios');
  const link = normalizeHttpsUrl(input.link, 'O link deve usar uma URL HTTPS valida');
  return { company, title, description, link, imageUrl: normalizeImageUrl(input.imageUrl), active: Boolean(input.active), updatedAt: new Date() };
}

module.exports = async function handler(request, response) {
  try {
    const resource = request.query?.resource === 'ads' ? 'ads' : 'articles';
    const adminRequest = request.query?.admin === '1';
    const writeRequest = ['POST', 'PUT', 'DELETE'].includes(request.method);
    if ((adminRequest || writeRequest) && !isAuthorized(request)) return json(response, 401, { error: 'Sessao administrativa invalida' });
    const db = await getDb();
    const collection = db.collection(resource);
    await collection.createIndex(resource === 'ads' ? { active: 1, updatedAt: -1 } : { published: 1, updatedAt: -1 });
    if (request.method === 'GET') {
      const requestedId = request.query?.id;
      if (requestedId) {
        if (!ObjectId.isValid(requestedId)) return json(response, 400, { error: 'ID invalido' });
        const article = await collection.findOne({ _id: new ObjectId(requestedId), ...(adminRequest ? {} : resource === 'ads' ? { active: true } : { published: true }) });
        if (!article) return json(response, 404, { error: 'Noticia nao encontrada' });
        return json(response, 200, { article });
      }
      const filter = adminRequest ? {} : resource === 'ads' ? { active: true } : { published: true };
      let items = await collection.find(filter).sort({ updatedAt: -1 }).limit(100).toArray();
      if (adminRequest && resource === 'articles') {
        items = items.map((article) => ({
          ...article,
          editorialAssessment: assessEditorialRisk({
            ...article,
            verificationSources: Array.isArray(article.verificationSources) ? article.verificationSources : []
          })
        }));
      }
      return json(response, 200, resource === 'ads' ? { ads: items } : { articles: items });
    }
    if (request.method === 'POST') {
      const item = resource === 'ads' ? normalizeAd(request.body || {}) : normalizeArticle(request.body || {});
      const result = await collection.insertOne({ ...item, createdAt: new Date() });
      return json(response, 201, resource === 'ads' ? { ad: { _id: result.insertedId, ...item } } : { article: { _id: result.insertedId, ...item } });
    }
    if (request.method === 'PUT') {
      const id = request.body?._id;
      if (!id || !ObjectId.isValid(id)) return json(response, 400, { error: 'ID invalido' });
      const item = resource === 'ads' ? normalizeAd(request.body) : normalizeArticle(request.body);
      const result = await collection.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: item }, { returnDocument: 'after' });
      if (!result) return json(response, 404, { error: 'Noticia nao encontrada' });
      if (resource === 'ads') return json(response, 200, { ad: result });
      return json(response, 200, {
        article: {
          ...result,
          editorialAssessment: assessEditorialRisk(item)
        }
      });
    }
    if (request.method === 'DELETE') {
      const id = request.body?._id;
      if (!id || !ObjectId.isValid(id)) return json(response, 400, { error: 'ID invalido' });
      await collection.deleteOne({ _id: new ObjectId(id) });
      return json(response, 200, { ok: true });
    }
    return json(response, 405, { error: 'Metodo nao permitido' });
  } catch (error) {
    console.error(error);
    if (error instanceof ValidationError) return json(response, 400, { error: error.message });
    const connectionError = ['MongoServerSelectionError', 'MongoNetworkError'].includes(error.name);
    return json(response, connectionError ? 503 : 500, { error: connectionError ? 'Banco de dados indisponivel' : 'Falha ao acessar o conteudo' });
  }
};
