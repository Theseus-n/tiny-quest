<div align="center">

# 🌈 Petualangan Memasang Platform Belajar Anak

### Panduan memasang dari **Level 1**, satu langkah demi satu langkah

*Untuk orang tua, wali, atau guru yang akan menyalakan platform di laptop. Tidak perlu pengalaman membuat program.*

</div>

---

## 🎯 Platform ini apa?

Platform ini adalah aplikasi web berisi **enam permainan edukatif** untuk satu anak usia 5 tahun. Anak belajar coding dasar, matematika awal, dan berkreasi, **tanpa perlu membaca**. Semua berjalan di laptop sendiri dan **tidak butuh internet** setelah terpasang.

| Hal penting | Penjelasan |
|-------------|-----------|
| 🧒 Pemain | Anak, dengan klik mouse. Tidak ada akun atau kata sandi |
| 🧑 Pemasang | **Orang dewasa**, yaitu kamu yang membaca panduan ini |
| 🔒 Privasi | Alamat `127.0.0.1:8080` hanya bisa dibuka dari laptop itu sendiri, bukan dari HP atau laptop lain di WiFi |
| 💾 Data | Progres dan karya anak disimpan di laptop, lalu dicadangkan otomatis ke folder `cadangan/` |
| 🎮 Level | Setiap permainan mulai dari **level 1** pada pemakaian pertama |

> 📌 **Status pengujian (jujur):** menurut catatan validasi internal (22 Oktober 2026), uji unit, uji tampilan, dan uji gabungan sudah lolos pada 22 Oktober 2026, tetapi **`docker compose up` belum pernah dijalankan** karena Docker belum terpasang di laptop pembuatnya. Jalur Docker di bawah mengikuti isi `Dockerfile` dan `docker-compose.yml`, jadi kalau ada yang tidak cocok, tolong catat dan laporkan.

---

## 🗺️ Peta Petualangan

| Level | Nama | Hasilnya |
|:-----:|------|----------|
| 1 | Cek Laptop | Tahu laptopmu siap |
| 2 | Pasang Docker Desktop | "Kotak ajaib" untuk menjalankan platform |
| 3 | Siapkan Folder Proyek | Folder bersih, mulai dari level 1 |
| 4 | Nyalakan Platform | Platform berjalan |
| 5 | Buka dan Main | Layar awal tampil di browser |
| 6 | Pintasan dan Menyala Otomatis | Tinggal klik untuk memulai |
| 7 | Cadangan, Pindah Laptop, dan Mulai Ulang | Aman dan bisa diulang dari level 1 |
| ⭐ Bonus A | Tanpa Docker | Jalur alternatif lewat Node.js |
| ⭐ Bonus B | Untuk Pengembang | Uji dan mode pengembangan |
| 👹 Boss | Hadapi Error | Tabel penyelamat |

### 📋 Papan Progres

- [ ] Level 1
- [ ] Level 2
- [ ] Level 3
- [ ] Level 4
- [ ] Level 5
- [ ] Level 6
- [ ] Level 7

> 💡 Jangan lompat level. Selesaikan satu, centang, baru lanjut.

---

# 🟢 LEVEL 1: Cek Laptop

### 🎯 Misi
Memastikan laptop siap sebelum mengunduh apa pun.

### 🧰 Yang dibutuhkan

| Kebutuhan | Keterangan |
|-----------|------------|
| 💻 Windows 10 atau 11 (64-bit) | Panduan ini untuk Windows |
| ⚙️ Virtualisasi aktif | Dibutuhkan Docker. Biasanya sudah aktif |
| 🌐 Internet **sekali saja** | Untuk mengunduh Docker dan membangun platform. Setelah itu bisa offline |
| 💾 Ruang kosong | Sisakan beberapa GB. Docker dan hasil build memakan ruang |
| 🔑 Hak Administrator | Untuk memasang Docker Desktop |
| 🖱️ Browser | Edge atau Chrome |

### 👣 Langkah

