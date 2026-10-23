import type { ReactNode } from "react";
import { Klik } from "../input/Click";
import { Pemandu } from "../guide/Guide";
import { Angka } from "../numbers/Numbers";
import { IkonKembali, TombolBulat } from "../../images/icons";
import { KabelLepas } from "../../images/illustrations";
import { useStatusPenyimpanan } from "../../storage/storage";
import { bunyi } from "../sound/audio";
import { ukuran, warna } from "../../design/token";

type Props = {
  onKembali: () => void;
  jumlahLevel: number;
  levelSekarang: number;
  levelTertinggiSelesai: number;
  onPilihLevel: (i: number) => void;
  onKlikKosong?: () => void;
  children: ReactNode;
};

const BULAT = ukuran.klikMinimal;
const JARAK = ukuran.jarakMinimal;

/**
 * Kerangka yang sama untuk semua permainan: tombol kembali di kiri atas, deretan level,
 * tokoh pemandu di kanan atas, lalu area kerja dan benda pilihan di bawahnya.
 */
export function Kerangka({ onKembali, jumlahLevel, levelSekarang, levelTertinggiSelesai, onPilihLevel, onKlikKosong, children }: Props) {
  const statusSimpan = useStatusPenyimpanan();

  return (
    <div style={{ position: "absolute", inset: 0 }} onClick={onKlikKosong}>
      <div
        style={{
          position: "absolute",
          left: 24,
          right: 24,
          top: ukuran.areaKerjaAtas,
          height: ukuran.areaKerjaTinggi,
          background: "var(--panggung)",
          borderRadius: 28,
          boxShadow: "0 8px 0 color-mix(in srgb, var(--tinta) 7%, transparent)",
        }}
      />

      <Klik x={24} y={12} lebar={BULAT} tinggi={BULAT} ujiId="kembali" onKlik={() => { bunyi("klik"); onKembali(); }}>
        <IkonKembali besar={BULAT} />
      </Klik>

      {Array.from({ length: jumlahLevel }, (_, i) => {
        const x = 24 + BULAT + 48 + i * (BULAT + JARAK);
        const terbuka = i <= levelTertinggiSelesai + 1;
        const sekarang = i === levelSekarang;
        if (!terbuka) {
          // Level yang belum terbuka: tanpa garis tinta, karena tidak bisa diklik.
          return (
            <div key={i} data-testid={`level-${i + 1}`} data-terkunci style={{ position: "absolute", left: x + 30, top: 12 + 30, width: 28, height: 28, borderRadius: "50%", background: warna.slot }} />
          );
        }
        return (
          <Klik key={i} x={x} y={12} lebar={BULAT} tinggi={BULAT} ujiId={`level-${i + 1}`} onKlik={() => { bunyi("klik"); onPilihLevel(i); }}>
            <div data-sekarang={sekarang || undefined} style={{ position: "relative", width: "100%", height: "100%" }}>
              <TombolBulat besar={BULAT} gelap={sekarang} />
              <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 86, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Angka nilai={i + 1} besar={40} warnaAngka={sekarang ? warna.putih : warna.tinta} />
              </div>
            </div>
          </Klik>
        );
      })}

      {statusSimpan === "putus" && (
        <div data-testid="kabel-lepas" style={{ position: "absolute", right: 140, top: 28, pointerEvents: "none" }}>
          <KabelLepas />
        </div>
      )}

      <Pemandu />
      {children}
    </div>
  );
}
