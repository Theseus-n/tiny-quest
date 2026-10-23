import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { warna, warnaAlas, warnaBilangan } from "../../design/token";

// Model 3D gaya Kitbitz yang disusun dari bentuk dasar: bulat, lembut, tanpa garis tepi.
// Satuan dunia sama dengan unit panggung. y ke atas, z ke arah anak, dan tokoh menghadap ke +x (kanan).
// Semua dibuat di kode, tanpa berkas model terpisah, supaya tetap tertanam di bundel.

const simpananBahan = new Map<string, THREE.MeshLambertMaterial>();

/** Bahan doff yang sama untuk satu warna, supaya tidak dibuat berulang. */
export function bahan(w: string) {
  let b = simpananBahan.get(w);
  if (!b) {
    b = new THREE.MeshLambertMaterial({ color: w });
    simpananBahan.set(w, b);
  }
  return b;
}

/** Warna yang sama, digelapkan, untuk belang dan sisi. Hasilnya tetap berasal dari token. */
export const gelapkan = (w: string, f = 0.78) => "#" + new THREE.Color(w).multiplyScalar(f).getHexString();

function jala(geo: THREE.BufferGeometry, w: string, [x, y, z] = [0, 0, 0], bayangan = true) {
  const m = new THREE.Mesh(geo, bahan(w));
  m.position.set(x, y, z);
  m.castShadow = bayangan;
  m.receiveShadow = true;
  return m;
}

/** Bola yang tampil hanya beberapa piksel tidak perlu halus: segmennya mengikuti jari-jari. */
const bola = (r: number) => (r < 5 ? new THREE.SphereGeometry(r, 10, 6) : r < 10 ? new THREE.SphereGeometry(r, 16, 10) : new THREE.SphereGeometry(r, 24, 16));
const tabung = (r: number, t: number, r2 = r) => new THREE.CylinderGeometry(r, r2, t, 20);
const kotakBulat = (l: number, t: number, d: number, s: number) => new RoundedBoxGeometry(l, t, d, 3, Math.min(s, l / 2 - 0.1, t / 2 - 0.1, d / 2 - 0.1));

function grup(...isi: THREE.Object3D[]) {
  const g = new THREE.Group();
  g.add(...isi);
  return g;
}

function lonjong(r: number, [sx, sy, sz]: [number, number, number], w: string, pos: [number, number, number]) {
  const m = jala(bola(r), w, pos);
  m.scale.set(sx, sy, sz);
  return m;
}

/** Mata hitam dengan kilau putih kecil, menghadap ke luar ke arah +x. */
function mata(r: number, pos: [number, number, number]) {
  const m = jala(bola(r), warna.tinta, pos, false);
  m.add(jala(bola(r * 0.38), warna.putih, [r * 0.55, r * 0.4, 0], false));
  return m;
}

// ---------- Tanah ----------

/** Petak tanah berpinggir bulat dengan puncak di y = 0. */
export function petak(lebar: number, dalam: number, tebal: number, w: string, sudut = 10) {
  const m = jala(kotakBulat(lebar, tebal, dalam, sudut), w, [0, -tebal / 2, 0], false);
  return m;
}

/** Lempeng tanah di bawah peta: puncak berumput tipis, sisinya tanah. */
export function lempeng(lebar: number, dalam: number, tebal: number, atas: string = warna.rumputTaman, sisi: string = warna.tanah) {
  return grup(
    jala(kotakBulat(lebar, tebal, dalam, 18), sisi, [0, -tebal / 2 - 6, 0], true),
    jala(kotakBulat(lebar, 14, dalam, 12), atas, [0, -7, 0], false),
  );
}

/** Bidang tak terlihat yang hanya menampilkan bayangan, supaya lempeng tampak melayang di atas panel putih. */
export function penangkapBayangan(lebar: number, dalam: number, y: number) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(lebar, dalam), new THREE.ShadowMaterial({ opacity: 0.14 }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.receiveShadow = true;
  return m;
}

