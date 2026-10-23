import type { CSSProperties, ReactElement } from "react";
import { Klik } from "../shared/input/Click";
import { bunyi } from "../shared/sound/audio";
import { Pemandu } from "../shared/guide/Guide";
import { Benda, DaunPisang, Kucing, Rumah } from "../images/illustrations";
import { GambarBlok } from "../shared/program/Block";
import { GambarBalok } from "../games/blocks/BlockArt";
import { GambarLatar, GambarTokoh } from "../games/studio/StudioArt";
import { paletStudio, ukuran, warna } from "../design/token";
import { JUDUL_PILIH_PERMAINAN } from "./titleText";
import { Judul } from "./Title";
import type { NamaPermainan } from "../storage/storage";

// Papan petunjuk berjajar dalam satu baris di dasar taman, supaya latar tetap kelihatan.
const LEBAR = 164;
const TINGGI = 168;
const JARAK = 28;
const ATAS = 546;
const TINGGI_PAPAN = 116;
const SKALA_GAMBAR = 0.42;

function GambarJalur() {
  return (
    <div style={{ position: "relative", width: 320, height: 200 }}>
      {[0, 1, 2].map((k) => (
        <div key={k} style={{ position: "absolute", left: k * 100 + 12, top: 72, width: 96, height: 96, borderRadius: 18, background: warna.jalanPasir, boxShadow: "inset 5px -6px 0 color-mix(in srgb, var(--tinta) 8%, transparent)" }} />
      ))}
      <div style={{ position: "absolute", left: 18, top: 78 }}>
        <Kucing lebar={84} />
      </div>
      <div style={{ position: "absolute", left: 220, top: 76 }}>
        <Rumah lebar={88} />
      </div>
    </div>
  );
}

function GambarTirai() {
  return (
    <div style={{ position: "relative", width: 320, height: 200 }}>
      <div style={{ position: "absolute", left: 40, top: 110, display: "flex", gap: 24 }}>
        <Benda jenis="rambutan" lebar={64} />
        <Benda jenis="rambutan" lebar={64} />
        <Benda jenis="rambutan" lebar={64} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 10 }}>
        <DaunPisang lebar={320} tinggi={110} />
      </div>
    </div>
  );
}

/** Kaca pembesar di atas deretan blok: mencari blok yang salah. */
function GambarGalat() {
  return (
    <div style={{ position: "relative", width: 320, height: 200 }}>
      <div style={{ position: "absolute", left: 4, top: 70, display: "flex", gap: 2, transform: "scale(0.95)", transformOrigin: "left" }}>
        <GambarBlok blok={{ jenis: "maju" }} />
        <GambarBlok blok={{ jenis: "putar-kiri" }} menyala />
        <GambarBlok blok={{ jenis: "maju" }} />
      </div>
      {/* Kaca pembesar gaya Kitbitz: gagang kayu, bingkai lembut, kaca biru muda tembus pandang. */}
      <svg width={140} height={140} viewBox="0 0 140 140" style={{ position: "absolute", left: 120, top: 30, overflow: "visible" }} aria-hidden>
        <path d="M92 92 L126 126" stroke={warna.kancilGelap} strokeWidth={18} strokeLinecap="round" />
        <circle cx="58" cy="58" r="44" fill={warna.langit} fillOpacity={0.45} stroke={warna.syal} strokeWidth={12} />
        <path d="M34 44 Q40 32 52 28" fill="none" stroke={warna.putih} strokeOpacity={0.8} strokeWidth={6} strokeLinecap="round" />
      </svg>
    </div>
  );
}

/** Tiga balok bertingkat. */
function GambarBalokBilangan() {
  return (
    <div style={{ position: "relative", width: 320, height: 200, transform: "scale(0.6)", transformOrigin: "top left" }}>
      {[3, 2, 1].map((n, i) => (
        <div key={n} style={{ position: "absolute", left: 20, top: 20 + i * 100 }}>
          <GambarBalok nilai={n + 2} />
        </div>
      ))}
    </div>
  );
}

/** Rumah dari tiga potongan tangram: atap segitiga besar, badan persegi, dan segitiga kecil sebagai bendera. */
function GambarTangram() {
  return (
    <svg width={320} height={200} viewBox="0 0 320 200" aria-hidden style={{ display: "block" }}>
      <path d="M160 22 L262 104 L58 104 Z" fill={warna.potonganBesar} stroke={warna.potonganBesar} strokeWidth={10} strokeLinejoin="round" />
      <rect x={86} y={112} width={104} height={74} rx={8} fill={warna.potonganPersegi} stroke={warna.potonganPersegi} strokeWidth={8} strokeLinejoin="round" />
      <path d="M204 186 L204 128 L262 186 Z" fill={warna.potonganKecil} stroke={warna.potonganKecil} strokeWidth={8} strokeLinejoin="round" />
      <path d="M118 52 Q130 36 150 32" fill="none" stroke={warna.putih} strokeOpacity={0.55} strokeWidth={7} strokeLinecap="round" />
    </svg>
  );
}

