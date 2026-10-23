import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Kancil, type Pose } from "../../images/Kancil";
import { Bakul, Batu, Benda, Bintang, Kucing, Rumah } from "../../images/illustrations";
import { IkonJalan, IkonMaju } from "../../images/icons";
import { GambarBlok, GambarSlot } from "../program/Block";
import { AngkaBalok, GambarBalok } from "../../games/blocks/BlockArt";
import { GambarPotongan } from "../../games/tangram/PieceArt";
import { GambarLatar, GambarTokoh } from "../../games/studio/StudioArt";
import { dengarNarator } from "../sound/audio";
import { durasi, paletStudio, warna } from "../../design/token";

const KonteksPemandu = createContext<{ pose: Pose; reaksi: (p: Pose) => void }>({ pose: "diam", reaksi: () => {} });

export const usePemandu = () => useContext(KonteksPemandu).reaksi;

export function PenyediaPemandu({ children }: { children: ReactNode }) {
  const [pose, setPose] = useState<Pose>("diam");
  const jeda = useRef<number | undefined>(undefined);

  const reaksi = useCallback((p: Pose) => {
    window.clearTimeout(jeda.current);
    setPose("diam");
    requestAnimationFrame(() => setPose(p));
    if (p !== "diam") jeda.current = window.setTimeout(() => setPose("diam"), durasi.tahanReaksi);
  }, []);

  return <KonteksPemandu.Provider value={{ pose, reaksi }}>{children}</KonteksPemandu.Provider>;
}

const kecil = (isi: ReactNode, skala: number, lebar: number, tinggi: number) => (
  <div style={{ width: lebar * skala, height: tinggi * skala }}>
    <div style={{ transform: `scale(${skala})`, transformOrigin: "top left" }}>{isi}</div>
  </div>
);
const panah = <IkonMaju warnaIkon={warna.tinta} besar={30} />;

