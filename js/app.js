/**
 * Colmek Gallery - Main App
 * Style inspired by colmek.site
 */
(function () {
  'use strict';

  const PER_PAGE = 20;
  const HERO_COUNT = 6;

  let allVideos = [];
  let filtered = [];
  let currentPage = 1;
  let currentCategory = 'All';
  let heroIndex = 0;
  let heroTimer = null;
  let currentHeroVideo = null;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  function initAgeGate() {
    const gate = $('#ageGate');
    const entered = sessionStorage.getItem('age_ok') === '1';
    if (entered) {
      gate.classList.add('hidden');
      showMain();
      return;
    }
    $('#btnEnter').addEventListener('click', () => {
      sessionStorage.setItem('age_ok', '1');
      gate.classList.add('hidden');
      showMain();
    });
    $('#btnLeave').addEventListener('click', () => {
      window.location.href = 'https://www.google.com';
    });
  }

  function showMain() {
    const main = $('#mainContent');
    main.classList.remove('opacity-0');
    main.classList.add('opacity-100');
  }

  async function loadVideos() {
    try {
      const res = await fetch('data/videos.json?t=' + Date.now());
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      allVideos = Array.isArray(data) ? data : [];
      allVideos = allVideos.map((v, i) => ({
        id: v.id || i + 1,
        title: v.title || 'Untitled',
        thumbnail: v.thumbnail || '',
        embedUrl: v.embedUrl || v.embed || '',
        category: v.category || 'Umum',
        date: v.date || ''
      })).filter(v => v.embedUrl);
    } catch (e) {
      console.error('Load videos error:', e);
      allVideos = [];
    }
    filtered = [...allVideos];
    renderAll();
  }

  function getHeroVideos() {
    const pool = allVideos.slice(0, 50);
    return pool.slice(0, HERO_COUNT);
  }

  function renderHero() {
    const heroes = getHeroVideos();
    if (!heroes.length) return;

    const slidesEl = $('#heroSlides');
    slidesEl.innerHTML = heroes.map((v, i) => {
      const bg = v.thumbnail
        ? `url('${v.thumbnail}')`
        : `linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)`;
      return `<div class="hero-slide absolute inset-0 transition-opacity duration-700 ${i === 0 ? 'opacity-100' : 'opacity-0'}" data-idx="${i}" style="background-image:${bg};background-size:cover;background-position:center;"></div>`;
    }).join('');

    updateHeroContent(heroes[0]);
    currentHeroVideo = heroes[0];

    clearInterval(heroTimer);
    heroTimer = setInterval(() => {
      heroIndex = (heroIndex + 1) % heroes.length;
      showHeroSlide(heroes);
    }, 6000);

    $('#prevSlide').onclick = () => {
      heroIndex = (heroIndex - 1 + heroes.length) % heroes.length;
      showHeroSlide(heroes);
    };
    $('#nextSlide').onclick = () => {
      heroIndex = (heroIndex + 1) % heroes.length;
      showHeroSlide(heroes);
    };
    $('#heroPlay').onclick = () => {
      if (currentHeroVideo) openModal(currentHeroVideo);
    };
  }

  function showHeroSlide(heroes) {
    $$('.hero-slide').forEach((el, i) => {
      el.classList.toggle('opacity-100', i === heroIndex);
      el.classList.toggle('opacity-0', i !== heroIndex);
    });
    updateHeroContent(heroes[heroIndex]);
    currentHeroVideo = heroes[heroIndex];
  }

  function updateHeroContent(v) {
    $('#heroTitle').textContent = v.title;
    $('#heroMeta').textContent = `${v.category} • ${v.date || ''}`.trim();
  }

  function getCategories() {
    const counts = {};
    allVideos.forEach(v => {
      const c = v.category || 'Umum';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }

  function renderCategoryPills() {
    const cats = getCategories();
    const el = $('#categoryPills');
    el.innerHTML = `
      <button class="cat-pill active" data-cat="All">Semua <span class="opacity-60">${allVideos.length}</span></button>
      ${cats.slice(0, 14).map(c => `
        <button class="cat-pill" data-cat="${escapeHtml(c.name)}">${escapeHtml(c.name)} <span class="opacity-60">${c.count}</span></button>
      `).join('')}
    `;
    $$('.cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.cat;
        currentPage = 1;
        applyFilter();
      });
    });
  }

  function renderGenreGrid() {
    const cats = getCategories();
    const el = $('#genreGrid');
    const icons = {
      Amatir: 'fa-user', Umum: 'fa-globe', STW: 'fa-heart', Jilbab: 'fa-mosque',
      ABG: 'fa-graduation-cap', Viral: 'fa-fire', Colmek: 'fa-play', Tobrut: 'fa-star',
      Live: 'fa-broadcast-tower', Chindo: 'fa-flag', Doggy: 'fa-paw', Outdoor: 'fa-tree'
    };
    el.innerHTML = cats.slice(0, 12).map(c => `
      <button class="genre-card group" data-cat="${escapeHtml(c.name)}">
        <div class="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center mb-3 group-hover:bg-red-600 group-hover:text-white transition-colors">
          <i class="fas ${icons[c.name] || 'fa-film'} text-sm"></i>
        </div>
        <div class="font-semibold text-sm truncate">${escapeHtml(c.name)}</div>
        <div class="text-xs text-neutral-500 mt-0.5">${c.count} video</div>
      </button>
    `).join('');
    $$('.genre-card').forEach(btn => {
      btn.addEventListener('click', () => {
        currentCategory = btn.dataset.cat;
        currentPage = 1;
        $$('.cat-pill').forEach(b => {
          b.classList.toggle('active', b.dataset.cat === currentCategory);
        });
        applyFilter();
        document.getElementById('terbaru').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function applyFilter() {
    if (currentCategory === 'All') {
      filtered = [...allVideos];
    } else {
      filtered = allVideos.filter(v => (v.category || '').toLowerCase() === currentCategory.toLowerCase());
    }
    renderGrid();
    renderPagination();
  }

  function renderGrid() {
    const start = (currentPage - 1) * PER_PAGE;
    const pageItems = filtered.slice(start, start + PER_PAGE);
    const el = $('#videoGrid');

    if (!pageItems.length) {
      el.innerHTML = `<div class="col-span-full text-center py-16 text-neutral-500">Tidak ada video ditemukan.</div>`;
      return;
    }

    el.innerHTML = pageItems.map(v => cardHTML(v)).join('');
    bindCardClicks(el);
    $('#videoCount').textContent = `${filtered.length} video`;
  }

  function renderTrending() {
    const trending = allVideos
      .filter(v => ['Viral', 'Colmek', 'ABG', 'STW', 'Jilbab'].includes(v.category))
      .slice(0, 10);
    const fallback = allVideos.slice(20, 30);
    const list = trending.length >= 5 ? trending : fallback;
    const el = $('#trendingGrid');
    el.innerHTML = list.map(v => cardHTML(v)).join('');
    bindCardClicks(el);
  }

  function cardHTML(v) {
    const thumb = v.thumbnail
      ? `<img src="${escapeHtml(v.thumbnail)}" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\'w-full h-full flex items-center justify-center bg-surface-800\'><i class=\'fas fa-play text-2xl text-neutral-600\'></i></div>'">`
      : `<div class="w-full h-full flex items-center justify-center bg-surface-800"><i class="fas fa-play text-2xl text-neutral-600"></i></div>`;

    return `
      <article class="video-card group cursor-pointer" data-id="${v.id}">
        <div class="relative aspect-video rounded-xl overflow-hidden bg-surface-800 border border-neutral-800/80 group-hover:border-red-600/50 transition-colors">
          ${thumb}
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div class="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-lg">
              <i class="fas fa-play text-white text-sm ml-0.5"></i>
            </div>
          </div>
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-medium tracking-wide">${escapeHtml(v.category)}</span>
        </div>
        <div class="mt-2.5 px-0.5">
          <h3 class="text-sm font-medium leading-snug line-clamp-2 group-hover:text-red-400 transition-colors">${escapeHtml(v.title)}</h3>
          <p class="text-[11px] text-neutral-500 mt-1">${escapeHtml(v.date || '')}</p>
        </div>
      </article>
    `;
  }

  function bindCardClicks(container) {
    container.querySelectorAll('.video-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id, 10);
        const video = allVideos.find(v => v.id === id);
        if (video) openModal(video);
      });
    });
  }

  function renderPagination() {
    const total = Math.ceil(filtered.length / PER_PAGE);
    const el = $('#pagination');
    if (total <= 1) {
      el.innerHTML = '';
      return;
    }

    let html = '';
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

    html += `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    if (start > 1) html += `<button class="page-btn" data-page="1">1</button>${start > 2 ? '<span class="text-neutral-600 px-1">...</span>' : ''}`;
    for (let i = start; i <= end; i++) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    if (end < total) html += `${end < total - 1 ? '<span class="text-neutral-600 px-1">...</span>' : ''}<button class="page-btn" data-page="${total}">${total}</button>`;
    html += `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage === total ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;

    el.innerHTML = html;
    el.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.page, 10);
        if (p >= 1 && p <= total && p !== currentPage) {
          currentPage = p;
          renderGrid();
          renderPagination();
          document.getElementById('terbaru').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function openModal(video) {
    const modal = $('#videoModal');
    const iframe = $('#modalIframe');
    $('#modalTitle').textContent = video.title;
    $('#modalMeta').textContent = `${video.category} • ${video.date || ''}`.trim();
    iframe.src = video.embedUrl;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = $('#videoModal');
    const iframe = $('#modalIframe');
    iframe.src = '';
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function initSearch() {
    const overlay = $('#searchOverlay');
    $('#searchToggle').addEventListener('click', () => {
      overlay.classList.remove('hidden');
      $('#searchInput').focus();
    });
    $('#searchClose').addEventListener('click', () => {
      overlay.classList.add('hidden');
      $('#searchInput').value = '';
      $('#searchResults').innerHTML = '';
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.add('hidden');
    });
    let debounce;
    $('#searchInput').addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => doSearch(e.target.value.trim()), 250);
    });
  }

  function doSearch(q) {
    const el = $('#searchResults');
    if (!q) { el.innerHTML = ''; return; }
    const lower = q.toLowerCase();
    const results = allVideos.filter(v =>
      v.title.toLowerCase().includes(lower) ||
      (v.category || '').toLowerCase().includes(lower)
    ).slice(0, 20);

    if (!results.length) {
      el.innerHTML = '<p class="text-neutral-500 text-center py-6">Tidak ditemukan.</p>';
      return;
    }
    el.innerHTML = results.map(v => `
      <button class="search-item w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800 transition-colors" data-id="${v.id}">
        <div class="w-16 h-10 rounded-lg bg-surface-800 flex items-center justify-center shrink-0">
          <i class="fas fa-play text-xs text-neutral-600"></i>
        </div>
        <div class="min-w-0">
          <div class="text-sm font-medium truncate">${escapeHtml(v.title)}</div>
          <div class="text-xs text-neutral-500">${escapeHtml(v.category)}</div>
        </div>
      </button>
    `).join('');
    el.querySelectorAll('.search-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const video = allVideos.find(v => v.id === parseInt(btn.dataset.id, 10));
        if (video) {
          $('#searchOverlay').classList.add('hidden');
          openModal(video);
        }
      });
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function renderAll() {
    renderHero();
    renderCategoryPills();
    renderGenreGrid();
    applyFilter();
    renderTrending();
  }

  function init() {
    initAgeGate();
    initSearch();

    $('#modalClose').addEventListener('click', closeModal);
    $('#modalBackdrop').addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    $('#mobileMenuBtn').addEventListener('click', () => {
      $('#mobileMenu').classList.toggle('hidden');
    });

    $$('#mobileMenu a').forEach(a => {
      a.addEventListener('click', () => $('#mobileMenu').classList.add('hidden'));
    });

    loadVideos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
