import { useEffect, useState } from "react";
import * as THREE from "three";
import { Peta3D, type Benda3D } from "../../bersama/peta3d/Peta3D";
import * as model from "../../bersama/peta3d/model";
import { COS, dalam, zDari } from "../../bersama/peta3d/proyeksi";
import { Kucing, Rumah } from "../../gambar/ilustrasi";
import { Kitbitz } from "../../gambar/kitbitz";
import { ukuran, warna } from "../../desain/token";
import { GambarBalok, SATUAN } from "./GambarBalok";

// Tata letak peta sungai di panggung (frontend.md, bagian Balok Bilangan). Dilihat miring dari atas:
// sungai mengalir ke arah anak, dan jembatan balok melintang di atasnya.

/** Tepi atas balok jembatan di layar. Satu balok tampil setinggi SATUAN, puncak dan sisi depannya. */
export const Y_JEMBATAN = 250;
/** Rentang sungai di layar, dari belakang ke depan. Seluruhnya bisa diklik. */
export const SUNGAI = { atas: ukuran.areaKerjaAtas + 12, bawah: ukuran.areaKerjaAtas + ukuran.areaKerjaTinggi - 36 };

/** Kedalaman balok di dunia, supaya puncak dan sisi depannya tampil tepat SATUAN di layar. */
const DALAM_BALOK = dalam(SATUAN - model.TINGGI_BALOK * COS);
const Z_JEMBATAN = zDari(Y_JEMBATAN, model.TINGGI_BALOK) + DALAM_BALOK / 2;
const TEBAL_TEPI = 40;
const PERMUKAAN_AIR = -16;
/** Kucing menyeberang dalam tiga gerakan: naik ke jembatan, berjalan, turun di seberang. Lalu masuk rumah. */
const GERAK_SEBERANG = [350, 1000, 300];

type Props = {
  sungai: number;
  xSungai: number;
  diSungai: { id: number; nilai: number }[];
  terisi: number;
  percobaan: number | null;
  menyeberang: boolean;
};

export function PetaSungai({ sungai, xSungai, diSungai, terisi, percobaan, menyeberang }: Props) {
  const lebarSungai = sungai * SATUAN;
  const kanan = xSungai + lebarSungai;
  const xRumah = kanan + 104;
  const [fase, setFase] = useState(0);

  useEffect(() => {
    if (!menyeberang) {
      setFase(0);
      return;
    }
    let t = 0;
    const jeda = [...GERAK_SEBERANG, 0].map((ms, i) => {
      const j = window.setTimeout(() => setFase(i + 1), t);
      t += ms;
      return j;
    });
    return () => jeda.forEach((j) => window.clearTimeout(j));
  }, [menyeberang]);

  const dasar = () => {
    const g = new THREE.Group();
    const [z0, z1] = [zDari(SUNGAI.atas), zDari(SUNGAI.bawah)];
    const zt = (z0 + z1) / 2;
    const dalamTepi = z1 - z0;
    const kiriPanel = 36;
    const kananPanel = ukuran.lebarPanggung - 36;
    for (const [a, b] of [[kiriPanel, xSungai], [kanan, kananPanel]]) {
      const t = model.lempeng(b - a, dalamTepi, TEBAL_TEPI);
      t.position.set((a + b) / 2, 0, zt);
      g.add(t);
    }
    const a = model.air(lebarSungai + 24, dalamTepi - 8, 22);
    a.position.set(xSungai + lebarSungai / 2, PERMUKAAN_AIR, zt);
    g.add(a);

    const r = model.rumah(1.05);
    r.position.set(xRumah, 0, Z_JEMBATAN - dalam(34));
    g.add(r);

    // Hiasan di tepi dan di air, jauh dari jalur jembatan. Tidak bisa diklik.
    const zBelakang = z0 + dalam(36);
    const zDepan = z1 - dalam(40);
    const hias: [THREE.Object3D, number, number, number?][] = [
      [model.pohonRimbun(0.9), (kiriPanel + xSungai) / 2 - 20, zBelakang],
      [model.semak(0.85), xSungai - 50, zDepan],
      [model.bunga(warna.rambutan, 1.2), kiriPanel + 34, zDepan - dalam(30)],
      [model.rumput(1.3), xSungai - 28, zBelakang + dalam(20)],
      [model.pohonRimbun(0.8), kananPanel - 50, zDepan - dalam(10)],
      [model.batu(0.8), kanan + 50, zDepan],
      [model.bunga(warna.bintang, 1.1), kananPanel - 40, zBelakang + dalam(10)],
      [model.teratai(1), xSungai + Math.min(70, lebarSungai / 3), zBelakang, PERMUKAAN_AIR],
      [model.teratai(0.8), kanan - Math.min(60, lebarSungai / 4), zDepan, PERMUKAAN_AIR],
    ];
    for (const [m, x, z, y = 0] of hias) {
      m.position.set(x, y, z);
      g.add(m);
    }
    return g;
  };

  const xBalok = (mulai: number, nilai: number) => xSungai + mulai * SATUAN + (nilai * SATUAN) / 2;
  let geser = 0;
  const benda: Benda3D[] = [
    {
      id: "cetakan",
      kunci: `cetakan-${sungai}-${sungai - terisi}`,
      buat: () => model.cetakan(lebarSungai, SATUAN, DALAM_BALOK, sungai - terisi),
      x: xSungai + lebarSungai / 2,
      z: Z_JEMBATAN,
    },
    ...diSungai.map((b) => {
      const x = xBalok(geser, b.nilai);
      geser += b.nilai;
      return { id: `balok-${b.id}`, kunci: String(b.nilai), buat: () => model.balok(b.nilai, SATUAN, DALAM_BALOK), x, z: Z_JEMBATAN, lama: 1 };
    }),
    ...(percobaan === null
      ? []
      : [{ id: "percobaan", kunci: String(percobaan), buat: () => model.balok(percobaan, SATUAN, DALAM_BALOK), x: xBalok(terisi, percobaan), z: Z_JEMBATAN, tampak: 0.7, lama: 1 }]),
    {
      id: "kucing",
      kunci: "kucing",
      buat: () => model.kucing(),
      x: [xSungai - 56, xSungai + 34, kanan - 34, kanan + 56, xRumah][fase],
      y: fase === 1 || fase === 2 ? model.TINGGI_BALOK : 0,
      z: Z_JEMBATAN,
      lompat: fase === 1 || fase === 3,
      lama: GERAK_SEBERANG[fase - 1] ?? 300,
      tampak: fase === 4 ? 0 : 1,
    },
  ];

  return <Peta3D x={24} y={ukuran.areaKerjaAtas} lebar={ukuran.lebarPanggung - 48} tinggi={ukuran.areaKerjaTinggi} dasar={dasar} kunciDasar={`sungai-${sungai}`} benda={benda} cadangan={<SungaiDatar {...{ sungai, xSungai, diSungai, terisi, percobaan, menyeberang }} />} />;
}

