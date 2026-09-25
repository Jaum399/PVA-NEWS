const state = { editingId: '', imageData: '' };
const $ = (selector) => document.querySelector(selector);
const sensationalLanguage = /\b(urgente|chocante|bomba|milagre|inacredit[aá]vel|imperd[ií]vel|revelado|ningu[eé]m conta|compartilhe agora)\b/i;

const message = (selector, text, error = false) => {
  const element = $(selector);
  if (!element) return;
  element.textContent = text;
  element.classList.toggle('error', error);
  element.classList.toggle('status-message', Boolean(text));
};

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[character]));

const safeImageUrl = (value) => {
  const imageUrl = String(value || '');
  if (/^data:image\/(?:jpeg|png|webp|gif);base64,/i.test(imageUrl)) return imageUrl;
  try {
    const url = new URL(imageUrl);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch (error) {
    return '';
  }
};

async function api(method = 'GET', body, admin = false, resource = 'articles') {
  const query = new URLSearchParams();
  if (admin) query.set('admin', '1');
  if (resource !== 'articles') query.set('resource', resource);
  const response = await fetch(`/api/content?${query}`, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Falha na comunicação com a API');
  return data;
}

function setAuthenticated(authenticated) {
  $('#login-panel').hidden = authenticated;
  $('#dashboard').hidden = !authenticated;
}

function getSourceUrls() {
  return $('#verification-sources').value.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
}

function assessDraft() {
  const title = $('#title').value.trim();
  const summary = $('#summary').value.trim();
  const sources = getSourceUrls();
  const text = `${title} ${summary}`;
  const flags = [];
  let score = 0;

  if (!sources.length) {
    flags.push('Nenhuma fonte registrada');
    score += 45;
  } else if (sources.length === 1) {
    flags.push('Considere confirmar com uma segunda fonte independente');
    score += 15;
  }
  if (sensationalLanguage.test(text)) {
    flags.push('Linguagem potencialmente sensacionalista: revisar contexto e tom');
    score += 30;
  }
  if (title.length > 12 && title === title.toLocaleUpperCase('pt-BR')) {
    flags.push('Título inteiramente em maiúsculas');
    score += 15;
  }
  if (/[!?]{2,}/.test(text)) {
    flags.push('Pontuação enfática em excesso');
    score += 10;
  }

  const scoreElement = $('#verification-assessment');
  const level = score >= 35 ? 'review' : score >= 15 ? 'attention' : 'low';
  const heading = level === 'review' ? 'Revisão humana recomendada' : level === 'attention' ? 'Atenção editorial' : 'Nenhum alerta automático';
  scoreElement.className = `verification-assessment ${level}`;
  scoreElement.innerHTML = `<strong>${heading} · indicador ${Math.min(score, 100)}/100</strong>${flags.length
    ? `<ul>${flags.map((flag) => `<li>${escapeHtml(flag)}</li>`).join('')}</ul>`
    : '<p>Os indicadores não substituem a conferência das fontes e dos fatos.</p>'}`;
}

function clearForm() {
  state.editingId = '';
  state.imageData = '';
  $('#article-form').reset();
  $('#article-id').value = '';
  $('#author').value = 'Redação PVA NEWS';
  $('#published').checked = false;
  $('#editorial-reviewed').checked = false;
  $('#form-title').textContent = 'Nova notícia';
  updateImagePreview();
  assessDraft();
}

function updateImagePreview() {
  const source = state.imageData || $('#image-url').value;
  const url = safeImageUrl(source);
  const preview = $('#image-preview');
  const image = $('#image-preview-image');
  preview.hidden = !url;
  if (url) image.src = url;
}

function fillForm(article) {
  if (!article) return;
  state.editingId = article._id;
  state.imageData = /^data:image\//i.test(article.imageUrl || '') ? article.imageUrl : '';
  $('#article-id').value = article._id;
  $('#title').value = article.title;
  $('#summary').value = article.summary;
  $('#category').value = article.category;
  $('#author').value = article.author || '';
  $('#image-url').value = state.imageData ? '' : article.imageUrl || '';
  $('#verification-sources').value = (article.verificationSources || []).join('\n');
  $('#editorial-reviewed').checked = article.editorialReviewed === true;
  $('#published').checked = article.published;
  $('#form-title').textContent = 'Editar notícia';
  updateImagePreview();
  assessDraft();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderArticles(articles) {
  $('#articles').innerHTML = articles.length ? articles.map((article) => {
    const assessment = article.editorialAssessment || { flags: [], level: 'review' };
    const status = article.published ? 'Publicado' : 'Rascunho';
    const verification = article.editorialReviewed && article.verificationSources?.length
      ? 'Revisão registrada'
      : 'Checagem pendente';
    const warning = assessment.flags?.length ? ` · ${assessment.flags.length} alerta(s)` : '';
    return `<article class="article-item">
      <div class="article-thumb" style="background-image:url('${safeImageUrl(article.imageUrl)}')"></div>
      <div><h3>${escapeHtml(article.title)}</h3><small>${escapeHtml(article.category)} · ${status} · ${verification}${warning}</small></div>
      <div class="article-actions"><button data-edit="${escapeHtml(article._id)}" class="secondary-button">Editar</button><button data-delete="${escapeHtml(article._id)}" class="delete">Excluir</button></div>
    </article>`;
  }).join('') : '<p class="form-message">Nenhuma notícia cadastrada.</p>';

  document.querySelectorAll('[data-edit]').forEach((button) => {
    button.addEventListener('click', () => fillForm(articles.find((article) => article._id === button.dataset.edit)));
  });
  document.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteArticle(button.dataset.delete));
  });
}

