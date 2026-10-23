import * as THREE from "three";
import { Peta3D, type Benda3D } from "../bersama/peta3d/Peta3D";
import * as model from "../bersama/peta3d/model";
import { padatkan } from "../bersama/peta3d/model";
import { dalam, SIN, zDari } from "../bersama/peta3d/proyeksi";
import { Kitbitz } from "../gambar/kitbitz";
import { ukuran, warna } from "../desain/token";

const TANPA_BENDA: Benda3D[] = [];
const PUSAT = { x: 640, y: 350 };

type Titik = [number, number];
/** Satu titik jalan: waktu (ms) sejak awal putaran, posisi di layar, tinggi, arah hadap, dan miring badan. */
type Kunci = { t: number; x: number; y: number; layarY: number; hadap: number; miring?: number };

/** Posisi di layar (x, baris panggung) menjadi posisi dunia. */
const taruh = <T extends THREE.Object3D>(m: T, x: number, layarY: number, tinggi = 0): T => {
  m.position.set(x, tinggi, zDari(layarY));
  return m;
};

const titikElips = (cx: number, cy: number, rx: number, ry: number, n = 14): Titik[] =>
  Array.from({ length: n }, (_, i) => [cx + rx * Math.cos((i / n) * Math.PI * 2), cy + ry * Math.sin((i / n) * Math.PI * 2)]);

/** Berjalan terus di sepanjang lengkung tertutup. `detik` adalah lama satu putaran, `awal` pergeseran 0 sampai 1. */
function berjalan(m: THREE.Object3D, titik: Titik[], detik: number, awal = 0, langkah = 44, tinggiLangkah = 4) {
  const kurva = new THREE.CatmullRomCurve3(
    titik.map(([x, y]) => new THREE.Vector3(x, 0, zDari(y))),
    true,
  );
  const panjang = kurva.getLength();
  m.userData.hidup = (ms: number) => {
    const u = (((ms / 1000 / detik + awal) % 1) + 1) % 1;
    const p = kurva.getPointAt(u);
    const a = kurva.getTangentAt(u);
    m.position.set(p.x, Math.abs(Math.sin((Math.PI * u * panjang) / langkah)) * tinggiLangkah, p.z);
    m.rotation.y = Math.atan2(-a.z, a.x);
  };
  return m;
}

/** Bergerak lewat daftar titik kunci yang berulang tiap `total` ms. Posisi dan sudut diinterpolasi lurus. */
function berurutan(m: THREE.Object3D, kunci: Kunci[], total: number) {
  m.rotation.order = "YXZ";
  m.userData.hidup = (ms: number) => {
    const w = ms % total;
    let i = kunci.length - 2;
    while (i > 0 && kunci[i].t > w) i--;
    const [a, b] = [kunci[i], kunci[i + 1]];
    const p = Math.min(1, Math.max(0, (w - a.t) / (b.t - a.t)));
    const lurus = (u: number, v: number) => u + (v - u) * p;
    m.position.set(lurus(a.x, b.x), lurus(a.y, b.y), zDari(lurus(a.layarY, b.layarY)));
    m.rotation.y = a.hadap + Math.atan2(Math.sin(b.hadap - a.hadap), Math.cos(b.hadap - a.hadap)) * p;
    m.rotation.z = lurus(a.miring ?? 0, b.miring ?? 0);
  };
  return m;
}

/** Dua anak melempar bola bolak-balik. Bola melengkung di udara, anak sedikit melompat girang. */
function mainBola(g: THREE.Group, x1: number, x2: number, layarY: number, bajuA: string, bajuB: string, bola: string, fase = 0) {
  const a = taruh(padatkan(model.anak(bajuA, warna.rambutAnak1, warna.kulitAnak1, 1.15)), x1, layarY);
  const b = taruh(padatkan(model.anak(bajuB, warna.rambutAnak3, warna.kulitAnak3, 1.15)), x2, layarY);
  b.rotation.y = Math.PI;
  const bm = padatkan(model.bolaMainan(bola, 0.5));
  const z = zDari(layarY);
  const periode = 2200;
  const lompat = (m: THREE.Object3D, ms: number, geser: number) => (m.position.y = Math.abs(Math.sin(ms * 0.005 + geser)) * 3);
  a.userData.hidup = (ms: number) => lompat(a, ms, fase);
  b.userData.hidup = (ms: number) => lompat(b, ms, fase + 1.2);
  bm.userData.hidup = (ms: number) => {
    const w = (((ms / periode + fase) % 2) + 2) % 2;
    const s = w < 1 ? w : 2 - w;
    bm.position.set(x1 + 24 + (x2 - x1 - 48) * s, 20 + Math.sin(Math.PI * (w < 1 ? w : w - 1)) * 34, z + 6);
    bm.rotation.z = -s * 10;
  };
  g.add(a, b, bm);
}

