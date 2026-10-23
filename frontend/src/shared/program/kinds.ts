export type JenisBlok = "maju" | "putar-kiri" | "putar-kanan" | "lompat" | "ulangi";

export type Blok = { jenis: Exclude<JenisBlok, "ulangi"> } | { jenis: "ulangi"; kali: 2 | 3 | 4 };

/** Program: deretan slot dari kiri ke kanan. Slot kosong dilewati. */
export type Program = (Blok | null)[];

export type Arah = "kanan" | "bawah" | "kiri" | "atas";

export type Sel = [kolom: number, baris: number];

export type LevelJalur = {
  id: string;
  kolom: number;
  baris: number;
  jalan: Sel[];
  batu: Sel[];
  mulai: { sel: Sel; arah: Arah };
  rumah: Sel;
  slot: number;
  /** Blok yang muncul di bawah layar pada level ini. */
  blok: Blok[];
  /** Satu program yang pasti berhasil, dipakai pemeriksa level. */
  penyelesaian: Blok[];
  /** Kalimat narator untuk level yang mengenalkan cara baru, diputar sekali di awal level. */
  penjelasan?: string;
};

export const kategoriBlok = (jenis: JenisBlok) => (jenis === "ulangi" ? "kontrol" : "gerak");
