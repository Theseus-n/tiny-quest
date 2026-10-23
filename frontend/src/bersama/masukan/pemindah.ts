import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { usePanggung } from "../panggung/Panggung";

const AMBANG_SERET = 10;

type Hantu<T> = { benda: T; x: number; y: number };

/**
 * Dua cara memindahkan benda yang dipakai semua permainan:
 * klik benda lalu klik tujuan, atau seret benda ke tujuan.
 * Tujuan ditandai dengan atribut data-tujuan.
 */
export function usePemindah<T>(onLepas: (benda: T, tujuan: string | null, titik: { x: number; y: number }) => void) {
  const { keUnit } = usePanggung();
  const [dipegang, setDipegang] = useState<T | null>(null);
  const [hantu, setHantu] = useState<Hantu<T> | null>(null);
  const baruSaja = useRef(0);
  const onLepasRef = useRef(onLepas);
  onLepasRef.current = onLepas;

  // Klik yang menyusul akhir seretan diabaikan, supaya tidak dianggap klik biasa.
  useEffect(() => {
    const tahan = (e: MouseEvent) => {
      if (performance.now() - baruSaja.current < 80) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    window.addEventListener("click", tahan, { capture: true });
    return () => window.removeEventListener("click", tahan, { capture: true });
  }, []);

  const mulaiSeret = useCallback(
    (benda: T, e: PointerEvent) => {
      if (e.button !== 0) return;
      const awal = { x: e.clientX, y: e.clientY };
      let menyeret = false;

      const gerak = (ev: globalThis.PointerEvent) => {
        if (!menyeret && Math.hypot(ev.clientX - awal.x, ev.clientY - awal.y) > AMBANG_SERET) {
          menyeret = true;
          setDipegang(null);
        }
        if (menyeret) setHantu({ benda, ...keUnit(ev.clientX, ev.clientY) });
      };
      const selesai = (ev: globalThis.PointerEvent) => {
        window.removeEventListener("pointermove", gerak);
        window.removeEventListener("pointerup", selesai);
        if (!menyeret) return;
        baruSaja.current = performance.now();
        setHantu(null);
        const di = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-tujuan]");
        // Titik jatuh dalam unit panggung, untuk benda yang diletakkan tepat di tempat dilepas (potongan tangram).
        onLepasRef.current(benda, di?.getAttribute("data-tujuan") ?? null, keUnit(ev.clientX, ev.clientY));
      };
      window.addEventListener("pointermove", gerak);
      window.addEventListener("pointerup", selesai);
    },
    [keUnit],
  );

  return {
    dipegang,
    pegang: (benda: T | null) => setDipegang(benda),
    lepaskan: () => setDipegang(null),
    mulaiSeret,
    hantu,
  };
}