/** Air dengan riak putih. Puncaknya di y = 0. */
export function air(lebar: number, dalam: number, tebal = 20) {
  const g = grup(jala(kotakBulat(lebar, tebal, dalam, 10), warna.air, [0, -tebal / 2, 0], false));
  const riak = new THREE.MeshBasicMaterial({ color: warna.putih, transparent: true, opacity: 0.6 });
  const n = Math.max(2, Math.round(lebar / 90));
  for (let i = 0; i < n; i++) {
    for (const [j, zf] of [0.18, 0.5, 0.82].entries()) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(12, 2, 6, 16, Math.PI * 0.7), riak);
      r.rotation.x = -Math.PI / 2;
      r.rotation.z = Math.PI * 0.15;
      r.position.set(-lebar / 2 + ((i + 0.5 + (j % 2) * 0.35) * lebar) / n, 0.5, -dalam / 2 + dalam * zf);
      g.add(r);
    }
  }
  return g;
}

/** Cincin datar di tanah: penanda tokoh terpilih (penuh) atau sasaran pemicu (putus-putus). */
export function cincin(r: number, w: string, putus = false) {
  const g = new THREE.Group();
  const potong = putus ? 10 : 1;
  for (let i = 0; i < potong; i++) {
    const busur = putus ? (Math.PI * 2) / potong - 0.28 : Math.PI * 2;
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, 3.2, 8, 40, busur), bahan(w));
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = (i * Math.PI * 2) / potong;
    g.add(m);
  }
  g.position.y = 1.5;
  return g;
}

// ---------- Alam ----------

export function pohonRimbun(s = 1) {
  const g = grup(
    jala(tabung(6, 34, 8), warna.batang, [0, 17, 0]),
    jala(bola(26), warna.daun, [0, 58, 0]),
    jala(bola(19), warna.daunGelap, [-17, 44, 8]),
    jala(bola(18), warna.daunTerang, [16, 50, -6]),
  );
  g.scale.setScalar(s);
  return g;
}

export function pohonKelapa(s = 1) {
  const g = new THREE.Group();
  let [x, y] = [0, 0];
  for (let i = 0; i < 6; i++) {
    const ruas = jala(tabung(5.5 - i * 0.3, 16, 6 - i * 0.3), i % 2 ? warna.batang : gelapkan(warna.batang, 0.9), [x, y + 8, 0]);
    ruas.rotation.z = -0.08 * i;
    g.add(ruas);
    x += 1.4 * i;
    y += 15;
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const daun = lonjong(16, [2.1, 0.32, 0.7], i % 2 ? warna.daun : warna.daunTerang, [x + Math.cos(a) * 22, y - 2, Math.sin(a) * 22]);
    daun.rotation.y = -a;
    daun.rotation.z = -0.35;
    g.add(daun);
  }
  g.add(jala(bola(5), warna.batang, [x + 4, y - 5, 4]), jala(bola(5), warna.batang, [x - 3, y - 6, -3]));
  g.scale.setScalar(s);
  return g;
}

export function semak(s = 1, w: string = warna.daun) {
  const g = grup(jala(bola(15), w, [-10, 11, 0]), jala(bola(18), gelapkan(w, 0.92), [6, 14, -3]), jala(bola(12), warna.daunTerang, [16, 9, 6]));
  g.scale.setScalar(s);
  return g;
}

export function batu(s = 1) {
  const besar = jala(new THREE.DodecahedronGeometry(22, 1), warna.batu, [0, 10, 0]);
  besar.scale.set(1, 0.62, 0.85);
  const kecil = jala(new THREE.DodecahedronGeometry(10, 1), gelapkan(warna.batu, 1.12), [22, 4, 10]);
  kecil.scale.set(1, 0.6, 0.9);
  const g = grup(besar, kecil);
  g.scale.setScalar(s);
  return g;
}

