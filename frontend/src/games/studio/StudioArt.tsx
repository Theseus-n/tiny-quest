import { renderToStaticMarkup } from "react-dom/server";
import { Kucing } from "../../images/illustrations";
import { BayanganKaki, DefinisiLembut } from "../../images/Soft";
import { urlKitbitz, type NamaKitbitz } from "../../images/kitbitz";
import { paletStudio, warna } from "../../design/token";
import { BARIS, KOLOM, type IsiKarya, type JenisTokoh, type Latar } from "./logic";

export const KOTAK = 88;

/** Empat tokoh Studio Kreasi, semuanya menghadap kanan, gaya Kitbitz, dengan warna badan yang bisa diganti. */
export function GambarTokoh({ jenis, warnaBadan, lebar = 80 }: { jenis: JenisTokoh; warnaBadan: string; lebar?: number }) {
  if (jenis === "kucing") return <Kucing lebar={lebar} warnaBadan={warnaBadan} />;
  const mata = (x: number, y: number, r = 2.8) => (
    <>
      <circle cx={x} cy={y} r={r} fill={warna.tinta} />
      <circle cx={x + 0.9} cy={y - 0.9} r={r * 0.34} fill={warna.putih} />
    </>
  );
  return (
    <svg width={lebar} height={lebar} viewBox="0 0 80 80" aria-hidden>
      {jenis === "ikan" && (
        <>
          <BayanganKaki cx={42} cy={70} rx={24} ry={4} />
          <path d="M24 40 Q14 30 6 26 Q9 40 6 54 Q14 50 24 40 Z" fill={warnaBadan} filter="url(#lembut-kecil)" />
          <path d="M38 24 Q46 12 58 24 Z" fill={warnaBadan} filter="url(#lembut-kecil)" />
          <ellipse cx="44" cy="40" rx="28" ry="18" fill={warnaBadan} filter="url(#lembut)" />
          <path d="M34 26 Q30 40 34 54" fill="none" stroke={warna.putih} strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round" />
          {mata(60, 36, 3.2)}
          <path d="M65 45 Q68 47 70 44" fill="none" stroke={warna.tinta} strokeWidth={1.8} strokeLinecap="round" />
          <ellipse cx="62" cy="44" rx="3" ry="1.8" fill={warna.pipi} />
        </>
      )}
      {jenis === "bola" && (
        <>
          <BayanganKaki cx={40} cy={72} rx={22} ry={4} />
          <circle cx="40" cy="42" r="28" fill={warnaBadan} filter="url(#lembut)" />
          <path d="M15 34 Q40 50 65 34 M18 56 Q40 66 62 56" fill="none" stroke={warna.putih} strokeOpacity={0.8} strokeWidth={5} strokeLinecap="round" />
          <ellipse cx="52" cy="26" rx="6" ry="3.5" fill={warna.putih} fillOpacity={0.55} transform="rotate(-30 52 26)" />
        </>
      )}
      {jenis === "burung" && (
        <>
          <BayanganKaki cx={40} cy={74} rx={20} ry={4} />
          <path d="M34 62 L32 72 M44 62 L46 72" fill="none" stroke={warna.paruh} strokeWidth={3.5} strokeLinecap="round" />
          <path d="M18 46 Q6 38 4 32 Q12 34 22 40 Z" fill={warnaBadan} filter="url(#lembut-kecil)" />
          <ellipse cx="38" cy="48" rx="24" ry="17" fill={warnaBadan} filter="url(#lembut)" />
          <circle cx="58" cy="30" r="14" fill={warnaBadan} filter="url(#lembut)" />
          <path d="M70 28 Q80 31 70 35 Z" fill={warna.paruh} />
          <path d="M24 44 Q36 34 48 46 Q36 55 24 44 Z" fill={warna.putih} fillOpacity={0.45} />
          {mata(62, 27)}
          <ellipse cx="56" cy="35" rx="3" ry="1.8" fill={warna.pipi} />
        </>
      )}
    </svg>
  );
}

