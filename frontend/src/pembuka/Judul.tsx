import { Bintang } from "../gambar/ilustrasi";
import { ukuran, warna } from "../desain/token";

/** Judul di papan kayu dengan bintang di kiri dan kanan. Hanya hiasan, tidak bisa diklik. */
export function Judul({ teks, ujiId, lebar = 560, tinggi = 84, atas = 22, huruf = 50 }: { teks: string; ujiId: string; lebar?: number; tinggi?: number; atas?: number; huruf?: number }) {
  return (
    <div
      data-testid={ujiId}
      style={{
        position: "absolute",
        left: (ukuran.lebarPanggung - lebar) / 2,
        top: atas,
        width: lebar,
        height: tinggi,
        borderRadius: 30,
        background: `linear-gradient(180deg, ${warna.kayuTerang}, ${warna.kayu})`,
        border: `var(--garis) solid ${warna.kayuGelap}`,
        boxShadow: `0 8px 0 ${warna.kayuGelap}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        pointerEvents: "none",
      }}
    >
      <Bintang lebar={huruf * 0.88} />
      <span className="angka" style={{ fontSize: huruf, color: warna.putih, textShadow: `0 4px 0 ${warna.kayuGelap}, 0 0 2px ${warna.kayuGelap}`, letterSpacing: 1, whiteSpace: "nowrap" }}>
        {teks}
      </span>
      <Bintang lebar={huruf * 0.88} />
    </div>
  );
}
