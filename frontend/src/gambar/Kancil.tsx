import { useEffect, useRef } from "react";
import { warna } from "../desain/token";
import { BayanganKaki } from "./Lembut";

export type Pose = "diam" | "tepuk" | "garuk" | "tunjuk" | "lambai";

function Lengan({ d }: { d: string }) {
  return <path d={d} fill="none" stroke={warna.kancil} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />;
}

const lenganKiri = {
  diam: "M40 98 Q32 110 33 122",
  tepuk: "M40 98 Q48 104 57 97",
  garuk: "M40 98 Q32 110 33 122",
  tunjuk: "M40 98 Q32 110 33 122",
  lambai: "M40 98 Q32 110 33 122",
};
const lenganKanan = {
  diam: "M80 98 Q88 110 87 122",
  tepuk: "M80 98 Q72 104 63 97",
  garuk: "M80 98 Q104 80 92 46",
  tunjuk: "M80 98 Q100 92 114 86",
  lambai: "M80 98 Q104 86 104 58",
};

/**
 * Si Kancil, tokoh pemandu, dengan gaya Kitbitz: tanpa garis tepi, bayangan lembut, dan wajah imut.
 * Bereaksi lewat gerak tubuh; mulutnya bergerak selama narator berbicara.
 */
export function Kancil({ pose = "diam", lebar = 120, bicara = false }: { pose?: Pose; lebar?: number; bicara?: boolean }) {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || pose === "diam") return;
    const gerak: Record<Exclude<Pose, "diam">, Keyframe[]> = {
      tepuk: [{ transform: "translateY(0)" }, { transform: "translateY(-8px)" }, { transform: "translateY(0)" }, { transform: "translateY(-8px)" }, { transform: "translateY(0)" }],
      garuk: [{ transform: "rotate(0deg)" }, { transform: "rotate(-5deg)" }, { transform: "rotate(4deg)" }, { transform: "rotate(-5deg)" }, { transform: "rotate(0deg)" }],
      tunjuk: [{ transform: "translateX(0)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }],
      lambai: [{ transform: "rotate(0deg)" }, { transform: "rotate(4deg)" }, { transform: "rotate(-3deg)" }, { transform: "rotate(4deg)" }, { transform: "rotate(0deg)" }],
    };
    el.animate(gerak[pose], { duration: 900, easing: "ease-in-out" });
  }, [pose]);

  return (
    <svg width={lebar} height={lebar * (140 / 120)} viewBox="0 0 120 140" data-pose={pose} data-bicara={bicara || undefined} aria-hidden>
      <BayanganKaki cx={60} cy={134} rx={30} ry={5} />
      <g ref={ref} style={{ transformOrigin: "60px 130px", transformBox: "view-box" }}>
        {/* telinga */}
        <ellipse cx="34" cy="24" rx="11" ry="23" transform="rotate(-22 34 24)" fill={warna.kancil} filter="url(#lembut-kecil)" />
        <ellipse cx="86" cy="24" rx="11" ry="23" transform="rotate(22 86 24)" fill={warna.kancil} filter="url(#lembut-kecil)" />
        <ellipse cx="35" cy="27" rx="5" ry="14" transform="rotate(-22 35 27)" fill={warna.krem} />
        <ellipse cx="85" cy="27" rx="5" ry="14" transform="rotate(22 85 27)" fill={warna.krem} />
        {/* kaki dan badan */}
        <rect x="44" y="118" width="13" height="16" rx="6.5" fill={warna.kancilGelap} />
        <rect x="63" y="118" width="13" height="16" rx="6.5" fill={warna.kancilGelap} />
        <ellipse cx="60" cy="102" rx="27" ry="25" fill={warna.kancil} filter="url(#lembut)" />
        <ellipse cx="60" cy="107" rx="14" ry="16" fill={warna.krem} />
        <Lengan d={lenganKiri[pose]} />
        {/* kepala */}
        <ellipse cx="60" cy="54" rx="34" ry="30" fill={warna.kancil} filter="url(#lembut)" />
        <ellipse cx="60" cy="68" rx="17" ry="12" fill={warna.krem} />
        <ellipse cx="60" cy="61" rx="5.5" ry="3.8" fill={warna.tinta} />
        <ellipse cx="58.5" cy="60" rx="1.6" ry="1" fill={warna.putih} />
        {bicara ? (
          <ellipse className="mulut-bicara" cx="60" cy="72" rx="5" ry="4" fill={warna.tinta} />
        ) : (
          <path d="M55 70 Q60 75 65 70" fill="none" stroke={warna.tinta} strokeWidth={2.6} strokeLinecap="round" />
        )}
        <ellipse cx="40" cy="62" rx="6" ry="3.5" fill={warna.pipi} />
        <ellipse cx="80" cy="62" rx="6" ry="3.5" fill={warna.pipi} />
        <g className="mata-kedip">
          <circle cx="46" cy="48" r="4.5" fill={warna.tinta} />
          <circle cx="74" cy="48" r="4.5" fill={warna.tinta} />
          <circle cx="47.5" cy="46.5" r="1.5" fill={warna.putih} />
          <circle cx="75.5" cy="46.5" r="1.5" fill={warna.putih} />
        </g>
        {/* syal */}
        <path d="M35 80 Q60 92 85 80 L85 89 Q60 101 35 89 Z" fill={warna.syal} filter="url(#lembut-kecil)" />
        <path d="M73 91 L79 107 L69 105 Z" fill={warna.syal} />
        <Lengan d={lenganKanan[pose]} />
      </g>
    </svg>
  );
}
