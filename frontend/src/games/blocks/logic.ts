/**
 * Satu level Balok Bilangan: anak menyusun jembatan sepanjang `sungai` dari balok di `rak`.
 * `contoh` adalah satu penyelesaian yang dipakai peragaan.
 */
export type LevelBalok = {
  id: string;
  sungai: number;
  rak: number[];
  angka: boolean;
  contoh: { pasang: number } | { gabung: [number, number] } | { potong: [number, number] };
  /** Kalimat narator untuk level yang mengenalkan cara baru, diputar sekali di awal level. */
  penjelasan?: string;
};

export const NILAI_TERBESAR = 10;

export const bisaDigabung = (a: number, b: number) => a + b <= NILAI_TERBESAR;

/** Memotong balok n setelah satuan ke-k, menjadi balok k dan balok n − k. */
export function potong(n: number, k: number): [number, number] {
  if (k < 1 || k >= n) throw new Error(`balok ${n} tidak bisa dipotong di ${k}`);
  return [k, n - k];
}

/**
 * Jembatan disusun dari beberapa balok di atas sungai, dan balok boleh dipotong.
 * Jadi cetakan selalu bisa diisi pas selama panjang semua balok di rak cukup.
 */
export function bisaDiselesaikan(rak: number[], sungai: number): boolean {
  return rak.reduce((n, b) => n + b, 0) >= sungai;
}

/** Mengembalikan daftar masalah sebuah level. Daftar kosong berarti level layak dipakai. */
export function periksaBalok(level: LevelBalok): string[] {
  const masalah: string[] = [];
  const bilangan = [level.sungai, ...level.rak];
  if (bilangan.some((n) => !Number.isInteger(n) || n < 1 || n > NILAI_TERBESAR)) masalah.push("bilangan di luar 1 sampai 10");
  if (!bisaDiselesaikan(level.rak, level.sungai)) masalah.push("jembatan tidak bisa dibuat dari isi rak");
  const c = level.contoh;
  if ("pasang" in c && (c.pasang !== level.sungai || !level.rak.includes(c.pasang))) masalah.push("contoh pasang tidak cocok");
  if ("gabung" in c) {
    const [a, b] = c.gabung;
    const sisa = [...level.rak];
    const ambil = (n: number) => sisa.indexOf(n) >= 0 && sisa.splice(sisa.indexOf(n), 1);
    if (!ambil(a) || !ambil(b) || a + b !== level.sungai) masalah.push("contoh gabung tidak cocok");
  }
  if ("potong" in c && (!level.rak.includes(c.potong[0]) || c.potong[1] !== level.sungai || c.potong[1] >= c.potong[0])) masalah.push("contoh potong tidak cocok");
  return masalah;
}
