import type { LevelJalur } from "./kinds";
import { jalankanSemua } from "./runner";

const samaBlok = (a: object, b: object) => JSON.stringify(a) === JSON.stringify(b);

/** Mengembalikan daftar masalah sebuah level. Daftar kosong berarti level layak dipakai. */
export function periksaLevel(level: LevelJalur): string[] {
  const masalah: string[] = [];
  const dalamPeta = ([k, b]: [number, number]) => k >= 0 && b >= 0 && k < level.kolom && b < level.baris;

  for (const s of [...level.jalan, ...level.batu, level.rumah, level.mulai.sel]) {
    if (!dalamPeta(s)) masalah.push(`sel ${s} di luar peta`);
  }
  if (level.penyelesaian.length > level.slot) masalah.push("penyelesaian lebih panjang dari jumlah slot");
  for (const blok of level.penyelesaian) {
    if (!level.blok.some((b) => samaBlok(b, blok))) masalah.push(`penyelesaian memakai blok ${blok.jenis} yang tidak tersedia`);
  }
  if (level.blok.length * 104 + (level.blok.length - 1) * 32 > 900) masalah.push("blok pilihan tidak muat di bawah layar");
  if (level.slot * 104 + (level.slot - 1) * 24 > 1000) masalah.push("slot program tidak muat");

  const { hasil } = jalankanSemua(level, level.penyelesaian);
  if (!hasil.berhasil) masalah.push("penyelesaian tidak sampai ke rumah");
  return masalah;
}