export function bunga(w: string = warna.rambutan, s = 1) {
  const g = grup(jala(tabung(1.6, 18), warna.daunGelap, [0, 9, 0], false), jala(bola(3.5), warna.bintang, [0, 19, 0], false));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.add(jala(bola(4), w, [Math.cos(a) * 5.5, 19, Math.sin(a) * 5.5], false));
  }
  const daun = lonjong(5, [1.6, 0.4, 0.8], warna.daun, [5, 6, 0]);
  daun.castShadow = false;
  g.add(daun);
  g.scale.setScalar(s);
  return g;
}

export function rumput(s = 1) {
  const g = new THREE.Group();
  for (const [x, z, r] of [[0, 0, 0], [-5, 2, 0.35], [5, -1, -0.35]] as const) {
    const m = jala(new THREE.ConeGeometry(2.6, 16, 8), warna.daunTerang, [x, 7, z], false);
    m.rotation.z = r;
    g.add(m);
  }
  g.scale.setScalar(s);
  return g;
}

export function teratai(s = 1) {
  const m = jala(new THREE.CylinderGeometry(16, 16, 3, 24, 1, false, 0.4, Math.PI * 2 - 0.8), warna.daun, [0, 1.5, 0], false);
  const g = grup(m);
  g.scale.setScalar(s);
  return g;
}

/** Kunang-kunang yang bercahaya, melayang di atas tanah. */
export function kunang(s = 1) {
  const m = new THREE.Mesh(bola(3.2), new THREE.MeshBasicMaterial({ color: warna.kunang }));
  const g = grup(m);
  g.add(new THREE.PointLight(warna.kunang, 900, 110, 2));
  g.scale.setScalar(s);
  g.userData.melayang = 46;
  return g;
}

export function kerang(s = 1) {
  const m = jala(new THREE.SphereGeometry(9, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), warna.krem, [0, 0, 0]);
  m.scale.set(1, 0.55, 0.9);
  const g = grup(m);
  for (const a of [-0.5, 0, 0.5]) {
    const garis = jala(new THREE.BoxGeometry(1.4, 1.2, 15), warna.pipi, [Math.sin(a) * 6, 4.6, 0], false);
    garis.rotation.y = a;
    g.add(garis);
  }
  g.scale.setScalar(s);
  return g;
}

export function bintangLaut(s = 1) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const lengan = jala(new THREE.ConeGeometry(3.6, 13, 8), warna.blokKontrol, [Math.cos(a) * 6, 2, Math.sin(a) * 6]);
    lengan.rotation.z = -Math.PI / 2;
    lengan.rotation.y = -a;
    lengan.scale.set(1, 1, 0.5);
    g.add(lengan);
  }
  g.add(jala(bola(4.5), warna.blokKontrol, [0, 1.5, 0]));
  g.scale.setScalar(s);
  return g;
}

// ---------- Bangunan ----------

export function rumah(s = 1) {
  const g = grup(
    jala(kotakBulat(54, 40, 46, 5), warna.dinding, [0, 20, 0]),
    jala(kotakBulat(14, 24, 4, 2), gelapkan(warna.genteng, 0.8), [0, 12, 23]),
    jala(kotakBulat(11, 10, 3, 2), warna.airGelap, [-17, 25, 23]),
    jala(kotakBulat(11, 10, 3, 2), warna.airGelap, [17, 25, 23]),
  );
  // Atap pelana: bubungan memanjang ke samping, jadi lereng depannya tampak dari kamera yang miring dari atas.
  const segitiga = new THREE.Shape([new THREE.Vector2(-27, 0), new THREE.Vector2(27, 0), new THREE.Vector2(0, 24)]);
  const atap = jala(new THREE.ExtrudeGeometry(segitiga, { depth: 60, bevelEnabled: true, bevelSize: 2, bevelThickness: 2, bevelSegments: 2 }), warna.genteng, [30, 39, 0]);
  atap.rotation.y = -Math.PI / 2;
  g.add(atap, jala(kotakBulat(9, 18, 9, 2), gelapkan(warna.genteng, 0.85), [16, 58, -10]));
  g.scale.setScalar(s);
  return g;
}

// ---------- Tokoh ----------

