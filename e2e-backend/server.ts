import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const ALAMAT = "http://127.0.0.1:8090";

export function folderBaru(nama: string) {
  return mkdtempSync(join(tmpdir(), `platform-${nama}-`));
}

/** Menyalakan backend hasil build, lalu menunggu sampai /api/kesehatan menjawab. */
export async function nyalakan(
  folderData: string,
  folderCadangan: string,
  log: string[] = [],
  { sepertiNpmMulai = false } = {},
): Promise<ChildProcess> {
  // sepertiNpmMulai: dijalankan dari folder backend/ tanpa UI_DIR, seperti `npm start`.
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PORT: "8090",
    HOST: "127.0.0.1",
    DATA_DIR: folderData,
    BACKUP_DIR: folderCadangan,
    BACKUP_INTERVAL_MS: "1500",
  };
  if (!sepertiNpmMulai) env.UI_DIR = "frontend/dist";
  const proses = spawn(process.execPath, [sepertiNpmMulai ? "dist/server.js" : "backend/dist/server.js"], {
    cwd: sepertiNpmMulai ? "backend" : undefined,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  proses.stdout!.on("data", (d) => log.push(String(d).trim()));
  proses.stderr!.on("data", (d) => log.push(String(d).trim()));
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`${ALAMAT}/api/kesehatan`);
      if (r.ok) return proses;
    } catch {
      // belum siap
    }
    await new Promise((s) => setTimeout(s, 100));
  }
  proses.kill();
  throw new Error(`Backend tidak menyala:\n${log.join("\n")}`);
}

export async function matikan(proses: ChildProcess) {
  if (proses.exitCode !== null) return;
  const selesai = new Promise((s) => proses.once("exit", s));
  proses.kill();
  await selesai;
}
