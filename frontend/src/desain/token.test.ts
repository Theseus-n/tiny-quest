import { describe, expect, it } from "vitest";
import { paletStudio, rasioKontras, warna, warnaAlas, warnaBilangan } from "./token";

describe("token warna", () => {
  it("rumus kontras sama dengan contrast-check.py", () => {
    expect(rasioKontras("#FFFFFF", "#000000")).toBeCloseTo(21, 2);
    expect(rasioKontras("#777777", "#FFFFFF")).toBeCloseTo(4.48, 2);
  });

  it("setiap alas 3D kontras minimal 3 : 1 terhadap latar dan panggung", () => {
    const isi = [
      ...Object.values(warnaBilangan).map((b) => b.isi),
      ...paletStudio,
      warna.potonganBesar,
      warna.potonganKecil,
      warna.potonganPersegi,
      warna.bakul,
      warna.air,
    ];
    for (const w of isi) {
      expect(rasioKontras(warnaAlas(w), warna.latar), `alas ${w}`).toBeGreaterThanOrEqual(3);
      expect(rasioKontras(warnaAlas(w), warna.panggung), `alas ${w}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("alas blok dan tombol yang ditulis tetap juga lolos 3 : 1", () => {
    for (const w of [warna.blokGerakAlas, warna.blokKontrolAlas, warna.blokPemicuAlas, warna.aksenJalanAlas, warna.tepi]) {
      expect(rasioKontras(w, warna.latar), w).toBeGreaterThanOrEqual(3);
    }
  });
});
