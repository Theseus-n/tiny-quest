// Satu-satunya tempat bunyi diputar. Bunyi efek disintesis langsung dengan Web Audio,
// jadi tidak ada file yang perlu dimuat dan bunyinya terdengar seketika.

import { durasi } from "../../design/token";

let ctx: AudioContext | null = null;

function konteks(): AudioContext {
  if (!ctx) ctx = new AudioContext({ latencyHint: "interactive" });
  return ctx;
}

/**
 * Membuat konteks suara lebih awal. Membuka perangkat audio memblokir halaman beberapa ratus milidetik,
 * jadi dilakukan saat layar pembuka menganggur, bukan saat klik pertama. Konteks baru berbunyi setelah bukaSuara().
 */
export function siapkanSuara() {
  try {
    konteks();
  } catch {
    // Browser tanpa Web Audio: bunyi dilewati, platform tetap jalan.
  }
}

/** Dipanggil dari klik pertama di layar pembuka, karena browser menahan suara sebelum ada klik. */
export async function bukaSuara() {
  const c = konteks();
  if (c.state !== "running") await c.resume();
}

function nada(frekuensi: number, mulai: number, lama: number, akhir = frekuensi, jenis: OscillatorType = "triangle", keras = 0.25) {
  const c = konteks();
  const t = c.currentTime + mulai;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = jenis;
  osc.frequency.setValueAtTime(frekuensi, t);
  osc.frequency.exponentialRampToValueAtTime(akhir, t + lama);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(keras, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + lama);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + lama + 0.02);
}

export type BunyiEfek = "klik" | "benar" | "cobaLagi";

/** Tiga bunyi efek yang sama di semua permainan. */
export function bunyi(nama: BunyiEfek) {
  if (!ctx || ctx.state !== "running") return;
  if (nama === "klik") nada(1100, 0, 0.05, 900, "square", 0.12);
  if (nama === "benar") {
    nada(660, 0, 0.12);
    nada(990, 0.1, 0.22);
  }
  if (nama === "cobaLagi") {
    nada(420, 0, 0.18, 320, "sine", 0.3);
    nada(320, 0.17, 0.28, 220, "sine", 0.3);
  }
}

// Narator: memutar file suara yang sudah didengarkan, berdasarkan nomor kalimat.
// Suara ditanam di bundel sebagai data URL, bukan diminta sebagai file .mp3, karena pengelola unduhan
// seperti Internet Download Manager menangkap setiap permintaan file audio dan memunculkan jendela unduhan.
const berkasSuara = import.meta.glob("../../../content/sounds/*.{m4a,mp3,ogg,wav}", {
  eager: true,
  query: "?inline",
  import: "default",
}) as Record<string, string>;

const urlNarator = new Map<string, string>();
for (const [jalur, url] of Object.entries(berkasSuara)) {
  const id = jalur.split("/").pop()!.replace(/\.[^.]+$/, "");
  urlNarator.set(id, url);
}

const cacheNarator = new Map<string, Promise<AudioBuffer | null>>();
const sudahDiperingatkan = new Set<string>();

function muatNarator(id: string): Promise<AudioBuffer | null> {
  if (!cacheNarator.has(id)) {
    const url = urlNarator.get(id);
    const janji = url
      ? fetch(url)
          .then((r) => r.arrayBuffer())
          .then((b) => konteks().decodeAudioData(b))
          .catch(() => null)
      : Promise.resolve(null);
    cacheNarator.set(id, janji);
  }
  return cacheNarator.get(id)!;
}

export function narasiTersedia(id: string) {
  return urlNarator.has(id);
}

// Antrean narator: kalimat diputar satu per satu dan tidak pernah memotong kalimat lain.
type Kalimat = { id: string; selesai: (diputar: boolean) => void };
const antrean: Kalimat[] = [];
let kalimatAktif: Kalimat | null = null;
let sibuk = false;
let sedangBicara: AudioBufferSourceNode | null = null;
let jedaAntrean: ReturnType<typeof setTimeout> | undefined;
const pendengar = new Set<(id: string | null) => void>();

/** Si Kancil mendengarkan narator supaya gelembung bicaranya muncul bersama suaranya. */
export function dengarNarator(f: (id: string | null) => void) {
  pendengar.add(f);
  return () => {
    pendengar.delete(f);
  };
}
const umumkan = (id: string | null) => pendengar.forEach((f) => f(id));

export function naratorSibuk() {
  return sibuk;
}

/**
 * Kalimat masuk antrean dan diputar setelah kalimat sebelumnya selesai.
 * Selesai dengan `true` setelah kalimat diputar, atau `false` kalau dibatalkan oleh `diam()`.
 * Kalimat yang sama tidak masuk antrean dua kali, supaya klik berulang tidak jadi rentetan suara.
 */
export function bicara(id: string): Promise<boolean> {
  if (kalimatAktif?.id === id || antrean.some((k) => k.id === id)) return Promise.resolve(false);
  return new Promise((selesai) => {
    antrean.push({ id, selesai });
    if (!sibuk) {
      sibuk = true;
      void putarBerikut();
    }
  });
}

async function putarBerikut() {
  const k = antrean.shift();
  if (!k) {
    sibuk = false;
    return;
  }
  kalimatAktif = k;
  umumkan(k.id);
  const bisaBersuara = ctx?.state === "running";
  const buffer = bisaBersuara ? await muatNarator(k.id) : null;
  if (kalimatAktif !== k) return; // diam() dipanggil selama file dimuat
  if (bisaBersuara && !buffer && !sudahDiperingatkan.has(k.id)) {
    sudahDiperingatkan.add(k.id);
    console.warn(`Narator: file suara untuk "${k.id}" belum ada, kalimat ini dilewati.`);
  }
  const akhiri = () => {
    if (kalimatAktif !== k) return;
    kalimatAktif = null;
    sedangBicara = null;
    umumkan(null);
    k.selesai(true);
    jedaAntrean = setTimeout(putarBerikut, durasi.jedaKalimat);
  };
  if (!buffer) {
    // Tanpa suara (file belum ada atau suara tertahan), gelembung Si Kancil tetap tampil sebentar.
    jedaAntrean = setTimeout(akhiri, durasi.kalimatTanpaSuara);
    return;
  }
  const sumber = konteks().createBufferSource();
  sumber.buffer = buffer;
  sumber.connect(konteks().destination);
  sumber.onended = akhiri;
  sumber.start();
  sedangBicara = sumber;
}

/** Menghentikan kalimat yang sedang diputar dan mengosongkan antrean, misalnya saat anak keluar dari permainan. */
export function diam() {
  clearTimeout(jedaAntrean);
  const sumber = sedangBicara;
  const aktif = kalimatAktif;
  sedangBicara = null;
  kalimatAktif = null;
  sibuk = false;
  try {
    sumber?.stop();
  } catch {
    // sudah berhenti
  }
  aktif?.selesai(false);
  antrean.splice(0).forEach((k) => k.selesai(false));
  umumkan(null);
}
