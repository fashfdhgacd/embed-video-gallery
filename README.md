# Embed Video Gallery — Modern Collection

Website galeri video modern berbasis **link embed**. Ringan, responsif, dark mode, dengan modal player, search, filter kategori, pagination, dan Admin Panel sederhana.

**Tidak ada dependency berbayar.** Cocok di-deploy gratis ke **Cloudflare Pages** atau **GitHub Pages**.

---

## Fitur Utama

| Fitur | Keterangan |
|-------|------------|
| Grid video responsif | 1–5 kolom tergantung layar |
| Modal / Lightbox player | Klik card → video diputar di modal (bukan halaman baru) |
| Stop playback otomatis | Saat modal ditutup, iframe dikosongkan |
| Search real-time | Judul, kategori, embed URL |
| Filter kategori | All + kategori dinamis dari data |
| Pagination | 12 video per halaman |
| Lazy loading thumbnail | Performa bagus |
| Dark mode | Tampilan utama |
| Admin Panel | Tambah / Edit / Hapus / Bulk Import |
| Bulk Import | Paste banyak embed URL sekaligus |
| Export / Import JSON | Untuk menyimpan perubahan permanen |
| SEO dasar | title, meta, OG, robots.txt, sitemap |

---

## Struktur Project

```
embed-video-gallery/
├── index.html          # Halaman galeri utama
├── admin.html          # Admin Panel
├── css/
│   └── styles.css
├── js/
│   ├── app.js          # Logika galeri + modal
│   └── admin.js        # Logika admin
├── data/
│   └── videos.json     # Sumber data video (edit ini!)
├── robots.txt
├── sitemap.xml
├── .gitignore
└── README.md
```

---

## Cara Menjalankan Lokal

1. Clone repository ini
2. Buka folder project
3. Jalankan local server sederhana (karena `fetch` videos.json):

```bash
# Python
python -m http.server 8080

# atau Node
npx serve .
```

4. Buka `http://localhost:8080`

> Catatan: Membuka `index.html` langsung via `file://` mungkin gagal load JSON karena CORS. Gunakan local server.

---

## Cara Menambah Video

### Opsi 1 — Edit `data/videos.json` (direkomendasikan untuk permanen)

Tambahkan object baru:

```json
{
  "id": 13,
  "title": "Judul Video Baru",
  "thumbnail": "https://example.com/thumb.jpg",
  "embedUrl": "https://example.com/embed/xxxxx",
  "category": "Action",
  "date": "2026-08-18"
}
```

Lalu commit & push.

### Opsi 2 — Lewat Admin Panel

1. Buka `/admin.html`
2. Login (password default: `admin123`)
3. Gunakan tab **Tambah Video** atau **Bulk Import**
4. Setelah selesai → buka tab **Export / Import** → **Download videos.json**
5. Ganti file `data/videos.json` di repo dengan file yang di-download
6. Commit & push, lalu redeploy

---

## Bulk Import

1. Buka Admin → tab **Bulk Import**
2. Paste embed URL (satu per baris)
3. Isi prefix judul, kategori default, tanggal
4. Klik **Preview & Validasi**
5. Centang yang valid → **Import Selected**
6. Export JSON & commit

Sistem akan:
- Validasi URL
- Skip baris kosong
- Deteksi duplikasi (berdasarkan embedUrl)
- Buat record otomatis

---

## Deploy

### Cloudflare Pages (direkomendasikan)

1. Push repo ke GitHub
2. Cloudflare Dashboard → Workers & Pages → Create → Connect to Git
3. Pilih repository
4. Build command: **kosongkan**
5. Build output directory: `/` (atau biarkan default)
6. Deploy

### GitHub Pages

1. Repo Settings → Pages
2. Source: Deploy from a branch
3. Branch: `main` / root
4. Save

Setelah deploy, lakukan **Hard Refresh** (Ctrl+Shift+R).

---

## Mengubah Nama Website / Branding

- Edit `<title>` dan teks logo di `index.html`
- Edit meta description & Open Graph
- Ganti favicon (saat ini emoji SVG)

---

## Mengubah Kategori

Kategori bersifat dinamis. Yang muncul di filter = kombinasi default + yang ada di data video.

Default yang sudah disiapkan: All, Action, Comedy, Drama, Horror, Anime, Other, Documentary, dll.

Untuk menambah kategori baru cukup isi field `category` saat menambah video.

---

## Keterbatasan Admin Panel (Penting)

Karena ini **static site** (tanpa database server):

- Perubahan di Admin disimpan di **localStorage browser** saja.
- Agar perubahan muncul di website publik, Anda **harus Export JSON** lalu mengganti `data/videos.json` di repository dan push.
- Login admin hanya **demo**. Password hard-coded di `js/admin.js`.
- **Jangan anggap sistem login ini aman untuk production.** Siapa pun yang tahu password (atau membaca source) bisa masuk.
- Untuk production multi-user / keamanan nyata, gunakan backend (Cloudflare Workers + KV / D1, Supabase, dll).

---

## Keamanan

- Tidak ada `eval()`, obfuscated code, atau credential di source.
- Embed URL divalidasi (harus http/https).
- Password demo hanya untuk kemudahan testing. **Ganti segera** di `js/admin.js` jika repo private.
- Jangan commit token GitHub, API key, atau password production.

---

## Teknologi

- HTML5 + CSS3 + Vanilla JavaScript
- Tailwind CSS (CDN)
- Font Awesome (CDN)
- Tidak ada framework build (Vite/React opsional tidak digunakan agar deploy super mudah)

---

## Demo Data

`data/videos.json` berisi 12 video contoh dengan embed YouTube publik yang aman. Ganti dengan data Anda sendiri.

---

## Lisensi & Penggunaan

Gunakan untuk koleksi pribadi / project yang legal. Pastikan Anda memiliki hak untuk menampilkan embed yang digunakan.

---

**Built for easy management of embed-based video collections.**  
Siap push & deploy.
