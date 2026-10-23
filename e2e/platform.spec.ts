import { expect, test } from "@playwright/test";
import { bukaPlatform, periksaUkuranKlik, taruhDenganKlik } from "./helpers";

const foto = (nama: string) => `e2e/results/${nama}.png`;

test.describe("layar pembuka dan layar awal", () => {
  test("klik pertama membawa ke layar awal dengan semua permainan yang sudah dibangun", async ({ page }) => {
    await page.goto("/");
    await page.screenshot({ path: foto("01-layar-pembuka") });
    await page.getByTestId("mulai").click();
    for (const nama of ["jalur", "tirai", "galat", "balok", "tangram", "studio"]) await expect(page.getByTestId(`permainan-${nama}`)).toBeVisible();
    await expect(page.locator("[data-testid^=permainan-]")).toHaveCount(6);
    await page.screenshot({ path: foto("02-layar-awal") });
  });

  test("tidak ada teks di layar anak selain angka", async ({ page }) => {
    await bukaPlatform(page);
    for (const layar of ["awal", "jalur", "tirai", "galat", "balok", "tangram", "studio"]) {
      if (layar !== "awal") {
        await page.getByTestId(`permainan-${layar}`).click();
        await page.waitForTimeout(300);
      }
      let teks = await page.locator("[data-panggung]").innerText();
      // Satu pengecualian atas permintaan pemilik produk: judul halaman pilih permainan.
      if (layar === "awal") {
        const judul = await page.getByTestId("judul").innerText();
        expect(judul).toBe("Pilih Mainanmu");
        teks = teks.replace(judul, "");
      }
      expect(teks.replace(/[\d\s]/g, ""), `layar ${layar}`).toBe("");
      if (layar !== "awal") await page.getByTestId("kembali").click();
    }
  });

  test("semua benda yang bisa diklik minimal 88 x 88 unit", async ({ page }) => {
    await bukaPlatform(page);
    await periksaUkuranKlik(page);
    await page.getByTestId("permainan-jalur").click();
    await periksaUkuranKlik(page);
    await page.getByTestId("kembali").click();
    await page.getByTestId("permainan-tirai").click();
    await expect(page.locator("[data-testid^=wadah-]").first()).toBeVisible({ timeout: 8000 });
    await periksaUkuranKlik(page);
    await page.getByTestId("kembali").click();
    await page.getByTestId("permainan-galat").click();
    await periksaUkuranKlik(page);
    await page.getByTestId("kembali").click();
    await page.getByTestId("permainan-balok").click();
    // Garis potong muncul saat balok dipegang, dan ikut diukur.
    await page.getByTestId("balok-5").click();
    await expect(page.locator("[data-testid^=potong-]")).toHaveCount(4);
    await periksaUkuranKlik(page);
  });

  test("keyboard, klik kanan, dan zoom Ctrl+roda tidak berpengaruh", async ({ page }) => {
    await bukaPlatform(page);
    const ditolak = await page.evaluate(() => {
      const k = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
      const m = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
      const w = new WheelEvent("wheel", { ctrlKey: true, deltaY: -100, bubbles: true, cancelable: true });
      document.body.dispatchEvent(k);
      document.body.dispatchEvent(m);
      document.body.dispatchEvent(w);
      return [k.defaultPrevented, m.defaultPrevented, w.defaultPrevented];
    });
    expect(ditolak).toEqual([true, true, true]);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await page.keyboard.type("halo");
    await expect(page.getByTestId("permainan-jalur")).toBeVisible();
  });
});

