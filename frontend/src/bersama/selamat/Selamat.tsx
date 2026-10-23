import { Klik } from "../masukan/Klik";
import { Kancil } from "../../gambar/Kancil";
import { Bintang } from "../../gambar/ilustrasi";
import { IkonKembali, IkonLanjut } from "../../gambar/ikon";
import { bunyi } from "../suara/audio";
import { ukuran, warna } from "../../desain/token";

const LEBAR = 560;
const TINGGI = 400;
const TOMBOL = 120;

/**
 * Pop-up selamat setelah level selesai: Si Kancil bertepuk tangan, tiga bintang muncul,
 * lalu satu tombol besar untuk lanjut ke level berikutnya. Di level terakhir, tombolnya kembali ke layar awal.
 * Permainan tidak pindah level sendiri, jadi pujian narator tidak terpotong.
 */
export function Selamat({ terakhir, onLanjut }: { terakhir: boolean; onLanjut: () => void }) {
  const x = (ukuran.lebarPanggung - LEBAR) / 2;
  const y = (ukuran.tinggiPanggung - TINGGI) / 2;

  return (
    <div
      data-testid="selamat"
      onClick={(e) => e.stopPropagation()}
      style={{ position: "absolute", inset: 0, zIndex: 40, background: "color-mix(in srgb, var(--tinta) 35%, transparent)" }}
    >
      <div
        className="muncul"
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: LEBAR,
          height: TINGGI,
          background: warna.panggung,
          borderRadius: 32,
          boxShadow: "0 10px 0 color-mix(in srgb, var(--tinta) 18%, transparent)",
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, top: 24, display: "flex", justifyContent: "center", gap: 16 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="muncul" style={{ animationDelay: `${200 + i * 220}ms`, marginTop: i === 1 ? 0 : 22 }}>
              <Bintang lebar={i === 1 ? 96 : 76} />
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 70, bottom: 24 }}>
          <Kancil pose="tepuk" lebar={150} />
        </div>
      </div>
      <Klik
        x={x + LEBAR - TOMBOL - 60}
        y={y + TINGGI - TOMBOL - 50}
        lebar={TOMBOL}
        tinggi={TOMBOL}
        ujiId="lanjut"
        onKlik={() => {
          bunyi("klik");
          onLanjut();
        }}
      >
        {terakhir ? (
          <IkonKembali besar={TOMBOL} />
        ) : (
          <IkonLanjut besar={TOMBOL} />
        )}
      </Klik>
    </div>
  );
}
