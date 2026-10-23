import { mkdtempSync, readdirSync, rmSync, writeFileSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { HasilSimpanKarya, Karya, RingkasanKarya } from "@platform/skema";
import { buatAplikasi } from "../src/aplikasi";
import { bukaDatabase, databaseKosong, versiSkema, VERSI_SKEMA, type Db } from "../src/database/database";
import { buatCadangan, daftarCadangan, pulihkanTerbaru, SIMPAN_TERAKHIR } from "../src/cadangan/cadangan";

let folder: string;
let db: Db;
let berubah: number;
let app: ReturnType<typeof buatAplikasi>;

const kirim = (jalur: string, metode = "GET", isi?: unknown) =>
  app.request(`/api${jalur}`, {
    method: metode,
    headers: isi === undefined ? {} : { "content-type": "application/json" },
    body: isi === undefined ? undefined : typeof isi === "string" ? isi : JSON.stringify(isi),
  });

const karya = (versi: number, isi: Record<string, unknown> = { tokoh: "kucing" }) => ({ isi, gambarKecil: null, versi });

beforeEach(() => {
  folder = mkdtempSync(join(tmpdir(), "platform-uji-"));
  db = bukaDatabase(join(folder, "platform.db"));
  berubah = 0;
  app = buatAplikasi({ db, saatBerubah: () => berubah++ });
});

afterEach(() => {
  db.close();
  rmSync(folder, { recursive: true, force: true });
});

describe("kesehatan", () => {
  it("menjawab siap beserta versi skema", async () => {
    const r = await kirim("/kesehatan");
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ siap: true, versiSkema: VERSI_SKEMA });
  });
});

describe("progres", () => {
  it("menyimpan dan mengembalikan progres setiap permainan", async () => {
    expect(await (await kirim("/progres")).json()).toEqual({});
    const r = await kirim("/progres/jalur", "PUT", { levelTerakhir: 2, levelTertinggiSelesai: 1 });
    expect(r.status).toBe(200);
    await kirim("/progres/tirai", "PUT", { levelTerakhir: 0, levelTertinggiSelesai: -1 });
    expect(await (await kirim("/progres")).json()).toEqual({
      jalur: { levelTerakhir: 2, levelTertinggiSelesai: 1 },
      tirai: { levelTerakhir: 0, levelTertinggiSelesai: -1 },
    });
    expect(berubah).toBe(2);
  });

  it("level tertinggi yang selesai tidak pernah turun", async () => {
    await kirim("/progres/jalur", "PUT", { levelTerakhir: 4, levelTertinggiSelesai: 3 });
    const r = await kirim("/progres/jalur", "PUT", { levelTerakhir: 1, levelTertinggiSelesai: 0 });
    expect(await r.json()).toEqual({ levelTerakhir: 1, levelTertinggiSelesai: 3 });
  });

  it.each([
    ["permainan tidak dikenal", "/progres/catur", { levelTerakhir: 0, levelTertinggiSelesai: -1 }, 404],
    ["level negatif", "/progres/jalur", { levelTerakhir: -1, levelTertinggiSelesai: -1 }, 400],
    ["kolom hilang", "/progres/jalur", { levelTerakhir: 1 }, 400],
    ["bukan JSON", "/progres/jalur", "{ini bukan json", 400],
  ])("menolak %s tanpa menyentuh database", async (_nama, jalur, isi, status) => {
    expect((await kirim(jalur, "PUT", isi)).status).toBe(status);
    expect(databaseKosong(db)).toBe(true);
    expect(berubah).toBe(0);
  });
});

describe("karya", () => {
  it("menyimpan karya baru, lalu menampilkannya di daftar tanpa isi lengkap", async () => {
    const id = randomUUID();
    const r = await kirim(`/karya/${id}`, "PUT", karya(1));
    expect(await r.json()).toEqual({ id, versi: 1, disimpanSebagaiBaru: false });
    const daftar = (await (await kirim("/karya")).json()) as RingkasanKarya[];
    expect(daftar).toHaveLength(1);
    expect(daftar[0]).not.toHaveProperty("isi");
    expect(((await (await kirim(`/karya/${id}`)).json()) as Karya).isi).toEqual({ tokoh: "kucing" });
  });

  it("simpan dua kali dengan id yang sama tidak membuat karya ganda", async () => {
    const id = randomUUID();
    await kirim(`/karya/${id}`, "PUT", karya(1));
    await kirim(`/karya/${id}`, "PUT", karya(1));
    await kirim(`/karya/${id}`, "PUT", karya(2, { tokoh: "ikan" }));
    const daftar = (await (await kirim("/karya")).json()) as RingkasanKarya[];
    expect(daftar).toHaveLength(1);
    expect(daftar[0].versi).toBe(2);
  });

  it("versi lebih lama tidak menimpa karya, tetapi disimpan sebagai karya baru", async () => {
    const id = randomUUID();
    await kirim(`/karya/${id}`, "PUT", karya(3, { tokoh: "terbaru" }));
    const r = (await (await kirim(`/karya/${id}`, "PUT", karya(2, { tokoh: "lama" }))).json()) as HasilSimpanKarya;
    expect(r.disimpanSebagaiBaru).toBe(true);
    expect(r.id).not.toBe(id);
    expect(((await (await kirim(`/karya/${id}`)).json()) as Karya).isi).toEqual({ tokoh: "terbaru" });
    expect(((await (await kirim(`/karya/${r.id}`)).json()) as Karya).isi).toEqual({ tokoh: "lama" });
  });

  it("menolak id yang bukan UUID, gambar kecil yang bukan gambar, dan kiriman terlalu besar", async () => {
    expect((await kirim("/karya/abc", "PUT", karya(1))).status).toBe(400);
    expect((await kirim(`/karya/${randomUUID()}`, "PUT", { ...karya(1), gambarKecil: "javascript:alert(1)" })).status).toBe(400);
    expect((await kirim(`/karya/${randomUUID()}`, "PUT", karya(1, { besar: "x".repeat(600 * 1024) }))).status).toBe(413);
    expect(databaseKosong(db)).toBe(true);
  });

  it("karya yang tidak ada menjawab 404", async () => {
    expect((await kirim(`/karya/${randomUUID()}`)).status).toBe(404);
  });

  it("tidak ada jalur untuk menghapus karya", async () => {
    const id = randomUUID();
    await kirim(`/karya/${id}`, "PUT", karya(1));
    expect((await kirim(`/karya/${id}`, "DELETE")).status).toBe(404);
    expect(await (await kirim("/karya")).json()).toHaveLength(1);
  });
});