test.describe("Penjelajah Jalur", () => {
  test("level 1 bisa diselesaikan hanya dengan klik, lalu progres tersimpan", async ({ page }) => {
    const kesalahan = await bukaPlatform(page);
    await page.getByTestId("permainan-jalur").click();
    await expect(page.locator("[data-testid^=palet-]")).toHaveCount(1);
    await expect(page.locator("[data-testid^=slot-]")).toHaveCount(3);
    await page.screenshot({ path: foto("03-jalur-level-1") });

    await page.getByTestId("palet-maju").click();
    await expect(page.getByTestId("palet-maju")).toHaveClass(/dipegang/);
    await page.screenshot({ path: foto("04-jalur-blok-dipegang") });
    await page.getByTestId("slot-1").click();
    await taruhDenganKlik(page, "maju", 2);
    await taruhDenganKlik(page, "maju", 3);
    await expect(page.locator("[data-testid^=slot-] [data-blok=maju]")).toHaveCount(3);

    await page.getByTestId("jalan").click();
    await expect(page.locator("[data-menyala]").first()).toBeVisible();
    await page.screenshot({ path: foto("05-jalur-berjalan") });
    await expect(page.getByTestId("kucing")).toHaveAttribute("data-sel", "3,1", { timeout: 5000 });
    await expect(page.getByTestId("pemandu").locator("svg")).toHaveAttribute("data-pose", "tepuk");
    await page.screenshot({ path: foto("06-jalur-berhasil") });
    // Permainan tidak pindah level sendiri: pop-up selamat menunggu anak mengklik tombol lanjut.
    await expect(page.getByTestId("selamat")).toBeVisible({ timeout: 3000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: foto("06b-jalur-selamat") });
    await expect(page.locator("[data-sekarang]")).toContainText("1");
    await page.getByTestId("lanjut").click();
    await expect(page.getByTestId("selamat")).toHaveCount(0);
    await expect(page.getByTestId("level-2")).toHaveAttribute("data-klik", "true");
    await expect(page.locator("[data-sekarang]")).toContainText("2");

    await page.reload();
    await page.getByTestId("mulai").click();
    await page.getByTestId("permainan-jalur").click();
    await expect(page.locator("[data-sekarang]")).toContainText("2");
    await expect(page.locator("[data-testid^=slot-]")).toHaveCount(4);
    expect(kesalahan).toEqual([]);
  });

  test("gagal: tokoh pemandu menggaruk kepala dan program tetap utuh", async ({ page }) => {
    await bukaPlatform(page);
    await page.getByTestId("permainan-jalur").click();
    await taruhDenganKlik(page, "maju", 1);
    await taruhDenganKlik(page, "maju", 2);
    await page.getByTestId("jalan").click();
    await expect(page.getByTestId("pemandu").locator("svg")).toHaveAttribute("data-pose", "garuk", { timeout: 5000 });
    await page.screenshot({ path: foto("07-jalur-gagal") });
    await expect(page.getByTestId("kucing")).toHaveAttribute("data-sel", "0,1", { timeout: 3000 });
    await expect(page.locator("[data-testid^=slot-] [data-blok=maju]")).toHaveCount(2);
  });

  test("blok bisa diseret ke slot, dan diklik untuk dicabut", async ({ page }) => {
    await bukaPlatform(page);
    await page.getByTestId("permainan-jalur").click();
    const palet = await page.getByTestId("palet-maju").boundingBox();
    const slot = await page.getByTestId("slot-2").boundingBox();
    await page.mouse.move(palet!.x + palet!.width / 2, palet!.y + palet!.height / 2);
    await page.mouse.down();
    await page.mouse.move(slot!.x + 20, slot!.y + 20, { steps: 8 });
    await page.mouse.move(slot!.x + slot!.width / 2, slot!.y + slot!.height / 2, { steps: 4 });
    await page.mouse.up();
    await expect(page.getByTestId("slot-2").locator("[data-blok=maju]")).toHaveCount(1);
    await expect(page.getByTestId("slot-1").locator("[data-blok]")).toHaveCount(0);

    // Klik yang datang kurang dari 80 ms setelah seretan selesai sengaja diabaikan.
    await page.waitForTimeout(200);
    await page.getByTestId("slot-2").click();
    await expect(page.getByTestId("slot-2").locator("[data-blok]")).toHaveCount(0);
  });

  test("klik slot kosong tanpa memegang blok: tokoh pemandu menunjuk dan peragaan diulang", async ({ page }) => {
    await bukaPlatform(page);
    await page.getByTestId("permainan-jalur").click();
    const peragaan = page.getByTestId("peragaan");
    await expect(peragaan).toHaveAttribute("data-pemicu", "1", { timeout: 8000 });
    await page.getByTestId("slot-2").click();
    await expect(page.getByTestId("pemandu").locator("svg")).toHaveAttribute("data-pose", "tunjuk");
    await expect(peragaan).toHaveAttribute("data-pemicu", "2");
  });

  test("level 1: Si Kancil menyapa, menjelaskan tujuan dengan gelembung bicara, lalu tangan memperagakan", async ({ page }) => {
    await bukaPlatform(page);
    await page.getByTestId("permainan-jalur").click();
    const gelembung = page.getByTestId("gelembung");
    await expect(gelembung).toHaveAttribute("data-kalimat", "umum.sapa", { timeout: 2000 });
    await expect(page.getByTestId("pemandu").locator("svg")).toHaveAttribute("data-bicara", "true");
    await expect(gelembung).toHaveAttribute("data-kalimat", "jalur.tugas", { timeout: 4000 });
    await page.screenshot({ path: foto("08a-jalur-kancil-menjelaskan") });
    await expect(gelembung).toHaveAttribute("data-kalimat", "jalur.cara", { timeout: 4000 });
    await expect(page.getByTestId("peragaan")).toHaveAttribute("data-pemicu", "1");
    await page.waitForTimeout(500);
    await page.screenshot({ path: foto("08-jalur-peragaan") });
  });

  test("level 2 dan seterusnya: tidak ada penjelasan, anak langsung mencoba", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("platform.progres", JSON.stringify({ jalur: { levelTerakhir: 1, levelTertinggiSelesai: 0 } })));
    await page.reload();
    await page.getByTestId("mulai").click();
    await page.getByTestId("permainan-jalur").click();
    await expect(page.locator("[data-sekarang]")).toContainText("2");
    await page.waitForTimeout(3000);
    await expect(page.getByTestId("gelembung")).toHaveCount(0);
  });

  test("level yang mengenalkan blok baru: Si Kancil menjelaskan satu kalimat", async ({ page }) => {
    for (const [level, kalimat] of [[3, "jalur.putar"], [5, "jalur.lompat"], [6, "jalur.ulangi"]] as const) {
      await page.goto("/");
      await page.evaluate((l) => localStorage.setItem("platform.progres", JSON.stringify({ jalur: { levelTerakhir: l - 1, levelTertinggiSelesai: l - 2 } })), level);
      await page.reload();
      await page.getByTestId("mulai").click();
      await page.getByTestId("permainan-jalur").click();
      await expect(page.getByTestId("gelembung")).toHaveAttribute("data-kalimat", kalimat, { timeout: 3000 });
      if (level === 6) await page.screenshot({ path: foto("09b-jalur-penjelasan-ulangi") });
    }
  });

  test("anak diam 10 detik setelah Si Kancil selesai bicara: tangan memperagakan lagi dan Si Kancil menyemangati", async ({ page }) => {
    test.setTimeout(60_000);
    await bukaPlatform(page);
    await page.getByTestId("permainan-jalur").click();
    const peragaan = page.getByTestId("peragaan");
    await expect(peragaan).toHaveAttribute("data-pemicu", "1", { timeout: 8000 });
    // Selama penjelasan berlangsung, anak tidak dianggap diam. Gelembung juga hilang sebentar di jeda antarkalimat,
    // jadi tunggu kalimat terakhir penjelasan dulu.
    await expect(page.getByTestId("gelembung")).toHaveAttribute("data-kalimat", "jalur.coba-banyak", { timeout: 25000 });
    await expect(page.getByTestId("gelembung")).toHaveCount(0, { timeout: 10000 });
    await expect(peragaan).toHaveAttribute("data-pemicu", "1");
    await expect(peragaan).toHaveAttribute("data-pemicu", "2", { timeout: 12000 });
    await expect(page.getByTestId("gelembung")).toHaveAttribute("data-kalimat", "umum.semangat", { timeout: 1000 });
    await page.screenshot({ path: foto("08b-jalur-kancil-menyemangati") });
  });

  test("seluruh level Penjelajah Jalur bisa diselesaikan dengan klik", async ({ page }) => {
    test.setTimeout(120_000);
    await bukaPlatform(page);
    await page.getByTestId("permainan-jalur").click();
    const penyelesaian: [string, number][][] = [
      [["maju", 1], ["maju", 2], ["maju", 3]],
      [["maju", 1], ["maju", 2], ["maju", 3], ["maju", 4]],
      [["maju", 1], ["maju", 2], ["putar-kanan", 3], ["maju", 4], ["maju", 5]],
      [["maju", 1], ["maju", 2], ["putar-kiri", 3], ["maju", 4], ["maju", 5]],
      [["maju", 1], ["lompat", 2], ["maju", 3]],
      [["ulangi", 1], ["maju", 2], ["maju", 3]],
    ];
    for (const [i, langkah] of penyelesaian.entries()) {
      await expect(page.locator("[data-sekarang]")).toContainText(String(i + 1), { timeout: 6000 });
      await page.waitForTimeout(300);
      for (const [blok, slot] of langkah) await taruhDenganKlik(page, blok, slot);
      if (i === 5) await page.screenshot({ path: foto("09-jalur-level-6-ulangi") });
      await page.getByTestId("jalan").click();
      await expect(page.getByTestId("pemandu").locator("svg")).toHaveAttribute("data-pose", "tepuk", { timeout: 8000 });
      await expect(page.getByTestId("selamat")).toBeVisible({ timeout: 3000 });
      if (i < penyelesaian.length - 1) await page.getByTestId("lanjut").click();
    }
    await expect(page.locator("[data-terkunci]")).toHaveCount(0);
    // Level terakhir: tombol di pop-up selamat kembali ke layar awal.
    await page.getByTestId("lanjut").click();
    await expect(page.getByTestId("permainan-jalur")).toBeVisible();
  });
});

