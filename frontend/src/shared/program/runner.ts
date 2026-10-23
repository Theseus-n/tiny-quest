import type { Arah, LevelJalur, Program, Sel } from "./kinds";

export type Kejadian = "jalan" | "putar" | "lompat" | "tabrak" | "keluar";

export type Langkah = {
  /** Indeks slot yang menyala saat langkah ini berjalan. */
  aktif: number[];
  sel: Sel;
  arah: Arah;
  kejadian: Kejadian;
};

export type Hasil = { berhasil: boolean; sel: Sel; arah: Arah };

const urutanArah: Arah[] = ["kanan", "bawah", "kiri", "atas"];
const gerakArah: Record<Arah, Sel> = { kanan: [1, 0], bawah: [0, 1], kiri: [-1, 0], atas: [0, -1] };

const sama = (a: Sel, b: Sel) => a[0] === b[0] && a[1] === b[1];
const ada = (daftar: Sel[], s: Sel) => daftar.some((d) => sama(d, s));

function putar(arah: Arah, ke: "kiri" | "kanan"): Arah {
  const i = urutanArah.indexOf(arah);
  return urutanArah[(i + (ke === "kanan" ? 1 : 3)) % 4];
}

/**
 * Menjalankan program langkah demi langkah. Fungsi murni: tidak menyentuh layar.
 * Blok Ulangi mengulang blok tepat di sebelah kanannya sebanyak titik dadunya.
 * Program berhasil kalau tokoh berada di rumah saat program selesai.
 */
export function* jalankan(level: LevelJalur, program: Program): Generator<Langkah, Hasil> {
  let sel: Sel = [...level.mulai.sel];
  let arah = level.mulai.arah;

  const isi = program
    .map((blok, indeks) => ({ blok, indeks }))
    .filter((x): x is { blok: NonNullable<typeof x.blok>; indeks: number } => x.blok !== null);

  // Uraikan Ulangi menjadi urutan blok yang benar-benar dijalankan.
  const urutan: { jenis: string; aktif: number[] }[] = [];
  for (let i = 0; i < isi.length; i++) {
    const { blok, indeks } = isi[i];
    if (blok.jenis !== "ulangi") {
      urutan.push({ jenis: blok.jenis, aktif: [indeks] });
      continue;
    }
    const berikut = isi[i + 1];
    if (!berikut || berikut.blok.jenis === "ulangi") continue;
    for (let k = 0; k < blok.kali; k++) urutan.push({ jenis: berikut.blok.jenis, aktif: [indeks, berikut.indeks] });
    i++;
  }

  for (const { jenis, aktif } of urutan) {
    if (jenis === "putar-kiri" || jenis === "putar-kanan") {
      arah = putar(arah, jenis === "putar-kiri" ? "kiri" : "kanan");
      yield { aktif, sel, arah, kejadian: "putar" };
      continue;
    }
    const [dx, dy] = gerakArah[arah];
    const jarak = jenis === "lompat" ? 2 : 1;
    const tujuan: Sel = [sel[0] + dx * jarak, sel[1] + dy * jarak];

    if (ada(level.batu, tujuan)) {
      yield { aktif, sel, arah, kejadian: "tabrak" };
      return { berhasil: false, sel, arah };
    }
    if (!ada(level.jalan, tujuan)) {
      yield { aktif, sel: tujuan, arah, kejadian: "keluar" };
      return { berhasil: false, sel, arah };
    }
    sel = tujuan;
    yield { aktif, sel, arah, kejadian: jenis === "lompat" ? "lompat" : "jalan" };
  }

  return { berhasil: sama(sel, level.rumah), sel, arah };
}

/** Menjalankan program sampai habis dan mengembalikan semua langkah serta hasilnya. */
export function jalankanSemua(level: LevelJalur, program: Program) {
  const langkah: Langkah[] = [];
  const it = jalankan(level, program);
  for (;;) {
    const r = it.next();
    if (r.done) return { langkah, hasil: r.value };
    langkah.push(r.value);
  }
}
