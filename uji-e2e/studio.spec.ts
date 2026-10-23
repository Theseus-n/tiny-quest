import { expect, test, type Page } from "@playwright/test";
import { bukaPlatform, periksaUkuranKlik } from "./bantu";

const foto = (nama: string) => `uji-e2e/hasil/${nama}.png`;

/** Klik di tengah kotak (kolom, baris) panggung 9 × 4. */
async function klikKotak(page: Page, kolom: number, baris: number) {
  const b = (await page.getByTestId("panggung").boundingBox())!;
  await page.mouse.click(b.x + ((kolom + 0.5) * b.width) / 9, b.y + ((baris + 0.5) * b.height) / 4);
}

const tokoh = (page: Page, jenis: string) => page.getByTestId(`tokoh-${jenis}`).locator("[data-sel]");

async function bukaKaryaBaru(page: Page) {
  const kesalahan = await bukaPlatform(page);
  await page.getByTestId("permainan-studio").click();
  await page.getByTestId("karya-baru").click();
  return kesalahan;
}

test.describe("Studio Kreasi", () => {
  test("karya pertama: Si Kancil menjelaskan, tokoh ditaruh, diwarnai, dan latar diganti", async ({ page }) => {
    const kesalahan = await bukaPlatform(page);
    await page.getByTestId("permainan-studio").click();
    await expect(page.locator("[data-testid^=karya-]")).toHaveCount(1);
    await page.screenshot({ path: foto("50-studio-galeri-kosong") });
    await page.getByTestId("karya-baru").click();
    await expect(page.getByTestId("gelembung")).toHaveAttribute("data-kalimat", "studio.tugas", { timeout: 4000 });

    await page.getByTestId("rak-kucing").click();
    await klikKotak(page, 1, 2);
    await expect(tokoh(page, "kucing")).toHaveAttribute("data-sel", "1,2");
    await expect(tokoh(page, "kucing")).toHaveAttribute("data-terpilih", "true");

    await page.getByTestId("warna-5").click();
    await expect(tokoh(page, "kucing")).toHaveAttribute("data-warna", "4");
    await page.getByTestId("latar-malam").click();
    await expect(page.getByTestId("latar")).toHaveAttribute("data-latar", "malam");
    await page.screenshot({ path: foto("51-studio-tokoh-diwarnai") });
    expect(kesalahan).toEqual([]);
  });

  test("program menggerakkan tokoh; setelah cerita selesai tokoh kembali ke tempat awal", async ({ page }) => {
    await bukaKaryaBaru(page);
    await page.getByTestId("rak-ikan").click();
    await klikKotak(page, 0, 1);
    for (const slot of [1, 2, 3]) {
      await page.getByTestId("palet-maju").click();
      await page.getByTestId(`slot-utama-${slot}`).click();
    }
    await page.getByTestId("jalan").click();
    await expect(tokoh(page, "ikan")).toHaveAttribute("data-sel", "3,1", { timeout: 5000 });
    await expect(page.locator("[data-testid=slot-utama-3] [data-menyala]")).toHaveCount(1);
    await expect(tokoh(page, "ikan")).toHaveAttribute("data-sel", "0,1", { timeout: 5000 });
  });

  test("blok pemicu: saat kucing menyentuh bola, kucing melompat", async ({ page }) => {
    await bukaKaryaBaru(page);
    await page.getByTestId("rak-bola").click();
    await klikKotak(page, 3, 1);
    await page.getByTestId("rak-kucing").click();
    await klikKotak(page, 1, 1);

    for (const slot of [1, 2, 3, 4]) {
      await page.getByTestId("palet-maju").click();
      await page.getByTestId(`slot-utama-${slot}`).click();
    }
    await page.getByTestId("palet-pemicu").click();
    await page.getByTestId("slot-pemicu").click();
    await expect(page.getByTestId("gelembung")).toHaveAttribute("data-kalimat", /studio\.(pemicu|sasaran)/, { timeout: 15000 });
    await page.getByTestId("tokoh-bola").click();
    await expect(tokoh(page, "bola")).toHaveAttribute("data-sasaran", "true");
    await page.getByTestId("palet-lompat").click();
    await page.getByTestId("slot-pemicu-1").click();
    await page.screenshot({ path: foto("52-studio-pemicu") });

    await page.getByTestId("jalan").click();
    // Kucing sampai di kotak bola (3,1), program utama berhenti, lalu kucing melompat dua kotak.
    await expect(tokoh(page, "kucing")).toHaveAttribute("data-sel", "3,1", { timeout: 4000 });
    await expect(tokoh(page, "kucing")).toHaveAttribute("data-sel", "5,1", { timeout: 4000 });
    await expect(page.locator("[data-testid=slot-pemicu-1] [data-menyala]")).toHaveCount(1);
    // Pujian menunggu giliran di antrean narator, sesudah sapaan dan penjelasan pemicu.
    await expect(page.getByTestId("gelembung")).toHaveAttribute("data-kalimat", "studio.seru", { timeout: 20000 });
  });

  test("karya tersimpan otomatis dan tetap ada setelah platform ditutup dan dibuka lagi", async ({ page }) => {
    await bukaKaryaBaru(page);
    await page.getByTestId("rak-burung").click();
    await klikKotak(page, 4, 2);
    await page.getByTestId("latar-pantai").click();
    await page.waitForTimeout(800);
    await page.getByTestId("kembali").click();
    await expect(page.getByTestId("karya-1")).toBeVisible();
    await expect(page.getByTestId("karya-1").locator("img")).toHaveAttribute("src", /^data:image\/(png|svg\+xml);base64,/);

    await page.reload();
    await page.getByTestId("mulai").click();
    await page.getByTestId("permainan-studio").click();
    await page.screenshot({ path: foto("53-studio-galeri") });
    await page.getByTestId("karya-1").click();
    await expect(tokoh(page, "burung")).toHaveAttribute("data-sel", "4,2");
    await expect(page.getByTestId("latar")).toHaveAttribute("data-latar", "pantai");
  });

  test("tokoh di panggung bisa dipindah, dan paling banyak empat tokoh", async ({ page }) => {
    await bukaKaryaBaru(page);
    const posisi: [string, number][] = [["kucing", 0], ["ikan", 2], ["bola", 4], ["burung", 6]];
    for (const [jenis, kolom] of posisi) {
      await page.getByTestId(`rak-${jenis}`).click();
      await klikKotak(page, kolom, 0);
    }
    await page.getByTestId("rak-kucing").click();
    await klikKotak(page, 8, 3);
    await expect(page.locator("[data-testid^=tokoh-]:not([data-testid=tokoh-terpilih])")).toHaveCount(4);
    await page.waitForTimeout(400);
    await page.getByTestId("tokoh-ikan").click();
    await klikKotak(page, 2, 3);
    await expect(tokoh(page, "ikan")).toHaveAttribute("data-sel", "2,3");
  });

  test("semua benda yang bisa diklik minimal 88 unit, dan tidak ada teks", async ({ page }) => {
    await bukaKaryaBaru(page);
    await page.getByTestId("rak-kucing").click();
    await klikKotak(page, 1, 1);
    await periksaUkuranKlik(page);
    const teks = await page.locator("[data-panggung]").innerText();
    expect(teks.replace(/[\d\s]/g, "")).toBe("");
  });
});
