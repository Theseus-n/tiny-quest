import { describe, expect, it } from "vitest";
import { periksaGalat, type LevelGalat } from "./logic";
import { levelGalat, levelJalur } from "../../content";

describe("Detektif Galat", () => {
  it.each(levelGalat.map((l) => [l.id, l] as const))("soal %s punya tepat satu kesalahan", (_id, soal) => {
    expect(periksaGalat(soal, levelJalur)).toEqual([]);
  });

  it("level awal memakai blok berlebih, level berikutnya blok salah arah", () => {
    expect(levelGalat.slice(0, 3).every((s) => s.jenis === "berlebih")).toBe(true);
    expect(levelGalat.slice(3).every((s) => s.jenis === "ganti")).toBe(true);
  });

  it("pemeriksa menolak soal tanpa kesalahan dan soal dengan dua kesalahan", () => {
    const benar: LevelGalat = { id: "uji", dasar: "jalur-01", jenis: "berlebih", program: [{ jenis: "maju" }, { jenis: "maju" }, { jenis: "maju" }] };
    expect(periksaGalat(benar, levelJalur)).toContain("program awal sudah berhasil, tidak ada kesalahan");
    const duaSalah: LevelGalat = { id: "uji", dasar: "jalur-03", jenis: "berlebih", program: [{ jenis: "maju" }, { jenis: "maju" }, { jenis: "putar-kiri" }, { jenis: "maju" }, { jenis: "maju" }, { jenis: "maju" }] };
    expect(periksaGalat(duaSalah, levelJalur)).not.toEqual([]);
  });
});
