import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { usePanggung } from "../stage/Stage";
import { durasi, warna } from "../../design/token";
import { COS, KEMIRINGAN, SIN, zDari } from "./projection";

/** Satu benda yang bisa bergerak di peta. Posisinya dalam satuan dunia (lihat proyeksi.ts). */
export type Benda3D = {
  id: string;
  /** Model dibuat ulang hanya saat kunci ini berubah, misalnya saat warna badan diganti. */
  kunci: string;
  buat: () => THREE.Object3D;
  x: number;
  z: number;
  y?: number;
  /** Arah hadap dalam radian di sekitar sumbu y. 0 berarti menghadap kanan. */
  hadap?: number;
  /** 1 tampak penuh, 0 hilang. */
  tampak?: number;
  /** Bergerak ke posisi baru sambil melompat. */
  lompat?: boolean;
  /** Lama bergerak ke posisi baru, dalam milidetik. */
  lama?: number;
};

export type Suasana = "siang" | "malam";

/** Mengambil foto sebagian peta (kotak dalam unit panggung) sebagai PNG data URL selebar `lebarHasil` piksel. */
export type Foto = (kotak: { x: number; y: number; lebar: number; tinggi: number }, lebarHasil: number) => string | null;

let dukungan: boolean | null = null;
/** Apakah peramban ini bisa menggambar 3D (WebGL). Dicek sekali. */
export function bisa3D() {
  if (dukungan === null) {
    try {
      const c = document.createElement("canvas");
      dukungan = !!(c.getContext("webgl2") ?? c.getContext("webgl"));
    } catch {
      dukungan = false;
    }
  }
  return dukungan;
}

type Props = {
  /** Kotak kanvas dalam unit panggung. */
  x: number;
  y: number;
  lebar: number;
  tinggi: number;
  /** Diorama yang tidak bergerak: tanah, air, pohon. Dibuat ulang hanya saat kunciDasar berubah. */
  dasar: () => THREE.Object3D;
  kunciDasar: string;
  benda: Benda3D[];
  suasana?: Suasana;
  /** Gambar 2D pengganti kalau peramban tidak bisa menggambar 3D (WebGL mati). */
  cadangan?: ReactNode;
  /** Lapisan DOM di atas peta 3D (tempat klik, angka, penanda uji). Tidak dipakai saat cadangan tampil. */
  children?: ReactNode;
  /** Diisi fungsi pengambil foto peta, misalnya untuk gambar kecil karya. */
  fotoRef?: { current: Foto | null };
  ujiId?: string;
  /** Menggambar terus-menerus dan menjalankan setiap `userData.hidup(ms)` di diorama, untuk latar yang bergerak sendiri. Diam kalau pengguna meminta gerak dikurangi. */
  hidup?: boolean;
};

type Keadaan = { x: number; y: number; z: number; hadap: number; tampak: number };
type Isi = { obj: THREE.Object3D; kunci: string; dari: Keadaan; ke: Keadaan; mulai: number; lama: number; lompat: boolean; bahanSendiri: boolean };

let kurangiGerak: MediaQueryList | null = null;
/** Preferensi sistem "kurangi gerak". Daftar media dibuat sekali, bukan di setiap bingkai. */
const gerakDikurangi = () => (kurangiGerak ??= window.matchMedia("(prefers-reduced-motion: reduce)")).matches;

const TINGGI_LOMPAT = 40;
const LAMA_PUDAR = 400;
const halus = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
/** Putaran terpendek dari a ke b, supaya tokoh tidak berputar satu lingkaran penuh. */
const selisihSudut = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

function buang(obj: THREE.Object3D) {
  obj.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      if (o.userData.bahanSendiri) (o.material as THREE.Material).dispose();
    }
  });
}

/**
 * Peta 3D gaya diorama: kamera ortografis dimiringkan dari atas (proyeksi.ts), cahaya dari kanan atas,
 * dan bayangan lembut. Kanvas tidak menerima klik. Tempat klik tetap berupa elemen DOM biasa di atasnya,
 * diletakkan dengan keLayar(), supaya klik, seret, dan uji otomatis bekerja seperti sebelumnya.
 * Gambar hanya digambar ulang saat ada yang berubah atau bergerak.
 */
