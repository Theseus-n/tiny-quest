import { describe, expect, it } from "vitest";
import { jalankanSemua } from "./penjalan";
import { periksaLevel } from "./pemeriksa";
import type { LevelJalur } from "./jenis";
import { levelJalur } from "../../konten";

const lurus: LevelJalur = {
  id: "uji",
  kolom: 6,
  baris: 3,
  jalan: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]],
  batu: [[2, 1]],
  mulai: { sel: [0, 1], arah: "kanan" },
  rumah: [4, 1],
  slot: 5,
  blok: [{ jenis: "maju" }, { jenis: "lompat" }],
  penyelesaian: [{ jenis: "maju" }, { jenis: "lompat" }, { jenis: "maju" }],
};

describe("penjalan program", () => {
  it("berhasil kalau tokoh berada di rumah saat program selesai", () => {
    const { hasil, langkah } = jalankanSemua(lurus, lurus.penyelesaian);
    expect(hasil.berhasil).toBe(true);
    expect(langkah.map((l) => l.kejadian)).toEqual(["jalan", "lompat", "jalan"]);
  });

  it("berhenti saat menabrak batu, dan menunjuk blok yang aktif", () => {
    const { hasil, langkah } = jalankanSemua(lurus, [{ jenis: "maju" }, { jenis: "maju" }]);
    expect(hasil.berhasil).toBe(false);
    expect(langkah.at(-1)).toMatchObject({ kejadian: "tabrak", aktif: [1] });
  });

  it("berhenti saat keluar jalur", () => {
    const { hasil, langkah } = jalankanSemua(lurus, [{ jenis: "putar-kiri" }, { jenis: "maju" }]);
    expect(hasil.berhasil).toBe(false);
    expect(langkah.at(-1)?.kejadian).toBe("keluar");
  });

  it("gagal kalau program habis sebelum sampai rumah", () => {
    expect(jalankanSemua(lurus, [{ jenis: "maju" }]).hasil.berhasil).toBe(false);
  });

  it("melewati slot kosong", () => {
    const { hasil } = jalankanSemua(lurus, [{ jenis: "maju" }, null, { jenis: "lompat" }, null, { jenis: "maju" }]);
    expect(hasil.berhasil).toBe(true);
  });

  it("Ulangi mengulang blok tepat di sebelah kanannya, dan keduanya menyala", () => {
    const panjang: LevelJalur = { ...lurus, batu: [], jalan: [...lurus.jalan, [5, 1]], rumah: [5, 1] };
    const { hasil, langkah } = jalankanSemua(panjang, [{ jenis: "ulangi", kali: 4 }, { jenis: "maju" }, { jenis: "maju" }]);
    expect(hasil.berhasil).toBe(true);
    expect(langkah).toHaveLength(5);
    expect(langkah[0].aktif).toEqual([0, 1]);
    expect(langkah[4].aktif).toEqual([2]);
  });

  it("Ulangi di akhir program tidak melakukan apa pun", () => {
    const { langkah } = jalankanSemua(lurus, [{ jenis: "maju" }, { jenis: "ulangi", kali: 2 }]);
    expect(langkah).toHaveLength(1);
  });

  it("putar kanan dan putar kiri mengubah arah", () => {
    const { langkah } = jalankanSemua(lurus, [{ jenis: "putar-kanan" }, { jenis: "putar-kiri" }, { jenis: "putar-kiri" }]);
    expect(langkah.map((l) => l.arah)).toEqual(["bawah", "kanan", "atas"]);
  });
});

describe("pemeriksa level", () => {
  it("menolak level yang penyelesaiannya tidak sampai", () => {
    expect(periksaLevel({ ...lurus, penyelesaian: [{ jenis: "maju" }] })).toContain("penyelesaian tidak sampai ke rumah");
  });

  it("menolak penyelesaian yang memakai blok yang tidak tersedia", () => {
    expect(periksaLevel({ ...lurus, blok: [{ jenis: "maju" }] }).join()).toMatch(/lompat yang tidak tersedia/);
  });

  it.each(levelJalur.map((l) => [l.id, l] as const))("level %s layak dipakai", (_id, level) => {
    expect(periksaLevel(level)).toEqual([]);
  });

  it("blok Ulangi tidak muncul sebelum level yang membutuhkannya", () => {
    const pertama = levelJalur.findIndex((l) => l.blok.some((b) => b.jenis === "ulangi"));
    expect(pertama).toBeGreaterThan(0);
    expect(levelJalur[pertama].penyelesaian.some((b) => b.jenis === "ulangi")).toBe(true);
  });

  it("level 1 hanya punya blok Maju dan 3 slot", () => {
    expect(levelJalur[0].blok).toEqual([{ jenis: "maju" }]);
    expect(levelJalur[0].slot).toBe(3);
  });
});
