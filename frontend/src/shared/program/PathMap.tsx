import * as THREE from "three";
import { Angka } from "../numbers/Numbers";
import { Peta3D } from "../map3d/Map3D";
import * as model from "../map3d/model";
import { dalam, zDari } from "../map3d/projection";
import { Batu, Kucing, Rumah } from "../../images/illustrations";
import { durasi, ukuran, warna } from "../../design/token";
import type { Arah, LevelJalur, Sel } from "./kinds";
import type { Tokoh } from "./useRunner";

export const SEL = 88;

/** Arah hadap tokoh 3D: 0 menghadap kanan, positif berputar ke belakang (menjauhi anak). */
export const hadap3D: Record<Arah, number> = { kanan: 0, atas: Math.PI / 2, kiri: Math.PI, bawah: -Math.PI / 2 };

const TEBAL_PETAK = 16;
const TEBAL_LEMPENG = 44;
/** Lebar pinggir lempeng di luar petak (unit panggung): kiri-kanan untuk hiasan, depan untuk angka kolom. */
const TEPI = { samping: 64, belakang: 18, depan: 40 };

/**
 * Peta 3D berkotak bernomor dengan batu, rumah, dan kucing, dilihat miring dari atas.
 * Petak tetap 88 × 88 di layar, sama dengan peta datar, jadi tata letak dan peragaan tidak berubah.
 * Dipakai Penjelajah Jalur dan Detektif Galat.
 */
export function PetaJalur({ level, tokoh, masukRumah }: { level: LevelJalur; tokoh: Tokoh; masukRumah: boolean }) {
  const xPeta = (ukuran.lebarPanggung - level.kolom * SEL) / 2;
  const yPeta = ukuran.areaKerjaAtas + 28;
  const pusat = ([k, b]: Sel) => ({ x: xPeta + k * SEL + SEL / 2, z: zDari(yPeta + b * SEL + SEL / 2) });
  const adaDi = (daftar: Sel[], k: number, b: number) => daftar.some(([x, y]) => x === k && y === b);
  const [dx, dy] = { kanan: [1, 0], kiri: [-1, 0], atas: [0, -1], bawah: [0, 1] }[tokoh.arah];
  const c = pusat(tokoh.sel);

  const dasar = () => {
    const g = new THREE.Group();
    const lebar = level.kolom * SEL;
    const [atas, bawah] = [yPeta - TEPI.belakang, yPeta + level.baris * SEL + TEPI.depan];
    const lempeng = model.lempeng(lebar + TEPI.samping * 2, dalam(bawah - atas), TEBAL_LEMPENG);
    lempeng.position.set(xPeta + lebar / 2, -TEBAL_PETAK + 10, zDari((atas + bawah) / 2));
    g.add(lempeng);
    for (let b = 0; b < level.baris; b++) {
      for (let k = 0; k < level.kolom; k++) {
        const p = model.petak(SEL - 6, dalam(SEL) - 6, TEBAL_PETAK, adaDi(level.jalan, k, b) ? warna.jalanPasir : warna.rumputPetak);
        const { x, z } = pusat([k, b]);
        p.position.x = x;
        p.position.z = z;
        g.add(p);
      }
    }
    for (const sel of level.batu) {
      const m = model.batu(1.05);
      const { x, z } = pusat(sel);
      m.position.set(x - 6, 0, z);
      g.add(m);
    }
    const r = model.rumah(1.05);
    const { x: xr, z: zr } = pusat(level.rumah);
    r.position.set(xr, 0, zr - 8);
    g.add(r);

    // Hiasan di pinggir lempeng, di luar petak. Tidak bisa diklik.
    const kiri = xPeta - TEPI.samping / 2;
    const kanan = xPeta + lebar + TEPI.samping / 2;
    const z0 = zDari(yPeta);
    const hias: [THREE.Object3D, number, number][] = [
      [model.pohonRimbun(0.95), kiri, z0 + dalam(40)],
      [model.semak(0.9), kiri, z0 + dalam(SEL * level.baris - 40)],
      [model.bunga(warna.rambutan, 1.2), kiri + 8, z0 + dalam(SEL * 1.5)],
      [model.pohonRimbun(0.8), kanan, z0 + dalam(SEL * level.baris - 70)],
      [model.rumput(1.3), kanan - 6, z0 + dalam(40)],
      [model.bunga(warna.bintang, 1.1), kanan + 6, z0 + dalam(SEL * 1.2)],
    ];
    for (const [m, x, z] of hias) {
      m.position.set(x, 0, z);
      g.add(m);
    }
    return g;
  };

  return (
    <Peta3D
      x={24}
      y={ukuran.areaKerjaAtas}
      lebar={ukuran.lebarPanggung - 48}
      tinggi={ukuran.areaKerjaTinggi}
      dasar={dasar}
      kunciDasar={level.id}
      benda={[
        {
          id: "kucing",
          kunci: "kucing",
          buat: () => model.kucing(),
          x: c.x - 4 + (tokoh.bentur ? dx * 22 : 0),
          z: c.z + (tokoh.bentur ? dalam(dy * 22) : 0),
          hadap: hadap3D[tokoh.arah],
          tampak: masukRumah ? 0 : 1,
        },
      ]}
      cadangan={<PetaDatar level={level} tokoh={tokoh} masukRumah={masukRumah} />}
    >
      <div data-testid="peta" data-3d style={{ position: "absolute", left: xPeta, top: yPeta, width: level.kolom * SEL, height: level.baris * SEL, pointerEvents: "none" }}>
        {Array.from({ length: level.kolom }, (_, k) => (
          <div key={k} style={{ position: "absolute", left: k * SEL, top: level.baris * SEL + 6, width: SEL, textAlign: "center" }}>
            <Angka nilai={k + 1} besar={26} />
          </div>
        ))}
        <div data-testid="kucing" data-sel={tokoh.sel.join(",")} style={{ position: "absolute", left: tokoh.sel[0] * SEL, top: tokoh.sel[1] * SEL, width: SEL, height: SEL }} />
      </div>
    </Peta3D>
  );
}

