import type { LevelJalur } from "./bersama/program/jenis";
import type { LevelTirai } from "./permainan/tirai/logika";
import type { LevelGalat } from "./permainan/galat/logika";
import type { LevelBalok } from "./permainan/balok/logika";
import type { LevelTangram } from "./permainan/tangram/logika";

const urut = <T,>(berkas: Record<string, T>) =>
  Object.keys(berkas)
    .sort()
    .map((k) => berkas[k]);

export const levelJalur = urut(
  import.meta.glob<LevelJalur>("../konten/level/jalur/*.json", { eager: true, import: "default" }),
);

export const levelTirai = urut(
  import.meta.glob<LevelTirai>("../konten/level/tirai/*.json", { eager: true, import: "default" }),
);

export const levelGalat = urut(
  import.meta.glob<LevelGalat>("../konten/level/galat/*.json", { eager: true, import: "default" }),
);

export const levelBalok = urut(
  import.meta.glob<LevelBalok>("../konten/level/balok/*.json", { eager: true, import: "default" }),
);

export const levelTangram = urut(
  import.meta.glob<LevelTangram>("../konten/level/tangram/*.json", { eager: true, import: "default" }),
);