function ayunan(g: THREE.Group, statis: THREE.Group, x: number, layarY: number) {
  const tinggi = 112;
  statis.add(taruh(model.rangkaAyunan(120, tinggi), x, layarY));
  [
    { dx: -30, baju: warna.blokKontrol, rambut: warna.rambutAnak2, kulit: warna.kulitAnak2, fase: 0 },
    { dx: 30, baju: warna.potonganBesar, rambut: warna.rambutAnak1, kulit: warna.kulitAnak1, fase: 1.7 },
  ].forEach(({ dx, baju, rambut, kulit, fase }) => {
    const s = taruh(padatkan(model.ayunanBerisi(baju, rambut, kulit)), x + dx, layarY, tinggi);
    s.userData.hidup = (ms: number) => (s.rotation.x = Math.sin(ms * 0.0021 + fase) * 0.52);
    g.add(s);
  });
}

function perosotan(g: THREE.Group, statis: THREE.Group, x0: number, layarY: number) {
  const tinggi = 66;
  const panjang = 110;
  statis.add(taruh(model.perosotan(tinggi, panjang), x0, layarY));
  const anak = padatkan(model.anak(warna.rambutan, warna.rambutAnak2, warna.kulitAnak2, 1.1));
  const kaki = x0 - 34;
  const kunci: Kunci[] = [
    { t: 0, x: kaki, y: 0, layarY: layarY + 34, hadap: Math.PI / 2 },
    { t: 700, x: kaki, y: 0, layarY, hadap: Math.PI / 2 },
    { t: 2300, x: x0 - 8, y: tinggi + 4, layarY, hadap: 0 },
    { t: 2900, x: x0 + 12, y: tinggi + 4, layarY, hadap: 0 },
    { t: 3200, x: x0 + 16, y: tinggi + 2, layarY, hadap: 0, miring: -0.3 },
    { t: 4300, x: x0 + 16 + panjang, y: 4, layarY, hadap: 0, miring: -0.3 },
    { t: 4600, x: x0 + 20 + panjang, y: 0, layarY: layarY + 8, hadap: -Math.PI / 2 },
    { t: 6000, x: x0 + 20 + panjang, y: 0, layarY: layarY + 44, hadap: Math.PI },
    { t: 8600, x: kaki, y: 0, layarY: layarY + 34, hadap: Math.PI },
    { t: 9000, x: kaki, y: 0, layarY: layarY + 34, hadap: Math.PI / 2 },
  ];
  g.add(berurutan(anak, kunci, 9000));
}

function kupuKupu(g: THREE.Group, pusat: Titik, r: number, detik: number, w: string, fase: number) {
  const k = model.kupuKupu(w, 1.4);
  const kepak = k.userData.kepak as (t: number) => void;
  const pembungkus = new THREE.Group();
  pembungkus.add(k);
  pembungkus.userData.hidup = (ms: number) => {
    const a = (ms / 1000 / detik) * Math.PI * 2 + fase;
    pembungkus.position.set(pusat[0] + Math.cos(a) * r, 46 + Math.sin(a * 2) * 12, zDari(pusat[1] + Math.sin(a * 1.5) * r * 0.4));
    pembungkus.rotation.y = Math.atan2(Math.cos(a * 1.5) * 0.6 * 1.5, -Math.sin(a));
    kepak(ms);
  };
  g.add(pembungkus);
}