/** Kucing belang, wajah imut dengan pipi merah muda. Warna badan bisa diganti untuk Studio Kreasi. */
export function kucing(warnaBadan: string = warna.kucing, s = 1) {
  const belang = gelapkan(warnaBadan, 0.72);
  const g = grup(
    lonjong(17, [1.35, 0.9, 0.92], warnaBadan, [-2, 24, 0]),
    jala(bola(15), warnaBadan, [21, 40, 0]),
    mata(2.6, [33, 43, 5.5]),
    mata(2.6, [33, 43, -5.5]),
    lonjong(3, [0.6, 0.7, 1.2], warna.pipi, [32, 36, 10]),
    lonjong(3, [0.6, 0.7, 1.2], warna.pipi, [32, 36, -10]),
    jala(bola(1.8), warna.pipi, [35.6, 38.5, 0], false),
  );
  for (const z of [-7, 7]) {
    const telinga = jala(new THREE.ConeGeometry(5.5, 11, 12), warnaBadan, [18, 56, z]);
    telinga.rotation.x = z > 0 ? 0.25 : -0.25;
    g.add(telinga);
  }
  for (const [x, z] of [[-14, -7], [-14, 7], [10, -7], [10, 7]]) g.add(jala(tabung(4.5, 14), warnaBadan, [x, 7, z]));
  for (const x of [-12, -3, 6]) {
    const b = new THREE.Mesh(new THREE.TorusGeometry(15.6, 1.8, 6, 16, Math.PI * 0.62), bahan(belang));
    b.position.set(x, 24, 0);
    b.rotation.set(0, Math.PI / 2, Math.PI * 0.19);
    g.add(b);
  }
  const ekor = new THREE.CatmullRomCurve3([new THREE.Vector3(-24, 26, 0), new THREE.Vector3(-34, 34, 0), new THREE.Vector3(-34, 48, 0), new THREE.Vector3(-28, 54, 0)]);
  g.add(jala(new THREE.TubeGeometry(ekor, 16, 3.6, 8), warnaBadan));
  g.scale.setScalar(s);
  return g;
}

export function ikan(w: string = warna.ikan, s = 1) {
  const sirip = jala(new THREE.ConeGeometry(12, 20, 3), w, [-26, 22, 0]);
  sirip.rotation.z = Math.PI / 2;
  sirip.scale.set(1, 1, 0.35);
  const punggung = jala(new THREE.ConeGeometry(8, 12, 3), w, [2, 38, 0]);
  punggung.scale.set(1, 1, 0.3);
  const g = grup(
    lonjong(18, [1.45, 0.95, 0.75], w, [0, 22, 0]),
    sirip,
    punggung,
    mata(3, [16, 26, 9]),
    mata(3, [16, 26, -9]),
    lonjong(2.6, [0.5, 0.7, 1.1], warna.pipi, [17, 18, 11]),
    lonjong(2.6, [0.5, 0.7, 1.1], warna.pipi, [17, 18, -11]),
  );
  g.scale.setScalar(s);
  return g;
}

export function bolaMainan(w: string = warna.rambutan, s = 1) {
  // Dua garis putih melingkari bola dari kutub ke kutub, seperti bola pantai.
  const g = grup(jala(bola(20), w, [0, 20, 0]));
  for (const a of [Math.PI / 4, -Math.PI / 4]) {
    const garis = new THREE.Mesh(new THREE.TorusGeometry(20.2, 2.2, 8, 40), bahan(warna.putih));
    garis.position.y = 20;
    garis.rotation.y = a;
    g.add(garis);
  }
  g.scale.setScalar(s);
  return g;
}

