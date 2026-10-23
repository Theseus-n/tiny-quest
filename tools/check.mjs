// Memeriksa aturan konsistensi di frontend.md, bagian "Aturan yang dicek otomatis".
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const akar = join(import.meta.dirname, "..", "frontend");
const src = join(akar, "src");
const kesalahan = [];
const peringatan = [];

function semuaBerkas(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? semuaBerkas(p) : [p];
  });
}

const berkas = semuaBerkas(src).filter((p) => /\.(tsx?|css)$/.test(p) && !p.endsWith(".test.ts"));
const rel = (p) => relative(src, p).split(sep).join("/");

for (const p of berkas) {
  const r = rel(p);
  const isi = readFileSync(p, "utf8");
  const baris = isi.split("\n");

  // 1. Tidak ada kode warna di luar design/.
  if (!r.startsWith("design/")) {
    baris.forEach((b, i) => {
      if (/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b/.test(b) && !/data-|href=|url\(#/.test(b)) {
        kesalahan.push(`${r}:${i + 1} kode warna di luar design/: ${b.trim()}`);
      }
      if (/rgba?\(|hsla?\(/.test(b)) kesalahan.push(`${r}:${i + 1} warna rgb/hsl di luar design/: ${b.trim()}`);
    });
  }

  // 2. Tidak ada teks lepas di layar anak, selain lewat komponen Angka.
  if (r.endsWith(".tsx")) {
    baris.forEach((b, i) => {
      if (b.includes("=>") || b.trim().startsWith("//") || b.trim().startsWith("*")) return;
      const m = b.match(/>\s*([A-Za-z][^<>{}]*?)\s*<\//);
      if (m) kesalahan.push(`${r}:${i + 1} teks lepas di layar anak: "${m[1]}"`);
    });
  }

  // 3. Tidak ada bunyi yang diputar di luar shared/sound/.
  if (!r.startsWith("shared/sound/")) {
    baris.forEach((b, i) => {
      if (/new (AudioContext|Audio)\b|\.play\(\)|<audio/.test(b)) kesalahan.push(`${r}:${i + 1} bunyi diputar di luar shared/sound/`);
    });
  }
}

// 4. Setiap kalimat narator yang dipanggil kode ada di naskah, dan punya file suara.
const naskah = readFileSync(join(akar, "content", "narrator-script.csv"), "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .map((b) => b.split(",")[0]);
const adaDiNaskah = new Set(naskah);
const dipakai = new Set();
for (const p of berkas) {
  const isi = readFileSync(p, "utf8");
  for (const m of isi.matchAll(/(?:bicara\(|suara=\{?)\s*["'`]([^"'`]+)["'`]/g)) dipakai.add(m[1]);
  for (const m of isi.matchAll(/suara=\{(?:[^}]*\? )?`([^`]+)`/g)) dipakai.add(m[1]);
  for (const m of isi.matchAll(/suara: "([^"]+)"/g)) dipakai.add(m[1]);
}
// Kalimat penjelasan level yang mengenalkan cara baru ditulis di berkas level, bukan di kode.
const folderLevel = join(akar, "content", "levels");
for (const permainan of readdirSync(folderLevel)) {
  for (const n of readdirSync(join(folderLevel, permainan))) {
    const { penjelasan } = JSON.parse(readFileSync(join(folderLevel, permainan, n), "utf8"));
    if (!penjelasan) continue;
    if (!adaDiNaskah.has(penjelasan)) kesalahan.push(`level ${permainan}/${n}: penjelasan "${penjelasan}" tidak ada di narrator-script.csv`);
  }
}
for (const id of dipakai) {
  if (id.includes("${")) {
    const awalan = id.split("${")[0];
    if (!naskah.some((n) => n.startsWith(awalan))) kesalahan.push(`kalimat narator "${id}" tidak punya pasangan di naskah`);
  } else if (!adaDiNaskah.has(id)) {
    kesalahan.push(`kalimat narator "${id}" dipakai di kode tetapi tidak ada di narrator-script.csv`);
  }
}
const folderSuara = join(akar, "content", "sounds");
const fileSuara = new Set(existsSync(folderSuara) ? readdirSync(folderSuara).map((n) => n.replace(/\.[^.]+$/, "")) : []);
const belumAda = naskah.filter((id) => !fileSuara.has(id));
if (belumAda.length) peringatan.push(`${belumAda.length} dari ${naskah.length} kalimat narator belum punya file suara (narator diam untuk kalimat itu)`);

console.log(`Diperiksa: ${berkas.length} berkas, ${dipakai.size} kalimat narator dipakai di kode.`);
for (const p of peringatan) console.log(`PERINGATAN: ${p}`);
if (kesalahan.length) {
  for (const k of kesalahan) console.log(`GAGAL: ${k}`);
  process.exit(1);
}
console.log("Semua aturan lolos.");