/** Taman dari atas: lapangan rumput, jalan setapak, kolam, pohon, dan permainan anak. Semuanya hanya hiasan. */
function bangun() {
  const g = new THREE.Group();
  // Benda diam digabung menjadi dua mesh di akhir (padatkan), supaya jumlah draw call kecil.
  const statis = new THREE.Group();
  g.add(taruh(model.lempeng(1900, dalam(1100), 30, warna.rumputTaman, warna.tanahSisi), 640, 360));

  // Petak rumput yang lebih muda, jalan setapak pasir melingkar, dan rumput di dalamnya.
  for (const [x, y, rx, ry] of [[170, 190, 190, 40], [1090, 450, 220, 50], [640, 600, 520, 50], [980, 190, 160, 34]] as const) {
    g.add(taruh(model.elips(rx, ry / SIN, warna.rumputPetak, 0.4), x, y));
  }
  g.add(taruh(model.elips(390, 160 / SIN, warna.jalanPasir, 0.8), PUSAT.x, PUSAT.y));
  g.add(taruh(model.elips(290, 105 / SIN, warna.rumputTaman, 1.1), PUSAT.x, PUSAT.y));
  g.add(taruh(model.elips(230, 82 / SIN, warna.rumputPetak, 1.3), PUSAT.x, PUSAT.y));

  // Kolam bulat dengan tepi batu, teratai, dan riak yang berdenyut.
  g.add(taruh(model.elips(112, 46 / SIN, warna.batu, 2), PUSAT.x, PUSAT.y));
  g.add(taruh(model.elips(100, 38 / SIN, warna.air, 3), PUSAT.x, PUSAT.y));
  [[-34, -4], [30, 10], [8, -14]].forEach(([dx, dy]) => statis.add(taruh(model.teratai(0.8), PUSAT.x + dx, PUSAT.y + dy, 3)));
  statis.add(taruh(model.bunga(warna.kupu, 0.8), PUSAT.x - 30, PUSAT.y - 4, 4));
  [0, 1].forEach((i) => {
    const riak = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 6, 40), new THREE.MeshBasicMaterial({ color: warna.putih, transparent: true }));
    riak.rotation.x = -Math.PI / 2;
    taruh(riak, PUSAT.x + (i ? 40 : -22), PUSAT.y + (i ? -6 : 8), 5);
    riak.userData.hidup = (ms: number) => {
      const u = (((ms / 2600 + i * 0.5) % 1) + 1) % 1;
      riak.scale.set(8 + u * 28, 8 + u * 22, 1);
      (riak.material as THREE.MeshBasicMaterial).opacity = (1 - u) * 0.7;
    };
    g.add(riak);
  });

  // Pohon di pinggir taman, bergoyang pelan.
  for (const [x, y, s, fase] of [[70, 168, 1.7, 0], [255, 150, 1.35, 1.1], [470, 148, 1.2, 2.3], [830, 148, 1.25, 0.6], [1030, 150, 1.4, 1.9], [1150, 205, 1.6, 2.8], [34, 510, 1.5, 0.4], [1244, 520, 1.5, 1.4]] as const) {
    const p = taruh(padatkan(model.pohonRimbun(s)), x, y);
    p.userData.hidup = (ms: number) => (p.rotation.z = Math.sin(ms * 0.0008 + fase) * 0.018);
    g.add(p);
  }
  for (const [x, y, s] of [[360, 178, 1.2], [900, 176, 1.1], [150, 396, 1.1], [1150, 396, 1.2], [560, 530, 1], [760, 530, 1]] as const) statis.add(taruh(model.semak(s), x, y));
  statis.add(taruh(model.bangku(1.3), 640, 168));

  // Bunga dan rumput tersebar, tidak di jalan setapak dan tidak di dekat permainan.
  let benih = 7;
  const acak = () => ((benih = (benih * 16807) % 2147483647) - 1) / 2147483646;
  const warnaBunga = [warna.rambutan, warna.bintang, warna.pipi, warna.putih, warna.kupu, warna.kupuBiru];
  for (let i = 0, n = 0; i < 400 && n < 46; i++) {
    const x = 20 + acak() * 1240;
    const y = 135 + acak() * 395;
    const dalamJalan = ((x - PUSAT.x) / 440) ** 2 + ((y - PUSAT.y) / 200) ** 2 < 1;
    const dekatAyunan = Math.abs(x - 1130) < 110 && Math.abs(y - 300) < 70;
    const dekatPerosotan = x < 260 && y > 230 && y < 350;
    const dekatBola = y > 430 && y < 510 && ((x > 110 && x < 330) || (x > 980 && x < 1210));
    if (dalamJalan || dekatAyunan || dekatPerosotan || dekatBola) continue;
    n++;
    statis.add(taruh(n % 3 === 0 ? model.rumput(1.2) : model.bunga(warnaBunga[n % warnaBunga.length], 0.9 + acak() * 0.4), x, y));
  }
  for (const [x, y, s] of [[420, 470, 0.7], [880, 245, 0.8], [300, 230, 0.6]] as const) statis.add(taruh(model.batu(s), x, y));

  // Permainan anak.
  ayunan(g, statis, 1130, 300);
  perosotan(g, statis, 70, 292);
  mainBola(g, 130, 300, 478, warna.potonganKecil, warna.aksenJalan, warna.rambutan, 0);
  mainBola(g, 1010, 1190, 486, warna.blokGerak, warna.potonganPersegi, warna.bintang, 0.6);

  // Dua anak berkejaran mengelilingi kolam.
  const kejar = titikElips(PUSAT.x, PUSAT.y, 195, 64);
  g.add(berjalan(padatkan(model.anak(warna.bintang, warna.rambutAnak1, warna.kulitAnak3, 1.15)), kejar, 8, 0.1, 30, 7));
  g.add(berjalan(padatkan(model.anak(warna.rambutan, warna.rambutAnak3, warna.kulitAnak1, 1.15)), kejar, 8, 0, 30, 7));

  // Kucing berjalan pelan di jalan setapak.
  g.add(berjalan(padatkan(model.kucing(warna.kucing, 1.3)), titikElips(PUSAT.x, PUSAT.y, 340, 132, 18), 34, 0.35));

  kupuKupu(g, [420, 330], 90, 11, warna.kupu, 0);
  kupuKupu(g, [880, 400], 110, 14, warna.kupuBiru, 2);
  kupuKupu(g, [300, 400], 70, 9, warna.bintang, 4);

  // Bayangan awan yang melintas pelan.
  [0, 1, 2].forEach((i) => {
    const b = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: warna.tinta, transparent: true, opacity: 0.07, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -40 }));
    b.rotation.x = -Math.PI / 2;
    b.scale.set(120 + i * 30, (46 + i * 10) / SIN, 1);
    b.userData.hidup = (ms: number) => {
      const u = (((ms / (60000 + i * 14000) + i * 0.37) % 1) + 1) % 1;
      taruh(b, -240 + u * 1760, 250 + i * 110, 1.6);
    };
    g.add(b);
  });
  g.add(padatkan(statis));
  return g;
}

/** Pengganti kalau WebGL mati: padang rumput dengan hiasan 2D. */
function LatarDatar() {
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: warna.rumputTaman }} />
      <Kitbitz nama="pohon-senyum" lebar={130} style={{ position: "absolute", left: 90, top: 150 }} />
      <Kitbitz nama="pohon-rimbun" lebar={130} style={{ position: "absolute", left: 1040, top: 150 }} />
      <Kitbitz nama="semak-senyum" lebar={120} style={{ position: "absolute", left: 560, top: 420 }} />
      <Kitbitz nama="bunga" lebar={56} style={{ position: "absolute", left: 300, top: 340 }} />
      <Kitbitz nama="bunga" lebar={56} style={{ position: "absolute", left: 900, top: 330 }} />
    </>
  );
}

export function LatarTaman() {
  return (
    <Peta3D
      x={0}
      y={0}
      lebar={ukuran.lebarPanggung}
      tinggi={ukuran.tinggiPanggung}
      dasar={bangun}
      kunciDasar="taman"
      benda={TANPA_BENDA}
      hidup
      cadangan={<LatarDatar />}
      ujiId="latar-taman"
    />
  );
}