export function Peta3D({ x, y, lebar, tinggi, dasar, kunciDasar, benda, suasana = "siang", cadangan, children, fotoRef, ujiId, hidup }: Props) {
  const { skala } = usePanggung();
  const wadah = useRef<HTMLDivElement>(null);
  const [gagal, setGagal] = useState(false);
  const tiga = useRef<{
    renderer: THREE.WebGLRenderer;
    adegan: THREE.Scene;
    kamera: THREE.OrthographicCamera;
    langit: THREE.HemisphereLight;
    matahari: THREE.DirectionalLight;
    dasar: THREE.Object3D | null;
    penghidup: ((ms: number) => void)[];
    isi: Map<string, Isi>;
    bingkai: number;
  } | null>(null);

  const gerakSendiri = () => !!hidup && !gerakDikurangi();

  const gambar = () => {
    const t = tiga.current;
    if (!t || t.bingkai) return;
    t.bingkai = requestAnimationFrame(langkah);
  };

  const langkah = (kini: number) => {
    const t = tiga.current;
    if (!t) return;
    t.bingkai = 0;
    let bergerak = false;
    if (gerakSendiri()) {
      for (const h of t.penghidup) h(kini);
      bergerak = true;
    }
    for (const e of t.isi.values()) {
      const p = Math.min(1, (kini - e.mulai) / e.lama);
      const pp = Math.min(1, (kini - e.mulai) / LAMA_PUDAR);
      if (p < 1 || pp < 1) bergerak = true;
      const h = halus(p);
      // Tokoh yang berpindah tempat melangkah: naik-turun sedikit setiap setengah petak, atau melompat sekali.
      const jarak = Math.hypot(e.ke.x - e.dari.x, e.ke.z - e.dari.z);
      const naik = jarak > 1 && p < 1 ? (e.lompat ? Math.sin(Math.PI * p) * TINGGI_LOMPAT : Math.abs(Math.sin((Math.PI * jarak * h) / 44)) * 5) : 0;
      e.obj.position.set(e.dari.x + (e.ke.x - e.dari.x) * h, e.dari.y + (e.ke.y - e.dari.y) * h + naik, e.dari.z + (e.ke.z - e.dari.z) * h);
      e.obj.rotation.y = e.dari.hadap + selisihSudut(e.dari.hadap, e.ke.hadap) * halus(Math.min(1, p * 2));
      const tampak = e.dari.tampak + (e.ke.tampak - e.dari.tampak) * pp;
      e.obj.visible = tampak > 0.01;
      if (tampak < 1 || e.bahanSendiri) {
        if (!e.bahanSendiri) {
          e.obj.traverse((o) => {
            if (o instanceof THREE.Mesh) {
              o.material = (o.material as THREE.Material).clone();
              o.userData.bahanSendiri = true;
            }
          });
          e.bahanSendiri = true;
        }
        e.obj.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            const m = o.material as THREE.Material;
            m.transparent = tampak < 1;
            m.opacity = tampak;
          }
        });
      }
    }
    t.renderer.render(t.adegan, t.kamera);
    if (bergerak) t.bingkai = requestAnimationFrame(langkah);
  };

  // Membuat kanvas WebGL sekali. Kalau gagal, gambar 2D pengganti yang tampil.
  // Efek tata letak, supaya kanvas sudah ada saat benda pertama disamakan di bawah.
  useLayoutEffect(() => {
    let renderer: THREE.WebGLRenderer;
    if (!bisa3D()) {
      setGagal(true);
      return;
    }
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setGagal(true);
      return;
    }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = "block";
    wadah.current!.appendChild(renderer.domElement);

    // Kamera berada di garis yang melewati titik asal, jadi titik dunia jatuh tepat di keLayar() tanpa geseran.
    const kamera = new THREE.OrthographicCamera(x, x + lebar, -y, -(y + tinggi), 1, 12000);
    const jauh = 5000;
    kamera.position.set(0, jauh * SIN, jauh * COS);
    kamera.rotation.x = -KEMIRINGAN;

    const adegan = new THREE.Scene();
    const langit = new THREE.HemisphereLight(warna.cahayaLangit, warna.cahayaTanah, 2.2);
    const matahari = new THREE.DirectionalLight(warna.cahaya, 2.4);
    // Cahaya dari kanan atas seperti gambar Kitbitz: bayangan jatuh ke kiri, sisi depan benda tetap terang.
    const pusat = new THREE.Vector3(x + lebar / 2, 0, zDari(y + tinggi / 2));
    matahari.position.copy(pusat).add(new THREE.Vector3(560, 1100, 160));
    matahari.target.position.copy(pusat);
    matahari.castShadow = true;
    matahari.shadow.mapSize.set(2048, 2048);
    const r = Math.max(lebar, tinggi / SIN) * 0.75;
    Object.assign(matahari.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 10, far: 4000 });
    matahari.shadow.bias = -0.0008;
    matahari.shadow.normalBias = 0.6;
    adegan.add(langit, matahari, matahari.target);

    tiga.current = { renderer, adegan, kamera, langit, matahari, dasar: null, penghidup: [], isi: new Map(), bingkai: 0 };
    if (fotoRef) {
      fotoRef.current = (k, lebarHasil) => {
        // Digambar ulang lalu langsung disalin, karena isi kanvas WebGL hanya utuh sampai tugas ini selesai.
        renderer.render(adegan, kamera);
        const r = renderer.getPixelRatio();
        const hasil = document.createElement("canvas");
        hasil.width = lebarHasil;
        hasil.height = Math.round((lebarHasil * k.tinggi) / k.lebar);
        const g = hasil.getContext("2d");
        if (!g) return null;
        g.drawImage(renderer.domElement, (k.x - x) * r, (k.y - y) * r, k.lebar * r, k.tinggi * r, 0, 0, hasil.width, hasil.height);
        return hasil.toDataURL("image/png");
      };
    }
    return () => {
      if (fotoRef) fotoRef.current = null;
      const t = tiga.current!;
      cancelAnimationFrame(t.bingkai);
      t.adegan.traverse((o) => o instanceof THREE.Mesh && o.geometry.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      tiga.current = null;
    };
  }, []);

  // Ketajaman mengikuti pembesaran panggung dan layar retina, paling besar 2 kali.
  useEffect(() => {
    const t = tiga.current;
    if (!t) return;
    t.renderer.setPixelRatio(Math.min(2, skala * (window.devicePixelRatio || 1)));
    t.renderer.setSize(lebar, tinggi, false);
    t.renderer.domElement.style.width = `${lebar}px`;
    t.renderer.domElement.style.height = `${tinggi}px`;
    gambar();
  }, [skala, lebar, tinggi, gagal]);

  useEffect(() => {
    const t = tiga.current;
    if (!t) return;
    if (t.dasar) {
      t.adegan.remove(t.dasar);
      buang(t.dasar);
    }
    t.dasar = dasar();
    t.adegan.add(t.dasar);
    t.penghidup = [];
    t.dasar.traverse((o) => typeof o.userData.hidup === "function" && t.penghidup.push(o.userData.hidup));
    gambar();
  }, [kunciDasar, gagal]);

  useEffect(() => {
    const t = tiga.current;
    if (!t) return;
    const malam = suasana === "malam";
    t.langit.color.set(malam ? warna.cahayaMalam : warna.cahayaLangit);
    t.langit.groundColor.set(malam ? warna.langitMalam : warna.cahayaTanah);
    t.langit.intensity = malam ? 2 : 2.2;
    t.matahari.color.set(malam ? warna.cahayaMalam : warna.cahaya);
    t.matahari.intensity = malam ? 1.6 : 2.4;
    gambar();
  }, [suasana, gagal]);

  // Menyamakan benda di adegan dengan daftar benda: tambah, ganti model, buang, atau gerakkan ke posisi baru.
  useLayoutEffect(() => {
    const t = tiga.current;
    if (!t) return;
    const kini = performance.now();
    const ada = new Set<string>();
    for (const b of benda) {
      ada.add(b.id);
      const ke: Keadaan = { x: b.x, y: b.y ?? 0, z: b.z, hadap: b.hadap ?? 0, tampak: b.tampak ?? 1 };
      let e = t.isi.get(b.id);
      if (e && e.kunci !== b.kunci) {
        t.adegan.remove(e.obj);
        buang(e.obj);
        const obj = b.buat();
        t.adegan.add(obj);
        e = { ...e, obj, kunci: b.kunci, bahanSendiri: false };
        t.isi.set(b.id, e);
      }
      if (!e) {
        const obj = b.buat();
        t.adegan.add(obj);
        t.isi.set(b.id, { obj, kunci: b.kunci, dari: ke, ke, mulai: 0, lama: 1, lompat: false, bahanSendiri: false });
        continue;
      }
      const sama = (["x", "y", "z", "hadap", "tampak"] as const).every((k) => e.ke[k] === ke[k]);
      if (sama) continue;
      const o = e.obj;
      const tampakKini = Math.min(1, (kini - e.mulai) / LAMA_PUDAR);
      e.dari = { x: o.position.x, y: e.ke.y, z: o.position.z, hadap: o.rotation.y, tampak: e.dari.tampak + (e.ke.tampak - e.dari.tampak) * tampakKini };
      e.ke = ke;
      e.mulai = kini;
      e.lama = b.lama ?? durasi.langkahTokoh;
      e.lompat = !!b.lompat;
    }
    for (const [id, e] of t.isi) {
      if (ada.has(id)) continue;
      t.adegan.remove(e.obj);
      buang(e.obj);
      t.isi.delete(id);
    }
    gambar();
  });

  if (gagal) return <>{cadangan}</>;
  return (
    <>
      <div ref={wadah} data-testid={ujiId} data-peta3d style={{ position: "absolute", left: x, top: y, width: lebar, height: tinggi, pointerEvents: "none" }} />
      {children}
    </>
  );
}
