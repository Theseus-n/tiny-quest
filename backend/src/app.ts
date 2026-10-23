import { existsSync } from "node:fs";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { serveStatic } from "@hono/node-server/serve-static";
import { versiSkema, type Db } from "./database/database";
import { jalurProgres } from "./routes/progress";
import { jalurKarya } from "./routes/artworks";

type Pilihan = {
  db: Db;
  /** Folder hasil build frontend. Kalau tidak ada, hanya /api yang disajikan. */
  folderTampilan?: string;
  saatBerubah?: () => void;
};

export function buatAplikasi({ db, folderTampilan, saatBerubah = () => {} }: Pilihan) {
  const app = new Hono();

  const api = new Hono();
  api.use(bodyLimit({ maxSize: 512 * 1024, onError: (c) => c.json({ kesalahan: "kiriman terlalu besar" }, 413) }));
  api.get("/kesehatan", (c) => {
    try {
      return c.json({ siap: true, versiSkema: versiSkema(db) });
    } catch {
      return c.json({ siap: false }, 503);
    }
  });
  api.route("/progres", jalurProgres(db, saatBerubah));
  api.route("/karya", jalurKarya(db, saatBerubah));
  api.onError((e, c) => {
    console.error(e);
    return c.json({ kesalahan: "backend gagal memproses permintaan" }, 500);
  });
  app.route("/api", api);
  // Didaftarkan sebelum penyaji tampilan, supaya jalur /api yang salah tidak dijawab dengan halaman tampilan.
  app.all("/api/*", (c) => c.json({ kesalahan: "jalur tidak ada" }, 404));

  if (folderTampilan && existsSync(folderTampilan)) {
    app.use("/*", serveStatic({ root: folderTampilan }));
    app.get("/*", serveStatic({ root: folderTampilan, path: "index.html" }));
  }

  return app;
}
