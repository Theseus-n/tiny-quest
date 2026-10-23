import { describe, expect, it } from "vitest";
import { pecahKelompok, periksaLevelTirai, posisiKelompok, susunanLain } from "./logic";
import { levelTirai } from "../../content";

describe("Tirai Daun", () => {
  it.each(levelTirai.map((l) => [l.id, l] as const))("level %s layak dipakai", (_id, level) => {
    expect(periksaLevelTirai(level)).toEqual([]);
  });

  it("level awal memakai 1 sampai 4 benda", () => {
    for (const s of levelTirai[0].soal) expect(s.jumlah).toBeLessThanOrEqual(4);
  });

  it("susunan 5 sampai 8 benda selalu berupa kelompok kecil", () => {
    for (const n of [5, 6, 7, 8]) {
      const k = pecahKelompok(n);
      expect(k.length).toBe(2);
      expect(Math.max(...k)).toBeLessThanOrEqual(4);
      expect(k[0] + k[1]).toBe(n);
    }
  });

  it("soal yang diulang memakai susunan berbeda dengan jumlah sama", () => {
    for (const s of [[3, 3], [4, 2], [3], [4]]) {
      const lain = susunanLain(s);
      expect(lain.reduce((a, b) => a + b)).toBe(s.reduce((a, b) => a + b));
    }
    expect(susunanLain([4, 2])).toEqual([2, 4]);
  });

  it("kelompok terlihat terpisah: tidak ada benda dari dua kelompok yang bertumpuk", () => {
    const pos = posisiKelompok([4, 4], 100, 60);
    const kanan0 = Math.max(...pos[0].titik.map((t) => t.x));
    const kiri1 = Math.min(...pos[1].titik.map((t) => t.x));
    expect(kiri1 - kanan0).toBeGreaterThanOrEqual(60);
  });

  it("menolak soal dengan dua wadah benar", () => {
    const masalah = periksaLevelTirai({ id: "x", lamaTampilMs: 1500, benda: "ikan", soal: [{ jumlah: 2, susunan: [2], pilihan: [2, 2] }] });
    expect(masalah.length).toBeGreaterThan(0);
  });
});