1. Tekan tombol **Windows**, ketik `PowerShell`, lalu klik **Windows PowerShell**.
2. Ketik lalu Enter:

```powershell
winver
```

Jendela kecil menampilkan versi Windows kamu.

3. Cek virtualisasi:

```powershell
systeminfo | findstr /i "Hyper-V Virtualization"
```

### ✅ Checkpoint
- Windows kamu versi 10 atau 11.
- Kalau tertulis `Virtualization Enabled In Firmware: Yes` (atau Hyper-V terdeteksi), kamu siap. Jika `No`, aktifkan **Virtualization / SVM / Intel VT-x** di BIOS laptop.

> 🍎🐧 Mac/Linux: Docker Desktop juga tersedia, dan perintah `docker compose` sama. Panduan ini hanya menguji alur di Windows.

---

# 🟢 LEVEL 2: Pasang Docker Desktop

### 🎯 Misi
Memasang **Docker Desktop**, alat yang menjalankan platform di dalam "kotak" siap pakai.

### 📖 Penjelasan singkat
Platform ini sengaja dibuat berjalan lewat Docker supaya **mudah dipindah dan dinyalakan**: satu perintah, tanpa memasang bahasa pemrograman satu per satu.

### 👣 Langkah

**Cara cepat:**

```powershell
winget install --id Docker.DockerDesktop -e
```

**Cara manual:** unduh dari <https://www.docker.com/products/docker-desktop/>, jalankan installer, dan **biarkan opsi WSL 2 tercentang**.

Lalu:

1. **Restart laptop** jika diminta.
2. Buka aplikasi **Docker Desktop** dari menu Start.
3. Setujui syarat layanan jika muncul. Akun Docker boleh dilewati kalau ada tombol *Skip*.
4. Tunggu sampai status di pojok kiri bawah **hijau / Engine running**.

Kalau diminta WSL 2, buka PowerShell sebagai **Administrator** dan jalankan:

```powershell
wsl --install
```

lalu restart.

### 🧪 Tes (di PowerShell biasa, buka ulang dulu)

```powershell
docker --version
docker compose version
```

### ✅ Checkpoint
Muncul dua nomor versi, misalnya `Docker version 2x.x.x` dan `Docker Compose version v2.x.x`.

### 🆘 Kalau macet
| Masalah | Solusi |
|---------|--------|
| `docker is not recognized` | Tutup lalu buka ulang PowerShell, atau restart laptop |
| Docker Desktop terus "starting" | Pastikan virtualisasi aktif (Level 1) dan WSL 2 terpasang |
| `winget` tidak ada | Pakai cara manual |

---

# 🟡 LEVEL 3: Siapkan Folder Proyek

### 🎯 Misi
Menyiapkan folder `platform-belajar-anak` yang **bersih**, supaya anak mulai dari **level 1**.

### ⚠️ Baca ini dulu: kenapa "bersih" itu penting
Saat platform menyala dengan database kosong, ia akan **otomatis memulihkan cadangan terbaru** kalau ada file `.db` di folder `cadangan/`. Artinya:

| Kamu ingin | Maka folder `cadangan/` harus |
|------------|-------------------------------|
| **Mulai baru dari level 1** (pemasangan pertama di laptop orang lain) | **Tidak berisi file `.db`** |
| **Memindahkan** progres anak dari laptop lama | **Tetap berisi** file `.db` cadangan |

### 👣 Langkah: pilih salah satu cara mendapatkan folder

**Cara 1: dari orang yang membagikan folder (flashdisk / zip)**

1. Salin atau ekstrak folder `platform-belajar-anak` ke tempat yang mudah, misalnya `Documents`.
2. Untuk **mulai dari level 1**, hapus bagian yang berisi data pribadi dan hasil lama. Di PowerShell:

```powershell
cd $HOME\Documents\platform-belajar-anak
Remove-Item cadangan\*.db -ErrorAction SilentlyContinue
Remove-Item data -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
```

> `node_modules` tidak perlu dibawa: Docker membangunnya sendiri.

