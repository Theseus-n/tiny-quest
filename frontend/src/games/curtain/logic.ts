import type { JenisBenda } from "../../images/illustrations";

export type SoalTirai = { jumlah: number; susunan: number[]; pilihan: number[] };
/** `penjelasan`: kalimat narator untuk level yang mengenalkan cara baru, diputar sebelum soal pertama. */
export type LevelTirai = { id: string; lamaTampilMs: number; benda: JenisBenda; soal: SoalTirai[]; penjelasan?: string };

/** Memecah jumlah menjadi kelompok kecil berisi paling banyak 4, seperti 6 = 3 + 3. */
export function pecahKelompok(n: number): number[] {
  if (n <= 4) return [n];
  const besar = Math.ceil(n / 2);
  return [besar, n - besar];
}

/** Susunan lain untuk soal yang diulang setelah salah: jumlah sama, kelompok berbeda. */
export function susunanLain(susunan: number[]): number[] {
  if (susunan.length > 1) return [...susunan].reverse();
  const n = susunan[0];
  return n >= 3 ? [n - 1, 1] : susunan;
}

// Pola dadu untuk kelompok 1 sampai 4, dalam kotak 0..1.
const polaDadu: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.2, 0.2], [0.8, 0.8]],
  3: [[0.15, 0.15], [0.5, 0.5], [0.85, 0.85]],
  4: [[0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]],
};

/** Posisi setiap benda, dikelompokkan supaya kelompoknya terlihat terpisah. */
export function posisiKelompok(susunan: number[], kotak: number, jarakKelompok: number) {
  return susunan.map((isi, k) => ({
    kelompok: k,
    titik: polaDadu[isi].map(([x, y]) => ({ x: k * (kotak + jarakKelompok) + x * kotak, y: y * kotak })),
  }));
}

export function periksaLevelTirai(level: LevelTirai): string[] {
  const masalah: string[] = [];
  for (const [i, s] of level.soal.entries()) {
    const label = `soal ${i + 1}`;
    if (s.jumlah < 1 || s.jumlah > 8) masalah.push(`${label}: jumlah harus 1 sampai 8`);
    if (s.susunan.reduce((a, b) => a + b, 0) !== s.jumlah) masalah.push(`${label}: susunan tidak sama dengan jumlah`);
    if (s.susunan.some((k) => k < 1 || k > 4)) masalah.push(`${label}: setiap kelompok harus berisi 1 sampai 4`);
    if (s.jumlah > 4 && s.susunan.length < 2) masalah.push(`${label}: 5 sampai 8 benda harus berupa kelompok`);
    if (s.pilihan.length < 2 || s.pilihan.length > 3) masalah.push(`${label}: wadah harus 2 atau 3`);
    if (s.pilihan.filter((p) => p === s.jumlah).length !== 1) masalah.push(`${label}: harus ada tepat satu wadah yang benar`);
    if (new Set(s.pilihan).size !== s.pilihan.length) masalah.push(`${label}: isi wadah tidak boleh kembar`);
    if (s.pilihan.some((p) => p < 1 || p > 8)) masalah.push(`${label}: isi wadah harus 1 sampai 8`);
  }
  return masalah;
}
