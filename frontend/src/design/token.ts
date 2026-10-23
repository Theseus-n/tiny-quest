// Satu-satunya tempat kode warna boleh ditulis (lihat frontend.md, bagian Warna).

export const warna = {
  latar: "#FBF4E6",
  panggung: "#FFFFFF",
  tinta: "#2E2A3B",
  slot: "#E8DFCC",
  putih: "#FFFFFF",

  blokGerak: "#2F7FD1",
  blokKontrol: "#F08A24",
  blokPemicu: "#F5C518",

  // Alas 3D di bawah blok dan tombol. Gaya Kitbitz tidak memakai garis tepi, jadi alas inilah yang memberi
  // batas benda yang bisa diklik kontras minimal 3 : 1 terhadap panggung putih (dicek dengan contrast-check.py).
  blokGerakAlas: "#1E5FA3", // 6,5 : 1
  blokKontrolAlas: "#B85E12", // 4,5 : 1
  blokPemicuAlas: "#9C7A00", // 4,0 : 1
  aksenJalanAlas: "#1F7A3A", // 4,9 : 1 terhadap latar
  /** Tepi tombol terang dan slot kosong: 3,9 : 1 terhadap putih, 3,6 : 1 terhadap latar. */
  tepi: "#8A7F6E",

  aksenJalan: "#2E9E4F",

  // Warna ilustrasi: nada tanah yang kalem.
  kancil: "#C8955A",
  kancilGelap: "#9C6E3C",
  krem: "#F3E2C3",
  pipi: "#F2A7A0",
  syal: "#3E9C8F",
  kucing: "#9A9AA0",
  kucingBelang: "#6C6C74",
  genteng: "#B5533C",
  dinding: "#E9D4B0",
  daun: "#6B8E3D",
  daunGelap: "#557230",
  rambutan: "#C7413A",
  rambutanRambut: "#8E2B27",
  kelereng: "#5B8FA8",
  ikan: "#D9A441",
  rumput: "#DCE6C3",
  jalanPasir: "#F1D9A8",
  rumputPetak: "#CFE5B5",
  batu: "#8C8478",
  bakul: "#C9A26B",
  bakulGelap: "#9E7A47",
  bintang: "#F2C230",
  air: "#9CCFE6",
  airGelap: "#6AAFD0",
  tanah: "#C9A97C",

  // Potongan Matriks Tangram: satu warna tetap per jenis, berbeda dari warna blok dan warna bilangan.
  potonganBesar: "#4FA3A5",
  potonganKecil: "#E58F6E",
  potonganPersegi: "#D7A1C9",
  bayangan: "#D8CFBE",

  // Latar Studio Kreasi.
  langit: "#CFE8F7",
  matahari: "#F6CF57",
  rumputTaman: "#A8D08D",
  laut: "#6FB7DE",
  pasir: "#EBD3A0",
  langitMalam: "#2B3A67",
  bulan: "#F4E9B8",
  rumputMalam: "#3E5E46",
  paruh: "#F29E4C",

  // Peta 3D: batang pohon, sisi tanah yang terkena bayangan, dan warna cahaya.
  batang: "#8A6542",
  tanahSisi: "#A9875B",
  daunTerang: "#8DB255",
  cahaya: "#FFF6E4",
  cahayaLangit: "#F4F1FF",
  cahayaTanah: "#C9B48F",
  cahayaMalam: "#A9BCFF",
  kunang: "#F6E58D",

  // Halaman pilih permainan: papan petunjuk kayu dan tokoh anak di taman.
  kayu: "#C28A55",
  kayuGelap: "#6B4423",
  kayuTerang: "#E3B982",
  kulitAnak1: "#F3CBA2",
  kulitAnak2: "#C98F62",
  kulitAnak3: "#8D5A3B",
  rambutAnak1: "#3A2A22",
  rambutAnak2: "#7A4B2A",
  rambutAnak3: "#D9A441",
  kupu: "#E98BC0",
  kupuBiru: "#7FB2F0",
} as const;

/** Enam warna badan tokoh di Studio Kreasi. Studio Kreasi permainan coding, jadi warna bilangan tidak dipakai di sini. */
export const paletStudio = [warna.kucing, "#E4572E", "#F1C453", "#5DB35A", "#3E8ED0", "#9C6ADE"] as const;

// Warna bilangan 1 sampai 10, dengan warna angka yang lolos kontras.
export const warnaBilangan: Record<number, { isi: string; angka: string }> = {
  1: { isi: "#F4F1EA", angka: warna.tinta },
  2: { isi: "#D9443A", angka: warna.putih },
  3: { isi: "#8CC63F", angka: warna.tinta },
  4: { isi: "#8A57C0", angka: warna.putih },
  5: { isi: "#F2C230", angka: warna.tinta },
  6: { isi: "#1F7A4D", angka: warna.putih },
  7: { isi: "#3B3A40", angka: warna.putih },
  8: { isi: "#8B5A2B", angka: warna.putih },
  9: { isi: "#2F6FD0", angka: warna.putih },
  10: { isi: "#F07F2A", angka: warna.tinta },
};

export const ukuran = {
  lebarPanggung: 1280,
  tinggiPanggung: 720,
  klikMinimal: 88,
  jarakMinimal: 24,
  garis: 3,
  sudut: 16,
  barisAtas: 112,
  areaKerjaAtas: 112,
  areaKerjaTinggi: 368,
  barisTengahAtas: 480,
  barisBawahAtas: 600,
} as const;

export const durasi = {
  langkahTokoh: 450,
  tahanReaksi: 1200,
  tampilTirai: 1500,
  diamSebelumPeragaan: 10000,
  jedaKalimat: 300,
  kalimatTanpaSuara: 1400,
  munculSelamat: 700,
} as const;

/** Memasang token sebagai variabel CSS supaya CSS tidak perlu menulis kode warna. */
export function pasangVariabelCss(akar: HTMLElement) {
  for (const [nama, nilai] of Object.entries(warna)) {
    akar.style.setProperty(`--${nama}`, nilai);
  }
  akar.style.setProperty("--garis", `${ukuran.garis}px`);
  akar.style.setProperty("--sudut", `${ukuran.sudut}px`);
}

// Kontras WCAG 2.x, sama dengan rumus di skill antislop-human (contrast-check.py).
function luminans(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function rasioKontras(a: string, b: string) {
  const [terang, gelap] = [luminans(a), luminans(b)].sort((x, y) => y - x);
  return (terang + 0.05) / (gelap + 0.05);
}

/**
 * Warna alas 3D untuk benda berwarna `isi`: warna yang sama, digelapkan sedikit demi sedikit sampai
 * kontrasnya minimal 3 : 1 terhadap latar krem (dan karena itu juga terhadap panggung putih).
 * Gaya Kitbitz tidak memakai garis tepi, jadi alas inilah batas benda yang bisa diklik (WCAG 1.4.11).
 */
export function warnaAlas(isi: string): string {
  const gelapkan = (f: number) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(isi.slice(i, i + 2), 16) * f).toString(16).padStart(2, "0")).join("");
  for (let f = 0.82; f > 0; f -= 0.02) {
    const alas = gelapkan(f);
    if (rasioKontras(alas, warna.latar) >= 3.05) return alas;
  }
  return warna.tinta;
}
