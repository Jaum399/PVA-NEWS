const state = { token: sessionStorage.getItem('pva_admin_token') || '', editingId: '' };
const $ = (selector) => document.querySelector(selector);
const message = (selector, text, error = false) => { const element = $(selector); element.textContent = text; element.style.color = error ? '#b71c1c' : ''; };
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const safeImageUrl = (value) => /^https:\/\//i.test(String(value || '')) ? String(value).replace(/'/g, '%27') : '';

async function api(method = 'GET', body, admin = false) {
  const response = await fetch(`/api/content${admin ? '?admin=1' : ''}`, { method, headers: { 'Content-Type': 'application/json', ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Falha na comunicação com a API');
  return data;
}

function setAuthenticated(authenticated) { $('#login-panel').hidden = authenticated; $('#dashboard').hidden = !authenticated; }
function clearForm() { state.editingId = ''; $('#article-form').reset(); $('#article-id').value = ''; $('#author').value = 'Redação PVA NEWS'; $('#published').checked = true; $('#form-title').textContent = 'Nova notícia'; }
function fillForm(article) { state.editingId = article._id; $('#article-id').value = article._id; $('#title').value = article.title; $('#summary').value = article.summary; $('#category').value = article.category; $('#author').value = article.author || ''; $('#image-url').value = article.imageUrl || ''; $('#published').checked = article.published; $('#form-title').textContent = 'Editar notícia'; window.scrollTo({ top: 0, behavior: 'smooth' }); }

function renderArticles(articles) {
  $('#articles').innerHTML = articles.length ? articles.map((article) => `<article class="article-item"><div class="article-thumb" style="background-image:url('${safeImageUrl(article.imageUrl)}')"></div><div><h3>${escapeHtml(article.title)}</h3><small>${escapeHtml(article.category)} • ${article.published ? 'Publicado' : 'Rascunho'}</small></div><div class="article-actions"><button data-edit="${escapeHtml(article._id)}" class="secondary-button">Editar</button><button data-delete="${escapeHtml(article._id)}" class="delete">Excluir</button></div></article>`).join('') : '<p class="form-message">Nenhuma notícia cadastrada.</p>';
  document.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => fillForm(articles.find((article) => article._id === button.dataset.edit))));
  document.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => deleteArticle(button.dataset.delete)));
}

async function loadArticles() { try { const data = await api('GET', undefined, true); renderArticles(data.articles); } catch (error) { message('#editor-message', error.message, true); } }
async function deleteArticle(id) { if (!window.confirm('Excluir esta notícia?')) return; try { await api('DELETE', { _id: id }, true); message('#editor-message', 'Notícia excluída.'); await loadArticles(); } catch (error) { message('#editor-message', error.message, true); } }

$('#login-form').addEventListener('submit', async (event) => { event.preventDefault(); state.token = $('#token').value.trim(); sessionStorage.setItem('pva_admin_token', state.token); try { await api('GET', undefined, true); setAuthenticated(true); loadArticles(); } catch (error) { sessionStorage.removeItem('pva_admin_token'); state.token = ''; message('#login-message', 'Token inválido ou API indisponível.', true); } });
$('#article-form').addEventListener('submit', async (event) => { event.preventDefault(); const article = { _id: state.editingId || undefined, title: $('#title').value, summary: $('#summary').value, category: $('#category').value, author: $('#author').value, imageUrl: $('#image-url').value, published: $('#published').checked }; try { await api(state.editingId ? 'PUT' : 'POST', article, true); message('#editor-message', 'Notícia salva com sucesso.'); clearForm(); await loadArticles(); } catch (error) { message('#editor-message', error.message, true); } });
$('#clear-form').addEventListener('click', clearForm); $('#refresh-button').addEventListener('click', loadArticles); $('#logout-button').addEventListener('click', () => { sessionStorage.removeItem('pva_admin_token'); state.token = ''; setAuthenticated(false); });
if (state.token) { setAuthenticated(true); loadArticles(); }
