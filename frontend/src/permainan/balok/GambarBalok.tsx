import { Angka } from "../../bersama/angka/Angka";
import { warna, warnaAlas, warnaBilangan } from "../../desain/token";

/** Satu satuan panjang balok. Balok n tepat n kali balok 1. */
export const SATUAN = 88;
export const LEBAR_ANGKA = 64;
const ALAS = 6;

/**
 * Balok bilangan n, gaya Kitbitz: warna tetap bilangannya dengan bayangan lembut dan alas 3D,
 * dan satu titik di setiap satuan. Pemisah setelah satuan ke-5 lebih tegas,
 * supaya 6 sampai 10 terbaca sebagai "lima dan sisanya".
 */
export function GambarBalok({ nilai, transparan = false }: { nilai: number; transparan?: boolean }) {
  const { isi, angka } = warnaBilangan[nilai];
  const lebar = nilai * SATUAN;
  return (
    <svg width={lebar} height={SATUAN} viewBox={`0 0 ${lebar} ${SATUAN}`} data-nilai={nilai} style={{ opacity: transparan ? 0.75 : 1, overflow: "visible" }} aria-hidden>
      <rect x="2" y={2 + ALAS} width={lebar - 4} height={SATUAN - 4 - ALAS} rx="16" fill={warnaAlas(isi)} />
      <rect x="2" y="2" width={lebar - 4} height={SATUAN - 4 - ALAS} rx="16" fill={isi} filter="url(#lembut)" />
      {Array.from({ length: nilai - 1 }, (_, i) => (
        <line key={i} x1={(i + 1) * SATUAN} y1="14" x2={(i + 1) * SATUAN} y2={SATUAN - 20} stroke={warna.tinta} strokeOpacity={i === 4 ? 0.5 : 0.14} strokeWidth={i === 4 ? 4 : 3} strokeLinecap="round" />
      ))}
      {Array.from({ length: nilai }, (_, i) => (
        <circle key={i} cx={i * SATUAN + SATUAN / 2} cy={(SATUAN - ALAS) / 2} r="13" fill={angka} />
      ))}
    </svg>
  );
}

/** Angka di samping pola titik, hanya di level angka: koin bulat berwarna bilangannya. */
export function AngkaBalok({ nilai }: { nilai: number }) {
  const { isi, angka } = warnaBilangan[nilai];
  return (
    <div
      style={{
        width: LEBAR_ANGKA - 12,
        height: LEBAR_ANGKA - 12,
        borderRadius: "50%",
        background: isi,
        boxShadow: `0 5px 0 ${warnaAlas(isi)}, inset 3px -4px 0 color-mix(in srgb, var(--tinta) 10%, transparent)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Angka nilai={nilai} besar={30} warnaAngka={angka} />
    </div>
  );
}