export function burung(w: string = warna.blokGerak, s = 1) {
  const paruh = jala(new THREE.ConeGeometry(4, 11, 10), warna.paruh, [30, 40, 0]);
  paruh.rotation.z = -Math.PI / 2;
  const sayap = (z: number) => {
    const m = lonjong(10, [1.5, 0.45, 0.6], gelapkan(w, 0.88), [-4, 28, z]);
    m.rotation.z = 0.25;
    return m;
  };
  const ekor = lonjong(8, [1.4, 0.35, 0.8], w, [-22, 30, 0]);
  ekor.rotation.z = -0.5;
  const g = grup(
    lonjong(15, [1.3, 1, 1], w, [0, 24, 0]),
    jala(bola(11), w, [17, 38, 0]),
    paruh,
    sayap(14),
    sayap(-14),
    ekor,
    mata(2.4, [25, 41, 5.5]),
    mata(2.4, [25, 41, -5.5]),
    jala(tabung(1.4, 10), warna.paruh, [-3, 5, 5]),
    jala(tabung(1.4, 10), warna.paruh, [4, 5, -5]),
  );
  g.scale.setScalar(s);
  return g;
}

// ---------- Balok bilangan ----------

export const TINGGI_BALOK = 34;

/** Balok bilangan sepanjang `nilai` satuan: satu bintik per satuan di puncaknya, dan lekuk di antara satuan. */
export function balok(nilai: number, satuan: number, dalam: number) {
  const { isi, angka } = warnaBilangan[nilai];
  const alas = warnaAlas(isi);
  const panjang = nilai * satuan - 6;
  const g = grup(
    jala(kotakBulat(panjang, TINGGI_BALOK - 6, dalam, 9), alas, [0, (TINGGI_BALOK - 6) / 2, 0]),
    jala(kotakBulat(panjang, TINGGI_BALOK - 4, dalam - 6, 10), isi, [0, TINGGI_BALOK / 2 + 1, -3]),
  );
  for (let i = 0; i < nilai; i++) {
    const x = -panjang / 2 + (i + 0.5) * satuan - 3;
    g.add(jala(tabung(11, 3), angka, [x, TINGGI_BALOK + 1.5, -3], false));
    // Pemisah setelah satuan ke-5 lebih tegas, supaya 6 sampai 10 terbaca sebagai "lima dan sisanya".
    if (i > 0) g.add(jala(new THREE.BoxGeometry(i === 5 ? 5 : 2.5, 2, dalam - 10), i === 5 ? warna.tinta : alas, [x - satuan / 2, TINGGI_BALOK + 0.6, -3], false));
  }
  return g;
}

/** Cetakan jembatan: lempeng tembus pandang dengan lingkaran kosong untuk setiap satuan yang belum terisi. */
export function cetakan(panjang: number, satuan: number, dalam: number, sisa: number) {
  const kaca = new THREE.MeshLambertMaterial({ color: warna.panggung, transparent: true, opacity: 0.55 });
  const lempeng = new THREE.Mesh(kotakBulat(panjang - 4, 8, dalam, 4), kaca);
  lempeng.position.y = 4;
  const g = grup(lempeng);
  const n = Math.round(panjang / satuan);
  for (let i = n - sisa; i < n; i++) {
    const c = cincin(12, warna.tinta, true);
    c.position.set(-panjang / 2 + (i + 0.5) * satuan, 9, 0);
    c.scale.setScalar(1);
    g.add(c);
  }
  return g;
}

// ---------- Taman bermain ----------

/** Anak bulat dengan kepala besar, menghadap +x. Kulit, rambut, dan baju diatur lewat parameter. */
export function anak(baju: string, rambut: string, kulit: string, s = 1) {
  const g = grup(
    jala(tabung(10, 24, 12), baju, [0, 22, 0]),
    jala(bola(14), kulit, [1, 47, 0]),
    lonjong(14.6, [1, 0.8, 1.02], rambut, [-2.5, 52, 0]),
    mata(2.2, [13, 49, 5]),
    mata(2.2, [13, 49, -5]),
    lonjong(2.6, [0.5, 0.7, 1.2], warna.pipi, [12.5, 43, 8.5]),
    lonjong(2.6, [0.5, 0.7, 1.2], warna.pipi, [12.5, 43, -8.5]),
    lonjong(4.5, [1, 1.1, 1], kulit, [0, 26, 13]),
    lonjong(4.5, [1, 1.1, 1], kulit, [0, 26, -13]),
    jala(tabung(4.2, 12), gelapkan(baju, 0.7), [0, 6, 5]),
    jala(tabung(4.2, 12), gelapkan(baju, 0.7), [0, 6, -5]),
  );
  g.scale.setScalar(s);
  return g;
}

