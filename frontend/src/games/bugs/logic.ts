import type { Blok, LevelJalur, Program } from "../../shared/program/kinds";
import { jalankanSemua } from "../../shared/program/runner";

/**
 * Satu soal Detektif Galat: program dari satu level Penjelajah Jalur yang disisipi tepat satu kesalahan.
 * "berlebih": cukup dicabut. "ganti": dicabut, lalu diganti dengan salah satu blok pengganti.
 */
export type LevelGalat = {
  id: string;
  dasar: string;
  jenis: "berlebih" | "ganti";
  program: Blok[];
  pengganti?: Blok[];
  /** Kalimat narator untuk level yang mengenalkan cara baru, diputar sekali di awal level. */
  penjelasan?: string;
};

/** Level Penjelajah Jalur yang menjadi panggung soal, dengan jumlah slot sepanjang program soal. */
export function panggungGalat(soal: LevelGalat, levelJalur: LevelJalur[]): LevelJalur {
  const dasar = levelJalur.find((l) => l.id === soal.dasar);
  if (!dasar) throw new Error(`level dasar ${soal.dasar} tidak ada`);
  return { ...dasar, slot: soal.program.length };
}

const berhasil = (level: LevelJalur, program: Program) => jalankanSemua(level, program).hasil.berhasil;

/** Mengembalikan daftar masalah sebuah soal. Daftar kosong berarti soal layak dipakai. */
export function periksaGalat(soal: LevelGalat, levelJalur: LevelJalur[]): string[] {
  if (!levelJalur.some((l) => l.id === soal.dasar)) return [`level dasar ${soal.dasar} tidak ada`];
  const level = panggungGalat(soal, levelJalur);
  const masalah: string[] = [];
  if (berhasil(level, soal.program)) masalah.push("program awal sudah berhasil, tidak ada kesalahan");

  // Semua perbaikan yang berhasil harus menyentuh blok yang sama jenisnya, supaya hanya ada satu kesalahan.
  const perbaikan: { indeks: number; jenis: string }[] = [];
  soal.program.forEach((blok, i) => {
    if (soal.jenis === "berlebih") {
      if (berhasil(level, soal.program.map((b, k) => (k === i ? null : b)))) perbaikan.push({ indeks: i, jenis: blok.jenis });
      return;
    }
    for (const ganti of soal.pengganti ?? []) {
      if (berhasil(level, soal.program.map((b, k) => (k === i ? ganti : b)))) perbaikan.push({ indeks: i, jenis: blok.jenis });
    }
  });
  if (perbaikan.length === 0) masalah.push("tidak ada perbaikan yang berhasil");
  if (new Set(perbaikan.map((p) => p.jenis)).size > 1) masalah.push("lebih dari satu kesalahan");

  if (soal.jenis === "ganti") {
    const pengganti = soal.pengganti ?? [];
    if (pengganti.length !== 2) masalah.push("soal ganti harus menawarkan tepat dua blok pengganti");
    const benar = pengganti.filter((g) => perbaikan.length > 0 && berhasil(level, soal.program.map((b, k) => (k === perbaikan[0].indeks ? g : b))));
    if (benar.length !== 1) masalah.push("tepat satu blok pengganti harus benar");
  }
  return masalah;
}