**Cara 2: dari Git** *(jika proyek sudah punya alamat repo)*

```powershell
cd $HOME\Documents
git clone ALAMAT-REPO-PROYEK platform-belajar-anak
cd platform-belajar-anak
```

Ganti `ALAMAT-REPO-PROYEK` dengan alamat yang kamu terima. File `.db` di `cadangan/` sudah diabaikan Git (`.gitignore`), jadi hasil clone otomatis bersih. Catatan: saat panduan ini ditulis, repo lokalnya belum punya commit dan belum punya alamat remote.

### 🧪 Tes

```powershell
cd $HOME\Documents\platform-belajar-anak
dir
dir cadangan
```

### ✅ Checkpoint
- Kamu melihat `Dockerfile`, `docker-compose.yml`, `package.json`, `frontend`, `backend`, dan `skema`.
- Untuk mulai baru: folder `cadangan` **kosong**.

---

# 🟡 LEVEL 4: Nyalakan Platform

### 🎯 Misi
Membangun dan menjalankan platform.

### 📖 Penjelasan singkat
Perintah ini membuat "kotak" platform dari kode sumber. Prosesnya: memasang paket, memeriksa aturan konsistensi (`npm run periksa`), membangun tampilan dan backend, lalu menyalakan satu container.

### 👣 Langkah

Pastikan **Docker Desktop sudah Running**, lalu di folder proyek:

```powershell
cd $HOME\Documents\platform-belajar-anak
docker compose up -d --build
```

⏳ **Sabar:** pertama kali bisa beberapa menit karena mengunduh gambar dasar `node:24-slim` dan memasang paket. Kalau layar penuh tulisan, itu normal.

Cek keadaannya:

```powershell
docker compose ps
docker compose logs platform
```

### ✅ Checkpoint
- `docker compose ps` menunjukkan layanan `platform` berstatus **running** (lalu **healthy** sekitar setengah menit kemudian).
- Di log muncul kalimat seperti:

```
Database baru dibuat (pertama kali dipakai).
Platform berjalan di http://localhost:8080
```

(Kalau muncul `Database dipulihkan dari ...`, berarti masih ada file cadangan lama. Lihat Level 3 dan Level 7 untuk mulai ulang.)

### 🆘 Kalau macet
| Masalah | Solusi |
|---------|--------|
| `error during connect` / daemon tidak jalan | Buka Docker Desktop, tunggu Running |
| `port is already allocated` (8080) | Ada program lain di port 8080. Lihat tabel Boss di bawah |
| Build berhenti di langkah `npm run periksa` | Ada pelanggaran aturan konsistensi di kode. Baca pesannya, lalu lapor ke pengembang |
| Unduhan gagal / lambat | Cek internet, ulangi perintah yang sama |

---

# 🔴 LEVEL 5: Buka dan Main

### 🎯 Misi
Membuka platform dan memastikan semuanya hidup.

### 👣 Langkah

1. Buka browser (Edge/Chrome), lalu ketik di kotak alamat:

```
http://localhost:8080
```

2. Kamu akan melihat **layar pembuka** dengan satu tombol besar bergambar tokoh pemandu. **Klik tombol itu.** Klik ini yang mengaktifkan suara dan membuat browser masuk **layar penuh**. Browser tidak mengizinkan keduanya sebelum ada klik.
3. Muncul **layar awal** dengan gambar-gambar besar, satu untuk tiap permainan.
4. Klik satu permainan. Setiap permainan dimulai dari **level 1**.

Cek kesehatan layanan (opsional):

```powershell
curl.exe http://127.0.0.1:8080/api/kesehatan
```

### ✅ Checkpoint
Layar pembuka tampil, setelah diklik anak masuk ke layar awal, dan level 1 permainan pertama bisa dimainkan dengan klik. 🎉

