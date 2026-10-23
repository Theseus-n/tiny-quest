// Membuat file suara narator dari naskah-narator.csv dengan ElevenLabs.
//   npm run suara -- --daftar-suara
//   npm run suara -- --contoh <voice_id> [--teks "..."] [--keluar <folder>]
//   npm run suara -- --semua <voice_id> [--model <model_id>] [--ulang <id>[,<id>]]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir, tmpdir } from "node:os";

const akar = join(import.meta.dirname, "..", "frontend", "konten");
const berkasNaskah = join(akar, "naskah-narator.csv");
const folderSuara = join(akar, "suara");
const api = "https://api.elevenlabs.io";

const arg = process.argv.slice(2);
const ambil = (nama) => {
  const i = arg.indexOf(nama);
  return i >= 0 ? arg[i + 1] : undefined;
};

function bacaKunci() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  const berkas = join(homedir(), ".elevenlabs-kunci.txt");
  if (existsSync(berkas)) return readFileSync(berkas, "utf8").trim();
  console.log(`GAGAL: kunci API tidak ditemukan. Simpan kuncinya di ${berkas}.`);
  process.exit(1);
}
const kunci = bacaKunci();

async function panggil(jalur, pilihan = {}) {
  const res = await fetch(api + jalur, { ...pilihan, headers: { "xi-api-key": kunci, "content-type": "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${jalur}: ${await res.text()}`);
  return res;
}

// Pengaturan dibuat ekspresif untuk anak 5 tahun. eleven_v3 hanya menerima stabilitas 0, 0.5, atau 1.
function pengaturan(model) {
  if (model === "eleven_v3") return { stability: 0.5, similarity_boost: 0.75 };
  return { stability: 0.35, similarity_boost: 0.75, style: 0.45, use_speaker_boost: true, speed: 0.9 };
}

async function buatSuara(voiceId, model, teks) {
  const res = await panggil(`/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    body: JSON.stringify({ text: teks, model_id: model, voice_settings: pengaturan(model) }),
  });
  return Buffer.from(await res.arrayBuffer());
}

// Kolom teks boleh berisi koma (dalam tanda kutip), jadi id diambil sebelum koma pertama dan status sesudah koma terakhir.
function bacaNaskah() {
  return readFileSync(berkasNaskah, "utf8")
    .trim()
    .split("\n")
    .slice(1)
    .map((b) => {
      b = b.replace(/\r$/, "");
      const a = b.indexOf(",");
      const z = b.lastIndexOf(",");
      const teks = b.slice(a + 1, z).replace(/^"(.*)"$/, "$1").replaceAll('""', '"');
      return { id: b.slice(0, a), teks, status: b.slice(z + 1) };
    });
}

function tulisNaskah(baris) {
  const kutip = (t) => (/[",]/.test(t) ? `"${t.replaceAll('"', '""')}"` : t);
  const isi = ["id,teks,status", ...baris.map((b) => `${b.id},${kutip(b.teks)},${b.status}`)].join("\n");
  writeFileSync(berkasNaskah, isi + "\n");
}

async function utama() {
  if (arg.includes("--daftar-suara")) {
    const { voices } = await (await panggil("/v1/voices")).json();
    console.log("Suara di akunmu:");
    for (const v of voices) console.log(`  ${v.voice_id}  ${v.name}  (${[v.labels?.gender, v.labels?.accent, v.labels?.description].filter(Boolean).join(", ")})`);
    try {
      const { voices: umum } = await (await panggil("/v1/shared-voices?language=id&page_size=20&sort=trending")).json();
      console.log("\nSuara berbahasa Indonesia di Voice Library:");
      for (const v of umum) console.log(`  ${v.voice_id}  ${v.name}  (${[v.gender, v.age, v.descriptive, v.use_case].filter(Boolean).join(", ")})`);
    } catch (e) {
      console.log(`\nVoice Library tidak bisa dibaca: ${e.message}`);
    }
  } else if (ambil("--contoh")) {
    const voiceId = ambil("--contoh");
    const teks = ambil("--teks") ?? "Ayo, klik Si Kancil untuk mulai!";
    const keluar = ambil("--keluar") ?? join(tmpdir(), "contoh-narator");
    mkdirSync(keluar, { recursive: true });
    for (const model of ["eleven_v3", "eleven_multilingual_v2"]) {
      const p = join(keluar, `${voiceId}-${model}.mp3`);
      writeFileSync(p, await buatSuara(voiceId, model, teks));
      console.log(`Tersimpan: ${p}`);
    }
  } else if (ambil("--semua")) {
    const voiceId = ambil("--semua");
    const model = ambil("--model") ?? "eleven_v3";
    const ulang = new Set((ambil("--ulang") ?? "").split(",").filter(Boolean));
    const naskah = bacaNaskah();
    mkdirSync(folderSuara, { recursive: true });
    let dibuat = 0;
    for (const b of naskah) {
      const p = join(folderSuara, `${b.id}.mp3`);
      if (existsSync(p) && !ulang.has(b.id)) continue;
      writeFileSync(p, await buatSuara(voiceId, model, b.teks));
      b.status = "dibuat AI (belum didengarkan)";
      tulisNaskah(naskah);
      dibuat++;
      console.log(`${b.id}: ${b.teks}`);
    }
    console.log(`Selesai: ${dibuat} file suara dibuat, ${naskah.length - dibuat} dilewati karena sudah ada.`);
  } else {
    console.log("Pakai --daftar-suara, --contoh <voice_id>, atau --semua <voice_id>. Lihat komentar di atas berkas ini.");
  }
}

utama().catch((e) => {
  console.log(`GAGAL: ${e.message}`);
  process.exitCode = 1;
});
