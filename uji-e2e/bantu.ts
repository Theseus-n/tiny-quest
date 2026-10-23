import { expect, type Page } from "@playwright/test";

/** Membuka platform, mencatat kesalahan konsol, lalu melewati layar pembuka. */
export async function bukaPlatform(page: Page, { bersihkan = true } = {}) {
  const kesalahan: string[] = [];
  page.on("console", (m) => m.type() === "error" && kesalahan.push(m.text()));
  page.on("pageerror", (e) => kesalahan.push(e.message));
  // Suara narator harus tertanam di bundel. Permintaan file audio memicu jendela unduhan pengelola unduhan seperti IDM.
  page.on("request", (r) => /\.(mp3|m4a|ogg|wav)(\?|$)/.test(r.url()) && kesalahan.push(`file audio diminta: ${r.url()}`));
  await page.goto("/");
  if (bersihkan) {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  }
  await page.getByTestId("mulai").click();
  await expect(page.getByTestId("permainan-jalur")).toBeVisible();
  return kesalahan;
}

/** Ukuran benda dalam unit panggung 1280x720. */
export async function ukuranUnit(page: Page) {
  return page.evaluate(() => {
    const panggung = document.querySelector<HTMLElement>("[data-panggung]")!;
    const skala = Number(panggung.dataset.skala);
    return [...document.querySelectorAll<HTMLElement>("[data-klik]")].map((el) => {
      const r = el.getBoundingClientRect();
      return { id: el.dataset.testid ?? el.outerHTML.slice(0, 60), lebar: r.width / skala, tinggi: r.height / skala, kiri: r.left, atas: r.top, kanan: r.right, bawah: r.bottom };
    });
  });
}

export async function periksaUkuranKlik(page: Page) {
  const daftar = await ukuranUnit(page);
  expect(daftar.length).toBeGreaterThan(0);
  for (const b of daftar) {
    expect.soft(Math.round(b.lebar), `${b.id} lebar`).toBeGreaterThanOrEqual(88);
    expect.soft(Math.round(b.tinggi), `${b.id} tinggi`).toBeGreaterThanOrEqual(88);
  }
}

export async function taruhDenganKlik(page: Page, palet: string, slot: number) {
  await page.getByTestId(`palet-${palet}`).click();
  await page.getByTestId(`slot-${slot}`).click();
}
