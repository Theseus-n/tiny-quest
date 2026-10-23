# SQLite di volume Docker, dengan cadangan otomatis ke folder proyek

Progres dan karya anak disimpan di satu file SQLite di dalam volume Docker, lalu disalin otomatis ke folder `backups/` di dalam folder proyek. Saat platform menyala dengan volume kosong, cadangan terbaru dipulihkan otomatis. Dengan cara ini, pindah laptop cukup dengan menyalin folder proyek, sesuai kebutuhan di PRD.

## Considered Options

- **PostgreSQL** (pilihan PRD versi awal): dirancang untuk banyak pemakai dan server. Untuk satu anak di satu laptop, PostgreSQL menambah satu container, dan cadangannya butuh alat terpisah.
- **File SQLite langsung di folder proyek**: paling mudah disalin, tetapi penguncian file SQLite tidak andal di folder Windows yang dibagikan ke container Linux lewat WSL2, sehingga database bisa rusak.
- **Volume Docker saja tanpa cadangan**: aman untuk penguncian, tetapi volume tersimpan di dalam mesin virtual WSL dan tidak ikut tersalin bersama folder proyek.

## Consequences

Perubahan dalam 30 menit terakhir sebelum laptop mati mendadak bisa tidak ikut ke cadangan. Data itu tetap ada di volume di laptop yang sama, jadi hanya hilang kalau laptop dipindah tanpa menghentikan platform dulu.
