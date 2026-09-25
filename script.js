const dateEl = document.getElementById('today-date');

if (dateEl) {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(now);

  dateEl.textContent = formatted;
}

const stories = [
  { category: 'politica', label: 'Política', title: 'Debates na Câmara Municipal concentram atenção dos moradores', text: 'Projetos para mobilidade, serviços e planejamento urbano entram na pauta local.', image: 'image-one' },
  { category: 'politica', label: 'Política', title: 'Primavera do Leste acompanha decisões sobre infraestrutura urbana', text: 'Gestores e comunidade discutem prioridades para os bairros e áreas de expansão.', image: 'thumb-one' },
  { category: 'politica', label: 'Política', title: 'Transparência e participação ganham espaço na agenda municipal', text: 'Informação pública ajuda moradores a acompanhar as decisões da cidade.', image: 'image-four' },
  { category: 'saude', label: 'Saúde', title: 'Atenção básica amplia ações de prevenção em Primavera do Leste', text: 'Serviços mais próximos fortalecem o cuidado contínuo das famílias.', image: 'image-two' },
  { category: 'saude', label: 'Saúde', title: 'Rede municipal reforça atendimento e orientação aos moradores', text: 'Equipes trabalham para facilitar o acesso e organizar os fluxos de atendimento.', image: 'thumb-two' },
  { category: 'saude', label: 'Saúde', title: 'Campanhas locais levam informação e cuidado aos bairros', text: 'Ações de prevenção aproximam serviços de saúde das comunidades.', image: 'local-two' },
  { category: 'locais', label: 'Política local', title: 'Prefeitura anuncia plano de mobilidade para bairros em expansão', text: 'Projeto prevê novas conexões, áreas de convivência e melhorias no transporte.', image: 'local-one' },
  { category: 'locais', label: 'Saúde local', title: 'Unidades de saúde ampliam horários e serviços para moradores', text: 'A mudança busca facilitar o acesso ao atendimento em Primavera do Leste.', image: 'local-two' },
  { category: 'locais', label: 'Economia local', title: 'Comércio e agronegócio movimentam a economia da região', text: 'Empreendedores apostam em inovação e parcerias para gerar novas oportunidades.', image: 'local-three' }
];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function storyArticleUrl(story) {
  const params = new URLSearchParams({
    title: story.title,
    summary: story.summary || '',
    category: story.category || 'locais',
    author: story.author || 'Redação PVA NEWS'
  });
  if (story.imageUrl) params.set('imageUrl', story.imageUrl);
  return `article.html?${params.toString()}`;
}

