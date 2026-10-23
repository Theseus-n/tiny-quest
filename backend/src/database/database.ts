import Database from "better-sqlite3";

export type Db = Database.Database;

// Setiap langkah mengubah struktur dari versi sebelumnya ke versi berikutnya.
// Langkah lama tidak boleh diubah; perubahan baru ditambahkan di akhir.
const perubahanStruktur: string[] = [
  `CREATE TABLE progres (
     permainan TEXT PRIMARY KEY,
     level_terakhir INTEGER NOT NULL,
     level_tertinggi_selesai INTEGER NOT NULL,
     diperbarui TEXT NOT NULL
   );
   CREATE TABLE karya (
     id TEXT PRIMARY KEY,
     isi TEXT NOT NULL,
     gambar_kecil TEXT,
     versi INTEGER NOT NULL,
     dibuat TEXT NOT NULL,
     diperbarui TEXT NOT NULL
   );`,
];

export const VERSI_SKEMA = perubahanStruktur.length;

export function bukaDatabase(jalur: string): Db {
  const db = new Database(jalur);
  try {
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.exec("CREATE TABLE IF NOT EXISTS info (versi_skema INTEGER NOT NULL)");
    if (!db.prepare("SELECT 1 FROM info").get()) db.prepare("INSERT INTO info (versi_skema) VALUES (0)").run();
    jalankanPerubahan(db);
    return db;
  } catch (e) {
    // Tutup dulu, supaya file database tidak tetap terkunci setelah gagal dibuka.
    db.close();
    throw e;
  }
}

export function versiSkema(db: Db): number {
  return (db.prepare("SELECT versi_skema AS v FROM info").get() as { v: number }).v;
}

function jalankanPerubahan(db: Db) {
  const sekarang = versiSkema(db);
  if (sekarang > VERSI_SKEMA) {
    throw new Error(`Database berasal dari versi platform yang lebih baru (skema ${sekarang}, platform ini ${VERSI_SKEMA}).`);
  }
  for (let v = sekarang; v < VERSI_SKEMA; v++) {
    db.transaction(() => {
      db.exec(perubahanStruktur[v]);
      db.prepare("UPDATE info SET versi_skema = ?").run(v + 1);
    })();
  }
}

/** Database dianggap kosong kalau belum ada progres dan belum ada karya. */
export function databaseKosong(db: Db): boolean {
  const progres = db.prepare("SELECT COUNT(*) AS n FROM progres").get() as { n: number };
  const karya = db.prepare("SELECT COUNT(*) AS n FROM karya").get() as { n: number };
  return progres.n === 0 && karya.n === 0;
}
