import { describe, expect, it } from "vitest";
import { KOLOM, jalankanCerita, terapkan, tokohBaru, uraikan, type TokohKarya } from "./logic";

const maju = { jenis: "maju" } as const;

describe("Studio Kreasi", () => {
  it("blok Ulangi mengulang blok sesudahnya sebanyak titik dadunya", () => {
    expect(uraikan([{ jenis: "ulangi", kali: 3 }, maju, null]).map((a) => a.jenis)).toEqual(["maju", "maju", "maju"]);
  });

  it("tokoh yang sampai di tepi panggung berhenti di tepi", () => {
    expect(terapkan({ sel: [KOLOM - 1, 0], arah: "kanan" }, "maju").sel).toEqual([KOLOM - 1, 0]);
    expect(terapkan({ sel: [0, 0], arah: "kanan" }, "putar-kiri").arah).toBe("atas");
  });

  it("semua tokoh berjalan bersamaan, satu aksi per langkah", () => {
    const a = { ...tokohBaru("a", "kucing", [0, 0], 0), program: [maju, maju, null, null, null] };
    const b = { ...tokohBaru("b", "bola", [0, 2], 1), program: [maju, null, null, null, null] };
    const bingkai = jalankanCerita([a, b]);
    expect(bingkai).toHaveLength(3);
    expect(bingkai[1].a.sel).toEqual([1, 0]);
    expect(bingkai[1].b.sel).toEqual([1, 2]);
    expect(bingkai[2].a.sel).toEqual([2, 0]);
    expect(bingkai[2].b.aktif).toBeNull();
  });

  it("saat kucing menyentuh bola, program pemicu kucing berjalan sekali", () => {
    const kucing: TokohKarya = {
      ...tokohBaru("kucing", "kucing", [0, 1], 0),
      program: [maju, maju, maju, maju, null],
      pemicu: { ada: true, sasaran: "bola", program: [{ jenis: "lompat" }, null, null, null] },
    };
    const bola = tokohBaru("bola", "bola", [2, 1], 1);
    const bingkai = jalankanCerita([kucing, bola]);
    // Langkah 2: kucing sampai di kotak bola. Langkah 3: program utama berhenti, kucing melompat.
    expect(bingkai[2].kucing.sel).toEqual([2, 1]);
    expect(bingkai[3].kucing).toMatchObject({ sel: [4, 1], lompat: true, aktif: { baris: "pemicu", indeks: [0] } });
    expect(bingkai).toHaveLength(4);
  });

  it("pemicu tanpa sasaran tidak pernah berjalan", () => {
    const kucing: TokohKarya = { ...tokohBaru("k", "kucing", [0, 0], 0), program: [maju, null, null, null, null], pemicu: { ada: true, sasaran: null, program: [maju, null, null, null] } };
    expect(jalankanCerita([kucing])).toHaveLength(2);
  });
});