function backgroundImageUrl(element) {
  if (!element) return '';
  const match = getComputedStyle(element).backgroundImage.match(/^url\(["']?(.*?)["']?\)$/);
  if (!match) return '';
  return safeImageUrl(match[1]);
}

function storyCategoryFromCard(card) {
  const tag = card.querySelector('.tag');
  if (tag?.classList.contains('tag-health')) return 'saude';
  if (tag?.classList.contains('tag-economy')) return 'economia';
  if (tag?.classList.contains('tag-technology')) return 'tecnologia';
  if (tag?.classList.contains('tag-politics') || tag?.classList.contains('tag-primary')) return 'politica';
  return document.body.dataset.category || 'locais';
}

function activateStaticStoryCards() {
  const cardSelector = 'article.featured-story, article.mini-story, article.news-card, article.list-story, article.local-card';
  document.querySelectorAll(cardSelector).forEach((card) => {
    const title = card.querySelector('h1, h2, h3, h4')?.textContent?.trim();
    if (!title) return;
    const imageElement = card.querySelector('.story-image, .card-image, .list-thumb, .local-image, .dynamic-image');
    const anchor = document.createElement('a');
    anchor.className = `${card.className} story-card-link`;
    anchor.href = storyArticleUrl({
      title,
      summary: card.querySelector('p')?.textContent?.trim() || '',
      category: storyCategoryFromCard(card),
      imageUrl: backgroundImageUrl(imageElement)
    });
    anchor.setAttribute('aria-label', `Abrir matéria: ${title}`);
    while (card.firstChild) anchor.append(card.firstChild);
    card.replaceWith(anchor);
  });
}

function safeImageUrl(value) {
  const imageUrl = String(value || '');
  if (/^data:image\/(?:jpeg|png|webp|gif);base64,/i.test(imageUrl)) return imageUrl;
  try {
    const url = new URL(imageUrl);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch (error) {
    return '';
  }
}

function tagClass(category) {
  return category === 'saude' ? 'tag-health' : category === 'locais' ? 'tag-economy' : 'tag-politics';
}

function renderCategoryNews() {
  const target = document.getElementById('category-news');
  const category = document.body.dataset.category;
  if (!target || !category) return;

  target.innerHTML = stories
    .filter((story) => story.category === category)
    .map((story) => `
      <a class="dynamic-news-card story-card-link" href="#" aria-label="Abrir matéria: ${escapeHtml(story.title)}">
        <div class="dynamic-image ${story.image}"></div>
        <div class="dynamic-body">
          <span class="tag ${tagClass(category)}">${story.label}</span>
          <h3>${story.title}</h3>
          <p>${story.text}</p>
          <span class="story-meta">Hoje • 4 min de leitura</span>
        </div>
      </a>
    `).join('');
  target.querySelectorAll('.dynamic-news-card').forEach((card) => {
    const title = card.querySelector('h3')?.textContent || '';
    const summary = card.querySelector('p')?.textContent || '';
    card.href = storyArticleUrl({
      title,
      summary,
      category,
      imageUrl: backgroundImageUrl(card.querySelector('.dynamic-image'))
    });
  });
}

function setupSearch() {
  const trigger = document.getElementById('search-toggle');
  if (!trigger) return;

  const search = document.createElement('div');
  search.className = 'search-panel';
  search.innerHTML = '<div class="search-inner"><button class="search-close" aria-label="Fechar busca">×</button><span class="tag tag-primary">Busca PVA NEWS</span><h2>Encontre uma notícia</h2><input type="search" placeholder="Digite bairro, saúde, política..." aria-label="Buscar notícias" /><div class="search-results"></div></div>';
  document.body.appendChild(search);

  const input = search.querySelector('input');
  const results = search.querySelector('.search-results');
  const close = () => search.classList.remove('is-open');
  const updateResults = () => {
    const query = input.value.trim().toLowerCase();
    const matches = stories.filter((story) => `${story.title} ${story.label} ${story.text}`.toLowerCase().includes(query)).slice(0, 5);
    results.innerHTML = matches.length ? matches.map((story) => `<a href="${storyArticleUrl({ title: story.title, summary: story.text, category: story.category })}"><strong>${escapeHtml(story.title)}</strong><small>${escapeHtml(story.label)}</small></a>`).join('') : '<p>Nenhuma notícia encontrada.</p>';
  };

  trigger.addEventListener('click', () => { search.classList.add('is-open'); input.focus(); updateResults(); });
  search.querySelector('.search-close').addEventListener('click', close);
  search.addEventListener('click', (event) => { if (event.target === search) close(); });
  input.addEventListener('input', updateResults);
}

let ibovChart;

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

function showDataError(statusId, message) {
  const status = document.getElementById(statusId);
  if (status) {
    status.textContent = message;
    status.classList.add('neutral');
  }
}

async function loadIbovespa() {
  const valueEl = document.getElementById('ibov-value');
  if (!valueEl || typeof Chart === 'undefined') return;

  try {
    const response = await fetch('https://stooq.com/q/d/l/?s=%5Ebvsp&i=d');
    if (!response.ok) throw new Error('Cotação indisponível');
    const csv = await response.text();
    const history = csv.trim().split('\n').slice(1).map((line) => {
      const [date, , , , close] = line.split(',');
      return { date, close: Number(close) };
    }).filter((item) => Number.isFinite(item.close)).slice(-30);
    if (!history.length) throw new Error('Sem dados');

    const current = history.at(-1).close;
    const previous = history.at(-2)?.close ?? current;
    const change = previous ? ((current - previous) / previous) * 100 : 0;
    valueEl.textContent = Number.isFinite(current) ? formatNumber(current, 0) : '--';
    const changeEl = document.getElementById('ibov-change');
    changeEl.textContent = `${change >= 0 ? '+' : ''}${formatNumber(change)}% no último fechamento`;
    changeEl.classList.add(change >= 0 ? 'positive' : 'negative');
    document.getElementById('market-status').textContent = 'Atualizado';

    if (history.length) {
      ibovChart?.destroy();
      ibovChart = new Chart(document.getElementById('ibov-chart'), {
        type: 'line',
        data: {
          labels: history.map((item) => new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
          datasets: [{ data: history.map((item) => Number(item.close)), borderColor: '#b71c1c', backgroundColor: 'rgba(183, 28, 28, 0.1)', fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
      });
    }
  } catch (error) {
    valueEl.textContent = '--';
    document.getElementById('ibov-change').textContent = 'Cotação indisponível no momento.';
    showDataError('market-status', 'Indisponível');
  }
}

function weatherDescription(code) {
  if (code === 0) return 'Céu limpo';
  if ([1, 2, 3].includes(code)) return 'Nublado';
  if ([45, 48].includes(code)) return 'Névoa';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Garoa';
  if ([61, 63, 65, 80, 81, 82].includes(code)) return 'Chuva';
  if ([95, 96, 99].includes(code)) return 'Trovoada';
  return 'Condição variável';
}

async function loadWeather() {
  const valueEl = document.getElementById('weather-value');
  if (!valueEl) return;

  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=-15.5567&longitude=-54.2967&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=America%2FCuiaba';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Clima indisponível');
    const payload = await response.json();
    const current = payload.current;
    valueEl.textContent = `${formatNumber(current.temperature_2m, 0)}°C`;
    document.getElementById('weather-description').textContent = weatherDescription(current.weather_code);
    document.getElementById('weather-wind').textContent = `Vento ${formatNumber(current.wind_speed_10m, 0)} km/h`;
    document.getElementById('weather-humidity').textContent = `Umidade ${formatNumber(current.relative_humidity_2m, 0)}%`;
    document.getElementById('weather-icon').textContent = current.weather_code >= 51 ? '☁' : '☀';
    document.getElementById('weather-status').textContent = 'Atualizado';
  } catch (error) {
    valueEl.textContent = '--°';
    document.getElementById('weather-description').textContent = 'Clima indisponível no momento.';
    showDataError('weather-status', 'Indisponível');
  }
}

async function loadManagedNews() {
  const homeSection = document.getElementById('noticias-publicadas');
  const homeTarget = document.getElementById('managed-news');
  const categoryTarget = document.getElementById('category-news');
  const category = document.body.dataset.category;
  if ((!homeSection || !homeTarget) && !categoryTarget) return;

  try {
    const response = await fetch('/api/content');
    if (!response.ok) return;
    const payload = await response.json();
    if (!payload.articles?.length) return;

    const articles = category
      ? payload.articles.filter((article) => article.category === category)
      : payload.articles;
    if (!articles.length) return;

    const cards = articles.slice(0, 6).map((article) => `
      <a class="news-card news-card-link" href="article.html?id=${encodeURIComponent(article._id)}">
        <div class="card-image managed-image" style="background-image: url('${safeImageUrl(article.imageUrl)}')"></div>
        <div class="card-body">
          <span class="tag ${tagClass(article.category)}">${escapeHtml(article.category)}</span>
          <h3>${escapeHtml(article.title)}</h3>
          <p>${escapeHtml(article.summary)}</p>
          <small class="story-meta">${escapeHtml(article.author || 'Redação PVA NEWS')}</small>
          ${article.editorialReviewed && article.verificationSources?.length ? '<small class="verification-badge">Fontes registradas</small>' : ''}
        </div>
      </a>
    `).join('');

    if (homeTarget && homeSection) {
      homeTarget.innerHTML = cards;
      homeSection.hidden = false;
    }

    if (categoryTarget) categoryTarget.insertAdjacentHTML('afterbegin', cards);
  } catch (error) {
    // A home estática continua disponível quando a API ainda não foi configurada.
  }
}

async function loadManagedAds() {
  const target = document.getElementById('managed-ads');
  if (!target) return;
  try {
    const response = await fetch('/api/content?resource=ads');
    if (!response.ok) return;
    const { ads } = await response.json();
    if (!ads?.length) return;
    target.innerHTML = ads.slice(0, 3).map((ad) => {
      let safeLink = '';
      try {
        const url = new URL(ad.link);
        if (url.protocol === 'https:') safeLink = url.href;
      } catch (error) {
        safeLink = '';
      }
      const content = `<span class="ad-badge">Patrocínio</span><h3>${escapeHtml(ad.company)}${ad.title ? ` · ${escapeHtml(ad.title)}` : ''}</h3><p>${escapeHtml(ad.description)}</p>`;
      return safeLink
        ? `<a class="ad-card managed-ad-card" href="${escapeHtml(safeLink)}" target="_blank" rel="noopener noreferrer">${content}</a>`
        : `<article class="ad-card managed-ad-card">${content}</article>`;
    }).join('');
    target.hidden = false;
  } catch (error) {
    // Mantém os espaços comerciais estáticos se a API não estiver disponível.
  }
}

async function loadArticlePage() {
  const target = document.getElementById('article-page');
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!target) return;
  try {
    let article;
    if (id) {
      const response = await fetch(`/api/content?id=${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error('Notícia não encontrada');
      ({ article } = await response.json());
    } else {
      const title = params.get('title');
        if (!title) throw new Error('Matéria não encontrada');
        const category = params.get('category');
        article = {
          title,
          summary: params.get('summary') || '',
          category: ['politica', 'saude', 'locais', 'economia', 'tecnologia'].includes(category) ? category : 'locais',
          author: params.get('author') || 'Redação PVA NEWS',
          imageUrl: params.get('imageUrl') || ''
        };
      }
      const image = safeImageUrl(article.imageUrl);
    const sources = (article.verificationSources || []).filter((source) => {
      try {
        return new URL(source).protocol === 'https:';
      } catch (error) {
        return false;
      }
    });
    const sourceDisclosure = sources.length
      ? `<section class="verification-transparency"><span class="tag tag-primary">Transparência editorial</span><h2>Fontes e revisão</h2><p>${article.editorialReviewed ? `A redação registrou uma revisão editorial${article.editorialReviewedAt ? ` em ${new Date(article.editorialReviewedAt).toLocaleDateString('pt-BR')}` : ''}. Isso não substitui a avaliação crítica das fontes.` : 'As referências abaixo foram registradas para esta matéria.'}</p><ul>${sources.map((source) => `<li><a href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(new URL(source).hostname)}</a></li>`).join('')}</ul></section>`
      : '<section class="verification-transparency"><span class="tag tag-primary">Transparência editorial</span><h2>Fontes e revisão</h2><p>As fontes não foram registradas no painel para esta matéria. A ausência desta informação não determina, por si só, a veracidade do conteúdo.</p></section>';
    const fullText = String(article.content || '').trim();
    target.innerHTML = `
      <article class="full-article">
        <span class="tag ${tagClass(article.category)}">${escapeHtml(article.category)}</span>
        <h1>${escapeHtml(article.title)}</h1>
        <p class="full-article-lead">${escapeHtml(article.summary)}</p>
        ${image ? `<div class="full-article-image" style="background-image:url('${image}')"></div>` : ''}
        <div class="full-article-meta">${escapeHtml(article.author || 'Redação PVA NEWS')}${article.updatedAt || article.createdAt ? ` · ${new Date(article.updatedAt || article.createdAt).toLocaleDateString('pt-BR')}` : ''}</div>
        ${fullText ? `<div class="full-article-copy"><p>${escapeHtml(fullText)}</p></div>` : '<p class="article-summary-notice">O texto integral desta matéria ainda não foi cadastrado. Esta página exibe o título e o resumo disponíveis.</p>'}
        ${sourceDisclosure}
      </article>`;
    document.title = `${article.title} | PVA NEWS`;
  } catch (error) {
    target.innerHTML = '<div class="article-error"><h1>Notícia indisponível</h1><p>Não foi possível carregar esta matéria agora.</p><a href="index.html">Voltar para a home</a></div>';
  }
}

function setupLiveData() {
  if (!document.getElementById('dados-em-tempo-real')) return;
  loadIbovespa();
  loadWeather();
  window.setInterval(loadIbovespa, 5 * 60 * 1000);
  window.setInterval(loadWeather, 10 * 60 * 1000);
}

if (document.body.dataset.category) {
  document.querySelectorAll('.main-nav a[href="locais.html"]').forEach((link) => {
    link.textContent = 'Primavera do Leste';
  });
  const footerDescription = document.querySelector('.site-footer p');
  if (footerDescription) {
    footerDescription.textContent = 'Informação clara, presença forte e cobertura que conecta Primavera do Leste.';
  }
}

document.querySelectorAll('.site-footer > .container > div:first-child').forEach((footerBrandBlock) => {
  if (!footerBrandBlock.querySelector('.copyright')) {
    const copyright = document.createElement('small');
    copyright.className = 'copyright';
    copyright.textContent = '© 2026 PVA NEWS. Todos os direitos reservados. Conteúdo protegido por direitos autorais.';
    footerBrandBlock.appendChild(copyright);
  }
});

renderCategoryNews();
activateStaticStoryCards();
setupSearch();
setupLiveData();
loadManagedNews();
loadManagedAds();
loadArticlePage();

const newsletterForm = document.querySelector('.newsletter-form');

if (newsletterForm) {
  newsletterForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const button = newsletterForm.querySelector('button');
    const input = newsletterForm.querySelector('input');

    if (!input.value.trim()) {
      input.focus();
      return;
    }

    button.textContent = 'Inscrito';
    button.disabled = true;
    button.style.opacity = '0.8';
    input.value = '';
  });
}
