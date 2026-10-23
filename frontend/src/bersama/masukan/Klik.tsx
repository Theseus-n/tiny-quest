import type { CSSProperties, PointerEvent, ReactNode } from "react";

type Props = {
  onKlik?: () => void;
  onPointerDown?: (e: PointerEvent<HTMLDivElement>) => void;
  x: number;
  y: number;
  lebar: number;
  tinggi: number;
  dipegang?: boolean;
  tujuan?: string;
  ujiId?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * Pembungkus untuk setiap benda yang bisa diklik di layar anak.
 * Atribut data-klik dipakai uji otomatis untuk memeriksa ukuran minimal 88 unit.
 * Benda tidak bersuara saat mouse lewat: narator hanya memberi petunjuk awal, pujian, dan semangat.
 */
export function Klik({ onKlik, onPointerDown, x, y, lebar, tinggi, dipegang, tujuan, ujiId, style, children }: Props) {
  return (
    <div
      className={`klik${dipegang ? " dipegang" : ""}`}
      data-klik
      data-tujuan={tujuan}
      data-testid={ujiId}
      onPointerDown={onPointerDown}
      onClick={(e) => {
        e.stopPropagation();
        onKlik?.();
      }}
      style={{ position: "absolute", left: x, top: y, width: lebar, height: tinggi, ...style }}
    >
      {children}
    </div>
  );
}
