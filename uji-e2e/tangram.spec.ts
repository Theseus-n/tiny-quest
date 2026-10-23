import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { bukaPlatform, periksaUkuranKlik } from "./bantu";

const foto = (nama: string) => `uji-e2e/hasil/${nama}.png`;

type Level = { tempat: { jenis: string; sudut: number }[]; rak: { jenis: string; sudut: number }[] };
const folder = join(import.meta.dirname, "..", "frontend", "konten", "level", "tangram");
const level: Level[] = readdirSync(folder)
  .sort()
  .map((n) => JSON.parse(readFileSync(join(folder, n), "utf8")));

async function bukaDiLevel(page: Page, nomor: number) {
  const kesalahan = await bukaPlatform(page);
  if (nomor > 1) {
    await page.evaluate((l) => localStorage.setItem("platform.progres", JSON.stringify({ tangram: { levelTerakhir: l - 1, levelTertinggiSelesai: l - 2 } })), nomor);
    await page.reload();
    await page.getByTestId("mulai").click();
  }
  await page.getByTestId("permainan-tangram").click();
  await expect(page.locator("[data-sekarang]")).toContainText(String(nomor));
  return kesalahan;
}

/** Klik tepat di titik pusat sebuah tempat di bayangan. */
async function klikTempat(page: Page, nomor: number) {
  const b = (await page.getByTestId(`tempat-${nomor}`).boundingBox())!;
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
}

const letak = (page: Page, nomor: number) => page.getByTestId(`potongan-${nomor}`).locator("[data-letak]");
const pose = (page: Page) => page.getByTestId("pemandu").locator("svg");

/** Banyak klik pegangan dari sudut a ke sudut b. Persegi terlihat sama setiap 90 derajat. */
function klikPutar(jenis: string, a: number, b: number) {
  const periode = jenis === "persegi" ? 90 : 360;
  for (let n = 0; n < 8; n++) if ((((a + n * 45 - b) % periode) + periode) % periode === 0) return n;
  throw new Error("sudut tidak bisa dicapai");
}

test.describe("Matriks Tangram", () => {
  test("level 1: Si Kancil menjelaskan, potongan ditaruh dengan klik, menempel, lalu bentuk lengkap", async ({ page }) => {
    const kesalahan = await bukaDiLevel(page, 1);
    await expect(page.getByTestId("gelembung")).toHaveAttribute("data-kalimat", "tangram.tugas", { timeout: 4000 });
    await expect(page.locator("[data-garis-bantu]")).toHaveCount(2);
    await page.screenshot({ path: foto("40-tangram-level-1") });

    await page.getByTestId("potongan-1").click();
    await klikTempat(page, 1);
    await expect(letak(page, 1)).toHaveAttribute("data-letak", "tempat");
    await expect(page.getByTestId("bayangan")).toHaveAttribute("data-terisi", "1");
    await page.screenshot({ path: foto("41-tangram-menempel") });

    await page.getByTestId("potongan-2").click();
    await klikTempat(page, 2);
    await expect(page.getByTestId("bayangan")).toHaveAttribute("data-terisi", "2");
    await expect(pose(page)).toHaveAttribute("data-pose", "tepuk");
    await expect(page.getByTestId("selamat")).toBeVisible({ timeout: 4000 });
    expect(kesalahan).toEqual([]);
  });

  test("level 2: pegangan memutar 45 derajat per klik; potongan bersudut salah diam di papan lalu menempel saat diputar pas", async ({ page }) => {
    await bukaDiLevel(page, 2);
    await expect(page.getByTestId("gelembung")).toHaveAttribute("data-kalimat", "tangram.putar", { timeout: 3000 });

    // Potongan 2 (sudut 0) ditaruh di atap (sudut 45): belum menempel, Si Kancil menunjuk.
    await page.getByTestId("potongan-2").click();
    await klikTempat(page, 1);
    await expect(letak(page, 2)).toHaveAttribute("data-letak", "papan");
    await expect(pose(page)).toHaveAttribute("data-pose", "tunjuk");
    await page.screenshot({ path: foto("42-tangram-sudut-salah") });

    await page.getByTestId("putar-2").click();
    await expect(letak(page, 2)).toHaveAttribute("data-letak", "tempat");
    await expect(letak(page, 2)).toHaveAttribute("data-sudut", "45");

    // Satu klik pegangan, satu langkah 45 derajat.
    await page.getByTestId("putar-1").click();
    await expect(letak(page, 1)).toHaveAttribute("data-sudut", "45");
    await page.getByTestId("putar-1").click();
    await expect(letak(page, 1)).toHaveAttribute("data-sudut", "90");
  });

  test("potongan yang menempel tidak bisa tergeser oleh klik lain", async ({ page }) => {
    await bukaDiLevel(page, 1);
    await page.getByTestId("potongan-1").click();
    await klikTempat(page, 1);
    await expect(letak(page, 1)).toHaveAttribute("data-letak", "tempat");
    // Klik di atas potongan yang menempel, lalu klik di tempat lain di papan.
    await klikTempat(page, 1);
    const papan = (await page.getByTestId("papan").boundingBox())!;
    await page.mouse.click(papan.x + 60, papan.y + 60);
    await expect(letak(page, 1)).toHaveAttribute("data-letak", "tempat");
    await expect(page.getByTestId("putar-1")).toHaveCount(0);
  });

  test("potongan bisa diseret ke bayangan", async ({ page }) => {
    await bukaDiLevel(page, 1);
    const a = (await page.getByTestId("potongan-2").boundingBox())!;
    const b = (await page.getByTestId("tempat-2").boundingBox())!;
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + 40, b.y + 40, { steps: 10 });
    await page.mouse.move(b.x + 1, b.y + 1, { steps: 5 });
    await page.mouse.up();
    await expect(letak(page, 2)).toHaveAttribute("data-letak", "tempat");
  });

  test("seluruh level Matriks Tangram bisa diselesaikan dengan klik", async ({ page }) => {
    test.setTimeout(150_000);
    await bukaDiLevel(page, 1);
    for (const [n, l] of level.entries()) {
      await expect(page.locator("[data-sekarang]")).toContainText(String(n + 1));
      await page.waitForTimeout(300);
      const dipakai = new Set<number>();
      for (const [t, tempat] of l.tempat.entries()) {
        // Pilih potongan sejenis yang paling sedikit perlu diputar.
        const pilihan = l.rak
          .map((p, i) => ({ i, klik: p.jenis === tempat.jenis && !dipakai.has(i) ? klikPutar(p.jenis, p.sudut, tempat.sudut) : Infinity }))
          .sort((x, y) => x.klik - y.klik)[0];
        dipakai.add(pilihan.i);
        for (let k = 0; k < pilihan.klik; k++) await page.getByTestId(`putar-${pilihan.i + 1}`).click();
        await page.getByTestId(`potongan-${pilihan.i + 1}`).click();
        await klikTempat(page, t + 1);
        await expect(letak(page, pilihan.i + 1)).toHaveAttribute("data-letak", "tempat");
      }
      if (n === level.length - 1) await page.screenshot({ path: foto("43-tangram-kucing") });
      await expect(page.getByTestId("selamat")).toBeVisible({ timeout: 4000 });
      if (n < level.length - 1) await page.getByTestId("lanjut").click();
    }
    await expect(page.locator("[data-terkunci]")).toHaveCount(0);
  });

  test("semua benda yang bisa diklik minimal 88 unit, termasuk pegangan putar", async ({ page }) => {
    await bukaDiLevel(page, 6);
    await periksaUkuranKlik(page);
  });
});