describe("struktur database", () => {
  it("database baru langsung memakai versi skema terbaru", () => {
    expect(versiSkema(db)).toBe(VERSI_SKEMA);
  });

  it("menolak database dari versi platform yang lebih baru", () => {
    db.prepare("UPDATE info SET versi_skema = 99").run();
    db.close();
    expect(() => bukaDatabase(join(folder, "platform.db"))).toThrow(/lebih baru/);
    db = bukaDatabase(join(folder, "kosong.db"));
  });
});

describe("cadangan dan pemulihan", () => {
  it("cadangan lalu pulihkan menghasilkan data yang sama persis", async () => {
    const id = randomUUID();
    await kirim("/progres/jalur", "PUT", { levelTerakhir: 5, levelTertinggiSelesai: 4 });
    await kirim(`/karya/${id}`, "PUT", karya(7, { tokoh: "kancil", warna: [1, 2, 3] }));
    const sebelum = { progres: await (await kirim("/progres")).json(), karya: await (await kirim(`/karya/${id}`)).json() };

    const folderCadangan = join(folder, "cadangan");
    buatCadangan(db, folderCadangan);

    // Laptop baru: volume kosong, hanya folder cadangan yang dibawa.
    const jalurBaru = join(folder, "laptop-baru.db");
    expect(pulihkanTerbaru(folderCadangan, jalurBaru)).not.toBeNull();
    db.close();
    db = bukaDatabase(jalurBaru);
    app = buatAplikasi({ db });
    const sesudah = { progres: await (await kirim("/progres")).json(), karya: await (await kirim(`/karya/${id}`)).json() };
    expect(sesudah).toEqual(sebelum);
  });

  it("hanya sepuluh cadangan terbaru yang disimpan", () => {
    const folderCadangan = join(folder, "cadangan");
    for (let i = 0; i < SIMPAN_TERAKHIR + 3; i++) buatCadangan(db, folderCadangan, new Date(2026, 9, 22, 10, 0, i));
    expect(daftarCadangan(folderCadangan)).toHaveLength(SIMPAN_TERAKHIR);
    expect(readdirSync(folderCadangan).filter((n) => n.endsWith(".sementara"))).toHaveLength(0);
  });

  it("pemulihan memakai cadangan terbaru", async () => {
    const folderCadangan = join(folder, "cadangan");
    await kirim("/progres/jalur", "PUT", { levelTerakhir: 1, levelTertinggiSelesai: 0 });
    const lama = buatCadangan(db, folderCadangan, new Date(2026, 9, 22, 9, 0, 0));
    utimesSync(lama, new Date(2026, 9, 22, 9), new Date(2026, 9, 22, 9));
    await kirim("/progres/jalur", "PUT", { levelTerakhir: 3, levelTertinggiSelesai: 2 });
    buatCadangan(db, folderCadangan, new Date(2026, 9, 22, 10, 0, 0));

    const jalurBaru = join(folder, "baru.db");
    pulihkanTerbaru(folderCadangan, jalurBaru);
    const pulih = bukaDatabase(jalurBaru);
    expect(pulih.prepare("SELECT level_terakhir AS l FROM progres").get()).toEqual({ l: 3 });
    pulih.close();
  });

  it("tanpa cadangan, pemulihan tidak melakukan apa pun", () => {
    expect(pulihkanTerbaru(join(folder, "tidak-ada"), join(folder, "x.db"))).toBeNull();
    writeFileSync(join(folder, "platform-2026-10-22-100000.db"), "");
    expect(pulihkanTerbaru(folder, join(folder, "y.db"))).toBeNull();
  });
});
