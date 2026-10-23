import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Db } from "../database/database";

export const SIMPAN_TERAKHIR = 10;
const POLA = /^platform-\d{4}-\d{2}-\d{2}-\d{6}(-\d+)?\.db$/;

function cap(waktu: Date) {
  const d = (n: number) => String(n).padStart(2, "0");
  return `${waktu.getFullYear()}-${d(waktu.getMonth() + 1)}-${d(waktu.getDate())}-${d(waktu.getHours())}${d(waktu.getMinutes())}${d(waktu.getSeconds())}`;
}

/** Daftar file cadangan, dari yang terbaru. */
export function daftarCadangan(folder: string): string[] {
  if (!existsSync(folder)) return [];
  return readdirSync(folder)
    .filter((n) => POLA.test(n))
    .map((n) => ({ jalur: join(folder, n), waktu: statSync(join(folder, n)).mtimeMs, nama: n }))
    .sort((a, b) => b.waktu - a.waktu || b.nama.localeCompare(a.nama, "en", { numeric: true }))
    .map((x) => x.jalur);
}

/**
 * Membuat satu file database lengkap di folder cadangan, lalu menyisakan sepuluh yang terbaru.
 * VACUUM INTO aman dijalankan saat database sedang dipakai.
 */
export function buatCadangan(db: Db, folder: string, waktu = new Date()): string {
  mkdirSync(folder, { recursive: true });
  let nama = `platform-${cap(waktu)}.db`;
  for (let i = 1; existsSync(join(folder, nama)); i++) nama = `platform-${cap(waktu)}-${i}.db`;
  const tujuan = join(folder, nama);
  const sementara = `${tujuan}.sementara`;
  // Ditulis ke nama sementara dulu, supaya file setengah jadi tidak pernah dianggap cadangan.
  db.prepare("VACUUM INTO ?").run(sementara);
  renameSync(sementara, tujuan);
  for (const lama of daftarCadangan(folder).slice(SIMPAN_TERAKHIR)) rmSync(lama);
  return tujuan;
}

/** Menyalin cadangan terbaru menjadi database aktif. Dipanggil sebelum database dibuka. */
export function pulihkanTerbaru(folder: string, jalurDatabase: string): string | null {
  const terbaru = daftarCadangan(folder).find((p) => statSync(p).size > 0);
  if (!terbaru) return null;
  for (const akhiran of ["", "-wal", "-shm"]) rmSync(jalurDatabase + akhiran, { force: true });
  copyFileSync(terbaru, jalurDatabase);
  return terbaru;
}
