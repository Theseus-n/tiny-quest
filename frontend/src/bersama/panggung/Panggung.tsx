import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ukuran } from "../../desain/token";
import { kursorBesar } from "../../desain/kursor";

type InfoPanggung = {
  /** Mengubah posisi layar (clientX/Y) menjadi unit panggung 1280x720. */
  keUnit: (x: number, y: number) => { x: number; y: number };
  /** Pembesaran panggung di layar, dipakai peta 3D untuk ketajaman gambar. */
  skala: number;
};

const KonteksPanggung = createContext<InfoPanggung>({ keUnit: (x, y) => ({ x, y }), skala: 1 });
export const usePanggung = () => useContext(KonteksPanggung);

/** Panggung berukuran tetap 1280x720 yang diperbesar atau diperkecil supaya pas di layar. */
export function Panggung({ children }: { children: ReactNode }) {
  const isi = useRef<HTMLDivElement>(null);
  const [skala, setSkala] = useState(1);
  const [geser, setGeser] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    const hitung = () => {
      const s = Math.min(window.innerWidth / ukuran.lebarPanggung, window.innerHeight / ukuran.tinggiPanggung);
      setSkala(s);
      setGeser({
        x: (window.innerWidth - ukuran.lebarPanggung * s) / 2,
        y: (window.innerHeight - ukuran.tinggiPanggung * s) / 2,
      });
    };
    hitung();
    window.addEventListener("resize", hitung);
    return () => window.removeEventListener("resize", hitung);
  }, []);

  const info: InfoPanggung = {
    keUnit: (x, y) => ({ x: (x - geser.x) / skala, y: (y - geser.y) / skala }),
    skala,
  };

  return (
    <KonteksPanggung.Provider value={info}>
      <div style={{ position: "fixed", inset: 0, cursor: kursorBesar }}>
        <div
          ref={isi}
          data-panggung
          data-skala={skala}
          style={{
            position: "absolute",
            left: geser.x,
            top: geser.y,
            width: ukuran.lebarPanggung,
            height: ukuran.tinggiPanggung,
            transform: `scale(${skala})`,
            transformOrigin: "0 0",
            overflow: "hidden",
            background: "var(--latar)",
          }}
        >
          {children}
        </div>
      </div>
    </KonteksPanggung.Provider>
  );
}
