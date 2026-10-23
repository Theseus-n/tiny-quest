// Progres disimpan di browser dulu. Kalau backend dinyalakan (VITE_PAKAI_BACKEND=1),
// progres juga dikirim ke backend dan antrean dikirim ulang sampai backend menjawab.

import { useSyncExternalStore } from "react";
import type { HasilSimpanKarya, Karya, NamaPermainan as SemuaNamaPermainan, Progres, RingkasanKarya, SemuaProgres as ProgresDariBackend } from "@platform/skema";

export type { Progres };
/** Permainan yang sudah dibangun. Studio Kreasi menyimpan karya, bukan progres level. */
export type NamaPermainan = Extract<SemuaNamaPermainan, "jalur" | "tirai" | "galat" | "balok" | "tangram">;
export type SemuaProgres = Record<NamaPermainan, Progres>;

const KUNCI = "platform.progres";
const KUNCI_ANTREAN = "platform.antrean";
const PAKAI_BACKEND = import.meta.env.VITE_PAKAI_BACKEND === "1";
const BATAS_PUTUS_MS = 15000;

const kosong = (): Progres => ({ levelTerakhir: 0, levelTertinggiSelesai: -1 });
const awal = (): SemuaProgres => ({ jalur: kosong(), tirai: kosong(), galat: kosong(), balok: kosong(), tangram: kosong() });

function baca<T>(kunci: string, cadangan: T): T {
  try {
    const isi = localStorage.getItem(kunci);
    if (!isi) return cadangan;
    const nilai = JSON.parse(isi);
    // Objek digabung dengan nilai bawaan supaya permainan baru tetap punya progres kosong.
    return Array.isArray(cadangan) ? (Array.isArray(nilai) ? (nilai as T) : cadangan) : { ...cadangan, ...nilai };
  } catch {
    return cadangan;
  }
}

function tulis(kunci: string, nilai: unknown) {
  try {
    localStorage.setItem(kunci, JSON.stringify(nilai));
  } catch {
    // Penyimpanan browser penuh atau dimatikan: progres tetap ada selama halaman terbuka.
  }
}

// Status untuk gambar kabel lepas: "baik" atau "putus".
let status: "baik" | "putus" = "baik";
let gagalSejak: number | null = null;
const pendengar = new Set<() => void>();
function setStatus(s: typeof status) {
  if (s === status) return;
  status = s;
  pendengar.forEach((p) => p());
}
export function useStatusPenyimpanan() {
  return useSyncExternalStore(
    (p) => {
      pendengar.add(p);
      return () => pendengar.delete(p);
    },
    () => status,
  );
}

export async function muatProgres(): Promise<SemuaProgres> {
  const lokal = baca(KUNCI, awal());
  if (!PAKAI_BACKEND) return lokal;
  try {
    const r = await fetch("/api/progres", { signal: AbortSignal.timeout(2000) });
    if (!r.ok) throw new Error(String(r.status));
    const dariBackend = (await r.json()) as ProgresDariBackend;
    const gabung = awal();
    for (const k of Object.keys(gabung) as NamaPermainan[]) {
      const a = lokal[k];
      const b = dariBackend[k] ?? kosong();
      gabung[k] = b.levelTertinggiSelesai > a.levelTertinggiSelesai ? b : a;
    }
    tulis(KUNCI, gabung);
    return gabung;
  } catch {
    return lokal;
  }
}

export function simpanProgres(permainan: NamaPermainan, progres: Progres) {
  const semua = baca(KUNCI, awal());
  semua[permainan] = progres;
  tulis(KUNCI, semua);
  if (!PAKAI_BACKEND) return;
  const antrean = new Set(baca<string[]>(KUNCI_ANTREAN, []));
  antrean.add(permainan);
  tulis(KUNCI_ANTREAN, [...antrean]);
  void kirimAntrean();
}

function catatGagal() {
  gagalSejak ??= Date.now();
  if (Date.now() - gagalSejak > BATAS_PUTUS_MS) setStatus("putus");
}

function catatBerhasil() {
  gagalSejak = null;
  setStatus("baik");
}