/** Rangka ayunan lebar `l` dan tinggi `t`, palang di sepanjang sumbu x. Titik gantung ada di (0, t, 0). */
export function rangkaAyunan(l = 120, t = 112) {
  const g = new THREE.Group();
  g.add(jala(tabung(4, l + 16), warna.kayuGelap, [0, t, 0]));
  g.children[0].rotation.z = Math.PI / 2;
  for (const x of [-l / 2, l / 2]) {
    for (const z of [-26, 26]) {
      const kaki = jala(tabung(3.4, t * 1.08), warna.kayu, [x, t / 2, z / 2]);
      kaki.rotation.x = Math.atan2(z, t) * -1;
      g.add(kaki);
    }
  }
  return g;
}

/** Tempat duduk ayunan dengan seorang anak. Titik asal di titik gantung, jadi cukup diputar di sumbu x untuk berayun. */
export function ayunanBerisi(baju: string, rambut: string, kulit: string, panjang = 78) {
  const g = new THREE.Group();
  for (const x of [-12, 12]) g.add(jala(tabung(0.9, panjang), warna.tinta, [x, -panjang / 2, 0], false));
  g.add(jala(kotakBulat(34, 5, 18, 2), warna.rambutan, [0, -panjang, 0]));
  const a = anak(baju, rambut, kulit, 0.9);
  a.rotation.y = -Math.PI / 2;
  a.position.set(0, -panjang + 2, 0);
  g.add(a);
  return g;
}

/** Perosotan menurun ke arah +x. Tangga di sisi -x, dataran atas di y = tinggi. */
export function perosotan(tinggi = 66, panjang = 110) {
  const g = new THREE.Group();
  const dataran = jala(kotakBulat(30, 6, 34, 2), warna.kayu, [0, tinggi, 0]);
  g.add(dataran);
  for (const z of [-15, 15]) {
    g.add(jala(tabung(2.6, tinggi), warna.kayuGelap, [-12, tinggi / 2, z]));
    g.add(jala(tabung(2.6, tinggi), warna.kayuGelap, [10, tinggi / 2, z]));
  }
  const miring = Math.atan2(tinggi, panjang);
  const luncur = jala(kotakBulat(Math.hypot(tinggi, panjang), 4, 28, 1.5), warna.blokGerak, [15 + panjang / 2, tinggi / 2, 0]);
  luncur.rotation.z = -miring;
  g.add(luncur);
  for (const z of [-15, 15]) {
    const tepi = jala(kotakBulat(Math.hypot(tinggi, panjang), 7, 3, 1), warna.blokGerakAlas, [15 + panjang / 2, tinggi / 2 + 3, z]);
    tepi.rotation.z = -miring;
    g.add(tepi);
  }
  for (let i = 0; i < 4; i++) {
    const anakTangga = jala(tabung(1.6, 30), warna.kayuTerang, [-17, 12 + i * 14, 0]);
    anakTangga.rotation.x = Math.PI / 2;
    g.add(anakTangga);
  }
  return g;
}

/** Kupu-kupu kecil. Sayapnya bergerak lewat `userData.kepak(t)`. */
export function kupuKupu(w: string = warna.kupu, s = 1) {
  const sayap = (arah: number) => {
    const m = jala(bola(1), w, [0, 0, arah * 4], false);
    m.scale.set(5, 0.5, 6);
    const pivot = grup(m);
    return pivot;
  };
  const kiri = sayap(1);
  const kanan = sayap(-1);
  const g = grup(jala(tabung(1, 8), warna.tinta, [0, 0, 0], false), kiri, kanan);
  g.children[0].rotation.z = Math.PI / 2;
  g.userData.kepak = (t: number) => {
    const a = Math.sin(t * 0.03) * 0.9;
    kiri.rotation.x = a;
    kanan.rotation.x = -a;
  };
  g.scale.setScalar(s);
  return g;
}

