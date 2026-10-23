import type { PointerEvent } from "react";
import { Klik } from "../input/Click";
import { GambarBlok, GambarSlot, LEBAR_BLOK, TINGGI_BLOK } from "./Block";
import { IkonJalan } from "../../images/icons";
import { ukuran } from "../../design/token";
import type { Blok, Program } from "./kinds";

const JARAK_SLOT = 24;
const JARAK_PALET = 32;
export const Y_SLOT = ukuran.barisTengahAtas + 16;
export const Y_PALET = ukuran.barisBawahAtas + 16;
export const TOMBOL_JALAN = 96;

export const xSlot = (jumlah: number, i: number) => {
  const lebar = jumlah * LEBAR_BLOK + (jumlah - 1) * JARAK_SLOT;
  return (ukuran.lebarPanggung - lebar) / 2 + i * (LEBAR_BLOK + JARAK_SLOT);
};
export const xPalet = (jumlah: number, i: number) => {
  const lebar = jumlah * LEBAR_BLOK + (jumlah - 1) * JARAK_PALET;
  return (ukuran.lebarPanggung - TOMBOL_JALAN - 48 - lebar) / 2 + i * (LEBAR_BLOK + JARAK_PALET);
};
export const xJalan = ukuran.lebarPanggung - 24 - TOMBOL_JALAN;
export const yJalan = ukuran.barisBawahAtas + 8;

export type Dipegang = { asal: "palet" | "slot"; blok: Blok; indeks: number };

type Props = {
  program: Program;
  aktif: number[];
  palet: Blok[];
  dipegang: Dipegang | null;
  hantu: { benda: Dipegang; x: number; y: number } | null;
  berjalan: boolean;
  onKlikSlot: (i: number) => void;
  onKlikPalet: (i: number) => void;
  onSeret: (benda: Dipegang, e: PointerEvent<HTMLDivElement>) => void;
  onJalan: () => void;
};

/** Slot program di baris tengah, blok pilihan di baris bawah, dan tombol jalan. Sama di semua permainan coding. */
export function PapanProgram({ program, aktif, palet, dipegang, hantu, berjalan, onKlikSlot, onKlikPalet, onSeret, onJalan }: Props) {
  return (
    <>
      {program.map((blok, i) => (
        <Klik
          key={`slot-${i}`}
          x={xSlot(program.length, i)}
          y={Y_SLOT}
          lebar={LEBAR_BLOK}
          tinggi={TINGGI_BLOK}
          tujuan={`slot-${i}`}
          ujiId={`slot-${i + 1}`}
          onKlik={() => onKlikSlot(i)}
          onPointerDown={blok && !berjalan ? (e) => onSeret({ asal: "slot", blok, indeks: i }, e) : undefined}
        >
          {blok ? <GambarBlok blok={blok} menyala={aktif.includes(i)} /> : <GambarSlot />}
        </Klik>
      ))}

      {palet.map((blok, i) => (
        <Klik
          key={`palet-${i}-${blok.jenis}`}
          x={xPalet(palet.length, i)}
          y={Y_PALET}
          lebar={LEBAR_BLOK}
          tinggi={TINGGI_BLOK}
          ujiId={`palet-${blok.jenis}`}
          dipegang={dipegang?.asal === "palet" && dipegang.indeks === i}
          onKlik={() => onKlikPalet(i)}
          onPointerDown={!berjalan ? (e) => onSeret({ asal: "palet", blok, indeks: i }, e) : undefined}
        >
          <GambarBlok blok={blok} />
        </Klik>
      ))}

      <Klik x={xJalan} y={yJalan} lebar={TOMBOL_JALAN} tinggi={TOMBOL_JALAN} ujiId="jalan" onKlik={onJalan}>
        <IkonJalan besar={TOMBOL_JALAN} />
      </Klik>

      {hantu && (
        <div className="dipegang" style={{ position: "absolute", left: hantu.x - LEBAR_BLOK / 2, top: hantu.y - TINGGI_BLOK / 2, pointerEvents: "none", zIndex: 30 }}>
          <GambarBlok blok={hantu.benda.blok} />
        </div>
      )}
    </>
  );
}