### 🎮 Catatan untuk pendamping
- Tombol **Esc** mengeluarkan browser dari layar penuh. Platform tidak mengunci sistem operasi. Kalau anak keluar, buka lagi dan klik tombol besar di layar pembuka.
- Semua tombol keyboard diabaikan saat anak bermain.
- Anak boleh pindah permainan kapan saja dan mengulang level yang sudah selesai.
- Menurut catatan validasi internal, ada sekitar 30 kalimat narator yang belum punya file suara, jadi sebagian instruksi mungkin belum berbunyi.

### 🆘 Kalau macet
| Masalah | Solusi |
|---------|--------|
| Halaman tidak terbuka | Cek `docker compose ps`. Pastikan `platform` running |
| Halaman 404 / kosong | Lihat `docker compose logs platform`, lalu jalankan ulang dengan `--build` |
| Tidak ada suara | Klik dulu tombol besar di layar pembuka dan cek volume laptop |

---

# 🟠 LEVEL 6: Pintasan dan Menyala Otomatis

### 🎯 Misi
Supaya hari-hari berikutnya cukup **satu klik**, tanpa membuka terminal.

### 👣 Langkah

**1) Buat pintasan di desktop**

```powershell
Set-Content "$HOME\Desktop\Platform Belajar Anak.url" "[InternetShortcut]`nURL=http://localhost:8080"
```

**2) Docker Desktop menyala otomatis saat Windows masuk**

Docker Desktop → ⚙️ **Settings** → **General** → centang **Start Docker Desktop when you sign in to Windows** → **Apply**.

**3) Platform ikut menyala sendiri**

Tidak perlu diatur lagi: `docker-compose.yml` sudah memakai `restart: unless-stopped`, jadi container ikut menyala setiap Docker menyala (kecuali kamu sengaja menghentikannya).

### ✅ Checkpoint
Restart laptop, tunggu Docker siap, klik pintasan di desktop, dan platform terbuka.

### 🔧 Perintah sehari-hari

| Mau apa | Perintah (di folder proyek) |
|---------|------------------------------|
| Menghentikan (data aman, cadangan dibuat) | `docker compose down` |
| Menyalakan lagi | `docker compose up -d` |
| Melihat log | `docker compose logs -f platform` |
| Memperbarui setelah kode berubah | `docker compose up -d --build` |

---

# 🏆 LEVEL 7: Cadangan, Pindah Laptop, dan Mulai Ulang

### 🎯 Misi
Memahami tiga tempat penyimpanan dan melakukan dua hal penting: **pindah laptop** dan **mulai ulang dari level 1**.

### 📖 Tiga tempat penyimpanan

| Tempat | Isinya | Ikut saat salin folder? |
|--------|--------|:-----------------------:|
| Dalam image | Level, suara narator, gambar | ✅ (dibuat ulang saat build) |
| Volume Docker `data` | Database yang sedang dipakai (`platform.db`) | ❌ |
| Folder `cadangan/` | Salinan database `platform-TANGGAL-JAM.db` | ✅ |

Cadangan dibuat: saat platform menyala, **tiap 30 menit jika ada perubahan**, dan saat platform dihentikan lewat `docker compose down`. Karena itu, perubahan dalam 30 menit terakhir bisa belum tercadang kalau laptop mati mendadak.

### 🚚 A. Pindah ke laptop lain (progres anak ikut)

**Di laptop lama:**

```powershell
cd $HOME\Documents\platform-belajar-anak
docker compose down
```

Perintah ini membuat cadangan terakhir. Lalu **salin seluruh folder proyek, termasuk `cadangan/`**, ke flashdisk.

**Di laptop baru:** kerjakan Level 1–2, tempel folder ke `Documents`, lalu:

```powershell
cd $HOME\Documents\platform-belajar-anak
docker compose up -d --build
```

Karena volume baru kosong, platform **memulihkan cadangan terbaru otomatis**. Di log akan muncul `Database dipulihkan dari ...`.

✅ **Checkpoint:** buka `http://localhost:8080` dan pastikan progres serta karya anak terlihat. **Jangan hapus data di laptop lama sebelum ini terlihat.**