function renderAds(ads) {
  $('#ads').innerHTML = ads.length ? ads.map((ad) => `<article class="article-item">
    <div class="article-thumb" style="background-image:url('${safeImageUrl(ad.imageUrl)}')"></div>
    <div><h3>${escapeHtml(ad.company)} · ${escapeHtml(ad.title)}</h3><small>${ad.active ? 'Exibindo no site' : 'Oculto'}</small></div>
    <div class="article-actions"><button data-ad-edit="${escapeHtml(ad._id)}" class="secondary-button">Editar</button><button data-ad-delete="${escapeHtml(ad._id)}" class="delete">Excluir</button></div>
  </article>`).join('') : '<p class="form-message">Nenhuma divulgação cadastrada.</p>';

  document.querySelectorAll('[data-ad-edit]').forEach((button) => {
    button.addEventListener('click', () => fillAdForm(ads.find((ad) => ad._id === button.dataset.adEdit)));
  });
  document.querySelectorAll('[data-ad-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteAd(button.dataset.adDelete));
  });
}

async function loadArticles() {
  $('#articles').innerHTML = '<p class="form-message">Carregando notícias...</p>';
  try {
    const data = await api('GET', undefined, true);
    renderArticles(data.articles);
  } catch (error) {
    $('#articles').innerHTML = '<p class="form-message error status-message">Não foi possível carregar as notícias.</p>';
    message('#editor-message', error.message, true);
  }
}

async function loadAds() {
  $('#ads').innerHTML = '<p class="form-message">Carregando divulgações...</p>';
  try {
    const data = await api('GET', undefined, true, 'ads');
    renderAds(data.ads);
  } catch (error) {
    $('#ads').innerHTML = '<p class="form-message error status-message">Não foi possível carregar as divulgações.</p>';
    message('#ad-message', error.message, true);
  }
}

async function deleteArticle(id) {
  if (!window.confirm('Excluir esta notícia?')) return;
  try {
    await api('DELETE', { _id: id }, true);
    message('#editor-message', 'Notícia excluída.');
    await loadArticles();
  } catch (error) {
    message('#editor-message', error.message, true);
  }
}

function clearAdForm() {
  $('#ad-form').reset();
  $('#ad-id').value = '';
  $('#ad-active').checked = true;
  $('#ad-form-title').textContent = 'Nova divulgação';
}

