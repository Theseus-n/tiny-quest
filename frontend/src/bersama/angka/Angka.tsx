import "@fontsource/andika/latin-700.css";
import type { CSSProperties } from "react";
import { warna } from "../../desain/token";

/** Satu-satunya cara memunculkan teks di layar anak: angka, dengan huruf Andika. */
export function Angka({ nilai, besar = 32, warnaAngka = warna.tinta, style }: { nilai: number; besar?: number; warnaAngka?: string; style?: CSSProperties }) {
  return (
    <span className="angka" style={{ fontSize: besar, color: warnaAngka, ...style }}>
      {nilai}
    </span>
  );
}
