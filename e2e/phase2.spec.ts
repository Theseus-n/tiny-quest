import { expect, test, type Page } from "@playwright/test";
import { bukaPlatform } from "./helpers";

const foto = (nama: string) => `e2e/results/${nama}.png`;

/** Membuka sebuah permainan langsung di level tertentu (mulai dari 1). */
async function bukaDiLevel(page: Page, permainan: "galat" | "balok", level: number) {
  const kesalahan = await bukaPlatform(page);
  await page.evaluate(
    ([p, l]) => localStorage.setItem("platform.progres", JSON.stringify({ [p]: { levelTerakhir: l - 1, levelTertinggiSelesai: l - 2 } })),
    [permainan, level] as const,
  );
  await page.reload();
  await page.getByTestId("mulai").click();
  await page.getByTestId(`permainan-${permainan}`).click();
  await expect(page.locator("[data-sekarang]")).toContainText(String(level));
  return kesalahan;
}

const pose = (page: Page) => page.getByTestId("pemandu").locator("svg");

test.describe("Detektif Galat", () => {
  test("level 1: mencoba, blok yang menyala jadi petunjuk, cabut blok berlebih, program jalan ulang sendiri", async ({ page }) => {
    const kesalahan = await bukaPlatform(page);
    await page.getByTestId("permainan-galat").click();
    await expect(page.locator("[data-testid^=slot-] [data-blok=maju]")).toHaveCount(4);
    await expect(page.getByTestId("gelembung")).toHaveAttribute("data-kalimat", "galat.tugas", { timeout: 4000 });
    await page.screenshot({ path: foto("20-galat-level-1") });

    await page.getByTestId("jalan").click();
    await expect(pose(page)).toHaveAttribute("data-pose", "garuk", { timeout: 6000 });
    await expect(page.getByTestId("slot-4").locator("[data-menyala]")).toHaveCount(1);
    await expect(page.getByTestId("gelembung")).toHaveAttribute("data-kalimat", "galat.cabut", { timeout: 4000 });
    await page.screenshot({ path: foto("21-galat-petunjuk") });

    // Klik diabaikan selama kucing kembali ke kotak awal.
    await expect(page.getByTestId("kucing")).toHaveAttribute("data-sel", "0,1", { timeout: 3000 });
    await page.waitForTimeout(300);
    await page.getByTestId("slot-4").click();
    await expect(page.getByTestId("palet-maju")).toBeVisible();
    await expect(pose(page)).toHaveAttribute("data-pose", "tepuk", { timeout: 6000 });
    await expect(page.getByTestId("selamat")).toBeVisible({ timeout: 3000 });
    await page.getByTestId("lanjut").click();
    await expect(page.locator("[data-sekarang]")).toContainText("2");
    expect(kesalahan).toEqual([]);
  });

  test("level 4: setelah blok salah arah dicabut, dua pengganti muncul; pengganti salah tidak menyelesaikan level", async ({ page }) => {
    await bukaDiLevel(page, "galat", 4);
    await expect(page.getByTestId("gelembung")).toHaveAttribute("data-kalimat", "galat.ganti", { timeout: 3000 });
    await expect(page.locator("[data-testid^=palet-]")).toHaveCount(0);
    await page.getByTestId("slot-3").click();
    await expect(page.getByTestId("palet-putar-kanan")).toBeVisible();
    await expect(page.getByTestId("palet-lompat")).toBeVisible();
    await page.screenshot({ path: foto("22-galat-pengganti") });

    await page.getByTestId("palet-lompat").click();
    await page.getByTestId("slot-3").click();
    await expect(pose(page)).toHaveAttribute("data-pose", "garuk", { timeout: 6000 });

    // Blok yang salah dicabut lagi, lalu diganti dengan yang benar.
    await page.waitForTimeout(1200);
    await page.getByTestId("slot-3").click();
    await page.getByTestId("palet-putar-kanan").click();
    await page.getByTestId("slot-3").click();
    await expect(pose(page)).toHaveAttribute("data-pose", "tepuk", { timeout: 8000 });
    await expect(page.getByTestId("selamat")).toBeVisible({ timeout: 3000 });
  });

  test("seluruh level Detektif Galat bisa diselesaikan dengan klik", async ({ page }) => {
    test.setTimeout(150_000);
    await bukaPlatform(page);
    await page.getByTestId("permainan-galat").click();
    const perbaikan: [number, string | null][] = [
      [4, null],
      [3, null],
      [4, null],
      [3, "putar-kanan"],
      [3, "putar-kiri"],
      [2, "lompat"],
    ];
    for (const [i, [slot, pengganti]] of perbaikan.entries()) {
      await expect(page.locator("[data-sekarang]")).toContainText(String(i + 1));
      await page.waitForTimeout(300);
      await page.getByTestId(`slot-${slot}`).click();
      if (pengganti) {
        await page.getByTestId(`palet-${pengganti}`).first().click();
        await page.getByTestId(`slot-${slot}`).click();
      }
      await expect(pose(page)).toHaveAttribute("data-pose", "tepuk", { timeout: 8000 });
      await expect(page.getByTestId("selamat")).toBeVisible({ timeout: 3000 });
      if (i < perbaikan.length - 1) await page.getByTestId("lanjut").click();
    }
    await expect(page.locator("[data-terkunci]")).toHaveCount(0);
  });
});

