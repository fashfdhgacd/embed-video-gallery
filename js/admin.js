/**
 * Admin Panel for Embed Video Gallery
 * Data stored in localStorage for session. Export to commit permanently.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'embed_gallery_videos_v1';
  const AUTH_KEY = 'embed_gallery_auth';
  // Admin password
  const DEMO_PASSWORD = 'Koleksi Dr. Pinguin Bokep, M.S.B';

  let videos = [];
  let editingId = null;
  let bulkCandidates = [];

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  function isLoggedIn() {
    return sessionStorage.getItem(AUTH_KEY) === '1';
  }

  function login(password) {
    if (password === DEMO_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, '1');
      return true;
    }
    return false;
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    location.reload();
  }

  async function loadInitialData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          videos = parsed;
          return;
        }
      } catch (e) {}
    }

    try {
      const res = await fetch('data/videos.json?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          videos = data.map(normalizeVideo);
          saveToStorage();
          return;
        }
      }
    } catch (e) {
      console.warn('Could not load videos.json', e);
    }
    videos = [];
  }

  function normalizeVideo(v, i = 0) {
    const title = (v.title || `Video ${i + 1}`).trim();
    const embedUrl = (v.direct || v.embedUrl || v.embed || v.embed_url || '').trim();
    let category = (v.category || '').trim();
    if (!category || category === 'Umum') {
      category = detectCategory(title, embedUrl);
    }
    return {
      id: v.id ?? Date.now() + i,
      title,
      thumbnail: (v.thumbnail || '').trim(),
      embedUrl,
      category,
      date: v.date || new Date().toISOString().slice(0, 10),
      tags: v.tags || detectTags(title)
    };
  }

  // Auto-detect category dari judul / URL
  function detectCategory(title = '', url = '') {
    const t = (title + ' ' + url).toLowerCase();
    const rules = [
      { cat: 'Jilbab', keys: ['jilbab', 'hijab', 'ukhti', 'tudung', 'berhijab', 'syar'] },
      { cat: 'STW', keys: ['tante', 'stw', 'janda', 'mertua', 'ibu mertua', 'bini', 'istri teman'] },
      { cat: 'ABG', keys: ['abg', 'remaja', 'sma', 'smk', 'kuliah', 'mahasiswi', 'adik', 'adek'] },
      { cat: 'Colmek', keys: ['colmek', 'masturb', 'onan', 'finger', 'dildo', 'vibrator'] },
      { cat: 'Viral', keys: ['viral', 'trending', 'rame'] },
      { cat: 'Live', keys: ['live', 'vcs', 'video call', 'streaming'] },
      { cat: 'Bule', keys: ['bule', 'foreign', 'barat', 'western'] },
      { cat: 'Chindo', keys: ['chindo', 'cindo', 'chinese'] },
      { cat: 'Outdoor', keys: ['outdoor', 'hutan', 'kebun', 'pantai', 'taman', 'luar'] },
      { cat: 'Toilet', keys: ['toilet', 'kamar mandi', 'wc', 'toilet'] },
      { cat: 'Doggy', keys: ['doggy', 'dogystyle', 'dari belakang'] },
      { cat: 'Threesome', keys: ['threesome', '3some', 'tiga orang', 'bareng'] },
      { cat: 'AI', keys: [' ai ', 'ai-', 'a.i', 'deepfake'] },
      { cat: 'Bumil', keys: ['bumil', 'hamil', 'pregnant'] },
      { cat: 'Lesbian', keys: ['lesbian', 'cewek sama cewek', 'girl on girl'] },
      { cat: 'Open BO', keys: ['open bo', 'openbo', 'bo '] },
      { cat: 'Perselingkuhan', keys: ['selingkuh', 'perselingkuhan', 'pacar teman'] },
      { cat: 'Tobrut', keys: ['tobrut', 'toket', 'payudara besar', 'susu gede'] },
      { cat: 'Amatir', keys: ['amatir', 'homemade', 'real', 'asli'] }
    ];
    for (const r of rules) {
      if (r.keys.some(k => t.includes(k))) return r.cat;
    }
    return 'Umum';
  }

  function detectTags(title = '') {
    const t = title.toLowerCase();
    const tags = [];
    const map = {
      mesum: ['mesum', 'ngentot', 'ngewe', 'seks'],
      jilbab: ['jilbab', 'hijab', 'ukhti'],
      tante: ['tante', 'stw', 'janda'],
      abg: ['abg', 'remaja', 'sma'],
      colmek: ['colmek', 'masturb'],
      viral: ['viral'],
      live: ['live', 'vcs'],
      bule: ['bule'],
      outdoor: ['outdoor', 'hutan'],
      toilet: ['toilet', 'kamar mandi'],
      doggy: ['doggy'],
      ai: ['ai'],
      tobrut: ['tobrut', 'toket'],
      hotel: ['hotel', 'kosan']
    };
    for (const [tag, keys] of Object.entries(map)) {
      if (keys.some(k => t.includes(k))) tags.push(tag);
    }
    return [...new Set(tags)];
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
    updateStats();
  }

  function getNextId() {
    if (videos.length === 0) return 1;
    return Math.max(...videos.map(v => Number(v.id) || 0)) + 1;
  }

  function isValidUrl(str) {
    try {
      const u = new URL(str);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function showApp() {
    $('#loginScreen').classList.add('hidden');
    $('#adminApp').classList.remove('hidden');
    renderList();
    updateStats();
    populateCatFilter();
  }

  function updateStats() {
    $('#statTotal').textContent = videos.length;
    const cats = new Set(videos.map(v => v.category).filter(Boolean));
    $('#statCats').textContent = cats.size;
    $('#adminVideoCount').innerHTML = `<span class="text-emerald-400 font-mono">${videos.length}</span> video`;
  }

  function populateCatFilter() {
    const sel = $('#adminCatFilter');
    const cats = [...new Set(videos.map(v => v.category).filter(Boolean))].sort();
    sel.innerHTML = '<option value="All">Semua Kategori</option>' +
      cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function renderList(filter = '', cat = 'All') {
    let list = [...videos];
    if (cat && cat !== 'All') {
      list = list.filter(v => (v.category || '').toLowerCase() === cat.toLowerCase());
    }
    if (filter) {
      const q = filter.toLowerCase();
      list = list.filter(v =>
        (v.title || '').toLowerCase().includes(q) ||
        (v.category || '').toLowerCase().includes(q) ||
        (v.embedUrl || '').toLowerCase().includes(q)
      );
    }

    const container = $('#adminVideoList');
    if (list.length === 0) {
      container.innerHTML = '<p class="text-zinc-500 text-center py-10">Tidak ada video.</p>';
      return;
    }

    container.innerHTML = list.map(v => `
      <div class="admin-card flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-surface-800 border border-zinc-800 rounded-2xl">
        <div class="w-full sm:w-28 aspect-video bg-surface-700 rounded-xl overflow-hidden shrink-0">
          ${v.thumbnail && isValidUrl(v.thumbnail)
            ? `<img src="${escapeHtml(v.thumbnail)}" class="w-full h-full object-cover" onerror="this.style.display='none'">`
            : `<div class="w-full h-full flex items-center justify-center text-zinc-600"><i class="fas fa-film"></i></div>`}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-medium truncate">${escapeHtml(v.title)}</div>
          <div class="text-xs text-zinc-500 mt-1 flex flex-wrap gap-2">
            <span class="px-2 py-0.5 rounded-full bg-zinc-800">${escapeHtml(v.category || 'Umum')}</span>
            <span>${escapeHtml(v.date || '')}</span>
          </div>
          <div class="text-[11px] text-zinc-600 mt-1 truncate font-mono">${escapeHtml(v.embedUrl)}</div>
        </div>
        <div class="flex gap-2 shrink-0">
          <button class="edit-btn px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-sm" data-id="${v.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-btn px-3 py-1.5 rounded-lg bg-rose-900/50 hover:bg-rose-800 text-rose-300 text-sm" data-id="${v.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');

    $$('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => startEdit(parseInt(btn.dataset.id, 10)));
    });
    $$('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Hapus video ini?')) {
          videos = videos.filter(v => v.id !== parseInt(btn.dataset.id, 10));
          saveToStorage();
          renderList($('#adminSearch').value, $('#adminCatFilter').value);
          populateCatFilter();
        }
      });
    });
  }

  function startEdit(id) {
    const v = videos.find(x => x.id === id);
    if (!v) return;
    editingId = id;
    $('#formTitle').textContent = 'Edit Video';
    $('#editId').value = id;
    $('#formTitleInput').value = v.title || '';
    $('#formEmbed').value = v.embedUrl || '';
    $('#formThumb').value = v.thumbnail || '';
    $('#formCategory').value = v.category || '';
    $('#formDate').value = v.date || '';
    switchTab('add');
    updatePreview();
  }

  function resetForm() {
    editingId = null;
    $('#formTitle').textContent = 'Tambah Video Baru';
    $('#videoForm').reset();
    $('#editId').value = '';
    $('#formDate').value = new Date().toISOString().slice(0, 10);
    $('#previewBox').classList.add('hidden');
  }

  function updatePreview() {
    const url = $('#formEmbed').value.trim();
    if (url && isValidUrl(url)) {
      $('#previewBox').classList.remove('hidden');
      $('#previewIframe').src = url;
    } else {
      $('#previewBox').classList.add('hidden');
      $('#previewIframe').src = '';
    }
  }

  function switchTab(name) {
    $$('.admin-tab').forEach(t => {
      t.classList.remove('active', 'bg-rose-600', 'text-white');
      t.classList.add('bg-surface-800', 'border', 'border-zinc-700');
    });
    $$('.tab-content').forEach(c => c.classList.add('hidden'));

    const btn = $(`.admin-tab[data-tab="${name}"]`);
    if (btn) {
      btn.classList.add('active', 'bg-rose-600', 'text-white');
      btn.classList.remove('bg-surface-800', 'border', 'border-zinc-700');
    }
    const panel = $(`#tab-${name}`);
    if (panel) panel.classList.remove('hidden');

    if (name === 'add' && !editingId) {
      resetForm();
    }
  }

  function previewBulk() {
    const raw = $('#bulkInput').value.trim();
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const prefix = $('#bulkTitlePrefix').value.trim() || 'Video';
    const cat = $('#bulkCategory').value.trim() || 'Umum';
    const date = $('#bulkDate').value || new Date().toISOString().slice(0, 10);

    const existingUrls = new Set(videos.map(v => (v.embedUrl || '').toLowerCase()));
    bulkCandidates = [];

    const listEl = $('#bulkPreviewList');
    listEl.innerHTML = '';

    // Support 2 format:
    // 1. URL saja (satu per baris)
    // 2. Judul + URL bergantian (judul\nurl\njudul\nurl...)
    const pairs = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isValidUrl(line)) {
        // URL → title sebelumnya (kalau bukan URL) atau auto
        const prev = i > 0 && !isValidUrl(lines[i - 1]) ? lines[i - 1] : null;
        pairs.push({ title: prev || null, url: line });
      } else if (i + 1 < lines.length && isValidUrl(lines[i + 1])) {
        // Judul diikuti URL di baris berikutnya
        pairs.push({ title: line, url: lines[i + 1] });
        i++; // skip URL yang sudah diambil
      }
    }

    let validCount = 0;
    pairs.forEach((pair, idx) => {
      const url = pair.url;
      const isDup = existingUrls.has(url.toLowerCase());
      const status = isDup ? 'dup' : 'ok';
      if (status === 'ok') validCount++;

      const autoTitle = pair.title || `${prefix} ${videos.length + validCount}`;
      const detected = detectCategory(autoTitle + ' ' + url, url);
      const finalCat = (cat && cat !== 'Umum') ? cat : detected;

      bulkCandidates.push({
        title: autoTitle,
        embedUrl: url,
        category: finalCat,
        date,
        status
      });

      const badge = status === 'ok' ? '<span class="text-emerald-400">Valid</span>' :
                    status === 'dup' ? '<span class="text-amber-400">Duplikat</span>' :
                    '<span class="text-rose-400">URL tidak valid</span>';

      listEl.innerHTML += `
        <div class="flex items-start gap-3 p-2 rounded-lg bg-surface-900 border border-zinc-800">
          <input type="checkbox" class="bulk-check mt-1" data-idx="${idx}" ${status === 'ok' ? 'checked' : ''} ${status !== 'ok' ? 'disabled' : ''}>
          <div class="flex-1 min-w-0">
            <div class="text-xs font-medium truncate">${escapeHtml(autoTitle)}</div>
            <div class="font-mono text-[11px] text-neutral-500 truncate">${escapeHtml(url)}</div>
            <div class="text-[11px] mt-0.5 flex gap-2 flex-wrap">
              ${badge}
              <span class="text-red-400/80">${escapeHtml(finalCat)}</span>
            </div>
          </div>
        </div>
      `;
    });

    $('#bulkPreview').classList.remove('hidden');
    $('#bulkImportBtn').disabled = validCount === 0;
  }

  function doBulkImport() {
    const checks = $$('.bulk-check:checked');
    if (checks.length === 0) return;

    const toAdd = [];
    checks.forEach(chk => {
      const idx = parseInt(chk.dataset.idx, 10);
      const item = bulkCandidates[idx];
      if (item && item.status === 'ok') {
        // Auto-detect category & tags from title if still default
        const detectedCat = detectCategory(item.title, item.embedUrl);
        const finalCat = (!item.category || item.category === 'Umum') ? detectedCat : item.category;
        toAdd.push(normalizeVideo({
          id: getNextId() + toAdd.length,
          title: item.title,
          embedUrl: item.embedUrl,
          category: finalCat,
          date: item.date || new Date().toISOString().slice(0, 10),
          thumbnail: ''
        }));
      }
    });

    if (toAdd.length > 0) {
      // Newest first: unshift so new videos appear at the front
      videos.unshift(...toAdd.reverse()); // reverse supaya urutan paste tetap dari atas ke bawah
      saveToStorage();
      alert(`Berhasil import ${toAdd.length} video (ditaruh di depan). Jangan lupa Export JSON & commit ke repo!`);
      $('#bulkInput').value = '';
      $('#bulkPreview').classList.add('hidden');
      switchTab('list');
      renderList();
      populateCatFilter();
    }
  }

  function exportJson() {
    // Export format yang kompatibel + tags
    const exportData = videos.map(v => ({
      title: v.title,
      direct: v.embedUrl,
      embed: v.embedUrl,
      source: 'Text Import',
      category: v.category || 'Umum',
      tags: v.tags || [],
      date: v.date || ''
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'videos.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) throw new Error('Bukan array');
        videos = data.map(normalizeVideo);
        saveToStorage();
        alert(`Berhasil import ${videos.length} video.`);
        renderList();
        populateCatFilter();
        switchTab('list');
      } catch (err) {
        alert('File JSON tidak valid: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  async function resetData() {
    if (!confirm('Reset data ke videos.json asli? Perubahan local akan hilang.')) return;
    localStorage.removeItem(STORAGE_KEY);
    await loadInitialData();
    renderList();
    populateCatFilter();
    alert('Data di-reset.');
  }

  function bindEvents() {
    $('#loginBtn').addEventListener('click', () => {
      const pw = $('#loginPassword').value;
      if (login(pw)) {
        showApp();
      } else {
        alert('Password salah.');
      }
    });
    $('#loginPassword').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') $('#loginBtn').click();
    });

    $('#logoutBtn').addEventListener('click', logout);

    $$('.admin-tab').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    $('#adminSearch').addEventListener('input', () => {
      renderList($('#adminSearch').value, $('#adminCatFilter').value);
    });
    $('#adminCatFilter').addEventListener('change', () => {
      renderList($('#adminSearch').value, $('#adminCatFilter').value);
    });

    $('#videoForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = $('#formTitleInput').value.trim();
      const embedUrl = $('#formEmbed').value.trim();
      const thumbnail = $('#formThumb').value.trim();
      const category = $('#formCategory').value.trim() || 'Umum';
      const date = $('#formDate').value || new Date().toISOString().slice(0, 10);

      if (!title || !embedUrl) {
        alert('Judul dan Embed URL wajib diisi.');
        return;
      }
      if (!isValidUrl(embedUrl)) {
        alert('Embed URL tidak valid.');
        return;
      }

      const dup = videos.find(v => v.embedUrl.toLowerCase() === embedUrl.toLowerCase() && v.id !== editingId);
      if (dup) {
        if (!confirm('URL embed ini sudah ada. Tetap simpan?')) return;
      }

      // Auto-detect if user left category as default / empty
      const finalCat = (!category || category === 'Umum') ? detectCategory(title, embedUrl) : category;

      if (editingId) {
        const idx = videos.findIndex(v => v.id === editingId);
        if (idx !== -1) {
          videos[idx] = { ...videos[idx], title, embedUrl, thumbnail, category: finalCat, date, tags: detectTags(title) };
        }
      } else {
        // Newest first → unshift
        videos.unshift(normalizeVideo({
          id: getNextId(),
          title, embedUrl, thumbnail, category: finalCat, date
        }));
      }

      saveToStorage();
      resetForm();
      switchTab('list');
      renderList();
      populateCatFilter();
      alert('Tersimpan. Export JSON untuk membuat permanen.');
    });

    $('#cancelEdit').addEventListener('click', () => {
      resetForm();
      switchTab('list');
    });

    $('#formEmbed').addEventListener('input', updatePreview);

    $('#bulkPreviewBtn').addEventListener('click', previewBulk);
    $('#bulkImportBtn').addEventListener('click', doBulkImport);

    $('#exportBtn').addEventListener('click', exportJson);
    $('#importFile').addEventListener('change', (e) => {
      if (e.target.files[0]) importFromFile(e.target.files[0]);
    });
    $('#resetBtn').addEventListener('click', resetData);
  }

  async function init() {
    bindEvents();
    $('#formDate').value = new Date().toISOString().slice(0, 10);
    $('#bulkDate').value = new Date().toISOString().slice(0, 10);

    if (isLoggedIn()) {
      await loadInitialData();
      showApp();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
