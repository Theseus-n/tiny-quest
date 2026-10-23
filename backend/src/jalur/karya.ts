import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { IdKarya, SimpanKarya, type HasilSimpanKarya, type Karya, type RingkasanKarya } from "@platform/skema";
import type { Db } from "../database/database";

type Baris = { id: string; isi: string; gambar_kecil: string | null; versi: number; dibuat: string; diperbarui: string };

const ringkas = (b: Omit<Baris, "isi">): RingkasanKarya => ({
  id: b.id,
  gambarKecil: b.gambar_kecil,
  versi: b.versi,
  dibuat: b.dibuat,
  diperbarui: b.diperbarui,
});

export function jalurKarya(db: Db, saatBerubah: () => void) {
  const app = new Hono();

  app.get("/", (c) => {
    const baris = db.prepare("SELECT id, gambar_kecil, versi, dibuat, diperbarui FROM karya ORDER BY diperbarui DESC").all() as Omit<Baris, "isi">[];
    return c.json(baris.map(ringkas));
  });

  app.get("/:id", (c) => {
    const id = IdKarya.safeParse(c.req.param("id"));
    if (!id.success) return c.json({ kesalahan: "id karya salah" }, 400);
    const b = db.prepare("SELECT * FROM karya WHERE id = ?").get(id.data) as Baris | undefined;
    if (!b) return c.json({ kesalahan: "karya tidak ada" }, 404);
    const karya: Karya = { ...ringkas(b), isi: JSON.parse(b.isi) };
    return c.json(karya);
  });

  // id dibuat oleh tampilan, jadi permintaan yang terkirim dua kali tidak membuat karya ganda.
  // Kalau versi di database lebih baru, kiriman ini disimpan sebagai karya baru supaya tidak ada yang tertimpa.
  app.put("/:id", async (c) => {
    const id = IdKarya.safeParse(c.req.param("id"));
    if (!id.success) return c.json({ kesalahan: "id karya salah" }, 400);
    const isi = SimpanKarya.safeParse(await c.req.json().catch(() => null));
    if (!isi.success) return c.json({ kesalahan: "bentuk karya salah" }, 400);

    const sekarang = new Date().toISOString();
    const hasil = db.transaction((): HasilSimpanKarya => {
      const ada = db.prepare("SELECT versi FROM karya WHERE id = ?").get(id.data) as { versi: number } | undefined;
      const isiJson = JSON.stringify(isi.data.isi);
      if (ada && ada.versi > isi.data.versi) {
        const idBaru = randomUUID();
        db.prepare("INSERT INTO karya (id, isi, gambar_kecil, versi, dibuat, diperbarui) VALUES (?, ?, ?, ?, ?, ?)").run(
          idBaru, isiJson, isi.data.gambarKecil, isi.data.versi, sekarang, sekarang,
        );
        return { id: idBaru, versi: isi.data.versi, disimpanSebagaiBaru: true };
      }
      db.prepare(
        `INSERT INTO karya (id, isi, gambar_kecil, versi, dibuat, diperbarui) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET isi = excluded.isi, gambar_kecil = excluded.gambar_kecil,
           versi = excluded.versi, diperbarui = excluded.diperbarui`,
      ).run(id.data, isiJson, isi.data.gambarKecil, isi.data.versi, sekarang, sekarang);
      return { id: id.data, versi: isi.data.versi, disimpanSebagaiBaru: false };
    })();
    saatBerubah();
    return c.json(hasil);
  });

  return app;
}
