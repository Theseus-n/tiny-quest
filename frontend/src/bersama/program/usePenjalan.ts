import { useEffect, useRef, useState } from "react";
import { jalankan, type Langkah } from "./penjalan";
import type { Arah, LevelJalur, Program, Sel } from "./jenis";
import { usePemandu } from "../pemandu/Pemandu";
import { bunyi } from "../suara/audio";
import { durasi } from "../../desain/token";

export type Tokoh = { sel: Sel; arah: Arah; bentur: boolean };

/**
 * Menjalankan program di panggung berkotak, dipakai Penjelajah Jalur dan Detektif Galat.
 * Saat gagal: tokoh pemandu menggaruk kepala, tokoh kembali ke awal, program tetap utuh,
 * dan blok yang aktif saat gagal tetap menyala sebagai petunjuk.
 */
export function usePenjalan(level: LevelJalur) {
  const reaksi = usePemandu();
  const awal = (): Tokoh => ({ sel: level.mulai.sel, arah: level.mulai.arah, bentur: false });
  const [tokoh, setTokoh] = useState<Tokoh>(awal);
  const [aktif, setAktif] = useState<number[]>([]);
  const [berjalan, setBerjalan] = useState(false);
  const [masukRumah, setMasukRumah] = useState(false);
  const jeda = useRef<number[]>([]);

  const bersihkan = () => {
    jeda.current.forEach((j) => window.clearTimeout(j));
    jeda.current = [];
  };
  const nanti = (ms: number, f: () => void) => jeda.current.push(window.setTimeout(f, ms));

  const ulangDariAwal = () => {
    bersihkan();
    setTokoh(awal());
    setAktif([]);
    setBerjalan(false);
    setMasukRumah(false);
  };
  useEffect(() => bersihkan, []);

  const jalankanProgram = (program: Program, { onBerhasil, onGagal }: { onBerhasil: () => void; onGagal?: () => void }) => {
    if (berjalan) return;
    bunyi("klik");
    setBerjalan(true);
    setTokoh(awal());
    const it = jalankan(level, program);

    const gagal = (blokSalah: number[] = []) => {
      bunyi("cobaLagi");
      reaksi("garuk");
      onGagal?.();
      setAktif(blokSalah);
      nanti(900, () => {
        setTokoh(awal());
        setBerjalan(false);
      });
    };

    const langkah = () => {
      const r = it.next();
      if (r.done) {
        setAktif([]);
        if (!r.value.berhasil) return gagal();
        setMasukRumah(true);
        bunyi("benar");
        reaksi("tepuk");
        onBerhasil();
        nanti(600, () => setBerjalan(false));
        return;
      }
      const l: Langkah = r.value;
      setAktif(l.aktif);
      if (l.kejadian === "tabrak" || l.kejadian === "keluar") {
        setTokoh((t) => ({ ...t, bentur: true }));
        nanti(durasi.langkahTokoh, () => gagal(l.aktif));
        return;
      }
      setTokoh({ sel: l.sel, arah: l.arah, bentur: false });
      nanti(durasi.langkahTokoh + 150, langkah);
    };
    nanti(250, langkah);
  };

  return { tokoh, aktif, setAktif, berjalan, masukRumah, jalankanProgram, ulangDariAwal };
}
