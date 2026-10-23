import { warna, warnaAlas } from "../desain/token";
import { BayanganKaki } from "./Lembut";
import { Kitbitz } from "./kitbitz";

const G = 3;

/**
 * Kucing kampung menghadap kanan, gaya Kitbitz. Belangnya bayangan gelap tembus pandang,
 * jadi tetap cocok untuk warna badan apa pun di Studio Kreasi.
 */
export function Kucing({ lebar = 72, warnaBadan = warna.kucing }: { lebar?: number; warnaBadan?: string }) {
  return (
    <svg width={lebar} height={lebar} viewBox="0 0 80 80" aria-hidden>
      <BayanganKaki cx={38} cy={74} rx={26} ry={4} />
      <path d="M17 50 Q3 44 8 22" fill="none" stroke={warnaBadan} strokeWidth={7} strokeLinecap="round" />
      <rect x="20" y="58" width="9" height="15" rx="4.5" fill={warnaBadan} filter="url(#lembut-kecil)" />
      <rect x="40" y="58" width="9" height="15" rx="4.5" fill={warnaBadan} filter="url(#lembut-kecil)" />
      <ellipse cx="35" cy="52" rx="22" ry="14" fill={warnaBadan} filter="url(#lembut)" />
      <path d="M27 40 Q29 45 30 48 M36 39 Q37 44 37 47 M45 40 Q44 45 43 48" fill="none" stroke={warna.tinta} strokeOpacity={0.18} strokeWidth={4} strokeLinecap="round" />
      <path d="M49 27 L51 9 L62 22 Z" fill={warnaBadan} />
      <path d="M66 22 L75 9 L75 29 Z" fill={warnaBadan} />
      <path d="M52 22 L53 14 L58 21 Z M70 21 L73 15 L73 25 Z" fill={warna.pipi} />
      <circle cx="61" cy="34" r="15" fill={warnaBadan} filter="url(#lembut)" />
      <circle cx="55" cy="32" r="2.8" fill={warna.tinta} />
      <circle cx="66" cy="32" r="2.8" fill={warna.tinta} />
      <circle cx="56" cy="31" r="0.9" fill={warna.putih} />
      <circle cx="67" cy="31" r="0.9" fill={warna.putih} />
      <ellipse cx="61" cy="38" rx="2" ry="1.4" fill={warna.pipi} />
      <path d="M58 41 Q61 43.5 64 41" fill="none" stroke={warna.tinta} strokeWidth={1.8} strokeLinecap="round" />
      <ellipse cx="51" cy="38" rx="3" ry="1.8" fill={warna.pipi} fillOpacity={0.8} />
      <ellipse cx="71" cy="38" rx="3" ry="1.8" fill={warna.pipi} fillOpacity={0.8} />
    </svg>
  );
}

/** Rumah kecil beratap genteng dengan pintu bulat, gaya Kitbitz: tujuan di Penjelajah Jalur. */
export function Rumah({ lebar = 76 }: { lebar?: number }) {
  return (
    <svg width={lebar} height={lebar} viewBox="0 0 80 80" aria-hidden>
      <BayanganKaki cx={40} cy={75} rx={28} ry={4} />
      <rect x="16" y="36" width="48" height="38" rx="5" fill={warna.dinding} filter="url(#lembut)" />
      <path d="M6 42 Q4 38 8 35 L36 11 Q40 8 44 11 L72 35 Q76 38 74 42 Q72 45 68 44 L12 44 Q8 45 6 42 Z" fill={warna.genteng} filter="url(#lembut)" />
      <path d="M32 74 L32 60 A8 8 0 0 1 48 60 L48 74 Z" fill={warna.kancilGelap} filter="url(#lembut-kecil)" />
      <circle cx="45" cy="66" r="1.5" fill={warna.krem} />
      <rect x="21" y="49" width="9" height="9" rx="2.5" fill={warna.langit} />
      <rect x="51" y="49" width="9" height="9" rx="2.5" fill={warna.langit} />
    </svg>
  );
}

/** Batu: gambar Kitbitz "Smooth Boulder". */
export function Batu({ lebar = 64 }: { lebar?: number }) {
  return <Kitbitz nama="batu" lebar={lebar} />;
}

export type JenisBenda = "rambutan" | "kelereng" | "ikan";

/** Benda sehari-hari di Tirai Daun, gaya Kitbitz. Ikan memakai gambar Kitbitz "Cartoon Fish". */
export function Benda({ jenis, lebar = 52 }: { jenis: JenisBenda; lebar?: number }) {
  if (jenis === "ikan") {
    return (
      <div style={{ width: lebar, height: lebar, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Kitbitz nama="ikan" lebar={lebar} />
      </div>
    );
  }
  if (jenis === "rambutan") {
    const rambut = Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      const lengkung = a + 0.35;
      return `M${30 + Math.cos(a) * 16} ${31 + Math.sin(a) * 16} Q${30 + Math.cos(lengkung) * 24} ${31 + Math.sin(lengkung) * 24} ${30 + Math.cos(a + 0.2) * 27} ${31 + Math.sin(a + 0.2) * 27}`;
    }).join(" ");
    return (
      <svg width={lebar} height={lebar} viewBox="0 0 60 60" aria-hidden>
        <path d={rambut} fill="none" stroke={warna.rambutanRambut} strokeWidth={3.5} strokeLinecap="round" />
        <circle cx="30" cy="31" r="18" fill={warna.rambutan} filter="url(#lembut-kecil)" />
        <ellipse cx="36" cy="24" rx="4.5" ry="3" fill={warna.putih} fillOpacity={0.45} transform="rotate(-30 36 24)" />
      </svg>
    );
  }
  return (
    <svg width={lebar} height={lebar} viewBox="0 0 60 60" aria-hidden>
      <circle cx="30" cy="31" r="20" fill={warna.kelereng} filter="url(#lembut-kecil)" />
      <path d="M17 33 Q24 22 33 30 Q40 36 45 27" fill="none" stroke={warna.krem} strokeWidth={4.5} strokeLinecap="round" />
      <ellipse cx="38" cy="22" rx="5" ry="3.2" fill={warna.putih} fillOpacity={0.7} transform="rotate(-30 38 22)" />
    </svg>
  );
}

