import { copyFileSync } from "node:fs";
import { test, type Locator, type Page } from "@playwright/test";

// Rekaman demonstrasi satu sesi bermain. Jalankan dengan: DEMO=1 npx playwright test demo
test.skip(!process.env.DEMO, "hanya untuk rekaman demonstrasi");
test.use({ video: { mode: "on", size: { width: 1366, height: 768 } } });

async function tampilkanKursor(page: Page) {
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const k = document.createElement("div");
      k.style.cssText = "position:fixed;z-index:9999;width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50%;border:4px solid #2E2A3B;background:rgba(255,255,255,.6);pointer-events:none;left:-50px;top:-50px;transition:transform 80ms";
      document.body.appendChild(k);
      window.addEventListener("mousemove", (e) => {
        k.style.left = `${e.clientX}px`;
        k.style.top = `${e.clientY}px`;
      }, true);
      window.addEventListener("mousedown", () => (k.style.transform = "scale(.7)"), true);
      window.addEventListener("mouseup", () => (k.style.transform = "none"), true);
    });
  });
}

async function klik(page: Page, target: Locator, jeda = 350) {
  const b = (await target.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 18 });
  await page.waitForTimeout(jeda);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(250);
}

test("demonstrasi satu sesi bermain", async ({ page }, info) => {
  test.setTimeout(180_000);
  await tampilkanKursor(page);
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.mouse.move(300, 600);
  await page.waitForTimeout(1200);
  await klik(page, page.getByTestId("mulai"));
  await page.waitForTimeout(1500);

  // Penjelajah Jalur level 1: biarkan Si Kancil menjelaskan dan peragaan tampil dulu, lalu susun tiga blok Maju dengan klik.
  await klik(page, page.getByTestId("permainan-jalur"));
  await page.waitForTimeout(7000);
  for (const slot of [1, 2]) {
    await klik(page, page.getByTestId("palet-maju"));
    await klik(page, page.getByTestId(`slot-${slot}`));
  }
  await klik(page, page.getByTestId("jalan"));
  await page.waitForTimeout(3500);
  await klik(page, page.getByTestId("palet-maju"));
  await klik(page, page.getByTestId("slot-3"));
  await klik(page, page.getByTestId("jalan"));
  await page.waitForTimeout(3000);
  await klik(page, page.getByTestId("lanjut"));
  await page.waitForTimeout(1000);

  // Level 2: satu blok dipasang dengan seret.
  const palet = (await page.getByTestId("palet-maju").boundingBox())!;
  const slot1 = (await page.getByTestId("slot-1").boundingBox())!;
  await page.mouse.move(palet.x + palet.width / 2, palet.y + palet.height / 2, { steps: 15 });
  await page.mouse.down();
  await page.mouse.move(slot1.x + slot1.width / 2, slot1.y + slot1.height / 2, { steps: 30 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  for (const slot of [2, 3, 4]) {
    await klik(page, page.getByTestId("palet-maju"), 150);
    await klik(page, page.getByTestId(`slot-${slot}`), 150);
  }
  await klik(page, page.getByTestId("jalan"));
  await page.waitForTimeout(5000);

  // Tirai Daun: satu jawaban salah, lalu jawaban benar.
  await klik(page, page.getByTestId("kembali"));
  await page.waitForTimeout(800);
  await klik(page, page.getByTestId("permainan-tirai"));
  await page.waitForSelector("[data-testid=daun][data-tertutup]");
  await page.waitForTimeout(800);
  const jumlah = await page.getByTestId("benda").getAttribute("data-jumlah");
  await klik(page, page.locator(`[data-testid^=wadah-]:not([data-testid=wadah-${jumlah}])`).first());
  await page.waitForTimeout(4200);
  await page.waitForSelector("[data-testid=daun][data-tertutup]");
  await page.waitForTimeout(800);
  await klik(page, page.getByTestId(`wadah-${jumlah}`));
  await page.waitForTimeout(2500);
  await page.waitForSelector("[data-testid=daun][data-tertutup]");
  const berikut = await page.getByTestId("benda").getAttribute("data-jumlah");
  await page.waitForTimeout(600);
  await klik(page, page.getByTestId(`wadah-${berikut}`));
  await page.waitForTimeout(2500);
  await klik(page, page.getByTestId("kembali"));
  await page.waitForTimeout(1500);

  await page.close();
  const video = await page.video()!.path();
  copyFileSync(video, `uji-e2e/hasil/demo-satu-sesi.webm`);
  info.attachments.push({ name: "video", path: video, contentType: "video/webm" });
});