### 🔄 B. Mulai ulang dari level 1 (menghapus semua progres)

> ⚠️ **Ini menghapus progres dan karya anak.** Kalau masih ingin menyimpannya, salin dulu folder `cadangan/` ke tempat lain.

Dua tempat harus dikosongkan, karena kalau hanya volume yang dihapus, cadangan lama akan dipulihkan lagi:

```powershell
cd $HOME\Documents\platform-belajar-anak
docker compose down -v
Remove-Item cadangan\*.db -ErrorAction SilentlyContinue
docker compose up -d
```

✅ **Checkpoint:** log menampilkan `Database baru dibuat (pertama kali dipakai).` dan semua permainan mulai dari level 1.

### 🎊 SELAMAT!
Kamu sudah menamatkan **7 Level inti**. Platform berjalan, bisa dinyalakan dengan satu klik, dan datanya aman.

---

# ⭐ BONUS A: Tanpa Docker (Lewat Node.js)

> Jalur alternatif. Jalur Docker tetap yang disarankan untuk pemakaian sehari-hari.

### 🧰 Alat
- **Node.js 24** (Dockerfile memakai `node:24-slim` dan backend dibangun untuk target Node 24). Unduh dari <https://nodejs.org>, atau:

```powershell
winget install --id OpenJS.NodeJS -e
node -v      # sebaiknya v24.x
npm -v
```

### 👣 Langkah

```powershell
cd $HOME\Documents\platform-belajar-anak
npm install
npm run build
npm run mulai
```

Buka `http://127.0.0.1:8080`.

- Data tersimpan di folder `data/` di dalam proyek, dan cadangan di `cadangan/`.
- Hentikan dengan **Ctrl + C** (cadangan terakhir dibuat saat berhenti).
- Mulai dari level 1: hentikan platform, lalu hapus `data\` dan `cadangan\*.db`.

### 🆘 Catatan
| Masalah | Solusi |
|---------|--------|
| Gagal memasang `better-sqlite3` | Paket ini punya bagian native. Pastikan memakai Node LTS/terbaru. Jika masih gagal, pasang *Desktop development with C++* dari Visual Studio Build Tools lalu ulangi `npm install` |
| Halaman 404 | Jalankan `npm run build` dulu sebelum `npm run mulai` |
| Port 8080 dipakai | Jalankan dengan `$env:PORT=8081; npm run mulai` |

---

# ⭐ BONUS B: Untuk Pengembang

| Perintah (dari folder proyek) | Fungsi |
|-------------------------------|--------|
| `npm install` | Memasang semua paket workspace (`skema`, `frontend`, `backend`) |
| `npm run dev` | Tampilan dengan Vite di `http://localhost:5173` (permintaan `/api` diteruskan ke port 8080) |
| `npm run dev -w backend` | Backend dengan mode pantau (`tsx watch`) |
| `npm run periksa` | Memeriksa aturan konsistensi: warna, teks, bunyi, naskah narator |
| `npm run tes` | Uji unit (Vitest) |
| `npm run uji-e2e` | Uji ujung ke ujung tampilan (Playwright) |
| `npm run uji-backend` | Build lalu uji gabungan tampilan dan backend |
| `npm run suara` | Membuat file suara dari naskah narator |
| `npm run build` | Membangun tampilan (mode backend) dan backend |

Playwright memerlukan browser. Jika diminta: `npx playwright install`.

Variabel lingkungan backend (diatur otomatis di Docker):

| Variabel | Bawaan (tanpa Docker) | Di Docker |
|----------|-----------------------|-----------|
| `HOST` | `127.0.0.1` | `0.0.0.0` (port tetap hanya dibuka ke `127.0.0.1` oleh compose) |
| `PORT` | `8080` | `8080` |
| `FOLDER_DATA` | `data/` di proyek | `/data` |
| `FOLDER_CADANGAN` | `cadangan/` di proyek | `/cadangan` |
| `FOLDER_TAMPILAN` | `frontend/dist` | `/app/frontend/dist` |
| `SELANG_CADANGAN_MS` | `1800000` (30 menit) | sama |

