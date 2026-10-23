import { describe, expect, it } from "vitest";
import { bisaDigabung, bisaDiselesaikan, periksaBalok, potong } from "./logika";
import { levelBalok } from "../../konten";

describe("Balok Bilangan", () => {
  it.each(levelBalok.map((l) => [l.id, l] as const))("level %s layak dipakai", (_id, level) => {
    expect(periksaBalok(level)).toEqual([]);
  });

  it("memotong balok n menghasilkan dua balok yang jumlahnya n", () => {
    expect(potong(6, 4)).toEqual([4, 2]);
    expect(() => potong(3, 3)).toThrow();
    expect(() => potong(1, 1)).toThrow();
  });

  it("hasil gabungan tidak boleh lebih dari 10", () => {
    expect(bisaDigabung(6, 4)).toBe(true);
    expect(bisaDigabung(6, 5)).toBe(false);
  });

  it("cetakan bisa diisi selama panjang semua balok cukup", () => {
    expect(bisaDiselesaikan([5, 7], 8)).toBe(true);
    expect(bisaDiselesaikan([1, 1], 3)).toBe(false);
  });

  it("angka baru muncul di level lanjut", () => {
    expect(levelBalok[0].angka).toBe(false);
    expect(levelBalok[levelBalok.length - 1].angka).toBe(true);
  });
});