export function bangku(s = 1) {
  const g = grup(
    jala(kotakBulat(56, 6, 18, 2), warna.kayu, [0, 17, 0]),
    jala(kotakBulat(56, 16, 4, 2), warna.kayuTerang, [0, 30, -8]),
    jala(kotakBulat(6, 16, 16, 1), warna.kayuGelap, [-22, 8, 0]),
    jala(kotakBulat(6, 16, 16, 1), warna.kayuGelap, [22, 8, 0]),
  );
  g.scale.setScalar(s);
  return g;
}

/**
 * Bidang rata berbentuk elips di tanah, untuk jalan setapak dan kolam. Puncaknya di y = `tinggi`.
 * Lapisan yang bertumpuk sangat tipis, jadi urutannya dijaga dengan polygonOffset, bukan dengan jarak tinggi.
 */
export function elips(rx: number, rz: number, w: string, tinggi = 0.8, dalamLubang = 0) {
  const geo = dalamLubang > 0 ? new THREE.RingGeometry(1 - dalamLubang, 1, 72) : new THREE.CircleGeometry(1, 72);
  const bahanLapis = new THREE.MeshLambertMaterial({ color: w, polygonOffset: true, polygonOffsetFactor: -tinggi * 2, polygonOffsetUnits: -tinggi * 8 });
  const m = new THREE.Mesh(geo, bahanLapis);
  m.userData.bahanSendiri = true;
  m.rotation.x = -Math.PI / 2;
  m.scale.set(rx, rz, 1);
  m.position.y = tinggi;
  m.receiveShadow = true;
  return m;
}

// ---------- Penggabungan ----------

const bahanGabungan = new THREE.MeshLambertMaterial({ vertexColors: true });

/**
 * Menggabungkan semua mesh berbahan doff di dalam `akar` menjadi satu mesh berwarna per titik, satu untuk yang
 * menjatuhkan bayangan dan satu untuk yang tidak. Tampilannya sama, tetapi puluhan draw call menjadi dua.
 * Dipakai untuk benda yang bagian-bagiannya tidak bergerak sendiri. Posisi dan skala `akar` tetap berlaku.
 * Mesh transparan, mesh tanpa bahan doff, dan cahaya dibiarkan di tempatnya.
 */
export function padatkan<T extends THREE.Object3D>(akar: T): T {
  akar.updateMatrixWorld(true);
  const balik = akar.matrixWorld.clone().invert();
  const kumpulan = new Map<boolean, { geo: THREE.BufferGeometry; mesh: THREE.Mesh }[]>([[true, []], [false, []]]);
  akar.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || !(o.material instanceof THREE.MeshLambertMaterial) || o.material.transparent || o.userData.bahanSendiri) return;
    const geo = o.geometry.clone();
    geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(balik, o.matrixWorld));
    geo.deleteAttribute("uv");
    const n = geo.getAttribute("position").count;
    const warnaTitik = new Float32Array(n * 3);
    const c = o.material.color;
    for (let i = 0; i < n; i++) warnaTitik.set([c.r, c.g, c.b], i * 3);
    geo.setAttribute("color", new THREE.BufferAttribute(warnaTitik, 3));
    kumpulan.get(o.castShadow)!.push({ geo, mesh: o });
  });
  for (const [bayangan, daftar] of kumpulan) {
    if (!daftar.length) continue;
    // Semua geometri harus sama-sama beranjak atau tidak, kalau tidak penggabungan gagal.
    const semuaBeranjak = daftar.every(({ geo }) => geo.index);
    const geo = mergeGeometries(daftar.map(({ geo: g }) => (semuaBeranjak ? g : g.index ? g.toNonIndexed() : g)));
    if (!geo) continue;
    for (const { mesh } of daftar) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
    }
    const m = new THREE.Mesh(geo, bahanGabungan);
    m.castShadow = bayangan;
    m.receiveShadow = true;
    akar.add(m);
  }
  return akar;
}
