import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { serve } from "@hono/node-server";
import { buatAplikasi } from "./app";
import { bukaDatabase, databaseKosong } from "./database/database";
import { buatCadangan, pulihkanTerbaru } from "./backup/backup";

// Alamat bawaan dihitung dari folder proyek (dua tingkat di atas file ini, baik src/ maupun dist/),
// karena `npm start` menjalankan backend dari folder backend/. Di Docker, semuanya diatur lewat env.
const akarProyek = resolve(import.meta.dirname, "..", "..");
const folderData = resolve(process.env.DATA_DIR ?? join(akarProyek, "data"));
const folderCadangan = resolve(process.env.BACKUP_DIR ?? join(akarProyek, "backups"));
const folderTampilan = resolve(process.env.UI_DIR ?? join(akarProyek, "frontend", "dist"));
const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 8080);
const selangCadangan = Number(process.env.BACKUP_INTERVAL_MS ?? 30 * 60 * 1000);

mkdirSync(folderData, { recursive: true });
const jalurDatabase = join(folderData, "platform.db");

// Volume kosong di laptop baru: pakai cadangan terbaru kalau ada.
if (!existsSync(jalurDatabase)) {
  const dipulihkan = pulihkanTerbaru(folderCadangan, jalurDatabase);
  console.log(dipulihkan ? `Database dipulihkan dari ${dipulihkan}` : "Database baru dibuat (pertama kali dipakai).");
}

const db = bukaDatabase(jalurDatabase);

let adaPerubahan = false;
const cadangkan = (alasan: string) => {
  try {
    const file = buatCadangan(db, folderCadangan);
    adaPerubahan = false;
    console.log(`Cadangan dibuat (${alasan}): ${file}`);
  } catch (e) {
    console.error("Cadangan gagal dibuat:", e);
  }
};

if (!databaseKosong(db)) cadangkan("platform menyala");

const jadwal = setInterval(() => adaPerubahan && cadangkan("berkala"), selangCadangan);

const app = buatAplikasi({ db, folderTampilan, saatBerubah: () => (adaPerubahan = true) });
const server = serve({ fetch: app.fetch, hostname: host, port }, (info) => {
  console.log(`Platform berjalan di http://${host === "0.0.0.0" ? "localhost" : host}:${info.port}`);
});

let berhenti = false;
const hentikan = (sinyal: string) => {
  if (berhenti) return;
  berhenti = true;
  clearInterval(jadwal);
  if (!databaseKosong(db)) cadangkan(`platform dihentikan, ${sinyal}`);
  server.close();
  db.close();
  process.exit(0);
};
process.on("SIGTERM", () => hentikan("SIGTERM"));
process.on("SIGINT", () => hentikan("SIGINT"));