function fillAdForm(ad) {
  $('#ad-id').value = ad._id;
  $('#ad-company').value = ad.company;
  $('#ad-title').value = ad.title;
  $('#ad-description').value = ad.description;
  $('#ad-link').value = ad.link || '';
  $('#ad-image-url').value = ad.imageUrl || '';
  $('#ad-active').checked = ad.active;
  $('#ad-form-title').textContent = 'Editar divulgação';
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

async function deleteAd(id) {
  if (!window.confirm('Excluir esta divulgação?')) return;
  try {
    await api('DELETE', { _id: id }, true, 'ads');
    message('#ad-message', 'Divulgação excluída.');
    await loadAds();
  } catch (error) {
    message('#ad-message', error.message, true);
  }
}

$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: $('#username').value.trim(), password: $('#password').value })
    });
    if (!response.ok) throw new Error('Credenciais inválidas');
    setAuthenticated(true);
    await Promise.all([loadArticles(), loadAds()]);
  } catch (error) {
    message('#login-message', 'Usuário, senha inválidos ou API indisponível.', true);
  }
});

$('#article-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = event.currentTarget.querySelector('button[type="submit"]');
  const article = {
    _id: state.editingId || undefined,
    title: $('#title').value,
    summary: $('#summary').value,
    category: $('#category').value,
    author: $('#author').value,
    imageUrl: state.imageData || $('#image-url').value,
    verificationSources: getSourceUrls(),
    editorialReviewed: $('#editorial-reviewed').checked,
    published: $('#published').checked
  };
  submitButton.disabled = true;
  submitButton.textContent = 'Salvando...';
  try {
    await api(state.editingId ? 'PUT' : 'POST', article, true);
    message('#editor-message', 'Notícia salva com sucesso.');
    clearForm();
    await loadArticles();
  } catch (error) {
    message('#editor-message', error.message, true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Salvar notícia';
  }
});

$('#ad-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = event.currentTarget.querySelector('button[type="submit"]');
  const ad = {
    _id: $('#ad-id').value || undefined,
    company: $('#ad-company').value,
    title: $('#ad-title').value,
    description: $('#ad-description').value,
    link: $('#ad-link').value,
    imageUrl: $('#ad-image-url').value,
    active: $('#ad-active').checked
  };
  submitButton.disabled = true;
  try {
    await api(ad._id ? 'PUT' : 'POST', ad, true, 'ads');
    message('#ad-message', 'Divulgação salva com sucesso.');
    clearAdForm();
    await loadAds();
  } catch (error) {
    message('#ad-message', error.message, true);
  } finally {
    submitButton.disabled = false;
  }
});

$('#image-url').addEventListener('input', () => {
  state.imageData = '';
  updateImagePreview();
});

$('#image-file').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    message('#editor-message', 'Selecione um arquivo JPG, PNG, WebP ou GIF.', true);
    event.target.value = '';
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    message('#editor-message', 'A imagem deve ter no máximo 2 MB.', true);
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    state.imageData = String(reader.result || '');
    $('#image-url').value = '';
    updateImagePreview();
    message('#editor-message', 'Imagem importada e pronta para salvar.');
  };
  reader.onerror = () => message('#editor-message', 'Não foi possível ler a imagem.', true);
  reader.readAsDataURL(file);
});

$('#title').addEventListener('input', assessDraft);
$('#summary').addEventListener('input', assessDraft);
$('#verification-sources').addEventListener('input', assessDraft);
$('#clear-form').addEventListener('click', clearForm);
$('#refresh-button').addEventListener('click', loadArticles);
$('#clear-ad-form').addEventListener('click', clearAdForm);
$('#refresh-ads-button').addEventListener('click', loadAds);

$('#logout-button').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/auth', { method: 'DELETE', credentials: 'same-origin' });
    if (!response.ok) throw new Error('Não foi possível encerrar a sessão.');
    setAuthenticated(false);
  } catch (error) {
    message('#editor-message', error.message, true);
  }
});

assessDraft();
fetch('/api/auth', { credentials: 'same-origin' })
  .then((response) => {
    if (!response.ok) throw new Error('Falha ao verificar sessão');
    return response.json();
  })
  .then((data) => {
    if (data.authenticated) {
      setAuthenticated(true);
      return Promise.all([loadArticles(), loadAds()]);
    }
    return undefined;
  })
  .catch((error) => {
    message('#login-message', 'Não foi possível verificar a sessão administrativa.', true);
  });