/** Kucing dan bola di panggung taman. */
function GambarStudioKreasi() {
  return (
    <div style={{ position: "relative", width: 320, height: 200, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0 }}>
        <GambarLatar latar="taman" lebar={450} />
      </div>
      <div style={{ position: "absolute", left: 50, top: 70 }}>
        <GambarTokoh jenis="kucing" warnaBadan={paletStudio[0]} lebar={100} />
      </div>
      <div style={{ position: "absolute", left: 190, top: 92 }}>
        <GambarTokoh jenis="bola" warnaBadan={paletStudio[1]} lebar={80} />
      </div>
    </div>
  );
}

// Setiap permainan punya warna aksen sendiri untuk bingkai gambar di papannya.
const permainan: { nama: NamaPermainan | "studio"; Gambar: () => ReactElement; aksen: string }[] = [
  { nama: "jalur", Gambar: GambarJalur, aksen: warna.aksenJalan },
  { nama: "tirai", Gambar: GambarTirai, aksen: warna.rambutan },
  { nama: "galat", Gambar: GambarGalat, aksen: warna.blokGerak },
  { nama: "balok", Gambar: GambarBalokBilangan, aksen: warna.blokKontrol },
  { nama: "tangram", Gambar: GambarTangram, aksen: warna.potonganBesar },
  { nama: "studio", Gambar: GambarStudioKreasi, aksen: warna.potonganPersegi },
];

function Paku({ style }: { style: CSSProperties }) {
  return <div style={{ position: "absolute", width: 9, height: 9, borderRadius: "50%", background: warna.kayuGelap, ...style }} />;
}

/** Papan kayu bertiang dengan gambar permainan di dalam bingkai berwarna. */
function Papan({ Gambar, aksen, miring }: { Gambar: () => ReactElement; aksen: string; miring: number }) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ position: "absolute", left: LEBAR / 2 - 14, top: TINGGI_PAPAN - 8, width: 28, height: TINGGI - TINGGI_PAPAN + 8, borderRadius: "0 0 8px 8px", background: `linear-gradient(90deg, ${warna.kayu}, ${warna.kayuTerang} 45%, ${warna.kayu})`, borderLeft: `var(--garis) solid ${warna.kayuGelap}`, borderRight: `var(--garis) solid ${warna.kayuGelap}` }} />
      <div style={{ position: "absolute", left: 18, top: TINGGI - 8, width: LEBAR - 36, height: 12, borderRadius: "50%", background: warna.rumputPetak, opacity: 0.9 }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: LEBAR,
          height: TINGGI_PAPAN,
          transform: `rotate(${miring}deg)`,
          borderRadius: 24,
          background: `linear-gradient(180deg, ${warna.kayuTerang}, ${warna.kayu})`,
          border: `var(--garis) solid ${warna.kayuGelap}`,
          boxShadow: `0 7px 0 ${warna.kayuGelap}`,
        }}
      >
        <Paku style={{ left: 7, top: 7 }} />
        <Paku style={{ right: 7, top: 7 }} />
        <Paku style={{ left: 7, bottom: 7 }} />
        <Paku style={{ right: 7, bottom: 7 }} />
        <div
          style={{
            position: "absolute",
            inset: 12,
            borderRadius: 16,
            overflow: "hidden",
            background: `color-mix(in srgb, ${aksen} 26%, ${warna.putih})`,
            border: `var(--garis) solid ${aksen}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "relative", width: 320 * SKALA_GAMBAR, height: 200 * SKALA_GAMBAR }}>
            <div style={{ position: "absolute", left: 0, top: 0, transform: `scale(${SKALA_GAMBAR})`, transformOrigin: "0 0" }}>
              <Gambar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Judul di atas (taman 3D di belakangnya dipasang App), satu baris, dan satu baris papan petunjuk di bawah. */
export function LayarAwal({ onPilih }: { onPilih: (p: NamaPermainan | "studio") => void }) {
  const lebarSemua = permainan.length * LEBAR + (permainan.length - 1) * JARAK;
  return (
    <>
      <Judul teks={JUDUL_PILIH_PERMAINAN} ujiId="judul" />
      <Pemandu />
      {permainan.map(({ nama, Gambar, aksen }, i) => (
        <Klik
          key={nama}
          x={(ukuran.lebarPanggung - lebarSemua) / 2 + i * (LEBAR + JARAK)}
          y={ATAS}
          lebar={LEBAR}
          tinggi={TINGGI}
          ujiId={`permainan-${nama}`}
          onKlik={() => {
            bunyi("klik");
            onPilih(nama);
          }}
        >
          <Papan Gambar={Gambar} aksen={aksen} miring={i % 2 ? 1.6 : -1.6} />
        </Klik>
      ))}
    </>
  );
}