test.describe("Tirai Daun", () => {
  test("level 1: Si Kancil menjelaskan dulu, lalu benda tertutup daun 1,5 detik setelah muncul", async ({ page }) => {
    await bukaPlatform(page);
    await page.getByTestId("permainan-tirai").click();
    // Selama Si Kancil menjelaskan, benda dan wadah belum tampil.
    await expect(page.getByTestId("benda")).toHaveAttribute("data-tahap", "pengantar");
    await expect(page.getByTestId("gelembung")).toHaveAttribute("data-kalimat", "tirai.tugas", { timeout: 4000 });
    await expect(page.locator("[data-testid^=wadah-]")).toHaveCount(0);
    const lama = await page.evaluate(
      () =>
        new Promise<number>((selesai) => {
          let mulai = 0;
          const cek = () => {
            if (!mulai && document.querySelector("[data-testid=benda][data-tahap=tampil]")) mulai = performance.now();
            if (mulai && document.querySelector("[data-testid=daun][data-tertutup]")) return selesai(performance.now() - mulai);
            requestAnimationFrame(cek);
          };
          cek();
        }),
    );
    expect(lama).toBeGreaterThan(1350);
    expect(lama).toBeLessThan(1700);
    await expect(page.getByTestId("gelembung")).toHaveAttribute("data-kalimat", "tirai.pilih");
    await page.waitForTimeout(400);
    await page.screenshot({ path: foto("11-tirai-tertutup") });
  });

  test("jawaban salah menampilkan kelompok dan jumlahnya, lalu soal diulang", async ({ page }) => {
    await bukaPlatform(page);
    await page.getByTestId("permainan-tirai").click();
    const benda = page.getByTestId("benda");
    const jumlah = await benda.getAttribute("data-jumlah");
    await expect(page.getByTestId("daun")).toHaveAttribute("data-tertutup", "true", { timeout: 8000 });
    const salah = page.locator(`[data-testid^=wadah-]:not([data-testid=wadah-${jumlah}])`).first();
    await salah.click();
    await expect(benda).toHaveAttribute("data-tahap", "salah");
    await expect(page.getByTestId("pemandu").locator("svg")).toHaveAttribute("data-pose", "garuk");
    await expect(page.getByTestId("angka-jumlah")).toContainText(jumlah!, { timeout: 4000 });
    await page.screenshot({ path: foto("12-tirai-salah") });
    await expect(benda).toHaveAttribute("data-tahap", "tampil", { timeout: 5000 });
    await expect(benda).toHaveAttribute("data-jumlah", jumlah!);
  });

  test("level 1 selesai dengan memilih wadah yang sama banyak", async ({ page }) => {
    const kesalahan = await bukaPlatform(page);
    await page.getByTestId("permainan-tirai").click();
    for (let i = 0; i < 3; i++) {
      await expect(page.getByTestId("daun")).toHaveAttribute("data-tertutup", "true", { timeout: 8000 });
      const jumlah = await page.getByTestId("benda").getAttribute("data-jumlah");
      await page.getByTestId(`wadah-${jumlah}`).click();
      await expect(page.getByTestId("benda")).toHaveAttribute("data-tahap", "benar");
      if (i === 0) await page.screenshot({ path: foto("13-tirai-benar") });
    }
    await expect(page.getByTestId("selamat")).toBeVisible({ timeout: 3000 });
    await page.getByTestId("lanjut").click();
    await expect(page.locator("[data-sekarang]")).toContainText("2");
    expect(kesalahan).toEqual([]);
  });

  test("susunan 5 sampai 8 benda tampil sebagai kelompok terpisah", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("platform.progres", JSON.stringify({ tirai: { levelTerakhir: 2, levelTertinggiSelesai: 1 } })));
    await page.reload();
    await page.getByTestId("mulai").click();
    await page.getByTestId("permainan-tirai").click();
    // Level ini mengenalkan dua kelompok: Si Kancil menjelaskan dulu sebelum benda tampil.
    await expect(page.getByTestId("benda")).toHaveAttribute("data-tahap", "pengantar");
    await expect(page.getByTestId("gelembung")).toHaveAttribute("data-kalimat", "tirai.kelompok", { timeout: 3000 });
    await expect(page.getByTestId("benda")).toHaveAttribute("data-tahap", "tampil", { timeout: 10000 });
    await expect(page.getByTestId("benda")).toHaveAttribute("data-jumlah", "6");
    const kelompok = await page.locator("[data-kelompok]").evaluateAll((els) => new Set(els.map((e) => e.getAttribute("data-kelompok"))).size);
    expect(kelompok).toBe(2);
    await page.screenshot({ path: foto("14-tirai-kelompok-3-3") });
  });
});

test("tombol rumah kembali ke layar awal", async ({ page }) => {
  await bukaPlatform(page);
  await page.getByTestId("permainan-tirai").click();
  await page.getByTestId("kembali").click();
  await expect(page.getByTestId("permainan-jalur")).toBeVisible();
});
