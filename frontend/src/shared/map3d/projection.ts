// Kamera peta 3D: ortografis, hanya dimiringkan ke bawah, tanpa diputar ke samping (frontend.md, bagian Peta 3D).
// Karena itu satu satuan dunia sama dengan satu unit panggung, dan petak di tanah tetap persegi panjang di layar,
// jadi tempat klik di atas peta cukup berupa kotak biasa.

/** Sudut pandang kamera dari bidang tanah. 90° berarti tegak lurus dari atas. */
export const KEMIRINGAN = (50 * Math.PI) / 180;
export const SIN = Math.sin(KEMIRINGAN);
export const COS = Math.cos(KEMIRINGAN);

/** Titik dunia (x, y, z), y ke atas dan z ke arah anak, jatuh di titik panggung ini. */
export const keLayar = (x: number, y: number, z: number) => ({ x, y: z * SIN - y * COS });

/** Kedalaman z di tanah setinggi `y` yang tampil di baris panggung `yLayar`. */
export const zDari = (yLayar: number, y = 0) => (yLayar + y * COS) / SIN;

/** Panjang di arah kedalaman yang tampil sepanjang `panjangLayar` di panggung. */
export const dalam = (panjangLayar: number) => panjangLayar / SIN;
