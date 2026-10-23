import type { LevelJalur } from "./shared/program/kinds";
import type { LevelTirai } from "./games/curtain/logic";
import type { LevelGalat } from "./games/bugs/logic";
import type { LevelBalok } from "./games/blocks/logic";
import type { LevelTangram } from "./games/tangram/logic";

const urut = <T,>(berkas: Record<string, T>) =>
  Object.keys(berkas)
    .sort()
    .map((k) => berkas[k]);

export const levelJalur = urut(
  import.meta.glob<LevelJalur>("../content/levels/jalur/*.json", { eager: true, import: "default" }),
);

export const levelTirai = urut(
  import.meta.glob<LevelTirai>("../content/levels/tirai/*.json", { eager: true, import: "default" }),
);

export const levelGalat = urut(
  import.meta.glob<LevelGalat>("../content/levels/galat/*.json", { eager: true, import: "default" }),
);

export const levelBalok = urut(
  import.meta.glob<LevelBalok>("../content/levels/balok/*.json", { eager: true, import: "default" }),
);

export const levelTangram = urut(
  import.meta.glob<LevelTangram>("../content/levels/tangram/*.json", { eager: true, import: "default" }),
);
