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
  { category: 'politica', label: 'Política', title: 'Congresso debate novas prioridades para infraestrutura e serviços públicos', text: 'Lideranças discutem medidas para acelerar projetos e melhorar a execução nos estados.', image: 'image-one' },
  { category: 'politica', label: 'Política', title: 'Municípios defendem mais previsibilidade para investimentos regionais', text: 'Gestores apresentam propostas para aproximar planejamento e necessidades locais.', image: 'thumb-one' },
  { category: 'politica', label: 'Política', title: 'Comissão avança em agenda de transparência e eficiência pública', text: 'Relatório reúne sugestões para simplificar processos e ampliar o acesso a dados.', image: 'image-four' },
  { category: 'saude', label: 'Saúde', title: 'Atenção primária amplia programas de prevenção em todo o país', text: 'Novas equipes fortalecem o acompanhamento contínuo e o cuidado perto de casa.', image: 'image-two' },
  { category: 'saude', label: 'Saúde', title: 'Hospitais testam soluções digitais para agilizar triagem', text: 'Tecnologia ajuda profissionais a organizar fluxos e priorizar atendimentos.', image: 'thumb-two' },
  { category: 'saude', label: 'Saúde', title: 'Campanhas locais reforçam vacinação e cuidados preventivos', text: 'Ações integradas levam informação e atendimento a diferentes comunidades.', image: 'local-two' },
  { category: 'locais', label: 'Política local', title: 'Prefeitura anuncia plano de mobilidade para bairros em expansão', text: 'Projeto prevê novas conexões, áreas de convivência e melhorias no transporte.', image: 'local-one' },
  { category: 'locais', label: 'Saúde local', title: 'Unidades básicas ampliam horários e serviços para moradores', text: 'A mudança busca reduzir deslocamentos e facilitar o acesso ao atendimento.', image: 'local-two' },
  { category: 'locais', label: 'Economia local', title: 'Comércio regional cria novas oportunidades para pequenos negócios', text: 'Empreendedores apostam em inovação e parcerias para movimentar a economia.', image: 'local-three' }
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
  search.innerHTML = '<div class="search-inner"><button class="search-close" aria-label="Fechar busca">×</button><span class="tag tag-primary">Busca PVA NEWS</span><h2>Encontre uma notícia</h2><input type="search" placeholder="Digite política, saúde, região..." aria-label="Buscar notícias" /><div class="search-results"></div></div>';
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
