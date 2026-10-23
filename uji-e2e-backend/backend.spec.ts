import { readdirSync } from "node:fs";
import type { ChildProcess } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import { ALAMAT, folderBaru, matikan, nyalakan } from "./server";

const foto = (nama: string) => `uji-e2e/hasil/${nama}.png`;

let proses: ChildProcess | null = null;
test.afterEach(async () => {
  if (proses) await matikan(proses);
  proses = null;
});

async function selesaikanJalurLevel1(page: Page) {
  await page.getByTestId("mulai").click();
  await page.getByTestId("permainan-jalur").click();
  for (const slot of [1, 2, 3]) {
    await page.getByTestId("palet-maju").click();
    await page.getByTestId(`slot-${slot}`).click();
  }
  await page.getByTestId("jalan").click();
  await expect(page.getByTestId("pemandu").locator("svg")).toHaveAttribute("data-pose", "tepuk", { timeout: 6000 });
}

const progresBackend = async () => (await fetch(`${ALAMAT}/api/progres`)).json();

test("backend menyajikan tampilan, dan jalur /api yang tidak ada menjawab 404", async ({ page }) => {
  proses = await nyalakan(folderBaru("data"), folderBaru("cadangan"));
  await page.goto("/");
  await expect(page.getByTestId("mulai")).toBeVisible();
  const r = await fetch(`${ALAMAT}/api/tidak-ada`);
  expect(r.status).toBe(404);
  expect(await r.json()).toEqual({ kesalahan: "jalur tidak ada" });
});

test("dijalankan seperti npm run mulai (dari folder backend/), tampilan tetap ditemukan", async ({ page }) => {
  proses = await nyalakan(folderBaru("data"), folderBaru("cadangan"), [], { sepertiNpmMulai: true });
  await page.goto("/");
  await expect(page.getByTestId("mulai")).toBeVisible();
});

test("progres yang diselesaikan anak tersimpan di backend", async ({ page }) => {
  proses = await nyalakan(folderBaru("data"), folderBaru("cadangan"));
  await page.goto("/");
  await selesaikanJalurLevel1(page);
  await expect.poll(progresBackend, { timeout: 6000 }).toEqual({ jalur: { levelTerakhir: 1, levelTertinggiSelesai: 0 } });
});

test("karya Studio Kreasi tersimpan di backend dan bisa dibuka dari browser lain", async ({ page, browser }) => {
  proses = await nyalakan(folderBaru("data"), folderBaru("cadangan"));
  await page.goto("/");
  await page.getByTestId("mulai").click();
  await page.getByTestId("permainan-studio").click();
  await page.getByTestId("karya-baru").click();
  await page.getByTestId("rak-bola").click();
  const b = (await page.getByTestId("panggung").boundingBox())!;
  await page.mouse.click(b.x + (2.5 * b.width) / 9, b.y + (1.5 * b.height) / 4);
  const daftarKarya = async () => (await fetch(`${ALAMAT}/api/karya`)).json();
  await expect.poll(async () => (await daftarKarya()).length, { timeout: 6000 }).toBe(1);
  expect((await daftarKarya())[0].gambarKecil).toMatch(/^data:image\/svg\+xml;base64,/);

  const lain = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await lain.goto("/");
  await lain.getByTestId("mulai").click();
  await lain.getByTestId("permainan-studio").click();
  await lain.getByTestId("karya-1").click();
  await expect(lain.getByTestId("tokoh-bola").locator("[data-sel]")).toHaveAttribute("data-sel", "2,1");
  await lain.close();
});

test("browser baru tanpa simpanan lokal melanjutkan dari progres di backend", async ({ page, browser }) => {
  proses = await nyalakan(folderBaru("data"), folderBaru("cadangan"));
  await page.goto("/");
  await selesaikanJalurLevel1(page);
  await expect.poll(progresBackend, { timeout: 6000 }).toMatchObject({ jalur: { levelTertinggiSelesai: 0 } });

  const lain = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await lain.goto("/");
  await lain.getByTestId("mulai").click();
  await lain.getByTestId("permainan-jalur").click();
  await expect(lain.locator("[data-sekarang]")).toContainText("2");
  await lain.close();
});

test("backend mati: anak tetap bisa bermain, kabel lepas muncul, lalu progres terkirim saat backend hidup lagi", async ({ page }) => {
  test.setTimeout(90_000);
  const data = folderBaru("data");
  const cadangan = folderBaru("cadangan");
  proses = await nyalakan(data, cadangan);
  await page.goto("/");
  await page.getByTestId("mulai").click();
  await page.getByTestId("permainan-jalur").click();
  await page.getByTestId("kembali").click();

  await matikan(proses);
  await page.getByTestId("permainan-jalur").click();
  for (const slot of [1, 2, 3]) {
    await page.getByTestId("palet-maju").click();
    await page.getByTestId(`slot-${slot}`).click();
  }
  await page.getByTestId("jalan").click();
  await expect(page.getByTestId("pemandu").locator("svg")).toHaveAttribute("data-pose", "tepuk", { timeout: 6000 });
  await page.getByTestId("lanjut").click();
  await expect(page.locator("[data-sekarang]")).toContainText("2");

  await expect(page.getByTestId("kabel-lepas")).toBeVisible({ timeout: 25_000 });
  await page.screenshot({ path: foto("15-kabel-lepas") });

  proses = await nyalakan(data, cadangan);
  await expect(page.getByTestId("kabel-lepas")).toBeHidden({ timeout: 10_000 });
  await expect.poll(progresBackend, { timeout: 10_000 }).toEqual({ jalur: { levelTerakhir: 1, levelTertinggiSelesai: 0 } });
});

test("pindah laptop: volume baru yang kosong memulihkan cadangan terbaru", async ({ page, browser }) => {
  const cadangan = folderBaru("cadangan");
  proses = await nyalakan(folderBaru("laptop-lama"), cadangan);
  await page.goto("/");
  await selesaikanJalurLevel1(page);
  await expect.poll(progresBackend, { timeout: 6000 }).toMatchObject({ jalur: { levelTertinggiSelesai: 0 } });

  // Cadangan berkala dibuat karena ada perubahan (selang dipendekkan untuk uji).
  await expect.poll(() => readdirSync(cadangan).filter((n) => n.endsWith(".db")).length, { timeout: 6000 }).toBeGreaterThan(0);
  await matikan(proses);

  // Laptop baru: folder data kosong, hanya folder cadangan yang dibawa.
  const log: string[] = [];
  proses = await nyalakan(folderBaru("laptop-baru"), cadangan, log);
  expect(log.join("\n")).toMatch(/Database dipulihkan dari/);
  expect(await progresBackend()).toEqual({ jalur: { levelTerakhir: 1, levelTertinggiSelesai: 0 } });

  const lain = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await lain.goto("/");
  await lain.getByTestId("mulai").click();
  await lain.getByTestId("permainan-jalur").click();
  await expect(lain.locator("[data-sekarang]")).toContainText("2");
  await lain.close();
});