/** Satu gambar Kitbitz di dalam SVG, supaya latar tetap satu SVG utuh (juga untuk gambar kecil karya). */
function Gambar({ nama, x, y, lebar, tinggi, redup = false }: { nama: NamaKitbitz; x: number; y: number; lebar: number; tinggi: number; redup?: boolean }) {
  return <image href={urlKitbitz(nama)} x={x} y={y} width={lebar} height={tinggi} opacity={redup ? 0.55 : 1} />;
}

/** Latar panggung, selebar KOLOM × BARIS kotak, disusun dari gambar Kitbitz. Gambar SVG murni, supaya bisa dipakai juga untuk gambar kecil karya. */
export function GambarLatar({ latar, lebar = KOLOM * KOTAK }: { latar: Latar; lebar?: number }) {
  const [w, h] = [KOLOM * KOTAK, BARIS * KOTAK];
  return (
    <svg width={lebar} height={(lebar * h) / w} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      {latar === "taman" && (
        <>
          <rect width={w} height={h} fill={warna.langit} />
          <Gambar nama="awan" x={40} y={14} lebar={170} tinggi={90} />
          <Gambar nama="awan" x={470} y={30} lebar={130} tinggi={70} />
          <rect y={h * 0.6} width={w} height={h * 0.4} fill={warna.rumputTaman} />
          <Gambar nama="pohon-senyum" x={680} y={70} lebar={90} tinggi={200} />
          <Gambar nama="semak-senyum" x={20} y={150} lebar={70} tinggi={100} />
          <Gambar nama="bunga" x={300} y={240} lebar={40} tinggi={40} />
          <Gambar nama="rumput" x={520} y={250} lebar={26} tinggi={36} />
        </>
      )}
      {latar === "pantai" && (
        <>
          <rect width={w} height={h} fill={warna.langit} />
          <Gambar nama="awan" x={90} y={16} lebar={150} tinggi={80} />
          <rect y={h * 0.4} width={w} height={h * 0.3} fill={warna.laut} />
          <path d={`M0 ${h * 0.5} q30 -10 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0`} fill="none" stroke={warna.putih} strokeOpacity={0.6} strokeWidth={4} strokeLinecap="round" />
          <rect y={h * 0.7} width={w} height={h * 0.3} fill={warna.pasir} />
          <Gambar nama="pohon-kelapa" x={660} y={40} lebar={120} tinggi={220} />
          <Gambar nama="batu-sungai" x={30} y={286} lebar={120} tinggi={50} />
        </>
      )}
      {latar === "malam" && (
        <>
          <rect width={w} height={h} fill={warna.langitMalam} />
          <circle cx={w - 100} cy="70" r="36" fill={warna.bulan} />
          <circle cx={w - 86} cy="60" r="32" fill={warna.langitMalam} />
          {[[80, 50], [200, 90], [320, 40], [450, 80], [560, 30]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill={warna.bulan} />
          ))}
          <rect y={h * 0.6} width={w} height={h * 0.4} fill={warna.rumputMalam} />
          <Gambar nama="pohon-rimbun" x={40} y={100} lebar={110} tinggi={150} redup />
          <Gambar nama="semak-bulat" x={620} y={170} lebar={110} tinggi={90} redup />
        </>
      )}
    </svg>
  );
}

/** Panggung lengkap dalam satu SVG: latar dan tokoh di tempat awalnya. */
function GambarPanggung({ isi }: { isi: IsiKarya }) {
  const [w, h] = [KOLOM * KOTAK, BARIS * KOTAK];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={w / 2} height={h / 2} viewBox={`0 0 ${w} ${h}`}>
      <DefinisiLembut />
      <GambarLatar latar={isi.latar} />
      {isi.tokoh.map((t) => (
        <g key={t.id} transform={`translate(${t.sel[0] * KOTAK + 4} ${t.sel[1] * KOTAK + 4})`}>
          <GambarTokoh jenis={t.jenis} warnaBadan={paletStudio[t.warna]} />
        </g>
      ))}
    </svg>
  );
}

/** Gambar kecil karya untuk galeri: SVG dalam bentuk data URL base64, sesuai bentuk yang diterima backend. */
export function buatGambarKecil(isi: IsiKarya): string {
  const svg = renderToStaticMarkup(<GambarPanggung isi={isi} />);
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
