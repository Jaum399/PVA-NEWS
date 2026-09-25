const sensationalLanguage = /\b(urgente|chocante|bomba|milagre|inacredit[aá]vel|imperd[ií]vel|revelado|ningu[eé]m conta|compartilhe agora)\b/i;

class ValidationError extends Error {}

function normalizeHttpsUrl(value, errorMessage) {
  const url = String(value || '').trim();
  if (!url) return '';
  let parsed;
  try {
    parsed = new URL(url);
  } catch (error) {
    throw new ValidationError(errorMessage);
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new ValidationError(errorMessage);
  }
  return parsed.toString();
}

function normalizeVerificationSources(value) {
  const values = Array.isArray(value) ? value : String(value || '').split(/\r?\n/);
  if (values.length > 5) throw new ValidationError('Informe no maximo cinco fontes');
  return values
    .map((source) => normalizeHttpsUrl(source, 'Cada fonte deve ser uma URL valida com HTTPS'))
    .filter(Boolean);
}

function normalizeImageUrl(value) {
  const imageUrl = String(value || '').trim();
  if (!imageUrl) return '';
  if (/^data:image\/(?:jpeg|png|webp|gif);base64,/i.test(imageUrl)) return imageUrl;
  return normalizeHttpsUrl(imageUrl, 'A imagem deve usar uma URL HTTPS valida');
}

function assessEditorialRisk(article) {
  const title = String(article.title || '');
  const text = `${title} ${article.summary || ''}`;
  const flags = [];
  let score = 0;
  const sourceCount = Array.isArray(article.verificationSources) ? article.verificationSources.length : 0;
  if (!sourceCount) {
    flags.push('Nenhuma fonte registrada');
    score += 45;
  } else if (sourceCount < 2) {
    flags.push('Considere confirmar com uma segunda fonte independente');
    score += 15;
  }
  if (sensationalLanguage.test(text)) {
    flags.push('Linguagem potencialmente sensacionalista: revisar contexto e tom');
    score += 30;
  }
  if (title.length > 12 && title === title.toLocaleUpperCase('pt-BR')) {
    flags.push('Titulo inteiramente em maiusculas');
    score += 15;
  }
  if (/[!?]{2,}/.test(text)) {
    flags.push('Pontuacao enfatica em excesso');
    score += 10;
  }
  score = Math.min(score, 100);
  return {
    score,
    level: score >= 35 ? 'review' : score >= 15 ? 'attention' : 'low',
    flags
  };
}

function normalizeArticle(input) {
  const title = String(input.title || '').trim();
  const summary = String(input.summary || '').trim();
  const category = String(input.category || 'locais').trim();
  if (!title || !summary) throw new ValidationError('Titulo e resumo sao obrigatorios');
  if (!['politica', 'saude', 'locais', 'economia', 'tecnologia'].includes(category)) {
    throw new ValidationError('Categoria invalida');
  }
  const verificationSources = normalizeVerificationSources(input.verificationSources);
  const editorialReviewed = input.editorialReviewed === true;
  const article = {
    title,
    summary,
    category,
    imageUrl: normalizeImageUrl(input.imageUrl),
    author: String(input.author || 'Redacao PVA NEWS').trim(),
    verificationSources,
    editorialReviewed,
    editorialReviewedAt: editorialReviewed ? new Date() : null,
    published: Boolean(input.published),
    updatedAt: new Date()
  };
  if (article.published && (!editorialReviewed || verificationSources.length === 0)) {
    throw new ValidationError('Para publicar, registre ao menos uma fonte HTTPS e confirme a revisao editorial');
  }
  return article;
}

module.exports = {
  ValidationError,
  assessEditorialRisk,
  normalizeArticle,
  normalizeImageUrl,
  normalizeHttpsUrl
};
