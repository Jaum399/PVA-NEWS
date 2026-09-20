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
      <article class="dynamic-news-card">
        <div class="dynamic-image ${story.image}"></div>
        <div class="dynamic-body">
          <span class="tag ${tagClass(category)}">${story.label}</span>
          <h3>${story.title}</h3>
          <p>${story.text}</p>
          <span class="story-meta">Hoje • 4 min de leitura</span>
        </div>
      </article>
    `).join('');
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
    results.innerHTML = matches.length ? matches.map((story) => `<a href="${story.category === 'politica' ? 'politica.html' : story.category === 'saude' ? 'saude.html' : 'locais.html'}"><strong>${story.title}</strong><small>${story.label}</small></a>`).join('') : '<p>Nenhuma notícia encontrada.</p>';
  };

  trigger.addEventListener('click', () => { search.classList.add('is-open'); input.focus(); updateResults(); });
  search.querySelector('.search-close').addEventListener('click', close);
  search.addEventListener('click', (event) => { if (event.target === search) close(); });
  input.addEventListener('input', updateResults);
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

renderCategoryNews();
setupSearch();

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