/** Sungai datar 2D dilihat dari samping, pengganti peta 3D kalau peramban tidak bisa menggambar 3D. */
function SungaiDatar({ sungai, xSungai, diSungai, terisi, percobaan, menyeberang }: Props) {
  const lebarSungai = sungai * SATUAN;
  const yTepi = Y_JEMBATAN + 12;
  const tinggi = 150;
  return (
    <>
      {[
        { left: 26, width: xSungai - 26 },
        { left: xSungai + lebarSungai, width: ukuran.lebarPanggung - 26 - xSungai - lebarSungai },
      ].map((t, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: t.left,
            top: yTepi,
            width: t.width,
            height: tinggi,
            background: warna.tanah,
            borderTop: `16px solid ${warna.rumputPetak}`,
            borderRadius: i === 0 ? "0 22px 0 0" : "22px 0 0 0",
            boxShadow: "inset 6px -8px 0 color-mix(in srgb, var(--tinta) 8%, transparent)",
          }}
        />
      ))}
      <Kitbitz nama="batu-sungai" lebar={110} style={{ position: "absolute", left: xSungai - 150, top: yTepi + 70 }} />
      <svg width={lebarSungai} height={tinggi} viewBox={`0 0 ${lebarSungai} ${tinggi}`} style={{ position: "absolute", left: xSungai, top: yTepi }} aria-hidden>
        <rect x="0" y="16" width={lebarSungai} height={tinggi - 16} rx="18" fill={warna.air} filter="url(#lembut)" />
      </svg>
      <svg width={lebarSungai} height={SATUAN} viewBox={`0 0 ${lebarSungai} ${SATUAN}`} style={{ position: "absolute", left: xSungai, top: Y_JEMBATAN }} aria-hidden>
        <rect x="2" y="2" width={lebarSungai - 4} height={SATUAN - 10} rx="16" fill={warna.panggung} fillOpacity={0.65} stroke={warna.tinta} strokeWidth={3} strokeDasharray="10 8" />
        {Array.from({ length: sungai }, (_, i) =>
          i >= terisi ? <circle key={i} cx={i * SATUAN + SATUAN / 2} cy={(SATUAN - 6) / 2} r="13" fill="none" stroke={warna.tinta} strokeWidth={3} strokeDasharray="5 4" /> : null,
        )}
      </svg>
      {diSungai.map((b, i) => (
        <div key={b.id} style={{ position: "absolute", left: xSungai + diSungai.slice(0, i).reduce((n, s) => n + s.nilai, 0) * SATUAN, top: Y_JEMBATAN }}>
          <GambarBalok nilai={b.nilai} />
        </div>
      ))}
      {percobaan !== null && (
        <div className="muncul-pudar" style={{ position: "absolute", left: xSungai + terisi * SATUAN, top: Y_JEMBATAN }}>
          <GambarBalok nilai={percobaan} transparan />
        </div>
      )}
      <div style={{ position: "absolute", left: xSungai + lebarSungai + 30, top: yTepi - 84 }}>
        <Rumah lebar={80} />
      </div>
      <div style={{ position: "absolute", left: menyeberang ? xSungai + lebarSungai + 34 : xSungai - 96, top: (menyeberang ? Y_JEMBATAN : yTepi) - 70, transition: "left 1600ms ease-in-out, opacity 400ms 1600ms", opacity: menyeberang ? 0 : 1 }}>
        <Kucing />
      </div>
    </>
  );
}