test.describe("Balok Bilangan", () => {
  test("level 1: cetakan menunjukkan panjang jembatan, balok disusun di sungai, yang terlalu panjang menjorok lalu tetap di rak", async ({ page }) => {
    const kesalahan = await bukaPlatform(page);
    await page.getByTestId("permainan-balok").click();
    const cetakan = page.getByTestId("cetakan");
    await expect(cetakan).toHaveAttribute("data-sisa", "3");
    await expect(cetakan.locator("[data-kosong]")).toHaveCount(3);
    await expect(page.getByTestId("gelembung")).toHaveAttribute("data-kalimat", "balok.tugas", { timeout: 4000 });
    await page.screenshot({ path: foto("30-balok-level-1") });

    await page.getByTestId("balok-5").click();
    await page.getByTestId("sungai").click();
    await expect(page.getByTestId("percobaan")).toBeVisible();
    await expect(pose(page)).toHaveAttribute("data-pose", "garuk");
    await page.screenshot({ path: foto("31-balok-terlalu-panjang") });
    await expect(page.getByTestId("balok-5")).toBeVisible();

    // Balok 2 masuk cetakan dan menyisakan satu lingkaran kosong.
    await page.getByTestId("balok-2").click();
    await page.getByTestId("sungai").click();
    await expect(page.getByTestId("di-sungai-2")).toBeVisible();
    await expect(cetakan).toHaveAttribute("data-sisa", "1");
    await page.screenshot({ path: foto("31b-balok-sebagian") });

    // Balok di sungai diklik: kembali ke rak.
    await page.getByTestId("di-sungai-2").click();
    await expect(page.getByTestId("balok-2")).toBeVisible();
    await expect(cetakan).toHaveAttribute("data-sisa", "3");

    await page.getByTestId("balok-3").click();
    await page.getByTestId("sungai").click();
    await expect(page.getByTestId("jembatan")).toBeVisible();
    await expect(pose(page)).toHaveAttribute("data-pose", "tepuk");
    await expect(page.getByTestId("kucing")).toHaveAttribute("data-seberang", "true");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: foto("32-balok-jembatan") });
    await expect(page.getByTestId("selamat")).toBeVisible({ timeout: 4000 });
    expect(kesalahan).toEqual([]);
  });

  test("level 2: Si Kancil menjelaskan satu kalimat, lalu jembatan disusun dari dua balok di sungai", async ({ page }) => {
    await bukaDiLevel(page, "balok", 2);
    await expect(page.getByTestId("gelembung")).toHaveAttribute("data-kalimat", "balok.susun", { timeout: 3000 });
    await page.getByTestId("balok-2").click();
    await page.getByTestId("sungai").click();
    await page.getByTestId("balok-3").click();
    await page.getByTestId("sungai").click();
    await expect(page.getByTestId("jembatan")).toBeVisible();
    await page.waitForTimeout(400);
    await page.screenshot({ path: foto("32b-balok-dua-balok") });
    await expect(page.getByTestId("selamat")).toBeVisible({ timeout: 4000 });
  });

  test("panjang balok n tepat n kali balok 1", async ({ page }) => {
    await bukaDiLevel(page, "balok", 3);
    const lebar = async (n: number) => (await page.getByTestId(`balok-${n}`).locator("svg").boundingBox())!.width;
    const satu = (await lebar(3)) / 3;
    for (const n of [4, 5, 6]) expect(Math.abs((await lebar(n)) - n * satu)).toBeLessThan(1);
  });

  test("menyatukan dua balok dengan klik, dan hasil lebih dari 10 ditolak", async ({ page }) => {
    await bukaDiLevel(page, "balok", 3);
    await page.getByTestId("balok-5").click();
    await page.getByTestId("balok-6").click();
    await expect(pose(page)).toHaveAttribute("data-pose", "garuk");
    await expect(page.getByTestId("balok-5")).toBeVisible();
    await expect(page.getByTestId("balok-6")).toBeVisible();

    await page.getByTestId("balok-3").click();
    await page.getByTestId("balok-4").click();
    await expect(page.getByTestId("balok-7")).toBeVisible();
    await expect(page.getByTestId("balok-3")).toHaveCount(0);
    await page.screenshot({ path: foto("33-balok-disatukan") });
    await page.getByTestId("balok-7").click();
    await page.getByTestId("sungai").click();
    await expect(page.getByTestId("jembatan")).toBeVisible();
  });

  test("memotong balok lewat garis potong", async ({ page }) => {
    await bukaDiLevel(page, "balok", 4);
    await page.getByTestId("balok-6").click();
    await expect(page.locator("[data-testid^=potong-]")).toHaveCount(5);
    await page.screenshot({ path: foto("34-balok-garis-potong") });
    await page.getByTestId("potong-4").click();
    await expect(page.getByTestId("balok-4")).toBeVisible();
    await expect(page.getByTestId("balok-2")).toBeVisible();
    await page.getByTestId("balok-4").click();
    await page.getByTestId("sungai").click();
    await expect(page.getByTestId("jembatan")).toBeVisible();
  });

  test("balok bisa diseret ke balok lain dan ke sungai", async ({ page }) => {
    await bukaDiLevel(page, "balok", 2);
    const seret = async (dari: string, ke: string) => {
      const a = (await page.getByTestId(dari).boundingBox())!;
      const b = (await page.getByTestId(ke).boundingBox())!;
      await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
      await page.mouse.down();
      await page.mouse.move(b.x + 30, b.y + b.height / 2, { steps: 10 });
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(200);
    };
    await seret("balok-2", "balok-3");
    await expect(page.getByTestId("balok-5")).toBeVisible();
    await seret("balok-5", "sungai");
    await expect(page.getByTestId("jembatan")).toBeVisible();
  });

  test("level angka: angka tampil di samping titik, dan narator menyebut bilangan balok baru", async ({ page }) => {
    await bukaDiLevel(page, "balok", 6);
    await expect(page.getByTestId("balok-6")).toContainText("6");
    await page.getByTestId("balok-6").click();
    await page.getByTestId("balok-4").click();
    await expect(page.getByTestId("gelembung")).toHaveAttribute("data-kalimat", "angka.10");
    await page.screenshot({ path: foto("35-balok-angka") });
    await page.getByTestId("balok-10").click();
    await page.getByTestId("sungai").click();
    await expect(page.getByTestId("selamat")).toBeVisible({ timeout: 5000 });
    // Level terakhir: tombol di pop-up selamat kembali ke layar awal.
    await page.getByTestId("lanjut").click();
    await expect(page.getByTestId("permainan-balok")).toBeVisible();
  });
});
