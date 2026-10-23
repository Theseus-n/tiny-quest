import { warna } from "../../desain/token";
import { IkonLompat, IkonMaju, IkonPutar, IkonUlangi, TitikDadu } from "../../gambar/ikon";
import { kategoriBlok, type Blok } from "./jenis";

export const LEBAR_BLOK = 104;
export const TINGGI_BLOK = 88;

// Keping puzzle: takik di kiri, tonjolan di kanan, supaya blok terlihat tersambung dari kiri ke kanan.
export const bentukKeping = "M4 4 H88 V30 Q100 30 100 44 Q100 58 88 58 V84 H4 V58 Q16 58 16 44 Q16 30 4 30 Z";

/** Alas 3D di bawah keping: memberi batas yang kontras terhadap panggung, ganti garis tepi (gaya Kitbitz). */
export function AlasKeping({ warnaAlas }: { warnaAlas: string }) {
  return <path d={bentukKeping} transform="translate(0 6)" fill={warnaAlas} />;
}

/** Gambar satu blok. Warnanya menunjukkan jenisnya: biru untuk gerak, oranye untuk kontrol. */
export function GambarBlok({ blok, menyala = false }: { blok: Blok; menyala?: boolean }) {
  const kontrol = kategoriBlok(blok.jenis) === "kontrol";
  const isi = kontrol ? warna.blokKontrol : warna.blokGerak;
  const alas = kontrol ? warna.blokKontrolAlas : warna.blokGerakAlas;
  const warnaIkon = kontrol ? warna.tinta : warna.putih;

  return (
    <svg width={LEBAR_BLOK} height={TINGGI_BLOK} viewBox="0 0 104 88" data-blok={blok.jenis} data-menyala={menyala || undefined} style={{ overflow: "visible" }}>
      {/* Penanda blok aktif: tinta 75% di atas putih kontrasnya sekitar 6 : 1, di atas syarat 3 : 1. */}
      {menyala && <path d={bentukKeping} transform="translate(0 3)" fill="none" stroke={warna.tinta} strokeOpacity={0.75} strokeWidth={20} strokeLinejoin="round" />}
      <AlasKeping warnaAlas={alas} />
      <path d={bentukKeping} fill={isi} filter="url(#lembut)" />
      <foreignObject x="16" y="16" width="72" height="56">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, height: "100%" }}>
          {blok.jenis === "maju" && <IkonMaju warnaIkon={warnaIkon} />}
          {blok.jenis === "putar-kiri" && <IkonPutar warnaIkon={warnaIkon} arah="kiri" />}
          {blok.jenis === "putar-kanan" && <IkonPutar warnaIkon={warnaIkon} arah="kanan" />}
          {blok.jenis === "lompat" && <IkonLompat warnaIkon={warnaIkon} />}
          {blok.jenis === "ulangi" && (
            <>
              <IkonUlangi warnaIkon={warnaIkon} besar={38} />
              <TitikDadu jumlah={blok.kali} warnaTitik={warnaIkon} />
            </>
          )}
        </div>
      </foreignObject>
    </svg>
  );
}

/** Slot kosong di program: tempat yang menunggu diisi. */
export function GambarSlot() {
  return (
    <svg width={LEBAR_BLOK} height={TINGGI_BLOK} viewBox="0 0 104 88" style={{ overflow: "visible" }}>
      <path d={bentukKeping} fill={warna.slot} stroke={warna.tepi} strokeWidth={3} strokeDasharray="8 7" strokeLinejoin="round" />
    </svg>
  );
}
