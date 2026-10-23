// Bentuk data yang dipakai frontend dan backend (backend.md, bagian Kode bersama).
import { z } from "zod";

export const namaPermainan = ["jalur", "tirai", "galat", "balok", "tangram", "studio"] as const;
export const NamaPermainan = z.enum(namaPermainan);
export type NamaPermainan = z.infer<typeof NamaPermainan>;

export const Progres = z.object({
  levelTerakhir: z.number().int().min(0).max(999),
  levelTertinggiSelesai: z.number().int().min(-1).max(999),
});
export type Progres = z.infer<typeof Progres>;

export const SemuaProgres = z.partialRecord(NamaPermainan, Progres);
export type SemuaProgres = z.infer<typeof SemuaProgres>;

/** Gambar kecil karya: PNG atau SVG dalam bentuk data URL, paling besar sekitar 200 KB. */
const GambarKecil = z
  .string()
  .max(280_000)
  .regex(/^data:image\/(png|svg\+xml);base64,[A-Za-z0-9+/=]+$/);

export const SimpanKarya = z.object({
  /** Tokoh, warna, latar, dan program karya. Bentuk rincinya ditentukan saat Studio Kreasi dibangun. */
  isi: z.record(z.string(), z.unknown()),
  gambarKecil: GambarKecil.nullable(),
  versi: z.number().int().min(1),
});
export type SimpanKarya = z.infer<typeof SimpanKarya>;

export const IdKarya = z.uuid();

export type RingkasanKarya = { id: string; gambarKecil: string | null; versi: number; dibuat: string; diperbarui: string };
export type Karya = RingkasanKarya & { isi: Record<string, unknown> };
export type HasilSimpanKarya = { id: string; versi: number; disimpanSebagaiBaru: boolean };
