import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { bicara, dengarNarator, diam, naratorSibuk } from "./audio";
import { durasi } from "../../desain/token";

// Tanpa AudioContext yang berjalan, setiap kalimat "diputar" selama durasi.kalimatTanpaSuara.
describe("antrean narator", () => {
  let terdengar: (string | null)[];
  let berhenti: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    terdengar = [];
    berhenti = dengarNarator((id) => terdengar.push(id));
  });
  afterEach(() => {
    diam();
    berhenti();
    vi.useRealTimers();
  });

  test("kalimat kedua menunggu kalimat pertama selesai, tidak memotongnya", async () => {
    const pertama = bicara("jalur.berhasil");
    const kedua = bicara("umum.tunjukkan");
    await vi.advanceTimersByTimeAsync(durasi.kalimatTanpaSuara - 10);
    expect(terdengar).toEqual(["jalur.berhasil"]);
    await vi.advanceTimersByTimeAsync(10);
    expect(await pertama).toBe(true);
    await vi.advanceTimersByTimeAsync(durasi.jedaKalimat);
    expect(terdengar).toEqual(["jalur.berhasil", null, "umum.tunjukkan"]);
    await vi.advanceTimersByTimeAsync(durasi.kalimatTanpaSuara);
    expect(await kedua).toBe(true);
    expect(naratorSibuk()).toBe(true);
    await vi.advanceTimersByTimeAsync(durasi.jedaKalimat);
    expect(naratorSibuk()).toBe(false);
  });

  test("kalimat yang sama tidak masuk antrean dua kali", async () => {
    bicara("jalur.coba-lagi");
    expect(await bicara("jalur.coba-lagi")).toBe(false);
    await vi.advanceTimersByTimeAsync(durasi.kalimatTanpaSuara * 3);
    expect(terdengar.filter((id) => id === "jalur.coba-lagi")).toHaveLength(1);
  });

  test("diam() menghentikan kalimat dan mengosongkan antrean", async () => {
    const pertama = bicara("umum.sapa");
    const kedua = bicara("jalur.tugas");
    await vi.advanceTimersByTimeAsync(100);
    diam();
    expect(await pertama).toBe(false);
    expect(await kedua).toBe(false);
    await vi.advanceTimersByTimeAsync(durasi.kalimatTanpaSuara * 3);
    expect(terdengar).toEqual(["umum.sapa", null]);
    expect(naratorSibuk()).toBe(false);
  });
});
