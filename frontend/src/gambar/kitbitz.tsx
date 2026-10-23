import type { CSSProperties } from "react";

// Gambar Kitbitz (CC0, lihat konten/gambar/kitbitz/SUMBER.md) ditanam di bundel sebagai data URL,
// sama seperti suara narator, supaya tidak ada permintaan file saat anak bermain.
const berkas = import.meta.glob("../../konten/gambar/kitbitz/*.svg", { eager: true, query: "?inline", import: "default" }) as Record<string, string>;

const gambar = new Map(Object.entries(berkas).map(([jalur, url]) => [jalur.split("/").pop()!.replace(/\.svg$/, ""), url]));

export type NamaKitbitz =
  | "pohon-senyum"
  | "semak-senyum"
  | "pohon-rimbun"
  | "semak-bulat"
  | "pohon-kelapa"
  | "awan"
  | "rumput"
  | "bunga"
  | "batu"
  | "batu-sungai"
  | "daun-teratai"
  | "jamur"
  | "kayu"
  | "ikan";

export const urlKitbitz = (nama: NamaKitbitz) => gambar.get(nama)!;

/** Satu gambar Kitbitz selebar `lebar`, tingginya mengikuti perbandingan aslinya. */
export function Kitbitz({ nama, lebar, style }: { nama: NamaKitbitz; lebar: number; style?: CSSProperties }) {
  return <img src={urlKitbitz(nama)} alt="" draggable={false} width={lebar} style={{ display: "block", height: "auto", pointerEvents: "none", ...style }} />;
}
