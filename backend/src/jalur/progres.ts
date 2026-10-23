import { Hono } from "hono";
import { NamaPermainan, Progres, type SemuaProgres } from "@platform/skema";
import type { Db } from "../database/database";

type Baris = { permainan: NamaPermainan; level_terakhir: number; level_tertinggi_selesai: number };

export function jalurProgres(db: Db, saatBerubah: () => void) {
  const app = new Hono();

  app.get("/", (c) => {
    const semua: SemuaProgres = {};
    for (const b of db.prepare("SELECT permainan, level_terakhir, level_tertinggi_selesai FROM progres").all() as Baris[]) {
      semua[b.permainan] = { levelTerakhir: b.level_terakhir, levelTertinggiSelesai: b.level_tertinggi_selesai };
    }
    return c.json(semua);
  });

  app.put("/:permainan", async (c) => {
    const permainan = NamaPermainan.safeParse(c.req.param("permainan"));
    if (!permainan.success) return c.json({ kesalahan: "permainan tidak dikenal" }, 404);
    const isi = Progres.safeParse(await c.req.json().catch(() => null));
    if (!isi.success) return c.json({ kesalahan: "bentuk progres salah" }, 400);

    // Level tertinggi yang pernah selesai tidak pernah turun, walaupun permintaan lama datang belakangan.
    db.prepare(
      `INSERT INTO progres (permainan, level_terakhir, level_tertinggi_selesai, diperbarui)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (permainan) DO UPDATE SET
         level_terakhir = excluded.level_terakhir,
         level_tertinggi_selesai = MAX(level_tertinggi_selesai, excluded.level_tertinggi_selesai),
         diperbarui = excluded.diperbarui`,
    ).run(permainan.data, isi.data.levelTerakhir, isi.data.levelTertinggiSelesai, new Date().toISOString());
    saatBerubah();

    const b = db.prepare("SELECT level_terakhir, level_tertinggi_selesai FROM progres WHERE permainan = ?").get(permainan.data) as Baris;
    return c.json({ levelTerakhir: b.level_terakhir, levelTertinggiSelesai: b.level_tertinggi_selesai });
  });

  return app;
}
