import type { ReactNode } from "react";
import { warna } from "../design/token";

type Props = { warnaIkon: string; besar?: number };

const tebal = 7;

export function IkonMaju({ warnaIkon, besar = 48 }: Props) {
  return (
    <svg width={besar} height={besar} viewBox="0 0 48 48" aria-hidden>
      <path d="M6 24 L36 24 M26 12 L38 24 L26 36" fill="none" stroke={warnaIkon} strokeWidth={tebal} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IkonPutar({ warnaIkon, besar = 48, arah }: Props & { arah: "kiri" | "kanan" }) {
  const cermin = arah === "kiri" ? "translate(48 0) scale(-1 1)" : undefined;
  return (
    <svg width={besar} height={besar} viewBox="0 0 48 48" aria-hidden>
      <g transform={cermin} fill="none" stroke={warnaIkon} strokeWidth={tebal} strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 38 L10 26 Q10 12 24 12 L34 12" />
        <path d="M28 4 L36 12 L28 20" />
      </g>
    </svg>
  );
}

export function IkonLompat({ warnaIkon, besar = 48 }: Props) {
  return (
    <svg width={besar} height={besar} viewBox="0 0 48 48" aria-hidden>
      <g fill="none" stroke={warnaIkon} strokeWidth={tebal} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 40 Q22 2 40 36" />
        <path d="M30 34 L40 38 L42 27" />
      </g>
    </svg>
  );
}

export function IkonUlangi({ warnaIkon, besar = 48 }: Props) {
  return (
    <svg width={besar} height={besar} viewBox="0 0 48 48" aria-hidden>
      <g fill="none" stroke={warnaIkon} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M40 24 A16 16 0 1 1 30 9" />
        <path d="M24 3 L32 9 L25 16" />
      </g>
    </svg>
  );
}

/** Titik dadu 2 sampai 4: jumlah ulangan di blok Ulangi. */
export function TitikDadu({ jumlah, warnaTitik, besar = 30 }: { jumlah: number; warnaTitik: string; besar?: number }) {
  const pola: Record<number, [number, number][]> = {
    1: [[15, 15]],
    2: [[8, 8], [22, 22]],
    3: [[7, 7], [15, 15], [23, 23]],
    4: [[8, 8], [22, 8], [8, 22], [22, 22]],
  };
  return (
    <svg width={besar} height={besar} viewBox="0 0 30 30" aria-hidden>
      {pola[jumlah].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4.5} fill={warnaTitik} />
      ))}
    </svg>
  );
}

/** Tombol jalan: bulatan hijau dengan alas 3D dan segitiga putih (3,4 : 1 di atas hijau). */
export function IkonJalan({ besar = 96 }: { besar?: number }) {
  return (
    <svg width={besar} height={besar} viewBox="0 0 96 96" style={{ overflow: "visible" }} aria-hidden>
      <circle cx="48" cy="53" r="43" fill={warna.aksenJalanAlas} />
      <circle cx="48" cy="47" r="43" fill={warna.aksenJalan} filter="url(#lembut)" />
      <path d="M40 29 Q37 27 37 31 L37 63 Q37 67 40 65 L66 50 Q69 48 66 46 Z" fill={warna.putih} />
    </svg>
  );
}

/** Tombol lanjut di pop-up selamat: bentuk sama dengan tombol jalan, dengan panah ke kanan. */
export function IkonLanjut({ besar = 120 }: { besar?: number }) {
  return (
    <svg width={besar} height={besar} viewBox="0 0 96 96" style={{ overflow: "visible" }} aria-hidden>
      <circle cx="48" cy="53" r="43" fill={warna.aksenJalanAlas} />
      <circle cx="48" cy="47" r="43" fill={warna.aksenJalan} filter="url(#lembut)" />
      <path d="M28 47 H64 M50 32 L66 47 L50 62" fill="none" stroke={warna.putih} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Tombol terang bulat: putih dengan tepi `warna.tepi` (3,6 : 1 di atas latar) dan alas 3D. */
export function TombolBulat({ besar = 88, gelap = false, children }: { besar?: number; gelap?: boolean; children?: ReactNode }) {
  return (
    <svg width={besar} height={besar} viewBox="0 0 88 88" style={{ overflow: "visible" }} aria-hidden>
      <circle cx="44" cy="48" r="40" fill={gelap ? warna.tinta : warna.tepi} />
      <circle cx="44" cy="43" r="38.5" fill={gelap ? warna.tinta : warna.putih} stroke={gelap ? warna.tinta : warna.tepi} strokeWidth={3} />
      {children}
    </svg>
  );
}

export function IkonKembali({ besar = 88 }: { besar?: number }) {
  return (
    <TombolBulat besar={besar}>
      <path d="M24 44 Q22 42 24 40 L41 25 Q44 22.5 47 25 L64 40 Q66 42 64 44 L60 44 L60 60 Q60 64 56 64 L32 64 Q28 64 28 60 L28 44 Z" fill={warna.genteng} filter="url(#lembut-kecil)" />
      <rect x="39" y="50" width="10" height="14" rx="3" fill={warna.krem} />
    </TombolBulat>
  );
}
