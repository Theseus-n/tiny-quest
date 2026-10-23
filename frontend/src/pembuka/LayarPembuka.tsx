import { Klik } from "../bersama/masukan/Klik";
import { Kancil } from "../gambar/Kancil";
import { useEffect } from "react";
import { bukaSuara, bunyi, siapkanSuara } from "../bersama/suara/audio";
import { ukuran, warna } from "../desain/token";
import { Judul } from "./Judul";
import { JUDUL_PEMBUKA } from "./teksJudul";

const LEBAR = 250;
const TINGGI = 280;

/** Segitiga putih di lingkaran hijau: tanda "mulai" yang dikenali anak tanpa tulisan. */
function TandaMulai() {
  return (
    <svg width={76} height={76} viewBox="0 0 76 76" aria-hidden style={{ position: "absolute", right: -22, bottom: -14 }}>
      <circle cx="38" cy="40" r="34" fill={warna.aksenJalanAlas} />
      <circle cx="38" cy="34" r="34" fill={warna.aksenJalan} stroke={warna.putih} strokeWidth={5} />
      <path d="M30 20 L30 48 L54 34 Z" fill={warna.putih} stroke={warna.putih} strokeWidth={5} strokeLinejoin="round" />
    </svg>
  );
}

/** Klik pertama membuka suara dan layar penuh, karena browser menahan keduanya sebelum ada klik. */
export function LayarPembuka({ onMulai }: { onMulai: () => void }) {
  // Setelah taman pertama tergambar, supaya pembukaan perangkat audio tidak menunda gambar pertama.
  useEffect(() => {
    const id = window.setTimeout(siapkanSuara, 600);
    return () => window.clearTimeout(id);
  }, []);

  const mulai = async () => {
    await bukaSuara();
    bunyi("klik");
    // Tidak ditunggu: peralihan layar penuh memakan waktu, dan halaman berikutnya tidak bergantung padanya.
    // Kalau browser menolak, platform tetap bisa dipakai di jendela biasa.
    document.documentElement.requestFullscreen().catch(() => {});
    onMulai();
  };

  return (
    <>
      <Judul teks={JUDUL_PEMBUKA} ujiId="judul-pembuka" lebar={780} tinggi={104} atas={26} huruf={62} />
      <Klik x={(ukuran.lebarPanggung - LEBAR) / 2} y={ukuran.tinggiPanggung - TINGGI - 24} lebar={LEBAR} tinggi={TINGGI} ujiId="mulai" onKlik={mulai}>
        <div style={{ position: "relative", width: "100%", height: "100%", animation: "napas-mulai 1800ms ease-in-out infinite alternate" }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50% 50% 36px 36px",
              background: `linear-gradient(180deg, ${warna.kayuTerang}, ${warna.kayu})`,
              // Tepi kayu gelap dan alas 3D: batas tombol mulai kontras terhadap rumput.
              border: `var(--garis) solid ${warna.kayuGelap}`,
              boxShadow: `0 10px 0 ${warna.kayuGelap}`,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: 18,
            }}
          >
            <div style={{ width: 208, height: 228, borderRadius: "50% 50% 26px 26px", overflow: "hidden", background: `color-mix(in srgb, ${warna.langit} 70%, ${warna.putih})`, display: "flex", alignItems: "flex-end", justifyContent: "center", border: `var(--garis) solid ${warna.kayuGelap}` }}>
              <Kancil lebar={190} />
            </div>
          </div>
          <TandaMulai />
        </div>
      </Klik>
      <style>{"@keyframes napas-mulai { from { transform: translateY(0) } to { transform: translateY(-8px) } }"}</style>
    </>
  );
}