async function kirimAntrean() {
  const antrean = baca<string[]>(KUNCI_ANTREAN, []);
  if (antrean.length === 0) return;
  const semua = baca(KUNCI, awal());
  for (const p of antrean as NamaPermainan[]) {
    try {
      const r = await fetch(`/api/progres/${p}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(semua[p]),
        signal: AbortSignal.timeout(2000),
      });
      if (!r.ok) throw new Error(String(r.status));
      tulis(KUNCI_ANTREAN, baca<string[]>(KUNCI_ANTREAN, []).filter((x) => x !== p));
      catatBerhasil();
    } catch {
      catatGagal();
      return;
    }
  }
}

/** Memeriksa backend berkala. Gambar kabel lepas muncul kalau backend lama tidak menjawab. */
async function periksaBackend() {
  try {
    const r = await fetch("/api/kesehatan", { signal: AbortSignal.timeout(2000) });
    if (!r.ok) throw new Error(String(r.status));
    catatBerhasil();
    await kirimAntrean();
    await kirimAntreanKarya();
  } catch {
    catatGagal();
  }
}

if (PAKAI_BACKEND && typeof window !== "undefined") {
  window.setInterval(() => void periksaBackend(), 5000);
}

// Karya Studio Kreasi: disimpan ke browser dulu, lalu ke backend lewat antrean yang dikirim ulang sampai berhasil,
// sama seperti progres (backend.md, bagian "Simpan dua kali").

const KUNCI_KARYA = "platform.karya";
const KUNCI_ANTREAN_KARYA = "platform.antrean-karya";

export type KaryaLokal = { id: string; isi: Record<string, unknown>; gambarKecil: string | null; versi: number; diperbarui: string };

/** Karya di browser ini, yang terakhir diubah lebih dulu. */
export function daftarKarya(): KaryaLokal[] {
  return Object.values(baca<Record<string, KaryaLokal>>(KUNCI_KARYA, {})).sort((a, b) => b.diperbarui.localeCompare(a.diperbarui));
}

/** Menyimpan karya: versi naik satu, tersimpan di browser, lalu dikirim ke backend. */
export function simpanKarya(id: string, isi: Record<string, unknown>, gambarKecil: string | null) {
  const semua = baca<Record<string, KaryaLokal>>(KUNCI_KARYA, {});
  semua[id] = { id, isi, gambarKecil, versi: (semua[id]?.versi ?? 0) + 1, diperbarui: new Date().toISOString() };
  tulis(KUNCI_KARYA, semua);
  if (!PAKAI_BACKEND) return;
  tulis(KUNCI_ANTREAN_KARYA, [...new Set([...baca<string[]>(KUNCI_ANTREAN_KARYA, []), id])]);
  void kirimAntreanKarya();
}

async function kirimAntreanKarya() {
  for (const id of baca<string[]>(KUNCI_ANTREAN_KARYA, [])) {
    const k = baca<Record<string, KaryaLokal>>(KUNCI_KARYA, {})[id];
    try {
      if (k) {
        const r = await fetch(`/api/karya/${id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ isi: k.isi, gambarKecil: k.gambarKecil, versi: k.versi }),
          signal: AbortSignal.timeout(2000),
        });
        if (!r.ok) throw new Error(String(r.status));
        (await r.json()) as HasilSimpanKarya;
      }
      tulis(KUNCI_ANTREAN_KARYA, baca<string[]>(KUNCI_ANTREAN_KARYA, []).filter((x) => x !== id));
      catatBerhasil();
    } catch {
      catatGagal();
      return;
    }
  }
}

/**
 * Menyamakan karya di browser dengan backend, misalnya setelah pindah laptop:
 * karya di backend yang lebih baru atau belum ada di browser diambil lengkap.
 */
export async function muatKarya(): Promise<KaryaLokal[]> {
  if (!PAKAI_BACKEND) return daftarKarya();
  try {
    const r = await fetch("/api/karya", { signal: AbortSignal.timeout(2000) });
    if (!r.ok) throw new Error(String(r.status));
    const lokal = baca<Record<string, KaryaLokal>>(KUNCI_KARYA, {});
    for (const ringkas of (await r.json()) as RingkasanKarya[]) {
      if (lokal[ringkas.id] && lokal[ringkas.id].versi >= ringkas.versi) continue;
      const lengkap = (await (await fetch(`/api/karya/${ringkas.id}`, { signal: AbortSignal.timeout(2000) })).json()) as Karya;
      lokal[ringkas.id] = { id: lengkap.id, isi: lengkap.isi, gambarKecil: lengkap.gambarKecil, versi: lengkap.versi, diperbarui: lengkap.diperbarui };
    }
    tulis(KUNCI_KARYA, lokal);
  } catch {
    // Backend tidak menjawab: karya di browser tetap bisa dibuka.
  }
  return daftarKarya();
}
