import { warna, warnaAlas } from "../../desain/token";
import { SATUAN, jariJari, titikPotongan, type JenisPotongan } from "./logika";

export const warnaPotongan: Record<JenisPotongan, string> = {
  "segitiga-besar": warna.potonganBesar,
  "segitiga-kecil": warna.potonganKecil,
  persegi: warna.potonganPersegi,
};

/**
 * Gambar satu potongan berpusat di tengah kotak selebar 2 × jari-jarinya, gaya Kitbitz:
 * tanpa garis tepi, dengan bayangan lembut dan alas 3D yang kontras 3 : 1 terhadap latar.
 */
export function GambarPotongan({ jenis, sudut, isi = warnaPotongan[jenis] }: { jenis: JenisPotongan; sudut: number; isi?: string }) {
  const r = jariJari(jenis) * SATUAN;
  const titik = titikPotongan(jenis, sudut)
    .map(([x, y]) => `${x * SATUAN + r},${y * SATUAN + r}`)
    .join(" ");
  return (
    <svg width={r * 2} height={r * 2} viewBox={`0 0 ${r * 2} ${r * 2}`} style={{ overflow: "visible" }} aria-hidden>
      <polygon points={titik} transform="translate(0 5)" fill={warnaAlas(isi)} strokeLinejoin="round" stroke={warnaAlas(isi)} strokeWidth={6} />
      <polygon points={titik} fill={isi} stroke={isi} strokeWidth={6} strokeLinejoin="round" filter="url(#lembut)" />
    </svg>
  );
}
