/** Satu satuan potongan dalam unit panggung. Segitiga besar bersisi tegak 2 satuan. */
export const SATUAN = 80;
export const LANGKAH_PUTAR = 45;

export type JenisPotongan = "segitiga-besar" | "segitiga-kecil" | "persegi";
export type Titik = [number, number];

/** Tempat di bayangan: jenis potongan, titik pusat (dalam satuan), dan sudutnya. */
export type Tempat = { jenis: JenisPotongan; x: number; y: number; sudut: number };

export type LevelTangram = {
  id: string;
  bentuk: string;
  /** Tempat-tempat yang membentuk bayangan. */
  tempat: Tempat[];
  /** Potongan di rak beserta sudut awalnya. */
  rak: { jenis: JenisPotongan; sudut: number }[];
  garisBantu: boolean;
  /** Jarak terjauh (dalam satuan) supaya potongan menempel. */
  toleransi: number;
  penjelasan?: string;
};

// Sudut-sudut potongan saat sudutnya 0, relatif terhadap titik pusat kotak pembungkusnya.
// Siku-siku segitiga ada di kiri atas.
const bentukDasar: Record<JenisPotongan, Titik[]> = {
  "segitiga-besar": [[-1, -1], [1, -1], [-1, 1]],
  "segitiga-kecil": [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5]],
  persegi: [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]],
};

/** Sudut-sudut potongan setelah diputar searah jarum jam, relatif terhadap titik pusatnya, dalam satuan. */
export function titikPotongan(jenis: JenisPotongan, sudut: number): Titik[] {
  const r = (sudut * Math.PI) / 180;
  const [c, s] = [Math.cos(r), Math.sin(r)];
  return bentukDasar[jenis].map(([x, y]) => [x * c - y * s, x * s + y * c]);
}

/** Jari-jari terjauh potongan dari titik pusatnya, dalam satuan. */
export const jariJari = (jenis: JenisPotongan) => (jenis === "segitiga-besar" ? Math.SQRT2 : Math.SQRT1_2);

export const putar = (sudut: number) => (sudut + LANGKAH_PUTAR) % 360;

/** Persegi terlihat sama setiap 90 derajat. Segitiga hanya sama kalau sudutnya sama. */
export function sudutSetara(jenis: JenisPotongan, a: number, b: number) {
  const periode = jenis === "persegi" ? 90 : 360;
  return (((a - b) % periode) + periode) % periode === 0;
}

/** Mencari tempat kosong yang cocok untuk potongan di titik (x, y). Mengembalikan indeks tempat, atau -1. */
export function cariTempat(level: LevelTangram, jenis: JenisPotongan, sudut: number, x: number, y: number, terisi: Set<number>) {
  let terbaik = -1;
  let jarakTerbaik = Infinity;
  level.tempat.forEach((t, i) => {
    if (terisi.has(i) || t.jenis !== jenis || !sudutSetara(jenis, sudut, t.sudut)) return;
    const jarak = Math.hypot(t.x - x, t.y - y);
    if (jarak <= level.toleransi && jarak < jarakTerbaik) {
      terbaik = i;
      jarakTerbaik = jarak;
    }
  });
  return terbaik;
}

/** Banyak klik pegangan untuk memutar dari sudut a ke sudut yang setara dengan b. */
export function klikPutar(jenis: JenisPotongan, a: number, b: number) {
  for (let n = 0; n < 8; n++) if (sudutSetara(jenis, (a + n * LANGKAH_PUTAR) % 360, b)) return n;
  return Infinity;
}

function diDalam([px, py]: Titik, poligon: Titik[]) {
  let dalam = false;
  for (let i = 0, j = poligon.length - 1; i < poligon.length; j = i++) {
    const [xi, yi] = poligon[i];
    const [xj, yj] = poligon[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) dalam = !dalam;
  }
  return dalam;
}

export const poligonTempat = (t: Tempat): Titik[] => titikPotongan(t.jenis, t.sudut).map(([x, y]) => [t.x + x, t.y + y]);

/** Kotak pembungkus seluruh bayangan, dalam satuan. */
export function batasBayangan(level: LevelTangram) {
  const semua = level.tempat.flatMap(poligonTempat);
  const xs = semua.map((p) => p[0]);
  const ys = semua.map((p) => p[1]);
  return { kiri: Math.min(...xs), atas: Math.min(...ys), kanan: Math.max(...xs), bawah: Math.max(...ys) };
}

/** Mengembalikan daftar masalah sebuah level. Daftar kosong berarti level layak dipakai. */
export function periksaTangram(level: LevelTangram, lebarArea: number, tinggiArea: number): string[] {
  const masalah: string[] = [];
  const b = batasBayangan(level);
  if ((b.kanan - b.kiri) * SATUAN > lebarArea || (b.bawah - b.atas) * SATUAN > tinggiArea) masalah.push("bayangan tidak muat di area kerja");

  // Tempat tidak boleh saling menumpuk: titik sampel di dalam satu tempat tidak boleh ada di tempat lain.
  // Titik sampel digeser sedikit dari kelipatan 0,05 supaya tidak jatuh tepat di tepi yang dipakai bersama.
  const poligon = level.tempat.map(poligonTempat);
  const langkah = 0.05;
  const sampel = (awal: number, akhir: number) => Array.from({ length: Math.ceil((akhir - awal) / langkah) }, (_, i) => awal + 0.013 + i * langkah);
  const tumpuk = sampel(b.atas, b.bawah)
    .flatMap((y) => sampel(b.kiri, b.kanan).map((x): Titik => [x, y]))
    .find((t) => poligon.filter((p) => diDalam(t, p)).length > 1);
  if (tumpuk) masalah.push(`tempat saling menumpuk di sekitar (${tumpuk[0].toFixed(1)}, ${tumpuk[1].toFixed(1)})`);

  const hitung = (daftar: { jenis: JenisPotongan }[]) => daftar.map((d) => d.jenis).sort().join(",");
  if (hitung(level.tempat) !== hitung(level.rak)) masalah.push("potongan di rak tidak sama dengan tempat di bayangan");
  for (const p of level.rak) {
    const klik = Math.min(...level.tempat.filter((t) => t.jenis === p.jenis).map((t) => klikPutar(p.jenis, p.sudut, t.sudut)));
    if (klik > 2) masalah.push(`potongan ${p.jenis} bersudut ${p.sudut} butuh lebih dari 2 klik putar`);
  }
  return masalah;
}