Struktur singkat:

```
platform-belajar-anak/
├── frontend/   tampilan anak (React + Vite)
├── backend/    API dan penyimpanan (Hono + SQLite)
├── skema/      bentuk data bersama
├── alat/       skrip pemeriksa dan pembuat suara
├── cadangan/   cadangan database (*.db, tidak masuk Git)
├── data/       database yang sedang dipakai (tanpa Docker)
├── docs/       keputusan arsitektur (ADR)
└── Dockerfile · docker-compose.yml
```

---

# 👹 BOSS LEVEL: Hadapi Error

### 🧪 Resep 4 Langkah
1. **Baca** baris merah di terminal.
2. **Cek posisi:** `pwd` harus berakhir dengan `platform-belajar-anak`.
3. **Cek Docker:** apakah Docker Desktop berstatus Running?
4. **Lihat log:** `docker compose logs platform`.

### 🧾 Tabel Penyelamat

| Gejala | Penyebab umum | Obat |
|--------|---------------|------|
| `docker is not recognized` | PowerShell belum dibuka ulang | Tutup lalu buka lagi, atau restart laptop |
| `error during connect` / `cannot connect to the Docker daemon` | Docker Desktop belum jalan | Buka Docker Desktop, tunggu Running |
| Docker Desktop tidak mau mulai | Virtualisasi/WSL 2 | Aktifkan virtualisasi di BIOS, jalankan `wsl --install` (Admin) |
| `port is already allocated` / `address already in use` (8080) | Program lain memakai 8080 | Ubah baris `ports` di `docker-compose.yml` menjadi `"127.0.0.1:8081:8080"`, jalankan `docker compose up -d`, buka `http://localhost:8081` |
| Build gagal di `npm run periksa` | Aturan konsistensi dilanggar | Baca baris yang menunjuk file dan nomor baris, lalu lapor ke pengembang |
| Platform dimulai dengan progres lama, bukan level 1 | `cadangan/` masih berisi `.db` | Ikuti Level 7 bagian B |
| `Database dipulihkan dari ...` padahal ingin baru | Sama seperti di atas | Level 7 bagian B |
| Status container `unhealthy` | Platform belum siap atau error | `docker compose logs platform`, tunggu 1 menit, lalu `docker compose up -d --build` |
| Tidak ada suara | Belum ada klik pertama, atau narasi belum direkam | Klik tombol besar di layar pembuka; sebagian kalimat memang belum punya file suara |
| Anak keluar dari layar penuh | Menekan Esc | Buka lagi `http://localhost:8080` dan klik tombol besar |
| Progres hilang setelah laptop mati mendadak | Cadangan terakhir bisa tertinggal sampai 30 menit | Data tetap ada di volume di laptop yang sama; nyalakan lagi seperti biasa |

---

# 📚 Kamus Mini

| Istilah | Penjelasan |
|---------|-----------|
| **Docker** | Alat yang menjalankan program di dalam "kotak" lengkap |
| **Container** | Satu kotak yang sedang berjalan (di sini: platform) |
| **Image** | Cetakan kotak, dibuat dari `Dockerfile` |
| **Volume** | Tempat simpan di dalam Docker, dipakai untuk database |
| **Cadangan** | Salinan database di folder `cadangan/` |
| **localhost** | Alamat laptopmu sendiri, tidak terlihat orang lain |
| **Port 8080** | "Pintu" tempat platform menunggu |
| **WSL 2** | Fitur Windows yang dibutuhkan Docker |
| **Node.js** | Mesin penjalan JavaScript, dipakai di jalur tanpa Docker |
| **Level 1** | Awal setiap permainan; muncul saat database baru |

---

<div align="center">

### 🏅 Selamat! Kamu resmi menjadi Pemasang Platform

*Keputusan arsitektur utama ada di folder [`docs/adr`](docs/adr).*

</div>