/** Daun pisang lebar yang menutupi benda di Tirai Daun, gaya Kitbitz: tanpa garis tepi, tulang daun lebih terang. */
export function DaunPisang({ lebar, tinggi }: { lebar: number; tinggi: number }) {
  const urat = Array.from({ length: 11 }, (_, i) => {
    const x = 40 + i * 52;
    return `M${x} 120 Q${x + 20} 70 ${x + 40} 18 M${x} 120 Q${x + 20} 170 ${x + 40} 222`;
  }).join(" ");
  const bentuk = "M8 120 Q40 8 320 10 Q600 8 632 120 Q600 232 320 230 Q40 232 8 120 Z";
  const idPotong = `daun-${lebar}-${tinggi}`;
  return (
    <svg width={lebar} height={tinggi} viewBox="0 0 640 240" preserveAspectRatio="none" style={{ overflow: "visible" }} aria-hidden>
      <defs>
        <clipPath id={idPotong}>
          <path d={bentuk} />
        </clipPath>
      </defs>
      <path d={bentuk} transform="translate(0 8)" fill={warna.daunGelap} />
      <path d={bentuk} fill={warna.daun} filter="url(#lembut)" />
      <g clipPath={`url(#${idPotong})`}>
        <path d={urat} fill="none" stroke={warna.daunGelap} strokeOpacity={0.5} strokeWidth={4} strokeLinecap="round" />
        <path d="M14 120 L626 120" stroke={warna.putih} strokeOpacity={0.35} strokeWidth={9} strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Bakul anyaman: wadah pilihan di Tirai Daun. Alas 3D memberi batas wadah yang bisa diklik kontras 3 : 1. */
export function Bakul({ lebar, tinggi }: { lebar: number; tinggi: number }) {
  const badan = "M10 24 Q8 18 16 18 L224 18 Q232 18 230 24 L210 106 Q208 112 200 112 L40 112 Q32 112 30 106 Z";
  return (
    <svg width={lebar} height={tinggi} viewBox="0 0 240 120" preserveAspectRatio="none" aria-hidden style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <path d={badan} transform="translate(0 6)" fill={warnaAlas(warna.bakul)} />
      <path d={badan} fill={warna.bakul} filter="url(#lembut)" />
      <path d="M24 50 L216 50 M30 78 L210 78" stroke={warna.bakulGelap} strokeOpacity={0.45} strokeWidth={4} strokeLinecap="round" />
      <rect x="8" y="14" width="224" height="14" rx="7" fill={warna.bakulGelap} filter="url(#lembut-kecil)" />
    </svg>
  );
}

/** Tangan bayangan untuk peragaan. */
export function Tangan({ lebar = 72 }: { lebar?: number }) {
  return (
    <svg width={lebar} height={lebar} viewBox="0 0 72 72" aria-hidden>
      <path
        d="M24 6 Q30 2 34 8 L34 32 Q40 28 46 32 Q52 30 56 36 Q62 36 64 42 L64 56 Q62 68 48 70 L34 70 Q24 68 18 58 L8 42 Q6 36 12 34 Q18 34 22 40 L22 10 Z"
        fill={warna.tinta}
        fillOpacity={0.4}
        stroke={warna.putih}
        strokeWidth={G}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Steker lepas: tanda untuk orang dewasa bahwa penyimpanan di laptop tidak menjawab. */
export function KabelLepas({ lebar = 56 }: { lebar?: number }) {
  return (
    <svg width={lebar} height={lebar} viewBox="0 0 56 56" aria-hidden>
      <g stroke={warna.tinta} strokeWidth={G} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M2 40 Q10 40 14 34" />
        <rect x="12" y="20" width="14" height="16" rx="3" fill={warna.slot} />
        <path d="M26 24 L32 24 M26 32 L32 32" />
        <rect x="38" y="18" width="12" height="20" rx="3" fill={warna.slot} />
        <path d="M50 28 Q54 28 54 20" />
      </g>
    </svg>
  );
}

/** Bintang pujian di pop-up selamat dan di gelembung semangat Si Kancil, dengan wajah tersenyum. */
export function Bintang({ lebar = 64 }: { lebar?: number }) {
  return (
    <svg width={lebar} height={lebar} viewBox="0 0 64 64" aria-hidden>
      <path
        d="M32 5 Q34 5 35.5 9 L40 20 Q41 22 43.5 22.5 L56 23.5 Q60 24 58 27.5 L48.5 36 Q47 37.5 47.5 40 L50.5 53 Q51 57 47.5 55.5 L35 48.5 Q32 47 29 48.5 L16.5 55.5 Q13 57 13.5 53 L16.5 40 Q17 37.5 15.5 36 L6 27.5 Q4 24 8 23.5 L20.5 22.5 Q23 22 24 20 L28.5 9 Q30 5 32 5 Z"
        fill={warna.bintang}
        filter="url(#lembut-kecil)"
      />
      <circle cx="27" cy="31" r="2.2" fill={warna.tinta} />
      <circle cx="37" cy="31" r="2.2" fill={warna.tinta} />
      <path d="M28 36 Q32 39.5 36 36" fill="none" stroke={warna.tinta} strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}
