/**
 * Embed Video Gallery - Main Application
 * Lightweight, vanilla JS, no build step required.
 */

(function () {
  'use strict';

  // ========== STATE ==========
  let allVideos = [];
  let filteredVideos = [];
  let currentCategory = 'All';
  let currentSearch = '';
  let currentSort = 'newest';
  let currentPage = 1;
  const PER_PAGE = 12;

  // Default categories (will merge with data)
  const DEFAULT_CATEGORIES = ['All', 'Action', 'Comedy', 'Drama', 'Horror', 'Anime', 'Other', 'Documentary', 'Adventure', 'Tech', 'Music', 'Travel', 'Lifestyle', 'Science', 'Wildlife', 'Timelapse', 'ABG', 'STW', 'Jilbab', 'Viral', 'Colmek', 'Amatir', 'Toilet', 'Live', 'Doggy', 'Threesome', 'Bumil', 'Chindo', 'Open BO', 'Outdoor', 'Tobrut', 'Bule', 'Guru', 'Artis', 'Perselingkuhan', 'Scandal', 'Umum'];

  // ========== DOM ==========
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const videoGrid = $('#videoGrid');
  const emptyState = $('#emptyState');
  const loadingState = $('#loadingState');
  const searchInput = $('#searchInput');
  const categoryFilters = $('#categoryFilters');
  const sortSelect = $('#sortSelect');
  const pagination = $('#pagination');
  const videoCount = $('#videoCount');
  const backToTop = $('#backToTop');
  const videoModal = $('#videoModal');
  const modalOverlay = $('#modalOverlay');
  const closeModalBtn = $('#closeModal');
  const playerContainer = $('#playerContainer');
  const playerLoading = $('#playerLoading');
  const modalTitle = $('#modalTitle');
  const modalCategory = $('#modalCategory');
  const modalDate = $('#modalDate');

  // ========== UTILS ==========
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  function getThumbnail(video) {
    if (video.thumbnail && isValidUrl(video.thumbnail)) {
      return video.thumbnail;
    }
    return null;
  }

  // ========== DATA LOADING ==========
  async function loadVideos() {
    try {
      const res = await fetch('data/videos.json?t=' + Date.now());
      if (!res.ok) throw new Error('Failed to load videos.json');
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Invalid JSON format');
      allVideos = data.map((v, i) => ({
        id: v.id ?? i + 1,
        title: v.title || `Video ${i + 1}`,
        thumbnail: v.thumbnail || '',
        embedUrl: v.embedUrl || v.embed_url || '',
        category: v.category || 'Umum',
        date: v.date || new Date().toISOString().slice(0, 10)
      })).filter(v => v.embedUrl);
      return true;
    } catch (err) {
      console.error('Load error:', err);
      allVideos = [];
      return false;
    }
  }

  // ========== FILTER & SORT ==========
  function applyFilters() {
    let result = [...allVideos];

    if (currentCategory && currentCategory !== 'All') {
      result = result.filter(v => 
        (v.category || '').toLowerCase() === currentCategory.toLowerCase()
      );
    }

    if (currentSearch) {
      const q = currentSearch.toLowerCase().trim();
      result = result.filter(v =>
        (v.title || '').toLowerCase().includes(q) ||
        (v.category || '').toLowerCase().includes(q) ||
        (v.embedUrl || '').toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (currentSort === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (currentSort === 'oldest') {
        return new Date(a.date || 0) - new Date(b.date || 0);
      }
      return new Date(b.date || 0) - new Date(a.date || 0);
    });

    filteredVideos = result;
    currentPage = 1;
    render();
  }

  // ========== RENDER ==========
  function render() {
    loadingState.classList.add('hidden');

    const total = filteredVideos.length;
    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PER_PAGE;
    const pageItems = filteredVideos.slice(start, start + PER_PAGE);

    if (videoCount) {
      videoCount.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span><span class="text-emerald-400 font-mono">${total}</span> video`;
    }

    if (total === 0) {
      videoGrid.innerHTML = '';
      emptyState.classList.remove('hidden');
      pagination.innerHTML = '';
      return;
    }
    emptyState.classList.add('hidden');

    videoGrid.innerHTML = pageItems.map(video => createCard(video)).join('');

    $$('.video-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id, 10);
        openModal(id);
      });
    });

    initLazyImages();
    renderPagination(totalPages);
  }

  function createCard(video) {
    const thumb = getThumbnail(video);
    const thumbHtml = thumb
      ? `<img data-src="${escapeHtml(thumb)}" alt="${escapeHtml(video.title)}" class="w-full h-full object-cover lazy-loading" loading="lazy" onerror="this.parentElement.classList.add('thumb-fallback'); this.remove();">`
      : '';
    const fallbackIcon = !thumb ? '<i class="fas fa-film"></i>' : '';

    return `
      <article class="video-card group bg-surface-800 rounded-2xl overflow-hidden border border-zinc-800 hover:border-rose-500/40 cursor-pointer" data-id="${video.id}">
        <div class="relative aspect-video bg-surface-700 overflow-hidden ${!thumb ? 'thumb-fallback' : ''}">
          ${thumbHtml}
          ${fallbackIcon}
          <div class="thumb-overlay absolute inset-0 bg-black/40 opacity-0 flex items-center justify-center">
            <div class="play-btn w-14 h-14 rounded-full bg-rose-600/90 flex items-center justify-center text-white shadow-xl">
              <i class="fas fa-play text-xl ml-1"></i>
            </div>
          </div>
          <div class="absolute top-2 right-2">
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-zinc-300 backdrop-blur-sm">${escapeHtml(video.category || 'Umum')}</span>
          </div>
        </div>
        <div class="p-3.5">
          <h3 class="font-medium text-sm leading-snug line-clamp-2 text-zinc-100 group-hover:text-white">${escapeHtml(video.title)}</h3>
          <div class="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
            <span>${formatDate(video.date)}</span>
            <i class="fas fa-play-circle text-zinc-600 group-hover:text-rose-400 transition"></i>
          </div>
        </div>
      </article>
    `;
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }

    let html = '';
    html += `<button class="page-btn bg-surface-800 border border-zinc-700" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left text-xs"></i></button>`;

    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

    if (start > 1) {
      html += `<button class="page-btn bg-surface-800 border border-zinc-700" data-page="1">1</button>`;
      if (start > 2) html += `<span class="text-zinc-600 px-1">…</span>`;
    }

    for (let i = start; i <= end; i++) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : 'bg-surface-800 border border-zinc-700'}" data-page="${i}">${i}</button>`;
    }

    if (end < totalPages) {
      if (end < totalPages - 1) html += `<span class="text-zinc-600 px-1">…</span>`;
      html += `<button class="page-btn bg-surface-800 border border-zinc-700" data-page="${totalPages}">${totalPages}</button>`;
    }

    html += `<button class="page-btn bg-surface-800 border border-zinc-700" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right text-xs"></i></button>`;

    pagination.innerHTML = html;

    $$('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.page, 10);
        if (p >= 1 && p <= totalPages && p !== currentPage) {
          currentPage = p;
          render();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }

  function renderCategories() {
    const catsFromData = [...new Set(allVideos.map(v => v.category).filter(Boolean))];
    const allCats = ['All', ...new Set([...DEFAULT_CATEGORIES.filter(c => c !== 'All'), ...catsFromData])].filter((v, i, a) => a.indexOf(v) === i);

    categoryFilters.innerHTML = allCats.map(cat => `
      <button class="cat-pill px-4 py-1.5 rounded-full text-sm border border-zinc-700 bg-surface-800 hover:border-zinc-500 ${cat === currentCategory ? 'active' : ''}" data-cat="${escapeHtml(cat)}">
        ${escapeHtml(cat)}
      </button>
    `).join('');

    $$('.cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        currentCategory = btn.dataset.cat;
        $$('.cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
      });
    });
  }

  function initLazyImages() {
    const imgs = $$('img[data-src]');
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.onload = () => {
              img.classList.remove('lazy-loading');
              img.classList.add('lazy-loaded');
            };
            obs.unobserve(img);
          }
        });
      }, { rootMargin: '100px' });
      imgs.forEach(img => obs.observe(img));
    } else {
      imgs.forEach(img => {
        img.src = img.dataset.src;
        img.classList.add('lazy-loaded');
      });
    }
  }

  // ========== MODAL ==========
  function openModal(id) {
    const video = allVideos.find(v => v.id === id);
    if (!video || !video.embedUrl) {
      alert('Video tidak ditemukan atau embed URL kosong.');
      return;
    }

    if (!isValidUrl(video.embedUrl)) {
      alert('Embed URL tidak valid.');
      return;
    }

    modalTitle.textContent = video.title || 'Untitled';
    modalCategory.textContent = video.category || 'Umum';
    modalDate.textContent = formatDate(video.date);

    playerLoading.classList.remove('hidden');
    playerContainer.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.src = video.embedUrl;
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
    iframe.setAttribute('frameborder', '0');
    iframe.className = 'w-full h-full absolute inset-0';
    iframe.onload = () => {
      playerLoading.classList.add('hidden');
    };
    iframe.onerror = () => {
      playerLoading.innerHTML = '<p class="text-zinc-400 text-sm">Gagal memuat player</p>';
    };

    playerContainer.appendChild(iframe);

    videoModal.classList.remove('hidden');
    videoModal.classList.add('show', 'flex');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    videoModal.classList.remove('show', 'flex');
    videoModal.classList.add('hidden');
    document.body.classList.remove('modal-open');

    playerContainer.innerHTML = '';
    playerLoading.classList.remove('hidden');
    playerLoading.innerHTML = '<div class="w-12 h-12 border-2 border-zinc-600 border-t-rose-500 rounded-full animate-spin"></div>';
  }

  // ========== EVENTS ==========
  function bindEvents() {
    let searchTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        currentSearch = e.target.value;
        applyFilters();
      }, 250);
    });

    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      applyFilters();
    });

    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !videoModal.classList.contains('hidden')) {
        closeModal();
      }
    });

    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTop.classList.remove('opacity-0', 'pointer-events-none');
      } else {
        backToTop.classList.add('opacity-0', 'pointer-events-none');
      }
    });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ========== INIT ==========
  async function init() {
    bindEvents();
    await loadVideos();
    renderCategories();
    applyFilters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