// Gambar di gelembung bicara untuk setiap kalimat. Gambar, bukan tulisan, karena anak belum bisa membaca.
const isiGelembung: Record<string, ReactNode> = {
  "jalur.tugas": (
    <>
      <Kucing lebar={56} />
      {panah}
      <Rumah lebar={56} />
    </>
  ),
  "jalur.cara": (
    <>
      {kecil(<GambarBlok blok={{ jenis: "maju" }} />, 0.6, 104, 88)}
      {panah}
      {kecil(<GambarSlot />, 0.6, 104, 88)}
    </>
  ),
  "jalur.jalan": <IkonJalan besar={60} />,
  "jalur.coba-banyak": <Bintang lebar={56} />,
  "jalur.putar": kecil(<GambarBlok blok={{ jenis: "putar-kanan" }} />, 0.7, 104, 88),
  "jalur.putar-arah": (
    <>
      {kecil(<GambarBlok blok={{ jenis: "putar-kiri" }} />, 0.6, 104, 88)}
      {kecil(<GambarBlok blok={{ jenis: "putar-kanan" }} />, 0.6, 104, 88)}
    </>
  ),
  "jalur.lompat": (
    <>
      <Batu lebar={44} />
      {kecil(<GambarBlok blok={{ jenis: "lompat" }} />, 0.6, 104, 88)}
    </>
  ),
  "jalur.ulangi": (
    <>
      {kecil(<GambarBlok blok={{ jenis: "ulangi", kali: 4 }} />, 0.6, 104, 88)}
      {kecil(<GambarBlok blok={{ jenis: "maju" }} />, 0.6, 104, 88)}
    </>
  ),
  "tirai.kelompok": (
    <>
      <Benda jenis="ikan" lebar={30} />
      <Benda jenis="ikan" lebar={30} />
      <Benda jenis="ikan" lebar={30} />
      <div style={{ width: 14 }} />
      <Benda jenis="ikan" lebar={30} />
      <Benda jenis="ikan" lebar={30} />
      <Benda jenis="ikan" lebar={30} />
    </>
  ),
  "galat.ganti": (
    <>
      {kecil(<GambarBlok blok={{ jenis: "putar-kiri" }} menyala />, 0.6, 104, 88)}
      {panah}
      {kecil(<GambarBlok blok={{ jenis: "putar-kanan" }} />, 0.6, 104, 88)}
    </>
  ),
  "balok.angka": (
    <>
      {kecil(<AngkaBalok nilai={3} />, 0.8, 52, 52)}
      {kecil(<GambarBalok nilai={3} />, 0.45, 264, 88)}
    </>
  ),
  "jalur.berhasil": <Bintang lebar={56} />,
  "tirai.tugas": (
    <>
      <Benda jenis="rambutan" lebar={40} />
      <Benda jenis="rambutan" lebar={40} />
      <Benda jenis="rambutan" lebar={40} />
    </>
  ),
  "tirai.pilih": <Bakul lebar={90} tinggi={56} />,
  "tirai.berhasil": <Bintang lebar={56} />,
  "galat.tugas": (
    <>
      {kecil(<GambarBlok blok={{ jenis: "maju" }} />, 0.6, 104, 88)}
      {kecil(<GambarBlok blok={{ jenis: "putar-kiri" }} menyala />, 0.6, 104, 88)}
      {kecil(<GambarBlok blok={{ jenis: "maju" }} />, 0.6, 104, 88)}
    </>
  ),
  "galat.coba": <IkonJalan besar={60} />,
  "galat.cabut": (
    <>
      {kecil(<GambarBlok blok={{ jenis: "putar-kiri" }} menyala />, 0.6, 104, 88)}
      {panah}
      {kecil(<GambarSlot />, 0.6, 104, 88)}
    </>
  ),
  "galat.berhasil": <Bintang lebar={56} />,
  "balok.tugas": (
    <>
      <Kucing lebar={56} />
      {panah}
      <Rumah lebar={56} />
    </>
  ),
  "balok.cara": (
    <>
      {kecil(<GambarBalok nilai={3} />, 0.4, 264, 88)}
      {panah}
      <svg width={70} height={36} viewBox="0 0 70 36" aria-hidden>
        <rect x="0" y="4" width="70" height="32" fill={warna.air} />
        <path d="M8 20 q8 -6 16 0 t16 0 t16 0" fill="none" stroke={warna.airGelap} strokeWidth={4} strokeLinecap="round" />
      </svg>
    </>
  ),
  "balok.susun": (
    <>
      {kecil(<GambarBalok nilai={2} />, 0.4, 176, 88)}
      {kecil(<GambarBalok nilai={3} />, 0.4, 264, 88)}
      {panah}
      {kecil(<GambarBalok nilai={5} />, 0.4, 440, 88)}
    </>
  ),
  "balok.potong": (
    <div style={{ position: "relative" }}>
      {kecil(<GambarBalok nilai={6} />, 0.4, 528, 88)}
      <svg width={12} height={44} viewBox="0 0 12 44" style={{ position: "absolute", left: 4 * 0.4 * 88 - 6, top: -4 }} aria-hidden>
        <line x1="6" y1="2" x2="6" y2="42" stroke={warna.tinta} strokeWidth={4} strokeDasharray="5 4" strokeLinecap="round" />
      </svg>
    </div>
  ),
  "balok.berhasil": <Bintang lebar={56} />,
  "tangram.tugas": (
    <>
      {kecil(<GambarPotongan jenis="segitiga-besar" sudut={0} />, 0.35, 226, 226)}
      {panah}
      <svg width={56} height={56} viewBox="0 0 56 56" aria-hidden>
        <rect x="4" y="4" width="48" height="48" fill={warna.bayangan} stroke={warna.tinta} strokeWidth={2.5} strokeDasharray="6 5" />
      </svg>
    </>
  ),
  "tangram.cara": (
    <>
      {kecil(<GambarPotongan jenis="persegi" sudut={0} />, 0.5, 113, 113)}
      {panah}
      <svg width={56} height={56} viewBox="0 0 56 56" aria-hidden>
        <rect x="4" y="4" width="48" height="48" fill={warna.bayangan} />
      </svg>
    </>
  ),
  "tangram.putar": (
    <>
      {kecil(<GambarPotongan jenis="segitiga-besar" sudut={0} />, 0.3, 226, 226)}
      {panah}
      {kecil(<GambarPotongan jenis="segitiga-besar" sudut={45} />, 0.3, 226, 226)}
    </>
  ),
  "tangram.tanpa-garis": <Bintang lebar={56} />,
  "tangram.berhasil": <Bintang lebar={56} />,
  "studio.tugas": (
    <>
      <GambarTokoh jenis="kucing" warnaBadan={paletStudio[0]} lebar={56} />
      {panah}
      <GambarLatar latar="taman" lebar={90} />
    </>
  ),
  "studio.pemicu": (
    <>
      <GambarTokoh jenis="kucing" warnaBadan={paletStudio[0]} lebar={52} />
      <div style={{ marginLeft: -16 }}>
        <GambarTokoh jenis="bola" warnaBadan={paletStudio[1]} lebar={44} />
      </div>
    </>
  ),
  "studio.sasaran": (
    <div style={{ borderRadius: "50%", outline: `4px dashed ${warna.blokPemicuAlas}`, padding: 4 }}>
      <GambarTokoh jenis="bola" warnaBadan={paletStudio[1]} lebar={48} />
    </div>
  ),
  "studio.seru": <Bintang lebar={56} />,
  "umum.semangat": (
    <>
      <Bintang lebar={48} />
      <Bintang lebar={48} />
    </>
  ),
};

/** Tiga titik bergantian: tanda Si Kancil sedang berbicara, untuk kalimat tanpa gambar. */
function TitikBicara() {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: warna.tinta, animation: `mulut 400ms ${i * 130}ms ease-in-out infinite alternate` }} />
      ))}
    </div>
  );
}

/**
 * Si Kancil di pojok kanan atas. Tidak bisa diklik dan tidak pernah menutupi area kerja.
 * Selama narator berbicara, mulutnya bergerak dan gelembung bicara muncul di sebelah kirinya.
 */
export function Pemandu() {
  const { pose } = useContext(KonteksPemandu);
  const [kalimat, setKalimat] = useState<string | null>(null);
  useEffect(() => dengarNarator(setKalimat), []);

  return (
    <>
      {kalimat && (
        <div
          key={kalimat}
          className="muncul"
          data-testid="gelembung"
          data-kalimat={kalimat}
          style={{
            position: "absolute",
            right: 132,
            top: 10,
            height: 92,
            minWidth: 120,
            padding: "0 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: warna.panggung,
            borderRadius: 28,
            boxShadow: "0 5px 0 color-mix(in srgb, var(--tinta) 14%, transparent)",
            transformOrigin: "right center",
            pointerEvents: "none",
            zIndex: 25,
          }}
        >
          {isiGelembung[kalimat] ?? <TitikBicara />}
          <div
            style={{
              position: "absolute",
              right: -12,
              top: 34,
              width: 20,
              height: 20,
              background: warna.panggung,
              borderRadius: 3,
              transform: "rotate(45deg)",
            }}
          />
        </div>
      )}
      <div data-testid="pemandu" style={{ position: "absolute", right: 24, top: 2, pointerEvents: "none" }}>
        <Kancil pose={pose} lebar={92} bicara={kalimat !== null} />
      </div>
    </>
  );
}
