import { describe, expect, it } from "vitest";
import { cariTempat, klikPutar, periksaTangram, putar, sudutSetara, titikPotongan, type LevelTangram } from "./logika";
import { levelTangram } from "../../konten";
import { ukuran } from "../../desain/token";

const LEBAR_AREA = ukuran.lebarPanggung - 96;
const TINGGI_AREA = ukuran.areaKerjaTinggi - 24;

describe("Matriks Tangram", () => {
  it.each(levelTangram.map((l) => [l.id, l] as const))("level %s layak dipakai", (_id, level) => {
    expect(periksaTangram(level, LEBAR_AREA, TINGGI_AREA)).toEqual([]);
  });

  it("rotasi selalu berlangkah 45 derajat, satu klik satu langkah", () => {
    expect(putar(0)).toBe(45);
    expect(putar(315)).toBe(0);
    expect(klikPutar("segitiga-besar", 0, 90)).toBe(2);
  });

  it("persegi terlihat sama setiap 90 derajat, segitiga tidak", () => {
    expect(sudutSetara("persegi", 0, 90)).toBe(true);
    expect(sudutSetara("persegi", 0, 45)).toBe(false);
    expect(sudutSetara("segitiga-kecil", 0, 180)).toBe(false);
  });

  it("segitiga besar bersudut 45 menghadap ke atas, dengan alas datar", () => {
    const bulat = (n: number) => Math.round(n * 1000) / 1000 + 0; // + 0 mengubah -0 menjadi 0
    const t = titikPotongan("segitiga-besar", 45).map(([x, y]) => [bulat(x), bulat(y)]);
    expect(t).toContainEqual([0, -1.414]);
    expect(t.filter(([, y]) => y === 0)).toHaveLength(2);
  });

  it("potongan menempel hanya kalau jenis, sudut, dan jaraknya cocok", () => {
    const level = levelTangram[0];
    const [t] = level.tempat;
    expect(cariTempat(level, t.jenis, t.sudut, t.x + 0.3, t.y, new Set())).toBe(0);
    expect(cariTempat(level, t.jenis, t.sudut + 45, t.x, t.y, new Set())).toBe(-1);
    expect(cariTempat(level, t.jenis, t.sudut, t.x + 2, t.y, new Set())).toBe(-1);
    expect(cariTempat(level, t.jenis, t.sudut, t.x, t.y, new Set([0]))).toBe(-1);
  });

  it("pemeriksa menangkap tempat yang menumpuk dan potongan yang perlu banyak putaran", () => {
    const salah: LevelTangram = {
      id: "uji",
      bentuk: "uji",
      tempat: [
        { jenis: "persegi", x: 0.5, y: 0.5, sudut: 0 },
        { jenis: "persegi", x: 0.8, y: 0.5, sudut: 0 },
        { jenis: "segitiga-kecil", x: 3, y: 0.5, sudut: 180 },
      ],
      rak: [{ jenis: "persegi", sudut: 0 }, { jenis: "persegi", sudut: 0 }, { jenis: "segitiga-kecil", sudut: 0 }],
      garisBantu: true,
      toleransi: 0.7,
    };
    const masalah = periksaTangram(salah, LEBAR_AREA, TINGGI_AREA).join(" | ");
    expect(masalah).toMatch(/menumpuk/);
    expect(masalah).toMatch(/lebih dari 2 klik/);
  });

  it("level awal memakai 2 potongan dengan garis bantu, level lanjut tanpa garis bantu", () => {
    expect(levelTangram[0].tempat).toHaveLength(2);
    expect(levelTangram[0].garisBantu).toBe(true);
    expect(levelTangram[levelTangram.length - 1].garisBantu).toBe(false);
  });
});
