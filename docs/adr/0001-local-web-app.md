# Web app lokal yang dijalankan dengan Docker

Platform dibuat sebagai web app yang berjalan di laptop keluarga lewat Docker Compose dan dibuka di browser dalam mode layar penuh. Pemakainya hanya anak di keluarga sendiri, harus jalan tanpa internet, dan semua progres serta karya anak harus bisa dipindahkan ke laptop lain tanpa ada yang hilang. Data disimpan di backend lokal, bukan di penyimpanan browser, karena data browser tidak ikut pindah bersama folder proyek.

## Considered Options

- **Aplikasi desktop (installer .exe)**: paling mudah mengunci anak di layar penuh, tetapi tidak cocok dengan Docker, dan pindah laptop berarti memasang ulang aplikasi lalu menyalin data secara terpisah.
- **Web app online**: tidak perlu dipindahkan, tetapi butuh internet, server berbayar, dan membuat data anak keluar dari laptop.

## Consequences

Aplikasi hanya bisa dipakai kalau Docker sedang berjalan. Kalau nanti platform dibuka untuk keluarga lain, web app ini bisa dipindah ke server online tanpa ditulis ulang.
