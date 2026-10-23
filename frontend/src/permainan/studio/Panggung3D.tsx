import * as THREE from "three";
import { Peta3D, type Benda3D, type Foto } from "../../bersama/peta3d/Peta3D";
import * as model from "../../bersama/peta3d/model";
import { dalam, zDari } from "../../bersama/peta3d/proyeksi";
import { hadap3D } from "../../bersama/program/PetaJalur";
import type { Sel } from "../../bersama/program/jenis";
import { paletStudio, warna } from "../../desain/token";
import { KOTAK } from "./GambarStudio";
import { BARIS, KOLOM, type Bingkai, type IsiKarya, type JenisTokoh, type Latar } from "./logika";

const TEBAL_PETAK = 10;
const TEBAL_LEMPENG = 26;
const TEPI = 8;

const tanah: Record<Latar, [string, string]> = {
  taman: [warna.rumputTaman, warna.rumputPetak],
  pantai: [warna.pasir, warna.jalanPasir],
  malam: [warna.rumputMalam, model.gelapkan(warna.rumputMalam, 1.18)],
};

export function modelTokoh(jenis: JenisTokoh, warnaBadan: string) {
  if (jenis === "kucing") return model.kucing(warnaBadan, 1.1);
  if (jenis === "ikan") return model.ikan(warnaBadan, 1.1);
  if (jenis === "bola") return model.bolaMainan(warnaBadan, 1.1);
  return model.burung(warnaBadan, 1.1);
}

type Props = {
  x: number;
  y: number;
  isi: IsiKarya;
  bingkai: Bingkai | null;
  terpilih: string | null;
  sasaran: string | null;
  fotoRef: { current: Foto | null };
};

/**
 * Panggung Studio Kreasi sebagai diorama 3D: KOLOM × BARIS petak, masing-masing 88 × 88 di layar,
 * dengan tokoh 3D yang berjalan, berputar, dan melompat. Klik tetap ditangani elemen DOM di atasnya.
 */
export function Panggung3D({ x, y, isi, bingkai, terpilih, sasaran, fotoRef }: Props) {
  const pusat = ([k, b]: Sel) => ({ x: x + k * KOTAK + KOTAK / 2, z: zDari(y + b * KOTAK + KOTAK / 2) });
  const latar = isi.latar;

  const dasar = () => {
    const g = new THREE.Group();
    const [lebar, tinggi] = [KOLOM * KOTAK, BARIS * KOTAK];
    const lempeng = model.lempeng(lebar + TEPI * 2, dalam(tinggi + TEPI * 2), TEBAL_LEMPENG, tanah[latar][0]);
    lempeng.position.set(x + lebar / 2, -TEBAL_PETAK + 6, zDari(y + tinggi / 2));
    g.add(lempeng);
    for (let b = 0; b < BARIS; b++) {
      for (let k = 0; k < KOLOM; k++) {
        const p = model.petak(KOTAK - 4, dalam(KOTAK) - 4, TEBAL_PETAK, tanah[latar][(k + b) % 2], 8);
        const c = pusat([k, b]);
        p.position.x = c.x;
        p.position.z = c.z;
        g.add(p);
      }
    }
    // Hiasan kecil di sudut pertemuan petak: rendah, supaya tidak menutupi tokoh. Tidak bisa diklik.
    const sudut = (k: number, b: number) => ({ x: x + k * KOTAK, z: zDari(y + b * KOTAK) });
    const hias: [THREE.Object3D, number, number][] =
      latar === "taman"
        ? [[model.bunga(warna.rambutan, 0.9), 2, 1], [model.rumput(1), 5, 3], [model.bunga(warna.bintang, 0.9), 7, 2], [model.rumput(1), 1, 3], [model.bunga(warna.pipi, 0.9), 4, 1]]
        : latar === "pantai"
          ? [[model.kerang(), 2, 2], [model.bintangLaut(), 6, 1], [model.kerang(), 8, 3], [model.batu(0.45), 4, 3], [model.bintangLaut(), 1, 1]]
          : [[model.kunang(), 2, 1], [model.kunang(), 6, 2], [model.kunang(), 4, 3], [model.rumput(1), 8, 1], [model.rumput(1), 3, 2]];
    for (const [m, k, b] of hias) {
      const c = sudut(k, b);
      m.position.set(c.x, m.userData.melayang ?? 0, c.z);
      g.add(m);
    }
    return g;
  };

  const benda: Benda3D[] = isi.tokoh.flatMap((t) => {
    const k = bingkai?.[t.id] ?? { sel: t.sel, arah: t.arah, lompat: false };
    const c = pusat(k.sel);
    const tokoh: Benda3D = {
      id: t.id,
      kunci: `${t.jenis}-${t.warna}`,
      buat: () => modelTokoh(t.jenis, paletStudio[t.warna]),
      x: c.x,
      z: c.z,
      hadap: hadap3D[k.arah],
      lompat: k.lompat,
    };
    const tanda: Benda3D[] = [];
    // Di malam hari, tinta nyaris tak terlihat di tanah gelap, jadi penanda terpilih memakai putih.
    const warnaCincin = latar === "malam" ? warna.putih : warna.tinta;
    if (t.id === terpilih) tanda.push({ id: "cincin-terpilih", kunci: `terpilih-${warnaCincin}`, buat: () => model.cincin(38, warnaCincin), x: c.x, z: c.z });
    if (t.id === sasaran) tanda.push({ id: "cincin-sasaran", kunci: "sasaran", buat: () => model.cincin(38, warna.blokPemicuAlas, true), x: c.x, z: c.z });
    return [tokoh, ...tanda];
  });

  return (
    <Peta3D
      x={24}
      y={y - 8}
      lebar={KOLOM * KOTAK + 16}
      tinggi={BARIS * KOTAK + 16}
      dasar={dasar}
      kunciDasar={latar}
      benda={benda}
      suasana={latar === "malam" ? "malam" : "siang"}
      fotoRef={fotoRef}
      ujiId="peta-studio"
    />
  );
}
