import { useEffect, useState } from "react";
import { Panggung } from "./shared/stage/Stage";
import { PenyediaPemandu } from "./shared/guide/Guide";
import { diam } from "./shared/sound/audio";
import { Kancil } from "./images/Kancil";
import { DefinisiLembut } from "./images/Soft";
import { LayarPembuka } from "./intro/SplashScreen";
import { LayarAwal } from "./intro/HomeScreen";
import { LatarTaman } from "./intro/ParkBackground";
import { PenjelajahJalur } from "./games/path/PathExplorer";
import { TiraiDaun } from "./games/curtain/LeafCurtain";
import { DetektifGalat } from "./games/bugs/BugDetective";
import { BalokBilangan } from "./games/blocks/NumberBlocks";
import { MatriksTangram } from "./games/tangram/TangramMatrix";
import { StudioKreasi } from "./games/studio/CreativeStudio";
import { muatProgres, type NamaPermainan, type SemuaProgres } from "./storage/storage";

type Layar = "pembuka" | "awal" | NamaPermainan | "studio";

/** Selama progres dimuat: Si Kancil berjalan di tempat, hanya selama memuat. */
function Memuat() {
  return (
    <div data-testid="memuat" style={{ position: "absolute", left: 580, top: 290 }}>
      <div style={{ animation: "jalan-di-tempat 500ms ease-in-out infinite alternate" }}>
        <Kancil lebar={120} />
      </div>
      <style>{"@keyframes jalan-di-tempat { from { transform: translateY(0) } to { transform: translateY(-10px) } }"}</style>
    </div>
  );
}

export function App() {
  const [layar, setLayar] = useState<Layar>("pembuka");
  const [progres, setProgres] = useState<SemuaProgres | null>(null);

  useEffect(() => {
    muatProgres().then(setProgres);
  }, []);

  // Kalau browser keluar dari layar penuh (misalnya Esc), kembali ke layar pembuka.
  useEffect(() => {
    const berubah = () => {
      if (!document.fullscreenElement) {
        diam();
        setLayar("pembuka");
      }
    };
    document.addEventListener("fullscreenchange", berubah);
    return () => document.removeEventListener("fullscreenchange", berubah);
  }, []);

  const kembali = () => {
    diam();
    setLayar("awal");
  };

  return (
    <Panggung>
      <DefinisiLembut />
      <PenyediaPemandu>
        {/* Satu taman 3D untuk layar pembuka dan layar awal, supaya kanvas tidak dibuat ulang saat berpindah. */}
        {(layar === "pembuka" || layar === "awal") && <LatarTaman />}
        {layar === "pembuka" && <LayarPembuka onMulai={() => setLayar("awal")} />}
        {layar !== "pembuka" && !progres && <Memuat />}
        {layar === "awal" && progres && <LayarAwal onPilih={setLayar} />}
        {layar === "jalur" && progres && (
          <PenjelajahJalur progres={progres.jalur} onKembali={kembali} onProgres={(p) => setProgres({ ...progres, jalur: p })} />
        )}
        {layar === "tirai" && progres && (
          <TiraiDaun progres={progres.tirai} onKembali={kembali} onProgres={(p) => setProgres({ ...progres, tirai: p })} />
        )}
        {layar === "galat" && progres && (
          <DetektifGalat progres={progres.galat} onKembali={kembali} onProgres={(p) => setProgres({ ...progres, galat: p })} />
        )}
        {layar === "balok" && progres && (
          <BalokBilangan progres={progres.balok} onKembali={kembali} onProgres={(p) => setProgres({ ...progres, balok: p })} />
        )}
        {layar === "tangram" && progres && (
          <MatriksTangram progres={progres.tangram} onKembali={kembali} onProgres={(p) => setProgres({ ...progres, tangram: p })} />
        )}
        {layar === "studio" && progres && <StudioKreasi onKembali={kembali} />}
      </PenyediaPemandu>
    </Panggung>
  );
}
