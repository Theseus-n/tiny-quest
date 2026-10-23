# 🌈 Platform Belajar Anak

Aplikasi web berisi **enam permainan edukatif** untuk anak usia 5 tahun: coding dasar, matematika awal, dan berkreasi, **tanpa perlu membaca**. Berjalan di laptop sendiri, **tanpa internet** setelah terpasang, tanpa akun.

Panduan ini untuk **orang dewasa yang memasang**. Tidak perlu bisa membuat program: salin perintahnya, tekan Enter, lalu cocokkan dengan bagian **✅ Yang harus terlihat**.

## Pilih jalurmu

| Kamu pakai | Jalur | Waktu |
|---|---|---|
| Windows 10/11, belum punya Docker | **[Jalur A: Pasang Docker Desktop dulu](#jalur-a-windows-dengan-docker-desktop)**, lalu lanjut ke Jalur B | 15–30 menit |
| Sudah punya Docker (Ubuntu WSL, Linux, atau Docker Desktop) | **[Jalur B: Ambil dan nyalakan dengan Docker](#jalur-b-ambil-dan-nyalakan-dengan-docker)** *(sudah diuji)* | 5–10 menit |
| Tidak mau Docker | **[Jalur C: Tanpa Docker](#jalur-c-tanpa-docker-nodejs)** | 10–20 menit |

> Cukup pilih **satu** jalur. Semuanya menghasilkan hal yang sama: platform di `http://localhost:8080`.

## Status pengujian

| Jalur | Status |
|---|---|
| B (Docker) | ✅ Diuji dari `git clone` sampai status `healthy`, di Ubuntu 22.04 WSL dengan Docker 29. Perintahnya sama di Docker Desktop |
| C (Node.js, Windows) | ✅ Diuji: periksa, build, 87 tes, 40 uji tampilan di Edge, server menyala |
| A (pasang Docker Desktop) | Hanya langkah memasang Docker. Platformnya sendiri sama dengan Jalur B |

---

## Cara kerja singkat

- **Docker** = "kotak" yang sudah berisi semua yang dibutuhkan platform. Kamu tidak perlu memasang bahasa pemrograman satu per satu.
- **Terminal** = jendela untuk mengetik perintah. Di Windows: tekan tombol Windows → ketik `PowerShell` → Enter. Di Ubuntu WSL: buka aplikasi **Ubuntu**.
- **localhost:8080** = alamat platform di laptopmu sendiri. Perangkat lain di WiFi **tidak bisa** membukanya.
- Data anak (progres dan karya) tersimpan di laptop, dan **dicadangkan otomatis** ke folder `cadangan/`.

---

# Jalur A: Windows dengan Docker Desktop

### Langkah A1: Pasang Git

Unduh dari <https://git-scm.com/download/win>, jalankan, klik **Next** terus sampai **Finish**. Lalu **tutup dan buka lagi** PowerShell.

```powershell
git --version
```

✅ **Yang harus terlihat:** `git version 2.xx.x...`

### Langkah A2: Pasang Docker Desktop

1. Unduh dari <https://www.docker.com/products/docker-desktop/> dan jalankan. **Biarkan opsi WSL 2 tercentang.**
2. Restart laptop kalau diminta.
3. Buka **Docker Desktop** dari menu Start. Akun Docker boleh dilewati.
4. Tunggu sampai status **Engine running** (hijau) di pojok kiri bawah.

Kalau diminta WSL 2, buka PowerShell sebagai **Administrator** lalu jalankan `wsl --install` dan restart.

```powershell
docker --version
docker compose version
```

✅ **Yang harus terlihat:** dua baris versi. Jika `docker is not recognized`, tutup-buka PowerShell atau restart laptop.

Docker sudah siap. Lanjut ke **[Jalur B](#jalur-b-ambil-dan-nyalakan-dengan-docker)** (perintahnya sama; di Windows jalankan di PowerShell).

---

# Jalur B: Ambil dan nyalakan dengan Docker

Buka terminalmu: **Ubuntu** (WSL/Linux), atau **PowerShell** di Windows dengan Docker Desktop. Lalu cek alatnya:

```bash
git --version
docker --version
docker compose version
```

✅ **Yang harus terlihat:** tiga versi. Jika Docker butuh `sudo`, pakai `sudo docker ...` atau tambahkan dirimu ke grup: `sudo usermod -aG docker $USER` lalu tutup-buka Ubuntu.

### Langkah B1: Unduh platform

Di Ubuntu WSL, simpan di folder rumah (jangan di `/mnt/c/...`, jauh lebih cepat dan aman untuk database). Di PowerShell, `cd $HOME\Documents` dulu:

```bash
cd ~
git clone https://github.com/Theseus-n/platform-belajar-anak.git
cd platform-belajar-anak
```

### Langkah B2: Nyalakan

```bash
docker compose up -d --build
```

✅ **Yang harus terlihat:** di akhir `Container platform-belajar-anak-platform-1  Started`. Di jalur ini, sekitar setengah menit pada pengujian penulis.

Lanjut ke **[Buka platform](#buka-platform)**.

---

# Buka platform

### Langkah 1: Cek sudah hidup

```bash
docker compose ps
docker compose logs platform
```

✅ **Yang harus terlihat:** status `Up`, lalu pada log:

```
Database baru dibuat (pertama kali dipakai).
Platform berjalan di http://localhost:8080
```

`Database baru dibuat` artinya semua permainan mulai dari **level 1**. Status `(healthy)` muncul sekitar setengah menit kemudian.

### Langkah 2: Buka di browser

Ketik di Edge/Chrome (di Windows, termasuk untuk Ubuntu WSL):

```
http://localhost:8080
```

✅ **Yang harus terlihat:** layar pembuka dengan satu tombol besar bergambar tokoh pemandu. **Klik tombol itu:** ini mengaktifkan suara dan layar penuh. Lalu pilih permainan, dan setiap permainan mulai dari level 1.

### Langkah 3 (opsional): Cek lewat terminal

```bash
curl http://127.0.0.1:8080/api/kesehatan
```

✅ **Yang harus terlihat:** `{"siap":true,"versiSkema":1}`

### Catatan untuk pendamping
- Tombol **Esc** keluar dari layar penuh. Buka lagi dan klik tombol besar.
- Anak boleh pindah permainan dan mengulang level kapan saja.
- Sebagian kalimat narator belum punya file suara, jadi beberapa instruksi mungkin belum berbunyi.

---

## Pemakaian sehari-hari

Jalankan di folder `platform-belajar-anak`.

| Mau apa | Perintah |
|---|---|
| Matikan (cadangan terakhir dibuat) | `docker compose down` |
| Nyalakan lagi | `docker compose up -d` |
| Lihat log | `docker compose logs -f platform` |
| Perbarui ke versi terbaru | `git pull` lalu `docker compose up -d --build` |

Di **Windows**, supaya tinggal klik: aktifkan *Start Docker Desktop when you sign in* di **Docker Desktop → Settings → General**, lalu buat pintasan:

```powershell
Set-Content "$HOME\Desktop\Platform Belajar Anak.url" "[InternetShortcut]`nURL=http://localhost:8080"
```

Container otomatis ikut menyala bersama Docker (`restart: unless-stopped`).

---

# Jalur C: Tanpa Docker (Node.js)

Butuh **Git** (lihat A1) dan **Node.js 24**. Unduh dari <https://nodejs.org>, pasang, lalu tutup-buka terminal.

```powershell
node -v
```

✅ **Yang harus terlihat:** `v24.x.x` (minimal `v22`).

```powershell
cd $HOME\Documents
git clone https://github.com/Theseus-n/platform-belajar-anak.git
cd platform-belajar-anak
npm install --ignore-scripts
npm run build
npm run mulai
```

> ⚠️ **Jangan lupa `--ignore-scripts`.** Tanpa itu, di Windows tanpa Visual Studio muncul error `gyp ERR! find VS`. Paket database sudah membawa file siap pakai, jadi compiler tidak diperlukan.

✅ **Yang harus terlihat:** `Platform berjalan di http://127.0.0.1:8080`. Buka alamat itu di browser. Hentikan dengan **Ctrl + C** (jangan tutup paksa, supaya cadangan terakhir dibuat).

Data ada di folder `data/` dan cadangan di `cadangan/`.

---

# Cadangan, pindah laptop, dan mulai ulang

| Tempat | Isi | Ikut saat folder disalin? |
|---|---|:-:|
| Volume Docker `data` | Database yang dipakai | ❌ |
| Folder `cadangan/` | Salinan `platform-TANGGAL-JAM.db` | ✅ |

Cadangan dibuat saat platform menyala, tiap 30 menit jika ada perubahan, dan saat dimatikan dengan `docker compose down`.

**Pindah laptop:** di laptop lama `docker compose down`, salin **seluruh folder proyek termasuk `cadangan/`**, lalu di laptop baru `docker compose up -d --build`. Progres dipulihkan otomatis (log: `Database dipulihkan dari ...`). Jangan hapus data laptop lama sebelum progres terlihat di laptop baru.

**Mulai ulang dari level 1** (⚠️ menghapus progres dan karya anak):

```bash
docker compose down -v
rm -f cadangan/*.db        # Windows PowerShell: Remove-Item cadangan\*.db
docker compose up -d
```

Dua-duanya harus dikosongkan, kalau tidak cadangan lama dipulihkan lagi.

---

# Kalau ada masalah

| Gejala | Penyebab | Solusi |
|---|---|---|
| `npm install` error `gyp ERR! find VS` | Tanpa `--ignore-scripts` | `npm install --ignore-scripts` |
| Build Docker error `node-gyp` | Dockerfile lama | `git pull`, lalu `docker compose up -d --build` |
| `docker is not recognized` | Terminal belum dibuka ulang | Tutup-buka, atau restart laptop |
| `error during connect` / daemon tidak jalan | Docker belum menyala | Buka Docker Desktop, tunggu **Engine running** |
| `permission denied` pada docker (Ubuntu) | Belum di grup docker | `sudo usermod -aG docker $USER`, tutup-buka Ubuntu |
| `port is already allocated` (8080) | Program lain memakai 8080 | Ubah di `docker-compose.yml` menjadi `"127.0.0.1:8081:8080"`, buka `http://localhost:8081` |
| Halaman tidak terbuka | Container mati | `docker compose ps` lalu `docker compose logs platform` |
| Mulai dengan progres lama, bukan level 1 | `cadangan/` berisi file `.db` | Ikuti **Mulai ulang** di atas |
| Tidak ada suara | Belum klik tombol besar pertama | Klik tombol besar di layar pembuka |
| Docker Desktop macet "starting" | Virtualisasi/WSL 2 | Aktifkan virtualisasi di BIOS, `wsl --install` (Admin) |

---

## Untuk pengembang

| Perintah | Fungsi |
|---|---|
| `npm install --ignore-scripts` | Pasang semua paket |
| `npm run dev` | Tampilan dengan Vite di `http://localhost:5173` |
| `npm run periksa` | Cek aturan konsistensi |
| `npm run tes` | Uji unit (Vitest) |
| `npm run uji-e2e` | Uji ujung ke ujung (Playwright, butuh `npx playwright install`) |
| `npm run build` | Bangun tampilan dan backend |

Variabel lingkungan backend (diatur otomatis di Docker): `HOST`, `PORT` (8080), `FOLDER_DATA`, `FOLDER_CADANGAN`, `FOLDER_TAMPILAN`, `SELANG_CADANGAN_MS` (30 menit).

```
platform-belajar-anak/
├── frontend/   tampilan anak (React + Vite)
├── backend/    API dan penyimpanan (Hono + SQLite)
├── skema/      bentuk data bersama
├── alat/       skrip pemeriksa dan pembuat suara
├── cadangan/   cadangan database (*.db tidak masuk Git)
├── docs/       keputusan arsitektur (ADR)
└── Dockerfile · docker-compose.yml
```

Lisensi: [MIT](LICENSE).