const putaran: Record<Arah, string> = { kanan: "none", kiri: "scaleX(-1)", atas: "rotate(-90deg)", bawah: "rotate(90deg)" };

/** Peta datar 2D, pengganti peta 3D kalau peramban tidak bisa menggambar 3D. */
function PetaDatar({ level, tokoh, masukRumah }: { level: LevelJalur; tokoh: Tokoh; masukRumah: boolean }) {
  const xPeta = (ukuran.lebarPanggung - level.kolom * SEL) / 2;
  const yPeta = ukuran.areaKerjaAtas + 28;
  const adaDi = (daftar: Sel[], k: number, b: number) => daftar.some(([x, y]) => x === k && y === b);
  const [dx, dy] = { kanan: [1, 0], kiri: [-1, 0], atas: [0, -1], bawah: [0, 1] }[tokoh.arah];

  return (
    <div data-testid="peta" style={{ position: "absolute", left: xPeta, top: yPeta }}>
      {Array.from({ length: level.baris }, (_, b) =>
        Array.from({ length: level.kolom }, (_, k) => (
          <div
            key={`${k}-${b}`}
            style={{
              position: "absolute",
              left: k * SEL + 3,
              top: b * SEL + 3,
              width: SEL - 6,
              height: SEL - 6,
              borderRadius: 16,
              background: adaDi(level.jalan, k, b) ? warna.jalanPasir : warna.rumputPetak,
              // Bayangan dalam gaya Kitbitz: gelap di kiri bawah, terang di kanan atas.
              boxShadow: "inset 5px -6px 0 color-mix(in srgb, var(--tinta) 8%, transparent), inset -4px 5px 0 color-mix(in srgb, var(--putih) 45%, transparent)",
            }}
          />
        )),
      )}
      {Array.from({ length: level.kolom }, (_, k) => (
        <div key={k} style={{ position: "absolute", left: k * SEL, top: level.baris * SEL + 6, width: SEL, textAlign: "center" }}>
          <Angka nilai={k + 1} besar={26} />
        </div>
      ))}
      {level.batu.map(([k, b]) => (
        <div key={`batu-${k}-${b}`} style={{ position: "absolute", left: k * SEL + 12, top: b * SEL + 12 }}>
          <Batu />
        </div>
      ))}
      <div style={{ position: "absolute", left: level.rumah[0] * SEL + 6, top: level.rumah[1] * SEL + 4 }}>
        <Rumah />
      </div>
      <div
        data-testid="kucing"
        data-sel={tokoh.sel.join(",")}
        style={{
          position: "absolute",
          left: tokoh.sel[0] * SEL + 8 + (tokoh.bentur ? dx * 22 : 0),
          top: tokoh.sel[1] * SEL + 8 + (tokoh.bentur ? dy * 22 : 0),
          transition: `left ${durasi.langkahTokoh}ms ease-in-out, top ${durasi.langkahTokoh}ms ease-in-out, opacity 400ms`,
          opacity: masukRumah ? 0 : 1,
          transform: putaran[tokoh.arah],
        }}
      >
        <Kucing />
      </div>
    </div>
  );
}
