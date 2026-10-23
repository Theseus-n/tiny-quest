import type { Arah, Blok, Program, Sel } from "../../bersama/program/jenis";

export type JenisTokoh = "kucing" | "ikan" | "bola" | "burung";
export type Latar = "taman" | "pantai" | "malam";

/** Satu tokoh di karya: tempat dan arah awalnya, warna badannya, program utamanya, dan program pemicunya. */
export type TokohKarya = {
  id: string;
  jenis: JenisTokoh;
  /** Indeks warna di palet Studio Kreasi. */
  warna: number;
  sel: Sel;
  arah: Arah;
  program: Program;
  /** "Saat tokoh ini menyentuh tokoh sasaran, jalankan program ini." */
  pemicu: { ada: boolean; sasaran: string | null; program: Program };
};

export type IsiKarya = { latar: Latar; tokoh: TokohKarya[] };

export const KOLOM = 9;
export const BARIS = 4;
export const SLOT_UTAMA = 5;
export const SLOT_PEMICU = 4;
export const TOKOH_TERBANYAK = 4;
export const LANGKAH_TERBANYAK = 60;

export const isiKosong = (): IsiKarya => ({ latar: "taman", tokoh: [] });

export const tokohBaru = (id: string, jenis: JenisTokoh, sel: Sel, warna: number): TokohKarya => ({
  id,
  jenis,
  warna,
  sel,
  arah: "kanan",
  program: Array(SLOT_UTAMA).fill(null),
  pemicu: { ada: false, sasaran: null, program: Array(SLOT_PEMICU).fill(null) },
});

type Aksi = { jenis: Exclude<Blok["jenis"], "ulangi">; aktif: number[] };

/** Menguraikan program menjadi urutan aksi. Blok Ulangi mengulang blok tepat di sebelah kanannya, sama seperti Penjelajah Jalur. */
export function uraikan(program: Program): Aksi[] {
  const isi = program.flatMap((blok, indeks) => (blok ? [{ blok, indeks }] : []));
  const aksi: Aksi[] = [];
  for (let i = 0; i < isi.length; i++) {
    const { blok, indeks } = isi[i];
    if (blok.jenis !== "ulangi") {
      aksi.push({ jenis: blok.jenis, aktif: [indeks] });
      continue;
    }
    const berikut = isi[i + 1];
    if (!berikut || berikut.blok.jenis === "ulangi") continue;
    for (let k = 0; k < blok.kali; k++) aksi.push({ jenis: berikut.blok.jenis, aktif: [indeks, berikut.indeks] });
    i++;
  }
  return aksi;
}

const urutanArah: Arah[] = ["kanan", "bawah", "kiri", "atas"];
const gerakArah: Record<Arah, Sel> = { kanan: [1, 0], bawah: [0, 1], kiri: [-1, 0], atas: [0, -1] };

/** Satu aksi di panggung bebas. Tokoh yang sampai di tepi berhenti di tepi, tanpa dianggap salah. */
export function terapkan(pos: { sel: Sel; arah: Arah }, aksi: Aksi["jenis"]): { sel: Sel; arah: Arah } {
  if (aksi === "putar-kiri" || aksi === "putar-kanan") {
    const i = urutanArah.indexOf(pos.arah);
    return { sel: pos.sel, arah: urutanArah[(i + (aksi === "putar-kanan" ? 1 : 3)) % 4] };
  }
  const [dx, dy] = gerakArah[pos.arah];
  const jarak = aksi === "lompat" ? 2 : 1;
  const k = Math.min(KOLOM - 1, Math.max(0, pos.sel[0] + dx * jarak));
  const b = Math.min(BARIS - 1, Math.max(0, pos.sel[1] + dy * jarak));
  return { sel: [k, b], arah: pos.arah };
}

export type KeadaanTokoh = { sel: Sel; arah: Arah; lompat: boolean; aktif: { baris: "utama" | "pemicu"; indeks: number[] } | null };
export type Bingkai = Record<string, KeadaanTokoh>;

/**
 * Menjalankan semua tokoh bersamaan, satu aksi per langkah. Setelah setiap langkah, tokoh yang menyentuh
 * sasaran pemicunya (berada di kotak yang sama) menghentikan program utamanya dan menjalankan program pemicu.
 * Setiap pemicu hanya berjalan sekali per cerita. Fungsi murni: tidak menyentuh layar.
 */
export function jalankanCerita(tokoh: TokohKarya[]): Bingkai[] {
  type AksiBaris = Aksi & { baris: "utama" | "pemicu" };
  const antrean = new Map<string, AksiBaris[]>(tokoh.map((t) => [t.id, uraikan(t.program).map((a) => ({ ...a, baris: "utama" }))]));
  const sudahDipicu = new Set<string>();
  let keadaan: Bingkai = Object.fromEntries(tokoh.map((t) => [t.id, { sel: t.sel, arah: t.arah, lompat: false, aktif: null }]));
  const bingkai: Bingkai[] = [keadaan];

  for (let n = 0; n < LANGKAH_TERBANYAK && [...antrean.values()].some((a) => a.length > 0); n++) {
    const baru: Bingkai = {};
    for (const t of tokoh) {
      const aksi = antrean.get(t.id)!.shift();
      const lama = keadaan[t.id];
      if (!aksi) {
        baru[t.id] = { ...lama, lompat: false, aktif: null };
        continue;
      }
      baru[t.id] = { ...terapkan(lama, aksi.jenis), lompat: aksi.jenis === "lompat", aktif: { baris: aksi.baris, indeks: aksi.aktif } };
    }
    for (const t of tokoh) {
      const s = t.pemicu.sasaran;
      if (!t.pemicu.ada || !s || !baru[s] || sudahDipicu.has(t.id)) continue;
      const [a, b] = [baru[t.id].sel, baru[s].sel];
      if (a[0] === b[0] && a[1] === b[1]) {
        sudahDipicu.add(t.id);
        antrean.set(t.id, uraikan(t.pemicu.program).map((x) => ({ ...x, baris: "pemicu" })));
      }
    }
    keadaan = baru;
    bingkai.push(keadaan);
  }
  return bingkai;
}
